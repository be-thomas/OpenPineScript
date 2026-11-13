/**
 * Regressions from the review of PR #5, one block per finding, at v6. The v5
 * findings are in tests/v5/runtime/review_pr5.test.ts.
 */
import { describe, it, expect } from "vitest";
import { compileScript } from "../../../transpiler/common";
import { compile, Context } from "../../../runtime/v6";

/** Runs `bars` bars of open 100, high 101, low 99, close 100.5 and returns `name` per bar. */
function run(src: string, name: string, bars = 6, setup?: (c: Context) => void): any[] {
  const { js, profile } = compileScript(src);
  const ctx = new Context(profile);
  setup?.(ctx);
  const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
  const out: any[] = [];
  for (let i = 0; i < bars; i++) {
    ctx.currentBarIndex = i;
    ctx.setBar(i * 86400000, 100, 101, 99, 100.5, 1000);
    exec();
    out.push(ctx.vars.get("opsv2_" + name)?.valueOf());
    ctx.finalizeBar();
  }
  return out;
}
const last = (xs: any[]) => xs[xs.length - 1];

const IND = '//@version=6\nindicator("t")\n';
const PYR = '//@version=6\nstrategy("t", pyramiding = 2, initial_capital = 1000000)\n' +
  'if bar_index == 0\n    strategy.entry("L1", strategy.long, qty = 1)\n' +
  'if bar_index == 1\n    strategy.entry("L2", strategy.long, qty = 2)\n';

describe("1 — math.round with a precision, for numbers String() writes in exponent form", () => {
  it("rounds 0.0000001 to 0 and leaves 1e21 alone, not na", () => {
    expect(run(IND + "x = math.round(0.0000001, 2)\n", "x", 1)[0]).toBe(0);
    expect(run(IND + "x = math.round(1e21, 2)\n", "x", 1)[0]).toBe(1e21);
    expect(run(IND + "x = math.round(-0.000000123456, 9)\n", "x", 1)[0]).toBe(-1.23e-7);
  });
});

describe("2 — strategy.close(id) on a pyramided position", () => {
  it("closes as much as the entries with that id hold, first in, first out off the position", () => {
    // TradingView's v6 log (conformance/v6/golden/harness_strategy_pyr3_v6,
    // phase d): close("A") with A (1), B (2), A (3) open sold 1 + 2 + 1, the
    // oldest entries first, not A's four. Here close("L2") sells L2's 2:
    // all of L1 (1) and 1 of L2, leaving 1. It used to close L2 alone.
    const src = PYR + 'if bar_index == 3\n    strategy.close("L2")\n' +
      "x = strategy.position_size\ny = strategy.closedtrades > 0 ? strategy.closedtrades.entry_id(0) : \"-\"\n";
    expect(last(run(src, "x"))).toBe(1);
    expect(last(run(src, "y"))).toBe("L1");
  });

  it("closing the first entry leaves the second open", () => {
    const src = PYR + 'if bar_index == 3\n    strategy.close("L1")\nx = strategy.position_size\n';
    expect(last(run(src, "x"))).toBe(2);
  });
});

describe("3 — an exit tied to a pyramided entry", () => {
  it("draws on that entry's quantity, and sells the oldest trade", () => {
    // harness_strategy_exit_mix phase a (TradingView): from_entry "B" took B's
    // units off its id quantity but the fill closed A's older trade. Here
    // from_entry "L2" (2 units) sells 2 off the oldest trades: all of L1 (1),
    // then 1 of L2.
    const src = PYR + 'strategy.exit("X2", from_entry = "L2", stop = 1000)\n' +
      "x = strategy.position_size\ny = strategy.closedtrades > 0 ? strategy.closedtrades.entry_id(0) : \"-\"\n";
    expect(last(run(src, "x"))).toBe(1);
    expect(last(run(src, "y"))).toBe("L1");
  });
});

describe("5 — exit ids", () => {
  it("a reversed trade's exit id is the reversing entry", () => {
    const src = '//@version=6\nstrategy("t", initial_capital = 1000000)\n' +
      'if bar_index == 0\n    strategy.entry("S", strategy.short, qty = 1)\n' +
      'if bar_index == 2\n    strategy.entry("L", strategy.long, qty = 1)\n' +
      'x = strategy.closedtrades > 0 ? strategy.closedtrades.exit_id(0) : "-"\n';
    expect(last(run(src, "x"))).toBe("L");
  });

  it("a trade that does not exist has na ids", () => {
    const src = '//@version=6\nstrategy("t")\n' +
      "x = na(strategy.closedtrades.exit_id(99)) and na(strategy.closedtrades.entry_id(99))\n";
    expect(run(src, "x", 1)[0]).toBe(true);
  });
});

describe("6 — request.security on the bare ticker is the chart's symbol", () => {
  it("reports the chart's facts and ticker id inside the request", () => {
    const src = IND + 'm = request.security(syminfo.ticker, "D", syminfo.mintick)\n' +
      't = request.security(syminfo.ticker, "D", syminfo.tickerid)\n';
    const setup = (c: Context) => { c.resolution = "D"; c.provideSymbolInfo({ symbol: "BINANCE:BTCUSDT", mintick: 0.25 }); };
    expect(last(run(src, "m", 3, setup))).toBe(0.25);
    expect(last(run(src, "t", 3, setup))).toBe("BINANCE:BTCUSDT");
  });
});

describe("7 — the open entry's commission is in netprofit only", () => {
  it("avg_trade stays an average over closed trades", () => {
    const src = '//@version=6\nstrategy("t", initial_capital = 1000000, commission_type = strategy.commission.percent, commission_value = 1)\n' +
      'if bar_index == 0\n    strategy.entry("A", strategy.long, qty = 1)\n' +
      'if bar_index == 2\n    strategy.close("A")\n' +
      'if bar_index == 3\n    strategy.entry("B", strategy.long, qty = 1)\n' +
      "n = strategy.netprofit\na = strategy.avg_trade\n";
    const n = run(src, "n"), a = run(src, "a");
    // Bar 4: B is open, A closed. avg_trade is A alone; netprofit also carries
    // B's 1% entry commission.
    expect(a[4]).toBeCloseTo(a[3], 9);
    expect(n[4]).toBeCloseTo(a[3] - 1, 9);
  });
});

describe("10 — margin_liquidation_price uses the broker's margin ratio", () => {
  it("at 50% margin, a short is called where equity meets half the position", () => {
    const src = '//@version=6\nstrategy("t", initial_capital = 100, margin_short = 50)\n' +
      'if bar_index == 0\n    strategy.entry("S", strategy.short, qty = 1)\n' +
      "x = strategy.margin_liquidation_price\n";
    // cash 100 + 100 * 1 short at 100, over 1 * (1 + 0.5): 133.33 up to the tick.
    expect(last(run(src, "x", 3))).toBe(133.34);
  });
});
