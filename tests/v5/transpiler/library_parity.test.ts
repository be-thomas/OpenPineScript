/**
 * The scraped-library sweep's findings that apply at v5 — published v5
 * libraries compile on TradingView with each of these. The v6 set, with the
 * reasoning for each, is tests/v6/transpiler/library_parity.test.ts.
 */
import { describe, it, expect } from "vitest";
import { compileScript } from "../../../transpiler/common";
import { HEAD, value } from "../helpers";

describe("v5 grammar", () => {
  it("`type` and `method` are names outside a declaration", () => {
    expect(value(HEAD + 'string method = "zscore"\nx = method == "zscore" ? 1 : 0\n', "x")).toBe(1);
  });

  it("a method on a literal, and on a parenthesised value", () => {
    const src = HEAD + "method twice(string self) => self + self\n" +
      'a = "ab".twice()\nb = (bar_index >= 0 ? "x" : "y").twice()\nx = a + b\n';
    expect(value(src, "x")).toBe("ababxx");
  });

  it("`T[]` for a user type", () => {
    expect(value(HEAD + "type P\n    float v\nf(P[] ps) => ps.size()\nx = f(array.from(P.new(1), P.new(2)))\n", "x")).toBe(2);
  });

  it("a continuation line off the four-space grid", () => {
    expect(value(HEAD + "a = 2\nx = a\n     * 3\n", "x")).toBe(6);
  });
});

describe("v5 overloads, tuples and names", () => {
  it("one receiver may carry several declarations", () => {
    const src = HEAD + "type A\n    float v\nmethod add(A self, float x) => self.v + x\n" +
      "method add(A self, float x, float y) => self.v + x + y\na = A.new(1)\nx = a.add(1) + a.add(1, 1)\n";
    expect(value(src, "x")).toBe(5);
  });

  it("`[a, b] = if …`", () => {
    expect(value(HEAD + "[a, b] = if close > 0\n    [1, 2]\nelse\n    [3, 4]\nx = a + b\n", "x")).toBe(3);
  });

  it("a library may call strategy.* — no longer refused in a library", () => {
    expect(() => compileScript('//@version=5\nlibrary("L")\nexport f() => strategy.position_size\n')).not.toThrow();
  });

  it("an indicator still may not", () => {
    expect(() => compileScript(HEAD + "x = strategy.position_size\n")).toThrow(/unavailable in an indicator/);
  });
});
