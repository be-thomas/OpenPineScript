import { describe, it } from "node:test";
import assert from "node:assert";
import { transpile } from "../../../transpiler/v2";
import { compile, Context } from "../../../runtime/v2";
import { PREFIX as OPSV2 } from "../../../utils/v2/common";

function executePine(pineCode: string): { ctx: Context, js: string } {
    // 1. Transpile to JS (var replacement ensures VM scoping safety)
    const js = transpile(pineCode).replace(/\blet\b/g, "var ");
    
    // 2. Setup the Runtime Context & Sandbox
    const ctx = new Context();
    const sandbox: any = Object.create(null);
    const exec = compile(js, ctx, sandbox);
    
    // 3. Execute on the first bar (index 0)
    ctx.setBar(0, 100, 100, 100, 100, 1000); 
    exec(); 
    
    return { ctx, js };
}

// Helper to easily grab the final value of a variable from the Context
function getVarValue(ctx: Context, varName: string): any {
    return ctx.getSeries(`${OPSV2}${varName}`, 0);
}

describe("Pine Script v2 'for' Loop Transpilation & Execution", () => {
    
    it("should correctly execute a standard forward loop", () => {
        const pine = [
            'sum = 0',
            'for i = 1 to 5',
            '    sum := sum + i'
        ].join('\n');
        
        const { ctx } = executePine(pine);
        assert.strictEqual(getVarValue(ctx, "sum"), 15);
    });

    it("should autonomously reverse the loop when start > end", () => {
        const pine = [
            'sum = 0',
            'for i = 5 to 1',
            '    sum := sum + i'
        ].join('\n');
        
        const { ctx } = executePine(pine);
        assert.strictEqual(getVarValue(ctx, "sum"), 15);
    });

    it("should handle positive 'by' steps correctly", () => {
        const pine = [
            'sum = 0',
            'for i = 1 to 10 by 2',
            '    sum := sum + i'
        ].join('\n');
        
        const { ctx } = executePine(pine);
        assert.strictEqual(getVarValue(ctx, "sum"), 25);
    });

    it("should handle auto-reversal with an explicit negative 'by' step", () => {
        const pine = [
            'sum = 0',
            'for i = 10 to 1 by -2',
            '    sum := sum + i'
        ].join('\n');
        
        const { ctx } = executePine(pine);
        assert.strictEqual(getVarValue(ctx, "sum"), 30);
    });

    it("should handle dynamic runtime bounds correctly", () => {
        const pine = [
            'startVal = 3',
            'endVal = 1',
            'sum = 0',
            'for i = startVal to endVal',
            '    sum := sum + i'
        ].join('\n');
        
        const { ctx } = executePine(pine);
        assert.strictEqual(getVarValue(ctx, "sum"), 6);
    });

    it("should prevent nested loops from experiencing variable collision", () => {
        const pine = [
            'total = 0',
            'for i = 1 to 3',
            '    for j = 1 to 3',
            '        total := total + 1'
        ].join('\n');
        
        const { ctx, js } = executePine(pine);
        
        const actualTotal = getVarValue(ctx, "total");
        
        // Diagnostic catch: If it equals 3 instead of 9, print the raw JS to the console!
        if (actualTotal !== 9) {
            console.error("\n[DIAGNOSTIC] Nested loop failed! Transpiled JS Output:");
            console.error("=========================================");
            console.error(js);
            console.error("=========================================\n");
        }
        
        // Outer runs 3 times, inner runs 3 times -> 3 * 3 = 9
        assert.strictEqual(actualTotal, 9);
    });

});