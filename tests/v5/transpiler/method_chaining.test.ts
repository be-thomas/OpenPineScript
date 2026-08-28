/**
 * v5 method chaining — `a.f().g()`.
 *
 * SOURCING. From the manual's Methods page:
 *
 *   "We are able to call `copy()`, `fill()`, and `avg()` successively on the
 *    same line of code because the first two methods return an `array<float>`
 *    instance."
 *
 * with the example
 *
 *     srcArray.copy().fill(1.0, 0.0, min, val).avg()
 *
 * ── What makes this its own feature ─────────────────────────────────────────
 *
 * `a.f()` and `a.f().g()` look like one thing spelled twice, and they are not.
 * The receiver of `a.f()` is a NAME, which the emitter resolves to a local; the
 * receiver of `.g()` is a VALUE that does not exist until `f()` has run. The
 * grammar has to say so — `id` is greedy, so `a.b(1)` is a dotted callee, and
 * only a suffix after a closing parenthesis can be a chained call.
 */
import { describe, it, expect } from "vitest";
import { transpile } from "../../../transpiler/common";
import { HEAD, value, build } from "../helpers";

describe("chaining on built-in collections", () => {
  it("two calls: copy() then avg()", () => {
    const src = HEAD + "xs = array.from(1.0, 2.0, 6.0)\nv = xs.copy().avg()\n";
    expect(value(src, "v")).toBe(3);
  });

  it("three calls, as the manual's own example does", () => {
    // copy() and fill() both return the array, so avg() sees the filled one —
    // and the ORIGINAL is untouched, which is why copy() is there.
    const src = HEAD +
      "xs = array.from(1.0, 2.0, 6.0)\n" +
      "v = xs.copy().fill(9.0).avg()\n" +
      "orig = xs.avg()\n";
    expect(value(src, "v")).toBe(9);
    expect(value(src, "orig")).toBe(3);
  });

  it("a matrix row is an array, so array methods chain off it", () => {
    const src = HEAD + "m = matrix.new<float>(2, 3, 4.0)\nv = m.row(0).size()\n";
    expect(value(src, "v")).toBe(3);
  });

  it("a chained call can take arguments of its own", () => {
    const src = HEAD + "xs = array.from(5.0, 1.0, 3.0)\nv = xs.copy().get(1)\n";
    expect(value(src, "v")).toBe(1);
  });

  it("the chain can be indexed afterwards", () => {
    // `sqbr_expr` wraps `atom`, and `fun_call` is an atom, so history access
    // still applies to whatever the chain produced.
    expect(() => transpile(HEAD + "xs = array.from(1.0)\nv = xs.copy().avg()[0]\n"))
      .not.toThrow();
  });
});

describe("chaining on user types and methods", () => {
  const POINT = "type Point\n    float x\n    float y\n";

  it("a method chained onto a constructor", () => {
    const src = HEAD + POINT +
      "method shift(Point self, float d) =>\n    self.x := self.x + d\n    self\n" +
      "p = Point.new(1.0, 2.0).shift(4.0)\n" +
      "v = p.x\n";
    expect(value(src, "v")).toBe(5);
  });

  it("two user methods in a row, because the first returns its receiver", () => {
    const src = HEAD + POINT +
      "method shift(Point self, float d) =>\n    self.x := self.x + d\n    self\n" +
      "v = Point.new(1.0, 2.0).shift(4.0).shift(10.0).x\n" +
      "w = v\n";
    // The final `.x` is a FIELD read on the chain's result, not a call — see
    // the note below on what is deliberately not supported.
    expect(() => transpile(src)).toThrow();
  });

  it("a chain that ends in a call reads back fine", () => {
    const src = HEAD + POINT +
      "method shift(Point self, float d) =>\n    self.x := self.x + d\n    self\n" +
      "method xOf(Point self) =>\n    self.x\n" +
      "v = Point.new(1.0, 2.0).shift(4.0).shift(10.0).xOf()\n";
    expect(value(src, "v")).toBe(15);
  });
});

describe("what chaining is NOT", () => {
  it("a dotted callee still parses as one name", () => {
    // `a.b(1)` must stay a namespace/method call on `a`, not `a` plus a suffix.
    const { js } = build(HEAD + "xs = array.from(1.0)\nv = array.size(xs)\n");
    expect(js).toContain('ctx.builtin("array.size")');
  });

  it("a FIELD read after a call is not supported, and says so", () => {
    // `Point.new(1, 2).x` — a field, not a method. The grammar admits only a
    // call suffix, so this is a parse error rather than something that emits
    // an expression reading a property that may not be there.
    const src = HEAD + "type Point\n    float x\n" + "v = Point.new(1.0).x\n";
    expect(() => transpile(src)).toThrow();
  });
});

describe("it is a v5 addition — methods are", () => {
  for (const version of [1, 2, 3, 4]) {
    it(`v${version} does not accept a chained call`, () => {
      const head = version === 1 ? 'study("t")\n' : `//@version=${version}\nstudy("t")\n`;
      expect(() => transpile(head + "v = sma(close, 10).abs()\n")).toThrow(/parsing failed/);
    });
  }
});
