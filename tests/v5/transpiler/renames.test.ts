/**
 * The v4 → v5 rename table, asserted from BOTH sides.
 *
 * A rename table has two failure modes and they need different tests:
 *
 *   1. the new spelling does not resolve — the script fails outright, which is
 *      loud and gets noticed;
 *   2. the OLD spelling still resolves — the script compiles here and fails on
 *      TradingView, which is silent and is the reason this engine exists.
 *
 * So every entry is checked for both: the v5 name must produce the value its v4
 * name produced, and the v4 name must be REFUSED at v5.
 */
import { describe, it, expect } from "vitest";
import { compileScript } from "../../../transpiler";
import { compile, Context } from "../../../runtime/v5";
import { V5_RENAMES, V5_REMOVED } from "../../../runtime/v1/stdlib/renames5";
import { V4_VIEW, V5_VIEW } from "../../../runtime/v1/stdlib";

/** Evaluates `body` under `version` and reads one variable back. */
function evaluate(version: 4 | 5, body: string, name: string): any {
  const directive = version === 5 ? 'indicator("t")' : 'study("t")';
  const { js, profile } = compileScript(`//@version=${version}\n${directive}\n${body}\n`);
  const ctx = new Context(profile);
  const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
  ctx.setBar(0, 10, 12, 9, 11, 100);
  exec();
  return ctx.vars.get("opsv2_" + name)?.valueOf();
}

describe("every rename resolves at v5 to what its v4 spelling meant", () => {
  // Driven off the table itself, so adding an entry adds a test. A rename whose
  // source is a FUNCTION is compared by identity of the resolved reference
  // rather than by calling it — calling would need per-function arguments, and
  // the thing under test is the aliasing, not the maths.
  for (const { to, from } of V5_RENAMES) {
    if (from === undefined) continue;
    it(`${from} → ${to}`, () => {
      expect(V5_VIEW[to], `${to} is missing from the v5 view`).toBeDefined();
      expect(V5_VIEW[to].ref).toBe(V4_VIEW[from].ref);
    });
  }
});

describe("the v4 spelling is refused at v5", () => {
  for (const { to, from } of V5_RENAMES) {
    if (from === undefined || from.includes(".")) continue;
    it(`${from} is gone`, () => {
      expect(V5_VIEW[from], `${from} still resolves at v5`).toBeUndefined();
    });
  }

  it("names the replacement in the diagnostic", () => {
    expect(() => compileScript('//@version=5\nindicator("t")\nplot(sma(close, 10))\n'))
      .toThrow(/'sma' was renamed to 'ta\.sma' in Pine Script v5/);
  });

  it("...for the maths too", () => {
    expect(() => compileScript('//@version=5\nindicator("t")\nx = abs(close)\n'))
      .toThrow(/'abs' was renamed to 'math\.abs' in Pine Script v5/);
  });

  it("...and for a name read as a VALUE rather than called", () => {
    // The gate hangs off visitId as well as the call path, because a bare
    // reference would otherwise emit `opsv2_sma` and read as undefined.
    expect(() => compileScript('//@version=5\nindicator("t")\nx = tostring\n'))
      .toThrow(/'tostring' was renamed to 'str\.tostring' in Pine Script v5/);
  });

  it("...and inside a tuple destructuring, where the message used to be wrong", () => {
    // The inherited path reported "added in a later version", which is exactly
    // backwards: `bb` was REMOVED at v5, not added after it.
    expect(() => compileScript('//@version=5\nindicator("t")\n[a, b, c] = bb(close, 20, 2)\n'))
      .toThrow(/'bb' was renamed to 'ta\.bb' in Pine Script v5/);
  });
});

describe("a script may still bind a retired name as its own variable", () => {
  it("`sum = 0.0` is legal v5 — the built-in is gone, the word is not reserved", () => {
    expect(evaluate(5, "sum = 0.0\nsum := sum + 1", "sum")).toBe(1);
  });

  it("and so is using it afterwards", () => {
    expect(evaluate(5, "max = high\nx = max", "x")).toBe(12);
  });
});

describe("v5 removals with no replacement name", () => {
  it("iff points at the ternary rather than at a new spelling", () => {
    expect(() => compileScript('//@version=5\nindicator("t")\nx = iff(close > open, 1, 0)\n'))
      .toThrow(/'iff' was removed in Pine Script v5 — use the ternary operator/);
  });

  it("iff still works at v4", () => {
    expect(evaluate(4, "x = iff(close > open, 1, 0)", "x")).toBe(1);
  });

  it("offset names the history operator", () => {
    expect(() => compileScript('//@version=5\nindicator("t")\nx = offset(close, 1)\n'))
      .toThrow(/'offset' was removed in Pine Script v5 — use the history-referencing operator/);
  });
});

describe("the new namespaces work end to end", () => {
  it("ta.sma computes", () => {
    expect(evaluate(5, "x = ta.sma(close, 1)", "x")).toBe(11);
  });

  it("math.max computes", () => {
    expect(evaluate(5, "x = math.max(close, open)", "x")).toBe(11);
  });

  it("str.tostring computes", () => {
    expect(evaluate(5, 'x = str.tostring(close, "#.##")', "x")).toBe("11");
  });

  it("keyword arguments survive the alias — ta.sma carries `sma`'s parameters", () => {
    // The alias inherits `args` from the source entry. Without that, Context.call
    // cannot map `length=` onto a positional slot and drops it silently.
    expect(evaluate(5, "x = ta.sma(close, length=1)", "x")).toBe(11);
  });
});

describe("the removal list is derived, not hand-maintained", () => {
  it("every renamed source is removed", () => {
    const removed = new Set(V5_REMOVED);
    for (const { from } of V5_RENAMES) {
      if (from === undefined || from === "syminfo.tickerid") continue;
      expect(removed.has(from), `${from} was renamed but not removed`).toBe(true);
    }
  });

  it("syminfo.tickerid survives, because only the FUNCTION moved", () => {
    expect(V5_VIEW["syminfo.tickerid"]).toBeDefined();
    expect(V5_VIEW["ticker.new"]).toBeDefined();
  });
});
