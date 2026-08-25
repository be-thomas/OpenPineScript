/**
 * The built-ins that were missing, and the guard that stopped them crashing.
 *
 * ── How these were found ────────────────────────────────────────────────────
 *
 * By running TradingView's own documentation examples
 * (examples/tradingview-docs/) through the engine. 45 of them died with a
 * JavaScript ReferenceError — "opsv2_last_bar_index is not defined" — because
 * visitId emitted a bare prefixed identifier for any name it did not recognise
 * and `with(sandbox)` then failed to resolve it at run time.
 *
 * Two things were wrong, and both are covered here:
 *
 *   1. the built-ins genuinely were not implemented, and
 *   2. an unimplemented built-in crashed instead of being DIAGNOSED.
 *
 * (2) is the one that matters beyond this list: it is why every future gap
 * surfaces as `Undeclared identifier` at compile time rather than as an engine
 * crash on bar 1. That guard has its own suite —
 * tests/v1/transpiler/undeclared_identifier.test.ts. This file covers (1).
 *
 * Every version claim below is sourced from TradingView's release notes, cited
 * at the assertion.
 */
import { describe, it, expect } from "vitest";
import { compileScript } from "../../../transpiler";
import { compile, Context } from "../../../runtime/v1";

/** Compiles and runs `src` over `n` synthetic daily bars. */
function run(src: string, n = 30) {
  const { js, profile } = compileScript(src);
  const ctx = new Context(profile);
  const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
  const last = (n - 1) * 86400000;
  ctx.provideDatasetExtent(n, last);
  for (let i = 0; i < n; i++) {
    ctx.is_new = true;
    ctx.is_last = i === n - 1;
    ctx.setBar(i * 86400000, 10 + i, 12 + i, 9 + i, 11 + i, 100);
    exec();
    ctx.finalizeBar();
  }
  return ctx;
}

const plotted = (ctx: Context): any[] =>
  [...(ctx.plots as Map<string, any[]>).values()][0].map((p: any) => Number(p?.value ?? p));

describe("dataset extent — last_bar_index / last_bar_time (v5)", () => {
  // "Added new built-in variables that return the bar_index and time values of
  //  the last bar in the dataset. Their values are known at the beginning of
  //  the script's calculation." — v5 release notes, December 2021.
  it("answers from the FIRST bar, not just the last", () => {
    const vals = plotted(run('//@version=5\nindicator("t")\nplot(last_bar_index)', 30));
    expect(vals[0]).toBe(29);
    expect(new Set(vals).size).toBe(1);   // constant across the whole run
  });

  it("reports the last bar's opening time", () => {
    const vals = plotted(run('//@version=5\nindicator("t")\nplot(last_bar_time)', 30));
    expect(vals[0]).toBe(29 * 86400000);
  });

  it("supports the right-hand-edge idiom the variables exist for", () => {
    const vals = plotted(run(
      '//@version=5\nindicator("t")\nplot(last_bar_index - bar_index <= 2 ? 1 : 0)', 30));
    expect(vals.filter(v => v === 1).length).toBe(3);   // the final three bars
  });

  it("falls back to bars-seen-so-far when the host does not declare the extent", () => {
    // Documented divergence rather than a hidden one: a host that streams
    // without saying how long the run is cannot be given the real answer.
    const { js, profile } = compileScript('//@version=5\nindicator("t")\nplot(last_bar_index)');
    const ctx = new Context(profile);
    const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
    for (let i = 0; i < 5; i++) { ctx.is_new = true; ctx.setBar(i, 1, 1, 1, 1, 1); exec(); ctx.finalizeBar(); }
    expect(plotted(ctx)).toEqual([0, 1, 2, 3, 4]);
  });
});

describe("v4 built-ins that were unbound", () => {
  // "functions for explicit type casting" — v4 release notes, June 2019.
  it("int() truncates toward zero and propagates na", () => {
    expect(plotted(run('//@version=4\nstudy("t")\nplot(int(10.9))', 2))[0]).toBe(10);
    expect(plotted(run('//@version=4\nstudy("t")\nplot(int(-1.7))', 2))[0]).toBe(-1);
    expect(plotted(run('//@version=4\nstudy("t")\nplot(int(na))', 2))[0]).toBeNaN();
  });

  // The v4 manual's own example, which is why int() exists at all.
  it("int() lets a float length reach an integer parameter", () => {
    const vals = plotted(run('//@version=4\nstudy("t")\nlen = 10.0\nplot(sma(close, int(len)))', 20));
    expect(Number.isFinite(vals[19])).toBe(true);
  });

  // "max_bars_back function to control series variables internal history
  //  buffer sizes" — v4 release notes, June 2019. A no-op here: this engine
  //  has no buffer cap to raise.
  it("max_bars_back is accepted and does not disturb the series", () => {
    const vals = plotted(run(
      '//@version=4\nstudy("t")\nmax_bars_back(close, 300)\nplot(close)', 5));
    expect(vals).toEqual([11, 12, 13, 14, 15]);
  });

  // "New variable was added: time_tradingday" — v4 release notes, February 2021.
  it("time_tradingday is the UTC start of the bar's day", () => {
    const vals = plotted(run('//@version=4\nstudy("t")\nplot(time_tradingday)', 3));
    expect(vals[0]).toBe(0);
    expect(vals[1]).toBe(86400000);
  });

  it("time_close is the bar's open plus one timeframe", () => {
    const vals = plotted(run('//@version=4\nstudy("t")\nplot(time_close)', 3));
    // Context defaults to a daily chart.
    expect(vals[0]).toBe(86400000);
    expect(vals[1] - vals[0]).toBe(86400000);
  });

  // "todegrees(radians) … toradians(degrees) … random(min, max, seed) …
  //  round_to_mintick(x)" — all four v4 release notes.
  it("todegrees / toradians round-trip", () => {
    expect(plotted(run('//@version=4\nstudy("t")\nplot(todegrees(3.141592653589793))', 2))[0])
      .toBeCloseTo(180, 9);
    expect(plotted(run('//@version=4\nstudy("t")\nplot(toradians(180))', 2))[0])
      .toBeCloseTo(Math.PI, 9);
  });

  it("round_to_mintick snaps to the symbol's tick", () => {
    expect(plotted(run('//@version=4\nstudy("t")\nplot(round_to_mintick(1.2345))', 2))[0])
      .toBeCloseTo(1.23, 10);
  });

  it("random(min, max) stays inside its bounds", () => {
    const vals = plotted(run('//@version=4\nstudy("t")\nplot(random(5, 7))', 20));
    expect(vals.every(v => v >= 5 && v < 7)).toBe(true);
  });
});

describe("version gating follows TradingView's release notes", () => {
  const rejects = (src: string, needle: string) =>
    expect(() => compileScript(src)).toThrow(new RegExp(needle));

  it("the four maths names are v4 flat and v5 namespaced", () => {
    expect(() => compileScript('//@version=4\nstudy("t")\nplot(random(0, 1))')).not.toThrow();
    expect(() => compileScript('//@version=5\nindicator("t")\nplot(math.random(0, 1))')).not.toThrow();
    // v5 REMOVED the flat spelling — accepting both would be the silent failure.
    rejects('//@version=5\nindicator("t")\nplot(random(0, 1))', "renamed|not available|Undeclared");
    rejects('//@version=4\nstudy("t")\nplot(math.random(0, 1))', "not a namespace|not available");
  });

  it("they are NOT spellable at v3, where TradingView does not have them", () => {
    rejects('//@version=3\nstudy("t")\nplot(random(0, 1))', "not available in Pine Script v3");
    rejects('//@version=3\nstudy("t")\nplot(int(1.5))', "not available in Pine Script v3");
  });

  it("last_bar_index is v5 only", () => {
    rejects('//@version=4\nstudy("t")\nplot(last_bar_index)', "not available in Pine Script v4");
  });

  it("the chart-type tickers are flat through v4 and ticker.* at v5", () => {
    // Documented on the v3 page as well as the v4 one, so they are not v4-only.
    expect(() => compileScript('//@version=3\nstudy("t")\nx = renko(tickerid, "ATR", 10)\nplot(1)'))
      .not.toThrow();
    rejects('//@version=5\nindicator("t")\nx = renko(syminfo.tickerid, "ATR", 10)\nplot(1)',
            "renamed|not available|Undeclared");
  });
});

describe("unsupported things are refused, not approximated", () => {
  it("the non-standard chart tickers refuse rather than return a plain symbol", () => {
    expect(() => run('//@version=4\nstudy("t")\nx = renko(syminfo.tickerid, "ATR", 10)\nplot(1)', 2))
      .toThrow(/cannot build Renko bricks/);
  });

});
