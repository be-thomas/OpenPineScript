/**
 * `==` and `!=` between two VARIABLES.
 *
 * ── The bug ─────────────────────────────────────────────────────────────────
 *
 * Every script variable is a Series OBJECT, and JavaScript compares two objects
 * with `==` by REFERENCE. So
 *
 *     x = 1.0
 *     y = 1.0
 *     equal = x == y
 *
 * was FALSE, at every version, for the whole life of this engine.
 *
 * It survived because the common shapes hide it. `x == 0` has only one object
 * in it and coerces through `valueOf`; `<`, `>`, `<=` and `>=` coerce
 * unconditionally whatever their operands are. Only `==` and `!=` with a
 * variable on both sides reach the reference test — and then they are silently,
 * permanently false, which is the worst way for a comparison to be wrong: the
 * script runs, plots, and takes the branch nobody meant.
 *
 * Found by an enum: `Signal.State.long == Signal.State.long` through two
 * variables was false, which looked like an enum-identity problem and was not.
 */
import { describe, it, expect } from "vitest";
import { compileScript } from "../../../transpiler/common";
import { compile, Context } from "../../../runtime/v5";

const head = (v: number) =>
  v === 1 ? 'study("t")\n'
          : `//@version=${v}\n${v >= 5 ? 'indicator("t")' : 'study("t")'}\n`;

function read(v: number, body: string, name = "x"): any {
  const { js, profile } = compileScript(head(v) + body + "\n");
  const ctx = new Context(profile);
  const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
  ctx.setBar(0, 10, 12, 9, 11, 100);
  exec();
  return ctx.vars.get("opsv2_" + name)?.valueOf();
}

describe("two variables holding the same value are equal", () => {
  for (const v of [1, 2, 3, 4, 5]) {
    it(`v${v}: numbers`, () => {
      expect(read(v, "a = 1.0\nb = 1.0\nx = a == b")).toBe(true);
      expect(read(v, "a = 1.0\nb = 2.0\nx = a == b")).toBe(false);
    });

    it(`v${v}: strings`, () => {
      expect(read(v, 'a = "s"\nb = "s"\nx = a == b')).toBe(true);
      expect(read(v, 'a = "s"\nb = "t"\nx = a == b')).toBe(false);
    });

    it(`v${v}: booleans`, () => {
      expect(read(v, "a = close > open\nb = close > open\nx = a == b")).toBe(true);
    });

    it(`v${v}: and != is its exact negation`, () => {
      expect(read(v, "a = 1.0\nb = 1.0\nx = a != b")).toBe(false);
      expect(read(v, "a = 1.0\nb = 2.0\nx = a != b")).toBe(true);
    });
  }
});

describe("what still has to hold", () => {
  it("a variable against a literal", () => {
    expect(read(5, "a = 1.0\nx = a == 1.0")).toBe(true);
    expect(read(5, "a = 1.0\nx = 1.0 == a")).toBe(true);
  });

  it("two built-in series", () => {
    expect(read(5, "x = close == close")).toBe(true);
    expect(read(5, "x = close == open")).toBe(false);
  });

  it("a series against its own history", () => {
    expect(read(5, "x = close == close[0]")).toBe(true);
  });

  it("`na` equals nothing, including itself", () => {
    // NaN is the representation, and NaN != NaN — which is what Pine reports
    // for any comparison involving `na`, and why `na(x)` exists.
    expect(read(5, "a = 0.0/0.0\nb = 0.0/0.0\nx = a == b")).toBe(false);
  });

  it("relational operators are unaffected", () => {
    expect(read(5, "a = 2.0\nb = 1.0\nx = a > b")).toBe(true);
    expect(read(5, "a = 2.0\nb = 1.0\nx = a <= b")).toBe(false);
  });

  it("a chain stays left-associative", () => {
    // `a != b == c` is `(a != b) == c`.
    expect(read(5, "a = 1.0\nb = 2.0\nc = true\nx = a != b == c")).toBe(true);
  });
});

describe("enum members still compare by IDENTITY", () => {
  /**
   * The rule the fix must not break: "Scripts cannot compare members of
   * different enums ... even if the fields have identical names and titles."
   *
   * A member is a plain object with no `valueOf` of its own, so unwrapping
   * leaves it alone and `==` compares references — which is exactly right.
   */
  const TWO = 'enum A\n    up = "Up"\n' + 'enum B\n    up = "Up"\n';

  it("the same member through two variables IS equal", () => {
    expect(read(5, "enum E\n    a\n    b\np = E.a\nq = E.a\nx = p == q")).toBe(true);
  });

  it("different members are not", () => {
    expect(read(5, "enum E\n    a\n    b\np = E.a\nq = E.b\nx = p == q")).toBe(false);
  });

  it("identically named and titled members of DIFFERENT enums are not", () => {
    expect(read(5, TWO + "p = A.up\nq = B.up\nx = p == q")).toBe(false);
  });
});
