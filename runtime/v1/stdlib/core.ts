/**
 * runtime/v1/stdlib/core.ts
 * Core functions for Pine Script v2 (Strict Compliance)
 */

// Helper: Auto-unwrap Series objects if they are passed directly to global functions
function val(x: any): any {
    if (x !== null && x !== undefined && typeof x.valueOf === 'function') {
        return x.valueOf();
    }
    return x;
}




// --- Polymorphic Null Checks ---


// na(x): Returns true if x is NaN (number) or null/undefined (string/bool)
export function na(x: any): boolean {
    const v = val(x);
    return v === null || v === undefined || (typeof v === 'number' && isNaN(v));
}

// nz(x, y): Returns x if valid, otherwise y (default 0)
export function nz(x: any, y?: any): any {
    const v = val(x);
    if (v === null || v === undefined || (typeof v === 'number' && isNaN(v))) {
        return y !== undefined ? val(y) : 0;
    }
    return v;
}


/**
 * $pick: the v1-v3 ternary. The transpiler emits `opsv2_$pick(ctx.truthy(c), T, F)`, so JS
 * evaluates the condition and then BOTH branches, in order (see `ternaryRunsBothBranches`),
 * and this keeps the one the condition picks. Internal: no allocation per evaluation.
 */
export function $pick(cond: boolean, t: any, f: any): any {
    return cond ? t : f;
}

// iff(cond, trueVal, falseVal): Functional ternary operator
export function iff(cond: any, t: any, f: any): any {
    return val(cond) ? val(t) : val(f);
}

// --- Arithmetic wrappers ---
//
// These exist for the BOOL coercion that v1-v3 perform (true -> 1, false -> 0),
// which plain JS `+` does not do for a Series-wrapped boolean.
//
// They used to ALSO coerce `na` to 0, described as a "Pine v2 arithmetic
// anomaly". It is not one. TradingView propagates `na` through arithmetic, and a
// 5,998-bar export settles it directly: `sma(close, 20) + 2 * stdev(close, 20)`
// is reported as `na` for the first 19 bars, where this engine reported a
// number. `na + na` came out as 0 and `na + 5` as 5.
//
// The consequence was worse than a wrong value. Every indicator's warm-up
// silently became a real number the moment it was combined with anything, so a
// whole class of disagreement could never surface.

const asNumber = (x: any): number => Number(val(x));

/**
 * `+` — numeric addition, or STRING CONCATENATION when either side is a string.
 *
 * Pine overloads `+` exactly as JavaScript does, and this used to coerce
 * unconditionally: `"a" + "b"` came out as `NaN`, because `Number("a")` is NaN.
 * Nothing caught it, because v1–v4 have almost no reason to build a string —
 * `tostring` exists and is rarely used, and a plot cannot show one.
 *
 * v5 makes it central. Pine Logs are how this project collects golden data
 * without a paid TradingView plan (see runtime/v1/stdlib/logging.ts), every
 * generated harness builds its CSV row with `str.tostring(x) + "," + …`, and
 * all seven of them logged the single string "NaN".
 */
export function safe_add(a: any, b: any): number | string {
    const x = val(a);
    const y = val(b);
    if (typeof x === "string" || typeof y === "string") return String(x) + String(y);
    return Number(x) + Number(y);
}

export function safe_sub(a: any, b: any): number {
    return asNumber(a) - asNumber(b);
}

/**
 * `a == b` and `a != b`, with both sides UNWRAPPED first.
 *
 * ── The bug this fixes ──────────────────────────────────────────────────────
 *
 * Every script variable is a Series OBJECT, and JavaScript compares two objects
 * with `==` by REFERENCE. So
 *
 *     x = 1.0
 *     y = 1.0
 *     equal = x == y      // false
 *
 * Two variables holding the same number were never equal, at any version. It
 * survived because the common shapes hide it: `x == 0` compares an object to a
 * primitive, which coerces through `valueOf`, and `<`, `>`, `<=`, `>=` coerce
 * unconditionally. Only `==` and `!=` between two variables reach the reference
 * comparison, and then they are silently, permanently false.
 *
 * ── Why `==` and not `===` after unwrapping ─────────────────────────────────
 *
 * Because objects must still compare by reference once unwrapped. An ENUM
 * member is a plain object with no `valueOf` of its own — deliberately, so that
 * two enums with identically named and titled fields are not equal, which is
 * the rule the manual states: "Scripts cannot compare members of different
 * enums ... even if the fields have identical names and titles." Unwrapping
 * leaves those objects alone, and `==` then does exactly the right thing for
 * both cases.
 *
 * `na` needs no special handling: it is NaN, and NaN equals nothing including
 * itself, which is what Pine reports for a comparison involving `na`.
 */
/**
 * TradingView treats two floats as equal when they differ by at most 1e-10
 * (absolute, at any magnitude). Measured with Pine Logs; see
 * dev-docs/tv-parity/ENGINE-BUGS.md section 5.
 */
export const FLOAT_TOLERANCE = 1e-10;

export function safe_eq(a: any, b: any): boolean {
    if (typeof a === "number" && typeof b === "number") {
        const d = a - b;
        return d <= FLOAT_TOLERANCE && d >= -FLOAT_TOLERANCE;
    }
    const x = val(a), y = val(b);
    if (typeof x === "number" && typeof y === "number") {
        const d = x - y;
        return d <= FLOAT_TOLERANCE && d >= -FLOAT_TOLERANCE;
    }
    return x == y;
}

/**
 * `a != b` is false when either side is `na`, at every version v1-v6. TradingView,
 * `x = bar_index % 2 == 0 ? na : close` (`n` at v1-v3): on all 150 na bars of each
 * of v1-v6, `x != 0`, `x == 0`, `x > 0`, `x < 0`, `x != x` and `x != 1` gave 0
 * (dev-docs/tv-parity/_probes/run-20261113-na-hma, run-20261113-na-v1v3). Where a
 * bool can be na (v1-v5) a ternary reads na as false, so those runs cannot tell
 * "false" from "na bool"; either way `true` was wrong. In a script, a guard like
 * `x != 0 ? a / x : 0.0` with `x` na therefore takes the `0.0` branch.
 */
export function safe_ne(a: any, b: any): boolean {
    if (typeof a === "number" && typeof b === "number") {
        const d = a - b;
        if (d !== d) return false;
        return !(d <= FLOAT_TOLERANCE && d >= -FLOAT_TOLERANCE);
    }
    const x = val(a), y = val(b);
    if (typeof x === "number" && typeof y === "number") {
        const d = x - y;
        if (d !== d) return false;
        return !(d <= FLOAT_TOLERANCE && d >= -FLOAT_TOLERANCE);
    }
    return x != y;
}

/**
 * Ordering comparisons share the equality tolerance: `a < b` is "less AND not
 * equal", `a <= b` is "less OR equal". A NaN difference fails every test, so
 * `na` stays false throughout, as before.
 */
export function safe_lt(a: any, b: any): boolean {
    if (typeof a === "number" && typeof b === "number") return a - b < -FLOAT_TOLERANCE;
    const x = val(a), y = val(b);
    if (typeof x === "number" && typeof y === "number") return x - y < -FLOAT_TOLERANCE;
    return x < y;
}

export function safe_gt(a: any, b: any): boolean {
    if (typeof a === "number" && typeof b === "number") return a - b > FLOAT_TOLERANCE;
    const x = val(a), y = val(b);
    if (typeof x === "number" && typeof y === "number") return x - y > FLOAT_TOLERANCE;
    return x > y;
}

export function safe_le(a: any, b: any): boolean {
    if (typeof a === "number" && typeof b === "number") return a - b <= FLOAT_TOLERANCE;
    const x = val(a), y = val(b);
    if (typeof x === "number" && typeof y === "number") return x - y <= FLOAT_TOLERANCE;
    return x <= y;
}

export function safe_ge(a: any, b: any): boolean {
    if (typeof a === "number" && typeof b === "number") return a - b >= -FLOAT_TOLERANCE;
    const x = val(a), y = val(b);
    if (typeof x === "number" && typeof y === "number") return x - y >= -FLOAT_TOLERANCE;
    return x >= y;
}

// --- Type Conversion (v2 Only) ---

// tostring(x): The ONLY casting function in v2
export function tostring(x: any): string {
    const v = val(x);
    if (v === null || v === undefined || (typeof v === 'number' && isNaN(v))) {
        return "NaN";
    }
    return String(v);
}

// --- Core Math ---

export function abs(x: any): number {
    return Math.abs(val(x));
}

export function acos(x: any): number {
    return Math.acos(val(x));
}

export function asin(x: any): number {
    return Math.asin(val(x));
}

export function atan(x: any): number {
    return Math.atan(val(x));
}

export function ceil(x: any): number {
    return Math.ceil(val(x));
}

export function cos(x: any): number {
    return Math.cos(val(x));
}

export function exp(x: any): number {
    return Math.exp(val(x));
}

export function floor(x: any): number {
    return Math.floor(val(x));
}

export function log(x: any): number {
    return Math.log(val(x));
}

export function log10(x: any): number {
    return Math.log10(val(x));
}

export function max(...args: any[]): number {
    return Math.max(...args.map(val));
}

export function min(...args: any[]): number {
    return Math.min(...args.map(val));
}

export function pow(x: any, y: any): number {
    return Math.pow(val(x), val(y));
}

/**
 * `round(x)`, and from v5 `math.round(number, precision)`.
 *
 * Half rounds AWAY from zero, and `precision` rounds to that many decimals as
 * the number is WRITTEN: TradingView's log gives math.round(-2.5) = -3 and
 * math.round(1.005, 2) = 1.01 (conformance/v6/golden/harness_v6_language).
 * JavaScript's Math.round gives -2, and 1.005 * 100 is 100.49999999999999 in
 * binary, so both need doing here. Shifting by exponent notation —
 * Number("1.005e2") is exactly 100.5 — moves the decimal point in the decimal
 * representation instead of multiplying in binary.
 */
export function round(x: any, precision?: any): number {
    const n = Number(val(x));
    if (!Number.isFinite(n)) return n;
    const p = precision === undefined || precision === null ? 0 : Math.trunc(Number(val(precision)));
    if (!(p > 0)) return Math.sign(n) * Math.round(Math.abs(n));
    return Math.sign(n) * decimalShift(Math.round(decimalShift(Math.abs(n), p)), -p);
}

/**
 * `x * 10^by`, done on the decimal digits rather than in binary. Appending
 * `e<by>` to `String(x)` broke once String(x) was itself in exponent form:
 * 0.0000001 is "1e-7", and "1e-7e2" is NaN. toExponential always gives
 * "<mantissa>e<exponent>", so the exponent can be adjusted as a number.
 */
function decimalShift(x: number, by: number): number {
    if (x === 0) return 0;
    const [mantissa, exponent] = x.toExponential().split("e");
    return Number(`${mantissa}e${Number(exponent) + by}`);
}

export function sign(x: any): number {
    // Exact: TradingView gives sign(+-5.55e-17) = +-1 on v5 and v6 (_probes/sign-tiny); the
    // comparison tolerance does not apply to it.
    return Math.sign(val(x));
}

export function sin(x: any): number {
    return Math.sin(val(x));
}

export function sqrt(x: any): number {
    return Math.sqrt(val(x));
}

export function tan(x: any): number {
    return Math.tan(val(x));
}

export function avg(...args: any[]): number {
    const vals = args.map(val);
    return vals.reduce((a, b) => a + b, 0) / vals.length;
}

// --- Standard Pine Palette (Material Design-ish) ---
export const red = "#FF5252";
export const green = "#4CAF50";
export const blue = "#2196F3";
export const orange = "#FF9800";
export const teal = "#009688";
export const navy = "#3F51B5";
export const white = "#FFFFFF";
export const black = "#000000";
export const gray = "#9E9E9E";
export const purple = "#9C27B0";
export const yellow = "#FFEB3B";
export const lime = "#CDDC39";
export const aqua = "#00BCD4";
export const fuchsia = "#E040FB";
export const olive = "#808000";
export const maroon = "#800000";
export const silver = "#C0C0C0";

/**
 * `int(x)` — explicit cast from float to int.
 *
 * Pine v4 added "functions for explicit type casting" (June 2019) because it
 * has no implicit float → integer conversion. The v4 manual's own example is
 * the reason this matters:
 *
 *     len = 10.0
 *     s = sma(close, int(len))
 *
 * without which `sma` rejects `const float` where it wants `integer`.
 *
 * Truncates toward zero rather than rounding — `int(-1.7)` is `-1`, not `-2` —
 * and propagates `na`, since a cast cannot invent a value.
 *
 * Source: https://www.tradingview.com/pine-script-docs/v4/language/type-system/
 *
 * @returns {series int} `x` truncated toward zero, or na.
 */
export function int(x: any): number {
    const n = Number(x != null && typeof x.valueOf === "function" ? x.valueOf() : x);
    return Number.isFinite(n) ? Math.trunc(n) : NaN;
}

/**
 * `max_bars_back(var, num)` — request a deeper history buffer for one series.
 *
 * ── Deliberately a no-op ────────────────────────────────────────────────────
 *
 * On TradingView this raises the internal lookback buffer for `var`, and exists
 * because that buffer is capped: a script that indexes further back than the
 * engine guessed fails with "Pine cannot determine the referencing length of
 * series".
 *
 * This engine has no such cap. Lookback depth is bounded by available memory,
 * which is one of the limits skipped on purpose — see the "Deliberate
 * deviations" section of docs/common/CONFORMANCE.md and the table that follows it.
 * Every buffer is therefore already at least as large as any `max_bars_back`
 * call could ask for, and honouring the request would mean SHRINKING history
 * to match a restriction that is not being modelled.
 *
 * Accepting and ignoring it is what keeps scripts that call it runnable. The
 * alternative — leaving the name unbound — is what made four of TradingView's
 * own documentation examples die with a ReferenceError.
 *
 * @returns {void}
 */
export function max_bars_back(_series: any, _num: any): void {
    /* no cap to raise — see above */
}
