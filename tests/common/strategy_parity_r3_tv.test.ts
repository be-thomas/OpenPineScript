/**
 * Round-3 TradingView parity fixes found on the authors' strategy batch (BINANCE:BTCUSDT 1h captures).
 * Synthetic data only; each case names the capture that settled the behaviour.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../runtime/v1/session";

const H = 3600e3;
const T0 = Date.UTC(2026, 0, 5); // a Monday, 00:00 UTC
type Bar = { time: number; open: number; high: number; low: number; close: number; volume: number };

function session(src: string, chart: Record<string, any> = {}) {
  const s = new Session();
  s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "60", mintick: 0.01, type: "crypto", currency: "USDT",
    basecurrency: "BTC", timezone: "Etc/UTC", session: "24x7", ...chart } as any);
  const c = s.compile(src);
  expect(c.errors).toEqual([]);
  return s;
}
const wave = (n: number, amp = 30): Bar[] => Array.from({ length: n }, (_, i) => {
  const o = 100 + i + amp * Math.sin(i * 0.7), c = 100 + i + amp * Math.sin(i * 0.7 + 0.5);
  return { time: T0 + i * H, open: o, high: Math.max(o, c) + 2 + (i % 5), low: Math.min(o, c) - 2 - (i % 3), close: c, volume: 1 + (i % 7) };
});
const series = (r: any, title: string) => r.series.find((x: any) => x.title === title).data.map((d: any) => d?.value ?? d);

describe("strategy.risk.allow_entry_in with an input variable (v4)", () => {
  // AlignedMA and Cumulative HighLow Strategy: `tradeDirection = input(defval=strategy.direction.all,
  // options=[...])` reached the broker as its Series, never equal to a direction: no entry ever filled, and the
  // stored Series made the state uncloneable for a realtime tick (DataCloneError).
  it("allows entries and survives a live tick", () => {
    const s = session(`//@version=4
strategy("t")
dirIn = input(defval=strategy.direction.all, options=[strategy.direction.all, strategy.direction.long, strategy.direction.short])
strategy.risk.allow_entry_in(dirIn)
if bar_index % 4 == 0
    strategy.entry("L", strategy.long)
if bar_index % 4 == 2
    strategy.close("L")
`);
    const bars = wave(41);
    const r = s.runHistory(bars.slice(0, -1), { realtimeFollows: { time: bars[40].time } });
    expect(r.trades.length).toBeGreaterThan(5);
    expect(() => s.tick(bars[40])).not.toThrow();
  });
});

describe("a series history offset on a function parameter", () => {
  // AlignedMA ... V2: `f(Series, tBars, rBars) => Series[tBars]` with `tBars` an input: the Series offset was
  // stored in the call-site record and the next realtime tick threw DataCloneError.
  it("keeps the state cloneable", () => {
    const s = session(`//@version=4
strategy("t")
n = input(2)
f(src, k) => src[k]
x = close * 2
plot(f(x, n))
plot(f(close - open, n))
`);
    const bars = wave(31);
    s.runHistory(bars.slice(0, -1), { realtimeFollows: { time: bars[30].time } });
    expect(() => s.tick(bars[30])).not.toThrow();
  });
});

describe("security() inside a user function: a parameter the expression reads", () => {
  // Strategy Template (v4): `f_secureSecurity(_symbol, _res, _src, _offset) => security(_symbol, _res,
  // _src[_offset], lookahead = barmerge.lookahead_on)` called with an hma: TradingView's value is the weekly
  // hma(high, 20)[1] to the last digit. The argument is computed in the requested timeframe.
  for (const v of [4, 5]) it(`v${v}: equals the inline security() call`, () => {
    const sec = v >= 5 ? "request.security" : "security", hma = v >= 5 ? "ta.hma" : "hma", sma = v >= 5 ? "ta.sma" : "sma";
    const s = session(`//@version=${v}
${v >= 5 ? "indicator" : "study"}("t")
f(_symbol, _res, _src, _offset) => ${sec}(_symbol, _res, _src[_offset], lookahead = barmerge.lookahead_on)
g(source, len) => ${hma}(source, len)
plot(f(syminfo.tickerid, "240", g(high, 4), 1), "viaFn")
plot(f(syminfo.tickerid, "240", ${sma}(high, 3), 1), "viaFnBuiltin")
plot(${sec}(syminfo.tickerid, "240", ${hma}(high, 4)[1], lookahead = barmerge.lookahead_on), "inline")
plot(${sec}(syminfo.tickerid, "240", ${sma}(high, 3)[1], lookahead = barmerge.lookahead_on), "inlineBuiltin")
`);
    const r: any = s.runHistory(wave(24 * 8));
    const a = series(r, "viaFn"), b = series(r, "inline");
    const c = series(r, "viaFnBuiltin"), d = series(r, "inlineBuiltin");
    let compared = 0;
    for (let i = 0; i < a.length; i++) {
      if (b[i] == null || Number.isNaN(b[i])) continue;
      compared++;
      expect(a[i]).toBeCloseTo(b[i], 9);
      expect(c[i]).toBeCloseTo(d[i], 9);
    }
    expect(compared).toBeGreaterThan(100);
  });
});

describe("max drawdown with commission and intrabar entries", () => {
  // Monthly Returns with Benchmark (v5, stop entries reversing the position, 0.1% commission): TradingView 42884.97,
  // the engine 43685.05 until a position opened on a bar counted only the path after its fill. BEST ATR Stop
  // Multiple / BEST Trailing Stop (0.075%): the engine was short by the open trade's entry fee until that fee
  // stayed out of the realized peak (it is realized when the trade closes).
  it("the entry bar's adverse extreme is taken after the fill", () => {
    // Bar 1: open 100, high 103 (nearer, first), low 90, close 95. A short stop at 99 fills on the way down,
    // after the high: the high is not the short's drawdown; the path after the fill tops at 99 (then 95).
    const bars: Bar[] = [
      { time: T0, open: 100, high: 101, low: 99.5, close: 100, volume: 1 },
      { time: T0 + H, open: 100, high: 103, low: 90, close: 95, volume: 1 },
      { time: T0 + 2 * H, open: 95, high: 96, low: 94, close: 95, volume: 1 },
    ];
    const s = session(`//@version=5
strategy("t", initial_capital = 1000)
if bar_index == 0
    strategy.entry("S", strategy.short, qty = 1, stop = 99)
`);
    const r: any = s.runHistory(bars);
    expect(r.position.size).toBe(-1);
    // Peak 1000 (realized); trough on bar 2 = 1000 + (99 - 96) * 1... worst is bar 2's high 96: open profit +3,
    // so no drawdown at all. Counting bar 1's high (103) would have reported 4.
    expect(r.performance.all.maxDrawdown).toBe(0);
  });

  it("the open trade's entry commission is not part of the realized peak", () => {
    // Long 1 at bar 1's open (100) with 1% commission: fee 1. A closed winner before it sets the peak.
    const bars: Bar[] = [
      { time: T0, open: 100, high: 100, low: 100, close: 100, volume: 1 },
      { time: T0 + H, open: 100, high: 100, low: 100, close: 100, volume: 1 },
      { time: T0 + 2 * H, open: 110, high: 110, low: 110, close: 110, volume: 1 },
      { time: T0 + 3 * H, open: 110, high: 110, low: 105, close: 106, volume: 1 },
      { time: T0 + 4 * H, open: 106, high: 106, low: 106, close: 106, volume: 1 },
    ];
    const s = session(`//@version=5
strategy("t", initial_capital = 1000, commission_type = strategy.commission.percent, commission_value = 1)
if bar_index == 0
    strategy.entry("L", strategy.long, qty = 1)
if bar_index == 1
    strategy.close("L")
if bar_index == 1
    strategy.entry("L2", strategy.long, qty = 1)
`);
    const r: any = s.runHistory(bars);
    // Trade 1: 100 -> 110 (bar 2's open) is not what happens: close and entry both fill at bar 2's open, 110.
    // Trade 1 closes at 110: +10 - 1 - 1.1 = 7.9, realized 1007.9. L2 opens at 110 (fee 1.1, cash 1006.8).
    // Bar 3's low 105: open P&L -5. TradingView: peak 1007.9 (the fee is not realized), trough 1006.8 - 5.
    expect(r.performance.all.maxDrawdown).toBeCloseTo(1007.9 - (1006.8 - 5), 9);
  });
});

describe("v1-v4 rsi(x, y) with y a series", () => {
  // [RS]MarxBabu 4 Oscillators (v1): `rsi(sum(up), sum(down))` is TradingView's MFI, 100 - 100 / (1 + x / y),
  // on every bar of the capture. The engine read y as a length and plotted na.
  it("is the ratio form", () => {
    const s = session(`//@version=4
study("t")
up = sum(volume * close, 3)
dn = sum(volume * open, 3) + 0.5
plot(rsi(up, dn), "r")
plot(100 - 100 / (1 + up / dn), "e")
plot(rsi(close, 3), "len")
`);
    const r: any = s.runHistory(wave(30));
    const a = series(r, "r"), e = series(r, "e");
    for (let i = 2; i < a.length; i++) expect(a[i]).toBeCloseTo(e[i], 12);
    expect(series(r, "len").filter((x: any) => x != null && !Number.isNaN(x)).length).toBeGreaterThan(20);
  });
});

describe("vwap as a variable", () => {
  // EVWMA VWAP Cross [QuantNomad] (v4): `ema(vwap, 1)` is plotted on TradingView; the bare `vwap` emitted the
  // function object and the engine plotted na and never traded.
  it("v4 `vwap` and v5 `ta.vwap` are vwap(hlc3)", () => {
    for (const [v, head, name, ema] of [[4, "study", "vwap", "ema"], [5, "indicator", "ta.vwap", "ta.ema"]] as const) {
      const s = session(`//@version=${v}
${head}("t")
plot(${name}, "bare")
plot(${ema}(${name}, 1), "ema1")
plot(${name}(hlc3), "call")
`);
      const r: any = s.runHistory(wave(30));
      const a = series(r, "bare"), b = series(r, "ema1"), c = series(r, "call");
      for (let i = 0; i < a.length; i++) { expect(a[i]).toBeCloseTo(c[i], 12); expect(b[i]).toBeCloseTo(c[i], 12); }
      expect(Number.isFinite(a[29])).toBe(true);
    }
  });
});

describe("an input's default is not clamped to minval / maxval", () => {
  // Combo Backtest 123 Reversal & CMOabs (v4): `input(20, maxval=0)` is 20 on TradingView (all 240 trades);
  // Percent change bar chart Backtest: `input(-0.33, minval=0.01)` stays -0.33 (all 1164 trades).
  it("keeps the default; a host override is still clamped", () => {
    const src = `//@version=4
study("t")
a = input(20, maxval=0)
b = input(-0.33, minval=0.01)
plot(a, "a")
plot(b, "b")
`;
    const r: any = session(src).runHistory(wave(3));
    expect(series(r, "a")[0]).toBe(20);
    expect(series(r, "b")[0]).toBe(-0.33);
    const s2 = session(src);
    const ids = s2.compile(src).inputs.map((x: any) => x.id);
    s2.setInputs({ [ids[0]]: 50 });
    expect(series(s2.runHistory(wave(3)) as any, "a")[0]).toBe(0);
  });
});

describe("quantity floored to mincontract", () => {
  // [RS]Spot/Binary Scalper: qty = 10000 with mincontract 0.00001 traded as 10000 on TradingView;
  // 10000 / 0.00001 is 999999999.9999999 in floating point and was floored to 9999.99999.
  it("a whole number of steps stays whole", () => {
    const s = session(`//@version=4
strategy("t", initial_capital = 1e12)
if bar_index == 0
    strategy.entry("L", strategy.long, qty = 10000)
`, { mincontract: 0.00001 });
    const r: any = s.runHistory(wave(3));
    expect(r.position.size).toBe(10000);
  });
});

describe("time(res, session) day rules", () => {
  const hourly = (n: number): Bar[] => Array.from({ length: n }, (_, i) => ({ time: T0 - 2 * 86400e3 + i * H, open: 1, high: 2, low: 0.5, close: 1, volume: 1 }));
  // [RS]Spot/Binary Scalper (v2): `time('1', '0400-1500')` never opens on a Saturday or Sunday (425 trades).
  it("a session string without days is Monday-Friday before v5, every day at v5", () => {
    for (const [v, head, fn, weekend] of [[4, "study", "time", 0], [5, "indicator", "time", 22]] as const) {
      const s = session(`//@version=${v}
${head}("t")
plot(na(${fn}("60", "0400-1500")) ? 0 : 1, "in")
`);
      const r: any = s.runHistory(hourly(48)); // Saturday 00:00 .. Sunday 23:00
      expect(series(r, "in").reduce((a: number, x: number) => a + x, 0)).toBe(weekend);
    }
  });
  // Simple SMA Strategy Backtest Part 5 (v4, "2300-0800"): it enters at Monday 00:00, from the session that opens
  // Sunday 23:00; Friday 23:00 opens Saturday's session.
  it("the evening part of an overnight session belongs to the next day", () => {
    const s = session(`//@version=4
study("t")
plot(na(time("60", "2300-0800")) ? 0 : 1, "in")
`);
    const r: any = s.runHistory(hourly(24 * 7 + 2)); // Saturday 00:00 .. next Saturday 01:00
    const v = series(r, "in");
    const at = (day: number, hour: number) => v[day * 24 + hour]; // day 0 = Saturday
    expect(at(1, 22)).toBe(0);  // Sunday 22:00
    expect(at(1, 23)).toBe(1);  // Sunday 23:00: Monday's session
    expect(at(2, 0)).toBe(1);   // Monday 00:00
    expect(at(6, 23)).toBe(0);  // Friday 23:00: Saturday's session
    expect(at(6, 7)).toBe(1);   // Friday 07:00: Friday's session
  });
});

describe("v6 strategy() without default_qty_type", () => {
  // Kwan NRP Backtest (v6, no sizing arguments): TradingView's tester reads "100 % of equity" (as on all 9 such
  // v6 captures) and trades 0.88, 0.92 BTC = equity / price; v5 and earlier keep one contract.
  it("sizes at 100% of equity at v6, one contract at v5", () => {
    for (const [v, want] of [[6, 100000 / 101], [5, 1]] as const) {
      const bars: Bar[] = Array.from({ length: 3 }, (_, i) => ({ time: T0 + i * H, open: 100 + i, high: 102 + i, low: 99 + i, close: 101 + i, volume: 1 }));
      const s = session(`//@version=${v}
strategy("t", initial_capital = 100000)
if bar_index == 0
    strategy.entry("L", strategy.long)
`);
      const r: any = s.runHistory(bars);
      expect(r.position.size).toBeCloseTo(want, 4);
    }
  });
});

describe("an entry after an earlier fill on the same bar", () => {
  // QuantNomad Pivot Reversal (v3): open 81341.95 at the long stop's level, a short stop below filled on the way
  // down; the long stop, matched against the whole bar, filled again at 81341.95 though the price never came back.
  it("only fills on the path after that fill", () => {
    const bars: Bar[] = [
      { time: T0, open: 100, high: 100.5, low: 99.5, close: 100, volume: 1 },
      { time: T0 + H, open: 100, high: 100.5, low: 99.5, close: 100, volume: 1 },
      // open 105 (nearer the high 105.01: path 105, 105.01, 95, 96)
      { time: T0 + 2 * H, open: 105, high: 105.01, low: 95, close: 96, volume: 1 },
      { time: T0 + 3 * H, open: 96, high: 97, low: 95, close: 96, volume: 1 },
    ];
    const s = session(`//@version=3
strategy("t")
if n == 0
    strategy.entry("L0", strategy.long, qty = 1)
if n == 1
    strategy.entry("S", strategy.short, qty = 1, stop = 98)
    strategy.entry("L", strategy.long, qty = 1, stop = 105.01)
`);
    const r: any = s.runHistory(bars.slice(0, 3));
    expect(r.position.size).toBe(-1);
    expect(r.trades.map((t: any) => [t.entryPrice, t.exitPrice])).toEqual([[100, 98]]);
  });
});
