/**
 * scale.* — which price scale a study/strategy is drawn against.
 *
 * Passed to the `scale` argument of study()/strategy():
 *
 *     strategy("Pre Meditated", scale=scale.right, overlay=true)
 *
 * Purely declarative: it affects chart presentation, not any computed series.
 * The values are carried through to the script's declared metadata so a host
 * renderer can honour them; the engine itself only needs them to EXIST, because
 * a missing constant is a hard "opsv2_scale is not defined" at runtime.
 */

export const __IS_NAMESPACE__ = true;

/** Draw against the right-hand price scale (the default for overlays). */
export const right = "scale.right";

/** Draw against the left-hand price scale. */
export const left = "scale.left";

/** Do not attach to a price scale — the script provides its own range. */
export const none = "scale.none";
