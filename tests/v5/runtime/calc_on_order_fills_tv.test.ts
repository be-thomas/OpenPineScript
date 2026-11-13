/**
 * `strategy(..., calc_on_order_fills = true)`: the script runs again after each
 * order fill.
 *
 * Ground truth is TradingView's own: the probe dev-docs/tv-parity/_probes/
 * calc-on-fills (BINANCE:BTCUSDT 1h, v5) and the 12/26-IT strategy
 * (ENGINE-BUGS.md section 1). On the bar a market order fills at its open, the
 * probe's log shows THREE executions: after the entry fill (position 1), after
 * the exit limit that run placed filled (position 0), and the bar's ordinary run
 * (position 0). `var` is rolled back to the bar's start before each re-run
 * (the same value in all three), `varip` is not (it counts every execution).
 * A market order placed in a re-run fills at once at the price of the fill that
 * triggered it; a limit placed there fills later on the same bar at its price.
 */
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Session } from "../../../runtime/v1/session";

const probe = resolve(__dirname, "../../../dev-docs/tv-parity/_probes/calc-on-fills");

describe("calc_on_order_fills, TradingView's probe", () => {
  // dev-docs/ is local only (never in git): without the probe this suite is skipped.
  if (!existsSync(probe)) { it.skip("needs the local dev-docs probe", () => {}); return; }
  // The last row of the CSV is the live bar (result.json: last_bar_is_realtime).
  // It stays: the script counts back from `last_bar_index`, and TradingView's
  // included it, so dropping it would move the bar the probe trades on.
  const rows = readFileSync(`${probe}/ohlcv.csv`, "utf8").trim().split("\n").slice(1).map(l => l.split(","));
  const candles = rows.map(r => ({
    time: Number(r[0]) * 1000, open: Number(r[2]), high: Number(r[3]), low: Number(r[4]), close: Number(r[5]), volume: Number(r[6]),
  }));
  const s = new Session();
  const c = s.compile(readFileSync(`${probe}/editor.txt`, "utf8"));
  const r = s.runHistory(candles);
  const lastN = candles.length - 1 - 30;
  const lines = r.logs.map((l: any) => String(l.message ?? l.text));
  const field = (line: string, k: string) => Number(new RegExp(`${k}=(-?[\\d.]+)`).exec(line)![1]);
  // The script logs its own bar_index, which is the replay's: lastN here.
  const onBar = (n: number) => lines.filter(l => field(l, "bi") === n);

  it("compiles and runs", () => {
    expect(c.errors).toEqual([]);
    expect(r.errors).toEqual([]);
  });

  it("books one trade: in at the open, out at the limit placed in the re-run, on the same bar", () => {
    expect(r.trades).toHaveLength(1);
    const t = r.trades[0];
    expect(t.entryPrice).toBe(candles[lastN + 1].open);
    expect(t.entryPrice).toBe(72880.63);
    expect(t.exitPrice).toBe(73085.66);
    expect(t.entryBarIndex).toBe(lastN + 1);
    expect(t.exitBarIndex).toBe(lastN + 1);
  });

  it("runs the script three times on the filling bar, once on its neighbours", () => {
    expect(onBar(lastN)).toHaveLength(1);
    const three = onBar(lastN + 1);
    expect(three).toHaveLength(3);
    expect(onBar(lastN + 2)).toHaveLength(1);
    expect(three.map(l => field(l, "ps"))).toEqual([1, 0, 0]);
  });

  it("rolls var back before each re-run and leaves varip alone", () => {
    const three = onBar(lastN + 1);
    const vr = three.map(l => field(l, "vr"));
    expect(vr[1]).toBe(vr[0]);
    expect(vr[2]).toBe(vr[0]);
    const vp = three.map(l => field(l, "vp"));
    expect(vp[1]).toBe(vp[0] + 1);
    expect(vp[2]).toBe(vp[0] + 2);
    // `var` counted this bar once, so the next bar is one up.
    expect(field(onBar(lastN + 2)[0], "vr")).toBe(vr[0] + 1);
  });
});

const bars = Array.from({ length: 12 }, (_, i) => ({
  time: Date.UTC(2024, 0, 1) + i * 3_600_000,
  open: 100 + i, high: 110 + i, low: 95 + i, close: 104 + i, volume: 1000,
}));

function run(cof: boolean) {
  const s = new Session();
  const c = s.compile(
    `//@version=5\nstrategy("S", overlay = true, calc_on_order_fills = ${cof})\n` +
    `if bar_index == 3\n    strategy.entry("L", strategy.long)\n` +
    `if strategy.position_size > 0\n    strategy.close_all()\n`);
  expect(c.errors).toEqual([]);
  return s.runHistory(bars);
}

describe("a market order placed in a re-run", () => {
  it("fills at once at the price of the fill that triggered the re-run, for no profit", () => {
    const r = run(true);
    expect(r.errors).toEqual([]);
    expect(r.trades).toHaveLength(1);
    // Entered at bar 4's open, 104, and closed there.
    expect(r.trades[0]).toMatchObject({ entryPrice: 104, exitPrice: 104, entryBarIndex: 4, exitBarIndex: 4, pnl: 0 });
  });

  it("waits for the next bar's open without calc_on_order_fills", () => {
    const r = run(false);
    expect(r.trades).toHaveLength(1);
    expect(r.trades[0]).toMatchObject({ entryPrice: 104, exitPrice: 105, entryBarIndex: 4, exitBarIndex: 5, pnl: 1 });
  });
});
