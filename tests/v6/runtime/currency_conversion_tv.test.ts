/**
 * strategy(currency = X) on a symbol quoted in another currency: closed-trade
 * profit and commission are multiplied by the host's currency_rate in effect
 * at the exit bar. TradingView evidence (BINANCE:BTCUSDT 1h, currency USD):
 * dev-docs/tv-parity/_probes/currency-usd-1btc/run-20261113-050337/trades.csv
 * against the rate series in _probes/currency-rate-series/run-20261113-050713.
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
  it("books each closed trade at the rate in effect on its exit bar", () => {
    const { ctx } = run("currency.USD", "USDT", RATES);
    expect(ctx.trades.map((t: any) => t.pnl)).toEqual([(20 - 2) * 2, (20 - 2) * 3]);
    expect(ctx.trades.map((t: any) => t.commission)).toEqual([4, 6]);
    expect(ctx.netProfitSum).toBeCloseTo(36 + 54, 9);
    expect(ctx.cash - ctx.initialCapital).toBeCloseTo(36 + 54, 9);
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
