/**
 * What one run is allowed to leave behind for the next one.
 *
 * The engine is a library: several sessions, at several language versions,
 * share one process. Anything a compile writes onto a module-level export
 * outlives it and reaches every later session.
 */
import { describe, it, expect } from "vitest";
import { runScript } from "../../../runtime/v1/session";
import * as ta from "../../../runtime/v1/stdlib/ta";

const bars = (n: number) =>
  Array.from({ length: n }, (_, i) => {
    const mid = 100 + Math.sin(i / 7) * 8;
    return { time: Date.UTC(2024, 0, 1) + i * 86_400_000,
             open: mid, high: mid + 3, low: mid - 3, close: mid, volume: 1000 };
  });

describe("a v1-v3 run and the shared stdlib", () => {
  it("leaves ta.cross alone", () => {
    // At v1-v3 the bare name `cross` is BOTH the crossover test and the plot
    // style v4 renamed to `plot.style_cross`, so the sandbox's `cross` has to
    // answer "cross" when read as a value. That was done by defining
    // `valueOf` on the function the sandbox held — which is `entry.ref`, the
    // single `ta.cross` the whole module shares, not a per-Context copy.
    //
    // So the version guard scoped it only until the first v1-v3 compile.
    // After that, every later v4 or v5 session in the process saw a
    // value-bearing `ta.cross`, where `String(ta.cross)` answers "cross".
    expect(Object.prototype.hasOwnProperty.call(ta.cross, "valueOf")).toBe(false);

    runScript('//@version=3\nstudy("v3")\nplot(close, style = cross)\n', { candles: bars(40) });

    expect(Object.prototype.hasOwnProperty.call(ta.cross, "valueOf")).toBe(false);
    expect(String(ta.cross)).toContain("function");
  });

  it("still gives the v3 script its plot style", () => {
    const r = runScript('//@version=3\nstudy("v3")\nplot(close, style = cross)\n',
      { candles: bars(40) });
    expect(r.series[0].style).toBe("cross");
  });

  it("and a v5 run after it is unaffected", () => {
    runScript('//@version=3\nstudy("v3")\nplot(close, style = cross)\n', { candles: bars(40) });
    const r = runScript(
      '//@version=5\nindicator("v5")\nplot(ta.crossover(close, ta.sma(close, 5)) ? 1 : 0)\n',
      { candles: bars(40) });
    expect(r.series.length).toBe(1);
    expect(r.errors.filter(e => e.severity === "error")).toHaveLength(0);
  });
});
