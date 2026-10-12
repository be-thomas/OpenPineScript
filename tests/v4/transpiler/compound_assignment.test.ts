/**
 * v4 compound assignment — `+= -= *= /= %=`.
 *
 * SOURCING. From the TradingView v4 release notes, March 2021:
 *
 *   "New assignment operators were added: `+=` - addition assignment,
 *    `-=` - subtraction assignment, `*=` - multiplication assignment,
 *    `/=` - division assignment, `%=` - modulus assignment"
 *
 * and from the Operators page of the manual:
 *
 *   "A compound assignment operator combines an arithmetic operator with the
 *    reassignment operator."
 *
 * That second quote is the specification these tests enforce. `x += y` must be
 * indistinguishable from `x := x + y`, INCLUDING the parts of `+` that are not
 * JavaScript's `+`: `na` propagation and string concatenation. An emitter that
 * reached for a raw JS operator would pass a numeric smoke test and then differ
 * from TradingView on exactly the inputs nobody writes a test for.
 *
 * These are runtime tests. Asserting the emitted text contains "safe_add"
 * proves a string was assembled; the claim is about what the value IS.
 */
import { describe, it, expect } from "vitest";
import { transpile, compileScript } from "../../../transpiler/common";
import { compile, Context } from "../../../runtime/v4";

function build(pine: string) {
  const { js, profile } = compileScript(pine);
  const ctx = new Context(profile);
  const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
  return { ctx, exec };
}

/** Runs `closes` as one committed bar each and returns the final value of `name`. */
function run(pine: string, closes: number[], name: string): any {
  const { ctx, exec } = build(pine);
  closes.forEach((c, i) => {
    ctx.setBar(i, c, c, c, c, 1);
    exec();
    ctx.finalizeBar();
  });
  return ctx.vars.get("opsv2_" + name)?.valueOf();
}

const HEAD = '//@version=4\nstudy("t")\n';

describe("the five operators compute what the manual says they compute", () => {
  const cases: Array<[string, string, number]> = [
    ["+=", "+=  4", 14],
    ["-=", "-=  4", 6],
    ["*=", "*=  4", 40],
    ["/=", "/=  4", 2.5],
    ["%=", "%=  4", 2],
  ];

  for (const [name, tail, expected] of cases) {
    it(`x ${name} 4, starting from 10, gives ${expected}`, () => {
      expect(run(HEAD + `x = 10.0\nx ${tail}\n`, [1], "x")).toBe(expected);
    });
  }
});

describe("x op= y is exactly x := x op y", () => {
  /**
   * The equivalence is the whole definition, so it is tested as an
   * equivalence: every case runs BOTH spellings and compares.
   */
  const bodies = [
    "x += close",
    "x -= close",
    "x *= 2",
    "x /= 3",
    "x %= 7",
    "x += close > open ? 2 : 3",   // a ternary right-hand side
    "x *= close > 0 or open > 0 ? 2 : 1",
  ];

  for (const body of bodies) {
    it(`'${body}' matches its ':=' longhand`, () => {
      const [target, op] = [body.slice(0, 1), body.slice(2, 3)];
      const rhs = body.slice(4);
      const short = HEAD + `x = 10.0\n${body}\n`;
      const long = HEAD + `x = 10.0\n${target} := ${target} ${op} (${rhs})\n`;
      expect(run(short, [1, 2, 3], "x")).toBe(run(long, [1, 2, 3], "x"));
    });
  }
});

describe("+= is Pine's +, not JavaScript's", () => {
  it("concatenates strings", () => {
    const src = HEAD + 's = "a"\ns += "b"\ns += "c"\n';
    expect(run(src, [1], "s")).toBe("abc");
  });

  it("propagates na, rather than coercing it to 0 or NaN-by-accident", () => {
    // `na + 1` is `na` in Pine. A raw JS `+` would give NaN here too, so the
    // test that discriminates is the one below.
    const src = HEAD + "x = na\nx += 1\n";
    expect(Number.isNaN(run(src, [1], "x"))).toBe(true);
  });

  it("na on the RIGHT also propagates", () => {
    const src = HEAD + "x = 5.0\nx += na\n";
    expect(Number.isNaN(run(src, [1], "x"))).toBe(true);
  });
});

describe("precedence — the right-hand side is evaluated whole", () => {
  it("x *= a + b multiplies by the SUM, not by a alone", () => {
    // Emitting `x * a + b` instead of `x * (a + b)` is the classic compound-
    // assignment bug: it is silent, and off by exactly `b`.
    expect(run(HEAD + "x = 2.0\nx *= 3 + 4\n", [1], "x")).toBe(14);
  });

  it("x -= a - b subtracts the DIFFERENCE", () => {
    expect(run(HEAD + "x = 10.0\nx -= 4 - 1\n", [1], "x")).toBe(7);
  });

  it("a logical right-hand side is not split by the operator", () => {
    // `visitOr_expr` emits `a || b` with no brackets of its own, so this is
    // where an unparenthesised value would bind wrongly.
    expect(run(HEAD + "x = 5.0\nx *= (close > 0 or open > 0) ? 2 : 1\n", [1], "x")).toBe(10);
  });
});

describe("it accumulates across bars, and inside loops", () => {
  it("var + '+=' is the running-total idiom from the manual", () => {
    const src = HEAD + "var count = 0.0\ncount += 1\n";
    expect(run(src, [1, 2, 3, 4, 5], "count")).toBe(5);
  });

  it("without var it resets every bar", () => {
    expect(run(HEAD + "count = 0.0\ncount += 1\n", [1, 2, 3], "count")).toBe(1);
  });

  it("works in a loop body, where the `if` emitter drops its IIFE", () => {
    const src = HEAD + "s = 0.0\nfor i = 0 to 4\n    s += i\n";
    expect(run(src, [1], "s")).toBe(0 + 1 + 2 + 3 + 4);
  });

  it("works inside an `if` inside a loop", () => {
    const src = HEAD + "s = 0.0\nfor i = 0 to 4\n    if i > 2\n        s += i\n";
    expect(run(src, [1], "s")).toBe(3 + 4);
  });

  it("works in a function body", () => {
    const src = HEAD + "f(n) =>\n    t = 0.0\n    for i = 0 to n\n        t += i\n    t\nout = f(3)\n";
    expect(run(src, [1], "out")).toBe(6);
  });
});

describe("the target must already be declared", () => {
  it("rejects a compound assignment to an unknown name", () => {
    expect(() => transpile(HEAD + "q += 1\n")).toThrow(/'q' is not declared/);
  });

  it("names the operator the script actually used, not ':='", () => {
    // Reporting ':=' for a `*=` sends the reader looking for a line that is
    // not in the file.
    expect(() => transpile(HEAD + "q *= 1\n")).toThrow(/cannot be assigned with '\*='/);
  });
});

describe("it is a v4 addition — v1–v3 must reject it as SYNTAX", () => {
  for (const version of [1, 2, 3]) {
    it(`v${version} does not know '+='`, () => {
      const head = version === 1 ? 'study("t")\n' : `//@version=${version}\nstudy("t")\n`;
      // A parse failure, not a guard: the token does not exist before v4, so
      // `x += 1` lexes as `x + = 1` and cannot be a statement.
      expect(() => transpile(head + "x = 1.0\nx += 1\n")).toThrow(/parsing failed/);
    });
  }

  it("v5 inherits it", () => {
    const src = '//@version=5\nindicator("t")\nvar float x = 0.0\nx += 2\n';
    expect(transpile(src)).toContain("opsv2_safe_add");
  });
});
