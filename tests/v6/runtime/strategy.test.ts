/**
 * v6's strategy changes: `strategy.exit()` parameter pairs (V6Broker), and the
 * closed-trade limit with `strategy.closedtrades.first_index` (profile data).
 *
 * Every bar is open 100, high 110, low 90, so a position entered on bar 0
 * fills at 100 on bar 1 and any level between 90 and 110 is reached on that
 * same bar — which isolates "which level was chosen" from "when was it hit".
 *
 * Source: https://www.tradingview.com/pine-script-docs/migration-guides/to-pine-version-6/
 */
import { describe, it, expect } from "vitest";
import { compileScript } from "../../../transpiler/common";
import { compile, Context } from "../../../runtime/v6";
import { brokerFor, V5Broker, V6Broker } from "../../../runtime/v1/broker";
import type { LanguageProfile } from "../../../transpiler/common/profiles";

function run(src: string, bars = 4, profile?: (p: LanguageProfile) => LanguageProfile) {
  const compiled = compileScript(src);
  const ctx = new Context(profile ? profile(compiled.profile) : compiled.profile);
  ctx.mintick = 0.01;
  const exec = compile(compiled.js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
  for (let i = 0; i < bars; i++) {
    ctx.setBar(i * 86400000, 100, 110, 90, 100, 10);
    exec();
    ctx.finalizeBar();
  }
  return ctx;
}

const at = (v: number, body: string) => `//@version=${v}\nstrategy("t")\n${body}`;
const LONG = 'if bar_index == 0\n    strategy.entry("L", strategy.long)\n';
const SHORT = 'if bar_index == 0\n    strategy.entry("S", strategy.short)\n';

describe("the broker for each version", () => {
  it("is a V6Broker at v6, and still a V5Broker at v5", () => {
    expect(brokerFor(run(at(6, LONG), 1))).toBeInstanceOf(V6Broker);
    const v5 = brokerFor(run(at(5, LONG), 1));
    expect(v5).toBeInstanceOf(V5Broker);
    expect(v5).not.toBeInstanceOf(V6Broker);
  });
});

describe("strategy.exit() evaluates parameter pairs", () => {
  // profit = 500 ticks = 5.00, so the relative take-profit is 105; the
  // absolute one is 108. Price reaches 105 first.
  const TP = 'strategy.exit("X", "L", limit = 108.0, profit = 500)\n';

  it("v6 takes the take-profit that triggers first", () => {
    expect(run(at(6, LONG + TP)).trades[0].exitPrice).toBeCloseTo(105, 8);
  });

  it("v5 lets the absolute one win", () => {
    expect(run(at(5, LONG + TP)).trades[0].exitPrice).toBeCloseTo(108, 8);
  });

  it("the stop side picks the nearer level too", () => {
    // loss = 500 ticks below 100 is 95; the absolute stop is 92.
    const SL = 'strategy.exit("X", "L", stop = 92.0, loss = 500)\n';
    expect(run(at(6, LONG + SL)).trades[0].exitPrice).toBeCloseTo(95, 8);
    expect(run(at(5, LONG + SL)).trades[0].exitPrice).toBeCloseTo(92, 8);
  });

  it("mirrors for a short", () => {
    // Short at 100: profit 500 → 95, absolute limit 92. Nearer is 95.
    const TPS = 'strategy.exit("X", "S", limit = 92.0, profit = 500)\n';
    expect(run(at(6, SHORT + TPS)).trades[0].exitPrice).toBeCloseTo(95, 8);
    expect(run(at(5, SHORT + TPS)).trades[0].exitPrice).toBeCloseTo(92, 8);
  });

  it("the guide's own example: profit = 0 and loss = 0 exit at the entry price", () => {
    // "v6 exits immediately at the entry price, because the zero-distance
    // levels trigger first" — beside wide absolute levels, which v5 uses.
    const EX = 'strategy.exit("X", "L", limit = 108.0, stop = 92.0, profit = 0, loss = 0)\n';
    expect(run(at(6, LONG + EX)).trades[0].exitPrice).toBeCloseTo(100, 8);
  });

  it("a level given only one way is unaffected", () => {
    const ONLY = 'strategy.exit("X", "L", limit = 108.0)\n';
    expect(run(at(6, LONG + ONLY)).trades[0].exitPrice).toBeCloseTo(108, 8);
  });
});

describe("Excess orders are trimmed", () => {
  // One trade per bar: enter on even bars, close on odd ones.
  const CHURN =
    'if bar_index % 2 == 0\n    strategy.entry("L", strategy.long)\n' +
    'else\n    strategy.close("L")\n' +
    "fi = strategy.closedtrades.first_index\n" +
    "first = strategy.closedtrades.entry_price(0)\n" +
    "n = strategy.closedtrades\n";

  /** The v6 profile with a small limit, so the rule is testable in a few bars. */
  const keep = (k: number) => (p: LanguageProfile): LanguageProfile =>
    ({ ...p, defaults: { ...p.defaults, retainedClosedTrades: k } });

  const read = (ctx: Context, name: string) => ctx.vars.get(`opsv2_${name}`)?.valueOf();

  it("first_index is 0 while nothing has been trimmed", () => {
    const ctx = run(at(6, CHURN), 12);
    expect(ctx.trades.length).toBeGreaterThan(2);
    expect(read(ctx, "fi")).toBe(0);
    expect(read(ctx, "first")).toBeCloseTo(100, 8);
  });

  it("past the limit, the oldest trades read na and first_index names the oldest kept", () => {
    const ctx = run(at(6, CHURN), 12, keep(2));
    const total = ctx.trades.length;
    expect(total).toBeGreaterThan(2);
    expect(read(ctx, "fi")).toBe(total - 2);
    expect(Number.isNaN(read(ctx, "first"))).toBe(true);
  });

  it("trimming is reporting only: the trade count still sees every trade", () => {
    // "does not affect the data displayed in the Metrics tab or accessed by
    // other strategy.* built-ins".
    const ctx = run(at(6, CHURN), 12, keep(2));
    expect(read(ctx, "n")).toBe(ctx.trades.length);
  });

  it("the default limit is 9000", () => {
    expect(compileScript(at(6, "")).profile.defaults.retainedClosedTrades).toBe(9000);
  });

  it("strategy.closedtrades.first_index does not exist before v6", () => {
    expect(() => compileScript(at(5, "x = strategy.closedtrades.first_index\n")))
      .toThrow(/not available in Pine Script v5/);
  });
});
