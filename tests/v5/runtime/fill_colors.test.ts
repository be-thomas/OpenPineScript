/**
 * A fill whose colour changes with the data.
 *
 * `fill(a, b, color = cond ? x : y)` is ordinary Pine — it is how every
 * Ichimoku cloud is written — and the render model carried one colour per
 * fill, taken from whichever bar happened to come first. The cloud therefore
 * drew in a single colour for the whole chart, which is the one thing a
 * cloud is for.
 */
import { describe, it, expect } from "vitest";
import { runScript } from "../../../runtime/v1/session";

const bars = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    time: Date.UTC(2024, 0, 1) + i * 86_400_000,
    open: 100, high: 102, low: 98, close: 100 + Math.sin(i / 9) * 8, volume: 1000,
  }));

const CLOUD =
  '//@version=5\nindicator("cloud", overlay = true)\n' +
  'fast = ta.sma(close, 5)\n' +
  'slow = ta.sma(close, 20)\n' +
  // Titled, because a fill names its plots by TITLE — two untitled plots
  // are both "Plot" and the fill ends up bounded by one line twice.
  'a = plot(fast, "Fast")\n' +
  'b = plot(slow, "Slow")\n' +
  'fill(a, b, color = fast > slow ? color.green : color.red, title = "Cloud")\n';

describe("a fill with a conditional colour", () => {
  const r = runScript(CLOUD, { candles: bars(200) });
  const fill = r.fills[0];

  it("is reported once, between the two plots that bound it", () => {
    expect(r.fills).toHaveLength(1);
    expect(fill.title).toBe("Cloud");
    expect(fill.plotId1).not.toBe(fill.plotId2);
  });

  it("carries the colour of every bar", () => {
    expect(fill.colors).toBeDefined();
    expect(fill.colors!.length).toBe(200);
  });

  it("takes both branches of the condition", () => {
    const distinct = new Set(fill.colors!.filter(c => c !== null));
    expect(distinct.size).toBe(2);
  });

  it("agrees with the plots it sits between, bar by bar", () => {
    const value = (name: string) =>
      r.series.find(s => s.title === name || s.id === name)!.data
        .map(p => (p as any)?.value ?? null);
    const fast = value(fill.plotId1);
    const slow = value(fill.plotId2);
    for (let i = 0; i < fast.length; i++) {
      const colour = fill.colors![i];
      if (colour === null || fast[i] === null || slow[i] === null) continue;
      // Green above, red below — the script's own condition, checked against
      // the numbers the same run produced.
      expect(colour.toLowerCase().startsWith("#4caf50"), `bar ${i}`)
        .toBe(fast[i]! > slow[i]!);
    }
  });

  it("says nothing extra when the colour never changes", () => {
    const plain = runScript(
      '//@version=5\nindicator("c")\n' +
      'a = plot(close)\nb = plot(close * 0.99)\n' +
      'fill(a, b, color = color.blue)\n',
      { candles: bars(50) },
    );
    // One colour on the fill is the common case; 50 copies of one string is
    // not information.
    expect(plain.fills[0].colors).toBeUndefined();
    expect(plain.fills[0].color).toBeTruthy();
  });
});
