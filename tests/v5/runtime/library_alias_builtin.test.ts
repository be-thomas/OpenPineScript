/**
 * A library alias spelled like a built-in namespace adds to it.
 *
 *     import TradingView/ta/10 as ta
 *     x = ta.sma(close, 3)     // the library exports no `sma`
 *
 * is how published libraries and scripts are written, and they compile on
 * TradingView, so `ta.sma` there is the built-in. It was an error naming
 * everything the library does export. What the library DOES export still
 * wins, and a name neither has is still an error.
 *
 * That TradingView falls back this way is inferred from those libraries
 * compiling there, not from a log of its own.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const bars = Array.from({ length: 8 }, (_, i) => ({
  time: Date.UTC(2024, 0, 1) + i * 86_400_000, open: 1, high: 2, low: 0.5, close: i + 1, volume: 1,
}));

const LIB = [
  '//@version=5',
  'library("ta")',
  'export dema(float x) =>',
  '    x * 100',
].join("\n") + "\n";

const host = (body: string) => `//@version=5\nindicator("t")\nimport me/ta/1 as ta\n${body}\n`;

describe("an import aliased as a built-in namespace", () => {
  it("falls back to the built-in for a member the library does not export", () => {
    const s = new Session();
    expect(s.compile(host('plot(ta.sma(close, 3), "sma")\nplot(ta.dema(close), "lib")'), { libraries: { "me/ta/1": LIB } }).errors).toEqual([]);
    const r = s.runHistory(bars);
    const col = (t: string) => r.series.find((x: any) => x.title === t)!.data.map((d: any) => d?.value ?? null);
    expect(col("sma")[7]).toBe(7);        // (6 + 7 + 8) / 3
    expect(col("lib")[7]).toBe(800);      // the library's own, not a built-in
  });

  it("still reports a member that is neither exported nor built in", () => {
    const c = new Session().compile(host('plot(ta.nosuch(close), "x")'), { libraries: { "me/ta/1": LIB } });
    expect(c.errors[0].message).toMatch(/does not export 'nosuch'/);
  });

  it("runs the library's own function when it exports a built-in's name, and the built-in for the rest", () => {
    // `ta.sma` and `ta.highest` here are the library's: src * 1000 + n and n * 7.
    // `ta.ema` is not exported, so it is still the built-in.
    const SAME = [
      '//@version=5',
      'library("ta")',
      'export sma(float src, int n) =>',
      '    src * 1000 + n',
      'export highest(int n) =>',
      '    n * 7',
    ].join("\n") + "\n";
    const s = new Session();
    expect(s.compile(host([
      'plot(ta.sma(close, 3), "pos")',
      'plot(ta.sma(src = close, n = 3), "kw")',
      'plot(ta.highest(5), "hi")',
      'plot(ta.ema(close, 1), "ema")',
    ].join("\n")), { libraries: { "me/ta/1": SAME } }).errors).toEqual([]);
    const r = s.runHistory(bars);
    const col = (t: string) => r.series.find((x: any) => x.title === t)!.data.map((d: any) => d?.value ?? null);
    expect(col("pos")[7]).toBe(8003);     // 8 * 1000 + 3
    expect(col("kw")[7]).toBe(8003);
    expect(col("hi")[7]).toBe(35);
    expect(col("ema")[7]).toBe(8);        // ema of length 1 is the close
    expect(r.droppedArguments).toEqual([]);
  });
});
