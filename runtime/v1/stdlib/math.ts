/**
 * The four maths built-ins TradingView added in Pine v4.
 *
 * ── Why they are FLAT functions here and not a `math` object ────────────────
 *
 * They were gated as v5-only, with a note claiming they had "no v1–v4 spelling
 * to inherit from". That was wrong, and TradingView's own v4 release notes say
 * so:
 *
 *   "todegrees(radians) - returns an approximately equivalent angle in degrees
 *    from an angle measured in radians. toradians(degrees) - … random(min, max,
 *    seed) - returns a pseudo-random value. … Using the same value for the
 *    optional seed argument will produce a repeatable sequence."
 *
 *   "New function was added: round_to_mintick(x) - returns the value rounded to
 *    the symbol's mintick …"
 *
 * All four are v4 built-ins that v5 moved under `math.` along with the rest of
 * the maths library. So they belong here as flat names, gated to v4+ by
 * V4_ONLY_NAMES, and aliased to `math.*` at v5 by V5_RENAMES — exactly the
 * treatment `abs`, `sqrt` and `max` get. Declaring them as an object gave them
 * `math.` keys directly, which made them unspellable at v4 (a v4 script calling
 * `random(0, 255)` — as TradingView's own v4 documentation does — died with a
 * ReferenceError) and left the flat v5 spelling un-removed.
 *
 * Source: https://www.tradingview.com/pine-script-docs/v4/release-notes/
 */

import { Context } from "../context";
import { val } from "../../../utils/v2/common";

const num = (x: any): number => Number(val(x));

/**
 * `random(min, max, seed)` — uniform in [min, max).
 *
 * ── What `seed` does here, and what it does not ─────────────────────────────
 *
 * Pine documents `seed` as making the sequence REPEATABLE, and that is what it
 * does here: a seeded call draws from a deterministic generator held on the
 * Context, so two runs of the same script over the same bars produce the same
 * numbers. That is the property a backtest needs.
 *
 * It is NOT the same sequence TradingView produces. Their generator is not
 * published, so no local implementation can match it, and a seeded script will
 * disagree with the chart value by value. Stated rather than hidden: the
 * alternative — ignoring the seed — loses reproducibility as well as parity,
 * which is strictly worse.
 *
 * Unseeded, it is `Math.random`, which is what an unseeded Pine call is.
 *
 * @returns {series float} A pseudo-random value in [min, max).
 */
export function random(ctx: Context, min: any = 0, max: any = 1, seed?: any): number {
    const lo = num(min), hi = num(max);
    const draw = seed === undefined || seed === null
        ? Math.random()
        : ctx.seededRandom(Math.trunc(num(seed)) || 0);
    return lo + draw * (hi - lo);
}

/**
 * Converts an angle measured in radians to an approximately equivalent angle
 * measured in degrees.
 * @returns {series float} The angle in degrees.
 */
export function todegrees(radians: any): number {
    return (num(radians) * 180) / Math.PI;
}

/**
 * Converts an angle measured in degrees to an approximately equivalent angle
 * measured in radians.
 * @returns {series float} The angle in radians.
 */
export function toradians(degrees: any): number {
    return (num(degrees) * Math.PI) / 180;
}

/**
 * `round_to_mintick(x)` — round to the instrument's tick size.
 *
 * The tick comes from the Context rather than a constant: it is a property of
 * the symbol being charted, and a script that draws a level at a price the
 * exchange cannot quote is the thing this function exists to prevent.
 *
 * @returns {series float} `x` rounded to the nearest multiple of the mintick.
 */
export function round_to_mintick(ctx: Context, number: any): number {
    const x = num(number);
    const tick = Number(ctx.mintick);
    if (!Number.isFinite(x)) return NaN;
    if (!Number.isFinite(tick) || tick <= 0) return x;
    return Math.round(x / tick) * tick;
}
