/**
 * Regressions from the review of PR #6, one block per finding, each written
 * the way the reviewer reproduced it.
 */
import { describe, it, expect } from "vitest";
import { compileScript } from "../../../transpiler/common";
import { Session } from "../../../runtime/v1";
import { HEAD, value, series } from "../helpers";

const H6 = '//@version=6\nindicator("t")\n';
const value6 = (src: string, name: string) => value(src, name);

describe("break/continue in a switch inside a while", () => {
  it("leaves the while", () => {
    expect(value(HEAD + "i = 0\nwhile i < 5\n    i += 1\n    switch i\n        3 => break\nx = i\n", "x")).toBe(3);
  });

  it("leaves the while, not the for around it", () => {
    const src = HEAD + "t = 0\nfor k = 0 to 2\n    i = 0\n    while i < 5\n        i += 1\n" +
      "        switch i\n            3 => break\n    t += i\nx = t\n";
    expect(value(src, "x")).toBe(9);
  });

  it("continue skips the rest of the while body", () => {
    const src = HEAD + "i = 0\nn = 0\nwhile i < 5\n    i += 1\n    switch i\n        2 => continue\n    n += 1\nx = n\n";
    expect(value(src, "x")).toBe(4);
  });
});

describe("an int/float choice the source does not settle takes float", () => {
  // A whole-number float looks like an int at run time, so the dispatcher
  // must not pick by value: `close` of 11.0 reached the `int` body. Refusing
  // instead broke published libraries TradingView compiles (an untyped
  // parameter, a `for … in` item), and float is the sound default: Pine
  // widens any int to float, never the reverse.
  // The helper's bar closes at 11: a whole number.
  const bars = (src: string) => series(src, "x", 1);

  it("a function argument returned by a call", () => {
    expect(bars(HEAD + 'g(int x) => "int"\ng(float x) => "float"\nf() => close\nx = g(f())\n')).toEqual(["float"]);
  });

  it("a method receiver returned by a call", () => {
    expect(bars(HEAD + 'method tag(int self) => "int"\nmethod tag(float self) => "float"\nf() => close\nx = f().tag()\n')).toEqual(["float"]);
  });

  it("through the run-time dispatcher, beside a string overload", () => {
    const src = HEAD + 'k(int v) => "int"\nk(float v) => "float"\nk(string v) => "string"\n' +
      'f() => close\ns() => "a"\nx = k(f()) + k(s())\n';
    expect(bars(src)).toEqual(["floatstring"]);
  });

  it("but never the overload whose own body makes the call", () => {
    const src = HEAD + 'g(int n) => n * 10\ng(float x) => g(math.ceil(x))\nx = g(close + 0.5)\n';
    expect(value(src, "x")).toBe(120);
  });

  it("a type the source states still picks int", () => {
    expect(value(HEAD + 'g(int x) => "int"\ng(float x) => "float"\nx = g(7)\n', "x")).toBe("int");
  });

  it("and float", () => {
    expect(value(HEAD + 'g(int x) => "int"\ng(float x) => "float"\nx = g(close)\n', "x")).toBe("float");
  });
});

describe("a comparison or ternary is not a float", () => {
  it("`close > open` is a bool receiver", () => {
    const src = HEAD + 'method tag(bool self) => "b"\nmethod tag(string self) => "s"\ny = close > open\nx = y.tag()\n';
    expect(value(src, "x")).toBe("b");
  });

  it("`close > open ? 1 : 0` does not take the float overload", () => {
    const src = HEAD + 'method tag(int self) => "i"\nmethod tag(string self) => "s"\ny = close > open ? 1 : 0\nx = y.tag()\n';
    expect(value(src, "x")).toBe("i");
  });
});

describe("the built-in fallback compares element types", () => {
  it("array<string>.set is the built-in when set is declared for array<float>", () => {
    const src = HEAD + "method set(array<float> a, int i, float x) =>\n    a.unshift(x)\n" +
      'array<string> s = array.new<string>(2, "a")\ns.set(0, "z")\nx = s.size()\n';
    expect(value(src, "x")).toBe(2);
  });

  it("matrix<int> still reaches a method declared on matrix<float>", () => {
    const src = HEAD + "method total(matrix<float> m) => m.elements_count()\nmethod total(array<float> a) => a.sum()\n" +
      "m = matrix.new<int>(2, 2, 1)\nx = m.total()\n";
    expect(value(src, "x")).toBe(4);
  });
});

describe("a local or parameter hides a global of its name", () => {
  it("an untyped local", () => {
    const src = HEAD + 'method tag(int self) => "i"\nmethod tag(string self) => "s"\nint v = 1\n' +
      "f() =>\n    v = str.tostring(close)\n    v.tag()\nx = f()\n";
    expect(value(src, "x")).toBe("s");
  });

  it("an untyped parameter", () => {
    const src = HEAD + "type A\n    float v\ntype B\n    float v\n" +
      'method get(A self) => "A"\nmethod get(B self) => "B"\nobj = A.new(0)\nf(obj) => obj.get()\nx = f(B.new(0))\n';
    expect(value(src, "x")).toBe("B");
  });
});

describe("two-space indentation", () => {
  // TradingView reads a line indented by a non-multiple of four as a wrapped
  // line, not a body: `type P\n  float v` is "Mismatched input 'float'
  // expecting 'end of line without line continuation'" (compile endpoint,
  // 2026-11-12; see tests/v5/transpiler/line_continuation_tv.test.ts).
  it("a type body indented by two is not a body", () => {
    expect(() => value(HEAD + "type P\n  float v\np = P.new(3)\nx = p.v\n", "x")).toThrow();
  });

  it("an enum body likewise", () => {
    expect(() => value(HEAD + "enum E\n  a\n  b\nx = E.b == E.b ? 1 : 0\n", "x")).toThrow();
  });

  it("`type` as a name may still wrap", () => {
    expect(value(HEAD + "type = 5\nx = type\n   + 1\n", "x")).toBe(6);
  });
});

describe("recursion through an overloaded name", () => {
  it("a call only this overload can take is recursion", () => {
    expect(() => compileScript(HEAD + "f(int x) => f(x)\nf(float x, int y) => 1.0\nx = f(1)\n"))
      .toThrow(/recursion is not allowed/);
  });

  it("a call to a sibling is not", () => {
    expect(() => compileScript(HEAD + "f(int x) => f(x, 1)\nf(float x, int y) => 1.0\nx = f(1)\n")).not.toThrow();
  });
});

describe("one local declaration still checks the receiver", () => {
  const TYPES = "type A\n    float v\ntype B\n    float v\n" + 'method area(A self) => "A"\n';

  it("a named receiver of another user type is refused", () => {
    expect(() => compileScript(HEAD + TYPES + "b = B.new(1)\nx = b.area()\n")).toThrow(/receiver is 'B'/);
  });

  it("so is a chained one", () => {
    expect(() => compileScript(HEAD + TYPES + "x = B.new(1).area()\n")).toThrow(/receiver is 'B'/);
  });

  it("an imported library's method of the name takes it instead", () => {
    const lib = '//@version=5\nlibrary("L")\nexport type Sq\n    float s\nexport method area(Sq self) => self.s * self.s\n';
    const s = new Session();
    const c = s.compile(HEAD + "import me/L/1 as L\ntype C\n    float r\nmethod area(C self) => -1.0\n" +
      "sq = L.Sq.new(3)\nplot(sq.area())\n", { libraries: { "me/L/1": lib } });
    expect(c.errors.map((e: any) => e.message)).toEqual([]);
    const run: any = s.runHistory([{ time: 0, open: 1, high: 2, low: 0, close: 1.5, volume: 1 }]);
    expect(run.series[0].data[0].value).toBe(9);
  });

  it("another user type keeps its built-in copy()", () => {
    const src = HEAD + "type V\n    float x\ntype M\n    float y\nmethod copy(V self) => V.new(-1)\n" +
      "m = M.new(4)\nc = m.copy()\nx = c.y\n";
    expect(value(src, "x")).toBe(4);
  });

  it("a single user `set` does not take a copied array's built-in set", () => {
    const src = HEAD + "type C\n    float v\nmethod set(C self, float v) =>\n    self.v := v\n" +
      "arr = array.from(1.0, 2.0)\nb = arr.copy()\nb.set(0, 9.0)\narr.copy().set(0, 5.0)\nx = b.get(0)\n";
    expect(value(src, "x")).toBe(9);
  });
});

describe("tuple widths in an if/switch initialiser", () => {
  it("a branch of another width is refused", () => {
    expect(() => compileScript(HEAD + "[a, b] = if close > 0\n    [1, 2, 3]\nelse\n    [3, 4]\n"))
      .toThrow(/returns 3 values, but you provided 2/);
  });

  it("a branch with a single value is refused", () => {
    expect(() => compileScript(HEAD + "[a, b] = switch\n    close > 0 => 1\n    => [3, 4]\n"))
      .toThrow(/returns 1 value, but you provided 2/);
  });

  it("a branch ending in a call is let through", () => {
    expect(value(HEAD + "p() => [5, 6]\n[a, b] = if close > 0\n    p()\nelse\n    [3, 4]\nx = a + b\n", "x")).toBe(11);
  });
});

describe("minor", () => {
  it("a script-scope variable shadows a namespace it is named like", () => {
    expect(value(HEAD + 'shape = str.split("a-b", "-")\nx = shape.get(1)\n', "x")).toBe("b");
  });

  it("a UDT named like a qualifier is matched whole at run time", () => {
    const src = H6 + "type seriesData\n    float v\ntype Data\n    float v\n" +
      'method tag(seriesData self) => "sd"\nmethod tag(Data self) => "d"\nmk() => seriesData.new(1)\nx = mk().tag()\n';
    expect(value6(src, "x")).toBe("sd");
  });
});
