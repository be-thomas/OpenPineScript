/**
 * History of a non-identifier expression inside an `if`/`for` body.
 *
 * It was na on every bar: the expression's series was written only on the bars
 * the body ran, so `[n]` landed in a hole. TradingView indexes that series by
 * BAR and carries its last value over the bars the line did not run on, so
 * `(close + 0)[3]` on a bar that runs every 4th bar reads the PREVIOUS
 * execution's value. Checked with Pine Logs:
 *   dev-docs/tv-parity/_probes/expr-hist-if/
 *
 * A field access `obj.field[n]` is different: it reads the field of the object
 * as it was n bars ago, from the object variable's own history. Checked with
 * Pine Logs:
 *   dev-docs/tv-parity/_probes/udt-cond-formats/tv-run/
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const N = 40;
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

describe("expression history inside an if body", () => {
  const o = run(`//@version=5
indicator("a")
float e = na
float g = na
float h = na
if bar_index % 4 == 3
    e := (close + 0)[3]
    g := (bar_index * 1)[1]
    h := math.max(close, 0)[2]
plot(e, "e")
plot(g, "g")
plot(h, "h")
`);

  it("reads the previous execution's value on executing bars", () => {
    for (let b = 7; b < N; b += 4) {
      expect(o.e[b]).toBe(closeAt(b - 4));
      expect(o.g[b]).toBe(b - 4);
      expect(o.h[b]).toBe(Math.max(closeAt(b - 4), 0));
    }
  });

  it("is na on the first execution and on bars the body does not run", () => {
    expect([o.e[3], o.g[3], o.h[3]]).toEqual([null, null, null]);
    for (let b = 0; b < N; b++) {
      if (b % 4 === 3) continue;
      expect([o.e[b], o.g[b], o.h[b]]).toEqual([null, null, null]);
    }
  });
});

describe("expression history at global scope", () => {
  it("is unchanged: (close + 0)[3] equals close[3]", () => {
    const o = run(`//@version=5
indicator("g")
plot((close + 0)[3], "x")
`);
    for (let b = 3; b < N; b++) expect(o.x[b]).toBe(closeAt(b - 3));
  });
});

describe("field history obj.field[n]", () => {
  const o = run(`//@version=5
indicator("b")
type bar
    int i = bar_index
bar b = bar.new()
float c3 = na
float lp = na
if bar_index % 4 == 3
    c3 := b.i[3]
    for k = 1 to 2
        lp := b.i[k]
plot(c3, "c3")
plot(b.i[3], "glob")
plot(lp, "lp")
`);

  it("reads the field n bars back inside an if", () => {
    for (let b = 3; b < N; b += 4) expect(o.c3[b]).toBe(b - 3);
  });

  it("reads it at global scope", () => {
    for (let b = 3; b < N; b++) expect(o.glob[b]).toBe(b - 3);
  });

  it("reads it inside a for loop", () => {
    for (let b = 3; b < N; b += 4) expect(o.lp[b]).toBe(b - 2);
  });
});
