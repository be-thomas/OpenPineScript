/**
 * `p[n]` on a user function's parameter is the value this call SITE was handed
 * on its previous call. TradingView capture, popular-author batch 2026-11-21
 * (v6): an expression argument is not na, and a variable argument reassigned
 * after the call does not leak its end-of-bar value into the history.
 * Calls made every bar only; a conditional call follows the outer-variable
 * rule (the value of the previous call), which TradingView has not been probed on.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../runtime/v1/session";

const closes = Array.from({ length: 10 }, (_, i) => 100 + ((i * 7) % 13));
const bars = closes.map((close, i) => ({
  time: 1_700_000_000 + i * 3600, open: close, high: close + 1, low: close - 1, close, volume: 1,
}));

function plots(src: string): number[][] {
  const s = new Session();
  expect(s.compile(src).errors).toEqual([]);
  const r: any = s.runHistory(bars);
  expect(r.errors).toEqual([]);
  return r.series.map((x: any) => x.data.map((p: any) => p?.value ?? NaN));
}

describe.each([["5", "indicator"], ["6", "indicator"]])("parameter history, v%s", (v, decl) => {
  const head = `//@version=${v}\n${decl}("t")\n`;

  it("an expression argument keeps its previous value", () => {
    const [a] = plots(head + `f(float x) => x - nz(x[1])\nplot(f(close * 2))\n`);
    a.forEach((val, i) => expect(val).toBeCloseTo(closes[i] * 2 - (i ? closes[i - 1] * 2 : 0), 9));
  });

  it("a variable reassigned after the call reads back the previous argument", () => {
    const [y] = plots(head + `var int pd = 1
f2(int d) => nz(d[1])
y = f2(pd)
pd := bar_index % 3 == 0 ? -1 : 1
plot(y)
`);
    // argument on bar i is the value pd held at the call: 1 on bar 0, then the previous bar's reassignment
    const arg = (i: number) => (i === 0 ? 1 : (i - 1) % 3 === 0 ? -1 : 1);
    y.forEach((val, i) => expect(val).toBe(i === 0 ? 0 : arg(i - 1)));
  });

  it("two call sites keep separate histories", () => {
    const [a, b] = plots(head + `f(float x) => nz(x[1])\nplot(f(close))\nplot(f(open * 2))\n`);
    a.forEach((val, i) => expect(val).toBe(i ? closes[i - 1] : 0));
    b.forEach((val, i) => expect(val).toBe(i ? closes[i - 1] * 2 : 0));
  });

  it("a built-in series argument keeps bar history", () => {
    const [a] = plots(head + `f(float x) => nz(x[1])\nif bar_index % 2 == 0\n    log.info("{0}", f(close))\nplot(f(close))\n`);
    a.forEach((val, i) => expect(val).toBe(i ? closes[i - 1] : 0));
  });
});

describe.each(["5", "6"])("parameter history, expression argument, conditional call, v%s", (v) => {
  it("p[1] is the argument of the previous CALL from the site", () => {
    const s = new Session();
    expect(s.compile(`//@version=${v}
indicator("t")
f(float p) => p[1]
float r = na
if bar_index % 3 == 0
    r := f(bar_index * 10)
plot(r)
`).errors).toEqual([]);
    const res: any = s.runHistory(bars);
    expect(res.errors).toEqual([]);
    const got = res.series[0].data.map((p: any) => p?.value ?? NaN);
    // called on bars 0, 3, 6, 9 with 0, 30, 60, 90
    expect(got[0]).toBeNaN();
    expect(got[3]).toBe(0);
    expect(got[6]).toBe(30);
    expect(got[9]).toBe(60);
  });
});
