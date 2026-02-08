import * as vm from "node:vm";
import { createStdlib } from "./stdlib"; 
import { Context } from "./context";

export { Context };

const PREFIX = "opsv2_";
const MAIN_FUNC = PREFIX + "main"; // "opsv2_main"

/**
 * Helper: Injects the standard library into the sandbox with automatic prefixing.
 * - Global functions (sma) -> sandbox.opsv2_sma
 * - Namespaces (strategy.entry) -> sandbox.opsv2_strategy.opsv2_entry
 */
function injectStdlib(sandbox: any, lib: any, prefix: string) {
  for (const [key, val] of Object.entries(lib)) {
    const globalKey = prefix + key;

    // Check if it's a Plain Object (Namespace)
    if (isPlainObject(val)) {
        const namespacedObj: Record<string, any> = {};
        for (const [innerKey, innerVal] of Object.entries(val as any)) {
            namespacedObj[prefix + innerKey] = innerVal;
        }
        sandbox[globalKey] = namespacedObj;
    } else {
        // Standard Function or Value
        sandbox[globalKey] = val;
    }
  }
}

// Helper to detect plain objects (excludes Arrays, null, Dates, etc.)
function isPlainObject(val: any) {
    return typeof val === 'object' && val !== null && !Array.isArray(val) && val.constructor === Object;
}

/**
 * PHASE 1: COMPILE
 */
export function compile(js: string, ctx: Context, sandbox: any) {
  
  // 1. ONE-TIME INITIALIZATION (Standard Library)
  if (!sandbox.__opsv2_initialized) {
    if (!sandbox.ctx) sandbox.ctx = ctx;

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
  const wrappedCode = `
    ${MAIN_FUNC} = function() {
      ${js}
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
      // A. Sync Data (Bridge Context -> Sandbox)
      sandbox[PREFIX + "open"]   = ctx.open;
      sandbox[PREFIX + "high"]   = ctx.high;
      sandbox[PREFIX + "low"]    = ctx.low;
      sandbox[PREFIX + "close"]  = ctx.close;
      sandbox[PREFIX + "volume"] = ctx.volume;
      sandbox[PREFIX + "time"]   = ctx.time;

      // B. Reset State
      ctx.reset();

      // C. Execute
      return sandbox[MAIN_FUNC]();
  };
}
