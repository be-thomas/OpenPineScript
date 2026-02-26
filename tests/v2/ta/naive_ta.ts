/**
 * test/naive_ta.ts
 * A "Gold Standard" Naive implementation of Pine Script TA.
 * Uses O(N) loops for everything. mathematically perfect, but slow.
 * Used to verify the optimized O(1) engine.
 */

export class NaiveTA {
    private history: number[] = [];
    private volume: number[] = [];

    // EMA/RMA need state even in naive mode
    private emaState: Map<string, number> = new Map();

    add(price: number, vol: number) {
        this.history.push(price);
        this.volume.push(vol);
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
}