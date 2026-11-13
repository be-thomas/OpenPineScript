/**
 * An order's size on TradingView (ENGINE-BUGS.md §8): percent_of_equity leaves
 * room for the entry commission, and the quantity is floored to
 * syminfo.mincontract, explicit `qty` included. Probe: dev-docs/tv-parity/_probes/sizing.
 */
import { describe, it, expect } from "vitest";
import { Session, type Candle } from "../../../runtime/v1/session";

const bars = (close: number): Candle[] =>
  Array.from({ length: 4 }, (_, i) => ({ time: Date.UTC(2025, 0, 1, i), open: close, high: close, low: close, close, volume: 1 }));

function positionSize(
  strategyArgs: string, entryArgs: string, close: number,
  chart: { symbol: string; mincontract?: number },
): number {
  const s = new Session();
  s.setChart({ timeframe: "60", ...chart });
  const src = `//@version=6\nstrategy("t", ${strategyArgs})\n` +
    `if bar_index == 0\n    strategy.entry("L", strategy.long${entryArgs})\nplot(strategy.position_size, "ps")\n`;
  const c = s.compile(src);
  expect(c.errors).toEqual([]);
  const r = s.runHistory(bars(close));
  const ps = r.series.find(x => x.title === "ps")!;
  const last = ps.data[ps.data.length - 1] as { value: number };
  return last.value;
}

const BTC = { symbol: "BINANCE:BTCUSDT", mincontract: 0.00001 };
const PROBE = 'initial_capital = 100000, default_qty_type = strategy.percent_of_equity, default_qty_value = 100, ' +
  'commission_type = strategy.commission.percent, commission_value = 0.075, margin_long = 0, margin_short = 0';

describe("percent_of_equity leaves room for the percent commission", () => {
  it("probe: equity 100000 at close 75909.95 buys 1.31636", () => {
    expect(Math.floor(100000 / (75909.95 * 1.00075) * 1e5 + 1e-9) / 1e5).toBe(1.31636);
    expect(positionSize(PROBE, "", 75909.95, BTC)).toBeCloseTo(1.31636, 10);
  });

  it("TradingView log line 11-07 01:00: equity 43409.8310491702 buys 0.57143", () => {
    const args = PROBE.replace("100000", "43409.8310491702");
    expect(positionSize(args, "", 75909.95, BTC)).toBeCloseTo(0.57143, 10);
  });

  it("without commission it is equity / price, floored when mincontract is supplied", () => {
    const args = 'initial_capital = 100000, default_qty_type = strategy.percent_of_equity, default_qty_value = 100, margin_long = 0';
    expect(positionSize(args, "", 75909.95, BTC)).toBeCloseTo(1.31735, 10);
    expect(positionSize(args, "", 75909.95, { symbol: "BINANCE:BTCUSDT" })).toBeCloseTo(100000 / 75909.95, 12);
  });
});

describe("explicit qty is floored to mincontract", () => {
  const XAU = { symbol: "BINANCE:XAUTUSDT", mincontract: 0.001 };
  const args = "initial_capital = 100000, margin_long = 0";
  it("0.02253 -> 0.022", () => expect(positionSize(args, ", qty = 0.02253", 4000, XAU)).toBeCloseTo(0.022, 12));
  it("0.18779 -> 0.187", () => expect(positionSize(args, ", qty = 0.18779", 4000, XAU)).toBeCloseTo(0.187, 12));
  it("0.04507 -> 0.045 and 0.03893 -> 0.038", () => {
    expect(positionSize(args, ", qty = 0.04507", 4000, XAU)).toBeCloseTo(0.045, 12);
    expect(positionSize(args, ", qty = 0.03893", 4000, XAU)).toBeCloseTo(0.038, 12);
  });
  it("float noise does not drop a step", () => expect(positionSize(args, ", qty = 0.0300000000001", 4000, XAU)).toBeCloseTo(0.03, 12));
  it("with no mincontract supplied the quantity is unchanged", () => {
    expect(positionSize(args, ", qty = 0.02253", 4000, { symbol: "BINANCE:XAUTUSDT" })).toBe(0.02253);
  });
});
