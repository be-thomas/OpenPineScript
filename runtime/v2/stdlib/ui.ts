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

// --- Inputs (Mock for now) ---
export function input(ctx: Context, defval: any, title?: string): any {
    // In a real UI, this would read from a config object.
    return defval; 
}

// --- Outputs ---

export function plot(
    ctx: Context, 
    series: number, 
    title: string = "Plot", 
    color?: string, 
    linewidth: number = 1, 
    style?: number
): string { 
    // Register the value to the Context's storage.
    ctx.registerPlot(series, title, { 
        color, 
        linewidth, 
        style, 
        type: 'line' 
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
    // 1. Convert to Number (Boolean true becomes 1, false becomes 0)
    let val = Number(series);

    // 2. Pine Rule: 0 means "False" (Don't Plot). 
    // We convert 0 to NaN so the chart ignores it.
    if (val === 0) {
        val = NaN;
    }

    ctx.registerPlot(val, title, { 
        color, 
        style, 
        type: 'shape' 
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

    // Same rule: 0 means don't plot.
    if (val === 0) {
        val = NaN;
    }

    ctx.registerPlot(val, title, { 
        color, 
        style: char, 
        type: 'char' 
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
    // Treat hline as a constant plot.
    // Note: In a real chart, hlines are often horizontal rays, 
    // but plotting them as a line series works for the Backtester.
    ctx.registerPlot(price, title, { 
        color, 
        linewidth, 
        style: linestyle, 
        type: 'line' 
    });
    return title; 
}

// --- Visual Layers ---

export function bgcolor(ctx: Context, color: string, transp?: number): void {
    // We use a reserved prefix for background colors so they don't clash with user plots
    // We plot '1' to indicate "Active" for this bar, with the specific color.
    ctx.registerPlot(1, `_BGCOLOR_${color}`, { color, type: 'bar' }); 
}

export function barcolor(ctx: Context, color: string): void {
    ctx.registerPlot(1, "_BARCOLOR_", { color, type: 'bar' });
}

export function fill(
    ctx: Context, 
    plotId1: string, // Receives the ID string returned by plot()/hline()
    plotId2: string, 
    color?: string, 
    title?: string, 
    editable?: boolean, 
    fillgaps?: boolean
): void {
    // Register the visual instruction to the context
    // This tells the frontend: "Draw color between Line A and Line B"
    ctx.registerFill(plotId1, plotId2, { color, title });
}


