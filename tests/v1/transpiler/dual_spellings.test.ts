/**
 * `tickerid` — a VARIABLE and a FUNCTION with the same name.
 *
 * SOURCING. Pine keeps functions and variables in separate namespaces, which is
 * why `sma = sma(close, 10)` is ordinary code. v1–v3 use that to spell two
 * different things `tickerid`:
 *
 *     tickerid                                 the chart's own ticker id
 *     tickerid(prefix, ticker, session)        builds one from its parts
 *
 * v4 renames only the variable — from the v3→v4 migration guide, "The `ticker`
 * and `tickerid` variables are renamed to `syminfo.ticker` and
 * `syminfo.tickerid` respectively" — and v5 renames the function to
 * `ticker.new`. So the collision exists at v1–v3 and nowhere else.
 *
 * ── The failure this closes ─────────────────────────────────────────────────
 *
 * The registry holds one entry per name and the FUNCTION held this one, so a
 * bare read emitted the function object. TradingView's own `v3-release-notes-05`
 *
 *     l = security(tickerid, r, low)
 *     if (low == l)
 *         strategy.entry("My Long Entry Id", strategy.long)
 *
 * asked for a symbol named "function tickerid() { … }", got `na` on every bar,
 * and never entered. Nothing reported it: passing a built-in where a string
 * belongs is not a compile error, and an unknown symbol legitimately yields na.
 *
 * `ticker` has the same dual shape in the language and is NOT affected, because
 * nothing else claims that registry key — which is why the case below reads it
 * too rather than assuming.
 */
import { describe, it, expect } from "vitest";
import { transpile, compileScript } from "../../../transpiler/common";
import { compile, Context } from "../../../runtime/v1";

function read(body: string, version: number, tune?: (c: Context) => void): any {
  const head = version === 1 ? 'study("t")\n' : `//@version=${version}\nstudy("t")\n`;
  const { js, profile } = compileScript(head + body);
  const ctx = new Context(profile);
  ctx.provideSymbolInfo({ symbol: "NASDAQ:AAPL" });
  tune?.(ctx);
  const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
  ctx.setBar(Date.UTC(2015, 1, 17), 10, 12, 9, 11, 100);
  exec();
  ctx.finalizeBar();
  return ctx.vars.get("opsv2_x")?.valueOf();
}

describe("read bare, it is the chart's ticker id", () => {
  for (const version of [1, 2, 3]) {
    it(`v${version} reads a string`, () => {
      expect(read("x = tickerid\n", version)).toBe("NASDAQ:AAPL");
    });

    it(`v${version} reads ticker too`, () => {
      expect(read("x = ticker\n", version)).toBe("AAPL");
    });
  }

  it("...a STRING, not the function object", () => {
    expect(typeof read("x = tickerid\n", 2)).toBe("string");
  });

  it("so it can be concatenated, which is what a script does with it", () => {
    expect(read('x = tickerid + "!"\n', 2)).toBe("NASDAQ:AAPL!");
  });
});

describe("called, it is still the constructor", () => {
  it("builds a ticker id from its parts", () => {
    expect(read('x = tickerid("BATS", "AAPL")\n', 2)).toBe("BATS:AAPL");
  });

  it("the two spellings coexist in one script", () => {
    // The point of separate namespaces: neither use shadows the other.
    expect(read('x = tickerid + "/" + tickerid("BATS", "AAPL")\n', 2))
      .toBe("NASDAQ:AAPL/BATS:AAPL");
  });
});

describe("it reaches security(), which is where it mattered", () => {
  it("a request for the chart's own symbol returns the chart's own series", () => {
    // `v3-release-notes-05` in one line: same symbol, same timeframe, so the
    // answer is the bar's own low rather than na.
    const src = '//@version=2\nstudy("t")\nx = security(tickerid, period, low)\n';
    const { js, profile } = compileScript(src);
    const ctx = new Context(profile);
    ctx.provideSymbolInfo({ symbol: "NASDAQ:AAPL" });
    const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
    ctx.setBar(Date.UTC(2015, 1, 17), 10, 12, 9, 11, 100);
    exec();
    ctx.finalizeBar();
    expect(ctx.vars.get("opsv2_x")?.valueOf()).toBe(9);
  });
});

describe("a script that binds the name itself still wins", () => {
  it("its own declaration is what a read resolves to", () => {
    expect(read('tickerid = "MINE"\nx = tickerid\n', 2)).toBe("MINE");
  });
});

describe("v4 and v5 report the rename instead", () => {
  it("v4 names syminfo.tickerid", () => {
    expect(() => transpile('//@version=4\nstudy("t")\nx = tickerid\n'))
      .toThrow(/'tickerid' was renamed to 'syminfo\.tickerid' in Pine Script v4/);
  });

  it("v5 names ticker.new — the FUNCTION is what v5 renamed", () => {
    expect(() => transpile('//@version=5\nindicator("t")\nx = tickerid\n'))
      .toThrow(/'tickerid' was renamed to 'ticker\.new' in Pine Script v5/);
  });
});
