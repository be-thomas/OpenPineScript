/**
 * `x[na]` reads the current bar: `close[na] == close`. TradingView capture,
 * popular-author batch 2026-11-21 (v6); v5 shares it. v4 was not probed and is
 * left as it was.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../runtime/v1/session";

const bars = Array.from({ length: 5 }, (_, i) => ({
  time: 1_700_000_000 + i * 3600, open: 1, high: 2, low: 0, close: 10 + i, volume: 1,
}));

describe.each(["5", "6"])("history with an na offset, v%s", (v) => {
  it("reads the current bar of a built-in series and of a user variable", () => {
    const decl = v === "4" ? 'study("t")' : 'indicator("t")';
    const s = new Session();
    expect(s.compile(`//@version=${v}
${decl}
${v === "4" ? "o = int(na)" : "int o = na"}
u = close * 2
plot(close[o], "a")
plot(u[o], "b")
plot(na(close[o]) ? 1 : 0, "c")
plot(close[na], "d")
`).errors).toEqual([]);
    const r: any = s.runHistory(bars);
    expect(r.errors).toEqual([]);
    const col = (t: string) => r.series.find((x: any) => x.title === t).data.map((p: any) => p?.value);
    expect(col("a")).toEqual(bars.map((b) => b.close));
    expect(col("b")).toEqual(bars.map((b) => b.close * 2));
    expect(col("c")).toEqual(bars.map(() => 0));
    expect(col("d")).toEqual(bars.map((b) => b.close));
  });
});
