/**
 * `x == na` and `x != na`. TradingView compiles both at v1 through v5, and with
 * `x = bar_index % 2 == 0 ? na : close` BOTH are false on every bar, na bars and
 * value bars alike, while `na(x)` toggles; v6 refuses the comparison at compile
 * time (dev-docs/tv-parity/_probes/corpus98/p8_v{1..6}_eq_na, BINANCE:BTCUSDT
 * 1h, 2026-11-14).
 */
import { describe, it, expect } from "vitest";
import { Session, type Candle } from "../../runtime/v1/session";

const bars: Candle[] = Array.from({ length: 6 }, (_, i) => ({
  time: Date.UTC(2025, 0, 1, i), open: 10, high: 11, low: 9, close: 10 + i, volume: 1,
}));

function run(version: number) {
  const counter = version >= 4 ? "bar_index" : "n";
  const head = version === 1 ? "" : `//@version=${version}\n`;
  const decl = version >= 5 ? "indicator" : "study";
  const s = new Session();
  s.setChart({ timeframe: "60", symbol: "BINANCE:BTCUSDT" });
  const c = s.compile(`${head}${decl}("p8 v${version} eq na")
x = ${counter} % 2 == 0 ? na : close
plot(x == na ? 1 : 0, "eq")
plot(x != na ? 1 : 0, "ne")
plot(na(x) ? 1 : 0, "isna")
`);
  if (c.errors.length) return { errors: c.errors, col: () => [] as number[] };
  const r = s.runHistory(bars);
  return { errors: c.errors, col: (t: string) => r.series.find(x => x.title === t)!.data.map((d: any) => d.value) };
}

describe.each([1, 2, 3, 4, 5])("v%i x == na / x != na", (version) => {
  it("compiles, and both comparisons are false on every bar", () => {
    const r = run(version);
    expect(r.errors).toEqual([]);
    expect(r.col("eq")).toEqual([0, 0, 0, 0, 0, 0]);
    expect(r.col("ne")).toEqual([0, 0, 0, 0, 0, 0]);
    expect(r.col("isna")).toEqual([1, 0, 1, 0, 1, 0]);
  });
});

describe("v6 x == na", () => {
  it("is still refused at compile time", () => {
    const r = run(6);
    expect(r.errors.length).toBe(1);
    expect(r.errors[0].message).toMatch(/cannot compare to 'na' with '==' or '!='/);
  });
});
