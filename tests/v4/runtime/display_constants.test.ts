/**
 * `display.none` and `display.all` at v4. TradingView v4 compiles
 * `plot(close, "none", display = display.none)` and `display = display.all`;
 * its script outputs carry display 0 and 15 and both plots still carry values
 * (dev-docs/tv-parity/_probes/corpus98/p4_v4_display, BINANCE:BTCUSDT 1h,
 * 2026-11-14). The rest of `display.*` is v5 and stays refused at v4.
 */
import { describe, it, expect } from "vitest";
import { Session, type Candle } from "../../../runtime/v1/session";

const bars: Candle[] = Array.from({ length: 3 }, (_, i) => ({
  time: Date.UTC(2025, 0, 1, i), open: 10, high: 12, low: 9, close: 11 + i, volume: 1,
}));

function run(src: string) {
  const s = new Session();
  s.setChart({ timeframe: "60", symbol: "BINANCE:BTCUSDT" });
  const c = s.compile(src);
  return { errors: c.errors, series: c.errors.length ? [] : s.runHistory(bars).series };
}
const col = (r: ReturnType<typeof run>, t: string) => r.series.find(x => x.title === t)!.data.map((d: any) => d.value);

describe("v4 display.none / display.all", () => {
  it("both plots compile and still carry their values", () => {
    const r = run(`//@version=4
study("p4 v4 display")
plot(close, "none", display=display.none)
plot(close, "all", display=display.all)
plot(close, "tr", display=display.all, transp=50)
`);
    expect(r.errors).toEqual([]);
    expect(col(r, "none")).toEqual([11, 12, 13]);
    expect(col(r, "all")).toEqual([11, 12, 13]);
    expect(col(r, "tr")).toEqual([11, 12, 13]);
  });

  it("carry v5's values: 0 and 15", () => {
    const r = run(`//@version=4
study("x")
plot(display.none, "none")
plot(display.all, "all")
`);
    expect(col(r, "none")).toEqual([0, 0, 0]);
    expect(col(r, "all")).toEqual([15, 15, 15]);
  });

  it("the other display.* members stay v5-only", () => {
    const r = run(`//@version=4
study("x")
plot(close, display=display.pane)
`);
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it("v5 is unchanged", () => {
    const r = run(`//@version=5
indicator("x")
plot(display.all - display.pane, "all_minus_pane")
`);
    expect(r.errors).toEqual([]);
    expect(col(r, "all_minus_pane")).toEqual([13, 13, 13]);
  });
});
