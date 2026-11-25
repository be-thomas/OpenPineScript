/**
 * v6 `and`/`or` short-circuit, but the base of `(expr)[n]` in an operand that may be skipped is still
 * written on every bar the statement runs. TradingView capture, popular-author batch 2026-11-21, n146
 * (FVG Crossfire, v6): `timeframe.change("D") or timeframe.change("D")[1]` is true on the second bar of
 * each day; with the base carried over the bar its operand was skipped, it fired on the third bar
 * instead and 13 drawings differed (all match with the base written every bar).
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const bars = Array.from({ length: 30 }, (_, i) => ({
  time: Date.UTC(2026, 0, 1, 20) + i * 3600e3, open: 100, high: 101, low: 99, close: 100 + (i % 5), volume: 1,
}));

function plot(src: string): number[] {
  const s = new Session();
  s.setChart({ symbol: "X", timeframe: "60", mintick: 0.01, timezone: "Etc/UTC", session: "24x7" } as any);
  expect(s.compile(src).errors).toEqual([]);
  const r: any = s.runHistory(bars);
  expect(r.errors).toEqual([]);
  return r.series[0].data.map((p: any) => p?.value ?? NaN);
}

describe("v6 lazy and/or keeps history bases current", () => {
  it("timeframe.change(\"D\") or timeframe.change(\"D\")[1] is true on the first two bars of a day", () => {
    const got = plot(`//@version=6
indicator("t")
g = timeframe.isintraday and (timeframe.change("D") or timeframe.change("D")[1])
plot(g ? 1 : 0)
`);
    bars.forEach((b, i) => {
      const h = new Date(b.time).getUTCHours();
      expect(got[i], `bar ${i} (${h}:00)`).toBe(i > 0 && (h === 0 || h === 1) ? 1 : 0);
    });
  });

  it("only the base moves: the right operand stays lazy", () => {
    // f() counts its calls; skipped whenever the left side is true
    const got = plot(`//@version=6
indicator("t")
var a = array.new_int(1, 0)
f() =>
    a.set(0, a.get(0) + 1)
    true
x = bar_index % 2 == 0 or f()
plot(a.get(0))
`);
    expect(got[29]).toBe(15);
  });
});
