/**
 * strategy.risk limits (ENGINE-BUGS.md bugs 34, 35; plain defects, so both versions are checked) and the
 * drawdown halt TradingView shows. Probe: dev-docs/tv-parity/_probes/risk-drawdown/run-20261113-044227
 * (BINANCE:BTCUSDT 1h, v5, initial_capital 10000, max_drawdown(3, strategy.percent_of_equity)): 44 trades, then
 * none; the engine used to read the percent constant as cash and seed the peak from the default capital, so it
 * halted on bar 0 and never traded.
 */
import { describe, it, expect } from "vitest";
import { Session, type Candle } from "../../../runtime/v1/session";

const bar = (i: number, open: number, close: number, low = Math.min(open, close)): Candle =>
  ({ time: Date.UTC(2025, 0, 1, i), open, high: Math.max(open, close), low, close, volume: 1 });

function run(version: number, risk: string, candles: Candle[], entries: string): any {
  const s = new Session();
  s.setChart({ symbol: "TEST:X", timeframe: "60", mintick: 0.01 });
  const c = s.compile(`//@version=${version}
strategy("t", initial_capital = 10000, default_qty_type = strategy.fixed, default_qty_value = 100, margin_long = 0, margin_short = 0)
${risk}
${entries}
plot(strategy.position_size, "ps")
`);
  expect(c.errors).toEqual([]);
  return s.runHistory(candles);
}

// one long per two bars, each losing 100 per share-lot: entry fills at the next open, exit one bar later
const losing = Array.from({ length: 40 }, (_, i) => bar(i, 1000 - i, 1000 - i));
const roundTrips = `if bar_index % 2 == 0
    strategy.entry("L", strategy.long, qty = 1)
if bar_index % 2 == 1
    strategy.close("L")`;

for (const version of [5, 6]) {
  describe(`strategy.risk, v${version}`, () => {
    it("max_drawdown with strategy.percent_of_equity halts at that percentage of peak equity", () => {
      // each trade loses 1 of 10000, so 0.05% (5 units) is reached by the 5th loss; read as 0.05 cash
      // (the percent constant was not recognised) it halted after the first
      const r = run(version, "strategy.risk.max_drawdown(0.05, strategy.percent_of_equity)", losing, roundTrips);
      expect(r.trades.length).toBe(5);
    });

    it("max_drawdown in cash units halts at that many units", () => {
      const r = run(version, "strategy.risk.max_drawdown(5, strategy.cash)", losing, roundTrips);
      expect(r.trades.length).toBe(5);
    });

    it("max_intraday_loss with strategy.percent_of_equity is a percentage of the day's starting equity", () => {
      // long 100 at 100, equity 10000: 1% = 100 units. A dip to 99.5 loses 50 (under 1%, over 1 cash unit).
      const shallow = [bar(0, 100, 100), bar(1, 100, 100, 99.5), bar(2, 100, 100), bar(3, 100, 100)];
      const deep = [bar(0, 100, 100), bar(1, 100, 100, 98.5), bar(2, 100, 100), bar(3, 100, 100)];
      const entry = `if bar_index == 0
    strategy.entry("L", strategy.long, qty = 100)`;
      const risk = "strategy.risk.max_intraday_loss(1, strategy.percent_of_equity)";
      expect(run(version, risk, shallow, entry).trades.length).toBe(0);
      expect(run(version, risk, deep, entry).trades.length).toBe(1);
    });

    it("max_drawdown is measured on realized equity: a dip in open profit that recovers does not halt", () => {
      // risk-drawdown probe: a long sat through a 3.1% open drawdown (2026-01-18 23:00) and exited at its
      // scheduled bar. Here 4% open loss (400 of 10000) against a 3% limit, back at 100 for the scheduled exit.
      const dip = [bar(0, 100, 100), bar(1, 100, 96), bar(2, 96, 96), bar(3, 100, 100), bar(4, 100, 100), bar(5, 100, 100)];
      const entries = `if bar_index == 0
    strategy.entry("L", strategy.long, qty = 100)
if bar_index == 3
    strategy.close("L")`;
      const r = run(version, "strategy.risk.max_drawdown(3, strategy.percent_of_equity)", dip, entries);
      expect(r.trades.length).toBe(1);
      expect(r.trades[0].exitId ?? r.trades[0].id).toMatch(/Close/);
      expect(r.trades[0].pnl).toBeCloseTo(0, 9);
    });

    it("an initial_capital below the default does not halt a drawdown limit on bar 0", () => {
      // flat prices: nothing is ever lost, so a 3% limit never trips. It used to see 10000 against a peak
      // seeded from the default capital (a 99% drawdown) and never trade.
      const flat = Array.from({ length: 12 }, (_, i) => bar(i, 100, 100));
      const r = run(version, "strategy.risk.max_drawdown(3, strategy.percent_of_equity)", flat, roundTrips);
      expect(r.trades.length).toBe(5);
    });
  });
}
