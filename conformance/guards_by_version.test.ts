/**
 * Capability matrix.
 *
 * The classic multi-version failure is not "v4 broke" — it is "adding v4
 * silently relaxed v2". A guard tested only on its own version cannot catch
 * that, so each rule is a table over versions.
 *
 * ── Three verdicts, not two ─────────────────────────────────────────────────
 *
 * Since each version has its own grammar, "rejected" is no longer one thing:
 *
 *   accept  transpiles
 *   guard   parses, then a visitor rule rejects it
 *           → "Pine Script vN Error at @L..:C..: ..."
 *   syntax  the version's GRAMMAR has no such construct — it never parses
 *           → "Pine Script vN: parsing failed with n error(s)"
 *
 * The distinction is the point of the hierarchy, so the matrix asserts it. v1
 * rejecting `x := 1` as a *syntax* error rather than a *guard* error is what
 * makes it a faithful v1: the token does not exist there, exactly as on
 * TradingView. A regression that reintroduced ':=' into the v1 grammar and
 * caught it with a guard would still "reject" — and this table would fail.
 *
 * ── What this actually asserts today ────────────────────────────────────────
 *
 * v1, v2 and v3 are implemented, so their cells assert real verdicts. The
 * v4-v5 `expected` entries are RECORDED INTENT from the delta spec — not
 * exercised, because those versions refuse to transpile at all.
 *
 * Source for each rule: dev-docs/01-version-delta-spec.md §5.
 */
import { describe, it, expect } from "vitest";
import {
  attempt,
  ALL_VERSIONS,
  IMPLEMENTED_VERSIONS,
  UNIMPLEMENTED_VERSIONS,
  PineVersion,
} from "../test-utils/transpileAs";

type Verdict = "accept" | "guard" | "syntax";

interface Rule {
  name: string;
  source: string;
  /** Expected verdict per version, for versions that are implemented. */
  expected: Partial<Record<PineVersion, Verdict>>;
  /** Pattern a `guard` rejection message must match. */
  because?: RegExp;
}

const RULES: Rule[] = [
  {
    name: "':=' reassignment at script scope",
    source: "x = 1\nx := 2\n",
    // v1 has no ASSIGN token at all (PineV1Lexer.g4), so this cannot parse.
    // v2 introduced ':=' with no scope restriction, and v3 changed nothing
    // about it. This row previously expected a v2 GUARD; see the sourcing note
    // in transpiler/v2/ToJsVisitor.ts for why that was wrong.
    expected: { 1: "syntax", 2: "accept", 3: "accept", 4: "accept", 5: "accept" },
  },
  {
    name: "':=' on a name that was never declared",
    source: "x := 2\n",
    // The rule ':=' actually has: assign only to "a variable that has already
    // been defined". Unchanged from v2 to v3.
    expected: { 1: "syntax", 2: "guard", 3: "guard" },
    because: /'x' is not declared/,
  },
  {
    name: "':=' on a for-loop accumulator",
    source: "sum = 0\nfor i = 0 to 5\n    sum := sum + i\n",
    expected: { 1: "syntax", 2: "accept", 3: "accept", 4: "accept", 5: "accept" },
  },
  {
    name: "'x == na' comparison",
    source: "y = close == na ? 1 : 0\n",
    // The v2→v3 guide documents exactly five changes and this is not one, so
    // v3 keeps the v1/v2 behaviour. v4/v5 unresearched.
    expected: { 1: "guard", 2: "guard", 3: "guard" },
    because: /compare to 'na'/,
  },
  {
    name: "na(x) function",
    source: "y = na(close) ? 1 : 0\n",
    expected: { 1: "accept", 2: "accept", 3: "accept", 4: "accept", 5: "accept" },
  },
  {
    name: "direct self-recursion",
    source: "f(x) => f(x)\n",
    // Recursion is banned in every Pine version.
    expected: { 1: "guard", 2: "guard", 3: "guard", 4: "guard", 5: "guard" },
    because: /recursion is not allowed/,
  },
  {
    name: "strategy.* under study()",
    source: 'study("X")\nstrategy.entry("L", strategy.long)\n',
    expected: { 1: "guard", 2: "guard", 3: "guard", 4: "guard", 5: "guard" },
    because: /unavailable in a study\(\) script/,
  },
  {
    name: "user function returning a tuple",
    source: "pair(v) => [v, v + 1]\n[a, b] = pair(close)\n",
    expected: { 1: "guard", 2: "guard", 3: "guard" },
    because: /cannot return tuples/,
  },
  {
    name: "self-referencing declaration",
    source: "s = nz(s[1]) + close\nplot(s)\n",
    // v3 removed self-reference: declare first, then assign with ':='.
    expected: { 1: "accept", 2: "accept", 3: "guard", 4: "guard", 5: "guard" },
    because: /cannot reference itself/,
  },
  {
    name: "implicit bool→number arithmetic",
    source: "c = (close > open) + 1\nplot(c)\n",
    // v3 prohibits the implicit conversion; use `b ? 1 : 0`.
    expected: { 1: "accept", 2: "accept", 3: "guard", 4: "guard", 5: "guard" },
    because: /cannot use a bool as an operand/,
  },
];

describe("language rules across versions", () => {
  for (const rule of RULES) {
    describe(rule.name, () => {
      for (const version of ALL_VERSIONS) {
        if (!IMPLEMENTED_VERSIONS.includes(version)) {
          it(`v${version}: refused (version not implemented)`, () => {
            const result = attempt(version, rule.source);
            expect(result.ok).toBe(false);
            if (!result.ok) {
              expect(result.message).toMatch(
                new RegExp(`Pine Script v${version} support is not yet implemented`),
              );
            }
          });
          continue;
        }

        const expected = rule.expected[version];
        if (expected === undefined) continue;

        it(`v${version}: ${expected}`, () => {
          const result = attempt(version, rule.source);

          if (expected === "accept") {
            expect(result.ok, result.ok ? "" : `rejected: ${result.message}`).toBe(true);
            return;
          }

          expect(result.ok, "expected rejection, got success").toBe(false);
          if (result.ok) return;

          if (expected === "syntax") {
            // The construct does not exist in this version's grammar. Asserted
            // positively AND negatively: a guard-shaped message here would mean
            // the token leaked back into the grammar.
            expect(
              result.message,
              `expected a grammar-level rejection, got: ${result.message}`,
            ).toMatch(new RegExp(`^Pine Script v${version}: parsing failed`));
            expect(result.message).not.toMatch(/Error at @L/);
            return;
          }

          // expected === "guard": the message must name the version that
          // rejected it, so the user knows which rule applies.
          expect(result.message).toMatch(new RegExp(`Pine Script v${version} Error`));
          if (rule.because) expect(result.message).toMatch(rule.because);
        });
      }
    });
  }
});

describe("recorded intent for unimplemented versions", () => {
  // These cells are not exercised (those versions refuse to transpile), so
  // guard them structurally instead — otherwise they rot silently until the
  // v4 work tries to rely on them.
  it("every unimplemented version refuses regardless of the rule", () => {
    for (const version of UNIMPLEMENTED_VERSIONS) {
      for (const rule of RULES) {
        const result = attempt(version, rule.source);
        expect(result.ok, `v${version} accepted "${rule.name}"`).toBe(false);
      }
    }
  });

  it("reports how much of the matrix is live", () => {
    // Fails when a version is implemented without revisiting this file.
    expect(
      IMPLEMENTED_VERSIONS.length,
      "a version became implemented — turn its intent cells into real assertions",
    ).toBe(4);
  });
});

describe("diagnostics name the version", () => {
  it("v1 rejections say v1, v2 rejections say v2", () => {
    // A rule every implemented version shares, so the only difference in the
    // message is the version it names.
    const src = "y = close == na ? 1 : 0\n";

    for (const version of IMPLEMENTED_VERSIONS) {
      const result = attempt(version, src);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.message).toContain(`Pine Script v${version} Error`);
    }
  });

  it("includes a source location", () => {
    const result = attempt(2, "y = 1\nx := 2\n");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/@L2:C0/);
  });
});
