/**
 * Pine Script v3 semantics.
 *
 * The v2→v3 migration guide documents exactly five changes. Four are new
 * rejection rules; the fifth (the security() lookahead default) lives in
 * tests/v2/runtime/security.test.ts because it needs HTF fixtures.
 *
 * The enabling relaxation is that ':=' becomes generally available — the
 * guide's own fix for self-reference (`s = 0.0` then `s := ...`) requires it.
 */
import { describe, it, expect } from "vitest";
import { transpile } from "../../transpiler";
import { compile, Context } from "../../runtime/v1";
import { profileFor } from "../../transpiler/profiles";
import { PREFIX } from "../../utils/v2/common";

const v3 = (src: string) => transpile(src, { version: 3 });

/** Runs `src` for N bars with close = 10, 11, 12, … and returns `name` per bar. */
function trace(src: string, name: string, bars = 4): number[] {
  const ctx = new Context(profileFor(3));
  const exec = compile(v3(src), ctx, { ctx } as any);
  const out: number[] = [];
  for (let i = 0; i < bars; i++) {
    ctx.currentBarIndex = i;
    ctx.setBar(i * 1000, 1, 1, 1, 10 + i, 1);
    exec();
    ctx.finalizeBar();
    out.push(Number(ctx.vars.get(`${PREFIX}${name}`)?.valueOf()));
  }
  return out;
}

// ─── the relaxation: ':=' at any scope ──────────────────────────────────────

describe("v3 mutable variables", () => {
  it("accepts ':=' at global scope", () => {
    expect(() => v3("x = 1\nx := 2\n")).not.toThrow();
  });

  it("accumulates across bars — the documented replacement for self-reference", () => {
    // s = 0.0 / s := nz(s[1]) + close  ⇒  cumulative sum of close.
    const got = trace("s = 0.0\ns := nz(s[1]) + close\n", "s");
    expect(got).toEqual([10, 21, 33, 46]);
  });

  it("writes exactly one history entry per bar, however many assignments", () => {
    // Series.update() overwrites the current bar's slot, so three assignments
    // in one bar must still leave a single value visible at [1].
    const got = trace("s = 0.0\ns := 1\ns := 2\ns := nz(s[1]) + 10\n", "s");
    expect(got).toEqual([10, 20, 30, 40]);
  });

  it("still allows ':=' on a for-loop accumulator", () => {
    expect(() => v3("sum = 0\nfor i = 0 to 5\n    sum := sum + i\n")).not.toThrow();
  });
});

// ─── D3.2 self-reference ────────────────────────────────────────────────────

describe("v3 rejects self-referencing declarations", () => {
  it("rejects `s = nz(s[1]) + close`", () => {
    expect(() => v3("s = nz(s[1]) + close\n")).toThrow(/cannot reference itself/);
  });

  it("names the fix in the message", () => {
    expect(() => v3("s = nz(s[1]) + close\n")).toThrow(/then assign with ':='/);
  });

  it("rejects a bare self-reference too", () => {
    expect(() => v3("s = s + 1\n")).toThrow(/cannot reference itself/);
  });

  it("allows self-reference on ':=' — that is the correct v3 form", () => {
    expect(() => v3("s = 0.0\ns := nz(s[1]) + close\n")).not.toThrow();
  });

  it("does not confuse a different variable with the same prefix", () => {
    expect(() => v3("sx = 1\ns = sx + 1\n")).not.toThrow();
  });
});

// ─── D3.3 forward reference ─────────────────────────────────────────────────

describe("v3 rejects forward references", () => {
  it("rejects using a variable above its declaration", () => {
    expect(() => v3("y = x + 1\nx = 2\n")).toThrow(/used before it is declared/);
  });

  it("reports where the declaration actually is", () => {
    expect(() => v3("y = x + 1\nx = 2\n")).toThrow(/declared at @L2:C0/);
  });

  it("accepts a reference below the declaration", () => {
    expect(() => v3("x = 2\ny = x + 1\n")).not.toThrow();
  });

  it("does not flag built-ins", () => {
    expect(() => v3("y = close + 1\n")).not.toThrow();
  });

  it("does not flag function parameters", () => {
    expect(() => v3("f(a) => a + 1\ny = f(close)\n")).not.toThrow();
  });
});

// ─── D3.5 bool arithmetic ───────────────────────────────────────────────────

describe("v3 rejects implicit bool-to-number conversion", () => {
  it("rejects a comparison used in addition", () => {
    expect(() => v3("c = (close > open) + 1\n")).toThrow(/cannot use a bool/);
  });

  it("rejects a bool literal in arithmetic", () => {
    expect(() => v3("c = true + 1\n")).toThrow(/cannot use a bool/);
  });

  it("rejects a bool held in a variable", () => {
    // The operand is usually a variable, not a literal — this is the case a
    // purely syntactic check would miss.
    expect(() => v3("b = close > open\nc = b + 1\n")).toThrow(/cannot use a bool/);
  });

  it("rejects an and/or result in arithmetic", () => {
    expect(() => v3("c = (close > open and volume > 0) + 1\n")).toThrow(/cannot use a bool/);
  });

  it("rejects a bool in multiplication", () => {
    expect(() => v3("c = (close > open) * 2\n")).toThrow(/cannot use a bool/);
  });

  it("names the explicit conversion in the message", () => {
    expect(() => v3("c = (close > open) + 1\n")).toThrow(/\? 1 : 0/);
  });

  it("accepts the explicit conversion", () => {
    expect(() => v3("c = (close > open ? 1 : 0) + 1\n")).not.toThrow();
  });

  it("still allows bools in boolean contexts", () => {
    expect(() => v3("b = close > open\nc = b and volume > 0\n")).not.toThrow();
    expect(() => v3("b = close > open\nc = b ? 1 : 2\n")).not.toThrow();
  });
});

// ─── D3.4 mutable variable as a security() argument ─────────────────────────

describe("v3 rejects a mutable variable passed to security()", () => {
  const MUTABLE = "s = 0.0\ns := nz(s[1]) + close\n";

  it("rejects a bare mutable reference", () => {
    expect(() => v3(`${MUTABLE}x = security("AAPL", "D", s)\n`))
      .toThrow(/cannot use mutable variable 's'/);
  });

  it("rejects it nested inside a larger expression", () => {
    expect(() => v3(`${MUTABLE}x = security("AAPL", "D", s + close)\n`))
      .toThrow(/cannot use mutable variable 's'/);
  });

  it("names the function-wrapper workaround", () => {
    expect(() => v3(`${MUTABLE}x = security("AAPL", "D", s)\n`))
      .toThrow(/Wrap the calculation in a function/);
  });

  it("accepts a non-mutable variable", () => {
    expect(() => v3('c = close\nx = security("AAPL", "D", c)\n')).not.toThrow();
  });

  it("accepts the documented workaround — the value reached through a call", () => {
    expect(() => v3(`f() => close\nx = security("AAPL", "D", f())\n`)).not.toThrow();
  });

  it("does not restrict mutable variables passed to other functions", () => {
    expect(() => v3(`${MUTABLE}y = sma(s, 2)\n`)).not.toThrow();
  });
});

// ─── rules carried over unchanged from v1/v2 ────────────────────────────────

describe("v3 keeps the v1/v2 rules the migration guide does not change", () => {
  it("still rejects recursion", () => {
    expect(() => v3("f(x) => f(x)\n")).toThrow(/recursion is not allowed/);
  });

  it("still rejects strategy.* under study()", () => {
    expect(() => v3('study("X")\nstrategy.entry("L", strategy.long)\n'))
      .toThrow(/unavailable in a study\(\) script/);
  });

  it("still rejects 'x == na' — not among the five documented changes", () => {
    expect(() => v3("y = close == na ? 1 : 0\n")).toThrow(/compare to 'na'/);
  });

  it("still bans 'bar_index'", () => {
    expect(profileFor(3).banned.has("bar_index")).toBe(true);
  });
});
