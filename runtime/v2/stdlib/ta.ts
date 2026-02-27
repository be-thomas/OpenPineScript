import { Context } from "../context";

/**
 * ta.ts - Production Grade (Fully Dynamic & Safe)
 * - Series Aware: Automatically unwraps Series Objects to primitive numbers.
 * - O(1) Speed for stable lengths.
 * - History Buffer + Auto-Rebuild for dynamic length changes.
 */

// --- Constants ---
const HEAL_SMA_INTERVAL = 200; 
const HEAL_VAR_INTERVAL = 50;  
const MAX_BUFFER_SIZE = 5000; 

// --- Helper: Series Unwrapper ---
function val(v: any): number {
    if (v === null || v === undefined) return NaN;
    return (typeof v.valueOf === 'function') ? Number(v.valueOf()) : Number(v);
}

// --- Helper Types ---
interface BufferState { buffer: number[]; }
interface SumState { buffer: number[]; sum: number; prevLength: number; counter: number; }
interface StdDevState { buffer: number[]; sum: number; sumSq: number; prevLength: number; counter: number; }
interface WmaState { buffer: number[]; sum: number; numerator: number; counter: number; prevLength: number; }
interface DequeState { buffer: number[]; dequeVals: number[]; dequeIdxs: number[]; globalIdx: number; prevLength: number; }
interface EmaState { prev: number | undefined; }
interface CrossState { prevX: number; prevY: number; }
interface BarsSinceState { counter: number; }
interface ValueWhenState { history: number[]; }
interface AtrState { prevClose: number; }
interface VwapState { sumVol: number; sumSrcVol: number; }
interface SarState { isLong: boolean; af: number; ep: number; sar: number; initialized: boolean; }

// --- Moving Averages ---

/**
 * Simple Moving Average
 * @returns series float
 */
export function sma(ctx: Context, sourceInput: any, lengthInput: any): number {
    const source = val(sourceInput);
    const length = Math.floor(val(lengthInput));

    const state = ctx.getPersistentState<SumState>(() => ({ 
        buffer: [], sum: 0, prevLength: 0, counter: 0 
    }));

    state.buffer.push(source);

    if (length !== state.prevLength) {
        state.sum = 0;
        const start = Math.max(0, state.buffer.length - length);
        for (let i = start; i < state.buffer.length; i++) {
            state.sum += state.buffer[i];
        }
       state.prevLength = length;
        state.counter = 0; // Reset healing
    } else {
        // O(1) UPDATE
        state.sum += source;
        
        // If we have more data than the window needs, subtract the trailing item.
        // The item leaving the window is at index: (Total - 1) - Length
        if (state.buffer.length > length) {
            const exitIdx = state.buffer.length - 1 - length;
            state.sum -= state.buffer[exitIdx];
        }

        // HEALING
        if (++state.counter >= HEAL_SMA_INTERVAL) {
            state.sum = 0;
            const start = Math.max(0, state.buffer.length - length);
            for (let i = start; i < state.buffer.length; i++) state.sum += state.buffer[i];
            state.counter = 0;
        }
    }

    if (state.buffer.length > MAX_BUFFER_SIZE) {
        const keep = length + 500;
        if (state.buffer.length > keep) state.buffer.splice(0, state.buffer.length - keep);
    }

    if (state.buffer.length < length) return NaN;
    return state.sum / length;
}

/**
 * Exponential Moving Average
 * @returns series float
 */
export function ema(ctx: Context, sourceInput: any, lengthInput: any): number {
    const source = val(sourceInput);
    const length = val(lengthInput);
    const state = ctx.getPersistentState<EmaState>(() => ({ prev: undefined }));
    const alpha = 2 / (length + 1);

    if (state.prev === undefined) {
        state.prev = source;
        return source;
    }

    const currentEma = (source * alpha) + (state.prev * (1 - alpha));
    state.prev = currentEma;
    return currentEma;
}

/**
 * Rolling Moving Average (Used in RSI)
 * @returns series float
 */
export function rma(ctx: Context, sourceInput: any, lengthInput: any): number {
    const source = val(sourceInput);
    const length = val(lengthInput);
    
    // Uses whatever is on the stack (e.g., ".../ta.atr/internal_rma")
    const state = ctx.getPersistentState<EmaState>(() => ({ prev: undefined }));

    // Inside rma
    if (ctx.currentBarIndex < 3) {
        console.log(`[ENGINE] Bar ${ctx.currentBarIndex} | Source: ${source} | Prev: ${state.prev}`);
    }
    
    if (isNaN(source)) return NaN;

    if (state.prev === undefined || isNaN(state.prev)) { 
        state.prev = source; 
        return source; 
    }
    
    const alpha = 1 / length;
    const currentRma = (source * alpha) + (state.prev * (1 - alpha));
    state.prev = currentRma;
    return currentRma;
}

/**
 * Weighted Moving Average
 * @returns series float
 */
export function wma(ctx: Context, sourceInput: any, lengthInput: any): number {
    const source = val(sourceInput);
    const length = Math.floor(val(lengthInput));
    const state = ctx.getPersistentState<WmaState>(() => ({ 
        buffer: [], sum: 0, numerator: 0, counter: 0, prevLength: 0
    }));

    state.buffer.push(source);

    if (length !== state.prevLength || state.buffer.length <= length) {
        state.sum = 0;
        state.numerator = 0;
        const start = Math.max(0, state.buffer.length - length);
        for (let i = start; i < state.buffer.length; i++) {
            const v = state.buffer[i];
            const weight = (i - start) + 1;
            state.sum += v;
            state.numerator += v * weight;
        }
        state.prevLength = length;
        state.counter = 0;
    } else {
        state.numerator = state.numerator + (length * source) - state.sum;
        state.sum += source;
        if (state.buffer.length > length) {
            const exitIdx = state.buffer.length - 1 - length;
            state.sum -= state.buffer[exitIdx];
        }
        if (++state.counter >= HEAL_SMA_INTERVAL) {
            let n = 0; let s = 0;
            const start = Math.max(0, state.buffer.length - length);
            for (let i = start; i < state.buffer.length; i++) {
                const v = state.buffer[i];
                const weight = (i - start) + 1;
                s += v; n += v * weight;
            }
            state.sum = s; state.numerator = n; state.counter = 0;
        }
    }
    
    if (state.buffer.length > MAX_BUFFER_SIZE) {
        const keep = length + 500;
        if (state.buffer.length > keep) state.buffer.splice(0, state.buffer.length - keep);
    }

    if (state.buffer.length < length) return NaN;
    return state.numerator / (length * (length + 1) / 2);
}

/**
 * Volume Weighted Moving Average
 * @returns series float
 */
export function vwma(ctx: Context, sourceInput: any, lengthInput: any): number {
    const source = val(sourceInput);
    const length = val(lengthInput);
    const num = sma(ctx, source * ctx.volume, length);
    const denom = sma(ctx, ctx.volume, length);
    return num / denom;
}

/**
 * Symmetrically Weighted Moving Average
 * @returns series float
 */
export function swma(ctx: Context, sourceInput: any): number {
    const source = val(sourceInput);
    const state = ctx.getPersistentState<BufferState>(() => ({ buffer: [] }));
    state.buffer.push(source);
    if (state.buffer.length > 4) state.buffer.shift();
    if (state.buffer.length < 4) return NaN;
    return (state.buffer[0] * 1 + state.buffer[1] * 2 + state.buffer[2] * 2 + state.buffer[3] * 1) / 6;
}

/**
 * TRIX Oscillator
 * @returns series float
 */
export function trix(ctx: Context, sourceInput: any, lengthInput: any): number {
    const source = val(sourceInput);
    const length = val(lengthInput);
    const e1 = ema(ctx, source, length);
    const e2 = ema(ctx, e1, length);
    const e3 = ema(ctx, e2, length);
    const state = ctx.getPersistentState<{ prevE3: number | undefined }>(() => ({ prevE3: undefined }));
    if (state.prevE3 === undefined) { state.prevE3 = e3; return 0; }
    const result = 100 * (e3 - state.prevE3) / state.prevE3;
    state.prevE3 = e3;
    return result;
}

// --- Oscillators ---

/**
 * Relative Strength Index
 * @returns series float
 */
export function rsi(ctx: Context, sourceInput: any, lengthInput: any): number {
    const source = val(sourceInput);
    const length = val(lengthInput);
    const state = ctx.getPersistentState<{ prevSrc: number | undefined }>(() => ({ prevSrc: undefined }));
    if (state.prevSrc === undefined) {
        state.prevSrc = source;
        rma(ctx, 0, length); rma(ctx, 0, length);
        return NaN;
    }
    const change = source - state.prevSrc;
    state.prevSrc = source;
    const avgGain = rma(ctx, Math.max(change, 0), length);
    const avgLoss = rma(ctx, Math.max(-change, 0), length);
    if (avgLoss === 0) return 100;
    return 100 - (100 / (1 + (avgGain / avgLoss)));
}

/**
 * Calculates MACD
 * @returns [series float, series float, series float]
 */
export function macd(ctx: Context, sourceInput: any, fastLenInput: any, slowLenInput: any, sigLenInput: any): [number, number, number] {
    const source = val(sourceInput);
    const fast = ema(ctx, source, val(fastLenInput));
    const slow = ema(ctx, source, val(slowLenInput));
    const macdLine = fast - slow;
    const signalLine = ema(ctx, macdLine, val(sigLenInput));
    return [macdLine, signalLine, macdLine - signalLine];
}

/**
 * Momentum
 * @returns series float
 */
export function mom(ctx: Context, sourceInput: any, lengthInput: any): number {
    const source = val(sourceInput);
    const length = Math.floor(val(lengthInput));
    const state = ctx.getPersistentState<BufferState>(() => ({ buffer: [] }));
    state.buffer.push(source);
    if (state.buffer.length > MAX_BUFFER_SIZE) {
         const keep = length + 500;
         if (state.buffer.length > keep) state.buffer.splice(0, state.buffer.length - keep);
    }
    if (state.buffer.length <= length) return NaN;
    return source - state.buffer[state.buffer.length - 1 - length];
}

// --- Bounds / Extremes ---

/**
 * Bollinger Bands
 * @returns [series float, series float, series float]
 */
export function bb(ctx: Context, sourceInput: any, lengthInput: any, multInput: any): [number, number, number] {
    const source = val(sourceInput);
    const length = Math.floor(val(lengthInput));
    const mult = val(multInput);

    const state = ctx.getPersistentState<StdDevState>(() => ({ 
        buffer: [], sum: 0, sumSq: 0, prevLength: 0, counter: 0 
    }));

    state.buffer.push(source);

    if (length !== state.prevLength) {
        state.sum = 0; state.sumSq = 0;
        const start = Math.max(0, state.buffer.length - length);
        for (let i = start; i < state.buffer.length; i++) {
            const v = state.buffer[i];
            state.sum += v; state.sumSq += (v * v);
        }
        state.prevLength = length;
        state.counter = 0;
    } else {
        state.sum += source;
        state.sumSq += (source * source);
        if (state.buffer.length > length) {
            const exitIdx = state.buffer.length - 1 - length;
            const removed = state.buffer[exitIdx];
            state.sum -= removed; state.sumSq -= (removed * removed);
        }
        if (++state.counter >= HEAL_VAR_INTERVAL) {
            state.sum = 0; state.sumSq = 0;
            const start = Math.max(0, state.buffer.length - length);
            for (let i = start; i < state.buffer.length; i++) {
                const v = state.buffer[i];
                state.sum += v; state.sumSq += (v * v);
            }
            state.counter = 0;
        }
    }

    // MEMORY MANAGEMENT
    if (state.buffer.length > MAX_BUFFER_SIZE) {
        const keep = length + 500;
        if (state.buffer.length > keep) state.buffer.splice(0, state.buffer.length - keep);
    }

    if (state.buffer.length < length) return [NaN, NaN, NaN];

    const mean = state.sum / length;
    const dev = Math.sqrt(Math.max(0, (state.sumSq / length) - (mean * mean)));
    return [mean, mean + dev * mult, mean - dev * mult];
}

/**
 * Commodity Channel Index
 * @returns series float
 */
export function cci(ctx: Context, sourceInput: any, lengthInput: any): number {
    const source = val(sourceInput);
    const length = Math.floor(val(lengthInput));
    const ma = sma(ctx, source, length);
    const state = ctx.getPersistentState<BufferState>(() => ({ buffer: [] }));
    state.buffer.push(source);
    if (state.buffer.length > MAX_BUFFER_SIZE) {
         const keep = length + 500;
         if (state.buffer.length > keep) state.buffer.splice(0, state.buffer.length - keep);
    }
    if (state.buffer.length < length) return NaN;
    let meanDev = 0;
    const start = state.buffer.length - length;
    for(let i = start; i < state.buffer.length; i++) meanDev += Math.abs(state.buffer[i] - ma);
    return (source - ma) / (0.015 * (meanDev / length));
}

// --- Cross Logic ---
/**
 * Cross
 * @returns bool
 */
export function cross(ctx: Context, xInput: any, yInput: any): boolean {
    const x = val(xInput); const y = val(yInput);
    const state = ctx.getPersistentState<CrossState>(() => ({ prevX: NaN, prevY: NaN }));
    if (isNaN(state.prevX)) { state.prevX = x; state.prevY = y; return false; }
    const result = (state.prevX > state.prevY && x < y) || (state.prevX < state.prevY && x > y);
    state.prevX = x; state.prevY = y;
    return result;
}
/**
 * Crossover
 * @returns bool
 */
export function crossover(ctx: Context, xInput: any, yInput: any): boolean {
    const x = val(xInput); const y = val(yInput);
    const state = ctx.getPersistentState<CrossState>(() => ({ prevX: NaN, prevY: NaN }));
    if (isNaN(state.prevX)) { state.prevX = x; state.prevY = y; return false; }
    const result = state.prevX <= state.prevY && x > y;
    state.prevX = x; state.prevY = y;
    return result;
}
/**
 * Crossunder
 * @returns bool
 */
export function crossunder(ctx: Context, xInput: any, yInput: any): boolean {
    const x = val(xInput); const y = val(yInput);
    const state = ctx.getPersistentState<CrossState>(() => ({ prevX: NaN, prevY: NaN }));
    if (isNaN(state.prevX)) { state.prevX = x; state.prevY = y; return false; }
    const result = state.prevX >= state.prevY && x < y;
    state.prevX = x; state.prevY = y;
    return result;
}

// --- Dynamic Highest/Lowest ---

function updateMonotonicDeque(state: DequeState, sourceInput: any, lengthInput: any, isMin: boolean) {
    const source = val(sourceInput);
    const length = Math.floor(val(lengthInput));
    state.buffer.push(source);

    if (length !== state.prevLength) {
        state.dequeVals = []; state.dequeIdxs = []; state.prevLength = length;
        const start = Math.max(0, state.buffer.length - length);
        for (let i = start; i < state.buffer.length; i++) {
            const v = state.buffer[i];
            const idx = state.globalIdx - (state.buffer.length - 1 - i);
            if (isMin) {
                while (state.dequeVals.length > 0 && state.dequeVals[state.dequeVals.length - 1] >= v) { state.dequeVals.pop(); state.dequeIdxs.pop(); }
            } else {
                while (state.dequeVals.length > 0 && state.dequeVals[state.dequeVals.length - 1] <= v) { state.dequeVals.pop(); state.dequeIdxs.pop(); }
            }
            state.dequeVals.push(v); state.dequeIdxs.push(idx);
        }
    } else {
        if (isMin) {
            while (state.dequeVals.length > 0 && state.dequeVals[state.dequeVals.length - 1] >= source) { state.dequeVals.pop(); state.dequeIdxs.pop(); }
        } else {
            while (state.dequeVals.length > 0 && state.dequeVals[state.dequeVals.length - 1] <= source) {
                state.dequeVals.pop();
                state.dequeIdxs.pop();
            }
        }
        state.dequeVals.push(source);
        state.dequeIdxs.push(state.globalIdx);

        if (state.dequeIdxs[0] <= state.globalIdx - length) {
            state.dequeVals.shift();
            state.dequeIdxs.shift();
        }
    }

   state.globalIdx++;
    if (state.buffer.length > MAX_BUFFER_SIZE) {
        const keep = length + 500;
        if (state.buffer.length > keep) state.buffer.splice(0, state.buffer.length - keep);
    }
}

/**
 * Highest value in window
 * @returns series float
 */
export function highest(ctx: Context, source: any, length: any): number {
    const state = ctx.getPersistentState<DequeState>(() => ({ buffer: [], dequeVals: [], dequeIdxs: [], globalIdx: 0, prevLength: 0 }));
    updateMonotonicDeque(state, source, length, false); 
    return state.dequeVals[0];
}

/**
 * Lowest value in window
 * @returns series float
 */
export function lowest(ctx: Context, source: any, length: any): number {
    const state = ctx.getPersistentState<DequeState>(() => ({ buffer: [], dequeVals: [], dequeIdxs: [], globalIdx: 0, prevLength: 0 }));
    updateMonotonicDeque(state, source, length, true); 
    return state.dequeVals[0];
}

/**
 * Offset to highest value
 * @returns series int
 */
export function highestbars(ctx: Context, source: any, length: any): number {
    const state = ctx.getPersistentState<DequeState>(() => ({ buffer: [], dequeVals: [], dequeIdxs: [], globalIdx: 0, prevLength: 0 }));
    updateMonotonicDeque(state, source, length, false);
    return state.dequeIdxs[0] - (state.globalIdx - 1);
}

/**
 * Offset to lowest value
 * @returns series int
 */
export function lowestbars(ctx: Context, source: any, length: any): number {
    const state = ctx.getPersistentState<DequeState>(() => ({ buffer: [], dequeVals: [], dequeIdxs: [], globalIdx: 0, prevLength: 0 }));
    updateMonotonicDeque(state, source, length, true);
    return state.dequeIdxs[0] - (state.globalIdx - 1);
}

/**
 * Stochastic
 * @returns series float
 */
export function stoch(ctx: Context, sourceInput: any, highInput: any, lowInput: any, lengthInput: any): number {
    const source = val(sourceInput);
    const l = lowest(ctx, lowInput, lengthInput);
    const h = highest(ctx, highInput, lengthInput);
    if (h === l) return 0; 
    return 100 * (source - l) / (h - l);
}

// --- Legacy State Lookups & Math ---

/**
 * valuewhen: Returns the value of 'source' when 'condition' was true on the nth occurrence.
 * @returns series float
 */
export function valuewhen(ctx: Context, conditionInput: any, sourceInput: any, occurrenceInput: any): number {
    const condition = val(conditionInput);
    const source = val(sourceInput);
    const occurrence = Math.floor(val(occurrenceInput));
    
    const state = ctx.getPersistentState<ValueWhenState>(() => ({ history: [] }));

    if (condition) {
        state.history.unshift(source); // Prepend so index 0 is the most recent
        if (state.history.length > MAX_BUFFER_SIZE) {
            state.history.pop();
        }
    }

    if (occurrence < 0 || occurrence >= state.history.length) return NaN;
    return state.history[occurrence];
}

/**
 * barssince: Returns the number of bars since the condition last evaluated to true.
 * @returns series int
 */
export function barssince(ctx: Context, conditionInput: any): number {
    const condition = val(conditionInput);
    const state = ctx.getPersistentState<BarsSinceState>(() => ({ counter: NaN }));
    
    if (condition) {
        state.counter = 0;
    } else if (!isNaN(state.counter)) {
        state.counter++;
    }
    
    return state.counter;
}

/**
 * atr: Average True Range (requires contextual high/low/close data)
 * @returns series float
 */
export function atr(ctx: Context, lengthInput: any): number {
    const length = val(lengthInput);
    const state = ctx.getPersistentState<AtrState>(() => ({ prevClose: NaN }));
    
    const currentHigh = ctx.high;
    const currentLow = ctx.low;
    const currentClose = ctx.close;

    const prevC = isNaN(state.prevClose) ? currentClose : state.prevClose;
    const trueRange = Math.max(
        currentHigh - currentLow,
        Math.abs(currentHigh - prevC),
        Math.abs(currentLow - prevC)
    );
    
    state.prevClose = currentClose;
    
    // MANUAL STACK PUSH: Ensures isolation without triggering registry-based injection
    (ctx as any).callStack.push("internal_rma");
    const result = rma(ctx, trueRange, length);
    (ctx as any).callStack.pop();
    
    return result;
}

/**
 * vwap: Cumulative Volume Weighted Average Price (Sessionless)
 * @returns series float
 */
export function vwap(ctx: Context, sourceInput: any): number {
    const source = val(sourceInput);
    const volume = (ctx as any).volume !== undefined ? val((ctx as any).volume) : 0;
    
    const state = ctx.getPersistentState<VwapState>(() => ({ sumVol: 0, sumSrcVol: 0 }));
    
    state.sumVol += volume;
    state.sumSrcVol += source * volume;
    
    if (state.sumVol === 0) return NaN;
    return state.sumSrcVol / state.sumVol;
}

/**
 * linreg: Linear Regression Curve
 * @returns series float
 */
export function linreg(ctx: Context, sourceInput: any, lengthInput: any, offsetInput: any = 0): number {
    const source = val(sourceInput);
    const length = Math.floor(val(lengthInput));
    const offset = Math.floor(val(offsetInput));
    
    const state = ctx.getPersistentState<BufferState>(() => ({ buffer: [] }));
    state.buffer.push(source);
    
    if (state.buffer.length > MAX_BUFFER_SIZE) {
        const keep = length + 500;
        if (state.buffer.length > keep) state.buffer.splice(0, state.buffer.length - keep);
    }
    
    if (state.buffer.length < length) return NaN;
    
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    const start = state.buffer.length - length;
    
    for (let i = 0; i < length; i++) {
        const y = state.buffer[start + i];
        const x = i;
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
    }
    
    const slope = (length * sumXY - sumX * sumY) / (length * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / length;
    
    return intercept + slope * (length - 1 - offset);
}

/**
 * sar: Parabolic SAR (Simplified mathematical emulator)
 * @returns series float
 */
export function sar(ctx: Context, startInput: any, incInput: any, maxInput: any): number {
    const start = val(startInput);
    const inc = val(incInput);
    const max = val(maxInput);

    const high = (ctx as any).high !== undefined ? val((ctx as any).high) : 0;
    const low = (ctx as any).low !== undefined ? val((ctx as any).low) : 0;

    const state = ctx.getPersistentState<SarState>(() => ({
        isLong: true, af: start, ep: 0, sar: 0, initialized: false
    }));

    if (!state.initialized) {
        state.sar = low;
        state.ep = high;
        state.initialized = true;
        return state.sar;
    }

    let nextSar = state.sar + state.af * (state.ep - state.sar);

    if (state.isLong) {
        if (low < nextSar) {
            state.isLong = false;
            nextSar = Math.max(state.ep, high); // Switch to short
            state.ep = low;
            state.af = start;
        } else {
            if (high > state.ep) {
                state.ep = high;
                state.af = Math.min(state.af + inc, max);
            }
        }
    } else {
        if (high > nextSar) {
            state.isLong = true;
            nextSar = Math.min(state.ep, low); // Switch to long
            state.ep = high;
            state.af = start;
        } else {
            if (low < state.ep) {
                state.ep = low;
                state.af = Math.min(state.af + inc, max);
            }
        }
    }
    
    state.sar = nextSar;
    return state.sar;
}