/**
 * runtime/v1/index.ts
 * - Compiles Transpiled JS into a VM Script
 * - Injects Standard Library (UI, TA, Math)
 * - Bridges Context Data to Sandbox
 */
import { createStdlib } from "./stdlib";
import { Context } from "./context";
import { PREFIX } from "../../utils/v2/common";
export { Context };

/**
 * Helper: Recursively injects standard library functions with prefixes at EVERY level.
 */
function injectStdlib(target: any, lib: any, prefix: string) {
    for (const [key, val] of Object.entries(lib)) {
        // 1. Identify the new key with the prefix
        const prefixedKey = prefix + key;

        if (isPlainObject(val)) {
            // 2. If it's a namespace/object, create a new target object
            const namespaceObj: any = {};
            // 3. RECURSE: Dig deeper into the object to prefix its children
            injectStdlib(namespaceObj, val, prefix);
            target[prefixedKey] = namespaceObj;
        } else {
            // 4. It's a function or primitive, just assign it
            target[prefixedKey] = val;
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
        // Back-reference so security() can rebind global series during HTF eval (P1).
        (ctx as any).__sandbox = sandbox;

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
        
        sandbox[`${PREFIX}na`] = ctx.opsv2_na;

        // The bar counter is one series with two spellings. Bind BOTH names to
        // it, then let the profile's poison pills below remove whichever one is
        // not spellable at this version: v1-v3 mandate 'n', v4+ renamed it to
        // 'bar_index'.
        //
        // Binding only 'n' (as this did) meant inverting profile.banned for v4
        // would poison 'n' correctly but leave 'bar_index' unbound — a
        // ReferenceError through `with(sandbox)` rather than the series.
        const barCounter = ctx.vars.get(`${PREFIX}bar_index`);
        sandbox[`${PREFIX}n`] = barCounter;
        sandbox[`${PREFIX}bar_index`] = barCounter;

        // POISON PILLS: identifiers that exist in the engine but are not spellable
        // at this language version — v1–v3 mandate 'n' and ban 'bar_index'; v4+
        // invert that. As own getters they resolve through `with(sandbox)` and are
        // hit before the outer scope, so the throw happens on read.
        for (const [name, message] of ctx.profile.banned) {
            Object.defineProperty(sandbox, `${PREFIX}${name}`, {
                get() { throw new Error(message); },
                configurable: true, enumerable: false,
            });
        }

        Object.defineProperty(sandbox, '__opsv2_initialized', {
            value: true, writable: true, enumerable: false
        });
    }
}

/**
 * Browser-safe script host (replaces node:vm — enables the Web Worker runtime).
 * Wraps the transpiled body in a function whose free variables (`ctx`,
 * `opsv2_*`, …) resolve against `sandbox` via `with`. Names absent from the
 * sandbox (Math, Number, NaN, …) fall through to the real globals. Closures
 * created inside (e.g. security() thunks) keep dynamic `with`-scope lookup, so
 * rebinding sandbox globals at call time is observed — the basis for HTF eval.
 */
function defineMain(jsCode: string, sandbox: any): () => any {
    let factory: (sb: any) => () => any;
    try {
        // eslint-disable-next-line no-new-func
        factory = new Function("sandbox", `with (sandbox) { return function() { ${jsCode} }; }`) as any;
    } catch (e) {
        throw new Error(`Script Compilation Failed: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
    return factory(sandbox);
}

export function run(jsCode: string, ctx: Context, sandbox: any): any {
    initializeSandbox(sandbox, ctx);
    ctx.reset();
    return defineMain(jsCode, sandbox)();
}

export function compile(jsCode: string, ctx: Context, sandbox: any) {
    // 1. ONE-TIME INITIALIZATION
    initializeSandbox(sandbox, ctx);

    // 2. DEFINE THE EXECUTOR (browser-safe; no node:vm)
    const main = defineMain(jsCode, sandbox);

    // 3. RETURN THE EXECUTOR
    // sandbox.opsv2_close points at the Series object that ctx.setBar() mutates,
    // so each call sees the current bar with no manual primitive syncing.
    return () => main();
}

// Embeddable session/render-model API (see session.ts).
export { Session, runScript, buildRenderModel, PROTOCOL_VERSION, ENGINE_VERSION } from "./session";
export type { Compiled, SimResult, RenderSeries, RenderDelta, EngineError, InputView, Candle } from "./session";
