/**
 * Transpiler v2 tests: parse Pine Script, transpile to JavaScript, run and assert on results.
 */
import { describe, it } from "vitest";
import assert from "node:assert";
import * as path from "node:path";
import * as fs from "node:fs";
import * as vm from "node:vm";
import { PREFIX as OPSV2 } from "../../../utils/v2/common";
import { transpile } from "../../../transpiler/common";
import { compile, Context } from "../../../runtime/v1";
import { getGeneratedRegistry } from "../../../runtime/v1/stdlib/metadata";

const REGISTRY = getGeneratedRegistry();

/** Must match prefix in ToJsVisitor (opsv2_ = openpinescript v2). */

const PARSER_FIXTURES = path.join(__dirname, "../../v2/parser/fixtures");

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
  
  // Inject Context and safe math wrappers into the mock VM sandbox
  sandbox.ctx = ctx;
  sandbox.opsv2_safe_add = (a: any, b: any) => (Number.isNaN(Number(a)) ? 0 : Number(a)) + (Number.isNaN(Number(b)) ? 0 : Number(b));
  sandbox.opsv2_safe_eq = (a: any, b: any) => (a?.valueOf?.() ?? a) == (b?.valueOf?.() ?? b);
  sandbox.opsv2_safe_ne = (a: any, b: any) => (a?.valueOf?.() ?? a) != (b?.valueOf?.() ?? b);
  // v1-v5 emit the na-propagating comparisons (core.ts safe_*_na); no na operands here.
  sandbox.opsv2_safe_eq_na = sandbox.opsv2_safe_eq;
  sandbox.opsv2_safe_ne_na = sandbox.opsv2_safe_ne;
  sandbox.opsv2_safe_sub = (a: any, b: any) => (Number.isNaN(Number(a)) ? 0 : Number(a)) - (Number.isNaN(Number(b)) ? 0 : Number(b));
  sandbox["opsv2_$pick"] = (c: any, t: any, f: any) => (c ? t : f);

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

    // Inject the math wrappers for the mock VM
    opsv2_safe_add: (a: any, b: any) => (Number.isNaN(Number(a)) ? 0 : Number(a)) + (Number.isNaN(Number(b)) ? 0 : Number(b)),
    opsv2_safe_eq: (a: any, b: any) => (a?.valueOf?.() ?? a) == (b?.valueOf?.() ?? b),
    opsv2_safe_ne: (a: any, b: any) => (a?.valueOf?.() ?? a) != (b?.valueOf?.() ?? b),
    opsv2_safe_sub: (a: any, b: any) => (Number.isNaN(Number(a)) ? 0 : Number(a)) - (Number.isNaN(Number(b)) ? 0 : Number(b)),
  };
  
  vm.createContext(sandbox);
  vm.runInContext(js, sandbox);
  return sandbox;
}

describe("transpiler v2", () => {
  // ... [Keep output shape, literals, arithmetic, comparison tests the same] ...

  describe("destructuring – v2 restrictions", () => {
    // A function with no definition in the script has no tuple to unpack.
    it("throws error when [a,b]=getArr() is used with a function the script does not define", () => {
      assert.throws(
        () => runInSandbox("[a,b]=getArr()\n", { [OPSV2 + "getArr"]: () => [1, 2] }),
        /'getArr' does not return a tuple/
      );
    });

    it("throws error when [x,y,z]=triple() is used with a function the script does not define", () => {
      assert.throws(
        () => runInSandbox("[x,y,z]=triple()\n", { [OPSV2 + "triple"]: () => [10, 20, 30] }),
        /'triple' does not return a tuple/
      );
    });
    
    it("successfully destructures a built-in function (e.g. macd)", () => {
       // Built-in callees resolve through the registry, so a sandbox stub would
       // be bypassed — this exercises the real macd instead.
       const js = transpile("[m, s, h] = macd(close, 12, 26, 9)\n");
       assert.match(js, /ctx\.new_vars\(\["opsv2_m", "opsv2_s", "opsv2_h"\]/);
       assert.match(js, /ctx\.builtin\("macd"\)/);

       const sandbox = runInSandbox("[m, s, h] = macd(close, 12, 26, 9)\n");
       // All three names must be bound as Series, even though macd needs more
       // history than one bar before it yields finite values.
       for (const name of ["m", "s", "h"]) {
           assert.ok(sandbox[OPSV2 + name] !== undefined, `${name} was not bound`);
       }
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

    it("throws error on destructuring.pine because pair() is not defined by the script", () => {
      assert.throws(() => runInSandbox(loadFixture("destructuring.pine"), {
        [OPSV2 + "pair"]: () => [1, 2],
        [OPSV2 + "triple"]: () => [3, 4, 5],
      }), /'pair' does not return a tuple/);
    });

    it("array_literal.pine: the tuple return is accepted; its undeclared 'a' is what is refused", () => {
      // `foo()=>[1,2,3]` is a tuple-returning user function, no longer an error;
      // `bar()=>[a,b,c]` reads names the script never declares.
      assert.throws(() => runPine(loadFixture("array_literal.pine")), /Undeclared identifier 'a'/);
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

    it("unpacks a tuple returned by a user-defined function", () => {
      const ctx = runBars("pair(v)=>[v,v+1]\n[a,b]=pair(close)\n", [10]);
      assert.strictEqual(ctx.getSeries(OPSV2 + "a", 0), 10);
      assert.strictEqual(ctx.getSeries(OPSV2 + "b", 0), 11);
    });
  });
});