/**
 * What a SETTINGS dialog needs from the engine.
 *
 * TradingView's cog opens a panel built from the script's own `input()` calls:
 * a bounded spinner where the script gave `minval`/`maxval`, a dropdown where
 * it gave `options`, a tooltip where it gave one, sections where it gave
 * `group`. The engine recorded every one of those and passed none of them on,
 * so a host could only ever draw a bare text box — and then watch the value it
 * sent back get silently clamped or replaced.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const bars = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    time: Date.UTC(2024, 0, 1) + i * 86_400_000,
    open: 100, high: 102, low: 98, close: 100 + Math.sin(i / 9) * 6, volume: 1000,
  }));

describe("an input's declared constraints", () => {
  const source =
    '//@version=5\nindicator("i")\n' +
    'n = input.int(14, "Length", minval = 2, maxval = 50, step = 2, tooltip = "In bars", group = "Main")\n' +
    'm = input.string("sma", "Type", options = ["sma", "ema", "wma"])\n' +
    'b = input.bool(true, "Enabled", inline = "row1")\n' +
    'plot(n)\n';

  const inputs = new Session().compile(source).inputs;

  it("reports the bounds and step a spinner needs", () => {
    const n = inputs.find(i => i.title === "Length")!;
    expect(n.minval).toBe(2);
    expect(n.maxval).toBe(50);
    expect(n.step).toBe(2);
  });

  it("reports the option list a dropdown needs", () => {
    const m = inputs.find(i => i.title === "Type")!;
    expect(m.options).toEqual(["sma", "ema", "wma"]);
  });

  it("reports the layout and help text", () => {
    expect(inputs.find(i => i.title === "Length")!.tooltip).toBe("In bars");
    expect(inputs.find(i => i.title === "Length")!.group).toBe("Main");
    expect(inputs.find(i => i.title === "Enabled")!.inline).toBe("row1");
  });

  it("omits what the script did not declare", () => {
    // Absent means "no constraint". A host that invents a default range puts
    // bounds on a value the author deliberately left open.
    const m = inputs.find(i => i.title === "Type")!;
    expect(m.minval).toBeUndefined();
    expect(m.maxval).toBeUndefined();
    expect(m.tooltip).toBeUndefined();
  });
});

describe("an option list built from variables", () => {
  // TradingView's own style guide publishes exactly this shape
  // (`v5-writing-style-guide-04`): named constants, then an `options` list
  // referring to them.
  const source =
    '//@version=5\nindicator("i")\n' +
    'A = "alpha"\nB = "beta"\n' +
    'v = input.string(A, "Pick", options = [A, B])\n' +
    'plot(v == "beta" ? 1 : 0)\n';

  it("reports the option VALUES, not the variables holding them", () => {
    // `A` and `B` are `ctx.new_var(...)`, so the list arrives as an array of
    // Series — each holding the Context and through it the whole sandbox.
    const inputs = new Session().compile(source).inputs;
    expect(inputs[0].options).toEqual(["alpha", "beta"]);
  });

  it("lets a host clone the compile reply", () => {
    expect(() => structuredClone(new Session().compile(source))).not.toThrow();
  });

  it("accepts a choice from the list", () => {
    // `constrainInput` falls back to the default for a value outside
    // `options`, and `options.includes(aSeries)` is never true — so every
    // option list rejected every choice and silently reverted.
    const session = new Session();
    session.compile(source);
    session.setInputs({ input_0: "beta" });
    const point = session.runHistory(bars(5)).series[0].data[4] as any;
    expect(point.value).toBe(1);
  });
});

describe("a strategy's overridable properties", () => {
  const source =
    '//@version=5\nstrategy("P", overlay = true, initial_capital = 10000)\n' +
    'f = ta.sma(close, 5)\ns = ta.sma(close, 20)\n' +
    'if ta.crossover(f, s)\n    strategy.entry("L", strategy.long)\n' +
    'if ta.crossunder(f, s)\n    strategy.close("L")\nplot(f)\n';

  it("reports what the script declared", () => {
    const compiled = new Session().compile(source);
    const capital = compiled.properties.find(p => p.key === "initial_capital")!;
    expect(capital.current).toBe(10000);
    expect(capital.declared).toBe(10000);
  });

  it("applies a host override to the backtest", () => {
    const session = new Session();
    session.setProperties({ initial_capital: 250_000 });
    session.compile(source);
    const result = session.runHistory(bars(120));
    expect(result.errors).toEqual([]);
    expect(result.barsProcessed).toBeGreaterThan(0);
  });

  it("keeps the script's own value alongside the override, so a reset can restore it", () => {
    const session = new Session();
    session.setProperties({ initial_capital: 250_000 });
    const capital = session.compile(source).properties.find(p => p.key === "initial_capital")!;
    expect(capital.current).toBe(250_000);
    // Reading this back off the Context returned the override, which made the
    // reset button restore the value it was resetting away from.
    expect(capital.declared).toBe(10_000);
  });

  it("gives a study no properties to change", () => {
    const compiled = new Session().compile('//@version=5\nindicator("i")\nplot(close)\n');
    expect(compiled.properties).toEqual([]);
  });
});
