/**
 * A limit exactly at a bar's high must fill on that bar, in every Pine version (calc_on_order_fills probed on v4, v5, v6).
 * TradingView v4 probe dev-docs/tv-parity/_probes/version-scope/v4-cof, trade 146:
 * enters and exits on 2026-08-30 17:00 at 79337.93 (bar open = high = 79337.93,
 * exit limit = open + (high - open) * 0.5). `levelToTick` returned
 * 79337.93000000001 there, so `high >= limit` was false and the exit slipped.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const P = 79337.93;
const bars = [
  { time: 0, open: 79000, high: 79400, low: 78900, close: 79100, volume: 1 },
  { time: 3600e3, open: P, high: P, low: 79000, close: 79100, volume: 1 },
  { time: 7200e3, open: 79100, high: 79500, low: 79000, close: 79300, volume: 1 },
];

function run(version: number) {
  const src = `//@version=${version}
strategy("t", overlay = true, calc_on_order_fills = true)
if bar_index == 0
    strategy.entry("L", strategy.long)
if strategy.position_size > 0 and bar_index == 1
    strategy.exit("X", "L", limit = ${P})
`;
  const s = new Session();
  s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "60", mintick: 0.01, type: "crypto", currency: "USDT", basecurrency: "BTC", timezone: "Etc/UTC", session: "24x7" } as any);
  const c = s.compile(src);
  expect(c.errors).toEqual([]);
  return s.runHistory(bars as any);
}

describe("limit at the bar's own high", () => {
  for (const v of [4, 5, 6]) {
    it(`v${v}: fills on that bar at exactly ${P}`, () => {
      const r: any = run(v);
      expect(r.errors ?? []).toEqual([]);
      expect(r.trades).toHaveLength(1);
      expect(r.trades[0].exitBarIndex).toBe(1);
      expect(r.trades[0].exitPrice).toBe(P);
    });
  }
});
