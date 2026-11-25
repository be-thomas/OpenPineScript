/**
 * array.variance / array.stdev / array.covariance, bit for bit as TradingView computes them
 * (probe c130 C1, BINANCE:BTCUSDT 1h; C2 confirmed the same formulas on 249 bars of a
 * 51-bar regression of a daily close on itself).
 *
 *   variance = Σx²/d − mean·(Σx/d), d = n (biased) or n − 1; stdev = √variance
 *   covariance = Σ(x − mx)(y − my)/d (two-pass)
 *
 * So covariance(a, a) and variance(a) differ in the last bits on TradingView.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../runtime/v1/session";

describe("array dispersion formulas (probe C1)", () => {
  it("reproduces TradingView's doubles exactly", () => {
    const s = new Session();
    s.setChart({ timeframe: "60", symbol: "BINANCE:BTCUSDT" } as any);
    const c = s.compile(`//@version=6
indicator("t")
a = array.new_float()
b = array.new_float()
for i = 0 to 50
    a.push(70000.0 + i * 123.45 + (i % 7) * 0.37)
    b.push(1.0 / (i + 3.0) + 60000.0 + (i % 5) * 11.13)
plot(array.covariance(a, a), "cov_aa")
plot(array.variance(a), "var_a")
plot(array.covariance(a, a, false), "cov_aa_u")
plot(array.variance(a, false), "var_a_u")
plot(array.covariance(a, b), "cov_ab")
plot(array.stdev(a), "sd_a")
plot(array.covariance(a, a) / array.variance(a) - 1, "ratio_m1")
`);
    expect(c.errors).toEqual([]);
    const r: any = s.runHistory([{ time: 0, open: 1, high: 1, low: 1, close: 1, volume: 1 }]);
    const v = (t: string) => r.series.find((x: any) => x.title === t).data[0].value;
    expect(v("cov_aa")).toBe(3302111.986117494);
    expect(v("var_a")).toBe(3302111.986114502);
    expect(v("cov_aa_u")).toBe(3368154.225839844);
    expect(v("var_a_u")).toBe(3368154.2258377075);
    expect(v("cov_ab")).toBe(1263.2160532337084);
    expect(v("sd_a")).toBe(1817.1714245261787);
    expect(v("ratio_m1")).toBe(9.059419880941277e-13);
  });

  // Probe C4 (coordinator's, BINANCE:BTCUSDT 1h): the one-pass form is not clamped. Equal values
  // that are not exact in binary give a variance a hair below zero, and its square root is na.
  it("constant arrays (probe C4)", () => {
    const s = new Session();
    s.setChart({ timeframe: "60", symbol: "BINANCE:BTCUSDT" } as any);
    const c = s.compile(`//@version=6
indicator("t")
a = array.from(0.1, 0.1, 0.1)
b = array.from(0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3)
c = array.from(1.1, 1.1, 1.1, 1.1, 1.1)
plot(array.variance(a), "va")
plot(na(array.stdev(a)) ? -1 : array.stdev(a), "sa")
plot(array.variance(b), "vb")
plot(na(array.stdev(b)) ? -1 : array.stdev(b), "sb")
plot(array.variance(c), "vc")
plot(na(array.stdev(c)) ? -1 : array.stdev(c), "sc")
plot(array.variance(c, false), "vcu")
`);
    expect(c.errors).toEqual([]);
    const r: any = s.runHistory([{ time: 0, open: 1, high: 1, low: 1, close: 1, volume: 1 }]);
    const v = (t: string) => r.series.find((x: any) => x.title === t).data[0].value;
    expect(v("va")).toBe(-1.734723475976807e-18);
    expect(v("sa")).toBe(-1);
    expect(v("vb")).toBe(-1.3877787807814457e-17);
    expect(v("sb")).toBe(-1);
    expect(v("vc")).toBe(0);
    expect(v("sc")).toBe(0);
    expect(v("vcu")).toBe(0);
  });
});
