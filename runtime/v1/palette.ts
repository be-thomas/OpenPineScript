/**
 * runtime/v1/palette.ts
 * Colour defaults that depend on the script's version. Lives outside stdlib/ so
 * it is not mistaken for a function scripts can call.
 */

import type { Context } from "./context";
import { blue, black } from "./stdlib/core";

/**
 * A default that Pine documents as a colour constant (`color = color.blue`,
 * `textcolor = color.black`), in the PALETTE OF THE SCRIPT'S OWN VERSION.
 * every version carries its own profile palette (v4 blue #2196F3, v5/v6 blue
 * #2962FF, v5 black #363A45, v1–v3 pure RGB), core.ts's values being only a fallback, exactly as a script's own
 * `color.blue` resolves — see createStdlib in stdlib/index.ts.
 *
 * Evidence for v5: TradingView drew `label.new(x, y, "default colours", style =
 * label.style_label_down)` with a #2962FF bubble and dark text (OpenChartingView
 * e2e/tradingview-drawings/page2.png, targets.json "default colours").
 */
export function paletteColor(ctx: Context, name: "blue" | "black" | "white"): string {
    // v4+ key the table `color.blue`; v1–v3 spell the constants bare.
    const palette = ctx.profile.defaults.palette;
    return palette?.[`color.${name}`] ?? palette?.[name] ?? (name === "blue" ? blue : name === "black" ? black : "#FFFFFF");
}
