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


/**
 * `color.from_gradient`. `tvRounding`: TradingView's channel truncation and 0-100 transparency
 * rounding, probed on v5 (v5-color-gradient) and v6 (color-gradient). v4 was not probed and keeps
 * the earlier per-channel rounding (`Context`-free: createStdlib swaps it in for v4).
 */
function gradient(
    value: any, bottomValue: any, topValue: any, bottomColor: any, topColor: any, tvRounding: boolean,
): string {
        const v = Number(val(value));
        const lo = Number(val(bottomValue));
        const hi = Number(val(topValue));
        let from = String(val(bottomColor));
        let to = String(val(topColor));
        // An `na` endpoint is the other endpoint's colour, fully transparent
        // (TradingView capture, popular-author batch 2026-11-21); never hex.
        const isColor = (c: string): boolean => c.startsWith("#");
        if (!isColor(from) && isColor(to)) from = `${to.substring(0, 7)}00`;
        else if (!isColor(to) && isColor(from)) to = `${from.substring(0, 7)}00`;

        // A fully transparent endpoint contributes no RGB: the other one's is used.
        if (tvRounding) {
            const alphaOf = (c: string): number => (c.length >= 9 ? parseInt(c.substring(7, 9), 16) : 255);
            if (isColor(from) && isColor(to)) {
                if (alphaOf(from) === 0 && alphaOf(to) !== 0) from = `${to.substring(0, 7)}00`;
                else if (alphaOf(to) === 0 && alphaOf(from) !== 0) to = `${from.substring(0, 7)}00`;
            }
        }

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
        const lerp = (at: number, fallback: number): number => {
            const c1 = channel(from, at, fallback);
            return c1 + (channel(to, at, fallback) - c1) * ratio;
        };
        const a1 = channel(from, 7, 255), a2 = channel(to, 7, 255);
        // TradingView mixes PREMULTIPLIED colours and truncates every channel, alpha included, in
        // 0-255 space (255 * 0.25 = 63.75 -> 63; captures, popular-author batch 2026-11-21 and the
        // P2 colour-rounding probe). Alpha is a1*(1-f) + a2*f, so two opaque endpoints can give
        // 254.99999999999997 -> 254; each channel is (c1*(a1/255)*(1-f) + c2*(a2/255)*f) / (A/255),
        // in exactly this float order.
        const A = a1 * (1 - ratio) + a2 * ratio;
        // A fully transparent result has no colour: (0, 0, 0, 0) (P2 at f = 100, probe t01 at f = 0).
        if (tvRounding && A === 0) return "#00000000";
        const premultiplied = tvRounding;
        const mix = (at: number, fallback = 0): number => {
            if (!premultiplied) return (tvRounding ? Math.trunc : Math.round)(lerp(at, fallback));
            const c1 = channel(from, at, fallback), c2 = channel(to, at, fallback);
            return Math.trunc((c1 * (a1 / 255) * (1 - ratio) + c2 * (a2 / 255) * ratio) / (A / 255));
        };
        const alpha = premultiplied ? Math.trunc(A) : mix(7, 255);

        return `#${toHex(mix(1))}${toHex(mix(3))}${toHex(mix(5))}${toHex(alpha)}`;
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
        // In doubles, as TradingView does: t = 90 -> 25, 50 -> 128, 97 -> 8.
        const alpha = Math.round(255 * (1 - clamp(t, 0, 100) / 100));
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

        // Same doubles as color.new: transp 90 -> 25, not 26 (probe t02: from_gradient between
        // color.rgb(.., 90) and color.rgb(.., 50) reproduces TradingView only with 25).
        const alpha = Math.round(255 * (1 - clamp(trn, 0, 100) / 100));

        // A fractional channel is truncated, as color.from_gradient's are: TradingView capture n175,
        // color.rgb(214 + 41 * 0.7, ...) = 242.7 -> 242, 228.6 -> 228 (plot colours, every bar).
        const ch = (v: number) => toHex(Number.isFinite(v) ? Math.trunc(clamp(v, 0, 255)) : v);
        return `#${ch(red)}${ch(grn)}${ch(blu)}${toHex(alpha)}`;
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
     * returns the endpoint colour rather than extrapolating — and RGB
     * channels truncate while transparency is interpolated in 0-100 space and
     * rounded (Pine Logs probe color-gradient).
     */
    "from_gradient": (
        value: any, bottomValue: any, topValue: any, bottomColor: any, topColor: any,
    ): string => gradient(value, bottomValue, topValue, bottomColor, topColor, true),

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
            return Math.round(100 - (alpha / 2.55));
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

/** v4's `color.from_gradient`: not probed on TradingView, so it keeps per-channel rounding. */
export const legacyFromGradient = (
    value: any, bottomValue: any, topValue: any, bottomColor: any, topColor: any,
): string => gradient(value, bottomValue, topValue, bottomColor, topColor, false);
