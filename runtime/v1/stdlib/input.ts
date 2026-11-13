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
    // v6, July 2025: `active` on every input*() — false greys the control
    // out. Host-UI metadata like `tooltip`; gated to v6 by V6_ONLY_PARAMS.
    active?: any,
) {
    // Unwrap Series values if they are passed as titles/types (though usually they are literals)
    const unwrap = (x: any) => (x && typeof x.valueOf === 'function') ? x.valueOf() : x;
    const safeDefval = unwrap(defval);
    const safeTitle = (title && typeof title.valueOf === 'function') ? title.valueOf() : (title || "");
    const safeType = (type && typeof type.valueOf === 'function') ? type.valueOf() : "float";

    const meta: Record<string, any> = { defval: safeDefval };
    if (minval !== undefined) meta.minval = unwrap(minval);
    if (maxval !== undefined) meta.maxval = unwrap(maxval);
    if (confirm !== undefined) meta.confirm = unwrap(confirm);
    if (step !== undefined) meta.step = unwrap(step);
    if (options !== undefined) meta.options = unwrap(options);
    if (tooltip !== undefined) meta.tooltip = unwrap(tooltip);
    if (inline !== undefined) meta.inline = unwrap(inline);
    if (group !== undefined) meta.group = unwrap(group);
    if (display !== undefined) meta.display = unwrap(display);
    if (active !== undefined) meta.active = unwrap(active);

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
