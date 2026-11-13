/**
 * nvi / pvi / cumulative volume-family na handling. TradingView:
 *   nvi := na(close) or na(close[1]) or close[1] == 0 ? prev : volume < nz(volume[1]) ? prev + (close - close[1]) / close[1] * prev : prev
 * so an na volume never moves the index and an unusable close keeps the previous value.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../index";

const bar = (i: number, close: number, volume: number) => ({
  time: 1_600_000_000_000 + i * 86_400_000, open: close, high: close + 1, low: close - 1, close, volume,
});

function run(bars: ReturnType<typeof bar>[]): Record<string, number[]> {
  const src = '//@version=5\nindicator("t")\n' +
    ["nvi", "pvi", "obv", "pvt", "accdist", "wad"].map(n => `plot(ta.${n}, "${n}")`).join("\n") + "\n";
  const s = new Session();
  s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "D", mintick: 0.01, timezone: "UTC", type: "crypto" });
  expect(s.compile(src).errors).toEqual([]);
  const result: any = s.runHistory(bars);
  expect(result.errors).toEqual([]);
  return Object.fromEntries(result.series.map((p: any) => [p.title, p.data.map((d: any) => d?.value ?? NaN)]));
}

describe("volume family na handling", () => {
  it("an na volume leaves nvi and pvi unchanged", () => {
    const out = run([bar(0, 100, 100), bar(1, 110, 50), bar(2, 120, NaN), bar(3, 130, 10)]);
    expect(out.nvi[1]).toBeCloseTo(1.1, 10);
    expect(out.nvi[2]).toBe(out.nvi[1]);
    expect(out.pvi[2]).toBe(out.pvi[1]);
  });

  it("an na close mid-history does not poison later nvi/pvi or the cumulative series", () => {
    const out = run([
      bar(0, 100, 100), bar(1, 110, 50), bar(2, NaN, 60), bar(3, 120, 40), bar(4, 125, 70), bar(5, 130, 20),
    ]);
    for (const k of ["nvi", "pvi", "obv", "pvt", "accdist", "wad"]) {
      expect(Number.isFinite(out[k][5]), k).toBe(true);
    }
    expect(out.nvi[2]).toBe(out.nvi[1]);
    expect(out.pvi[2]).toBe(out.pvi[1]);
    expect(out.nvi[3]).toBe(out.nvi[2]);
    expect(out.pvi[3]).toBe(out.pvi[2]);
  });
});

describe("true range with an na previous close", () => {
  it("ta.tr falls back to high - low and ta.atr stays finite", () => {
    const bars = [bar(0, 100, 10), bar(1, NaN, 10), bar(2, 105, 10), bar(3, 106, 10), bar(4, 107, 10)];
    const src = '//@version=5\nindicator("t")\nplot(ta.tr(true), "tr")\nplot(ta.atr(2), "atr")\n';
    const s = new Session();
    s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "D", mintick: 0.01, timezone: "UTC", type: "crypto" });
    expect(s.compile(src).errors).toEqual([]);
    const result: any = s.runHistory(bars);
    expect(result.errors).toEqual([]);
    const out = Object.fromEntries(result.series.map((p: any) => [p.title, p.data.map((d: any) => d?.value ?? NaN)]));
    expect(out.tr[2]).toBe(2);
    expect(Number.isFinite(out.tr[2])).toBe(true);
    expect(Number.isFinite(out.atr[3])).toBe(true);
    expect(Number.isFinite(out.atr[4])).toBe(true);
  });
});

describe("volume family on the forming bar", () => {
  it("a re-tick that changes the close updates every getter (the forming bar is not stale-cached)", () => {
    const H = 3_600_000, t0 = Date.UTC(2024, 0, 1);
    const hist = [100, 101, 102].map((c, i) => ({ time: t0 + i * H, open: c, high: c + 1, low: c - 1, close: c, volume: 10 }));
    const rt = (close: number) => ({ time: t0 + 3 * H, open: 102, high: 105, low: 98, close, volume: 10 });
    const s = new Session();
    s.setChart({ symbol: "TEST:X", timeframe: "60", mintick: 0.01 });
    const names = ["obv", "pvt", "accdist", "wad", "nvi", "pvi", "iii", "wvad"];
    const src = '//@version=5\nindicator("t")\n' + names.map(n => `plot(ta.${n}, "${n}")`).join("\n") + "\n";
    expect(s.compile(src).errors).toEqual([]);
    s.runHistory(hist);
    const last = (): number[] => [...(s as any).ctx.plots.values()].map((p: any) => p.at(-1).value);
    s.tick(rt(104));
    const up = last();
    s.tick(rt(100));
    const down = last();
    s.tick(rt(104));
    expect(last()).toEqual(up);
    expect(down[0]).toBe(up[0] - 20); // obv: +10 up, -10 down
    expect(down[2]).not.toBe(up[2]);
  });
});
