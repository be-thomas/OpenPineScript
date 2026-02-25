/**
 * runtime/v2/index.ts
 * - Compiles Transpiled JS into a VM Script
 * - Injects Standard Library (UI, TA, Math)
 * - Bridges Context Data to Sandbox
 */
import * as vm from "node:vm";
import { createStdlib } from "./stdlib"; 
import { Context } from "./context";

export { Context };

// Prefix used by Transpiler
const PREFIX = "opsv2_";

/**
 * Helper: Recursively injects standard library functions with prefixes.
 * Handles:
 * 1. Global Functions: plot() -> opsv2_plot()
 * 2. Namespaces: ta.sma() -> opsv2_ta.opsv2_sma()
 */
function injectStdlib(target: any, lib: any, prefix: string) {
    for (const [key, val] of Object.entries(lib)) {
        // If it's a Namespace (Object containing functions)
        if (isPlainObject(val)) {
            const namespaceObj: any = {};
            // Recursively prefix the inner keys (sma -> opsv2_sma)
            for (const [innerKey, innerVal] of Object.entries(val as any)) {
                namespaceObj[prefix + innerKey] = innerVal;
            }
            // Assign the namespace itself (ta -> opsv2_ta)
            target[prefix + key] = namespaceObj;
        } 
        // If it's a direct function or value (plot, close, NaN)
        else {
            target[prefix + key] = val;
        }
    }
}

// Helper to detect plain objects (excludes Arrays, null, Dates, etc.)
function isPlainObject(val: any) {
    return typeof val === 'object' && val !== null && !Array.isArray(val) && val.constructor === Object;
}

/**
 * COMPILER
 * 1. Prepares the Sandbox with Standard Library
 * 2. Wraps the User Code in a Function
 * 3. Returns an Executor Function
 */
export function compile(jsCode: string, ctx: Context, sandbox: any) {
  
    // 1. ONE-TIME INITIALIZATION (Standard Library Injection)
    // We check a hidden flag so we don't re-inject stdlib on every re-compile of the same sandbox
    if (!sandbox.__opsv2_initialized) {
        
        // Ensure Context is available globally for ctx.call()
        sandbox.ctx = ctx;

        // Create & Inject Library
        const lib = createStdlib(ctx); 
        injectStdlib(sandbox, lib, PREFIX);

        // Mark as initialized
        Object.defineProperty(sandbox, '__opsv2_initialized', {
            value: true,
            writable: true,
            enumerable: false
        });
    }

    // 2. WRAP SCRIPT IN A FUNCTION
    // The transpiler emits "opsv2_plot(...)", so we just need a function wrapper.
    // We name it "opsv2_main" so we can call it easily.
    const wrappedCode = `
        ${PREFIX}main = function() {
            ${jsCode}
        };
    `;

    // 3. COMPILE & DEFINE
    const vmContext = vm.isContext(sandbox) ? sandbox : vm.createContext(sandbox);
    try {
        vm.runInContext(wrappedCode, vmContext);
    } catch (e) {
        throw new Error(`Script Compilation Failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }

    // 4. RETURN THE EXECUTOR
    // This function is called for EVERY BAR in the backtest loop.
    return () => {
        // A. Sync Data (Bridge Context -> Sandbox variables)
        // These match the transpiled variable names (opsv2_open, etc.)
        sandbox[PREFIX + "open"]   = ctx.open;
        sandbox[PREFIX + "high"]   = ctx.high;
        sandbox[PREFIX + "low"]    = ctx.low;
        sandbox[PREFIX + "close"]  = ctx.close;
        sandbox[PREFIX + "volume"] = ctx.volume;
        sandbox[PREFIX + "time"]   = ctx.time;

        // B. Reset Context State (Call Stack, etc.)
        ctx.reset();

        // C. Execute the compiled function
        return sandbox[PREFIX + "main"]();
    };
}
