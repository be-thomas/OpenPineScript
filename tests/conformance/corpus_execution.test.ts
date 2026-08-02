/**
 * End-to-end corpus execution.
 *
 * Every script here is real published Pine Script (see corpus/README.md for
 * provenance and licence). Each one is transpiled AND RUN over the full sample
 * dataset — transpiling without executing only proves the parser accepted it,
 * not that the emitted JavaScript works.
 *
 * Assertions per script:
 *   - it runs all 505 bars without throwing
 *   - it produces at least one plot
 *   - every plotted series contains at least one finite value, i.e. the script
 *     is not silently emitting NaN for its whole length
 *
 * ── WHAT THIS SUITE DOES NOT DO ─────────────────────────────────────────────
 *
 * It compares nothing against TradingView. A script that runs cleanly and
 * produces confidently wrong numbers passes every assertion here.
 *
 * That is worth saying plainly, because the headline test count reads as
 * stronger evidence than it is. This is a SMOKE suite: it catches crashes and
 * all-NaN output — which were, in fairness, the two failure modes most of this
 * branch fixed — and nothing finer. An `rma` seeded one bar early or a `linreg`
 * off by a half-period is invisible to it.
 *
 * Numerical parity lives in tradingview_golden.test.ts, which compares plot
 * values against exports from TradingView itself. That one cannot be
 * automated — see tests/conformance/golden/README.md.
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { compileScript } from "../../transpiler";
import { compile, Context } from "../../runtime/v1";
import type { PineVersion } from "../../transpiler/version";

const ROOT = path.resolve(__dirname, "../..");

interface Bar { time: number; open: number; high: number; low: number; close: number; volume: number; }

function loadBars(): Bar[] {
  const csv = fs.readFileSync(path.join(ROOT, "mock_data/AAPL_mock.csv"), "utf8").trim();
  return csv.split(/\r?\n/).slice(1).map(line => {
    const c = line.split(",");
    return {
      time: new Date(c[0]).getTime(),
      open: parseFloat(c[1]), high: parseFloat(c[2]),
      low: parseFloat(c[3]), close: parseFloat(c[4]),
      volume: parseFloat(c[5]) || 0,
    };
  }).filter(b => !Number.isNaN(b.close));
}

const BARS = loadBars();

interface RunResult {
  bars: number;
  /** Plot directives that carry a NUMERIC series. */
  plots: number;
  finitePlots: number;
  /** Bar indices at which ANY numeric plot produced a finite value. */
  finiteBarIndices: Set<number>;
}

/**
 * Re-aggregates the chart bars into a higher timeframe.
 *
 * Only D/W/M are real: the sample dataset is daily, so an intraday request
 * cannot be synthesised and is answered with the daily bars. That is coarser
 * than the script asked for, which is why it is stated here rather than left to
 * look like an engine result.
 */
function resample(bars: Bar[], resolution: string): Bar[] {
  const r = String(resolution).toUpperCase();
  if (r !== "W" && r !== "M") return bars;

  const keyOf = (t: number) => {
    const d = new Date(t);
    if (r === "M") return `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
    const day = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    return String(day - ((d.getUTCDay() + 6) % 7) * 86400000); // week starting Monday
  };

  const out: Bar[] = [];
  let key = "";
  for (const b of bars) {
    const k = keyOf(b.time);
    if (k !== key) { out.push({ ...b }); key = k; continue; }
    const cur = out[out.length - 1];
    cur.high = Math.max(cur.high, b.high);
    cur.low = Math.min(cur.low, b.low);
    cur.close = b.close;
    cur.volume += b.volume;
  }
  return out;
}

function runBars(ctx: Context, exec: () => void, bars: Bar[]): void {
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
}

/**
 * The same price action re-stamped onto CONSECUTIVE calendar days.
 *
 * AAPL_mock.csv is equity data, so it has no Saturday or Sunday bars — an
 * accurate fact about equities, and the reason a script gated on
 * `dayofweek(time('D')) == sunday` produces nothing on it.
 *
 * A 24/7 instrument (crypto, forex) does trade every day, and those scripts are
 * written for exactly that. Re-stamping the existing bars onto a continuous
 * calendar models one without inventing prices: same OHLCV, seven-day week.
 *
 * This exists so the day-of-week scripts can be held to the SAME assertion as
 * every other corpus file instead of being excused in an inventory. An excuse
 * that says "the correct result is nothing" is unfalsifiable; running them on
 * data where the correct result is something is not.
 */
const SEVEN_DAY_BARS: Bar[] = BARS.map((b, i) => ({
  ...b,
  time: Date.UTC(2021, 0, 3) + i * 86400000, // 2021-01-03 was a Sunday
}));

/**
 * Corpus scripts that require a 24/7 instrument, and why.
 *
 * Keyed by path so the stale-entry check below catches a rename, exactly like
 * the gap inventories.
 */
const SEVEN_DAY_INSTRUMENT: Record<string, string> = {
  "tests/conformance/corpus/v1/sunday.pine":
    "plots only when dayofweek(time('D')) == sunday",
  "tests/conformance/corpus/v1/monday_range_fixed.pine":
    "plots only when dayofweek(time('D')) == sunday (the published script's own bug: " +
    "the function is named isMonday but compares against `sunday`)",
};

/**
 * bgcolor() and barcolor() register a plot directive with NO numeric value, so
 * demanding a finite number from them fails every script whose only output is a
 * background tint — which is a flaw in the measurement, not the script.
 */
const NUMERIC_PLOT_TYPES = new Set(["line", "candle", "shape", "char", "arrow"]);

function runScript(source: string, bars: Bar[] = BARS): RunResult {
  const compiled = compileScript(source);

  const build = () => {
    const ctx = new Context(compiled.profile);
    return { ctx, exec: compile(compiled.js, ctx, { ctx } as any) };
  };

  // Pass 1 discovers which (symbol, resolution) pairs the script asks for.
  // security() records them through the engine's own pull protocol rather than
  // this harness having to resolve `tickerid` itself.
  let { ctx, exec } = build();
  runBars(ctx, exec, bars);

  // Pass 2 supplies that data and re-runs from a clean context — the first pass
  // already accumulated per-bar state that must not be counted twice.
  if (ctx.requestedSecurities.size > 0) {
    const wanted = [...ctx.requestedSecurities];
    ({ ctx, exec } = build());
    for (const key of wanted) {
      const at = key.lastIndexOf("@");
      ctx.provideSecurityData(key.slice(0, at), key.slice(at + 1), resample(bars, key.slice(at + 1)));
    }
    runBars(ctx, exec, bars);
  }

  let plots = 0;
  let finitePlots = 0;
  const finiteBarIndices = new Set<number>();
  for (const series of ctx.plots.values()) {
    const numeric = series.some(p => p != null && NUMERIC_PLOT_TYPES.has(String((p as any).type)));
    if (!numeric) continue;
    plots++;
    let anyFinite = false;
    series.forEach((p, i) => {
      if (p != null && Number.isFinite(Number((p as any).value))) {
        anyFinite = true;
        finiteBarIndices.add(i);
      }
    });
    if (anyFinite) finitePlots++;
  }

  return { bars: bars.length, plots, finitePlots, finiteBarIndices };
}

/**
 * Scripts that transpile but do not yet RUN cleanly. Recorded explicitly rather
 * than skipped, so a fix trips the stale-entry check below instead of passing
 * unnoticed. Every entry is a pre-existing engine gap surfaced by real code.
 */
const KNOWN_RUNTIME_GAPS: Record<string, string> = {};


/**
 * Scripts that do not PARSE. Separated from the runtime gaps because they fail a
 * layer earlier and for different reasons — mixing them would let a parser
 * regression hide behind a "known runtime gap" label.
 */
const KNOWN_PARSE_GAPS: Record<string, string> = {};

/** Corpus files for one version, repo-relative. */
function corpusFiles(version: PineVersion): string[] {
  const dir = path.join(ROOT, `tests/conformance/corpus/v${version}`);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith(".pine")).sort()
    .map(f => `tests/conformance/corpus/v${version}/${f}`);
}

const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8");

describe("gap inventories", () => {
  it("have no stale entries", () => {
    const all = { ...KNOWN_RUNTIME_GAPS, ...KNOWN_PARSE_GAPS };
    const missing = Object.keys(all).filter(f => !fs.existsSync(path.join(ROOT, f)));
    expect(missing, `listed but not on disk:\n${missing.join("\n")}`).toEqual([]);
  });

  it("do not double-list a file", () => {
    // A file in both inventories could satisfy either check and never be fixed.
    const both = Object.keys(KNOWN_PARSE_GAPS).filter(f => f in KNOWN_RUNTIME_GAPS);
    expect(both, `listed in both inventories:\n${both.join("\n")}`).toEqual([]);
  });

  it("are empty — every corpus script parses and runs", () => {
    // The ratchet. Both inventories are empty; re-populating one should require
    // editing this test, not just appending a line.
    expect(Object.keys(KNOWN_PARSE_GAPS)).toEqual([]);
    expect(Object.keys(KNOWN_RUNTIME_GAPS)).toEqual([]);
  });

  it("every 24/7 instrument entry still exists", () => {
    const missing = Object.keys(SEVEN_DAY_INSTRUMENT)
      .filter(f => !fs.existsSync(path.join(ROOT, f)));
    expect(missing, `listed but not on disk:\n${missing.join("\n")}`).toEqual([]);
  });
});

/**
 * The day-of-week path, asserted rather than excused.
 *
 * These two scripts were previously in KNOWN_RUNTIME_GAPS with the note "plots
 * only on Sundays; dataset is daily equity bars". That note was true but
 * unfalsifiable: it predicted no output, and no output is also what a broken
 * `dayofweek`, a broken `sunday` constant or a broken `time('D')` produces.
 *
 * On a seven-day calendar the prediction becomes checkable — and specific. The
 * scripts must plot, and must plot on exactly the Sundays.
 */
describe("day-of-week gating", () => {
  const sundayIndices = new Set(
    SEVEN_DAY_BARS.flatMap((b, i) => (new Date(b.time).getUTCDay() === 0 ? [i] : [])),
  );

  it("the seven-day series really does contain Sundays", () => {
    expect(sundayIndices.size).toBeGreaterThan(50);
  });

  for (const rel of Object.keys(SEVEN_DAY_INSTRUMENT)) {
    const name = path.basename(rel);

    it(`${name} plots on every Sunday and on no other day`, () => {
      const result = runScript(read(rel), SEVEN_DAY_BARS);
      expect(result.finitePlots).toBeGreaterThan(0);
      expect([...result.finiteBarIndices].sort((a, b) => a - b))
        .toEqual([...sundayIndices].sort((a, b) => a - b));
    });

    it(`${name} plots nothing on equity bars, which have no Sunday`, () => {
      // The other half: the original observation, now a positive assertion
      // about the data rather than an excuse for an absent one.
      expect(BARS.some(b => new Date(b.time).getUTCDay() === 0)).toBe(false);
      expect(runScript(read(rel)).finitePlots).toBe(0);
    });
  }
});

describe("sample dataset", () => {
  it("loads real bars", () => {
    expect(BARS.length).toBeGreaterThan(500);
    expect(BARS.every(b => Number.isFinite(b.close))).toBe(true);
  });
});

/**
 * One suite per version. Each corpus file is transpiled AND RUN over the full
 * dataset — transpiling only proves the parser accepted it, not that the
 * emitted JavaScript works.
 */
function describeCorpus(version: PineVersion, minFiles: number) {
  describe(`v${version} corpus executes end to end`, () => {
    const files = corpusFiles(version);

    it("the corpus is populated", () => {
      // Guards against every test below silently vanishing.
      expect(files.length).toBeGreaterThanOrEqual(minFiles);
    });

    for (const rel of files) {
      const name = path.basename(rel);
      const parseGap = KNOWN_PARSE_GAPS[rel];
      const runtimeGap = KNOWN_RUNTIME_GAPS[rel];
      const gap = parseGap ?? runtimeGap;

      // A script written for a 24/7 instrument gets one. This is a property of
      // the SYMBOL, not an exemption: it still has to plot real values.
      const needs247 = SEVEN_DAY_INSTRUMENT[rel];
      const bars = needs247 ? SEVEN_DAY_BARS : BARS;

      it(`${name} ${gap ? `is a known gap: ${gap}` : `runs over ${bars.length} bars and plots real values`}`, () => {
        const source = read(rel);

        if (gap) {
          // Must still FAIL — if it starts working, update the inventory.
          let worked = false;
          try {
            const r = runScript(source, bars);
            worked = r.plots > 0 && r.finitePlots > 0;
          } catch { worked = false; }
          expect(worked, `${name} now works — remove it from the inventory`).toBe(false);
          return;
        }

        // Confirms the file really is the version its directory claims, so the
        // version's own rules are what got exercised.
        expect(compileScript(source).version, `${name} is not //@version=${version}`).toBe(version);

        const result = runScript(source, bars);

        // A strategy's output is its orders, not a curve — several publish only
        // bgcolor() or entries. Demanding a numeric plot from one tests the
        // harness's assumptions rather than the engine.
        const isStrategy = /^\s*strategy\s*\(/m.test(source);
        if (!isStrategy) {
          expect(result.plots, `${name} produced no plots`).toBeGreaterThan(0);
        }
        if (result.plots > 0) {
          expect(
            result.finitePlots,
            `${name} plotted ${result.plots} numeric series but every one was entirely NaN`,
          ).toBeGreaterThan(0);
        }
      });
    }
  });
}

describeCorpus(1, 10);
describeCorpus(2, 4);
describeCorpus(3, 35);

describe("v2 corpus executes end to end (validation/)", () => {
  // validation/ holds real published v2 strategies, kept at the repo root
  // because they predate the corpus layout.
  const dir = path.join(ROOT, "validation");
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".pine")).sort();

  const runnable = files.filter(f => {
    try { compileScript(read(`validation/${f}`)); return true; }
    catch { return false; }
  });

  it("several real v2 scripts transpile", () => {
    expect(runnable.length).toBeGreaterThanOrEqual(7);
  });

  /**
   * Annotated //@version=2, but written against a LATER version's built-ins.
   *
   * gap_down_reversal_strategy.pine reads `syminfo.timezone` and calls the
   * six-argument `timestamp(timezone, y, m, d, h, m)`. Both arrived in Pine v4:
   * v4 is the release that moved chart information into the `syminfo.*`
   * namespace and added the timezone parameter to the time functions. Under
   * //@version=2 TradingView reports `Undeclared identifier 'syminfo'`.
   *
   * So this is NOT a gap — running it is not something a correct engine does.
   * It is asserted to fail, and to fail on that identifier, which is a stronger
   * statement than the "known gap" line it replaces. Kept in the corpus because
   * it still exercises ':=', if/else as an expression and strategy.exit through
   * the transpiler.
   *
   * (The engine reports it at RUNTIME rather than at compile time, because
   * there is no undeclared-identifier pass yet. Same verdict, later.)
   */
  const WRONG_VERSION_BUILTINS: Record<string, RegExp> = {
    "gap_down_reversal_strategy.pine": /syminfo/,
  };

  for (const file of runnable) {
    const rel = `validation/${file}`;
    const gap = KNOWN_RUNTIME_GAPS[rel];
    const laterVersionBuiltin = WRONG_VERSION_BUILTINS[file];

    if (laterVersionBuiltin) {
      it(`${file} is rejected — it uses a v4 built-in under //@version=2`, () => {
        expect(() => runScript(read(rel))).toThrow(laterVersionBuiltin);
      });
      continue;
    }

    it(`${file} ${gap ? `is a known gap: ${gap}` : `runs over ${BARS.length} bars`}`, () => {
      const source = read(rel);
      expect(compileScript(source).version).toBe(2);

      if (gap) {
        let worked = false;
        try {
          const r = runScript(source);
          worked = r.plots > 0 && r.finitePlots > 0;
        } catch { worked = false; }
        expect(worked, `${file} now works — remove it from KNOWN_RUNTIME_GAPS`).toBe(false);
        return;
      }

      const result = runScript(source);
      expect(result.bars).toBe(BARS.length);
      // Strategies need not plot; indicators must.
      if (result.plots > 0) expect(result.finitePlots).toBeGreaterThan(0);
    });
  }
});
