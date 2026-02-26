/**
 * Transpiler v2 Extended Tests:
 * Focuses on v2-specific constraints: Ternary Associativity and Tuple Restrictions.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import * as vm from "node:vm";
import { PREFIX as OPSV2 } from "../../../utils/v2/common";
import { transpile } from "../../../transpiler/v2";
import { Context } from "../../../runtime/v2";

/**
 * Helper to unwrap Series values for assertion.
 */
function v(x: unknown): any {
  if (x !== null && x !== undefined && typeof x === "object" && typeof (x as any).valueOf === "function") {
    return (x as any).valueOf();
  }
  return x;
}

/**
 * Runs Pine Script in a sandbox.
 */
function runPine(pineSource: string): Record<string, unknown> {
  const js = transpile(pineSource).replace(/\blet\b/g, "var");
  const ctx = new Context();
  const sandbox: Record<string, unknown> = Object.create(null);
  sandbox.ctx = ctx;
  // Inject built-in series pointers as the real engine does
  sandbox[`${OPSV2}close`] = ctx.vars.get(`${OPSV2}close`);
  
  vm.createContext(sandbox);
  vm.runInContext(js, sandbox);
  return sandbox;
}

describe("transpiler v2 extended (v2 constraints)", () => {

  describe("ternary right-associativity", () => {
    it("evaluates nested ternary right-to-left correctly (a ? b : c ? d : e)", () => {
      // Logic: 10 is not 1. 20 is not 2. Should result in 30.
      const source = `x = 10\nres = x == 1 ? 10 : x == 2 ? 20 : 30`.trim();
      const g = runPine(source);
      assert.strictEqual(v(g[OPSV2 + "res"]), 30);
    });

    it("evaluates truthy middle branch in nested ternary", () => {
      const source = `x = 2\nres = x == 1 ? 10 : x == 2 ? 20 : 30`.trim();
      const g = runPine(source);
      assert.strictEqual(v(g[OPSV2 + "res"]), 20);
    });
  });

  describe("tuple destructuring restrictions", () => {
    it("throws error when user-defined function tries to return a tuple (Single-line)", () => {
      const source = `myFunc(x) => [x, x + 1]\n[a, b] = myFunc(1)`;
      assert.throws(() => transpile(source), /User-defined functions cannot return tuples in Pine Script v2/);
    });

    it("throws error when user-defined function tries to return a tuple (Multi-line)", () => {
      const source = `myFunc(x) =>\n    y = x + 1\n    [x, y]\n[a, b] = myFunc(1)`.trim();
      assert.throws(() => transpile(source), /User-defined functions cannot return tuples in Pine Script v2/);
    });

    it("throws error when attempting to destructure a user-defined function call", () => {
      const source = `pair(v) => [v, v+1]\n[a, b] = pair(close)`.trim();
      assert.throws(() => transpile(source), /User-defined functions cannot return tuples/);
    });

    it("throws error when destructuring a function not marked as returning a tuple in REGISTRY", () => {
      const source = `[a, b] = sma(close, 14)`.trim();
      assert.throws(() => transpile(source), /does not return a tuple/);
    });

    it("throws error when destructuring happens from a non-function call", () => {
      const source = `x = 10\n[a, b] = x`.trim();
      assert.throws(() => transpile(source), /must originate directly from a supported built-in function call/);
    });
  });

  describe("registry-based type safety", () => {
    it("throws error when tuple length mismatch occurs (Built-in mock)", () => {
      const source = `[macdLine, signalLine] = macd(close, 12, 26, 9)`.trim();
      assert.throws(() => transpile(source), /returns 3 values, but you provided 2 variables/);
    });
  });

  describe("barstate flag availability", () => {
    it("transpiles barstate getters into ctx.call", () => {
      const js = transpile("x = barstate.islast\n");
      assert.ok(js.includes(`ctx.call("barstate.islast`));
    });
  });

});