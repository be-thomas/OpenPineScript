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
interface SumState { buffer: number[]; sum: number; prevLength: number; counter: number; nanCount: number; }
interface StdDevState { buffer: number[]; sum: number; sumSq: number; prevLength: number; counter: number; }
interface WmaState { buffer: number[]; sum: number; numerator: number; counter: number; prevLength: number; }
interface DequeState { buffer: number[]; dequeVals: number[]; dequeIdxs: number[]; globalIdx: number; prevLength: number; }
/** ema/rma warm-up: the samples collected before the SMA seed is available. */
interface EmaSeedState {
    prev: number | undefined;
    seed: number[];
}

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
        buffer: [], sum: 0, prevLength: 0, counter: 0, nanCount: 0
    }));

    state.buffer.push(source);

    // NaN is COUNTED, never summed.
    //
    // The running sum is incremental, so one `na` in the source poisoned it
    // permanently — `sum` became NaN and stayed NaN until the periodic heal
    // recomputed the window, HEAL_SMA_INTERVAL (200) bars later. That is exactly
    // what `sma(ema(close, 10), 10)` did once ema gained its warm-up: it
    // returned na for 200 bars instead of 18.
    //
    // Counting instead means the window knows whether it currently holds an
    // `na`, which is also the rule TradingView applies — ta.sma is na if any
    // value in its window is.
    const recompute = () => {
        state.sum = 0;
        state.nanCount = 0;
        const start = Math.max(0, state.buffer.length - length);
        for (let i = start; i < state.buffer.length; i++) {
            const v = state.buffer[i];
            if (Number.isNaN(v)) state.nanCount++;
            else state.sum += v;
        }
        state.counter = 0;
    };

    if (length !== state.prevLength) {
        recompute();
        state.prevLength = length;
    } else {
        // O(1) UPDATE
        if (Number.isNaN(source)) state.nanCount++;
        else state.sum += source;

        // If we have more data than the window needs, drop the trailing item.
        // The item leaving the window is at index: (Total - 1) - Length
        if (state.buffer.length > length) {
            const exiting = state.buffer[state.buffer.length - 1 - length];
            if (Number.isNaN(exiting)) state.nanCount--;
            else state.sum -= exiting;
        }

        // HEALING — bounds floating-point drift in the incremental sum.
        if (++state.counter >= HEAL_SMA_INTERVAL) recompute();
    }

    if (state.buffer.length > MAX_BUFFER_SIZE) {
        const keep = length + 500;
        if (state.buffer.length > keep) state.buffer.splice(0, state.buffer.length - keep);
    }

    if (state.buffer.length < length) return NaN;
    if (state.nanCount > 0) return NaN;   // any 'na' in the window makes the mean na
    return state.sum / length;
}

/**
 * Exponential Moving Average
 * @returns series float
 */
export function ema(ctx: Context, sourceInput: any, lengthInput: any): number {
    const source = val(sourceInput);
    const length = val(lengthInput);
    const state = ctx.getPersistentState<EmaSeedState>(() => ({ prev: undefined, seed: [] }));
    const alpha = 2 / (length + 1);

    // A leading 'na' in the source DELAYS the average; it does not kill it.
    //
    // Without these two guards the seed became NaN, and since every later value
    // is `source * alpha + prev * (1 - alpha)`, NaN propagated for the rest of
    // the script. That made `ema(sma(close, 10), 10)` — an ema of anything with
    // a warm-up — na on every bar, while `sma(ema(close, 10), 10)` worked. The
    // idiom is everywhere in published code (trix is three nested emas), so
    // this silently returned nothing for a whole class of real indicators.
    //
    // rma already did exactly this; ema did not. Matching it.
    if (isNaN(source)) return NaN;

    // ── WARM-UP: na until `length` samples, then seeded with their SMA ───────
    //
    // This is TradingView's rule, and it is not a detail. Seeding from the
    // FIRST value and returning it immediately — what this did — was 28% out at
    // the bar where TradingView's ema begins, and started the series `length-1`
    // bars too early. Both were caught by a 5,998-bar export:
    //
    //     seeding          relative error vs TradingView, bars 25-60
    //     first value      2.8e-01
    //     SMA of first N   2.9e-13     <- i.e. double-precision noise
    //
    // The error decays, so far enough along the chart the two agree and no
    // synthetic test would ever have noticed. Everything built on ema inherited
    // it: macd, tsi, trix, and any script smoothing a smoothed series.
    //
    // Samples are counted, not bars: `ema(sma(close, 10), 10)` sees na for its
    // first 9 inputs, and its own warm-up starts only once real values arrive.
    if (state.prev === undefined) {
        state.seed.push(source);
        if (state.seed.length < length) return NaN;
        state.prev = state.seed.reduce((a, b) => a + b, 0) / length;
        state.seed = [];
        return state.prev;
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
    const state = ctx.getPersistentState<EmaSeedState>(() => ({ prev: undefined, seed: [] }));

    if (isNaN(source)) return NaN;

    // Same warm-up rule as ema — see the note there. rma is what rsi and atr are
    // built from, so their start bars were wrong for the same reason.
    if (state.prev === undefined) {
        state.seed.push(source);
        if (state.seed.length < length) return NaN;
        state.prev = state.seed.reduce((a, b) => a + b, 0) / length;
        state.seed = [];
        return state.prev;
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
    // The two sma() accumulators must run under distinct frames; otherwise they
    // share one SumState and corrupt each other's rolling buffer.
    (ctx as any).callStack.push("vwma_num");
    const num = sma(ctx, source * ctx.volume, length);
    (ctx as any).callStack.pop();
    (ctx as any).callStack.push("vwma_denom");
    const denom = sma(ctx, ctx.volume, length);
    (ctx as any).callStack.pop();
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
    // Triple-smoothing: each ema() needs its own frame, otherwise all three
    // share one EmaState (and also collide with trix's own state below).
    (ctx as any).callStack.push("trix_e1");
    const e1 = ema(ctx, source, length);
    (ctx as any).callStack.pop();
    (ctx as any).callStack.push("trix_e2");
    const e2 = ema(ctx, e1, length);
    (ctx as any).callStack.pop();
    (ctx as any).callStack.push("trix_e3");
    const e3 = ema(ctx, e2, length);
    (ctx as any).callStack.pop();
    const state = ctx.getPersistentState<{ prevE3: number | undefined }>(() => ({ prevE3: undefined }));
    // Same rule as ema — do not latch a NaN as the comparison point.
    if (isNaN(e3)) return NaN;
    if (state.prevE3 === undefined || isNaN(state.prevE3)) { state.prevE3 = e3; return 0; }
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
    // avgGain and avgLoss are two independent RMAs — they need distinct frames,
    // and both must stay clear of rsi's own state above (which sits on the base
    // frame). Without isolation all three collide on one state object.
    // Same rule as ema: never seed the comparison point from 'na', or `change`
    // is NaN on every later bar. `rsi(sma(close, 10), 14)` hit this.
    if (isNaN(source)) return NaN;

    if (state.prevSrc === undefined || isNaN(state.prevSrc)) {
        // The first sample establishes the comparison point and nothing else.
        //
        // This used to feed a synthetic 0 into both internal rmas "to keep them
        // aligned". Now that rma has a real warm-up, that extra sample makes it
        // reach its seed one bar early, and rsi started at bar 22 where
        // TradingView starts at 23.
        state.prevSrc = source;
        return NaN;
    }
    const change = source - state.prevSrc;
    state.prevSrc = source;
    (ctx as any).callStack.push("rsi_gain");
    const avgGain = rma(ctx, Math.max(change, 0), length);
    (ctx as any).callStack.pop();
    (ctx as any).callStack.push("rsi_loss");
    const avgLoss = rma(ctx, Math.max(-change, 0), length);
    (ctx as any).callStack.pop();
    if (avgLoss === 0) return 100;
    return 100 - (100 / (1 + (avgGain / avgLoss)));
}

/**
 * Calculates MACD
 * @returns [series float, series float, series float]
 */
export function macd(ctx: Context, sourceInput: any, fastLenInput: any, slowLenInput: any, sigLenInput: any): [number, number, number] {
    const source = val(sourceInput);
    // Each ema() keeps its own state keyed by the call stack, so the three
    // smoothers must run under distinct frames — otherwise they share one
    // EmaState and overwrite each other every bar.
    (ctx as any).callStack.push("macd_fast");
    const fast = ema(ctx, source, val(fastLenInput));
    (ctx as any).callStack.pop();
    (ctx as any).callStack.push("macd_slow");
    const slow = ema(ctx, source, val(slowLenInput));
    (ctx as any).callStack.pop();
    const macdLine = fast - slow;
    (ctx as any).callStack.push("macd_signal");
    const signalLine = ema(ctx, macdLine, val(sigLenInput));
    (ctx as any).callStack.pop();
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
    // Run sma() under its own frame: otherwise its SumState lands on the same
    // key as cci's BufferState below, and source gets pushed into one shared
    // buffer twice per bar.
    (ctx as any).callStack.push("cci_sma");
    const ma = sma(ctx, source, length);
    (ctx as any).callStack.pop();
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
 * Highest value in window.
 *
 * Pine has TWO forms: `highest(source, length)` and `highest(length)`, where the
 * one-argument form defaults its source to `high`. The short form is the one
 * published breakout strategies actually use (`highest(enter_fast)`), and
 * without it `length` arrived undefined and every bar was NaN.
 *
 * @returns series float
 */
export function highest(ctx: Context, source: any, length?: any): number {
    if (length === undefined) { length = source; source = ctx.vars.get("opsv2_high"); }
    const state = ctx.getPersistentState<DequeState>(() => ({ buffer: [], dequeVals: [], dequeIdxs: [], globalIdx: 0, prevLength: 0 }));
    updateMonotonicDeque(state, source, length, false); 
    return state.dequeVals[0];
}

/**
 * Lowest value in window.
 *
 * As with highest(), the one-argument form `lowest(length)` defaults its source
 * to `low`.
 *
 * @returns series float
 */
export function lowest(ctx: Context, source: any, length?: any): number {
    if (length === undefined) { length = source; source = ctx.vars.get("opsv2_low"); }
    const state = ctx.getPersistentState<DequeState>(() => ({ buffer: [], dequeVals: [], dequeIdxs: [], globalIdx: 0, prevLength: 0 }));
    updateMonotonicDeque(state, source, length, true); 
    return state.dequeVals[0];
}

/**
 * Offset to highest value
 * @returns series int
 */
export function highestbars(ctx: Context, source: any, length?: any): number {
    // One-argument form defaults the source to `high`, as highest()/lowest() do.
    if (length === undefined) { length = source; source = ctx.vars.get("opsv2_high"); }
    const state = ctx.getPersistentState<DequeState>(() => ({ buffer: [], dequeVals: [], dequeIdxs: [], globalIdx: 0, prevLength: 0 }));
    updateMonotonicDeque(state, source, length, false);
    return state.dequeIdxs[0] - (state.globalIdx - 1);
}

/**
 * Offset to lowest value
 * @returns series int
 */
export function lowestbars(ctx: Context, source: any, length?: any): number {
    // One-argument form defaults the source to `low`, as highest()/lowest() do.
    if (length === undefined) { length = source; source = ctx.vars.get("opsv2_low"); }
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
    // highest()/lowest() each keep their own rolling deque keyed by the call
    // stack, so they must run under distinct frames to avoid sharing state.
    (ctx as any).callStack.push("stoch_lowest");
    const l = lowest(ctx, lowInput, lengthInput);
    (ctx as any).callStack.pop();
    (ctx as any).callStack.push("stoch_highest");
    const h = highest(ctx, highInput, lengthInput);
    (ctx as any).callStack.pop();
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

// --- Quick-win TA indicators ---

/**
 * cum: Cumulative sum of source over all bars.
 * @returns series float
 */
export function cum(ctx: Context, sourceInput: any): number {
    const source = val(sourceInput);
    const state = ctx.getPersistentState<{ total: number }>(() => ({ total: 0 }));
    state.total += isNaN(source) ? 0 : source;
    return state.total;
}

/**
 * roc: Rate of Change. 100 * (source - source[length]) / source[length]
 * @returns series float
 */
export function roc(ctx: Context, sourceInput: any, lengthInput: any): number {
    const source = val(sourceInput);
    const length = Math.floor(val(lengthInput));
    const state = ctx.getPersistentState<BufferState>(() => ({ buffer: [] }));
    state.buffer.push(source);
    if (state.buffer.length > MAX_BUFFER_SIZE) {
        const keep = length + 500;
        if (state.buffer.length > keep) state.buffer.splice(0, state.buffer.length - keep);
    }
    if (state.buffer.length <= length) return NaN;
    const prev = state.buffer[state.buffer.length - 1 - length];
    if (prev === 0) return NaN;
    return 100 * (source - prev) / prev;
}

/**
 * change: Difference between current value and value N bars ago.
 * @returns series float
 */
export function change(ctx: Context, sourceInput: any, lengthInput: any = 1): number {
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

/**
 * falling: True if source has been falling (decreasing) for `length` consecutive bars.
 * @returns series bool
 */
export function falling(ctx: Context, sourceInput: any, lengthInput: any): boolean {
    const source = val(sourceInput);
    const length = Math.floor(val(lengthInput));
    const state = ctx.getPersistentState<BufferState>(() => ({ buffer: [] }));
    state.buffer.push(source);
    if (state.buffer.length > MAX_BUFFER_SIZE) {
        const keep = length + 500;
        if (state.buffer.length > keep) state.buffer.splice(0, state.buffer.length - keep);
    }
    if (state.buffer.length <= length) return false;
    const start = state.buffer.length - length - 1;
    for (let i = start + 1; i < state.buffer.length; i++) {
        if (state.buffer[i] >= state.buffer[i - 1]) return false;
    }
    return true;
}

/**
 * rising: True if source has been rising (increasing) for `length` consecutive bars.
 * @returns series bool
 */
export function rising(ctx: Context, sourceInput: any, lengthInput: any): boolean {
    const source = val(sourceInput);
    const length = Math.floor(val(lengthInput));
    const state = ctx.getPersistentState<BufferState>(() => ({ buffer: [] }));
    state.buffer.push(source);
    if (state.buffer.length > MAX_BUFFER_SIZE) {
        const keep = length + 500;
        if (state.buffer.length > keep) state.buffer.splice(0, state.buffer.length - keep);
    }
    if (state.buffer.length <= length) return false;
    const start = state.buffer.length - length - 1;
    for (let i = start + 1; i < state.buffer.length; i++) {
        if (state.buffer[i] <= state.buffer[i - 1]) return false;
    }
    return true;
}

/**
 * dev: Deviation. Mean absolute deviation of source over length bars.
 * @returns series float
 */
export function dev(ctx: Context, sourceInput: any, lengthInput: any): number {
    const source = val(sourceInput);
    const length = Math.floor(val(lengthInput));
    const state = ctx.getPersistentState<BufferState>(() => ({ buffer: [] }));
    state.buffer.push(source);
    if (state.buffer.length > MAX_BUFFER_SIZE) {
        const keep = length + 500;
        if (state.buffer.length > keep) state.buffer.splice(0, state.buffer.length - keep);
    }
    if (state.buffer.length < length) return NaN;
    const start = state.buffer.length - length;
    let sum = 0;
    for (let i = start; i < state.buffer.length; i++) sum += state.buffer[i];
    const mean = sum / length;
    let devSum = 0;
    for (let i = start; i < state.buffer.length; i++) devSum += Math.abs(state.buffer[i] - mean);
    return devSum / length;
}

/**
 * variance: Variance of source over length bars.
 * @returns series float
 */
export function variance(ctx: Context, sourceInput: any, lengthInput: any): number {
    const source = val(sourceInput);
    const length = Math.floor(val(lengthInput));
    const state = ctx.getPersistentState<StdDevState>(() => ({
        buffer: [], sum: 0, sumSq: 0, prevLength: 0, counter: 0
    }));
    state.buffer.push(source);
    if (length !== state.prevLength) {
        state.sum = 0; state.sumSq = 0;
        const start = Math.max(0, state.buffer.length - length);
        for (let i = start; i < state.buffer.length; i++) {
            state.sum += state.buffer[i]; state.sumSq += state.buffer[i] * state.buffer[i];
        }
        state.prevLength = length; state.counter = 0;
    } else {
        state.sum += source; state.sumSq += source * source;
        if (state.buffer.length > length) {
            const removed = state.buffer[state.buffer.length - 1 - length];
            state.sum -= removed; state.sumSq -= removed * removed;
        }
        if (++state.counter >= HEAL_VAR_INTERVAL) {
            state.sum = 0; state.sumSq = 0;
            const start = Math.max(0, state.buffer.length - length);
            for (let i = start; i < state.buffer.length; i++) {
                state.sum += state.buffer[i]; state.sumSq += state.buffer[i] * state.buffer[i];
            }
            state.counter = 0;
        }
    }
    if (state.buffer.length > MAX_BUFFER_SIZE) {
        const keep = length + 500;
        if (state.buffer.length > keep) state.buffer.splice(0, state.buffer.length - keep);
    }
    if (state.buffer.length < length) return NaN;
    const mean = state.sum / length;
    return (state.sumSq / length) - (mean * mean);
}

/**
 * stdev: Standard Deviation of source over length bars.
 * @returns series float
 */
export function stdev(ctx: Context, sourceInput: any, lengthInput: any): number {
    return Math.sqrt(Math.max(0, variance(ctx, sourceInput, lengthInput)));
}

/**
 * correlation: Pearson correlation coefficient between two series over length bars.
 * @returns series float
 */
export function correlation(ctx: Context, source1Input: any, source2Input: any, lengthInput: any): number {
    const s1 = val(source1Input);
    const s2 = val(source2Input);
    const length = Math.floor(val(lengthInput));
    const state = ctx.getPersistentState<{ buf1: number[]; buf2: number[] }>(() => ({ buf1: [], buf2: [] }));
    state.buf1.push(s1); state.buf2.push(s2);
    if (state.buf1.length > MAX_BUFFER_SIZE) {
        const keep = length + 500;
        if (state.buf1.length > keep) { state.buf1.splice(0, state.buf1.length - keep); state.buf2.splice(0, state.buf2.length - keep); }
    }
    if (state.buf1.length < length) return NaN;
    const start = state.buf1.length - length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    for (let i = start; i < state.buf1.length; i++) {
        const x = state.buf1[i], y = state.buf2[i];
        sumX += x; sumY += y; sumXY += x * y; sumX2 += x * x; sumY2 += y * y;
    }
    const num = length * sumXY - sumX * sumY;
    const den = Math.sqrt((length * sumX2 - sumX * sumX) * (length * sumY2 - sumY * sumY));
    return den === 0 ? 0 : num / den;
}

/**
 * percentrank: Percent rank. Percentage of past `length` values that are <= current value.
 * @returns series float
 */
export function percentrank(ctx: Context, sourceInput: any, lengthInput: any): number {
    const source = val(sourceInput);
    const length = Math.floor(val(lengthInput));
    const state = ctx.getPersistentState<BufferState>(() => ({ buffer: [] }));
    state.buffer.push(source);
    if (state.buffer.length > MAX_BUFFER_SIZE) {
        const keep = length + 500;
        if (state.buffer.length > keep) state.buffer.splice(0, state.buffer.length - keep);
    }
    if (state.buffer.length <= length) return NaN;
    const start = state.buffer.length - 1 - length;
    let count = 0;
    for (let i = start; i < state.buffer.length - 1; i++) {
        if (state.buffer[i] <= source) count++;
    }
    return (count / length) * 100;
}

/**
 * wpr: Williams %R
 * @returns series float
 */
export function wpr(ctx: Context, lengthInput: any): number {
    const length = val(lengthInput);
    // highest() and lowest() each keep their own rolling deque keyed by the
    // call stack, so they must run under distinct frames — otherwise they share
    // one state object and corrupt each other's buffers.
    (ctx as any).callStack.push("wpr_highest");
    const h = highest(ctx, ctx.high, length);
    (ctx as any).callStack.pop();
    (ctx as any).callStack.push("wpr_lowest");
    const l = lowest(ctx, ctx.low, length);
    (ctx as any).callStack.pop();
    if (h === l) return 0;
    return -100 * (h - ctx.close) / (h - l);
}

/**
 * mfi: Money Flow Index
 * @returns series float
 */
export function mfi(ctx: Context, sourceInput: any, lengthInput: any): number {
    const source = val(sourceInput);
    const length = Math.floor(val(lengthInput));
    const state = ctx.getPersistentState<{ prevSrc: number; posBuf: number[]; negBuf: number[]; posSum: number; negSum: number }>(() => ({
        prevSrc: NaN, posBuf: [], negBuf: [], posSum: 0, negSum: 0
    }));

    const volume = ctx.volume;
    const mf = source * volume;

    let pos = 0, neg = 0;
    if (isNaN(state.prevSrc)) {
        // first bar — neutral
    } else if (source > state.prevSrc) {
        pos = mf;
    } else if (source < state.prevSrc) {
        neg = mf;
    }
    state.prevSrc = source;

    state.posBuf.push(pos);
    state.negBuf.push(neg);
    state.posSum += pos;
    state.negSum += neg;
    if (state.posBuf.length > length) {
        state.posSum -= state.posBuf[state.posBuf.length - 1 - length];
        state.negSum -= state.negBuf[state.negBuf.length - 1 - length];
    }

    if (state.posBuf.length > MAX_BUFFER_SIZE) {
        const keep = length + 500;
        if (state.posBuf.length > keep) {
            state.posBuf.splice(0, state.posBuf.length - keep);
            state.negBuf.splice(0, state.negBuf.length - keep);
        }
    }

    if (state.posBuf.length < length) return NaN;
    if (state.negSum === 0) return 100;
    const ratio = state.posSum / state.negSum;
    return 100 - (100 / (1 + ratio));
}

/**
 * alma: Arnaud Legoux Moving Average
 * @returns series float
 */
export function alma(ctx: Context, sourceInput: any, lengthInput: any, offsetInput: any = 0.85, sigmaInput: any = 6): number {
    const source = val(sourceInput);
    const length = Math.floor(val(lengthInput));
    const offset = val(offsetInput);
    const sigma = val(sigmaInput);
    const state = ctx.getPersistentState<BufferState>(() => ({ buffer: [] }));
    state.buffer.push(source);
    if (state.buffer.length > MAX_BUFFER_SIZE) {
        const keep = length + 500;
        if (state.buffer.length > keep) state.buffer.splice(0, state.buffer.length - keep);
    }
    if (state.buffer.length < length) return NaN;
    const m = offset * (length - 1);
    const s = length / sigma;
    let weightSum = 0, valueSum = 0;
    const start = state.buffer.length - length;
    for (let i = 0; i < length; i++) {
        const w = Math.exp(-((i - m) * (i - m)) / (2 * s * s));
        weightSum += w;
        valueSum += state.buffer[start + i] * w;
    }
    return valueSum / weightSum;
}

/**
 * cog: Center of Gravity oscillator
 * @returns series float
 */
export function cog(ctx: Context, sourceInput: any, lengthInput: any): number {
    const source = val(sourceInput);
    const length = Math.floor(val(lengthInput));
    const state = ctx.getPersistentState<BufferState>(() => ({ buffer: [] }));
    state.buffer.push(source);
    if (state.buffer.length > MAX_BUFFER_SIZE) {
        const keep = length + 500;
        if (state.buffer.length > keep) state.buffer.splice(0, state.buffer.length - keep);
    }
    if (state.buffer.length < length) return NaN;
    let num = 0, den = 0;
    const start = state.buffer.length - length;
    for (let i = 0; i < length; i++) {
        const v = state.buffer[start + i];
        // Ehlers CoG: the most recent bar (i bars back, i=0) gets weight 1.
        // buffer[start] is the oldest, buffer[start + length - 1] is the newest.
        num += v * (length - i);
        den += v;
    }
    return den === 0 ? 0 : -num / den;
}

/**
 * tsi: True Strength Index
 * @returns series float
 */
export function tsi(ctx: Context, sourceInput: any, longLenInput: any, shortLenInput: any): number {
    const source = val(sourceInput);
    const longLen = val(longLenInput);
    const shortLen = val(shortLenInput);
    const state = ctx.getPersistentState<{ prevSrc: number | undefined }>(() => ({ prevSrc: undefined }));

    // Each ema() in the double-smoothing keeps its own state keyed by the call
    // stack. The inner and outer EMAs must therefore run under *distinct* frames;
    // nesting them in one frame makes inner/outer share a single EmaState.
    const dblSmooth = (frameInner: string, frameOuter: string, x: number): number => {
        (ctx as any).callStack.push(frameInner);
        const inner = ema(ctx, x, longLen);
        (ctx as any).callStack.pop();
        (ctx as any).callStack.push(frameOuter);
        const outer = ema(ctx, inner, shortLen);
        (ctx as any).callStack.pop();
        return outer;
    };

    // Same rule as ema — do not latch a NaN as the comparison point.
    if (isNaN(source)) return NaN;

    if (state.prevSrc === undefined || isNaN(state.prevSrc)) {
        // Returns na, and primes nothing.
        //
        // This returned a literal 0 and fed a synthetic 0 into all four internal
        // emas. The 0 made tsi finite from bar 0 where TradingView reports na
        // until bar 37, and the priming shifted every internal ema one sample
        // early — the same mistake rsi made.
        state.prevSrc = source;
        return NaN;
    }

    const pc = source - state.prevSrc;
    state.prevSrc = source;

    const pcSmooth = dblSmooth("tsi_pc_inner", "tsi_pc_outer", pc);
    const apcSmooth = dblSmooth("tsi_apc_inner", "tsi_apc_outer", Math.abs(pc));

    // NO 100x. TradingView's `ta.tsi` returns a RATIO in [-1, 1], not a
    // percentage — verified against a 5,998-bar export, where our value was
    // out by exactly 100 on every bar (relative error 9.90e-1).
    return apcSmooth === 0 ? 0 : pcSmooth / apcSmooth;
}

/**
 * pivothigh: Pivot High. Returns the value of the pivot high point, NaN otherwise.
 * Looks for a high that is higher than `leftbars` bars to the left and `rightbars` bars to the right.
 * @returns series float
 */
export function pivothigh(ctx: Context, sourceInput: any, leftbarsInput: any, rightbarsInput: any): number {
    const source = val(sourceInput);
    const leftbars = Math.floor(val(leftbarsInput));
    const rightbars = Math.floor(val(rightbarsInput));
    const totalLen = leftbars + rightbars + 1;
    const state = ctx.getPersistentState<BufferState>(() => ({ buffer: [] }));
    state.buffer.push(source);
    if (state.buffer.length > MAX_BUFFER_SIZE) {
        const keep = totalLen + 500;
        if (state.buffer.length > keep) state.buffer.splice(0, state.buffer.length - keep);
    }
    if (state.buffer.length < totalLen) return NaN;
    const pivotIdx = state.buffer.length - 1 - rightbars;
    const pivotVal = state.buffer[pivotIdx];
    for (let i = pivotIdx - leftbars; i < pivotIdx; i++) {
        if (state.buffer[i] >= pivotVal) return NaN;
    }
    for (let i = pivotIdx + 1; i <= pivotIdx + rightbars; i++) {
        if (state.buffer[i] >= pivotVal) return NaN;
    }
    return pivotVal;
}

/**
 * pivotlow: Pivot Low. Returns the value of the pivot low point, NaN otherwise.
 * @returns series float
 */
export function pivotlow(ctx: Context, sourceInput: any, leftbarsInput: any, rightbarsInput: any): number {
    const source = val(sourceInput);
    const leftbars = Math.floor(val(leftbarsInput));
    const rightbars = Math.floor(val(rightbarsInput));
    const totalLen = leftbars + rightbars + 1;
    const state = ctx.getPersistentState<BufferState>(() => ({ buffer: [] }));
    state.buffer.push(source);
    if (state.buffer.length > MAX_BUFFER_SIZE) {
        const keep = totalLen + 500;
        if (state.buffer.length > keep) state.buffer.splice(0, state.buffer.length - keep);
    }
    if (state.buffer.length < totalLen) return NaN;
    const pivotIdx = state.buffer.length - 1 - rightbars;
    const pivotVal = state.buffer[pivotIdx];
    for (let i = pivotIdx - leftbars; i < pivotIdx; i++) {
        if (state.buffer[i] <= pivotVal) return NaN;
    }
    for (let i = pivotIdx + 1; i <= pivotIdx + rightbars; i++) {
        if (state.buffer[i] <= pivotVal) return NaN;
    }
    return pivotVal;
}

/**
 * tr: True Range (standalone, not wrapped in RMA like atr)
 * @returns series float
 */
export function tr(ctx: Context): number {
    const state = ctx.getPersistentState<{ prevClose: number }>(() => ({ prevClose: NaN }));
    const prevC = isNaN(state.prevClose) ? ctx.close : state.prevClose;
    state.prevClose = ctx.close;
    return Math.max(
        ctx.high - ctx.low,
        Math.abs(ctx.high - prevC),
        Math.abs(ctx.low - prevC)
    );
}

/**
 * sum: Rolling sum of source over length bars. (Equivalent to sma * length.)
 * @returns series float
 */
export function sum(ctx: Context, sourceInput: any, lengthInput: any): number {
    const source = val(sourceInput);
    const length = Math.floor(val(lengthInput));
    const state = ctx.getPersistentState<SumState>(() => ({
        buffer: [], sum: 0, prevLength: 0, counter: 0
    }));
    state.buffer.push(source);
    if (length !== state.prevLength) {
        state.sum = 0;
        const start = Math.max(0, state.buffer.length - length);
        for (let i = start; i < state.buffer.length; i++) state.sum += state.buffer[i];
        state.prevLength = length; state.counter = 0;
    } else {
        state.sum += source;
        if (state.buffer.length > length) {
            state.sum -= state.buffer[state.buffer.length - 1 - length];
        }
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
    return state.sum;
}

/**
 * fixnan: Replaces NaN with the last non-NaN value (per call site).
 * @returns series float
 */
export function fixnan(ctx: Context, xInput: any): number {
    const x = val(xInput);
    const state = ctx.getPersistentState<{ last: number }>(() => ({ last: NaN }));
    if (!isNaN(x)) {
        state.last = x;
        return x;
    }
    return state.last;
}
/**
 * percentile_nearest_rank: the value at `percentage` percentile of the last
 * `length` values, using the nearest-rank method (no interpolation).
 *
 * Nearest rank is `ceil(P/100 * N)` over the ASCENDING sample, so the result is
 * always one of the observed values — which is what distinguishes it from
 * percentile_linear_interpolation.
 *
 * @returns series float
 */
export function percentile_nearest_rank(
    ctx: Context, sourceInput: any, lengthInput: any, percentageInput: any,
): number {
    const source = val(sourceInput);
    const length = Math.floor(val(lengthInput));
    const percentage = val(percentageInput);

    const state = ctx.getPersistentState<BufferState>(() => ({ buffer: [] }));
    state.buffer.push(source);
    if (state.buffer.length > MAX_BUFFER_SIZE) {
        const keep = length + 500;
        if (state.buffer.length > keep) state.buffer.splice(0, state.buffer.length - keep);
    }
    if (state.buffer.length < length || length <= 0) return NaN;

    const window = state.buffer.slice(-length).filter(Number.isFinite).sort((a, b) => a - b);
    if (window.length === 0) return NaN;

    const rank = Math.ceil((percentage / 100) * window.length);
    const idx = Math.min(Math.max(rank, 1), window.length) - 1;
    return window[idx];
}

/**
 * percentile_linear_interpolation: the value at `percentage` percentile of the
 * last `length` values, interpolating between the two straddling samples.
 *
 * @returns series float
 */
export function percentile_linear_interpolation(
    ctx: Context, sourceInput: any, lengthInput: any, percentageInput: any,
): number {
    const source = val(sourceInput);
    const length = Math.floor(val(lengthInput));
    const percentage = val(percentageInput);

    const state = ctx.getPersistentState<BufferState>(() => ({ buffer: [] }));
    state.buffer.push(source);
    if (state.buffer.length > MAX_BUFFER_SIZE) {
        const keep = length + 500;
        if (state.buffer.length > keep) state.buffer.splice(0, state.buffer.length - keep);
    }
    if (state.buffer.length < length || length <= 0) return NaN;

    const window = state.buffer.slice(-length).filter(Number.isFinite).sort((a, b) => a - b);
    if (window.length === 0) return NaN;

    const pos = (percentage / 100) * (window.length - 1);
    const lo = Math.floor(pos);
    const hi = Math.ceil(pos);
    if (lo === hi) return window[lo];
    return window[lo] + (window[hi] - window[lo]) * (pos - lo);
}
