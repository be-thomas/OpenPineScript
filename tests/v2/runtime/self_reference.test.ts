/**
 * Self-referencing variables — the v1/v2 state idiom.
 *
 * With no `var` keyword and no general ':=', the only way a v1/v2 script can
 * carry a value across bars is to reference its own history:
 *
 *     s = nz(s[1]) + close
 *
 * spec/v2.md §4.1 calls this "the primary mechanism for state preservation and
 * time-series recursion in the strict v2 paradigm", so it has to work.
 *
 * ── The bug this pins ───────────────────────────────────────────────────────
 *
 * It was emitted as `let s = ... ctx.get(s, 1, "s") ...`, which is a temporal
 * dead zone error: JavaScript forbids reading a `let` binding inside its own
 * initialiser. Every such script threw "Cannot access 'opsv2_s' before
 * initialization".
 *
 * It went unnoticed because Session.compile() rewrites `let` to `var` before
 * running, and `var` hoists to `undefined` rather than trapping — and
 * `ctx.get(undefined, 1, id)` happens to fall through to the by-name series
 * lookup, which is the correct value. So the idiom worked through one entry
 * point and crashed through the others.
 *
 * The fix splits the declaration from the assignment. These tests run WITHOUT
 * the let→var rewrite, which is what the CLI and REPL do.
 */
import { describe, it, expect } from "vitest";
import { transpile } from "../../../transpiler";
import { compile, Context } from "../../../runtime/v1";
import { profileFor } from "../../../transpiler/profiles";
import { PREFIX } from "../../../utils/v2/common";
import type { PineVersion } from "../../../transpiler/version";

/** Runs `src` verbatim — no let→var rewrite — and traces `name` per bar. */
function trace(src: string, name: string, bars = 4, version: PineVersion = 2): number[] {
  const ctx = new Context(profileFor(version));
  const exec = compile(transpile(src, { version }), ctx, { ctx } as any);
  const out: number[] = [];
  for (let i = 0; i < bars; i++) {
    ctx.currentBarIndex = i;
    ctx.setBar(i * 1000, 10 + i, 12 + i, 9 + i, 10 + i, 100);
    exec();
    ctx.finalizeBar();
    out.push(Number(ctx.vars.get(`${PREFIX}${name}`)?.valueOf()));
  }
  return out;
}

describe("self-referencing variables run without a let→var rewrite", () => {
  it("cumulative sum accumulates across bars", () => {
    // close = 10, 11, 12, 13
    expect(trace("s = nz(s[1]) + close\n", "s")).toEqual([10, 21, 33, 46]);
  });

  it("bar counter increments", () => {
    expect(trace("c = nz(c[1]) + 1\n", "c")).toEqual([1, 2, 3, 4]);
  });

  it("deeper history offsets work", () => {
    // s[2] is na for the first two bars, so nz() yields 0 there.
    expect(trace("s = nz(s[2]) + 1\n", "s")).toEqual([1, 1, 2, 2]);
  });

  it("conditional self-reference keeps the previous value", () => {
    expect(trace("t = close > 11 ? nz(t[1]) + 1 : nz(t[1])\n", "t")).toEqual([0, 0, 1, 2]);
  });

  it("emits a split declaration rather than a self-referential initialiser", () => {
    // `let s = f(s)` is the temporal dead zone; the split is the fix.
    const js = transpile("s = nz(s[1]) + close\n", { version: 2 });
    expect(js).toMatch(/let opsv2_s;\s*\n\s*opsv2_s = ctx\.new_var/);
  });

  it("leaves non-self-referential declarations as a single statement", () => {
    const js = transpile("s = close + 1\n", { version: 2 });
    expect(js).toMatch(/let opsv2_s = ctx\.new_var/);
    expect(js).not.toMatch(/let opsv2_s;/);
  });

  it("behaves identically at v1", () => {
    expect(trace("s = nz(s[1]) + close\n", "s", 4, 1)).toEqual([10, 21, 33, 46]);
  });
});
