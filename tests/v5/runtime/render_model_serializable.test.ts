/**
 * The render model has to survive leaving the process that built it.
 *
 * The documented integration runs the engine in a Web Worker or a backend, so
 * every `Compiled` and `SimResult` crosses a `postMessage` or a JSON boundary.
 * A model that is correct but not serializable is not usable by the host the
 * guide tells people to build.
 */
import { describe, it, expect } from "vitest";
import { Session, runScript } from "../../../runtime/v1/session";

const bars = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    time: Date.UTC(2024, 0, 1) + i * 86_400_000,
    open: 100, high: 101, low: 99, close: 100 + Math.sin(i / 5), volume: 1000,
  }));

/** Every function reachable from the value, by path. */
function functionsIn(root: unknown): string[] {
  const found: string[] = [];
  const seen = new Set<unknown>();
  const walk = (o: unknown, path: string) => {
    if (typeof o === "function") { found.push(path); return; }
    if (o === null || typeof o !== "object") return;
    if (seen.has(o)) return;
    seen.add(o);
    for (const [k, v] of Object.entries(o)) walk(v, `${path}.${k}`);
  };
  walk(root, "result");
  return found;
}

describe("a script that fills between two plots", () => {
  const source =
    '//@version=5\nindicator("f", overlay = true)\n' +
    'a = plot(ta.ema(close, 9), "Fast")\n' +
    'b = plot(ta.ema(close, 21), "Slow")\n' +
    'fill(a, b, color = color.blue)\n';

  it("names its plots with strings, not with the runtime object", () => {
    const result = runScript(source, { candles: bars(40) });
    expect(result.fills).toHaveLength(1);

    // `a` and `b` are `ctx.new_var(...)`, so they arrive at `fill()` as Series
    // wrappers. A Series holds the Context, the Context holds the sandbox, and
    // the sandbox holds every stdlib function — so storing one put the whole
    // runtime in the render model.
    expect(typeof result.fills[0].plotId1).toBe("string");
    expect(typeof result.fills[0].plotId2).toBe("string");
    expect(result.fills[0].plotId1).toBe("Fast");
    expect(result.fills[0].plotId2).toBe("Slow");
  });

  it("produces a result with no functions anywhere in it", () => {
    expect(functionsIn(runScript(source, { candles: bars(40) }))).toEqual([]);
  });

  it("produces a result that structuredClone accepts", () => {
    // This is the exact failure a Worker host hits: `postMessage` clones the
    // reply, and a DataCloneError there surfaces as a script that silently
    // never finishes running.
    expect(() => structuredClone(runScript(source, { candles: bars(40) }))).not.toThrow();
  });
});

describe("a plot whose colour is held in a variable", () => {
  const source =
    '//@version=5\nindicator("c", overlay = true)\n' +
    'col = close > open ? color.green : color.red\n' +
    'plot(close, "c", color = col)\n';

  it("records the colour, not the variable holding it", () => {
    const result = runScript(source, { candles: bars(20) });
    expect(functionsIn(result)).toEqual([]);
    expect(() => structuredClone(result)).not.toThrow();
    const colors = result.series[0].data.map(d => (d as any)?.color ?? result.series[0].color);
    expect(colors.every(c => typeof c === "string")).toBe(true);
  });
});

describe("every sample the charting UI ships", () => {
  // These are the scripts the chart's editor offers by default. Each one has
  // to cross the worker boundary, so each one is checked here rather than only
  // in the UI's own end-to-end suite.
  const samples: Array<[string, string]> = [
    ["moving averages", '//@version=5\nindicator("MA", overlay = true)\nf = plot(ta.ema(close, 9), "Fast")\ns = plot(ta.ema(close, 21), "Slow")\nfill(f, s, color = color.new(color.blue, 85))\n'],
    ["rsi", '//@version=5\nindicator("RSI")\nr = ta.rsi(close, 14)\nplot(r, "RSI")\nhline(70, "OB")\nhline(30, "OS")\nbgcolor(r > 70 ? color.new(color.red, 88) : na)\n'],
    ["signals", '//@version=5\nindicator("S", overlay = true)\nf = ta.sma(close, 10)\ns = ta.sma(close, 30)\nplotshape(ta.crossover(f, s), "Buy", style = shape.triangleup, location = location.belowbar, color = color.lime, text = "BUY")\nbarcolor(f > s ? color.green : color.red)\n'],
    ["strategy", '//@version=5\nstrategy("St", overlay = true)\nf = ta.sma(close, 10)\ns = ta.sma(close, 30)\nif ta.crossover(f, s)\n    strategy.entry("L", strategy.long)\nif ta.crossunder(f, s)\n    strategy.close("L")\n'],
    ["drawings", '//@version=5\nindicator("D", overlay = true)\nph = ta.pivothigh(high, 5, 5)\nif not na(ph)\n    line.new(bar_index - 5, ph, bar_index, ph, color = color.red)\n    label.new(bar_index - 5, ph, "H")\n'],
  ];

  for (const [name, source] of samples) {
    it(`${name} crosses a postMessage boundary`, () => {
      const session = new Session();
      const compiled = session.compile(source);
      expect(compiled.errors).toEqual([]);
      expect(() => structuredClone(compiled)).not.toThrow();

      const result = session.runHistory(bars(120));
      expect(result.errors).toEqual([]);
      expect(functionsIn(result)).toEqual([]);
      expect(() => structuredClone(result)).not.toThrow();
    });
  }
});
