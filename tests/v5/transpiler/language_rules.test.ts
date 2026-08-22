/**
 * The v5 rules that are neither a rename nor a control structure:
 * the directive, reserved words, keyword-argument renames, the `transp=`
 * removal, and `strategy.exit`'s argument requirement.
 *
 * Each of these fails SILENTLY if it is not enforced. A dropped keyword
 * argument, a `transp=` that does nothing, an exit order that can never fill —
 * none of them produce an error at run time, they produce a chart that is
 * quietly not what the author asked for.
 */
import { describe, it, expect } from "vitest";
import { compileScript } from "../../../transpiler";
import { HEAD, build, value } from "../helpers";

describe("the directive", () => {
  it("indicator() declares the script", () => {
    const { ctx, exec } = build('//@version=5\nindicator("My Script", overlay=true)\nplot(close)\n');
    ctx.setBar(0, 10, 12, 9, 11, 100);
    exec();
    expect(ctx.scriptMeta).toMatchObject({ kind: "indicator", title: "My Script", overlay: true });
  });

  it("study() is refused, with the new spelling", () => {
    expect(() => compileScript('//@version=5\nstudy("t")\nplot(close)\n'))
      .toThrow(/'study' was renamed to 'indicator' in Pine Script v5/);
  });

  it("strategy() is unchanged", () => {
    const { ctx, exec } = build('//@version=5\nstrategy("S")\nplot(close)\n');
    ctx.setBar(0, 10, 12, 9, 11, 100);
    exec();
    expect(ctx.scriptMeta?.kind).toBe("strategy");
  });

  it("strategy.* under indicator() is refused, as it is under study()", () => {
    expect(() => compileScript(
      '//@version=5\nindicator("t")\nstrategy.entry("L", strategy.long)\n',
    )).toThrow(/'strategy\.entry' is unavailable in an indicator\(\) script/);
  });

  it("strategy.* under strategy() is allowed", () => {
    expect(() => compileScript(
      '//@version=5\nstrategy("t")\nstrategy.entry("L", strategy.long)\n',
    )).not.toThrow();
  });

  it("indicator(timeframe=) reaches the runtime's `resolution` parameter", () => {
    // §4b renamed the parameter without renaming the function. Context.call
    // matches a keyword by name and DROPS an unmatched one, so an untranslated
    // `timeframe=` would silently do nothing.
    const { js } = build('//@version=5\nindicator("t", timeframe="D")\nplot(close)\n');
    expect(js).toContain("opsv2_resolution:");
    expect(js).not.toContain("opsv2_timeframe:");
  });
});

describe("reserved words", () => {
  const RESERVED = ["catch", "class", "do", "ellipse", "in", "is", "polygon",
                    "range", "return", "struct", "text", "throw", "try"];

  for (const word of RESERVED) {
    it(`${word} cannot be a variable name`, () => {
      expect(() => compileScript(`${HEAD}${word} = 5\n`))
        .toThrow(new RegExp(`'${word}' is a reserved word in Pine Script v5`));
    });
  }

  it("but v4 still accepts them, since the list is a v5 addition", () => {
    expect(() => compileScript('//@version=4\nstudy("t")\nrange = 5\nplot(range)\n')).not.toThrow();
  });

  it("`text` remains a live NAMESPACE — the rule is about naming, not reading", () => {
    // This is the case that stops the reserved list from being lexer tokens.
    expect(() => compileScript(
      `${HEAD}l = label.new(bar_index, close, "x", textalign=text.align_left)\n`,
    )).not.toThrow();
  });

  it("`text=` remains a live KEYWORD ARGUMENT", () => {
    expect(() => compileScript(`${HEAD}l = label.new(bar_index, close, text="hi")\n`))
      .not.toThrow();
  });

  it("a reserved word cannot be a function parameter either", () => {
    expect(() => compileScript(`${HEAD}f(range) => range + 1\n`))
      .toThrow(/'range' is a reserved word/);
  });
});

describe("transp= was removed", () => {
  it("plot(transp=) is refused, pointing at color.new", () => {
    expect(() => compileScript(`${HEAD}plot(close, transp=50)\n`))
      .toThrow(/the 'transp' argument was removed in Pine Script v5/);
  });

  it("color.new(c, transp) is the replacement and works", () => {
    expect(() => compileScript(`${HEAD}plot(close, color=color.new(color.red, 50))\n`))
      .not.toThrow();
  });

  it("v4 still accepts transp=", () => {
    expect(() => compileScript('//@version=4\nstudy("t")\nplot(close, transp=50)\n'))
      .not.toThrow();
  });
});

describe("strategy.exit() must be able to fill", () => {
  const STRAT = '//@version=5\nstrategy("t")\n';

  it("with no exit condition it is refused", () => {
    expect(() => compileScript(`${STRAT}strategy.exit("X", "L")\n`))
      .toThrow(/strategy\.exit\(\) must specify at least one of/);
  });

  it("a keyword condition satisfies it", () => {
    expect(() => compileScript(`${STRAT}strategy.exit("X", "L", profit=10)\n`)).not.toThrow();
    expect(() => compileScript(`${STRAT}strategy.exit("X", "L", stop=90)\n`)).not.toThrow();
    expect(() => compileScript(`${STRAT}strategy.exit("X", "L", trail_points=5)\n`)).not.toThrow();
  });

  it("a fifth POSITIONAL argument is `profit`, so it satisfies it too", () => {
    expect(() => compileScript(`${STRAT}strategy.exit("X", "L", 1, 100, 10)\n`)).not.toThrow();
  });

  it("v4 accepts a conditionless exit — the requirement is a v5 addition", () => {
    expect(() => compileScript('//@version=4\nstrategy("t")\nstrategy.exit("X", "L")\n'))
      .not.toThrow();
  });
});

describe("the typed input functions", () => {
  it("input.int registers an integer input", () => {
    const { ctx, exec } = build(`${HEAD}len = input.int(14, "Length")\n`);
    ctx.setBar(0, 10, 12, 9, 11, 100);
    exec();
    expect(ctx.inputDefs[0]).toMatchObject({ defval: 14, title: "Length", type: "integer" });
  });

  it("input.timeframe is v5's spelling of v4's input.resolution", () => {
    const { ctx, exec } = build(`${HEAD}tf = input.timeframe("D", "TF")\n`);
    ctx.setBar(0, 10, 12, 9, 11, 100);
    exec();
    expect(ctx.inputDefs[0].type).toBe("resolution");
  });

  it("input.integer and input.resolution are gone, by their new names", () => {
    // Read as VALUES rather than passed as `type=`: v5 makes `type` a keyword,
    // so `input(1, type=…)` no longer parses at all. That spelling has no v5
    // meaning either — `input()` lost its `type` parameter — so the rename
    // message is reached through the constant itself.
    expect(() => compileScript(`${HEAD}x = input.integer\n`))
      .toThrow(/'input\.integer' was renamed to 'input\.int' in Pine Script v5/);
    expect(() => compileScript(`${HEAD}x = input.resolution\n`))
      .toThrow(/'input\.resolution' was renamed to 'input\.timeframe' in Pine Script v5/);
  });

  it("input.float is a FUNCTION at v5 and still a CONSTANT at v4", () => {
    // One name, two meanings, one sandbox object per name. createStdlib binds
    // this version's meaning; see the header of runtime/v1/stdlib/inputs.ts.
    expect(value(`${HEAD}x = input.float(2.5, "F")\n`, "x")).toBe(2.5);
    const v4 = build('//@version=4\nstudy("t")\nx = input.float\n');
    v4.ctx.setBar(0, 10, 12, 9, 11, 100);
    v4.exec();
    expect(v4.ctx.vars.get("opsv2_x")?.valueOf()).toBe("float");
  });
});

describe("typed collection constructors", () => {
  it("array.new<float> selects the float constructor", () => {
    expect(value(`${HEAD}a = array.new<float>(3)\ns = array.size(a)\n`, "s")).toBe(3);
  });

  it("array.new<int> too", () => {
    expect(value(`${HEAD}a = array.new<int>(2)\nv = array.get(a, 0)\n`, "v")).toBe(0);
  });

  it("array.new without a type argument is refused, not guessed at", () => {
    expect(() => compileScript(`${HEAD}a = array.new(3)\n`))
      .toThrow(/'array\.new' needs a type argument/);
  });

  it("the typed form does not break ordinary comparison", () => {
    // `id LT` is the shape `type_args` matches, so '<' as an OPERATOR has to
    // keep working. close is 11 on the synthetic bar, so this is 1.
    expect(value(`${HEAD}x = close < 100 ? 1 : 0\n`, "x")).toBe(1);
    expect(value(`${HEAD}y = close < 5 ? 1 : 0\n`, "y")).toBe(0);
  });

  it("array.new_float still works — v5 kept the per-type constructors", () => {
    expect(value(`${HEAD}a = array.new_float(4)\ns = array.size(a)\n`, "s")).toBe(4);
  });
});

describe("request.security", () => {
  it("still defers its expression as a thunk under the new spelling", () => {
    // The base intercepts the callee by NAME to defer argument 3; v5 renamed
    // it, so an unrouted `request.security` would evaluate the HTF expression
    // eagerly in the CHART context and silently return the wrong series.
    const { js } = build(`${HEAD}x = request.security(syminfo.tickerid, "D", close)\n`);
    expect(js).toMatch(/\(\) => \(opsv2_close\)/);
  });

  it("the v4 spelling is refused", () => {
    expect(() => compileScript(`${HEAD}x = security(syminfo.tickerid, "D", close)\n`))
      .toThrow(/'security' was renamed to 'request\.security' in Pine Script v5/);
  });

  it("the v3 mutable-argument guard still applies", () => {
    expect(() => compileScript(
      `${HEAD}s = close\ns := s * 2\nx = request.security(syminfo.tickerid, "D", s)\n`,
    )).toThrow(/cannot use mutable variable 's' as an argument for security/);
  });

  it("timeframe= reaches the runtime's `resolution` parameter", () => {
    const { js } = build(
      `${HEAD}x = request.security(syminfo.tickerid, timeframe="D", expression=close)\n`,
    );
    expect(js).toContain("opsv2_resolution:");
  });
});

describe("the v5 declaration keywords are keywords now", () => {
  // They used to be ordinary identifiers, and three of the four SILENTLY
  // COMPILED: `export f(x) => …` parsed as the bare statement `export` plus an
  // ordinary function, and emitted the function with the keyword discarded.
  // Each now has a grammar rule, so the shape below is what proves it.
  it("`type` opens a declaration, not a statement", () => {
    expect(() => compileScript(`${HEAD}type Point\n    float x\n`)).not.toThrow();
  });

  it("`method` opens a declaration", () => {
    expect(() => compileScript(`${HEAD}method dbl(int self) =>\n    self * 2\n`))
      .not.toThrow();
  });

  it("`export` is refused OUTSIDE a library, rather than being dropped", () => {
    expect(() => compileScript(`${HEAD}export f(x) =>\n    x + 1\n`))
      .toThrow(/'export f' is only allowed in a library/);
  });

  it("`import` is refused when the host supplied no source for it", () => {
    expect(() => compileScript(`${HEAD}import someuser/somelib/1 as lib\n`))
      .toThrow(/no source was supplied for the library 'someuser\/somelib\/1'/);
  });

  it("the cost of making them keywords: `type` can no longer be a name part", () => {
    // `syminfo.type` is the only real casualty, and it is not in this engine's
    // registry at any version — so it was already unusable, and a parse error
    // is a clearer outcome than a mis-parsed type declaration.
    expect(() => compileScript(`${HEAD}x = syminfo.type\n`))
      .toThrow(/parsing failed/);
  });
});

describe("the v5-only namespaces are refused at v4", () => {
  for (const [ns, body] of [
    ["str", 'x = str.length("ab")'],
    ["log", 'log.info("x")'],
    ["matrix", "m = matrix.new(1, 1)"],
    ["map", "m = map.new()"],
    ["runtime", 'runtime.error("x")'],
  ] as Array<[string, string]>) {
    it(`v4 refuses ${ns}.*`, () => {
      expect(() => compileScript(`//@version=4\nstudy("t")\n${body}\n`)).toThrow();
    });
  }

  it("and the v5 spellings of the moved library are refused at v4", () => {
    // Reported as a VERSION problem rather than as an unknown namespace: the
    // name exists in the engine, just not at this version.
    expect(() => compileScript('//@version=4\nstudy("t")\nx = ta.sma(close, 3)\n'))
      .toThrow(/'ta\.sma' is not available in Pine Script v4/);
    expect(() => compileScript('//@version=4\nstudy("t")\nx = math.abs(close)\n'))
      .toThrow(/'math\.abs' is not available in Pine Script v4/);
  });
});

describe("v5 inherits every earlier guard", () => {
  it("self-reference (v3)", () => {
    expect(() => compileScript(`${HEAD}s = nz(s[1]) + close\n`))
      .toThrow(/cannot reference itself/);
  });

  it("bool arithmetic (v3)", () => {
    expect(() => compileScript(`${HEAD}c = (close > open) + 1\n`))
      .toThrow(/cannot use a bool as an operand/);
  });

  it("recursion (v1)", () => {
    expect(() => compileScript(`${HEAD}f(x) => f(x)\n`)).toThrow(/recursion is not allowed/);
  });

  it("`n` is banned, `bar_index` is the spelling (v4)", () => {
    const { ctx, exec } = build(`${HEAD}x = n\n`);
    ctx.setBar(0, 10, 12, 9, 11, 100);
    expect(() => exec()).toThrow(/'n' is not available in Pine Script v5/);
  });

  it("`var` persistence (v4)", () => {
    expect(value(`${HEAD}var c = 0\nc := c + 1\n`, "c")).toBe(1);
  });
});
