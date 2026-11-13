/**
 * Timeframe arithmetic: which PERIOD a timestamp belongs to, and how to build
 * higher-timeframe candles out of lower-timeframe ones.
 *
 * ── Why this is not in stdlib/ ──────────────────────────────────────────────
 *
 * Everything under runtime/v1/stdlib/ is scanned by
 * scripts/common/generate-metadata.ts and every exported name there becomes a
 * Pine BUILT-IN. `periodIndex` is not a Pine name and must not become one, so
 * it lives one level up, where the generator does not look. `stdlib/chart.ts`
 * and `context.ts` both import it.
 *
 * ── The specification format ────────────────────────────────────────────────
 *
 * From the manual: a timeframe string is a count and a unit — "S" seconds, no
 * suffix minutes, "D" days, "W" weeks, "M" months — so "1", "60", "240", "D",
 * "3D", "W", "12M" are all valid, and a bare unit means one of it.
 */

const seconds = new Map<string, number>();

/** Seconds in one period of `spec`, or NaN. "The typical number of seconds". */
export function specSeconds(spec: string): number {
  let n = seconds.get(spec);
  if (n === undefined) {
    n = secondsOf(spec);
    if (seconds.size > 1000) seconds.clear();
    seconds.set(spec, n);
  }
  return n;
}

/**
 * One spelling for each timeframe: "1D" is "D", "1W" is "W", "d" is "D". A
 * minute count keeps its number ("1", "60"), and what is not a timeframe is
 * returned as it came.
 */
export function canonicalTimeframe(spec: string): string {
  const s = String(spec).trim().toUpperCase();
  const match = /^(\d*)([SDWM]?)$/.exec(s);
  if (!match || s === "") return String(spec);
  return match[2] !== "" && (match[1] === "" || Number(match[1]) === 1) ? match[2] : s;
}

function secondsOf(spec: string): number {
  const s = String(spec).trim().toUpperCase();
  if (s === "") return NaN;

  const match = /^(\d*)([SDWM]?)$/.exec(s);
  if (!match) return NaN;
  const count = match[1] === "" ? 1 : Number(match[1]);
  if (!Number.isFinite(count) || count <= 0) return NaN;

  // NOMINAL lengths — `timeframe.in_seconds` is documented as "the typical
  // number of seconds". A month is TradingView's 2628003 seconds (365.25 / 12
  // days, rounded up), not 30 days: its log gives in_seconds("1M") = 2628003
  // and in_seconds("12M") = 31536036
  // (conformance/v6/golden/harness_v6_language.BTCUSDT.1.log).
  const UNIT: Record<string, number> = { S: 1, "": 60, D: 86400, W: 604800, M: 2628003 };
  return count * UNIT[match[2]];
}

/**
 * The end of the bar's timeframe, given its opening time.
 *
 * Here rather than in stdlib/time.ts, which uses it, because
 * stdlib/mtf.ts needs it too and every export under stdlib/ is a Pine
 * built-in.
 *
 * Pine reports a bar's CLOSING time as the instant the next bar of the same
 * timeframe opens, so this is calendar arithmetic rather than a fixed offset:
 * a month is not 30 days and a week is not always 7 × 24 h across a DST
 * boundary. Days/weeks/months are advanced on the UTC calendar for the same
 * reason every other accessor in this file reads UTC — see the header.
 *
 * Resolution strings follow TradingView's spelling: "1"/"5"/"60" are minutes,
 * "30S" is seconds, and "D"/"W"/"M" carry an optional multiplier ("2W").
 */
export function periodEnd(openTime: number, resolution: string): number {
    const parsed = parseSpec(String(resolution ?? ""));
    if (!parsed) return NaN;
    const { count, unit } = parsed;

    // Intraday: a plain number is MINUTES, "S" is seconds. Both are fixed spans.
    if (unit === "") return openTime + count * 60_000;
    if (unit === "S") return openTime + count * 1_000;

    const d = new Date(openTime);
    if (unit === "D") d.setUTCDate(d.getUTCDate() + count);
    else if (unit === "W") d.setUTCDate(d.getUTCDate() + count * 7);
    else d.setUTCMonth(d.getUTCMonth() + count);
    return d.getTime();
}

type Spec = { count: number; unit: string };
const specs = new Map<string, Spec | null>();

/**
 * The count and unit of a spec, or null if it is not one. Read once per
 * spelling: a script that asks for a higher timeframe works one out for every
 * bar it folds.
 */
function parseSpec(spec: string): Spec | null {
  let parsed = specs.get(spec);
  if (parsed !== undefined) return parsed;
  const s = String(spec).trim().toUpperCase();
  const match = /^(\d*)([SDWM]?)$/.exec(s);
  const count = match ? (match[1] === "" ? 1 : Number(match[1])) : NaN;
  parsed = match && Number.isFinite(count) && count > 0 ? { count, unit: match[2] } : null;
  if (specs.size > 1000) specs.clear();
  specs.set(spec, parsed);
  return parsed;
}

/** Whole months from 1970-01 — the grouping key for a monthly timeframe. */
const monthsSinceEpoch = (t: number): number => {
  const d = new Date(t);
  return d.getUTCFullYear() * 12 + d.getUTCMonth();
};

/** Whole weeks from the Monday on or before 1970-01-01. */
const weeksSinceEpoch = (t: number): number => {
  // 1970-01-01 was a THURSDAY, so `floor(t / 604800000)` groups Thursday to
  // Wednesday. A Pine weekly bar starts on Monday, which is three days earlier;
  // shifting the origin back by those three days is the whole correction.
  const MONDAY_OFFSET = 3 * 86400000;
  return Math.floor((t + MONDAY_OFFSET) / 604800000);
};

/**
 * Which period of `spec` the instant `t` falls in.
 *
 * Two bars share a period index exactly when they belong to the same bar of
 * that timeframe. That is all a caller needs, so the origin does not matter as
 * long as it is stable — except for weeks and months, where it decides which
 * DAY a bar starts on and is therefore visible.
 *
 * Seconds, minutes and days divide the epoch evenly and are grouped modularly.
 * Weeks are grouped from a Monday. Months are grouped by the CALENDAR, because
 * they are not a fixed length: "1M" is 28 to 31 days, and a nominal 30-day
 * window drifts a whole month out of step inside two years.
 *
 * Returns NaN for a spec that is not a timeframe, which no bar can match.
 */
export function periodIndex(t: number, spec: string): number {
  const parsed = parseSpec(spec);
  if (!parsed || !Number.isFinite(t)) return NaN;
  const { count, unit } = parsed;

  if (unit === "M") return Math.floor(monthsSinceEpoch(t) / count);
  if (unit === "W") return Math.floor(weeksSinceEpoch(t) / count);

  const span = specSeconds(spec);
  return Number.isFinite(span) ? Math.floor(t / (span * 1000)) : NaN;
}

/** One OHLCV bar — the same shape `SecurityCandle` has in context.ts. */
export interface Candle {
  time: number; open: number; high: number; low: number; close: number; volume: number;
  /** Set on a DERIVED candle whose last chart bar is known: when it ends. See `DerivedSeries`. */
  closeTime?: number;
}

/**
 * Fold consecutive bars into the bars of a HIGHER timeframe.
 *
 * A higher-timeframe bar IS the aggregate of the lower-timeframe bars inside
 * it: it opens where the first one opened, closes where the last one closed,
 * spans their extremes, and carries their total volume. Nothing here is an
 * approximation — this is the relationship between the two series.
 *
 * `bars` must be in ascending time order and must contain ONLY bars the script
 * has already seen. Aggregating the whole dataset would hand a script the
 * future: the last group would close before its final bar had arrived.
 */
export function aggregate(bars: readonly Candle[], spec: string): Candle[] {
  const out: Candle[] = [];
  let period: number | null = null;

  for (const bar of bars) {
    const at = periodIndex(bar.time, spec);
    if (!Number.isFinite(at)) return [];

    if (period !== at) {
      out.push({ ...bar });
      period = at;
      continue;
    }
    const open = out[out.length - 1];
    open.high = Math.max(open.high, bar.high);
    open.low = Math.min(open.low, bar.low);
    open.close = bar.close;
    open.volume += bar.volume;
  }
  return out;
}

/**
 * A higher-timeframe series that grows one chart bar at a time, giving what
 * `aggregate` gives over the same bars without folding them all again.
 *
 * Only the LAST chart bar can change between two calls (a live re-tick
 * overwrites it), so the fold is undone for that bar and redone from it:
 * `before` is the last candle as it stood before that bar was folded in, or
 * null when that bar opened the candle.
 */
export class DerivedSeries {
  readonly candles: Candle[] = [];
  /** How many chart bars are folded in. */
  upto = 0;
  private before: Candle | null = null;
  private valid = true;
  /** The bar before the last one folded: if it is not there now, `bars` is another run's. */
  private anchor: Candle | undefined;

  // Session state, for an intraday spec when the chart's own interval is known.
  /** Where the current session began, once a gap has shown there is one; null until then. */
  private session: number | null = null;
  private prevT: number | undefined;
  private curKey = "";
  /** The three of them as they stood before the last bar was folded, to undo it. */
  private saved: { session: number | null; prevT: number | undefined; curKey: string } = { session: null, prevT: undefined, curKey: "" };
  private readonly spanMs: number;
  private readonly intraday: boolean;

  /**
   * `chartMs` is the chart's own bar length. With it, an intraday spec (minutes,
   * hours) is anchored at the first bar of each SESSION, which the engine
   * infers: a gap between consecutive chart bars longer than both one chart
   * interval and the requested span starts a new one. A stock's hourly bars then
   * open at 09:30, 10:30, ... as TradingView's do
   * (conformance/v5/parity/harness_security_session.AAPL.5.csv), where clock
   * buckets would open at 09:00. A 24/7 series has no such gap, so its buckets
   * stay on the clock; so does the first session of the series, whose start is
   * not known. Days, weeks and months are calendar buckets either way.
   */
  constructor(private readonly spec: string, private readonly chartMs?: number) {
    const p = parseSpec(spec);
    this.intraday = !!p && (p.unit === "" || p.unit === "S") && chartMs !== undefined && chartMs > 0;
    this.spanMs = this.intraday ? specSeconds(spec) * 1000 : 0;
  }

  /** The bucket of a bar at `t`; moves the session state on. */
  private keyOf(t: number): string {
    if (!this.intraday) { this.prevT = t; return String(periodIndex(t, this.spec)); }
    if (this.prevT !== undefined && t - this.prevT > Math.max(this.chartMs!, this.spanMs)) this.session = t;
    this.prevT = t;
    return this.session === null ? `c${Math.floor(t / this.spanMs)}` : `s${this.session}:${Math.floor((t - this.session) / this.spanMs)}`;
  }

  /** The bucket a bar at `t` WOULD be in, leaving the state alone. */
  private peekKey(t: number): string {
    const at = this.session, p = this.prevT;
    const key = this.keyOf(t);
    this.session = at; this.prevT = p;
    return key;
  }

  /**
   * Folds `bars[0 .. seen)`, of which those before `upto - 1` are as they were.
   *
   * `nextTime` is the open of the chart bar after the last one folded, when the
   * caller knows it (a history run: the dataset is in hand). The last candle is
   * then complete if that bar falls in another bucket (or after a session gap),
   * and ends with its own last bar, which `closeTime` records: 15:55 + 5 minutes
   * for a session's last hourly or daily bar, instead of a clock end that comes
   * later. Where it is not known (the live bar), `closeTime` stays unset and the
   * calendar end applies.
   */
  extend(bars: readonly Candle[], seen: number, nextTime?: number): void {
    if (this.upto >= 2 && bars[this.upto - 2] !== this.anchor) {
      this.candles.length = 0; this.upto = 0; this.before = null; this.valid = true;
      this.session = null; this.prevT = undefined; this.curKey = "";
    }
    if (!this.valid) return;
    let i = this.upto;
    if (i > 0) {
      i--;   // the last bar may have been re-ticked: undo it, fold it again
      if (this.before === null) this.candles.pop();
      else this.candles[this.candles.length - 1] = this.before;
      this.session = this.saved.session; this.prevT = this.saved.prevT; this.curKey = this.saved.curKey;
    }
    for (; i < seen; i++) {
      const bar = bars[i];
      this.saved = { session: this.session, prevT: this.prevT, curKey: this.curKey };
      const key = this.keyOf(bar.time);
      if (!Number.isFinite(this.intraday ? 0 : periodIndex(bar.time, this.spec))) { this.candles.length = 0; this.valid = false; this.upto = seen; this.anchor = undefined; return; }
      if (this.curKey !== key || this.candles.length === 0) {
        this.candles.push({ ...bar });
        this.before = null;
        this.curKey = key;
        continue;
      }
      const last = this.candles[this.candles.length - 1];
      this.before = { ...last };
      last.high = Math.max(last.high, bar.high);
      last.low = Math.min(last.low, bar.low);
      last.close = bar.close;
      last.volume += bar.volume;
    }
    this.upto = seen;
    this.anchor = seen >= 2 ? bars[seen - 2] : undefined;
    // Complete? Only if the bar after the last one is known to open elsewhere.
    const last = this.candles[this.candles.length - 1];
    if (last && this.chartMs !== undefined && seen > 0) {
      const lastBar = bars[seen - 1];
      if (nextTime !== undefined && this.peekKey(nextTime) !== this.curKey) last.closeTime = lastBar.time + this.chartMs;
      else delete last.closeTime;
    }
  }
}
