/**
 * The docs' `strategy.exit()` example at v6 with 1,000,000 capital:
 * TradingView's List of Trades (BTCUSDT 1D, the owner's screenshot) shows
 *   #1 Long entry Aug 18 2017 at 4285.08, exit 4285.58, size 20, +10.00
 *   #2 Long entry at 4285.08, exit 4286.08, size 20, +20.00
 *   #3 Long entry at 4285.08, still open, size 60
 * Two trailing exits (`trail_points` 50 and 100, zero offset) fill at their
 * activation levels, +0.50 and +1.00, on the bar that arms them, whatever the
 * bar's high; the rest stays open. Same as v5.
 *
 * The owner's screenshot had 1,000,000 set in the Properties dialog (SRC sets it
 * explicitly). v6's default is 100,000, at which the 428,508 entry is not
 * opened, as the replay in conformance/common/strategy_harness_golden.test.ts
 * shows.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Session } from "../../../runtime/v1/session";

const CSV = readFileSync(join(__dirname, "..", "..", "..", "conformance", "v6", "golden", "harness_release_notes_04_v6.BTCUSDT.1D.csv"), "utf8");
// TradingView's own first bars, from the OPS rows of the log.
const bars = CSV.split("\n").find(l => l.includes("OPS|"))!
  .split("OPS|")[1].replace(/"$/, "").split("|").slice(0, 10).map(r => r.split(",").map(Number))
  .map(c => ({ time: c[0], open: c[1], high: c[2], low: c[3], close: c[4], volume: c[5] }));

const SRC = `//@version=6
strategy("strategy.exit() example", overlay = true, initial_capital = 1000000)
strategy.entry("Long", strategy.long, qty = 100)
strategy.exit("Exit Long1", "Long", trail_points = 50, trail_offset = 0, qty_percent = 20)
strategy.exit("Exit Long2", "Long", trail_points = 100, trail_offset = 0, qty_percent = 20)
`;

describe("v6 strategy.exit() example at the default capital", () => {
  it("closes 20 at 4285.58 and 20 at 4286.08, leaving 60 open at 4285.08: net profit 30", () => {
    const s = new Session();
    expect(s.compile(SRC).errors).toEqual([]);
    const r: any = s.runHistory(bars);
    expect(r.errors).toEqual([]);
    // Compared by exit price: the list order is the order the bar's path reaches
    // the two stops, which TradingView's List of Trades screenshot does not show.
    expect(r.trades.map((t: any) => [t.entryPrice, t.exitPrice, t.qty, Math.round(t.pnl * 100) / 100])
      .sort((a: number[], b: number[]) => a[1] - b[1]))
      .toEqual([[4285.08, 4285.58, 20, 10], [4285.08, 4286.08, 20, 20]]);
    expect(r.position.size).toBe(60);
    expect(r.position.avgPrice).toBe(4285.08);
    expect(r.performance.all.netProfit ?? r.trades.reduce((a: number, t: any) => a + t.pnl, 0)).toBeCloseTo(30, 9);
  });
});
