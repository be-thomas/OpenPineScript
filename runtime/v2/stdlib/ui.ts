/**
 * runtime/v2/stdlib/ui.ts
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
