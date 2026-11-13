/**
 * TradingView's line-wrapping rule ("Line wrapping" in the user manual): a
 * line indented by a number of spaces that is NOT a multiple of four continues
 * the line above; blocks are indented by multiples of four; a line at column 0
 * starts a new statement, even inside an open call.
 *
 * Evidence: ENGINE-BUGS §3 (KAMA, `)` at column 0 -> "Mismatched input 'end of
 * line without line continuation' expecting ')'") and §16 (Objective Features,
 * two-space bodies read as continuations -> CE10150).
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";
import { detectVersion } from "../../../transpiler/common/version";

const compile = (src: string) => {
  const s = new Session();
  const c = s.compile(src);
  return { errors: c.errors, version: s.pineVersion };
};

// v4 calls it study(); v5 onwards, indicator().
const decl = (version: number) => `${version === 4 ? "study" : "indicator"}("t")`;

const kama = (version: number, close: string) => `//@version=${version}
strategy(
     title="KAMA",
     overlay=true,
     max_bars_back=500${close}
plot(close)
`;

const fn = (version: number, pad: string) => `//@version=${version}
${decl(version)}
step(lo, hi) =>
${pad}span = hi - lo
${pad}if span <= 0.0
${pad}${pad}na
${pad}else
${pad}${pad}span
plot(step(low, high))
`;

describe.each([4, 5, 6])("v%i line continuation per TradingView", (v) => {

  // TradingView rejects this at v5 (KAMA) and v4 (version-scope/v4-col0-paren; the
  // same call with ')' indented one space loads, v4-col1-paren); at v6 it loads
  // (run 75178dcf).
  (v !== 6 ? it : it.skip)("a call closed by ')' at column 0 is an error", () => {
    const { errors } = compile(kama(v, "\n)"));
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toMatch(/end of line without line continuation/);
    expect(errors[0].message).toMatch(/expecting '\)'/);
    expect(errors[0].line).toBe(2);
  });

  (v === 6 ? it : it.skip)("a call closed by ')' at column 0 compiles (75178dcf shape)", () => {
    expect(compile(kama(v, "\n)")).errors).toEqual([]);
  });

  it("the same call closed by ')' indented 1 or 5 spaces compiles", () => {
    expect(compile(kama(v, "\n )")).errors).toEqual([]);
    expect(compile(kama(v, "\n     )")).errors).toEqual([]);
  });

  it("the same call closed on the previous line compiles", () => {
    expect(compile(kama(v, ")")).errors).toEqual([]);
  });

  it("a comment or blank line at column 0 inside a call is not a statement", () => {
    const src = `//@version=${v}\n${v === 4 ? "study" : "indicator"}(\n     "t",\n// note\n\n     overlay=true)\nplot(close)\n`;
    expect(compile(src).errors).toEqual([]);
  });

  it("four-space bodies are blocks", () => {
    expect(compile(fn(v, "    ")).errors).toEqual([]);
  });

  it("two-space bodies are continuation lines, which does not parse", () => {
    expect(compile(fn(v, "  ")).errors.length).toBeGreaterThan(0);
  });

  it("a three-space line continues an expression", () => {
    const src = `//@version=${v}\n${decl(v)}\nx = close +\n   open\nplot(x)\n`;
    expect(compile(src).errors).toEqual([]);
    const src2 = `//@version=${v}\n${decl(v)}\nx = close\n   + open\nplot(x)\n`;
    expect(compile(src2).errors).toEqual([]);
  });
});

describe("version annotation spacing", () => {
  it("`//@version = 6` is version 6", () => {
    const src = fn(6, "    ").replace("//@version=6", "//@version = 6");
    expect(detectVersion(src)).toBe(6);
    expect(compile(src).errors).toEqual([]);
  });
});

// v1–v3, chart runs 2026-11-12 (dev-docs/tv-parity/_probes/version-scope/v{1,2,3}-two-space):
// a two-space function body is "extraneous input 'y' expecting 'end of line without line
// continuation'" (v1: "Script could not be translated"); the same body indented by four loads.
describe.each([1, 2, 3])("v%i two-space bodies per TradingView", (v) => {
  const src = (pad: string) =>
    `${v === 1 ? "" : `//@version=${v}\n`}study("t")\nf(x) =>\n${pad}y = x * 2\n${pad}y\nplot(f(close))\n`;
  it("are refused", () => expect(compile(src("  ")).errors.length).toBeGreaterThan(0));
  it("four-space bodies compile", () => expect(compile(src("    ")).errors).toEqual([]));
});

// v1–v3, chart runs 2026-11-12 (version-scope/v{1,2,3}-col0-paren): a call closed by ')' at
// column 0 is refused on every version before v6.
describe.each([1, 2, 3])("v%i column-0 ')' per TradingView", (v) => {
  const src = (p: string) =>
    `${v === 1 ? "" : `//@version=${v}\n`}study("t")\nx = max(close,\n     open\n${p}\nplot(x)\n`;
  it("is refused", () => expect(compile(src(")")).errors.length).toBeGreaterThan(0));
  it("indented one space compiles", () => expect(compile(src(" )")).errors).toEqual([]));
});
