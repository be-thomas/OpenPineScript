/**
 * How `strategy.exit` is armed and which trade it fills, from TradingView's logs
 * of harness_strategy_reentry (5m and 1D, replayed exactly in
 * conformance/common/strategy_harness_golden.test.ts). Minimal repros:
 *
 *   - an exit called before its entry exists has no effect for that call;
 *   - after its trade closes, a re-entered id gets its own exit again;
 *   - each TRADE measures a relative target from its own fill price, and a
 *     fill takes the oldest trade;
 *   - exits that one bar reaches fill in the order the bar's path reaches them.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const DAY = 86_400_000, t0 = Date.UTC(2024, 0, 1);
const bars = (rows: number[][]) => rows.map((b, i) => ({ time: t0 + i * DAY, open: b[0], high: b[1], low: b[2], close: b[3], volume: 1 }));
function run(body: string, rows: number[][], head = 'strategy("S", pyramiding = 2, margin_long = 0, margin_short = 0)') {
  const s = new Session();
  s.setChart({ symbol: "X", timeframe: "1D", mintick: 0.01 });
  expect(s.compile(`//@version=5\n${head}\n${body}`).errors).toEqual([]);
  const r: any = s.runHistory(bars(rows));
  expect(r.errors).toEqual([]);
  return r;
}
const up = [100, 102, 99, 101];

describe("an exit called before its entry exists", () => {
  // The fill bar (bar 2) reaches 100.01, one tick above the fill at 100.
  const rows = [up, up, [100, 102, 99, 101], [101, 103, 100, 102], [102, 104, 101, 103]];
  it("has no effect that call: a call once, ahead of entry(), never fills", () => {
    const r = run('if bar_index == 1\n    strategy.exit("x", from_entry = "D", profit = 1)\n    strategy.entry("D", strategy.long)\n' +
      'if bar_index == 3\n    strategy.close_all()\n', rows);
    expect(r.trades.map((t: any) => t.id)).toEqual(["Close"]);
  });
  it("after entry() in the script, it exits on the entry's fill bar", () => {
    const r = run('if bar_index == 1\n    strategy.entry("D", strategy.long)\n    strategy.exit("x", from_entry = "D", profit = 1)\n', rows);
    expect(r.trades.map((t: any) => [t.id, t.entryBarIndex, t.exitBarIndex])).toEqual([["Exit x", 2, 2]]);
  });
  it("called again on the next bar, once the trade exists, it arms and fills on the bar after", () => {
    const r = run('if bar_index == 1\n    strategy.exit("x", from_entry = "D", profit = 1)\n    strategy.entry("D", strategy.long)\n' +
      'if bar_index == 2\n    strategy.exit("x", from_entry = "D", profit = 1)\n', rows);
    expect(r.trades.map((t: any) => [t.id, t.exitBarIndex])).toEqual([["Exit x", 3]]);
  });
});

describe("an exit called every bar", () => {
  it("is armed again for an id that is entered again", () => {
    // B holds the position while A is exited (profit = 1) and entered again: the
    // second A trade gets its own exit, which sells the oldest trade.
    const rows = Array.from({ length: 14 }, (_, i) => [100 + i, 103 + i, 99 + i, 101 + i]);
    const r = run('strategy.exit("xa", from_entry = "A", profit = 1)\nif bar_index == 1\n    strategy.entry("B", strategy.long)\n' +
      'if bar_index == 2 or bar_index == 7\n    strategy.entry("A", strategy.long)\n' +
      'if bar_index == 12\n    strategy.close_all()\n', rows);
    const xa = r.trades.filter((t: any) => t.id === "Exit xa");
    expect(xa).toHaveLength(2);                     // once per A trade, not spent after the first
  });
});

describe("one target per trade, and fills take the oldest trade", () => {
  it("L's second trade reaches its own target; it closes the first trade; the other target closes the second", () => {
    // L fills at 100 (bar 2) and 90 (bar 4); profit = 1000 ticks is $10.
    const rows = [[100, 101, 99, 100], [100, 101, 99, 100], [100, 101, 99, 100], [95, 96, 94, 95], [90, 92, 89, 91], [91, 101, 90, 100], [100, 111, 99, 110]];
    const r = run('if bar_index == 1 or bar_index == 3\n    strategy.entry("L", strategy.long)\nstrategy.exit("X", "L", profit = 1000)\n', rows);
    // bar 5 reaches 100 (L2's 90 + 10), closing the OLDEST trade (entry 100); bar 6 reaches 110.
    expect(r.trades.map((t: any) => [t.entryPrice, t.exitPrice, t.exitBarIndex])).toEqual([[100, 100, 5], [90, 110, 6]]);
  });
});

describe("two exits one bar reaches", () => {
  const rows = (open: number, high: number, low: number) =>
    [[100, 101, 99, 100], [100, 101, 99, 100], [100, 101, 99, 100], [100, 101, 99, 100], [open, high, low, 100], [100, 101, 99, 100]];
  const body = 'if bar_index == 0\n    strategy.entry("A", strategy.long)\nif bar_index == 1\n    strategy.entry("B", strategy.long)\n' +
    'if bar_index == 3\n    strategy.exit("xl", from_entry = "B", limit = 102)\n    strategy.exit("xs", from_entry = "A", stop = 98)\n';
  it("open nearer the high: the limit fills first", () => {
    const r = run(body, rows(100, 103, 96));
    expect(r.trades.map((t: any) => t.id)).toEqual(["Exit xl", "Exit xs"]);
    expect(r.trades.map((t: any) => t.entryId)).toEqual(["A", "B"]);               // each takes the oldest trade
  });
  it("open nearer the low: the stop fills first", () => {
    const r = run(body, rows(100, 104, 97));
    expect(r.trades.map((t: any) => t.id)).toEqual(["Exit xs", "Exit xl"]);
  });
});
