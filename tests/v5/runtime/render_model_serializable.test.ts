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

describe("a v1–v3 plot style that is also a function", () => {
  // SOURCING. TradingView publishes the same how-to twice: `style = cross` at
  // v3 (`v3-appendix-howtos-09`) and `style = plot.style_cross` at v4
  // (`v4-appendix-howtos-10`), over an otherwise identical script. The bare
  // global is that style's v1–v3 spelling — and it collides with `cross(x, y)`,
  // which is why it was the only style in the family with no constant.
  const source =
    '//@version=3\nstudy("My Script", overlay=true)\n' +
    'is_new_day() => \n    d=dayofweek\n    na(d[1]) or d != d[1]\n' +
    'plot(barssince(is_new_day()), style=cross)\n';

  it("records the style as a string, not as the function", () => {
    const series = runScript(source, { candles: bars(30) }).series[0];
    // The FUNCTION was being stored, which put a live closure — and through it
    // the Context and the whole sandbox — inside the render model.
    expect(series.style).toBe("cross");
  });

  it("still calls cross(x, y) as a function", () => {
    const crossing =
      '//@version=3\nstudy("c")\n' +
      'plot(cross(close, open) ? 1 : 0)\n';
    const result = runScript(crossing, { candles: bars(30) });
    expect(result.errors).toEqual([]);
    const values = result.series[0].data.map(d => (d as any)?.value);
    expect(values.some(v => v === 1)).toBe(true);
  });

  it("leaves a result with no functions in it", () => {
    expect(functionsIn(runScript(source, { candles: bars(30) }))).toEqual([]);
    expect(() => structuredClone(runScript(source, { candles: bars(30) }))).not.toThrow();
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
