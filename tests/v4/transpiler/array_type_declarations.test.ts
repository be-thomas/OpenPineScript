/**
 * `float[] prices = na` — the array TYPE suffix on a declaration.
 *
 * SOURCING. From the v4 manual's arrays page: "The `[]` modifier is appended to
 * the type name when declaring arrays", with the syntax
 *
 *     <type>[] <identifier> = <expression>
 *     var <type>[] <identifier> = <expression>
 *
 * and the reason it is not just decoration — the `<type>[]` part is "redundant,
 * except if you initialize an array variable to `na`". `array.new_float(0)`
 * states the element type itself; `na` cannot, so the prefix is the only place
 * it can be written. The page's own example is `float[] prices = na`.
 *
 * ── What the engine does with the type ──────────────────────────────────────
 *
 * Nothing, deliberately, and that is the same choice `type_qual` documents: this
 * engine evaluates everything as a series and holds arrays as JavaScript
 * arrays, so the declared element type cannot change a result. Parsing it is
 * what matters — `int[] a = na` was a PARSE ERROR, which takes the whole script
 * with it rather than one line.
 */
import { describe, it, expect } from "vitest";
import { transpile, compileScript } from "../../../transpiler/common";
import { compile, Context } from "../../../runtime/v5";

const head = (v: number) =>
  `//@version=${v}\n${v >= 5 ? 'indicator("t")' : 'study("t")'}\n`;

function read(src: string, name: string): any {
  const { js, profile } = compileScript(src);
  const ctx = new Context(profile);
  const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
  ctx.setBar(0, 10, 12, 9, 11, 100);
  exec();
  return ctx.vars.get("opsv2_" + name)?.valueOf();
}

describe("declaring an array variable", () => {
  for (const v of [4, 5]) {
    it(`v${v}: the page's own example — 'float[] prices = na'`, () => {
      expect(() => transpile(head(v) + "float[] prices = na\n")).not.toThrow();
    });

    it(`v${v}: every built-in element type`, () => {
      for (const type of ["int", "float", "bool", "string", "color",
                          "line", "label", "box", "table"]) {
        expect(() => transpile(head(v) + `${type}[] a = na\n`), type).not.toThrow();
      }
    });

    it(`v${v}: 'var' may precede it`, () => {
      expect(() => transpile(head(v) + "var float[] prices = na\n")).not.toThrow();
    });

    it(`v${v}: initialised with a real array, the prefix is redundant but legal`, () => {
      const src = head(v) + "float[] xs = array.new_float(2, 7.0)\nx = array.get(xs, 0)\n";
      expect(read(src, "x")).toBe(7);
    });

    it(`v${v}: the declared variable really is na when initialised to na`, () => {
      // "no array is created yet — only the variable holds na as a placeholder"
      const src = head(v) + "float[] xs = na\nx = na(xs) ? 1 : 0\n";
      expect(read(src, "x")).toBe(1);
    });

    it(`v${v}: it can be assigned an array afterwards`, () => {
      const src = head(v) +
        "float[] xs = na\nxs := array.new_float(1, 5.0)\nx = array.get(xs, 0)\n";
      expect(read(src, "x")).toBe(5);
    });
  }

  it("a tuple declaration takes the prefix too", () => {
    expect(() => transpile(head(5) + "float[] [a, b] = f()\nf() =>\n    [na, na]\n"))
      .not.toThrow();
  });
});

describe("it does not collide with history access", () => {
  it("`x = close[1]` is still the previous bar", () => {
    expect(read(head(5) + "x = close[1]\n", "x")).not.toBe(undefined);
  });

  it("a variable NAMED like a type is unaffected", () => {
    // `type_name` appears only as a declaration prefix, where the next token is
    // the name being declared — so there is no second parse to be ambiguous
    // with.
    expect(() => transpile(head(5) + "myInt = 1\nx = myInt\n")).not.toThrow();
  });
});

describe("earlier versions have no arrays and no suffix", () => {
  for (const v of [2, 3]) {
    it(`v${v} refuses it`, () => {
      expect(() => transpile(head(v) + "float[] a = na\n")).toThrow(/parsing failed/);
    });
  }
});
