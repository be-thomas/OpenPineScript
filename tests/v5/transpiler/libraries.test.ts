/**
 * v5 libraries — `library()`, `export`, `import`.
 *
 * ── The two things that have to be true ─────────────────────────────────────
 *
 * A library must be REACHABLE: its exported functions, types and methods have
 * to resolve from the importing script, under the alias the import names.
 *
 * And it must be SEALED. A library is a separate script with its own scope, and
 * the ways that can leak here are not obvious — the emitted JavaScript shares
 * one function body, and a variable is also a Series registered by name in a
 * registry both scripts share. The isolation cases below are the ones that
 * caught real defects; each says which.
 */
import { describe, it, expect } from "vitest";
import { compileScript } from "../../../transpiler";
import { compile, Context } from "../../../runtime/v5";

const LIB = [
  '//@version=5',
  'library("MathLib")',
  'len = 3',                          // private, and shares a name with the caller's
  'helper(x) =>',
  '    x + len',
  'export scaled(float x, float k = 2.0) =>',
  '    helper(x) * k',
  'export type Pair',
  '    float a',
  '    float b = 1.0',
  'export method total(Pair self) =>',
  '    self.a + self.b',
].join("\n") + "\n";

const LIBRARIES = { "me/MathLib/1": LIB };

/** Compiles with the library table and runs one bar. */
function run(body: string, libraries: Record<string, string> = LIBRARIES) {
  const src = '//@version=5\nindicator("t")\n' + body;
  const { js, profile } = compileScript(src, { libraries });
  const ctx = new Context(profile);
  const exec = compile(js, ctx, Object.create(null));
  ctx.setBar(0, 10, 12, 9, 11, 100);
  exec();
  return ctx;
}

const value = (ctx: Context, name: string) => ctx.vars.get("opsv2_" + name)?.valueOf();

describe("importing a library", () => {
  it("calls an exported function through the alias", () => {
    const ctx = run("import me/MathLib/1 as ml\nv = ml.scaled(10.0)\n");
    expect(value(ctx, "v")).toBe(26); // (10 + 3) * 2
  });

  it("honours the exported function's default argument", () => {
    const ctx = run("import me/MathLib/1 as ml\nv = ml.scaled(10.0, 3.0)\n");
    expect(value(ctx, "v")).toBe(39);
  });

  it("constructs an exported type", () => {
    const ctx = run("import me/MathLib/1 as ml\np = ml.Pair.new(5.0)\na = p.a\nb = p.b\n");
    expect(value(ctx, "a")).toBe(5);
    expect(value(ctx, "b")).toBe(1); // the library's declared default
  });

  it("calls an exported method on a value of an exported type", () => {
    const ctx = run("import me/MathLib/1 as ml\np = ml.Pair.new(5.0)\nt = p.total()\n");
    expect(value(ctx, "t")).toBe(6);
  });

  it("defaults the alias to the library's name when none is given", () => {
    const ctx = run("import me/MathLib/1\nv = MathLib.scaled(1.0)\n");
    expect(value(ctx, "v")).toBe(8);
  });
});

describe("a library is sealed", () => {
  it("its private variables do not collide with the caller's", () => {
    // The defect this caught: an emitted variable is also a Series registered
    // in `ctx.vars` BY NAME, and the registry is shared. Both scripts declaring
    // `len` therefore wrote one series — the caller's 100 overwrote the
    // library's 3, and the library's own function read 100. It was worth 220
    // instead of 26, and the emitted JavaScript looked correct.
    const ctx = run("import me/MathLib/1 as ml\nlen = 100\nv = ml.scaled(10.0)\n");
    expect(value(ctx, "v")).toBe(26);
    expect(value(ctx, "len")).toBe(100);
  });

  it("its private FUNCTIONS are not reachable", () => {
    expect(() => run("import me/MathLib/1 as ml\nv = ml.helper(1.0)\n"))
      .toThrow(/does not export 'helper'/);
  });

  it("its directive does not become the importing script's", () => {
    // The library's `library(…)` call runs inside the caller's per-bar body, so
    // the last directive to run wins — and the library's runs second.
    const ctx = run('import me/MathLib/1 as ml\nv = ml.scaled(1.0)\n');
    expect(ctx.scriptMeta?.kind).toBe("indicator");
  });

  it("...but a library compiled ON ITS OWN still declares itself", () => {
    const { js, profile } = compileScript(LIB);
    const ctx = new Context(profile);
    const exec = compile(js, ctx, Object.create(null));
    ctx.setBar(0, 10, 12, 9, 11, 100);
    exec();
    expect(ctx.scriptMeta).toMatchObject({ kind: "library", title: "MathLib" });
  });
});

describe("refusals", () => {
  it("an import with no supplied source is refused, not stubbed", () => {
    expect(() => run("import nobody/Missing/1 as m\nv = m.f(1)\n"))
      .toThrow(/no source was supplied for the library 'nobody\/Missing\/1'/);
  });

  it("...and the message lists what WAS supplied", () => {
    expect(() => run("import nobody/Missing/1 as m\nv = m.f(1)\n"))
      .toThrow(/Supplied: me\/MathLib\/1/);
  });

  it("an unexported member is named at compile time", () => {
    expect(() => run("import me/MathLib/1 as ml\nv = ml.nope(1)\n"))
      .toThrow(/does not export 'nope'\. It exports: scaled, Pair, total/);
  });

  it("importing something that is not a library is refused", () => {
    const notALib = '//@version=5\nindicator("x")\nplot(close)\n';
    expect(() => run("import me/Thing/1 as t\nv = t.f(1)\n", { "me/Thing/1": notALib }))
      .toThrow(/is not a library — it must declare itself with library/);
  });

  it("a library that exports nothing is refused", () => {
    const empty = '//@version=5\nlibrary("Empty")\nx = 1\n';
    expect(() => run("import me/Empty/1 as e\nv = e.f(1)\n", { "me/Empty/1": empty }))
      .toThrow(/exports nothing/);
  });

  it("a library that does not parse says which library", () => {
    const broken = '//@version=5\nlibrary("B")\nexport f(x) =>\n    x = = 1\n';
    expect(() => run("import me/B/1 as b\nv = b.f(1)\n", { "me/B/1": broken }))
      .toThrow(/parsing the library 'me\/B\/1' failed/);
  });

  it("the same alias twice is refused", () => {
    expect(() => run("import me/MathLib/1 as ml\nimport me/MathLib/1 as ml\n"))
      .toThrow(/'ml' is already imported/);
  });

  it("export outside a library is refused", () => {
    expect(() => run("export f(x) =>\n    x + 1\n"))
      .toThrow(/'export f' is only allowed in a library/);
  });
});

describe("a library may import another", () => {
  const BASE = [
    '//@version=5', 'library("Base")',
    'export twice(float x) =>', '    x * 2',
  ].join("\n") + "\n";

  const MIDDLE = [
    '//@version=5', 'library("Middle")',
    'import me/Base/1 as b',
    'export quad(float x) =>', '    b.twice(x) * 2',
  ].join("\n") + "\n";

  it("nested imports resolve", () => {
    const ctx = run(
      "import me/Middle/1 as m\nv = m.quad(3.0)\n",
      { "me/Base/1": BASE, "me/Middle/1": MIDDLE },
    );
    expect(value(ctx, "v")).toBe(12);
  });

  it("a library that imports itself is refused rather than recursing", () => {
    const cyclic = [
      '//@version=5', 'library("Loop")',
      'import me/Loop/1 as l',
      'export f(float x) =>', '    l.f(x)',
    ].join("\n") + "\n";
    expect(() => run("import me/Loop/1 as l\nv = l.f(1.0)\n", { "me/Loop/1": cyclic }))
      .toThrow(/nested more than \d+ deep/);
  });
});

describe("call-site state is not shared with the library", () => {
  it("two ta.sma calls at the same line in two files keep separate windows", () => {
    // `Context.getPersistentState` keys on the call id, which is built from a
    // source LOCATION. A library's line 4 and the script's line 4 are different
    // calls, and without a per-library tag they would share one rolling window
    // — two unrelated indicators quietly averaging into each other.
    const lib = [
      '//@version=5', 'library("S")',
      'export avg3(float x) =>', '    ta.sma(x, 3)',
    ].join("\n") + "\n";

    const { js, profile } = compileScript(
      '//@version=5\nindicator("t")\nimport me/S/1 as s\nmine = ta.sma(close, 3)\ntheirs = s.avg3(close)\n',
      { libraries: { "me/S/1": lib } },
    );
    const ctx = new Context(profile);
    const exec = compile(js, ctx, Object.create(null));

    for (const c of [10, 20, 30]) {
      ctx.setBar(0, c, c, c, c, 100);
      exec();
      ctx.finalizeBar();
    }
    // Both average the same three closes, so agreement here is not the point —
    // the point is that each got three samples rather than one window of six.
    expect(value(ctx, "mine")).toBe(20);
    expect(value(ctx, "theirs")).toBe(20);
  });
});
