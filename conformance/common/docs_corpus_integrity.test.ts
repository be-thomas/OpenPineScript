/**
 * Integrity of the vendored TradingView documentation corpus.
 *
 * `examples/<version>/tradingview-docs/` holds 763 scripts lifted byte-for-byte
 * out of TradingView's own manual, and `scripts/common/fetch-doc-examples.mjs`
 * proves that byte-identity by re-downloading every page and comparing SHA-256
 * digests. What it cannot prove is that a vendored file is VALID PINE — and a
 * handful are not, because the published page is not.
 *
 * That distinction matters to how this repo reads its own numbers. "689 of 763
 * compile" is a statement about the engine only if the other 74 are things the
 * engine ought to compile. A file that TradingView itself could not run is not
 * evidence of a gap here, and without a test it would sit in the failure column
 * forever, quietly inflating the size of the work left.
 *
 * So the known-broken files are PINNED. Adding one requires saying why; a file
 * silently joining the list fails this suite.
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = path.resolve(__dirname, "../..");
const EXAMPLES = path.join(ROOT, "examples");

/** Every vendored script, as `v5/name.pine`. */
function corpusFiles(): string[] {
  const out: string[] = [];
  for (const version of ["v1", "v2", "v3", "v4", "v5"]) {
    const dir = path.join(EXAMPLES, version, "tradingview-docs");
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter(n => n.endsWith(".pine")).sort()) {
      out.push(`${version}/${f}`);
    }
  }
  return out;
}

const read = (rel: string) =>
  fs.readFileSync(path.join(EXAMPLES, rel.split("/")[0], "tradingview-docs", rel.split("/")[1]), "utf8");

/**
 * Does a double-quoted string literal in this file span a newline?
 *
 * Pine has no such literal. Multi-line strings arrived in April 2026 and are
 * written with THREE pairs of quotes — "A multiline string is a literal
 * "string" value enclosed by three pairs of quotation marks (e.g., `"""..."""`)
 * or apostrophes" — so a bare `"` left open at end of line is a broken script,
 * not a language feature this engine is missing.
 */
function hasUnterminatedString(source: string): boolean {
  let open = false;
  let seen = false;
  for (const line of source.split("\n")) {
    // Drop escape pairs first, so `\"` inside a string is not counted and
    // `\\` at the end of one does not swallow the closing quote.
    const quotes = (line.replace(/\\./g, "").match(/"/g) ?? []).length;
    if (quotes % 2 === 1) {
      if (open) open = false;
      else { open = true; seen = true; }
    }
  }
  return seen;
}

/**
 * Files whose PUBLISHED source is not valid Pine.
 *
 * Every one is a long `str.format` mask that TradingView's page ships with a
 * newline inside the quotes:
 *
 *     "time (GMT): {0, time, yyyy-MM-dd'T'HH:mm:ss}\nhighestClose: {1, number, #.####}
 *      \npercentRank: {2, number, #.##}%\nbarsSinceHigh: {3, number, integer}\nisLow: {4}",
 *
 * This was checked against the raw HTML rather than a rendered view, because a
 * markdown conversion of the page re-joins the line and hides it. The
 * `<div class="pine-colorizer">` block itself contains
 *
 *     ...{1, number, #.####}\n     \\npercentRank...
 *
 * — a real newline (`\n`) between two escaped ones (`\\n`). So the wrap is in
 * what TradingView publishes, not in this repo's scrape, and the vendored file
 * is a faithful copy of a script that would not compile on TradingView either.
 *
 * Left in the corpus rather than deleted or repaired: repairing it would break
 * the byte-identity that `fetch-doc-examples.mjs verify` exists to check, and
 * deleting it would quietly shrink the denominator.
 */
const PUBLISHED_BROKEN: readonly string[] = [
  "v5/v5-concepts-time-00.pine",
  "v5/v5-concepts-time-24.pine",
  "v5/v5-faq-indicators-00.pine",
  "v5/v5-writing-debugging-25.pine",
  "v5/v5-writing-debugging-26.pine",
  "v5/v5-writing-debugging-28.pine",
  "v5/v5-writing-debugging-32.pine",
  "v5/v5-writing-debugging-33.pine",
  "v5/v5-writing-debugging-37.pine",
  "v5/v5-writing-debugging-41.pine",
];

/**
 * Blocks that are DOCUMENTATION rather than script.
 *
 * `fetch-doc-examples.mjs` keeps a code block only when it opens with a
 * `//@version` annotation and contains a declaration statement, which is a good
 * filter and not a perfect one. Six blocks pass it and are still not runnable
 * Pine, in three shapes:
 *
 *   ELLIPSIS     `s3, ..., s128` and a bare `...` line — a sketch standing in
 *                for 128 lines, and a library template's elided body.
 *   APPENDED     a real script with prose or a reStructuredText `.. image::`
 *                directive left in the same block by the page author.
 *
 * plus two the shapes above cannot see, which are therefore NAMED below.
 *
 * ── Why there is no `<metavariable>` rule ───────────────────────────────────
 *
 * The obvious one — an angle-bracketed placeholder like `<UDT_identifier>` —
 * cannot be told from v5's TYPE ARGUMENTS. `array.new<float>(0)` and
 * `map.new<string, int>()` are ordinary code and match any such pattern, and a
 * first draft of this rule swept up 129 perfectly good scripts. The library
 * template is caught by its elided body instead.
 */
function isDocumentationRatherThanScript(source: string): boolean {
  return source.split("\n").some(line => {
    const t = line.trim();
    return /^\.\.\s+\w+::/.test(t)                    // reStructuredText directive
        || /^\.\.\.$/.test(t)                          // an elided body
        || /,\s*\.\.\.\s*,/.test(t);                    // an elided argument list
  });
}

/**
 * Not runnable, and not detectable by shape.
 *
 * `v5-error-messages-06` is invalid ON PURPOSE: the page is about the message a
 * stray indent produces, so a version that compiled would defeat the example. A
 * wrongly indented script looks exactly like a wrongly indented script, so
 * nothing structural can separate it from a bug.
 *
 * `v3/v5-release-notes-19` is a complete v3 strategy with three sentences of
 * release-note PROSE appended inside the same code block. Prose is not a shape
 * either — it is just text the parser reaches after the script ends.
 */
const NOT_DETECTABLE_BY_SHAPE: readonly string[] = [
  "v3/v5-release-notes-19.pine",
  "v5/v5-error-messages-06.pine",
  // Indentation the published source gets wrong by accident rather than on
  // purpose: `highest()`'s `for` body opens at column 12 and its next line
  // dedents to 8, which is not an open level. A stray indent is a stray indent
  // however it got there, so nothing structural separates this from the case
  // above — or from a real bug.
  "v5/v5-release-notes-07.pine",
];

describe("blocks that are documentation rather than script", () => {
  it("the detector fires on the shapes it is for (guards the case below)", () => {
    expect(isDocumentationRatherThanScript(".. image:: x.png\n")).toBe(true);
    expect(isDocumentationRatherThanScript("    ...\n")).toBe(true);
    expect(isDocumentationRatherThanScript("[v1, v2, ..., v128] = f()\n")).toBe(true);
    expect(isDocumentationRatherThanScript("plot(close)\n")).toBe(false);
    // The rule that was tried and withdrawn: v5 type arguments are not
    // metavariables, and treating them as such swept up 129 real scripts.
    expect(isDocumentationRatherThanScript("m = map.new<string, int>()\n")).toBe(false);
  });

  it("none of them compiles, and that is not an engine gap", () => {
    const found = corpusFiles().filter(f => isDocumentationRatherThanScript(read(f)));
    // Named rather than counted, so a NEW one has to be looked at.
    expect(found.sort()).toEqual([
      "v4/v5-release-notes-16.pine",
      "v4/v5-release-notes-17.pine",
      "v5/v5-concepts-libraries-00.pine",
      "v5/v5-writing-limitations-06.pine",
    ]);
  });

  for (const file of NOT_DETECTABLE_BY_SHAPE) {
    it(`${file} is not runnable, and is still present`, () => {
      expect(fs.existsSync(
        path.join(EXAMPLES, file.split("/")[0], "tradingview-docs", file.split("/")[1]),
      )).toBe(true);
    });
  }
});

/**
 * Scripts that DO NOT COMPILE ON PURPOSE.
 *
 * Four vendored files are not evidence of a gap here, because refusing them is
 * the correct answer. Three are scope demonstrations whose pages exist to show
 * the error — `v5-language-loops-04` says so in a comment in its own source:
 * "This code causes a compilation error because these variables are not
 * accessible in this location." The fourth is a published typo: the script
 * declares `holidayColor` and then plots `c_holiday`, which is nowhere in the
 * file.
 *
 * Pinned here so they stay in the failure column with a reason attached. That
 * the ENGINE gives TradingView's own diagnostic for each of the three scope
 * demos is asserted where that rule lives — tests/v1/transpiler/local_scope.ts.
 */
const REFUSED_ON_PURPOSE: readonly string[] = [
  "v5/v5-concepts-colors-04.pine",   // plots `c_holiday`; the variable is `holidayColor`
  "v5/v5-faq-programming-00.pine",   // reads an `if`-local from global scope
  "v5/v5-faq-programming-02.pine",   // reads a nested block's local from its parent
  "v5/v5-language-loops-04.pine",    // reads a `for`-local after the loop
  // A different rule, the same intent. TradingView's comment on the offending
  // line is "Causes compilation error since the scope count is now 602"; the
  // engine refuses it one rule earlier, because `x` is mutable and mutable
  // variables cannot be passed to `request.security`. Both are real Pine rules
  // and the script compiles under neither.
  "v5/v5-writing-limitations-10.pine",
];

describe("scripts that do not compile on purpose", () => {
  for (const file of REFUSED_ON_PURPOSE) {
    it(`${file} still exists — a pin that names nothing is not a pin`, () => {
      expect(fs.existsSync(
        path.join(EXAMPLES, file.split("/")[0], "tradingview-docs", file.split("/")[1]),
      )).toBe(true);
    });
  }

  it("the limitations demo says so in its own source too", () => {
    expect(read("v5/v5-writing-limitations-10.pine"))
      .toMatch(/Causes compilation error/);
  });

  it("the loops demo says so in its own source", () => {
    expect(read("v5/v5-language-loops-04.pine"))
      .toMatch(/This code causes a compilation error/);
  });

  it("the colors demo really does plot a name it never declares", () => {
    const src = read("v5/v5-concepts-colors-04.pine");
    expect(src).toMatch(/c_holiday/);
    expect(src).not.toMatch(/c_holiday\s*=/);
  });
});

describe("the corpus is there at all", () => {
  it("has the files this suite is about (guards every case below)", () => {
    expect(corpusFiles().length).toBeGreaterThan(700);
  });
});

describe("scripts whose published source is not valid Pine", () => {
  it("is exactly the pinned set — no more, no fewer", () => {
    const found = corpusFiles().filter(f => hasUnterminatedString(read(f)));
    expect(found.sort()).toEqual([...PUBLISHED_BROKEN].sort());
  });

  it("the detector actually fires (guards the case above)", () => {
    expect(hasUnterminatedString('x = "abc"\n')).toBe(false);
    expect(hasUnterminatedString('x = "ab\ncd"\n')).toBe(true);
    // An escaped quote inside a string must not be miscounted.
    expect(hasUnterminatedString('x = "a\\"b"\n')).toBe(false);
  });

  for (const file of PUBLISHED_BROKEN) {
    it(`${file} still exists — a pin that names nothing is not a pin`, () => {
      expect(fs.existsSync(
        path.join(EXAMPLES, file.split("/")[0], "tradingview-docs", file.split("/")[1]),
      )).toBe(true);
    });
  }
});
