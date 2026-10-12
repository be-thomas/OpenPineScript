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
 * out of TradingView (see scripts/common/make-log-harness.ts): every column is emitted
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
import { Context } from "../context";
import { FORMAT_PREFIX, format as formatConstants } from "./format";

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

// ─── Date-time patterns ─────────────────────────────────────────────────────
//
// `str.format_time` takes a Java `SimpleDateFormat` pattern. The subset below
// is the one TradingView's own examples use, and it is deliberately a SUBSET:
// an unrecognised letter run is copied through verbatim rather than dropped, so
// a pattern this engine does not understand shows up in the output instead of
// vanishing from it.

/** Day and month names, in the abbreviated and full forms `E`/`MMM` select. */
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
                     "July", "August", "September", "October", "November", "December"];

const pad = (n: number, width: number): string => String(Math.abs(n)).padStart(width, "0");

/**
 * The calendar fields of `ms` as seen from `timezone`.
 *
 * Read back out of `Intl.DateTimeFormat` rather than computed, because a named
 * zone means a rule set — daylight saving, historical offsets — that no fixed
 * offset can stand in for. An unknown zone falls back to UTC rather than
 * throwing: a bad timezone string should not take the whole script down.
 */
function zonedParts(ms: number, timezone?: string): {
  year: number; month: number; day: number;
  hour: number; minute: number; second: number; weekday: number; offset: number;
} {
  const zone = timezone && timezone.toUpperCase() !== "UTC" ? timezone : "UTC";
  let local: Date;
  try {
    // The trick: format the instant in `zone` with an ISO-ish layout, then read
    // it back as if it were UTC. The difference from the original instant IS
    // the zone's offset at that moment.
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: zone, hour12: false,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    }).formatToParts(new Date(ms));
    const get = (t: string) => Number(parts.find(p => p.type === t)?.value ?? 0);
    // `hour12: false` renders midnight as 24 in some ICU versions.
    const hour = get("hour") % 24;
    local = new Date(Date.UTC(get("year"), get("month") - 1, get("day"), hour, get("minute"), get("second")));
  } catch {
    local = new Date(ms);
  }
  return {
    year: local.getUTCFullYear(), month: local.getUTCMonth() + 1, day: local.getUTCDate(),
    hour: local.getUTCHours(), minute: local.getUTCMinutes(), second: local.getUTCSeconds(),
    weekday: local.getUTCDay(),
    offset: Math.round((local.getTime() - ms) / 60000),
  };
}

/** One run of the same pattern letter, rendered. */
function patternField(letter: string, count: number, p: ReturnType<typeof zonedParts>): string | null {
  switch (letter) {
    case "y": return count === 2 ? pad(p.year % 100, 2) : pad(p.year, count);
    case "M": return count >= 4 ? MONTH_NAMES[p.month - 1]
                 : count === 3 ? MONTH_NAMES[p.month - 1].slice(0, 3)
                 : pad(p.month, count);
    case "d": return pad(p.day, count);
    case "H": return pad(p.hour, count);
    case "h": return pad(p.hour % 12 === 0 ? 12 : p.hour % 12, count);
    case "m": return pad(p.minute, count);
    case "s": return pad(p.second, count);
    case "S": return pad(0, count);                       // sub-second: bars have none
    case "E": return count >= 4 ? DAY_NAMES[p.weekday] : DAY_NAMES[p.weekday].slice(0, 3);
    case "a": return p.hour < 12 ? "AM" : "PM";
    case "Z": {
      const sign = p.offset < 0 ? "-" : "+";
      return `${sign}${pad(Math.trunc(Math.abs(p.offset) / 60), 2)}${pad(Math.abs(p.offset) % 60, 2)}`;
    }
    default: return null;                                  // copied through verbatim
  }
}

function formatTime(ms: number, format: string, timezone?: string): string {
  if (!Number.isFinite(ms)) return "NaN";
  const p = zonedParts(ms, timezone);

  let out = "";
  for (let i = 0; i < format.length; ) {
    const ch = format[i];

    // A quoted run is literal — `'T'` is the letter T, not a year field — and
    // `''` inside one is a single apostrophe.
    if (ch === "'") {
      if (format[i + 1] === "'") { out += "'"; i += 2; continue; }
      const end = format.indexOf("'", i + 1);
      if (end === -1) { out += format.slice(i + 1); break; }
      out += format.slice(i + 1, end);
      i = end + 1;
      continue;
    }

    let count = 1;
    while (format[i + count] === ch) count++;
    const rendered = /[A-Za-z]/.test(ch) ? patternField(ch, count, p) : null;
    out += rendered ?? format.slice(i, i + count);
    i += count;
  }
  return out;
}

export const str = {
    // --- Conversion --------------------------------------------------------

    /**
     * `str.tostring(value, format)` — v5's spelling of v1–v4's `tostring(x)`.
     *
     * The second argument is new in this spelling. The v1–v4 flat `tostring`
     * keeps its own one-argument implementation in ./core.ts — `str.tostring`
     * is a rename for DIAGNOSTIC purposes only, and ./index.ts is careful not
     * to let the rename table overwrite this entry with it.
     *
     * ── The format is EITHER a format string or a `format.*` constant ────────
     *
     * "use str.tostring(myValue, format.mintick) to first round the number to
     *  tick precision and then return its string representation."
     *
     * `format.mintick` needs the instrument's tick size, which is why this is
     * the one `str.*` member that takes a Context. The other `format.*`
     * constants describe how a value appears on the PRICE AXIS and in the Data
     * Window — neither of which exists here — so they are recognised and then
     * render the value plainly, rather than being fed to the number-format
     * parser, where "format.volume" would be read as a mask with no digit
     * placeholders and produce an empty string.
     */
    tostring: (ctx: Context, value: any, format?: any): string => {
        const v = val(value);

        // An ENUM MEMBER renders as its TITLE, and the manual is emphatic that
        // this is the only way to get one: "Calling the str.tostring() function
        // on an enum field is the ONLY way to retrieve its title for additional
        // calculations."
        //
        // Checked before everything else because a member IS a string —
        // `"OscType.rsi"` — so every path below would happily return the
        // internal spelling instead. See `Context.declareEnum` for why members
        // are strings.
        const title = ctx?.enumTitle?.(v);
        if (title !== undefined) return title;

        if (Array.isArray(v)) return `[${v.map(defaultString).join(", ")}]`;
        if (format === undefined || format === null) return defaultString(v);
        if (typeof v !== "number") return defaultString(v);

        const spec = String(val(format));
        if (spec.startsWith(FORMAT_PREFIX)) {
            if (spec !== formatConstants.mintick) return defaultString(v);
            const tick = Number(ctx.mintick);
            if (!Number.isFinite(tick) || tick <= 0) return defaultString(v);
            return defaultString(Math.round(v / tick) * tick);
        }

        return formatNumber(v, spec);
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

    /**
     * `str.replace(source, target, replacement, occurrence)` — ONE occurrence.
     *
     * The sibling of `replace_all`, and the difference is the fourth argument:
     * `occurrence` is a zero-based index selecting WHICH match to replace, and
     * defaults to 0 — the first. An index past the last match leaves the string
     * alone, which is the same answer as "there was nothing to replace".
     */
    replace: (source: any, target: any, replacement: any, occurrence: any = 0): string => {
        const s = text(source);
        const find = text(target);
        const nth = Math.trunc(Number(val(occurrence)) || 0);
        if (find === "" || nth < 0) return s;

        let at = -1;
        for (let seen = 0; seen <= nth; seen++) {
            at = s.indexOf(find, at + (seen === 0 ? 0 : 1));
            if (at === -1) return s;
        }
        return s.slice(0, at) + text(replacement) + s.slice(at + find.length);
    },

    /** `str.trim(string)` — leading and trailing whitespace removed. */
    trim: (string: any): string => text(string).trim(),

    /**
     * `str.format_time(time, format, timezone)` — October 2022.
     *
     * "Converts a timestamp to a formatted string using the specified format
     *  and time zone."
     *
     * The format is a Java `SimpleDateFormat` pattern, which is what
     * TradingView's own examples pass — "yyyy-MM-dd", "HH:mm:ss",
     * "yyyy-MM-dd'T'HH:mm:ss". The subset implemented is the one those patterns
     * use, and an unrecognised letter run is left as written rather than
     * silently dropped: a pattern this engine does not understand should be
     * visible in the output, not invisible.
     *
     * Quoted runs are literal — `'T'` is the letter T and not a year field —
     * because a date-time pattern without that rule cannot express ISO 8601,
     * which is the commonest thing anyone formats.
     */
    format_time: (ctx: Context, time: any, format: any = "yyyy-MM-dd'T'HH:mm:ssZ",
                  timezone?: any): string =>
        formatTime(Number(val(time)), text(format), timezone == null ? undefined : text(timezone)),

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
