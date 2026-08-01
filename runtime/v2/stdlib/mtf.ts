/**
 * runtime/v2/stdlib/mtf.ts
 * Multi-timeframe access — security() (P1).
 *
 * Pine: `security(symbol, resolution, expression)` evaluates `expression` on the
 * (symbol, resolution) series and aligns the result onto the chart's bars.
 *
 * The transpiler passes `expression` as a deferred thunk (see emitSecurity in the
 * visitor). We evaluate it over the supplied HTF candles inside a sub-context
 * (ctx.evalSecurityBar rebinds the global series), advancing only through HTF bars
 * that have already CLOSED at the current chart-bar time — never the forming HTF
 * bar — so there is no lookahead / repaint.
 */
// Type-only import: a value import would create a load cycle
// (context.ts → stdlib → metadata → mtf → context). The sub-context is created
// via `ctx.constructor` instead.
import type { Context } from "../context";

interface HtfState {
    sub: Context;   // isolated bar loop for the HTF expression
    done: number;   // index of the last HTF bar already evaluated
    last: number;   // last computed HTF value (aligned to the chart)
}

function unwrap(x: any): any {
    return x !== null && x !== undefined && typeof x.valueOf === "function" ? x.valueOf() : x;
}

export function security(
    ctx: Context,
    symbolInput: any,
    resolutionInput: any,
    expression: () => any,
    _gaps?: any,
    _lookahead?: any
): number {
    if (typeof expression !== "function") return NaN; // malformed call

    const symbol = String(unwrap(symbolInput));
    const resolution = String(unwrap(resolutionInput));

    const data = ctx.getSecurityData(symbol, resolution);
    if (!data || data.length === 0) {
        ctx.requestSecurity(symbol, resolution); // session layer will supply it, then re-run
        return NaN;
    }

    const key = ctx.currentCallKey();
    const st = ctx.getHtfState<HtfState>(key, () => ({
        sub: new (ctx.constructor as new () => Context)(),
        done: -1,
        last: NaN,
    }));

    const t = ctx.time;
    // Advance through every HTF bar that has CLOSED at/before the current chart bar:
    // bar j is closed once bar j+1 has started (data[j+1].time <= t). The final
    // (forming) HTF bar is never evaluated — prevents lookahead.
    while (st.done + 1 < data.length) {
        const j = st.done + 1;
        const closed = j + 1 < data.length && data[j + 1].time <= t;
        if (!closed) break;
        st.last = ctx.evalSecurityBar(st.sub, data[j], expression);
        st.done = j;
    }
    return st.last;
}
