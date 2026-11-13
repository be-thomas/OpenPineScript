/**
 * `strategy.close(..., immediately = true)` and `strategy.close_all(...,
 * immediately = true)`.
 *
 * "immediately (series bool) If true, the closing order will be executed on
 * the tick where it has been placed, ignoring the strategy parameters that
 * restrict the order execution to the open of the next bar." On a historical
 * bar the tick that places it is the bar's close. The argument was dropped, so
 * every such close waited for the next open.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

// Bar i opens at 100 + i and closes at 103 + i, so the close of bar 10 (113)
// and the open of bar 11 (111) are different prices.
const bars = Array.from({ length: 30 }, (_, i) => ({
  time: Date.UTC(2024, 0, 1) + i * 86_400_000,
  open: 100 + i, high: 110 + i, low: 90 + i, close: 103 + i, volume: 1000,
}));

/** Long "L" placed on bar 5 (fills at bar 6's open, 106), a close on bar 10. */
function run(version: 5 | 6, close: string) {
  const s = new Session();
  const c = s.compile(
    `//@version=${version}\nstrategy("S", overlay = true)\n` +
    `if bar_index == 5\n    strategy.entry("L", strategy.long)\n` +
    `if bar_index == 10\n    ${close}\n`);
  expect(c.errors).toEqual([]);
  return s.runHistory(bars);
}

describe("immediately = true", () => {
  for (const version of [5, 6] as const) {
    it(`v${version}: close_all fills at bar 10's close, 113, not bar 11's open`, () => {
      const r = run(version, 'strategy.close_all(comment = "x", immediately = true)');
      expect(r.errors).toEqual([]);
      expect(r.droppedArguments).toEqual([]);
      expect(r.trades).toHaveLength(1);
      expect(r.trades[0]).toMatchObject({ entryPrice: 106, exitPrice: 113, exitBarIndex: 10, pnl: 7, exitComment: "x" });
    });

    it(`v${version}: close fills at bar 10's close, 113`, () => {
      const r = run(version, 'strategy.close("L", immediately = true)');
      expect(r.droppedArguments).toEqual([]);
      expect(r.trades[0]).toMatchObject({ entryPrice: 106, exitPrice: 113, exitBarIndex: 10, pnl: 7 });
    });

    it(`v${version}: without it, both still wait for bar 11's open, 111`, () => {
      for (const call of ['strategy.close_all()', 'strategy.close("L")', 'strategy.close("L", immediately = false)']) {
        const r = run(version, call);
        expect(r.trades[0], call).toMatchObject({ exitPrice: 111, exitBarIndex: 11, pnl: 5 });
      }
    });
  }

  it("v5: the script still sees the position open on the bar it closes, and flat on the next", () => {
    // TradingView's log (harness_strategy_pyr0, phases g2 and g4): the row the
    // script logs on the bar a close(immediately = true) is placed still has
    // the position open and the trade uncounted, though the trade closes at
    // that bar's close. It is filled once the script has run.
    const s = new Session();
    s.compile('//@version=5\nstrategy("S")\nif bar_index == 5\n    strategy.entry("L", strategy.long)\n' +
      'if bar_index == 10\n    strategy.close_all(immediately = true)\n' +
      'plot(strategy.position_size, "size")\n');
    const r = s.runHistory(bars);
    const size = r.series.find((p) => p.title === "size")!.data.map((d: any) => d?.value);
    expect(size[9]).toBe(1);
    expect(size[10]).toBe(1);
    expect(size[11]).toBe(0);
  });

  it("does nothing when flat", () => {
    const s = new Session();
    s.compile('//@version=5\nstrategy("S")\nif bar_index == 10\n    strategy.close_all(immediately = true)\n');
    expect(s.runHistory(bars).trades).toEqual([]);
  });

  it("honours `when = false`", () => {
    const s = new Session();
    s.compile('//@version=5\nstrategy("S")\nif bar_index == 5\n    strategy.entry("L", strategy.long)\n' +
      'strategy.close_all(immediately = true, when = bar_index == 10 and false)\n');
    expect(s.runHistory(bars).trades).toEqual([]);
  });
});
