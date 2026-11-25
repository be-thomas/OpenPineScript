/**
 * Max drawdown as TradingView reports it: the Strategy Tester's "Max drawdown"
 * (amount and percent) and Pine's `strategy.max_drawdown` /
 * `strategy.max_drawdown_percent`.
 *
 * TradingView's definition, matched to the cent on four runs: on every bar,
 * the fall from the highest REALIZED equity so far (initial capital plus
 * closed-trade profit) to that bar's realized equity plus the open position's
 * profit at the bar's adverse extreme (its low when long, its high when short).
 * The percentage is of that realized peak and is maximized on its own, so it
 * can come from a smaller drawdown than the amount does.
 *
 * Neither of the engine's two old figures was that: the performance report
 * walked closed-trade profit and divided by the initial capital (what Zeal
 * Terminal showed), `strategy.max_drawdown` walked bar-close equity, and the
 * CLI walked closed trades from a hard-coded 100,000.
 *
 * Probes (BINANCE:BTCUSDT 1h, history from 2026-01-01, scripts written for
 * the probe; the runs are kept under the parity probes as cli-drawdown/*):
 *
 *   PROBE below, v4, v5 and v6. T1 loses 541.04 at its worst on 10,000 (5.41%);
 *   T2 wins 7,539.28; T3 falls 624.49 from a 17,026.48 peak (3.67%).
 *   TradingView v4 and v5: 624.49 and 5.41 (the amount from T3, the percent from
 *   T1). v6 rejects T2 (1x margin by default) and reports 1,137.29 and 11.37.
 *
 *   An EMA 9/21 stop-and-reverse on default capital (1,000,000, qty 1) and on
 *   10,000 at 100% of equity: 17,657.76 / 1.7386102153846% and
 *   2,443.0639781 / 21.973190088748%. The closed-trade walk gives 17,501.67 and
 *   bar-close equity 20,058.51 on the first. Those runs need the whole year of
 *   candles, so that check reads them from dev-docs and skips without it.
 */
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import * as path from "node:path";
import { runScript, type Candle } from "../../runtime/v1/session";
import { BTCUSDT_1H_DD_WINDOWS } from "./fixtures/btcusdt_1h_dd_windows";

const CHART = {
  symbol: "BINANCE:BTCUSDT", timeframe: "60", mintick: 0.01, mincontract: 0.00001,
  type: "crypto", currency: "USDT", basecurrency: "BTC",
};

const candles: Candle[] = BTCUSDT_1H_DD_WINDOWS.map(([time, open, high, low, close]) =>
  ({ time, open, high, low, close, volume: 1 }));

const PROBE = (version: number, plots = true) => `//@version=${version}
strategy("DD percent vs amount probe", overlay = true, initial_capital = 10000)
if time == timestamp("UTC", 2026, 2, 4, 23, 0)
    strategy.entry("T1", strategy.long, qty = 0.05)
if time == timestamp("UTC", 2026, 2, 5, 23, 0)
    strategy.close("T1")
if time == timestamp("UTC", 2026, 8, 19, 10, 0)
    strategy.entry("T2", strategy.long, qty = 1)
if time == timestamp("UTC", 2026, 8, 20, 10, 0)
    strategy.close("T2")
if time == timestamp("UTC", 2026, 11, 12, 4, 0)
    strategy.entry("T3", strategy.long, qty = 0.12)
if time == timestamp("UTC", 2026, 11, 13, 4, 0)
    strategy.close("T3")
${plots ? 'plot(strategy.max_drawdown, "maxdd")\nplot(strategy.max_drawdown_percent, "maxddpct")\n' : ""}plot(strategy.netprofit, "netprofit")
`;

const last = (r: any, title: string) => {
  const s = r.series.find((x: any) => x.title === title);
  return s.data[s.data.length - 1]?.value;
};

// TradingView's report for each version (strategy_report.json of each run).
const TV: Record<number, { trades: number; net: number; dd: number; ddPct: number }> = {
  4: { trades: 3, net: 6408.37, dd: 624.49, ddPct: 5.41 },
  5: { trades: 3, net: 6408.37, dd: 624.49, ddPct: 5.41 },
  6: { trades: 2, net: -1130.91, dd: 1137.29, ddPct: 11.37 },
};

describe.each([4, 5, 6])("max drawdown matches TradingView's Strategy Tester, v%i", (version) => {
  // v4 compiles strategy.max_drawdown on TradingView but this engine gates it to
  // v5+, so the v4 run checks the report alone.
  const r: any = runScript(PROBE(version, version !== 4), { candles, chart: CHART });
  const tv = TV[version];

  it("runs the same trades", () => {
    expect(r.errors).toEqual([]);
    expect(r.trades.length).toBe(tv.trades);
    expect(r.performance.all.netProfit).toBeCloseTo(tv.net, 2);
  });

  it("reports the drawdown amount from realized peak to intrabar trough", () => {
    expect(r.performance.all.maxDrawdown).toBeCloseTo(tv.dd, 2);
  });

  it("reports the percent of the realized peak, maximized on its own", () => {
    expect(r.performance.all.maxDrawdownPercent).toBeCloseTo(tv.ddPct, 2);
  });
});

describe.each([5, 6])("strategy.max_drawdown and _percent read TradingView's figure, v%i", (version) => {
  const r: any = runScript(PROBE(version), { candles, chart: CHART });
  it("on the last bar", () => {
    expect(last(r, "maxdd")).toBeCloseTo(TV[version].dd, 2);
    expect(last(r, "maxddpct")).toBeCloseTo(TV[version].ddPct, 2);
  });
  if (version === 5) {
    it("before T3, the amount and percent of T1 alone (TradingView plotted 541.042 / 5.41042)", () => {
      const s = r.series.find((x: any) => x.title === "maxdd");
      const i = r.trades[1].exitBarIndex; // after T2 closed, before T3 opened
      expect(s.data[i].value).toBeCloseTo(541.042, 6);
      const p = r.series.find((x: any) => x.title === "maxddpct");
      expect(p.data[i].value).toBeCloseTo(5.41042, 6);
    });
  }
});

describe("EMA cross probes over the full year (needs dev-docs)", () => {
  const dir = path.resolve(__dirname, "../../dev-docs/tv-parity/_probes/cli-drawdown");
  const csv = path.join(dir, "binance-btcusdt-1h-20260101-20261119T17.csv");
  if (!existsSync(csv)) { it.skip("dev-docs probe data is absent", () => {}); return; }
  const full: Candle[] = readFileSync(csv, "utf8").trim().split("\n").slice(1).map((l) => {
    const [time, open, high, low, close, volume] = l.split(",").map(Number);
    return { time, open, high, low, close, volume };
  });
  const cases: Array<[string, number, number]> = [
    ["ema_dd_a.pine", 17657.76, 1.7386102153846],
    ["ema_dd_b.pine", 2443.0639781, 21.973190088748],
  ];
  for (const [file, dd, pct] of cases) {
    it(file, () => {
      const r: any = runScript(readFileSync(path.join(dir, file), "utf8"), { candles: full, chart: CHART });
      expect(r.performance.all.maxDrawdown).toBeCloseTo(dd, 6);
      expect(r.performance.all.maxDrawdownPercent).toBeCloseTo(pct, 9);
    });
  }
});
