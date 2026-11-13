/**
 * Order sizing differs by version only where TradingView was probed (CLAUDE.md, version scope):
 *   percent_of_equity leaves room for commission, quantities floor to mincontract:
 *     v4 (dev-docs/tv-parity/_probes/version-scope/v4-sizing, ENGINE-BUGS bug 8), v5 (_probes/v5-sizing),
 *     v6 (_probes/sizing)
 *   commission rounded to 8 decimals: v6 only (_probes/sizing-precision)
 * v2 and v3 keep the older sizing: equity / price, no floor, unrounded commission.
 */
import { describe, it, expect } from "vitest";
import { Session, type Candle } from "../../../runtime/v1/session";

const bars = (close: number): Candle[] =>
  Array.from({ length: 5 }, (_, i) => ({ time: Date.UTC(2025, 0, 1, i), open: close, high: close, low: close, close, volume: 1 }));

function run(version: number, strategyArgs: string, entryArgs: string, chart: { symbol: string; mincontract?: number }) {
  const s = new Session();
  s.setChart({ timeframe: "60", ...chart });
  const counter = version >= 4 ? "bar_index" : "n";
  const c = s.compile(`//@version=${version}\nstrategy("t", ${strategyArgs})\n` +
    `if ${counter} == 0\n    strategy.entry("L", strategy.long${entryArgs})\n` +
    `if ${counter} == 2\n    strategy.close("L")\nplot(strategy.position_size, "ps")\n`);
  expect(c.errors).toEqual([]);
  const r = s.runHistory(bars(100));
  const ps = r.series.find(x => x.title === "ps")!;
  return { qty: (ps.data[1] as { value: number }).value, ctx: (s as any).ctx };
}

const PCT = 'initial_capital = 10000, default_qty_type = strategy.percent_of_equity, default_qty_value = 100, ' +
  'commission_type = strategy.commission.percent, commission_value = 1, margin_long = 0, margin_short = 0';
const CHART = { symbol: "BINANCE:BTCUSDT", mincontract: 0.01 };

describe.each([[2, false], [3, false], [4, true], [5, true], [6, true]])("v%i sizing (probed: %s)", (version, probed) => {
  it("percent_of_equity: room for the 1% commission", () => {
    const { qty } = run(version, PCT, "", { symbol: "BINANCE:BTCUSDT" });
    expect(qty).toBeCloseTo(probed ? 10000 / (100 * 1.01) : 100, 9);
  });

  it("mincontract floor", () => {
    const { qty } = run(version, "initial_capital = 10000, margin_long = 0", ", qty = 1.2345", CHART);
    expect(qty).toBe(probed ? 1.23 : 1.2345);
  });
});

describe.each([[4, false], [5, false], [6, true]])("v%i commission rounding (probed: %s)", (version, probed) => {
  it("8 decimals", () => {
    const { ctx } = run(version,
      "initial_capital = 10000, commission_type = strategy.commission.cash_per_contract, commission_value = 0.123456789, margin_long = 0",
      ", qty = 3", { symbol: "BINANCE:BTCUSDT" });
    // two fills of 3 contracts
    expect(ctx.commissionPaid).toBeCloseTo(probed ? 2 * 0.37037037 : 2 * 0.370370367, 12);
    expect(ctx.commissionPaid === 2 * 0.37037037).toBe(probed);
  });
});
