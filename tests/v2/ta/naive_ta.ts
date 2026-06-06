/**
 * test/naive_ta.ts
 * A "Gold Standard" Naive implementation of Pine Script TA.
 */

export class NaiveTA {
    private history: number[] = [];
    private volume: number[] = [];
    private highs: number[] = [];
    private lows: number[] = [];

    // State Map for recursive functions (EMA, RMA)
    private state: Map<string, number> = new Map();

    add(price: number, vol: number, high: number = price, low: number = price) {
        this.history.push(price);
        this.volume.push(vol);
        this.highs.push(high);
        this.lows.push(low);
    }

    private getSlice(length: number, offset: number = 0): number[] {
        if (this.history.length < length + offset) return [];
        const end = this.history.length - offset;
        return this.history.slice(end - length, end);
    }

    // --- RECURSIVE FIXES ---

    /**
     * Pure recursive RMA. No SMA warmup. 
     * Matches Production Engine's greedy initialization.
     */
    rma(id: string, source: number, length: number): number {
        const key = `rma_${id}`;
        let prev = this.state.get(key); // Use this.state
        
        if (Number.isNaN(source)) return NaN;
    
        if (prev === undefined || Number.isNaN(prev)) {
            this.state.set(key, source); // Save seed
            return source;
        }
    
        const alpha = 1 / length;
        const val = (source * alpha) + (prev * (1 - alpha));
        
        this.state.set(key, val); // SAVE THE UPDATED STATE FOR THE NEXT BAR
        return val;
    }

    /**
     * ATR must use the recursive RMA above with a UNIQUE ID
     */
    atr(length: number): number {
        const idx = this.history.length - 1;
        if (idx < 0) return NaN;
    
        const h = this.highs[idx];
        const l = this.lows[idx];
        const prevC = idx > 0 ? this.history[idx - 1] : NaN;
        
        const tr = (idx === 0 || isNaN(prevC)) 
            ? h - l 
            : Math.max(h - l, Math.abs(h - prevC), Math.abs(l - prevC));
        
        // Call rma exactly once per bar to update the state map
        return this.rma('atr_exclusive_key', tr, length);
    }

    wma(src: number[], len: number): number {
        let sum = 0, weightSum = 0;
        for (let i = 0; i < len; i++) {
            const weight = len - i;
            sum += src[src.length - 1 - i] * weight;
            weightSum += weight;
        }
        return sum / weightSum;
    }

    // --- STANDARD METHODS (Untouched) ---

    sma(length: number): number {
        const slice = this.getSlice(length);
        return slice.length < length ? NaN : slice.reduce((a, b) => a + b, 0) / length;
    }

    ema(id: string, source: number, length: number): number {
        const alpha = 2 / (length + 1);
        const key = `ema_${id}`;
        let prev = this.state.get(key);
        if (prev === undefined) { this.state.set(key, source); return source; }
        const val = (source * alpha) + (prev * (1 - alpha));
        this.state.set(key, val);
        return val;
    }

    bb(length: number, mult: number): [number, number, number] {
        const slice = this.getSlice(length);
        if (slice.length < length) return [NaN, NaN, NaN];
        const mean = slice.reduce((a, b) => a + b, 0) / length;
        const dev = Math.sqrt(slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / length);
        return [mean, mean + dev * mult, mean - dev * mult];
    }

    highest(length: number): number {
        const slice = this.getSlice(length);
        return slice.length < length ? NaN : Math.max(...slice);
    }

    lowest(length: number): number {
        const slice = this.getSlice(length);
        return slice.length < length ? NaN : Math.min(...slice);
    }

    highestbars(length: number): number {
        if (this.history.length < length) return NaN;
        const start = this.history.length - length;
        let max = -Infinity; let pos = -1;
        for (let i = this.history.length - 1; i >= start; i--) {
            if (this.history[i] > max) { max = this.history[i]; pos = i; }
        }
        return pos - (this.history.length - 1);
    }

    lowestbars(length: number): number {
        if (this.history.length < length) return NaN;
        const start = this.history.length - length;
        let min = Infinity; let pos = -1;
        for (let i = this.history.length - 1; i >= start; i--) {
            if (this.history[i] < min) { min = this.history[i]; pos = i; }
        }
        return min === Infinity ? NaN : pos - (this.history.length - 1);
    }

    valuewhen(conds: boolean[], srcs: number[], occ: number): number {
        let count = 0;
        for (let i = conds.length - 1; i >= 0; i--) {
            if (conds[i]) { if (count === occ) return srcs[i]; count++; }
        }
        return NaN;
    }

    barssince(conds: boolean[]): number {
        for (let i = conds.length - 1; i >= 0; i--) {
            if (conds[i]) return (conds.length - 1) - i;
        }
        return NaN;
    }

    vwap(): number {
        let sVol = 0; let sSrcVol = 0;
        for (let i = 0; i < this.history.length; i++) {
            sVol += this.volume[i];
            sSrcVol += this.history[i] * this.volume[i];
        }
        return sVol === 0 ? NaN : sSrcVol / sVol;
    }

    linreg(length: number, offset: number = 0): number {
        const slice = this.getSlice(length);
        if (slice.length < length) return NaN;
        let sX = 0, sY = 0, sXY = 0, sX2 = 0;
        for (let i = 0; i < length; i++) {
            const y = slice[i]; const x = i;
            sX += x; sY += y; sXY += x * y; sX2 += x * x;
        }
        const slope = (length * sXY - sX * sY) / (length * sX2 - sX * sX);
        const intercept = (sY - slope * sX) / length;
        return intercept + slope * (length - 1 - offset);
    }

    sar(start: number, inc: number, max: number): number {
        if (this.highs.length === 0) return NaN;
        let long = true; let af = start; let ep = this.highs[0]; let v = this.lows[0];
        for (let i = 1; i < this.history.length; i++) {
            const h = this.highs[i], l = this.lows[i];
            let next = v + af * (ep - v);
            if (long) {
                if (l < next) { long = false; next = Math.max(ep, h); ep = l; af = start; }
                else if (h > ep) { ep = h; af = Math.min(af + inc, max); }
            } else {
                if (h > next) { long = true; next = Math.min(ep, l); ep = h; af = start; }
                else if (l < ep) { ep = l; af = Math.min(af + inc, max); }
            }
            v = next;
        }
        return v;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Extended indicators — unoptimized, mathematically exact references.
    // Each recomputes from scratch over the accumulated history every bar.
    // ─────────────────────────────────────────────────────────────────────────

    private sliceOf(arr: number[], length: number, offset: number = 0): number[] {
        if (arr.length < length + offset) return [];
        const end = arr.length - offset;
        return arr.slice(end - length, end);
    }

    /** Cumulative sum of all close values (NaN treated as 0). */
    cum(): number {
        return this.history.reduce((a, b) => a + (Number.isNaN(b) ? 0 : b), 0);
    }

    /** Rate of change: 100 * (src - src[length]) / src[length]. */
    roc(length: number): number {
        if (this.history.length <= length) return NaN;
        const cur = this.history[this.history.length - 1];
        const prev = this.history[this.history.length - 1 - length];
        if (prev === 0) return NaN;
        return (100 * (cur - prev)) / prev;
    }

    /** Difference between current value and value `length` bars ago. */
    change(length: number = 1): number {
        if (this.history.length <= length) return NaN;
        const cur = this.history[this.history.length - 1];
        return cur - this.history[this.history.length - 1 - length];
    }

    /** Mean absolute deviation over `length` bars. */
    dev(length: number): number {
        const s = this.sliceOf(this.history, length);
        if (s.length < length) return NaN;
        const mean = s.reduce((a, b) => a + b, 0) / length;
        return s.reduce((a, b) => a + Math.abs(b - mean), 0) / length;
    }

    /** Population variance over `length` bars (divides by N). */
    variance(length: number): number {
        const s = this.sliceOf(this.history, length);
        if (s.length < length) return NaN;
        const mean = s.reduce((a, b) => a + b, 0) / length;
        return s.reduce((a, b) => a + (b - mean) * (b - mean), 0) / length;
    }

    /** Population standard deviation over `length` bars. */
    stdev(length: number): number {
        const v = this.variance(length);
        return Number.isNaN(v) ? NaN : Math.sqrt(Math.max(0, v));
    }

    /** Pearson correlation of close vs volume over `length` bars. */
    correlation(length: number): number {
        if (this.history.length < length || this.volume.length < length) return NaN;
        const x = this.sliceOf(this.history, length);
        const y = this.sliceOf(this.volume, length);
        let sx = 0, sy = 0, sxy = 0, sx2 = 0, sy2 = 0;
        for (let i = 0; i < length; i++) {
            sx += x[i]; sy += y[i]; sxy += x[i] * y[i];
            sx2 += x[i] * x[i]; sy2 += y[i] * y[i];
        }
        const num = length * sxy - sx * sy;
        const den = Math.sqrt((length * sx2 - sx * sx) * (length * sy2 - sy * sy));
        return den === 0 ? 0 : num / den;
    }

    /** Percent of the previous `length` values that are <= the current value. */
    percentrank(length: number): number {
        if (this.history.length <= length) return NaN;
        const cur = this.history[this.history.length - 1];
        const start = this.history.length - 1 - length;
        let count = 0;
        for (let i = start; i < this.history.length - 1; i++) {
            if (this.history[i] <= cur) count++;
        }
        return (count / length) * 100;
    }

    /** Arnaud Legoux Moving Average. */
    alma(length: number, offset: number, sigma: number): number {
        const s = this.sliceOf(this.history, length);
        if (s.length < length) return NaN;
        const m = offset * (length - 1);
        const sd = length / sigma;
        let wsum = 0, vsum = 0;
        for (let i = 0; i < length; i++) {
            const w = Math.exp(-((i - m) * (i - m)) / (2 * sd * sd));
            wsum += w;
            vsum += s[i] * w; // s[0] is the oldest bar in the window
        }
        return vsum / wsum;
    }

    /** Center of Gravity oscillator (Ehlers): newest bar gets weight 1. */
    cog(length: number): number {
        const s = this.sliceOf(this.history, length); // s[length-1] is newest
        if (s.length < length) return NaN;
        let num = 0, den = 0;
        for (let i = 0; i < length; i++) {
            const price = s[length - 1 - i]; // i bars back
            num += price * (i + 1);
            den += price;
        }
        return den === 0 ? 0 : -num / den;
    }

    /** Williams %R over `length` bars. */
    wpr(length: number): number {
        const hs = this.sliceOf(this.highs, length);
        const ls = this.sliceOf(this.lows, length);
        if (hs.length < length || ls.length < length) return NaN;
        const hh = Math.max(...hs);
        const ll = Math.min(...ls);
        const close = this.history[this.history.length - 1];
        if (hh === ll) return 0;
        return (-100 * (hh - close)) / (hh - ll);
    }

    /** Money Flow Index over `length` bars (source = close). */
    mfi(length: number): number {
        if (this.history.length < length) return NaN;
        const start = this.history.length - length;
        let pos = 0, neg = 0;
        for (let j = start; j < this.history.length; j++) {
            if (j === 0) continue; // first overall bar is neutral (no prior close)
            const mf = this.history[j] * this.volume[j];
            if (this.history[j] > this.history[j - 1]) pos += mf;
            else if (this.history[j] < this.history[j - 1]) neg += mf;
        }
        if (neg === 0) return 100;
        return 100 - 100 / (1 + pos / neg);
    }

    /** True if close strictly decreased for `length` consecutive bars. */
    falling(length: number): boolean {
        if (this.history.length <= length) return false;
        const start = this.history.length - 1 - length;
        for (let i = start + 1; i < this.history.length; i++) {
            if (this.history[i] >= this.history[i - 1]) return false;
        }
        return true;
    }

    /** True if close strictly increased for `length` consecutive bars. */
    rising(length: number): boolean {
        if (this.history.length <= length) return false;
        const start = this.history.length - 1 - length;
        for (let i = start + 1; i < this.history.length; i++) {
            if (this.history[i] <= this.history[i - 1]) return false;
        }
        return true;
    }

    /** Pivot high over the highs series; value at the pivot or NaN. */
    pivothigh(left: number, right: number): number {
        const total = left + right + 1;
        if (this.highs.length < total) return NaN;
        const pivotIdx = this.highs.length - 1 - right;
        const pv = this.highs[pivotIdx];
        for (let i = pivotIdx - left; i < pivotIdx; i++) if (this.highs[i] >= pv) return NaN;
        for (let i = pivotIdx + 1; i <= pivotIdx + right; i++) if (this.highs[i] >= pv) return NaN;
        return pv;
    }

    /** Pivot low over the lows series; value at the pivot or NaN. */
    pivotlow(left: number, right: number): number {
        const total = left + right + 1;
        if (this.lows.length < total) return NaN;
        const pivotIdx = this.lows.length - 1 - right;
        const pv = this.lows[pivotIdx];
        for (let i = pivotIdx - left; i < pivotIdx; i++) if (this.lows[i] <= pv) return NaN;
        for (let i = pivotIdx + 1; i <= pivotIdx + right; i++) if (this.lows[i] <= pv) return NaN;
        return pv;
    }

    /** Stochastic %K over `length` bars: 100 * (close - LL) / (HH - LL). */
    stoch(length: number): number {
        const hs = this.sliceOf(this.highs, length);
        const ls = this.sliceOf(this.lows, length);
        if (hs.length < length || ls.length < length) return NaN;
        const hh = Math.max(...hs);
        const ll = Math.min(...ls);
        const close = this.history[this.history.length - 1];
        if (hh === ll) return 0;
        return (100 * (close - ll)) / (hh - ll);
    }

    /** MACD over close: [macdLine, signalLine, histogram]. Uses distinct EMA states. */
    macd(fast: number, slow: number, sig: number): [number, number, number] {
        const close = this.history[this.history.length - 1];
        const f = this.ema("macd_fast", close, fast);
        const s = this.ema("macd_slow", close, slow);
        const macdLine = f - s;
        const signalLine = this.ema("macd_sig", macdLine, sig);
        return [macdLine, signalLine, macdLine - signalLine];
    }

    /** Commodity Channel Index over `length` bars (source = close). */
    cci(length: number): number {
        const s = this.sliceOf(this.history, length);
        if (s.length < length) return NaN;
        const ma = s.reduce((a, b) => a + b, 0) / length;
        const cur = this.history[this.history.length - 1];
        let meanDev = 0;
        for (const v of s) meanDev += Math.abs(v - ma);
        meanDev /= length;
        return (cur - ma) / (0.015 * meanDev);
    }

    /** Volume-weighted MA: sma(close*vol)/sma(vol) over `length` bars. */
    vwma(length: number): number {
        if (this.history.length < length) return NaN;
        const hs = this.sliceOf(this.history, length);
        const vs = this.sliceOf(this.volume, length);
        let numSum = 0, volSum = 0;
        for (let i = 0; i < length; i++) { numSum += hs[i] * vs[i]; volSum += vs[i]; }
        return (numSum / length) / (volSum / length);
    }

    /** TRIX: 100 * roc of a triple-EMA of close. Uses three distinct EMA states. */
    trix(length: number): number {
        const close = this.history[this.history.length - 1];
        const e1 = this.ema("trix_e1", close, length);
        const e2 = this.ema("trix_e2", e1, length);
        const e3 = this.ema("trix_e3", e2, length);
        const prev = this.state.get("trix_prevE3");
        if (prev === undefined) { this.state.set("trix_prevE3", e3); return 0; }
        const result = (100 * (e3 - prev)) / prev;
        this.state.set("trix_prevE3", e3);
        return result;
    }

    /** RSI over `length` bars using two independent RMA states (gain/loss). */
    rsi(length: number): number {
        const close = this.history[this.history.length - 1];
        const prev = this.state.get("rsi_prevSrc");
        if (prev === undefined) {
            this.state.set("rsi_prevSrc", close);
            this.rma("rsi_gain", 0, length);
            this.rma("rsi_loss", 0, length);
            return NaN;
        }
        const change = close - prev;
        this.state.set("rsi_prevSrc", close);
        const avgGain = this.rma("rsi_gain", Math.max(change, 0), length);
        const avgLoss = this.rma("rsi_loss", Math.max(-change, 0), length);
        if (avgLoss === 0) return 100;
        return 100 - 100 / (1 + avgGain / avgLoss);
    }

    /** True Strength Index: double-smoothed EMA ratio, four independent EMAs. */
    tsi(longLen: number, shortLen: number): number {
        const close = this.history[this.history.length - 1];
        const dbl = (innerId: string, outerId: string, x: number): number =>
            this.ema(outerId, this.ema(innerId, x, longLen), shortLen);

        const prev = this.state.get("tsi_prevSrc");
        if (prev === undefined) {
            this.state.set("tsi_prevSrc", close);
            dbl("tsi_pc_inner", "tsi_pc_outer", 0);
            dbl("tsi_apc_inner", "tsi_apc_outer", 0);
            return 0;
        }
        const pc = close - prev;
        this.state.set("tsi_prevSrc", close);
        const pcSmooth = dbl("tsi_pc_inner", "tsi_pc_outer", pc);
        const apcSmooth = dbl("tsi_apc_inner", "tsi_apc_outer", Math.abs(pc));
        return apcSmooth === 0 ? 0 : (100 * pcSmooth) / apcSmooth;
    }
}