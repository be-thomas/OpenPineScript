/**
 * Regressions from the review of PR #4, each as the reviewer reproduced it.
 */
import { describe, it, expect } from "vitest";
import { build } from "../helpers";
import { compileScript } from "../../../transpiler/common";
import { compile, Context } from "../../../runtime/v4";

const H5 = '//@version=5\nindicator("t")\n';

/** One bar at `t` on a `res` chart, returning `x`. */
function at(src: string, t: number, res: string, tune?: (ctx: any) => void): any {
  const b = build(H5 + src);
  b.ctx.resolution = res;
  tune?.(b.ctx);
  b.ctx.setBar(t, 1, 1, 1, 1, 1);
  b.exec();
  return b.ctx.vars.get("opsv2_x")?.valueOf();
}

describe("time() alignment only where TradingView's log shows it", () => {
  // An NSE hourly bar: 09:15 IST is 03:45Z, off the UTC hour grid.
  const NSE = Date.UTC(2026, 0, 5, 3, 45);

  it("time(timeframe.period) is the bar's own open", () => {
    expect(at("x = time(timeframe.period)\n", NSE, "60")).toBe(NSE);
    expect(at("x = time_close(timeframe.period)\n", NSE, "60")).toBe(NSE + 3_600_000);
  });

  it("a market off the UTC grid keeps the bar's time for a higher timeframe", () => {
    expect(at('x = time("240")\n', NSE, "60")).toBe(NSE);
    // A US daily bar stamped at the 14:30Z open.
    const US = Date.UTC(2026, 0, 5, 14, 30);
    expect(at('x = time("W")\n', US, "D")).toBe(US);
  });

  it("an exchange timezone the host declares as non-UTC keeps the bar's time", () => {
    const t = Date.UTC(2026, 0, 5, 15);
    expect(at('x = time("D")\n', t, "60", c => c.provideSymbolInfo({ timezone: "America/New_York" }))).toBe(t);
  });

  it("a UTC market on the grid still aligns, as in the log", () => {
    expect(at('x = time("D")\n', Date.UTC(2026, 0, 5, 15), "60")).toBe(Date.UTC(2026, 0, 5));
  });
});

describe("timeframe strings resolutionStart could not read", () => {
  it("\"\" is the chart's timeframe", () => {
    const t = Date.UTC(2026, 0, 5);
    expect(at('x = time_close("")\n', t, "D")).toBe(t + 86_400_000);
    expect(at('x = time("")\n', t, "D")).toBe(t);
  });

  it("an unparseable timeframe leaves a valid time valid", () => {
    const t = Date.UTC(2026, 0, 5, 3, 7, 11);
    expect(at("x = time(timeframe.period)\n", t, "1T")).toBe(t);
    expect(at('x = time("1T")\n', t, "1")).toBe(t);
  });

  it("\"2W\" groups two weeks rather than one", () => {
    // Weeks are counted from the Monday before the epoch — the same origin
    // runtime/v1/timeframes.ts gives `request.security`'s weekly bars, so the
    // two agree. 2026-01-08 is in the fortnight starting Monday 2025-12-29.
    const t = Date.UTC(2026, 0, 8, 12);
    expect(at('x = time("W")\n', t, "60")).toBe(Date.UTC(2026, 0, 5));
    expect(at('x = time("2W")\n', t, "60")).toBe(Date.UTC(2025, 11, 29));
  });
});

describe("bars_back", () => {
  it("is the time of the bar N bars back on the chart's timeframe", () => {
    const b = build(H5 + "x = time(timeframe.period, bars_back = 1)\n");
    b.ctx.resolution = "D";
    for (let i = 0; i < 3; i++) { b.ctx.currentBarIndex = i; b.ctx.setBar(i * 86_400_000, 1, 1, 1, 1, 1); b.exec(); b.ctx.finalizeBar(); }
    expect(b.ctx.vars.get("opsv2_x")?.valueOf()).toBe(86_400_000);
  });

  it("is na before the first bar, and a future bar's time when negative", () => {
    expect(Number.isNaN(at("x = time(timeframe.period, bars_back = 1)\n", 0, "D"))).toBe(true);
    expect(at("x = time(timeframe.period, bars_back = -2)\n", 0, "D")).toBe(2 * 86_400_000);
  });

  it("is still recorded as unhonoured at v4, which has no such argument", () => {
    const { js, profile } = compileScript('//@version=4\nstudy("t")\nx = time(timeframe.period, bars_back = 1)\n');
    const ctx = new Context(profile);
    const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
    ctx.setBar(0, 1, 1, 1, 1, 1); exec();
    expect([...ctx.droppedArguments]).toContain("time(bars_back)");
  });
});
