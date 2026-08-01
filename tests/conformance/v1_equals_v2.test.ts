/**
 * v1 ≡ v2 equivalence.
 *
 * TradingView's v2 migration guide states:
 *
 *   "Pine Script version 2 is fully backwards compatible with version 1. As a
 *    result, all v1 scripts can be converted to v2 by adding the //@version=2
 *    annotation to them."
 *
 * So v1 and v2 must be the SAME language. This suite is the executable form of
 * that claim, and it is what makes the v1 target essentially free. If a future
 * change makes the two profiles diverge, it fails here.
 *
 * Two distinct assertions:
 *
 *  1. SAME SOURCE, BOTH PROFILES → byte-identical JavaScript. This isolates the
 *     language rules from everything else.
 *  2. REMOVING THE ANNOTATION shifts source lines, and call-site IDs embed line
 *     numbers (`sma@L4:C8`), so the output legitimately differs — but only in
 *     those line numbers. Asserted after normalising them away.
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { attempt, stripVersionAnnotation, withoutVersion } from "../helpers/transpileAs";

const CORPORA = [
  { label: "validation", dir: path.resolve(__dirname, "../../validation") },
  { label: "parser fixture", dir: path.resolve(__dirname, "../v2/parser/fixtures") },
  { label: "lexer fixture", dir: path.resolve(__dirname, "../v2/lexer/fixtures") },
].map(c => ({
  ...c,
  files: fs.existsSync(c.dir)
    ? fs.readdirSync(c.dir).filter(f => f.endsWith(".pine")).sort()
    : [],
}));

/** Erase call-site line/column tags so two line-shifted emissions compare equal. */
function normaliseLocIds(js: string): string {
  return js.replace(/@L\d+:C\d+/g, "@L<n>:C<n>");
}

describe("v1 and v2 are the same language", () => {
  it("the corpus is not empty", () => {
    // A silently-empty corpus would make every assertion below vacuous.
    expect(CORPORA.reduce((n, c) => n + c.files.length, 0)).toBeGreaterThan(20);
  });

  for (const corpus of CORPORA) {
    for (const file of corpus.files) {
      const source = () => fs.readFileSync(path.join(corpus.dir, file), "utf8");

      it(`${corpus.label}: ${file} — identical JS under both profiles`, () => {
        const src = source();
        const v1 = attempt(1, src);
        const v2 = attempt(2, src);

        // Both profiles must agree on whether the script is legal at all.
        expect(v1.ok, `v1 ok=${v1.ok} but v2 ok=${v2.ok}`).toBe(v2.ok);

        if (v1.ok && v2.ok) {
          expect(v1.js).toBe(v2.js);
        } else if (!v1.ok && !v2.ok) {
          // Rejected by both, for the same reason — modulo the version named.
          expect(withoutVersion(v1.message)).toBe(withoutVersion(v2.message));
        }
      });

      it(`${corpus.label}: ${file} — dropping the annotation changes only line numbers`, () => {
        const src = source();
        const annotated = attempt(2, src);
        const bare = attempt(1, stripVersionAnnotation(src));

        expect(bare.ok).toBe(annotated.ok);
        if (bare.ok && annotated.ok) {
          expect(normaliseLocIds(bare.js)).toBe(normaliseLocIds(annotated.js));
        }
      });
    }
  }
});

describe("hand-written v1/v2 samples", () => {
  const SAMPLES: [string, string][] = [
    ["bare plot", "plot(close)\n"],
    ["indicator call", "len = 14\nplot(sma(close, len))\n"],
    ["for-loop accumulator", "sum = 0\nfor i = 0 to 5\n    sum := sum + i\nplot(sum)\n"],
    ["study directive", 'study("X")\nplot(close)\n'],
    ["user function", "f(x) => x + 1\nplot(f(close))\n"],
    ["na() guard", "y = na(close) ? 1 : 0\nplot(y)\n"],
    ["history operator", "y = close[2]\nplot(y)\n"],
    ["self-reference (legal in v1/v2)", "s = nz(s[1]) + close\nplot(s)\n"],
    ["bool arithmetic (legal in v1/v2)", "c = (close > open) + 1\nplot(c)\n"],
  ];

  for (const [label, src] of SAMPLES) {
    it(`${label}: identical under both profiles`, () => {
      const v1 = attempt(1, src);
      const v2 = attempt(2, src);
      expect(v1.ok).toBe(v2.ok);
      if (v1.ok && v2.ok) expect(v1.js).toBe(v2.js);
      else if (!v1.ok && !v2.ok) {
        expect(withoutVersion(v1.message)).toBe(withoutVersion(v2.message));
      }
    });
  }
});
