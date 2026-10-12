/**
 * `display.*` — where a plot's values are shown.
 *
 * "controls the locations where plot values appear, which include the script
 *  pane, status line, price scale, and Data Window. The default is
 *  display.all."
 *
 * ── Why these are powers of two ─────────────────────────────────────────────
 *
 * Because the manual says the constants compose with ARITHMETIC:
 *
 *   "supports addition and subtraction of display.* options, e.g.,
 *    display.all - display.pane hides the pane visuals but displays the plot's
 *    numeric results everywhere else, while
 *    display.status_line + display.data_window displays results only in those
 *    two locations."
 *
 * A set of disjoint bits is the only encoding under which both of those work
 * with the ordinary `+` and `-` a script writes: `all - pane` clears exactly
 * one location, and `status_line + data_window` names exactly two. Sequential
 * integers (1, 2, 3, 4) would make `all - pane` land on some other location
 * entirely, silently.
 *
 * `all` is therefore the sum of the four, not a magic number.
 *
 * ── What this engine does with them ─────────────────────────────────────────
 *
 * Carries them. There is no pane, status line, price scale or Data Window
 * here, so `display` changes nothing about the values a plot produces — which
 * is the whole of what this engine computes. A script that hides a plot with
 * `display.none` still gets its series in the output, and that is a difference
 * in presentation rather than in arithmetic.
 *
 * v5-only: the registry split in ./index.ts keeps the namespace out of the
 * v1–v4 views.
 */

export const display = {
    /** Shown nowhere. The plot is still calculated. */
    none: 0,

    /** The Data Window. */
    data_window: 1,

    /** The script's pane — the visible line, histogram or shape. */
    pane: 2,

    /** The price scale on the right-hand edge. */
    price_scale: 4,

    /** The status line above the chart. */
    status_line: 8,

    /** Every location at once — the default. The sum of the four above. */
    all: 1 + 2 + 4 + 8,
};
