/**
 * request.security across a regular session, against TradingView's own Pine Logs.
 *
 * conformance/v5/parity/harness_security_session.pine, run on BATS:AAPL 5m
 * (America/New_York, regular session; the log says BATS:AAPL where the script's
 * header says NASDAQ:AAPL) and saved as harness_security_session.AAPL.5.csv.
 * TradingView steps BOTH `request.security("60", close)` and `("D", close)` on
 * the session's LAST bar (15:55, last_bar = 1), not at the next session's open,
 * and mid-session hours on the bar that ends them (11:25, then 10:25 the next
 * day); Friday's daily close does not wait for Monday.
 *
 * The daily close (343.99) differs from the last 5-minute close (344.12), so the
 * replay feeds the hourly and daily series from the logged lookahead_on columns
 * (t60, tc60, o60..v60 and td, od..vd), not from the 5-minute bars. An hourly
 * bar's `closeTime` is the logged `tc60`. The log has no daily close time: a
 * daily bar's is the latest `tc60` of the logged hourly bars of its day, which is
 * the session's end.
 *
 * Warm-up: the first logged rows read an hourly bar and a daily bar BEFORE the
 * ones in the log (the log starts mid-day), whose values the replay is never
 * given. The comparison of each column starts at the chart bar that ends the
 * first bar the log does contain.
 */
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Session } from "../../index";

const DIR = join(__dirname, "..", "v5", "parity");
const NAME = "harness_security_session";
const CSV = join(DIR, `${NAME}.AAPL.5.csv`);
const present = existsSync(CSV);
const FIVE = 300_000;

function messages(csv: string): string[] {
  return csv.split("\n").slice(1).filter(Boolean).map(line => {
    const m = line.slice(line.indexOf(",") + 1);
    return m.startsWith('"') ? m.slice(1, -1).replace(/""/g, '"') : m;
  });
}

(present ? describe : describe.skip)(`${NAME} against TradingView${present ? "" : ` (waiting for ${NAME}.AAPL.5.csv)`}`, () => {
  const tv = present ? messages(readFileSync(CSV, "utf8")) : [];
  const meta: Record<string, string> = present
    ? Object.fromEntries(tv.find(m => m.startsWith("OPSMETA|"))!.slice(8).split(",").map(kv => kv.split("=") as [string, string]))
    : {};
  const head = present ? tv.find(m => m.startsWith("OPSHEAD|"))!.slice(8).split(",") : [];
  const at = (n: string) => head.indexOf(n);
  const rows = new Map<string, string[]>();
  for (const m of tv) if (m.startsWith("OPS|")) for (const r of m.slice(4).split("|")) { const c = r.split(","); rows.set(c[0], c); }
  const last = tv.find(m => m.startsWith("OPSLAST|"))?.slice(8).split(",");
  if (last) rows.set(last[0], last);
  const sorted = [...rows.values()].sort((a, b) => Number(a[0]) - Number(b[0]));

  const candles = sorted.map(c => ({
    time: Number(c[0]), open: Number(c[at("open")]), high: Number(c[at("high")]), low: Number(c[at("low")]),
    close: Number(c[at("close")]), volume: Number(c[at("volume")]),
  }));
  const hourly = new Map<number, any>();
  for (const r of sorted) {
    const t = Number(r[at("t60")]);
    hourly.set(t, { time: t, open: Number(r[at("o60")]), high: Number(r[at("hi60")]), low: Number(r[at("l60")]),
      close: Number(r[at("c60")]), volume: Number(r[at("v60")]), closeTime: Number(r[at("tc60")]) });
  }
  const daily = new Map<number, any>();
  for (const r of sorted) {
    const t = Number(r[at("td")]);
    const closeTime = Math.max(daily.get(t)?.closeTime ?? 0, Number(r[at("tc60")]));
    daily.set(t, { time: t, open: Number(r[at("od")]), high: Number(r[at("hid")]), low: Number(r[at("ld")]),
      close: Number(r[at("cd")]), volume: Number(r[at("vd")]), closeTime });
  }
  const byTime = (m: Map<number, any>) => [...m.values()].sort((a, b) => a.time - b.time);

  let ours = new Map<string, string[]>();
  let result: any = null;
  if (present) {
    const s = new Session();
    s.setChart({ symbol: meta.tickerid, timeframe: meta.timeframe, mintick: Number(meta.mintick), timezone: meta.timezone, type: meta.type });
    s.provideData(meta.tickerid, "60", byTime(hourly));
    s.provideData(meta.tickerid, "D", byTime(daily));
    expect(s.compile(readFileSync(join(DIR, `${NAME}.pine`), "utf8")).errors).toEqual([]);
    result = s.runHistory(candles);
    const msgs = (result.logs ?? []).map((l: any) => l.message);
    ours = new Map();
    for (const m of msgs) if (m.startsWith("OPS|")) for (const r of m.slice(4).split("|")) { const c = r.split(","); ours.set(c[0], c); }
    const l = msgs.find((m: string) => m.startsWith("OPSLAST|"))?.slice(8).split(",");
    if (l) ours.set(l[0], l);
  }

  it("compiles and runs every bar", () => {
    expect(result.errors).toEqual([]);
    expect(result.droppedArguments).toEqual([]);
    expect(sorted.length).toBeGreaterThan(500);
  });

  const warmup = (col: string) => {
    const closes = col === "h60" ? byTime(hourly).map(b => b.closeTime) : byTime(daily).map(b => b.closeTime);
    return closes[0];   // the first bar the log holds ends here
  };
  it.each(["h60", "d1"])("%s steps on the same bar as TradingView on every row after warm-up", (col) => {
    const k = at(col);
    const from = warmup(col);
    const bad: string[] = [];
    let compared = 0;
    for (const t of sorted) {
      if (Number(t[0]) + FIVE < from) continue;
      compared++;
      const o = ours.get(t[0]);
      if (!o || Math.abs(Number(o[k]) - Number(t[k])) > 1e-9 * Math.max(1, Math.abs(Number(t[k])))) {
        bad.push(`bar ${t[at("bar_index")]} ${new Date(Number(t[0])).toISOString()}: tv=${t[k]} ours=${o?.[k]}`);
      }
    }
    expect(compared).toBeGreaterThan(400);
    expect(bad.slice(0, 10)).toEqual([]);
  });
});

/**
 * The same log with NO hosted series: what an app that supplies nothing but the
 * chart's own 5-minute bars gets. Both requests are derived from the chart bars,
 * with hourly buckets anchored at each session's first bar (09:30, 10:30, ...,
 * 15:30) and a derived bar complete on the chart bar whose next bar opens another
 * bucket or session (the history run has the dataset in hand).
 *
 * h60 must match TradingView's value on every row from the first session's last
 * bar on: before it, the log's first session is partial (it starts mid-day), so
 * its start, and with it its hourly buckets, are not known and sit on the clock.
 *
 * d1: TradingView's daily close is the exchange's official close (343.99 on
 * 10-21), which differs from the last 5-minute close (344.12) and cannot be
 * derived from 5-minute bars. So only the bar on which d1 CHANGES is compared,
 * not its value: the session's last bar, 15:55, and Friday's on Friday.
 */
(present ? describe : describe.skip)(`${NAME}, derived from the chart's own bars`, () => {
  const tv = present ? messages(readFileSync(CSV, "utf8")) : [];
  const meta: Record<string, string> = present
    ? Object.fromEntries(tv.find(m => m.startsWith("OPSMETA|"))!.slice(8).split(",").map(kv => kv.split("=") as [string, string]))
    : {};
  const head = present ? tv.find(m => m.startsWith("OPSHEAD|"))!.slice(8).split(",") : [];
  const at = (n: string) => head.indexOf(n);
  const rowsOf = (msgs: string[]) => {
    const m = new Map<string, string[]>();
    for (const x of msgs) if (x.startsWith("OPS|")) for (const r of x.slice(4).split("|")) { const c = r.split(","); m.set(c[0], c); }
    const l = msgs.find(x => x.startsWith("OPSLAST|"))?.slice(8).split(",");
    if (l) m.set(l[0], l);
    return m;
  };
  const sorted = [...rowsOf(tv).values()].sort((a, b) => Number(a[0]) - Number(b[0]));
  const candles = sorted.map(c => ({
    time: Number(c[0]), open: Number(c[at("open")]), high: Number(c[at("high")]), low: Number(c[at("low")]),
    close: Number(c[at("close")]), volume: Number(c[at("volume")]),
  }));
  let ours = new Map<string, string[]>();
  let result: any = null;
  if (present) {
    const s = new Session();
    s.setChart({ symbol: meta.tickerid, timeframe: meta.timeframe, mintick: Number(meta.mintick), timezone: meta.timezone, type: meta.type });
    expect(s.compile(readFileSync(join(DIR, `${NAME}.pine`), "utf8")).errors).toEqual([]);
    result = s.runHistory(candles);       // no provideData: both requests are derived
    ours = rowsOf((result.logs ?? []).map((l: any) => l.message));
  }
  const firstSessionEnd = present ? sorted.findIndex(r => r[at("last_bar")] === "1") : 0;

  it("runs with nothing supplied and asks the host for nothing", () => {
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(firstSessionEnd).toBeGreaterThan(0);
  });

  // The log's final row is TradingView's LIVE bar, where it evaluates a bar that has
  // not closed; a history run has no such bar, so that one row is not compared.
  const rowsAfterWarmup = sorted.slice(firstSessionEnd, -1);

  // An hourly bar's close in TradingView's own hourly series can differ from the
  // last 5-minute bar's close, as the daily close does (11-02 14:30-15:30: hourly
  // close 336.79, last 5-minute close 336.89). That is a data difference, not
  // logic: while such a bar's value stands, only its step bar is compared, and the
  // step itself still must land on the same bar. Found from the log, not listed.
  const closeOf5 = new Map(candles.map(c => [c.time, c.close]));
  const dataDifferent = new Set<string>();
  for (const t of sorted) {
    const tc = Number(t[at("tc60")]);
    const lastClose = closeOf5.get(tc - FIVE);
    if (lastClose !== undefined && Math.abs(lastClose - Number(t[at("c60")])) > 1e-9) dataDifferent.add(t[at("c60")]);
  }

  it("h60 matches TradingView on every row from the first session's last bar", () => {
    const k = at("h60");
    const bad: string[] = [];
    let exempt = 0;
    rowsAfterWarmup.forEach((t, i) => {
      const o = ours.get(t[0]);
      const same = !!o && Math.abs(Number(o[k]) - Number(t[k])) <= 1e-9 * Math.max(1, Math.abs(Number(t[k])));
      if (same) return;
      // a data-different bar's value: ours must still step on TradingView's bar
      if (dataDifferent.has(t[k])) {
        exempt++;
        const prevTv = rowsAfterWarmup[i - 1]?.[k], prevOurs = ours.get(rowsAfterWarmup[i - 1]?.[0] ?? "")?.[k];
        if ((t[k] !== prevTv) === (o?.[k] !== prevOurs)) return;
      }
      bad.push(`bar ${t[at("bar_index")]} ${new Date(Number(t[0])).toISOString()}: tv=${t[k]} ours=${o?.[k]}`);
    });
    expect(rowsAfterWarmup.length).toBeGreaterThan(400);
    expect(exempt).toBeGreaterThan(0);            // the data difference above is real
    expect(exempt).toBeLessThan(40);              // and a handful of rows, not the log
    expect(bad.slice(0, 10)).toEqual([]);
  });

  it("d1 changes on the same bars as TradingView's: each session's last bar", () => {
    const k = at("d1");
    const changes = (get: (t: string[]) => string | undefined) => {
      const out: string[] = [];
      for (let i = 1; i < rowsAfterWarmup.length; i++) {
        if (get(rowsAfterWarmup[i]) !== get(rowsAfterWarmup[i - 1])) out.push(rowsAfterWarmup[i][at("bar_index")]);
      }
      return out;
    };
    const tvChanges = changes(t => t[k]);
    expect(tvChanges.length).toBeGreaterThan(8);
    expect(changes(t => ours.get(t[0])?.[k])).toEqual(tvChanges);
    // and each of them is a session's last bar
    for (const t of sorted) if (tvChanges.includes(t[at("bar_index")])) expect(t[at("last_bar")]).toBe("1");
  });
});
