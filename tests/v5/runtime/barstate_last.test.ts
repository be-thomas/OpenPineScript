/**
 * `barstate.islast` on a historical run.
 *
 * It was false on every bar, the last one included, because `is_last` is
 * written only by the live-tick path and a `runHistory` never goes near it.
 * TradingView's own documentation guards its tables, its summary labels and
 * its end-of-chart drawings with this flag — all of which therefore drew
 * nothing at all, with no error to say so.
 */
import { describe, it, expect } from "vitest";
import { runScript, Session } from "../../../runtime/v1/session";

const bars = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    time: Date.UTC(2024, 0, 1) + i * 86_400_000,
    open: 100, high: 102, low: 98, close: 100 + Math.sin(i / 7) * 5, volume: 1000,
  }));

describe("barstate.islast", () => {
  const r = runScript(
    '//@version=5\nindicator("t")\nplot(barstate.islast ? 1 : 0, "flag")\n',
    { candles: bars(60) },
  );
  const flag = r.series[0].data.map(p => (p as any)?.value ?? null);

  it("is true on the dataset's final bar", () => {
    expect(flag[flag.length - 1]).toBe(1);
  });

  it("is true on that bar and no other", () => {
    expect(flag.filter(v => v === 1)).toHaveLength(1);
    expect(flag.slice(0, -1).every(v => v === 0)).toBe(true);
  });

  it("lets the draw-once-at-the-end idiom run", () => {
    // The commonest shape in TradingView's docs: build the drawing on the
    // last bar only. It used to produce nothing.
    const drawn = runScript(
      '//@version=5\n' +
      'indicator("t", overlay = true)\n' +
      'if barstate.islast\n' +
      '    label.new(bar_index, close, "last")\n',
      { candles: bars(60) },
    );
    expect(drawn.drawings).toHaveLength(1);
    expect(drawn.drawings[0].kind).toBe("label");
  });

  it("stays false when the host never said how long the run is", () => {
    // Without a declared extent there is no way to know which bar is last
    // until it has been passed, and guessing would fire the idiom early.
    const ctxless = new Session();
    ctxless.compile('//@version=5\nindicator("t")\nplot(barstate.islast ? 1 : 0)\n');
    const empty = ctxless.runHistory([]);
    expect(empty.series).toHaveLength(0);
  });

  it("agrees with last_bar_index", () => {
    const both = runScript(
      '//@version=5\nindicator("t")\n' +
      'plot(barstate.islast and bar_index == last_bar_index ? 1 : 0, "agree")\n' +
      'plot(barstate.islast != (bar_index == last_bar_index) ? 1 : 0, "disagree")\n',
      { candles: bars(60) },
    );
    const agree = both.series[0].data.map(p => (p as any)?.value);
    const disagree = both.series[1].data.map(p => (p as any)?.value);
    expect(agree[agree.length - 1]).toBe(1);
    expect(disagree.every(v => v === 0)).toBe(true);
  });
});
