/**
 * Transpiler v2 tests: parse Pine Script, transpile to JavaScript, run and assert on results.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import * as path from "node:path";
import * as fs from "node:fs";
import * as vm from "node:vm";
import { PREFIX as OPSV2 } from "../../../utils/v2/common";
import { transpile } from "../../../transpiler/v2";
import { compile, Context } from "../../../runtime/v2";
import { getGeneratedRegistry } from "../../../runtime/v2/stdlib/metadata";

const REGISTRY = getGeneratedRegistry();

/** Must match prefix in ToJsVisitor (opsv2_ = openpinescript v2). */

const PARSER_FIXTURES = path.join(__dirname, "../parser/fixtures");

function loadFixture(name: string): string {
  const p = path.join(PARSER_FIXTURES, name.endsWith(".pine") ? name : `${name}.pine`);
  return fs.readFileSync(p, "utf-8");
}

function v(x: unknown): any {
  if (x !== null && x !== undefined && typeof x === "object" && typeof (x as any).valueOf === "function") {
    return (x as any).valueOf();
  }
  return x;
}

function runPine(pineSource: string): Record<string, unknown> {
  let js = transpile(pineSource);
  js = js.replace(/\blet\b/g, "var");
  const ctx = new Context();
  const sandbox: Record<string, unknown> = Object.create(null);
  sandbox.ctx = ctx;
  vm.createContext(sandbox);
  vm.runInContext(js, sandbox);
  return sandbox;
}

function runBars(pineSource: string, closes: number[]): Context {
  const ctx = new Context();
  const sandbox: Record<string, unknown> = Object.create(null);
  const exec = compile(transpile(pineSource), ctx, sandbox);

  for (let i = 0; i < closes.length; i++) {
    const close = closes[i];
    ctx.setBar(i, close, close, close, close, 1);
    exec();
    if (i < closes.length - 1) {
      ctx.finalizeBar();
    }
  }

  return ctx;
}

function runInSandbox(pineSource: string, extra: Record<string, unknown>): Record<string, unknown> {
  let js = transpile(pineSource).replace(/\blet\b/g, "var");
  const ctx = new Context();
  
  // Inject the same base variables the real runner provides
  const sandbox: Record<string, unknown> = { 
    ctx, 
    ...extra,
    [`${OPSV2}close`]: ctx.vars.get(`${OPSV2}close`),
    [`${OPSV2}open`]: ctx.vars.get(`${OPSV2}open`),
    [`${OPSV2}high`]: ctx.vars.get(`${OPSV2}high`),
    [`${OPSV2}low`]: ctx.vars.get(`${OPSV2}low`),
  };
  
  vm.createContext(sandbox);
  vm.runInContext(js, sandbox);
  return sandbox;
}

describe("transpiler v2", () => {
  // ... [Keep output shape, literals, arithmetic, comparison tests the same] ...

  describe("destructuring – v2 restrictions", () => {
    it("throws error when [a,b]=getArr() is used with a non-registry function", () => {
      // Note: We use the exact string from your ToJsVisitor.ts
      assert.throws(
        () => runInSandbox("[a,b]=getArr()\n", { [OPSV2 + "getArr"]: () => [1, 2] }), 
        /User-defined functions cannot return tuples/
      );
    });
  
    it("throws error when [x,y,z]=triple() is used with a user-defined function", () => {
      assert.throws(
        () => runInSandbox("[x,y,z]=triple()\n", { [OPSV2 + "triple"]: () => [10, 20, 30] }), 
        /User-defined functions cannot return tuples/
      );
    });
    
    it("successfully destructures a built-in function (e.g. macd)", () => {
       // Now that runInSandbox has opsv2_close, this will pass!
       const sandbox = runInSandbox("[m, s, h] = macd(close, 12, 26, 9)\n", {
           [OPSV2 + "macd"]: () => [1, 2, 3]
       });
       assert.strictEqual(v(sandbox[OPSV2 + "m"]), 1);
    });
  });

  // ... [Keep array literal and subscript, precedence, keyword args tests the same] ...

  describe("fixture-based (v2 compliance)", () => {
    it("transpiles and evaluates expr.pine", () => {
      const g = runPine(loadFixture("expr.pine"));
      assert.strictEqual(v(g[OPSV2 + "a"]), 7);
    });

    it("transpiles and evaluates ternary.pine", () => {
      const g = runPine(loadFixture("ternary.pine"));
      assert.strictEqual(v(g[OPSV2 + "a"]), 1);
      assert.strictEqual(v(g[OPSV2 + "b"]), 2);
    });

    it("throws error on destructuring.pine because user functions cannot return tuples", () => {
      assert.throws(() => runInSandbox(loadFixture("destructuring.pine"), {
        [OPSV2 + "pair"]: () => [1, 2],
        [OPSV2 + "triple"]: () => [3, 4, 5],
      }), /User-defined functions cannot return tuples/);
    });

    it("throws error on array_literal.pine because user functions cannot return tuples", () => {
      assert.throws(() => runPine(loadFixture("array_literal.pine")), /User-defined functions cannot return tuples/);
    });
  });

  describe("runtime series regressions", () => {
    it("stores transpiled vars as Series and preserves numeric value", () => {
      const ctx = runBars("x=close\ny=x+1\n", [10]);
      assert.strictEqual(ctx.getSeries(OPSV2 + "x", 0), 10);
      assert.strictEqual(ctx.getSeries(OPSV2 + "y", 0), 11);
    });

    it("resolves history indexing from Series objects across bars", () => {
      const ctx = runBars("x=close\nprev=x[1]\n", [10, 20]);
      assert.strictEqual(ctx.getSeries(OPSV2 + "prev", 0), 10);
    });

    it("throws error on tuple assignment from user-defined function", () => {
      assert.throws(() => runBars("pair(v)=>[v,v+1]\n[a,b]=pair(close)\n", [10]), /User-defined functions cannot return tuples/);
    });
  });
});