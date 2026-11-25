/**
 * An inner declaration whose initialiser reads a name, and what TradingView does
 * with it (dev-docs/tv-parity/_probes/corpus98/p7_*, p9_*, p10_*, BINANCE:BTCUSDT
 * 1h, 2026-11-14):
 *
 *   A. over an OUTER variable of the same name (an `if` body or a function body):
 *        v5, v6  compiles whatever the outer initialiser is; the inner is a new
 *                local reading the outer, and the outer keeps its value
 *        v3, v4  compiles when the outer initialiser is not a compile-time
 *                constant; refuses with "Undeclared identifier" when it is
 *        v1, v2  not probed, unchanged
 *   B. an `if` expression whose branches declare the name: compiles at v3-v6,
 *      value is the taken branch's
 *   C. a keyword argument's NAME is not a read of the variable
 *   D. a true self-reference with no outer variable is still an error
 */
import { describe, it, expect } from "vitest";
import { Session, type Candle } from "../../runtime/v1/session";

// Alternating up and down bars, so `close > open` is both true and false.
const bars: Candle[] = Array.from({ length: 6 }, (_, i) => ({
  time: Date.UTC(2025, 0, 1, i), open: 100, high: 110, low: 90, close: i % 2 === 0 ? 105 : 95, volume: 1,
}));
const closes = bars.map(b => b.close);

const head = (v: number) =>
  v === 1 ? 'study("t")\n' : `//@version=${v}\n${v >= 5 ? 'indicator("t")' : 'study("t")'}\n`;

function run(src: string) {
  const s = new Session();
  s.setChart({ timeframe: "60", symbol: "BINANCE:BTCUSDT" });
  const c = s.compile(src);
  const errors = c.errors.map((e: any) => e.message as string);
  if (errors.length) return { errors, col: (_: string) => [] as any[] };
  const r = s.runHistory(bars);
  return { errors, col: (t: string) => r.series.find(x => x.title === t)!.data.map((d: any) => d.value) };
}

describe.each([3, 4, 5, 6])("v%i shadow over a NON-constant outer", (v) => {
  it("outer s = input(1): the outer stays 1", () => {
    const r = run(head(v) + (v >= 5 ? "s = input.int(1)\n" : "s = input(1)\n") + 'if close > 0\n    s = s + 1\nplot(s, "s")\n');
    expect(r.errors).toEqual([]);
    expect(r.col("s")).toEqual([1, 1, 1, 1, 1, 1]);
  });

  it("outer s = close: the outer stays close", () => {
    const r = run(head(v) + 's = close\nif close > 0\n    s = s + 1\nplot(s, "s")\n');
    expect(r.errors).toEqual([]);
    expect(r.col("s")).toEqual(closes);
  });

  it("a shadow whose outer is unused still compiles", () => {
    const r = run(head(v) + (v >= 5 ? "s = input.int(1)\n" : "s = input(1)\n") + 'if close > 0\n    s = s + 1\nplot(close, "c")\n');
    expect(r.errors).toEqual([]);
  });
});

describe.each([3, 4])("v%i shadow over a compile-time-constant outer is refused", (v) => {
  it.each([["literal", "1.0"], ["constant expression", "2.0 * 3.0"]])("%s", (_n, init) => {
    const r = run(head(v) + `s = ${init}\nif close > 0\n    s = s + 1\nplot(close, "c")\n`);
    expect(r.errors.length).toBe(1);
    expect(r.errors[0]).toMatch(/Undeclared identifier 's'\./);
  });
});

describe("function-local shadow", () => {
  it("v3: over a constant outer it is refused", () => {
    const r = run(head(3) + 'p = 5.0\nf(x) =>\n    p = nz(p[1]) + x\n    p\nplot(f(1.0), "f")\n');
    expect(r.errors.length).toBe(1);
    expect(r.errors[0]).toMatch(/Undeclared identifier 'p'\./);
  });

  it.each([5, 6])("v%i: compiles; the inner reads the outer", (v) => {
    const r = run(head(v) + 'm = input.string("A")\nfm(v) =>\n    m = m == "A" ? v : -v\n    m\nplot(fm(close), "fm")\n');
    expect(r.errors).toEqual([]);
    expect(r.col("fm")).toEqual(closes);
  });

  it.each([5, 6])("v%i: over a constant outer too", (v) => {
    const r = run(head(v) + 'p = 5.0\nf(x) =>\n    p = p + x\n    p\nplot(f(1.0), "f")\nplot(p, "p")\n');
    expect(r.errors).toEqual([]);
    expect(r.col("f")).toEqual([6, 6, 6, 6, 6, 6]);
    expect(r.col("p")).toEqual([5, 5, 5, 5, 5, 5]);
  });
});

describe.each([5, 6])("v%i shadow over a literal outer", (v) => {
  it("the outer keeps its value", () => {
    const r = run(head(v) + 's = 1.0\nif close > 0\n    s = s + 1\nplot(s, "s")\n');
    expect(r.errors).toEqual([]);
    expect(r.col("s")).toEqual([1, 1, 1, 1, 1, 1]);
  });
});

describe.each([3, 4, 5, 6])("v%i if-expression whose branches declare the name", (v) => {
  it("takes the taken branch's value", () => {
    const r = run(head(v) + 'hh = if close > open\n    hh = 1.0\nelse\n    hh = 2.0\nplot(hh, "h")\n');
    expect(r.errors).toEqual([]);
    expect(r.col("h")).toEqual(bars.map(b => (b.close > b.open ? 1 : 2)));
  });

  it("the Hull shape: a branch re-declares from a bar read", () => {
    const r = run(head(v) + 'price = if close[0] > 100\n    100\nelse\n    price = close[0]\nplot(price, "p")\n');
    expect(r.errors).toEqual([]);
    expect(r.col("p")).toEqual(bars.map(b => (b.close > 100 ? 100 : b.close)));
  });
});

describe.each([3, 4, 5, 6])("v%i keyword argument named like the variable", (v) => {
  it("type = input(defval = ..., type = ...) is not a self-reference", () => {
    const call = v >= 5 ? 'input.string(defval = "A", options = ["A", "B"])'
      : `input(defval = "A", type = ${v === 3 ? "string" : "input.string"}, options = ["A", "B"])`;
    const r = run(head(v) + `type = ${call}\nplot(type == "A" ? 1 : 0, "kw")\n`);
    expect(r.errors).toEqual([]);
    expect(r.col("kw")).toEqual([1, 1, 1, 1, 1, 1]);
  });
});

describe.each([3, 4, 5, 6])("v%i true self-reference", (v) => {
  it("x = nz(x[1]) + 1 at top level is still an error", () => {
    const r = run(head(v) + 'x = nz(x[1]) + 1\nplot(x)\n');
    expect(r.errors.length).toBe(1);
    expect(r.errors[0]).toMatch(/'x' cannot reference itself in its own declaration\. Declare it first \(e\.g\. 'x = 0\.0'\), then assign with ':='\./);
  });

  it("a redeclaration in the SAME block is not a shadow", () => {
    const r = run(head(v) + 'if close > 0\n    s = 1.0\n    s = s + 1\nplot(close)\n');
    expect(r.errors.length).toBe(1);
    expect(r.errors[0]).toMatch(/'s' cannot reference itself/);
  });
});

// p11 (corpus98): the refusal needs a constant outer that is NEVER reassigned
// with ':=' in its scope. The counter is `n` at v3 and `bar_index` at v4.
describe.each([3, 4])("v%i constant outer reassigned with ':='", (v) => {
  const idx = v === 3 ? "n" : "bar_index";

  it("J: the outer's own value, 1 or 5; the shadow does not change it", () => {
    const r = run(head(v) + `s = 1.0\nif ${idx} % 3 == 0\n    s := 5.0\nif close > 0\n    s = s + 1\nplot(s, "s")\n`);
    expect(r.errors).toEqual([]);
    expect(r.col("s")).toEqual([5, 1, 1, 5, 1, 1]);
  });

  it("K: a function-local literal never reassigned is refused", () => {
    const r = run(head(v) + 'f(x) =>\n    q = 0.0\n    if x > 0\n        q = q + x\n    q\nplot(f(close), "f")\n');
    expect(r.errors.length).toBe(1);
    expect(r.errors[0]).toMatch(/Undeclared identifier 'q'\./);
  });

  it("L: reassigned in the function, f returns the outer's 2.0 on every bar", () => {
    const r = run(head(v) + 'f(x) =>\n    q = 0.0\n    if x > 0\n        q := 2.0\n    if x > 0\n        q = nz(q[1]) + 1\n    q\nplot(f(close), "f")\n');
    expect(r.errors).toEqual([]);
    expect(r.col("f")).toEqual([2, 2, 2, 2, 2, 2]);
  });
});

// A ':=' counts only when it assigns the OUTER variable. One under the shadow
// (or on a same-named local or parameter of a function) assigns that, and the
// outer stays a never-reassigned constant: TradingView refuses these like the
// version without the ':=' (p11 J has the ':=' at the outer's own level).
describe.each([3, 4])("v%i ':=' that assigns the shadow does not unfreeze the outer", (v) => {
  it("a ':=' on the inner shadow", () => {
    const r = run(head(v) + 's = 1.0\nif close > 0\n    s = s + 1\n    s := s * 2\nplot(close, "c")\n');
    expect(r.errors.length).toBe(1);
    expect(r.errors[0]).toMatch(/Undeclared identifier 's'\./);
  });

  it("a ':=' on a same-named local of another function", () => {
    const r = run(head(v) + 's = 1.0\ng(x) =>\n    s = x\n    s := s * 2\n    s\nif close > 0\n    s = s + 1\nplot(g(close), "g")\n');
    expect(r.errors.length).toBe(1);
    expect(r.errors[0]).toMatch(/Undeclared identifier 's'\./);
  });

  it("a ':=' on a same-named parameter", () => {
    const r = run(head(v) + 's = 1.0\ng(s) =>\n    s := s * 2\n    s\nif close > 0\n    s = s + 1\nplot(g(close), "g")\n');
    expect(r.errors.length).toBe(1);
    expect(r.errors[0]).toMatch(/Undeclared identifier 's'\./);
  });

  it("a ':=' on the outer in a nested block still unfreezes it", () => {
    const r = run(head(v) + 's = 1.0\nif close > 0\n    if close > 1\n        s := 3.0\nif close > 0\n    s = s + 1\nplot(s, "s")\n');
    expect(r.errors).toEqual([]);
  });
});
