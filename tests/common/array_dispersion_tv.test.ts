/**
 * array.stdev / array.variance take `biased` (default true: divide by n; false:
 * n - 1). TradingView capture, popular-author batch 2026-11-21 (v6); the v5
 * reference documents the same parameter. array.covariance is not probed yet.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../runtime/v1/session";

function last(src: string): number[] {
  const s = new Session();
  expect(s.compile(src).errors).toEqual([]);
  const r: any = s.runHistory([{ time: 1_700_000_000, open: 1, high: 2, low: 0, close: 1, volume: 1 }]);
  expect(r.errors).toEqual([]);
  return r.series.map((x: any) => x.data[0].value);
}

describe.each(["5", "6"])("array dispersion, v%s", (v) => {
  const head = `//@version=${v}\nindicator("t")\na = array.from(1., 2., 3., 4.)\nb = array.from(2., 1., 4., 3.)\n`;

  it("stdev", () => {
    const [d, t, f] = last(head + "plot(array.stdev(a))\nplot(array.stdev(a, true))\nplot(array.stdev(a, false))\n");
    expect(d).toBeCloseTo(1.118033988749895, 12);
    expect(t).toBeCloseTo(1.118033988749895, 12);
    expect(f).toBeCloseTo(1.2909944487358056, 12);
  });

  it("variance", () => {
    const [d, f] = last(head + "plot(array.variance(a))\nplot(array.variance(a, false))\n");
    expect(d).toBeCloseTo(1.25, 12);
    expect(f).toBeCloseTo(1.6666666666666667, 12);
  });

  it("covariance", () => {
    // deviations of a: -1.5 -.5 .5 1.5; of b: -.5 -1.5 1.5 .5; products sum to 3
    const [d, f] = last(head + "plot(array.covariance(a, b))\nplot(array.covariance(a, b, false))\n");
    expect(d).toBeCloseTo(0.75, 12);
    expect(f).toBeCloseTo(1, 12);
  });
});

describe("array dispersion, v4", () => {
  it("divides by n by default (TradingView v4 capture, popular-author batch 2026-11-21)", () => {
    const [sd, va, cov] = last('//@version=4\nstudy("t")\na = array.from(1., 2., 3., 4.)\nb = array.from(2., 1., 4., 3.)\nplot(array.stdev(a))\nplot(array.variance(a))\nplot(array.covariance(a, b))\n');
    expect(sd).toBeCloseTo(1.118033988749895, 12);
    expect(va).toBeCloseTo(1.25, 12);
    expect(cov).toBeCloseTo(0.75, 12);
  });
});
