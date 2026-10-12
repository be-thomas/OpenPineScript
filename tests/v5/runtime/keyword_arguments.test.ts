/**
 * Keyword arguments that used to be dropped on the floor.
 *
 * `Context.call` binds a keyword argument by looking its name up in the
 * callee's parameter list. A name the signature does not carry is discarded —
 * silently, because a missing parameter is indistinguishable from one the
 * caller chose not to pass. Forty distinct (function, argument) pairs were
 * being discarded across TradingView's own documentation corpus, and several
 * of them decide what a script DOES:
 *
 *   strategy.entry(when = …)      the order fired unconditionally
 *   strategy.exit(profit = …)     the take-profit side of a bracket vanished
 *   input.int(minval = 1)         clamped nothing
 *   plot(offset = …)              the series was not shifted
 *   box.new(xloc = xloc.bar_time) times were read as bar indices
 *   bgcolor(title = "…")          the plot kept its synthetic name
 *
 * `Context.droppedArguments` now records any that remain, and
 * conformance/common/docs_corpus_execution.test.ts asserts the set is empty
 * across all 742 scripts that compile.
 */
import { describe, it, expect } from "vitest";
import { compileScript } from "../../../transpiler/common";
import { compile, Context } from "../../../runtime/v5";

const HEAD = '//@version=5\nindicator("t")\n';
const STRAT = '//@version=5\nstrategy("t")\n';

function run(src: string, bars = 1, tune?: (c: Context) => void) {
  const { js, profile } = compileScript(src);
  const ctx = new Context(profile);
  tune?.(ctx);
  const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
  for (let i = 0; i < bars; i++) {
    ctx.setBar(i * 86400000, 100, 110, 90, 100 + i, 10);
    exec();
    ctx.finalizeBar();
  }
  return ctx;
}

const plots = (ctx: Context) => [...(ctx as any).plots.entries()] as Array<[string, any[]]>;

describe("nothing is dropped", () => {
  it("a script that passes every one of them records no drop", () => {
    const ctx = run(HEAD + [
      'n = input.int(5, "n", minval = 1, maxval = 10, step = 1, tooltip = "t", group = "g")',
      'plot(close, "p", color.red, 1, plot.style_line, display = display.none, offset = 0)',
      'bgcolor(color.new(color.blue, 90), title = "bg")',
      'plotchar(close > open, "c", "▲", location.top, size = size.tiny, text = "x")',
    ].join("\n") + "\n");
    expect([...ctx.droppedArguments]).toEqual([]);
  });

  it("...and a name no signature has IS recorded", () => {
    // The guard on the case above: the recording has to actually fire.
    const ctx = run(HEAD + 'plot(close, nonesuch = 1)\n');
    expect([...ctx.droppedArguments]).toEqual(["plot(nonesuch)"]);
  });
});

/**
 * A market order fills at the OPEN of the bar after the one that placed it, so
 * an order placed on every bar of an N-bar run is filled N-1 times — the last
 * one is still outstanding when the data runs out. These runs carry the extra
 * bar rather than lowering the expectation, so the assertion still reads as
 * "one fill per order".
 */
describe("`when` gates a strategy order", () => {
  it("false means no order at all", () => {
    const ctx = run(STRAT + 'strategy.entry("L", strategy.long, when = false)\n', 3);
    expect(ctx.position.size).toBe(0);
  });

  it("true places it", () => {
    const ctx = run(STRAT + 'strategy.entry("L", strategy.long, when = true)\n', 4);
    expect(ctx.position.size).toBe(3);
  });

  it("absent means true, which is the documented default", () => {
    const ctx = run(STRAT + 'strategy.entry("L", strategy.long)\n', 4);
    expect(ctx.position.size).toBe(3);
  });

  it("a condition decides bar by bar", () => {
    const ctx = run(STRAT + 'strategy.entry("L", strategy.long, when = bar_index == 1)\n', 3);
    expect(ctx.position.size).toBe(1);
  });
});

describe("an input's constraints are enforced, not just recorded", () => {
  it("minval clamps a host override", () => {
    const ctx = run(HEAD + 'n = input.int(5, "n", minval = 3)\nx = n\n', 1,
                    c => { c.userInputs["input_0"] = 1; });
    expect(ctx.vars.get("opsv2_x")?.valueOf()).toBe(3);
  });

  it("maxval clamps it the other way", () => {
    const ctx = run(HEAD + 'n = input.int(5, "n", maxval = 8)\nx = n\n', 1,
                    c => { c.userInputs["input_0"] = 99; });
    expect(ctx.vars.get("opsv2_x")?.valueOf()).toBe(8);
  });

  it("a value inside the range is untouched", () => {
    const ctx = run(HEAD + 'n = input.int(5, "n", minval = 1, maxval = 10)\nx = n\n', 1,
                    c => { c.userInputs["input_0"] = 7; });
    expect(ctx.vars.get("opsv2_x")?.valueOf()).toBe(7);
  });

  it("the constraints reach the definition a host renders from", () => {
    const ctx = run(HEAD + 'n = input.int(5, "Length", minval = 1, maxval = 10, tooltip = "why")\n');
    const def = ctx.inputDefs[0] as any;
    expect([def.minval, def.maxval, def.tooltip]).toEqual([1, 10, "why"]);
  });
});

describe("plot display arguments", () => {
  it("bgcolor takes a title", () => {
    const ctx = run(HEAD + 'bgcolor(color.red, title = "Session")\n');
    expect(plots(ctx).some(([, s]) => (s[0] as any)?.title === "Session")).toBe(true);
  });

  it("...and keeps its synthetic name without one", () => {
    const ctx = run(HEAD + "bgcolor(color.red)\n");
    expect(plots(ctx).some(([, s]) => String((s[0] as any)?.title).startsWith("_BGCOLOR_")))
      .toBe(true);
  });

  it("plotcandle records wickcolor and bordercolor", () => {
    const ctx = run(HEAD +
      "plotcandle(open, high, low, close, wickcolor = color.red, bordercolor = color.blue)\n");
    const first = plots(ctx)[0][1][0] as any;
    expect([first.wickcolor, first.bordercolor]).toEqual(["#FF5252", "#2196F3"]);
  });
});

describe("plot offset moves the value to another bar", () => {
  it("a negative offset writes it into an earlier slot", () => {
    // "Shifts the plot to the left or right on the chart." Unlike the other
    // display parameters this changes the SERIES, so it is applied rather than
    // recorded.
    const ctx = run(HEAD + "plot(close, offset = -1)\n", 4);
    const values = plots(ctx)[0][1].map((d: any) => d?.value);
    // Bar 1's close lands in slot 0, and the last bar has nothing to fill it.
    expect(values.slice(0, 3)).toEqual([101, 102, 103]);
  });

  it("no offset leaves the series where it was", () => {
    const ctx = run(HEAD + "plot(close)\n", 4);
    expect(plots(ctx)[0][1].map((d: any) => d?.value)).toEqual([100, 101, 102, 103]);
  });
});

describe("strategy.exit takes its target in ticks as well as in price", () => {
  const enter = 'if bar_index == 0\n    strategy.entry("L", strategy.long)\n';

  it("profit is a distance in ticks from the entry", () => {
    // mintick is 0.01 by default, so `profit = 500` is five price units.
    const ctx = run(STRAT + enter + 'strategy.exit("X", "L", profit = 500)\n', 4,
                    c => { c.mintick = 0.01; });
    expect(ctx.trades.length).toBe(1);
    expect(ctx.trades[0].exitPrice).toBeCloseTo(105, 8);
  });

  it("limit is the same target as a PRICE", () => {
    const ctx = run(STRAT + enter + 'strategy.exit("X", "L", limit = 105.0)\n', 4);
    expect(ctx.trades[0].exitPrice).toBeCloseTo(105, 8);
  });

  it("qty_percent closes part of the position", () => {
    const ctx = run(STRAT +
      'if bar_index == 0\n    strategy.entry("L", strategy.long, qty = 10)\n' +
      'strategy.exit("X", "L", qty_percent = 40, limit = 105.0)\n', 4);
    expect(ctx.trades[0].qty).toBeCloseTo(4, 8);
  });

  it("an explicit qty wins over the percentage, as the manual says", () => {
    const ctx = run(STRAT +
      'if bar_index == 0\n    strategy.entry("L", strategy.long, qty = 10)\n' +
      'strategy.exit("X", "L", qty = 3, qty_percent = 40, limit = 105.0)\n', 4);
    expect(ctx.trades[0].qty).toBeCloseTo(3, 8);
  });
});

describe("timestamp, in all three spellings", () => {
  const at = (body: string) =>
    run(HEAD + body).vars.get("opsv2_x")?.valueOf();

  it("a date string", () => {
    expect(at('x = timestamp("2021-01-01")\n')).toBe(Date.UTC(2021, 0, 1));
  });

  it("calendar fields, in the exchange time zone", () => {
    expect(at("x = timestamp(2021, 1, 1, 0, 0)\n")).toBe(Date.UTC(2021, 0, 1));
  });

  it("a named time zone", () => {
    // New York is UTC-5 on 1 January.
    expect(at('x = timestamp("America/New_York", 2021, 1, 1, 0, 0)\n'))
      .toBe(Date.UTC(2021, 0, 1, 5));
  });

  it("an offset time zone", () => {
    expect(at('x = timestamp("UTC+4", 2021, 1, 1, 0, 0)\n'))
      .toBe(Date.UTC(2020, 11, 31, 20));
  });

  it("a date string with its own offset", () => {
    expect(at('x = timestamp("3 Apr 2022 20:00 -0400")\n')).toBe(Date.UTC(2022, 3, 4));
  });

  it("the keyword spelling binds", () => {
    expect(at('x = timestamp(timezone = "UTC+4", year = 2021, month = 1, day = 1)\n'))
      .toBe(Date.UTC(2020, 11, 31, 20));
  });
});
