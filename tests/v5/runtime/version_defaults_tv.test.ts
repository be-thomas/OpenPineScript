/**
 * Version-dependent defaults, read off TradingView.
 *
 * A strategy with no `initial_capital` starts at 100,000 in v2/v3/v4/v6 and
 * 1,000,000 in v5. In v1-v4 the second argument of `strategy.entry` is the bool
 * `long`; a number converts the Pine way (non-zero true), so `entry("L", 1)`
 * opens a long.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const bars = Array.from({ length: 20 }, (_, i) => ({
  time: Date.UTC(2024, 0, 1) + i * 3_600_000, open: 100 + i, high: 110 + i, low: 90 + i, close: 100 + i, volume: 1,
}));

function run(src: string) {
  const s = new Session();
  s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "60" });
  const c = s.compile(src);
  expect(c.errors).toEqual([]);
  const r = s.runHistory(bars);
  expect(r.errors).toEqual([]);
  return (title: string, bar: number) => r.series.find((x: any) => x.title === title)!.data[bar]?.value ?? null;
}

describe("default initial_capital by version", () => {
  const cases: Array<[number, number]> = [[2, 100000], [3, 100000], [4, 100000], [5, 1000000], [6, 100000]];
  for (const [v, want] of cases) {
    it(`v${v} starts at ${want}`, () => {
      const at = run(`//@version=${v}\nstrategy("t")\nplot(strategy.equity, "eq")\nplot(strategy.initial_capital, "ic")\n`);
      expect(at("eq", 0)).toBe(want);
      expect(at("eq", 19)).toBe(want);
      expect(at("ic", 0)).toBe(want);
    });
  }
  for (const v of [5, 6]) {
    it(`v${v} explicit initial_capital wins`, () => {
      const at = run(`//@version=${v}\nstrategy("t", initial_capital=5000)\nplot(strategy.equity, "eq")\nplot(strategy.initial_capital, "ic")\n`);
      expect(at("eq", 0)).toBe(5000);
      expect(at("ic", 0)).toBe(5000);
    });
  }
});

describe("v1-v4 strategy.entry numeric long", () => {
  const pos = (v: number, arg: string) =>
    run(`//@version=${v}\nstrategy("t")\nif ${v < 4 ? "n" : "bar_index"} == 2\n    strategy.entry("X", ${arg})\nplot(strategy.position_size, "pos")\n`)("pos", 19);
  for (const v of [2, 3, 4]) {
    it(`v${v} entry(id, 1) is long`, () => expect(pos(v, "1")).toBeGreaterThan(0));
    it(`v${v} entry(id, 0) is short`, () => expect(pos(v, "0")).toBeLessThan(0));
  }
  it("v4 bool and constants unchanged", () => {
    expect(pos(4, "true")).toBeGreaterThan(0);
    expect(pos(4, "false")).toBeLessThan(0);
    expect(pos(4, "strategy.long")).toBeGreaterThan(0);
    expect(pos(4, "strategy.short")).toBeLessThan(0);
  });
});
