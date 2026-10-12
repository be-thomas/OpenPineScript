/**
 * Members whose NAMESPACE is older than they are.
 *
 * Most of `math.*`, `ta.*` and `ticker.*` is not written anywhere in that form.
 * It is the v1–v4 FLAT names — `abs`, `sma`, `heikinashi` — which the v5 rename
 * table moves under a namespace, so `math.ts`, `ta.ts` and `chart.ts` export
 * flat functions and must keep doing so.
 *
 * The members below have no flat ancestor, and each one COLLIDES with a flat
 * name that does:
 *
 *   math.pi      `math.ts` is the module named math; an object literal in it
 *                could not also be called `math`
 *   ta.max/min   flat `max` and `min` are already taken — they are what become
 *                `math.max` and `math.min`
 *   ticker.modify  flat `ticker` is already taken — it is the v1–v3 symbol name,
 *                a FUNCTION, and TypeScript will not let one name be both
 *
 * So they are declared here as object literals, which the registry generator
 * turns straight into dotted keys, and `createStdlib` merges onto the flat
 * function of the same name where there is one. Gated to v5 with the rest of
 * their namespaces by V5_ONLY_NAMESPACES.
 */
import { Context } from "../context";
import { val } from "../../../utils/v2/common";

/** @returns {const float} */
export const math = {
  /** The ratio of a circle's circumference to its diameter. */
  pi: Math.PI,

  /** Euler's number, the base of the natural logarithm. */
  e: Math.E,

  /**
   * The golden ratio, (1 + √5) / 2.
   *
   * Written out rather than hard-coded to its decimal expansion so it carries
   * every bit of double precision — a Fibonacci retracement level computed from
   * a truncated constant drifts from TradingView's by the last digits, which is
   * exactly the kind of divergence this engine exists to avoid.
   */
  phi: (1 + Math.sqrt(5)) / 2,

  /** The RECIPROCAL golden ratio, (√5 − 1) / 2 — `math.phi` minus one. */
  rphi: (Math.sqrt(5) - 1) / 2,
};

/** The running extreme of one call site, kept across bars. */
type Record = { best: number };

export const ta = {
  /**
   * The highest value `source` has held since the script began.
   *
   * `na` is SKIPPED rather than compared. A single absent bar would otherwise
   * poison the record permanently — `NaN > x` is false and `x > NaN` is false,
   * so the comparison never recovers — which is the same rule `ta.cum` follows
   * and for the same reason.
   *
   * Undefined before the first finite value, which is `na`: a series that has
   * never had a value has no maximum, and answering 0 would put a floor on
   * every chart that plots it.
   *
   * @returns {series float} The all-time high, or na.
   */
  max: (ctx: Context, source: any): number => {
    const v = Number(val(source));
    const state = ctx.getPersistentState<Record>(() => ({ best: NaN }));
    if (!Number.isNaN(v) && (Number.isNaN(state.best) || v > state.best)) state.best = v;
    return state.best;
  },

  /**
   * The lowest value `source` has held since the script began.
   * @returns {series float} The all-time low, or na.
   */
  min: (ctx: Context, source: any): number => {
    const v = Number(val(source));
    const state = ctx.getPersistentState<Record>(() => ({ best: NaN }));
    if (!Number.isNaN(v) && (Number.isNaN(state.best) || v < state.best)) state.best = v;
    return state.best;
  },
};

/**
 * `ticker.modify(tickerid, session, adjustment, …)` — August 2024.
 *
 * Rebuilds a ticker id with different session or adjustment settings, leaving
 * the symbol alone: `ticker.modify(syminfo.tickerid, session.extended)` is the
 * standard way to ask for extended hours without hard-coding the symbol.
 *
 * The result is a MARKED symbol string, exactly as `heikinashi()` returns one —
 * `Context.getSecurityData` reads the marker when the candles are fetched, so
 * the whole request pipeline is reused rather than duplicated. A host that
 * ignores the marker gets regular-session data, which is what it has.
 */
export const ticker = {
  /**
   * `ticker.inherit(tickerid, from_tickerid)` — take another symbol's settings.
   *
   * Builds a ticker id for `tickerid` carrying whatever session, adjustment and
   * chart-type modifiers `from_tickerid` was built with. The point is that the
   * two requests then agree: comparing a symbol against an index is only
   * meaningful if both are asked for on the same terms.
   *
   * The modifiers are the query string `ticker.modify` writes, so inheriting
   * them is copying that half of the id onto a different symbol.
   */
  inherit: (tickerid: any, from_tickerid: any): string => {
    const target = String(val(tickerid) ?? "");
    const source = String(val(from_tickerid) ?? "");
    const at = source.indexOf("?");
    const symbol = target.indexOf("?") === -1 ? target : target.slice(0, target.indexOf("?"));
    return at === -1 ? symbol : symbol + source.slice(at);
  },

  modify: (tickerid: any, session?: any, adjustment?: any, ..._rest: any[]): string => {
    const symbol = String(val(tickerid) ?? "");
    const parts: string[] = [];
    if (session != null) parts.push(`session=${String(val(session))}`);
    if (adjustment != null) parts.push(`adjustment=${String(val(adjustment))}`);
    return parts.length ? `${symbol}?${parts.join("&")}` : symbol;
  },
};
