/**
 * Capability matrix: every language rule asserted at EVERY version.
 *
 * The classic multi-version failure is not "v4 broke" — it is "adding v4
 * silently relaxed v2". A guard tested only on its own version cannot catch
 * that. Each rule below is therefore a table over all five versions, and the
 * rows for versions we have not built yet assert that the engine REFUSES the
 * script rather than guessing.
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
