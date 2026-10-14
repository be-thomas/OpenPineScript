/**
 * What the broker charges and what price it fills at.
 *
 * None of this is covered by the golden logs: `harness_strategy.pine`
 * deliberately declares no commission and no slippage, so every path below
 * was unconstrained until these.
 */
import { describe, it, expect } from "vitest";
import { runScript } from "../../../runtime/v1/session";

/** Flat bars, so a fill price is exact and slippage is the only thing moving it. */
const flat = (n: number, px = 100) =>
  Array.from({ length: n }, (_, i) => ({
    time: Date.UTC(2024, 0, 1) + i * 86_400_000,
    open: px, high: px + 5, low: px - 5, close: px, volume: 1000,
  }));

const strategy = (decl: string, body: string, candles = flat(40)) =>
  runScript(`//@version=5\nstrategy("S", overlay = true, ${decl})\n${body}`, { candles });

describe("an entry that did not name a size", () => {
  // `qty` defaults to undefined so that `default_qty_type` can answer for it;
  // a literal 1 cannot be told from no answer. The pending-order queue stored
  // `val(qty)`, and `val(undefined)` is NaN — which is not `undefined`, so the
  // default was skipped, and the finite-quantity guard then dropped the order.
  for (const [leg, order] of [
    ["stop", 'strategy.entry("L", strategy.long, stop = 105)'],
    ["limit", 'strategy.entry("L", strategy.long, limit = 95)'],
  ] as const) {
    it(`fills on a ${leg} entry, the way a market entry does`, () => {
      const r = strategy("initial_capital = 10000",
        `if bar_index == 10\n    ${order}\nif bar_index == 30\n    strategy.close("L")\n`);
      expect(r.trades.length, `a ${leg} entry without a qty never filled at all`).toBe(1);
    });
  }
});

describe("slippage", () => {
  it("is applied once to a reversal, not twice", () => {
    const body =
      'if bar_index == 5\n    strategy.entry("S", strategy.short)\n' +
      'if bar_index == 10\n    strategy.entry("L", strategy.long)\n' +
      'if bar_index == 20\n    strategy.close("L")\n';
    const decl = (s: number) =>
      `initial_capital = 10000, slippage = ${s}, default_qty_value = 1, default_qty_type = strategy.fixed`;

    const none = strategy(decl(0), body).trades[0];
    const slipped = strategy(decl(2), body).trades[0];

    // The short opens two ticks BELOW the model price (a sell slips down) and
    // is closed two ticks above it (closing a short is a buy). One tick is
    // 0.01. `entry` handed `closeAt` a price it had already slipped, and
    // `closeAt` slipped it again in the same direction, so the reversal
    // closed four ticks above the open instead of two.
    expect(none.entryPrice).toBe(100);
    expect(none.exitPrice).toBe(100);
    expect(slipped.entryPrice).toBeCloseTo(99.98, 10);
    expect(slipped.exitPrice).toBeCloseTo(100.02, 10);
  });

  it("does not touch a limit exit, which fills at its price or better", () => {
    const body =
      'if bar_index == 5\n    strategy.entry("L", strategy.long)\n' +
      'strategy.exit("tp", "L", limit = 103)\n';
    const decl = (s: number) =>
      `initial_capital = 10000, slippage = ${s}, default_qty_value = 1, default_qty_type = strategy.fixed`;

    // Slipping a take-profit recorded it filling WORSE than its limit, which
    // is the one thing a limit order cannot do.
    expect(strategy(decl(0), body).trades[0].exitPrice).toBe(103);
    expect(strategy(decl(3), body).trades[0].exitPrice).toBe(103);
  });
});

describe("commission charged per order", () => {
  const decl = "initial_capital = 100000, commission_type = strategy.commission.cash_per_order,"
    + " commission_value = 5";

  it("bills one entry and two partial exits as three orders", () => {
    const r = strategy(`${decl}, default_qty_value = 10, default_qty_type = strategy.fixed`,
      'if bar_index == 5\n    strategy.entry("L", strategy.long)\n' +
      'strategy.exit("a", "L", qty = 5, limit = 103)\n' +
      'if bar_index == 30\n    strategy.close("L")\n');

    // The fee was charged as a whole round turn per CLOSED TRADE, so two
    // partial exits of one entry paid four fees for three orders.
    expect(r.performance!.all.commissionPaid).toBe(15);
  });

  it("bills three pyramided entries and one close as four orders", () => {
    const r = strategy(`${decl}, pyramiding = 3, default_qty_value = 1, default_qty_type = strategy.fixed`,
      'if bar_index == 5 or bar_index == 6 or bar_index == 7\n' +
      '    strategy.entry("L" + str.tostring(bar_index), strategy.long)\n' +
      'if bar_index == 30\n    strategy.close_all()\n');

    // And the mirror: one closed trade covering three entries paid two fees
    // for four orders.
    expect(r.performance!.all.commissionPaid).toBe(20);
  });
});

describe("excursion on the bar a trade dies on", () => {
  it("counts the move to the exit price", () => {
    // Bar 6 collapses, taking out a stop at 95.
    const candles = Array.from({ length: 20 }, (_, i) => ({
      time: Date.UTC(2024, 0, 1) + i * 86_400_000,
      open: 100, high: 101, low: i === 6 ? 93 : 99, close: i === 6 ? 94 : 100, volume: 1000,
    }));
    const r = strategy(
      "initial_capital = 10000, default_qty_value = 2, default_qty_type = strategy.fixed",
      'if bar_index == 4\n    strategy.entry("L", strategy.long)\n' +
      'strategy.exit("x", "L", stop = 95)\n', candles);

    const t = r.trades[0];
    expect(t.exitPrice).toBe(95);
    // Excursion was sampled only at the END of a bar, and a bracket exit
    // fills in `setBar` before the script runs — so the bar the trade died on
    // was never sampled and this reported a drawdown from the entry bar
    // alone. Five points against, two contracts.
    expect(t.drawdown).toBeGreaterThanOrEqual(10);
  });

  it("counts a position opened and closed inside one bar", () => {
    const r = strategy(
      "initial_capital = 10000, default_qty_value = 7, default_qty_type = strategy.fixed",
      'if bar_index == 4\n    strategy.entry("L", strategy.long)\n' +
      'strategy.exit("x", "L", stop = 99, limit = 101)\n');

    // `maxContractsHeld` was read at the end of a bar too, so a position that
    // was flat again by then had never been held at all.
    expect(r.performance!.maxContractsHeld).toBe(7);
  });
});
