/**
 * `strategy(pyramiding = N)`: the most entries allowed in one direction. 0, the
 * default, and 1 both allow one. `strategy.entry` obeys it and a reversal is
 * not held back; `strategy.order` is not bound by it. The broker never read it.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

// Bar i opens at 100 + i, so a fill's price names the bar it filled on.
const bars = Array.from({ length: 20 }, (_, i) => ({
  time: Date.UTC(2024, 0, 1) + i * 86_400_000, open: 100 + i, high: 110 + i, low: 90 + i, close: 100 + i, volume: 1,
}));

function run(header: string, body: string, props?: Record<string, any>) {
  const s = new Session();
  const c = s.compile(`//@version=5\nstrategy("S"${header})\n${body}`);
  expect(c.errors).toEqual([]);
  if (props) s.setProperties(props);
  return s.runHistory(bars);
}
// An order placed on each bar from 2 to `last`, filling on the next bar's open.
const each = (call: string, last = 9) => `if bar_index >= 2 and bar_index <= ${last}\n    ${call}\n`;

describe("pyramiding", () => {
  it("default: a repeated entry while long is ignored", () => {
    const r = run("", each('strategy.entry("L", strategy.long)'));
    expect(r.position?.size).toBe(1);
    expect(r.position?.avgPrice).toBe(103);   // the first, placed on bar 2
  });

  it("pyramiding = 1 is the same as 0", () => {
    expect(run(", pyramiding = 1", each('strategy.entry("L", strategy.long)')).position?.size).toBe(1);
  });

  it("pyramiding = 3: the 4th is ignored", () => {
    const r = run(", pyramiding = 3", each('strategy.entry("L", strategy.long)'));
    expect(r.position?.size).toBe(3);
    expect(r.position?.avgPrice).toBe(104);   // fills at 103, 104, 105
  });

  it("two ids in one direction count together", () => {
    const body = 'if bar_index == 2 or bar_index == 4\n    strategy.entry("A", strategy.long)\n' +
                 'if bar_index == 3 or bar_index == 5\n    strategy.entry("B", strategy.long)\n';
    const r = run(", pyramiding = 3", body);
    expect(r.position?.size).toBe(3);         // A@103, B@104, A@105; B on bar 5 is the 4th
    expect(r.position?.avgPrice).toBe(104);
  });

  it("a reversal is allowed", () => {
    const body = 'if bar_index == 2\n    strategy.entry("L", strategy.long)\n' +
                 'if bar_index == 5\n    strategy.entry("S", strategy.short)\n';
    const r = run("", body);
    expect(r.trades).toHaveLength(1);
    expect(r.trades[0]).toMatchObject({ direction: "long", entryPrice: 103, exitPrice: 106, pnl: 3 });
    expect(r.position?.size).toBe(-1);
  });

  it("strategy.order is not bound by it", () => {
    const r = run("", each('strategy.order("L", strategy.long)', 5));
    expect(r.position?.size).toBe(4);         // fills on bars 3 to 6
  });

  it("a host override changes the limit", () => {
    const r = run("", each('strategy.entry("L", strategy.long)'), { pyramiding: 2 });
    expect(r.position?.size).toBe(2);
  });

  it("a pending (limit) entry obeys it too", () => {
    const r = run("", each('strategy.entry("L", strategy.long, limit = close + 50)'));
    expect(r.position?.size).toBe(1);
  });
});
