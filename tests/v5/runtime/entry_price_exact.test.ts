/**
 * A closed trade's `entryPrice` is the entry's own fill price, exactly. The
 * tick rounding `round(p / 0.01) * 0.01` turns 92.85 into 92.85000000000001,
 * and per-entry trade records carried that noise into the trade.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const bars = Array.from({ length: 30 }, (_, i) => ({
  time: Date.UTC(2024, 0, 1) + i * 86_400_000,
  open: i === 6 ? 92.85 : 100 + i, high: 120 + i, low: 80, close: i === 6 ? 92.85 : 100 + i, volume: 1,
}));

describe("entryPrice", () => {
  for (const version of [1, 4, 5, 6] as const) {
    it(`v${version}: is 92.85, not 92.85000000000001`, () => {
      const s = new Session();
      s.setChart({ symbol: "T:X", timeframe: "D", mintick: 0.01, type: "crypto", currency: "USD", timezone: "Etc/UTC" } as any);
      const long = version === 1 || version === 4 ? "true" : "strategy.long";
      const header = version === 1 ? "" : "strategy(\"S\")\n";
      const n = version === 1 ? "n" : "bar_index";
      const c = s.compile(`//@version=${version}\n${header}if ${n} == 5\n    strategy.entry("L", ${long}, 100)\nif ${n} == 10\n    strategy.close("L")\n`);
      expect(c.errors).toEqual([]);
      // Entry placed on bar 5 fills at bar 6's open, 92.85.
      const r = s.runHistory(bars);
      expect(r.trades).toHaveLength(1);
      expect(r.trades[0].entryPrice).toBe(92.85);
    });
  }
});
