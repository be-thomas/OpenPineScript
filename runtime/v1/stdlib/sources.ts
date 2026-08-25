import { Context } from "../context";

/**
 * Derived price sources. Pine spells these as bare globals that recompute each
 * bar, so they are getters rather than values.
 */

/** (high + low) / 2 @getter */
export function hl2(ctx: Context): number {
    return (ctx.high + ctx.low) / 2;
}

/** (high + low + close) / 3 @getter */
export function hlc3(ctx: Context): number {
    return (ctx.high + ctx.low + ctx.close) / 3;
}

/** (open + high + low + close) / 4 @getter */
export function ohlc4(ctx: Context): number {
    return (ctx.open + ctx.high + ctx.low + ctx.close) / 4;
}

/**
 * `hlcc4` — (high + low + close + close) / 4.
 *
 * Added alongside `last_bar_index` and `last_bar_time` in the same v5 release:
 * "New built-in source variable: hlcc4 - A shortcut for (high + low + close +
 * close)/4. It averages the high and low values with the double-weighted
 * close." Gated to v5 with the rest of that batch.
 *
 * Source: https://www.tradingview.com/pine-script-docs/v5/release-notes/
 * @getter
 * @returns {series float} The double-weighted close average.
 */
export function hlcc4(ctx: Context): number {
  return (ctx.high + ctx.low + ctx.close + ctx.close) / 4;
}
