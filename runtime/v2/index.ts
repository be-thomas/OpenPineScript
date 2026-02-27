/**
 * runtime/v2/index.ts
 * - Compiles Transpiled JS into a VM Script
 * - Injects Standard Library (UI, TA, Math)
 * - Bridges Context Data to Sandbox
 */
import * as vm from "node:vm";
import { createStdlib } from "./stdlib"; 
import { Context } from "./context";
import { PREFIX } from "../../utils/v2/common";
export { Context };

/**
 * Helper: Recursively injects standard library functions with prefixes.
 */
function injectStdlib(target: any, lib: any, prefix: string) {
    for (const [key, val] of Object.entries(lib)) {
        if (isPlainObject(val)) {
            const namespaceObj: any = {};
            for (const [innerKey, innerVal] of Object.entries(val as any)) {
                namespaceObj[prefix + innerKey] = innerVal;
            }
            target[prefix + key] = namespaceObj;
        } else {
            target[prefix + key] = val;
        }
    }
}

function isPlainObject(val: any) {
    return typeof val === 'object' && val !== null && !Array.isArray(val) && val.constructor === Object;
}

/**
 * Initializes the sandbox environment, injecting the stdlib, 
 * series pointers, and legacy variables exactly once.
 */
function initializeSandbox(sandbox: any, ctx: Context) {
    if (!sandbox.__opsv2_initialized) {
        sandbox.ctx = ctx;

        // Create & Inject Library
        const lib = createStdlib(ctx); 
        injectStdlib(sandbox, lib, PREFIX);

        // Inject Core Series Variables (Pointers to the arrays in Context)
        sandbox[`${PREFIX}open`] = ctx.vars.get(`${PREFIX}open`);
        sandbox[`${PREFIX}high`] = ctx.vars.get(`${PREFIX}high`);
        sandbox[`${PREFIX}low`] = ctx.vars.get(`${PREFIX}low`);
        sandbox[`${PREFIX}close`] = ctx.vars.get(`${PREFIX}close`);
        sandbox[`${PREFIX}volume`] = ctx.vars.get(`${PREFIX}volume`);
        sandbox[`${PREFIX}time`] = ctx.vars.get(`${PREFIX}time`);
        
        // LEGACY v2 MAPPING: 'n' replaces 'bar_index' as the chronological series
        sandbox[`${PREFIX}n`] = ctx.vars.get(`${PREFIX}bar_index`);
        sandbox[`${PREFIX}na`] = ctx.opsv2_na;

        Object.defineProperty(sandbox, '__opsv2_initialized', {
            value: true, writable: true, enumerable: false
        });
    }
}

export function run(jsCode: string, ctx: Context, sandbox: any): any {
    initializeSandbox(sandbox, ctx);

    ctx.reset();

    const vmContext = vm.isContext(sandbox) ? sandbox : vm.createContext(sandbox);
    
    // POISON PILL: Injected directly into the VM to bypass Contextification stripping
    const poisonJS = `Object.defineProperty(this, '${PREFIX}bar_index', { get: function() { throw new Error("bar_index is strictly prohibited in v2. Use 'n' instead."); }, configurable: true });\n`;

    return vm.runInContext(poisonJS + jsCode, vmContext);
}

export function compile(jsCode: string, ctx: Context, sandbox: any) {
    // 1. ONE-TIME INITIALIZATION
    initializeSandbox(sandbox, ctx);

    // 2. WRAP SCRIPT IN A FUNCTION WITH POISON PILL INJECTED
    const wrappedCode = `
        Object.defineProperty(this, '${PREFIX}bar_index', { get: function() { throw new Error("bar_index is strictly prohibited in v2. Use 'n' instead."); }, configurable: true });

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
    return () => {
        // Because sandbox.opsv2_close points to the Series object in memory,
        // and ctx.setBar() updates that exact object, we no longer need to 
        // manually sync primitives here!
        return sandbox[`${PREFIX}main`]();
    };
}
