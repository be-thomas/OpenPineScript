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
function resolve(ctx: Context, kind: string, parts: readonly any[]): number {
    const key = requestKey(parts);
    const samples = ctx.getRequestData(kind, key);

    if (!samples) {
        throw new Error(
            `request.${kind}: no data was supplied for '${key}'. OpenPineScript ` +
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
    financial: (ctx: Context, symbol: any, financial_id: any, period: any, _gaps?: any): number =>
        resolve(ctx, "financial", [symbol, financial_id, period]),

    /** `request.dividends(ticker, field, …)` — field defaults to gross dividends. */
    dividends: (ctx: Context, ticker: any, field: any = "dividends_gross", ..._rest: any[]): number =>
        resolve(ctx, "dividends", [ticker, field]),

    splits: (ctx: Context, ticker: any, field: any = "splits_numerator", ..._rest: any[]): number =>
        resolve(ctx, "splits", [ticker, field]),

    earnings: (ctx: Context, ticker: any, field: any = "earnings_actual", ..._rest: any[]): number =>
        resolve(ctx, "earnings", [ticker, field]),

    /**
     * `request.quandl(ticker, gaps, index)` — Nasdaq Data Link.
     *
     * TradingView removed this in 2023 and it remains in the v5 reference as
     * deprecated. Kept so a published script still compiles, and refused at run
     * time like the rest unless the host supplies the table.
     */
    quandl: (ctx: Context, ticker: any, _gaps: any, index: any = 0): number =>
        resolve(ctx, "quandl", [ticker, index]),
};
