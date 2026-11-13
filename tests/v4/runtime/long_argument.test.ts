/**
 * v1-v4 `strategy.entry(id, long, ...)` and `strategy.order(id, long, ...)`.
 *
 * "long (bool) A boolean value indicating the direction of the order: true for
 * buy, false for sell." v5 renamed it `direction` (dev-docs/01-version-delta-spec.md
 * §4b). The keyword form `long = false` named no parameter of the engine's,
 * was dropped, and the order was a long: a short-only v4 strategy opened
 * nothing but longs, or, with the argument ignored, nothing it meant to.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

// Bar i opens at 100 + i, so a fill's price names the bar it filled on.
const bars = Array.from({ length: 30 }, (_, i) => ({
  time: Date.UTC(2024, 0, 1) + i * 86_400_000,
  open: 100 + i, high: 105 + i, low: 95 + i, close: 100 + i, volume: 1000,
}));

/**
 * An order on bar 5, filled at bar 6's open (106), and `strategy.close` on
 * bar 10, filled at bar 11's open (111).
 */
function run(version: 3 | 4, order: string) {
  const n = version === 3 ? "n" : "bar_index";
  const s = new Session();
  const c = s.compile(
    `//@version=${version}\nstrategy("S", overlay = true)\n` +
    `if ${n} == 5\n    ${order}\nif ${n} == 10\n    strategy.close("X")\n`);
  expect(c.errors).toEqual([]);
  return s.runHistory(bars);
}

describe("long = false sells, long = true buys", () => {
  it("opens a short for a v4 keyword entry: sold at 106, bought back at 111", () => {
    const r = run(4, 'strategy.entry("X", long = false)');
    expect(r.errors).toEqual([]);
    expect(r.droppedArguments).toEqual([]);
    expect(r.trades).toHaveLength(1);
    expect(r.trades[0]).toMatchObject({ direction: "short", entryPrice: 106, exitPrice: 111, qty: 1, pnl: -5 });
  });

  it("opens a long for a v4 keyword entry: bought at 106, sold at 111", () => {
    const r = run(4, 'strategy.entry("X", long = true)');
    expect(r.droppedArguments).toEqual([]);
    expect(r.trades[0]).toMatchObject({ direction: "long", entryPrice: 106, exitPrice: 111, pnl: 5 });
  });

  it("reads the bool by position as well", () => {
    expect(run(4, 'strategy.entry("X", false)').trades[0]).toMatchObject({ direction: "short", pnl: -5 });
    expect(run(4, 'strategy.entry("X", true)').trades[0]).toMatchObject({ direction: "long", pnl: 5 });
  });

  it("still reads strategy.long and strategy.short", () => {
    expect(run(4, 'strategy.entry("X", strategy.short)').trades[0]).toMatchObject({ direction: "short" });
    expect(run(4, 'strategy.entry("X", strategy.long)').trades[0]).toMatchObject({ direction: "long" });
  });

  it("sizes a keyword entry alongside it: two contracts short lose 2 x 5", () => {
    const r = run(4, 'strategy.entry(id = "X", long = false, qty = 2)');
    expect(r.trades[0]).toMatchObject({ direction: "short", qty: 2, pnl: -10 });
  });

  it("applies to strategy.order, by keyword and by position", () => {
    expect(run(4, 'strategy.order("X", long = false, qty = 1)').trades[0])
      .toMatchObject({ direction: "short", entryPrice: 106, pnl: -5 });
    expect(run(4, 'strategy.order("X", false, 1)').trades[0])
      .toMatchObject({ direction: "short", entryPrice: 106, pnl: -5 });
  });

  it("applies at v3", () => {
    const r = run(3, 'strategy.entry("X", long = false)');
    expect(r.droppedArguments).toEqual([]);
    expect(r.trades[0]).toMatchObject({ direction: "short", pnl: -5 });
  });

  it("is not a v5 keyword: `long` there is still dropped and recorded", () => {
    const s = new Session();
    s.compile('//@version=5\nstrategy("S")\nif bar_index == 5\n    strategy.entry("X", strategy.long, long = false)\n');
    const r = s.runHistory(bars);
    expect(r.droppedArguments).toEqual(["strategy.entry(long)"]);
  });
});
