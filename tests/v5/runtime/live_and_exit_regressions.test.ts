/**
 * Regressions from the second independent review of the strategy and
 * higher-timeframe work: live bars that end a requested bar, exits waiting on
 * an entry that has not filled, snapshot completeness, `immediately` on a live
 * tick, OCA with a default size, intrabar arrays that change, and a running
 * net profit.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const DAY = 86_400_000, M = 60_000, M5 = 300_000, H = 3_600_000;
const t0 = Date.UTC(2024, 0, 1);
const candle = (time: number, o: number, h: number, l: number, c: number) => ({ time, open: o, high: h, low: l, close: c, volume: 1 });
const chartSession = (timeframe: string) => {
  const s = new Session();
  s.setChart({ symbol: "TEST:X", timeframe, mintick: 0.01, timezone: "UTC", type: "crypto" });
  return s;
};
const dailyBars = (rows: number[][]) => rows.map((b, i) => candle(t0 + i * DAY, b[0], b[1], b[2], b[3]));
const val = (d: any) => d.series[0].value;

describe("a live chart bar that ends a requested bar", () => {
  const src = `//@version=5\nindicator("c")\nplot(request.security("TEST:X", "60", close), "h")\n`;
  const chart = Array.from({ length: 23 }, (_, i) => candle(t0 + i * M5, i, i, i, i));
  const htf = (last: number) => [candle(t0, 0, 11, 0, 11), candle(t0 + H, 12, 23, 12, last)];

  it("re-evaluates on each tick with the host's updating hourly bar, and settles on the last", () => {
    const s = chartSession("5");
    s.provideData("TEST:X", "60", htf(22));
    s.compile(src);
    s.runHistory(chart);
    s.provideData("TEST:X", "60", htf(22.5));
    expect(val(s.tick(candle(t0 + 23 * M5, 22.5, 22.5, 22.5, 22.5)))).toBe(22.5);
    s.provideData("TEST:X", "60", htf(23));
    expect(val(s.tick(candle(t0 + 23 * M5, 22.5, 23, 22.5, 23)))).toBe(23);      // was frozen at 22.5
    s.commit();
    s.provideData("TEST:X", "60", [...htf(23), candle(t0 + 2 * H, 24, 24, 24, 24)]);
    expect(val(s.tick(candle(t0 + 24 * M5, 24, 24, 24, 24)))).toBe(23);
  });

  it("a derived series follows the live bar too", () => {
    const s = chartSession("5");
    s.compile(`//@version=5\nindicator("c2")\nplot(request.security(syminfo.tickerid, "60", close), "h")\n`);
    s.runHistory(chart);
    expect(val(s.tick(candle(t0 + 23 * M5, 22.5, 22.5, 22.5, 22.5)))).toBe(22.5);
    expect(val(s.tick(candle(t0 + 23 * M5, 22.5, 30, 22.5, 30)))).toBe(30);       // was frozen at 22.5
    s.commit();
    expect(val(s.tick(candle(t0 + 24 * M5, 31, 31, 31, 31)))).toBe(30);
  });
});

describe("exits waiting on an entry that has not filled", () => {
  // bar 1 short fills at bar 2 and is reversed by L (placed bar 3, fills bar 4)
  // together with its stop; the stop for L must survive the reversal.
  const src = (when: string) => `//@version=5
strategy("a", overlay = true)
if bar_index == 1
    strategy.entry("S", strategy.short${when})
if bar_index == 3
    strategy.entry("L", strategy.long)
    strategy.exit("XL", "L", loss = 500)
`;
  const flat = [100, 101, 99, 100];
  const rows = [flat, flat, flat, flat, [100, 101, 90, 92], [92, 93, 91, 92], [92, 93, 91, 92]];
  for (const [name, when] of [["after a prior short", ""], ["with no prior short", ", when = false"]] as const) {
    it(`L is stopped at 95 on bar 4, ${name}`, () => {
      const s = chartSession("1D");
      expect(s.compile(src(when)).errors).toEqual([]);
      const r: any = s.runHistory(dailyBars(rows));
      const stop = r.trades.find((t: any) => t.id === "Exit XL");
      expect(stop).toMatchObject({ entryId: "L", entryPrice: 100, exitPrice: 95, exitBarIndex: 4 });
      expect(r.position.size).toBe(0);
    });
  }
});

describe("the broker's counters on a live bar", () => {
  it("the order count is rolled back with each tick", () => {
    const s = chartSession("1D");
    s.compile(`//@version=5\nstrategy("b")\nif bar_index % 2 == 0\n    strategy.entry("L", strategy.long)\nelse\n    strategy.close("L")\n`);
    s.runHistory(dailyBars(Array.from({ length: 10 }, () => [100, 101, 99, 100])));
    const ctx: any = (s as any).ctx;
    const before = ctx.filledOrderCount;
    const t = t0 + 10 * DAY;
    for (let k = 0; k < 50; k++) s.tick(candle(t, 100, 101, 99, 100 + k * 0.01));
    expect(ctx.filledOrderCount).toBe(before + 1);             // the one queued close, not 50
  });

  it("net profit after ticks equals the sum of the closed trades", () => {
    const s = chartSession("1D");
    s.compile(`//@version=5\nstrategy("n")\nif bar_index % 2 == 0\n    strategy.entry("L", strategy.long)\nelse\n    strategy.close("L")\nplot(strategy.netprofit, "np")\n`);
    const rows = Array.from({ length: 10 }, (_, i) => [100 + i, 101 + i, 99 + i, 100 + i]);
    const r: any = s.runHistory(dailyBars(rows));
    const ctx: any = (s as any).ctx;
    const sum = () => ctx.trades.reduce((a: number, x: any) => a + x.pnl, 0);
    expect(ctx.netProfitSum).toBe(sum());
    const t = t0 + 10 * DAY;
    for (let k = 0; k < 5; k++) s.tick(candle(t, 110, 111, 109, 110 + k));
    expect(ctx.netProfitSum).toBe(sum());
    expect(r.errors).toEqual([]);
  });
});

describe("close(immediately = true) on a live tick", () => {
  it("fills at that tick's price, and is rolled back by the next tick", () => {
    const s = chartSession("1D");
    s.compile(`//@version=5\nstrategy("h", calc_on_every_tick = true)\nif bar_index == 1\n    strategy.entry("L", strategy.long)\nif barstate.isrealtime\n    strategy.close("L", immediately = true)\n`);
    s.runHistory(dailyBars([[100, 101, 99, 100], [100, 101, 99, 100], [100, 101, 99, 100]]));
    const ctx: any = (s as any).ctx;
    const t = t0 + 3 * DAY;
    s.tick(candle(t, 100, 105, 100, 105));
    expect(ctx.trades.map((x: any) => x.exitPrice)).toEqual([105]);
    s.tick(candle(t, 100, 105, 90, 90));
    expect(ctx.trades.map((x: any) => x.exitPrice)).toEqual([90]);
  });
});

describe("OCA reduce when an order has no qty", () => {
  it("the default size is resolved: the sibling is reduced, not dropped", () => {
    const src = (q: string) => `//@version=5
strategy("e", default_qty_value = 3)
if bar_index == 1
    strategy.order("A", strategy.long, ${q}limit = 95, oca_name = "g", oca_type = strategy.oca.reduce)
    strategy.order("B", strategy.long, qty = 5, limit = 90, oca_name = "g", oca_type = strategy.oca.reduce)
`;
    const rows = [[100, 101, 99, 100], [100, 101, 99, 100], [100, 101, 94, 96], [96, 97, 89, 90], [90, 91, 89, 90]];
    const size = (q: string) => {
      const s = chartSession("1D");
      expect(s.compile(src(q)).errors).toEqual([]);
      return (s.runHistory(dailyBars(rows)) as any).position.size;
    };
    // A fills 3 at bar 2, leaving B 5 - 3 = 2, which fills at bar 3: 5 in all.
    expect(size("qty = 3, ")).toBe(5);
    expect(size("")).toBe(5);
  });
});

describe("request.security_lower_tf on a live bar", () => {
  const src = `//@version=5\nindicator("j")\na = request.security_lower_tf("TEST:X", "1", close)\n` +
    `plot(array.size(a) > 0 ? array.get(a, array.size(a) - 1) : na, "last")\nplot(array.size(a), "n")\n`;
  const chart = Array.from({ length: 4 }, (_, i) => candle(t0 + i * M5, i, i, i, i));
  const mk = (n: number) => Array.from({ length: n }, (_, i) => candle(t0 + i * M, i, i, i, i));

  it("an intrabar changed in place is picked up, and a new one appended", () => {
    const ltf: any[] = mk(20);
    const s = chartSession("5");
    s.provideData("TEST:X", "1", ltf);
    s.compile(src);
    s.runHistory(chart);
    ltf.push(candle(t0 + 20 * M, 100, 100, 100, 100));
    const at = (d: any) => d.series.map((x: any) => x.value);
    expect(at(s.tick(candle(t0 + 20 * M, 100, 100, 100, 100)))).toEqual([100, 1]);
    ltf[20].close = 150;                                        // in place
    expect(at(s.tick(candle(t0 + 20 * M, 100, 150, 100, 150)))).toEqual([150, 1]);   // was stale 100
    ltf.push(candle(t0 + 21 * M, 160, 160, 160, 160));
    expect(at(s.tick(candle(t0 + 20 * M, 100, 160, 100, 160)))).toEqual([160, 2]);
  });

  it("fresh candle objects each tick do not rebuild the whole history", () => {
    const N = 4000;                                              // chart bars; 5 intrabars each
    const bigChart = Array.from({ length: N }, (_, i) => candle(t0 + i * M5, i, i, i, i));
    const s = chartSession("5");
    s.provideData("TEST:X", "1", mk(N * 5));
    s.compile(`//@version=5\nindicator("k")\na = request.security_lower_tf("TEST:X", "1", ta.sma(close, 5))\nplot(array.size(a))\n`);
    s.runHistory(bigChart);
    const started = Date.now();
    for (let k = 0; k < 30; k++) {
      s.provideData("TEST:X", "1", [...mk(N * 5), candle(t0 + N * 5 * M, 1, 1, 1, 1000 + k)]);
      s.tick(candle(t0 + N * 5 * M, 1, 1, 1, 1));
    }
    // A full rebuild per tick re-ran 20,000 intrabars of sma each time.
    expect(Date.now() - started).toBeLessThan(1500);
  });
});
