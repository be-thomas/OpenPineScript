/**
 * The type errors TradingView raises at compile time, from the probes in
 * dev-docs/tv-parity/_probes/types/ (one error per file, checked per version):
 *
 *   A1  a float assigned (`:=`) to a variable declared `int`
 *   A2  a float used to initialise an `int` declaration
 *   B1  `x = na` — an untyped declaration initialised with na (v1–v3 accept it)
 *   B2  `var float a = na, b = na` — the keyword covers `a`, so `b = na` is untyped
 *   C   a float where `ta.sma`'s `length` (a series int) is required
 *   D   a float x coordinate on label.new / line.new / box.new (a series int),
 *       from dev-docs/tv-parity/_probes/version-scope/v4-draw-float-x (v4 chart
 *       run) and the v5/v6 compile endpoints, 2026-11-12
 *
 * The allowed counterparts matter as much: the checks fire only where the
 * expression is PROVABLY a float.
 */
import { describe, it, expect } from "vitest";
import { compileScript } from "../../../transpiler/common";

const head = (v: number) => (v === 4 ? "study" : "indicator");
const script = (v: number, body: string) => `//@version=${v}\n${head(v)}("p")\n${body}\nplot(close)\n`;
const abs = (v: number) => (v === 4 ? "abs" : "math.abs");
const sma = (v: number) => (v === 4 ? "sma" : "ta.sma");

describe.each([4, 5, 6])("v%i", (v) => {
  it("A1: a float assigned to a declared int is refused", () => {
    const msg = v === 4 ? /Variable 'q' was declared with 'integer' type/
      : v === 5 ? /Cannot assign a value of the `float` type to the 'q' variable/
      : /Cannot assign a value of the "float" type to the "q" variable/;
    expect(() => compileScript(script(v, `var int q = 0\nq := ${abs(v)}(close)`))).toThrow(msg);
  });

  it("A2: a float initialising a declared int is refused", () => {
    expect(() => compileScript(script(v, "int q = close"))).toThrow(/'q'|"q"/);
  });

  it("B1: `x = na` is refused", () => {
    expect(() => compileScript(script(v, "x = na")))
      .toThrow(/Value with NA type cannot be assigned to a variable that was defined without type keyword/);
  });

  it("B2: the second name of `var float a = na, b = na` is refused", () => {
    expect(() => compileScript(script(v, "var float a = na, b = na")))
      .toThrow(/Value with NA type cannot be assigned to a variable that was defined without type keyword/);
  });

  it("C: a float length is refused, an int one is not", () => {
    const err = v === 4
      ? /Cannot call 'sma' with 'length'=float/
      : /Cannot call 'ta\.sma' with argument 'length'=.*'series int' is expected/;
    expect(() => compileScript(script(v, `len = input(200)\ny = ${sma(v)}(close, len*1.2)`))).toThrow(err);
    expect(() => compileScript(script(v, `y = ${sma(v)}(close, 14)`))).not.toThrow();
    expect(() => compileScript(script(v, `len = input(200)\ny = ${sma(v)}(close, int(len*1.2))`))).not.toThrow();
  });

  it("D: a float drawing x coordinate is refused, an int one is not", () => {
    const err = (what: string, name: string) => v === 4
      ? new RegExp(`Cannot call '${what}' with '${name}'=series\\[float\\]`)
      : new RegExp(`Cannot call '${what}' with argument '${name}'='call 'operator -' \\(series float\\)'.*'series float'.*'series int'`);
    expect(() => compileScript(script(v, `label.new(bar_index - 10.7, low, "a")`))).toThrow(err("label.new", "x"));
    expect(() => compileScript(script(v, `line.new(bar_index - 20.5, low, bar_index - 5, high)`))).toThrow(err("line.new", "x1"));
    expect(() => compileScript(script(v, `line.new(bar_index - 20, low, bar_index - 5.2, high)`))).toThrow(err("line.new", "x2"));
    expect(() => compileScript(script(v, `box.new(bar_index - 30, high, bar_index - 25.1, low)`))).toThrow(err("box.new", "right"));
    expect(() => compileScript(script(v, `label.new(bar_index - 10, low, "a")`))).not.toThrow();
    expect(() => compileScript(script(v, `w = 5\nlabel.new(bar_index + w / 2, low, "b")`))).not.toThrow();
    if (v !== 4) {
      expect(() => compileScript(script(v, `line.new(chart.point.now(high), chart.point.now(low))`))).not.toThrow();
    }
  });

  it("allowed counterparts compile", () => {
    for (const body of [
      "var int q = 0",
      `var int q = 0\nq := int(${abs(v)}(close))`,
      `var int q = 0\nq := ${v === 4 ? "round" : "math.round"}(close)`,
      "float x = na",
      "var x = 0.0",
      "int n = 5\nn := n + 1",
    ]) {
      expect(() => compileScript(script(v, body)), body).not.toThrow();
    }
  });
});

describe("v1-v3", () => {
  it.each([1, 2, 3])("B1: `x = na` still compiles at v%i", (v) => {
    expect(() => compileScript(`//@version=${v}\nstudy("p")\nx = na\nplot(close)\n`)).not.toThrow();
  });
});
