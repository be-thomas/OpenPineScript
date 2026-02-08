import { Context } from "../context";

/**
 * ta.ts - Production Grade (Fully Dynamic & Safe)
 * - O(1) Speed for stable lengths.
 * - History Buffer + Auto-Rebuild for dynamic length changes (Up or Down).
 * - Self-Healing for numeric stability.
 */

// --- Constants ---
const HEAL_SMA_INTERVAL = 200; 
const HEAL_VAR_INTERVAL = 50;  
const MAX_BUFFER_SIZE = 5000; // Keeps history for dynamic increases

// --- Helper Types ---
interface BufferState {
    buffer: number[];
}

interface SumState {
    buffer: number[];
    sum: number;
    prevLength: number;
    counter: number;
}

interface StdDevState {
    buffer: number[];
    sum: number;
    sumSq: number; 
    prevLength: number;
    counter: number;
}

interface WmaState {
    buffer: number[];
    sum: number;       
    numerator: number; 
    counter: number;
    prevLength: number; 
}

interface DequeState {
    buffer: number[];      
    dequeVals: number[];   
    dequeIdxs: number[];   
    globalIdx: number;     
    prevLength: number;    
}

interface EmaState {
    prev: number | undefined;
}

interface CrossState {
    prevX: number;
    prevY: number;
}

// --- Moving Averages ---

export function sma(ctx: Context, source: number, length: number): number {
    const state = ctx.getPersistentState<SumState>(() => ({ 
        buffer: [], sum: 0, prevLength: 0, counter: 0 
    }));

    state.buffer.push(source);

    // DYNAMIC LENGTH HANDLER
    if (length !== state.prevLength) {
        // Rebuild Sum from history (Handle Increase or Decrease safely)
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

    // MEMORY MANAGEMENT
    if (state.buffer.length > MAX_BUFFER_SIZE) {
        // Keep requested length + padding for potential future increases
        const keep = length + 500;
        if (state.buffer.length > keep) state.buffer.splice(0, state.buffer.length - keep);
    }

    if (state.buffer.length < length) return NaN;
    return state.sum / length;
}

export function ema(ctx: Context, source: number, length: number): number {
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

export function rma(ctx: Context, source: number, length: number): number {
    const state = ctx.getPersistentState<EmaState>(() => ({ prev: undefined }));
    const alpha = 1 / length;
    if (state.prev === undefined) { state.prev = source; return source; }
    const currentRma = (source * alpha) + (state.prev * (1 - alpha));
    state.prev = currentRma;
    return currentRma;
}

export function wma(ctx: Context, source: number, length: number): number {
    const state = ctx.getPersistentState<WmaState>(() => ({ 
        buffer: [], sum: 0, numerator: 0, counter: 0, prevLength: 0
    }));

    state.buffer.push(source);

    // FIX: Force Rebuild if Length Changed OR if we are in Warmup Phase.
    // The O(1) formula relies on the window being full (sliding). 
    // If buffer < length, the weights distort (negative weights) if we use the fast update.
    if (length !== state.prevLength || state.buffer.length <= length) {
        // Rebuild O(N) - Safest for WMA complexity during warmup/change
        state.sum = 0;
        state.numerator = 0;
        const start = Math.max(0, state.buffer.length - length);
        
        for (let i = start; i < state.buffer.length; i++) {
            const val = state.buffer[i];
            const weight = (i - start) + 1;
            state.sum += val;
            state.numerator += val * weight;
        }
        state.prevLength = length;
        state.counter = 0;
    } else {
        // FAST UPDATE O(1) - Only safe when window is full
        state.numerator = state.numerator + (length * source) - state.sum;
        state.sum += source;

        if (state.buffer.length > length) {
            const exitIdx = state.buffer.length - 1 - length;
            const removed = state.buffer[exitIdx];
            state.sum -= removed;
        }

        if (++state.counter >= HEAL_SMA_INTERVAL) {
            let n = 0;
            let s = 0;
            const start = Math.max(0, state.buffer.length - length);
            for (let i = start; i < state.buffer.length; i++) {
                const val = state.buffer[i];
                const weight = (i - start) + 1;
                s += val;
                n += val * weight;
            }
            state.sum = s;
            state.numerator = n;
            state.counter = 0;
        }
    }
    
    if (state.buffer.length > MAX_BUFFER_SIZE) {
        const keep = length + 500;
        if (state.buffer.length > keep) state.buffer.splice(0, state.buffer.length - keep);
    }

    if (state.buffer.length < length) return NaN;
    const denom = length * (length + 1) / 2;
    return state.numerator / denom;
}

export function vwma(ctx: Context, source: number, length: number): number {
    const num = sma(ctx, source * ctx.volume, length);
    const denom = sma(ctx, ctx.volume, length);
    return num / denom;
}

export function swma(ctx: Context, source: number): number {
    const state = ctx.getPersistentState<BufferState>(() => ({ buffer: [] }));
    state.buffer.push(source);
    if (state.buffer.length > 4) state.buffer.shift();
    if (state.buffer.length < 4) return NaN;
    return (state.buffer[0] * 1 + state.buffer[1] * 2 + state.buffer[2] * 2 + state.buffer[3] * 1) / 6;
}

export function trix(ctx: Context, source: number, length: number): number {
    const e1 = ema(ctx, source, length);
    const e2 = ema(ctx, e1, length);
    const e3 = ema(ctx, e2, length);
    const state = ctx.getPersistentState<{ prevE3: number | undefined }>(() => ({ prevE3: undefined }));
    if (state.prevE3 === undefined) { state.prevE3 = e3; return 0; }
    const val = 100 * (e3 - state.prevE3) / state.prevE3;
    state.prevE3 = e3;
    return val;
}

// --- Oscillators ---

export function rsi(ctx: Context, source: number, length: number): number {
    const state = ctx.getPersistentState<{ prevSrc: number | undefined }>(() => ({ prevSrc: undefined }));
    if (state.prevSrc === undefined) {
        state.prevSrc = source;
        rma(ctx, 0, length); rma(ctx, 0, length);
        return NaN;
    }
    const change = source - state.prevSrc;
    state.prevSrc = source;
    const gain = Math.max(change, 0);
    const loss = Math.max(-change, 0);
    const avgGain = rma(ctx, gain, length);
    const avgLoss = rma(ctx, loss, length);
    if (avgLoss === 0) return 100;
    return 100 - (100 / (1 + (avgGain / avgLoss)));
}

export function macd(ctx: Context, source: number, fastLen: number, slowLen: number, sigLen: number): [number, number, number] {
    const fast = ema(ctx, source, fastLen);
    const slow = ema(ctx, source, slowLen);
    const macdLine = fast - slow;
    const signalLine = ema(ctx, macdLine, sigLen);
    return [macdLine, signalLine, macdLine - signalLine];
}

export function mom(ctx: Context, source: number, length: number): number {
    const state = ctx.getPersistentState<BufferState>(() => ({ buffer: [] }));
    state.buffer.push(source);
    
    // Just keep buffer within safe limits.
    // To calculate mom(length), we need buffer[end - length]
    if (state.buffer.length > MAX_BUFFER_SIZE) {
         const keep = length + 500;
         if (state.buffer.length > keep) state.buffer.splice(0, state.buffer.length - keep);
    }
    
    if (state.buffer.length <= length) return NaN;
    // Index: (Total - 1) - Length
    return source - state.buffer[state.buffer.length - 1 - length];
}

// --- Bounds / Extremes ---

export function bb(ctx: Context, source: number, length: number, mult: number): [number, number, number] {
    const state = ctx.getPersistentState<StdDevState>(() => ({ 
        buffer: [], sum: 0, sumSq: 0, prevLength: 0, counter: 0 
    }));

    state.buffer.push(source);

    // DYNAMIC LENGTH HANDLER
    if (length !== state.prevLength) {
        // Full Rebuild
        state.sum = 0;
        state.sumSq = 0;
        const start = Math.max(0, state.buffer.length - length);
        for (let i = start; i < state.buffer.length; i++) {
            const val = state.buffer[i];
            state.sum += val;
            state.sumSq += (val * val);
        }
        state.prevLength = length;
        state.counter = 0;
    } else {
        // O(1) UPDATE
        state.sum += source;
        state.sumSq += (source * source);

        if (state.buffer.length > length) {
            const exitIdx = state.buffer.length - 1 - length;
            const removed = state.buffer[exitIdx];
            state.sum -= removed;
            state.sumSq -= (removed * removed);
        }

        // HEALING (Frequent healing for Variance)
        if (++state.counter >= HEAL_VAR_INTERVAL) {
            state.sum = 0;
            state.sumSq = 0;
            const start = Math.max(0, state.buffer.length - length);
            for (let i = start; i < state.buffer.length; i++) {
                const val = state.buffer[i];
                state.sum += val;
                state.sumSq += (val * val);
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
    const variance = Math.max(0, (state.sumSq / length) - (mean * mean));
    const dev = Math.sqrt(variance);

    return [mean, mean + dev * mult, mean - dev * mult];
}

export function cci(ctx: Context, source: number, length: number): number {
    const ma = sma(ctx, source, length);
    const state = ctx.getPersistentState<BufferState>(() => ({ buffer: [] }));
    state.buffer.push(source);
    
    // We need at least 'length' history for MeanDev calculation
    if (state.buffer.length > MAX_BUFFER_SIZE) {
         const keep = length + 500;
         if (state.buffer.length > keep) state.buffer.splice(0, state.buffer.length - keep);
    }

    if (state.buffer.length < length) return NaN;

    // MeanDev needs iteration (O(N)) because Mean changes every bar
    // Scan only the relevant window (last 'length' items)
    let meanDev = 0;
    const start = state.buffer.length - length;
    for(let i = start; i < state.buffer.length; i++) {
        meanDev += Math.abs(state.buffer[i] - ma);
    }
    meanDev /= length;

    return (source - ma) / (0.015 * meanDev);
}

// --- Cross Logic ---
export function cross(ctx: Context, x: number, y: number): boolean {
    const state = ctx.getPersistentState<CrossState>(() => ({ prevX: NaN, prevY: NaN }));
    if (isNaN(state.prevX)) { state.prevX = x; state.prevY = y; return false; }
    const result = (state.prevX > state.prevY && x < y) || (state.prevX < state.prevY && x > y);
    state.prevX = x; state.prevY = y;
    return result;
}
export function crossover(ctx: Context, x: number, y: number): boolean {
    const state = ctx.getPersistentState<CrossState>(() => ({ prevX: NaN, prevY: NaN }));
    if (isNaN(state.prevX)) { state.prevX = x; state.prevY = y; return false; }
    const result = state.prevX <= state.prevY && x > y;
    state.prevX = x; state.prevY = y;
    return result;
}
export function crossunder(ctx: Context, x: number, y: number): boolean {
    const state = ctx.getPersistentState<CrossState>(() => ({ prevX: NaN, prevY: NaN }));
    if (isNaN(state.prevX)) { state.prevX = x; state.prevY = y; return false; }
    const result = state.prevX >= state.prevY && x < y;
    state.prevX = x; state.prevY = y;
    return result;
}

// --- Dynamic Highest/Lowest (Hybrid O(1)/O(N)) ---

function updateMonotonicDeque(state: DequeState, source: number, length: number, isMin: boolean) {
    state.buffer.push(source);

    // 1. Dynamic Rebuild Check (Full Rebuild if length changes)
    if (length !== state.prevLength) {
        state.dequeVals = [];
        state.dequeIdxs = [];
        state.prevLength = length;

        const start = Math.max(0, state.buffer.length - length);
        
        for (let i = start; i < state.buffer.length; i++) {
            const val = state.buffer[i];
            const itemGlobalIdx = state.globalIdx - (state.buffer.length - 1 - i);

            if (isMin) {
                while (state.dequeVals.length > 0 && state.dequeVals[state.dequeVals.length - 1] >= val) {
                    state.dequeVals.pop();
                    state.dequeIdxs.pop();
                }
            } else {
                while (state.dequeVals.length > 0 && state.dequeVals[state.dequeVals.length - 1] <= val) {
                    state.dequeVals.pop();
                    state.dequeIdxs.pop();
                }
            }
            state.dequeVals.push(val);
            state.dequeIdxs.push(itemGlobalIdx);
        }
    } else {
        // 2. Incremental Update
        if (isMin) {
            while (state.dequeVals.length > 0 && state.dequeVals[state.dequeVals.length - 1] >= source) {
                state.dequeVals.pop();
                state.dequeIdxs.pop();
            }
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

    // Memory Management
    if (state.buffer.length > MAX_BUFFER_SIZE) {
        const keep = length + 500;
        if (state.buffer.length > keep) state.buffer.splice(0, state.buffer.length - keep);
    }
}

export function highest(ctx: Context, source: number, length: number): number {
    const state = ctx.getPersistentState<DequeState>(() => ({ 
        buffer: [], dequeVals: [], dequeIdxs: [], globalIdx: 0, prevLength: 0
    }));
    updateMonotonicDeque(state, source, length, false); 
    return state.dequeVals[0];
}

export function lowest(ctx: Context, source: number, length: number): number {
    const state = ctx.getPersistentState<DequeState>(() => ({ 
        buffer: [], dequeVals: [], dequeIdxs: [], globalIdx: 0, prevLength: 0
    }));
    updateMonotonicDeque(state, source, length, true); 
    return state.dequeVals[0];
}

export function highestbars(ctx: Context, source: number, length: number): number {
    const state = ctx.getPersistentState<DequeState>(() => ({ 
        buffer: [], dequeVals: [], dequeIdxs: [], globalIdx: 0, prevLength: 0
    }));
    updateMonotonicDeque(state, source, length, false);
    return state.dequeIdxs[0] - (state.globalIdx - 1);
}

export function lowestbars(ctx: Context, source: number, length: number): number {
    const state = ctx.getPersistentState<DequeState>(() => ({ 
        buffer: [], dequeVals: [], dequeIdxs: [], globalIdx: 0, prevLength: 0
    }));
    updateMonotonicDeque(state, source, length, true);
    return state.dequeIdxs[0] - (state.globalIdx - 1);
}

// --- Stoch (O(1) amortized) ---
export function stoch(ctx: Context, source: number, high: number, low: number, length: number): number {
    const l = lowest(ctx, low, length);
    const h = highest(ctx, high, length);
    if (h === l) return 0; 
    return 100 * (source - l) / (h - l);
}
