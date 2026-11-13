/**
 * `timeframe.isticks` — the member that blocked TradingView's own `ta` library
 * (versions 13 and 14) from compiling.
 *
 * `setChart` accepts only time-based timeframes, so on any chart a host can
 * declare it is false. A tick chart is reachable only by setting the
 * Context's resolution directly. TradingView's tick timeframe format is
 * "<n>T" (the same unit spelling `bid`/`ask` already rely on for "1T").
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";
import { build } from "../helpers";

const candles = Array.from({ length: 2 }, (_, i) => ({
  time: Date.UTC(2026, 0, 1) + i * 3_600_000, open: 1, high: 2, low: 0.5, close: 1.5, volume: 1,
}));

const src = (v: number) =>
  `//@version=${v}\nindicator("t")\nplot(timeframe.isticks ? 1 : 0, "t")\n`;

describe("timeframe.isticks", () => {
  for (const v of [5, 6]) {
    it(`compiles at v${v} and is false on time-based charts`, () => {
      for (const timeframe of ["1", "60", "D", "W", "1S"]) {
        const s = new Session();
        s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe } as any);
        expect(s.compile(src(v)).errors, timeframe).toEqual([]);
        const r = s.runHistory(candles);
        expect(r.series[0].data.map((p: any) => p.value), timeframe).toEqual([0, 0]);
      }
    });
  }

  it("is true on a tick timeframe", () => {
    const { ctx, exec } = build('//@version=5\nindicator("t")\nx = timeframe.isticks\n');
    ctx.resolution = "1T";
    ctx.setBar(0, 1, 2, 0.5, 1.5, 1);
    exec();
    expect(ctx.vars.get("opsv2_x")?.valueOf()).toBe(true);
  });
});
