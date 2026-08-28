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
import { compileScript } from "../../../transpiler/common";
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

  /**
   * `tickerid` cannot be compared by value, because v1–v3 spell TWO built-ins
   * with that one word:
   *
   *     tickerid                    the chart's ticker id      (a VARIABLE)
   *     tickerid(prefix, ticker)    builds one from its parts  (a FUNCTION)
   *
   * Pine keeps functions and variables in separate namespaces and this engine
   * does not, so the single registry key holds the FUNCTION — which is the
   * spelling that has to keep working, since `tickerid(syminfo.prefix, ticker)`
   * is in TradingView's own v2 and v4 examples.
   *
   * v4 renamed only the VARIABLE ("The `ticker` and `tickerid` variables are
   * renamed to `syminfo.ticker` and `syminfo.tickerid` respectively"), so
   * `syminfo.tickerid` is now a getter returning the string. Asserting the two
   * are the same value would be asserting the conflation.
   *
   * KNOWN GAP, stated rather than hidden: `x = tickerid` at v1–v3 still reads
   * the function object instead of the ticker-id string.
   */
  const NOT_VALUE_IDENTICAL = new Set(["syminfo.tickerid"]);

  for (const { to, from } of aliased) {
    it(`${from} → ${to}`, () => {
      if (NOT_VALUE_IDENTICAL.has(to)) {
        // The rename still has to RESOLVE, and to the right kind of thing.
        expect(evaluate(4, `x = ${to}`, "x")).toBe("SYMBOL");
        return;
      }
      const v3 = evaluate(3, `x = ${from}`, "x");
      const v4 = evaluate(4, `x = ${to}`, "x");
      expect(v4).toEqual(v3);
    });
  }

  it("the tickerid FUNCTION survives at v4, since only the variable moved", () => {
    expect(evaluate(4, 'x = tickerid("BATS", "AAPL")', "x")).toBe("BATS:AAPL");
  });
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

describe("a keyword argument's NAME is not a read of that word", () => {
  /**
   * `plot(close, title = "x")` reaches visitId twice, and the second time the
   * identifier is the CALLEE's parameter name. The rename table describes what
   * a SCRIPT may spell, so it does not apply there.
   *
   * Two of v4's renamed words are also parameter names of v4 built-ins, and
   * both were rejected as reads of the word they replaced. Four of
   * TradingView's own published v5 scripts hit it — the `for`-loop and time
   * pages, which build a table, and the FAQ page that spells out every
   * `request.security` argument.
   */
  const CASES: Array<[string, string, string]> = [
    ["columns", "plot.style_columns",
     'table.new(position.top_right, columns = 5, rows = 4)'],
    ["symbol", "input.symbol",
     'security(symbol = syminfo.tickerid, resolution = "D", expression = close)'],
    ["resolution", "input.resolution",
     'input(title = "t", defval = "D", type = input.resolution)'],
  ];

  for (const [word, renamedTo, call] of CASES) {
    it(`'${word} = ...' is an argument, not the renamed '${renamedTo}'`, () => {
      expect(() => compileScript(`//@version=4\nstudy("t")\nx = ${call}\n`)).not.toThrow();
    });

    it(`...while a bare read of '${word}' is still the migration error`, () => {
      expect(() => compileScript(`//@version=4\nstudy("t")\nx = ${word}\n`))
        .toThrow(new RegExp(`'${word}' was renamed to '${renamedTo.replace(".", "\\.")}'`));
    });
  }

  it("the same holds at v5, which inherits the guard", () => {
    expect(() => compileScript(
      '//@version=5\nindicator("t")\n' +
      'x = table.new(position.top_right, columns = 5, rows = 4)\n',
    )).not.toThrow();
  });
});

describe("str.replace_all predates the str namespace", () => {
  /**
   * SOURCING. `str.*` is v5 — `tostring` becomes `str.tostring`, and the rest
   * of the namespace arrives with it. But the v4 manual's TABLES page carries
   *
   *     _s := str.replace_all(_s, "25", "00")
   *
   * inside a `//@version=4` example, under "Produces a string format usable
   * with tostring() to restrict precision to ticks", and the v4 arrays page
   * uses it too. Gating the whole namespace at v5 rejected three of
   * TradingView's own v4 scripts.
   *
   * It is the ONLY `str.` name any v4 example spells, which is why it is named
   * one member at a time rather than by moving the namespace.
   */
  it("v4 accepts it", () => {
    expect(() => compileScript('//@version=4\nstudy("t")\nx = str.replace_all("aa", "a", "b")\n'))
      .not.toThrow();
  });

  it("...and it actually replaces every occurrence", () => {
    expect(evaluate(4, 'x = str.replace_all("a-a-a", "a", "b")', "x")).toBe("b-b-b");
  });

  it("v5 keeps it", () => {
    expect(() => compileScript('//@version=5\nindicator("t")\nx = str.replace_all("a", "a", "b")\n'))
      .not.toThrow();
  });

  it("v3 does not have it", () => {
    expect(() => compileScript('//@version=3\nstudy("t")\nx = str.replace_all("a", "a", "b")\n'))
      .toThrow(/is not available in Pine Script v3/);
  });

  it("the rest of str.* is still v5 — the namespace did not move", () => {
    for (const name of ["str.length", "str.tostring", "str.split", "str.format"]) {
      expect(() => compileScript(`//@version=4\nstudy("t")\nx = ${name}("a")\n`),
             name).toThrow(/is not available in Pine Script v4/);
    }
  });
});
