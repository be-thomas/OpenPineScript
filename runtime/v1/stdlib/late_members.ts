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

/** One `ta.pivot_point_levels` call site: the period in progress and the levels of the last one. */
type PivotState = { started: boolean; o: number; h: number; l: number; c: number; levels: number[] | null };

/**
 * The eleven levels `[P, R1, S1, R2, S2, R3, S3, R4, S4, R5, S5]` of one pivot type, from a
 * period's high, low, close and open (`o`, DM's input) and the next period's open (`next`, Woodie's).
 * TradingView's "Pivot Points Standard" formulas; a level a type does not define is na.
 */
function pivotLevels(type: string, h: number, l: number, c: number, o: number, next: number): number[] {
    const out = new Array(11).fill(NaN);
    const r = h - l;
    const set = (...v: number[]) => v.forEach((x, i) => { out[i] = x; });
    switch (type) {
        case "Traditional": {
            const p = (h + l + c) / 3;
            set(p, p * 2 - l, p * 2 - h, p + r, p - r, p * 2 + (h - 2 * l), p * 2 - (2 * h - l),
                p * 3 + (h - 3 * l), p * 3 - (3 * h - l), p * 4 + (h - 4 * l), p * 4 - (4 * h - l));
            break;
        }
        case "Fibonacci": {
            const p = (h + l + c) / 3;
            set(p, p + 0.382 * r, p - 0.382 * r, p + 0.618 * r, p - 0.618 * r, p + r, p - r);
            break;
        }
        case "Woodie": {
            const p = (h + l + next * 2) / 4;
            const r3 = h + 2 * (p - l), s3 = l - 2 * (h - p);
            set(p, p * 2 - l, p * 2 - h, p + r, p - r, r3, s3, r3 + r, s3 - r);
            break;
        }
        case "Classic": {
            const p = (h + l + c) / 3;
            set(p, p * 2 - l, p * 2 - h, p + r, p - r, p + 2 * r, p - 2 * r, p + 3 * r, p - 3 * r);
            break;
        }
        case "DM": {
            const x = o === c ? h + l + 2 * c : c > o ? 2 * h + l + c : 2 * l + h + c;
            set(x / 4, x / 2 - l, x / 2 - h);
            break;
        }
        case "Camarilla": {
            const p = (h + l + c) / 3;
            const r5 = (h / l) * c;
            set(p, c + 1.1 * r / 12, c - 1.1 * r / 12, c + 1.1 * r / 6, c - 1.1 * r / 6, c + 1.1 * r / 4, c - 1.1 * r / 4,
                c + 1.1 * r / 2, c - 1.1 * r / 2, r5, c - (r5 - c));
            break;
        }
        default:
            throw new Error(`ta.pivot_point_levels: unknown type "${type}" (Traditional, Fibonacci, Woodie, Classic, DM or Camarilla).`);
    }
    return out;
}

export const ta = {
  /**
   * `ta.pivot_point_levels(type, anchor, developing = false)`: the pivot levels of the
   * period that ended when `anchor` last became true, as an 11-element array
   * `[P, R1, S1, R2, S2, R3, S3, R4, S4, R5, S5]` (na where the type has no such level).
   * A period runs from one anchor bar (inclusive) to the next. With `developing`, the
   * levels are those of the period in progress, recomputed on every bar. na throughout
   * until a period has ended.
   *
   * @returns {array<float>} A new array on every call.
   */
  pivot_point_levels: (ctx: Context, type: any, anchor: any, developing: any = false): number[] => {
    const kind = String(val(type));
    // TradingView RE10128 (probe r6 p1_pivot_types_b, bar 0).
    if (val(developing) === true && kind === "Woodie") {
      throw new Error('The `developing` parameter of the `ta.pivot_point_levels()` cannot be `true` when `type` is "Woodie".');
    }
    const st = ctx.getPersistentState<PivotState>(() => ({ started: false, o: NaN, h: NaN, l: NaN, c: NaN, levels: null }));
    const o = Number(val((ctx as any).open)), h = Number(val((ctx as any).high));
    const l = Number(val((ctx as any).low)), c = Number(val((ctx as any).close));
    if (st.started && Boolean(val(anchor))) {
      st.levels = pivotLevels(kind, st.h, st.l, st.c, st.o, o);
      st.started = false;
    }
    if (!st.started) { st.started = true; st.o = o; st.h = h; st.l = l; st.c = c; }
    else { st.h = Math.max(st.h, h); st.l = Math.min(st.l, l); st.c = c; }
    if (val(developing) === true) return pivotLevels(kind, st.h, st.l, st.c, st.o, st.o);
    return st.levels ? st.levels.slice() : new Array(11).fill(NaN);
  },

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
   * `ticker.standard(symbol)` — the ticker id with any non-standard chart
   * type removed ("heikinashi:", "renko:" …), so a request reads ordinary
   * candles. A plain id is returned as it is.
   */
  standard: (symbol: any = undefined): string => {
    const id = String(val(symbol) ?? "");
    return id.replace(/^(heikinashi|renko|linebreak|kagi|pointfigure|range):/i, "");
  },

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
