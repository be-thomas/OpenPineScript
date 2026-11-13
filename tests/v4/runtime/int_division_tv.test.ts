/**
 * v4 `/` between two constant ints truncates toward zero, against TradingView.
 * Probe: dev-docs/tv-parity/_probes/version-scope/v4-int-div (plots in data.csv):
 *
 *   a = 1 / 3 -> 0, c = -7 / 2 -> -3, d = 7 / 2.0 -> 3.5,
 *   b = bar_index / 7 -> fractional (1037.5714285714287 at bar_index 7263),
 *   f = (bar_index - 10000) / 7 -> fractional, e = bar_index % 7 -> int remainder.
 *
 * v1-v3 truncate the same way (probes v1-int-div, v2-int-div, v3-int-div).
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const bars = Array.from({ length: 10 }, (_, i) => ({
  time: Date.UTC(2024, 0, 1) + i * 3_600_000, open: 100, high: 101, low: 99, close: 100, volume: 1,
}));

function plots(version: 1 | 2 | 3 | 4): Record<string, number> {
  const bi = version <= 3 ? "n" : "bar_index";
  const src = `//@version=${version}\nstudy("t")\n` +
    `a = 1 / 3\nb = ${bi} / 7\nc = -7 / 2\nd = 7 / 2.0\ne = ${bi} % 7\nf = (${bi} - 10000) / 7\n` +
    `plot(a, "a")\nplot(b, "b")\nplot(c, "c")\nplot(d, "d")\nplot(e, "e")\nplot(f, "f")\n`;
  const s = new Session();
  expect(s.compile(src).errors).toEqual([]);
  const r: any = s.runHistory(bars);
  expect(r.errors ?? []).toEqual([]);
  const last = (title: string) => {
    const p = r.series.find((x: any) => x.title === title);
    return p.data[p.data.length - 1].value;
  };
  return Object.fromEntries(["a", "b", "c", "d", "e", "f"].map(t => [t, last(t)]));
}

describe("v4 const int division", () => {
  it("truncates two constant ints and keeps the fraction otherwise", () => {
    const p = plots(4);
    expect(p.a).toBe(0);
    expect(p.c).toBe(-3);
    expect(p.d).toBe(3.5);
    expect(p.b).toBeCloseTo(9 / 7, 12);
    expect(p.e).toBe(9 % 7);
    expect(p.f).toBeCloseTo((9 - 10000) / 7, 9);
  });

  it.each([1, 2, 3] as const)("v%i truncates two constant ints too", (v) => {
    const p = plots(v);
    expect(p.a).toBe(0);
    expect(p.c).toBe(-3);
    expect(p.d).toBe(3.5);
    expect(p.e).toBe(9 % 7);
  });
});
