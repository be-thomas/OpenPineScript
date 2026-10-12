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

/** Seconds in one period of `spec`, or NaN. "The typical number of seconds". */
export function specSeconds(spec: string): number {
  const s = String(spec).trim().toUpperCase();
  if (s === "") return NaN;

  const match = /^(\d*)([SDWM]?)$/.exec(s);
  if (!match) return NaN;
  const count = match[1] === "" ? 1 : Number(match[1]);
  if (!Number.isFinite(count) || count <= 0) return NaN;

  // A month is 30 days and a year is not a unit here, so these are NOMINAL
  // lengths. `timeframe.in_seconds` is documented in exactly those terms.
  const UNIT: Record<string, number> = { S: 1, "": 60, D: 86400, W: 604800, M: 2592000 };
  return count * UNIT[match[2]];
}

/** The count and unit of a spec, or null if it is not one. */
function parseSpec(spec: string): { count: number; unit: string } | null {
  const s = String(spec).trim().toUpperCase();
  const match = /^(\d*)([SDWM]?)$/.exec(s);
  if (!match) return null;
  const count = match[1] === "" ? 1 : Number(match[1]);
  if (!Number.isFinite(count) || count <= 0) return null;
  return { count, unit: match[2] };
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

  const seconds = specSeconds(spec);
  return Number.isFinite(seconds) ? Math.floor(t / (seconds * 1000)) : NaN;
}

/** One OHLCV bar — the same shape `SecurityCandle` has in context.ts. */
export interface Candle {
  time: number; open: number; high: number; low: number; close: number; volume: number;
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
