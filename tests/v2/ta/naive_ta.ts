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
}