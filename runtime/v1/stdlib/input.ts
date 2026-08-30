import { Context } from "../context";

/**
 * Pine Script input() function
 * @returns series float (or int/bool depending on type)
 */
export function input(
    ctx: Context, defval: any, title?: any, type?: any,
    // The rest of the v1–v4 signature: `input(defval, title, type, minval,
    // maxval, confirm, step, options, tooltip, inline, group)`. Every one was
    // being dropped — `minval` alone on seventeen of TradingView's own examples
    // — because the parameter did not exist to match the keyword against.
    minval?: any, maxval?: any, confirm?: any, step?: any, options?: any,
    tooltip?: any, inline?: any, group?: any, display?: any,
) {
    // Unwrap Series values if they are passed as titles/types (though usually they are literals)
    const unwrap = (x: any) => (x && typeof x.valueOf === 'function') ? x.valueOf() : x;
    const safeDefval = unwrap(defval);
    const safeTitle = (title && typeof title.valueOf === 'function') ? title.valueOf() : (title || "");
    const safeType = (type && typeof type.valueOf === 'function') ? type.valueOf() : "float";

    const meta: Record<string, any> = { defval: safeDefval };
    const declared = { minval, maxval, confirm, step, options, tooltip, inline, group, display };
    for (const [k, v] of Object.entries(declared)) if (v !== undefined) meta[k] = unwrap(v);

    return ctx.registerInput(safeDefval, safeTitle, safeType, meta);
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
