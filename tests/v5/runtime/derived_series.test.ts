/**
 * A higher timeframe built from the chart's own bars is folded as the bars
 * arrive, not again from the first bar on every bar (which made a 110,000-bar
 * run quadratic). It must be what folding the whole prefix gives, including
 * when the newest bar is re-ticked.
 */
import { describe, it, expect } from "vitest";
import { aggregate, DerivedSeries, type Candle } from "../../../runtime/v1/timeframes";

// A deterministic walk of 1-minute bars across several days, weeks and a month end.
function makeBars(n: number, seed: number, start = Date.UTC(2024, 0, 29, 23, 0)): Candle[] {
  let x = seed;
  const rnd = () => (x = (x * 1664525 + 1013904223) >>> 0) / 4294967296;
  let p = 100;
  return Array.from({ length: n }, (_, i) => {
    const open = p, close = p + (rnd() - 0.5) * 2;
    p = close;
    return { time: start + i * 60_000, open, high: Math.max(open, close) + rnd(), low: Math.min(open, close) - rnd(), close, volume: 1 + rnd() * 10 };
  });
}

describe("DerivedSeries", () => {
  for (const spec of ["5", "60", "D", "3D", "W", "M", "30S"]) {
    it(`${spec}: equals aggregate over every prefix`, () => {
      const bars = makeBars(3000, 7);
      const d = new DerivedSeries(spec);
      for (let seen = 1; seen <= bars.length; seen += seen < 50 ? 1 : 37) {
        d.extend(bars, seen);
        expect(d.candles).toEqual(aggregate(bars.slice(0, seen), spec));
      }
    });
  }

  it("redoes the newest bar when it is re-ticked", () => {
    const bars = makeBars(400, 3);
    const d = new DerivedSeries("60");
    for (let seen = 1; seen < bars.length; seen++) {
      d.extend(bars, seen);
      // The newest bar ticks again, a new object as `setBar` makes it; the next bar then arrives.
      const last = bars[seen - 1];
      bars[seen - 1] = { ...last, high: last.high + 5, close: last.close + 1, volume: last.volume + 3 };
      d.extend(bars, seen + 1);
      expect(d.candles).toEqual(aggregate(bars.slice(0, seen + 1), "60"));
    }
  });

  it("starts again when the bars are another run's", () => {
    const a = makeBars(300, 1), b = makeBars(300, 2);
    const d = new DerivedSeries("5");
    d.extend(a, 100);
    d.extend(b, 250);
    expect(d.candles).toEqual(aggregate(b.slice(0, 250), "5"));
  });

  it("is empty for a spec that is not a timeframe", () => {
    const d = new DerivedSeries("bogus");
    d.extend(makeBars(10, 1), 10);
    expect(d.candles).toEqual([]);
  });
});

describe("request.security on a timeframe derived from the chart", () => {
  // 1-minute bars whose close is their index, so hour h closes at 60h + 59.
  const n = 60_000;
  const bars = Array.from({ length: n }, (_, i) => ({
    time: Date.UTC(2024, 0, 1) + i * 60_000, open: i, high: i + 1, low: i - 1, close: i, volume: 1,
  }));

  it("shows the last closed hour, and does not fold every earlier bar again on each bar", async () => {
    const { Session } = await import("../../../runtime/v1/session");
    const s = new Session();
    s.setChart({ symbol: "TEST:X", timeframe: "1", mintick: 0.01, type: "crypto", currency: "USD", basecurrency: "X", timezone: "Etc/UTC", session: "24x7" } as any);
    const c = s.compile('//@version=5\nindicator("t")\nplot(request.security(syminfo.tickerid, "60", close), "h")\n');
    expect(c.errors).toEqual([]);
    const t0 = performance.now();
    const r = s.runHistory(bars);
    const took = performance.now() - t0;
    const h = r.series.find((p) => p.title === "h")!.data.map((d: any) => d?.value);
    // TradingView's log (conformance/v5/parity/harness_security_tf.BTCUSDT.5.csv, bars 4475, 4487, ...): a requested bar's value appears on the chart bar that ENDS it.
    expect(h[30] ?? NaN).toBeNaN();                      // inside the first hour: nothing has closed
    expect(h[58] ?? NaN).toBeNaN();
    expect(h[59]).toBe(59);                         // the last minute of hour 0 carries hour 0's close
    expect(h[60]).toBe(59);
    expect(h[118]).toBe(59);
    expect(h[119]).toBe(119);                       // and the last minute of hour 1 carries hour 1's
    expect(h[n - 1]).toBe(n - 1);
    // Folding the prefix again on every bar took minutes at this size.
    expect(took).toBeLessThan(8000);
  }, 180_000);
});

describe("derived buckets across a session", () => {
  // Two 09:30-16:00 sessions (UTC offsets do not matter here) of 5-minute bars, a
  // night between them. TradingView's hourly bars of a stock open at 09:30,
  // 10:30, ... 15:30 (conformance/v5/parity/harness_security_session.AAPL.5.csv).
  const FIVE = 300_000, HOUR = 3_600_000, DAY = 86_400_000;
  const session = (day: number) => Array.from({ length: 78 }, (_, k) => {
    const time = Date.UTC(2024, 0, 2 + day, 14, 30) + k * FIVE;
    return { time, open: k, high: k + 1, low: k - 1, close: k, volume: 1 };
  });
  const bars = [...session(0), ...session(1)];

  it("anchors an hourly spec at each session's first bar once a gap shows there is one", () => {
    const d = new DerivedSeries("60", FIVE);
    d.extend(bars, bars.length);
    const day1 = d.candles.filter(c => c.time >= Date.UTC(2024, 0, 3));
    expect(day1.map(c => (c.time - Date.UTC(2024, 0, 3, 14, 30)) / HOUR)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    // 09:30-10:30, ..., and the half-hour 15:30-16:00 last
    expect(day1[6].volume).toBe(6);
  });

  it("a bar ends with its last chart bar when the next one opens elsewhere, else it has no closeTime", () => {
    const d = new DerivedSeries("60", FIVE);
    d.extend(bars, 78, bars[78].time);                              // the session's last bar, next one known
    expect(d.candles[d.candles.length - 1].closeTime).toBe(bars[77].time + FIVE);
    const live = new DerivedSeries("60", FIVE);
    live.extend(bars, 78, undefined);                               // next unknown: the calendar end applies
    expect(live.candles[live.candles.length - 1].closeTime).toBeUndefined();
  });

  it("a daily bar of a session ends with the session's last bar", () => {
    const d = new DerivedSeries("D", FIVE);
    d.extend(bars, 78, bars[78].time);
    expect(d.candles[0].closeTime).toBe(bars[77].time + FIVE);
  });

  it("a series with no gap stays on the clock, as before", () => {
    const flat = Array.from({ length: 30 }, (_, k) => ({ time: Date.UTC(2024, 0, 1, 0, 10) + k * FIVE, open: k, high: k, low: k, close: k, volume: 1 }));
    const d = new DerivedSeries("60", FIVE);
    d.extend(flat, flat.length);
    expect(d.candles.map(c => c.time % HOUR === 10 * 60_000 || c.time === flat[0].time || c.time % HOUR === 0)).toEqual(d.candles.map(() => true));
    expect(d.candles.slice(1).every(c => c.time % HOUR === 0)).toBe(true);
    void DAY;
  });
});
