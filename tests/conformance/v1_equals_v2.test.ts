/**
 * v1 ⊂ v2 — backwards compatibility, and the exact size of the delta.
 *
 * TradingView's v2 migration guide states:
 *
 *   "Pine Script version 2 is fully backwards compatible with version 1. As a
 *    result, all v1 scripts can be converted to v2 by adding the //@version=2
 *    annotation to them."
 *
 * This suite is the executable form of that claim. Note what it does and does
 * NOT say: every v1 script is a valid v2 script (⊂). It does not say the two
 * are the same language (≡).
 *
 * ── The one delta ───────────────────────────────────────────────────────────
 *
 * v2 introduced ':=' for for-loop accumulators; v1 has no such token. So the
 * corpus is partitioned:
 *
 *   sources WITHOUT ':='  → must emit BYTE-IDENTICAL JavaScript under both
 *   sources WITH    ':='  → must fail under v1 as a SYNTAX error, because v1's
 *                           grammar has never heard of the token
 *
 * The second half is what keeps the first half honest. Asserting only "these
 * agree" would stay green if ':=' leaked back into the v1 grammar; asserting
 * the delta pins its exact size at one feature.
 *
 * Placing ':=' at v2 rather than v1 is quoted from TradingView's v2 release
 * notes — see the sourcing note in grammar/PineV2Lexer.g4.
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
 * `restriction`    — correctly rejected by a v1/v2 language rule. The fixture
 *                    exists to exercise that rule. Working as intended.
 * `not-a-program`  — not valid Pine at all. TradingView rejects it too, so
 *                    rejecting it is correct parity, not a gap. Every entry
 *                    names the exact construct.
 * `parser-gap`     — a real Pine v2 script the engine cannot parse. A genuine
 *                    engine limitation. THIS CATEGORY IS NOW EMPTY.
 */
type FailureKind = "restriction" | "not-a-program" | "parser-gap";

const EXPECTED_FAILURES: Record<string, FailureKind> = {
  // ── Not valid Pine ────────────────────────────────────────────────────────
  //
  // These three are LEXER fixtures — deliberate token-stream probes consumed by
  // tests/v2/lexer/lexer.test.ts, where they do their job. They were previously
  // filed as "parser-gap", which read as an engine defect. They are not: each
  // contains a construct TradingView rejects as well.
  //
  //   operators.pine             `h = foo => 1` — Pine declares functions as
  //                              `name(params) => body`; there is no lambda
  //                              value, so '=>' cannot appear after '='.
  //   calls_and_brackets.pine    `e = [1, 2, 3]` — '[...]' is tuple
  //                              DESTRUCTURING on the left of '=', and an
  //                              options list inside a call argument. It is not
  //                              an expression; v2 has no array values at all.
  //   directives_and_keywords.pine  a bare line of reserved words
  //                              (`or and not if else for to by ...`), which is
  //                              a token list, not a statement.
  "tests/v2/lexer/fixtures/operators.pine": "not-a-program",
  "tests/v2/lexer/fixtures/calls_and_brackets.pine": "not-a-program",
  "tests/v2/lexer/fixtures/directives_and_keywords.pine": "not-a-program",

  // ── Correctly rejected by a v1/v2 rule ────────────────────────────────────
  //
  // ':=' assigns to "a variable that has already been defined" (TradingView
  // release notes, v2). Both of these assign to a name that is never declared,
  // which is TradingView's `Undeclared identifier` error.
  //
  // NOTE: these two were previously listed as "':=' at global scope", alongside
  // var_assign_if.pine, gap_down_reversal_strategy.pine and
  // VIX_bonds_strategy.pine. That rule was invented, not sourced — v2 places no
  // scope restriction on ':=' — and the other three now transpile. See the
  // sourcing note in transpiler/v2/ToJsVisitor.ts.
  "tests/v2/parser/fixtures/if_then.pine": "restriction",          // 'y' never declared
  "tests/v2/parser/fixtures/break_continue.pine": "restriction",   // 'x' never declared

  "tests/v2/parser/fixtures/array_literal.pine": "restriction",    // user fn tuple return
  "tests/v2/parser/fixtures/destructuring.pine": "restriction",    // user fn tuple return
};

const ROOT = path.resolve(__dirname, "../..");
const CORPUS_DIRS = ["validation", "tests/v2/parser/fixtures", "tests/v2/lexer/fixtures"];

const FILES: string[] = CORPUS_DIRS.flatMap(dir => {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs).filter(f => f.endsWith(".pine")).sort()
    .map(f => `${dir}/${f}`);
});

const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf8");

/**
 * Does this source use v2's reassignment operator?
 *
 * Matched on the raw text rather than by parsing, because the whole point is
 * that v1 CANNOT parse it. Guarded against the ternary `? a : b` — ':=' is only
 * ever the two characters together.
 */
function usesReassignment(src: string): boolean {
  return /:=/.test(src);
}

const CANDIDATES = FILES.filter(f => !(f in EXPECTED_FAILURES));

/** Sources both versions must transpile, byte-identically. */
const TRANSPILABLE = CANDIDATES.filter(f => !usesReassignment(read(f)));

/** Sources that exercise the single v1→v2 delta. */
const V2_ONLY = CANDIDATES.filter(f => usesReassignment(read(f)));

/** Erase call-site line/column tags so two line-shifted emissions compare equal. */
function normaliseLocIds(js: string): string {
  return js.replace(/@L\d+:C\d+/g, "@L<n>:C<n>");
}

describe("corpus inventory", () => {
  it("has a corpus to test", () => {
    expect(FILES.length).toBeGreaterThan(30);
  });

  it("a real majority of the corpus actually transpiles", () => {
    // The floor that stops this suite going quietly vacuous again. If parsing
    // regresses, files drop out of TRANSPILABLE and this fails loudly.
    expect(TRANSPILABLE.length).toBeGreaterThanOrEqual(18);
    expect(TRANSPILABLE.length / FILES.length).toBeGreaterThan(0.5);
  });

  it("the v1→v2 delta is actually exercised", () => {
    // Without this, every ':='-using file could silently vanish from the corpus
    // and the "v1 rejects ':='" half of the suite would assert nothing.
    expect(V2_ONLY.length).toBeGreaterThan(0);
  });

  it("has no stale entries — every expected failure still exists", () => {
    const missing = Object.keys(EXPECTED_FAILURES).filter(f => !FILES.includes(f));
    expect(missing, `listed but not found on disk:\n${missing.join("\n")}`).toEqual([]);
  });

  it("no real Pine script is left unparseable", () => {
    // The ratchet. `parser-gap` means "valid published Pine this engine cannot
    // read" — the only category here that is an admission of defeat. It is
    // empty, and adding to it should require a deliberate edit to this test
    // rather than a quiet line in the table above.
    const gaps = Object.entries(EXPECTED_FAILURES)
      .filter(([, kind]) => kind === "parser-gap")
      .map(([file]) => file);
    expect(gaps, `real scripts the parser cannot handle:\n${gaps.join("\n")}`).toEqual([]);
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

describe("the single v1 → v2 delta is ':='", () => {
  for (const file of V2_ONLY) {
    it(`${file} — v1 rejects ':=' as a syntax error`, () => {
      const v1 = attempt(1, read(file));

      expect(v1.ok, "v1 accepted ':=' — has the token leaked into PineV1Lexer.g4?").toBe(false);
      if (v1.ok) return;

      // Grammar-level, not guard-level. A "Pine Script v1 Error at @L..:C.."
      // here would mean v1 parses ':=' and rejects it afterwards, which is the
      // arrangement this architecture exists to avoid.
      expect(v1.message).toMatch(/^Pine Script v1: parsing failed/);
      expect(v1.message).not.toMatch(/Error at @L/);
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
        const SYNTAX = /Pine Script v\d: parsing failed with \d+ error\(s\)/;
        const GUARD = /Pine Script v\d Error at /;
        const shapeFor = kind === "restriction" ? GUARD : SYNTAX;

        // A ':='-using source cannot reach a v1 GUARD, because v1's grammar has
        // no such token — it fails one layer earlier than it does at v2. This is
        // the one place the two versions legitimately fail differently.
        expect(v1.message).toMatch(usesReassignment(src) ? SYNTAX : shapeFor);
        expect(v2.message).toMatch(shapeFor);
      }
    });
  }
});
