/**
 * `plot(x, color = cond ? color.red : na)` — the ordinary Pine way to hide a
 * plot on some bars.
 */
import { describe, it, expect } from "vitest";
import { runScript } from "../../../runtime/v1/session";

const bars = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    time: Date.UTC(2024, 0, 1) + i * 86_400_000,
    open: 100, high: 103, low: 97, close: 100 + (i % 5), volume: 1000,
  }));

describe("a point whose colour is na", () => {
  it("is not drawn", () => {
    const r = runScript(
      '//@version=5\nindicator("H", overlay = true)\n' +
      'plot(close, color = bar_index % 2 == 0 ? color.red : na)\n',
      { candles: bars(40) });

    const data = r.series[0].data;
    // The colour was read as "no override given", which means "use the
    // series default" — so exactly the bars the script wanted hidden came
    // out in the series colour, which here is red. The opposite of the ask.
    expect(data.filter(p => p === null)).toHaveLength(20);
    expect(data.filter(p => p !== null)).toHaveLength(20);
  });

  it("does not hide a plot that simply has no colour of its own", () => {
    // A series with no colour leaves every point's colour absent, and that is
    // a plot drawn in the host's default — not forty hidden bars.
    const r = runScript('//@version=5\nindicator("P")\nplot(close)\n', { candles: bars(40) });
    expect(r.series[0].data.filter(p => p !== null)).toHaveLength(40);
  });
});
