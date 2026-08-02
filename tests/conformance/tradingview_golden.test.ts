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
 * tests/conformance/golden/ on a real chart and uses "Export chart data…".
 * The recipe is in tests/conformance/golden/README.md.
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
import { compileScript } from "../../transpiler";
import { Context } from "../../runtime/v1/context";
import { compile } from "../../runtime/v1/index";

const ROOT = path.resolve(__dirname, "../..");
const GOLDEN_DIR = path.join(__dirname, "golden");

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

function loadGolden(file: string): Golden {
  const text = fs.readFileSync(path.join(GOLDEN_DIR, file), "utf8").trim();
  const lines = text.split(/\r?\n/);
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

  // The harness is named by everything before the first dot, so
  // "harness_core.BTCUSD.1D.csv" runs harness_core.pine.
  const harness = file.split(".")[0];
  return { file, harness, bars, columns };
}

/** Runs a harness over the exported bars and returns its plots by title. */
function runHarness(harnessSource: string, bars: Bar[]): Map<string, number[]> {
  // Version is FORCED to 3 rather than read from the annotation: the user may
  // have had to bump the harness to //@version=4 for TradingView to accept it,
  // and v4 is not implemented here. The built-ins used are spelled identically.
  const compiled = compileScript(harnessSource, { version: 3 });
  const ctx = new Context(compiled.profile);
  const exec = compile(compiled.js, ctx, { ctx } as any);

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

function close(a: number, b: number): boolean {
  const diff = Math.abs(a - b);
  return diff <= ABS_TOL || diff <= REL_TOL * Math.max(Math.abs(a), Math.abs(b));
}

const CSVS = fs.existsSync(GOLDEN_DIR)
  ? fs.readdirSync(GOLDEN_DIR).filter(f => f.toLowerCase().endsWith(".csv")).sort()
  : [];

const HOW_TO =
  "No TradingView exports found in tests/conformance/golden/.\n" +
  "This is the only suite that can catch a numerically-wrong indicator, and it " +
  "cannot be automated — TradingView has no public API for plot values.\n" +
  "See tests/conformance/golden/README.md for the ~10-minute recipe.";

describe("TradingView golden data", () => {
  it("is present", () => {
    // Deliberately fails rather than skipping. A skipped suite reads as green,
    // and "we have no parity evidence" is exactly the thing this repo refuses
    // to let pass unnoticed. Flip to `it.skip` if you want it deferred.
    expect(CSVS.length, HOW_TO).toBeGreaterThan(0);
  });

  it("every export names a harness that exists", () => {
    const orphans = CSVS.filter(
      f => !fs.existsSync(path.join(GOLDEN_DIR, `${f.split(".")[0]}.pine`)),
    );
    expect(
      orphans,
      `these CSVs do not match a harness .pine — rename them to ` +
      `<harness>.<symbol>.<timeframe>.csv:\n${orphans.join("\n")}`,
    ).toEqual([]);
  });
});

for (const file of CSVS) {
  describe(`${file} matches TradingView`, () => {
    const golden = loadGolden(file);
    const harnessPath = path.join(GOLDEN_DIR, `${golden.harness}.pine`);
    const warmup = WARMUP[golden.harness] ?? DEFAULT_WARMUP;

    const ours = runHarness(fs.readFileSync(harnessPath, "utf8"), golden.bars);
    const shared = [...golden.columns.keys()].filter(t => ours.has(t));

    it("the export is long enough to be worth comparing", () => {
      expect(golden.bars.length).toBeGreaterThan(warmup + MIN_POINTS);
    });

    it("the harness still produces the exported plots", () => {
      const missing = [...golden.columns.keys()].filter(t => !ours.has(t));
      expect(
        shared.length,
        `only ${shared.length} of ${golden.columns.size} columns matched a plot. ` +
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
        expect(
          seen.size,
          `${title}: TradingView's column is constant, so matching it proves nothing`,
        ).toBeGreaterThan(1);

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
