/**
 * test/naive_ta.ts
 * A "Gold Standard" Naive implementation of Pine Script TA.
 * Uses O(N) loops for everything. mathematically perfect, but slow.
 * Used to verify the optimized O(1) engine.
 */

export class NaiveTA {
    private history: number[] = [];
    private volume: number[] = [];
    private highs: number[] = [];
    private lows: number[] = [];

    // EMA/RMA need state even in naive mode
    private emaState: Map<string, number> = new Map();

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

    sma(length: number): number {
        const slice = this.getSlice(length);
        if (slice.length < length) return NaN;
        return slice.reduce((a, b) => a + b, 0) / length;
    }

    wma(length: number): number {
        const slice = this.getSlice(length);
        if (slice.length < length) return NaN;
        let norm = 0;
        let sum = 0;
        for (let i = 0; i < slice.length; i++) {
            const weight = i + 1;
            sum += slice[i] * weight;
            norm += weight;
        }
        return sum / norm;
    }

    ema(id: string, source: number, length: number): number {
        const alpha = 2 / (length + 1);
        const key = `ema_${id}`;
        let prev = this.emaState.get(key);
        
        if (prev === undefined) {
            this.emaState.set(key, source);
            return source;
        }
        const val = (source * alpha) + (prev * (1 - alpha));
        this.emaState.set(key, val);
        return val;
    }

    rma(id: string, source: number, length: number): number {
        const key = `rma_${id}`;
        let prev = this.emaState.get(key);
        
        if (Number.isNaN(source)) return NaN;
    
        // SEEDING LOGIC: Match the production engine exactly.
        // If we have no history, return the current source as the seed.
        if (prev === undefined || Number.isNaN(prev)) {
            this.emaState.set(key, source);
            return source;
        }
    
        // RECURSIVE FORMULA: Applied immediately from Bar 1 onwards.
        const alpha = 1 / length;
        const val = (source * alpha) + (prev * (1 - alpha));
        
        this.emaState.set(key, val);
        return val;
    }

    // Standard Deviation / BB
    bb(length: number, mult: number): [number, number, number] {
        const slice = this.getSlice(length);
        if (slice.length < length) return [NaN, NaN, NaN];

        const mean = slice.reduce((a, b) => a + b, 0) / length;
        const sumSq = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0);
        const variance = sumSq / length;
        const dev = Math.sqrt(variance);

        return [mean, mean + dev * mult, mean - dev * mult];
    }

    highest(length: number): number {
        const slice = this.getSlice(length);
        if (slice.length < length) return NaN;
        return Math.max(...slice);
    }

    lowest(length: number): number {
        const slice = this.getSlice(length);
        if (slice.length < length) return NaN;
        return Math.min(...slice);
    }
    
    // Returns OFFSET (negative value representing bars back from current)
    highestbars(length: number): number {
        if (this.history.length < length) return NaN;
        const startIdx = this.history.length - length;
        let maxVal = -Infinity;
        let maxAt = -1;

        // Search the window [history.length - length ... history.length - 1]
        for (let i = this.history.length - 1; i >= startIdx; i--) {
            if (this.history[i] > maxVal) {
                maxVal = this.history[i];
                maxAt = i;
            }
        }
        // Offset is: index found - current index (always 0 or negative)
        return maxAt - (this.history.length - 1);
    }

    lowestbars(length: number): number {
        if (this.history.length < length) return NaN;
        const startIdx = this.history.length - length;
        let minVal = Infinity;
        let minAt = -1;

        for (let i = this.history.length - 1; i >= startIdx; i--) {
            if (this.history[i] < minVal) {
                minVal = this.history[i];
                minAt = i;
            }
        }
        return minAt - (this.history.length - 1);
    }

    // --- Legacy State Lookups & Math ---

    valuewhen(conditionSeries: boolean[], sourceSeries: number[], occurrence: number): number {
        let count = 0;
        for (let i = conditionSeries.length - 1; i >= 0; i--) {
            if (conditionSeries[i]) {
                if (count === occurrence) return sourceSeries[i];
                count++;
            }
        }
        return NaN;
    }

    barssince(conditionSeries: boolean[]): number {
        for (let i = conditionSeries.length - 1; i >= 0; i--) {
            if (conditionSeries[i]) {
                return (conditionSeries.length - 1) - i;
            }
        }
        return NaN;
    }

    atr(length: number): number {
        const idx = this.history.length - 1;
        if (idx < 0) return NaN;

        const currH = this.highs[idx];
        const currL = this.lows[idx];
        const prevC = idx > 0 ? this.history[idx - 1] : this.history[idx];
        
        const tr = Math.max(
            currH - currL,
            Math.abs(currH - prevC),
            Math.abs(currL - prevC)
        );
        
        // Use a unique ID to ensure ATR's RMA state is isolated and recursive from Bar 0
        return this.rma('atr_internal', tr, length);
    }

    vwap(): number {
        let sumVol = 0;
        let sumSrcVol = 0;
        for (let i = 0; i < this.history.length; i++) {
            sumVol += this.volume[i];
            sumSrcVol += this.history[i] * this.volume[i];
        }
        if (sumVol === 0) return NaN;
        return sumSrcVol / sumVol;
    }

    linreg(length: number, offset: number = 0): number {
        const slice = this.getSlice(length);
        if (slice.length < length) return NaN;
        
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        for (let i = 0; i < length; i++) {
            const y = slice[i];
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

    sar(start: number, inc: number, max: number): number {
        if (this.highs.length === 0) return NaN;

        let isLong = true;
        let af = start;
        let ep = this.highs[0];
        let sarVal = this.lows[0];

        // O(N) evaluation over full history ensures 100% naive perfection
        for (let i = 1; i < this.history.length; i++) {
            const h = this.highs[i];
            const l = this.lows[i];
            let nextSar = sarVal + af * (ep - sarVal);

            if (isLong) {
                if (l < nextSar) {
                    isLong = false;
                    nextSar = Math.max(ep, h);
                    ep = l;
                    af = start;
                } else {
                    if (h > ep) {
                        ep = h;
                        af = Math.min(af + inc, max);
                    }
                }
            } else {
                if (h > nextSar) {
                    isLong = true;
                    nextSar = Math.min(ep, l);
                    ep = h;
                    af = start;
                } else {
                    if (l < ep) {
                        ep = l;
                        af = Math.min(af + inc, max);
                    }
                }
            }
            sarVal = nextSar;
        }
        return sarVal;
    }
}