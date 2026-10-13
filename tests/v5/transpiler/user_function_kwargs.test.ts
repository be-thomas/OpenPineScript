/**
 * Keyword arguments to a USER-DEFINED function.
 *
 * SOURCING. TradingView's own maps page publishes
 *
 *     averages.toTable(header = headerText, textSize = txtSize)
 *
 * as a working example (`v5-language-maps-12`), against a method whose first
 * parameter has a default. So a user function takes keyword arguments, and
 * skipping an earlier parameter falls back to its declared default.
 *
 * ── What was wrong ─────────────────────────────────────────────────────────
 *
 * `Context.call` resolved keywords against the BUILT-IN registry, which knows
 * nothing about a user's function. With no entry it fell through to
 * `fn(...args)` — handing the keyword bundle to the function as its next
 * POSITIONAL argument. `f(b = 5)` put `{b: 5}` into `a` and returned `na`,
 * with no error anywhere. The emitter now records the parameter names on the
 * function itself.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const bars = Array.from({ length: 5 }, (_, i) => ({
  time: Date.UTC(2024, 0, 1) + i * 60_000,
  open: 10, high: 11, low: 9, close: 10, volume: 1,
}));

/** The last plotted value of a one-plot script. */
function lastPlot(source: string): number | null {
  const session = new Session();
  const compiled = session.compile(source);
  expect(compiled.errors).toEqual([]);
  const point = session.runHistory(bars).series[0]?.data?.[bars.length - 1] as any;
  return point ? point.value : null;
}

describe("a user-defined function called with keyword arguments", () => {
  it("binds a trailing keyword to its named parameter", () => {
    expect(lastPlot('//@version=5\nindicator("t")\nf(a, b) =>\n    a + b\nplot(f(1, b = 5))\n')).toBe(6);
  });

  it("falls back to a parameter's default when the keyword skips it", () => {
    expect(lastPlot('//@version=5\nindicator("t")\nf(a = 1, b = 2) =>\n    a + b\nplot(f(b = 5))\n')).toBe(6);
  });

  it("still works entirely positionally", () => {
    expect(lastPlot('//@version=5\nindicator("t")\nf(a, b) =>\n    a + b\nplot(f(1, 5))\n')).toBe(6);
  });

  it("binds keywords on a method too", () => {
    const src =
      '//@version=5\nindicator("t")\n' +
      'method g(float this, float k = 2) =>\n    this * k\n' +
      'x = 3.0\nplot(x.g(k = 4))\n';
    expect(lastPlot(src)).toBe(12);
  });

  it("works at v4 and v2, where the same dispatch runs", () => {
    expect(lastPlot('//@version=4\nstudy("t")\nf(a, b) =>\n    a + b\nplot(f(1, b = 5))\n')).toBe(6);
    expect(lastPlot('//@version=2\nstudy("t")\nf(a, b) => a + b\nplot(f(1, b = 5))\n')).toBe(6);
  });

  it("leaves a single-line body's object literal alone", () => {
    // The bundle is recognised by its emitter-prefixed keys, so an ordinary
    // object reaching a user function positionally must not be mistaken for one.
    const src =
      '//@version=5\nindicator("t")\n' +
      'f(p) =>\n    p.index + p.price\n' +
      'plot(f(chart.point.from_index(2, 3)))\n';
    expect(lastPlot(src)).toBe(5);
  });
});
