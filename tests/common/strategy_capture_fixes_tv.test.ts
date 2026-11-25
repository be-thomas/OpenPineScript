/**
 * Engine behaviours settled by TradingView captures of authors' strategies (BINANCE:BTCUSDT 1h,
 * tv-parity round 3). Synthetic data only; each case names the capture that settled it.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../runtime/v1/session";

const H = 3600_000;
const t0 = Date.UTC(2026, 0, 5); // a Monday, 00:00 UTC
const CHART = { symbol: "BINANCE:BTCUSDT", timeframe: "60", mintick: 0.01, mincontract: 0.00001, type: "crypto", currency: "USDT", basecurrency: "BTC", timezone: "Etc/UTC", session: "24x7" };

const bars = (n: number, f: (i: number) => { o: number; h: number; l: number; c: number }) =>
  Array.from({ length: n }, (_, i) => { const b = f(i); return { time: t0 + i * H, open: b.o, high: b.h, low: b.l, close: b.c, volume: 1 }; });
const ramp = bars(48, (i) => ({ o: 100 + i, h: 102 + i, l: 99 + i, c: 101 + i }));

/** `n`-hour bars built from 1h bars. */
function agg(src: typeof ramp, n: number) {
  const out: typeof ramp = [];
  for (let i = 0; i < src.length; i += n) {
    const g = src.slice(i, i + n);
    out.push({ time: g[0].time, open: g[0].open, high: Math.max(...g.map((b) => b.high)), low: Math.min(...g.map((b) => b.low)), close: g.at(-1)!.close, volume: g.length });
  }
  return out;
}

function run(src: string, candles = ramp, opts: { libraries?: Record<string, string>; data?: [string, any[]][] } = {}) {
  const s = new Session();
  s.setChart(CHART as any);
  const c = s.compile(src, { libraries: opts.libraries });
  expect(c.errors).toEqual([]);
  for (const [tf, d] of opts.data ?? []) s.provideData("BINANCE:BTCUSDT", tf, d);
  const r: any = s.runHistory(candles);
  expect(r.errors).toEqual([]);
  return r;
}
const series = (r: any, title: string) => r.series.find((x: any) => x.title === title)!.data.map((p: any) => p?.value ?? NaN);

describe("v4: a tuple from security() whose expression is a tuple-returning built-in", () => {
  // n63, n67: `[st, dir] = security(syminfo.tickerid, "W", supertrend(...))` compiles on TradingView.
  it("takes its width from the built-in", () => {
    const r = run(`//@version=4
study("t")
[st, d] = security(syminfo.tickerid, "240", supertrend(1, 4), lookahead = barmerge.lookahead_on)
plot(d, "d")`, ramp, { data: [["240", agg(ramp, 4)]] });
    expect(series(r, "d").at(-1)).toBe(-1);
  });
  it("still refuses a width that disagrees", () => {
    const s = new Session(); s.setChart(CHART as any);
    const c = s.compile(`//@version=4
study("t")
[a, b, x] = security(syminfo.tickerid, "240", supertrend(1, 4))
plot(a)`);
    expect(c.errors[0]?.message).toMatch(/2-element tuple/);
  });
});

describe("request.security with barmerge.gaps_on", () => {
  // n67: with lookahead_on and gaps_on, a 4h value appears only on the first 1h bar of each 4h bar
  // (TradingView's first entry is on the 08:00 signal, not 06:00); all 31 trades match with this.
  it("returns the value on the bar a requested bar is evaluated, na on the others", () => {
    const r = run(`//@version=4
study("t")
g = security(syminfo.tickerid, "240", close, gaps = barmerge.gaps_on, lookahead = barmerge.lookahead_on)
n = security(syminfo.tickerid, "240", close, lookahead = barmerge.lookahead_on)
[g2, d2] = security(syminfo.tickerid, "240", [close, open], gaps = true, lookahead = true)
plot(g, "g")
plot(n, "n")
plot(d2, "d2")`, ramp, { data: [["240", agg(ramp, 4)]] });
    const g = series(r, "g"), n = series(r, "n"), d2 = series(r, "d2");
    for (let i = 0; i < ramp.length; i++) {
      if (i % 4 === 0) { expect(g[i]).toBe(n[i]); expect(d2[i]).toBe(ramp[i].open); }
      else { expect(g[i]).toBeNaN(); expect(d2[i]).toBeNaN(); }
    }
  });
});

describe("request.security with barmerge.gaps_on, lookahead off", () => {
  // probe r6 p4_gaps_on (BTCUSDT 1h, "240"): the 4h close on the last 1h bar of each 4h bar, na elsewhere.
  it("returns the value on the chart bar the requested bar closes on", () => {
    const r = run(`//@version=5
indicator("t")
g = request.security(syminfo.tickerid, "240", close, gaps = barmerge.gaps_on)
plot(g, "g")`, ramp, { data: [["240", agg(ramp, 4)]] });
    const g = series(r, "g");
    for (let i = 0; i < ramp.length; i++) {
      if (i % 4 === 3) expect(g[i]).toBe(ramp[i].close);
      else expect(g[i]).toBeNaN();
    }
  });
});

describe("the performance report with a position still open", () => {
  // n5, n12, n15, n23, n55, n67, n95: TradingView's gross loss exceeds the closed trades' losses by
  // exactly the open position's entry commission (so do its net profit and profit factor).
  it("counts the open position's entry commission as gross loss", () => {
    const r = run(`//@version=5
strategy("t", commission_type = strategy.commission.percent, commission_value = 0.1)
if bar_index == 1
    strategy.entry("L", strategy.long, qty = 1)
if bar_index == 3
    strategy.close("L")
if bar_index == 5
    strategy.entry("L", strategy.long, qty = 2)`);
    const closed = r.trades[0];
    const fee = 2 * ramp[6].open * 0.001;
    expect(r.position.size).toBe(2);
    expect(closed.pnl).toBeGreaterThan(0);
    expect(r.performance.all.grossLoss).toBeCloseTo(fee, 10);
    expect(r.performance.all.netProfit).toBeCloseTo(closed.pnl - fee, 10);
    expect(r.performance.long.grossLoss).toBeCloseTo(fee, 10);
  });
});

describe("heikenashi(), the v1 spelling", () => {
  // n92, n93: `heikenashi(tickerid)` compiles in a script with no version line.
  it("is heikinashi at v1", () => {
    run(`study("t")
t = heikenashi(tickerid)
plot(close)`);
  });
  // probe r6 p2: v2 and v3 compile and run; v4 says "Could not find function or function reference 'heikenashi'".
  it("is heikinashi at v2 and v3", () => {
    for (const v of [2, 3]) run(`//@version=${v}
study("t")
t = heikenashi(tickerid)
plot(security(t, period, close))`);
  });
  it("is not a v4 name", () => {
    const s = new Session(); s.setChart(CHART as any);
    expect(s.compile(`//@version=4
study("t")
t = heikenashi(syminfo.tickerid)
plot(close)`).errors[0]?.message).toMatch(/Could not find function or function reference 'heikenashi'/);
  });
});

describe("libraries", () => {
  const LIB = `//@version=5
library("L")
color TEAL = color.new(color.teal, 50)
export g() => 42
export tealish() => TEAL
plot(close, "library plot")`;
  // n157: TradingView runs a script whose `import … as ROI` follows the functions calling `ROI.f()`.
  it("an import written below a function that uses it", () => {
    const r = run(`//@version=5
f() => L.g()
indicator("t")
import u/L/1 as L
plot(f(), "f")`, ramp, { libraries: { "u/L/1": LIB } });
    expect(series(r, "f").at(-1)).toBe(42);
  });
  // n3: the script declares a variable `color`; TradingView/RelativeValue's `color.new(color.teal, 50)`
  // still reads the namespace.
  it("a library's namespace reads are not shadowed by the importing script's variables", () => {
    const r = run(`//@version=6
indicator("t")
import u/L/1 as L
color = close > open ? color.red : color.green
plot(close, "c", color = L.tealish())`, ramp, { libraries: { "u/L/1": LIB } });
    expect(series(r, "c").at(-1)).toBe(ramp.at(-1)!.close);
  });
  // n3: TradingView lists only the script's own plots, not those of TradingView/ta/7 and
  // TradingView/RelativeValue/2's top-level code.
  it("a library's top-level plots are not the script's outputs", () => {
    const r = run(`//@version=6
indicator("t")
import u/L/1 as L
plot(L.g(), "mine")`, ramp, { libraries: { "u/L/1": LIB } });
    expect(r.series.map((x: any) => x.title)).toEqual(["mine"]);
  });
});

describe("colour constants when the script binds a variable named color", () => {
  // n3 (v6): plot(DemaAtr, color = color) with color = ... color.lime ...: TradingView draws #00E676.
  it("read the version's palette", () => {
    const r = run(`//@version=6
indicator("t")
color = close > 0 ? color.lime : color.red
plot(close, "c", color = color)`);
    const s = r.series.find((x: any) => x.title === "c");
    expect(s.data.at(-1).color ?? s.color).toBe("#00E676");
  });
});

describe("strategy.close(qty_percent)", () => {
  // n3 (v6, mincontract 0.00001): 30% of 0.01179 closes 0.00353, then 30% of the rest 0.00248.
  it("floors the quantity to the symbol's contract step", () => {
    const r = run(`//@version=6
strategy("t")
if bar_index == 1
    strategy.entry("L", strategy.long, qty = 0.01179)
if bar_index == 3
    strategy.close("L", qty_percent = 30)
if bar_index == 5
    strategy.close("L", qty_percent = 30)`);
    expect(r.trades.map((t: any) => t.qty)).toEqual([0.00353, 0.00247]);
  });
});

describe("ta.pivot_point_levels", () => {
  // n127 (Woodie, anchor timeframe.change("1D")): P, R1..R3, S1..S3 equal TradingView's on 286 bars.
  it("Woodie: the last period's high and low with the new period's open, held until the next anchor", () => {
    const day = bars(72, (i) => ({ o: 100 + (i % 7), h: 110 + (i % 5), l: 90 - (i % 3), c: 101 + (i % 4) }));
    const r = run(`//@version=6
indicator("t")
piv = ta.pivot_point_levels("Woodie", timeframe.change("1D"))
plot(piv.get(0), "p")
plot(piv.get(1), "r1")
plot(piv.get(6), "s3")
plot(piv.get(9), "r5")`, day);
    const d1 = day.slice(24, 48), d2 = day[48];
    const hi = Math.max(...d1.map((b) => b.high)), lo = Math.min(...d1.map((b) => b.low));
    const p = (hi + lo + d2.open * 2) / 4;
    for (const i of [48, 60, 71]) {
      expect(series(r, "p")[i]).toBe(p);
      expect(series(r, "r1")[i]).toBe(p * 2 - lo);
      expect(series(r, "s3")[i]).toBe(lo - 2 * (hi - p));
      expect(series(r, "r5")[i]).toBeNaN();
    }
    expect(series(r, "p")[10]).toBeNaN();
  });
  // probe r6 p1_pivot_types_a/b: every type, and Fibonacci developing, equal TradingView's on 299 bars.
  it("Traditional, Camarilla, DM and Fibonacci developing", () => {
    const day = bars(72, (i) => ({ o: 100 + (i % 7), h: 110 + (i % 5), l: 90 - (i % 3), c: 101 + (i % 4) }));
    const r = run(`//@version=6
indicator("t")
anc = timeframe.change("1D")
t = ta.pivot_point_levels("Traditional", anc)
k = ta.pivot_point_levels("Camarilla", anc)
d = ta.pivot_point_levels("DM", anc)
f = ta.pivot_point_levels("Fibonacci", anc, true)
plot(t.get(9), "t9")
plot(k.get(9), "k9")
plot(k.get(1), "k1")
plot(d.get(0), "d0")
plot(f.get(3), "f3")`, day);
    const d1 = day.slice(24, 48);
    const hi = Math.max(...d1.map((b) => b.high)), lo = Math.min(...d1.map((b) => b.low)), c = d1.at(-1)!.close, o = d1[0].open;
    const p = (hi + lo + c) / 3, rg = hi - lo;
    const x = o === c ? hi + lo + 2 * c : c > o ? 2 * hi + lo + c : 2 * lo + hi + c;
    expect(series(r, "t9")[50]).toBe(p * 4 + (hi - 4 * lo));
    expect(series(r, "k9")[50]).toBe((hi / lo) * c);
    expect(series(r, "k1")[50]).toBe(c + 1.1 * rg / 12);
    expect(series(r, "d0")[50]).toBe(x / 4);
    // developing: the day in progress (bars 48..50)
    const cur = day.slice(48, 51);
    const ch = Math.max(...cur.map((b) => b.high)), cl = Math.min(...cur.map((b) => b.low)), cc = cur.at(-1)!.close;
    expect(series(r, "f3")[50]).toBe((ch + cl + cc) / 3 + 0.618 * (ch - cl));
  });
  // probe r6 p1_pivot_types_b: TradingView RE10128 on bar 0.
  it("refuses developing Woodie", () => {
    const s = new Session(); s.setChart(CHART as any);
    const c = s.compile(`//@version=6
indicator("t")
w = ta.pivot_point_levels("Woodie", timeframe.change("1D"), true)
plot(w.get(0))`);
    expect(c.errors[0]?.message).toMatch(/cannot be `true` when `type` is "Woodie"/);
  });
});

describe("v6 default order size", () => {
  // n13, n76, n127, n128, n138, n139: a v6 strategy declaring no size trades 100% of equity
  // (n127: 100,000 / 89,577.13 = 1.1163 BTC); every v1-v5 capture shows 1 contract.
  const S = (v: number) => `//@version=${v}
strategy("t", initial_capital = 100000)
if bar_index == 1
    strategy.entry("L", strategy.long)`;
  it("is 100% of equity at v6", () => {
    const r = run(S(6));
    expect(r.position.size).toBeCloseTo(100000 / ramp[2].open, 4);
  });
  // probe r6 p3_v6_qty_value_only: default_qty_value = 10 alone is 10% of equity.
  it("default_qty_value alone is a percentage of equity at v6", () => {
    const r = run(S(6).replace('initial_capital = 100000', 'initial_capital = 100000, default_qty_value = 10'));
    expect(r.position.size).toBeCloseTo(10000 / ramp[2].open, 4);
  });
  it("stays one contract at v5", () => {
    expect(run(S(5)).position.size).toBe(1);
  });
});
