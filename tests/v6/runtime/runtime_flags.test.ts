/**
 * The v6 run-time changes that are carried as profile DATA rather than code:
 * the colour palette, `timeframe.period`'s multiplier, negative array indices
 * and bool history. Each is one flag on the v6 LanguageProfile, read in one
 * place — and each test here also asserts the v5 answer, because the flag is
 * absent there and the behaviour must be too.
 *
 * Source: https://www.tradingview.com/pine-script-docs/migration-guides/to-pine-version-6/
 */
import { describe, it, expect } from "vitest";
import { build, value, series } from "../helpers";
import { build as build5, value as value5, series as series5 } from "../../v5/helpers";

const H6 = '//@version=6\nindicator("t")\n';
const H5 = '//@version=5\nindicator("t")\n';

describe("Color changes", () => {
  it.each([
    ["color.red", "#F23645"],
    ["color.yellow", "#FDD835"],
    ["color.teal", "#089981"],
  ])("%s is %s at v6", (name, v6) => {
    expect(value(H6 + `x = ${name}\n`, "x")).toBe(v6);
  });

  it("v5 keeps its red and yellow", () => {
    expect(value5(H5 + "x = color.red\n", "x")).toBe("#FF5252");
    expect(value5(H5 + "x = color.yellow\n", "x")).toBe("#FFEB3B");
  });

  it("does not leak into a v5 session built after a v6 one in the same process", () => {
    // The namespace object is shared across Contexts; the v6 palette is
    // applied to a copy. Built in this order deliberately.
    build(H6 + "x = color.red\n");
    expect(value5(H5 + "x = color.red\n", "x")).toBe("#FF5252");
  });

  it("leaves the other colours and color.* functions alone", () => {
    expect(value(H6 + "x = color.blue\n", "x")).toBe(value5(H5 + "x = color.blue\n", "x"));
    expect(value(H6 + "x = color.new(color.red, 50)\n", "x")).toBe("#F236457f");
  });
});

describe("Timeframes must include a multiplier", () => {
  const period = (b: ReturnType<typeof build>, res: string) => {
    b.ctx.resolution = res;
    b.ctx.setBar(0, 10, 12, 9, 11, 100);
    b.exec();
    return b.ctx.vars.get("opsv2_x")?.valueOf();
  };

  it.each([["D", "1D"], ["W", "1W"], ["M", "1M"], ["60", "60"], ["3D", "3D"]])(
    "%s reads as %s at v6", (res, want) => {
      expect(period(build(H6 + "x = timeframe.period\n"), res)).toBe(want);
    },
  );

  it("a comparison against \"D\" is false at v6 and true at v5", () => {
    const src = (h: string) => h + 'x = timeframe.period == "D"\n';
    expect(period(build(src(H6)), "D")).toBe(false);
    expect(period(build5(src(H5)), "D")).toBe(true);
  });
});

describe("Negative indices in arrays", () => {
  const A = "a = array.from(1, 2, 3, 4, 5)\n";

  it("-1 is the last element, -5 the first", () => {
    expect(value(H6 + A + "x = array.get(a, -1)\n", "x")).toBe(5);
    expect(value(H6 + A + "x = a.get(-5)\n", "x")).toBe(1);
  });

  it("set, insert and remove count from the end too", () => {
    expect(value(H6 + A + "a.set(-1, 9)\nx = str.tostring(a)\n", "x")).toBe("[1, 2, 3, 4, 9]");
    expect(value(H6 + A + "a.insert(-1, 9)\nx = str.tostring(a)\n", "x")).toBe("[1, 2, 3, 4, 9, 5]");
    expect(value(H6 + A + "r = a.remove(-2)\nx = str.tostring(a)\n", "x")).toBe("[1, 2, 3, 5]");
  });

  it("stays bounds-checked: remove(-6) on five elements is an error", () => {
    // The guide's own example.
    expect(() => value(H6 + A + "r = a.remove(-6)\n", "r")).toThrow(/Index -6 is out of bounds/);
  });

  it("is still an error at v5", () => {
    expect(() => value5(H5 + A + "x = array.get(a, -1)\n", "x")).toThrow(/Index -1 is out of bounds/);
  });
});

describe("Boolean values cannot be na — history", () => {
  it("[] past the first bar of a bool series is false at v6", () => {
    expect(series(H6 + "b = close > 0\nx = b[1]\n", "x", 2)).toEqual([false, true]);
  });

  it("…including a bool the static pass cannot see, inside a function", () => {
    const src = "f() =>\n    b = close > 0\n    b[1]\nx = f()\n";
    expect(series(H6 + src, "x", 2)).toEqual([false, true]);
  });

  it("is na at v5", () => {
    expect(series5(H5 + "b = close > 0\nx = b[1]\n", "x", 2)[0]).toBeNull();
  });

  it("numeric history is still na at v6", () => {
    expect(Number.isNaN(series(H6 + "x = close[1]\n", "x", 2)[0])).toBe(true);
  });
});
