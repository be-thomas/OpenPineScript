/**
 * Non-price data requests — `request.financial`, `.dividends`, `.splits`,
 * `.earnings`, `.quandl`. v5.
 *
 * `request.security` is NOT here: it is v5's spelling of `security()`, aliased
 * to the same implementation in ./renames5.ts, because the two are one function
 * under two names.
 *
 * ── Where the data comes from ───────────────────────────────────────────────
 *
 * Nowhere this engine can reach. Every function below asks TradingView for a
 * series it does not compute — a company's quarterly revenue, a dividend
 * record, a Nasdaq Data Link table — and there is no such source here.
 *
 * So the HOST supplies it, exactly as it supplies higher-timeframe candles for
 * `security()`: `Context.provideRequestData(kind, key, samples)`. An
 * unsupplied request is REFUSED rather than answered with `na`.
 *
 * That refusal is the whole point of this file. These names were absent
 * before, and `request` is a namespace that DOES exist (it has `security` in
 * it), so `request.financial(…)` read as `undefined` and the script ran to
 * completion with a silently empty series. The emitter's namespace check
 * deliberately does not assert registry completeness — failing an incomplete
 * stdlib as a user error would be worse — so nothing else could catch it.
 *
 * ── Why the values are sparse ───────────────────────────────────────────────
 *
 * None of these is a per-bar series. A dividend happens on one day and the
 * value stands until the next one; a quarterly figure is published once and
 * stands for the quarter. So a request is stored as timestamped SAMPLES and
 * read as a step function: the most recent sample at or before the current bar,
 * and `na` before the first one.
 */

import { Context } from "../context";
import { val } from "../../../utils/v2/common";
import { specSeconds, periodEnd } from "../timeframes";

/** One `security_lower_tf` call site's state: see `getHtfState`. */
interface LtfState {
    sub: Context;
    /** Index of the last lower-timeframe bar already evaluated. */
    done: number;
    /** The chart bar `out` was built for. */
    barTime: number;
    out: any;
    /** The lower-timeframe series `done` indexes, and how long it was. */
    data: readonly any[];
    len: number;
    /**
     * Live chart bar: a rollback point of `sub` taken before the bar's first
     * intrabar, `done` at that point, the bar it is for, and the last intrabar
     * the last tick saw. The forming bar's intrabars are re-evaluated from it
     * each tick, because the host keeps changing them.
     */
    cp?: unknown;
    cpDone?: number;
    cpBar?: number;
    sig?: string;
}

/** Whether `next` still begins with the `len` bars `prev` held: same bars, only more of them. */
function extendsSeries(prev: readonly any[], len: number, next: readonly any[]): boolean {
    if (next.length < len) return false;
    if (prev === next) return true;
    return [0, len - 1].every(i => {
        const a = prev[i], b = next[i];
        return a.time === b.time && a.open === b.open && a.high === b.high
            && a.low === b.low && a.close === b.close && a.volume === b.volume;
    });
}

/** The cached answer, copied (tuple elements too): a script may push to or sort what it is handed. */
function copyOut(out: any[], arity: number): any[] {
    return arity < 0 ? out.slice() : out.map(a => a.slice());
}

const text = (x: any): string => String(val(x) ?? "");

/**
 * The key a request is stored under.
 *
 * Built from every argument that selects a different SERIES, so two requests
 * that differ in any of them cannot read each other's data.
 */
export function requestKey(parts: readonly any[]): string {
    return parts.map(p => text(p)).join("|");
}

/** Looks a request up, or refuses. See the header for why this is not `na`. */
/**
 * @param ignore_invalid_symbol when true, a context this engine cannot supply
 *        answers `na` instead of raising. That is the documented meaning —
 *        "If true, no error is thrown and na is returned" — and it applies just
 *        as well to data a HOST has not provided as to a symbol TradingView
 *        cannot find: either way the request has no answer, and the script has
 *        said it would rather have `na` than stop.
 */
function resolve(
    ctx: Context, kind: string, parts: readonly any[], ignore_invalid_symbol: any = false,
): number {
    const key = requestKey(parts);
    const samples = ctx.getRequestData(kind, key);

    if (!samples) {
        const ignore = ignore_invalid_symbol !== null && ignore_invalid_symbol !== undefined
            && typeof (ignore_invalid_symbol as any).valueOf === "function"
            ? (ignore_invalid_symbol as any).valueOf() : ignore_invalid_symbol;
        if (ignore === true) return NaN;
        throw new Error(
            `request.${kind}: no data was supplied for '${key}'. This engine ` +
            `cannot fetch it from TradingView — provide it with ` +
            `ctx.provideRequestData(${JSON.stringify(kind)}, ${JSON.stringify(key)}, samples).`,
        );
    }

    // The most recent sample at or before this bar. Linear from the end because
    // a request typically has a few dozen samples against thousands of bars,
    // and the answer is almost always the last one.
    for (let i = samples.length - 1; i >= 0; i--) {
        if (samples[i].time <= ctx.time) return samples[i].value;
    }
    return NaN;
}

/**
 * `request.financial(symbol, financial_id, period, gaps)`.
 * @returns {series float} The reported figure, held until the next report.
 */
export const request = {
    financial: (
        ctx: Context, symbol: any, financial_id: any, period: any, gaps?: any,
        ignore_invalid_symbol?: any, currency?: any,
    ): number => {
        void gaps; void currency;
        return resolve(ctx, "financial", [symbol, financial_id, period], ignore_invalid_symbol);
    },

    /** `request.dividends(ticker, field, …)` — field defaults to gross dividends. */
    dividends: (ctx: Context, ticker: any, field: any = "dividends_gross", ..._rest: any[]): number =>
        resolve(ctx, "dividends", [ticker, field]),

    splits: (ctx: Context, ticker: any, field: any = "splits_numerator", ..._rest: any[]): number =>
        resolve(ctx, "splits", [ticker, field]),

    earnings: (ctx: Context, ticker: any, field: any = "earnings_actual", ..._rest: any[]): number =>
        resolve(ctx, "earnings", [ticker, field]),

    /**
     * `request.security_lower_tf(symbol, timeframe, expression,
     * ignore_invalid_symbol, currency, ignore_invalid_timeframe,
     * calc_bars_count)` — Sept 2023.
     *
     * Evaluates `expression` on EVERY intrabar of the chart bar and returns them
     * all, as an array — or, when the expression is a tuple, as a tuple of arrays.
     * That is what makes it different from `request.security`, which returns one
     * value: a chart bar contains many lower-timeframe bars, and this hands back
     * all of them so a script can sum, count or measure within the bar.
     *
     * The intrabars of a chart bar are the lower-timeframe bars that open
     * inside it, from its open to its close. The expression is evaluated on
     * every lower-timeframe bar in order, in one sub-context per call site, so
     * a `ta.*` call inside it warms up on the lower timeframe's own history.
     *
     * ── With no intrabar data, the answer is EMPTY, not approximate ─────────────
     *
     * This engine is fed one series of OHLCV bars. It has no finer data and cannot
     * fetch any, so unless a host supplies the lower timeframe there are no
     * intrabars to report — and an empty array says exactly that. The alternative,
     * returning the chart bar as its own single intrabar, would make
     * `array.size(...)` report 1 where TradingView reports 12, and every average
     * computed from it would be quietly wrong rather than visibly absent.
     *
     * `security` answers `na` in the same situation for the same reason, and asks
     * the session layer for the data the same way.
     *
     * ── The three arguments ─────────────────────────────────────────────────────
     *
     * ignore_invalid_timeframe: "Determines the behavior of the function when
     *   the chart's timeframe is smaller than the timeframe used in the function
     *   call. If false, the script will halt and throw a runtime error. If true,
     *   the function will return na and execution will continue."
     *
     * ignore_invalid_symbol: "If false, the script will halt and throw a runtime
     *   error [when the symbol is not found]. If true, the function will return
     *   na and execution will continue." This engine cannot tell a symbol that
     *   does not exist from data the host has not supplied, and the second is
     *   not an error: the request is recorded for the host and the answer is the
     *   empty one above, whichever way the argument is set. It is accepted so it
     *   is not reported as dropped.
     *
     * calc_bars_count: accepted, with no observable effect: TradingView's log
     *   (conformance/v5/parity/harness_security_cbc) shows a call with
     *   calc_bars_count = 200 equal to the call without it on every bar.
     */
    security_lower_tf: (
        ctx: Context,
        symbol: any,
        timeframe: any,
        expression: () => any,
        ignore_invalid_symbol?: any,
        currency?: any,
        ignore_invalid_timeframe?: any,
        calc_bars_count?: any,
    ): any => {
        void ignore_invalid_symbol; void currency;
        if (typeof expression !== "function") return [];

        const symbolName = String(val(symbol) ?? "");
        // "" is the chart's own timeframe, as for `request.security`.
        const requested = String(val(timeframe) ?? "");
        const tfName = requested === "" ? String(ctx.resolution) : requested;

        // The expression's SHAPE decides the return's: a tuple in, a tuple of
        // arrays out. Evaluating it once on the chart bar is how the arity is
        // learned — nothing else states it, and `security` faces the same problem
        // through `tupleArityFromArgument` at compile time.
        const key = `${ctx.currentCallKey()}|ltf|${symbolName}@${tfName}`;
        const shape = ctx.getHtfState<{ arity: number }>(`${key}|shape`, () => {
            const probe = expression();
            return { arity: Array.isArray(probe) ? probe.length : -1 };
        });
        const arity = shape.arity;
        const empty = (): any => arity < 0 ? [] : Array.from({ length: arity }, () => [] as any[]);

        const want = specSeconds(tfName), have = specSeconds(String(ctx.resolution));
        if (Number.isFinite(want) && Number.isFinite(have) && want > have) {
            const ignore = val(ignore_invalid_timeframe);
            if (ignore !== true && ignore !== 1) {
                throw new Error(
                    `request.security_lower_tf: the requested timeframe '${tfName}' is higher than the chart's ` +
                    `'${ctx.resolution}'. Pass ignore_invalid_timeframe = true to get na instead.`);
            }
            return arity < 0 ? NaN : Array.from({ length: arity }, () => NaN);
        }

        const data = ctx.getSecurityData(symbolName, tfName);
        if (!data || data.length === 0) {
            ctx.requestSecurity(symbolName, tfName);
            return empty();
        }

        const fresh = (): LtfState => ({
            sub: ctx.securitySubContext(symbolName, tfName),
            done: ctx.securityFirstBar(symbolName, tfName, calc_bars_count, "request.security_lower_tf") - 1,
            barTime: NaN,
            out: empty(),
            data,
            len: data.length,
        });
        let st = ctx.getHtfState<LtfState>(key, fresh);
        const open = ctx.time;
        // The chart bar runs from its open to the next bar's open.
        const close = periodEnd(open, String(ctx.resolution));
        const end = Number.isFinite(close) ? close : open + have * 1000;
        const live = ctx.is_realtime;

        // Intrabars the host supplied after this site last ran: more of the same
        // series is picked up where evaluation stopped, but a different series
        // starts over in a new sub-context, so the expression's own history
        // is not fed the same bar twice. Only the committed prefix is compared:
        // on a live bar the intrabars of the forming chart bar are meant to move.
        const committed = live && st.cpBar !== undefined && st.cpDone !== undefined ? st.cpDone + 1 : st.len;
        if (!extendsSeries(st.data, committed, data)) {
            const again = fresh();
            Object.assign(st, again, { cp: undefined, cpDone: undefined, cpBar: undefined, sig: undefined });
        }

        const evalInto = (out: any, from: number) => {
            while (st.done + 1 < data.length && data[st.done + 1].time < end) {
                const j = ++st.done;
                // Every bar is evaluated, in order, so the expression's own history
                // is complete; only those inside this chart bar are returned.
                const v = ctx.evalSecurityBar(st.sub, data[j], expression);
                if (data[j].time < from) continue;
                if (arity < 0) out.push(v);
                else for (let k = 0; k < arity; k++) out[k].push(Array.isArray(v) ? v[k] : NaN);
            }
        };

        if (live) {
            // The last intrabar this chart bar holds, as the host has it now. If
            // nothing about it changed since the last tick, the answer stands.
            let lastIdx = -1;
            for (let j = Math.max(0, data.length - 1); j >= 0; j--) if (data[j].time < end) { lastIdx = j; break; }
            const lb = lastIdx >= 0 ? data[lastIdx] : undefined;
            const sig = lb ? `${lastIdx}|${lb.time}|${lb.open}|${lb.high}|${lb.low}|${lb.close}|${lb.volume}` : "-";
            if (st.cpBar === open && st.sig === sig) return copyOut(st.out, arity);

            if (st.cpBar !== open) {
                // A new chart bar: what came before it is final. Take the rollback
                // point before this bar's first intrabar.
                while (st.done + 1 < data.length && data[st.done + 1].time < open) {
                    ctx.evalSecurityBar(st.sub, data[++st.done], expression);
                }
                st.cp = st.sub.checkpoint();
                st.cpDone = st.done;
                st.cpBar = open;
            } else {
                st.sub.rollbackTo(st.cp);
                st.done = st.cpDone!;
            }
            const out = empty();
            evalInto(out, open);
            st.sig = sig;
            st.barTime = open;
            st.data = data;
            st.len = data.length;
            st.out = out;
            return copyOut(out, arity);
        }

        // The same chart bar again has the same intrabars, unless more of them
        // have arrived. Always a copy: the script owns what it is returned and may
        // change it.
        if (st.barTime === open && st.len === data.length) return copyOut(st.out, arity);

        // Intrabars found already for this chart bar stay; new ones are added.
        const out = st.barTime === open ? st.out : empty();
        evalInto(out, open);
        st.barTime = open;
        st.data = data;
        st.len = data.length;
        st.out = out;
        return copyOut(out, arity);
    },

    /**
     * `request.quandl(ticker, gaps, index)` — Nasdaq Data Link.
     *
     * TradingView removed this in 2023 and it remains in the v5 reference as
     * deprecated. Kept so a published script still compiles, and refused at run
     * time like the rest unless the host supplies the table.
     */
    quandl: (ctx: Context, ticker: any, _gaps: any, index: any = 0): number =>
        resolve(ctx, "quandl", [ticker, index]),

    /**
     * `request.currency_rate(from, to)` — the daily conversion rate.
     *
     * "Provides a daily rate that can be used to convert a value expressed in
     *  the `from` currency to another in the `to` currency."
     *
     * Identical currencies convert at 1 without needing any data, which is not
     * a special case so much as the definition — and it is the common one, since
     * `request.currency_rate(syminfo.currency, strategy.account_currency)` is
     * how a strategy asks whether conversion is needed at all.
     *
     * Anything else is host-supplied like the rest of this namespace: an
     * exchange rate is a fact about the world on a date, and guessing one would
     * misstate every position size computed from it.
     */
    currency_rate: (ctx: Context, from: any, to: any): number => {
        const a = String(val(from) ?? "");
        const b = String(val(to) ?? "");
        if (a !== "" && a === b) return 1;
        return resolve(ctx, "currency_rate", [a, b]);
    },

    /**
     * `request.economic(country_code, field, gaps)` — a macroeconomic series.
     *
     * "GDPQQ", "UNRATE", "CPIYY" and the rest, keyed by country. Host-supplied
     * like every other member of this namespace: there is no data here to fetch
     * it from, and inventing a plausible unemployment rate would be worse than
     * refusing to.
     */
    economic: (ctx: Context, country_code: any, field: any, _gaps?: any): number =>
        resolve(ctx, "economic", [country_code, field]),

    /**
     * `request.seed(source, symbol, expression, …)` — September 2023.
     *
     * "Requests data from a user-maintained GitHub repository and returns it as
     *  a series."
     *
     * The repository is `source` and the file is `symbol`. Nothing about it is
     * reachable from here, so it resolves through the same host-supplied table
     * as the rest — which is the honest shape for a function whose entire job
     * is to fetch something this engine cannot reach.
     */
    seed: (ctx: Context, source: any, symbol: any, _expression?: any, ..._rest: any[]): number =>
        resolve(ctx, "seed", [source, symbol]),
};

// ── The field and adjustment constants ──────────────────────────────────────
//
// Each names WHICH number a `request.*` call should return, or which price
// adjustment a ticker id should carry. They are plain string constants: this
// engine hands them straight back to `resolve` above, which looks the field up
// in whatever the host supplied.
//
// Their VALUES are the field keys the request functions already default to, so
// `request.dividends(id)` and `request.dividends(id, dividends.gross)` reach the
// same data — which is what TradingView documents, since `gross` IS the default.
//
// v5, like the rest of this file. The registry split in ./index.ts keeps them
// out of the v1–v4 views.

/** Which dividend figure `request.dividends` returns. */
export const dividends = {
    gross: "dividends_gross",
    net: "dividends_net",
    /**
     * The NEXT dividend: "na if the data is not available". This engine has
     * no corporate calendar, so it always is.
     * @getter
     */
    future_amount: (_ctx: Context): number => NaN,
    /** @getter */
    future_ex_date: (_ctx: Context): number => NaN,
    /** @getter */
    future_pay_date: (_ctx: Context): number => NaN,
};

/** Which half of the split ratio `request.splits` returns. */
export const splits = {
    numerator: "splits_numerator",
    denominator: "splits_denominator",
};

/** Which earnings figure `request.earnings` returns. */
export const earnings = {
    actual: "earnings_actual",
    estimate: "earnings_estimate",
    standardized: "earnings_standardized",
    /** The NEXT report, `na` without a corporate calendar. @getter */
    future_time: (_ctx: Context): number => NaN,
    /** @getter */
    future_eps: (_ctx: Context): number => NaN,
    /** @getter */
    future_revenue: (_ctx: Context): number => NaN,
    /** @getter */
    future_period_end_time: (_ctx: Context): number => NaN,
};

/**
 * Whether a futures ticker id's history is back-adjusted, and whether its
 * daily close is the settlement price — `ticker.new` / `ticker.modify`
 * arguments (v5, 2024). Carried like `adjustment`: one price series runs here.
 */
export const backadjustment = {
    inherit: "backadjustment_inherit",
    on: "backadjustment_on",
    off: "backadjustment_off",
};

export const settlement_as_close = {
    inherit: "settlement_as_close_inherit",
    on: "settlement_as_close_on",
    off: "settlement_as_close_off",
};

/**
 * Which corporate actions a ticker id's prices are adjusted for.
 *
 * Passed to `ticker.new` / `ticker.modify`. This engine runs one price series —
 * the bars it was handed — so the adjustment cannot change any number here; it
 * is carried so that a script naming it compiles and runs, and so a host that
 * does keep adjusted and unadjusted feeds can read it off the ticker id.
 */
export const adjustment = {
    none: "adjustment_none",
    splits: "adjustment_splits",
    dividends: "adjustment_dividends",
};
