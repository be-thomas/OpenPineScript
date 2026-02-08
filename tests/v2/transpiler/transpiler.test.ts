/**
 * Transpiler v2 tests: parse Pine Script, transpile to JavaScript, run and assert on results.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import * as path from "node:path";
import * as fs from "node:fs";
import * as vm from "node:vm";
import { transpile } from "../../../transpiler/v2";

/** Must match prefix in ToJsVisitor (opsv2_ = openpinescript v2). */
const OPSV2 = "opsv2_";

const PARSER_FIXTURES = path.join(__dirname, "../parser/fixtures");

function loadFixture(name: string): string {
  const p = path.join(PARSER_FIXTURES, name.endsWith(".pine") ? name : `${name}.pine`);
  return fs.readFileSync(p, "utf-8");
}

/**
 * Transpile Pine source to JS and run it in a fresh VM context.
 * Returns the sandbox so tests can assert on variable values and call defined functions.
 * Uses `var` instead of `let` so top-level bindings become sandbox properties (VM global object).
 */
function runPine(pineSource: string): Record<string, unknown> {
  let js = transpile(pineSource);
  js = js.replace(/\blet\b/g, "var");
  const sandbox: Record<string, unknown> = Object.create(null);
  vm.createContext(sandbox);
  vm.runInContext(js, sandbox);
  return sandbox;
}

describe("transpiler v2", () => {
  describe("output shape (transpiled string)", () => {
    it("transpiles x=1 to let opsv2_x = 1", () => {
      const js = transpile("x=1\n");
      assert.ok(js.includes(`let ${OPSV2}x = 1`));
    });

    it("transpiles a=1+2*3 with correct precedence", () => {
      const js = transpile("a=1+2*3\n");
      assert.ok(js.includes(`let ${OPSV2}a = `));
      assert.ok(js.includes("2 * 3"));
      assert.ok(js.includes("1 + "));
    });

    it("transpiles single-line arrow function to function with return", () => {
      const js = transpile(" double(x)=>x*2\n");
      assert.ok(js.includes(`function ${OPSV2}double`));
      assert.ok(js.includes(`(${OPSV2}x)`));
      assert.ok(js.includes("return"));
      assert.ok(js.includes(`${OPSV2}x * 2`));
    });

    it("throws on parse errors", () => {
      assert.throws(() => transpile("a = \n"), /Parsing failed/);
    });
  });

  describe("literals – parsed and evaluated", () => {
    it("evaluates integer literal", () => {
      const g = runPine("x=42\n");
      assert.strictEqual(g[OPSV2 + "x"], 42);
    });

    it("evaluates float literal", () => {
      const g = runPine("x=3.14\n");
      assert.strictEqual(g[OPSV2 + "x"], 3.14);
    });

    it("evaluates boolean literals", () => {
      const g = runPine("a=true\nb=false\n");
      assert.strictEqual(g[OPSV2 + "a"], true);
      assert.strictEqual(g[OPSV2 + "b"], false);
    });

    it("evaluates string literals (double and single quote)", () => {
      const g = runPine('s="hello"\nt=\'world\'\n');
      assert.strictEqual(g[OPSV2 + "s"], "hello");
      assert.strictEqual(g[OPSV2 + "t"], "world");
    });
  });

  describe("arithmetic – parsed and evaluated", () => {
    it("evaluates 1+2*3 with precedence", () => {
      const g = runPine("a=1+2*3\n");
      assert.strictEqual(g[OPSV2 + "a"], 7);
    });

    it("evaluates subtraction and division", () => {
      const g = runPine("a=10-3\nb=15/3\n");
      assert.strictEqual(g[OPSV2 + "a"], 7);
      assert.strictEqual(g[OPSV2 + "b"], 5);
    });

    it("evaluates modulo", () => {
      const g = runPine("r=10%3\n");
      assert.strictEqual(g[OPSV2 + "r"], 1);
    });

    it("evaluates parenthesized expression", () => {
      const g = runPine("a=(1+2)*3\n");
      assert.strictEqual(g[OPSV2 + "a"], 9);
    });

    it("evaluates unary minus", () => {
      const g = runPine("a=-5\n");
      assert.strictEqual(g[OPSV2 + "a"], -5);
    });

    it("evaluates unary plus", () => {
      const g = runPine("a=+5\n");
      assert.strictEqual(g[OPSV2 + "a"], 5);
    });
  });

  describe("comparison and logical – parsed and evaluated", () => {
    it("evaluates == and !=", () => {
      const g = runPine("a=1==1\nb=1!=2\n");
      assert.strictEqual(g[OPSV2 + "a"], true);
      assert.strictEqual(g[OPSV2 + "b"], true);
    });

    it("evaluates <, <=, >, >=", () => {
      const g = runPine("a=2>1\nb=2>=2\nc=1<2\nd=2<=2\n");
      assert.strictEqual(g[OPSV2 + "a"], true);
      assert.strictEqual(g[OPSV2 + "b"], true);
      assert.strictEqual(g[OPSV2 + "c"], true);
      assert.strictEqual(g[OPSV2 + "d"], true);
    });

    it("evaluates and/or", () => {
      const g = runPine("a=(true)and(false)\nb=(true)or(false)\n");
      assert.strictEqual(g[OPSV2 + "a"], false);
      assert.strictEqual(g[OPSV2 + "b"], true);
    });

    it("evaluates not", () => {
      const g = runPine("a=not(false)\nb=not(true)\n");
      assert.strictEqual(g[OPSV2 + "a"], true);
      assert.strictEqual(g[OPSV2 + "b"], false);
    });
  });

  describe("ternary – parsed and evaluated", () => {
    it("evaluates condition ? then : else", () => {
      const g = runPine("a=1\nb=a==1?10:20\n");
      assert.strictEqual(g[OPSV2 + "a"], 1);
      assert.strictEqual(g[OPSV2 + "b"], 10);
    });

    it("evaluates false branch", () => {
      const g = runPine("a=0\nb=a==1?10:20\n");
      assert.strictEqual(g[OPSV2 + "b"], 20);
    });
  });

  describe("variable assignment – parsed and evaluated", () => {
    it("evaluates := assignment", () => {
      const g = runPine("x=1\nx:=2\n");
      assert.strictEqual(g[OPSV2 + "x"], 2);
    });
  });

  describe("multiple and comma-separated statements – parsed and evaluated", () => {
    it("evaluates multiple statements", () => {
      const g = runPine("a=1\nb=2\nc=a+b\n");
      assert.strictEqual(g[OPSV2 + "a"], 1);
      assert.strictEqual(g[OPSV2 + "b"], 2);
      assert.strictEqual(g[OPSV2 + "c"], 3);
    });

    it("evaluates comma-separated statements", () => {
      const g = runPine("a=1,b=2,c=a+b\n");
      assert.strictEqual(g[OPSV2 + "a"], 1);
      assert.strictEqual(g[OPSV2 + "b"], 2);
      assert.strictEqual(g[OPSV2 + "c"], 3);
    });
  });

  describe("function definition and call – parsed and evaluated", () => {
    it("defines and calls single-line function, return value evaluated", () => {
      const g = runPine(" double(x)=>x*2\n");
      assert.strictEqual(typeof g[OPSV2 + "double"], "function");
      assert.strictEqual((g[OPSV2 + "double"] as (x: number) => number)(5), 10);
    });

    it("function with multiple parameters", () => {
      const g = runPine(" add(a,b)=>a+b\n");
      assert.strictEqual((g[OPSV2 + "add"] as (a: number, b: number) => number)(2, 3), 5);
    });

    it("function with zero parameters", () => {
      const g = runPine(" one()=>1\n");
      assert.strictEqual((g[OPSV2 + "one"] as () => number)(), 1);
    });

    it("call function and assign result", () => {
      const g = runPine(" double(x)=>x*2\ny=double(7)\n");
      assert.strictEqual(g[OPSV2 + "y"], 14);
    });
  });

  describe("function calls (expression) – parsed and evaluated", () => {
    it("evaluates f(1,2) when f is provided in sandbox as opsv2_f", () => {
      let js = transpile("f(1,2)\n").replace(/\blet\b/g, "var");
      const sandbox: Record<string, unknown> = {
        [OPSV2 + "f"]: (a: number, b: number) => a + b,
      };
      vm.createContext(sandbox);
      vm.runInContext(js, sandbox);
      assert.strictEqual((sandbox[OPSV2 + "f"] as (a: number, b: number) => number)(1, 2), 3);
    });
  });

  describe("destructuring – parsed and evaluated", () => {
    it("evaluates [a,b]=getArr() style destructuring", () => {
      let js = transpile("[a,b]=getArr()\n").replace(/\blet\b/g, "var");
      const sandbox: Record<string, unknown> = { [OPSV2 + "getArr"]: () => [1, 2] };
      vm.createContext(sandbox);
      vm.runInContext(js, sandbox);
      assert.strictEqual(sandbox[OPSV2 + "a"], 1);
      assert.strictEqual(sandbox[OPSV2 + "b"], 2);
    });

    it("evaluates [x,y,z]=array from function result", () => {
      let js = transpile("[x,y,z]=triple()\n").replace(/\blet\b/g, "var");
      const sandbox: Record<string, unknown> = {
        [OPSV2 + "triple"]: () => [10, 20, 30],
      };
      vm.createContext(sandbox);
      vm.runInContext(js, sandbox);
      assert.strictEqual(sandbox[OPSV2 + "x"], 10);
      assert.strictEqual(sandbox[OPSV2 + "y"], 20);
      assert.strictEqual(sandbox[OPSV2 + "z"], 30);
    });
  });

  describe("array literal and subscript – parsed and evaluated", () => {
    it("evaluates array from function in variable", () => {
      let js = transpile("arr=getArr()\n").replace(/\blet\b/g, "var");
      const sandbox: Record<string, unknown> = { [OPSV2 + "getArr"]: () => [1, 2, 3] };
      vm.createContext(sandbox);
      vm.runInContext(js, sandbox);
      assert.deepStrictEqual(sandbox[OPSV2 + "arr"], [1, 2, 3]);
    });

    it("evaluates subscript access", () => {
      let js = transpile("arr=getArr()\nfirst=arr[0]\n").replace(/\blet\b/g, "var");
      const sandbox: Record<string, unknown> = { [OPSV2 + "getArr"]: () => [10, 20, 30] };
      vm.createContext(sandbox);
      vm.runInContext(js, sandbox);
      assert.strictEqual(sandbox[OPSV2 + "first"], 10);
    });

    it("evaluates subscript in expression", () => {
      let js = transpile("arr=getArr()\nx=arr[1]+arr[2]\n").replace(/\blet\b/g, "var");
      const sandbox: Record<string, unknown> = { [OPSV2 + "getArr"]: () => [5, 15, 25] };
      vm.createContext(sandbox);
      vm.runInContext(js, sandbox);
      assert.strictEqual(sandbox[OPSV2 + "x"], 40);
    });
  });

  describe("precedence (full expression) – parsed and evaluated", () => {
    it("evaluates mixed arithmetic and logical like precedence.pine", () => {
      const g = runPine("a=1+2*3\nb=(1)and(0)or(1)\nd=-1\ne=not(false)\n");
      assert.strictEqual(g[OPSV2 + "a"], 7);
      assert.ok(g[OPSV2 + "b"]);
      assert.strictEqual(g[OPSV2 + "d"], -1);
      assert.strictEqual(g[OPSV2 + "e"], true);
    });
  });

  describe("keyword args (output shape; evaluation with mock)", () => {
    it("transpiles call with keyword args", () => {
      const js = transpile(loadFixture("call_kw_args.pine"));
      assert.ok(js.includes("("));
      assert.ok(js.includes(")"));
    });

    it("evaluates call with keyword args when function is in sandbox", () => {
      let js = transpile("r=plot(1,width=10)\n").replace(/\blet\b/g, "var");
      const sandbox: Record<string, unknown> = {
        [OPSV2 + "plot"]: (_x: number, opts?: { opsv2_width?: number }) => opts?.opsv2_width ?? 0,
      };
      vm.createContext(sandbox);
      vm.runInContext(js, sandbox);
      assert.strictEqual(sandbox[OPSV2 + "r"], 10);
    });
  });

  describe("break and continue (output shape)", () => {
    it("transpiles break and continue to JS", () => {
      const js = transpile("break\ncontinue\n");
      assert.ok(js.includes("break;"));
      assert.ok(js.includes("continue;"));
    });
  });

  describe("complex expressions – parsed and evaluated", () => {
    it("evaluates chained comparison-like logic", () => {
      const g = runPine("a=1\nb=2\nc=(a==1)and(b==2)\n");
      assert.strictEqual(g[OPSV2 + "c"], true);
    });

    it("evaluates nested ternary", () => {
      const g = runPine("x=1\ny=x==1?10:(x==2?20:30)\n");
      assert.strictEqual(g[OPSV2 + "y"], 10);
    });

    it("evaluates expression with subscript and arithmetic", () => {
      let js = transpile("arr=getArr()\ns=arr[0]+arr[1]*arr[2]\n").replace(/\blet\b/g, "var");
      const sandbox: Record<string, unknown> = { [OPSV2 + "getArr"]: () => [1, 2, 3] };
      vm.createContext(sandbox);
      vm.runInContext(js, sandbox);
      assert.strictEqual(sandbox[OPSV2 + "s"], 7);
    });
  });

  describe("fixture-based (load + transpile + evaluate when possible)", () => {
    it("transpiles and evaluates expr.pine", () => {
      const g = runPine(loadFixture("expr.pine"));
      assert.strictEqual(g[OPSV2 + "a"], 7);
    });

    it("transpiles and evaluates ternary.pine", () => {
      const g = runPine(loadFixture("ternary.pine"));
      assert.strictEqual(g[OPSV2 + "a"], 1);
      assert.strictEqual(g[OPSV2 + "b"], 2);
    });

    it("transpiles destructuring.pine and runs with mock pair/triple", () => {
      let js = transpile(loadFixture("destructuring.pine")).replace(/\blet\b/g, "var");
      const sandbox: Record<string, unknown> = {
        [OPSV2 + "pair"]: () => [1, 2],
        [OPSV2 + "triple"]: () => [3, 4, 5],
      };
      vm.createContext(sandbox);
      vm.runInContext(js, sandbox);
      assert.strictEqual(sandbox[OPSV2 + "a"], 1);
      assert.strictEqual(sandbox[OPSV2 + "b"], 2);
      assert.strictEqual(sandbox[OPSV2 + "x"], 3);
      assert.strictEqual(sandbox[OPSV2 + "y"], 4);
      assert.strictEqual(sandbox[OPSV2 + "z"], 5);
    });

    it("transpiles array_literal.pine and evaluates (foo() returns [1,2,3])", () => {
      const g = runPine(loadFixture("array_literal.pine"));
      assert.strictEqual(typeof g[OPSV2 + "foo"], "function");
      const result = (g[OPSV2 + "foo"] as () => number[])();
      assert.strictEqual(result[0], 1);
      assert.strictEqual(result[1], 2);
      assert.strictEqual(result[2], 3);
    });
  });
});
