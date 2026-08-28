/**
 * `font.*` — the two font families a label, box or table cell may ask for.
 *
 * Pine offers a choice of exactly two, and neither is a font NAME: they are
 * requests for "the chart's usual typeface" and "something monospaced", which
 * the platform resolves. This engine draws nothing, so it carries the constant
 * through to the drawing record and no further.
 *
 * The values are the strings a renderer would want, so a host that does draw
 * gets something usable rather than an opaque integer.
 *
 * v5-only: the registry split in ./index.ts keeps the namespace out of the
 * v1–v4 views.
 */

export const font = {
    /** The chart's default typeface. */
    family_default: "default",

    /** A monospaced typeface — what a table of aligned numbers wants. */
    family_monospace: "monospace",
};
