/**
 * `syminfo.*` — what a script can ask about its instrument.
 *
 * The namespace arrived at v4 (§3a of the migration guide), which moved the
 * v1–v3 flat `ticker` and `tickerid` into it. Those two already live in
 * ./chart.ts and ./ui.ts and are aliased by the rename table; this file adds the
 * TEN members that have no earlier spelling.
 *
 * Descriptions are quoted from the manual's Chart information page:
 *
 *   basecurrency  "a string representing the instrument's base currency if the
 *                  current symbol refers to a Forex pair, a cryptocurrency
 *                  pair, or a derivative instrument based on a currency pair"
 *   currency      "the currency of the instrument's quoted prices, or "NONE"
 *                  if the dataset's values do not represent currency amounts"
 *   description   "the description or extended name of the current instrument"
 *   mintick       "the dataset's minimum tick size, i.e., the smallest
 *                  increment by which the instrument's recorded prices change"
 *   pointvalue    "the instrument's point value, which represents a multiplier
 *                  of the instrument's price for determining the value of a
 *                  single contract"
 *   prefix        "the symbol's broker/exchange identifier"
 *   root          "the instrument's root code if the symbol refers to a futures
 *                  contract ... Otherwise, it stores the same value as
 *                  syminfo.ticker"
 *   session       "the dataset's session setting"
 *   timezone      "the dataset's exchange time zone in the IANA time zone
 *                  database format"
 *   type          "the instrument's type. Possible values include "stock",
 *                  "futures", "index", "forex", "crypto", "fund", "dr", "cfd",
 *                  "bond", "warrant", "structured", and "right""
 *
 * ── Why every one of these is a getter over the Context ─────────────────────
 *
 * None is derivable from a bar. A CSV of prices does not record which exchange
 * listed them or what currency they are in, so the HOST declares them — see
 * `Context.provideSymbolInfo`, which also states each default.
 *
 * ── Why the absence of these was worse than an error ────────────────────────
 *
 * `syminfo` is a namespace the engine already had, and the emitter's namespace
 * check asks only whether the ROOT exists — deliberately, since asserting
 * registry completeness would reject a script for a member the engine simply
 * has not got round to. So `syminfo.mintick` compiled, read `undefined`, and
 * arithmetic on it produced `NaN` on every bar with no diagnostic anywhere.
 * Twelve of TradingView's own v5 examples use it.
 *
 * v4+, which this file does not enforce: the registry split in ./index.ts keeps
 * the namespace out of the v1–v3 view.
 */
import { Context } from "../context";

/** The half of `EXCHANGE:SYMBOL` before the colon, or "" when there is none. */
function splitTickerId(tickerid: string): { prefix: string; ticker: string } {
    const colon = tickerid.indexOf(":");
    return colon < 0
        ? { prefix: "", ticker: tickerid }
        : { prefix: tickerid.slice(0, colon), ticker: tickerid.slice(colon + 1) };
}

export const syminfo = {
    /**
     * The dataset's symbol WITHOUT the exchange prefix — "AAPL".
     *
     * v4's spelling of the v1–v3 `ticker` variable, and implemented here rather
     * than aliased to it so that it stays a sibling of `prefix`: the two are one
     * split of one string.
     * @getter
     */
    ticker: (ctx: Context): string => splitTickerId(String(ctx.symbol)).ticker,

    /**
     * The full ticker identifier — "NASDAQ:AAPL".
     *
     * ── The conflation this ends ────────────────────────────────────────────
     *
     * Pine keeps FUNCTIONS and VARIABLES in separate namespaces, so v1–v4 spell
     * two different things `tickerid`:
     *
     *   tickerid                    the current chart's ticker id  (a VARIABLE)
     *   tickerid(prefix, ticker)    builds one from its parts      (a FUNCTION)
     *
     * v4 renamed only the variable — "The `ticker` and `tickerid` variables are
     * renamed to `syminfo.ticker` and `syminfo.tickerid` respectively" — and v5
     * renamed only the function, to `ticker.new`. This engine has one registry
     * key per name, so it had aliased `syminfo.tickerid` to the FUNCTION: 89
     * uses across TradingView's own v5 examples each read a function object
     * instead of a string, silently.
     * @getter
     */
    tickerid: (ctx: Context): string => String(ctx.symbol),

    /**
     * The instrument's base currency — the LEFT half of a pair.
     * @getter
     */
    basecurrency: (ctx: Context): string => ctx.basecurrency,

    /**
     * The currency the instrument's prices are quoted in.
     * @getter
     */
    currency: (ctx: Context): string => ctx.currency,

    /**
     * The instrument's description or extended name.
     * @getter
     */
    description: (ctx: Context): string => ctx.description,

    /**
     * The smallest increment by which prices change.
     * @getter
     */
    mintick: (ctx: Context): number => ctx.mintick,

    /**
     * The price multiplier for one contract.
     * @getter
     */
    pointvalue: (ctx: Context): number => ctx.pointvalue,

    /**
     * The broker/exchange identifier — "NASDAQ" for "NASDAQ:AAPL".
     *
     * DERIVED from the ticker id rather than stored, so the two cannot
     * disagree: they are two readings of one string.
     * @getter
     */
    prefix: (ctx: Context): string => splitTickerId(String(ctx.symbol)).prefix,

    /**
     * The futures root code, or the plain ticker when the symbol is not one.
     *
     * The fallback is the manual's, not a convenience: "Otherwise, it stores
     * the same value as syminfo.ticker."
     * @getter
     */
    root: (ctx: Context): string =>
        ctx.symbolRoot || splitTickerId(String(ctx.symbol)).ticker,

    /**
     * The dataset's session setting — "regular" or "extended".
     * @getter
     */
    session: (ctx: Context): string => ctx.sessionSpec,

    /**
     * The exchange time zone, in IANA format.
     *
     * ⚠ This engine does not SHIFT anything by it. ./time.ts evaluates every
     * calendar value in UTC and states the same divergence: a host that wants
     * agreement supplies bar timestamps already shifted. Reporting the zone
     * while ignoring it would be worse than reporting nothing, so it is said
     * here too.
     * @getter
     */
    timezone: (ctx: Context): string => ctx.timezone,

    /**
     * The instrument's type — "stock", "futures", "crypto", "forex", …
     * @getter
     */
    type: (ctx: Context): string => ctx.symbolType,
};
