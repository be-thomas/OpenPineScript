/**
 * Smoothing in TradingView's float order, bit for bit (299/299 or 300/300 bars of
 * exported ta.rma / ta.rsi, ta.ema, ta.sma and ta.percentrank against TradingView).
 * The expected values are computed here in that order on synthetic data, and
 * compared with toBe: an ulp of drift fails.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../runtime/v1/session";

const bars = Array.from({ length: 80 }, (_, i) => {
  const c = 100 + Math.sin(i / 3) * 7 + (i % 5) * 0.37 + i * 0.013;
  return { time: 1_700_000_000_000 + i * 3600_000, open: c, high: c + 1, low: c - 1, close: c, volume: 1 };
});
const closes = bars.map((b) => b.close);

function plotted(v: string, expr: string, data = bars): Array<number | null> {
  const s = new Session();
  expect(s.compile(`//@version=${v}\nindicator("t")\nplot(${expr}, "p")\n`).errors).toEqual([]);
  const r: any = s.runHistory(data);
  expect(r.errors).toEqual([]);
  return r.series.find((x: any) => x.title === "p").data.map((p: any) => p?.value ?? null);
}

describe.each(["5", "6"])("bit-exact smoothing, v%s", (v) => {
  it("ta.rma is (prev * (length - 1) + src) / length", () => {
    const n = 14;
    let prev = closes.slice(0, n).reduce((a, b) => a + b, 0) / n;
    const want: Array<number | null> = closes.map((_, i) => (i < n - 1 ? null : i === n - 1 ? prev : null));
    for (let i = n; i < closes.length; i++) { prev = (prev * (n - 1) + closes[i]) / n; want[i] = prev; }
    expect(plotted(v, `ta.rma(close, ${n})`)).toEqual(want);
  });

  it("ta.ema is prev + alpha * (src - prev)", () => {
    const n = 10, alpha = 2 / (n + 1);
    let prev = closes.slice(0, n).reduce((a, b) => a + b, 0) / n;
    const want: Array<number | null> = closes.map((_, i) => (i === n - 1 ? prev : null));
    for (let i = n; i < closes.length; i++) { prev = prev + alpha * (closes[i] - prev); want[i] = prev; }
    expect(plotted(v, `ta.ema(close, ${n})`)).toEqual(want);
  });

  it("ta.sma sums the window afresh with compensation", () => {
    // Exact window sum is 2; a plain left-to-right sum loses the 1s next to 1e16 and gives 0.25.
    const data = [1e16, 1, -1e16, 1].map((c, i) => ({ time: 1_700_000_000_000 + i * 3600_000, open: c, high: c, low: c, close: c, volume: 1 }));
    expect(plotted(v, "ta.sma(close, 4)", data)).toEqual([null, null, null, 0.5]);
  });

  it("ta.variance is the compensated sum of squares over n minus the compensated mean squared", () => {
    // TradingView probe triage/runs/13_t13_stdev (BTCUSDT 1h, 299 bars): ta.variance(close, 30), ta.stdev(close, 100) and
    // ta.stdev(close * 1000, 800) are bit-identical to this order; mean-then-squared-deviations is off in the last digits.
    const n = 20;
    const comp = (xs: number[]) => { let t = 0, c = 0; for (const x of xs) { const u = t + x; c += Math.abs(t) >= Math.abs(x) ? (t - u) + x : (x - u) + t; t = u; } return t + c; };
    const varOf = (i: number) => { const w = closes.slice(i - n + 1, i + 1); const m = comp(w) / n; return comp(w.map((x) => x * x)) / n - m * m; };
    const want = closes.map((_, i) => (i < n - 1 ? null : varOf(i)));
    expect(plotted(v, `ta.variance(close, ${n})`)).toEqual(want);
    expect(plotted(v, `ta.stdev(close, ${n})`)).toEqual(want.map((x) => (x === null ? null : Math.sqrt(Math.max(0, x)))));
  });

  it("ta.stdev cancels as TradingView does on a large offset", () => {
    // TradingView probe triage/r4/runs/06_p_variance_cancellation: stdev(1e8 + bar_index % 4, 4) is
    // 1.4142135623730951 (variance 2), not the exact sqrt(1.25) = 1.118...
    const data = Array.from({ length: 8 }, (_, i) => ({ time: 1_700_000_000_000 + i * 3600_000, open: 1e8 + (i % 4), high: 1e8 + (i % 4), low: 1e8 + (i % 4), close: 1e8 + (i % 4), volume: 1 }));
    const got = plotted(v, "ta.stdev(close, 4)", data);
    expect(got.slice(3)).toEqual(Array(5).fill(1.4142135623730951));
    expect(plotted(v, "ta.variance(close, 4)", data)[3]).toBe(2);
  });

  it("ta.ema and ta.rma skip an infinite sample like na", () => {
    // TradingView probe triage/r3/runs/02_v2_divzero: x / 0 keeps its IEEE value, and the average built
    // from a series that starts with it is finite once real samples arrive.
    const src = "(bar_index < 3 ? 1.0 / 0 : close)";
    const fin = (f: string) => plotted(v, `ta.${f}(${src}, 5)`);
    for (const f of ["ema", "rma"]) {
      const got = fin(f);
      expect(got.slice(0, 7)).toEqual(Array(7).fill(null));
      expect(got.slice(7).every((x) => x !== null && Number.isFinite(x))).toBe(true);
    }
    // the seed is the sma of the first five FINITE samples (bars 3..7), as with na
    const seed = closes.slice(3, 8).reduce((a, b) => a + b, 0) / 5;
    expect(plotted(v, `ta.ema(${src}, 5)`)[7]).toBeCloseTo(seed, 9);
  });

  it("ta.percentrank is 100 * count / length, counting the previous length values <= current", () => {
    const n = 7;
    const want: Array<number | null> = closes.map((c, i) => {
      if (i < n) return null;
      let count = 0;
      for (let k = i - n; k < i; k++) if (closes[k] <= c) count++;
      return 100 * count / n;
    });
    expect(plotted(v, `ta.percentrank(close, ${n})`)).toEqual(want);
  });
});
