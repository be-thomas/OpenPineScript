/**
 * Two TradingView behaviours read off batch captures (BINANCE:BTCUSDT 1h):
 *
 * 1. ta.rsi is exactly 0 once its average gain is below 1e-10 (n77 DemaRSI: avgGain 1.2956e-10 plotted
 *    rsi 1.6169e-10; on the next bar avgGain 9.717e-11 and TradingView plotted 0, for 31 bars, where the
 *    formula gives ~1e-10).
 * 2. plotcandle with an na body colour but a wick/border colour still draws the candle, and its OHLC is in
 *    TradingView's data (n128: maincol = na on 172 bars, wickcolor = bordercolor = a colour).
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../runtime/v1/session";

const bars = (closes: number[]) => closes.map((c, i) => ({ time: i * 3600e3, open: c, high: c + 1, low: c - 1, close: c, volume: 1 }));

describe("ta.rsi with an average gain below 1e-10 (n77)", () => {
  it("is 0, and the formula's value above it", () => {
    // one up step, then a steady fall: the gain average decays by 3/4 per bar
    const closes = [100, 101, ...Array.from({ length: 120 }, (_, i) => 101 - (i + 1))];
    const s = new Session();
    s.setChart({ timeframe: "60", symbol: "BINANCE:BTCUSDT" } as any);
    const c = s.compile(`//@version=5
indicator("t")
ch = close - close[1]
plot(ta.rsi(close, 4), "rsi")
plot(ta.rma(math.max(ch, 0), 4), "g")
plot(ta.rma(math.max(-ch, 0), 4), "l")
`);
    expect(c.errors).toEqual([]);
    const r: any = s.runHistory(bars(closes));
    const col = (t: string) => r.series.find((x: any) => x.title === t).data.map((p: any) => p?.value ?? NaN);
    const rsi = col("rsi"), g = col("g"), l = col("l");
    let above = 0, below = 0;
    for (let i = 10; i < closes.length; i++) {
      if (g[i] >= 1e-10) { above++; expect(rsi[i]).toBe(100 - 100 / (1 + g[i] / l[i])); }
      else { below++; expect(rsi[i]).toBe(0); }
    }
    expect(above).toBeGreaterThan(0);
    expect(below).toBeGreaterThan(0);
  });
});

describe("ta.rsi with an average loss below 1e-10 (r7_rsi_eps probe)", () => {
  it("is 100, and the formula's value above it", () => {
    // one down step, then a steady rise: the loss average decays by 3/4 per bar
    const closes = [100, 99, ...Array.from({ length: 120 }, (_, i) => 99 + (i + 1))];
    const s = new Session();
    s.setChart({ timeframe: "60", symbol: "BINANCE:BTCUSDT" } as any);
    const c = s.compile(`//@version=5
indicator("t")
ch = close - close[1]
plot(ta.rsi(close, 4), "rsi")
plot(ta.rma(math.max(ch, 0), 4), "g")
plot(ta.rma(math.max(-ch, 0), 4), "l")
`);
    expect(c.errors).toEqual([]);
    const r: any = s.runHistory(bars(closes));
    const col = (t: string) => r.series.find((x: any) => x.title === t).data.map((p: any) => p?.value ?? NaN);
    const rsi = col("rsi"), g = col("g"), l = col("l");
    let above = 0, below = 0;
    for (let i = 10; i < closes.length; i++) {
      if (l[i] >= 1e-10) { above++; expect(rsi[i]).toBe(100 - 100 / (1 + g[i] / l[i])); }
      else { below++; expect(rsi[i]).toBe(100); }
    }
    expect(above).toBeGreaterThan(0);
    expect(below).toBeGreaterThan(0);
  });
});

describe("plotcandle with an na body colour (n128)", () => {
  const run = (wick: string) => {
    const s = new Session();
    s.setChart({ timeframe: "60", symbol: "BINANCE:BTCUSDT" } as any);
    const c = s.compile(`//@version=6
indicator("t", overlay = true)
body = bar_index % 2 == 0 ? color.blue : na
plotcandle(open, high, low, close, "C", body${wick})
`);
    expect(c.errors).toEqual([]);
    const r: any = s.runHistory(bars([10, 11, 12, 13]));
    return r.series.find((x: any) => x.title === "C").data;
  };
  it("keeps the candle when a wick or border colour is given", () => {
    const d = run(", wickcolor = color.red, bordercolor = color.red");
    expect(d.map((p: any) => p?.close)).toEqual([10, 11, 12, 13]);
    expect(d[1].color).toBe("#00000000");
  });
  it("is a gap when nothing would be drawn", () => {
    const d = run("");
    expect(d[1]).toBeNull();
    expect(d[0]?.close).toBe(10);
  });
});
