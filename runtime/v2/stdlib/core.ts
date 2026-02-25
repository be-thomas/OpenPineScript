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
    return val(cond) ? t : f;
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

export const __CONTEXT_AWARE__: string[] = [];
export const __SIGNATURES__: Record<string, string[]> = {

}