/**
 * math.round(x, digits) as TradingView computes it, from TradingView Pine Logs (BINANCE:BTCUSDT, probes
 * r7_round_cutoff and r7_round_cutoff2, 2026-11-23). With digits, x*10^digits is taken to 10 decimals
 * before rounding half away from zero, so a value 1e-11 below a half rounds up and 1e-10 below rounds down.
 * Without digits there is no snap.
 */
import { describe, it, expect } from "vitest";
import { round } from "../../runtime/v1/stdlib/core";

describe("math.round(x, digits): values just below a half (TradingView logs)", () => {
  const cases: [number, number, number][] = [
    [272.3649999999999, 2, 272.37], [272.365, 2, 272.37], [0.28499999999999998, 2, 0.29],
    [1.2344999999999999, 3, 1.235], [2.67499999999999, 2, 2.68], [2.674999999999999, 2, 2.68],
    [0.1 + 0.2 + 0.0049999999999999, 2, 0.31], [1.005, 2, 1.01],
  ];
  for (const [x, p, want] of cases) it(`round(${x}, ${p}) = ${want}`, () => expect(round(x, p)).toBe(want));

  // halfway minus 10^-k: [halfway, digits, first k that TradingView rounded up]
  const sweeps: [number, number, number][] = [[2.65, 1, 12], [2.675, 2, 13], [272.365, 2, 13], [-2.675, 2, 13], [2.67445, 4, 15]];
  for (const [h, p, firstUp] of sweeps) {
    it(`${h} - 10^-k with ${p} digits rounds up from k = ${firstUp}`, () => {
      const step = 10 ** -p, up = Math.sign(h) * (Math.abs(h) + step / 2), down = Math.sign(h) * (Math.abs(h) - step / 2);
      for (let k = 9; k <= 15; k++) {
        const x = h > 0 ? 0 + h - 10 ** -k : 0 + h + 10 ** -k;
        expect(round(x, p)).toBeCloseTo(k >= firstUp ? up : down, p + 2);
      }
    });
  }

  it("no snap without digits", () => {
    expect(round(0.5 - 1e-16)).toBe(0);
    expect(round(2.5 - 1e-15)).toBe(2);
    expect(round(-2.5)).toBe(-3);
    expect(round(1234567.125 - 1e-9, 2)).toBe(1234567.12);
  });
});
