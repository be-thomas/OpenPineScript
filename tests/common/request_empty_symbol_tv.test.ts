/**
 * request.security("", …): an empty symbol (an `input.symbol("")` left blank) is the chart's own.
 * TradingView probe triage r6 s1ind/01 (BINANCE:BTCUSDT 1h): request.security("", "D", close,
 * lookahead_on) equals request.security(syminfo.tickerid, …) on all 300 captured bars and is never na.
 * The engine asked the host for a symbol named "" and stayed na. Synthetic data.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../runtime/v1/session";

const H = 3600_000, T0 = Date.UTC(2026, 0, 5);
const bars = Array.from({ length: 72 }, (_, i) => ({ time: T0 + i * H, open: 100 + i, high: 101 + i, low: 99 + i, close: 100 + i, volume: 1 }));

describe("request.security with an empty symbol", () => {
  it("is the chart's symbol", () => {
    const s = new Session();
    s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "60" } as any);
    expect(s.compile(`//@version=5
indicator("t")
t2 = input.symbol("", "Ticker")
sc(ticker) => request.security(ticker, "D", close, lookahead = barmerge.lookahead_on)
plot(sc(syminfo.tickerid), "chart")
plot(sc(t2), "empty")
plot(request.security_lower_tf("", "30", close).size(), "ltf")`).errors).toEqual([]);
    const r: any = s.runHistory(bars);
    expect(r.errors).toEqual([]);
    const col = (t: string) => r.series.find((x: any) => x.title === t).data.map((p: any) => p?.value);
    expect(col("empty")).toEqual(col("chart"));
    expect(col("empty").every((v: number) => Number.isFinite(v))).toBe(true);
    expect(r.warnings.some((w: string) => /for  at timeframe/.test(w))).toBe(false);
  });
});
