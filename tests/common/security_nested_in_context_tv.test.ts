/**
 * A request met while the script runs in a requested context (Context.runInContext)
 * is requested from that context; it is not its expression read in place.
 *
 * TradingView probe 04_p3-nested (BINANCE:BTCUSDT 1h, v5, 300 bars):
 *
 *     w = request.security(syminfo.tickerid, "W", close)
 *     var cnt = 0.0
 *     cnt := w
 *     d = request.security(syminfo.tickerid, "240", cnt)
 *
 * gives d == w on every bar. `cnt` is script state, so `d` runs the script in the
 * 240 context, where `w` must be the weekly close as requested from there, not the
 * 240 close. Synthetic bars here; the capture's bars are replayed when dev-docs is present.
 */
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Session } from "../../runtime/v1/session";

const SRC = `//@version=5
indicator("p3 nested")
w = request.security(syminfo.tickerid, "W", close)
var cnt = 0.0
cnt := w
d = request.security(syminfo.tickerid, "240", cnt)
plot(d, "d")
plot(w, "w")
plot(request.security(syminfo.tickerid, "240", close), "c240")
`;

function run(bars: any[]) {
  const s = new Session();
  s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "60" } as any);
  const comp = s.compile(SRC);
  expect(comp.errors).toEqual([]);
  const r: any = s.runHistory(bars);
  expect(r.errors).toEqual([]);
  return (title: string) => r.series.find((x: any) => x.title === title).data.map((p: any) => p?.value ?? null);
}

describe("a request inside a context run is requested from that context (probe 04_p3-nested), v5", () => {
  it("synthetic hourly bars over three weeks: d == w on every bar", () => {
    const H = 3600_000;
    const t0 = Date.UTC(2026, 0, 5);   // a Monday
    const bars = Array.from({ length: 24 * 7 * 3 }, (_, i) => {
      const c = 100 + i + 10 * Math.sin(i / 7);
      return { time: t0 + i * H, open: c - 1, high: c + 2, low: c - 2, close: c, volume: 1 };
    });
    const col = run(bars);
    const w = col("w");
    expect(w.filter((x: any) => x !== null).length).toBeGreaterThan(0);
    expect(col("d")).toEqual(w);
    // The 240 close differs from the weekly one, so the test tells the two apart.
    expect(col("c240")).not.toEqual(w);
  });

  describe("replays the TradingView capture", () => {
    const dir = join(__dirname, "../../../PineScript/dev-docs/tv-parity/_probes/pr33-review/04_p3-nested");
    const p = join(dir, "data.csv");
    if (!existsSync(p)) { it.skip("dev-docs capture absent", () => {}); return; }
    it("d == w on the captured bars, as on TradingView", () => {
      const lines = readFileSync(p, "utf8").trim().split("\n");
      const head = lines[0].split(",");
      const ix = (k: string) => head.indexOf(k);
      const rows = lines.slice(1).map((l) => l.split(","));
      // The reference: TradingView's d equals its w on every captured bar.
      for (const r of rows) expect(r[ix("d")]).toBe(r[ix("w")]);
      // The engine on the same hourly bars. Its weekly bars are folded from these 300
      // hours (TradingView reads its own weekly series), so the values are compared
      // with each other, not with TradingView's.
      const bars = rows.map((r) => ({
        time: Number(r[ix("time")]) * 1000, open: Number(r[ix("open")]), high: Number(r[ix("high")]),
        low: Number(r[ix("low")]), close: Number(r[ix("close")]), volume: Number(r[ix("volume")]),
      }));
      const col = run(bars);
      expect(col("w").some((x: any) => x !== null)).toBe(true);
      expect(col("d")).toEqual(col("w"));
    });
  });
});
