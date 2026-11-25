/**
 * A strategy.exit stop and an opposite strategy.entry stop that fill at the same price on the same tick.
 * TradingView probe r6 exitov/01 (v5, BINANCE:BTCUSDT 1h, fixed quantities, all 76 Pine Log lines matched):
 *  - they fill in the order the script last placed them; an exit's unit for a trade that filled after the
 *    exit was called dates from that fill;
 *  - an exit that comes second still fills after the entry closed its trade, and opens a trade the other
 *    way under the exit's id (long 1, Short 3 then XL: pos -4 = Short 3 + XL 1);
 *  - a pyramided position's exit fills per trade (shorts 1 + 2, Long 5 then XS: Long 5, XS 1, XS 2).
 * n56 (v5, pyramiding 4): a reversal entry is the size it was placed with (its own plus the position then)
 * and nets against the position it meets, and one placed while flat only nets. Synthetic bars here.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const H = 3600e3, T0 = Date.UTC(2026, 0, 1);

type Bar = [number, number, number, number];
function run(body: string, bars: Bar[] = Array.from({ length: 12 }, () => [100, 101, 99, 100] as Bar)) {
  const s = new Session();
  s.setChart({ symbol: "X", timeframe: "60", mintick: 0.01, timezone: "UTC", mincontract: 1 } as any);
  const c = s.compile(`//@version=5
strategy("t", initial_capital = 1e9, pyramiding = 3, margin_long = 0, margin_short = 0)
far_up = close * 10
far_dn = close * 0.1
${body}`);
  expect(c.errors).toEqual([]);
  const r: any = s.runHistory(bars.map(([open, high, low, close], i) => ({ time: T0 + i * H, open, high, low, close, volume: 1 })));
  expect(r.errors ?? []).toEqual([]);
  return {
    open: (r.position.entries ?? []).map((e: any) => `${e.id}:${r.position.size > 0 ? e.qty : -e.qty}`),
    closed: r.trades.map((t: any) => `${t.entryId}>${t.exitId}:${t.qty}`),
    pos: r.position.size,
  };
}

describe("v5 exit and opposite entry at the same price on one tick", () => {
  it("entry called first: it reverses, and the exit still sells its trade's size (pos -4)", () => {
    const r = run(`if bar_index == 0
    strategy.entry("Long", strategy.long, qty = 1)
if bar_index == 2
    strategy.entry("Short", strategy.short, qty = 3, stop = far_up)
    strategy.exit("XL", "Long", stop = far_up)`);
    expect(r.closed).toEqual(["Long>Short:1"]);
    expect(r.open).toEqual(["Short:-3", "XL:-1"]);
    expect(r.pos).toBe(-4);
  });

  it("exit called first: it closes the long, then the entry opens 3 + the 1 it was placed against", () => {
    const r = run(`if bar_index == 0
    strategy.entry("Long", strategy.long, qty = 1)
if bar_index == 2
    strategy.exit("XL", "Long", stop = far_up)
    strategy.entry("Short", strategy.short, qty = 3, stop = far_up)`);
    expect(r.closed).toEqual(["Long>XL:1"]);
    expect(r.open).toEqual(["Short:-4"]);
  });

  it("an exit created earlier but called again after the entry comes second", () => {
    const r = run(`if bar_index == 0
    strategy.entry("Long", strategy.long, qty = 1)
    strategy.exit("XL", "Long", stop = far_dn)
if bar_index == 2
    strategy.entry("Short", strategy.short, qty = 3, stop = far_up)
    strategy.exit("XL", "Long", stop = far_up)`);
    expect(r.closed).toEqual(["Long>Short:1"]);
    expect(r.open).toEqual(["Short:-3", "XL:-1"]);
  });

  it("an entry placed flat and moved after the exit is re-sized as a reversal (3 + 1) and comes second", () => {
    const r = run(`if bar_index == 0
    strategy.entry("Short", strategy.short, qty = 3, stop = far_dn)
    strategy.entry("Long", strategy.long, qty = 1)
if bar_index == 2
    strategy.exit("XL", "Long", stop = far_up)
    strategy.entry("Short", strategy.short, qty = 3, stop = far_up)`);
    expect(r.closed).toEqual(["Long>XL:1"]);
    expect(r.open).toEqual(["Short:-4"]);
  });

  it("a pyramided position's exit fills once per trade after the reversal", () => {
    const r = run(`if bar_index == 0
    strategy.entry("Short", strategy.short, qty = 1)
if bar_index == 1
    strategy.entry("Short", strategy.short, qty = 2)
if bar_index == 3
    strategy.entry("Long", strategy.long, qty = 5, stop = far_dn)
    strategy.exit("XS", "Short", stop = far_dn)`);
    expect(r.closed).toEqual(["Short>Long:1", "Short>Long:2"]);
    expect(r.open).toEqual(["Long:5", "XS:1", "XS:2"]);
    expect(r.pos).toBe(8);
  });

  it("an entry placed flat only nets a position opened since; the exit placed before its trade comes second", () => {
    // n56 event 1: Short 3 placed flat together with XL; the long fills on the next bar (XL's unit dates from
    // that fill); bar 3 falls through 50: Short closes the long and opens 2, then XL sells 1 more.
    const f: Bar = [100, 101, 99, 100];
    const r = run(`if bar_index == 0
    strategy.entry("Long", strategy.long, qty = 1, stop = far_dn)
    strategy.exit("XL", "Long", stop = 50)
    strategy.entry("Short", strategy.short, qty = 3, stop = 50)`, [f, f, f, [100, 101, 40, 45], [45, 46, 44, 45]]);
    expect(r.closed).toEqual(["Long>Short:1"]);
    expect(r.open).toEqual(["Short:-2", "XL:-1"]);
    expect(r.pos).toBe(-3);
  });
});
