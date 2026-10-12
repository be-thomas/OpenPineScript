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
import { compileScript } from "../../transpiler/common";

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
 * Does a string literal in this file span a code line?
 *
 * It may. The manual's Strings page documents the wrap as a real, if deprecated,
 * rule — "programmers can use line wrapping to define single-line literal
 * strings across multiple code lines, where each wrapped line has an
 * indentation of one or more spaces" — and the ten corpus files that do it are
 * therefore ordinary Pine, not published breakage.
 *
 * ── The pin this replaced ───────────────────────────────────────────────────
 *
 * These ten were listed here as PUBLISHED_BROKEN, on the reading that Pine has
 * no multi-line string and that the newline visible in the raw HTML was
 * TradingView shipping a script it could not run either. The raw HTML was read
 * correctly; the conclusion from it was wrong. Three separate pages doing the
 * same thing should have been the tell — a typo does not repeat itself in
 * `str.format`, `log.info` and a `const string` on three unrelated pages.
 *
 * So the detector is kept and its verdict inverted: these files must COMPILE.
 * The rule itself is tested where it lives, in
 * tests/v1/transpiler/wrapped_strings.test.ts.
 */
function hasWrappedString(source: string): boolean {
  let seen = false;
  for (const line of source.split("\n")) {
    // Drop escape pairs first, so `\"` inside a string is not counted and
    // `\\` at the end of one does not swallow the closing quote.
    const quotes = (line.replace(/\\./g, "").match(/"/g) ?? []).length;
    if (quotes % 2 === 1) seen = true;
  }
  return seen;
}

/** The files that wrap a string literal. Named, so a new one has to be looked at. */
const WRAPPED_STRINGS: readonly string[] = [
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
  // Passes an `OscType2` member where the parameter is declared `OscType`.
  // "Scripts cannot compare members of different enums or use such members in
  // expressions requiring a specific enum type, even if the fields have
  // identical names and titles" — and the page's own comment on the offending
  // line reads "Raises a compilation error because only members of `OscType`
  // are allowed." This engine used to compile it and plot `na` on every bar,
  // which is the worse answer: the script looks like it ran.
  "v5/v5-language-enums-05.pine",
];

/**
 * The pin that was here and is gone: `v5/v5-writing-limitations-10.pine`.
 *
 * It was listed as refused-on-purpose because the engine rejected it — for
 * passing a mutable `var` to `request.security()`, a v3 rule inherited
 * unchanged. TradingView's comment on the offending line names a DIFFERENT
 * error, "Causes compilation error since the scope count is now 602", and the
 * v5 manual restricts mutable arguments only for `request.security_lower_tf()`.
 * So the engine was refusing one rule too early, and "both are real Pine rules"
 * was a way of not noticing. The script now compiles; the scope-count limit is
 * not modelled, which is a separate and honest gap.
 */

describe("scripts that do not compile on purpose", () => {
  for (const file of REFUSED_ON_PURPOSE) {
    it(`${file} still exists — a pin that names nothing is not a pin`, () => {
      expect(fs.existsSync(
        path.join(EXAMPLES, file.split("/")[0], "tradingview-docs", file.split("/")[1]),
      )).toBe(true);
    });
  }

  it("the loops demo says so in its own source", () => {
    expect(read("v5/v5-language-loops-04.pine"))
      .toMatch(/This code causes a compilation error/);
  });

  it("the colors demo really does plot a name it never declares", () => {
    const src = read("v5/v5-concepts-colors-04.pine");
    expect(src).toMatch(/c_holiday/);
    expect(src).not.toMatch(/c_holiday\s*=/);
  });

  it("the enums demo says so in its own source, and names the reason", () => {
    expect(read("v5/v5-language-enums-05.pine"))
      .toMatch(/Raises a compilation error because only members of `OscType` are allowed/);
  });

  it("...and the engine gives that reason rather than a generic type error", () => {
    expect(() => compileScript(read("v5/v5-language-enums-05.pine")))
      .toThrow(/Members of different enums are not interchangeable/);
  });
});

/**
 * Scripts that `import` a library.
 *
 * Nine vendored files do, and none of them compiles on its own — an import
 * needs the library's SOURCE, which this engine cannot fetch from TradingView.
 * That is by design and not a gap.
 *
 * Three of the nine are different, and worth proving: the documentation page
 * publishes the library and the script that uses it as adjacent code blocks, so
 * both halves ARE in the corpus. Compiling them together is the only end-to-end
 * check of the import machinery against code this repo did not write — and it
 * is what turned up that an exported `enum` never reached the importing script.
 */
const LIBRARY_PAIRS: ReadonlyArray<[string, string, string]> = [
  ["userName/Point/1", "v5-concepts-libraries-05", "v5-concepts-libraries-06"],
  ["TradingView/PivotLabels/1", "v5-concepts-libraries-07", "v5-concepts-libraries-08"],
  ["userName/Signal/1", "v5-concepts-libraries-09", "v5-concepts-libraries-10"],
];

/** The six whose library is not published anywhere in the docs. */
const LIBRARIES_NOT_PUBLISHED: readonly string[] = [
  "v5/v5-concepts-libraries-12.pine",   // PineCoders/AllTimeHighLow/1
  "v5/v5-faq-indicators-00.pine",       // PineCoders/VisibleChart/4
  "v5/v5-faq-alerts-01.pine",           // TradingView/ta/7
  "v5/v5-faq-alerts-06.pine",           // PineCoders/Time/4
  "v5/v5-faq-alerts-08.pine",           // TradingView/ta/7
  "v5/v5-faq-data-structures-18.pine",  // PineCoders/getSeries/1
  "v5/v5-faq-functions-04.pine",        // PineCoders/ConditionalAverages/1
];

describe("scripts that import a library", () => {
  for (const [path, library, user] of LIBRARY_PAIRS) {
    it(`${user} compiles against ${library}`, () => {
      const source = read(`v5/${user}.pine`);
      const libraries = { [path]: read(`v5/${library}.pine`) };
      expect(() => compileScript(source, { libraries })).not.toThrow();
    });

    it(`...and does NOT compile without it`, () => {
      expect(() => compileScript(read(`v5/${user}.pine`)))
        .toThrow(/no source was supplied for the library/);
    });
  }

  for (const file of LIBRARIES_NOT_PUBLISHED) {
    it(`${file} imports a library the docs do not publish`, () => {
      expect(() => compileScript(read(file)))
        .toThrow(/no source was supplied for the library/);
    });
  }
});

describe("the corpus is there at all", () => {
  it("has the files this suite is about (guards every case below)", () => {
    expect(corpusFiles().length).toBeGreaterThan(700);
  });
});

describe("scripts that wrap a string literal across code lines", () => {
  it("is exactly the named set — no more, no fewer", () => {
    expect(corpusFiles().filter(f => hasWrappedString(read(f))).sort())
      .toEqual([...WRAPPED_STRINGS].sort());
  });

  it("the detector actually fires (guards the case above)", () => {
    expect(hasWrappedString('x = "abc"\n')).toBe(false);
    expect(hasWrappedString('x = "ab\ncd"\n')).toBe(true);
    // An escaped quote inside a string must not be miscounted.
    expect(hasWrappedString('x = "a\\"b"\n')).toBe(false);
  });

  for (const file of WRAPPED_STRINGS) {
    // v5-faq-indicators-00 wraps a string AND imports a library the docs do not
    // publish, so it is asserted in that section instead of this one.
    if (file === "v5/v5-faq-indicators-00.pine") continue;
    it(`${file} compiles`, () => {
      expect(() => compileScript(read(file))).not.toThrow();
    });
  }
});
