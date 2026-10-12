/**
 * Explicit type-casting functions — v4's `float(x)`, `bool(x)`, `string(x)`.
 *
 * SOURCING. The v4 release notes, June 2019, list "functions for explicit type
 * casting" among that version's additions, and the manual's type-system page
 * says why they exist: "It's sometimes necessary to cast one type to another
 * when auto-casting rules do not suffice." It names ten of them — `int()`,
 * `float()`, `bool()`, `color()`, `string()`, `line()`, `linefill()`,
 * `label()`, `box()` and `table()` — and gives their second job:
 *
 *   "Explicit type casting is also handy when declaring variables assigned to
 *    na", with `label myLabel = na` and `myLabel = label(na)` shown as the two
 *   spellings of one thing.
 *
 * `float(na)` is by far the common case in TradingView's own examples: it is
 * how a script says "an absent FLOAT" where the bare `na` would be untyped.
 *
 * ── Why this file is a NAMESPACE that nothing can spell ─────────────────────
 *
 * `int()` and `color()` are plain flat exports elsewhere, because nothing else
 * in the language is called `int` or `color`. These three are: `float`, `bool`
 * and `string` are ALSO the v1–v3 `input()` type constants —
 * `input(1.0, type = float)` — which v4 renamed to `input.float`. One flat
 * registry key cannot be a string at v1 and a function at v4.
 *
 * So they are generated under `cast.*`, which no script may write, and
 * runtime/v1/stdlib/index.ts installs them under their flat names in v4's view
 * ONLY. v1–v3 keep the constant; v4 and v5 get the cast; neither version can
 * see the other's meaning. The same device that lets `session` be a v1–v3
 * string and a v5 namespace at once.
 *
 * `int` is deliberately NOT here — it has no collision, it is already a flat
 * v4-only export in ./core.ts, and moving it would change a working name for
 * symmetry's sake.
 */
export const __IS_NAMESPACE__ = true;

/** Unwraps a Series or boxed value, the way every stdlib function does. */
const val = (x: any): any =>
    x != null && typeof x.valueOf === "function" ? x.valueOf() : x;

/**
 * `float(x)` — the value as a float.
 *
 * `na` in, `na` out: a cast changes how a value is READ, and cannot invent one.
 * That is what makes `float(na)` the typed absent value rather than a zero.
 *
 * @returns {series float} `x` as a float, or na.
 */
export function float(x: any): number {
    const n = Number(val(x));
    return Number.isFinite(n) ? n : NaN;
}

/**
 * `bool(x)` — the value as a boolean.
 *
 * Pine's truthiness, not JavaScript's: `na` is not `false`, it stays `na`, and
 * a script that tests `if bool(x)` on an absent value must take neither branch
 * rather than the else. Zero IS false, and every other finite number true —
 * which is the whole reason the manual's example exists:
 *
 *     if bool(randomValue)
 *
 * "does not raise a warning, as the `bool()` function explicitly casts".
 *
 * @returns {series bool} `x` as a boolean, or na.
 */
export function bool(x: any): boolean | number {
    const v = val(x);
    if (v === null || v === undefined) return NaN;
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return Number.isNaN(v) ? NaN : v !== 0;
    if (typeof v === "string") return v.length > 0;
    return true;
}

/**
 * `string(x)` — the value as a string.
 *
 * NOT `str.tostring`. That one FORMATS — it takes a format mask, renders a
 * float to a fixed number of decimals, and turns `na` into the four characters
 * "NaN" so a label can display them. This is a cast: it reinterprets a value
 * that is already a string, and propagates `na` rather than spelling it out.
 *
 * @returns {series string} `x` as a string, or na.
 */
export function string(x: any): string | number {
    const v = val(x);
    if (v === null || v === undefined) return NaN;
    if (typeof v === "number" && Number.isNaN(v)) return NaN;
    return String(v);
}

/**
 * The DRAWING casts — `line()`, `linefill()`, `label()`, `box()`, `table()`.
 *
 * The manual names all ten casting functions in one list: "int(), float(),
 * bool(), color(), string(), line(), linefill(), label(), box(), and table()",
 * and gives these five their purpose in the sentence that follows —
 * "Explicit type casting is also handy when declaring variables assigned to
 * na", with `label myLabel = na` and `myLabel = label(na)` shown as two
 * spellings of the same thing.
 *
 * So a drawing cast is an IDENTITY with one job: it says which type an `na`
 * is. A drawing id passes through untouched, and an absent value stays absent
 * rather than becoming a zero or an empty string.
 *
 * They live under `cast.*` for the same reason `float` does, and a stronger
 * one: `line`, `label`, `box` and `table` are already NAMESPACE ROOTS, and
 * `line` is the v1–v3 plot-style constant on top of that. One flat registry key
 * cannot be three things, so index.ts installs these under their flat names in
 * the view of each version whose type they name, and the sandbox merge attaches
 * the namespace's members to the function — the same shape `plot`, `color` and
 * `input` already have.
 *
 * TradingView's `v5-writing-profiling-and-optimization-34` and
 * `v5-faq-data-structures-08` both call `box(na)` / `line(na)` to type an
 * array's element, and died with "The provided reference is not a function".
 */
function drawingCast(x: any): any {
    const v = val(x);
    if (v === null || v === undefined) return NaN;
    if (typeof v === "number" && Number.isNaN(v)) return NaN;
    return v;
}

/** @returns {series line} `x` as a line id, or na. */
export function line(x: any): any { return drawingCast(x); }

/** @returns {series linefill} `x` as a linefill id, or na. */
export function linefill(x: any): any { return drawingCast(x); }

/** @returns {series label} `x` as a label id, or na. */
export function label(x: any): any { return drawingCast(x); }

/** @returns {series box} `x` as a box id, or na. */
export function box(x: any): any { return drawingCast(x); }

/** @returns {series table} `x` as a table id, or na. */
export function table(x: any): any { return drawingCast(x); }
