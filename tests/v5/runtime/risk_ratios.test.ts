/**
 * Sharpe and Sortino.
 *
 * Driven directly rather than through a strategy. The two candidate Sortino
 * divisors agree exactly when every month is a loser, and the crossover
 * fixtures here do lose every month, so a test routed through a run would
 * pass with either formula in place and prove nothing.
 */
import { describe, it, expect } from "vitest";
import { riskRatios } from "../../../runtime/v1/session";

/**
 * An equity curve, one point per calendar month, whose month-on-month returns
 * are the ones given.
 *
 * `riskRatios` closes the series with one more return for the final month,
 * which with a single point in it is always 0 — so the series it actually
 * averages is `[...returns, 0]`, and these tests expect that rather than
 * pretending otherwise.
 */
function curveFrom(returns: number[]) {
  const pts = [{ time: Date.UTC(2024, 0, 1), equity: 10_000, openPL: 0 }];
  let equity = 10_000;
  returns.forEach((r, i) => {
    equity = equity * (1 + r);
    pts.push({ time: Date.UTC(2024, i + 1, 1), equity, openPL: 0 });
  });
  return pts;
}

const seriesFor = (returns: number[]) => [...returns, 0];
const meanOf = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

describe("downside deviation", () => {
  it("divides by every month, not only the losing ones", () => {
    // Twelve months, one of them -2%, the rest flat. Filtering to the losers
    // first gives a downside deviation of 2%; the published definition —
    // sqrt(sum(min(0, r)^2) / N) with N = ALL periods — gives 2%/sqrt(N).
    // Sortino came out several times too low, and the more consistently
    // profitable a strategy was, the smaller that divisor and the worse the
    // understatement.
    const returns = [-0.02, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const series = seriesFor(returns);
    const mean = meanOf(series);

    const correct = Math.sqrt(0.02 ** 2 / series.length);
    expect(riskRatios(curveFrom(returns), 0).sortinoRatio).toBeCloseTo(mean / correct, 9);

    // The filtered divisor is the single losing month alone, which is sqrt(N)
    // away from the right answer.
    const filtered = 0.02;
    expect(Math.abs(mean / correct))
      .toBeCloseTo(Math.abs(mean / filtered) * Math.sqrt(series.length), 9);
  });

  it("falls as the same loss is spread over more months", () => {
    // Under the filtered divisor this figure cannot move: the losing month is
    // the only input to it, however many winning months surround it.
    const one = [-0.02, 0.01, 0.01];
    const many = [-0.02, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01];
    const downside = (rs: number[]) => {
      const s = seriesFor(rs);
      return Math.sqrt(s.reduce((a, x) => a + Math.min(0, x) ** 2, 0) / s.length);
    };
    expect(downside(many)).toBeLessThan(downside(one));
    expect(riskRatios(curveFrom(many), 0).sortinoRatio)
      .toBeCloseTo(meanOf(seriesFor(many)) / downside(many), 9);
  });

  it("leaves Sortino undefined when no month lost", () => {
    expect(riskRatios(curveFrom([0.01, 0.02, 0.01, 0.03]), 0).sortinoRatio).toBeNaN();
  });
});

describe("Sharpe", () => {
  it("uses the standard deviation of every month", () => {
    const returns = [0.01, -0.02, 0.03, 0.00, 0.01, -0.01];
    const series = seriesFor(returns);
    const mean = meanOf(series);
    const sd = Math.sqrt(
      series.map(x => x - mean).reduce((a, x) => a + x * x, 0) / series.length);
    expect(riskRatios(curveFrom(returns), 0).sharpeRatio).toBeCloseTo(mean / sd, 9);
  });

  it("deducts the risk-free rate a month at a time", () => {
    // `risk_free_rate` is an ANNUAL percentage, so a month's share is
    // rate / 100 / 12.
    const returns = [0.01, 0.01, 0.01, 0.01];
    const series = seriesFor(returns);
    const withRate = series.map(x => x - 6 / 100 / 12);
    const mean = meanOf(withRate);
    const sd = Math.sqrt(
      withRate.map(x => x - mean).reduce((a, x) => a + x * x, 0) / withRate.length);
    expect(riskRatios(curveFrom(returns), 6).sharpeRatio).toBeCloseTo(mean / sd, 9);
  });

  it("leaves both undefined with fewer than two months", () => {
    const r = riskRatios([{ time: Date.UTC(2024, 0, 1), equity: 10_000, openPL: 0 }], 0);
    expect(r.sharpeRatio).toBeNaN();
    expect(r.sortinoRatio).toBeNaN();
  });
});
