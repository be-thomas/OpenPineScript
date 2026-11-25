/**
 * A user function's parameter read inside its own `request.security` expression is evaluated in the
 * REQUESTED context, derived arguments included.
 *
 * TradingView evidence: probe triage r6 ind4/01 part b (BINANCE:BTCUSDT 1h, `f(_s) => request.security(
 * syminfo.tickerid, "4D", _s[1], lookahead_on)`, `f(high)` equals the inline call on every row), and the
 * "Strategy Template" capture (v4, `f(…, hma(close, 20), 1)`: the weekly hma(high, 20)[1] to the last
 * digit). The engine hands a parameter read only inside the expression over as a thunk run there
 * (transpiler `collectLazySecurityParams`); a built-in series bound to a parameter that is also read
 * outside follows the requested context through `Series.redirect`; an expression that reads the script's
 * state as well runs the script in the requested context (`Context.runInContext`) and gets both.
 * Synthetic data.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../runtime/v1/session";

const H = 3600_000;
const t0 = Date.UTC(2026, 0, 5);
const bars = Array.from({ length: 24 * 8 }, (_, i) => {
  const c = 100 + 10 * Math.sin(i / 5) + (i % 7);
  return { time: t0 + i * H, open: c - 1, high: c + 2 + (i % 3), low: c - 2 - (i % 4), close: c, volume: 1 + (i % 5) };
});

function run(src: string) {
  const s = new Session();
  s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "60" } as any);
  const comp = s.compile(src);
  expect(comp.errors).toEqual([]);
  const r: any = s.runHistory(bars);
  expect(r.errors).toEqual([]);
  return (title: string) => r.series.find((x: any) => x.title === title).data.map((p: any) => p?.value ?? null);
}

describe("a function parameter inside request.security is the requested context's", () => {
  it("a derived argument, f(ta.sma(high, 4)), equals the inline request", () => {
    const col = run(`//@version=5
indicator("t")
f(_s) => request.security(syminfo.tickerid, "D", _s[1], lookahead = barmerge.lookahead_on)
plot(f(ta.sma(high, 4)), "fn")
plot(request.security(syminfo.tickerid, "D", ta.sma(high, 4)[1], lookahead = barmerge.lookahead_on), "inline")
plot(ta.sma(high, 4)[1], "chart")`);
    expect(col("fn")).toEqual(col("inline"));
    expect(col("fn")).not.toEqual(col("chart"));
  });

  it("a built-in series also read outside the request: the request sees the requested one, the body the chart's", () => {
    const col = run(`//@version=5
indicator("t")
f(_s) => [request.security(syminfo.tickerid, "D", _s, lookahead = barmerge.lookahead_on), _s]
[a, b] = f(high)
plot(a, "fn")
plot(b, "body")
plot(request.security(syminfo.tickerid, "D", high, lookahead = barmerge.lookahead_on), "inline")
plot(high, "h")`);
    expect(col("fn")).toEqual(col("inline"));
    expect(col("body")).toEqual(col("h"));
  });

  it("with the script's state in the same expression: both are the requested context's", () => {
    const col = run(`//@version=5
indicator("t")
var int n = 0
n += 1
f(_s) => request.security(syminfo.tickerid, "D", _s + n, lookahead = barmerge.lookahead_on)
plot(f(ta.sma(high, 2)), "fn")
plot(request.security(syminfo.tickerid, "D", ta.sma(high, 2) + n, lookahead = barmerge.lookahead_on), "inline")`);
    expect(col("fn")).toEqual(col("inline"));
    expect(col("fn").filter((v: any) => Number.isFinite(v)).length).toBeGreaterThan(100);
  });
});
