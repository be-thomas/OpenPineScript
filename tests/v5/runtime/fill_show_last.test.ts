/**
 * `fill(show_last = N)`: "the number of bars, from the last bar back to the
 * past, to fill on the chart." The argument was dropped, so the fill covered
 * the whole history.
 *
 * `plot`'s own `show_last` is recorded on the plot and NOT applied to the
 * render model, so there is nothing to copy: the fill carries it as `colors`
 * (where `null` is a bar with no fill, as a conditional fill already
 * expresses it) and, for a host that wants the number, `showLast`.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const bars = Array.from({ length: 10 }, (_, i) => ({
  time: Date.UTC(2024, 0, 1) + i * 86_400_000,
  open: 100 + i, high: 105 + i, low: 95 + i, close: 100 + i, volume: 1000,
}));

function fills(src: string) {
  const s = new Session();
  expect(s.compile(src).errors).toEqual([]);
  return s.runHistory(bars);
}

const HEAD5 = '//@version=5\nindicator("t")\np1 = plot(close)\np2 = plot(open)\n';

describe("fill(show_last)", () => {
  it("fills only the last 3 of 10 bars", () => {
    const r = fills(HEAD5 + 'fill(p1, p2, color.red, show_last = 3)\n');
    expect(r.droppedArguments).toEqual([]);
    expect(r.fills).toHaveLength(1);
    const colors = r.fills[0].colors!;
    expect(colors).toHaveLength(10);
    expect(colors.map((c) => c !== null)).toEqual([false, false, false, false, false, false, false, true, true, true]);
    expect(new Set(colors.filter((c) => c !== null)).size).toBe(1);
    expect(r.fills[0].color).toBe(colors[9]);
    expect(r.fills[0].showLast).toBe(3);
  });

  it("reads v6's sixth positional argument as show_last", () => {
    const r = fills(HEAD5.replace("@version=5", "@version=6") + 'fill(p1, p2, color.red, "f", true, 2)\n');
    expect(r.droppedArguments).toEqual([]);
    expect(r.fills[0].colors!.map((c) => c !== null)).toEqual(
      [false, false, false, false, false, false, false, false, true, true]);
  });

  it("is absent from the model when the script gave none", () => {
    const r = fills(HEAD5 + 'fill(p1, p2, color.red)\n');
    expect(r.fills[0].colors).toBeUndefined();
    expect(r.fills[0].showLast).toBeUndefined();
  });

  it("show_last = 0 draws nothing; larger than the run draws everything", () => {
    expect(fills(HEAD5 + 'fill(p1, p2, color.red, show_last = 0)\n').fills[0].colors!.every((c) => c === null)).toBe(true);
    expect(fills(HEAD5 + 'fill(p1, p2, color.red, show_last = 500)\n').fills[0].colors!.every((c) => c !== null)).toBe(true);
  });

  it("show_last = 5 starts at last_bar_index - 4: five bars, the last one included (4 segments)", () => {
    // Evidence: conformance/v5/parity/harness_fill_show_last.png, TradingView on
    // BTCUSDT 1D with the live bar still forming. The band covers exactly the
    // last 5 bars, the live bar being one of them; the polygon runs from bar
    // N-4 to bar N joining bar centres, so it has 4 segments and nothing before
    // N-4. Here the last bar is index 9.
    const r = fills(HEAD5 + 'fill(p1, p2, color.red, show_last = 5)\n');
    const colors = r.fills[0].colors!;
    const shown = colors.map((c, i) => (c !== null ? i : -1)).filter((i) => i >= 0);
    expect(shown[0]).toBe(r.barsProcessed - 1 - 4);
    expect(shown).toEqual([5, 6, 7, 8, 9]);
  });
});
