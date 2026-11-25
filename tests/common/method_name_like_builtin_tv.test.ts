/**
 * A user or library method named like a built-in method (`push`) is called only
 * when the receiver's type and the argument list fit it; otherwise the call is
 * the built-in's. A library's `push(array<Pattern> this, Pattern p, int max)`
 * whose body calls `this.push(p)` recursed into itself, and an importing
 * script's `.push` on another array resolved to it. TradingView capture,
 * popular-author batch 2026-11-21 (v6); same rule at v5.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../runtime/v1/session";

const bars = Array.from({ length: 6 }, (_, i) => ({
  time: 1_700_000_000 + i * 3600, open: 1, high: 2, low: 0, close: 10 + i, volume: 1,
}));

function run(src: string, libraries?: Record<string, string>) {
  const s = new Session();
  const c = s.compile(src, libraries ? { libraries } : undefined);
  expect(c.errors).toEqual([]);
  const r: any = s.runHistory(bars);
  expect(r.errors).toEqual([]);
  return r;
}
const last = (r: any, i: number) => r.series[i].data.at(-1).value;

describe.each(["5", "6"])("methods named like built-ins, v%s", (v) => {
  const head = `//@version=${v}\nindicator("t")\n`;

  it("a script's push(array<P>, P, int) calls the built-in push inside and trims", () => {
    const r = run(head + `type P
    float v
method push(array<P> this, P p, int maxItems) =>
    this.push(p)
    while this.size() > maxItems
        this.shift()
    this.size()
var array<P> ps = array.new<P>()
var array<float> a = array.new<float>()
n = ps.push(P.new(close), 3)
a.push(1.0)
plot(n)
plot(a.size())
plot(ps.size())
`);
    expect(last(r, 0)).toBe(3);   // kept maxItems elements
    expect(last(r, 1)).toBe(6);   // the built-in push on array<float>, once a bar
    expect(last(r, 2)).toBe(3);
  });

  it("a library's push is used on array<lib.P> and the built-in on any other array", () => {
    const lib = `//@version=${v}
library("Lib")
export type P
    float v
export method push(array<P> this, P p, int maxItems) =>
    this.push(p)
    while this.size() > maxItems
        this.shift()
    this.size()
`;
    const r = run(head + `import me/lib/1 as lib
var array<lib.P> ps = array.new<lib.P>()
var array<float> a = array.new<float>()
n = ps.push(lib.P.new(close), 2)
a.push(close)
plot(n)
plot(a.size())
plot(ps.size())
`, { "me/lib/1": lib });
    expect(last(r, 0)).toBe(2);
    expect(last(r, 1)).toBe(6);
    expect(last(r, 2)).toBe(2);
  });

  it("an array of another library's type takes the built-in push", () => {
    const pushLib = `//@version=${v}
library("PushLib")
export type Pattern
    float v
export method push(array<Pattern> this, Pattern p, int maxItems) =>
    this.push(p)
    while this.size() > maxItems
        this.shift()
    this.size()
`;
    const ohlcLib = `//@version=${v}
library("OhlcLib")
export type OHLC
    float c
`;
    const r = run(head + `import me/pushlib/1 as pl
import me/ohlclib/1 as o
var array<o.OHLC> bars = array.new<o.OHLC>()
var array<pl.Pattern> pats = array.new<pl.Pattern>()
bars.push(o.OHLC.new(close))
pats.push(pl.Pattern.new(close), 2)
plot(bars.size())
plot(pats.size())
`, { "me/pushlib/1": pushLib, "me/ohlclib/1": ohlcLib });
    expect(last(r, 0)).toBe(6);
    expect(last(r, 1)).toBe(2);
  });
});
