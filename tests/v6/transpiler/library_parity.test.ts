/**
 * What the scraped-library sweep (scripts/common/library-sweep.ts) found the
 * engine refusing or getting wrong, one block per cause, each reduced to the
 * smallest script that shows it. Every original is a library published on
 * TradingView, so each of these compiles there.
 *
 * The same causes at v5 are in tests/v5/transpiler/library_parity.test.ts.
 */
import { describe, it, expect } from "vitest";
import { compileScript } from "../../../transpiler/common";
import { Session } from "../../../runtime/v1";
import { HEAD, value, series } from "../helpers";

/** Imports `lib` as `me/L/1` into a v6 indicator and returns `x` on its first bar. */
function viaLibrary(lib: string, body: string): any {
  const s = new Session();
  const c = s.compile(`${HEAD}import me/L/1 as L\n${body}plot(x)\n`, { libraries: { "me/L/1": lib } });
  expect(c.errors.map(e => e.message)).toEqual([]);
  const run: any = s.runHistory([{ time: 0, open: 1, high: 2, low: 0, close: 1.5, volume: 1 }]);
  expect(run.errors ?? []).toEqual([]);
  return run.series[0].data[0].value;
}

const LIB = '//@version=6\nlibrary("L")\n';

describe("grammar", () => {
  it("`type` and `method` are ordinary names outside a declaration", () => {
    expect(value(HEAD + 'f(string method, int type) => method == "a" ? type : 0\nx = f("a", 7)\n', "x")).toBe(7);
  });

  it("`T[]` declares an array of any type, user types and drawings included", () => {
    const src = HEAD + "type P\n    float v\nf(P[] ps, line[] ls) => ps.size() + ls.size()\n" +
      "x = f(array.from(P.new(1)), array.new_line(2))\n";
    expect(value(src, "x")).toBe(3);
  });

  it("a line off the four-space grid continues the one above, whatever starts it", () => {
    const src = HEAD + "a = 1\nb = a\n     + 2\nc = b\n      >= 3\n" +
      "d = math.max(1,\n    2,\n        3)\nx = c ? d : 0\n";
    expect(value(src, "x")).toBe(3);
  });

  it("a line starting with `.` or `,`, or after a trailing `.`, continues", () => {
    const src = HEAD + "a = array.from(1, 2, 3)\nx = a\n  .size()\n";
    expect(value(src, "x")).toBe(3);
  });

  it("a literal takes a method suffix", () => {
    const src = HEAD + "method twice(float self) => self * 2\nx = 2.5.twice()\n";
    expect(value(src, "x")).toBe(5);
  });

  it("leading zeros in a number literal", () => {
    expect(value(HEAD + "x = 00.50 + 007\n", "x")).toBe(7.5);
  });
});

describe("overloads", () => {
  it("a parameter's declared type picks the method overload inside a function", () => {
    const src = HEAD + "type A\n    float v\ntype B\n    float v\n" +
      "method tag(A self) => 1\nmethod tag(B self) => 2\nf(B b) => b.tag()\nx = f(B.new(0))\n";
    expect(value(src, "x")).toBe(2);
  });

  it("a field's declared type picks it too", () => {
    const src = HEAD + "type A\n    float v\ntype B\n    float v\ntype H\n    B inner\n" +
      "method tag(A self) => 1\nmethod tag(B self) => 2\nf(H h) => h.inner.tag()\nx = f(H.new(B.new(0)))\n";
    expect(value(src, "x")).toBe(2);
  });

  it("a receiver whose type is not written is dispatched at run time by its own type", () => {
    const src = HEAD + "type A\n    float v\ntype B\n    float v\n" +
      "method tag(A self) => 1\nmethod tag(B self) => 2\nmk() => B.new(0)\nx = mk().tag()\n";
    expect(value(src, "x")).toBe(2);
  });

  it("a function and a method of one name are one overload set", () => {
    const src = HEAD + "type V\n    float x\nf(V a, V b) => a.x + b.x\nmethod f(array<float> a, array<float> b) => a.sum() * b.sum()\n" +
      "x = f(V.new(1), V.new(2)) * 100 + f(array.from(2.0), array.from(3.0))\n";
    expect(value(src, "x")).toBe(306);
  });

  it("an overloaded library export is callable — it was 'not defined'", () => {
    const lib = LIB + "export type A\n    float v\nexport type B\n    float v\n" +
      "export push(array<A> xs, A item) =>\n    xs.push(item)\n    xs.size()\n" +
      "export push(array<B> xs, B item) =>\n    xs.push(item)\n    xs.size() * 10\n";
    expect(viaLibrary(lib, "xs = array.new<L.B>()\nx = L.push(xs, L.B.new(1))\n")).toBe(10);
  });

  it("a built-in method of the same name wins when no declaration takes the receiver", () => {
    const src = HEAD + "type C\n    float v\nmethod set(C self, float v) =>\n    self.v := v\n" +
      "arr = array.from(1.0, 2.0)\narr.set(0, 5.0)\nx = arr.get(0)\n";
    expect(value(src, "x")).toBe(5);
  });

  it("an overload calling its sibling is not recursion", () => {
    const src = HEAD + "hex(float r, float g) => r + g\nhex(color c) => hex(color.r(c), color.g(c))\nx = hex(#010203)\n";
    expect(value(src, "x")).toBe(3);
  });

  it("a method named like a built-in may call that built-in", () => {
    expect(() => compileScript(HEAD + 'method alert(string message, string key) =>\n    alert(message, alert.freq_once_per_bar)\n')).not.toThrow();
  });
});

describe("tuples", () => {
  it("`[a, b] = switch …`", () => {
    const src = HEAD + "k = 2\n[a, b] = switch k\n    1 => [1, 2]\n    => [3, 4]\nx = a + b\n";
    expect(value(src, "x")).toBe(7);
  });

  it("a method returning a tuple, called on a value", () => {
    const src = HEAD + "type P\n    float v\nmethod pair(P self) => [self.v, self.v * 2]\np = P.new(3)\n[a, b] = p.pair()\nx = a + b\n";
    expect(value(src, "x")).toBe(9);
  });

  it("a function ending in a call that returns a tuple", () => {
    const src = HEAD + "inner() => [1, 2]\nouter() => inner()\n[a, b] = outer()\nx = a + b\n";
    expect(value(src, "x")).toBe(3);
  });

  it("a library function returning a tuple", () => {
    const lib = LIB + "export pair(float v) => [v, v * 2]\n";
    expect(viaLibrary(lib, "[a, b] = L.pair(2)\nx = a + b\n")).toBe(6);
  });

  it("ta.vwap with stdev_mult returns [vwap, upper, lower]", () => {
    const src = HEAD + "[v, u, l] = ta.vwap(close, true, 1)\nx = u >= v and v >= l ? 1 : 0\n";
    expect(value(src, "x")).toBe(1);
  });
});

describe("scope and names", () => {
  it("a local shadows a built-in namespace of the same name", () => {
    const src = HEAD + 'f(string s) =>\n    shape = str.split(s, "-")\n    shape.size()\nx = f("a-b-c")\n';
    expect(value(src, "x")).toBe(3);
  });

  it("a field of the variable's own name is not a self-reference", () => {
    const src = HEAD + "type P\n    float y\nverts = array.from(P.new(4))\nf() =>\n    float y = verts.get(0).y\n    y\nx = f()\n";
    expect(value(src, "x")).toBe(4);
  });

  it("a destructured local is not a forward reference to a later global", () => {
    const src = HEAD + "pairs() => [1, 2]\nf() =>\n    [a, b] = pairs()\n    a + b\nx = f()\n[a, b] = pairs()\n";
    expect(value(src, "x")).toBe(3);
  });

  it("a method on an enum member", () => {
    const src = HEAD + "enum Day\n    MON\n    TUE\nmethod n(Day d) => d == Day.TUE ? 2 : 1\nx = Day.TUE.n()\n";
    expect(value(src, "x")).toBe(2);
  });

  it("`break` inside a switch arm leaves the enclosing loop", () => {
    const src = HEAD + "n = 0\nfor i = 0 to 9\n    n := i\n    switch i\n        3 => break\n        => n := i\nx = n\n";
    expect(value(src, "x")).toBe(3);
  });
});

describe("libraries and built-ins", () => {
  it("a library may call strategy.*", () => {
    const lib = LIB + "export inPosition() => strategy.position_size != 0\n";
    const s = new Session();
    const c = s.compile('//@version=6\nstrategy("t")\nimport me/L/1 as L\nplot(L.inPosition() ? 1 : 0)\n', { libraries: { "me/L/1": lib } });
    expect(c.errors).toEqual([]);
  });

  it("timeframe.isminutes and isdwm", () => {
    const src = HEAD + "x = (timeframe.isminutes ? 1 : 0) + (timeframe.isdwm ? 10 : 0)\n";
    expect(series(src, "x", 1)[0]).toBe(10);
  });

  it("array.percentile_nearest_rank and percentile_linear_interpolation", () => {
    const src = HEAD + "a = array.from(1.0, 2.0, 3.0, 4.0)\n" +
      "x = a.percentile_nearest_rank(50) * 10 + a.percentile_linear_interpolation(50)\n";
    expect(value(src, "x")).toBe(22.5);
  });

  it("matrix.pow", () => {
    const src = HEAD + "m = matrix.new<float>(2, 2, 0)\nm.set(0, 0, 2)\nm.set(1, 1, 3)\nx = m.pow(3).get(1, 1)\n";
    expect(value(src, "x")).toBe(27);
  });
});
