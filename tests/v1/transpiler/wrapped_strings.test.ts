/**
 * A string literal WRAPPED across code lines.
 *
 * SOURCING. From the manual's Strings page, under Single-line strings:
 *
 *   "In Pine v6, programmers can use line wrapping to define single-line
 *    literal strings across multiple code lines, where each wrapped line has an
 *    indentation of one or more spaces. However, the resulting character
 *    sequence adds only one space to the start of the wrapped lines, and it
 *    does not automatically add line terminators. This line-wrapping behavior
 *    is deprecated; future versions of Pine Script will not support it."
 *
 * Two rules, and the second is the one that is easy to get wrong: the newline
 * and the indentation together become EXACTLY ONE SPACE. Not a newline, not the
 * indentation, not nothing.
 *
 * ── Why it is in the base, and not gated to a version ───────────────────────
 *
 * No documentation dates its arrival, and the deprecation notice says only that
 * it is going away. TradingView's own published v2 lexer grammar explains why
 * there is nothing to date: that grammar FORBIDS '\n' inside STR_LITERAL and
 * still declares a LINE_CONTINUATION token, so the wrap is folded away by a
 * pre-pass before the lexer ever sees it. It is a consequence of line
 * continuation rather than a feature of its own. Same reading this repo already
 * applies to the `syminfo` namespace: a rule with no stated introduction
 * version is treated as always having been there.
 *
 * ── What this closed ────────────────────────────────────────────────────────
 *
 * Nine scripts in the vendored documentation corpus, across three separate
 * pages. They had been pinned as "TradingView publishes them broken", which was
 * wrong — the wrap is a language rule this engine did not implement.
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { transpile, compileScript } from "../../../transpiler/common";
import { compile, Context } from "../../../runtime/v5";

const head = (v: number) =>
  v === 1 ? 'study("t")\n'
          : `//@version=${v}\n${v >= 5 ? 'indicator("t")' : 'study("t")'}\n`;

function read(body: string, v = 5, name = "x"): any {
  const { js, profile } = compileScript(head(v) + body + "\n");
  const ctx = new Context(profile);
  const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
  ctx.setBar(0, 10, 12, 9, 11, 100);
  exec();
  return ctx.vars.get("opsv2_" + name)?.valueOf();
}

describe("the wrap becomes one space", () => {
  it("joins the two halves of a sentence", () => {
    // The shape TradingView's own FAQ publishes, and the case that pins the
    // rule down: dropping the wrap entirely would give "setthe", keeping the
    // newline would give a line break in a tooltip.
    expect(read('x = "and then set\n  the bottom margin"')).toBe("and then set the bottom margin");
  });

  it("one space however deep the indentation", () => {
    expect(read('x = "a\n b"')).toBe("a b");
    expect(read('x = "a\n            b"')).toBe("a b");
    expect(read('x = "a\n\tb"')).toBe("a b");
  });

  it("does NOT insert a line terminator", () => {
    expect(read('x = "a\n b"')).not.toContain("\n");
  });

  it("a space already there is kept, and the wrap adds its own", () => {
    // The rule is stated as an addition — "adds only one space to the start of
    // the wrapped lines" — not as a normalisation of surrounding whitespace.
    expect(read('x = "a \n b"')).toBe("a  b");
  });

  it("wraps more than once", () => {
    expect(read('x = "a\n b\n c"')).toBe("a b c");
  });

  it("an explicit \\n is untouched by it", () => {
    // `\n` is an escape in the SOURCE; the wrap is a real newline. The two are
    // different characters and only one of them folds.
    expect(read('x = "a\\n\n b"')).toBe("a\n b");
  });

  it("applies to apostrophe-quoted strings too", () => {
    expect(read("x = 'a\n b'")).toBe("a b");
  });
});

describe("the indentation is required", () => {
  it("a quote left open with the next line at column 0 still fails", () => {
    // Otherwise every genuinely unterminated string would silently swallow the
    // rest of the script.
    expect(() => transpile(head(5) + 'x = "a\nplot(close)\n')).toThrow(/parsing failed/);
  });
});

describe("every version", () => {
  for (const version of [1, 2, 3, 4, 5]) {
    it(`v${version} folds the wrap`, () => {
      expect(read('x = "a\n b"', version)).toBe("a b");
    });
  }
});

describe("it is a wrap, not a statement break", () => {
  it("the line after the wrap is part of the same call", () => {
    const { js } = compileScript(head(5) + 'plot(close, title = "a\n b")\n');
    expect(js).toContain('"a b"');
  });

  it("indentation-sensitive structure around it is unaffected", () => {
    // The newline is inside the token, so the indenter never sees it and the
    // block that follows still closes where it should.
    expect(read(
      "y = 0\nif close > 0\n    s = \"a\n     b\"\n    y := 1\nx = y",
      5, "x",
    )).toBe(1);
  });
});

describe("the corpus scripts it unblocked", () => {
  const FILES = [
    "v5/v5-concepts-time-00.pine",
    "v5/v5-concepts-time-24.pine",
    "v5/v5-writing-debugging-25.pine",
    "v5/v5-writing-debugging-26.pine",
    "v5/v5-writing-debugging-28.pine",
    "v5/v5-writing-debugging-32.pine",
    "v5/v5-writing-debugging-33.pine",
    "v5/v5-writing-debugging-37.pine",
    "v5/v5-writing-debugging-41.pine",
  ];

  for (const file of FILES) {
    it(`${file} compiles`, () => {
      const [version, name] = file.split("/");
      const source = fs.readFileSync(
        path.resolve(__dirname, "../../../examples", version, "tradingview-docs", name), "utf8",
      );
      expect(() => compileScript(source)).not.toThrow();
    });
  }
});
