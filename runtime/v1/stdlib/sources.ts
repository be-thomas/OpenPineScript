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
