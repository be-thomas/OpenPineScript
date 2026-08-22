/**
 * v5's two new control structures: `while` and `switch`.
 *
 * Both were listed as v4 additions in an early draft of the delta spec. Neither
 * is — see §3b — so the last row of each block below asserts that v4 rejects
 * them as SYNTAX, which is the only verdict that proves the keyword is absent
 * from v4's grammar rather than merely guarded in its emitter.
 */
import { describe, it, expect } from "vitest";
import { compileScript } from "../../../transpiler";
import { HEAD, build, series, value } from "../helpers";

describe("while", () => {
  it("runs until the condition goes false", () => {
    expect(value(HEAD + "i = 0\nwhile i < 5\n    i := i + 1\n", "i")).toBe(5);
  });

  it("re-evaluates its condition every pass, unlike `for`", () => {
    // The bound moves during the loop. A `for` snapshots it; a `while` must not.
    const src = HEAD + [
      "limit = 3",
      "i = 0",
      "while i < limit",
      "    i := i + 1",
      "    if i == 2",
      "        limit := 5",
    ].join("\n") + "\n";
    expect(value(src, "i")).toBe(5);
  });

  it("does not run at all when the condition starts false", () => {
    expect(value(HEAD + "i = 9\nwhile i < 5\n    i := i + 1\n", "i")).toBe(9);
  });

  it("supports break", () => {
    const src = HEAD + [
      "i = 0",
      "while true",
      "    i := i + 1",
      "    if i >= 4",
      "        break",
    ].join("\n") + "\n";
    expect(value(src, "i")).toBe(4);
  });

  it("supports continue", () => {
    const src = HEAD + [
      "i = 0",
      "odd = 0",
      "while i < 6",
      "    i := i + 1",
      "    if i % 2 == 0",
      "        continue",
      "    odd := odd + 1",
    ].join("\n") + "\n";
    expect(value(src, "odd")).toBe(3);
  });

  it("nests inside a for loop", () => {
    const src = HEAD + [
      "total = 0",
      "for k = 0 to 2",
      "    j = 0",
      "    while j < 3",
      "        j := j + 1",
      "        total := total + 1",
    ].join("\n") + "\n";
    expect(value(src, "total")).toBe(9);
  });

  it("works inside a user function", () => {
    const src = HEAD + [
      "countdown(n) =>",
      "    c = 0",
      "    while c < n",
      "        c := c + 1",
      "    c",
      "x = countdown(4)",
    ].join("\n") + "\n";
    expect(value(src, "x")).toBe(4);
  });

  it("carries state across bars like any other statement", () => {
    const src = HEAD + "var total = 0\ni = 0\nwhile i < 2\n    i := i + 1\n    total := total + 1\n";
    expect(series(src, "total", 3)).toEqual([2, 4, 6]);
  });

  it("a runaway loop is a diagnostic, not a hang", () => {
    // The engine bounds the iteration count. TradingView bounds execution TIME
    // and does not publish the budget, so this is not the same rule — it exists
    // so an author gets a message instead of a frozen host.
    const { ctx, exec } = build(HEAD + "i = 0\nwhile true\n    i := i + 0\n");
    ctx.setBar(0, 10, 12, 9, 11, 100);
    expect(() => exec()).toThrow(/while loop at @L\d+:C\d+ exceeded \d+ iterations/);
  });

  it("is not an expression — `x = while …` does not parse", () => {
    expect(() => compileScript(HEAD + "x = while close > open\n    1\n"))
      .toThrow(/parsing failed/);
  });

  it("v4 has no `while` at all — a SYNTAX error, not a guard", () => {
    const src = '//@version=4\nstudy("t")\ni = 0\nwhile i < 3\n    i := i + 1\n';
    expect(() => compileScript(src)).toThrow(/Pine Script v4: parsing failed/);
  });
});

describe("switch with a subject", () => {
  const SRC = (subject: string) => HEAD + [
    `sig = ${subject}`,
    "label = switch sig",
    "    1 => 10",
    "    2 => 20",
    "    => 99",
  ].join("\n") + "\n";

  it("takes the matching arm", () => {
    expect(value(SRC("1"), "label")).toBe(10);
    expect(value(SRC("2"), "label")).toBe(20);
  });

  it("falls through to the default", () => {
    expect(value(SRC("7"), "label")).toBe(99);
  });

  it("yields na when nothing matches and there is no default", () => {
    const src = HEAD + "sig = 7\nlabel = switch sig\n    1 => 10\n    2 => 20\n";
    expect(Number.isNaN(value(src, "label"))).toBe(true);
  });

  it("matches on strings", () => {
    const src = HEAD + [
      'mode = "fast"',
      "len = switch mode",
      '    "fast" => 5',
      '    "slow" => 50',
      "    => 20",
    ].join("\n") + "\n";
    expect(value(src, "len")).toBe(5);
  });

  it("compares against a SERIES subject", () => {
    const src = HEAD + [
      "dir = close > open ? 1 : -1",
      "word = switch dir",
      '    1 => "up"',
      '    -1 => "down"',
    ].join("\n") + "\n";
    expect(value(src, "word")).toBe("up");
  });

  it("evaluates the subject exactly once", () => {
    // `ta.sma` advances its own history per call site, so a subject evaluated
    // per arm would desynchronise it. Asserted through the emitted code, since
    // the effect is invisible on a single bar.
    const { js } = build(HEAD + "d = switch ta.sma(close, 3)\n    1 => 1\n    => 0\n");
    expect(js.match(/ta\.sma@/g)?.length).toBe(1);
  });

  it("accepts an indented block as an arm body", () => {
    const src = HEAD + [
      "sig = 1",
      "out = switch sig",
      "    1 =>",
      "        a = 3",
      "        a * 2",
      "    => 0",
    ].join("\n") + "\n";
    expect(value(src, "out")).toBe(6);
  });

  it("an arm whose body is a binding evaluates to the bound value", () => {
    const src = HEAD + "sig = 1\nout = switch sig\n    1 => v = 42\n    => 0\n";
    expect(value(src, "out")).toBe(42);
  });
});

describe("switch without a subject", () => {
  it("takes the first TRUE arm", () => {
    const src = HEAD + [
      "grade = switch",
      "    close > 100 => 3",
      "    close > 10 => 2",
      "    => 1",
    ].join("\n") + "\n";
    expect(value(src, "grade")).toBe(2);
  });

  it("falls through to the default when every arm is false", () => {
    const src = HEAD + [
      "grade = switch",
      "    close > 100 => 3",
      "    close > 50 => 2",
      "    => 1",
    ].join("\n") + "\n";
    expect(value(src, "grade")).toBe(1);
  });

  it("works as a statement, with its value discarded", () => {
    const src = HEAD + [
      "hits = 0",
      "switch",
      "    close > open => hits := 1",
      "    => hits := -1",
    ].join("\n") + "\n";
    expect(value(src, "hits")).toBe(1);
  });
});

describe("switch nests with the rest of the language", () => {
  it("inside a for loop", () => {
    const src = HEAD + [
      "total = 0",
      "for i = 0 to 3",
      "    step = switch i",
      "        0 => 1",
      "        1 => 10",
      "        => 100",
      "    total := total + step",
    ].join("\n") + "\n";
    expect(value(src, "total")).toBe(211);
  });

  it("is a whole assignment, not an operand — `a + switch …` does not parse", () => {
    // `switch` is an alternative of `arith_expr`, not of `add_expr`, so it
    // cannot appear part-way through an arithmetic expression. That mirrors
    // `if`, which has always had the same shape in this grammar.
    expect(() => compileScript(HEAD + "x = 1 + switch close\n    1 => 2\n"))
      .toThrow(/parsing failed/);
  });

  it("inside a statement-if inside a loop — the suppression boundary", () => {
    // A statement-`if` in a loop suppresses its blocks' trailing return. The
    // switch IIFE is a function boundary and must reset that, or its arms come
    // out valueless — the same defect that was fixed for nested if-expressions.
    const src = HEAD + [
      "acc = 0",
      "for i = 0 to 2",
      "    if close > open",
      "        v = switch i",
      "            0 => 1",
      "            => 2",
      "        acc := acc + v",
    ].join("\n") + "\n";
    expect(value(src, "acc")).toBe(5);
  });

  it("as a user function's return value", () => {
    const src = HEAD + [
      "pick(n) =>",
      "    switch n",
      "        1 => 100",
      "        => 0",
      "x = pick(1)",
    ].join("\n") + "\n";
    expect(value(src, "x")).toBe(100);
  });

  it("v4 has no `switch` at all — a SYNTAX error, not a guard", () => {
    const src = '//@version=4\nstudy("t")\nx = 1\nd = switch x\n    1 => 10\n';
    expect(() => compileScript(src)).toThrow(/Pine Script v4: parsing failed/);
  });
});
