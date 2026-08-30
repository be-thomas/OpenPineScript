/**
 * Chart metadata — the v1–v3 spellings.
 *
 * These are the identifiers a pre-v4 script uses to ask what it is running on.
 * v4 moved them into namespaces (`timeframe.period`, `syminfo.tickerid`), which
 * is why they are unprefixed globals here and not under one.
 *
 * All read from Context, so a host that runs 5-minute bars gets "5" rather than
 * a hard-coded guess. Scripts branch on these to pick pivot windows and session
 * boundaries, so getting them wrong changes the numbers, not just a label.
 */
import { Context } from "../context";
import { val } from "../../../utils/v2/common";
import { periodIndex, specSeconds as seconds } from "../timeframes";

/**
 * The chart's timeframe as a string: "1", "5", "60", "D", "W", "M".
 * v4 renamed this to `timeframe.period`.
 * @getter
 * @returns {string} The resolution string.
 */
export function period(ctx: Context): string {
  return ctx.resolution;
}

/**
 * The chart's timeframe as a NUMBER of minutes, or 0 for non-intraday.
 * Pine reports "D"/"W"/"M" as 0 here, which is why `period` exists alongside it.
 * @getter
 * @returns {integer} Minutes per bar, 0 for daily and above.
 */
export function interval(ctx: Context): number {
  const r = String(ctx.resolution);
  const n = parseInt(r, 10);
  return Number.isFinite(n) && String(n) === r.trim() ? n : 0;
}

/**
 * Is the chart's timeframe intraday (minutes/seconds rather than days or more)?
 * @getter
 * @returns {bool}
 */
export function isintraday(ctx: Context): boolean {
  return interval(ctx) > 0;
}

/**
 * Is the chart's timeframe daily?
 * @getter
 * @returns {bool}
 */
export function isdaily(ctx: Context): boolean {
  return String(ctx.resolution).toUpperCase() === "D";
}

/**
 * Is the chart's timeframe weekly?
 * @getter
 * @returns {bool}
 */
export function isweekly(ctx: Context): boolean {
  return String(ctx.resolution).toUpperCase() === "W";
}

/**
 * Is the chart's timeframe monthly?
 * @getter
 * @returns {bool}
 */
export function ismonthly(ctx: Context): boolean {
  return String(ctx.resolution).toUpperCase() === "M";
}

/**
 * The chart's symbol WITHOUT its exchange prefix — "BTCUSD", not
 * "BITSTAMP:BTCUSD". v4 renamed this to `syminfo.ticker`.
 *
 * Published strategies branch on it to pick per-symbol constants, so it changes
 * results rather than just labelling them.
 * @getter
 * @returns {string}
 */
export function ticker(ctx: Context): string {
  const s = String(ctx.symbol);
  const colon = s.indexOf(":");
  return colon === -1 ? s : s.slice(colon + 1);
}

// ─── `timeframe.*` — the members with no v1–v4 flat spelling ───────────────
//
// The five that DO have one — period, isintraday, isdaily, isweekly, ismonthly
// — are the flat functions above, which the v4 rename table moves into this
// namespace. The four below never had another name, so they are written here
// as an object literal and gated by V5_ONLY_NAMES.
//
// Every one of them needs the same thing first: a timeframe STRING understood
// as a duration. Pine's format, from the timeframe specification:
//
//     "5S"   seconds     "5"    minutes     "5D"  days
//     "5W"   weeks       "5M"   months      ""    the chart's own
//
// A bare number is minutes, which is the one rule that cannot be guessed from
// the string alone.

/** The typical number of seconds in one bar of `spec`, or NaN. */
// The parsing itself lives in ../timeframes.ts, one level up, so that
// `request.security` can share it: everything in this directory is scanned by
// the metadata generator and every exported name here becomes a Pine built-in,
// which `periodIndex` must not.
const specSeconds = seconds;

export const timeframe = {
  /**
   * `timeframe.in_seconds(timeframe)` — May 2024.
   *
   * "The typical number of seconds in the chart's timeframe."
   *
   * The argument defaults to the chart's own timeframe, which is how nearly
   * every published use spells it: `timeframe.in_seconds()` compared against
   * `timeframe.in_seconds(higherTimeframe)` is the standard guard against
   * requesting data finer than the chart.
   *
   * @getter
   * @returns {simple int} Seconds per bar.
   */
  in_seconds: (ctx: Context, timeframe?: any): number => {
    const spec = timeframe === undefined || timeframe === null ? "" : String(val(timeframe));
    return specSeconds(spec === "" ? String(ctx.resolution) : spec);
  },

  /**
   * `timeframe.from_seconds(seconds)` — September 2023.
   *
   * "Converts a specified number of `seconds` into a valid timeframe string
   *  based on our timeframe specification format."
   *
   * The inverse of `in_seconds`, and not a total one: 90 seconds is not a whole
   * number of minutes, so the largest unit that divides evenly is chosen and
   * the remainder stays in the smaller one. Under a minute the answer is
   * seconds; a value that is not a positive number has no timeframe and gives
   * `na` rather than a plausible "1".
   */
  from_seconds: (seconds: any): string => {
    const total = Math.trunc(Number(val(seconds)));
    if (!Number.isFinite(total) || total <= 0) return String(NaN);

    // Largest unit that divides evenly, biggest first — so 604800 is "1W" and
    // not "10080", which is the same duration spelled less usefully.
    const UNITS: Array<[number, string]> = [
      [2592000, "M"], [604800, "W"], [86400, "D"], [60, ""],
    ];
    for (const [size, suffix] of UNITS) {
      if (total % size === 0) return `${total / size}${suffix}`;
    }
    return `${total}S`;
  },

  /**
   * `timeframe.change(timeframe)` — June 2022.
   *
   * "Returns `true` on the first bar of a new `timeframe`, `false` otherwise."
   *
   * Answered by comparing which PERIOD the current bar's timestamp falls into
   * against the previous bar's, so it fires exactly once per period however
   * many chart bars that period contains — and is false on the very first bar
   * of the script, which begins no period the script has seen end.
   */
  change: (ctx: Context, timeframe: any): boolean => {
    const spec = String(val(timeframe) ?? "");
    const state = ctx.getPersistentState<{ period: number | null }>(() => ({ period: null }));

    // `periodIndex`, not `time / seconds`: 1970-01-01 was a Thursday, so
    // dividing by a nominal week grouped Thursday to Wednesday and a weekly
    // `change` fired on the wrong day. Months are worse — 28 to 31 days against
    // a nominal 30 drifts a whole month out of step inside two years.
    const period = periodIndex(ctx.time, spec);
    if (!Number.isFinite(period)) return false;

    const changed = state.period !== null && period !== state.period;
    state.period = period;
    return changed;
  },

  /**
   * `timeframe.isseconds` — is the chart's timeframe measured in seconds?
   *
   * The sixth member of the `is*` family, and the only one with no v1–v3 flat
   * spelling, because seconds-based timeframes postdate them.
   *
   * @getter
   * @returns {bool}
   */
  isseconds: (ctx: Context): boolean => /^\d*S$/.test(String(ctx.resolution).trim().toUpperCase()),
};

// ─── Day-of-week constants (v1-v3) ─────────────────────────────────────────
//
// Pine numbers days from 1 = Sunday, matching dayofweek(). v4 moved these to
// `dayofweek.sunday` etc.; pre-v4 they are bare globals, which is why they are
// declared unprefixed here.

/** @returns {integer} */
export const sunday = 1;
/** @returns {integer} */
export const monday = 2;
/** @returns {integer} */
export const tuesday = 3;
/** @returns {integer} */
export const wednesday = 4;
/** @returns {integer} */
export const thursday = 5;
/** @returns {integer} */
export const friday = 6;
/** @returns {integer} */
export const saturday = 7;

/**
 * `timenow` — the current UNIX time in milliseconds.
 *
 * Distinct from `time`, which is the timestamp of the bar being evaluated.
 * Scripts use it to age-out signals ("only alert if the bar is recent").
 *
 * Reads from Context rather than calling Date.now() directly so a replay or a
 * backtest can pin it; an unpinned wall clock would make runs irreproducible.
 * @getter
 * @returns {integer} UNIX timestamp in milliseconds.
 */
export function timenow(ctx: Context): number {
  return ctx.now;
}

/**
 * `heikinashi(symbol)` — a symbol whose bars are Heikin-Ashi transformed.
 *
 * Pine models this as a TICKER TRANSFORM, not a series function: the result is
 * passed to security(), which then evaluates its expression against smoothed
 * candles.
 *
 *     ha = heikinashi(tickerid)
 *     haClose = security(ha, period, close)
 *
 * Returning a marked symbol keeps that shape intact — Context.getSecurityData()
 * recognises the marker and applies the transform when the candles are read, so
 * the whole HTF machinery (alignment, no-lookahead, per-call-site state) is
 * reused rather than duplicated.
 *
 * @returns {string} The symbol, marked for Heikin-Ashi transformation.
 */
export function heikinashi(symbol: any): string {
  const s = String(symbol != null && typeof symbol.valueOf === "function" ? symbol.valueOf() : symbol);
  return s.startsWith(HEIKINASHI_PREFIX) ? s : HEIKINASHI_PREFIX + s;
}

/** Marker understood by Context.getSecurityData(). */
export const HEIKINASHI_PREFIX = "heikinashi:";

/**
 * The non-standard chart-type ticker constructors — `renko()`, `linebreak()`,
 * `kagi()` and `pointfigure()`, and their v5 `ticker.*` spellings.
 *
 * ── Present so they are RECOGNISED, refusing so they are not APPROXIMATED ───
 *
 * Like `heikinashi()` above, each returns a ticker id that `security()` then
 * evaluates against transformed candles:
 *
 *     renko_t   = renko(syminfo.tickerid, "ATR", 10)
 *     renko_low = security(renko_t, timeframe.period, low)
 *
 * Unlike Heikin-Ashi, none of these transforms is a per-bar formula over the
 * chart's OHLCV. Renko and Point & Figure DISCARD time — a brick or a column is
 * emitted when price moves far enough, so one chart bar may produce several
 * bricks or none — and Kagi and Line Break rebuild the bar series from a
 * reversal rule. Reconstructing any of them needs intrabar prices this engine
 * is not given.
 *
 * Returning the plain symbol would be the silent failure: `security()` would
 * hand back ordinary candles and the script would run to completion with
 * numbers that are wrong in a way nothing could detect. So these refuse, the
 * same way an unsupplied `request.financial` refuses.
 *
 * Leaving the names UNBOUND was the previous behaviour, and it was worse still:
 * four of TradingView's own v4 documentation examples died with
 * "opsv2_renko is not defined", which reads as an engine crash rather than as
 * the unsupported feature it is.
 *
 * Source: https://www.tradingview.com/pine-script-docs/v4/essential/non-standard-chart-types-data/
 */
function refuseChartType(name: string, detail: string): never {
  throw new Error(
    `${name}: OpenPineScript cannot build ${detail} from OHLCV bars — the ` +
    `transform needs intrabar prices this engine is not given, and returning ` +
    `the untransformed symbol would silently produce standard candles. ` +
    `See runtime/v1/stdlib/chart.ts.`,
  );
}

/** @returns {string} Never returns — Renko bricks cannot be rebuilt here. */
export function renko(_symbol: any, _style?: any, _param?: any): string {
  return refuseChartType("renko", "Renko bricks");
}

/** @returns {string} Never returns — Line Break bars cannot be rebuilt here. */
export function linebreak(_symbol: any, _lines?: any): string {
  return refuseChartType("linebreak", "Line Break bars");
}

/** @returns {string} Never returns — Kagi lines cannot be rebuilt here. */
export function kagi(_symbol: any, _reversal?: any): string {
  return refuseChartType("kagi", "Kagi lines");
}

/** @returns {string} Never returns — P&F columns cannot be rebuilt here. */
export function pointfigure(
  _symbol: any, _source?: any, _style?: any, _param?: any, _reversal?: any,
): string {
  return refuseChartType("pointfigure", "Point & Figure columns");
}

// ── v5's `chart.*` namespace ────────────────────────────────────────────────
//
// NOT the v1–v3 spellings above. Those are `period`, `interval`, `isdaily` —
// flat names that v4 moved into `timeframe.*`. This object is a different set
// of built-ins entirely, added at v5, that ask about the CHART rather than the
// timeframe: its colours, its type, and which bars the user can see.
//
// It lives in this file because the subject is the same, and no `__IS_NAMESPACE__`
// flag is set — the object's own name supplies the `chart.` prefix, exactly as
// `color` does in ./color.ts. Setting the flag would produce `chart.chart.*`.

/**
 * Is the chart a standard candlestick/bar chart?
 *
 * Always true here, and that is a fact rather than a default: this engine is
 * fed OHLCV bars, and every non-standard type it could be asked about REFUSES
 * rather than approximating (see `renko` and friends above). There is no run in
 * which a script gets here on Renko candles.
 */
const IS_STANDARD = true;

/**
 * Relative luminance of a #RRGGBB[AA] colour, on the WCAG scale.
 *
 * Used only to decide which of black or white contrasts better with the chart
 * background, which is the whole of what `chart.fg_color` promises.
 */
function luminance(hex: string): number {
  const h = hex.replace("#", "");
  if (h.length < 6) return 1;
  const channel = (i: number): number => {
    const c = parseInt(h.substring(i * 2, i * 2 + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
}

/** One coordinate on the chart. */
interface ChartPoint {
  index: number;
  time: number;
  price: number;
}

// ── `chart.point` — v5's coordinate object ──────────────────────────────────
//
// A built-in TYPE rather than a function namespace: `chart.point` has three
// fields and five constructors, and is what `polyline.new` takes an array of.
//
//   index  the bar index coordinate
//   time   the timestamp coordinate
//   price  the y coordinate
//
// A point carries BOTH x coordinates and the drawing chooses between them with
// `xloc`, which is why every constructor fills in whichever it was not given:
// `chart.point.from_index(i, p)` has no time, and a polyline drawn with
// `xloc.bar_time` would then have nothing to place it by. TradingView leaves
// the unsupplied field `na`; so does this.
//
// Represented as a plain object, exactly as a user-defined type is (see
// `Context.newObject`), so `p.price` reads through the same field accessor.


export const chart = {
  /**
   * `chart.point` — v5's coordinate object.
   *
   * Written INLINE rather than as a `const` referenced by shorthand: the
   * registry generator walks object literals with ts-morph and does not
   * evaluate the file, so `point,` pointing at a declaration elsewhere produced
   * no `chart.point.*` keys at all. Same rule, and the same reason, as the
   * "written out literally" note at the top of ./drawings.ts.
   */
  point: {
    /** `chart.point.new(index, time, price)` — every field given. */
    new: (index: any, time: any, price: any): ChartPoint => ({
      index: Number(val(index)),
      time: Number(val(time)),
      price: Number(val(price)),
    }),

    /**
     * `chart.point.now(price)` — the CURRENT bar's index and time.
     *
     * The only constructor that needs the Context, and that is the whole point
     * of it: "now" is a fact about the run, not about the arguments.
     */
    now: (ctx: Context, price: any): ChartPoint => ({
      index: ctx.currentBarIndex,
      time: ctx.time,
      price: Number(val(price)),
    }),

    /** `chart.point.from_index(index, price)` — time left `na`. */
    from_index: (index: any, price: any): ChartPoint => ({
      index: Number(val(index)),
      time: NaN,
      price: Number(val(price)),
    }),

    /** `chart.point.from_time(time, price)` — index left `na`. */
    from_time: (time: any, price: any): ChartPoint => ({
      index: NaN,
      time: Number(val(time)),
      price: Number(val(price)),
    }),

    /** `chart.point.copy(point)` — a new point with the same three fields. */
    copy: (p: any): ChartPoint => {
      const src = val(p) ?? {};
      return { index: src.index, time: src.time, price: src.price };
    },
  },

  /**
   * The chart's background colour.
   *
   * "chart.bg_color returns the color of the chart's background from the
   *  'Chart settings/Appearance/Background' field."
   *
   * Host-supplied via `Context.provideChartBackground`; see the note there for
   * the default and why it is a choice rather than a fact.
   * @getter
   */
  bg_color: (ctx: Context): string => ctx.chartBgColor,

  /**
   * A colour that contrasts well with the background.
   *
   * "chart.fg_color returns a color providing optimal contrast with
   *  chart.bg_color."
   *
   * Black on a light background, white on a dark one, chosen by relative
   * luminance. TradingView does not publish the exact rule, so this is the
   * standard one rather than a reproduction of theirs — the two agree on which
   * END of the scale to pick, which is what the promise is about, and may
   * differ on a mid-grey background.
   * @getter
   */
  fg_color: (ctx: Context): string =>
    luminance(String(ctx.chartBgColor)) > 0.179 ? "#000000ff" : "#ffffffff",

  /**
   * Is the chart type standard?
   * @getter
   */
  is_standard: (_ctx: Context): boolean => IS_STANDARD,

  /**
   * Opening time of the leftmost VISIBLE bar.
   *
   * "chart.left_visible_bar_time returns the time of the leftmost bar
   *  currently visible on the chart."
   *
   * There is no viewport here, so this is the first bar of the run unless the
   * host declares one — see `Context.provideVisibleRange`, which also explains
   * why that is a divergence worth stating.
   * @getter
   */
  left_visible_bar_time: (ctx: Context): number => ctx.leftVisibleBarTime,

  /**
   * Opening time of the rightmost VISIBLE bar. See `left_visible_bar_time`.
   * @getter
   */
  right_visible_bar_time: (ctx: Context): number => ctx.rightVisibleBarTime,
};
