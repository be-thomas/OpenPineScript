/**
 * runtime/v1/stdlib/color.ts
 * Implements Pine Script Color Namespace.
 * STRATEGY: Performance. We use Hex Strings (#RRGGBBAA) directly.
 * We do NOT create Objects.
 */

import { val } from "../../../utils/v2/common";

// Helper: Clamps a number between min and max
function clamp(num: number, min: number, max: number) {
    return Math.min(Math.max(num, min), max);
}

// Helper: Converts 0-255 integer to 2-char Hex
function toHex(n: number): string {
    const hex = clamp(Math.round(n), 0, 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
}


const color = {

    // --- Functions ---

    /**
     * color.new(color, transp)
     * Adds transparency to an existing hex color.
     * @param colorStr Hex string "#RRGGBB" or "#RRGGBBAA"
     * @param transp Number 0 (Opaque) to 100 (Invisible)
     */
    "new": (colorStr: any, transp: any): string => {
        const c = String(val(colorStr));
        const t = Number(val(transp));

        if (!c.startsWith("#")) return "#000000"; // Fallback

        // 1. Calculate Alpha (0-255) from Transp (0-100)
        // Pine: 100 transp = 0 Alpha (Invisible)
        // Pine: 0 transp = 255 Alpha (Opaque)
        const alpha = Math.round((100 - clamp(t, 0, 100)) * 2.55);
        const alphaHex = toHex(alpha);

        // 2. Parse Input (Handle existing alpha)
        // If input is #RRGGBB (length 7), append alpha.
        // If input is #RRGGBBAA (length 9), replace alpha? usually override.
        if (c.length === 7) {
            return c + alphaHex;
        } else if (c.length === 9) {
            return c.substring(0, 7) + alphaHex;
        } else if (c.length === 4) {
            // Handle shorthand #RGB -> #RRGGBB
            const r = c[1]; const g = c[2]; const b = c[3];
            return `#${r}${r}${g}${g}${b}${b}${alphaHex}`;
        }
        
        return c; // Return original if format unknown
    },

    /**
     * color.rgb(red, green, blue, transp)
     * Creates a color from RGBA components.
     */
    "rgb": (r: any, g: any, b: any, transp: any = 0): string => {
        const red = Number(val(r));
        const grn = Number(val(g));
        const blu = Number(val(b));
        const trn = Number(val(transp));

        const alpha = Math.round((100 - clamp(trn, 0, 100)) * 2.55);
        
        return `#${toHex(red)}${toHex(grn)}${toHex(blu)}${toHex(alpha)}`;
    },

    /**
     * `color.from_gradient(value, bottom_value, top_value, bottom_color, top_color)`
     *
     * Added with `color.rgb` and `color.r/g/b/t` in the same v4 batch (May
     * 2021): "returns color calculated from the linear gradient between
     * bottom_color to top_color".
     *
     * Every OTHER member of that batch was implemented; this one was missed,
     * and the gap was invisible because `color` IS a namespace — a missing
     * MEMBER of a real namespace emits `opsv2_color.opsv2_from_gradient`,
     * reads `undefined`, and only fails when the result is called. Two of
     * TradingView's own documentation examples died that way with "The
     * provided reference is not a function".
     *
     * `value` is clamped to [bottom_value, top_value] — outside the range Pine
     * returns the endpoint colour rather than extrapolating — and each RGBA
     * channel, transparency included, is interpolated independently.
     */
    "from_gradient": (
        value: any, bottomValue: any, topValue: any, bottomColor: any, topColor: any,
    ): string => {
        const v = Number(val(value));
        const lo = Number(val(bottomValue));
        const hi = Number(val(topValue));
        const from = String(val(bottomColor));
        const to = String(val(topColor));

        // A degenerate range has no gradient to walk; Pine answers with the top
        // colour rather than dividing by zero.
        if (!Number.isFinite(v) || !Number.isFinite(lo) || !Number.isFinite(hi)) return to;
        const span = hi - lo;
        const ratio = span === 0 ? 1 : clamp((v - lo) / span, 0, 1);

        const channel = (hex: string, at: number, fallback: number): number => {
            if (hex.length < at + 2) return fallback;
            const n = parseInt(hex.substring(at, at + 2), 16);
            return Number.isFinite(n) ? n : fallback;
        };
        const mix = (at: number, fallback: number): number => Math.round(
            channel(from, at, fallback) +
            (channel(to, at, fallback) - channel(from, at, fallback)) * ratio,
        );

        // Alpha defaults to opaque when a colour is given as #RRGGBB.
        return `#${toHex(mix(1, 0))}${toHex(mix(3, 0))}${toHex(mix(5, 0))}${toHex(mix(7, 255))}`;
    },

    /**
     * color.r / .g / .b / .t
     * Extract components from a hex string.
     */
    "r": (c: any): number => {
        const hex = String(val(c));
        if (hex.length < 7) return 0;
        return parseInt(hex.substring(1, 3), 16);
    },
    "g": (c: any): number => {
        const hex = String(val(c));
        if (hex.length < 7) return 0;
        return parseInt(hex.substring(3, 5), 16);
    },
    "b": (c: any): number => {
        const hex = String(val(c));
        if (hex.length < 7) return 0;
        return parseInt(hex.substring(5, 7), 16);
    },
    "t": (c: any): number => {
        const hex = String(val(c));
        if (hex.length === 9) {
            const alpha = parseInt(hex.substring(7, 9), 16);
            // Convert Alpha (0-255) back to Transp (100-0)
            return 100 - (alpha / 2.55);
        }
        return 0; // Default to opaque (transp 0)
    }
};

// NO `__IS_NAMESPACE__` here, deliberately.
//
// That flag makes the registry generator prefix every key with the MODULE name.
// This module is color.ts and the object it exports is also called `color`, so
// the flag produced `color.color.new` — a key no Pine source can ever write.
// `visitFun_call` found no registry entry for `color.new`, fell through to a
// plain identifier, and emitted `opsv2_color.opsv2_new`, which is undefined at
// runtime. Same for .rgb / .from_gradient / .r / .g / .b / .t.
//
// Without the flag the object's own name supplies the namespace and the keys
// come out as `color.new`, which is what Pine spells. registry_keys.test.ts
// asserts that.
export default color;
