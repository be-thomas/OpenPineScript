/**
 * Numerical parity against TradingView itself.
 *
 * Every other suite in this repo checks the engine against a spec, against
 * another version of itself, or against a value someone worked out by hand.
 * None of those can catch an indicator that is subtly, consistently wrong —
 * an `rma` seeded one bar early, an `atr` using the wrong true-range branch, a
 * `linreg` off by a half-period. Only TradingView's own output can.
 *
 * ── Where the data comes from ───────────────────────────────────────────────
 *
 * TradingView has no public API for indicator values, so this cannot be
 * automated. A human runs one of the harness scripts in
 * conformance/golden/ on a real chart and uses "Export chart data…".
 * The recipe is in conformance/golden/README.md.
 *
 * ── How the comparison works ────────────────────────────────────────────────
 *
 * The exported CSV carries the bars AND the plot values, so the engine is fed
 * TradingView's exact input and compared on its exact output. The harness .pine
 * IS the test program: our engine runs the same file and its plots are matched
 * to CSV columns by plot title.
 *
 * Only the INTERSECTION of CSV columns and engine plots is compared, so a plot
 * the user had to delete (because their TradingView version rejected it) costs
 * one assertion rather than the whole file. `MIN_COLUMNS` stops that degrading
 * to nothing.
 *
 * ── The warm-up allowance, and why it is not a fudge ────────────────────────
 *
 * TradingView computes from the instrument's first bar, but an export contains
 * only the bars that were on screen. At the first exported bar an `ema` already
 * carries state from history the engine never saw. Skipping a warm-up window
 * lets exponentially-converging indicators agree on their own merits; after 300
 * bars an ema(20) has forgotten its seed to far below the tolerance.
 *
 * That reasoning does NOT hold for `cum`, `barssince`, `valuewhen` or `sar`,
 * which never converge — harness_state.pine must be exported over the
 * instrument's full history, and says so.
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { compileScript, IMPLEMENTED_VERSIONS } from "../../transpiler/common";
import type { PineVersion } from "../../transpiler/common/version";
import { Context } from "../../runtime/v1/context";
import { compile } from "../../runtime/v1/index";

const ROOT = path.resolve(__dirname, "../..");
const GOLDEN_DIR = path.join(__dirname, "..");

/** Bars to ignore at the start of a file, so seeded state can converge. */
const DEFAULT_WARMUP = 300;

/** Per-harness override, keyed by harness basename. */
const WARMUP: Record<string, number> = {
  // Path-dependent values never converge, so a warm-up window would not help
  // and would only hide a real disagreement. This file is exported over full
  // history or not at all.
  harness_state: 0,
};

/** Relative tolerance. Absolute floor covers values near zero. */
const REL_TOL = 1e-6;
const ABS_TOL = 1e-9;

/** A file that compares fewer columns than this has silently stopped testing. */
const MIN_COLUMNS = 5;

/**
 * Columns whose value is constant BY CONSTRUCTION, exempt from that guard.
 *
 * `nested_loops` counts the pairs of `for i = 0 to 4` / `for j = 0 to 4` where
 * `close[i] > close[j]`. For distinct closes exactly half of the twenty ordered
 * off-diagonal pairs satisfy `>`, so the answer is 10 on every bar after the
 * history fills — and TradingView's export says 10 on every bar too.
 *
 * The guard is RIGHT that matching a constant proves nothing; the probe is what
 * is weak. It is exempted rather than rewritten because rewriting it would
 * invalidate every export already collected with it, for a column that is
 * agreeing. Worth strengthening — comparing `close[i] > open[j]`, say — the
 * next time the harnesses are revised and re-collected.
 */
const CONSTANT_BY_CONSTRUCTION = new Set(["nested_loops"]);

/** A column compared at fewer points than this proves nothing. */
const MIN_POINTS = 50;

const OHLCV = new Set(["time", "open", "high", "low", "close", "volume"]);

interface Bar { time: number; open: number; high: number; low: number; close: number; volume: number; }

interface Golden {
  /** CSV file name, for messages. */
  file: string;
  /** Harness basename, e.g. "harness_core". */
  harness: string;
  bars: Bar[];
  /** Plot title → value per bar (NaN where TradingView wrote na). */
  columns: Map<string, number[]>;
}

/**
 * Splits a CSV line on commas that are not inside double quotes.
 *
 * Plot titles are author-controlled and TradingView quotes any that contain a
 * comma, so a naive split would silently shift every column after it.
 */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (quoted && line[i + 1] === '"') { cur += '"'; i++; }
      else quoted = !quoted;
    } else if (c === "," && !quoted) {
      out.push(cur); cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out.map(s => s.trim());
}

/** TradingView writes ISO timestamps; some locales export a unix seconds value. */
function parseTime(raw: string): number {
  const asNumber = Number(raw);
  if (Number.isFinite(asNumber) && raw.trim() !== "") {
    // Seconds vs milliseconds: anything below ~1e12 is seconds.
    return asNumber < 1e12 ? asNumber * 1000 : asNumber;
  }
  const t = Date.parse(raw);
  return Number.isNaN(t) ? NaN : t;
}

/** Empty, "NaN" and "n/a" all mean "no value on this bar". */
function parseCell(raw: string): number {
  const s = raw.trim();
  if (s === "" || /^(na|nan|n\/a|null)$/i.test(s)) return NaN;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Reads an export, from either route.
 *
 * `.csv` — "Export chart data…", PRO+/Premium only. Header row, then one row
 *          per bar.
 * `.log` — text copied out of the Pine Logs pane, which is free and works on
 *          historical bars. Each row is wrapped in whatever prefix the pane
 *          renders (a timestamp, a source link), so the generated harnesses tag
 *          the payload and this strips everything before the tag:
 *
 *              [2015-01-02T00:00 UTC]: OPSHEAD|time,open,high,…
 *              [2015-01-02T00:00 UTC]: OPS|1420156800000,111.39,…
 *
 * Both end up as the same list of CSV lines, so everything downstream is shared.
 */
function readExportLines(file: string): string[] {
  const text = fs.readFileSync(path.join(GOLDEN_DIR, file), "utf8").trim();
  const raw = text.split(/\r?\n/);

  // Detected by CONTENT, not by extension. The Pine Logs pane has its own CSV
  // download — `Date,Message` with our payload quoted inside the message — so a
  // log export legitimately arrives named .csv. Sniffing for the marker means
  // either name works and neither has to be explained.
  const isLog = raw.some(l => l.includes("OPSHEAD|") || l.includes("OPS|"));
  if (!isLog) return raw;

  const head: string[] = [];
  const rows: string[] = [];
  for (const line of raw) {
    const h = line.indexOf("OPSHEAD|");
    if (h >= 0) { head.push(line.slice(h + "OPSHEAD|".length).trim()); continue; }
    const r = line.indexOf("OPS|");
    if (r >= 0) rows.push(line.slice(r + "OPS|".length).trim());
  }
  if (head.length === 0) {
    throw new Error(
      `${file}: no OPSHEAD| line found. Copy the WHOLE Pine Logs pane — the ` +
      `header is logged once, on the first bar, and without it there are no ` +
      `column names.`,
    );
  }
  // Sort by bar time: the pane renders newest-first, and a downloaded CSV is
  // ordered by LOG time, which for historical bars is all the same instant.
  rows.sort((a, b) => Number(a.split(",")[0]) - Number(b.split(",")[0]));

  // Collapse repeated rows for the same bar, keeping the LAST.
  //
  // A script logs once per historical bar but once per TICK on the realtime
  // bar, so the bar that was still forming when the log was taken appears many
  // times with a growing volume. Keeping the last is the settled value; keeping
  // them all would feed the engine the same bar repeatedly and desynchronise
  // every series after it.
  const byTime = new Map<string, string>();
  for (const r of rows) byTime.set(r.split(",")[0], r);

  return [head[0], ...byTime.values()];
}

function loadGolden(file: string): Golden {
  const lines = readExportLines(file);
  const header = splitCsvLine(lines[0]);

  const indexOf = (name: string) =>
    header.findIndex(h => h.trim().toLowerCase() === name);

  const iTime = indexOf("time");
  const iOpen = indexOf("open");
  const iHigh = indexOf("high");
  const iLow = indexOf("low");
  const iClose = indexOf("close");
  const iVolume = indexOf("volume");

  if (iTime < 0 || iOpen < 0 || iHigh < 0 || iLow < 0 || iClose < 0) {
    throw new Error(
      `${file}: header is missing an OHLC column — got [${header.join(", ")}]. ` +
      `The export must include the main series, not the indicator alone.`,
    );
  }

  const bars: Bar[] = [];
  const columns = new Map<string, number[]>();
  const plotIndices = header
    .map((h, i) => ({ title: h, i }))
    .filter(({ title, i }) =>
      i !== iTime && !OHLCV.has(title.trim().toLowerCase()) && title.trim() !== "");

  for (const { title } of plotIndices) columns.set(title.trim(), []);

  for (const line of lines.slice(1)) {
    if (line.trim() === "") continue;
    const cells = splitCsvLine(line);
    const time = parseTime(cells[iTime]);
    const close = parseCell(cells[iClose]);
    if (!Number.isFinite(time) || !Number.isFinite(close)) continue;

    bars.push({
      time,
      open: parseCell(cells[iOpen]),
      high: parseCell(cells[iHigh]),
      low: parseCell(cells[iLow]),
      close,
      volume: iVolume >= 0 ? parseCell(cells[iVolume]) || 0 : 0,
    });
    for (const { title, i } of plotIndices) {
      columns.get(title.trim())!.push(parseCell(cells[i]));
    }
  }

  // The harness is the sibling .pine named by everything before the first dot,
  // and it is compiled as the version of the directory they share — see
  // `versionOf`. So "v5/golden/harness_core.BTCUSDT.1D.log" runs
  // "v5/golden/harness_core.pine" AS v5.
  //
  // Nothing crosses versions. An earlier draft redirected a v5 export to the v3
  // file it was generated from, on the reasoning that the v5 harness was only a
  // collection tool. That made the directory a lie: data sitting in `v5/`
  // tested the v3 emitter, and v5 — the version most scripts are written in —
  // had no parity coverage at all. A folder now contains one version's
  // harnesses and one version's results, and checks that version.
  const dir = path.dirname(file);
  const harness = path.join(dir, path.basename(file).split(".")[0]);

  return { file, harness, bars, columns };
}

/**
 * The version a harness must be COMPILED as, taken from its directory.
 *
 * `golden/v4/harness_builtins.pine` is v4 by necessity — `bb()` does not exist
 * earlier — and is now compiled AS v4, which this engine implements.
 *
 * This used to force 3 for everything, with a note that running a v4 export
 * through the v3 pipeline still tested the arithmetic because the runtime is
 * shared. That was true, and it was a workaround: it tested `ta.bb`'s numbers
 * while saying nothing about whether v4 resolves `bb` at all. Now that v4 has a
 * pipeline, the harness runs at its own version and the gate is tested too.
 *
 * Anything outside a recognised version directory still falls back to 3 — the
 * generated v5 harnesses resolve back to their v3/v4 source before this is
 * asked, so nothing reaches here needing a version this engine cannot run.
 */
function versionOf(harness: string): PineVersion {
  const dir = harness.split(path.sep)[0];
  const m = /^v([1-9])$/.exec(dir);
  const v = m ? Number(m[1]) : 3;
  return (IMPLEMENTED_VERSIONS.includes(v as PineVersion) ? v : 3) as PineVersion;
}

/** Runs a harness over the exported bars and returns its plots by title. */
function runHarness(harnessSource: string, bars: Bar[], version: PineVersion): Map<string, number[]> {
  const compiled = compileScript(harnessSource, { version });
  const ctx = new Context(compiled.profile);
  const exec = compile(compiled.js, ctx, { ctx } as any);

  // The final bar is run as REALTIME, so the last SETTLED bar is the one before
  // it — which is what `barstate.islastconfirmedhistory` asks for.
  ctx.realtimeBars = 1;
  bars.forEach((bar, i) => {
    ctx.currentBarIndex = i;
    ctx.is_new = true;
    ctx.is_last = i === bars.length - 1;
    ctx.is_history = !ctx.is_last;
    ctx.is_realtime = ctx.is_last;
    ctx.setBar(bar.time, bar.open, bar.high, bar.low, bar.close, bar.volume);
    exec();
    ctx.finalizeBar();
  });

  // ctx.plots is keyed by CALL SITE, not by title — deliberately, so that two
  // plots that both default to title="Plot" do not overwrite each other. The
  // title we need to match TradingView's column header is inside each record.
  const out = new Map<string, number[]>();
  for (const series of ctx.plots.values()) {
    const sample = series.find(p => p != null) as any;
    const title = sample?.title;
    if (!title) continue;
    out.set(title, series.map(p => (p == null ? NaN : Number((p as any).value))));
  }
  return out;
}

/**
 * Runs a GENERATED v5 harness and reads its columns back out of its LOGS.
 *
 * The v5 harnesses do not plot. They exist so that golden data can be collected
 * on a free TradingView plan — `log.info()` arrived with v5 and runs on
 * historical bars, where `alert()` never does — so each one emits the row that
 * `readExportLines` parses out of the Pine Logs pane.
 *
 * This engine implements v5, so the same file runs here, and the SAME tagged
 * rows come back. That is what makes the second comparison free: one export
 * checks the v3 emitter through the source harness and the v5 emitter through
 * the generated one, against identical numbers from TradingView.
 */
function runLogHarness(source: string, bars: Bar[], version: PineVersion): Map<string, number[]> {
  const compiled = compileScript(source, { version });
  const ctx = new Context(compiled.profile);
  const exec = compile(compiled.js, ctx, { ctx } as any);

  ctx.realtimeBars = 1;
  bars.forEach((bar, i) => {
    ctx.currentBarIndex = i;
    ctx.is_new = true;
    ctx.is_last = i === bars.length - 1;
    ctx.is_history = !ctx.is_last;
    ctx.is_realtime = ctx.is_last;
    ctx.setBar(bar.time, bar.open, bar.high, bar.low, bar.close, bar.volume);
    exec();
    ctx.finalizeBar();
  });

  const header = ctx.logs.find(l => l.message.startsWith("OPSHEAD|"));
  if (!header) throw new Error("the generated harness logged no OPSHEAD| row");
  const names = header.message.slice("OPSHEAD|".length).split(",").map(n => n.trim());

  const out = new Map<string, number[]>();
  for (const name of names) if (!OHLCV.has(name.toLowerCase()) && name !== "time") out.set(name, []);

  for (const entry of ctx.logs) {
    if (!entry.message.startsWith("OPS|")) continue;
    const cells = entry.message.slice("OPS|".length).split(",");
    names.forEach((name, i) => out.get(name)?.push(parseCell(cells[i] ?? "")));
  }
  return out;
}

function close(a: number, b: number): boolean {
  const diff = Math.abs(a - b);
  return diff <= ABS_TOL || diff <= REL_TOL * Math.max(Math.abs(a), Math.abs(b));
}

/**
 * Every export, as a path relative to the golden directory.
 *
 * `golden/` is split by the Pine version a harness must be COMPILED AS on
 * TradingView — `golden/v4/harness_builtins.pine` calls `bb()`, which does not
 * exist before v4 — so an export lives beside the harness that produced it:
 *
 *     golden/v3/harness_core.pine
 *     golden/v3/harness_core.BTCUSDT.1D.csv
 */
function findCsvs(): string[] {
  if (!fs.existsSync(GOLDEN_DIR)) return [];
  const out: string[] = [];
  // Layout is conformance/<version>/golden/, so the version is the OUTER
  // directory and `golden` the inner one. Everything downstream keys off the
  // returned relative path, so it keeps both parts.
  for (const entry of fs.readdirSync(GOLDEN_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory() || !/^v\d+$/.test(entry.name)) continue;
    const dir = path.join(GOLDEN_DIR, entry.name, "golden");
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (/\.(csv|log)$/i.test(f)) out.push(path.join(entry.name, "golden", f));
    }
  }
  return out.sort();
}

const CSVS = findCsvs();

const HOW_TO =
  "No TradingView exports found in conformance/golden/.\n" +
  "This is the only suite that can catch a numerically-wrong indicator, and it " +
  "cannot be automated — TradingView has no public API for plot values.\n" +
  "See conformance/golden/README.md for the ~10-minute recipe.";

describe("TradingView golden data", () => {
  it("is present", () => {
    // Deliberately fails rather than skipping. A skipped suite reads as green,
    // and "we have no parity evidence" is exactly the thing this repo refuses
    // to let pass unnoticed. Flip to `it.skip` if you want it deferred.
    expect(CSVS.length, HOW_TO).toBeGreaterThan(0);
  });

  it("every export names a harness that exists", () => {
    const orphans = CSVS.filter(f => {
      const sibling = path.join(path.dirname(f), `${path.basename(f).split(".")[0]}.pine`);
      return !fs.existsSync(path.join(GOLDEN_DIR, sibling));
    });
    expect(
      orphans,
      `these CSVs have no sibling harness .pine — put each export next to the ` +
      `harness that produced it, named <harness>.<symbol>.<timeframe>.csv:\n${orphans.join("\n")}`,
    ).toEqual([]);
  });
});

/**
 * One emitter's run of one export, compared column by column.
 *
 * Extracted so that the v3 (or v4) source harness and the GENERATED v5 harness
 * are held to exactly the same assertions, with the same messages and the same
 * vacuity guards. Two copies would drift, and the weaker one would be the one
 * nobody noticed.
 */
function describeComparison(
  label: string, golden: Golden, ours: Map<string, number[]>, warmup: number,
) {
  describe(label, () => {
    const shared = [...golden.columns.keys()].filter(t => ours.has(t));

    it("the harness still produces the exported columns", () => {
      const missing = [...golden.columns.keys()].filter(t => !ours.has(t));
      expect(
        shared.length,
        `only ${shared.length} of ${golden.columns.size} columns matched. ` +
        `Unmatched: ${missing.join(", ")}`,
      ).toBeGreaterThanOrEqual(MIN_COLUMNS);
    });

    for (const title of shared) {
      it(`${title}`, () => {
        const theirs = golden.columns.get(title)!;
        const mine = ours.get(title)!;

        const diffs: string[] = [];
        const seen = new Set<number>();
        let compared = 0;
        let worst = 0;

        for (let i = warmup; i < golden.bars.length; i++) {
          const a = theirs[i];
          const b = mine[i];
          // TradingView having no value is not a disagreement — it is the
          // warm-up of that particular indicator. Our engine producing one
          // where TradingView does not IS a disagreement, and is caught by the
          // NaN-parity assertion below.
          if (Number.isNaN(a)) continue;
          compared++;
          seen.add(a);

          if (!close(a, b)) {
            const rel = Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b), 1e-12);
            worst = Math.max(worst, rel);
            if (diffs.length < 5) {
              diffs.push(
                `  bar ${i} (${new Date(golden.bars[i].time).toISOString().slice(0, 10)}): ` +
                `tradingview=${a} ours=${b} rel=${rel.toExponential(2)}`,
              );
            }
          }
        }

        // Vacuity guards, in the style of the rest of this repo: a column that
        // is all-na or constant would otherwise "agree" while proving nothing.
        expect(
          compared,
          `${title}: TradingView reported a value on only ${compared} bars after ` +
          `the ${warmup}-bar warm-up — too few to conclude anything`,
        ).toBeGreaterThanOrEqual(MIN_POINTS);
        if (!CONSTANT_BY_CONSTRUCTION.has(title)) {
          expect(
            seen.size,
            `${title}: TradingView's column is constant, so matching it proves ` +
            `nothing. If it is constant BY CONSTRUCTION, add it to ` +
            `CONSTANT_BY_CONSTRUCTION with the reason.`,
          ).toBeGreaterThan(1);
        }

        expect(
          diffs.length,
          `${title}: ${diffs.length}+ of ${compared} bars disagree ` +
          `(worst relative error ${worst.toExponential(2)}):\n${diffs.join("\n")}`,
        ).toBe(0);
      });
    }

    it("agrees on WHERE the values start", () => {
      // An indicator that is right but starts a bar early or late is a real
      // parity bug and the value comparison above would never see it, because
      // it skips every bar TradingView left blank.
      const offenders: string[] = [];
      for (const title of shared) {
        const theirs = golden.columns.get(title)!;
        const mine = ours.get(title)!;
        const firstTheirs = theirs.findIndex(v => !Number.isNaN(v));
        const firstMine = mine.findIndex(v => !Number.isNaN(v));
        if (firstTheirs < 0 || firstMine < 0) continue;
        // Only meaningful when the export starts at the instrument's first bar;
        // otherwise TradingView's column is already warm at bar 0.
        if (firstTheirs === 0) continue;
        if (firstTheirs !== firstMine) {
          offenders.push(`${title}: tradingview=${firstTheirs} ours=${firstMine}`);
        }
      }
      expect(offenders, `first non-na bar differs:\n${offenders.join("\n")}`).toEqual([]);
    });
  });
}

for (const file of CSVS) {
  const golden = loadGolden(file);
  const harnessPath = path.join(GOLDEN_DIR, `${golden.harness}.pine`);
  const warmup = WARMUP[path.basename(golden.harness)] ?? DEFAULT_WARMUP;
  const version = versionOf(golden.harness);
  const source = fs.readFileSync(harnessPath, "utf8");

  // A harness reports either way, and which one it is is written in the file.
  // The v1-v4 harnesses `plot()`, because "Export chart data…" is what collects
  // them. The v5 ones `log.info()` a tagged row instead, because Pine Logs is
  // what collects those and it needs no paid plan. Same program, same column
  // names; only the transport differs.
  const ours = source.includes("OPSHEAD|")
    ? runLogHarness(source, golden.bars, version)
    : runHarness(source, golden.bars, version);

  describe(`${file}`, () => {
    it("the export is long enough to be worth comparing", () => {
      expect(golden.bars.length).toBeGreaterThan(warmup + MIN_POINTS);
    });
  });

  describeComparison(`${file} matches TradingView at v${version}`, golden, ours, warmup);
}
