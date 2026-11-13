/**
 * Strategy order semantics against TradingView's own Pine Logs.
 *
 * Each harness in conformance/v5/parity/ drives a strategy from `bar_index`
 * alone and logs, per bar, the position and, at the end, every closed and open
 * trade (`OPS|` rows, `OPSCOUNT|`, `OPSCLOSED|`, `OPSOPEN|`). Run on TradingView
 * and saved under the filename below, the log carries the bars as well, so the
 * replay needs no other data: it runs the same harness here, on the logged
 * bars, and compares every logged value and every trade field.
 *
 * Until the CSV is dropped in next to the harness the whole file skips. No
 * engine behaviour counts as correct until a TradingView log confirms it, so
 * these are deliberately not pre-filled from the engine.
 *
 *   harness_strategy_pyr0           default pyramiding: repeated entry, reversal,
 *                                   order stacking, close(id), qty / qty_percent,
 *                                   immediately
 *   harness_strategy_pyr3           pyramiding = 3: the limit, ids together, one
 *                                   close("A") of three entries, reversal
 *   harness_strategy_pooc           the pyr0 phases with process_orders_on_close
 *   harness_strategy_exit_mix       v5 strategy.exit mixed with close(id) and close_all
 *                                   (from_entry, qty, which entries it sells, avg_price
 *                                   after), and a pending entry blocked by pyramiding
 *                                   inside an OCA cancel group
 *   harness_strategy_reentry        re-armed exits, per-trade targets, and a bar that
 *                                   reaches two exits (1D and 5m logs of one script)
 *   harness_release_notes_04        the docs example: 515 -> 849 trades
 */
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Session } from "../../index";

const DIR = join(__dirname, "..", "v5", "parity");
const DIR6 = join(__dirname, "..", "v6", "golden");

const HARNESSES: Array<{ name: string; csv: string; dir?: string; skip?: string; properties?: Record<string, unknown>; pine?: string }> = [
  { name: "harness_strategy_pyr0", csv: "harness_strategy_pyr0.BTCUSDT.1D.csv" },
  { name: "harness_strategy_pyr3", csv: "harness_strategy_pyr3.BTCUSDT.1D.csv" },
  { name: "harness_strategy_pooc", csv: "harness_strategy_pooc.BTCUSDT.1D.csv" },
  { name: "harness_strategy_exit_mix", csv: "harness_strategy_exit_mix.BTCUSDT.1D.csv" },
  // The same script run twice by mistake and then on purpose: on a 5-minute chart
  // (the +/-2% exits of phase c never trigger there) and on the daily one.
  { name: "harness_strategy_reentry", csv: "harness_strategy_reentry.BTCUSDT.1D.csv" },
  { name: "harness_strategy_exit_order", csv: "harness_strategy_exit_order.BTCUSDT.1D.csv" },
  { name: "harness_strategy_reentry_5m", csv: "harness_strategy_reentry.BTCUSDT.5.csv", pine: "harness_strategy_reentry" },
  // Run on BATS:AAPL 5m rather than the intended BTCUSDT 1D; phase d still settles
  // the exit-before-entry rule (D1 never exits though its target trades on 4 bars).
  { name: "harness_strategy_exit_order_aapl5m", csv: "harness_strategy_exit_order.AAPL.5.csv", pine: "harness_strategy_exit_order" },
  { name: "harness_release_notes_04", csv: "harness_release_notes_04.BTCUSDT.1D.csv" },
  // v6: the first three are row for row those of v5 in TradingView's logs.
  { name: "harness_strategy_pyr0_v6", csv: "harness_strategy_pyr0_v6.BTCUSDT.1D.csv", dir: DIR6 },
  { name: "harness_strategy_pyr3_v6", csv: "harness_strategy_pyr3_v6.BTCUSDT.1D.csv", dir: DIR6 },
  { name: "harness_strategy_pooc_v6", csv: "harness_strategy_pooc_v6.BTCUSDT.1D.csv", dir: DIR6 },
  // TradingView's v6 log for this script has position_size 0, closedtrades 0 and
  // netprofit 0 on all 3,368 rows. The owner's Properties dialog had initial
  // capital at 100,000, not the default 1,000,000, and v6's default margin is
  // 100%: 100 x 4285.08 = 428,508 is more than 100,000 of funds, so the entry
  // is never opened (migration guide to v6, "Default margin percentage": "The
  // strategy does not open entries that require more money than is available").
  // The replay passes the capital the way the Properties dialog does.
  { name: "harness_release_notes_04_v6", csv: "harness_release_notes_04_v6.BTCUSDT.1D.csv", dir: DIR6,
    properties: { initial_capital: 100000 } },
];

/** Pine Logs export: `Date,Message`, the message double-quoted with `""` escapes when it needs them. */
function messages(csv: string): string[] {
  return csv.split("\n").slice(1).filter(Boolean).map(line => {
    const m = line.slice(line.indexOf(",") + 1);
    return m.startsWith('"') ? m.slice(1, -1).replace(/""/g, '"') : m;
  });
}

/** Equal as strings, or as numbers to 1e-9 relative; "NaN" equals "NaN". */
function same(a: string | undefined, b: string | undefined): boolean {
  if (a === b) return true;
  const x = Number(a), y = Number(b);
  if (a === "NaN" && b === "NaN") return true;
  return a !== "" && b !== "" && Number.isFinite(x) && Number.isFinite(y) && Math.abs(x - y) <= 1e-9 * Math.max(1, Math.abs(y));
}

/** The `;`-separated entries of every message with this prefix, in order, minus each message's leading index. */
function entries(msgs: string[], prefix: string): string[] {
  return msgs.filter(m => m.startsWith(prefix)).flatMap(m => m.split(";").slice(1));
}

/** Entries are `:`-separated fields; compare field by field. */
function sameEntry(a: string, b: string): boolean {
  const x = a.split(":"), y = b.split(":");
  return x.length === y.length && x.every((f, i) => same(f, y[i]));
}

function rowsOf(msgs: string[]): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const m of msgs) {
    if (m.startsWith("OPS|")) for (const r of m.slice(4).split("|")) { const c = r.split(","); out.set(c[0], c); }
  }
  const last = msgs.find(m => m.startsWith("OPSLAST|"))?.slice(8).split(",");
  if (last) out.set(last[0], last);
  return out;
}

for (const { name, csv, dir = DIR, skip, properties, pine = name } of HARNESSES) {
  const present = existsSync(join(dir, csv));
  const suite = present && !skip ? describe : describe.skip;

  suite(`${name} against TradingView${present ? "" : ` (waiting for ${csv})`}`, () => {
    const tv = present ? messages(readFileSync(join(dir, csv), "utf8")) : [];
    const meta: Record<string, string> = present
      ? Object.fromEntries(tv.find(m => m.startsWith("OPSMETA|"))!.slice(8).split(",").map(kv => kv.split("=") as [string, string]))
      : {};
    const head = present ? tv.find(m => m.startsWith("OPSHEAD|"))!.slice(8).split(",") : [];
    const rows = [...rowsOf(tv).values()].sort((a, b) => Number(a[0]) - Number(b[0]));
    const candles = rows.map(c => ({
      time: Number(c[0]), open: Number(c[1]), high: Number(c[2]),
      low: Number(c[3]), close: Number(c[4]), volume: Number(c[5]),
    }));

    let ours: string[] = [];
    let result: any = null;
    let compileErrors: unknown[] = [];
    if (present) {
      const session = new Session();
      session.setChart({
        symbol: meta.tickerid, timeframe: meta.timeframe, mintick: Number(meta.mintick),
        timezone: meta.timezone, type: meta.type,
      });
      if (properties) session.setProperties(properties);
      const compiled = session.compile(readFileSync(join(dir, `${pine}.pine`), "utf8"));
      compileErrors = compiled.errors;
      result = compileErrors.length ? null : session.runHistory(candles);
      ours = (result?.logs ?? []).map((l: any) => l.message ?? String(l));
    }
    const ourRows = rowsOf(ours);

    it("compiles and runs every bar, dropping no argument", () => {
      expect(compileErrors).toEqual([]);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
      expect(result.droppedArguments).toEqual([]);
      expect(rows.length).toBeGreaterThan(100);
    });

    it("every logged column matches on every bar", () => {
      const bad: string[] = [];
      for (const t of rows) {
        const o = ourRows.get(t[0]);
        if (!o) { bad.push(`bar ${t[6]}: no row`); continue; }
        head.forEach((col, k) => {
          if (!same(o[k], t[k])) bad.push(`bar ${t[6]} ${col}: tv=${t[k]} ours=${o[k]}`);
        });
      }
      expect(bad.slice(0, 10)).toEqual([]);
    });

    // Some logs were cut before the end-of-run dump; every bar's row is still compared above.
    const hasSummary = present && tv.some(m => m.startsWith("OPSCOUNT|"));
    const whenSummary = hasSummary ? it : it.skip;

    if (name === "harness_release_notes_04_v6") {
      it("opens nothing, on every row: position 0, no closed trades, net profit 0", () => {
        expect(rows.length).toBe(3368);
        for (const r of rows) {
          expect([r[head.indexOf("position_size")], r[head.indexOf("closedtrades")], r[head.indexOf("netprofit")]]).toEqual(["0", "0", "0"]);
          const o = ourRows.get(r[0])!;
          expect([o[head.indexOf("position_size")], o[head.indexOf("closedtrades")], o[head.indexOf("netprofit")]]).toEqual(["0", "0", "0"]);
        }
      });
    }

    if (name === "harness_release_notes_04") {
      it("ends as TradingView does: 60 of 100 held at 4285.08, 1 open, 2 closed, net profit 30", () => {
        const row = ourRows.get(String(candles[candles.length - 1].time))!;
        const col = (n: string) => Number(row[head.indexOf(n)]);
        expect(col("bar_index")).toBe(3367);
        expect([col("position_size"), col("avg_price"), col("opentrades"), col("closedtrades"), col("netprofit")])
          .toEqual([60, 4285.08, 1, 2, 30]);
      });
    }

    whenSummary("the summary counts match", () => {
      expect(ours.find(m => m.startsWith("OPSCOUNT|"))).toBe(tv.find(m => m.startsWith("OPSCOUNT|")));
    });

    const tradeCases = hasSummary ? it.each(["OPSCLOSED|", "OPSOPEN|"]) : it.skip.each(["OPSCLOSED|", "OPSOPEN|"]);
    tradeCases("%s trades match field for field, in order", (prefix) => {
      const a = entries(ours, prefix), b = entries(tv, prefix);
      expect(a.length).toBe(b.length);
      const bad = b.map((e, i) => sameEntry(a[i], e) ? null : `#${i}: tv=${e} ours=${a[i]}`).filter(Boolean);
      expect(bad.slice(0, 10)).toEqual([]);
    });
  });
}
