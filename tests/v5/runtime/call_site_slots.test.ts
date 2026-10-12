/**
 * A series function's history keeps ONE SLOT PER BAR.
 *
 * Reaching its call site again on the same bar overwrites that bar's slot and
 * returns the value including it; a site that is never reached writes nothing
 * and goes stale. TradingView's own output establishes all of this — see
 * `barStateSnapshot` in runtime/v1/context.ts and the `loopargs` and `loops`
 * exports in conformance/v5/golden/.
 *
 * The golden suite proves the rule, but only on exports a human collected. This
 * file pins the two cases that are easy to regress and are NOT in any export:
 * a loop whose trip count grows partway through the chart, and a stateless
 * built-in called in bulk, which must not pay for any of this.
 */
import { describe, it, expect } from "vitest";
import { compileScript } from "../../../transpiler/common";
import { Context } from "../../../runtime/v1/context";
import { compile } from "../../../runtime/v1/index";

const BARS = 40;

/** Runs `body` over a deterministic walk and returns each named series. */
function run(body: string, want: string[]): Record<string, number[]> {
  const compiled = compileScript(`//@version=5\nindicator("t")\n${body}`, { version: 5 });
  const ctx = new Context(compiled.profile);
  const exec = compile(compiled.js, ctx, { ctx } as any);

  const out: Record<string, number[]> = {};
  for (const w of want) out[w] = [];

  let price = 100;
  for (let i = 0; i < BARS; i++) {
    price += Math.sin(i) * 3;
    ctx.currentBarIndex = i;
    ctx.setBar(Date.UTC(2021, 0, 4) + i * 86_400_000,
               price, price + 2, price - 2, price + 1, 1000 + i);
    exec();
    for (const w of want) out[w].push(Number(ctx.getSeries(`opsv2_${w}`, 0)));
    ctx.finalizeBar();
  }
  return out;
}

describe("a call site reached several times on one bar advances once", () => {
  it("even when it only STARTS repeating partway through the chart", () => {
    // The loop runs once for the first ten bars and three times after that.
    //
    // This is the case a learned-on-first-repeat design gets wrong: by bar 10
    // the `ta.ema` site already holds state, so there was no rollback point
    // for the bar it first repeats on, and the average advanced three times
    // that bar. `ema` is recursive, so that extra advance never washes out —
    // the error was permanent, not one bar wide.
    const { q, e } = run(
      "reps = bar_index < 10 ? 0 : 2\n" +
      "t = 0.0\n" +
      "for i = 0 to reps\n" +
      "    t := t + ta.ema(close, 4)\n" +
      "q = t / (reps + 1)\n" +
      "e = ta.ema(close, 4)\n",
      ["q", "e"],
    );

    // Same argument every reach, so every read is the same value and the mean
    // of them is a plain ema — on the bars before the loop widens AND after.
    q.forEach((value, i) => {
      if (Number.isNaN(value)) return expect(Number.isNaN(e[i])).toBe(true);
      expect(value, `bar ${i}`).toBeCloseTo(e[i], 10);
    });

    // Not vacuous: the two must actually have been compared past the widening.
    expect(q.slice(12).every(v => !Number.isNaN(v))).toBe(true);
  });

  it("and the same holds for a window function, which recovers more quietly", () => {
    // `sma` would carry the extra sample for `length` bars rather than for
    // ever, which is why this needs its own case: a test that only looked at
    // the end of the chart would call it fixed.
    const { q, e } = run(
      "reps = bar_index < 10 ? 0 : 2\n" +
      "t = 0.0\n" +
      "for i = 0 to reps\n" +
      "    t := t + ta.sma(close, 5)\n" +
      "q = t / (reps + 1)\n" +
      "e = ta.sma(close, 5)\n",
      ["q", "e"],
    );

    q.forEach((value, i) => {
      if (Number.isNaN(value)) return expect(Number.isNaN(e[i])).toBe(true);
      expect(value, `bar ${i}`).toBeCloseTo(e[i], 10);
    });
  });

  it("a site that is never reached goes stale rather than advancing", () => {
    // The other half of the rule, and the half that is NOT symmetric: nothing
    // is written on a bar the branch does not take, so the history simply does
    // not advance. TradingView agrees — `probe_call_inside_if` in the golden
    // control export passes with exactly this behaviour.
    const { gated, plain } = run(
      // Every other bar. The walk above closes above its open on every bar,
      // so `close > open` would never gate anything and the case would pass
      // while asserting nothing.
      "cond = bar_index % 2 == 0\n" +
      "gated = 0.0\n" +
      "if cond\n" +
      "    gated := ta.sma(close, 3)\n" +
      "plain = ta.sma(close, 3)\n",
      ["gated", "plain"],
    );

    const differs = gated.some((v, i) =>
      !Number.isNaN(v) && v !== 0 && Math.abs(v - plain[i]) > 1e-9);
    expect(differs, "the gated average must be its own, gappy series").toBe(true);
  });
});
