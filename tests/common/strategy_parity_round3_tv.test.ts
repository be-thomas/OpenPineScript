/**
 * TradingView behaviours read off captured strategy runs (BINANCE:BTCUSDT 1h, round 3 of the
 * authors' strategies batch). Each case is synthetic; the evidence is named in the engine source.
 */
import { describe, it, expect } from "vitest";
import { Session, type Candle } from "../../runtime/v1/session";

const H = 3600e3;
const T0 = Date.UTC(2026, 0, 5); // a Monday

function run(src: string, candles: Candle[]) {
  const s = new Session();
  s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "60", mintick: 0.01, timezone: "Etc/UTC", session: "24x7" } as any);
  const c = s.compile(src);
  expect(c.errors).toEqual([]);
  const r: any = s.runHistory(candles);
  expect(r.errors ?? []).toEqual([]);
  return r;
}
const series = (r: any, title: string) => r.series.find((x: any) => x.title === title)!.data.map((d: any) => d?.value);
const mk = (n: number, f: (i: number) => [number, number, number, number], vol = (i: number) => 1 + (i % 3)): Candle[] =>
  Array.from({ length: n }, (_, i) => { const [open, high, low, close] = f(i); return { time: T0 + i * H, open, high, low, close, volume: vol(i) }; });
const wave = (i: number): [number, number, number, number] => {
  const c = 100 + 10 * Math.sin(i / 3), o = 100 + 10 * Math.sin((i - 1) / 3);
  return [o, Math.max(o, c) + 1, Math.min(o, c) - 1, c];
};

describe("math.sum: an na makes the sum na only while it is in the window", () => {
  it("v4 sum(x, 3) of a series na on bar 0 is valid from bar 3, not ~200 bars later", () => {
    const r = run(`//@version=4\nstudy("t")\nplot(sum(change(close), 3), "s")`, mk(10, wave));
    const s = series(r, "s");
    expect(s.slice(0, 3).every((v: any) => v == null || Number.isNaN(v))).toBe(true);
    const c = mk(10, wave).map(b => b.close);
    expect(s[3]).toBeCloseTo(c[3] - c[0], 9);
    expect(s[9]).toBeCloseTo(c[9] - c[6], 9);
  });
});

describe("the bare vwap variable", () => {
  for (const [v, expr] of [[3, "vwap"], [4, "vwap"], [5, "ta.vwap"]] as const) {
    it(`v${v} ${expr} equals ${v >= 5 ? "ta." : ""}vwap(hlc3)`, () => {
      const fn = v >= 5 ? "ta.vwap(hlc3)" : "vwap(hlc3)";
      const r = run(`//@version=${v}\n${v >= 5 ? "indicator" : "study"}("t")\nplot(${expr}, "a")\nplot(${fn}, "b")`, mk(30, wave));
      const a = series(r, "a"), b = series(r, "b");
      expect(a.every((x: any) => Number.isFinite(x))).toBe(true);
      expect(a).toEqual(b);
    });
  }
});

describe("rsi(x, y) with a series y (v1-v4)", () => {
  it("is 100 - 100 / (1 + x / y), the money-flow form", () => {
    const r = run(`//@version=4\nstudy("t")\nu = sum(volume * (change(close) > 0 ? close : 0), 5)\nd = sum(volume * (change(close) < 0 ? close : 0), 5)\nplot(rsi(u, d), "m")\nplot(100 - 100 / (1 + u / d), "f")\nplot(rsi(close, 14), "r")`, mk(60, wave));
    const m = series(r, "m"), f = series(r, "f");
    for (let i = 10; i < 60; i++) expect(m[i]).toBeCloseTo(f[i], 9);
    expect(Number.isFinite(series(r, "r")[40])).toBe(true); // the length form is untouched
  });
});

describe("strategy.risk.allow_entry_in", () => {
  const src = (dir: string) => `//@version=4
strategy("t")
d = input(title="Trade Direction", defval=${dir}, options=[strategy.direction.all, strategy.direction.long, strategy.direction.short])
strategy.risk.allow_entry_in(d)
if bar_index % 4 == 1
    strategy.entry("L", strategy.long)
if bar_index % 4 == 3
    strategy.entry("S", strategy.short)`;
  it("an input() of it is honoured (it used to forbid both directions)", () => {
    const r = run(src("strategy.direction.long"), mk(20, wave));
    expect(r.trades.length).toBeGreaterThan(0);
    expect(r.trades.every((t: any) => t.direction === "long")).toBe(true);
  });
  it("an entry in the forbidden direction closes the open position instead", () => {
    const r = run(src("strategy.direction.long"), mk(20, wave));
    // long placed on bar 1 fills at bar 2's open, the short on bar 3 closes it at bar 4's open
    expect(r.trades[0].entryBarIndex).toBe(2);
    expect(r.trades[0].exitBarIndex).toBe(4);
    expect(r.position.size).toBeGreaterThanOrEqual(0);
  });
});

describe("v6 default order size", () => {
  it("is 100% of equity when strategy() names no size", () => {
    const r = run(`//@version=6\nstrategy("t")\nif bar_index == 1\n    strategy.entry("L", strategy.long)`, mk(5, () => [100, 101, 99, 100]));
    expect(r.position.size).toBeCloseTo(100000 / 100, 6); // v6 capital 100,000
  });
  it("stays one contract at v5", () => {
    const r = run(`//@version=5\nstrategy("t")\nif bar_index == 1\n    strategy.entry("L", strategy.long)`, mk(5, () => [100, 101, 99, 100]));
    expect(r.position.size).toBe(1);
  });
});

describe("v3 market entries are sized at the order price", () => {
  it("percent_of_equity: equity / the placing bar's close, not / the fill bar's open", () => {
    const bars = mk(5, i => i === 1 ? [100, 101, 99, 100] : i === 2 ? [125, 126, 124, 125] : [100, 101, 99, 100]);
    const r = run(`//@version=3\nstrategy("t", initial_capital = 1000, default_qty_type = strategy.percent_of_equity, default_qty_value = 100)\nif n == 1\n    strategy.entry("L", strategy.long)`, bars);
    expect(r.position.size).toBeCloseTo(10, 9); // 1000 / 100, not 1000 / 125 = 8
  });
});

describe("v3 pending entries are judged when placed", () => {
  it("short 1, a short stop below and a long stop above on one open-low-high-close bar: only the long fills", () => {
    // bar 3 (open 100, low 95, high 110): the short stop at 97 is touched first while short (pyramiding 1),
    // then the long stop at 105 reverses. The short stop must not fill on the way back.
    const bars = mk(6, i => i === 3 ? [100, 110, 95, 104] : i === 4 ? [104, 105, 96, 100] : [100, 101, 99, 100]);
    const r = run(`//@version=3
strategy("t")
if n == 0
    strategy.entry("S0", strategy.short)
if n == 2
    strategy.entry("L", strategy.long, stop = 105)
    strategy.entry("S", strategy.short, stop = 97)`, bars);
    expect(r.trades.length).toBe(1);
    expect(r.trades[0].exitBarIndex).toBe(3);
    expect(r.position.size).toBeGreaterThan(0);
  });
});

describe("time(tf, session) with a session written without days", () => {
  const src = (v: number) => `//@version=${v}\n${v >= 5 ? "indicator" : "study"}("t")\nplot(na(time("60", "0400-1500")) ? 0 : 1, "in")`;
  // 2026-01-10 is a Saturday
  const sat = Array.from({ length: 24 }, (_, i) => ({ time: Date.UTC(2026, 0, 10, i), open: 1, high: 1, low: 1, close: 1, volume: 1 }));
  it("is Monday-Friday before v5", () => {
    expect(series(run(src(4), sat), "in").every((x: number) => x === 0)).toBe(true);
  });
  it("is every day from v5", () => {
    expect(series(run(src(5), sat), "in")[5]).toBe(1);
  });
});

describe("an input's default outside its bounds", () => {
  it("is taken as written: input(0, minval = 1) is 0", () => {
    const r = run(`//@version=2\nstudy("t")\nx = input(0, minval=1)\nplot(x, "x")`, mk(3, wave));
    expect(series(r, "x")[2]).toBe(0);
  });
});

describe('strategy(close_entries_rule = "ANY")', () => {
  const src = (rule: string) => `//@version=5
strategy("t", pyramiding = 2, close_entries_rule = "${rule}")
if bar_index == 1
    strategy.entry("A", strategy.long)
if bar_index == 2
    strategy.entry("B", strategy.long)
if bar_index == 4
    strategy.close("B")`;
  const bars = mk(8, () => [100, 101, 99, 100]);
  it("ANY: closing B closes B's trade", () => {
    const r = run(src("ANY"), bars);
    expect(r.trades.map((t: any) => t.entryId ?? t.entry?.id)).toEqual(["B"]);
  });
  it("FIFO (default): the oldest trade goes first", () => {
    const r = run(src("FIFO"), bars);
    expect(r.trades.map((t: any) => t.entryId ?? t.entry?.id)).toEqual(["A"]);
  });
});

describe("v5 margin, when declared", () => {
  const src = (decl: string) => `//@version=5
strategy("t", initial_capital = 10000, default_qty_type = strategy.percent_of_equity, default_qty_value = 100${decl})
if bar_index == 1
    strategy.entry("S", strategy.short)`;
  const bars = mk(6, i => i === 2 ? [100, 103, 99.5, 100] : [100, 100.5, 99.5, 100]);
  it("margin_short = 100: a 100% short is margin-called when the bar rises against it", () => {
    const r = run(src(", margin_long = 100, margin_short = 100"), bars);
    expect(r.trades.length).toBe(1);
    expect(r.trades[0].exitComment).toBe("Margin call");
  });
  it("undeclared (v5 default 0): never", () => {
    const r = run(src(""), bars);
    expect(r.trades.length).toBe(0);
  });
});
