/**
 * Regressions for the review of PR #6 (v4).
 *
 * One block per comment. Three were defects and are fixed; the fourth is a
 * limit that could not be fixed at this level, and is pinned here so it cannot
 * change silently and so the claim in the code stays checkable.
 */
import { describe, it, expect } from "vitest";
import { compileScript } from "../../transpiler/common";
import { compile, Context } from "../../runtime/v4";

function build(src: string) {
  const { js, profile } = compileScript(src);
  const ctx = new Context(profile);
  const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
  return { ctx, exec, js };
}

/** Runs `bars` bars and returns the per-bar values of `name`. */
function series(src: string, name: string, bars = 3): any[] {
  const { ctx, exec } = build(src);
  const out: any[] = [];
  for (let i = 0; i < bars; i++) {
    ctx.setBar(i, 10, 12, 9, 11, 100);
    exec();
    out.push(ctx.vars.get("opsv2_" + name)?.valueOf());
    ctx.finalizeBar();
  }
  return out;
}

const HEAD = "//@version=4\nstudy(\"t\")\n";

describe("suppressBlockReturn does not leak into a nested IIFE", () => {
  // A statement-`if` inside a loop suppresses the trailing return in its own
  // blocks. That suppression used to apply to the whole subtree, so an
  // if-EXPRESSION nested inside it emitted an IIFE whose blocks dropped their
  // `return` — the variable came out `undefined` with no error anywhere.
  const SRC = HEAD + [
    "a = 0.0",
    "for i = 0 to 2",
    "    if close > open",
    "        v = if high > low",
    "            1",
    "        else",
    "            2",
    "        a := a + v",
    "plot(a)",
  ].join("\n") + "\n";

  it("the inner if-expression yields a value", () => {
    expect(series(SRC, "v")[0]).toBe(1);
  });

  it("...so the accumulator is not na", () => {
    // 3 iterations × 1 each.
    expect(series(SRC, "a")[0]).toBe(3);
  });

  it("the else branch is reachable too", () => {
    const src = HEAD + [
      "a = 0.0",
      "for i = 0 to 2",
      "    if close > open",
      "        v = if low > high",
      "            1",
      "        else",
      "            2",
      "        a := a + v",
    ].join("\n") + "\n";
    expect(series(src, "a")[0]).toBe(6);
  });

  it("break inside a loop still compiles — the reason suppression exists", () => {
    const src = HEAD + [
      "firstDown = 0.0",
      "for i = 0 to 5",
      "    if close < open",
      "        firstDown := i",
      "        break",
    ].join("\n") + "\n";
    expect(() => build(src)).not.toThrow();
  });
});

describe("reset() clears drawings", () => {
  it("a second pass does not inherit the first pass's drawings", () => {
    const { ctx, exec } = build(HEAD + "l = line.new(0, 1.0, 5, 2.0)\n");
    for (let i = 0; i < 3; i++) { ctx.setBar(i, 10, 12, 9, 11, 100); exec(); ctx.finalizeBar(); }
    const first = ctx.drawings.size;

    ctx.reset();
    expect(ctx.drawings.size).toBe(0);

    for (let i = 0; i < 3; i++) { ctx.setBar(i, 10, 12, 9, 11, 100); exec(); ctx.finalizeBar(); }
    expect(ctx.drawings.size).toBe(first);
  });

  it("ids restart rather than climbing across passes", () => {
    const { ctx, exec } = build(HEAD + "l = line.new(0, 1.0, 5, 2.0)\n");
    ctx.setBar(0, 10, 12, 9, 11, 100); exec(); ctx.finalizeBar();
    ctx.reset();
    ctx.setBar(0, 10, 12, 9, 11, 100); exec(); ctx.finalizeBar();
    expect([...ctx.drawings.keys()]).toEqual(["line_0"]);
  });
});

describe("drawings are capped, oldest evicted — as Pine does", () => {
  it("500 bars of label.new retains 50, not 500", () => {
    const { ctx, exec } = build(HEAD + "lb = label.new(bar_index, close, \"x\")\n");
    for (let i = 0; i < 500; i++) { ctx.setBar(i, 10, 12, 9, 11, 100); exec(); ctx.finalizeBar(); }
    expect(ctx.drawings.size).toBe(50);
  });

  it("the survivors are the NEWEST", () => {
    const { ctx, exec } = build(HEAD + "lb = label.new(bar_index, close, \"x\")\n");
    for (let i = 0; i < 60; i++) { ctx.setBar(i, 10, 12, 9, 11, 100); exec(); ctx.finalizeBar(); }
    const bars = [...ctx.drawings.values()].map(d => d.bar);
    expect(Math.min(...bars)).toBe(10);
    expect(Math.max(...bars)).toBe(59);
  });

  it("each kind is capped separately", () => {
    const { ctx, exec } = build(
      HEAD + "l = line.new(0, 1.0, 5, 2.0)\nlb = label.new(bar_index, close, \"x\")\n",
    );
    for (let i = 0; i < 100; i++) { ctx.setBar(i, 10, 12, 9, 11, 100); exec(); ctx.finalizeBar(); }
    expect(ctx.drawings.size).toBe(100);
  });

  it("tables are NOT capped — Pine limits them by position, not count", () => {
    const { ctx, exec } = build(HEAD + "t = table.new(position.top_right, 1, 1)\n");
    for (let i = 0; i < 80; i++) { ctx.setBar(i, 10, 12, 9, 11, 100); exec(); ctx.finalizeBar(); }
    expect(ctx.drawings.size).toBe(80);
  });

  it("an explicit delete keeps the eviction queue honest", () => {
    // A manual delete used to leave its id in the queue, so the next eviction
    // shifted off a dead id, removed nothing, and let the live count drift
    // above the cap.
    const { ctx, exec } = build(
      HEAD + "lb = label.new(bar_index, close, \"x\")\nlabel.delete(lb)\n",
    );
    for (let i = 0; i < 200; i++) { ctx.setBar(i, 10, 12, 9, 11, 100); exec(); ctx.finalizeBar(); }
    expect(ctx.drawings.size).toBe(0);
  });
});

describe("array.concat mutates and returns its first argument", () => {
  it("id1 grows", () => {
    const src = HEAD + "a = array.from(1, 2)\nb = array.from(3)\narray.concat(a, b)\ns = array.size(a)\n";
    expect(series(src, "s")[0]).toBe(3);
  });

  it("the returned handle is that same array", () => {
    const src = HEAD + "a = array.from(1, 2)\nb = array.from(3)\nc = array.concat(a, b)\ns = array.size(c) * 10 + array.size(a)\n";
    expect(series(src, "s")[0]).toBe(33);
  });
});

describe("KNOWN LIMIT: `var` in a user function is shared across call sites", () => {
  // Not a regression test — a pin. TradingView gives 1,2,3 for both a and b,
  // because each call site there gets its own instance of the function's
  // locals. This engine shares one series per NAME across all call sites, for
  // every function local and not just `var` ones, so both counters advance the
  // same underlying value.
  //
  // If this ever starts failing because the numbers became 1,2,3 — delete the
  // test and the note on Context.var_def. That is the fix landing.
  const SRC = HEAD + [
    "f() =>",
    "    var c = 0",
    "    c := c + 1",
    "    c",
    "a = f()",
    "b = f()",
  ].join("\n") + "\n";

  it("documents the current, wrong, behaviour", () => {
    expect(series(SRC, "a")).toEqual([1, 3, 5]);
    expect(series(SRC, "b")).toEqual([2, 4, 6]);
  });

  it("the cause is not specific to `var` — plain locals share a name too", () => {
    const { js } = build(HEAD + "g() =>\n    t = close * 2\n    t\np = g()\nq = g()\n");
    expect(js).toContain('new_var("opsv2_t"');
  });

  it("but a `var` at SCRIPT scope is correct, which is the common case", () => {
    expect(series(HEAD + "var c = 0\nc := c + 1\n", "c")).toEqual([1, 2, 3]);
  });
});
