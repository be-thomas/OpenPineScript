/**
 * Below v6 a partial `strategy.exit` is booked against the entries it sells,
 * like `strategy.close(id)`, so mixing the two neither loses P&L nor closes the
 * wrong entry. Entries "A" and "B" are placed on bars 2 and 3 and fill at the
 * next open: A at 103, B at 104. Every bar's high is 5 above its open, so the
 * limit 108 fills on bar 6 at 108 (limit orders fill at their price when the
 * open is below it), and the close on bar 12 sells at bar 13's open, 113.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const bars = Array.from({ length: 30 }, (_, i) => ({
  time: Date.UTC(2024, 0, 1) + i * 86_400_000, open: 100 + i, high: 105 + i, low: 95 + i, close: 100 + i, volume: 1,
}));

function run(version: number, exit: string, close: string) {
  const s = new Session();
  const src = `//@version=${version}
strategy("S", pyramiding = 2)
if bar_index == 2
    strategy.entry("A", strategy.long, qty = 1)
if bar_index == 3
    strategy.entry("B", strategy.long, qty = 1)
if bar_index == 6
    ${exit}
if bar_index == 12
    ${close}
`;
  const c = s.compile(version < 4 ? src.replace(/bar_index/g, "n") : src);
  expect(c.errors).toEqual([]);
  const r = s.runHistory(bars);
  expect(r.errors).toEqual([]);
  return r;
}
const total = (r: any) => r.trades.reduce((a: number, t: any) => a + t.pnl, 0);

describe.each([3, 5, 6])("exit mixed with close(id), v%i", (version) => {
  it("an exit with no from_entry and a qty is one order per entry id", () => {
    // TradingView's log (harness_strategy_exit_mix phase d): "xb" qty 1 with A
    // and B open sells 1 against A's id AND 1 against B's.
    const r = run(version, `strategy.exit("x", qty = 1, limit = 108)`, `strategy.close("B")`);
    // A: 103 -> 108 = 5, B: 104 -> 108 = 4
    expect(r.trades.map((t: any) => [t.entryPrice, t.exitPrice, t.qty])).toEqual([[103, 108, 1], [104, 108, 1]]);
    expect(total(r)).toBe(9);
    expect(r.position.size).toBe(0);
  });

  it("from_entry draws on that id's quantity, but the fill takes the oldest trade", () => {
    // harness_strategy_exit_mix phase a: exit(from_entry = "B", qty = 1) closed
    // A's trade, and close("A") then sold A's untouched id quantity, first in
    // first out: the remaining trade, B's.
    const r = run(version, `strategy.exit("x", from_entry = "B", qty = 1, limit = 108)`, `strategy.close("A")`);
    // A's trade 103 -> 108 = 5, then B's 104 -> 113 = 9
    expect(r.trades.map((t: any) => [t.entryPrice, t.exitPrice])).toEqual([[103, 108], [104, 113]]);
    expect(total(r)).toBe(14);
    expect(r.position.size).toBe(0);
  });

  it("the position's average re-prices from what is left after a partial exit", () => {
    // sell A on bar 6; B (104) is all that is left
    const r = run(version, `strategy.exit("x", from_entry = "A", limit = 108)`, `strategy.close("Z")`);
    expect(r.position.size).toBe(1);
    expect(r.position.avgPrice).toBe(104);
  });
});
