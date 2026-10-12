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
 * `minval`, `maxval`, `step` and `options` used to be accepted positionally
 * under underscored names and thrown away — so a keyword `minval = 1` matched no
 * parameter and was dropped without a word, on seventeen of TradingView's own
 * examples. They are now RECORDED on the definition, and the numeric bounds and
 * the `options` set are enforced on the value the script gets back.
 *
 * `tooltip`, `inline`, `group`, `confirm` and `display` are host-UI metadata:
 * recorded, because a host renders the controls, and nothing here to enforce.
 */
const register = (
    ctx: Context, defval: any, title: any, type: string, meta: Record<string, any> = {},
): any => {
    const clean: Record<string, any> = { defval: val(defval) };
    for (const [k, v] of Object.entries(meta)) if (v !== undefined) clean[k] = val(v);
    return ctx.registerInput(val(defval), text(title), type, clean);
};

export const input = {
    int: (ctx: Context, defval: any, title?: any, minval?: any, maxval?: any, step?: any,
          tooltip?: any, inline?: any, group?: any, confirm?: any, display?: any,
          options?: any) =>
        register(ctx, defval, title, "integer",
                 { minval, maxval, step, tooltip, inline, group, confirm, display, options }),

    float: (ctx: Context, defval: any, title?: any, minval?: any, maxval?: any, step?: any,
            tooltip?: any, inline?: any, group?: any, confirm?: any, display?: any,
            options?: any) =>
        register(ctx, defval, title, "float",
                 { minval, maxval, step, tooltip, inline, group, confirm, display, options }),

    bool: (ctx: Context, defval: any, title?: any, tooltip?: any, inline?: any,
           group?: any, confirm?: any, display?: any) =>
        register(ctx, defval, title, "bool", { tooltip, inline, group, confirm, display }),

    string: (ctx: Context, defval: any, title?: any, options?: any, tooltip?: any,
             inline?: any, group?: any, confirm?: any, display?: any) =>
        register(ctx, defval, title, "string",
                 { options, tooltip, inline, group, confirm, display }),

    color: (ctx: Context, defval: any, title?: any, tooltip?: any, inline?: any,
            group?: any, confirm?: any, display?: any) =>
        register(ctx, defval, title, "color", { tooltip, inline, group, confirm, display }),

    /** v5's rename of v4's `input.resolution`. */
    timeframe: (ctx: Context, defval: any, title?: any, options?: any, tooltip?: any,
                inline?: any, group?: any, confirm?: any, display?: any) =>
        register(ctx, defval, title, "resolution",
                 { options, tooltip, inline, group, confirm, display }),

    session: (ctx: Context, defval: any, title?: any, options?: any, tooltip?: any,
              inline?: any, group?: any, confirm?: any, display?: any) =>
        register(ctx, defval, title, "session",
                 { options, tooltip, inline, group, confirm, display }),

    symbol: (ctx: Context, defval: any, title?: any, tooltip?: any, inline?: any,
             group?: any, confirm?: any, display?: any) =>
        register(ctx, defval, title, "symbol", { tooltip, inline, group, confirm, display }),

    /** The chart series an indicator runs on — `close`, `hl2`, another plot. */
    source: (ctx: Context, defval: any, title?: any, tooltip?: any, inline?: any,
             group?: any, display?: any) =>
        register(ctx, defval, title, "source", { tooltip, inline, group, display }),

    time: (ctx: Context, defval: any, title?: any, tooltip?: any, inline?: any,
           group?: any, confirm?: any, display?: any) =>
        register(ctx, defval, title, "time", { tooltip, inline, group, confirm, display }),

    price: (ctx: Context, defval: any, title?: any, tooltip?: any, inline?: any,
            group?: any, confirm?: any, display?: any) =>
        register(ctx, defval, title, "float", { tooltip, inline, group, confirm, display }),

    text_area: (ctx: Context, defval: any, title?: any, tooltip?: any, inline?: any,
                group?: any, confirm?: any, display?: any) =>
        register(ctx, defval, title, "string", { tooltip, inline, group, confirm, display }),

    /**
     * `input.enum(defaultValue, title, options, …)` — a dropdown of enum members.
     *
     * June 2024, with enums themselves: they "enable convenient dropdown input
     * creation with the new input.enum() function", and "the input displays all
     * enum field titles in its dropdown menu".
     *
     * The declared type is `enum` rather than `string` so a host rendering the
     * inputs can list the right choices: `Context.enumMembers` holds every
     * member of the enum the default belongs to, and `Context.enumTitles` turns
     * each into the text the dropdown should show. A plain `string` input would
     * offer a free-text box for a value that must be one of a fixed set.
     */
    enum: (ctx: Context, defval: any, title?: any, options?: any, tooltip?: any,
           inline?: any, group?: any, confirm?: any, display?: any) =>
        register(ctx, defval, title, "enum",
                 { options, tooltip, inline, group, confirm, display }),
};

// NOTE FOR ANYONE EDITING THIS FILE: every member above must be written as an
// ARROW FUNCTION in the literal. The registry generator classifies a property
// by its initialiser, and anything that is not an arrow or function expression
// — `Object.assign(fn, …)` included — is recorded as a VALUE, which makes
// `input.float(1.0)` fail at run time with "'input.float' is a value, not a
// function".
