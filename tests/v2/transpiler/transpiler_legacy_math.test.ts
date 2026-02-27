import { describe, it } from "node:test";
import assert from "node:assert";
import { transpile } from "../../../transpiler/v2";
import { compile, Context } from "../../../runtime/v2";
import { PREFIX as OPSV2 } from "../../../utils/v2/common";

/**
 * Helper to compile and execute Pine Script across multiple bars.
 * Allows testing of chronological index ('n') and historical lookups ('close[1]').
 */
function executePine(pineCode: string, totalBars: number = 1): Context {
    const js = transpile(pineCode).replace(/\blet\b/g, "var ");
    
    const ctx = new Context();
    const sandbox: any = Object.create(null);
    const exec = compile(js, ctx, sandbox);
    
    for (let i = 0; i < totalBars; i++) {
        // Mock OHLCV data. 
        // We alternate close > open (Bullish) and close < open (Bearish) to test logic counting
        const close = i % 2 === 0 ? 105 : 95; 
        const open = 100;
        
        ctx.setBar(i * 1000, open, 110, 90, close, 1000); 
        exec(); 
        
        // We finalize all bars EXCEPT the last one, 
        // so we can read the active state directly from offset 0.
        if (i < totalBars - 1) {
            ctx.finalizeBar();
        }
    }
    
    return ctx;
}

// Helper to grab the active value of a variable
function getVarValue(ctx: Context, varName: string): any {
    return ctx.getSeries(`${OPSV2}${varName}`, 0);
}

describe("Pine Script v2 Legacy Math & Environment Variables", () => {
    
    describe("Chronological Index Mapping", () => {
        it("should expose 'n' as the chronological zero-based bar index", () => {
            const pine = `val = n`;
            const ctx = executePine(pine, 5); // Runs 5 bars (indices 0, 1, 2, 3, 4)
            
            assert.strictEqual(getVarValue(ctx, "val"), 4);
        });

        it("should throw an error when attempting to access 'bar_index'", () => {
            const pine = `val = bar_index`;
            
            assert.throws(() => {
                executePine(pine, 1);
            }, /bar_index is strictly prohibited in v2/);
        });
    });

    describe("Boolean & Null (na) Arithmetic Casting", () => {
        it("should implicitly cast booleans to integers during addition and subtraction", () => {
            const pine = [
                'bool1 = true',
                'bool2 = false',
                'res_add = bool1 + bool1 + bool2', // 1 + 1 + 0 = 2
                'res_sub = bool1 - bool2'          // 1 - 0 = 1
            ].join('\n');
            
            const ctx = executePine(pine, 1);
            
            assert.strictEqual(getVarValue(ctx, "res_add"), 2);
            assert.strictEqual(getVarValue(ctx, "res_sub"), 1);
        });

        it("should coerce 'na' to 0 during arithmetic to prevent series poisoning", () => {
            const pine = [
                'out_of_bounds = close[10]',    // Yields na (NaN) because history doesn't exist on bar 0
                'res_add = out_of_bounds + 5',  // na + 5 -> 0 + 5 = 5
                'res_sub = 10 - out_of_bounds'  // 10 - na -> 10 - 0 = 10
            ].join('\n');
            
            const ctx = executePine(pine, 1);
            
            assert.strictEqual(getVarValue(ctx, "res_add"), 5);
            assert.strictEqual(getVarValue(ctx, "res_sub"), 10);
        });

        it("should cleanly evaluate legacy logical counting equations", () => {
            const pine = [
                'count = (close > open) + (close[1] > open[1]) + (close[2] > open[2])'
            ].join('\n');
            
            const ctx = executePine(pine, 1);
            assert.strictEqual(getVarValue(ctx, "count"), 1);
        });

        it("should track logic counting accurately across multiple bars", () => {
            const pine = [
                'count = (close > open) + (close[1] > open[1])'
            ].join('\n');
            
            const ctx = executePine(pine, 3);
            assert.strictEqual(getVarValue(ctx, "count"), 1);
        });
    });

});
