/**
 * A pending strategy.entry (stop or limit) is judged when the script places it,
 * as TradingView does, v4 to v6 (BINANCE:BTCUSDT 1h, 2026-11-14):
 *  - dev-docs/tv-parity/_probes/two-entries, p_two: placed while flat, a long
 *    stop and a short stop that both fill on one bar. The second only closes the
 *    first trade (an order of 1 against a position of 1); it does not reverse.
 *    The one the bar's path reaches first fills first (low nearer the open: the
 *    short stop below, then the long stop above).
 *  - p_pyr: placed while short 1 (pyramiding 1), the short stop never fills,
 *    before or after the long stop reverses the position on the same bar.
 *  - _probes/reversal-sizing, p_stopsize: a percent_of_equity entry is sized from
 *    strategy.equity when it was placed, divided by its fill price.
 * Monthly Returns in PineScript Strategies (v4) went from an extra reversal on
 * 2026-01-12 and ~18% quantity drift to all 22 trades in the window to the cent.
 */
import { describe, it, expect } from "vitest";
import { Session, type Candle } from "../../runtime/v1/session";

const H = 3600e3, T0 = Date.UTC(2026, 0, 1);
type Bar = [number, number, number, number];
const flat: Bar = [100, 101, 99, 100];

function run(version: number, body: string, ohlc: Bar[], head = "initial_capital = 100000") {
  const s = new Session();
  s.setChart({ symbol: "X", timeframe: "60", mintick: 0.01, timezone: "UTC", mincontract: 0.0001 } as any);
  const c = s.compile(`//@version=${version}\nstrategy("t", ${head})\n${body}`);
  expect(c.errors).toEqual([]);
  const bars: Candle[] = ohlc.map(([open, high, low, close], i) => ({ time: T0 + i * H, open, high, low, close, volume: 1 }));
  const r: any = s.runHistory(bars);
  return { trades: r.trades.map((t: any) => [t.entryPrice, t.exitPrice, t.qty ?? t.size]), pos: r.position.size };
}

describe.each([4, 5, 6])("v%i pending strategy.entry judged at placement", (version) => {
  it("placed while flat, the second stop on the bar only closes the first trade", () => {
    // Bar 2: open 100, high 104 (nearer), low 90: the long stop 103 fills first, then the short stop 96.
    const r = run(version, `if bar_index == 1
    strategy.entry("L", strategy.long, qty = 1, stop = 103)
    strategy.entry("S", strategy.short, qty = 1, stop = 96)
`, [flat, flat, [100, 104, 90, 95], [95, 96, 94, 95]]);
    expect(r.trades).toEqual([[103, 96, 1]]);
    expect(r.pos).toBe(0);
  });

  it("fills the entries in the order the bar's path reaches them", () => {
    // Bar 2: open 100, low 96 (nearer), high 110: the short stop 97 fills first, the long stop 108 closes it.
    const r = run(version, `if bar_index == 1
    strategy.entry("L", strategy.long, qty = 1, stop = 108)
    strategy.entry("S", strategy.short, qty = 1, stop = 97)
`, [flat, flat, [100, 110, 96, 104], [104, 105, 103, 104]]);
    expect(r.trades).toEqual([[97, 108, 1]]);
    expect(r.pos).toBe(0);
  });

  it("placed while pyramiding is full on its side, the order is not live", () => {
    // Short 1 at bar 1's open; on bar 2 both stops are placed; bar 3 (high nearer) reaches the long stop
    // 103 (a reversal of 2: long 1), then its low passes the short stop 96, which never fills.
    const r = run(version, `if bar_index == 0
    strategy.entry("S0", strategy.short, qty = 1)
if bar_index == 2
    strategy.entry("L", strategy.long, qty = 1, stop = 103)
    strategy.entry("S", strategy.short, qty = 1, stop = 96)
`, [flat, flat, flat, [100, 104, 90, 95], [95, 96, 94, 95]]);
    expect(r.trades).toEqual([[100, 103, 1]]);
    expect(r.pos).toBe(1);
  });

  it("sizes percent_of_equity from the equity when the order was placed, at the fill price", () => {
    // Long 50% of 100000 at 100 (500). Bar 3 closes at 120 (equity 110000) and places a short stop at 110;
    // bar 4 opens at 120 and falls through it. 110000 * 0.5 / 110 = 500; equity at the fill (105000)
    // would give 477.2727.
    const r = run(version, `if bar_index == 0
    strategy.entry("L", strategy.long)
if bar_index == 3
    strategy.entry("S", strategy.short, stop = 110)
`, [flat, flat, [110, 111, 109, 110], [120, 121, 119, 120], [120, 121, 100, 101], [101, 102, 100, 101]],
      "initial_capital = 100000, default_qty_type = strategy.percent_of_equity, default_qty_value = 50");
    expect(r.trades).toEqual([[100, 110, 500]]);
    expect(r.pos).toBe(-500);
  });
});

describe.each([4, 5, 6])("v%i pending strategy.entry: placed while flat, it only nets", (version) => {
  it("a stop placed while flat only closes a short opened since, it does not reverse it", () => {
    // The long stop 120 is placed once, flat, on bar 1. A short market entry placed on bar 2 opens at bar 3's
    // open (100). Bar 5 reaches 120: the order is the 1 it was placed as, so it closes the short and opens nothing.
    // TradingView n56 (v5, 2026-10-12 13:00): a short stop of 0.12118 placed flat, against a long of 0.11874 that
    // filled on a later bar, closed it and opened 0.00244 (credited to the short's signal). Before that capture
    // the engine reversed here, a reading no capture had settled.
    const r = run(version, `if bar_index == 1
    strategy.entry("L", strategy.long, qty = 1, stop = 120)
if bar_index == 2
    strategy.entry("S", strategy.short, qty = 1)
`, [flat, flat, flat, flat, flat, [100, 121, 99, 100], [100, 101, 99, 100]]);
    expect(r.trades).toEqual([[100, 120, 1]]);
    expect(r.pos).toBe(0);
  });

  it("a stop-limit sorts by when its stop triggers, not by when its limit is first touched", () => {
    // Bar 2 opens at 105 with the low (100) nearer than the high (115), so the path is 105, 100, 115, close.
    // The short stop 104 is reached on the way down (a fifth of the way along). The long stop-limit (stop
    // 110, limit 112) only triggers on the way up, two thirds of the way along; its limit alone (a buy limit,
    // touched at the open) would have put it first. So the short fills first, at 104, and the long order then
    // fills against that short: placed while flat, it nets, closing the 1 short and not reversing. It fills
    // as a limit at the open's side of 112, i.e. at 105, the engine's rule for a limit the open has passed.
    const r = run(version, `if bar_index == 1
    strategy.entry("L", strategy.long, qty = 1, stop = 110, limit = 112)
    strategy.entry("S", strategy.short, qty = 1, stop = 104)
`, [flat, flat, [105, 115, 100, 110], [110, 111, 109, 110]]);
    expect(r.trades).toEqual([[104, 105, 1]]);
    expect(r.pos).toBe(0);
  });
});

describe("v5 strategy.default_entry_qty", () => {
  it("is strategy.equity * percent / price, with a position open and the price moving", () => {
    const s = new Session();
    s.setChart({ symbol: "X", timeframe: "60", mintick: 0.01, timezone: "UTC" } as any);
    const c = s.compile(`//@version=5
strategy("t", initial_capital = 100000, default_qty_type = strategy.percent_of_equity, default_qty_value = 50)
if bar_index == 0
    strategy.entry("L", strategy.long)
plot(strategy.default_entry_qty(close), "q")
plot(strategy.equity * 50 / 100 / close, "e")
`);
    expect(c.errors).toEqual([]);
    const closes = [100, 104, 99, 112, 95, 108];
    const bars: Candle[] = closes.map((close, i) => ({
      time: T0 + i * H, open: close, high: close + 1, low: close - 1, close, volume: 1,
    }));
    const r: any = s.runHistory(bars);
    const col = (t: string) => r.series.find((x: any) => x.title === t).data.map((d: any) => d.value);
    const q = col("q"), e = col("e");
    expect(new Set(q).size).toBeGreaterThan(3);
    for (let i = 0; i < closes.length; i++) expect(q[i]).toBeCloseTo(e[i], 9);
  });
});

// v2 and v3 size a percent_of_equity stop entry the same way (_probes/reversal-sizing, runs
// p_stopsize_v2 and p_stopsize_v3: the short is 6.3654, as at v4-v6); the other rules above
// were probed at v4-v6 only.
describe.each([2, 3])("v%i percent_of_equity sizing", (version) => {
  it("sizes a stop entry from the equity when it was placed, at the fill price", () => {
    const r = run(version, `if n == 0
    strategy.entry("L", strategy.long)
if n == 3
    strategy.entry("S", strategy.short, stop = 110)
`, [flat, flat, [110, 111, 109, 110], [120, 121, 119, 120], [120, 121, 100, 101], [101, 102, 100, 101]],
      "initial_capital = 100000, default_qty_type = strategy.percent_of_equity, default_qty_value = 50");
    expect(r.trades).toEqual([[100, 110, 500]]);
    expect(r.pos).toBe(-500);
  });
});
