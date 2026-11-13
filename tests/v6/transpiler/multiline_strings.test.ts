/**
 * Triple-quoted strings — release notes, April 2026.
 *
 *   "All code between the """ or ''' delimiters in a multiline string
 *    definition represents literal text."
 *   "multiline strings automatically include all spaces used for indentation"
 */
import { describe, it, expect } from "vitest";
import { value, HEAD } from "../helpers";
import { attempt } from "../../../test-utils/common/transpileAs";

const DQ = '"""';
const SQ = "'''";

describe("multiline strings", () => {
  it("keep their line breaks", () => {
    expect(value(HEAD + `s = ${DQ}alpha\nbeta${DQ}\n`, "s")).toBe("alpha\nbeta");
  });

  it("keep indentation literally rather than stripping a common indent", () => {
    expect(value(HEAD + `s = ${DQ}a\n    b\n  c${DQ}\n`, "s")).toBe("a\n    b\n  c");
  });

  it("keep indentation inside a local block too", () => {
    // "Although the block requires four spaces of indentation for its
    // statements, the string itself does not."
    const src = HEAD + `var s = ""\nif true\n    s := ${SQ}x\ny${SQ}\n`;
    expect(value(src, "s")).toBe("x\ny");
  });

  it("accept both delimiters, each closed only by itself", () => {
    expect(value(HEAD + `s = ${SQ}say "hi"\nok${SQ}\n`, "s")).toBe('say "hi"\nok');
    expect(value(HEAD + `s = ${DQ}it's\nfine${DQ}\n`, "s")).toBe("it's\nfine");
  });

  it("still honour escapes", () => {
    expect(value(HEAD + `s = ${DQ}a\\tb${DQ}\n`, "s")).toBe("a\tb");
  });

  it("concatenate like any other string", () => {
    expect(value(HEAD + `s = ${DQ}a\nb${DQ} + ${SQ}\nc${SQ}\n`, "s")).toBe("a\nb\nc");
  });

  it("measure their newlines and spaces", () => {
    expect(value(HEAD + `n = str.length(${DQ}ab\n  c${DQ})\n`, "n")).toBe(6);
  });

  it("do not exist before v6", () => {
    for (const v of [1, 2, 3, 4, 5] as const) {
      expect(attempt(v, `s = ${DQ}a\nb${DQ}\n`).ok, `v${v}`).toBe(false);
    }
  });
});
