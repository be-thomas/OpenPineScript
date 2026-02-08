import { Context } from "../context";

/**
 * ui.ts - Open Pine Script v2 UI and Plotting Functions
 * Connects directly to the Context to store data series.
 */

// --- Colors (Pine Script Standard) ---
export const color_red = "#FF0000";
export const color_green = "#00FF00";
export const color_blue = "#0000FF";
export const color_orange = "#FFA500";
export const color_teal = "#008080";
export const color_navy = "#000080";
export const color_white = "#FFFFFF";
export const color_black = "#000000";
export const color_gray = "#808080";

// --- Inputs ---
export function input(ctx: Context, defval: any, title?: string, type?: string, minval?: number, maxval?: number): any {
    // In a real UI, this would read from a config object. 
    // For the backtester, we simply return the default value.
    return defval;
}

// --- Outputs ---

/**
 * Plots a series of data to the chart/context.
 */
export function plot(ctx: Context, series: number, title: string = "Plot", color?: string, linewidth?: number, style?: any): void {
    // Register the value to the Context's storage.
    // The Context handles alignment, gaps, and synchronization.
    ctx.registerPlot(series, title);
}

/**
 * Plots a shape (signal) on the chart.
 * For the CLI Backtester, we map:
 * - True/Truthy -> 1 (Signal)
 * - False/Falsy -> NaN (No Signal)
 */
export function plotshape(ctx: Context, series: any, title: string = "Shape", style?: any, location?: any, color?: string): void {
    const val = series ? 1 : NaN;
    ctx.registerPlot(val, title);
}

/**
 * Plots a character on the chart.
 */
export function plotchar(ctx: Context, series: any, title: string = "Char", char?: string, location?: any, color?: string): void {
    const val = series ? 1 : NaN;
    ctx.registerPlot(val, title);
}

/**
 * Plots a horizontal line.
 * We register this as a constant series (repeats the value every bar).
 */
export function hline(ctx: Context, price: number, title: string = "HLine", color?: string): void {
    ctx.registerPlot(price, title);
}

// --- Visual-Only Functions (No-Op for Data Backtester) ---

export function bgcolor(ctx: Context, color: string, transp?: number): void {
    // Context doesn't support visual layers yet.
}

export function barcolor(ctx: Context, color: string): void {
    // Context doesn't support visual layers yet.
}

export function fill(ctx: Context, plot1: any, plot2: any, color?: string): void {
    // Context doesn't support visual layers yet.
}
