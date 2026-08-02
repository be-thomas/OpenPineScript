/**
 * Regressions for the review findings on PR #5.
 *
 * One test per finding, each using the reproduction from the review itself, so
 * a reader can match a test to the comment that motivated it. Kept together
 * rather than scattered: these are a batch, and the value is in being able to
 * see at a glance that the batch is still fixed.
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { compileScript } from "../transpiler";
import { attempt } from "../test-utils/transpileAs";
import { Context } from "../runtime/v1/context";
import { compile } from "../runtime/v1/index";
import { getGeneratedRegistry } from "../runtime/v1/stdlib/metadata";
import type { PineVersion } from "../transpiler/version";

const ROOT = path.resolve(__dirname, "..");
const REGISTRY = getGeneratedRegistry();

interface Bar { time: number; open: number; high: number; low: number; close: number; volume: number; }

const BARS: Bar[] = fs
  .readFileSync(path.join(ROOT, "mock_data/AAPL_mock.csv"), "utf8")
  .trim().split(/\r?\n/).slice(1)
  .map(l => {
    const c = l.split(",");
    return {
      time: new Date(c[0]).getTime(),
      open: +c[1], high: +c[2], low: +c[3], close: +c[4], volume: +c[5] || 0,
    };
  })
  .filter(b => Number.isFinite(b.close));

/** Monthly re-aggregation, so a security() call has something to return. */
function monthly(bars: Bar[]): Bar[] {
  const out: Bar[] = [];
  let key = "";
  for (const b of bars) {
    const d = new Date(b.time);
    const k = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
    if (k !== key) { out.push({ ...b }); key = k; continue; }
    const cur = out[out.length - 1];
    cur.high = Math.max(cur.high, b.high);
    cur.low = Math.min(cur.low, b.low);
    cur.close = b.close;
  }
  return out;
}

/** Runs a script over the sample bars and returns the first plot's series. */
function firstPlot(source: string, version: PineVersion): number[] {
  const build = () => {
    const c = compileScript(source, { version });
    const ctx = new Context(c.profile);
    return { ctx, exec: compile(c.js, ctx, { ctx } as any) };
  };
  const go = (ctx: Context, exec: () => void) =>
    BARS.forEach((b, i) => {
      ctx.currentBarIndex = i;
      ctx.is_new = true;
      ctx.is_last = i === BARS.length - 1;
      ctx.is_history = !ctx.is_last;
      ctx.is_realtime = ctx.is_last;
      ctx.setBar(b.time, b.open, b.high, b.low, b.close, b.volume);
      exec();
      ctx.finalizeBar();
    });

  let { ctx, exec } = build();
  go(ctx, exec);
  if (ctx.requestedSecurities.size > 0) {
    const wanted = [...ctx.requestedSecurities];
    ({ ctx, exec } = build());
    for (const key of wanted) {
      const at = key.lastIndexOf("@");
      ctx.provideSecurityData(key.slice(0, at), key.slice(at + 1), monthly(BARS));
    }
    go(ctx, exec);
  }
  const series = [...ctx.plots.values()][0] ?? [];
  return series.map(p => (p == null ? NaN : Number((p as any).value)));
}

// ── The registry records the names a Pine author writes ─────────────────────

describe("registry parameter names are Pine's, not TypeScript's", () => {
  it("no entry exposes an *Input parameter", () => {
    // Context.call matches a keyword argument by looking its name up in
    // entry.args and DROPS anything unmatched, so a TS-internal spelling made
    // the keyword form of that argument silently do nothing.
    const leaked = Object.entries(REGISTRY)
      .flatMap(([name, e]) => (e as any).args.filter((a: string) => /Input$/.test(a)).map((a: string) => `${name}(${a})`));
    expect(leaked, `TypeScript parameter names leaked into the registry:\n${leaked.join("\n")}`).toEqual([]);
  });

  it("no entry exposes an underscore-prefixed parameter", () => {
    const leaked = Object.entries(REGISTRY)
      .flatMap(([name, e]) => (e as any).args.filter((a: string) => a.startsWith("_")).map((a: string) => `${name}(${a})`));
    expect(leaked).toEqual([]);
  });

  it("security() names its arguments as Pine does", () => {
    expect((REGISTRY["security"] as any).args)
      .toEqual(["symbol", "resolution", "expression", "gaps", "lookahead"]);
  });

  it("color.new is reachable under the name Pine writes", () => {
    // color.ts is a module named `color` exporting an object named `color`; the
    // __IS_NAMESPACE__ flag prefixed by module name and produced "color.color.new".
    expect(REGISTRY["color.new"]).toBeDefined();
    expect(REGISTRY["color.color.new"]).toBeUndefined();
    const doubled = Object.keys(REGISTRY).filter(k => /^(\w+)\.\1\./.test(k));
    expect(doubled, `doubled namespace keys:\n${doubled.join("\n")}`).toEqual([]);
  });
});

// ── Keyword arguments actually reach the function ───────────────────────────

describe("keyword arguments are passed, not dropped", () => {
  it("sma(close, length=10) equals sma(close, 10)", () => {
    const kw = firstPlot(`//@version=3\nstudy("x")\nplot(sma(close, length=10))\n`, 3);
    const pos = firstPlot(`//@version=3\nstudy("x")\nplot(sma(close, 10))\n`, 3);
    expect(kw.some(Number.isFinite)).toBe(true);
    expect(kw).toEqual(pos);
  });

  it("security() keeps its keyword arguments", () => {
    // emitSecurity read pos_args() only, so this emitted no lookahead at all.
    const js = compileScript(
      `//@version=3\nstudy("x")\nplot(security(tickerid, "D", close, lookahead=barmerge.lookahead_on))\n`,
      { version: 3 },
    ).js;
    expect(js).toMatch(/lookahead/);
  });

  it("an explicit lookahead overrides the version default", () => {
    // The v2 default is lookahead_on. If the keyword were still dropped these
    // two would be identical, which is exactly how the bug hid.
    const explicitOff = firstPlot(
      `//@version=2\nstudy("x")\nplot(security(tickerid, "M", close, lookahead=barmerge.lookahead_off))\n`, 2);
    const versionDefault = firstPlot(
      `//@version=2\nstudy("x")\nplot(security(tickerid, "M", close))\n`, 2);

    expect(explicitOff.some(Number.isFinite)).toBe(true);
    const differing = explicitOff.filter((v, i) => !Object.is(v, versionDefault[i])).length;
    expect(differing, "explicit lookahead had no effect").toBeGreaterThan(0);
  });
});

// ── Guards must not fire on things that are not variable references ─────────

describe("v3 guards do not false-positive", () => {
  it("a keyword-argument NAME is not a forward reference", () => {
    const r = attempt(3, `//@version=3\nstudy("x")\nplot(close, title="hi")\ntitle = 5\n`);
    expect(r.ok, r.ok ? "" : r.message).toBe(true);
  });

  it("a function-local ':=' does not make a global look mutable", () => {
    const r = attempt(3,
      `//@version=3\nstudy("x")\n` +
      `f(z) =>\n    src = z\n    src := src * 2\n    src\n` +
      `src = close\n` +
      `plot(security(tickerid, "D", src))\n`);
    expect(r.ok, r.ok ? "" : r.message).toBe(true);
  });

  it("a function-local bool does not make a global look boolean", () => {
    const r = attempt(3,
      `//@version=3\nstudy("x")\n` +
      `f() =>\n    up = close > open\n    up\n` +
      `up = 5\n` +
      `plot(up + 1)\n`);
    expect(r.ok, r.ok ? "" : r.message).toBe(true);
  });

  it("still rejects a genuine mutable security() argument", () => {
    // The scoping fix must not have disarmed the guard.
    const r = attempt(3,
      `//@version=3\nstudy("x")\nsrc = close\nsrc := src * 2\nplot(security(tickerid, "D", src))\n`);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/mutable variable 'src'/);
  });

  it("still rejects genuine bool arithmetic", () => {
    const r = attempt(3, `//@version=3\nstudy("x")\nup = close > open\nplot(up + 1)\n`);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/cannot use a bool/);
  });

  it("names the operator adjacent to the offending operand", () => {
    // getChild(1) always named the FIRST operator in the chain.
    const r = attempt(3, `//@version=3\nstudy("x")\nb = close > open\nz = 1 + 2 - b\nplot(z)\n`);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toMatch(/operand of '-'/);
  });
});

// ── ':=' target must be declared in the RIGHT scope ─────────────────────────

describe("v2 ':=' checks script scope, not every binding in the file", () => {
  it("rejects a script-scope ':=' whose only binding is a function parameter", () => {
    const r = attempt(2, `//@version=2\nstudy("x")\nf(x) => x + 1\ny = f(close)\nx := 2\n`);
    expect(r.ok, "accepted ':=' to a name that exists only inside a function").toBe(false);
    if (!r.ok) expect(r.message).toMatch(/'x' is not declared/);
  });

  it("still allows ':=' on a function-local inside that function", () => {
    const r = attempt(2,
      `//@version=2\nstudy("x")\n` +
      `f(n) =>\n    acc = 0\n    for i = 0 to n\n        acc := acc + i\n    acc\n` +
      `plot(f(5))\n`);
    expect(r.ok, r.ok ? "" : r.message).toBe(true);
  });

  it("still allows ':=' at script scope on a declared variable", () => {
    const r = attempt(2, `//@version=2\nstudy("x")\nx = 1\nx := 2\nplot(x)\n`);
    expect(r.ok, r.ok ? "" : r.message).toBe(true);
  });
});

// ── A broken indent stack is rejected, not logged ───────────────────────────

describe("structural indentation errors are diagnostics", () => {
  it("an unindent matching no outer level fails the parse", () => {
    const r = attempt(3,
      `//@version=3\nstudy("x")\nif close > open\n        a = 1\n    b = 2\nplot(close)\n`);
    expect(r.ok, "lexer continued past a token stream it knew was wrong").toBe(false);
  });

  it("a well-formed block still parses", () => {
    const r = attempt(3,
      `//@version=3\nstudy("x")\nif close > open\n    a = 1\n    b = 2\nplot(close)\n`);
    expect(r.ok, r.ok ? "" : r.message).toBe(true);
  });
});
