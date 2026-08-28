/**
 * `syminfo.*` — the instrument metadata namespace, v4.
 *
 * SOURCING. Every description below is quoted from the manual's Chart
 * information page; the module header in runtime/v1/stdlib/syminfo.ts carries
 * the full set.
 *
 * ── The failure this closes ─────────────────────────────────────────────────
 *
 * Only `syminfo.ticker` and `syminfo.tickerid` existed, and both are v1–v3 flat
 * names that the v4 rename table aliases into the namespace. The other ten
 * members were absent — and `syminfo` IS a namespace the emitter knows, so a
 * missing member is not an error: `syminfo.mintick` compiled, read `undefined`,
 * and any arithmetic on it produced NaN on every bar with no diagnostic. Twelve
 * of TradingView's own v5 examples use it.
 *
 * That is why these tests read VALUES rather than asserting the names compile.
 */
import { describe, it, expect } from "vitest";
import { transpile, compileScript } from "../../../transpiler/common";
import { compile, Context } from "../../../runtime/v4";

function read(body: string, tune?: (ctx: Context) => void, version = 4): any {
  const directive = version === 5 ? 'indicator("t")' : 'study("t")';
  const { js, profile } = compileScript(`//@version=${version}\n${directive}\n${body}\n`);
  const ctx = new Context(profile);
  tune?.(ctx);
  const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
  ctx.setBar(0, 10, 12, 9, 11, 100);
  exec();
  return ctx.vars.get("opsv2_x")?.valueOf();
}

/** NASDAQ:AAPL, as the manual's own examples describe it. */
const AAPL = (ctx: Context) => ctx.provideSymbolInfo({
  symbol: "NASDAQ:AAPL",
  mintick: 0.01,
  currency: "USD",
  description: "Apple Inc.",
  type: "stock",
  timezone: "America/New_York",
  pointvalue: 1,
  session: "regular",
});

describe("the host's declared metadata reaches the script", () => {
  const CASES: Array<[string, any]> = [
    ["syminfo.currency", "USD"],
    ["syminfo.description", "Apple Inc."],
    ["syminfo.mintick", 0.01],
    ["syminfo.pointvalue", 1],
    ["syminfo.session", "regular"],
    ["syminfo.timezone", "America/New_York"],
    ["syminfo.type", "stock"],
  ];

  for (const [name, expected] of CASES) {
    it(`${name} is ${JSON.stringify(expected)}`, () => {
      expect(read(`x = ${name}`, AAPL)).toBe(expected);
    });
  }
});

describe("prefix and ticker are the two halves of the ticker id", () => {
  // "syminfo.prefix ... the symbol's broker/exchange identifier", "NASDAQ" for
  // NASDAQ:AAPL; "syminfo.ticker ... the dataset's symbol without the exchange
  // prefix", "AAPL". Derived rather than stored, so they cannot disagree with
  // the symbol they describe.
  it("splits NASDAQ:AAPL", () => {
    expect(read("x = syminfo.prefix", AAPL)).toBe("NASDAQ");
    expect(read("x = syminfo.ticker", AAPL)).toBe("AAPL");
    expect(read("x = syminfo.tickerid", AAPL)).toBe("NASDAQ:AAPL");
  });

  it("a symbol with no exchange has an empty prefix", () => {
    const bare = (ctx: Context) => ctx.provideSymbolInfo({ symbol: "AAPL" });
    expect(read("x = syminfo.prefix", bare)).toBe("");
    expect(read("x = syminfo.ticker", bare)).toBe("AAPL");
  });
});

describe("root falls back to the ticker", () => {
  it("is the futures root when there is one", () => {
    const wheat = (ctx: Context) => ctx.provideSymbolInfo({ symbol: "CBOT:ZW1!", root: "ZW" });
    expect(read("x = syminfo.root", wheat)).toBe("ZW");
  });

  it("...and the plain ticker otherwise", () => {
    // "Otherwise, it stores the same value as syminfo.ticker."
    expect(read("x = syminfo.root", AAPL)).toBe("AAPL");
  });
});

describe("the defaults are a US equity, and they are a choice", () => {
  it("an undeclared Context still answers every member", () => {
    // Left unset a script gets a stock quoted in USD on a one-cent tick, which
    // is what this repo's sample dataset is. Reading `undefined` was the bug.
    expect(read("x = syminfo.type")).toBe("stock");
    expect(read("x = syminfo.currency")).toBe("USD");
    expect(read("x = syminfo.mintick")).toBe(0.01);
    expect(read("x = syminfo.pointvalue")).toBe(1);
  });

  it("nothing reads as undefined", () => {
    const MEMBERS = ["basecurrency", "currency", "description", "mintick", "pointvalue",
                     "prefix", "root", "session", "ticker", "tickerid", "timezone", "type"];
    for (const m of MEMBERS) {
      expect(read(`x = syminfo.${m}`), `syminfo.${m}`).not.toBe(undefined);
    }
  });
});

describe("it is arithmetic-safe, which is the point", () => {
  it("mintick can be multiplied without producing NaN", () => {
    // The shape of the original defect: `syminfo.mintick * 10` was NaN on every
    // bar, and nothing anywhere said why.
    expect(read("x = syminfo.mintick * 10", AAPL)).toBeCloseTo(0.1, 10);
  });

  it("type compares as a string", () => {
    expect(read('x = syminfo.type == "stock" ? 1 : 0', AAPL)).toBe(1);
  });
});

describe("version gating", () => {
  it("v5 inherits the whole namespace", () => {
    expect(read("x = syminfo.type", AAPL, 5)).toBe("stock");
  });

  for (const version of [1, 2, 3]) {
    it(`v${version} has no syminfo namespace`, () => {
      expect(() => transpile(`//@version=${version}\nstudy("t")\nx = syminfo.mintick\n`))
        .toThrow(/'syminfo' is not a namespace in Pine Script v/);
    });
  }

  it("the v1–v3 flat spellings still work there", () => {
    expect(() => transpile('//@version=3\nstudy("t")\nx = ticker\n')).not.toThrow();
  });
});
