/**
 * v1 ≡ v2 equivalence.
 *
 * TradingView's v2 migration guide states:
 *
 *   "Pine Script version 2 is fully backwards compatible with version 1. As a
 *    result, all v1 scripts can be converted to v2 by adding the //@version=2
 *    annotation to them."
 *
 * This suite is the executable form of that claim.
 *
 * ── Why the inventory below exists ──────────────────────────────────────────
 *
 * An earlier version of this file compared the two profiles and, when BOTH
 * rejected a script, asserted `withoutVersion(a) === withoutVersion(b)`. That
 * is a tautology: the only difference between those two strings is the version
 * token `withoutVersion()` strips. 16 of 37 corpus files took that branch, so
 * ~43% of the "equivalence" evidence proved nothing — the same failure class as
 * the `diff > EPSILON` bug this branch fixes elsewhere.
 *
 * So every file is now classified up front. A file that is expected to
 * transpile MUST reach the byte-equality assertion, and a file that is expected
 * to fail MUST fail for the recorded reason. If the corpus regresses — or if a
 * parser gap gets fixed — this file fails and the inventory has to be updated.
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { attempt, stripVersionAnnotation } from "../helpers/transpileAs";

/**
 * Why a corpus file does not transpile.
 *
 * `restriction` — correctly rejected by a v1/v2 language rule. The fixture
 *                 exists to exercise that rule. Working as intended.
 * `parser-gap`  — a real Pine v2 script the engine cannot parse. Pre-existing
 *                 engine limitation, tracked, NOT introduced by this work.
 */
type FailureKind = "restriction" | "parser-gap";

const EXPECTED_FAILURES: Record<string, FailureKind> = {
  // Real-world v2 strategies the parser cannot yet handle.
  "validation/Gold_Strategy_By_Trading_Public_School.pine": "parser-gap",
  "validation/KDJ_indicator.pine": "parser-gap",
  "validation/Long_only_EMA_CROSS_8-50-200_Backtest.pine": "parser-gap",
  "validation/RSI_OverTrend_Strategy.pine": "parser-gap",
  "validation/VIX_bonds_strategy.pine": "parser-gap",
  "validation/gap_down_reversal_strategy.pine": "parser-gap",
  "validation/swing_trade.pine": "parser-gap",

  // Lexer fixtures: token-stream probes, not necessarily whole valid programs.
  "tests/v2/lexer/fixtures/calls_and_brackets.pine": "parser-gap",
  "tests/v2/lexer/fixtures/directives_and_keywords.pine": "parser-gap",
  "tests/v2/lexer/fixtures/multiline_indent.pine": "parser-gap",
  "tests/v2/lexer/fixtures/operators.pine": "parser-gap",

  // Correctly rejected by a v1/v2 rule.
  "tests/v2/lexer/fixtures/var_assign_if.pine": "restriction",     // ':=' at global scope
  "tests/v2/parser/fixtures/array_literal.pine": "restriction",    // user fn tuple return
  "tests/v2/parser/fixtures/break_continue.pine": "restriction",   // ':=' at global scope
  "tests/v2/parser/fixtures/destructuring.pine": "restriction",    // user fn tuple return
  "tests/v2/parser/fixtures/if_then.pine": "restriction",          // ':=' at global scope
};

const ROOT = path.resolve(__dirname, "../..");
const CORPUS_DIRS = ["validation", "tests/v2/parser/fixtures", "tests/v2/lexer/fixtures"];

const FILES: string[] = CORPUS_DIRS.flatMap(dir => {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs).filter(f => f.endsWith(".pine")).sort()
    .map(f => `${dir}/${f}`);
});

const TRANSPILABLE = FILES.filter(f => !(f in EXPECTED_FAILURES));

/** Erase call-site line/column tags so two line-shifted emissions compare equal. */
function normaliseLocIds(js: string): string {
  return js.replace(/@L\d+:C\d+/g, "@L<n>:C<n>");
}

const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8");

describe("corpus inventory", () => {
  it("has a corpus to test", () => {
    expect(FILES.length).toBeGreaterThan(30);
  });

  it("a real majority of the corpus actually transpiles", () => {
    // The floor that stops this suite going quietly vacuous again. If parsing
    // regresses, files drop out of TRANSPILABLE and this fails loudly.
    expect(TRANSPILABLE.length).toBeGreaterThanOrEqual(21);
    expect(TRANSPILABLE.length / FILES.length).toBeGreaterThan(0.5);
  });

  it("has no stale entries — every expected failure still exists", () => {
    const missing = Object.keys(EXPECTED_FAILURES).filter(f => !FILES.includes(f));
    expect(missing, `listed but not found on disk:\n${missing.join("\n")}`).toEqual([]);
  });
});

describe("v1 and v2 are the same language", () => {
  for (const file of TRANSPILABLE) {
    it(`${file} — identical JS under both profiles`, () => {
      const src = read(file);
      const v1 = attempt(1, src);
      const v2 = attempt(2, src);

      // Both MUST succeed. A file listed as transpilable that stops
      // transpiling is a regression, not a reason to skip the comparison.
      expect(v1.ok, v1.ok ? "" : `v1 rejected: ${(v1 as any).message}`).toBe(true);
      expect(v2.ok, v2.ok ? "" : `v2 rejected: ${(v2 as any).message}`).toBe(true);

      if (v1.ok && v2.ok) expect(v1.js).toBe(v2.js);
    });

    it(`${file} — dropping the annotation changes only line numbers`, () => {
      const src = read(file);
      const annotated = attempt(2, src);
      const bare = attempt(1, stripVersionAnnotation(src));

      expect(bare.ok).toBe(true);
      expect(annotated.ok).toBe(true);
      if (bare.ok && annotated.ok) {
        expect(normaliseLocIds(bare.js)).toBe(normaliseLocIds(annotated.js));
      }
    });
  }
});

describe("expected corpus failures", () => {
  for (const [file, kind] of Object.entries(EXPECTED_FAILURES)) {
    it(`${file} — fails identically under both profiles (${kind})`, () => {
      const src = read(file);
      const v1 = attempt(1, src);
      const v2 = attempt(2, src);

      expect(v1.ok).toBe(false);
      expect(v2.ok).toBe(false);

      if (!v1.ok && !v2.ok) {
        // Assert the CLASS of failure, not string equality between two messages
        // that differ only by the version token — that comparison proved nothing.
        const expectedShape = kind === "restriction"
          ? /Pine Script v\d Error at /
          : /Pine Script v\d: parsing failed with \d+ error\(s\)/;
        expect(v1.message).toMatch(expectedShape);
        expect(v2.message).toMatch(expectedShape);
      }
    });
  }
});
