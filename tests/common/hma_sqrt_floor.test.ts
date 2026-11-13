/**
 * `hma` smooths over floor(sqrt(length)) bars, not round(sqrt(length)).
 *
 * TradingView's own `hma(close, n)` (v4) / `ta.hma(close, n)` (v5, v6) was plotted beside
 * wma(2 * wma(c, n/2) - wma(c, n), k) for k = floor and k = round on BTCUSDT 1D (2026-11-13):
 * floor agreed to the last digit at every version for lengths 8 and 21, round was off by 2.1e-2
 * and 1.4e-2. Lengths where the two agree (5, 9, 55) hid it. The fixture holds those runs.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Session } from "../../runtime/v1";

const fx = JSON.parse(readFileSync(join(__dirname, "../../conformance/common/golden/hma_floor_BTCUSDT.1D.json"), "utf8"));
const bars = fx.bars.map((b: number[]) => ({ time: b[0], open: b[1], high: b[2], low: b[3], close: b[4], volume: b[5] }));

const SCRIPTS: Record<string, string> = {
  "4": '//@version=4\nstudy("t")\nplot(hma(close, 8), "hma8")\nplot(hma(close, 21), "hma21")\n',
  "5": '//@version=5\nindicator("t")\nplot(ta.hma(close, 8), "hma8")\nplot(ta.hma(close, 21), "hma21")\n',
  "6": '//@version=6\nindicator("t")\nplot(ta.hma(close, 8), "hma8")\nplot(ta.hma(close, 21), "hma21")\n',
};

describe.each(["4", "5", "6"])("hma sqrt length on TradingView, v%s", (v) => {
  it("matches TradingView for lengths 8 and 21", () => {
    const s = new Session();
    s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "1D", mintick: 0.01, type: "crypto", currency: "USDT",
      basecurrency: "BTC", timezone: "Etc/UTC", session: "24x7" });
    const c = s.compile(SCRIPTS[v]);
    expect(c.errors).toEqual([]);
    const r = s.runHistory(bars);
    expect(r.errors).toEqual([]);
    for (const name of ["hma8", "hma21"]) {
      const got = r.series.find((x: any) => x.title === name).data.map((p: any) => p?.value ?? NaN);
      const tv: number[] = fx.tv[v][name];
      // the first bars are warmup (length + floor(sqrt) - 1); compare the last 50
      for (let i = bars.length - 50; i < bars.length; i++) {
        expect(Math.abs(got[i] - tv[i]) / Math.abs(tv[i]), `${name} bar ${i}`).toBeLessThan(1e-9);
      }
    }
  });
});
