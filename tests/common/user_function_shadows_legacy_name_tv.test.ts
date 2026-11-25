/**
 * A user function named like a built-in that v4 spelled without a namespace
 * (`vwap`, `sma`, `macd`, `change`, ...) is the user's function in v5 and v6.
 * TradingView capture, popular-author batch 2026-11-21 (v6): a script defining
 * `vwap(a, b, c) => [a, b]` and unpacking two values compiles and runs.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../runtime/v1/session";

const bars = Array.from({ length: 4 }, (_, i) => ({
  time: 1_700_000_000 + i * 3600, open: 10 + i, high: 20, low: 5, close: 12 + i, volume: 100 + i,
}));

describe.each(["5", "6"])("user functions over legacy names, v%s", (v) => {
  it("vwap with a user tuple of two values", () => {
    const s = new Session();
    expect(s.compile(`//@version=${v}
indicator("t")
vwap(a, b, c) => [a, b]
[x, y] = vwap(close, volume, true)
plot(x)
plot(y)
`).errors).toEqual([]);
    const r: any = s.runHistory(bars);
    expect(r.errors).toEqual([]);
    const col = (i: number) => r.series[i].data.map((p: any) => p.value);
    expect(col(0)).toEqual(bars.map((b) => b.close));
    expect(col(1)).toEqual(bars.map((b) => b.volume));
  });

  it("other legacy names resolve to the user's definition", () => {
    const s = new Session();
    expect(s.compile(`//@version=${v}
indicator("t")
macd(a, b) => [a, b, 1]
bb(a, b) => [a, b]
sma(a, b) => a + b
highest(a) => a * 2
change(a) => a * 3
[m1, m2, m3] = macd(close, open)
[b1, b2] = bb(close, open)
plot(m1 + m2 + m3)
plot(b2)
plot(sma(1, 2))
plot(highest(2))
plot(change(2))
`).errors).toEqual([]);
    const r: any = s.runHistory(bars);
    expect(r.errors).toEqual([]);
    const last = (i: number) => r.series[i].data.at(-1).value;
    expect(last(0)).toBe(15 + 13 + 1);
    expect(last(1)).toBe(13);
    expect(last(2)).toBe(3);
    expect(last(3)).toBe(4);
    expect(last(4)).toBe(6);
  });
});
