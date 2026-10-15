/**
 * The render model has to carry enough to DRAW the script, not merely to
 * report its numbers.
 *
 * Both gaps below were found by rendering real scripts onto a chart. Each one
 * produced a picture that was wrong in a way no numeric assertion could catch:
 * the values were right and the drawing was not.
 */
import { describe, it, expect } from "vitest";
import { runScript } from "../../../runtime/v1/session";

const bars = (n: number) =>
  Array.from({ length: n }, (_, i) => {
    const up = i % 2 === 0;
    const p = 100 + i;
    return {
      time: Date.UTC(2024, 0, 1) + i * 86_400_000,
      open: up ? p : p + 2,
      high: p + 3, low: p - 3,
      close: up ? p + 2 : p,
      volume: 1000,
    };
  });

describe("a plot whose colour changes per bar", () => {
  const source =
    '//@version=5\nindicator("c", overlay = true)\n' +
    'plot(close, "c", color = close > open ? color.green : color.red)\n';

  it("reports the colour of each bar, not just the first", () => {
    const series = runScript(source, { candles: bars(10) }).series[0];
    const colors = series.data.map(d => (d as any)?.color ?? series.color);

    // Bars alternate up/down, so the plot must alternate too. Taking the
    // colour from the first sample and calling it the series colour drew ten
    // green bars for a script that asks for five green and five red.
    expect(new Set(colors).size).toBe(2);
    expect(colors[0]).not.toBe(colors[1]);
  });

  it("omits the colour on a plot that never changes it", () => {
    const flat = '//@version=5\nindicator("f", overlay = true)\nplot(close, "f", color = color.blue)\n';
    const series = runScript(flat, { candles: bars(10) }).series[0];

    // The per-point field is the exception, not the representation: a constant
    // colour stays one string on the series.
    expect(series.data.every(d => (d as any)?.color === undefined)).toBe(true);
    expect(series.color).toBeTruthy();
  });
});

describe("a shape plot", () => {
  it("reports where it is anchored", () => {
    const source =
      '//@version=5\nindicator("s", overlay = true)\n' +
      'plotshape(close > open, "up", style = shape.triangleup, location = location.belowbar, color = color.lime)\n';
    const series = runScript(source, { candles: bars(10) }).series[0];

    // `plotshape(close > open)` has a value of 1, which is not a price. Without
    // `location` a host has no way to decide where on the bar the triangle
    // goes, so it cannot draw the shape at all.
    expect(series.type).toBe("marker");
    expect(series.location).toBe("belowbar");
    expect(series.style).toBe("triangleup");
  });

  it("defaults to no location when the script names none", () => {
    const source = '//@version=5\nindicator("s", overlay = true)\nplotshape(close > open)\n';
    const series = runScript(source, { candles: bars(6) }).series[0];

    // Absent rather than invented: TradingView's own default is `abovebar`,
    // and that belongs to the host's drawing policy, not to this model.
    expect(series.location).toBeUndefined();
  });

  it("carries the label text and size a script sets", () => {
    const source =
      '//@version=5\nindicator("s", overlay = true)\n' +
      'plotshape(close > open, "up", location = location.abovebar, text = "BUY", size = size.small)\n';
    const series = runScript(source, { candles: bars(6) }).series[0];
    expect(series.text).toBe("BUY");
    expect(series.size).toBe("small");
  });
});
