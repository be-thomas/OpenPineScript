/**
 * Unwraps a Series (or anything with a valueOf) to a primitive number.
 *
 * Here rather than in stdlib/strategy.ts, where it used to live as a private
 * helper: the broker needs it too, and EVERY export of a stdlib module is
 * published as a Pine built-in by scripts/common/generate-metadata.ts. Exported
 * from there, it became `strategy.val(x)` — callable from a script.
 */
export function val(x: any): number {
    return (x !== null && x !== undefined && typeof x.valueOf === 'function') ? Number(x.valueOf()) : Number(x);
}

/**
 * Unwraps a Series (or any wrapper with a valueOf) to a primitive string; `na`
 * is the empty string.
 *
 * Every id, comment and alert message the broker records goes through here
 * first. A `string` variable reaches a strategy call as its Series, which holds
 * the whole runtime (`ctx.__sandbox`); stored as is, it made the result
 * impossible to `postMessage`.
 */
export function text(x: any): string {
    if (x === null || x === undefined) return "";
    const v = typeof x === "object" && typeof x.valueOf === "function" ? x.valueOf() : x;
    if (v === null || v === undefined || (typeof v === "number" && Number.isNaN(v))) return "";
    return String(v);
}

/**
 * A strategy call's direction as the broker spells it.
 *
 * v1-v4 name the argument `long` and it is a bool: "true for buy, false for
 * sell". From v5 it is `direction`, which is `strategy.long` or
 * `strategy.short` -- here the strings "long" and "short". Both reach the same
 * parameter, so a bool is mapped and anything else is passed through as text.
 */
export function directionOf(x: any): string {
    const v = x !== null && x !== undefined && typeof x === "object" && typeof x.valueOf === "function" ? x.valueOf() : x;
    if (typeof v === "boolean") return v ? "long" : "short";
    // A number is the bool Pine converts it to: non-zero is true, 0 (and na) false.
    if (typeof v === "number") return Number.isFinite(v) && v !== 0 ? "long" : "short";
    return text(v);
}
