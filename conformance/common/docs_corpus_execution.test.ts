/**
 * What the vendored documentation corpus does when it RUNS.
 *
 * Compiling is pinned next door, in docs_corpus_integrity.test.ts. This is the
 * other column: of the scripts that compile, which ones raise, and why.
 *
 * ── Why it is pinned by CAUSE rather than counted ───────────────────────────
 *
 * "39 raise a runtime error" is a statement about the engine only if each of
 * the 39 is something the engine ought to raise. Three things qualify:
 *
 *   THE SCRIPT'S OWN ERROR   a `runtime.error()` call, or an index/shape the
 *                            page is written to show failing. TradingView's
 *                            matrices and arrays pages have a whole section of
 *                            these, each annotated "Raises an error" in its own
 *                            source.
 *   HOST DATA NOT SUPPLIED   `request.financial`, `request.economic` and the
 *                            rest need data this engine cannot fetch. It says
 *                            so and stops, rather than inventing a series.
 *   A DELIBERATE REFUSAL     `renko`, `linebreak`, `kagi` and `pointfigure`
 *                            cannot be rebuilt from OHLCV bars, and `accdist`'s
 *                            published definitions disagree on a seed. A named
 *                            refusal beats a plausible wrong number.
 *
 * Anything else is a bug, and this suite exists so that a new one cannot arrive
 * quietly. The list shrank from 124 to 39 by being written down and worked
 * through; without a pin it would drift back up.
 *
 * ── Thirty bars, not five hundred ───────────────────────────────────────────
 *
 * Every one of these fires within the first thirty bars, checked against a full
 * 506-bar sweep: the same files, in the same order. Thirty keeps this suite at
 * a few seconds instead of a minute.
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { compileScript } from "../../transpiler/common";
import { compile } from "../../runtime/v1";
import { Context } from "../../runtime/v1/context";

const ROOT = path.resolve(__dirname, "../..");
const BARS = 30;

type Bar = { t: number; o: number; h: number; l: number; c: number; v: number };

const dataset: Bar[] = fs
  .readFileSync(path.join(ROOT, "mock_data/common/AAPL_mock.csv"), "utf8")
  .trim().split("\n").slice(1)
  .map(line => {
    const f = line.split(",");
    return { t: +new Date(f[0]), o: +f[1], h: +f[2], l: +f[3], c: +f[4], v: +f[5] };
  });

/** Every corpus script that compiles, run over `BARS` bars. `null` = no error. */
function sweep(): Map<string, string | null> {
  const out = new Map<string, string | null>();
  for (const version of ["v2", "v3", "v4", "v5"]) {
    const dir = path.join(ROOT, "examples", version, "tradingview-docs");
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir).filter(f => f.endsWith(".pine")).sort()) {
      const rel = `${version}/${name}`;
      let js: string, profile: any;
      try {
        ({ js, profile } = compileScript(fs.readFileSync(path.join(dir, name), "utf8")));
      } catch { continue; }          // the compile column, pinned elsewhere
      const ctx = new Context(profile);
      try {
        const exec = compile(js, ctx, { ctx } as any);
        ctx.provideDatasetExtent(dataset.length, dataset[dataset.length - 1].t);
        for (let i = 0; i < BARS; i++) {
          const b = dataset[i];
          ctx.is_new = true;
          ctx.is_last = false;
          ctx.is_history = true;
          ctx.is_realtime = false;
          ctx.setBar(b.t, b.o, b.h, b.l, b.c, b.v);
          exec();
          ctx.finalizeBar();
        }
        out.set(rel, null);
      } catch (e: any) {
        out.set(rel, String(e?.message ?? e).split("\n")[0]);
      }
    }
  }
  return out;
}

const RESULTS = sweep();
const errors = [...RESULTS].filter(([, e]) => e !== null) as Array<[string, string]>;

/**
 * The scripts that raise, and the reason each one is expected to.
 *
 * A regular expression per file, so a file that starts failing for a DIFFERENT
 * reason fails this suite too — the pin is on the cause, not on the count.
 */
const EXPECTED: Record<string, RegExp> = {
  // ── The script's own error ────────────────────────────────────────────────
  // Out-of-bounds and shape demos. Each says so in its own source or title.
  "v4/v4-essential-arrays-21.pine": /array\.set: index 3 is out of bounds/,
  "v4/v4-essential-arrays-23.pine": /array\.push: expected an array, got na/,
  "v5/v5-language-arrays-29.pine":  /array\.set: index 3 is out of bounds/,
  "v5/v5-language-arrays-33.pine":  /array\.push: expected an array, got na/,
  // `input.int(0, "Array size")` defaults to an EMPTY array, and popping one is
  // an error on TradingView too. The page is about the loop being protected
  // from `for i = 0 to -1`, which it is.
  "v5/v5-language-arrays-31.pine":  /array\.pop: array is empty/,
  "v5/v5-language-matrices-36.pine": /matrix\.set: row 2 is out of bounds/,
  "v5/v5-language-matrices-37.pine": /add_col: column has 3 elements, matrix has 2 rows/,
  "v5/v5-language-matrices-39.pine": /matrix is too large/,
  "v5/v5-language-matrices-40.pine": /submatrix: row range 2\.\.2 is invalid/,
  "v5/v5-language-matrices-41.pine": /matrix\.sum: shapes differ/,
  "v5/v5-language-matrices-42.pine": /matrix\.mult: cannot multiply/,
  "v5/v5-language-matrices-43.pine": /matrix\.det: matrix is not square/,
  // Explicit `runtime.error()` calls, reached because this dataset is daily and
  // the script wants something else, or because its default inputs say so.
  "v5/v5-concepts-repainting-05.pine": /smaller than the chart's timeframe/,
  "v5/v5-concepts-strategies-19.pine": /entryStartTime < exitCallTime < entryEndTime/,
  "v5/v5-concepts-strategies-20.pine": /entryStartTime < exitCallTime < entryEndTime/,
  "v5/v5-concepts-other-timeframes-and-data-13.pine": /smaller than the chart's timeframe/,
  "v5/v5-faq-other-data-and-timeframes-03.pine": /Chart timeframe must be less than 1D/,

  // ── Host data not supplied ────────────────────────────────────────────────
  "v5/v5-concepts-other-timeframes-and-data-01.pine": /request\.financial: no data was supplied/,
  // `-03` used to be here. It passes `ignore_invalid_symbol = true`, which the
  // signature did not name, so the argument was dropped and the request raised
  // where the script had said it would rather have `na`.
  "v5/v5-concepts-other-timeframes-and-data-40.pine": /request\.currency_rate: no data was supplied/,
  "v5/v5-concepts-other-timeframes-and-data-41.pine": /request\.dividends: no data was supplied/,
  "v5/v5-concepts-other-timeframes-and-data-42.pine": /request\.quandl: no data was supplied/,
  "v5/v5-concepts-other-timeframes-and-data-43.pine": /request\.financial: no data was supplied/,
  "v5/v5-concepts-other-timeframes-and-data-44.pine": /request\.financial: no data was supplied/,
  "v5/v5-concepts-other-timeframes-and-data-45.pine": /request\.economic: no data was supplied/,
  "v5/v5-concepts-other-timeframes-and-data-46.pine": /request\.seed: no data was supplied/,
  "v5/v5-concepts-strategies-35.pine": /request\.currency_rate: no data was supplied/,
  "v5/v5-faq-data-structures-05.pine": /request\.earnings: no data was supplied/,
  "v5/v5-release-notes-00.pine": /request\.financial: no data was supplied/,

  // ── A deliberate refusal ──────────────────────────────────────────────────
  "v4/v4-annotations-price-levels-hline-00.pine": /'accdist' is a Pine built-in that OpenPineScript does not implement/,
  "v4/v4-essential-non-standard-chart-types-data-03.pine": /^renko: /,
  "v4/v4-essential-non-standard-chart-types-data-04.pine": /^linebreak: /,
  "v4/v4-essential-non-standard-chart-types-data-05.pine": /^kagi: /,
  "v4/v4-essential-non-standard-chart-types-data-06.pine": /^pointfigure: /,
  "v5/v5-concepts-non-standard-charts-data-03.pine": /^renko: /,
  "v5/v5-concepts-non-standard-charts-data-04.pine": /^linebreak: /,
  "v5/v5-concepts-non-standard-charts-data-05.pine": /^linebreak: /,
  "v5/v5-concepts-non-standard-charts-data-06.pine": /^pointfigure: /,
  "v5/v5-concepts-other-timeframes-and-data-35.pine": /^renko: /,
};

describe("the corpus runs", () => {
  it("has scripts to run at all (guards every case below)", () => {
    expect(RESULTS.size).toBeGreaterThan(700);
  });

  it("nothing raises a ReferenceError", () => {
    // A valid Pine script producing a bare `opsv2_<name> is not defined` is
    // always an engine bug. This was once the largest failure class, 45 files.
    expect(errors.filter(([, m]) => /is not defined/.test(m))).toEqual([]);
  });

  it("nothing emits JavaScript that does not parse", () => {
    expect(errors.filter(([, m]) => /SyntaxError|Unexpected token/.test(m))).toEqual([]);
  });

  it("the set of scripts that raise is exactly the pinned set", () => {
    expect(errors.map(([f]) => f).sort()).toEqual(Object.keys(EXPECTED).sort());
  });
});

describe("each one raises for the reason it is pinned for", () => {
  for (const [file, pattern] of Object.entries(EXPECTED)) {
    it(file, () => {
      const message = RESULTS.get(file);
      expect(message, `${file} no longer raises`).not.toBeNull();
      expect(message).toMatch(pattern);
    });
  }
});
