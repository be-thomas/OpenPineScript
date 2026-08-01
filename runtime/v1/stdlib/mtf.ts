/**
 * runtime/v1/stdlib/mtf.ts
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

/** Explicit `lookahead` argument if given, else the language version's default. */
function resolveLookahead(input: any, ctx: Context): "on" | "off" {
    const raw = unwrap(input);
    if (raw === "barmerge.lookahead_on") return "on";
    if (raw === "barmerge.lookahead_off") return "off";
    // Pine also accepted a bare truthy value historically.
    if (raw === true) return "on";
    if (raw === false) return "off";
    return ctx.profile.defaults.securityLookahead;
}

export function security(
    ctx: Context,
    symbolInput: any,
    resolutionInput: any,
    expression: () => any,
    _gaps?: any,
    lookaheadInput?: any
): number {
    if (typeof expression !== "function") return NaN; // malformed call

    // Explicit argument wins; otherwise the version's default. v1/v2 default to
    // lookahead_on, v3+ to lookahead_off (dev-docs/01-version-delta-spec.md D3.1).
    const lookahead = resolveLookahead(lookaheadInput, ctx);

    const symbol = String(unwrap(symbolInput));
    const resolution = String(unwrap(resolutionInput));

    const data = ctx.getSecurityData(symbol, resolution);
    if (!data || data.length === 0) {
        ctx.requestSecurity(symbol, resolution); // session layer will supply it, then re-run
        return NaN;
    }

    const key = ctx.currentCallKey();
    const st = ctx.getHtfState<HtfState>(key, () => ({
        // The sub-context must inherit the profile: the HTF expression is the
        // same script and runs under the same language version.
        sub: new (ctx.constructor as new (p: any) => Context)(ctx.profile),
        done: -1,
        last: NaN,
    }));

    const t = ctx.time;

    // How far into the HTF series the current chart bar may see.
    //
    //   off — only bars that have CLOSED. Bar j is closed once bar j+1 has
    //         started (data[j+1].time <= t). The forming HTF bar is never
    //         evaluated, so historical values match what a live run would see.
    //
    //   on  — also the HTF bar the chart bar is INSIDE (data[j].time <= t),
    //         i.e. its close is visible before it happens. This is the
    //         repainting behaviour that was the default before v3.
    while (st.done + 1 < data.length) {
        const j = st.done + 1;
        const visible = lookahead === "on"
            ? data[j].time <= t
            : j + 1 < data.length && data[j + 1].time <= t;
        if (!visible) break;
        st.last = ctx.evalSecurityBar(st.sub, data[j], expression);
        st.done = j;
    }
    return st.last;
}
