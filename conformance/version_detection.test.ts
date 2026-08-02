/**
 * //@version detection.
 *
 * The annotation is a comment, and the lexer skips comments — so detection is a
 * pre-parse scan of the raw source. That scan has to be string-aware, which is
 * what most of these cases pin down.
 */
import { describe, it, expect } from "vitest";
// Import through the public entry, as every real consumer does — that is what
// loads profiles/ and registers which versions actually run.
import { detectVersion } from "../transpiler";
import { UnsupportedVersionError } from "../transpiler/version";

describe("detectVersion", () => {
  it("defaults to v1 when there is no annotation", () => {
    // TradingView: a script without the annotation is Pine Script v1.
    expect(detectVersion("plot(close)")).toBe(1);
    expect(detectVersion("")).toBe(1);
  });

  it("reads each supported version", () => {
    for (const v of [1, 2, 3, 4, 5]) {
      expect(detectVersion(`//@version=${v}\nplot(close)`)).toBe(v);
    }
  });

  it("tolerates whitespace variants", () => {
    expect(detectVersion("// @version=4\nplot(close)")).toBe(4);
    expect(detectVersion("//   @version = 4\nplot(close)")).toBe(4);
    expect(detectVersion("//@version =4\nplot(close)")).toBe(4);
    expect(detectVersion("  //@version=4\nplot(close)")).toBe(4);
  });

  it("finds the annotation below line 1", () => {
    expect(detectVersion("// header\n// author: someone\n//@version=3\nplot(close)")).toBe(3);
  });

  it("ignores an annotation inside a double-quoted string", () => {
    // A naive regex over the raw source would report 5 here.
    expect(detectVersion('msg = "//@version=5"\nplot(close)')).toBe(1);
  });

  it("ignores an annotation inside a single-quoted string", () => {
    expect(detectVersion("msg = '//@version=5'\nplot(close)")).toBe(1);
  });

  it("still finds a real annotation that follows a string containing a decoy", () => {
    const src = 'a = "//@version=5"\n//@version=2\nplot(close)';
    expect(detectVersion(src)).toBe(2);
  });

  it("is not fooled by an escaped quote inside a string", () => {
    expect(detectVersion('a = "he said \\"//@version=5\\""\nplot(close)')).toBe(1);
  });

  it("ignores an annotation inside a block comment", () => {
    // The annotation must use `//`.
    expect(detectVersion("/* //@version=5 */\nplot(close)")).toBe(1);
  });

  it("ignores a version mentioned mid-sentence in prose", () => {
    // The comment body must START with @version, so this is documentation.
    expect(detectVersion("// ported from //@version=4 by hand\nplot(close)")).toBe(1);
  });

  it("takes the first annotation when a file has several", () => {
    expect(detectVersion("//@version=2\n//@version=4\nplot(close)")).toBe(2);
  });

  it("rejects a version outside the known range", () => {
    expect(() => detectVersion("//@version=6\nplot(close)")).toThrow(UnsupportedVersionError);
    expect(() => detectVersion("//@version=6\nplot(close)")).toThrow(/Unknown Pine Script version 6/);
    expect(() => detectVersion("//@version=0\nplot(close)")).toThrow(UnsupportedVersionError);
  });

  it("reports which versions actually run, not merely which parse", () => {
    // Saying "supports 1, 2, 3, 4, 5" would be misleading when three of those
    // are refused a moment later.
    let message = "";
    try { detectVersion("//@version=6\nplot(close)"); } catch (e: any) { message = e.message; }
    expect(message).toMatch(/currently runs 1, 2/);
  });

  it("ignores a trailing annotation after code on the same line", () => {
    // The annotation must own its line; a trailing comment is not a directive.
    expect(detectVersion("plot(close) //@version=2")).toBe(1);
  });

  it("is not fooled by a trailing backslash inside a string", () => {
    // A naive escape-skip would consume the newline and hide the annotation.
    expect(detectVersion('a = "x\\\n//@version=2\nplot(close)')).toBe(2);
  });

  it("treats a malformed annotation as absent rather than erroring", () => {
    // '@version=abc' is not an annotation at all, so the script is v1.
    expect(detectVersion("//@version=abc\nplot(close)")).toBe(1);
    expect(detectVersion("//@version\nplot(close)")).toBe(1);
  });

  it("handles CRLF line endings", () => {
    expect(detectVersion("//@version=2\r\nplot(close)")).toBe(2);
  });
});
