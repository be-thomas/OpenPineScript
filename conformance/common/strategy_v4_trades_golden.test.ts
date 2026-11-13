/**
 * harness_strategy_v4_long against TradingView's List of Trades (BTCUSDT 1D).
 *
 * v4 cannot log, so the evidence is a screenshot of the Strategy Tester: nine
 * trades, every one of size 1, transcribed below with the dates as UTC days.
 * The bars are TradingView's own, taken from the pyr3 log's per-bar rows (the
 * first 300 daily bars); the harness only reads bar_index, so any of the OPS
 * logs of that chart would do.
 *
 * Notable: trade 9 is the long left by `strategy.order("P", true, qty = 2)`
 * against the short "O" of 1: an order takes its size off the position, so
 * the long is 1, not 2.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Session } from "../../index";

const DIR = join(__dirname, "..", "v5", "parity");

const bars = readFileSync(join(DIR, "harness_strategy_pyr3.BTCUSDT.1D.csv"), "utf8")
  .split("\n").filter(l => l.includes("OPS|")).flatMap(l => {
    const m = l.slice(l.indexOf(",") + 1).replace(/^"|"$/g, "");
    return m.slice(4).split("|").map(r => r.split(",").map(Number));
  }).filter(c => Number.isFinite(c[0])).sort((a, b) => a[0] - b[0])
  .map(c => ({ time: c[0], open: c[1], high: c[2], low: c[3], close: c[4], volume: c[5] }));

const day = (t: number) => new Date(t).toISOString().slice(0, 10);

const TV: Array<[string, string, number, string, number, number]> = [
  ["long", "2017-08-19", 4108.37, "2017-08-23", 4040.00, -68.37],
  ["short", "2017-08-23", 4040.00, "2017-08-30", 4564.52, -524.52],
  ["short", "2017-09-08", 4691.66, "2017-09-19", 4060.00, 631.66],
  ["short", "2017-09-28", 4192.11, "2017-10-09", 4640.00, -447.89],
  ["long", "2017-10-18", 5595.00, "2017-10-29", 5709.98, 114.98],
  ["long", "2017-11-07", 6981.72, "2017-11-10", 7079.00, 97.28],
  ["short", "2017-11-10", 7079.00, "2017-11-18", 7680.01, -601.01],
  ["short", "2017-11-27", 9128.00, "2017-11-30", 9687.88, -559.88],
  ["long", "2017-11-30", 9687.88, "2017-12-08", 16552.90, 6865.02],
];

describe("harness_strategy_v4_long against TradingView's List of Trades", () => {
  it("reproduces the nine trades: side, dates, prices, size 1 and profit", () => {
    const s = new Session();
    s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "D", mintick: 0.01, type: "crypto", currency: "USDT", timezone: "Etc/UTC" });
    const src = readFileSync(join(DIR, "harness_strategy_v4_long.pine"), "utf8");
    expect(s.compile(src).errors).toEqual([]);
    expect(bars.length).toBeGreaterThanOrEqual(300);
    const r: any = s.runHistory(bars.slice(0, 300));
    expect(r.errors).toEqual([]);
    // To the cent, the precision of the List of Trades (a price comes back off
    // the tick grid as 5709.9800000000005).
    const cents = (x: number) => Math.round(x * 100) / 100;
    const ours = r.trades.map((t: any) =>
      [t.direction, day(t.entryTime), cents(t.entryPrice), day(t.exitTime), cents(t.exitPrice), cents(t.pnl)]);
    expect(ours).toEqual(TV);
    expect(r.trades.every((t: any) => t.qty === 1)).toBe(true);
  });
});
