/**
 * ta.percentile_linear_interpolation ranks at p/100 * n - 0.5 (0-based over the
 * sorted window), interpolates linearly, and clamps to the window. TradingView
 * capture, popular-author batch 2026-11-21 (v6).
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../runtime/v1/session";

const bars = Array.from({ length: 10 }, (_, i) => ({
  time: 1_700_000_000 + i * 3600, open: i + 1, high: i + 2, low: i, close: 10 - i, volume: 1,
}));

describe.each(["5", "6"])("ta.percentile_linear_interpolation, v%s", (v) => {
  it("window of 1..10 (fed in descending order)", () => {
    const s = new Session();
    const src = `//@version=${v}\nindicator("t")\n` +
      [50, 25, 90, 1, 99].map((p) => `plot(ta.percentile_linear_interpolation(close, 10, ${p}))\n`).join("");
    expect(s.compile(src).errors).toEqual([]);
    const r: any = s.runHistory(bars);
    expect(r.errors).toEqual([]);
    const at = (i: number) => r.series[i].data[9].value;
    expect(at(0)).toBeCloseTo(5.5, 12);  // pos 4.5
    expect(at(1)).toBeCloseTo(3, 12);    // pos 2
    expect(at(2)).toBeCloseTo(9.5, 12);  // pos 8.5
    expect(at(3)).toBe(1);               // pos -0.4, clamped to the minimum
    expect(at(4)).toBe(10);              // pos 9.4, clamped to the maximum
  });
});
