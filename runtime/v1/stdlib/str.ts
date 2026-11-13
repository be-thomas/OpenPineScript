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
import { CONST_DEFAULT } from "../constDefault";

/** Pine renders every flavour of "no value" as the string `NaN`. */
function isNa(v: any): boolean {
    return v === null || v === undefined || (typeof v === "number" && Number.isNaN(v));
}

/**
 * Formats `n` under a Pine number-format string (Java `DecimalFormat` style).
 *
 *   '0' a REQUIRED digit, '#' an OPTIONAL digit, ',' grouping, '.' the point,
 *   '%' multiplies by 100 and is printed, ';' separates the positive pattern
 *   from the negative one, any other character is a literal.
 *
 * Rounding is HALF-UP on the shortest decimal representation of the number
 * (what TradingView prints), not on its binary value: 1.005 with "0.00" is
 * "1.01", where toFixed would say "1.00".
 */
function formatNumber(n: number, format: string): string {
    if (!Number.isFinite(n)) return "NaN";

    const semi = format.indexOf(";");
    const positive = semi === -1 ? format : format.slice(0, semi);
    const negative = semi === -1 ? undefined : format.slice(semi + 1);

    // Digits of |n| as a decimal string, from the shortest round-trip form.
    const [mantissa, exponent] = Math.abs(n).toExponential().split("e");
    const digits = mantissa.replace(".", "");
    const percentOf = (p: string) => p.includes("%");

    const render = (pattern: string, forceMinus: boolean): string => {
        const start = pattern.search(/[0#,.]/);
        const prefix = start === -1 ? pattern : pattern.slice(0, start);
        let end = start === -1 ? pattern.length : start;
        while (end < pattern.length && /[0#,.]/.test(pattern[end])) end++;
        const core = start === -1 ? "" : pattern.slice(start, end);
        const suffix = pattern.slice(end);

        const dot = core.indexOf(".");
        const intSpec = dot === -1 ? core : core.slice(0, dot);
        const fracSpec = dot === -1 ? "" : core.slice(dot + 1);
        const minInt = (intSpec.match(/0/g) ?? []).length;
        const minFrac = (fracSpec.match(/0/g) ?? []).length;
        const maxFrac = (fracSpec.match(/[0#]/g) ?? []).length;
        const comma = intSpec.lastIndexOf(",");
        const group = comma === -1 ? 0 : intSpec.length - comma - 1;

        // Place the decimal point: `digits` is d.ddd × 10^exponent.
        const pointAt = Number(exponent) + 1 + (percentOf(prefix + suffix) ? 2 : 0);
        let whole = pointAt > 0 ? digits.slice(0, pointAt).padEnd(pointAt, "0") : "";
        let frac = pointAt >= digits.length ? "" : (pointAt >= 0 ? digits.slice(pointAt) : "0".repeat(-pointAt) + digits);

        if (frac.length > maxFrac) {
            const up = frac[maxFrac] >= "5";
            const kept = whole + frac.slice(0, maxFrac);
            let next = kept;
            if (up) next = (BigInt(kept === "" ? "0" : kept) + 1n).toString().padStart(kept.length, "0");
            const wholeLen = next.length - maxFrac;
            whole = next.slice(0, wholeLen);
            frac = next.slice(wholeLen);
        }
        while (frac.length > minFrac && frac.endsWith("0")) frac = frac.slice(0, -1);
        frac = frac.padEnd(minFrac, "0");
        whole = whole.replace(/^0+/, "");
        while (whole.length < minInt) whole = "0" + whole;
        // Java prints the integer 0 when no fraction digit is required.
        if (whole === "" && minFrac === 0) whole = "0";

        if (group > 0) {
            let grouped = "";
            for (let i = 0; i < whole.length; i++) {
                if (i > 0 && (whole.length - i) % group === 0) grouped += ",";
                grouped += whole[i];
            }
            whole = grouped;
        }

        const literal = (t: string) => t.replace(/'/g, "");
        const body = frac.length > 0 ? `${whole}.${frac}` : whole;
        const zero = !/[1-9]/.test(whole + frac);
        const sign = forceMinus && !zero ? "-" : "";
        return `${sign}${literal(prefix)}${body}${literal(suffix)}`;
    };

    if (n < 0 && negative !== undefined) {
        const text = render(negative, false);
        return /[1-9]/.test(text.replace(/[^0-9]/g, "")) ? text : render(positive, false);
    }
    return render(positive, n < 0);
}

/** Decimal places in a tick size such as 0.0001 or 5e-7. */
function decimalsOf(tick: number): number {
    const [m, e = "0"] = tick.toExponential().split("e");
    const mantissaDecimals = (m.split(".")[1] ?? "").length;
    return Math.max(0, mantissaDecimals - Number(e));
}

/** `format.volume`: integers below 1000, otherwise K/M/B/T with up to 3 decimals. */
function formatVolume(v: number): string {
    if (!Number.isFinite(v)) return "NaN";
    const abs = Math.abs(v);
    if (abs < 1000) return formatNumber(v, "#");
    const units: Array<[number, string]> = [[1e12, "T"], [1e9, "B"], [1e6, "M"], [1e3, "K"]];
    const [scale, suffix] = units.find(([s]) => abs >= s)!;
    return formatNumber(v / scale, "#.###") + suffix;
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
 * `str.tostring(x)` for a number, as TradingView prints it with no format
 * (dev-docs/tv-parity/_probes/version-scope: v5-tostring-consts,
 * v5-tostring-series, v6-tostring-bounds, v6-tostring-bounds2,
 * v4-tostring-default).
 *
 * A NON-constant float (a series, an input, `syminfo.*`), in every version from
 * v4: ten decimals, rounded, trailing zeros dropped — `0.3` for `0.1 + 0.2`,
 * `0` at or below 5e-11 in magnitude. From 1e21 up it is JavaScript's own
 * exponent form with an upper-case `E`: `1E21`.
 *
 * A constant (literal, constant expression, `math.pi`, a global bound to one):
 * v4 and v5 print the full double — `0.30000000000000004`, `1e-7`, `1e+21`. v6
 * prints what it prints for a series, except that from 1e21 up the exponent is
 * lower-case: `1e+21`.
 */
function numberToString(v: number, version: number, isConst: boolean): string {
    if (Number.isNaN(v)) return "NaN";
    if (isConst && version < 6) return String(v);
    if (!Number.isFinite(v)) return String(v);
    const abs = Math.abs(v);
    if (abs >= 1e21) {
        const text = String(v);
        return isConst ? text : text.replace("e+", "E");
    }
    if (abs <= 5e-11) return "0";
    const fixed = v.toFixed(10);
    const trimmed = fixed.includes(".") ? fixed.replace(/0+$/, "").replace(/\.$/, "") : fixed;
    return trimmed === "-0" ? "0" : trimmed;
}

/**
 * A number in a `{n}` placeholder with no format spec, as TradingView prints it
 * (probes v5/v6-str-format-numbers): Java `DecimalFormat("#,##0.###")` with
 * HALF_EVEN rounding applied to the EXACT binary value, so `0.0025` (a hair
 * above the tie) gives `0.003` and `1.0625` (an exact tie) gives `1.062`. The
 * sign survives rounding to zero (`-0`), and large values keep every integer
 * digit (`1e21` is `1,000,000,000,000,000,000,000`).
 *
 * One probed exception to the exact rule: `-0.0005`, whose binary value is a
 * hair above the tie at the first decimal place, prints `-0`, not `-0.001`
 * (the shortest decimal `5e-4` is treated as the tie and rounds to even). Only
 * that value is known; neighbours such as 0.00051 round up as the rule says.
 *
 * Done on the double's mantissa and exponent as BigInts, so nothing rounds twice.
 */
function defaultNumberFormat(v: number): string {
    if (Number.isNaN(v)) return "NaN";
    if (!Number.isFinite(v)) return String(v);
    const buf = new DataView(new ArrayBuffer(8));
    buf.setFloat64(0, Math.abs(v));
    const bits = buf.getBigUint64(0);
    const rawExp = Number((bits >> 52n) & 0x7ffn);
    const frac = bits & ((1n << 52n) - 1n);
    const mant = rawExp === 0 ? frac : frac | (1n << 52n);
    const exp = (rawExp === 0 ? 1 : rawExp) - 1075;          // |v| = mant * 2^exp
    // thousandths = |v| * 1000, rounded half-even to an integer
    let num = mant * 1000n;
    let thousandths: bigint;
    if (exp >= 0) {
        thousandths = num << BigInt(exp);
    } else {
        const shift = BigInt(-exp);
        const q = num >> shift;
        const rem = num - (q << shift);
        const half = 1n << (shift - 1n);
        thousandths = rem > half || (rem === half && (q & 1n) === 1n) ? q + 1n : q;
    }
    if (Math.abs(v) === 0.0005) thousandths = 0n;
    const whole = (thousandths / 1000n).toString().replace(/\B(?=(\d{3})+$)/g, ",");
    const decimals = (thousandths % 1000n).toString().padStart(3, "0").replace(/0+$/, "");
    return (v < 0 ? "-" : "") + whole + (decimals ? "." + decimals : "");
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
            if (typeof v === "number") return defaultNumberFormat(v);
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
        const isConst = format === CONST_DEFAULT;
        if (format === undefined || format === null || isConst) {
            const version = ctx?.profile?.version;
            // v1–v3 were never probed: their one-argument `tostring` is
            // ./core.ts's, and anything that reaches here without a version
            // keeps the plain rendering too.
            if (typeof v !== "number" || version === undefined || version < 4) return defaultString(v);
            return numberToString(v, version, isConst);
        }
        if (typeof v !== "number") return defaultString(v);

        const spec = String(val(format));
        if (spec.startsWith(FORMAT_PREFIX)) {
            // On TradingView only mintick, volume and percent are special; the
            // other constants are plain pattern strings with no digit
            // placeholders ("price", "inherit"), so the number is rounded to an
            // integer and appended to the literal.
            switch (spec) {
                case formatConstants.mintick: {
                    const tick = Number(ctx.mintick);
                    if (!Number.isFinite(tick) || tick <= 0) return defaultString(v);
                    const places = decimalsOf(tick);
                    return formatNumber(Math.round(v / tick) * tick, places > 0 ? `0.${"0".repeat(places)}` : "0");
                }
                case formatConstants.volume: return formatVolume(v);
                case formatConstants.percent: return formatNumber(v, "0.00") + "%";
                default: return formatNumber(v, spec.slice(FORMAT_PREFIX.length));
            }
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
