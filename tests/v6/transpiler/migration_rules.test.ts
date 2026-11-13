/**
 * The v6 migration guide's compile-time rules, one row each.
 *
 * Every row is asserted BOTH ways: v6 rejects it with the stated reason, and
 * v5 still accepts it. The second half is what "v1 through v5 unaffected"
 * means in practice — each of these was legal v5 and must stay legal there.
 *
 * Source: https://www.tradingview.com/pine-script-docs/migration-guides/to-pine-version-6/
 */
import { describe, it, expect } from "vitest";
import { attempt } from "../../../test-utils/common/transpileAs";
import { value, series } from "../helpers";
import { value as value5, series as series5 } from "../../v5/helpers";

const ind = (v: number) => `//@version=${v}\nindicator("t")\n`;
const strat = (v: number) => `//@version=${v}\nstrategy("t")\n`;

interface Row {
  section: string;
  source: string;
  because: RegExp;
  head?: (v: number) => string;
}

const REJECTED: Row[] = [
  { section: "Explicit bool casting — ternary", source: "x = bar_index ? 1 : 2\n", because: /cannot use 'int' as a condition/ },
  { section: "Explicit bool casting — if", source: "x = 0\nif bar_index\n    x := 1\n", because: /cannot use 'int' as a condition/ },
  { section: "Explicit bool casting — and", source: "x = close > open and volume\n", because: /cannot use 'float' as a condition/ },
  { section: "Explicit bool casting — not", source: "x = not close\n", because: /cannot use 'float' as a condition/ },
  { section: "Explicit bool casting — while", source: "i = 3\nwhile i\n    i := i - 1\n", because: /cannot use 'int' as a condition/ },
  { section: "Explicit bool casting — declared float", source: "float r = 1.0\nx = r ? 1 : 0\n", because: /cannot use 'float' as a condition/ },
  { section: "Booleans cannot be na — declaration", source: "bool b = na\n", because: /a 'bool' cannot be 'na'/ },
  { section: "Booleans cannot be na — na()", source: "b = close > open\nx = na(b)\n", because: /'na\(\)' does not accept a 'bool'/ },
  { section: "Booleans cannot be na — nz()", source: "x = nz(close > open)\n", because: /'nz\(\)' does not accept a 'bool'/ },
  { section: "Unique parameters cannot be na", source: "plot(close, style = na)\n", because: /'style' cannot be 'na'/ },
  { section: "Unique type needs else", source: "s = if close > open\n    plot.style_line\nplot(close, style = s)\n", because: /has no 'else'/ },
  { section: "Unique type needs default", source: "i = 1\ns = switch i\n    1 => plot.style_line\nplot(close, style = s)\n", because: /has no default arm/ },
  { section: "Mutable variables are always series", source: "var len = 1\nlen := len + 1\nx = ta.ema(close, len)\n", because: /'len' is reassigned with ':='.*"simple int"/ },
  { section: "No history for literal values — number", source: "x = 6[1]\n", because: /'\[\]' on the literal '6'/ },
  { section: "No history for literal values — string", source: 'x = "text"[20]\n', because: /'\[\]' on the literal/ },
  { section: "History of UDT fields", source: "type P\n    float v\np = P.new(close)\nx = p.v[1]\n", because: /cannot use '\[\]' on the field 'p\.v'/ },
  { section: "Cannot repeat parameters", source: "x = ta.sma(close, length = 2, length = 3)\n", because: /'length' is specified more than once/ },
  { section: "No series offset values", source: "plot(close, offset = bar_index)\n", because: /'offset' cannot be a "series" value/ },
  { section: "Minimum linewidth is 1 — zero", source: "plot(close, linewidth = 0)\n", because: /'linewidth' must be at least 1/ },
  { section: "Minimum linewidth is 1 — negative", source: "plot(close, linewidth = -5)\n", because: /'linewidth' must be at least 1/ },
  { section: "The transp parameter is removed", source: "plot(close, transp = 40)\n", because: /no 'transp' parameter/ },
  { section: "The transp parameter is removed — bgcolor", source: "bgcolor(color.red, transp = 40)\n", because: /no 'transp' parameter/ },
  {
    section: "Removal of when parameter", head: strat,
    source: 'strategy.entry("L", strategy.long, when = close > open)\n', because: /no 'when' parameter/,
  },
  {
    section: "Removal of when parameter — close_all", head: strat,
    source: "strategy.close_all(when = close > open)\n", because: /no 'when' parameter/,
  },
];

describe("v6 rejects what the migration guide removes", () => {
  for (const row of REJECTED) {
    const head = row.head ?? ind;
    it(`${row.section}: v6 rejects`, () => {
      const r = attempt(6, head(6) + row.source);
      expect(r.ok, "expected a rejection").toBe(false);
      if (!r.ok) {
        expect(r.message).toMatch(/Pine Script v6 Error at @L\d+:C\d+/);
        expect(r.message).toMatch(row.because);
      }
    });
    it(`${row.section}: v5 still accepts`, () => {
      const r = attempt(5, head(5) + row.source);
      expect(r.ok, r.ok ? "" : (r as any).message).toBe(true);
    });
  }
});

describe("…and accepts the fix the guide prescribes", () => {
  const ACCEPTED: Array<[string, string]> = [
    ["bool() cast", "x = bool(bar_index) ? 1 : 2\n"],
    ["comparison as condition", "x = bar_index > 0 ? 1 : 2\n"],
    ["bool declared true", "bool b = false\n"],
    ["nz on a number", "x = nz(close)\n"],
    ["else on a unique if", "s = if close > open\n    plot.style_line\nelse\n    plot.style_circles\nplot(close, style = s)\n"],
    ["a statement-if returning a unique constant needs no else", "if close > open\n    plot.style_line\n"],
    ["a const length", "len = 5\nx = ta.ema(close, len)\n"],
    ["history of a variable", "x = close[1]\n"],
    ["history of a namespace built-in", "x = syminfo.mintick[1]\n"],
    ["history of the object, then the field", "type P\n    float v\np = P.new(close)\nx = (p[1]).v\n"],
    ["a simple offset", "plot(close, offset = 2)\n"],
    ["linewidth 1", "plot(close, linewidth = 1)\n"],
    ["color.new instead of transp", "plot(close, color = color.new(color.red, 40))\n"],
    ["a user function may take a param called style = na", "f(style) => 1\nx = f(style = na)\n"],
    ["a script variable named time is not the built-in", 'time2 = "noon"\nx = str.length(time2) > 0 ? 1 : 0\n'],
  ];
  for (const [name, src] of ACCEPTED) {
    it(name, () => {
      const r = attempt(6, ind(6) + src);
      expect(r.ok, r.ok ? "" : (r as any).message).toBe(true);
    });
  }
});

describe("v6 run-time behaviour the emitter decides", () => {
  it("an if returning bool yields false, not na, when no branch runs", () => {
    expect(value(ind(6) + "x = if close < 0\n    true\n", "x")).toBe(false);
    // v5 is unchanged: na.
    const v5 = value5(ind(5) + "x = if close < 0\n    true\n", "x");
    expect(Number.isNaN(Number(v5))).toBe(true);
  });

  it("a switch returning bool yields false when nothing matches", () => {
    expect(value(ind(6) + "i = 2\nx = switch i\n    1 => true\n", "x")).toBe(false);
  });

  it("a non-bool if still yields na", () => {
    expect(Number.isNaN(Number(value(ind(6) + "x = if close < 0\n    1\n", "x")))).toBe(true);
  });

  it("and / or short-circuit, so the guide's array guard is safe", () => {
    // MG: "`if arr.size() != 0 and arr.first()` is safe in v6 and errors in v5."
    const src = "a = array.new_float(0)\nx = array.size(a) != 0 and array.first(a) > 0\n";
    expect(value(ind(6) + src, "x")).toBe(false);
    expect(() => value5(ind(5) + src, "x")).toThrow();
  });

  it("a skipped right operand is really skipped — its ta.* state goes stale", () => {
    // The guide's warning, reproduced. ta.cum(1) sits on the right of an `and`
    // whose left side holds only on even bars, so in v6 it counts ONLY the
    // even bars: 1, 2, 3 on bars 0, 2, 4 — which is what the right side
    // tests for. In v5 it counts every bar, so on bar 2 it is already 3.
    const src = "x = bar_index % 2 == 0 and ta.cum(1) == bar_index / 2 + 1\n";
    expect(series(ind(6) + src, "x", 5)).toEqual([true, false, true, false, true]);
    expect(series5(ind(5) + src, "x", 5)[2]).toBe(false);
  });

  it("a for loop's to_num is re-evaluated before every iteration", () => {
    // The bound reads the array's size, and the body grows it to 5: v5 reads
    // the bound once (0) and runs once; v6 keeps going until the size stops
    // changing.
    const src =
      "var a = array.new_float(0)\nn = 0\n" +
      "for i = 0 to array.size(a)\n    if array.size(a) < 5\n        array.push(a, 1)\n    n := i\n";
    expect(value(ind(6) + src, "n")).toBe(5);
    expect(value5(ind(5) + src, "n")).toBe(0);
  });

  it("(obj[n]).field reads the field of a past object", () => {
    const src = "type P\n    float v\np = P.new(bar_index * 10)\nx = (p[1]).v\n";
    expect(series(ind(6) + src, "x", 3).slice(1)).toEqual([0, 10]);
  });
});

describe("Dynamic requests", () => {
  // MG: "With dynamic_requests = false, calling request.*() inside loop or
  // conditional scopes, even through a wrapper function, is a compile error."
  const OFF = '//@version=6\nindicator("t", dynamic_requests = false)\n';
  const ON = '//@version=6\nindicator("t")\n';
  const REQ = 'request.security(syminfo.tickerid, "D", close)';

  const rejected: Array<[string, string, RegExp]> = [
    ["in an if block", `x = 0.0\nif close > open\n    x := ${REQ}\n`, /'request\.security' cannot be called inside a loop or conditional/],
    ["in a for loop", `x = 0.0\nfor i = 0 to 2\n    x := ${REQ}\n`, /'request\.security' cannot be called inside a loop or conditional/],
    ["through a wrapper", `f() => ${REQ}\nx = 0.0\nif close > open\n    x := f()\n`, /'f' calls request/],
    ["through a wrapper's wrapper", `f() => ${REQ}\ng() => f()\nx = 0.0\nif close > open\n    x := g()\n`, /'g' calls request/],
  ];
  for (const [name, src, because] of rejected) {
    it(`${name}: rejected when turned off`, () => {
      const r = attempt(6, OFF + src);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.message).toMatch(because);
    });
    it(`${name}: allowed by default`, () => {
      const r = attempt(6, ON + src);
      expect(r.ok, r.ok ? "" : (r as any).message).toBe(true);
    });
  }

  it.each([
    ["at script scope", `x = ${REQ}\n`],
    ["in an if CONDITION, which runs in the enclosing scope", `x = 0\nif ${REQ} > 0\n    x := 1\n`],
    ["a wrapper called at script scope", `f() => ${REQ}\nx = f()\n`],
  ])("still allowed when turned off: %s", (_name, src) => {
    const r = attempt(6, OFF + src);
    expect(r.ok, r.ok ? "" : (r as any).message).toBe(true);
  });
});
