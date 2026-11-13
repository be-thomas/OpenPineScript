/**
 * Built-ins that arrived with v6, or in the monthly releases after it, and
 * that have no implementation to inherit.
 *
 * Declared as object literals for the reason ./late_members.ts gives: each
 * joins a namespace that is older than it (`plot`, `syminfo`, `timeframe`),
 * and the generator turns an object literal straight into dotted keys that
 * `createStdlib` merges onto the namespace of the same name.
 *
 * Every name here is listed in V6_ONLY_NAMES (./renames6.ts), which keeps it
 * out of every earlier version's view — the runtime is one implementation, and
 * the views are what make a name a v6 name.
 *
 * Sources, by month: https://www.tradingview.com/pine-script-docs/release-notes/
 */
import { Context } from "../context";
import { period } from "./chart";

/** September 2025: `plot()`'s `linestyle` — "affects only style values that draw lines". */
export const plot = {
    linestyle_solid: "solid",
    linestyle_dashed: "dashed",
    linestyle_dotted: "dotted",
};

export const syminfo = {
    /**
     * November 2024: "the smallest number of contracts, shares, lots, or units
     * the exchange allows for trading the symbol". Host-declared, like the rest
     * of `syminfo` — see Context.provideSymbolInfo.
     * @getter
     */
    mincontract: (ctx: Context): number => ctx.mincontract,

    /**
     * November 2024: "the ticker ID of the script's main context, even inside
     * a request.*() expression". A requested expression runs in a sub-context
     * that reports the REQUESTED symbol; `main` is the chart's context.
     * @getter
     */
    main_tickerid: (ctx: Context): string => String((ctx.main ?? ctx).symbol),

    /**
     * November 2025: the 12-character ISIN, "or an empty string if none is
     * available". Host-declared.
     * @getter
     */
    isin: (ctx: Context): string => ctx.isin,

    /**
     * July 2025: for a continuous futures symbol, "the ticker ID of the
     * underlying contract. Otherwise returns na." Host-declared.
     * @getter
     */
    current_contract: (ctx: Context): any => ctx.currentContract ?? NaN,
};

export const timeframe = {
    /**
     * November 2024: "the timeframe of the script's main context, even inside
     * a request.*() expression" — the chart's period, multiplier and all.
     * @getter
     */
    main_period: (ctx: Context): string => period(ctx.main ?? ctx),
};

/**
 * February 2025: "bid is the highest price a buyer will pay now; ask is the
 * lowest price a seller will accept now. Both are available only on the "1T"
 * timeframe and are na elsewhere." A quote is not in an OHLCV bar, so the host
 * supplies it — Context.provideQuote.
 * @getter
 */
export function bid(ctx: Context): number {
    return String(ctx.resolution) === "1T" ? ctx.bid : NaN;
}

/** @getter */
export function ask(ctx: Context): number {
    return String(ctx.resolution) === "1T" ? ctx.ask : NaN;
}
