/**
 * v6 margin (100% by default) on a market reversal sized at 100% of equity.
 *
 * TradingView probe triage r6 s1strat/01 (BINANCE:BTCUSDT 1h from 2026-01-01, v6 defaults, a reversal
 * every 7 bars, 1852 closed trades):
 *  - The entry is ADMITTED against the equity it was placed with (the placing bar's close), at the price
 *    it fills at: on 2026-01-28 18:00 the short of 1.01649 at 90169.89 needed 91656.7915 against 91656.785
 *    at 17:00's close and was refused (the long stayed open until the next short signal), although the
 *    equity at the fill, 91656.7948, would have funded it.
 *  - An admitted entry whose fill leaves the funds short is margin-called at its FILL price first:
 *    2026-04-23 01:00, long 1.00107 filled at 78424.3 (the open), one contract liquidated at 78424.3 with
 *    a profit of 0, 0.00107 kept; not at the bar's low.
 * With both rules every one of the 1852 trades and the report match. Synthetic bars here.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const H = 3600_000;
const T0 = Date.UTC(2026, 0, 5);
type B = [number, number, number, number];
const mk = (rows: B[]) => rows.map(([open, high, low, close], i) => ({ time: T0 + i * H, open, high, low, close, volume: 1 }));

function run(src: string, rows: B[]) {
  const s = new Session();
  s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "60", mintick: 0.01, mincontract: 1, timezone: "Etc/UTC", session: "24x7" } as any);
  const c = s.compile(src);
  expect(c.errors).toEqual([]);
  const r: any = s.runHistory(mk(rows));
  expect(r.errors ?? []).toEqual([]);
  return r;
}

describe("v6 margin on a 100%-of-equity reversal", () => {
  it("is admitted against the placing bar's equity at the fill price: a fill one tick worse is refused", () => {
    // long 10 at 100; at bar 1's close (110) equity is 1100 and the short is 10. It fills at 110.01:
    // 10 * 110.01 = 1100.1 > 1100. Equity at the fill (1100.1) would have funded it.
    const r = run(`//@version=6
strategy("t", initial_capital = 1000)
if bar_index == 0
    strategy.entry("L", strategy.long)
if bar_index == 1
    strategy.entry("S", strategy.short)`,
      [[100, 100, 100, 100], [100, 110, 100, 110], [110.01, 110.01, 110, 110], [110, 110, 110, 110]]);
    expect(r.trades.length).toBe(0);
    expect(r.position.size).toBe(10);
  });

  it("an admitted entry the fill leaves under-funded is margin-called at its fill price", () => {
    // short 10 at 100; bar 1 closes 99.95 (equity 1000.5): long 10 placed, filled at 100.04 = 1000.4 <= 1000.5.
    // At the fill the equity is 999.6, 0.8 short of the 1000.4 margin: one contract goes at 100.04, not at the low 99.
    const r = run(`//@version=6
strategy("t", initial_capital = 1000)
if bar_index == 0
    strategy.entry("S", strategy.short)
if bar_index == 1
    strategy.entry("L", strategy.long)`,
      [[100, 100, 100, 100], [100, 100, 99.95, 99.95], [100.04, 100.5, 99, 100], [100, 100, 100, 100]]);
    const call = r.trades.find((t: any) => t.direction === "long");
    expect(call).toBeDefined();
    expect(call.exitPrice).toBe(100.04);
    expect(call.qty).toBe(1);
    expect(call.pnl).toBe(0);
    expect(r.position.size).toBe(9);
  });
});

describe("the order quantity's floor to the minimum contract", () => {
  it("floors a quotient 3e-5 short of a whole step (only float noise rounds up)", () => {
    // n139 (v6, 100% of equity): 90454.8556797998 / 63260.01 = 1.42988999970 -> 1.42988 on TradingView;
    // a slack of 1e-9 of the quotient (142988.99997) rounded it up to 1.42989.
    const s = new Session();
    s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "60", mintick: 0.01, mincontract: 0.00001, timezone: "Etc/UTC", session: "24x7" } as any);
    expect(s.compile(`//@version=6
strategy("t", initial_capital = 90454.8556797998)
if bar_index == 0
    strategy.entry("L", strategy.long)`).errors).toEqual([]);
    const r: any = s.runHistory(mk([[63260.01, 63260.01, 63260.01, 63260.01], [63260.01, 63260.01, 63260.01, 63260.01], [63260.01, 63260.01, 63260.01, 63260.01]]));
    expect(r.position.size).toBe(1.42988);
  });
});
