/**
 * v5 against TradingView, for the gaps found while building v6.
 *
 * conformance/v5/golden/harness_v5_gaps.pine was run on TradingView (BINANCE:
 * BTCUSDT, 1-minute) and its Pine Logs saved beside it. This replays the same
 * candles through this engine and compares every column of every row.
 *
 * Each column was checked against the WHOLE 7,987-row export before the
 * fixture was trimmed, so the rules below are not fitted to a sample:
 *
 *   t_* / tc_*      time("D"|"W"|"M"|"240") is the start of that timeframe's
 *                   bar — UTC midnight, Monday, the 1st, 4-hour blocks — and
 *                   time_close the end of it
 *   set_xloc_*      line.set_xloc(id, x1, x2, xloc) moves both coordinates
 *   sort_*          array.sort_indices: stable ascending with na last; the
 *                   descending order is exactly its reverse
 *   bs*             binary_search on duplicates is the plain midpoint search;
 *                   leftmost/rightmost bracket a missing value, leftmost
 *                   clamped at 0
 *   rgb[...]        the exact value of all 17 color.* constants
 *   div_const       const int / const int truncates; input and series do not
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { compileScript } from "../../transpiler/common";
import { compile, Context } from "../../runtime/v5";

const DIR = join(__dirname, "..", "v5", "golden");
const SOURCE = readFileSync(join(DIR, "harness_v5_gaps.pine"), "utf8");
const LOG = readFileSync(join(DIR, "harness_v5_gaps.BTCUSDT.1.log"), "utf8");

/** The OPS rows TradingView logged, as column → value maps, oldest first. */
function tradingViewRows(): { head: string[]; rows: string[][] } {
  let head: string[] = [];
  const rows: string[][] = [];
  for (const line of LOG.split("\n")) {
    const at = line.indexOf('"OPS');
    if (at < 0) continue;
    const msg = line.slice(at + 1, line.lastIndexOf('"'));
    if (msg.startsWith("OPSHEAD|")) head = msg.slice(8).split(",");
    else if (msg.startsWith("OPS|")) rows.push(msg.slice(4).split(","));
  }
  return { head, rows };
}

/** Runs the harness over TradingView's own candles and returns its OPS rows. */
function engineRows(tv: string[][]): string[][] {
  const { js, profile } = compileScript(SOURCE);
  const ctx = new Context(profile);
  ctx.resolution = "1";
  const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
  tv.forEach((r, i) => {
    ctx.currentBarIndex = i;
    ctx.setBar(Number(r[0]), Number(r[1]), Number(r[2]), Number(r[3]), Number(r[4]), Number(r[5]));
    exec();
    ctx.finalizeBar();
  });
  return (ctx as any).logs
    .map((l: any) => String(l.message))
    .filter((m: string) => m.startsWith("OPS|"))
    .map((m: string) => m.slice(4).split(","));
}

const tv = tradingViewRows();
const ours = engineRows(tv.rows);

describe("the v5 gaps probe, replayed against TradingView's log", () => {
  it("logs one row per bar, as TradingView did", () => {
    expect(tv.rows.length).toBe(2500);
    expect(ours.length).toBe(tv.rows.length);
  });

  for (let c = 6; c < tv.head.length; c++) {
    const column = tv.head[c];
    it(column, () => {
      const wrong: string[] = [];
      tv.rows.forEach((row, i) => {
        if (ours[i]?.[c] !== row[c] && wrong.length < 5) {
          wrong.push(`bar ${i}: TradingView ${row[c]}, engine ${ours[i]?.[c]}`);
        }
      });
      expect(wrong, wrong.join("\n")).toEqual([]);
    });
  }
});
