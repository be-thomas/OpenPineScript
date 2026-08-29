/**
 * v5 method OVERLOADING — one name, several receiver types.
 *
 * SOURCING. From the manual's Methods page:
 *
 *   "User-defined methods can override and overload existing built-in and
 *    user-defined methods with the same identifier. This capability allows
 *    users to define multiple routines associated with different parameter
 *    signatures under the same method name."
 *
 * and the rule that decides which one runs:
 *
 *   "The underlying type of each variable determines which overload of
 *    `getType()` the compiler will use."
 *
 * ── Why this is a COMPILE-TIME decision, and what that costs ────────────────
 *
 * "The compiler will use" is load-bearing. Dispatch cannot be deferred to the
 * runtime here even in principle: Pine's `int` and `float` are both JavaScript
 * numbers, and `1` and `1.0` are the same value, so `typeof` can never separate
 * the first two overloads of TradingView's own example. The receiver's type has
 * to be known statically or not at all.
 *
 * So the engine proves the type where it can — from a declared prefix, from a
 * literal, from `color.*`, from an `input.*` or `Type.new()` call — and REFUSES
 * where it cannot, naming the overloads it could not choose between. The
 * alternative is dispatching into a body written for another type, which
 * returns a plausible wrong answer rather than an error.
 */
import { describe, it, expect } from "vitest";
import { compileScript } from "../../../transpiler/common";
import { HEAD, value, build } from "../helpers";

/** TradingView's own "Type Inspection" example, minus the label. */
const GET_TYPE =
  'method getType(int this) =>\n    na(this) ? "int(na)" : "int"\n' +
  'method getType(float this) =>\n    na(this) ? "float(na)" : "float"\n' +
  'method getType(bool this) =>\n    na(this) ? "bool(na)" : "bool"\n' +
  'method getType(color this) =>\n    na(this) ? "color(na)" : "color"\n' +
  'method getType(string this) =>\n    na(this) ? "string(na)" : "string"\n';

describe("the manual's Type Inspection example", () => {
  const CASES: Array<[string, string, string]> = [
    ["a", "1", "int"],
    ["b", "1.0", "float"],
    ["c", "true", "bool"],
    ["d", "color.white", "color"],
    ["e", '"1"', "string"],
  ];

  for (const [name, literal, expected] of CASES) {
    it(`${name} = ${literal} dispatches to the '${expected}' overload`, () => {
      const src = HEAD + GET_TYPE + `${name} = ${literal}\nv = ${name}.getType()\n`;
      expect(value(src, "v")).toBe(expected);
    });
  }

  it("all five in one script, which is the point", () => {
    // Five JavaScript functions, not one — the whole failure mode this closes
    // is a second `function opsv2_$fn_getType` silently replacing the first.
    const src = HEAD + GET_TYPE +
      "a = 1\nb = 1.0\nc = true\nd = color.white\ne = \"1\"\n" +
      "v = a.getType() + b.getType() + c.getType() + d.getType() + e.getType()\n";
    expect(value(src, "v")).toBe("intfloatboolcolorstring");
  });

  it("`int` and `float` really are told apart", () => {
    // The case no runtime check could make: both are JavaScript numbers, and
    // `1.0 === 1`. Only the declaration distinguishes them.
    const src = HEAD + GET_TYPE + "a = 1\nb = 1.0\nx = a.getType()\ny = b.getType()\n";
    expect(value(src, "x")).toBe("int");
    expect(value(src, "y")).toBe("float");
  });
});

describe("where the receiver's type comes from", () => {
  const PAIR =
    'method tag(int self) =>\n    "int"\n' +
    'method tag(float self) =>\n    "float"\n';

  it("a DECLARED prefix beats the literal", () => {
    // `float x = 1` is a float, whatever the initialiser looks like.
    const src = HEAD + PAIR + "float x = 1\nv = x.tag()\n";
    expect(value(src, "v")).toBe("float");
  });

  it("an input.* call carries its own type", () => {
    const srcInt = HEAD + PAIR + 'x = input.int(3, "n")\nv = x.tag()\n';
    const srcFloat = HEAD + PAIR + 'x = input.float(3.0, "n")\nv = x.tag()\n';
    expect(value(srcInt, "v")).toBe("int");
    expect(value(srcFloat, "v")).toBe("float");
  });

  it("a user type's constructor names the type", () => {
    const src = HEAD +
      "type Point\n    float x\n" +
      'method label(Point self) =>\n    "point"\n' +
      'method label(int self) =>\n    "int"\n' +
      "p = Point.new(1.0)\nv = p.label()\n";
    expect(value(src, "v")).toBe("point");
  });
});

describe("what it refuses, and why that is the right answer", () => {
  const PAIR =
    'method tag(int self) =>\n    "int"\n' +
    'method tag(float self) =>\n    "float"\n';

  it("an unprovable receiver type is an error, not a guess", () => {
    // `close * 2` is a series float in Pine, but this pass does not model
    // arithmetic and will not pretend to. Refusing names both candidates.
    const src = HEAD + PAIR + "x = close * 2\nv = x.tag()\n";
    expect(() => compileScript(src))
      .toThrow(/'tag' is declared 2 times, for 'int', 'float' receivers.*cannot be determined/s);
  });

  it("a receiver whose type matches no overload says which type it has", () => {
    const src = HEAD + PAIR + 'x = "s"\nv = x.tag()\n';
    expect(() => compileScript(src))
      .toThrow(/is 'string', which none of them takes/);
  });

  it("the message says how to fix it", () => {
    const src = HEAD + PAIR + "x = close * 2\nv = x.tag()\n";
    expect(() => compileScript(src)).toThrow(/Declare it — 'float x = …'/);
  });

  it("a chained receiver is a VALUE, so an overload cannot be chosen", () => {
    // `f().tag()` — there is no name to look a declared type up by.
    const src = HEAD + PAIR + "f() =>\n    1\nv = f().tag()\n";
    expect(() => compileScript(src)).toThrow(/'tag' is declared 2 times/);
  });

  it("two declarations sharing a receiver type are still refused", () => {
    const src = HEAD + 'method tag(int self) =>\n    "a"\nmethod tag(int self) =>\n    "b"\n' +
      "x = 1\nv = x.tag()\n";
    expect(() => compileScript(src))
      .toThrow(/method 'tag' is already defined for a 'int' receiver/);
  });
});

describe("a method with ONE declaration is untouched", () => {
  it("still emits its unqualified name", () => {
    const src = HEAD + "method double(int self) =>\n    self * 2\nn = 21\nv = n.double()\n";
    const { js } = build(src);
    expect(js).toContain("function opsv2_$fn_double(");
    expect(value(src, "v")).toBe(42);
  });

  it("...and needs no provable receiver type", () => {
    // The refusal above applies only to an overload SET; a single declaration
    // resolves without knowing anything about the receiver.
    const src = HEAD + "method double(float self) =>\n    self * 2\n" +
      "x = close * 2\nv = x.double()\n";
    expect(() => compileScript(src)).not.toThrow();
  });
});
