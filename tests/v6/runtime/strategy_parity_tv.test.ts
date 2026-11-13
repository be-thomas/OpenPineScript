/**
 * Strategy behaviours matched to TradingView, each probed per version
 * (dev-docs/tv-parity/_probes/):
 *
 *  - `na != x` is false at v1-v6 (run-20261113-na-hma, run-20261113-na-v1v3: all 150
 *    na bars of each version gave 0 for !=, ==, >, <, x != x).
 *  - `ta.atr` / `ta.tr` in a branch measure from the previous chart bar's close at v4-v6
 *    (atr-branch/run-20261113: max error 0).
 *  - v1-v3 run both branches of a ternary every bar (atr-branch/run-20261113-v1v3).
 *  - under `process_orders_on_close` an exit order already marketable at the close fills at
 *    that close, at v5 and v6, long and short, stop and limit (pooc-stop-breach/run-20261113,
 *    and run-20261113-review, 380 trades per script).
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

function run(src: string, bars: any[]) {
  const s = new Session();
  expect(s.compile(src).errors).toEqual([]);
  const r: any = s.runHistory(bars);
  expect(r.errors).toEqual([]);
  return r;
}
const plotOf = (r: any, title: string): Array<number | undefined> =>
  r.series.find((x: any) => x.title === title).data.map((d: any) => d?.value);
/** `study` below v5, `indicator` from v5. */
const decl = (v: number, name: string) => (v >= 5 ? `indicator("${name}")` : `study("${name}")`);
const idx = (v: number) => (v >= 4 ? "bar_index" : "n");

describe.each([1, 2, 3, 4, 5, 6])("v%i: `na != x` is false", (v) => {
  const bars = Array.from({ length: 8 }, (_, i) => ({ time: 1_700_000_000 + i * 86400, open: 5, high: 6, low: 4, close: 5, volume: 1 }));
  it("every comparison with na is 0, and != on a number is 1", () => {
    const src = `//@version=${v}
${decl(v, "ne")}
x = ${idx(v)} % 2 == 0 ? na : close
plot(x != 0 ? 1 : 0, title="ne")
plot(x == 0 ? 1 : 0, title="eq")
plot(x > 0 ? 1 : 0, title="gt")
plot(x < 0 ? 1 : 0, title="lt")
plot(x != x ? 1 : 0, title="nene")
plot(x != 1 ? 1 : 0, title="ne1")
`;
    const r = run(src, bars);
    for (const t of ["ne", "eq", "gt", "lt", "nene", "ne1"]) {
      plotOf(r, t).forEach((val, i) => {
        // bar_index / n starts at 0, so even bars are na
        const naBar = i % 2 === 0;
        if (naBar) expect(val, `${t} on na bar ${i}`).toBe(0);
      });
    }
    plotOf(r, "ne").forEach((val, i) => { if (i % 2 === 1) expect(val).toBe(1); });
  });
});

describe("a slow KAMA seeds at bar 0 (v6)", () => {
  const src = `//@version=6
indicator("kama")
kama(src, erPeriod, fastLen, slowLen) =>
    fastSC = 2.0 / (fastLen + 1)
    slowSC = 2.0 / (slowLen + 1)
    dir    = math.abs(src - src[erPeriod])
    vol    = math.sum(math.abs(src - src[1]), erPeriod)
    er     = vol != 0 ? dir / vol : 0.0
    sc     = math.pow(er * (fastSC - slowSC) + slowSC, 2)
    var float k = na
    k := na(k[1]) ? src : k[1] + sc * (src - k[1])
    k
plot(kama(close, 10, 30, 30), "slow")
`;
  it("is the plain recurrence from the first close", () => {
    const bars = Array.from({ length: 60 }, (_, i) => {
      const c = 100 + 5 * Math.sin(i / 4) + i * 0.3;
      return { time: 1_700_000_000 + i * 86400, open: c, high: c + 1, low: c - 1, close: c, volume: 1 };
    });
    // fastLen == slowLen: the smoothing constant is (2/31)^2 whatever `er` is, TradingView's value.
    const sc = Math.pow(2 / 31, 2);
    const expected: number[] = [];
    bars.forEach((b, i) => expected.push(i === 0 ? b.close : expected[i - 1] + sc * (b.close - expected[i - 1])));
    plotOf(run(src, bars), "slow").forEach((v, i) => expect(v).toBeCloseTo(expected[i], 9));
  });
});

describe("ta.atr / ta.tr in a branch", () => {
  const closes = [10, 14, 9, 20, 11, 12, 30, 28, 15, 16, 17, 40];
  const bars = closes.map((c, i) => ({ time: 1_700_000_000 + i * 900, open: c, high: c + 2, low: c - 1, close: c, volume: 1 }));
  const called = bars.map((_, i) => i).filter(i => i % 3 === 0);
  const trOf = (i: number, pc: number | undefined) => { const b = bars[i];
    return pc === undefined ? b.high - b.low : Math.max(b.high - b.low, Math.abs(b.high - pc), Math.abs(b.low - pc)); };

  /** TradingView's definition: range from `prevOf`'s close, rma seeded with the mean of 3 ranges. */
  function atrWant(prevOf: (i: number, k: number) => number | undefined) {
    const out = new Map<number, number>(); const trs: number[] = []; let prev: number | undefined;
    called.forEach((i, k) => {
      trs.push(trOf(i, prevOf(i, k)));
      if (trs.length === 3) prev = (trs[0] + trs[1] + trs[2]) / 3;
      else if (trs.length > 3) prev = (prev! * 2 + trs[trs.length - 1]) / 3;
      if (prev !== undefined) out.set(i, prev);
    });
    return out;
  }
  const src = (v: number) => `//@version=${v}
${decl(v, "atr")}
float a = na
float t = na
if bar_index % 3 == 0
    a := ${v >= 5 ? "ta." : ""}atr(3)
    t := ${v >= 5 ? "ta.tr(true)" : "tr"}
plot(a, "a")
plot(t, "t")
`;

  describe.each([4, 5, 6])("v%i: from the previous chart bar's close", (v) => {
    it("atr and tr", () => {
      const want = atrWant((i) => (i === 0 ? undefined : bars[i - 1].close));
      const r = run(src(v), bars);
      const a = plotOf(r, "a"), t = plotOf(r, "t");
      bars.forEach((_, i) => {
        if (want.has(i)) expect(a[i]).toBeCloseTo(want.get(i)!, 9); else expect(a[i]).toBeUndefined();
        if (i % 3 === 0 && (i > 0 || v >= 5)) expect(t[i]).toBeCloseTo(trOf(i, i === 0 ? undefined : bars[i - 1].close), 9);
      });
      expect(want.size).toBe(2);
    });
  });

  it("v3 ternary: atr runs every bar, equal to the every-bar value on the called bars", () => {
    const s3 = `//@version=3
study("atr3")
a = n % 3 == 0 ? atr(3) : na
ref = atr(3)
plot(a, "a")
plot(ref, "ref")
`;
    const r = run(s3, bars);
    const a = plotOf(r, "a"), ref = plotOf(r, "ref");
    let seen = 0;
    bars.forEach((_, i) => {
      if (i % 3 === 0 && ref[i] !== undefined) { expect(a[i]).toBeCloseTo(ref[i]!, 9); seen++; }
      if (i % 3 !== 0) expect(a[i]).toBeUndefined();
    });
    expect(seen).toBe(3);
  });

  it("v5 ternary stays lazy (v4-v6 ternaries are not probed): atr only advances on called bars", () => {
    const s5 = `//@version=5
indicator("atr5")
a = bar_index % 3 == 0 ? ta.atr(3) : na
plot(a, "a")
`;
    const want = atrWant((i) => (i === 0 ? undefined : bars[i - 1].close));
    const a = plotOf(run(s5, bars), "a");
    bars.forEach((_, i) => { if (want.has(i)) expect(a[i]).toBeCloseTo(want.get(i)!, 9); });
  });
});

describe("process_orders_on_close: an exit already marketable at the close fills there", () => {
  const src = (v: number, call: string, dir: string) => `//@version=${v}
strategy("pooc exit", process_orders_on_close = true)
if bar_index == 1
    strategy.entry("L", strategy.${dir}, qty = 1)
if bar_index >= 2 and strategy.position_size ${dir === "long" ? ">" : "<"} 0
    strategy.exit("x", ${call})
`;
  const mk = (i: number, open: number, high: number, low: number, close: number) =>
    ({ time: 1_700_000_000 + i * 86400, open, high, low, close, volume: 1 });
  // bar 1 enters at its close (100); bar 2 places the exit (close 100). Bar 3 opens at 101.
  const bars = [mk(0, 100, 101, 99, 100), mk(1, 100, 101, 99, 100), mk(2, 100, 101, 99, 100), mk(3, 101, 102, 100, 101), mk(4, 101, 102, 100, 101)];

  const CASES: [string, string, string][] = [
    ["long stop above the close", "long", "stop = 105"],
    ["long limit below the close", "long", "limit = 95"],
    ["short stop below the close", "short", "stop = 95"],
    ["short limit above the close", "short", "limit = 105"],
  ];
  describe.each([5, 6])("v%i", (v) => {
    it.each(CASES)("%s fills at the placing bar's close", (_n, dir, call) => {
      const t = run(src(v, call, dir), bars).trades;
      expect(t).toHaveLength(1);
      expect(t[0].entryBarIndex).toBe(1);
      expect(t[0].exitBarIndex).toBe(2);
      expect(t[0].exitPrice).toBe(100);
    });
    it("a level the close has not passed keeps waiting", () => {
      expect(run(src(v, "stop = 95", "long"), bars).trades).toHaveLength(0);
      expect(run(src(v, "limit = 105", "long"), bars).trades).toHaveLength(0);
    });

    // TradingView, BINANCE:BTCUSDT 1h, exit issued right after the entry on the same bar,
    // already beyond the close: 380/380 trades close at the entry's own close, zero length
    // (v5 long stop and limit, v6 long stop, long limit and short stop).
    const sameBar = (call: string, dir: string) => `//@version=${v}
strategy("pooc same bar", process_orders_on_close = true)
if bar_index == 1
    strategy.entry("L", strategy.${dir}, qty = 1)
    strategy.exit("x", from_entry = "L", ${call})
`;
    it.each([
      ["long stop", "long", "stop = 105"],
      ["long limit", "long", "limit = 95"],
      ["short stop", "short", "stop = 95"],
    ])("an exit placed with the entry (%s) closes the trade at the entry's own close", (_n, dir, call) => {
      const t = run(sameBar(call, dir), bars).trades;
      expect(t).toHaveLength(1);
      expect(t[0].entryBarIndex).toBe(1);
      expect(t[0].exitBarIndex).toBe(1);
      expect(t[0].exitPrice).toBe(100);
      expect(t[0].entryPrice).toBe(100);
    });

    it("an exit with a trailing stop is left to the next bar (not probed at the close)", () => {
      const t = run(src(v, "stop = 105, trail_points = 1, trail_offset = 1", "long"), bars).trades;
      expect(t).toHaveLength(1);
      expect(t[0].exitBarIndex).toBe(3);
    });
  });

  it("v4 is not probed and fills a long stop at the next bar's open", () => {
    const t = run(src(4, "stop = 105", "long"), bars).trades;
    expect(t).toHaveLength(1);
    expect(t[0].exitBarIndex).toBe(3);
    expect(t[0].exitPrice).toBe(101);
  });
});
