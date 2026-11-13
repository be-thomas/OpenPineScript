/**
 * request.security on the chart's own timeframe, calc_bars_count, and
 * request.security_lower_tf, against TradingView's own Pine Logs.
 *
 * conformance/v5/parity/harness_security_tf.pine, run on BINANCE:BTCUSDT 5m and
 * saved as harness_security_tf.BTCUSDT.5.csv, logs the last 1000 chart bars
 * with the values under test AND the data they were computed from: the hourly
 * bar each chart bar sits in (ht..hv, lookahead on) and the 1-minute times and
 * closes inside it (lt, lc). The replay rebuilds the hourly and 1-minute series
 * from those columns, supplies them through `Session.provideData`, and compares
 * every column. The file skips until the CSV exists.
 *
 * The first 19 logged bars have no 20-bar history here (the log starts 1000
 * bars from the end), so the sma columns are not compared on them.
 */
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Session } from "../../index";

const DIR = join(__dirname, "..", "v5", "parity");
const NAME = "harness_security_tf";
const CSV = join(DIR, `${NAME}.BTCUSDT.5.csv`);
const present = existsSync(CSV);

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
  return a !== "" && b !== "" && Number.isFinite(x) && Number.isFinite(y) && Math.abs(x - y) <= 1e-9 * Math.max(1, Math.abs(y));
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

(present ? describe : describe.skip)(`${NAME} against TradingView${present ? "" : ` (waiting for ${NAME}.BTCUSDT.5.csv)`}`, () => {
  const tv = present ? messages(readFileSync(CSV, "utf8")) : [];
  const meta: Record<string, string> = present
    ? Object.fromEntries(tv.find(m => m.startsWith("OPSMETA|"))!.slice(8).split(",").map(kv => kv.split("=") as [string, string]))
    : {};
  const head = present ? tv.find(m => m.startsWith("OPSHEAD|"))!.slice(8).split(",") : [];
  const rows = [...rowsOf(tv).values()].sort((a, b) => Number(a[0]) - Number(b[0]));
  const at = (name: string) => head.indexOf(name);

  const candles = rows.map(c => ({
    time: Number(c[0]), open: Number(c[1]), high: Number(c[2]),
    low: Number(c[3]), close: Number(c[4]), volume: Number(c[5]),
  }));
  // Hourly bars, whole, one per distinct hour.
  const hourly = new Map<number, any>();
  for (const r of rows) {
    const t = Number(r[at("ht")]);
    if (Number.isFinite(t)) hourly.set(t, {
      time: t, open: Number(r[at("ho")]), high: Number(r[at("hh")]), low: Number(r[at("hl")]),
      close: Number(r[at("hc")]), volume: Number(r[at("hv")]),
    });
  }
  // 1-minute bars: only the close is logged, and only the close is read.
  const minutes = new Map<number, any>();
  for (const r of rows) {
    // "5:t/t/t/t/t": the count, then the elements (all of them for a 5-minute bar; see f_join).
    const list = (v: string) => v ? v.replace(/^\d+:/, "").split("/") : [];
    const ts = list(r[at("lt")]), cs = list(r[at("lc")]);
    ts.forEach((t, i) => {
      const c = Number(cs[i]);
      minutes.set(Number(t), { time: Number(t), open: c, high: c, low: c, close: c, volume: 0 });
    });
  }
  const byTime = (m: Map<number, any>) => [...m.values()].sort((a, b) => a.time - b.time);

  let ours: string[] = [];
  let result: any = null;
  let compileErrors: unknown[] = [];
  if (present) {
    const session = new Session();
    session.setChart({
      symbol: meta.tickerid, timeframe: meta.timeframe, mintick: Number(meta.mintick),
      timezone: meta.timezone, type: meta.type,
    });
    session.provideData(meta.tickerid, "60", byTime(hourly));
    session.provideData(meta.tickerid, "1", byTime(minutes));
    const compiled = session.compile(readFileSync(join(DIR, `${NAME}.pine`), "utf8"));
    compileErrors = compiled.errors;
    result = compileErrors.length ? null : session.runHistory(candles);
    ours = (result?.logs ?? []).map((l: any) => l.message ?? String(l));
  }
  const ourRows = rowsOf(ours);

  it("compiles and runs every bar, dropping no argument", () => {
    expect(compileErrors).toEqual([]);
    expect(result.errors).toEqual([]);
    expect(result.droppedArguments).toEqual([]);
    expect(rows.length).toBeGreaterThan(500);
  });

  const H50_WARMUP_BARS = 2;
  const COLUMNS = present ? head.slice(head.indexOf("bar_index") + 1) : [];
  it.each(COLUMNS)("column %s matches on every bar", (name) => {
    const k = at(name);
    const bad: string[] = [];
    rows.forEach((t, i) => {
      if (name.startsWith("sma_") && i < 19) return;
      // The log starts 1000 bars from the end, mid-hour. TradingView's h50 at its
      // first two bars (the first 5-minute bars of the log) reads the hourly bar
      // BEFORE the log's first hour, which the replay is never given: it rebuilds
      // the hourly series from the logged rows only. Only this column, only these
      // two bars.
      if (name === "h50" && i < H50_WARMUP_BARS) return;
      const o = ourRows.get(t[0]);
      if (!o) { bad.push(`bar ${t[6]}: no row`); return; }
      if (!same(o[k], t[k])) bad.push(`bar ${t[6]}: tv=${t[k]} ours=${o[k]}`);
    });
    expect(bad.slice(0, 10)).toEqual([]);
  });

  it("the na / empty counts match", () => {
    const sum = (m: string | undefined) => Object.fromEntries(m!.slice(7).split(",").map(kv => kv.split("=") as [string, string]));
    const t = sum(tv.find(m => m.startsWith("OPSSUM|"))), o = sum(ours.find(m => m.startsWith("OPSSUM|")));
    // OPSSUM counts CONFIRMED bars: TradingView's final logged bar was the live
    // one and is in no count, where a replay confirms every bar it is given.
    // h50_na and h50_first_time follow from the two warm-up bars above, whose
    // value the replay cannot know: the h50 column test covers every other bar.
    const ignore = new Set(["h50_na", "h50_first_time"]);
    for (const k of Object.keys(t)) {
      if (ignore.has(k)) continue;
      const live = k === "bars" || k === "l60_na_bars" ? 1 : 0;
      expect(Number(o[k]) - live, k).toBe(Number(t[k]));
    }
  });
});
