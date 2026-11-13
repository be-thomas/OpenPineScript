/**
 * `str.tostring(x)` / v4 `tostring(x)` with no format, against TradingView.
 * Every expected string is the label text TradingView drew, from the probes in
 * dev-docs/tv-parity/_probes/version-scope/:
 *
 *   v4-tostring-default, v5-tostring-consts, v5-tostring-series,
 *   v6-tostring-bounds, v6-tostring-bounds2
 *
 * A NON-constant float (a series, an input, `syminfo.*`) prints ten decimals,
 * trimmed, in v4, v5 and v6. A CONSTANT (literal, constant expression,
 * `math.pi`, a global bound to one) prints the full double in v4/v5, and the
 * same ten decimals in v6. `s` below is `close / close`, exactly 1.0 at run
 * time but not a constant. v1-v3 were never probed and keep their behaviour.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";
import { tostring as coreTostring } from "../../../runtime/v1/stdlib/core";
import { transpile } from "../../../transpiler/common";

const bars = Array.from({ length: 3 }, (_, i) => ({
  time: Date.UTC(2024, 0, 1) + i * 3_600_000, open: 100, high: 101, low: 99, close: 100, volume: 1,
}));

/** [expression, expected]. `s` is a series 1.0; `c` a constant global; `inp` an input. */
type Case = [string, string];

function run(version: 4 | 5 | 6, cases: Case[]): string[] {
  const fn = version === 4 ? "tostring" : "str.tostring";
  const head = version === 4
    ? "//@version=4\nstudy(\"t\")\nc = 0.1 + 0.2\ninp = input(0.1, type=input.float) + 0.2\n"
    : `//@version=${version}\nindicator("t")\nc = 0.1 + 0.2\nfloat inp = input.float(0.1) + 0.2\n`;
  const body = cases.map(([x]) => `    label.new(bar_index, high, ${fn}(${x}))`).join("\n");
  const src = `${head}if barstate.islast\n    s = close / close\n${body}\nplot(close)\n`;
  const s = new Session();
  s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "60", mintick: 0.01 });
  expect(s.compile(src).errors).toEqual([]);
  const r: any = s.runHistory(bars);
  expect(r.errors ?? []).toEqual([]);
  return r.drawings.filter((d: any) => d.kind === "label").map((d: any) => d.props.text);
}

function check(version: 4 | 5 | 6, cases: Case[]) {
  const got = run(version, cases);
  expect(got).toEqual(cases.map(([, expected]) => expected));
}

// Non-constant: the same on every version.
const SERIES: Case[] = [
  ["s * 1e15", "1000000000000000"],
  ["s * 1e16", "10000000000000000"],
  ["s * 123456789012345678", "123456789012345680"],
  ["s * 1e20", "100000000000000000000"],
  ["s * 1e21", "1E21"],
  ["s * 1.5e21", "1.5E21"],
  ["s * -1e21", "-1E21"],
  ["s * 1e22", "1E22"],
  ["s * 999999999999999999999.0", "1E21"],
  ["s * 5e-11", "0"],
  ["s * -5e-11", "0"],
  ["s * 4.9e-11", "0"],
  ["s * 6e-11", "0.0000000001"],
  ["s * -6e-11", "-0.0000000001"],
  ["s * 1.5e-10", "0.0000000001"],
  ["s * 2.5e-10", "0.0000000003"],
  ["s * -0.0000000004", "-0.0000000004"],
  ["s * 1e-7", "0.0000001"],
  ["s * 0.12345678905", "0.1234567891"],
  ["s * 0.12345678915", "0.1234567891"],
  ["s * 1.00000000005", "1.0000000001"],
  ["s * 7.00000000015", "7.0000000002"],
  ["close / 7", "14.2857142857"],
  ["s * -1.5", "-1.5"],
  ["s * 2", "2"],
  ["s * float(na)", "NaN"],
  ["s * 0.1 + s * 0.2", "0.3"],
  ["inp", "0.3"],
  ["syminfo.mintick / 3", "0.0033333333"],
];

describe("tostring(x) on a non-constant float", () => {
  it("v4", () => check(4, SERIES));
  it("v5", () => check(5, SERIES));
  it("v6", () => check(6, SERIES));
});

describe("tostring(x) on a constant", () => {
  const V45: Case[] = [
    ["c", "0.30000000000000004"],
    ["0.1 * 3", "0.30000000000000004"],
    ["0.1 + 0.2", "0.30000000000000004"],
    ["0.3 - 0.1", "0.19999999999999998"],
    ["0.1 + 0.2 + 0.3", "0.6000000000000001"],
    ["-0.1", "-0.1"],
    ["0.1 + 2", "2.1"],
    ["1e-7", "1e-7"],
    ["0.0000001", "1e-7"],
    ["1e21", "1e+21"],
    ["0.30000000000000004", "0.30000000000000004"],
    ["1.0 / 3.0", "0.3333333333333333"],
    ["0.123456789012345", "0.123456789012345"],
    ["123456789.123456", "123456789.123456"],
    ["5e-11", "5e-11"],
    ["math.pi", "3.141592653589793"],
    ["-(0.1 + 0.2)", "-0.30000000000000004"],
    ["2.0", "2"],
    ["12", "12"],
    ["1 / 3", "0"],
  ];
  const V6: Case[] = [
    ["c", "0.3"],
    ["0.1 * 3", "0.3"],
    ["0.1 + 0.2", "0.3"],
    ["0.3 - 0.1", "0.2"],
    ["0.1 + 0.2 + 0.3", "0.6"],
    ["-0.1", "-0.1"],
    ["0.1 + 2", "2.1"],
    ["1e-7", "0.0000001"],
    ["1e21", "1e+21"],
    ["0.30000000000000004", "0.3"],
    ["1.0 / 3.0", "0.3333333333"],
    ["0.123456789012345", "0.123456789"],
    ["5e-11", "0"],
    ["math.pi", "3.1415926536"],
    ["-(0.1 + 0.2)", "-0.3"],
    ["2.0", "2"],
    ["12", "12"],
  ];
  // v4 has no `math` namespace. `1 / 3` is 0 there too (v4-tostring-default).
  it("v4 prints the full double", () => check(4, V45.filter(([x]) => x !== "math.pi")));
  it("v5 prints the full double", () => check(5, V45));
  it("v6 prints ten decimals, with a lower-case exponent from 1e21", () => check(6, V6));

  it("a global that is reassigned, or declared inside a block, is not constant", () => {
    const src = (decl: string) =>
      `//@version=5\nindicator("t")\n${decl}\nlabel.new(bar_index, high, str.tostring(c))\nplot(close)\n`;
    const text = (decl: string) => {
      const s = new Session();
      expect(s.compile(src(decl)).errors).toEqual([]);
      return (s.runHistory(bars) as any).drawings[0].props.text;
    };
    expect(text("c = 0.1 + 0.2\nc := c * 1")).toBe("0.3");
    expect(text("var c = 0.1 + 0.2")).toBe("0.3");
    expect(text("c = 0.1 + 0.2")).toBe("0.30000000000000004");
  });
});

describe("v3 is unchanged", () => {
  it("tostring is the plain conversion, and no constant marker is emitted", () => {
    expect(coreTostring(0.1 + 0.2)).toBe("0.30000000000000004");
    expect(coreTostring(1e-7)).toBe("1e-7");
    expect(coreTostring(1e21)).toBe("1e+21");
    expect(coreTostring(NaN)).toBe("NaN");
    const js = transpile("//@version=3\nstudy(\"t\")\nx = tostring(0.1 + 0.2)\nplot(close)\n");
    expect(js).toContain("tostring");
    expect(js).not.toContain("const");
  });
});
