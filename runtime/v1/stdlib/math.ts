/**
 * The `math.*` namespace — v5's home for arithmetic.
 *
 * ── Only the NEW members live here ──────────────────────────────────────────
 *
 * v5 moved `abs`, `max`, `sqrt` and the rest of the v1–v4 flat maths under
 * `math.`, and those arrive as ALIASES: ./renames5.ts names each one and the
 * alias inherits the existing registry entry wholesale. Re-implementing
 * `math.abs` here beside `abs` in core.ts would be two implementations of one
 * function with no test that could catch them drifting.
 *
 * What is left is the handful of members with no v1–v4 spelling to inherit
 * from — the four below. They are v5-only, and the registry split in ./index.ts
 * keeps them out of the v1–v4 views.
 */

import { Context } from "../context";
import { val } from "../../../utils/v2/common";

const num = (x: any): number => Number(val(x));

export const math = {
    /**
     * `math.random(min, max, seed)` — uniform in [min, max).
     *
     * ── What `seed` does here, and what it does not ───────────────────────────
     *
     * Pine documents `seed` as making the sequence REPEATABLE, and that is what
     * it does here: a seeded call draws from a deterministic generator held on
     * the Context, so two runs of the same script over the same bars produce
     * the same numbers. That is the property a backtest needs.
     *
     * It is NOT the same sequence TradingView produces. Their generator is not
     * published, so no local implementation can match it, and a seeded script
     * will disagree with the chart value by value. Stated rather than hidden:
     * the alternative — ignoring the seed — loses reproducibility as well as
     * parity, which is strictly worse.
     *
     * Unseeded, it is `Math.random`, which is what an unseeded Pine call is.
     */
    random: (ctx: Context, min: any = 0, max: any = 1, seed?: any): number => {
        const lo = num(min), hi = num(max);
        const draw = seed === undefined || seed === null
            ? Math.random()
            : ctx.seededRandom(Math.trunc(num(seed)) || 0);
        return lo + draw * (hi - lo);
    },

    todegrees: (radians: any): number => (num(radians) * 180) / Math.PI,
    toradians: (degrees: any): number => (num(degrees) * Math.PI) / 180,

    /**
     * `math.round_to_mintick(x)` — round to the instrument's tick size.
     *
     * The tick comes from the Context rather than a constant: it is a property
     * of the symbol being charted, and a script that draws a level at a price
     * the exchange cannot quote is the thing this function exists to prevent.
     */
    round_to_mintick: (ctx: Context, number: any): number => {
        const x = num(number);
        const tick = Number(ctx.mintick);
        if (!Number.isFinite(x)) return NaN;
        if (!Number.isFinite(tick) || tick <= 0) return x;
        return Math.round(x / tick) * tick;
    },
};
