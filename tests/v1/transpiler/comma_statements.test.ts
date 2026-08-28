/**
 * Comma-separated statements in a function body.
 *
 * SOURCING. From the manual's user-defined functions page: "The body of the
 * function must separate all individual statements in its body with commas",
 * and a call returns "the final expression, variable, or tuple in the
 * function's body". The page's own example is
 *
 *     zScore(source, length) =>
 *         mean = ta.sma(source, length), sd = ta.stdev(source, length), (source - mean) / sd
 *
 * ── The failure this closes ─────────────────────────────────────────────────
 *
 * The emitter joined the comma list with `,` — a JavaScript COMMA EXPRESSION —
 * which is correct only while every Pine statement in the list happens to be an
 * expression. A binding is not. TradingView's own
 *
 *     printTable(txt) => var table t = table.new(...), table.cell(t, 0, 0, txt)
 *
 * emitted `return let opsv2_t = ...`, and the multiline form
 *
 *     float q1 = ta.percentile_linear_interpolation(...), map.put(data, "q1", q1)
 *
 * emitted `let opsv2_q1 = ..., ctx.call(...)` — a `let` list whose second
 * binding is a call. Both are SyntaxErrors, and neither was caught by
 * compilation: the transpiler emitted the text happily and the script blew up
 * on `new Function`, on the first bar, in the host. Three of TradingView's
 * published scripts did exactly that.
 *
 * So these tests read VALUES. Asserting that the source compiles is what let
 * the defect through.
 */
import { describe, it, expect } from "vitest";
import { compileScript } from "../../../transpiler/common";
import { compile, Context } from "../../../runtime/v5";

function value(src: string, name: string, bars = 1): any {
  const { js, profile } = compileScript(src);
  const ctx = new Context(profile);
  const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
  let out: any;
  for (let i = 0; i < bars; i++) {
    ctx.setBar(i * 86400000, 10, 12, 9, 11 + i, 100);
    exec();
    out = ctx.vars.get("opsv2_" + name)?.valueOf();
    ctx.finalizeBar();
  }
  return out;
}

const head = (v: number) =>
  v === 1 ? 'study("t")\n'
          : `//@version=${v}\n${v >= 5 ? 'indicator("t")' : 'study("t")'}\n`;

describe("a single-line body is a list of statements", () => {
  for (const v of [1, 2, 3, 4, 5]) {
    it(`v${v}: a binding followed by an expression returns the EXPRESSION`, () => {
      // Not the binding, and not `undefined`: the value is the last statement.
      const src = head(v) + "f(a) => b = a * 2, b + 1\nx = f(10)\n";
      expect(value(src, "x")).toBe(21);
    });

    it(`v${v}: two bindings then an expression, as the manual's example does`, () => {
      const src = head(v) + "f(a) => m = a * 2, s = a + 1, m / s\nx = f(10)\n";
      expect(value(src, "x")).toBe(20 / 11);
    });

    it(`v${v}: a body that ENDS in a binding returns the bound value`, () => {
      const src = head(v) + "f(a) => b = a * 2, c = b + 1\nx = f(10)\n";
      expect(value(src, "x")).toBe(21);
    });

    it(`v${v}: an earlier statement's effect is visible to a later one`, () => {
      // The whole point of the comma form: the statements RUN, in order.
      const src = head(v) + "f(a) => b = a + 1, c = b * b, c - b\nx = f(3)\n";
      expect(value(src, "x")).toBe(12);
    });
  }
});

describe("a comma list inside an indented body", () => {
  it("is several statements, not one", () => {
    // The block's value is the last CONTENT, which is not the last LINE.
    const src = head(5) +
      "f(a) =>\n" +
      "    float b = a * 2, float c = b + 1\n" +
      "    c + b\n" +
      "x = f(10)\n";
    expect(value(src, "x")).toBe(41);
  });

  it("a call in the middle of the list still runs", () => {
    // The shape of v5-writing-debugging-36: a binding, then a `map.put` of it,
    // on one line. The map has to have been written.
    const src = head(5) +
      "m = map.new<string, float>()\n" +
      "f(a) =>\n" +
      "    float q = a * 2, map.put(m, \"q\", q)\n" +
      "    q\n" +
      "y = f(10)\n" +
      "x = map.get(m, \"q\")\n";
    expect(value(src, "x")).toBe(20);
  });

  it("a trailing comma list still gives the block its value", () => {
    const src = head(5) +
      "f(a) =>\n" +
      "    float b = a + 1\n" +
      "    float c = b * 2, c + 1\n" +
      "x = f(3)\n";
    expect(value(src, "x")).toBe(9);
  });
});

describe("the published scripts that were broken by this", () => {
  it("a `var` declaration followed by a call — v5-concepts-plots-06", () => {
    const src = head(5) +
      "printTable(txt) => var table t = table.new(position.middle_right, 1, 1)," +
      " table.cell(t, 0, 0, txt, bgcolor = color.yellow)\n" +
      "printTable(\"hi\")\n" +
      "x = 1\n";
    expect(value(src, "x")).toBe(1);
  });

  it("...and the `var` is honoured — one table across bars, not one per bar", () => {
    // `var` initialises once. If the comma form re-declared it every bar the
    // script would leak a table per bar and hit the drawing limit.
    const src = head(5) +
      "printTable(txt) => var table t = table.new(position.middle_right, 1, 1)," +
      " table.cell(t, 0, 0, txt)\n" +
      "printTable(\"hi\")\n" +
      "x = 1\n";
    const { js, profile } = compileScript(src);
    const ctx = new Context(profile);
    const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
    for (let i = 0; i < 4; i++) { ctx.setBar(i, 10, 12, 9, 11, 100); exec(); ctx.finalizeBar(); }
    expect([...(ctx as any).drawings.values()].filter((d: any) => d.kind === "table").length).toBe(1);
  });
});

describe("a v5 switch arm takes the same form", () => {
  it("a binding then an expression in one arm", () => {
    const src = head(5) +
      "f(a) =>\n" +
      "    switch\n" +
      "        a > 5 => b = a * 2, b + 1\n" +
      "        => 0\n" +
      "x = f(10)\n";
    expect(value(src, "x")).toBe(21);
  });

  it("an arm that ends in a binding returns the bound value", () => {
    const src = head(5) +
      "f(a) =>\n" +
      "    switch\n" +
      "        a > 5 => b = a * 2\n" +
      "        => 0\n" +
      "x = f(10)\n";
    expect(value(src, "x")).toBe(20);
  });
});
