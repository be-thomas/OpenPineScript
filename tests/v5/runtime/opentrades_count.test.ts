/**
 * `strategy.opentrades` is the number of open trades: one per filled entry not
 * yet fully closed, and `strategy.opentrades.*(n)` index that same list, oldest
 * first. It used to be `size != 0 ? 1 : 0`, so a pyramided position of three
 * entries read as one trade and the accessors described the averaged position.
 *
 * A partial close takes size off the OLDEST entry first (first in, first out)
 * and does not change the count until an entry is used up. Expected values are
 * worked from the script, not from the engine: three 1-lot entries placed on
 * bars 2, 3 and 4 fill at the next bar's open, which is 100 + the bar index.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const bars = Array.from({ length: 12 }, (_, i) => ({
  time: Date.UTC(2024, 0, 1) + i * 86_400_000, open: 100 + i, high: 110 + i, low: 90 + i, close: 100 + i, volume: 1,
}));

const probe = (version: number, extra: string, id = '"E" + str.tostring(bar_index)') => `//@version=${version}
strategy("S", pyramiding = 3)
if bar_index >= 2 and bar_index <= 4
    strategy.entry(${id}, strategy.long)
${extra}
plot(strategy.opentrades, "n")
plot(strategy.position_size, "pos")
plot(strategy.opentrades.size(0), "s0")
plot(strategy.opentrades.size(1), "s1")
plot(strategy.opentrades.size(2), "s2")
plot(strategy.opentrades.entry_price(0), "p0")
plot(strategy.opentrades.entry_price(1), "p1")
plot(strategy.opentrades.entry_price(2), "p2")
`;

function run(src: string) {
  const s = new Session();
  const c = s.compile(src);
  expect(c.errors).toEqual([]);
  const r = s.runHistory(bars);
  expect(r.errors).toEqual([]);
  const at = (title: string, bar: number) => r.series.find((x: any) => x.title === title)!.data[bar]?.value ?? null;
  return { r, at };
}

describe.each([5, 6])("strategy.opentrades at v%i", (version) => {
  it("counts 1, 2, 3 as pyramided entries fill, and the accessors index the same list", () => {
    const { at } = run(probe(version, ""));
    // entry placed on bar 2 fills at the open of bar 3, and so on
    expect([2, 3, 4, 5, 6].map((b) => at("n", b))).toEqual([0, 1, 2, 3, 3]);
    expect([2, 3, 4, 5].map((b) => at("pos", b))).toEqual([0, 1, 2, 3]);
    expect([at("p0", 5), at("p1", 5), at("p2", 5)]).toEqual([103, 104, 105]);
    expect([at("s0", 5), at("s1", 5), at("s2", 5)]).toEqual([1, 1, 1]);
    // past the end of the list is na, never the last trade
    expect(at("s2", 4)).toBeNull();
    expect(at("p1", 3)).toBeNull();
  });

  it("a partial close shrinks the oldest entry first; the count drops only when one is used up", () => {
    // 1.5 of 3 sold at bar 7 (limit 108 is under every bar's high): the first
    // entry (1.0 @ 103) is gone and the second (1.0 @ 104) has 0.5 left.
    // All three entries share the id "E": an exit is one order per entry id
    // (harness_strategy_exit_mix), so under three different ids qty = 1.5 would
    // sell up to 1.5 of EACH.
    const { at } = run(probe(version,
      'if bar_index == 6\n    strategy.exit("X", qty = 1.5, limit = 108)', '"E"'));
    expect(at("n", 6)).toBe(3);
    expect(at("n", 8)).toBe(2);
    expect(at("pos", 8)).toBe(1.5);
    expect([at("s0", 8), at("s1", 8), at("s2", 8)]).toEqual([0.5, 1, null]);
    expect([at("p0", 8), at("p1", 8)]).toEqual([104, 105]);
  });

  it("a full close leaves no open trade", () => {
    const { at } = run(probe(version, 'if bar_index == 6\n    strategy.close_all()'));
    expect(at("n", 8)).toBe(0);
    expect(at("pos", 8)).toBe(0);
    expect(at("s0", 8)).toBeNull();
  });
});

describe("a position that decays toward zero", () => {
  // release_notes_04: `qty_percent = 20` exits are a share of what is HELD, so
  // the position only approaches zero. The dry run showed opentrades = 1 beside
  // position_size = 0 and an open trade of size 0: a size under 1e-10 is not a
  // trade. At v5 qty_percent is read against the held size, not the entered one.
  const src = `//@version=5
strategy("S", initial_capital = 10000000)
strategy.entry("Long", strategy.long, qty = 100)
strategy.exit("A", "Long", trail_points = 50, trail_offset = 0, qty_percent = 20)
strategy.exit("B", "Long", trail_points = 100, trail_offset = 0, qty_percent = 20)
plot(strategy.opentrades, "n")
plot(strategy.position_size, "pos")
plot(strategy.opentrades.size(0), "s0")
`;
  const long = Array.from({ length: 700 }, (_, i) => ({
    time: Date.UTC(2020, 0, 1) + i * 86_400_000, open: 100 + i, high: 110 + i, low: 90 + i, close: 100 + i, volume: 1,
  }));

  it("never reports an open trade with no size", () => {
    const s = new Session();
    expect(s.compile(src).errors).toEqual([]);
    const r = s.runHistory(long);
    expect(r.errors).toEqual([]);
    const col = (t: string) => r.series.find((x: any) => x.title === t)!.data.map((d: any) => d?.value ?? null);
    const [n, pos, s0] = [col("n"), col("pos"), col("s0")];
    for (let i = 0; i < n.length; i++) {
      expect(n[i] > 0, `bar ${i}`).toBe(Math.abs(pos[i] ?? 0) > 0);
      if (n[i] > 0) expect(Math.abs(s0[i]), `bar ${i}`).toBeGreaterThan(1e-10);
    }
  });
});
