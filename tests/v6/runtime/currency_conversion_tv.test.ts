/**
 * strategy(currency = X) on a symbol quoted in another currency: a closed trade's
 * profit and exit commission are multiplied by the host's currency_rate in effect
 * at the exit bar, its entry commission by the rate at the entry bar. TradingView
 * evidence (BINANCE:BTCUSDT 1h, currency USD):
 * dev-docs/tv-parity/_probes/currency-usd-1btc/run-20261113-050337/trades.csv
 * against the rate series in _probes/currency-rate-series/run-20261113-050713 and
 * _tvdata/CURRENCY_USDT_USD__1D.csv: all 179 trades entered and closed on different
 * days match to the cent this way (172 with the whole trade at the exit's rate), and
 * so do n105's (v4, 0.2%: 8552.87 = 38400 * 0.99873 - 14956.00 * 0.9988 - 14879.20 * 0.99873).
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const DAY = 86400000;
const T0 = Date.UTC(2026, 0, 1);

// Bar i opens at 100 + 10 * i, so a trade's P&L is its bars' distance * 10.
// Entry and exit each pay a flat 1. Long entered on the order of bar 0 (fills bar 1 open 110), closed on bar 2's
// order (fills bar 3 open 130): +20. Second: fills 150, closes 170: +20.
const SRC = (currency: string) => `//@version=5
strategy("t", currency=${currency}, commission_type=strategy.commission.cash_per_order, commission_value=1, default_qty_type=strategy.fixed, default_qty_value=1)
if bar_index == 0 or bar_index == 4
    strategy.entry("L", strategy.long)
if bar_index == 2 or bar_index == 6
    strategy.close("L")
`;

function run(currency: string, symCurrency: string, rates?: Array<{ time: number; value: number }>) {
  const s = new Session();
  s.setChart({ symbol: "X:Y", timeframe: "D", mintick: 0.01, currency: symCurrency } as any);
  if (rates) s.provideCurrencyRate(symCurrency, "USD", rates);
  s.compile(SRC(currency));
  const candles = Array.from({ length: 9 }, (_, i) => {
    const o = 100 + 10 * i;
    return { time: T0 + i * DAY, open: o, high: o + 5, low: o - 5, close: o, volume: 1 };
  });
  const result = s.runHistory(candles);
  return { ctx: (s as any).ctx, result };
}

const RATES = [
  { time: T0, value: 1 },
  { time: T0 + 3 * DAY, value: 2 },   // the first trade's exit bar
  { time: T0 + 5 * DAY, value: 2.5 },
  { time: T0 + 7 * DAY, value: 3 },   // the second trade's exit bar
];

describe("strategy currency conversion", () => {
  it("books each closed trade at its exit bar's rate, the entry commission at its entry bar's", () => {
    const { ctx } = run("currency.USD", "USDT", RATES);
    // first: entered on bar 1 (rate 1), closed on bar 3 (rate 2); second: bar 5 (2.5) to bar 7 (3)
    expect(ctx.trades.map((t: any) => t.pnl)).toEqual([(20 - 1) * 2 - 1 * 1, (20 - 1) * 3 - 1 * 2.5]);
    expect(ctx.trades.map((t: any) => t.commission)).toEqual([2 + 1, 3 + 2.5]);
    expect(ctx.netProfitSum).toBeCloseTo(37 + 54.5, 9);
    expect(ctx.cash - ctx.initialCapital).toBeCloseTo(37 + 54.5, 9);
  });

  it("keeps one series per (from, to) pair: a second call replaces the first", () => {
    const s = new Session();
    s.provideCurrencyRate("USDT", "USD", [{ time: T0, value: 1 }]);
    s.provideCurrencyRate("USDT", "USD", RATES);
    s.provideCurrencyRate("EUR", "USD", [{ time: T0, value: 1.1 }]);
    const rates = (s as any).currencyRates;
    expect(rates).toHaveLength(2);
    expect(rates.find((r: any) => r.from === "USDT").samples).toEqual(RATES);
  });

  it("changes nothing when no rate was supplied, and warns once", () => {
    const { ctx, result } = run("currency.USD", "USDT");
    expect(ctx.trades.map((t: any) => t.pnl)).toEqual([18, 18]);
    expect(result.warnings.filter((w: string) => /no rate was supplied/.test(w))).toHaveLength(1);
  });

  it("changes nothing when the strategy and the symbol share a currency", () => {
    const { ctx, result } = run("currency.USD", "USD", RATES);
    expect(ctx.trades.map((t: any) => t.pnl)).toEqual([18, 18]);
    expect(result.warnings).toEqual([]);
  });
});
