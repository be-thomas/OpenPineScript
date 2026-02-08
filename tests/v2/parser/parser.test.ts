/**
 * Parser v2 tests (ANTLR lexer + parser). Run from repo root: npm test.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import * as path from "node:path";
import * as fs from "node:fs";
import { PineScriptParser } from "../../../parser/v2/generated/PineScriptParser";
import { parse } from "../../../parser/v2";

const FIXTURES_DIR = path.join(__dirname, "fixtures");

function loadFixture(name: string): string {
  const p = path.join(FIXTURES_DIR, name.endsWith(".pine") ? name : `${name}.pine`);
  return fs.readFileSync(p, "utf-8");
}

describe("parser v2 (ANTLR)", () => {
  describe("var_def and expressions", () => {
    it("parses var_def.pine (x=1)", () => {
      const { tree, errorCount } = parse(loadFixture("var_def.pine"));
      assert.ok(tree);
      assert.strictEqual(errorCount, 0);
      assert.ok(tree.getChildCount() >= 1);
    });

    it("parses expr.pine (a=1+2*3)", () => {
      const { tree, errorCount } = parse(loadFixture("expr.pine"));
      assert.ok(tree);
      assert.strictEqual(errorCount, 0);
    });

    it("parses precedence.pine: add/mul, and/or, eq/neq, unary minus, not", () => {
      const { tree, errorCount } = parse(loadFixture("precedence.pine"));
      assert.ok(tree);
      assert.strictEqual(errorCount, 0);
    });

    it("parses inline x=1 without errors", () => {
      const { tree, errorCount } = parse("x=1\n");
      assert.ok(tree);
      assert.strictEqual(errorCount, 0);
    });

    it("parses multiple statements (a=1\\n b=2)", () => {
      const { tree, errorCount } = parse("a=1\nb=2\n");
      assert.ok(tree);
      assert.strictEqual(errorCount, 0);
      assert.ok(tree.getChildCount() >= 2);
    });
  });

  describe("function calls", () => {
    it("parses call.pine f(1,2)", () => {
      const { tree, errorCount } = parse(loadFixture("call.pine"));
      assert.ok(tree);
      assert.strictEqual(errorCount, 0);
    });

    it("parses call_kw_args.pine: keyword args and mixed pos+kw", () => {
      const { tree, errorCount } = parse(loadFixture("call_kw_args.pine"));
      assert.ok(tree);
      assert.strictEqual(errorCount, 0);
    });

    it("parses subscript_call.pine: arr[0], foo(1)[0]", () => {
      const { tree, errorCount } = parse(loadFixture("subscript_call.pine"));
      assert.ok(tree);
      assert.strictEqual(errorCount, 0);
    });
  });

  describe("ternary", () => {
    it("parses ternary.pine (a==1?2:3)", () => {
      const { tree, errorCount } = parse(loadFixture("ternary.pine"));
      assert.ok(tree);
      assert.strictEqual(errorCount, 0);
    });
  });

  describe("destructuring and arrays", () => {
    it("parses destructuring.pine [a,b]=pair(), [x,y,z]=triple(...)", () => {
      const { tree, errorCount } = parse(loadFixture("destructuring.pine"));
      assert.ok(tree);
      assert.strictEqual(errorCount, 0);
    });

    it("parses array_literal.pine: function bodies with arith_exprs [1,2,3] and [a,b,c]", () => {
      const { tree, errorCount } = parse(loadFixture("array_literal.pine"));
      assert.ok(tree);
      assert.strictEqual(errorCount, 0);
    });
  });

  describe("comma-separated statements", () => {
    it("parses comma_stmts.pine (a=1,b=2,c=3)", () => {
      const { tree, errorCount } = parse(loadFixture("comma_stmts.pine"));
      assert.ok(tree);
      assert.strictEqual(errorCount, 0);
      assert.ok(tree.getChildCount() >= 1);
    });
  });

  describe("function definitions", () => {
    it("parses func_singleline.pine (double(x)=>x*2)", () => {
      const { tree, errorCount } = parse(loadFixture("func_singleline.pine"));
      assert.ok(tree);
      assert.strictEqual(errorCount, 0);
    });

    // ANTLR lexer does not emit BEGIN/END for indentation; grammar expects <BEGIN>/<END>
    it("parses func_multiline.pine (add(a,b)=> body)", () => {
      const { tree, errorCount } = parse(loadFixture("func_multiline.pine"));
      assert.ok(tree);
      assert.strictEqual(errorCount, 0);
    });
  });

  describe("control flow (if, for)", () => {
    // ANTLR lexer does not emit BEGIN/END for indentation
    it("parses if_then.pine", () => {
      const { tree, errorCount } = parse(loadFixture("if_then.pine"));
      assert.ok(tree);
      assert.strictEqual(errorCount, 0);
    });

    it("parses for_loop.pine", () => {
      const { tree, errorCount } = parse(loadFixture("for_loop.pine"));
      assert.ok(tree);
      assert.strictEqual(errorCount, 0);
    });

    it("parses for_loop_by.pine", () => {
      const { tree, errorCount } = parse(loadFixture("for_loop_by.pine"));
      assert.ok(tree);
      assert.strictEqual(errorCount, 0);
    });

    it("parses break_continue.pine", () => {
      const { tree, errorCount } = parse(loadFixture("break_continue.pine"));
      console.error("tree: ", tree);
      assert.ok(tree);
      assert.strictEqual(errorCount, 0);
    });
  });
});
