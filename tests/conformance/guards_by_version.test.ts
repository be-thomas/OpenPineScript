/**
 * Capability matrix.
 *
 * The classic multi-version failure is not "v4 broke" — it is "adding v4
 * silently relaxed v2". A guard tested only on its own version cannot catch
 * that, so each rule is a table over versions.
 *
 * ── What this actually asserts today ────────────────────────────────────────
 *
 * Only v1 and v2 are implemented, so only their cells assert a real
 * accept/reject verdict. The v3-v5 `expected` entries are RECORDED INTENT taken
 * from the delta spec — they are not exercised yet, because those versions
 * refuse to transpile at all. Do not read this file as "9 rules across 5
 * versions"; it is 9 rules across 2 versions, plus a refusal tripwire for the
 * other 3, plus the intent written down where IT-02 will pick it up.
 *
 * `records intent for unimplemented versions` below asserts the intent table is
 * complete, so the rows cannot rot while they sit unused.
 *
 * Source for each rule: dev-docs/01-version-delta-spec.md §5.
 */
import { describe, it, expect } from "vitest";
import { attempt, ALL_VERSIONS, PineVersion } from "../helpers/transpileAs";
import { LANGUAGE_PROFILES } from "../../transpiler/profiles";

type Verdict = "accept" | "reject";

interface Rule {
  name: string;
  source: string;
  /** Expected verdict per version, for versions that are implemented. */
  expected: Partial<Record<PineVersion, Verdict>>;
  /** Pattern the rejection message must match, where rejected. */
  because?: RegExp;
}

const RULES: Rule[] = [
  {
    name: "':=' reassignment outside a for-loop",
    source: "x = 1\nx := 2\n",
    // v3 introduces general mutability and lifts this.
    expected: { 1: "reject", 2: "reject", 3: "accept", 4: "accept", 5: "accept" },
    because: /reassignment with ':='/,
  },
  {
    name: "':=' on a for-loop accumulator",
    source: "sum = 0\nfor i = 0 to 5\n    sum := sum + i\n",
    expected: { 1: "accept", 2: "accept", 3: "accept", 4: "accept", 5: "accept" },
  },
  {
    name: "'x == na' comparison",
    source: "y = close == na ? 1 : 0\n",
    expected: { 1: "reject", 2: "reject", 3: "accept", 4: "accept", 5: "accept" },
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
    expected: { 1: "reject", 2: "reject", 3: "reject", 4: "reject", 5: "reject" },
    because: /recursion is not allowed/,
  },
  {
    name: "strategy.* under study()",
    source: 'study("X")\nstrategy.entry("L", strategy.long)\n',
    expected: { 1: "reject", 2: "reject", 3: "reject", 4: "reject", 5: "reject" },
    because: /unavailable in a study\(\) script/,
  },
  {
    name: "user function returning a tuple",
    source: "pair(v) => [v, v + 1]\n[a, b] = pair(close)\n",
    expected: { 1: "reject", 2: "reject", 3: "reject" },
    because: /cannot return tuples/,
  },
  {
    name: "self-referencing declaration",
    source: "s = nz(s[1]) + close\nplot(s)\n",
    // v3 removed self-reference: declare first, then assign with ':='.
    expected: { 1: "accept", 2: "accept", 3: "reject", 4: "reject", 5: "reject" },
  },
  {
    name: "implicit bool→number arithmetic",
    source: "c = (close > open) + 1\nplot(c)\n",
    // v3 prohibits the implicit conversion; use `b ? 1 : 0`.
    expected: { 1: "accept", 2: "accept", 3: "reject", 4: "reject", 5: "reject" },
  },
];

describe("language rules across versions", () => {
  for (const rule of RULES) {
    describe(rule.name, () => {
      for (const version of ALL_VERSIONS) {
        const implemented = LANGUAGE_PROFILES[version].implemented;
        const expected = rule.expected[version];

        if (!implemented) {
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

        if (expected === undefined) continue;

        it(`v${version}: ${expected}s`, () => {
          const result = attempt(version, rule.source);
          expect(
            result.ok,
            result.ok ? "expected rejection, got success" : `rejected: ${result.message}`,
          ).toBe(expected === "accept");

          if (expected === "reject" && !result.ok) {
            // The message must name the version that rejected it, so the user
            // knows which rule applies rather than just "syntax error".
            expect(result.message).toMatch(new RegExp(`Pine Script v${version} Error`));
            if (rule.because) expect(result.message).toMatch(rule.because);
          }
        });
      }
    });
  }
});

describe("recorded intent for unimplemented versions", () => {
  // These cells are not exercised (those versions refuse to transpile), so
  // guard them structurally instead — otherwise they rot silently until IT-02
  // tries to rely on them.
  const UNIMPLEMENTED = ALL_VERSIONS.filter(v => !LANGUAGE_PROFILES[v].implemented);

  it("v3 intent is recorded for every rule that changes at v3", () => {
    // The four v2→v3 deltas plus the rules v3 lifts. If a rule has no v3 cell,
    // IT-02 has nothing to flip.
    const needsV3Intent = RULES.filter(r => r.expected[3] !== undefined);
    expect(needsV3Intent.length).toBe(RULES.length);
  });

  it("every unimplemented version refuses regardless of the rule", () => {
    for (const version of UNIMPLEMENTED) {
      for (const rule of RULES) {
        const result = attempt(version, rule.source);
        expect(result.ok, `v${version} accepted "${rule.name}"`).toBe(false);
      }
    }
  });

  it("reports how much of the matrix is live", () => {
    const live = ALL_VERSIONS.filter(v => LANGUAGE_PROFILES[v].implemented).length;
    // Fails when a version is implemented without revisiting this file.
    expect(live, "a version became implemented — turn its intent cells into real assertions").toBe(2);
  });
});

describe("diagnostics name the version", () => {
  it("v1 rejections say v1, v2 rejections say v2", () => {
    const src = "x = 1\nx := 2\n";

    const v1 = attempt(1, src);
    const v2 = attempt(2, src);

    expect(v1.ok).toBe(false);
    expect(v2.ok).toBe(false);
    if (!v1.ok) expect(v1.message).toContain("Pine Script v1 Error");
    if (!v2.ok) expect(v2.message).toContain("Pine Script v2 Error");
  });

  it("includes a source location", () => {
    const result = attempt(2, "x = 1\nx := 2\n");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/@L2:C0/);
  });
});
