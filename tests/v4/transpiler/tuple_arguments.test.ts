/**
 * v4 tuple expressions — a bracketed list as a POSITIONAL argument.
 *
 * SOURCING. From the TradingView v4 release notes, May 2020:
 *
 *   "The behavior of `security` function has changed: the `expression`
 *    parameter can be series or tuple."
 *
 * The same syntax also covers an `options` list written positionally —
 * `input.string("FQ", "Period", ["FQ", "FH", "FY"])` — which the v1 grammar
 * already accepted in its KEYWORD spelling and nowhere else.
 *
 * ── Why the arity cannot come from the registry ─────────────────────────────
 *
 * `security` returns one value or four depending on what it was handed, so no
 * registry entry can state its return shape. `[o, h, l, c] = security(...)` is
 * legal exactly when the expression argument is a four-element tuple, which is
 * a fact about the CALL SITE. That is what `tupleArityFromArgument` reads, and
 * it is why the mismatch test below matters: without it, a four-name
 * destructuring of a two-element tuple would silently fill two names with `na`.
 */
import { describe, it, expect } from "vitest";
import { transpile, compileScript } from "../../../transpiler/common";
import { compile, Context } from "../../../runtime/v4";

/** Daily candles, distinct in every field so a mixed-up tuple is visible. */
const DAILY = [
  { time: 0, open: 1, high: 11, low: 21, close: 31, volume: 1 },
  { time: 100, open: 2, high: 12, low: 22, close: 32, volume: 1 },
  { time: 200, open: 3, high: 13, low: 23, close: 33, volume: 1 },
];

/** Runs three chart bars over the fixture and reads several variables back. */
function trace(body: string, names: string[], version = 4): any[][] {
  const directive = version === 5 ? 'indicator("t")' : 'study("t")';
  const { js, profile } = compileScript(`//@version=${version}\n${directive}\n${body}`);
  const ctx = new Context(profile);
  ctx.provideSecurityData("AAPL", "D", DAILY);
  const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
  const out: any[][] = [];
  for (const t of [50, 150, 250]) {
    ctx.setBar(t, 5, 5, 5, 5, 1);
    exec();
    out.push(names.map(n => ctx.vars.get("opsv2_" + n)?.valueOf()));
    ctx.finalizeBar();
  }
  return out;
}

describe("a bracketed list is legal as a positional argument", () => {
  it("as an options list", () => {
    expect(() => transpile(
      '//@version=4\nstudy("t")\ns = input("FQ", "Period", options=["FQ", "FH"])\n',
    )).not.toThrow();
    expect(() => transpile(
      '//@version=5\nindicator("t")\ns = input.string("FQ", "Period", ["FQ", "FH", "FY"])\n',
    )).not.toThrow();
  });

  it("it is still NOT a general expression", () => {
    // v1's grammar header is explicit that a bracketed list is not an
    // expression in Pine; this widened one position, not the language.
    expect(() => transpile('//@version=4\nstudy("t")\nx = [1, 2]\n')).toThrow(/parsing failed/);
  });

  it("history access is unaffected — `a[1]` is not a list", () => {
    const src = '//@version=4\nstudy("t")\nx = close[1]\nplot(x)\n';
    expect(transpile(src)).toContain("ctx.get(");
  });

  it("v1–v3 reject a positional list", () => {
    for (const version of [1, 2, 3]) {
      const head = version === 1 ? 'study("t")\n' : `//@version=${version}\nstudy("t")\n`;
      expect(() => transpile(head + 'x = security("AAPL", "D", [close, open])\n'))
        .toThrow(/parsing failed/);
    }
  });
});

describe("security() with a tuple expression", () => {
  it("destructures into one variable per element, in order", () => {
    const got = trace('[o, c] = security("AAPL", "D", [open, close])\n', ["o", "c"]);
    // v4 defaults to lookahead_off, so the first chart bar sees no closed
    // daily bar and both elements are na.
    expect(got[0].every(Number.isNaN)).toBe(true);
    expect(got.slice(1)).toEqual([[1, 31], [2, 32]]);
  });

  it("four elements work the same way", () => {
    const got = trace('[o, h, l, c] = security("AAPL", "D", [open, high, low, close])\n',
                      ["o", "h", "l", "c"]);
    expect(got[2]).toEqual([2, 12, 22, 32]);
  });

  it("the scalar form is untouched", () => {
    const got = trace('c = security("AAPL", "D", close)\n', ["c"]);
    expect(got.slice(1)).toEqual([[31], [32]]);
  });

  it("a non-numeric element survives", () => {
    // `ctx.new_vars` coerced every element with `Number()`, which is right for
    // `[m, s, h] = macd(...)` and turned a string element into `na`.
    const got = trace('[c, s] = security("AAPL", "D", [close, "USD"])\n', ["c", "s"]);
    expect(got[2]).toEqual([32, "USD"]);
  });

  it("the keyword spelling of `expression` works too", () => {
    const got = trace('[o, c] = security("AAPL", "D", expression=[open, close])\n', ["o", "c"]);
    expect(got[2]).toEqual([2, 32]);
  });
});

describe("the arity is checked against the tuple, not the function", () => {
  it("too many names is refused", () => {
    expect(() => transpile(
      '//@version=4\nstudy("t")\n[a, b, c] = security("AAPL", "D", [close, open])\n',
    )).toThrow(/was given a 2-element tuple, but you provided 3 variables/);
  });

  it("too few names is refused", () => {
    expect(() => transpile(
      '//@version=4\nstudy("t")\n[a] = security("AAPL", "D", [close, open])\n',
    )).toThrow(/was given a 2-element tuple, but you provided 1 variable/);
  });

  it("the scalar form still reports the registry's verdict", () => {
    // Without a tuple ARGUMENT, `security` is back to being a function whose
    // return shape the registry knows — and it is not a tuple.
    expect(() => transpile(
      '//@version=4\nstudy("t")\n[a, b] = security("AAPL", "D", close)\n',
    )).toThrow(/'security' does not return a tuple/);
  });

  it("a built-in that really does return a tuple is unaffected", () => {
    expect(() => transpile(
      '//@version=4\nstudy("t")\n[m, s, h] = macd(close, 12, 26, 9)\n',
    )).not.toThrow();
  });
});

describe("v5 inherits all of it", () => {
  it("request.security destructures a tuple", () => {
    const got = trace('[o, c] = request.security("AAPL", "D", [open, close])\n', ["o", "c"], 5);
    expect(got[2]).toEqual([2, 32]);
  });
});
