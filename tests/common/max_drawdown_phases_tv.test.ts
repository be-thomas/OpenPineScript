/**
 * Max drawdown after a partial take-profit, and on a forming bar.
 *
 * - The realized peak is the cash, commissions already paid. Adding the open entries' commission back
 *   raised it after a partial exit: TradingView n3 (v6, process_orders_on_close, qty_percent closes)
 *   reports 168.05; that reading gave 168.34, the cash 168.05. The other bar-path cases (n4, n5, n12,
 *   n15, n16, n23, n28, n35, n52, n55, n67, n94, n95, n98, n99, n107, n111) match either way.
 * - A forming bar (live ticks, the load pass) has no emulated path: its extreme so far counts whatever
 *   the order of its ticks. TradingView n157: a stop filled on the live bar at 62529.9, report max
 *   drawdown 480.38 = that bar's low 62049.52 against it (the low lies before the fill on the
 *   emulator's path, which would have given 123.97).
 * Synthetic bars here.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../runtime/v1/session";

const H = 3600_000, T0 = Date.UTC(2026, 0, 5);
type B = [number, number, number, number];
const mk = (rows: B[]) => rows.map(([open, high, low, close], i) => ({ time: T0 + i * H, open, high, low, close, volume: 1 }));

function session(src: string) {
  const s = new Session();
  s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "60", mintick: 0.01, timezone: "Etc/UTC", session: "24x7" } as any);
  expect(s.compile(src).errors).toEqual([]);
  return s;
}

describe("max drawdown", () => {
  it("after a partial exit the realized peak is the cash, not cash + the open entries' commission", () => {
    // 2 bought at 100 (fee 2); 1 sold at 110 (fee 1.1): cash 1006.9, the open entry's fee share 1.
    // Bar 3's low 95: worst 1006.9 - 5 = 1001.9, a drawdown of 5 (6 with the fee added back).
    const s = session(`//@version=5
strategy("t", initial_capital = 1000, default_qty_type = strategy.fixed, default_qty_value = 2, commission_type = strategy.commission.percent, commission_value = 1)
if bar_index == 0
    strategy.entry("L", strategy.long)
if bar_index == 1
    strategy.close("L", qty_percent = 50)`);
    const r: any = s.runHistory(mk([[100, 100, 100, 100], [100, 100, 100, 110], [110, 110, 110, 110], [100, 100, 95, 100], [100, 100, 100, 100]]));
    expect(r.errors).toEqual([]);
    expect(r.performance.all.maxDrawdown).toBeCloseTo(5, 9);
  });

  it("a forming bar counts its extreme so far, not the emulated path after the fill", () => {
    // A long stop at 105 fills on the live bar (open 100, low 95, high 106): on the emulator's path the
    // low comes first (drawdown 0 after the fill), but the bar is forming: its low counts, 105 - 95 = 10.
    const s = session(`//@version=5
strategy("t", initial_capital = 1000, default_qty_type = strategy.fixed, default_qty_value = 1)
if bar_index == 1
    strategy.entry("L", strategy.long, stop = 105)`);
    const bars = mk([[100, 100, 100, 100], [100, 100, 100, 100], [100, 106, 95, 100]]);
    s.runHistory(bars.slice(0, 2), { realtimeFollows: { time: bars[2].time } } as any);
    s.tick(bars[2], { loadPass: true });
    const ctx: any = (s as any).ctx;
    expect(ctx.position.size).toBe(1);
    expect(ctx.maxEquityDrawdown(true).drawdown).toBeCloseTo(10, 9);
  });
});
