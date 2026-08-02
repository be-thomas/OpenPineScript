/**
 * runtime/v1/stdlib/ui.ts
 * Implements "Full" Plotting Support (Colors, Styles, Shapes, Fills)
 */
import { Context } from "../context";

// --- Colors (Pine Script Standard) ---
export const color_red    = "#FF5252";
export const color_green  = "#4CAF50";
export const color_blue   = "#2196F3";
export const color_orange = "#FF9800";
export const color_teal   = "#009688";
export const color_navy   = "#3F51B5";
export const color_white  = "#FFFFFF";
export const color_black  = "#000000";
export const color_gray   = "#9E9E9E";
export const color_purple = "#9C27B0";

// --- Outputs ---

export function plot(
    ctx: Context,
    series: number,
    title: string = "Plot",
    color?: string,
    linewidth: number = 1,
    style?: number
): string {
    ctx.registerPlot({
        type: 'line',
        value: Number(series),
        title,
        color,
        linewidth,
        style
    });
    // Return the ID (title) so it can be used by fill()
    return title;
}

export function plotshape(
    ctx: Context,
    series: boolean | number,
    title: string = "Shape",
    style?: string,
    location?: string,
    color?: string
): void {
    let val = Number(series);

    // Pine Rule: 0 means "False" (Don't Plot).
    if (val === 0) {
        val = NaN;
    }

    ctx.registerPlot({
        type: 'shape',
        value: val,
        title,
        color,
        style
    });
}

export function plotchar(
    ctx: Context,
    series: boolean | number,
    title: string = "Char",
    char: string = "★",
    location?: string,
    color?: string
): void {
    let val = Number(series);

    if (val === 0) {
        val = NaN;
    }

    ctx.registerPlot({
        type: 'char',
        value: val,
        title,
        color,
        style: char
    });
}

export function hline(
    ctx: Context,
    price: number,
    title: string = "HLine",
    color?: string,
    linestyle?: number,
    linewidth?: number
): string {
    ctx.registerPlot({
        type: 'line',
        value: Number(price),
        title,
        color,
        linewidth,
        style: linestyle
    });
    return title;
}

export function plotbar(
    ctx: Context,
    open: number,
    high: number,
    low: number,
    close: number,
    title: string = "Bar",
    color?: string
): void {
    ctx.registerPlot({
        type: 'candle',
        open: Number(open),
        high: Number(high),
        low: Number(low),
        close: Number(close),
        title,
        color
    });
}

export function plotcandle(
    ctx: Context,
    open: number,
    high: number,
    low: number,
    close: number,
    title: string = "Candle",
    color?: string
): void {
    ctx.registerPlot({
        type: 'candle',
        open: Number(open),
        high: Number(high),
        low: Number(low),
        close: Number(close),
        title,
        color
    });
}

export function plotarrow(
    ctx: Context,
    series: number,
    title: string = "Arrow",
    colorup?: string,
    colordown?: string,
    _minheight: number = 5,
    _maxheight: number = 100
): void {
    ctx.registerPlot({
        type: 'arrow',
        value: Number(series),
        title,
        color: Number(series) >= 0 ? (colorup || "#4CAF50") : (colordown || "#FF5252")
    });
}

// --- Visual Layers ---

export function bgcolor(ctx: Context, color: string, transp?: number): void {
    ctx.registerPlot({
        type: 'bgcolor',
        title: `_BGCOLOR_${color}`,
        color
    });
}

export function barcolor(ctx: Context, color: string): void {
    ctx.registerPlot({
        type: 'barcolor',
        title: "_BARCOLOR_",
        color
    });
}

export function fill(
    ctx: Context,
    plotId1: string,
    plotId2: string,
    color?: string,
    title?: string,
    editable?: boolean,
    fillgaps?: boolean
): void {
    ctx.registerFill(plotId1, plotId2, { color, title });
}


// --- Plot style constants (v1-v3 bare globals; v4 moved them to plot.style_*) ---
export const line = "line";
export const histogram = "histogram";
export const columns = "columns";
export const circles = "circles";
export const areabr = "areabr";
export const linebr = "linebr";
export const stepline = "stepline";
export const area = "area";

// --- hline style constants (v1-v3; v4 moved them to hline.style_*) ---
export const dotted = "dotted";
export const dashed = "dashed";
export const solid = "solid";

// --- plotshape/plotchar location constants ---
export const location = {
    abovebar: "abovebar",
    belowbar: "belowbar",
    top: "top",
    bottom: "bottom",
    absolute: "absolute",
};

// --- plotshape style constants ---
export const shape = {
    xcross: "xcross", cross: "cross", triangleup: "triangleup",
    triangledown: "triangledown", flag: "flag", circle: "circle",
    arrowup: "arrowup", arrowdown: "arrowdown", labelup: "labelup",
    labeldown: "labeldown", square: "square", diamond: "diamond",
};

// --- size constants ---
export const size = {
    auto: "auto", tiny: "tiny", small: "small",
    normal: "normal", large: "large", huge: "huge",
};

/**
 * color(col, transp) — the v1-v3 spelling. v4 renamed it to color.new().
 * Applies a transparency percentage (0 = opaque, 100 = invisible) to a hex
 * colour, returning #RRGGBBAA.
 */
export function color(col: any, transp?: any): string {
    const base = String(col && typeof col.valueOf === "function" ? col.valueOf() : col ?? "#000000");
    const t = Number(transp && typeof transp.valueOf === "function" ? transp.valueOf() : transp ?? 0);
    const hex = base.slice(0, 7);
    if (!Number.isFinite(t)) return hex;
    const alpha = Math.round(255 * (1 - Math.min(Math.max(t, 0), 100) / 100));
    return hex + alpha.toString(16).padStart(2, "0");
}

/** tickerid(prefix, ticker) — exchange-qualified symbol string. */
export function tickerid(prefix: any, ticker: any): string {
    const p = String(prefix && typeof prefix.valueOf === "function" ? prefix.valueOf() : prefix ?? "");
    const t = String(ticker && typeof ticker.valueOf === "function" ? ticker.valueOf() : ticker ?? "");
    return p ? `${p}:${t}` : t;
}


/**
 * alertcondition(condition, title, message) — stub.
 *
 * There is no alert delivery system to integrate with locally, so the fired
 * condition is recorded into the context instead of dispatched, which keeps it
 * inspectable. Signature-compatible so real scripts run. See R-10.
 */
export function alertcondition(ctx: Context, condition: any, title?: any, message?: any): void {
    const fired = Boolean(condition && typeof condition.valueOf === "function"
        ? condition.valueOf() : condition);
    if (!fired) return;
    (ctx as any).alerts ??= [];
    (ctx as any).alerts.push({
        bar: ctx.currentBarIndex,
        time: ctx.time,
        title: String(title ?? ""),
        message: String(message ?? ""),
    });
}

/**
 * currency.* — the account currency the strategy reports in. Host-provided;
 * NONE means "same as the symbol". See R-15.
 */
export const currency = {
    NONE: "", USD: "USD", EUR: "EUR", GBP: "GBP", JPY: "JPY",
    CHF: "CHF", AUD: "AUD", CAD: "CAD", NZD: "NZD", HKD: "HKD",
    SGD: "SGD", INR: "INR", RUB: "RUB", ZAR: "ZAR", TRY: "TRY",
};
