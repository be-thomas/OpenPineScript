import { Context } from "./context";

/**
 * Series<T> - Sparse Time-Series Storage
 * * STRATEGY: SPRASE ARRAY (Memory Optimization)
 * Unlike standard arrays that push value-by-value, this class creates "holes" 
 * for missing bars. We do NOT loop to fill gaps with NaNs.
 * * - If update() is skipped for 1000 bars (e.g. inside a conditional),
 * we simply write to index+1000.
 * - The JavaScript engine optimizes these holes (V8 uses a dictionary 
 * backing store for very sparse arrays).
 * - get() checks for 'undefined' (a hole) and returns the fallback (NaN/null).
 */
export class Series<T = any> {
    // Native sparse array. 
    // V8 will optimize this if it has many holes.
    private buffer: (T | null)[] = [];
    
    // The Bar Index where this series was FIRST created.
    // Internal Index 0 corresponds to this Context Bar Index.
    private startBarIndex: number = -1;

    // The current head value (cached for speed)
    private _val: T | null = null;

    // FALLBACK VALUE:
    // If we hit a hole, what do we return?
    // - Numbers -> NaN (Critical for math safety)
    // - Strings/Bools -> null (Logical safety)
    private _fallback: any = null; 
    private _typeLocked: boolean = false;

    constructor(private ctx: Context, public id: string) {}

    public update(val: T | null): Series<T> {
        this._val = val;

        // 1. Initialize Start Time (Once)
        if (this.startBarIndex === -1) {
            this.startBarIndex = this.ctx.currentBarIndex;
        }

        // 2. Type Safety Lock (Once)
        // Detects if this is a "Number Series" or "Object Series"
        if (!this._typeLocked && val !== null && val !== undefined) {
            if (typeof val === 'number') {
                this._fallback = NaN;
            } else {
                this._fallback = null;
            }
            this._typeLocked = true;
        }

        // 3. Sparse Assignment
        // Calculate the internal index relative to start.
        const internalIndex = this.ctx.currentBarIndex - this.startBarIndex;
        
        // We do NOT pad. We just write.
        // If internalIndex jumps from 5 to 500, indices 6-499 become holes.
        // This is O(1).
        this.buffer[internalIndex] = val;

        return this;
    }

    public get(offset: number): T | null {
        // Target Bar = Current - Offset
        const targetBarIndex = this.ctx.currentBarIndex - offset;
        const internalIndex = targetBarIndex - this.startBarIndex;

        // Boundary Checks
        if (internalIndex < 0) return this._fallback; // Before existence
        
        // Sparse Access
        // Accessing a hole in JS returns 'undefined'.
        const val = this.buffer[internalIndex];

        // If 'undefined' (Hole) or 'null' (Explicit Null), return Fallback.
        if (val === undefined || val === null) {
            return this._fallback;
        }

        return val;
    }

    /**
     * Primitive conversion.
     * Allows "series + 1" to work if T is number.
     */
    public valueOf(): T | null {
        return this._val;
    }

    /**
     * String representation.
     * Allows template literals `${series}` to work.
     */
    public toString(): string {
        return String(this._val);
    }
}
