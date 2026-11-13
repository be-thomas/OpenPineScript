/**
 * Which price a percent_of_equity default size uses, against TradingView v6 (ENGINE-BUGS.md bug 33).
 * Probe: dev-docs/tv-parity/_probes/sizing-price/run-20261113-043958 (NASDAQ:AAPL 1D, mincontract 1;
 * pine_logs.json logs ps and the candidates qc = floor(eq/close[1]), qo = floor(eq/open), ql = floor(eq/limit)):
 *   2025-05-02 market entry   ps=384275 = qc (qo=397756): the close of the bar that placed the order.
 *   2025-05-19 limit entry    ps=378566 = ql, filled at the better open 207.91: the limit price.
 */
import { describe, it, expect } from "vitest";
import { Session, type Candle } from "../../../runtime/v1/session";

const bar = (i: number, open: number, close: number): Candle =>
  ({ time: Date.UTC(2025, 0, 1 + i), open, high: Math.max(open, close), low: Math.min(open, close), close, volume: 1 });

function finalSize(entry: string, candles: Candle[]): number {
  const s = new Session();
  s.setChart({ symbol: "NASDAQ:AAPL", timeframe: "1D", mintick: 0.01, mincontract: 1 });
  const c = s.compile(`//@version=6
strategy("t", initial_capital = 100000, default_qty_type = strategy.percent_of_equity, default_qty_value = 100, margin_long = 0, margin_short = 0)
if bar_index == 0
    ${entry}
plot(strategy.position_size, "ps")
`);
  expect(c.errors).toEqual([]);
  const r = s.runHistory(candles);
  const ps = r.series.find(x => x.title === "ps")!;
  return (ps.data[ps.data.length - 1] as { value: number }).value;
}

describe("percent_of_equity default size (TradingView v6)", () => {
  it("a market entry is sized at the close of the bar that placed it, not at the gap-up open it fills at", () => {
    // placed on bar 0 (close 100), filled on bar 1 at open 110: qc = floor(100000/100), qo = 909
    const size = finalSize('strategy.entry("L", strategy.long)', [bar(0, 100, 100), bar(1, 110, 110), bar(2, 110, 110)]);
    expect(size).toBe(1000);
  });

  it("a limit entry is sized at its limit price, not at the better open it fills at", () => {
    // limit 100 placed on bar 0 (close 105), bar 1 opens at 95 and fills there: ql = 1000, qo = 1052
    const size = finalSize('strategy.entry("L", strategy.long, limit = 100)', [bar(0, 105, 105), bar(1, 95, 95), bar(2, 95, 95)]);
    expect(size).toBe(1000);
  });
});
