/**
 * Max drawdown's peak on a bar with two closing fills: a reversal at the open, then a margin call on the
 * same bar. TradingView's peak is the cash right after the reversal, not what the margin call left.
 * TradingView n138 (v6, 100% of equity, BINANCE:BTCUSDT 1h from 2026-01-01, 777 trades, 344 margin calls):
 * 2026-06-07 21:00, long closed at the open 61878 (+873.91, cash 145651.49), the short it reversed into
 * margin-called at 62017.71 (-5.92). Max drawdown 31123.44 = 145651.49 - the 2026-08-19 trough; from the
 * cash after the margin call (145645.57) it was 31117.52. Synthetic bars here.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const H = 3600_000;
const T0 = Date.UTC(2026, 0, 5);

describe("max drawdown peak at a reversal followed by a same-bar margin call", () => {
  it("is the cash right after the reversal", () => {
    const s = new Session();
    s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "60", mintick: 0.01, mincontract: 1, timezone: "Etc/UTC", session: "24x7" } as any);
    expect(s.compile(`//@version=6
strategy("t", initial_capital = 1000, default_qty_type = strategy.percent_of_equity, default_qty_value = 100)
if bar_index == 0
    strategy.entry("L", strategy.long)
if bar_index == 1
    strategy.entry("S", strategy.short)`).errors).toEqual([]);
    // Long 10 at 100; the short placed at 110 fills at bar 2's open 109: the long books +90 (cash 1090) and the
    // short of 10 is margin-called at 113 (one contract, -4: cash 1086), 9 left, worth 1086 - 9 * 4 = 1050 there.
    const rows = [[100, 100, 100, 100], [100, 110, 100, 110], [109, 113, 109, 112], [112, 112, 111, 111], [111, 111, 111, 111]];
    const r: any = s.runHistory(rows.map(([open, high, low, close], i) => ({ time: T0 + i * H, open, high, low, close, volume: 1 })));
    expect(r.trades.map((t: any) => [t.direction, t.exitPrice, t.qty, t.pnl])).toEqual([["long", 109, 10, 90], ["short", 113, 1, -4]]);
    expect(r.position.size).toBe(-9);
    // Peak 1090 (after the reversal), trough 1050: 40. From the cash after the margin call (1086) it would be 36.
    expect(r.performance.all.maxDrawdown).toBeCloseTo(40, 9);
  });
});
