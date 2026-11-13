/**
 * Regressions from the review of PR #3, one per finding, each written the way
 * the reviewer reproduced it.
 */
import { describe, it, expect } from "vitest";
import { compileScript } from "../../../transpiler/common";
import { compile, Context } from "../../../runtime/v6";
import { build, value, series } from "../helpers";
import { build as build5, series as series5 } from "../../v5/helpers";
import { attempt } from "../../../test-utils/common/transpileAs";
import { marginCallSize } from "../../../runtime/v1/broker";

const H6 = '//@version=6\nindicator("t")\n';
const H5 = '//@version=5\nindicator("t")\n';
const ok = (src: string) => { const r = attempt(6, src); expect(r.ok, r.ok ? "" : (r as any).message).toBe(true); };

describe("0 — time()'s third positional argument is timezone", () => {
  it("v5: time(tf, session, \"UTC\") is the bar's time, not na", () => {
    const vals = series5(H5 + 'x = time(timeframe.period, "0000-2359", "UTC")\n', "x", 2);
    expect(vals.every(v => Number.isFinite(v))).toBe(true);
  });

  it("v6: the same call, and time_close likewise", () => {
    expect(Number.isFinite(value(H6 + 'x = time(timeframe.period, "0000-2359", "UTC")\n', "x"))).toBe(true);
    expect(Number.isFinite(value(H6 + 'x = time_close(timeframe.period, "0000-2359", "UTC")\n', "x"))).toBe(true);
  });

  it("v5: a fifth positional argument does not reach timeframe_bars_back", () => {
    const vals = series5(H5 + 'x = time("D", "0000-2359", "UTC", 0, 3)\n', "x", 1);
    expect(Number.isFinite(vals[0])).toBe(true);
  });

  it("timezone by name is honoured now, so it is no longer recorded as dropped", () => {
    const b = build5(H5 + 'x = time("D", timezone = "UTC")\n');
    b.ctx.setBar(0, 1, 1, 1, 1, 1); b.exec();
    expect([...b.ctx.droppedArguments]).toEqual([]);
  });
});

describe("1 — a multiline string ending in a backslash", () => {
  it("compiles, and keeps the backslash", () => {
    const BS = "\\";
    expect(value(H6 + `x = """abc${BS}"""\n`, "x")).toBe("abc\\");
  });
});

describe("2 — only documented unique types need an else", () => {
  it("a const-string family may fall through to na", () => {
    ok(H6 + "c = close > open\ns = if c\n    size.small\n");
    ok(H6 + "i = 1\ns = switch i\n    1 => xloc.bar_index\n");
    ok(H6 + 'l = label.new(bar_index, close, "x", style = na)\n');
  });

  it("a plot.style_* switch still needs its default — the guide's example", () => {
    const r = attempt(6, H6 + "i = 1\ns = switch i\n    1 => plot.style_line\nplot(close, style = s)\n");
    expect(r.ok).toBe(false);
  });
});

describe("3 — a function's local shadows a global of the same name", () => {
  it("is not taken for the global's int", () => {
    ok(H6 + "int x = 1\nf() =>\n    x = close > open\n    if x\n        1\n    else\n        0\ny = f()\n");
  });
});

describe("4 — a parameter shadows a reassigned global", () => {
  it("is not taken for the global's series", () => {
    ok(H6 + "len = 10\nlen := 20\nf(len) => ta.ema(close, len)\ny = f(14)\n");
    ok(H6 + "off = 1\noff := 2\nf(off) =>\n    plot(close, offset = off)\n    0\n");
  });
});

describe("5 — positional arguments after a removed parameter", () => {
  /** The first recorded point of each plot, over a few bars — an offset moves it. */
  const points = (src: string) => {
    const b = build(H6 + src);
    for (let i = 0; i < 5; i++) { b.ctx.setBar(i * 86400000, 1, 1, 1, 1, 1); b.exec(); b.ctx.finalizeBar(); }
    return [...(b.ctx as any).plots.values()].map((s: any[]) => ({ at: s.findIndex(Boolean), p: s.find(Boolean) }));
  };

  it("v6 plot(): trackprice, histbase, offset in their own slots", () => {
    const [{ at, p }] = points('plot(close, "p", color.red, 2, plot.style_line, false, 5, 3)\n');
    expect([p.trackprice, p.histbase, at]).toEqual([false, 5, 3]);
    expect(p.color).toBe("#F23645");
  });

  it("v6 bgcolor(): the second argument is offset", () => {
    const [{ at, p }] = points("bgcolor(color.red, 2)\n");
    expect(at).toBe(2);
    expect(p.color).toBe("#F23645");
  });

  it("v6 strategy.close(): the second argument is comment, not when", () => {
    const src = '//@version=6\nstrategy("t")\n' +
      'if bar_index == 0\n    strategy.entry("L", strategy.long)\n' +
      'if bar_index == 2\n    strategy.close("L", "bye")\n';
    const { js, profile } = compileScript(src);
    const ctx = new Context(profile);
    const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
    for (let i = 0; i < 5; i++) { ctx.setBar(i * 86400000, 100, 101, 99, 100, 1); exec(); ctx.finalizeBar(); }
    expect(ctx.trades.length).toBe(1);
  });
});

describe("6 — one request.footprint() call means one place in the source", () => {
  const levels = [{ price: 10, buy: 1, sell: 1 }];
  const run = (src: string) => {
    const { js, profile } = compileScript(H6 + src);
    const ctx = new Context(profile);
    ctx.provideFootprints([{ time: 0, levels }, { time: 86400000, levels }]);
    const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
    for (let i = 0; i < 2; i++) { ctx.setBar(i * 86400000, 10, 10, 10, 10, 2); exec(); ctx.finalizeBar(); }
  };

  it("inside a loop is still one call", () => {
    expect(() => run("for i = 0 to 1\n    fp = request.footprint(1)\n")).not.toThrow();
  });

  it("two places are two calls", () => {
    expect(() => run("a = request.footprint(1)\nb = request.footprint(2)\n")).toThrow(/only one/);
  });
});

describe("7 — margin calls truncate to the minimum contract's precision", () => {
  it("a fractional crypto position is called, not rounded to zero", () => {
    // 0.5 BTC bought at 100 on 20 of cash at 25% margin, price 60: available
    // is negative, and Loss / price is a fraction of a contract.
    expect(marginCallSize(20, 0.5, 100, 60, 0.25, 0.0001)).toBeGreaterThan(0);
    // At whole shares the cover truncates to 0, and TradingView then calls
    // ONE contract rather than none (conformance/v6/golden/harness_v6_strategy,
    // bar 3429). This asserted 0 before that log existed.
    expect(marginCallSize(20, 0.5, 100, 60, 0.25, 1)).toBe(1);
  });

  it("a shortfall is never answered with no call", () => {
    expect(marginCallSize(100690.3956, -1.203, 83312, 83505.81, 1, 0.00001)).toBe(1);
    expect(marginCallSize(100000, -1.2, 82000, 82000, 1, 0.00001)).toBe(0);
  });

  it("the documented example is unchanged at whole shares", () => {
    expect(marginCallSize(1_000_000, 682_438, 4.43, 3.9, 0.25, 1)).toBe(111_052);
  });
});

describe("8, 9 — no quadratic or per-period work", () => {
  it("sort_indices on 10,000 objects is fast", () => {
    const src = H6 + "type P\n    float v\n" +
      "var a = array.new<P>()\nif barstate.isfirst\n    for i = 0 to 9999\n        a.push(P.new(math.random()))\n" +
      "i = a.sort_indices()\nx = i.size()\n";
    const t0 = Date.now();
    expect(value(src, "x")).toBe(10000);
    expect(Date.now() - t0).toBeLessThan(2000);
  });

  it("timeframe_bars_back = 50,000,000 on \"1\" is O(1)", () => {
    const t0 = Date.now();
    expect(Number.isFinite(value(H6 + 'x = time("1", timeframe_bars_back = 50000000)\n', "x"))).toBe(true);
    expect(Date.now() - t0).toBeLessThan(500);
  });

  it("…and agrees with stepping one period at a time, months included", () => {
    const at = (tf: string, n: number) => {
      const b = build(H6 + `x = time("${tf}", timeframe_bars_back = ${n})\n`);
      b.ctx.resolution = "60";
      b.ctx.setBar(Date.UTC(2024, 2, 31, 15), 1, 1, 1, 1, 1); b.exec();
      return b.ctx.vars.get("opsv2_x")?.valueOf();
    };
    expect(at("M", 1)).toBe(Date.UTC(2024, 1, 1));
    expect(at("M", 14)).toBe(Date.UTC(2023, 0, 1));
    expect(at("3M", 1)).toBe(Date.UTC(2023, 9, 1));
    expect(at("M", -10)).toBe(Date.UTC(2025, 0, 1));
    expect(at("W", 2)).toBe(Date.UTC(2024, 2, 11));
    expect(at("240", 3)).toBe(Date.UTC(2024, 2, 31, 0));
  });
});
