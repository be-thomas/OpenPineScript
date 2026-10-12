/**
 * `format.*` — how a script's numbers are rendered.
 *
 * Two unrelated jobs share the namespace, which is why the values below are
 * sentinels rather than anything computable:
 *
 *   1. `indicator(..., format = format.price, precision = 2)` — the price-axis
 *      and Data Window rendering of every plot the script makes.
 *
 *      "The format parameter defines the type of formatting used for study
 *       values appearing on the price axis, in indicator values or in the Data
 *       Window, with possible values being: format.inherit, format.price and
 *       format.volume."
 *
 *      "When format.price is used, the default precision will be '2', unless
 *       one is specified using precision=."
 *
 *      "When format.volume is used, the format is equivalent to precision=0
 *       used in earlier versions of Pine, where '5183' becomes '5.183K'."
 *
 *   2. `str.tostring(value, format.mintick)` — round to tick precision, then
 *      stringify.
 *
 *      "use str.tostring(myValue, format.mintick) to first round the number to
 *       tick precision and then return its string representation."
 *
 * ── Why the values are these strings ────────────────────────────────────────
 *
 * `str.tostring`'s second argument is EITHER one of these constants or a Pine
 * number-format string like "#.##". The two have to be told apart at runtime,
 * and a sentinel that reads back as its own name is the cheapest way to do it
 * that also survives being printed: a script that puts `format.price` somewhere
 * it does not belong sees `"format.price"` rather than `0` or `undefined`.
 *
 * Job (1) does not affect any number this engine computes. There is no price
 * axis and no Data Window, so the constant is carried and ignored — the plot
 * values are the same either way. That is a real difference from TradingView in
 * what a user SEES, and none at all in what the script calculates.
 *
 * v5-only: the registry split in ./index.ts keeps the namespace out of the
 * v1–v4 views. (v4 has a `format` argument on `study()` too, but spells its
 * constants without the namespace.)
 */

/** The prefix every `format.*` sentinel carries, so they can be recognised. */
export const FORMAT_PREFIX = "format.";

export const format = {
    /** Inherit the chart's own price formatting. The default. */
    inherit: "format.inherit",

    /** Round to the instrument's tick size — `str.tostring`'s one live use. */
    mintick: "format.mintick",

    /** Render as a percentage. */
    percent: "format.percent",

    /** Price formatting; implies `precision = 2` unless one is given. */
    price: "format.price",

    /** Volume formatting: 5183 renders as "5.183K". */
    volume: "format.volume",
};
