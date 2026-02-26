import { Context } from "../context";

/**
 * Pine Script input() function
 * @returns series float (or int/bool depending on type)
 */
export function input(ctx: Context, defval: any, title?: any, type?: any) {
    // Unwrap Series values if they are passed as titles/types (though usually they are literals)
    const safeDefval = (defval && typeof defval.valueOf === 'function') ? defval.valueOf() : defval;
    const safeTitle = (title && typeof title.valueOf === 'function') ? title.valueOf() : (title || "");
    const safeType = (type && typeof type.valueOf === 'function') ? type.valueOf() : "float";

    return ctx.registerInput(safeDefval, safeTitle, safeType);
}
