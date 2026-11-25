/**
 * The open position's entry commission is in strategy.grossloss and in the report's gross loss.
 *
 * TradingView probes triage r6 fin-strat (BINANCE:BTCUSDT 1h, commission 0.1%, one closed losing trade
 * and a long left open):
 *  - 01 (v5): plot(strategy.grossloss) = 2689.968 = the closed loss 2631.103 + the open trade's
 *    commission 58.866; the report's gross loss is 2689.97 and its net profit -1361.36 = -2689.97 + the
 *    open position's P&L at the captured close (1328.61, gross of fees).
 *  - 02 (v6): Pine Logs grossloss = 2689.692, netprofit = -2689.692 (closed -2631.10 less the open fee
 *    58.589), openprofit 1889.85 = close - entry, gross of fees.
 * Synthetic bars here.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../runtime/v1/session";

const H = 3600_000, T0 = Date.UTC(2026, 0, 5);
const px = [100, 100, 90, 90, 90, 95, 96];
const bars = px.map((c, i) => ({ time: T0 + i * H, open: c, high: c, low: c, close: c, volume: 1 }));

describe("the open entry commission", () => {
  for (const v of [5, 6]) it(`v${v}: is in strategy.grossloss and netprofit, not in openprofit, and in the report`, () => {
    const s = new Session();
    s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "60", mintick: 0.01 } as any);
    expect(s.compile(`//@version=${v}
strategy("t", default_qty_type = strategy.fixed, default_qty_value = 1, commission_type = strategy.commission.percent, commission_value = 0.1)
if bar_index == 0
    strategy.entry("A", strategy.long)
if bar_index == 1
    strategy.close("A")
if bar_index == 3
    strategy.entry("B", strategy.long)
plot(strategy.grossloss, "gl")
plot(strategy.netprofit, "np")
plot(strategy.openprofit, "op")`).errors).toEqual([]);
    const r: any = s.runHistory(bars);
    expect(r.errors).toEqual([]);
    const last = (t: string) => r.series.find((x: any) => x.title === t).data.at(-1).value;
    // A: bought 100, sold 90 at bar 2's open: -10 - 0.1 - 0.09. B: bought 90 at bar 4's open, fee 0.09.
    const closedLoss = 10 + 0.1 + 0.09, openFee = 0.09;
    expect(last("gl")).toBeCloseTo(closedLoss + openFee, 9);
    expect(last("np")).toBeCloseTo(-(closedLoss + openFee), 9);
    expect(last("op")).toBeCloseTo(96 - 90, 9);
    expect(r.performance.all.grossLoss).toBeCloseTo(closedLoss + openFee, 9);
    expect(r.performance.all.netProfit).toBeCloseTo(-(closedLoss + openFee), 9);
  });
});
