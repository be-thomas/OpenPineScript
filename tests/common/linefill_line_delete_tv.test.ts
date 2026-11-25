/**
 * Deleting a line deletes every linefill attached to it. TradingView capture,
 * popular-author batch 2026-11-21 (v6); linefills exist from v5.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../runtime/v1/session";

const bars = Array.from({ length: 3 }, (_, i) => ({
  time: 1_700_000_000 + i * 3600, open: 1, high: 2, low: 0, close: 1, volume: 1,
}));

describe.each(["5", "6"])("line.delete and linefills, v%s", (v) => {
  it("removes every linefill attached to the line, and no other", () => {
    const s = new Session();
    const src = `//@version=${v}
indicator("t", overlay = true)
if barstate.islast
    l1 = line.new(0, 1, 1, 1)
    l2 = line.new(0, 2, 1, 2)
    l3 = line.new(0, 3, 1, 3)
    linefill.new(l1, l2, color.red)
    linefill.new(l3, l1, color.blue)
    linefill.new(l2, l3, color.green)
    log.info("before {0}", linefill.all.size())
    line.delete(l1)
    log.info("after {0} {1}", linefill.all.size(), line.all.size())
plot(close)
`;
    expect(s.compile(src).errors).toEqual([]);
    const r: any = s.runHistory(bars);
    expect(r.errors).toEqual([]);
    expect(r.logs.map((l: any) => l.message)).toEqual(["before 3", "after 1 2"]);
    expect(r.drawings.filter((d: any) => d.kind === "linefill").length).toBe(1);
  });
});
