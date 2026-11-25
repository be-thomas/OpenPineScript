/**
 * An intraday timeframe that does not divide 24h restarts at 00:00 UTC each day
 * on a 24x7 symbol: "300" (5h) buckets are 00-05, 05-10, 10-15, 15-20, 20-24.
 * TradingView capture, popular-author batch 2026-11-21 (v6); the engine's
 * epoch-aligned buckets drifted a day at a time (13:00/18:00 instead of 14:00/19:00).
 * Symbols with a defined session keep their session-anchored buckets.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../runtime/v1/session";
import { aggregate, DerivedSeries, type Candle } from "../../runtime/v1/timeframes";

const H = 3600_000;
// Four days of hourly bars starting on a day whose epoch-aligned 5h buckets are NOT at 00:00.
const start = Date.UTC(2026, 0, 3, 0, 0);
const hourly: Candle[] = Array.from({ length: 96 }, (_, i) => ({
  time: start + i * H, open: 1 + i, high: 2 + i, low: i, close: 1 + i, volume: 1,
}));

describe("request.security with a 5h timeframe on a 24x7 symbol", () => {
  // Hour of day of every bar on which the value differs from the bar before.
  function changes(extra: string): number[] {
    const s = new Session();
    s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "60", mintick: 0.01, type: "crypto", currency: "USDT",
      basecurrency: "BTC", timezone: "Etc/UTC", session: "24x7" });
    expect(s.compile(`//@version=6\nindicator("t")\nplot(request.security(syminfo.tickerid, "300", time${extra}))\n`).errors).toEqual([]);
    const r: any = s.runHistory(hourly);
    expect(r.errors).toEqual([]);
    const got = r.series[0].data.map((p: any) => p?.value);
    const out: number[] = [];
    got.forEach((v: number, i: number) => { if (i > 0 && v !== got[i - 1]) out.push(i % 24); });
    return out.slice(0, 9);
  }

  it("restarts the buckets at 00:00 UTC: the new bucket's open time shows at 05, 10, 15, 20, 00", () => {
    expect(changes(", lookahead = barmerge.lookahead_on")).toEqual([5, 10, 15, 20, 0, 5, 10, 15, 20]);
  });

  it("without lookahead a bucket shows once its last bar is in: 04, 09, 14, 19, 23", () => {
    expect(changes("")).toEqual([4, 9, 14, 19, 23, 4, 9, 14, 19]);
  });
});

describe("DerivedSeries with a 5h span on 1h bars", () => {
  it("opens a candle at 00, 05, 10, 15 and 20 each day, with or without the chart interval", () => {
    for (const d of [new DerivedSeries("300", H), new DerivedSeries("300")]) {
      d.extend(hourly, hourly.length);
      expect(d.candles.slice(0, 6).map((c) => new Date(c.time).getUTCHours())).toEqual([0, 5, 10, 15, 20, 0]);
      expect(d.candles.length).toBe(20);
    }
    expect(aggregate(hourly, "300").length).toBe(20);
  });

  it("a span that divides the day is unchanged", () => {
    const d = new DerivedSeries("360", H);
    d.extend(hourly, hourly.length);
    expect(d.candles.slice(0, 5).map((c) => new Date(c.time).getUTCHours())).toEqual([0, 6, 12, 18, 0]);
  });
});
