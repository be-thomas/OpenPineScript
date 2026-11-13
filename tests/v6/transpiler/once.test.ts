/**
 * `once [<condition>]` — release notes, August 2026; semantics from the
 * manual's Conditional structures page.
 *
 * Each case below is one sentence of that page, asserted.
 */
import { describe, it, expect } from "vitest";
import { build, series, HEAD } from "../helpers";
import { attempt } from "../../../test-utils/common/transpileAs";

describe("once", () => {
  it("with no condition, runs on the first bar and never again", () => {
    // "The condition is optional and defaults to true."
    const src = HEAD + "var c = 0\nonce\n    c := c + 1\n";
    expect(series(src, "c", 5)).toEqual([1, 1, 1, 1, 1]);
  });

  it("runs the first time its condition is true, not on bar 0", () => {
    const src = HEAD + "var d = 0\nonce bar_index >= 2\n    d := d + 10\n";
    expect(series(src, "d", 5)).toEqual([0, 0, 10, 10, 10]);
  });

  it("stays spent even when the condition is true again later", () => {
    const src = HEAD + "var d = 0\nonce bar_index % 2 == 0\n    d := d + 1\n";
    expect(series(src, "d", 6)).toEqual([1, 1, 1, 1, 1, 1]);
  });

  it("keeps two structures independent", () => {
    const src = HEAD +
      "var a = 0\nvar b = 0\nonce\n    a := 1\nonce bar_index == 3\n    b := 1\n";
    expect(series(src, "a", 5)).toEqual([1, 1, 1, 1, 1]);
    expect(series(src, "b", 5)).toEqual([0, 0, 0, 1, 1]);
  });

  it("inside a function, keeps state per call site, the way var does", () => {
    // The manual allows `once` in a function and is silent on whether the
    // state is per call site. This engine follows `var`; see visitOnce_expr.
    const src = HEAD +
      "f(x) =>\n    var k = 0\n    once\n        k := k + x\n    k\nz1 = f(1)\nz2 = f(5)\n";
    expect(series(src, "z1", 3)).toEqual([1, 1, 1]);
    expect(series(src, "z2", 3)).toEqual([5, 5, 5]);
  });

  it("lets break reach the enclosing loop", () => {
    const src = HEAD +
      "var n = 0\nfor i = 0 to 9\n    n := i\n    once\n        break\n";
    // The first bar breaks out at i = 0; afterwards the block is spent and the
    // loop runs to the end.
    expect(series(src, "n", 3)).toEqual([0, 9, 9]);
  });

  it("is a statement: assigning it is refused", () => {
    // "You can't assign a once statement ... to a variable" — a compile error
    // on TradingView, and a parse error here because the grammar does not
    // admit it to an expression position.
    const r = attempt(6, "x = once\n    1\n");
    expect(r.ok).toBe(false);
  });

  it("is rolled back between realtime ticks, and spent once the bar closes", () => {
    // From the manual: on the live bar the condition is checked on every tick,
    // the structure's state is rolled back, so "the block can run several
    // times during one realtime bar", and it goes inactive only once it has run
    // on the closing tick. A varip counter is what makes that visible.
    const src = HEAD +
      "varip int ticks = 0\nif barstate.isrealtime\n    once\n        ticks := ticks + 1\n";
    const { ctx, exec } = build(src);
    const ticks = () => ctx.vars.get("opsv2_ticks")?.valueOf();

    ctx.setBar(0, 10, 10, 10, 10, 1); exec(); ctx.finalizeBar();
    expect(ticks()).toBe(0);

    for (const c of [11, 12, 13]) { ctx.applyTick(1, 10, c, 10, c, 1); exec(); }
    expect(ticks(), "ran on each of the three ticks").toBe(3);
    ctx.commitBar();

    for (const c of [14, 15]) { ctx.applyTick(2, 13, c, 13, c, 1); exec(); }
    expect(ticks(), "spent after the bar it ran on closed").toBe(3);
  });

  it("does not exist before v6", () => {
    for (const v of [1, 2, 3, 4, 5] as const) {
      expect(attempt(v, "once\n    x = 1\n").ok, `v${v}`).toBe(false);
    }
  });
});
