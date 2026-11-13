/**
 * Regressions from the review of PR #5, at v5: the accessors this PR added
 * report what TradingView names, though the v5 broker still closes the whole
 * position. The v6 findings are in tests/v6/runtime/review_pr5.test.ts.
 */
import { describe, it, expect } from "vitest";
import { compileScript } from "../../../transpiler/common";
import { compile, Context } from "../../../runtime/v5";

function run(src: string, name: string, bars = 6): any[] {
  const { js, profile } = compileScript(src);
  const ctx = new Context(profile);
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

describe("1 — math.round with a precision, at v5", () => {
  it("is not na for numbers String() writes in exponent form", () => {
    expect(run('//@version=5\nindicator("t")\nx = math.round(0.0000001, 2)\n', "x", 1)[0]).toBe(0);
  });
});

describe("4 — strategy.close(id) is named as TradingView names it", () => {
  const SRC = '//@version=5\nstrategy("t")\n' +
    'if bar_index == 0\n    strategy.entry("L", strategy.long)\n' +
    'if bar_index == 2\n    strategy.close("L")\n';

  it("exit_id is 'Close entry(s) order L'", () => {
    expect(last(run(SRC + 'x = strategy.closedtrades > 0 ? strategy.closedtrades.exit_id(0) : "-"\n', "x")))
      .toBe("Close entry(s) order L");
  });

  it("exit_comment is na when the close had no comment", () => {
    expect(last(run(SRC + "x = strategy.closedtrades > 0 and na(strategy.closedtrades.exit_comment(0))\n", "x")))
      .toBe(true);
  });
});

describe("8 — v5 strategy.exit's comments by position", () => {
  it("the 14th argument is comment_profit, as v5's reference orders it", () => {
    const src = '//@version=5\nstrategy("t")\n' +
      'if bar_index == 0\n    strategy.entry("L", strategy.long)\n' +
      'strategy.exit("x", "L", na, na, na, 50.0, na, na, na, na, na, "", "c", "tp", "sl")\n' +
      'x = strategy.closedtrades > 0 ? strategy.closedtrades.exit_comment(0) : "-"\n';
    expect(last(run(src, "x"))).toBe("tp");
  });
});
