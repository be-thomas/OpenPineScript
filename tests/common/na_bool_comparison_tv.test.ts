/**
 * v1-v5: a comparison with an na operand is an na bool, not false.
 *
 * TradingView:
 *  - v4, probe triage r6 fin-ind2/01 p2c_na_bool_plots (BINANCE:BTCUSDT 1h): on bar 0,
 *    `c = close > close[1]` gave `na(c)` = 1 while `c ? 1 : 0` gave 0, and `sum(c ? 1 : 0, 3)`
 *    had a value on bar 2: a condition reads the na bool as false.
 *  - v2, capture n427 (BINANCE:BTCUSDT 1h, 386 trades): `sum(close > close[1], 20)` is na through
 *    bar 19 (the first trade comes one bar later than with a false on bar 0, and only then do all
 *    386 trades match).
 *  - v1-v5, probes triage r6 runs/nacmp and nacmp3 (p_na_cmp_v1..v5, BINANCE:BTCUSDT 1h): on bar 0
 *    na(c) = 1, c ? 1 : 0 = 0, (not c) ? 1 : 0 = 1, (c or true) ? 1 : 0 = 1, na(not c) = na(c and true)
 *    = na(c or false) = 0, na(close == close[1]) = 1, na(iff(c, 1, 0)) = 0 at every version; v1/v2
 *    sum(c, 3) is na on bar 2. (v3 and v4 reject sum(bool) at compile time; the engine accepts it.)
 *  - v6, migration guide "Boolean values cannot be na": the comparison is false.
 * Synthetic bars here.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../runtime/v1/session";

const H = 3600_000, T0 = Date.UTC(2026, 0, 5);
const px = [10, 11, 12, 11, 13];
const bars = px.map((c, i) => ({ time: T0 + i * H, open: c, high: c, low: c, close: c, volume: 1 }));

function plots(src: string): Record<string, number[]> {
  const s = new Session();
  s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "60", mintick: 0.01 } as any);
  expect(s.compile(src).errors).toEqual([]);
  const r: any = s.runHistory(bars);
  expect(r.errors).toEqual([]);
  return Object.fromEntries(r.series.map((x: any) => [x.title, x.data.map((d: any) => d?.value ?? NaN)]));
}

describe("a comparison with an na operand", () => {
  it("v4: na() sees an na bool, a ternary reads it as false", () => {
    const p = plots(`//@version=4
study("t")
c = close > close[1]
t = c ? 1 : 0
plot(na(c) ? 1 : 0, "isna")
plot(na(t) ? -1 : t, "t")
plot(sum(t, 3), "s")`);
    expect(p.isna).toEqual([1, 0, 0, 0, 0]);
    expect(p.t).toEqual([0, 1, 1, 0, 1]);
    expect(p.s.slice(2)).toEqual([2, 2, 2]);   // the false on bar 0 counts: a value on bar 2
  });

  it("v2: the bool's implicit number is na, so sum() over it is na while bar 0 is in the window", () => {
    const p = plots(`//@version=2
study("t")
plot(sum(close > close[1], 3), "s")
plot(na(close > close[1]) ? 1 : 0, "isna")`);
    expect(p.s.slice(0, 3).every(Number.isNaN)).toBe(true);
    expect(p.s.slice(3)).toEqual([2, 2]);
    expect(p.isna).toEqual([1, 0, 0, 0, 0]);
  });

  for (const v of [1, 2, 3, 4, 5]) it(`v${v}: and/or/not read the na bool as false and return a plain bool; == propagates na`, () => {
    const vw = v >= 5 ? "ta.valuewhen" : "valuewhen", bi = v <= 3 ? "n" : "bar_index";
    const p = plots(`//@version=${v}
${v >= 5 ? "indicator" : "study"}("t")
c = close > close[1]
plot(${vw}(${bi} == 0, na(c) ? 1 : 0, 0), "isna0")
plot(${vw}(${bi} == 0, c ? 1 : 0, 0), "t0")
plot(${vw}(${bi} == 0, (not c) ? 1 : 0, 0), "not0")
plot(${vw}(${bi} == 0, (c or true) ? 1 : 0, 0), "or0")
plot(${vw}(${bi} == 0, na(not c) ? 1 : 0, 0), "notna0")
plot(${vw}(${bi} == 0, na(c and true) ? 1 : 0, 0), "andna0")
plot(${vw}(${bi} == 0, na(c or false) ? 1 : 0, 0), "orna0")
plot(${vw}(${bi} == 0, na(close == close[1]) ? 1 : 0, 0), "eqna0")`);
    const last = (t: string) => p[t].at(-1);
    expect([last("isna0"), last("t0"), last("not0"), last("or0"), last("notna0"), last("andna0"), last("orna0"), last("eqna0")])
      .toEqual([1, 0, 1, 1, 0, 0, 0, 1]);
  });

  it("v6: bools are never na, the comparison is false", () => {
    const p = plots(`//@version=6
indicator("t")
plot((close > close[1]) == false ? 1 : 0, "f")`);
    expect(p.f).toEqual([1, 0, 0, 1, 0]);
  });
});
