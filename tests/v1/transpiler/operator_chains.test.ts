/**
 * Flat operator chains, and the lexer's continuation rules.
 *
 * These are v1 tests because both defects are v1's: they were found while
 * building v5 and they were present in every version.
 *
 * ── The operator bug ────────────────────────────────────────────────────────
 *
 * `a * b / c` emitted `(a * b) % c`. The emitter picked each operator with
 * `ctx.MUL(i - 1) ? "*" : ctx.DIV(i - 1) ? "/" : "%"`, which indexes the list
 * of MUL tokens rather than the position in the expression — so for the second
 * operator in a mixed chain it found neither and fell through to MODULO.
 *
 * Silent, and wrong for most mixed chains. Any indicator written as
 * `(a - b) * 100 / c` — which is how percentage oscillators are always written
 * — produced a modulo.
 */
import { describe, it, expect } from "vitest";
import { transpile } from "../../../transpiler/common";
import { compileScript } from "../../../transpiler/common";

/** Declarations for the operand names the chains below use. */
const DECLS = "a = 3.0\nb = 5.0\nc = 7.0\n";
import { compile, Context } from "../../../runtime/v1";

/** Evaluates a v1 expression over one bar. */
function evaluate(expr: string): number {
  // The operands are DECLARED, not conjured. A bare `a * b / c` names nothing,
  // which `Undeclared identifier` now rejects before the operators are reached
  // — the point of this test is the operator positions, not the scope rule.
  const { js, profile } = compileScript(`a = 3.0\nb = 5.0\nc = 7.0\nd = 11.0\nx = ${expr}\n`);
  const ctx = new Context(profile);
  const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
  ctx.setBar(0, 10, 12, 9, 11, 100);
  exec();
  return ctx.vars.get("opsv2_x")?.valueOf();
}

describe("mixed multiplicative chains", () => {
  it("a * b / c divides — it does not take a modulo", () => {
    expect(evaluate("12 * 5 / 4")).toBe(15);
  });

  it("a / b * c keeps left-to-right order", () => {
    expect(evaluate("12 / 4 * 5")).toBe(15);
  });

  it("modulo still works where it is written", () => {
    expect(evaluate("13 % 5 * 2")).toBe(6);
    expect(evaluate("12 * 5 % 7")).toBe(4);
  });

  it("four operands, all three operators", () => {
    expect(evaluate("100 / 4 * 3 % 7")).toBe(5); // ((100/4)*3) % 7 = 75 % 7
  });

  it("the emitted operator matches the written one, position by position", () => {
    expect(transpile(DECLS + "x = a * b / c\n")).toContain("(opsv2_a * opsv2_b) / opsv2_c");
    expect(transpile(DECLS + "x = a / b * c\n")).toContain("(opsv2_a / opsv2_b) * opsv2_c");
  });
});

describe("mixed comparison chains", () => {
  // Rare in real scripts, but broken the same way and for the same reason.
  it("a > b < c keeps each operator", () => {
    expect(transpile(DECLS + "x = a > b < c\n")).toContain("(opsv2_a > opsv2_b) < opsv2_c");
  });

  it("a != b == c keeps each operator", () => {
    expect(transpile(DECLS + "x = a != b == c\n")).toContain("(opsv2_a != opsv2_b) == opsv2_c");
  });
});

describe("a continuation line that BEGINS with an operator", () => {
  // Pine allows the break either side of a binary operator. The token source
  // recognised a continuation only from the PREVIOUS line's last token, so a
  // line starting with `+` was read as the first statement of an indented
  // block — which is a syntax error. Every generated golden harness hit it.
  it("+ continues the previous line", () => {
    expect(evaluate("1\n      + 2\n      + 3")).toBe(6);
  });

  it("- continues the previous line", () => {
    expect(evaluate("10\n      - 3")).toBe(7);
  });

  it("* and % continue too", () => {
    expect(evaluate("10\n      * 3")).toBe(30);
    expect(evaluate("10\n      % 3")).toBe(1);
  });

  it("a trailing operator still continues, as it always did", () => {
    expect(evaluate("1 +\n      2")).toBe(3);
  });
});

describe("...without swallowing an indented BLOCK", () => {
  // The discriminator is whether the previous logical line opened a block. Both
  // shapes are an indent after a line ending in a complete expression, so
  // nothing about that line's last token separates them.
  it("a function body may start with a unary minus", () => {
    const { js } = compileScript("f(x) =>\n    -x\nplot(f(close))\n");
    expect(js).toContain("return -opsv2_x");
  });

  it("an if-EXPRESSION branch may start with a unary minus", () => {
    expect(evaluate("if close > open\n    -1\nelse\n    -2")).toBe(-1);
  });

  it("a for body may start with one", () => {
    expect(() => compileScript("s = 0.0\nfor i = 0 to 2\n    -1\nplot(s)\n")).not.toThrow();
  });

  it("a statement-if body may start with one", () => {
    expect(() => compileScript("if close > open\n    -1\nplot(close)\n")).not.toThrow();
  });
});

describe("a user function may share a name with a built-in CONSTANT", () => {
  // Pine keeps functions and variables in separate namespaces. `area` is a
  // v1-v3 plot-style constant, and `area(x) => x * 2` is legal — but the
  // emitter resolved the call to the constant and the runtime reported "the
  // provided reference is not a function".
  it("area(x) => … is callable", () => {
    const { js, profile } = compileScript("area(x) => x * 2\nv = area(3)\n");
    const ctx = new Context(profile);
    const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
    ctx.setBar(0, 10, 12, 9, 11, 100);
    exec();
    expect(ctx.vars.get("opsv2_v")?.valueOf()).toBe(6);
  });

  it("the call id carries the function marker, so the registry cannot claim it", () => {
    expect(transpile("area(x) => x * 2\nv = area(3)\n")).toContain('"opsv2_$fn_area@');
  });
});
