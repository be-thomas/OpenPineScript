/**
 * v4 `var` / `varip` / typed declarations — the whole syntactic delta of v4.
 *
 * These are RUNTIME tests, not emit-shape tests. Asserting that the output
 * contains "ctx.var_def" proves only that a string was assembled; `var` is a
 * claim about what happens on bar 2, so the tests below run bars.
 */
import { describe, it, expect } from "vitest";
import { transpile, compileScript } from "../../../transpiler";
import { compile, Context } from "../../../runtime/v4";

/**
 * Builds through `compileScript`, not `transpile`, so the Context gets the
 * profile the ROUTER resolved for this script.
 *
 * `new Context()` defaults to the v1 profile. A v4 test that takes the default
 * silently runs v4 source under v1 runtime configuration — which still passes
 * for anything that does not touch a version-dependent name, and then reports
 * `bar_index` as unavailable "in Pine Script v1" the moment something does.
 */
function build(pine: string) {
  const { js, profile } = compileScript(pine);
  const ctx = new Context(profile);
  const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
  return { ctx, exec };
}

const vv = (ctx: Context, name: string): any => ctx.vars.get("opsv2_" + name)?.valueOf();

/** Runs `closes` as one committed bar each and returns the final value of `name`. */
function run(pine: string, closes: number[], name: string): any {
  const { ctx, exec } = build(pine);
  closes.forEach((c, i) => {
    ctx.setBar(i, c, c, c, c, 1);
    exec();
    ctx.finalizeBar();
  });
  return vv(ctx, name);
}

const HEAD = "//@version=4\nstudy(\"t\")\n";

describe("var — initialise once, persist across bars", () => {
  it("counts bars, so the initialiser cannot be re-running", () => {
    // Without `var` this is 1 on every bar. The whole feature is the difference.
    const src = HEAD + "var count = 0.0\ncount := count + 1\n";
    expect(run(src, [1, 2, 3, 4, 5], "count")).toBe(5);
  });

  it("without var, the same script resets every bar", () => {
    const src = HEAD + "count = 0.0\ncount := count + 1\n";
    expect(run(src, [1, 2, 3, 4, 5], "count")).toBe(1);
  });

  it("holds the FIRST bar's value when never reassigned", () => {
    const src = HEAD + "var firstClose = close\n";
    expect(run(src, [10, 20, 30], "firstClose")).toBe(10);
  });

  it("the initialiser expression is not re-evaluated after bar 0", () => {
    // The sharpest form: if `close` were read again each bar, this would track
    // close instead of pinning it. A value-passing implementation compiles,
    // runs, and gets this wrong silently.
    const src = HEAD + "var pinned = close * 2\n";
    expect(run(src, [10, 99, 99], "pinned")).toBe(20);
  });

  it("two var declarations do not share an initialised flag", () => {
    // Keyed by declaration site, not by name — a single shared flag would leave
    // the second declaration uninitialised forever.
    const src = HEAD + "var a = 1.0\nvar b = 2.0\nc = a + b\n";
    expect(run(src, [1, 2, 3], "c")).toBe(3);
  });

  it("history still works — a var has a series, not just a value", () => {
    const src = HEAD + "var acc = 0.0\nacc := acc + close\nprev = nz(acc[1])\n";
    // closes 1,2,3 → acc 1,3,6 ; prev on the last bar is acc[1] = 3
    expect(run(src, [1, 2, 3], "prev")).toBe(3);
  });
});

describe("typed declarations", () => {
  it("accepts an explicit type and ignores it", () => {
    const src = HEAD + "float x = close\n";
    expect(run(src, [1, 2, 7], "x")).toBe(7);
  });

  it("accepts `var` and a type together", () => {
    const src = HEAD + "var float x = close\n";
    expect(run(src, [5, 6, 7], "x")).toBe(5);
  });

  it("accepts `float x = na`, the form the migration guide requires", () => {
    const src = HEAD + "float x = na\nplot(x)\n";
    expect(Number.isNaN(run(src, [1, 2], "x"))).toBe(true);
  });

  it("accepts a qualifier before the type", () => {
    const src = HEAD + "series float y = close\n";
    expect(run(src, [1, 2, 3], "y")).toBe(3);
  });

  it("accepts a bare qualifier with no type", () => {
    const src = HEAD + "simple z = close\n";
    expect(run(src, [1, 2, 4], "z")).toBe(4);
  });
});

describe("the new tokens do not break dotted names", () => {
  // `color`, `label`, `line` etc. stop being ID at v4. If PineV4Parser did not
  // admit them as name parts, each of these would be a syntax error — and they
  // are the most common expressions in the language.
  const CASES: Array<[string, string]> = [
    ["color= keyword argument", "plot(close, color=color.red)"],
    ["color.new", "plot(close, color=color.new(color.blue, 50))"],
    ["input.float", "x = input(1.0, title=\"x\")\nplot(x)"],
    ["timeframe.period", "s = timeframe.period\nplot(close)"],
    ["syminfo.ticker", "s = syminfo.ticker\nplot(close)"],
  ];

  for (const [name, body] of CASES) {
    it(name, () => {
      expect(() => transpile(HEAD + body + "\n")).not.toThrow();
    });
  }
});

describe("the bar counter renames — and the rename inverts", () => {
  it("v4 exposes bar_index", () => {
    expect(run(HEAD + "b = bar_index\n", [1, 2, 3], "b")).toBe(2);
  });

  it("v4 refuses 'n' — the v1-v3 spelling is gone, not merely discouraged", () => {
    // Reading as `na` would be the silent failure: the script runs, every
    // bar-count-dependent branch quietly stops firing.
    expect(() => run(HEAD + "b = n\n", [1, 2, 3], "b"))
      .toThrow(/'n' is not available in Pine Script v4/);
  });

  it("v3 is the mirror image", () => {
    const v3 = "//@version=3\nstudy(\"t\")\n";
    expect(run(v3 + "b = n\n", [1, 2, 3], "b")).toBe(2);
    expect(() => run(v3 + "b = bar_index\n", [1, 2, 3], "b"))
      .toThrow(/'bar_index' is not available in Pine Script v3/);
  });
});

describe("v4 inherits every v3 guard", () => {
  it("rejects a self-referencing declaration", () => {
    expect(() => transpile(HEAD + "s = nz(s[1]) + close\n"))
      .toThrow(/cannot reference itself/);
  });

  it("rejects a self-referencing `var` declaration too", () => {
    // The guard has to be re-applied on the var path — it does not run itself.
    expect(() => transpile(HEAD + "var s = nz(s[1]) + close\n"))
      .toThrow(/cannot reference itself/);
  });

  it("rejects a forward reference", () => {
    expect(() => transpile(HEAD + "a = b + 1\nb = 2\n"))
      .toThrow(/used before it is declared/);
  });

  it("rejects ':=' to an undeclared name", () => {
    expect(() => transpile(HEAD + "x := 2\n")).toThrow(/is not declared/);
  });
});

describe("what is not implemented says so", () => {
  it("`var` on a tuple declaration is refused, not silently mis-emitted", () => {
    expect(() => transpile(HEAD + "var [a, b] = macd(close, 12, 26, 9)\n"))
      .toThrow(/not implemented yet/);
  });

  it("the plain tuple form still works", () => {
    expect(() => transpile(HEAD + "[a, b, c] = macd(close, 12, 26, 9)\nplot(a)\n"))
      .not.toThrow();
  });
});
