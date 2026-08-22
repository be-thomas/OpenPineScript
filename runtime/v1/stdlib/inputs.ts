/**
 * v5's TYPED input functions — `input.int()`, `input.float()`, `input.bool()`, …
 *
 * ── What changed at v5 ──────────────────────────────────────────────────────
 *
 * v1–v3 pass the type as a value: `input(14, type=integer)`.
 * v4 moves those values into a namespace: `input(14, type=input.integer)`.
 * v5 removes them as values and makes them FUNCTIONS: `input.int(14)`.
 *
 * Two of them also change name in the process — `integer` becomes `int` and
 * `resolution` becomes `timeframe` (dev-docs/01-version-delta-spec.md §4c).
 *
 * ── Six of these names collide with v4's constants ──────────────────────────
 *
 * `float`, `bool`, `string`, `source`, `session` and `symbol` are live at BOTH
 * v4 (as constants, holding the type name) and v5 (as the functions below), and
 * the sandbox holds ONE object per name. Nothing in this file resolves that:
 * `createStdlib` in ./index.ts binds each version's own meaning, reading the
 * version off the Context.
 *
 * The alternative — one object that is callable AND stringifies to the v4
 * constant — was tried and abandoned. It works for `input(1.0,
 * type=input.float)`, which unwraps its argument, and leaks everywhere else:
 * `x = input.float` at v4 binds a function that merely LOOKS like "float" to
 * anything that asks it politely.
 *
 * `int`, `timeframe`, `color`, `time`, `price` and `text_area` have no v4
 * constant of the same spelling, so they collide with nothing.
 */

import { Context } from "../context";
import { val } from "../../../utils/v2/common";

const text = (x: any): string => {
    const v = val(x);
    return v === null || v === undefined ? "" : String(v);
};

/**
 * Every typed input reduces to the same registration.
 *
 * `minval`/`maxval`/`step`/`options` are accepted because published v5 scripts
 * pass them constantly, and dropped because Context.registerInput records a
 * default and a type and nothing else. Recording a constraint the engine does
 * not enforce would be worse than not recording it: the host UI would show a
 * slider whose bounds meant nothing.
 */
const register = (ctx: Context, defval: any, title: any, type: string): any =>
    ctx.registerInput(val(defval), text(title), type);

export const input = {
    int: (ctx: Context, defval: any, title?: any, _minval?: any, _maxval?: any, _step?: any) =>
        register(ctx, defval, title, "integer"),

    float: (ctx: Context, defval: any, title?: any, _minval?: any, _maxval?: any, _step?: any) =>
        register(ctx, defval, title, "float"),

    bool: (ctx: Context, defval: any, title?: any) => register(ctx, defval, title, "bool"),

    string: (ctx: Context, defval: any, title?: any, _options?: any) =>
        register(ctx, defval, title, "string"),

    color: (ctx: Context, defval: any, title?: any) => register(ctx, defval, title, "color"),

    /** v5's rename of v4's `input.resolution`. */
    timeframe: (ctx: Context, defval: any, title?: any, _options?: any) =>
        register(ctx, defval, title, "resolution"),

    session: (ctx: Context, defval: any, title?: any, _options?: any) =>
        register(ctx, defval, title, "session"),

    symbol: (ctx: Context, defval: any, title?: any) => register(ctx, defval, title, "symbol"),

    /** The chart series an indicator runs on — `close`, `hl2`, another plot. */
    source: (ctx: Context, defval: any, title?: any) => register(ctx, defval, title, "source"),

    time: (ctx: Context, defval: any, title?: any) => register(ctx, defval, title, "time"),

    price: (ctx: Context, defval: any, title?: any) => register(ctx, defval, title, "float"),

    text_area: (ctx: Context, defval: any, title?: any) => register(ctx, defval, title, "string"),
};

// NOTE FOR ANYONE EDITING THIS FILE: every member above must be written as an
// ARROW FUNCTION in the literal. The registry generator classifies a property
// by its initialiser, and anything that is not an arrow or function expression
// — `Object.assign(fn, …)` included — is recorded as a VALUE, which makes
// `input.float(1.0)` fail at run time with "'input.float' is a value, not a
// function".
