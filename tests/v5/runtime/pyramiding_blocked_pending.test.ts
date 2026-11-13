/**
 * A pending entry that `pyramiding` holds back has not filled. It used to be
 * treated as filled: dropped from the queue, and its OCA group cancelled, though
 * no entry had been made. So a stop entry that came due while the position was
 * at its pyramiding limit vanished -- and took its OCA partner with it.
 *
 * Kept pending is a choice, not a documented TradingView behaviour; the
 * question is put to TradingView in
 * conformance/v5/parity/harness_strategy_exit_mix.pine.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const mk = (n: number, f: (i: number) => [number, number, number, number]) => Array.from({ length: n }, (_, i) => {
  const [open, high, low, close] = f(i);
  return { time: Date.UTC(2024, 0, 1) + i * 86_400_000, open, high, low, close, volume: 1 };
});
const flat = (i: number): [number, number, number, number] => [100, 101, 99, 100];

function run(version: number, body: string, bars: any[]) {
  const s = new Session();
  const c = s.compile(`//@version=${version}\nstrategy("S", pyramiding = 1)\n${body}`);
  expect(c.errors).toEqual([]);
  const r = s.runHistory(bars);
  expect(r.errors).toEqual([]);
  return r;
}

describe.each([5, 6])("pending entry blocked by pyramiding, v%i", (version) => {
  it("stays pending and fills once the position that blocked it is closed", () => {
    // L fills at bar 2's open. B's stop (105) is reached on bar 4 while L is
    // open and pyramiding = 1, so it cannot fill. L is closed (queued bar 6,
    // sold at bar 7's open); B's stop is reached again on bar 8, and fills there.
    const bars = mk(12, (i) => i === 4 || i === 8 ? [100, 110, 99, 100] : flat(i));
    const r = run(version, `
if bar_index == 1
    strategy.entry("L", strategy.long, qty = 1)
if bar_index == 2
    strategy.entry("B", strategy.long, qty = 1, stop = 105)
if bar_index == 6
    strategy.close("L")
`, bars);
    expect(r.trades).toHaveLength(1);
    expect(r.position.entries.map((e: any) => [e.id, e.price, e.bar])).toEqual([["B", 105, 8]]);
  });

  it("does not cancel its OCA partner while it is blocked", () => {
    // B (long stop 105) comes due on bar 4 and is blocked by L. Its partner C
    // (short stop 95) is reached on bar 6, and must still be there to fill:
    // the position reverses to short at 95. B is cancelled by C's fill.
    const bars = mk(12, (i) => i === 4 ? [100, 110, 99, 100] : i === 6 ? [100, 101, 90, 92] : flat(i));
    const r = run(version, `
if bar_index == 1
    strategy.entry("L", strategy.long, qty = 1)
if bar_index == 2
    strategy.entry("B", strategy.long, qty = 1, stop = 105, oca_name = "g", oca_type = strategy.oca.cancel)
    strategy.entry("C", strategy.short, qty = 1, stop = 95, oca_name = "g", oca_type = strategy.oca.cancel)
`, bars);
    expect(r.position.size).toBe(-1);
    expect(r.position.entries.map((e: any) => [e.id, e.price])).toEqual([["C", 95]]);
  });
});
