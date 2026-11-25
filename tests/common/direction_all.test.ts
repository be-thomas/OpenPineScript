/**
 * `strategy.direction.all` — TradingView compiles
 * `strategy.risk.allow_entry_in(strategy.direction.all)` at v2 through v6 and
 * both directions stay allowed: with longs at bar % 10 == 0 and shorts at
 * % 10 == 5 the position alternates between 1 and -1, reversals included
 * (dev-docs/tv-parity/_probes/corpus98/p2_v{2..6}_direction_all, BINANCE:BTCUSDT
 * 1h, 2026-11-14).
 */
import { describe, it, expect } from "vitest";
import { Session, type Candle } from "../../runtime/v1/session";

const bars: Candle[] = Array.from({ length: 30 }, (_, i) => ({
  time: Date.UTC(2025, 0, 1, i), open: 100, high: 101, low: 99, close: 100, volume: 1,
}));

function positionSizes(version: number, allow: string): number[] {
  const counter = version >= 4 ? "bar_index" : "n";
  const s = new Session();
  s.setChart({ timeframe: "60", symbol: "BINANCE:BTCUSDT" });
  const c = s.compile(`//@version=${version}
strategy("p2 v${version} direction.all")
strategy.risk.allow_entry_in(${allow})
if ${counter} % 10 == 0
    strategy.entry("L", strategy.long)
if ${counter} % 10 == 5
    strategy.entry("S", strategy.short)
plot(strategy.position_size, "ps")
`);
  expect(c.errors).toEqual([]);
  const r = s.runHistory(bars);
  return r.series.find(x => x.title === "ps")!.data.map((d: any) => Math.sign(d.value));
}

describe.each([2, 3, 4, 5, 6])("v%i strategy.direction.all", (version) => {
  it("allows both directions: the position alternates long and short", () => {
    const ps = positionSizes(version, "strategy.direction.all");
    // Orders fill on the next bar's open.
    expect(ps.slice(0, 22)).toEqual([
      0, 1, 1, 1, 1, 1, -1, -1, -1, -1,
      -1, 1, 1, 1, 1, 1, -1, -1, -1, -1,
      -1, 1,
    ]);
  });

  it("direction.long still blocks the shorts", () => {
    expect(positionSizes(version, "strategy.direction.long").every(x => x >= 0)).toBe(true);
  });
});
