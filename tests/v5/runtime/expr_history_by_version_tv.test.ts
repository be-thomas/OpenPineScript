/**
 * History of a non-identifier expression inside an `if` body, by Pine version.
 *
 * v5/v6 index the expression's series by BAR and carry its last value over the
 * bars the line did not run on. v2/v3 compute the `[n]` subexpression on every
 * bar (true per-bar history); v4 does too, but only for a call-free base --
 * `max(close, 0)[2]` is still carried. Checked on TradingView with chart runs:
 *   dev-docs/tv-parity/_probes/version-scope/
 *     v2-runtime, v3-runtime, v4-runtime, v6-expr-hist, v3-call-in-if
 * A call inside the `if` WITHOUT `[n]` uses per-call history at every version
 * (v3-call-in-if), which is why the block itself is not run every bar.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const N = 60;
const closeAt = (i: number) => 100 + ((i * i) % 37);
const bars = Array.from({ length: N }, (_, i) => ({
  time: Date.UTC(2024, 0, 1) + i * 60_000,
  open: closeAt(i), high: closeAt(i) + 1, low: closeAt(i) - 1, close: closeAt(i), volume: 1,
}));

function run(src: string): Record<string, (number | null)[]> {
  const s = new Session();
  s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "1" } as any);
  const c = s.compile(src);
  expect(c.errors).toEqual([]);
  const r: any = s.runHistory(bars);
  const out: Record<string, (number | null)[]> = {};
  for (const ser of r.series) {
    out[ser.title] = ser.data.map((p: any) => {
      const v = p?.value ?? p;
      return typeof v === "number" && !Number.isNaN(v) ? v : null;
    });
  }
  return out;
}

const mean3 = (a: number, b: number, c: number) => (a + b + c) / 3;

// `sma(close, 3)` inside the `if` keeps PER-CALL history: its window is the
// close of the last three EXECUTIONS. `[1]` then reads the previous execution's
// result (carried), whose window ends at bar b-4.
const carriedSma = (b: number) => mean3(closeAt(b - 4), closeAt(b - 8), closeAt(b - 12));

function probe(version: number): Record<string, (number | null)[]> {
  const old = version <= 3;
  const idx = old ? "n" : "bar_index";
  const decl = version >= 4 ? "float " : "";
  const head = version >= 5 ? `//@version=${version}\nindicator("p")` : `//@version=${version}\nstudy("p")`;
  const mx = version >= 5 ? "math.max" : "max";
  const sma = version >= 5 ? "ta.sma" : "sma";
  return run(`${head}
${decl}e = na
${decl}gg = na
${decl}h = na
${decl}s = na
if ${idx} % 4 == 3
    e := (close + 0)[3]
    gg := (${idx} * 1)[1]
    h := ${mx}(close, 0)[2]
    s := ${sma}(close, 3)[1]
plot(e, "e")
plot(gg, "gg")
plot(h, "h")
plot(s, "s")
`);
}

describe("expression history inside an if body, by version", () => {
  for (const v of [2, 3]) {
    it(`v${v}: every subexpression has true per-bar history`, () => {
      const o = probe(v);
      for (let b = 7; b < N; b += 4) {
        expect(o.e[b]).toBe(closeAt(b - 3));
        expect(o.gg[b]).toBe(b - 1);
        expect(o.h[b]).toBe(closeAt(b - 2));
        expect(o.s[b]).toBeCloseTo(mean3(closeAt(b - 3), closeAt(b - 2), closeAt(b - 1)), 9);
      }
    });
  }

  it("v4: a call-free base has true history, a base with a call is carried", () => {
    const o = probe(4);
    for (let b = 15; b < N; b += 4) {
      expect(o.e[b]).toBe(closeAt(b - 3));
      expect(o.gg[b]).toBe(b - 1);
      expect(o.h[b]).toBe(closeAt(b - 4));
      expect(o.s[b]).toBeCloseTo(carriedSma(b), 9);
    }
  });

  for (const v of [5, 6]) {
    it(`v${v}: everything is carried from the previous execution`, () => {
      const o = probe(v);
      for (let b = 15; b < N; b += 4) {
        expect(o.e[b]).toBe(closeAt(b - 4));
        expect(o.gg[b]).toBe(b - 4);
        expect(o.h[b]).toBe(closeAt(b - 4));
        expect(o.s[b]).toBeCloseTo(carriedSma(b), 9);
      }
    });
  }
});

describe("v3 base that is not hoistable", () => {
  it("a block-local base still compiles and runs", () => {
    const o = run(`//@version=3
study("l")
r = na
if n % 4 == 3
    loc = close * 2
    r := (loc + 0)[1]
plot(r, "r")
`);
    expect(o.r).toHaveLength(N);
  });
});
