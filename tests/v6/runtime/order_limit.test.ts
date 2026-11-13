/**
 * MG §"Excess orders are trimmed" (migration guide to Pine Script v6): "past
 * 9000 orders, v5 raises a runtime error and halts, while v6 trims the oldest
 * and continues." Doc-only: no TradingView log of it exists yet.
 *
 * Each bar fills one order (an entry, then the close of it, alternately), so
 * 9500 bars fill 9500.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const bars = Array.from({ length: 9500 }, (_, i) => ({
  time: Date.UTC(2020, 0, 1) + i * 86_400_000, open: 100, high: 101, low: 99, close: 100, volume: 1,
}));

const src = (v: number) => `//@version=${v}
strategy("S", initial_capital = 1000000)
if bar_index % 2 == 0
    strategy.entry("L", strategy.long, qty = 1)
else
    strategy.close_all()
`;

function run(v: number) {
  const s = new Session();
  expect(s.compile(src(v)).errors).toEqual([]);
  return s.runHistory(bars);
}

describe("9000 orders", () => {
  it("v5 stops with a runtime error", () => {
    const r = run(5);
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0].phase).toBe("runtime");
    expect(r.errors[0].message).toMatch(/more than 9000 orders/);
    expect(r.barsProcessed).toBeLessThan(9500);
  });

  it("v4 stops the same way", () => {
    expect(run(4).errors[0]?.message).toMatch(/more than 9000 orders/);
  });

  it("v6 carries on through all 9500 bars", () => {
    const r = run(6);
    expect(r.errors).toEqual([]);
    expect(r.barsProcessed).toBe(9500);
  });
});
