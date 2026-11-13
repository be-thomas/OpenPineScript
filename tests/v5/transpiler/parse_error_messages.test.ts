/**
 * Parse failures say what is wrong in the script, not what state the parser
 * was in. `line` and `col` are the parser's, untouched; `detail` keeps its
 * own text when `message` was rewritten.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Session } from "../../../runtime/v1/session";

const compile = (src: string) => {
  const s = new Session();
  const c = s.compile(src);
  return { errors: c.errors, version: s.pineVersion };
};
const first = (src: string) => compile(src).errors[0];

const ENDS = (n: number) => `The script ends in the middle of a statement at line ${n} — was it pasted completely?`;

describe("a string broken across lines", () => {
  const e = first('//@version=5\nindicator("x")\nlabel.new(bar_index, close, "ab\ncd")\n');
  it("says to close the quote or join the lines", () => {
    expect(e.message).toBe("A string can't continue onto the next line — close the quote on line 3, or join the lines.");
  });
  it("keeps the parser's position and text", () => {
    expect(e).toMatchObject({ phase: "parse", line: 3, col: 28 });
    expect(e.detail).toMatch(/^token recognition error at: '"ab/);
  });
});

describe("$ in a name", () => {
  it("says so, with the line", () => {
    const e = first("//@version=5\nindicator(\"x\")\nrisk$ = close * 2\nplot(risk$)\n");
    expect(e.message).toBe("`$` can't be used in a name (line 3).");
    expect(e).toMatchObject({ line: 3, col: 4 });
    // the parser's own text first, then TradingView's wording
    expect(e.detail).toMatch(/^token recognition error at: '\$'/);
  });
  it("leaves a $ that is not in a name alone", () => {
    expect(first('//@version=5\nindicator("x")\nplot(close) $ 1\n').message).toMatch(/^token recognition error/);
  });
});

describe("no //@version line", () => {
  // A nested `if` is v1's failure: v5 parses it.
  const body = 'x = 0.0\nif close > open\n    if close > 1\n        x := 1\nplot(x)\n';
  const hint = "This script has no `//@version` line, so it was read as version 1. Add `//@version=5` (or 6) as the first line.";

  it("keeps the error and adds the hint when the body parses as v5", () => {
    const e = first(body);
    expect(e.message.endsWith(hint)).toBe(true);
    expect(e.message.length).toBeGreaterThan(hint.length + 10);
    expect(e).toMatchObject({ phase: "parse" });
  });
  // The common case: it PARSES as v1 and fails after, in the transpiler.
  // conformance/v5/parity/parse_errors/pe3_no_version_v5_body.pine is this.
  it("adds the hint to a transpile error: v1 has no indicator()", () => {
    const e = first('indicator("t")\nplot(ta.sma(close, 3))\n');
    expect(e.phase).toBe("transpile");
    expect(e.message).toMatch(/Undeclared identifier 'indicator'/);
    expect(e.message.endsWith(hint)).toBe(true);
  });
  it("adds the hint to an error the dry run finds in the script: a built-in v1 lacks", () => {
    const e = first("study(\"t\")\nplot(obv)\n");
    expect(e.phase).toBe("transpile");
    expect(e.message.endsWith(hint)).toBe(true);
  });
  it("adds nothing to a transpile error when the source has a version line", () => {
    expect(first('//@version=5\nindicator("t")\nplot(nosuchthing)\n').message).not.toContain("//@version");
  });
  it("adds nothing when the source has a version line", () => {
    const e = first("//@version=1\n" + body);
    expect(e.message).not.toContain("//@version");
  });
  it("adds nothing when the body is broken under every version", () => {
    expect(first("plot(close))\n").message).not.toContain("//@version");
  });
});

describe("a version line pasted twice", () => {
  // TradingView rejects it (conformance/v5/parity/parse_errors/pe4_doubled_version.png):
  // "Version=5//@version=5" is not supported. Supported versions are <= 6
  // (PINE_VERSION_NOT_VALID), on line 1. It reads everything after the `=`.
  it("is rejected on line 1 with TradingView's substance", () => {
    const r = compile('//@version=5//@version=5\nindicator("x")\nplot(close)\n');
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0]).toMatchObject({ line: 1 });
    expect(r.errors[0].message).toBe('"Version=5//@version=5" is not supported. Supported versions are <= 6 (PINE_VERSION_NOT_VALID).');
  });
  it("names the line when it is not the first", () => {
    const r = compile('// header\n//@version=4//@version=5\nstudy("x")\nplot(close)\n');
    expect(r.errors[0]).toMatchObject({ line: 2 });
  });
  it("a comment after whitespace is still fine", () => {
    const r = compile('//@version=5 // the version\nindicator("x")\nplot(close)\n');
    expect(r.errors).toEqual([]);
    expect(r.version).toBe(5);
  });
});

// The line TradingView blames, and its own wording kept in `detail`, for a
// user who searches for it. Screenshots: conformance/v5/parity/parse_errors/pe*.png.
describe("TradingView's line and wording", () => {
  const read = (f: string) => readFileSync(join(__dirname, "..", "..", "..", "conformance", "v5", "parity", "parse_errors", f), "utf8");
  it("pe1, a string across two lines: line 3", () => {
    const e = first(read("pe1_string_across_lines.pine"));
    expect(e.line).toBe(3);
    expect(e.detail).toContain("mismatched character '\\n' expecting '\"'");
  });
  it("pe2, `$` in a name: line 3", () => {
    const e = first(read("pe2_dollar_in_name.pine"));
    expect(e.line).toBe(3);
    expect(e.detail).toContain("no viable alternative at character '$'");
  });
  it("pe3, no version line over a v5 body: line 1", () => {
    const e = first(read("pe3_no_version_v5_body.pine"));
    expect(e.line).toBe(1);
    expect(e.detail).toContain("Could not find function or function reference 'indicator'.");
  });
  it("pe5, a file that ends mid-statement: line 4", () => {
    const e = first(read("pe5_ends_mid_statement.pine"));
    expect(e.line).toBe(4);
    expect(e.detail).toContain("Syntax error at input 'end of line without line continuation'");
  });
});

describe("a file that ends mid-statement", () => {
  const head = '//@version=5\nindicator("x")\n';
  it("an unclosed call", () => {
    const e = first(head + "plot(ta.sma(close, 14)");
    expect(e.message.startsWith(ENDS(3))).toBe(true);
    expect(e.detail).toMatch(/^missing '\)' at '<EOF>'/);
    expect(e).toMatchObject({ line: 3, col: 22 });
  });
  it("an operator with nothing after it", () => {
    expect(first(head + "x = close +\n").message.startsWith(ENDS(3))).toBe(true);
  });
  it("an undeclared identifier that is the last token", () => {
    const e = first(head + "x = 1\npending");
    expect(e.message).toBe("Pine Script v5 Error at @L4:C0: Undeclared identifier 'pending'. " + ENDS(4));
    expect(e).toMatchObject({ line: 4, col: 0 });
  });
  it("a member that is the last token", () => {
    const e = first('//@version=5\nstrategy("s")\nx = 2 * strategy.op');
    expect(e.message).toContain("'strategy' has no member 'op'.");
    expect(e.message.endsWith(ENDS(3))).toBe(true);
  });
  it("not for ordinary errors in the middle of a file", () => {
    for (const src of [
      head + "x = = 1\nplot(close)\n",
      head + "y = pending\nplot(close)\n",
      head + "x = strategy.op\nplot(close)\n",
      head + "plot(close))\n",
      head + "plot(close)\nz = pending\nplot(z)\n",
    ]) {
      expect(first(src).message, src).not.toContain("was it pasted completely");
    }
  });
});
