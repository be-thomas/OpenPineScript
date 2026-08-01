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

// --- Input type constants (v1-v3) ---
//
// Pine v1-v3 spell these as bare globals: `input(14, type=integer)`.
// v4 moved them into the `input.*` namespace and v5 replaced them with typed
// functions (`input.int()`), so these are correct for v1-v3 only.
//
// Their VALUE is the type name, which is what Context.registerInput records.
export const integer = "integer";
export const float = "float";
export const bool = "bool";
export const string = "string";
export const source = "source";
export const resolution = "resolution";
export const session = "session";
export const symbol = "symbol";
