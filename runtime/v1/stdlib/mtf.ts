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
import { periodEnd, specSeconds } from "../timeframes";

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
    symbol: any,
    resolution: any,
    expression: () => any,
    gaps?: any,
    lookahead?: any,
    ignore_invalid_symbol?: any,
    currency?: any,
    calc_bars_count?: any,
): any {
    // Named for the published signature, because the registry binds keyword
    // arguments by PARAMETER NAME and `symbolInput` bound nothing. The second
    // parameter keeps its v1–v4 name `resolution`; v5 spells the same thing
    // `timeframe`, and the v5 emitter renames it here rather than the registry
    // carrying two names for one slot. `gaps` and `currency`
    // are recorded by being accepted: this engine returns the aligned value and
    // does not model gap-filling or conversion.
    const symbolInput = symbol;
    const resolutionInput = resolution;
    const lookaheadInput = lookahead;
    void gaps; void ignore_invalid_symbol; void currency;
    if (typeof expression !== "function") return NaN; // malformed call

    // Explicit argument wins; otherwise the version's default. v1/v2 default to
    // lookahead_on, v3+ to lookahead_off (dev-docs/01-version-delta-spec.md D3.1).
    const mode = resolveLookahead(lookaheadInput, ctx);

    const symbolName = String(unwrap(symbolInput));
    // "timeframe (series string) ... An empty string is interpreted as the
    // current chart's timeframe." It is NOT a request for external data: with
    // the empty string as the key the request waited for a series no host
    // could name, and the script's values stayed `na` on every bar.
    const requested = String(unwrap(resolutionInput));
    const resolutionName = requested === "" ? String(ctx.resolution) : requested;

    const data = ctx.getSecurityData(symbolName, resolutionName, mode === "on");
    if (!data || data.length === 0) {
        ctx.requestSecurity(symbolName, resolutionName); // session layer will supply it, then re-run
        return NaN;
    }

    // One state per call site AND context. A v6 call in a loop, or with a
    // series string timeframe, reaches the same site with different contexts,
    // and each is its own series: TradingView's log has a loop over "5", "15"
    // and "60" return three different closes, where one shared state returned
    // the first context's value for all three.
    const key = `${ctx.currentCallKey()}|${symbolName}@${resolutionName}`;
    const st = ctx.getHtfState<HtfState>(key, () => ({
        // The sub-context inherits the profile — the HTF expression is the
        // same script, under the same language version — and reports the
        // requested timeframe and symbol.
        sub: ctx.securitySubContext(symbolName, resolutionName),
        done: ctx.securityFirstBar(symbolName, resolutionName, calc_bars_count, "request.security") - 1,
        last: NaN,
    }));

    const t = ctx.time;

    // How far into the HTF series the current chart bar may see.
    //
    //   off — only bars that have CLOSED: once the chart bar that ends
    //         it has (see `ends` below), in every version. The forming HTF bar is never
    //         evaluated, so historical values match what a live run would see.
    //
    //   on  — also the HTF bar the chart bar is INSIDE (data[j].time <= t),
    //         i.e. its close is visible before it happens. This is the
    //         repainting behaviour that was the default before v3.
    // A request for the chart's OWN series is not deferred. There is no higher
    // timeframe bar to wait for: the requested bar and the chart bar are the
    // same bar, and it closes when the chart bar does. Treating it as "still
    // forming" made `request.security(syminfo.tickerid, timeframe.period,
    // close)` return the PREVIOUS bar's close — a one-bar lag in the most basic
    // call there is. Host-supplied data keeps the closed-bar rule; see
    // `Context.isOwnChartSeries`.
    const sameContext = ctx.isOwnChartSeries(symbolName, resolutionName);

    // Every version: a requested bar has CLOSED once the chart bar that ends it
    // has: on a 1-minute chart the 5-minute close appears on the minute that ends
    // at the 5-minute boundary, as TradingView logs it (v6:
    // conformance/v6/golden/harness_v6_language; v5: harness_security_tf and
    // harness_security_cbc, where the hourly value steps on the last 5-minute bar
    // of the hour, bars 4475, 4487, ... and 11, 23, ...), not one bar later on the
    // first minute of the next five. No log shows the later bar, and the migration
    // guides document no difference between versions. The requested bar ends at the next one's
    // open, or at its own period's end when that is sooner or there is none.
    const chartClose = periodEnd(t, String(ctx.resolution));
    const ends = (j: number): number => {
        // The host's own close time for the bar if it gave one (a session's last bar
        // ends with the session), else the calendar's.
        const own = data[j].closeTime ?? periodEnd(data[j].time, resolutionName);
        const next = j + 1 < data.length ? data[j + 1].time : NaN;
        return Number.isFinite(own) && Number.isFinite(next) ? Math.min(own, next) : (Number.isFinite(next) ? next : own);
    };

    const lowerTf = !sameContext && specSeconds(resolutionName) < specSeconds(String(ctx.resolution));

    while (st.done + 1 < data.length) {
        const j = st.done + 1;
        const visible = mode === "on" || sameContext
            ? data[j].time <= t
            : Number.isFinite(chartClose)
                // v5+: a requested bar must have CLOSED by the chart bar's close, a
                // shorter one too (genuine lookahead_off, probes security-tf: a 15m
                // chart's 16:00 bar sees the 16:12 2m bar). v3/v4 have no evidence
                // and keep the older rule: a shorter bar is visible once it has
                // opened inside the chart bar, with its full values.
                ? (lowerTf && ctx.profile.version < 5 ? data[j].time < chartClose : ends(j) <= chartClose)
                : j + 1 < data.length && data[j + 1].time <= t;
        if (!visible) break;
        // On a LIVE chart bar, a requested bar that ends with it (or is still
        // forming under lookahead_on) may still change before the chart bar
        // does: the host keeps updating it. Evaluate it provisionally, rolled back
        // each tick like the main script, and commit it only once the chart bar
        // it ends on is over. Historical bars are never provisional.
        const provisional = ctx.is_realtime && ends(j) > t;
        st.last = ctx.evalSecurityBar(st.sub, data[j], expression, provisional);
        if (provisional) break;
        st.done = j;
    }
    return st.last;
}
