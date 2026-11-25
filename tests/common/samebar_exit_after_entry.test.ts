/**
 * An exit of a trade opened on this bar walks only the rest of the bar's path,
 * from where the entry filled. TradingView, BINANCE:BTCUSDT 1h, a long stop
 * entry and its stop-loss placed together on the bar before
 * (dev-docs/tv-parity/_probes/samebar-exit, v2 to v6 alike, 2026-11-14):
 *   A. 2026-11-04 05:00, O 77390 H 78164 L 77274 C 77748.09 — the low is nearer
 *      the open, so the path is open, low, high, close. The entry stop 78063.3
 *      fills on the way up; after it the price only falls to the close, so the
 *      stop-loss 77282.67 (above the low) does NOT fill on that bar.
 *   B. 2026-11-09 06:00, O 74472.3 H 74655.24 L 74000 C 74306.01 — the high is
 *      nearer, so open, high, low, close. The entry stop 74600 fills, then the
 *      low comes, and the stop-loss 74100 fills on the same bar.
 * The engine walked every exit over the whole bar, so A exited at its own entry
 * bar: Gold Breakout 15M Strategy lost a trade a day this way and its equity, and
 * so every later quantity, drifted ~30% below TradingView's.
 */
import { describe, it, expect } from "vitest";
import { Session, type Candle } from "../../runtime/v1/session";

const H = 3600e3, T0 = Date.UTC(2026, 0, 1);
function bars(entryBar: [number, number, number, number]): Candle[] {
  const flat: [number, number, number, number] = [100, 101, 99, 100];
  // After the entry bar the price stays around its close, so no later bar reaches an exit level.
  const c = entryBar[3];
  const after: [number, number, number, number] = [c, c + 1, c - 1, c];
  return [flat, flat, entryBar, after, after]
    .map(([open, high, low, close], i) => ({ time: T0 + i * H, open, high, low, close, volume: 1 }));
}

function run(version: number, entryBar: [number, number, number, number], side: "long" | "short", entry: number, stop: number) {
  const s = new Session();
  s.setChart({ symbol: "X", timeframe: "60", mintick: 0.01, timezone: "UTC" });
  const dir = side === "long" ? "strategy.long" : "strategy.short";
  const c = s.compile(`//@version=${version}
strategy("samebar")
if ${version >= 4 ? "bar_index" : "n"} == 1
    strategy.entry("E", ${dir}, qty = 1, stop = ${entry})
    strategy.exit("SL", from_entry = "E", stop = ${stop})
`);
  expect(c.errors).toEqual([]);
  const r: any = s.runHistory(bars(entryBar));
  return { trades: r.trades.map((t: any) => [t.entryPrice, t.exitPrice]), open: r.position.size };
}

describe.each([2, 3, 4, 5, 6])("v%i an exit of a trade opened on this bar", (version) => {
  it("does not fill on the prices before the entry (low nearer the open)", () => {
    // open 100, low 95, high 110, close 104: entry at 108 on the way up; 96 came before it.
    const r = run(version, [100, 110, 95, 104], "long", 108, 96);
    expect(r.trades).toEqual([]);
    expect(r.open).toBe(1);
  });
  it("fills on the prices after the entry (high nearer the open)", () => {
    // open 100, high 104, low 90, close 95: entry at 103, then the low passes 96.
    const r = run(version, [100, 104, 90, 95], "long", 103, 96);
    expect(r.trades).toEqual([[103, 96]]);
    expect(r.open).toBe(0);
  });
  it("mirrors for a short", () => {
    // open 100, high 105, low 90, close 96 (high nearer): high first, the short's
    // entry at 92 fills on the way down after it, so the stop at 104 is not hit.
    const kept = run(version, [100, 105, 90, 96], "short", 92, 104);
    expect(kept.trades).toEqual([]);
    expect(kept.open).toBe(-1);
    // open 100, low 96, high 110, close 104 (low nearer): entry at 97, then the high passes 104.
    const hit = run(version, [100, 110, 96, 104], "short", 97, 104);
    expect(hit.trades).toEqual([[97, 104]]);
  });
});
