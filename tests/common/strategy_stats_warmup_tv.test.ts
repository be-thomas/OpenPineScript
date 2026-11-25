/**
 * TradingView parity, round 3 (strategies whose window trades matched but whose history or report did not).
 * Every behaviour below was read off TradingView captures of whole-history strategy runs on BINANCE:BTCUSDT 1h
 * (trade lists from 2026-01-01 and the Strategy report); the data here is synthetic.
 *
 * - ta.sum / v2 `sum` is na while an `na` is in its window and recovers once it leaves (CMOav-style
 *   `sum(close - close[1], n)` scripts entered 200 bars late; with `na` counted as 0 the first trade of a
 *   VHF strategy came an hour early).
 * - The `tr` variable is ta.tr(false): na on the first bar (ADX strategies at v2-v5 traded a bar early).
 * - ta.highest / ta.lowest skip `na` values in their window (Stochastic RSI entered 11 bars late).
 * - Max drawdown: the bar's extreme before an entry fills at its close, or before a stop entry is reached
 *   on the bar's path, is not drawn down by the new position; at a reversal the peak is the realized cash
 *   before the new entry's commission.
 * - strategy.cash sizing is in the strategy's currency, converted at the entry bar's rate.
 * - A qty_percent exit is floored to syminfo.mincontract.
 * - strategy.risk.allow_entry_in takes its direction from an input, and an entry the other way exits.
 * - timestamp("YYYY-MM-DD:hh:mm") with no zone is UTC whatever the host's zone.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../runtime/v1/session";

const H = 3_600_000;
const T0 = Date.UTC(2026, 0, 1);

function bars(n: number, f: (i: number) => [number, number, number, number]) {
  return Array.from({ length: n }, (_, i) => { const [o, h, l, c] = f(i); return { time: T0 + i * H, open: o, high: h, low: l, close: c, volume: 1 }; });
}
const wave = bars(80, i => { const c = 100 + 10 * Math.sin(i / 3); return [c - 0.5, c + 2, c - 2, c]; });

function run(src: string, candles = wave, chart: any = {}, setup?: (s: Session) => void) {
  const s = new Session();
  s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "60", mintick: 0.01, timezone: "Etc/UTC", ...chart });
  setup?.(s);
  const c = s.compile(src);
  expect(c.errors).toEqual([]);
  const r: any = s.runHistory(candles);
  expect(r.errors ?? []).toEqual([]);
  return r;
}
const series = (r: any, title: string) => r.series.find((x: any) => x.title === title).data
  .map((p: any) => p == null ? NaN : typeof p === "number" ? p : (p.value ?? NaN));
const firstValue = (xs: number[]) => xs.findIndex(v => !Number.isNaN(v));

describe("warm-up of windowed functions over a source with a leading na", () => {
  it("sum is na while the window holds an na, then exact", () => {
    const r = run(`//@version=2\nstudy("t")\nm = close - close[1]\nplot(sum(m, 5), title="s")\nplot(m, title="m")`);
    const s = series(r, "s"), m = series(r, "m");
    expect(firstValue(s)).toBe(5);                       // bar 0's na leaves the 5-bar window on bar 5
    for (let i = 5; i < 80; i++) expect(s[i]).toBeCloseTo(m.slice(i - 4, i + 1).reduce((a, b) => a + b, 0), 9);
  });

  it("an na in the middle of the source blanks only the bars whose window holds it", () => {
    const r = run(`//@version=5\nindicator("t")\nx = bar_index == 20 ? na : 1.0\nplot(math.sum(x, 3), title="s")`);
    const s = series(r, "s");
    expect([s[19], s[20], s[21], s[22], s[23]]).toEqual([3, NaN, NaN, NaN, 3]);
  });

  it("the tr variable is na on the first bar; ta.tr(true) is high - low there", () => {
    const r = run(`//@version=5\nindicator("t")\nplot(ta.tr, title="a")\nplot(ta.tr(true), title="b")\nplot(ta.tr(false), title="c")\nplot(ta.atr(3), title="d")`);
    expect(series(r, "a")[0]).toBeNaN();
    expect(series(r, "c")[0]).toBeNaN();
    expect(series(r, "b")[0]).toBeCloseTo(4, 9);
    expect(series(r, "a")[1]).toBe(series(r, "b")[1]);
    expect(firstValue(series(r, "d"))).toBe(2);           // ta.atr keeps its own first-bar range
    const v2 = run(`//@version=2\nstudy("t")\nplot(tr, title="a")`);
    expect(series(v2, "a")[0]).toBeNaN();
  });

  it("highest / lowest skip na: a window that is partly na has the extreme of the rest", () => {
    const r = run(`//@version=5\nindicator("t")\nx = bar_index < 3 ? na : close\nplot(ta.highest(x, 5), title="h")\nplot(ta.lowest(x, 5), title="l")\nplot(ta.stoch(x, x, x, 5), title="k")`);
    const c = wave.map(b => b.close);
    expect(firstValue(series(r, "h"))).toBe(4);           // warm (5 bars seen), two values in the window
    expect(series(r, "h")[4]).toBe(Math.max(c[3], c[4]));
    expect(series(r, "l")[4]).toBe(Math.min(c[3], c[4]));
    expect(firstValue(series(r, "k"))).toBe(4);
    expect(series(r, "h")[10]).toBe(Math.max(...c.slice(6, 11)));
  });
});

describe("max drawdown around fills inside the bar", () => {
  it("an entry at the close of a bar is not drawn down by that bar's range", () => {
    // Long at bar 2's close (100); bar 2's low is 90, every later bar stays within 99..101.
    const c = bars(8, i => i === 2 ? [100, 101, 90, 100] : [100, 101, 99, 100]);
    const r = run(`//@version=5\nstrategy("t", process_orders_on_close=true)\nif bar_index == 2\n    strategy.entry("L", strategy.long)`, c);
    expect(r.position.size).toBe(1);
    expect(r.performance.all.maxDrawdown).toBeCloseTo(1, 9);   // 100 - 99 on the bars after, not 100 - 90
  });

  it("a long stop entry on a bar whose low came first is not drawn down to that low", () => {
    // Bar 3: open 100, low 95 (nearer the open), then high 108: the stop at 105 fills after the low.
    const c = bars(8, i => i === 3 ? [100, 108, 95, 106] : i > 3 ? [106, 107, 104, 106] : [100, 101, 99, 100]);
    const r = run(`//@version=5\nstrategy("t")\nif bar_index == 2\n    strategy.entry("L", strategy.long, stop=105)`, c);
    expect(r.trades.length + Math.abs(r.position.size)).toBe(1);
    expect(r.position.avgPrice).toBe(105);
    expect(r.performance.all.maxDrawdown).toBeCloseTo(1, 9);   // 105 - 104 later; the 95 came before the fill
  });

  it("the trough before an exit inside the bar counts with the position held then", () => {
    // Long 1 from bar 1's open (100). Bar 3: open 100, low 92 (nearer), high 112: the limit at 110 exits after the low.
    const c = bars(6, i => i === 3 ? [100, 112, 92, 111] : [100, 101, 99, 100]);
    const r = run(`//@version=5\nstrategy("t")\nif bar_index == 0\n    strategy.entry("L", strategy.long)\nstrategy.exit("X", "L", limit=110)`, c);
    expect(r.trades.length).toBe(1);
    expect(r.performance.all.maxDrawdown).toBeCloseTo(8, 9);   // 100 - 92, before the exit at 110
  });

  it("at a reversal the peak is the cash the closed trade realized, before the new entry's commission", () => {
    // Long 1 at bar 1's open (102) closed by a short at bar 5's open (110), commission 1%. The long's entry fee
    // (1.02) is a drawdown of 1.02; at the reversal the realized peak is 8 - 1.02 - 1.10 = 5.88, and the short's
    // own fee (1.10) then takes the cash to 4.78 while the price stays at 110: a drawdown of 1.10.
    const c = bars(8, i => i < 5 ? [100 + 2 * i, 100 + 2 * i, 100 + 2 * i, 100 + 2 * i] : [110, 110, 110, 110]);
    const r = run(`//@version=5\nstrategy("t", commission_type=strategy.commission.percent, commission_value=1)\nif bar_index == 0\n    strategy.entry("L", strategy.long)\nif bar_index == 4\n    strategy.entry("S", strategy.short)`, c);
    expect(r.trades.length).toBe(1);
    expect(r.trades[0].pnl).toBeCloseTo(8 - 1.02 - 1.1, 9);
    expect(r.performance.all.maxDrawdown).toBeCloseTo(1.1, 9);
  });
});

describe("orders and risk rules", () => {
  it("strategy.cash sizes in the strategy's currency, converted at the entry bar's rate", () => {
    const c = bars(6, () => [100, 100, 100, 100]);
    const r = run(`//@version=5\nstrategy("t", currency=currency.USD, default_qty_type=strategy.cash, default_qty_value=1000)\nif bar_index == 1\n    strategy.entry("L", strategy.long)`,
      c, { currency: "USDT", mincontract: 0.00001 }, s => s.provideCurrencyRate("USDT", "USD", [{ time: T0, value: 0.8 }]));
    // 1000 USD buys 1000 / (100 USDT * 0.8 USD/USDT) = 12.5, not 10
    expect(r.position.size).toBeCloseTo(12.5, 9);
  });

  it("a qty_percent exit is floored to the minimum contract; the full exit takes the rest", () => {
    const c = bars(8, i => i < 3 ? [100, 100, 100, 100] : [100, 125, 100, 120]);
    const r = run(`//@version=5\nstrategy("t", default_qty_type=strategy.fixed, default_qty_value=0.01209)\nif bar_index == 1\n    strategy.entry("L", strategy.long)\nstrategy.exit("H", "L", qty_percent=50, limit=110)\nstrategy.exit("F", "L", limit=120)`,
      c, { mincontract: 0.00001 });
    expect(r.trades.map((t: any) => +t.qty.toFixed(8))).toEqual([0.00604, 0.00605]);
  });

  it("allow_entry_in reads its direction from an input, and an entry the other way exits the position", () => {
    const src = `//@version=4\nstrategy("t")\nd = input(title="D", defval=strategy.direction.long, options=[strategy.direction.all, strategy.direction.long, strategy.direction.short])\nstrategy.risk.allow_entry_in(d)\nif bar_index == 2\n    strategy.entry("B", strategy.long)\nif bar_index == 5\n    strategy.entry("S", strategy.short)\nif bar_index == 8\n    strategy.entry("S", strategy.short)`;
    const r = run(src, bars(12, i => [100 + i, 101 + i, 99 + i, 100 + i]));
    expect(r.trades.length).toBe(1);
    expect(r.trades[0].direction).toBe("long");
    expect(r.trades[0].entryTime).toBe(T0 + 3 * H);
    expect(r.trades[0].exitTime).toBe(T0 + 6 * H);      // the forbidden short closes the long at the next open
    expect(r.position.size).toBe(0);                    // and opens nothing, then or later
  });
});

describe("timestamp(dateString)", () => {
  it("a date and time with no zone is UTC", () => {
    const r = run(`//@version=4\nstudy("t")\nplot(timestamp("2021-01-13:05:00"), title="a")\nplot(timestamp("2021-01-13 05:00"), title="b")\nplot(timestamp("2021-01-13"), title="c")\nplot(timestamp("3 Apr 2022 20:00 -0400"), title="d")`);
    expect(series(r, "a")[0]).toBe(Date.UTC(2021, 0, 13, 5));
    expect(series(r, "b")[0]).toBe(Date.UTC(2021, 0, 13, 5));
    expect(series(r, "c")[0]).toBe(Date.UTC(2021, 0, 13));
    expect(series(r, "d")[0]).toBe(Date.UTC(2022, 3, 4, 0));
  });
});

describe("derivedRequests", () => {
  it("names the same-symbol requests the run folded from the chart's bars", () => {
    const r = run(`//@version=5\nindicator("t")\ntf = input.string("D")\nplot(request.security(syminfo.tickerid, tf, close))`);
    expect(r.derivedRequests).toEqual(["BINANCE:BTCUSDT@D"]);
    const s2 = run(`//@version=5\nindicator("t")\nplot(close)`);
    expect(s2.derivedRequests).toEqual([]);
  });
});

// Probe r6 (TradingView, BINANCE:BTCUSDT 1h, chart history from 2026-01-01) and capture n19.
describe("round 3 probes", () => {
  const hourly = bars(24 * 12, i => [100 + i, 101 + i, 99 + i, 100.5 + i]);
  const day = (ms: number) => new Date(ms).toISOString().slice(0, 10);

  it("multi-day bars count from the chart's first bar (4D: 01-01, 01-05, 01-09; 3D: 01-01, 01-04)", () => {
    const r = run(`//@version=5\nindicator("t")\nplot(request.security(syminfo.tickerid, "4D", time, lookahead=barmerge.lookahead_on), title="t4")\nplot(request.security(syminfo.tickerid, "3D", time, lookahead=barmerge.lookahead_on), title="t3")`, hourly);
    const t4 = series(r, "t4"), t3 = series(r, "t3");
    expect([0, 72, 96, 191, 192].map(i => day(t4[i]))).toEqual(["2026-01-01", "2026-01-01", "2026-01-05", "2026-01-05", "2026-01-09"]);
    expect([0, 71, 72, 144].map(i => day(t3[i]))).toEqual(["2026-01-01", "2026-01-01", "2026-01-04", "2026-01-07"]);
  });

  it("a series passed into a function that calls request.security is the requested timeframe's", () => {
    const r = run(`//@version=4\nstudy("t")\nf(_s) => security(syminfo.tickerid, "D", _s[1], lookahead=barmerge.lookahead_on)\ng(_s) => security(syminfo.tickerid, "D", _s, lookahead=barmerge.lookahead_on)\nplot(f(high), title="fn1")\nplot(security(syminfo.tickerid, "D", high[1], lookahead=barmerge.lookahead_on), title="in1")\nplot(g(high), title="fn0")\nplot(security(syminfo.tickerid, "D", high, lookahead=barmerge.lookahead_on), title="in0")\nplot(high, title="h")`, hourly);
    expect(series(r, "fn1")).toEqual(series(r, "in1"));
    expect(series(r, "fn0")).toEqual(series(r, "in0"));
    expect(series(r, "h")[30]).toBe(131);                 // the chart's own series is left as it was
    expect(series(r, "in0")[30]).toBe(101 + 47);           // day 1's high, from its last hourly bar
  });

  it("a session list with no days is Monday to Friday; one range with no days is every day", () => {
    // 2026-01-03 is a Saturday.
    const r = run(`//@version=6\nindicator("t")\nplot(not na(time("1", "0400-0700")) ? 1 : 0, title="one")\nplot(not na(time("1", "0400-0700,0900-1300")) ? 1 : 0, title="list")\nplot(not na(time("1", "0400-0700,0900-1300:1234567")) ? 1 : 0, title="all")`, hourly);
    const sat4 = 2 * 24 + 4, fri4 = 1 * 24 + 4;
    expect([series(r, "one")[sat4], series(r, "list")[sat4], series(r, "all")[sat4]]).toEqual([1, 0, 1]);
    expect([series(r, "one")[fri4], series(r, "list")[fri4], series(r, "all")[fri4]]).toEqual([1, 1, 1]);
  });

  it("a stop-loss the bar reaches before a stop entry fills first, and the entry keeps its reversal size", () => {
    // Short 1 from bar 1. Bar 4: open 100, low 98 (nearer), high 112: the short's stop at 105 is reached before
    // the long stop entry at 110 (placed on bar 3 while short 1, so an order of 2).
    const c = bars(8, i => i === 4 ? [100, 112, 98, 111] : i > 4 ? [111, 112, 110, 111] : [100, 101, 99, 100]);
    const r = run(`//@version=4\nstrategy("t")\nif bar_index == 0\n    strategy.entry("S", strategy.short)\nstrategy.exit("SX", "S", stop=105)\nif bar_index == 3\n    strategy.entry("L", strategy.long, stop=110)`, c);
    expect(r.trades.length).toBe(1);
    expect(r.trades[0].exitPrice).toBe(105);
    expect(r.position.size).toBe(2);
    expect(r.position.avgPrice).toBe(110);
  });
});
