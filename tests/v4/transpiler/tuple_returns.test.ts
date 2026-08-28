/**
 * A user-defined function that returns a tuple — v4 onward.
 *
 * SOURCING. From the manual's user-defined functions page, under "Functions
 * that return multiple results":
 *
 *   "Sometimes, a function must perform multiple calculations and return
 *    separate results for each one. Programmers can write functions that return
 *    MULTIPLE values or references by using a tuple as the FINAL STATEMENT in
 *    the function's body."
 *
 * with the example
 *
 *     sumDiff(float val1, float val2) =>
 *         [val1 + val2, val1 - val2]
 *
 *     [sum, diff] = sumDiff(math.random(), math.random())
 *
 * and the rule for reading one back: "the script must use a tuple declaration
 * containing one NEW variable for each returned item. It is not possible to
 * reassign existing tuples or to use previously declared variables within
 * them."
 *
 * ── Why v4 and not earlier ──────────────────────────────────────────────────
 *
 * conformance/common/guards_by_version.test.ts has always declared this guard
 * for v1, v2 and v3 and left v4 and v5 unstated. The refusal was simply never
 * lifted, and it rejected eight of TradingView's own published scripts — among
 * them the example on its error-messages page ABOUT tuples.
 */
import { describe, it, expect } from "vitest";
import { transpile, compileScript } from "../../../transpiler/common";
import { compile, Context } from "../../../runtime/v5";

const head = (v: number) =>
  v === 1 ? 'study("t")\n'
          : `//@version=${v}\n${v >= 5 ? 'indicator("t")' : 'study("t")'}\n`;

function read(src: string, name: string): any {
  const { js, profile } = compileScript(src);
  const ctx = new Context(profile);
  const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
  ctx.setBar(0, 10, 12, 9, 11, 100);
  exec();
  return ctx.vars.get("opsv2_" + name)?.valueOf();
}

describe("a tuple body, read back by a tuple declaration", () => {
  for (const v of [4, 5]) {
    const SUMDIFF = "sumDiff(a, b) =>\n    [a + b, a - b]\n[s, d] = sumDiff(7.0, 3.0)\n";

    it(`v${v}: both values arrive`, () => {
      expect(read(head(v) + SUMDIFF, "s")).toBe(10);
      expect(read(head(v) + SUMDIFF, "d")).toBe(4);
    });

    it(`v${v}: a single-line body works too`, () => {
      const src = head(v) + "pair(x) => [x, x + 1]\n[a, b] = pair(5.0)\n";
      expect(read(src, "a")).toBe(5);
      expect(read(src, "b")).toBe(6);
    });

    it(`v${v}: three values`, () => {
      const src = head(v) + "trio(x) =>\n    [x, x * 2, x * 3]\n[a, b, c] = trio(4.0)\n";
      expect(read(src, "c")).toBe(12);
    });

    it(`v${v}: the tuple may follow other statements`, () => {
      // "a tuple as the FINAL statement" — the rest of the body still runs.
      const src = head(v) +
        "f(x) =>\n    y = x * 2\n    z = y + 1\n    [y, z]\n[a, b] = f(3.0)\n";
      expect(read(src, "a")).toBe(6);
      expect(read(src, "b")).toBe(7);
    });

    it(`v${v}: items may have different types`, () => {
      // "The items in a function's returned tuple can have different types."
      const src = head(v) + 'f() =>\n    ["ok", 2.0]\n[t, n] = f()\n';
      expect(read(src, "t")).toBe("ok");
      expect(read(src, "n")).toBe(2);
    });
  }
});

describe("arity is checked against the definition", () => {
  it("too few variables is refused, and says how many there are", () => {
    const src = head(5) + "trio(x) =>\n    [x, x, x]\n[a, b] = trio(1.0)\n";
    expect(() => transpile(src)).toThrow(/'trio' returns 3 values, but you provided 2/);
  });

  it("too many is refused the same way", () => {
    const src = head(5) + "pair(x) =>\n    [x, x]\n[a, b, c] = pair(1.0)\n";
    expect(() => transpile(src)).toThrow(/'pair' returns 2 values, but you provided 3/);
  });

  it("a function whose body is NOT a tuple is refused", () => {
    const src = head(5) + "single(x) =>\n    x * 2\n[a, b] = single(1.0)\n";
    expect(() => transpile(src)).toThrow(/'single' does not return a tuple/);
  });

  it("the check survives a forward reference", () => {
    // Pine permits calling a function declared further down, so the arity
    // cannot be read off the emitter's own left-to-right walk.
    const src = head(5) + "[a, b] = pair(1.0)\npair(x) =>\n    [x, x + 1]\n";
    expect(read(src, "b")).toBe(2);
  });
});

describe("as request.security's expression", () => {
  it("a user function returning a tuple gives the request a tuple", () => {
    // The shape on TradingView's error-messages page: the width is a fact about
    // the DEFINITION, not about the literal argument.
    const src = head(5) +
      "f() =>\n    [close, close * 2]\n" +
      '[a, b] = request.security(syminfo.tickerid, "1D", f())\n';
    expect(() => transpile(src)).not.toThrow();
  });

  it("a bracketed literal still works", () => {
    const src = head(5) +
      '[o, h] = request.security(syminfo.tickerid, "1D", [open, high])\n';
    expect(() => transpile(src)).not.toThrow();
  });

  it("a scalar-returning function is still not a tuple", () => {
    const src = head(5) +
      "f() =>\n    close\n" +
      '[a, b] = request.security(syminfo.tickerid, "1D", f())\n';
    expect(() => transpile(src)).toThrow(/does not return a tuple/);
  });
});

describe("v1 to v3 still refuse it", () => {
  for (const v of [1, 2, 3]) {
    it(`v${v}: the definition is refused`, () => {
      const src = head(v) + "pair(v) => [v, v + 1]\n[a, b] = pair(close)\n";
      expect(() => transpile(src)).toThrow(/cannot return tuples/);
    });
  }

  it("...and the refusal names the rule, not the arity", () => {
    // A version that forbids the form must not first complain about a count.
    const src = head(3) + "trio(x) =>\n    [x, x, x]\n[a, b] = trio(1.0)\n";
    expect(() => transpile(src)).toThrow(/cannot return tuples/);
  });
});
