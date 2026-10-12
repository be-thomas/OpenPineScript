/**
 * v4 `else if`.
 *
 * SOURCING. From the TradingView v4 release notes, May 2020:
 *
 *   "`else if` statement was added"
 *
 * and the shape, from the manual's Conditional structures page:
 *
 *   "if <expression> <local_block> {else if <expression> <local_block>}
 *    [else <local_block>]"
 *
 * ── Why these are runtime tests ─────────────────────────────────────────────
 *
 * The failure mode `else if` invites is invisible to an emit-shape assertion.
 * A nested `if` visited as an ordinary expression gets its OWN IIFE, so
 *
 *     x = if a
 *             1
 *         else if b
 *             2
 *
 * emits `(() => { if (a) { return 1; } else (() => { … })(); })()` — perfectly
 * valid JavaScript that computes 2 and discards it. The generated text contains
 * every `else if` you would grep for; only the VALUE is wrong. So every test
 * below runs bars and reads the variable.
 */
import { describe, it, expect } from "vitest";
import { transpile, compileScript } from "../../../transpiler/common";
import { compile, Context } from "../../../runtime/v4";

/** Runs one bar with the given close (high is fixed at 5) and reads `name`. */
function run(pine: string, name: string, closes: number[]): any {
  const { js, profile } = compileScript(pine);
  const ctx = new Context(profile);
  const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
  closes.forEach((c, i) => {
    ctx.setBar(i, c, 5, c, c, 1);
    exec();
    ctx.finalizeBar();
  });
  return ctx.vars.get("opsv2_" + name)?.valueOf();
}

const HEAD = '//@version=4\nstudy("t")\n';

/** A three-arm chain over `close`, as an EXPRESSION bound to `x`. */
const EXPRESSION_CHAIN = HEAD +
  "x = if close > 5\n" +
  "    1\n" +
  "else if close > 4\n" +
  "    2\n" +
  "else if close > 3\n" +
  "    3\n" +
  "else\n" +
  "    4\n";

describe("as an expression, each arm yields its own value", () => {
  const cases: Array<[number, number]> = [[7, 1], [4.5, 2], [3.5, 3], [1, 4]];
  for (const [close, expected] of cases) {
    it(`close=${close} takes the arm returning ${expected}`, () => {
      expect(run(EXPRESSION_CHAIN, "x", [close])).toBe(expected);
    });
  }
});

describe("as a statement, each arm runs its own block", () => {
  const chain = HEAD +
    "x = 0.0\n" +
    "if close > 5\n" +
    "    x := 1\n" +
    "else if close > 4\n" +
    "    x := 2\n" +
    "else\n" +
    "    x := 3\n";

  const cases: Array<[number, number]> = [[7, 1], [4.5, 2], [1, 3]];
  for (const [close, expected] of cases) {
    it(`close=${close} assigns ${expected}`, () => {
      expect(run(chain, "x", [close])).toBe(expected);
    });
  }
});

describe("only ONE arm runs", () => {
  it("a later arm whose condition is also true is skipped", () => {
    // Both conditions hold at close=7. If the chain were emitted as separate
    // `if`s rather than one else-chain, the counter would reach 2.
    const src = HEAD +
      "var n = 0.0\n" +
      "if close > 5\n" +
      "    n += 1\n" +
      "else if close > 1\n" +
      "    n += 1\n";
    expect(run(src, "n", [7, 7, 7])).toBe(3);
  });
});

describe("a chain with no trailing else", () => {
  it("is na when nothing matches", () => {
    // "The value assigned to the variable is the return value of the
    //  <local_block>, or `na` if no local block is executed."
    const src = HEAD + "x = if close > 100\n    1\nelse if close > 50\n    2\n";
    expect(Number.isNaN(run(src, "x", [7]))).toBe(true);
  });

  it("still yields the matching arm when one does match", () => {
    const src = HEAD + "x = if close > 100\n    1\nelse if close > 5\n    2\n";
    expect(run(src, "x", [7])).toBe(2);
  });
});

describe("inside a loop, where the emitter drops the IIFE", () => {
  it("break still crosses the chain", () => {
    // The IIFE is what made `break` illegal here; a statement-position `if`
    // inside a loop emits a plain `if`, and the chain must keep that.
    const src = HEAD +
      "found = -1.0\n" +
      "for i = 0 to 9\n" +
      "    if i < 3\n" +
      "        found := -1\n" +
      "    else if i == 5\n" +
      "        found := i\n" +
      "        break\n";
    expect(run(src, "found", [1])).toBe(5);
  });

  it("accumulates per iteration", () => {
    const src = HEAD +
      "s = 0.0\n" +
      "for i = 0 to 3\n" +
      "    if i == 0\n" +
      "        s += 100\n" +
      "    else if i == 1\n" +
      "        s += 10\n" +
      "    else\n" +
      "        s += 1\n";
    expect(run(src, "s", [1])).toBe(100 + 10 + 1 + 1);
  });
});

describe("nesting", () => {
  it("an else-if chain nested inside an arm of another one", () => {
    const src = HEAD +
      "x = if close > 5\n" +
      "    if close > 6\n" +
      "        10\n" +
      "    else if close > 5.5\n" +
      "        11\n" +
      "    else\n" +
      "        12\n" +
      "else if close > 2\n" +
      "    20\n" +
      "else\n" +
      "    30\n";
    expect(run(src, "x", [7])).toBe(10);
    expect(run(src, "x", [5.7])).toBe(11);
    expect(run(src, "x", [5.2])).toBe(12);
    expect(run(src, "x", [3])).toBe(20);
    expect(run(src, "x", [1])).toBe(30);
  });

  it("works in a function body", () => {
    const src = HEAD +
      "grade(v) =>\n" +
      "    if v > 90\n" +
      "        1\n" +
      "    else if v > 80\n" +
      "        2\n" +
      "    else\n" +
      "        3\n" +
      "out = grade(85)\n";
    expect(run(src, "out", [1])).toBe(2);
  });
});

describe("it is a v4 addition — v1–v3 must reject it as SYNTAX", () => {
  for (const version of [1, 2, 3]) {
    it(`v${version} does not accept 'else if'`, () => {
      const head = version === 1 ? 'study("t")\n' : `//@version=${version}\nstudy("t")\n`;
      const src = head + "x = 0.0\nif close > 5\n    x := 1\nelse if close > 1\n    x := 2\n";
      expect(() => transpile(src)).toThrow(/parsing failed/);
    });
  }

  it("v5 inherits it", () => {
    const src = '//@version=5\nindicator("t")\n' +
      "x = if close > 5\n    1\nelse if close > 1\n    2\nelse\n    3\n";
    expect(transpile(src)).toMatch(/else if \(ctx\.truthy/);
  });
});
