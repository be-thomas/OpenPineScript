/**
 * `barstate.isnew` on realtime bars, against TradingView. Captures:
 * dev-docs/tv-parity/_probes/realtime/rt-semantics-v6/run-20261113-040218 and
 * run-20261112-100328/01_RT-semantics-probe-v6 (source: probe.pine there).
 *
 * `varip int tb = 0; if barstate.isrealtime  tb := barstate.isnew ? 1 : tb + 1`
 * logged 1..21, 1..48, 1..27 over three live bars: isnew is true on historical
 * bars and on the FIRST tick of a realtime bar, false on every later tick of it.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const H = 3_600_000;
const t0 = Date.UTC(2024, 0, 1);
const N = 5;
const bars = Array.from({ length: N }, (_, i) => ({
  time: t0 + i * H, open: 100, high: 101, low: 99, close: 100, volume: 1,
}));
const candle = (bar: number, close: number) =>
  ({ time: t0 + (N + bar) * H, open: 100, high: 101, low: 99, close, volume: 1 });

const src = `//@version=6
indicator("isnew", overlay = false)
varip int tb = 0
if barstate.isrealtime
    tb := barstate.isnew ? 1 : tb + 1
plot(tb, "tb")
plot(barstate.isnew ? 1 : 0, "new")
`;

describe("barstate.isnew (TradingView-verified)", () => {
  const plot = (s: Session, i: number): any[] => [...(s as any).ctx.plots.values()][i];
  const value = (s: Session, i: number) => plot(s, i).at(-1).value;

  it("is true on every historical bar", () => {
    const s = new Session();
    s.setChart({ symbol: "TEST:X", timeframe: "60", mintick: 0.01 });
    expect(s.compile(src).errors).toEqual([]);
    const r: any = s.runHistory(bars);
    expect(r.errors ?? []).toEqual([]);
    expect(plot(s, 1).map(x => x.value)).toEqual([1, 1, 1, 1, 1]);
  });

  it("resets to 1 on each realtime bar's first tick and counts up after", () => {
    const s = new Session();
    s.setChart({ symbol: "TEST:X", timeframe: "60", mintick: 0.01 });
    expect(s.compile(src).errors).toEqual([]);
    s.runHistory(bars);
    const ticks = [3, 4, 2];
    const seen: number[][] = [];
    ticks.forEach((n, bar) => {
      const row: number[] = [];
      for (let k = 0; k < n; k++) {
        s.tick(candle(bar, 100 + k));
        row.push(value(s, 0));
      }
      seen.push(row);
      s.commit();
    });
    expect(seen).toEqual([[1, 2, 3], [1, 2, 3, 4], [1, 2]]);
  });
});
