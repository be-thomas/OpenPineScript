/**
 * Pine Script strings — the `str.*` namespace.
 *
 * v5 moved string handling into its own namespace: `tostring(x)` became
 * `str.tostring(value, format)` and `tonumber(x)` became `str.tonumber(string)`
 * (dev-docs/01-version-delta-spec.md §4a). The rest of the namespace —
 * `str.format`, `str.length`, `str.split` and friends — has no v1–v4 spelling
 * at all and exists only here.
 *
 * v5-only, which this file does NOT enforce: the registry split in ./index.ts
 * keeps the whole namespace out of the v1–v4 views, so a v4 script naming
 * `str.length` is refused there rather than by a check in every function.
 *
 * ── The number FORMAT is the load-bearing part ──────────────────────────────
 *
 * `str.tostring(value, format)` is how the golden-data harnesses get numbers
 * out of TradingView (see scripts/make-log-harness.ts): every column is emitted
 * as `str.tostring(v, "#.##########")`. If this formatter disagrees with
 * TradingView's, every golden comparison is measuring the formatter rather than
 * the indicator — so the digit rules below are implemented literally from
 * Pine's format-string grammar rather than approximated with toFixed.
 *
 *   '#'  an OPTIONAL digit — printed only when non-zero material remains
 *   '0'  a REQUIRED digit  — always printed, padded if necessary
 *
 * so "#.##" is up to two decimals with trailing zeros trimmed, "0.00" is
 * exactly two, and "#" is an integer. That trimming is why the harnesses can
 * ask for ten decimals without every row carrying ten characters of padding.
 */

import { val } from "../../../utils/v2/common";

/** Pine renders every flavour of "no value" as the string `NaN`. */
function isNa(v: any): boolean {
    return v === null || v === undefined || (typeof v === "number" && Number.isNaN(v));
}

/** The digit rules a Pine format string encodes, for one side of the dot. */
interface DigitSpec {
    /** Count of '0' — digits that must be printed even when they are zero. */
    readonly required: number;
    /** Count of '0' + '#' — the most digits that may be printed. */
    readonly maximum: number;
}

function digitsOf(section: string): DigitSpec {
    let required = 0, maximum = 0;
    for (const ch of section) {
        if (ch === "0") { required++; maximum++; }
        else if (ch === "#") { maximum++; }
    }
    return { required, maximum };
}

/**
 * Formats `n` under a Pine number-format string.
 *
 * Only the digit placeholders are honoured. Pine's format strings also admit
 * literal text, a grouping comma and a percent suffix; none of those appear in
 * any harness, and silently mis-rendering them would be worse than the plain
 * numeric result this returns.
 */
function formatNumber(n: number, format: string): string {
    if (!Number.isFinite(n)) return "NaN";

    const dot = format.indexOf(".");
    const fraction = dot === -1 ? { required: 0, maximum: 0 } : digitsOf(format.slice(dot + 1));
    const integer = digitsOf(dot === -1 ? format : format.slice(0, dot));

    // toFixed rounds half away from zero for the decimal cases that matter here
    // and, unlike a manual scale-and-round, does not lose precision on values
    // whose scaled form exceeds 2^53.
    let text = Math.abs(n).toFixed(fraction.maximum);

    let [whole, decimals = ""] = text.split(".");

    // Trim optional trailing zeros back to the required minimum.
    while (decimals.length > fraction.required && decimals.endsWith("0")) {
        decimals = decimals.slice(0, -1);
    }

    // Pad the integer side up to its required digits ("00" renders 7 as "07").
    while (whole.length < integer.required) whole = "0" + whole;

    const sign = n < 0 && Number(text) !== 0 ? "-" : "";
    return decimals.length > 0 ? `${sign}${whole}.${decimals}` : `${sign}${whole}`;
}

/**
 * The default rendering, used when no format is given.
 *
 * Pine prints a float with up to ten significant decimals and no trailing
 * zeros, which is what the default JavaScript conversion already does for every
 * value a chart produces. Booleans render as `true`/`false`, and `na` as `NaN`.
 */
function defaultString(v: any): string {
    if (isNa(v)) return "NaN";
    return String(v);
}

/**
 * Substitutes `{0}`, `{1}` … in a template.
 *
 * Pine's full form is `{index, type, format}` — `{0, number, #.##}`. The type
 * word is always `number` or `string` where it appears, and only the format
 * tail changes the output, so the type is parsed and ignored rather than
 * validated: rejecting an unfamiliar type word would fail scripts over a token
 * that cannot change the result.
 */
function format(template: any, args: any[]): string {
    const text = String(val(template));
    return text.replace(/\{(\d+)(?:\s*,\s*([^,}]+))?(?:\s*,\s*([^}]+))?\}/g,
        (whole, index: string, _type: string | undefined, fmt: string | undefined) => {
            const i = Number(index);
            if (i < 0 || i >= args.length) return whole;
            const v = val(args[i]);
            if (fmt !== undefined && typeof v === "number") return formatNumber(v, fmt.trim());
            return defaultString(v);
        });
}

const text = (x: any): string => String(val(x) ?? "");

export const str = {
    // --- Conversion --------------------------------------------------------

    /**
     * `str.tostring(value, format)` — v5's spelling of v1–v4's `tostring(x)`.
     *
     * The second argument is new in this spelling; without it the behaviour is
     * the inherited one, which is why the v1–v4 `tostring` entry is aliased to
     * this rather than kept as a separate implementation.
     */
    tostring: (value: any, format?: any): string => {
        const v = val(value);
        if (Array.isArray(v)) return `[${v.map(defaultString).join(", ")}]`;
        if (format === undefined || format === null) return defaultString(v);
        if (typeof v !== "number") return defaultString(v);
        return formatNumber(v, String(val(format)));
    },

    /** `str.tonumber(string)` — na (NaN) when the string is not a number. */
    tonumber: (string: any): number => {
        const v = val(string);
        if (isNa(v)) return NaN;
        if (typeof v === "number") return v;
        const trimmed = String(v).trim();
        if (trimmed === "") return NaN;
        const n = Number(trimmed);
        return Number.isNaN(n) ? NaN : n;
    },

    /** `str.format(formatString, arg0, arg1, …)`. */
    format: (formatString: any, ...args: any[]): string => format(formatString, args),

    // --- Inspection --------------------------------------------------------

    length: (string: any): number => text(string).length,
    contains: (source: any, str: any): boolean => text(source).includes(text(str)),
    startswith: (source: any, str: any): boolean => text(source).startsWith(text(str)),
    endswith: (source: any, str: any): boolean => text(source).endsWith(text(str)),

    /** Index of the first occurrence, or na — Pine returns na, not -1. */
    pos: (source: any, str: any): number => {
        const at = text(source).indexOf(text(str));
        return at === -1 ? NaN : at;
    },

    // --- Transformation ----------------------------------------------------

    /**
     * `str.substring(source, begin_pos, end_pos)`.
     *
     * `end_pos` is EXCLUSIVE and optional; omitting it runs to the end.
     */
    substring: (source: any, begin_pos: any, end_pos?: any): string => {
        const s = text(source);
        const from = Number(val(begin_pos)) || 0;
        if (end_pos === undefined || end_pos === null) return s.slice(from);
        return s.slice(from, Number(val(end_pos)));
    },

    replace_all: (source: any, target: any, replacement: any): string =>
        text(source).split(text(target)).join(text(replacement)),

    upper: (source: any): string => text(source).toUpperCase(),
    lower: (source: any): string => text(source).toLowerCase(),

    /** `str.split(string, separator)` — returns a Pine array of strings. */
    split: (string: any, separator: any): string[] => text(string).split(text(separator)),

    /** `str.repeat(string, repeat, separator)`. */
    repeat: (string: any, repeat: any, separator: any = ""): string => {
        const times = Math.max(0, Math.trunc(Number(val(repeat)) || 0));
        return new Array(times).fill(text(string)).join(text(separator));
    },

    /**
     * `str.match(source, regex)` — the first match, or an empty string.
     *
     * Pine documents this as a RE2 regular expression. JavaScript's engine is
     * not RE2, and the two disagree on backreferences and lookaround, which RE2
     * does not support at all. Patterns that stay inside the common subset
     * behave identically; anything relying on a JavaScript-only construct will
     * work here and fail on TradingView, which is the safe direction for a
     * feature no harness exercises.
     */
    match: (source: any, regex: any): string => {
        const found = text(source).match(new RegExp(text(regex)));
        return found ? found[0] : "";
    },
};
