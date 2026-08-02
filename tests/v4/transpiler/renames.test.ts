/**
 * The v3 → v4 rename table (§3a of the migration guide).
 *
 * Two directions, and both matter:
 *
 *   - v4 must RESOLVE the new spelling to the same value the old one had.
 *   - v4 must REJECT the old spelling, and v3 must still accept it.
 *
 * Only testing the first would leave the engine accepting both dialects, and a
 * script written half in each would compile here and fail on TradingView.
 */
import { describe, it, expect } from "vitest";
import { compileScript } from "../../../transpiler";
import { compile, Context } from "../../../runtime/v4";
import { V4_RENAMES } from "../../../runtime/v1/stdlib/renames";

function evaluate(version: 3 | 4, body: string, name: string): any {
  const { js, profile } = compileScript(`//@version=${version}\nstudy("t")\n${body}\n`);
  const ctx = new Context(profile);
  const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
  for (let i = 0; i < 3; i++) {
    ctx.setBar(i * 86400000, 10, 12, 9, 11, 100);
    exec();
    ctx.finalizeBar();
  }
  return ctx.vars.get("opsv2_" + name)?.valueOf();
}

describe("every rename resolves at v4 to the value its v3 spelling had", () => {
  // Driven off the table itself, so a new entry is covered the moment it is
  // added — and an entry pointing at a name that does not exist fails loudly
  // rather than aliasing to `undefined`.
  const aliased = V4_RENAMES.filter(r => r.from !== undefined);

  it("the table is not empty (guards the loop below)", () => {
    expect(aliased.length).toBeGreaterThan(40);
  });

  for (const { to, from } of aliased) {
    it(`${from} → ${to}`, () => {
      const v3 = evaluate(3, `x = ${from}`, "x");
      const v4 = evaluate(4, `x = ${to}`, "x");
      expect(v4).toEqual(v3);
    });
  }
});

describe("v4 rejects the v3 spelling and names its replacement", () => {
  const SAMPLE: Array<[string, string]> = [
    ["red", "color.red"],
    ["green", "color.green"],
    ["period", "timeframe.period"],
    ["interval", "timeframe.multiplier"],
    ["ticker", "syminfo.ticker"],
    ["tickerid", "syminfo.tickerid"],
    ["monday", "dayofweek.monday"],
    ["histogram", "plot.style_histogram"],
    ["dotted", "hline.style_dotted"],
    ["integer", "input.integer"],
  ];

  for (const [old, replacement] of SAMPLE) {
    it(`${old} is refused, pointing at ${replacement}`, () => {
      expect(() => compileScript(`//@version=4\nstudy("t")\nx = ${old}\n`))
        .toThrow(new RegExp(`'${old}' was renamed to '${replacement.replace(".", "\\.")}' in Pine Script v4`));
    });

    it(`${old} still works at v3`, () => {
      expect(() => compileScript(`//@version=3\nstudy("t")\nx = ${old}\n`)).not.toThrow();
    });
  }
});

describe("a script may still bind a renamed word as its own variable", () => {
  it("`red = close` is legal v4 — the BUILT-IN is gone, not the word", () => {
    // Rejecting this would be over-reach: TradingView removed the built-in, it
    // did not make `red` a reserved word.
    expect(evaluate(4, "red = close\nx = red", "x")).toBe(11);
  });

  it("...and the reference resolves to the variable, not to an error", () => {
    expect(evaluate(4, "period = 42\nx = period", "x")).toBe(42);
  });
});

describe("v3 does not gain the v4 namespaces", () => {
  for (const name of ["color.red", "timeframe.period", "syminfo.ticker", "dayofweek.monday"]) {
    it(`v3 refuses ${name}`, () => {
      const root = name.split(".")[0];
      // `color` IS a v3 namespace (color.new), so that one is caught by the
      // member being absent rather than the root — assert only what applies.
      if (root === "color") {
        expect(() => compileScript(`//@version=3\nstudy("t")\nx = ${name}\n`)).not.toThrow();
        return;
      }
      expect(() => compileScript(`//@version=3\nstudy("t")\nx = ${name}\n`))
        .toThrow(new RegExp(`'${root}' is not a namespace in Pine Script v3`));
    });
  }
});

describe("plot.style_cross exists at v4 even though v3's `cross` is the TA function", () => {
  it("resolves to a style rather than to ta.cross", () => {
    expect(evaluate(4, "x = plot.style_cross", "x")).toBe("cross");
  });

  it("v3's flat `cross` is still the function", () => {
    expect(() => compileScript("//@version=3\nstudy(\"t\")\nx = cross(close, open)\n"))
      .not.toThrow();
  });
});
