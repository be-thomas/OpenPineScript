/**
 * History access on a getter-backed built-in — `hl2[1]`, `barstate.islast[1]`.
 *
 * This is a v1 test because the defect is v1's: it was found by running
 * TradingView's own documentation examples through the engine, and it was
 * present in every version.
 *
 * ── The bug ─────────────────────────────────────────────────────────────────
 *
 * `visitSqbr_expr` chose between two strategies by asking the PARSE TREE
 * whether the base was an identifier:
 *
 *     const isSimpleId = ctx.atom().id() != null;
 *
 * For `close[1]` that is right — `close` emits the bare name `opsv2_close`, and
 * `ctx.vars` registers the series under exactly that key. But `hl2` is also an
 * `id` atom, and it is a registry GETTER, so it emits a call:
 *
 *     ctx.get(ctx.call("hl2@L2:C5", opsv2_hl2), 1, "ctx.call("hl2@L2:C5", …)")
 *                                                                ^ closes early
 *
 * The base was interpolated into a string literal without escaping, so the
 * literal ended at the call's own quote. The emitted JavaScript did not parse —
 * `compileScript` reported success and `new Function(js)` then threw
 * "missing ) after argument list". Even escaped it would have been wrong: no
 * series is registered under that name, so the lookup could never resolve.
 *
 * The test is on the emitted JS being VALID, not on its exact text, because the
 * failure was a syntax error rather than a wrong value.
 */
import { describe, it, expect } from "vitest";
import { compileScript } from "../../../transpiler";
import { compile, Context } from "../../../runtime/v1";

/** Parses the emitted JavaScript without running it. */
const parses = (js: string): boolean => {
  try { new Function(js); return true; } catch { return false; }
};

describe("history access on getter-backed built-ins", () => {
  // hl2/hlc3/ohlc4 are getters; close/open are plain series names.
  for (const expr of ["hl2[1]", "hlc3[2]", "ohlc4[1]", "close[1]", "(close > open)[1]"]) {
    it(`emits parseable JavaScript for ${expr}`, () => {
      expect(parses(compileScript(`x = ${expr}\nplot(x)\n`).js)).toBe(true);
    });
  }

  it("never leaves an unescaped quote inside the series key", () => {
    const { js } = compileScript("x = hl2[1]\nplot(x)\n");
    // The third argument to ctx.get is a key, and a key is one string literal.
    for (const arg of js.matchAll(/ctx\.get\([^\n]*?,\s*(".*?")\s*\)/g)) {
      expect(parses(`const k = ${arg[1]};`)).toBe(true);
    }
  });

  it("resolves hl2[1] to the previous bar's hl2", () => {
    const { js, profile } = compileScript("x = hl2[1]\nplot(x)\n");
    const ctx = new Context(profile);
    const exec = compile(js, ctx, { ctx });

    // Bar 1: no previous bar yet.
    ctx.is_new = true;
    ctx.setBar(0, 10, 12, 8, 11, 100);   // hl2 = 10
    exec();
    ctx.finalizeBar();

    // Bar 2: hl2[1] is bar 1's (12 + 8) / 2.
    ctx.is_new = true;
    ctx.setBar(1, 20, 30, 20, 25, 100);  // hl2 = 25
    exec();
    ctx.finalizeBar();

    const plotted = [...ctx.plots.values()][0];
    const last: any = plotted[plotted.length - 1];
    expect(Number(last?.value ?? last)).toBe(10);
  });
});
