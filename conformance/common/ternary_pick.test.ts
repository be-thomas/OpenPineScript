/** v1-v3 ternaries go through the internal `opsv2_$pick` helper: eager, and no name a script can collide with. */
import { describe, it, expect } from "vitest";
import { Session } from "../../index";

const bars = Array.from({ length: 5 }, (_, i) => ({
  time: 1_600_000_000_000 + i * 86_400_000, open: 10 + i, high: 12 + i, low: 9, close: 11 + i, volume: 5,
}));

function run(src: string): number[] {
  const s = new Session();
  s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "D", mintick: 0.01, timezone: "UTC", type: "crypto" });
  expect(s.compile(src).errors).toEqual([]);
  const result: any = s.runHistory(bars);
  expect(result.errors).toEqual([]);
  return result.series[0].data.map((d: any) => d?.value);
}

describe("v1-v3 ternary helper", () => {
  it("nested ternaries pick the right branch", () => {
    expect(run('//@version=3\nstudy("t")\nplot(close > 12 ? (close > 13 ? 1 : 2) : 3)\n')).toEqual([3, 3, 2, 1, 1]);
  });

  it("a script variable named pick does not collide with the helper", () => {
    expect(run('//@version=3\nstudy("t")\npick = close > 12 ? 1 : 2\nplot(pick)\n')).toEqual([2, 2, 1, 1, 1]);
  });

  it("evaluates both branches, the condition first", () => {
    const src = '//@version=3\nstudy("t")\nplot(close > 12 ? sma(close, 2) : sma(close, 3))\n';
    expect(run(src).length).toBe(5);
  });
});
