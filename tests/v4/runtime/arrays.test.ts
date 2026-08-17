/**
 * v4 arrays — the `array.*` namespace (Pine, September 2020).
 */
import { describe, it, expect } from "vitest";
import { compileScript } from "../../../transpiler";
import { compile, Context } from "../../../runtime/v4";

const HEAD = "//@version=4\nstudy(\"t\")\n";

function run(body: string, name: string, closes: number[] = [10, 11, 12]): any {
  const { js, profile } = compileScript(HEAD + body);
  const ctx = new Context(profile);
  const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
  closes.forEach((c, i) => {
    ctx.setBar(i * 86400000, c, c, c, c, 100);
    exec();
    ctx.finalizeBar();
  });
  return ctx.vars.get("opsv2_" + name)?.valueOf();
}

describe("arrays are reference values that persist", () => {
  it("`var` + push accumulates across bars", () => {
    // The defining property. If the array were rebuilt or copied per bar, size
    // would be 1 forever — and the script would still run and still plot.
    expect(run("var a = array.new_float(0)\narray.push(a, close)\ns = array.size(a)\n",
               "s", [1, 2, 3, 4, 5])).toBe(5);
  });

  it("without `var` it is rebuilt every bar", () => {
    expect(run("a = array.new_float(0)\narray.push(a, close)\ns = array.size(a)\n",
               "s", [1, 2, 3, 4, 5])).toBe(1);
  });

  it("new_float(size, initial) fills", () => {
    expect(run("a = array.new_float(3, 7.0)\ns = array.get(a, 2)\n", "s")).toBe(7);
  });

  it("array.from takes its arguments", () => {
    expect(run("a = array.from(4, 5, 6)\ns = array.get(a, 1)\n", "s")).toBe(5);
  });
});

describe("mutation", () => {
  it("set replaces in place", () => {
    expect(run("a = array.new_float(3, 1.0)\narray.set(a, 1, 9.0)\ns = array.get(a, 1)\n", "s")).toBe(9);
  });

  it("pop returns and shrinks", () => {
    expect(run("a = array.from(1, 2, 3)\np = array.pop(a)\ns = p * 10 + array.size(a)\n", "s")).toBe(32);
  });

  it("shift takes from the front", () => {
    expect(run("a = array.from(1, 2, 3)\ns = array.shift(a)\n", "s")).toBe(1);
  });

  it("insert and remove", () => {
    expect(run("a = array.from(1, 3)\narray.insert(a, 1, 2)\ns = array.get(a, 1)\n", "s")).toBe(2);
    expect(run("a = array.from(1, 2, 3)\narray.remove(a, 0)\ns = array.get(a, 0)\n", "s")).toBe(2);
  });

  it("clear empties", () => {
    expect(run("a = array.from(1, 2, 3)\narray.clear(a)\ns = array.size(a)\n", "s")).toBe(0);
  });

  it("reverse", () => {
    expect(run("a = array.from(1, 2, 3)\narray.reverse(a)\ns = array.get(a, 0)\n", "s")).toBe(3);
  });
});

describe("sort is numeric, not lexicographic", () => {
  it("orders 2 before 10", () => {
    // JavaScript's default sort would give [10, 2, 33] — the classic bug, and
    // one that only shows up once values cross a digit boundary.
    expect(run("a = array.from(10, 2, 33)\narray.sort(a)\ns = array.get(a, 1)\n", "s")).toBe(10);
    expect(run("a = array.from(10, 2, 33)\narray.sort(a)\ns = array.get(a, 0)\n", "s")).toBe(2);
  });

  it("descending", () => {
    expect(run("a = array.from(10, 2, 33)\narray.sort(a, order.descending)\ns = array.get(a, 0)\n",
               "s")).toBe(33);
  });
});

describe("aggregates ignore na and return na when empty", () => {
  const CASES: Array<[string, string, number]> = [
    ["sum", "array.sum(a)", 36],
    ["avg", "array.avg(a)", 12],
    ["min", "array.min(a)", 2],
    ["max", "array.max(a)", 24],
    ["range", "array.range(a)", 22],
    ["median", "array.median(a)", 10],
  ];

  for (const [name, expr, want] of CASES) {
    it(name, () => {
      expect(run(`a = array.from(10, 2, 24)\ns = ${expr}\n`, "s")).toBe(want);
    });
  }

  it("stdev is the sample (n-1) form, matching stdev() elsewhere", () => {
    const got = run("a = array.from(2, 4, 4, 4, 5, 5, 7, 9)\ns = array.stdev(a)\n", "s");
    expect(got).toBeCloseTo(2.13808993, 6);
  });

  it("an empty array aggregates to na, not 0", () => {
    // 0 is a legitimate sum. Conflating them would make "no data" and "nets to
    // zero" indistinguishable downstream.
    expect(Number.isNaN(run("a = array.new_float(0)\ns = array.sum(a)\n", "s"))).toBe(true);
    expect(Number.isNaN(run("a = array.new_float(0)\ns = array.avg(a)\n", "s"))).toBe(true);
  });

  it("na members are skipped rather than poisoning the result", () => {
    expect(run("a = array.from(10, na, 20)\ns = array.sum(a)\n", "s")).toBe(30);
  });
});

describe("search", () => {
  it("includes / indexof / lastindexof", () => {
    expect(run("a = array.from(1, 2, 3)\ns = array.includes(a, 2) ? 1 : 0\n", "s")).toBe(1);
    expect(run("a = array.from(1, 2, 3)\ns = array.indexof(a, 3)\n", "s")).toBe(2);
    expect(run("a = array.from(1, 2, 1)\ns = array.lastindexof(a, 1)\n", "s")).toBe(2);
  });
});

describe("out-of-range access is an error, not na", () => {
  it("get past the end throws", () => {
    expect(() => run("a = array.from(1, 2)\ns = array.get(a, 5)\n", "s"))
      .toThrow(/out of bounds/);
  });

  it("pop on an empty array throws", () => {
    expect(() => run("a = array.new_float(0)\ns = array.pop(a)\n", "s"))
      .toThrow(/empty/);
  });
});

describe("the namespace is v4+ only", () => {
  it("v3 refuses a CALL into it, naming the version", () => {
    expect(() => compileScript("//@version=3\nstudy(\"t\")\na = array.new_float(0)\n"))
      .toThrow(/'array\.new_float' is not available in Pine Script v3/);
  });

  it("v3 refuses a READ of it, naming the namespace", () => {
    // Reads and calls fail through different checks — the call path can name
    // the exact member, a read of an unknown root can only name the root.
    expect(() => compileScript("//@version=3\nstudy(\"t\")\nx = array.something\n"))
      .toThrow(/'array' is not a namespace in Pine Script v3/);
  });
});
