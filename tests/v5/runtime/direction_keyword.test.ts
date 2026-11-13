/**
 * `strategy.entry(direction = …)` and `strategy.order(direction = …)` at v5+.
 *
 * The emitter used to rename the v5 keyword to `long`, the runtime's OLD
 * parameter name; PR #10 renamed the runtime parameters (`direction` for
 * `entry`, `dir` for `order`), so the emitted `long` named nothing, was
 * dropped, and every keyword-direction order opened a short. Positional calls
 * and v4's `long =` were unaffected, which is why they are the controls here.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

// Bar i opens at 100 + i, so a fill's price names the bar it filled on.
const bars = Array.from({ length: 30 }, (_, i) => ({
  time: Date.UTC(2024, 0, 1) + i * 86_400_000,
  open: 100 + i, high: 105 + i, low: 95 + i, close: 100 + i, volume: 1000,
}));

/** An order on bar 5, filled at bar 6's open (106), closed on bar 10 (111). */
function run(version: 4 | 5 | 6, order: string) {
  const s = new Session();
  const c = s.compile(
    `//@version=${version}\nstrategy("S", overlay = true)\n` +
    `if bar_index == 5\n    ${order}\nif bar_index == 10\n    strategy.close("X")\n`);
  expect(c.errors).toEqual([]);
  const r = s.runHistory(bars);
  expect(r.errors).toEqual([]);
  expect(r.droppedArguments).toEqual([]);
  return r;
}

describe.each([5, 6] as const)("v%i keyword direction", (v) => {
  describe.each(["strategy.entry", "strategy.order"])("%s", (fn) => {
    it("direction = strategy.long buys", () => {
      expect(run(v, `${fn}(id = "X", direction = strategy.long, qty = 1)`).trades[0])
        .toMatchObject({ direction: "long", entryPrice: 106, exitPrice: 111, pnl: 5 });
    });

    it("direction = strategy.short sells", () => {
      expect(run(v, `${fn}(id = "X", direction = strategy.short, qty = 1)`).trades[0])
        .toMatchObject({ direction: "short", entryPrice: 106, exitPrice: 111, pnl: -5 });
    });

    it("positional direction, the control", () => {
      expect(run(v, `${fn}("X", strategy.long, qty = 1)`).trades[0])
        .toMatchObject({ direction: "long", pnl: 5 });
      expect(run(v, `${fn}("X", strategy.short, qty = 1)`).trades[0])
        .toMatchObject({ direction: "short", pnl: -5 });
    });
  });
});

describe("v4 keyword long", () => {
  describe.each(["strategy.entry", "strategy.order"])("%s", (fn) => {
    it("long = true buys", () => {
      expect(run(4, `${fn}(id = "X", long = true, qty = 1)`).trades[0])
        .toMatchObject({ direction: "long", entryPrice: 106, pnl: 5 });
    });

    it("long = false sells", () => {
      expect(run(4, `${fn}(id = "X", long = false, qty = 1)`).trades[0])
        .toMatchObject({ direction: "short", entryPrice: 106, pnl: -5 });
    });

    it("positional direction, the control", () => {
      expect(run(4, `${fn}("X", true, 1)`).trades[0]).toMatchObject({ direction: "long" });
      expect(run(4, `${fn}("X", false, 1)`).trades[0]).toMatchObject({ direction: "short" });
    });
  });
});
