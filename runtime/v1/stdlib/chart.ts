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
