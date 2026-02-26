import { Context } from "../context";

export const __IS_NAMESPACE__ = true;

/**
 * Returns true if the current bar is a historical bar.
 * @getter
 */
export function ishistory(ctx: Context): boolean {
    return ctx.is_history;
}

/**
 * Returns true if the current bar is a real-time bar.
 * @getter
 */
export function isrealtime(ctx: Context): boolean {
    return ctx.is_realtime;
}

/**
 * Returns true if this is the first execution on the current bar.
 * @getter
 */
export function isnew(ctx: Context): boolean {
    return ctx.is_new;
}

/**
 * Returns true if this is the last historically available bar.
 * @getter
 */
export function islast(ctx: Context): boolean {
    return ctx.is_last;
}
