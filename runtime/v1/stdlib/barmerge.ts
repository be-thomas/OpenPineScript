/**
 * barmerge.* — how security() aligns higher-timeframe data onto chart bars.
 *
 * The `lookahead` argument is security()'s fifth parameter. Its DEFAULT changed
 * between versions and that change is observable in the numbers:
 *
 *   v1/v2 → barmerge.lookahead_on   (the historical default)
 *   v3+   → barmerge.lookahead_off  (flipped by the v2→v3 migration)
 *
 * See dev-docs/01-version-delta-spec.md §2 D3.1.
 */

export const __IS_NAMESPACE__ = true;

/**
 * Use data from the HTF bar the current chart bar falls INSIDE, including the
 * part that has not happened yet. On historical bars this reveals a value
 * before it could have been known — the classic repainting behaviour.
 */
export const lookahead_on = "barmerge.lookahead_on";

/**
 * Use only HTF bars that have already CLOSED. No future information, so
 * historical results match what the script would have seen live.
 */
export const lookahead_off = "barmerge.lookahead_off";

/** Fill gaps with the previous available value (default). */
export const gaps_off = "barmerge.gaps_off";

/** Leave gaps as na. */
export const gaps_on = "barmerge.gaps_on";
