/**
 * runtime/v2/stdlib/core.ts
 * Core functions for Pine Script v2 (Strict Compliance)
 */

// Helper: Auto-unwrap Series objects if they are passed directly to global functions
function val(x: any): any {
    if (x !== null && x !== undefined && typeof x.valueOf === 'function') {
        return x.valueOf();
    }
    return x;
}




// --- Polymorphic Null Checks ---


// na(x): Returns true if x is NaN (number) or null/undefined (string/bool)
export function na(x: any): boolean {
    const v = val(x);
    return v === null || v === undefined || (typeof v === 'number' && isNaN(v));
}

// nz(x, y): Returns x if valid, otherwise y (default 0)
export function nz(x: any, y?: any): any {
    const v = val(x);
    if (v === null || v === undefined || (typeof v === 'number' && isNaN(v))) {
        return y !== undefined ? val(y) : 0;
    }
    return v;
}


// iff(cond, trueVal, falseVal): Functional ternary operator
export function iff(cond: any, t: any, f: any): any {
    return val(cond) ? val(t) : val(f);
}

// --- Pine v2 Arithmetic Anomaly Wrappers ---

// safe_add: Coerces NaN ('na') to 0 to prevent logical counting from poisoning the series.
// Implicitly casts booleans (true=1, false=0).
export function safe_add(a: any, b: any): number {
    const nA = Number(val(a));
    const nB = Number(val(b));
    return (Number.isNaN(nA) ? 0 : nA) + (Number.isNaN(nB) ? 0 : nB);
}

// safe_sub: Coerces NaN ('na') to 0 to prevent logical counting from poisoning the series.
// Implicitly casts booleans (true=1, false=0).
export function safe_sub(a: any, b: any): number {
    const nA = Number(val(a));
    const nB = Number(val(b));
    return (Number.isNaN(nA) ? 0 : nA) - (Number.isNaN(nB) ? 0 : nB);
}

// --- Type Conversion (v2 Only) ---

// tostring(x): The ONLY casting function in v2
export function tostring(x: any): string {
    const v = val(x);
    if (v === null || v === undefined || (typeof v === 'number' && isNaN(v))) {
        return "NaN";
    }
    return String(v);
}

// --- Core Math ---

export function abs(x: any): number {
    return Math.abs(val(x));
}

export function acos(x: any): number {
    return Math.acos(val(x));
}

export function asin(x: any): number {
    return Math.asin(val(x));
}

export function atan(x: any): number {
    return Math.atan(val(x));
}

export function ceil(x: any): number {
    return Math.ceil(val(x));
}

export function cos(x: any): number {
    return Math.cos(val(x));
}

export function exp(x: any): number {
    return Math.exp(val(x));
}

export function floor(x: any): number {
    return Math.floor(val(x));
}

export function log(x: any): number {
    return Math.log(val(x));
}

export function log10(x: any): number {
    return Math.log10(val(x));
}

export function max(...args: any[]): number {
    return Math.max(...args.map(val));
}

export function min(...args: any[]): number {
    return Math.min(...args.map(val));
}

export function pow(x: any, y: any): number {
    return Math.pow(val(x), val(y));
}

export function round(x: any): number {
    return Math.round(val(x));
}

export function sign(x: any): number {
    return Math.sign(val(x));
}

export function sin(x: any): number {
    return Math.sin(val(x));
}

export function sqrt(x: any): number {
    return Math.sqrt(val(x));
}

export function tan(x: any): number {
    return Math.tan(val(x));
}

export function avg(...args: any[]): number {
    const vals = args.map(val);
    return vals.reduce((a, b) => a + b, 0) / vals.length;
}

// --- Standard Pine Palette (Material Design-ish) ---
export const red = "#FF5252";
export const green = "#4CAF50";
export const blue = "#2196F3";
export const orange = "#FF9800";
export const teal = "#009688";
export const navy = "#3F51B5";
export const white = "#FFFFFF";
export const black = "#000000";
export const gray = "#9E9E9E";
export const purple = "#9C27B0";
export const yellow = "#FFEB3B";
export const lime = "#CDDC39";
export const aqua = "#00BCD4";
export const fuchsia = "#E040FB";
export const olive = "#808000";
export const maroon = "#800000";
export const silver = "#C0C0C0";
