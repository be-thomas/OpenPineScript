/**
 * runtime/v2/stdlib/color.ts
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
    // --- Standard Pine Palette (Material Design-ish) ---
    "red":     "#FF5252",
    "green":   "#4CAF50",
    "blue":    "#2196F3",
    "orange":  "#FF9800",
    "teal":    "#009688",
    "navy":    "#3F51B5",
    "white":   "#FFFFFF",
    "black":   "#000000",
    "gray":    "#9E9E9E",
    "purple":  "#9C27B0",
    "yellow":  "#FFEB3B",
    "lime":    "#CDDC39",
    "aqua":    "#00BCD4",
    "fuchsia": "#E040FB",
    "olive":   "#808000",
    "maroon":  "#800000",
    "silver":  "#C0C0C0",

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

export default color;