/**
 * v4 `strategy.entry(long = ...)` and strategy.close(id) against TradingView.
 *
 * Pine v4 has no Pine Logs, so conformance/v5/parity/harness_strategy_v4_long.pine
 * plots its state per bar instead (phase, lc, position_size, avg_price,
 * opentrades, closedtrades, netprofit). Saved from TradingView's "Export chart
 * data" as harness_strategy_v4_long.BTCUSDT.1D.csv, that CSV carries the bars
 * (time, open, high, low, close, volume) and the plots, so the replay needs no
 * other data. Until it is dropped in the file skips. Without a paid plan the
 * evidence is instead the Strategy Tester's List of Trades, saved next to the
 * harness as harness_strategy_v4_long.trades.png or .txt, to be read by hand.
 *
 * The export names its plot columns by title; a blank cell is `na`.
 */
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Session } from "../../index";

const DIR = join(__dirname, "..", "v5", "parity");
const NAME = "harness_strategy_v4_long";
const CSV = join(DIR, `${NAME}.BTCUSDT.1D.csv`);
const present = existsSync(CSV);

/** Export time is either UNIX seconds or an ISO string. */
function toMs(t: string): number {
  return /^\d+$/.test(t) ? Number(t) * (t.length > 11 ? 1 : 1000) : Date.parse(t);
}

/** A blank cell, "NaN" and a missing value are all `na`; numbers compare to 1e-9 relative. */
function same(a: string | number | null | undefined, b: string | number | null | undefined): boolean {
  const na = (v: unknown) => v == null || v === "" || v === "NaN" || (typeof v === "number" && Number.isNaN(v));
  if (na(a) || na(b)) return na(a) && na(b);
  const x = Number(a), y = Number(b);
  return Math.abs(x - y) <= 1e-9 * Math.max(1, Math.abs(y));
}

(present ? describe : describe.skip)(`${NAME} against TradingView${present ? "" : ` (waiting for ${NAME}.BTCUSDT.1D.csv)`}`, () => {
  const lines = present ? readFileSync(CSV, "utf8").split(/\r?\n/).filter(Boolean) : [];
  const head = present ? lines[0].split(",").map(h => h.trim()) : [];
  const grid = lines.slice(1).map(l => l.split(","));
  const col = (name: string) => head.findIndex(h => h.toLowerCase() === name.toLowerCase());
  const candles = grid.map(r => ({
    time: toMs(r[col("time")]), open: Number(r[col("open")]), high: Number(r[col("high")]),
    low: Number(r[col("low")]), close: Number(r[col("close")]), volume: Number(r[col("volume")]),
  }));

  let result: any = null;
  let compileErrors: unknown[] = [];
  if (present) {
    const session = new Session();
    session.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "D", mintick: 0.01 });
    const compiled = session.compile(readFileSync(join(DIR, `${NAME}.pine`), "utf8"));
    compileErrors = compiled.errors;
    result = compileErrors.length ? null : session.runHistory(candles);
  }

  it("compiles as v4 and runs every bar, dropping no argument", () => {
    expect(compileErrors).toEqual([]);
    expect(result.errors).toEqual([]);
    expect(result.droppedArguments).toEqual([]);
    expect(candles.length).toBeGreaterThanOrEqual(120);
  });

  it.each(["phase", "lc", "position_size", "avg_price", "opentrades", "closedtrades", "netprofit"])(
    "plot %s matches on every bar", (title) => {
      const k = col(title);
      expect(k, `${title} column in the export`).toBeGreaterThanOrEqual(0);
      const series = result.series.find((p: any) => p.title === title);
      const bad: string[] = [];
      grid.forEach((r, i) => {
        if (!same(series.data[i]?.value, r[k])) bad.push(`bar ${i}: tv=${r[k]} ours=${series.data[i]?.value}`);
      });
      expect(bad.slice(0, 10)).toEqual([]);
    });
});
