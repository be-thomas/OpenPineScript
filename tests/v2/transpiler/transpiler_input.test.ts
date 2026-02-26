import { describe, it } from "node:test";
import assert from "node:assert";
import { transpile } from "../../../transpiler/v2";
import { compile, Context } from "../../../runtime/v2";
import { PREFIX as OPSV2 } from "../../../utils/v2/common";

describe("Two-Pass Input Architecture", () => {
    it("extracts input metadata on dry_run, creates new VM, and applies overrides", () => {
        const pine = [
            'len = input(14, "SMA Length")',
            'mult = input(2.0, "Multiplier")',
            'res = len * mult'
        ].join('\n');
        
        const js = transpile(pine).replace(/\blet\b/g, "var ");

        // DIAGNOSTIC 1: Did the transpiler actually output the input calls?
        if (!js.includes('opsv2_input')) {
            throw new Error(`[DIAGNOSTIC] Transpiler failed to generate input calls!\nJS Output:\n${js}`);
        }

        // ==========================================
        // PASS 1: DRY RUN
        // ==========================================
        const ctx1 = new Context();
        const sandbox1: any = Object.create(null);
        
        const exec1 = compile(js, ctx1, sandbox1);
        
        // DIAGNOSTIC 2: Did createStdlib actually put input in the sandbox?
        if (typeof sandbox1[`${OPSV2}input`] !== 'function') {
            throw new Error(`[DIAGNOSTIC] createStdlib failed to inject opsv2_input! Type found: ${typeof sandbox1[`${OPSV2}input`]}`);
        }

        ctx1.setBar(0, 100, 100, 100, 100, 1000); 
        exec1(); 
        
        // DIAGNOSTIC 3: If it ran, but length is 0, we output the exact JS it tried to run.
        assert.strictEqual(
            ctx1.inputDefs.length, 
            2, 
            `[DIAGNOSTIC] Execution ran, but registerInput was bypassed! JS:\n${js}`
        );
        
        assert.strictEqual(ctx1.inputDefs[0].title, "SMA Length");
        assert.strictEqual(ctx1.getSeries(`${OPSV2}res`, 0), 28); 

        // ==========================================
        // PASS 2: ISOLATED VM
        // ==========================================
        const ctx2 = new Context();
        const sandbox2: any = Object.create(null);
        
        ctx2.inputDefs = ctx1.inputDefs;
        ctx2.userInputs[ctx2.inputDefs[0].id] = 20; 
        
        const exec2 = compile(js, ctx2, sandbox2);
        
        ctx2.setBar(0, 100, 100, 100, 100, 1000); 
        exec2();

        assert.strictEqual(ctx2.getSeries(`${OPSV2}res`, 0), 40);
    });
});
