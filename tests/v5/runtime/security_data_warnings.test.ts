/**
 * The warning that a request had no data behind it is for data a host can
 * supply, once per context.
 *
 *   - "D" and "1D" are one timeframe: one warning, and data supplied under
 *     either answers both.
 *   - `ticker.heikinashi(syminfo.tickerid)` on the chart's own timeframe is the
 *     chart's own bars, transformed; there is nothing for a host to supply.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const bars = Array.from({ length: 40 }, (_, i) => ({
  time: Date.UTC(2024, 0, 1) + i * 86_400_000, open: 1 + i, high: 2 + i, low: 0.5 + i, close: i + 1, volume: 1,
}));

function run(body: string, provide?: (s: Session) => void) {
  const s = new Session();
  s.setChart({ symbol: "X:Y", timeframe: "1D" });
  const c = s.compile(`//@version=5\nindicator("t")\n${body}\n`);
  expect(c.errors).toEqual([]);
  provide?.(s);
  return s.runHistory(bars) as any;
}
const col = (r: any, title: string) => r.series.find((x: any) => x.title === title).data.map((d: any) => d?.value ?? null);

describe("timeframe spellings", () => {
  it("D and 1D are one warning", () => {
    const r = run('plot(request.security("OTHER", "D", close))\nplot(request.security("OTHER", "1D", close))');
    expect(r.warnings).toHaveLength(1);
    expect(r.warnings[0]).toContain("OTHER at timeframe D");
  });

  it("data supplied as 1D answers a request for D", () => {
    const other = bars.map((b) => ({ ...b, close: b.close * 10 }));
    const r = run('plot(request.security("OTHER", "D", close), "o")', (s) => s.provideData("OTHER", "1D", other));
    expect(r.warnings).toEqual([]);
    expect(col(r, "o")[39]).not.toBeNull();
  });
});

describe("a Heikin-Ashi request on the chart's own symbol and timeframe", () => {
  it("is served from the chart's bars, with no warning", () => {
    const r = run('plot(request.security(ticker.heikinashi(syminfo.tickerid), "D", close), "ha")');
    expect(r.warnings).toEqual([]);
    // haClose = (O + H + L + C) / 4, with no lag: this is the chart's own bar.
    const want = bars.map((b) => (b.open + b.high + b.low + b.close) / 4);
    expect(col(r, "ha")).toEqual(want);
  });

  it("its open is the recursive (previous haOpen + previous haClose) / 2", () => {
    const r = run('plot(request.security(ticker.heikinashi(syminfo.tickerid), "D", open), "hao")');
    expect(r.warnings).toEqual([]);
    const want: number[] = [];
    let po = NaN, pc = NaN;
    for (const b of bars) {
      const o = Number.isFinite(po) ? (po + pc) / 2 : (b.open + b.close) / 2;
      want.push(o);
      po = o; pc = (b.open + b.high + b.low + b.close) / 4;
    }
    expect(col(r, "hao")).toEqual(want);
  });
});
