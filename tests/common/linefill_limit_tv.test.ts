/**
 * The linefill limit follows max_lines_count (default 50), with the same slack of 5
 * the other drawings have. TradingView capture, popular-author batch 2026-11-21
 * (v6, max_lines_count = 500): 1225 created, the count saws between 500 and 505;
 * probes t09 (max_lines_count = 100) and t10 (not declared: 50).
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../runtime/v1/session";

const bars = [0, 1].map((i) => ({ time: 1_700_000_000 + i * 3600, open: 1, high: 2, low: 0, close: 1, volume: 1 }));

function sizeAfter(v: string, count: number, decl = "overlay = true"): number {
  const s = new Session();
  const src = `//@version=${v}
indicator("t", ${decl})
if barstate.islast
    var array<line> ls = array.new<line>()
    for i = 0 to 39
        ls.push(line.new(0, i, 1, i))
    for k = 0 to ${count - 1}
        linefill.new(ls.get(k % 40), ls.get((k + 1) % 40), color.red)
    log.info("n={0}", linefill.all.size())
plot(close)
`;
  expect(s.compile(src).errors).toEqual([]);
  const r: any = s.runHistory(bars);
  expect(r.errors).toEqual([]);
  return Number(/n=(\d+)/.exec(r.logs.at(-1).message)![1]);
}

describe.each(["5", "6"])("linefill limit, v%s", (v) => {
  it("keeps 500 to 505 of 600 with max_lines_count = 500", () => {
    const n = sizeAfter(v, 600, "overlay = true, max_lines_count = 500");
    expect(n).toBeGreaterThanOrEqual(500);
    expect(n).toBeLessThanOrEqual(505);
  });
  it("keeps all 240 with max_lines_count = 500", () => {
    expect(sizeAfter(v, 240, "overlay = true, max_lines_count = 500")).toBe(240);
  });
  it("follows max_lines_count = 100", () => {
    const n = sizeAfter(v, 300, "overlay = true, max_lines_count = 100");
    expect(n).toBeGreaterThanOrEqual(100);
    expect(n).toBeLessThanOrEqual(105);
  });
  it("is 50 when max_lines_count is not declared", () => {
    const n = sizeAfter(v, 300);
    expect(n).toBeGreaterThanOrEqual(50);
    expect(n).toBeLessThanOrEqual(55);
  });
});
