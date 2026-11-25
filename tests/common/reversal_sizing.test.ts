/**
 * A percent_of_equity entry that reverses a position is sized from the equity
 * at the price it fills at, and quantities floor to syminfo.mincontract at
 * every version from v2. TradingView, BINANCE:BTCUSDT 1h, 100% of equity, a
 * long then two reversals (dev-docs/tv-parity/_probes/reversal-sizing,
 * 2026-11-14), v2, v3, v4 and v5 alike: long 0.06482 (5000 / 77132.58 =
 * 0.0648234, floored), the reversal short -0.06482 (equity at the fill /
 * the fill price: with all the equity in the long that is the long's own
 * size), then long 0.0723. Also with a 0.0025% commission (run c4). v6 is left out
 * here: at its default 1x leverage the short is margin-called on the reversal bar.
 *
 * The engine marked the open position at the fill bar's CLOSE, which is not
 * known when a market order fills at the open: it sized the short 0.06491.
 * And v2/v3 did not floor (0.064823).
 */
import { describe, it, expect } from "vitest";
import { Session, type Candle } from "../../runtime/v1/session";

const H = 3600e3, T0 = Date.UTC(2026, 0, 1);
// Bar 2 opens the long at 100. Bar 5 reverses at its open, 120, and closes far
// higher, at 150: marking at the close would size the short from the wrong equity.
const ohlc: [number, number, number, number][] = [
  [100, 101, 99, 100], [100, 101, 99, 100], [100, 101, 99, 100],
  [110, 111, 109, 110], [110, 111, 109, 120], [120, 151, 119, 150], [150, 151, 149, 150],
];
const bars: Candle[] = ohlc.map(([open, high, low, close], i) => ({ time: T0 + i * H, open, high, low, close, volume: 1 }));

function run(version: number) {
  const s = new Session();
  s.setChart({ symbol: "X", timeframe: "60", mintick: 0.01, timezone: "UTC", mincontract: 0.001 } as any);
  const n = version >= 4 ? "bar_index" : "n";
  const long = version >= 4 ? "strategy.long" : "strategy.long";
  const c = s.compile(`//@version=${version}
strategy("rev", initial_capital = 1000, default_qty_type = strategy.percent_of_equity, default_qty_value = 100)
if ${n} == 1
    strategy.entry("L", ${long})
if ${n} == 4
    strategy.entry("S", strategy.short)
`);
  expect(c.errors).toEqual([]);
  const r: any = s.runHistory(bars);
  return { trades: r.trades.map((t: any) => [t.entryPrice, t.exitPrice, t.qty ?? t.size]), pos: r.position.size };
}

describe.each([2, 3, 4, 5])("v%i a reversal sized by percent_of_equity", (version) => {
  it("sizes the new leg from the equity at the fill price, floored to mincontract", () => {
    const r = run(version);
    // Long 1000 / 100 = 10 at 100; at the reversal's open, 120, equity is 1000 + 20 * 10 = 1200,
    // so the short is 1200 / 120 = 10 — not (1000 + 50 * 10) / 120 = 12.5 from the close of 150.
    expect(r.trades).toEqual([[100, 120, 10]]);
    expect(r.pos).toBe(-10);
  });
});

describe.each([2, 3])("v%i quantities floor to mincontract", (version) => {
  it("1000 / 101.37 is 9.864, not 9.86485...", () => {
    const s = new Session();
    s.setChart({ symbol: "X", timeframe: "60", mintick: 0.01, timezone: "UTC", mincontract: 0.001 } as any);
    const c = s.compile(`//@version=${version}
strategy("floor", initial_capital = 1000, default_qty_type = strategy.percent_of_equity, default_qty_value = 100)
if n == 1
    strategy.entry("L", strategy.long)
`);
    expect(c.errors).toEqual([]);
    // The placing bar's close and the fill bar's open both 101.37: v2/v3 size a market entry at
    // the placing close, as v6 does (tests/common/order_price_sizing_tv.test.ts).
    const b = bars.map((x, i) => i === 2 ? { ...x, open: 101.37 } : i === 1 ? { ...x, close: 101.37 } : x);
    const r: any = s.runHistory(b);
    expect(r.position.size).toBe(9.864);
  });
});
