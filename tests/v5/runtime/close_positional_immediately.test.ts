/**
 * Positional `immediately` of `strategy.close` and `strategy.close_all`.
 *
 * v5/v6: `strategy.close(id, comment, qty, qty_percent, alert_message,
 * immediately, disable_alert)` (v5 has `when` after `id`) and
 * `strategy.close_all(comment, alert_message, immediately, disable_alert)`; v5
 * also has `when` first in `close_all`. `disable_alert` is accepted and unused.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

// Bar i opens at 100 + i and closes at 103 + i: bar 10's close is 113, bar 11's open 111.
const bars = Array.from({ length: 30 }, (_, i) => ({
  time: Date.UTC(2024, 0, 1) + i * 86_400_000,
  open: 100 + i, high: 110 + i, low: 90 + i, close: 103 + i, volume: 1000,
}));

function run(version: 5 | 6, close: string) {
  const s = new Session();
  const c = s.compile(
    `//@version=${version}\nstrategy("S")\n` +
    `if bar_index == 5\n    strategy.entry("L", strategy.long)\n` +
    `if bar_index == 10\n    ${close}\n`);
  expect(c.errors).toEqual([]);
  return s.runHistory(bars);
}

describe("positional immediately", () => {
  const calls: Record<5 | 6, string[]> = {
    5: ['strategy.close("L", true, "c", na, na, "", true)', 'strategy.close("L", true, "c", na, na, "", true, false)',
        'strategy.close_all("c", true, "", true)', 'strategy.close_all("c", true, "", true, false)'],
    6: ['strategy.close("L", "c", na, na, "", true)', 'strategy.close("L", "c", na, na, "", true, false)',
        'strategy.close_all("c", "", true)', 'strategy.close_all("c", "", true, false)'],
  };
  for (const version of [5, 6] as const) {
    for (const call of calls[version]) {
      it(`v${version}: ${call} fills at bar 10's close, 113`, () => {
        const r = run(version, call);
        expect(r.droppedArguments).toEqual([]);
        expect(r.trades).toHaveLength(1);
        expect(r.trades[0]).toMatchObject({ entryPrice: 106, exitPrice: 113, exitBarIndex: 10, exitComment: "c" });
      });
    }
  }
});
