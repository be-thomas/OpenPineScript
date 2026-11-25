/**
 * `input.time` is a CONSTANT at v4 and a FUNCTION at v5/v6.
 *
 * TradingView v4 compiles `input(defval = timestamp(...), type = input.time)`
 * and returns the timestamp; `time >= t` is true from that bar on
 * (dev-docs/tv-parity/_probes/corpus98/p1_v4_input_time, BINANCE:BTCUSDT 1h,
 * 2026-11-14). The v5/v6 `input.time()` function is unchanged.
 */
import { describe, it, expect } from "vitest";
import { Session, type Candle } from "../../../runtime/v1/session";

const START = 1546349400000; // 01 Jan 2019 13:30 +0000

const bars: Candle[] = Array.from({ length: 4 }, (_, i) => ({
  time: START + (i - 1) * 3600000, open: 10, high: 11, low: 9, close: 10, volume: 1,
}));

function run(src: string) {
  const s = new Session();
  s.setChart({ timeframe: "60", symbol: "BINANCE:BTCUSDT" });
  const c = s.compile(src);
  expect(c.errors).toEqual([]);
  const r = s.runHistory(bars);
  const col = (t: string) => r.series.find(x => x.title === t)!.data.map((d: any) => d?.value);
  return { t: col("t"), after: col("after") };
}

describe("input.time", () => {
  it("v4: input(defval=timestamp(...), type=input.time) returns the timestamp", () => {
    const { t, after } = run(`//@version=4
study("p1 v4 input.time")
t = input(defval=timestamp("01 Jan 2019 13:30 +0000"), title="Start", type=input.time)
plot(t, "t")
plot(time >= t ? 1 : 0, "after")
`);
    expect(t).toEqual([START, START, START, START]);
    expect(after).toEqual([0, 1, 1, 1]);
  });

  it("v5: input.time() is still the function", () => {
    const { t, after } = run(`//@version=5
indicator("p1 v5 input.time")
t = input.time(timestamp("01 Jan 2019 13:30 +0000"), "Start")
plot(t, "t")
plot(time >= t ? 1 : 0, "after")
`);
    expect(t).toEqual([START, START, START, START]);
    expect(after).toEqual([0, 1, 1, 1]);
  });
});
