/**
 * Parity round 4, slice C: three causes behind two Trendoscope strategies
 * (captures n51 and n58, BINANCE:BTCUSDT 1h). Synthetic scripts only.
 */
import { describe, it, expect } from "vitest";
import { Session, type Candle } from "../../runtime/v1/session";

const hourly = (closes: number[], spread = 0.5): Candle[] =>
  closes.map((c, i) => ({ time: Date.UTC(2026, 0, 1, i), open: c, high: c + spread, low: c - spread, close: c, volume: 1 }));

function run(src: string, candles: Candle[], libraries?: Record<string, string>, opts: any = {}): any {
  const s = new Session();
  s.setChart({ timeframe: "60", symbol: "BINANCE:BTCUSDT", mintick: 0.01 } as any);
  const c = s.compile(src, libraries ? { libraries } : undefined);
  expect(c.errors.map(e => e.message)).toEqual([]);
  const r: any = s.runHistory(candles, opts);
  expect(r.errors ?? []).toEqual([]);
  return r;
}

describe("an overloaded method's dispatcher falls back to the built-in WITH its Context", () => {
  // n51: `lastIndicators.get(index)` on an array the emitter could not type, in a
  // library that declares `method get` on two of its own types. The dispatcher
  // handed the call to the built-in under the key `array.getget`, so `array.get`
  // ran without its Context and read the index as the array.
  it("array.get through a user `get` dispatcher", () => {
    const r = run(`//@version=5
indicator("t")
type P
    int dir
    array<float> vals
type Z
    array<P> ps
method get(P this, string key) => key == 'dir' ? str.tostring(this.dir) : na
method get(Z this, string key) => key
f(Z this, P p) =>
    last = this.ps.get(0)
    lastV = last.vals
    s = 0.0
    for [i, v] in p.vals
        s += lastV.get(i)
    s
z = Z.new(array.new<P>())
z.ps.push(P.new(1, array.from(1.0, 2.0)))
plot(f(z, P.new(-1, array.from(3.0, 4.0))))
`, hourly([1, 2]));
    expect(r.series[0].data.map((p: any) => p.value)).toEqual([3, 3]);
  });
});

describe("a keyword argument's key inside an imported library is the callee's parameter name", () => {
  // n51, n58: HeWhoMustNotBeNamed/strategy's `bracketOrderWithoutLeverage(id, entry, stop, …)`
  // calls `strategy.entry(id, dir, stop = entry)`. The library scoping renamed the KEY
  // after its own parameter `stop`, so no parameter answered it and the stop entry
  // became a market order.
  const LIB = `//@version=5
library("L")
export bracket(string id, float entry, float stop, float target) =>
    strategy.entry(id, strategy.long, stop = entry)
    strategy.exit("x" + id, id, stop = stop, limit = target)
    true
export scaled(float stop, float k = 1) => stop * k
export callsKeyword(float stop) => scaled(k = 2, stop = stop)
`;
  it("a stop entry stays a stop entry", () => {
    const r = run(`//@version=5
strategy("t")
import me/L/1 as L
if bar_index == 1
    L.bracket("a", 108, 90, 130)
plot(strategy.position_size)
`, hourly([100, 100, 101, 102, 103, 104, 110, 111, 112]), { "me/L/1": LIB });
    const ps = r.series[0].data.map((p: any) => p.value);
    // Not filled at bar 2's open (101): it waits for the price to reach 108.
    expect(ps.slice(0, 6)).toEqual([0, 0, 0, 0, 0, 0]);
    expect(ps[6]).toBe(1);
  });

  it("a library's own call binds the keyword to its parameter", () => {
    const r = run(`//@version=5
indicator("t")
import me/L/1 as L
plot(L.callsKeyword(3))
`, hourly([1]), { "me/L/1": LIB });
    expect(r.series[0].data[0].value).toBe(6);
  });
});

describe("an order level just past a tick is that tick", () => {
  // n51 trade 22: target = 77902.52 + 2 * (77902.52 - 76779.73) is 80148.10000000002;
  // TradingView's sell limit filled at 80148.1. A fixed 1e-9 nudge in tick units
  // (8014810.000000002) took it a tick up.
  it("sell limit at 80148.10000000002 fills at 80148.1", () => {
    const target = 77902.52 + 2 * (77902.52 - 76779.73);
    expect(target).toBe(80148.10000000002);
    const candles = hourly([80000, 80000, 80000, 80200, 80200], 1);
    candles[3].open = 80100; candles[3].low = 80099;
    const r = run(`//@version=6
strategy("t", default_qty_type = strategy.fixed)
if bar_index == 0
    strategy.entry("L", strategy.long)
    strategy.exit("X", "L", limit = ${target})
`, candles);
    expect(r.trades[0].exitPrice).toBe(80148.1);
  });
});

describe.each(["5", "6"])("strategy(calc_bars_count = N), v%s", (v) => {
  // n51 (v6, calc_bars_count = 5000, realtime chart): TradingView's trades start where
  // the last 5000 bars do, and its logged pivot bar indices count from the 5000th CLOSED
  // bar from the end: unlike indicator() (probe P3), the live bar is not one of the N.
  const src = `//@version=${v}
strategy("t", calc_bars_count = 50)
if barstate.isfirst
    log.info("first bi={0} close={1}", bar_index, close)
plot(bar_index, "bi")
`;
  const bars = hourly(Array.from({ length: 120 }, (_, i) => 1 + i), 0);
  it("executes on the last 50 bars", () => {
    const r = run(src, bars);
    expect(r.logs.map((l: any) => l.message)).toEqual(["first bi=0 close=71"]);
  });
  it("with a live bar to follow, on the last 50 closed bars", () => {
    const r = run(src, bars, undefined, { realtimeFollows: true });
    expect(r.logs.map((l: any) => l.message)).toEqual(["first bi=0 close=71"]);
  });
});
