/**
 * `strategy.close(id)` exits the entries opened with `id` and nothing else.
 *
 * It used to close the whole position below v6, whatever the id. A v4 script
 * that reverses with `entry("Long", long = true)` and `close("Short")` closed
 * the long it had just opened. With no entry of that id open it does nothing;
 * `qty` and `qty_percent` limit how much of the id's entries goes.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

// Bar i opens at 100 + i, so a fill's price names the bar it filled on.
const bars = Array.from({ length: 30 }, (_, i) => ({
  time: Date.UTC(2024, 0, 1) + i * 86_400_000,
  open: 100 + i, high: 105 + i, low: 95 + i, close: 100 + i, volume: 1000,
}));

/** `entries` are placed on bars 2, 3, ...; `close` on bar 10 fills at bar 11's open, 111. */
function run(version: 4 | 5 | 6, entries: string[], close: string, header = 'strategy("S", pyramiding = 2)') {
  const placed = entries.map((e, i) => `if bar_index == ${2 + i}\n    ${e}\n`).join("");
  const s = new Session();
  const c = s.compile(`//@version=${version}\n${header}\n${placed}if bar_index == 10\n    ${close}\n`);
  expect(c.errors).toEqual([]);
  return s.runHistory(bars);
}

describe("strategy.close(id)", () => {
  for (const version of [4, 5, 6] as const) {
    const long = (id: string, qty = 1) =>
      version === 4 ? `strategy.entry("${id}", long = true, qty = ${qty})`
                    : `strategy.entry("${id}", strategy.long, qty = ${qty})`;

    it(`v${version}: an id nothing opened is a no-op`, () => {
      const r = run(version, [long("A")], 'strategy.close("Z")');
      expect(r.trades).toEqual([]);
      expect(r.position?.size).toBe(1);
    });

    it(`v${version}: closes only its own entry (103 -> 111), leaving the other open`, () => {
      const r = run(version, [long("A"), long("B")], 'strategy.close("A")');
      expect(r.trades).toHaveLength(1);
      expect(r.trades[0]).toMatchObject({ direction: "long", qty: 1, entryPrice: 103, exitPrice: 111, pnl: 8 });
      expect(r.position?.size).toBe(1);
      expect(r.position?.avgPrice).toBe(104);
    });

    it(`v${version}: qty closes part of it: 1 of 4 at 103 -> 111`, () => {
      const r = run(version, [long("A", 4)], 'strategy.close("A", qty = 1)');
      expect(r.trades).toHaveLength(1);
      expect(r.trades[0]).toMatchObject({ qty: 1, entryPrice: 103, exitPrice: 111, pnl: 8 });
      expect(r.position?.size).toBe(3);
    });

    it(`v${version}: qty_percent closes part of it: 50% of 4 is 2, pnl 16`, () => {
      const r = run(version, [long("A", 4)], 'strategy.close("A", qty_percent = 50)');
      expect(r.trades).toHaveLength(1);
      expect(r.trades[0]).toMatchObject({ qty: 2, entryPrice: 103, exitPrice: 111, pnl: 16 });
      expect(r.position?.size).toBe(2);
    });

    it(`v${version}: closes every entry with that id, one trade each`, () => {
      const r = run(version, [long("A"), long("A", 2)], 'strategy.close("A")');
      expect(r.trades.map((t) => [t.qty, t.entryPrice, t.exitPrice, t.pnl])).toEqual([[1, 103, 111, 8], [2, 104, 111, 14]]);
      expect(r.position?.size).toBe(0);
    });
  }

  it("v4 reversal: entry(\"Long\"), then close(\"Short\") leaves the long open", () => {
    const r = run(4, ['strategy.entry("Long", long = true)'], 'strategy.close("Short")', 'strategy("S")');
    expect(r.trades).toEqual([]);
    expect(r.position?.size).toBe(1);
  });
});
