/**
 * v5 user-defined types and methods.
 *
 * ── What makes this hard, and what these tests pin ──────────────────────────
 *
 * Before v5 a dotted name could only be one thing: a built-in namespace member.
 * UDTs make `p.x` ambiguous with `strategy.long`, and the rule that separates
 * them — a namespace always wins, otherwise the root must be a name the script
 * binds — is the load-bearing decision in the whole feature. Half these cases
 * exist to hold that rule still.
 *
 * The other half are about IDENTITY. A UDT instance is a reference: assigning
 * it does not copy it, `copy()` copies one level, and a field written through
 * one binding is visible through the other. Getting that wrong produces a
 * script that looks like it accumulates state and does not.
 */
import { describe, it, expect } from "vitest";
import { compileScript } from "../../../transpiler/common";
import { HEAD, build, series, value } from "../helpers";

const POINT = [
  "type Point",
  "    float x",
  "    float y = 0.0",
  "    string tag = \"p\"",
  "",
].join("\n");

describe("declaring and constructing a type", () => {
  it("positional construction fills fields in declaration order", () => {
    expect(value(HEAD + POINT + "p = Point.new(3.0, 4.0)\nv = p.x\n", "v")).toBe(3);
    expect(value(HEAD + POINT + "p = Point.new(3.0, 4.0)\nv = p.y\n", "v")).toBe(4);
  });

  it("an omitted field takes its declared default", () => {
    expect(value(HEAD + POINT + "p = Point.new(3.0)\nv = p.y\n", "v")).toBe(0);
    expect(value(HEAD + POINT + "p = Point.new(3.0)\nv = p.tag\n", "v")).toBe("p");
  });

  it("a field with no default is na", () => {
    const src = HEAD + "type Bare\n    float a\n\nb = Bare.new()\nv = b.a\n";
    expect(Number.isNaN(value(src, "v"))).toBe(true);
  });

  it("keyword construction names its fields", () => {
    expect(value(HEAD + POINT + "p = Point.new(y = 9.0)\nv = p.y\n", "v")).toBe(9);
  });

  it("positional and keyword arguments mix", () => {
    const src = HEAD + POINT + "p = Point.new(1.0, tag = \"z\")\nv = p.tag\n";
    expect(value(src, "v")).toBe("z");
  });

  it("too many positional arguments are refused", () => {
    expect(() => compileScript(HEAD + POINT + "p = Point.new(1.0, 2.0, \"a\", 4)\n"))
      .toThrow(/'Point\.new' takes 3 field\(s\), but 4 positional argument\(s\)/);
  });

  it("an unknown field name is refused, and the message lists the real ones", () => {
    expect(() => compileScript(HEAD + POINT + "p = Point.new(z = 1.0)\n"))
      .toThrow(/'Point' has no field 'z'\. Its fields are: x, y, tag/);
  });

  it("one field given twice is refused", () => {
    expect(() => compileScript(HEAD + POINT + "p = Point.new(1.0, x = 2.0)\n"))
      .toThrow(/got two values for field 'x'/);
  });

  it("a duplicated field declaration is refused", () => {
    expect(() => compileScript(HEAD + "type Dup\n    float a\n    int a\n\np = Dup.new()\n"))
      .toThrow(/declares the field 'a' twice/);
  });

  it("a type answers only new and copy", () => {
    expect(() => compileScript(HEAD + POINT + "p = Point.frobnicate(1)\n"))
      .toThrow(/'Point' is a type; it has no 'frobnicate'/);
  });

  it("each instance gets its OWN defaults, not a shared template", () => {
    // The factory re-evaluates every default per call. A shared template would
    // give every instance the same array.
    const src = HEAD + [
      "type Bag",
      "    float total = 0.0",
      "",
      "a = Bag.new()",
      "b = Bag.new()",
      "a.total := 5.0",
      "v = b.total",
    ].join("\n") + "\n";
    expect(value(src, "v")).toBe(0);
  });
});

describe("fields", () => {
  it("are read and written", () => {
    const src = HEAD + POINT + "p = Point.new(1.0)\np.x := 7.0\nv = p.x\n";
    expect(value(src, "v")).toBe(7);
  });

  it("nest", () => {
    const src = HEAD + [
      "type Inner",
      "    float v",
      "type Outer",
      "    Inner in",
      "",
      "o = Outer.new(Inner.new(4.0))",
      "r = o.in.v",
    ].join("\n") + "\n";
    expect(value(src, "r")).toBe(4);
  });

  it("nest for WRITES too", () => {
    const src = HEAD + [
      "type Inner",
      "    float v",
      "type Outer",
      "    Inner in",
      "",
      "o = Outer.new(Inner.new(4.0))",
      "o.in.v := 11.0",
      "r = o.in.v",
    ].join("\n") + "\n";
    expect(value(src, "r")).toBe(11);
  });

  it("a read through na is na, not a crash", () => {
    // A UDT variable starts as `na`, and reading a field off it before it is
    // constructed is a legitimate state — Pine's type checker catches a
    // MISSPELT field at compile time, which this engine does not model.
    const src = HEAD + POINT + "Point p = na\nv = p.x\n";
    expect(Number.isNaN(value(src, "v"))).toBe(true);
  });

  it("a WRITE through na is an error — it cannot mean anything", () => {
    const src = HEAD + POINT + "Point p = na\np.x := 1.0\n";
    expect(() => value(src, "p")).toThrow(/cannot set field 'x': the object is na/);
  });

  it("an instance is a REFERENCE — two names see one object", () => {
    const src = HEAD + POINT + "p = Point.new(1.0)\nq = p\nq.x := 42.0\nv = p.x\n";
    expect(value(src, "v")).toBe(42);
  });

  it("copy() breaks that, one level deep", () => {
    const src = HEAD + POINT + "p = Point.new(1.0)\nq = p.copy()\nq.x := 42.0\nv = p.x\n";
    expect(value(src, "v")).toBe(1);
  });

  it("Type.copy(obj) is the same thing, spelled as a function", () => {
    const src = HEAD + POINT + "p = Point.new(1.0)\nq = Point.copy(p)\nq.x := 42.0\nv = p.x\n";
    expect(value(src, "v")).toBe(1);
  });

  it("a `var` instance persists across bars", () => {
    const src = HEAD + [
      "type Counter",
      "    int n = 0",
      "",
      "var c = Counter.new()",
      "c.n := c.n + 1",
      "v = c.n",
    ].join("\n") + "\n";
    expect(series(src, "v", 3)).toEqual([1, 2, 3]);
  });
});

describe("a namespace always wins over a field", () => {
  it("strategy.long stays a namespace member", () => {
    // The rule that keeps UDTs from breaking every existing script.
    const src = '//@version=5\nstrategy("t")\nstrategy.entry("L", strategy.long)\n';
    expect(() => compileScript(src)).not.toThrow();
  });

  it("an unknown root is still an error, not a silent na", () => {
    // The pre-existing guard survives for exactly the case it was written for:
    // a typo. `synfo` is bound nowhere, so it cannot be a receiver.
    expect(() => compileScript(`${HEAD}x = synfo.timezone\n`))
      .toThrow(/'synfo' is not a namespace in Pine Script v5/);
  });
});

describe("methods", () => {
  const SHAPE = [
    "type Rect",
    "    float w",
    "    float h",
    "",
    "method area(Rect self) =>",
    "    self.w * self.h",
    "",
  ].join("\n");

  it("dispatch on the receiver", () => {
    expect(value(HEAD + SHAPE + "r = Rect.new(3.0, 4.0)\nv = r.area()\n", "v")).toBe(12);
  });

  it("are callable as ordinary functions — the same call, spelled differently", () => {
    expect(value(HEAD + SHAPE + "r = Rect.new(3.0, 4.0)\nv = area(r)\n", "v")).toBe(12);
  });

  it("take further arguments after the receiver", () => {
    const src = HEAD + SHAPE + [
      "method scaled(Rect self, float k) =>",
      "    self.w * self.h * k",
      "",
      "r = Rect.new(3.0, 4.0)",
      "v = r.scaled(2.0)",
    ].join("\n") + "\n";
    expect(value(src, "v")).toBe(24);
  });

  it("work on a BUILT-IN type as the receiver", () => {
    const src = HEAD + "method double(int self) =>\n    self * 2\n\nn = 21\nv = n.double()\n";
    expect(value(src, "v")).toBe(42);
  });

  it("a method with no parameters is refused — it has no receiver", () => {
    expect(() => compileScript(`${HEAD}method broken() =>\n    1\n`))
      .toThrow(/method 'broken' has no parameters/);
  });

  it("two methods of one name are refused rather than silently overwritten", () => {
    // Pine dispatches on the receiver's TYPE and allows this; this engine
    // dispatches by name and cannot. Refused, not approximated.
    const src = HEAD + [
      "method size(int self) =>",
      "    self",
      "method size(string self) =>",
      "    str.length(self)",
    ].join("\n") + "\n";
    expect(() => compileScript(src)).toThrow(/method 'size' is already defined/);
  });
});

describe("built-in method-call syntax", () => {
  it("array methods", () => {
    const src = `${HEAD}a = array.new<float>(0)\na.push(2.5)\na.push(3.5)\nn = a.size()\nf = a.get(0)\n`;
    expect(value(src, "n")).toBe(2);
    expect(value(src, "f")).toBe(2.5);
  });

  it("map methods", () => {
    const src = `${HEAD}m = map.new<string, int>()\nm.put("k", 7)\nv = m.get("k")\nn = m.size()\n`;
    expect(value(src, "v")).toBe(7);
    expect(value(src, "n")).toBe(1);
  });

  it("matrix methods — and a matrix is told apart from a plain array", () => {
    // A matrix IS an array of arrays, so `m.get(0, 0)` and `a.get(0)` are
    // indistinguishable by shape. `matrix.new` marks its result; nothing else
    // could route these two calls differently.
    const src = `${HEAD}m = matrix.new<float>(2, 3, 1.0)\nr = m.rows()\nc = m.columns()\ng = m.get(1, 2)\n`;
    expect(value(src, "r")).toBe(2);
    expect(value(src, "c")).toBe(3);
    expect(value(src, "g")).toBe(1);
  });

  it("copy() means the right thing for each receiver", () => {
    const arr = `${HEAD}a = array.from(1, 2)\nb = a.copy()\narray.set(b, 0, 9)\nv = array.get(a, 0)\n`;
    expect(value(arr, "v")).toBe(1);

    const mat = `${HEAD}m = matrix.new<float>(2, 2, 1.0)\nn = m.copy()\nn.set(0, 0, 9.0)\nv = m.get(0, 0)\n`;
    expect(value(mat, "v")).toBe(1);
  });

  it("a method on a value with none is refused, naming the value's kind", () => {
    expect(() => value(`${HEAD}x = 5\nv = x.push(1)\n`, "v"))
      .toThrow(/cannot be called on this value/);
  });

  it("an unknown method on a real collection names the namespace", () => {
    expect(() => value(`${HEAD}a = array.from(1)\nv = a.frobnicate()\n`, "v"))
      .toThrow(/'array' has no method 'frobnicate'/);
  });
});

describe("typed declarations and parameters", () => {
  it("a type prefix on a declaration is accepted and ignored", () => {
    expect(value(`${HEAD}float x = 1.5\n`, "x")).toBe(1.5);
    expect(value(`${HEAD}array<float> a = array.new<float>(3)\nn = array.size(a)\n`, "n")).toBe(3);
  });

  it("typed function parameters", () => {
    expect(value(`${HEAD}f(float x, int n) =>\n    x * n\nv = f(2.0, 3)\n`, "v")).toBe(6);
  });

  it("default parameter values", () => {
    const src = `${HEAD}f(float x, float k = 10.0) =>\n    x * k\na = f(2.0)\nb = f(2.0, 3.0)\n`;
    expect(value(src, "a")).toBe(20);
    expect(value(src, "b")).toBe(6);
  });

  it("v4 has none of this — the declarations are a v5 addition", () => {
    expect(() => compileScript('//@version=4\nstudy("t")\ntype P\n    float x\n'))
      .toThrow(/parsing failed/);
    expect(() => compileScript('//@version=4\nstudy("t")\nf(x, y = 2) =>\n    x\n'))
      .toThrow(/parsing failed/);
  });
});
