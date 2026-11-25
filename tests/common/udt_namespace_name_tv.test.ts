/**
 * A user type named like a built-in namespace (`type str`) answers `str.new`
 * and `str.copy`, and does not hide the namespace's built-ins. TradingView
 * capture, popular-author batch 2026-11-21 (v6); same rule at v5.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../runtime/v1/session";

const bars = Array.from({ length: 2 }, (_, i) => ({
  time: 1_700_000_000 + i * 3600, open: 1, high: 2, low: 0, close: 1, volume: 1,
}));

describe.each(["5", "6"])("type str beside the str namespace, v%s", (v) => {
  it("str.tostring is the built-in, str.new builds the type", () => {
    const s = new Session();
    const src = `//@version=${v}
indicator("t")
type str
    string s
x = str.new("hi")
y = x.copy()
t = str.tostring(12.5)
if barstate.islast
    log.info("{0}|{1}|{2}|{3}", t, x.s, y.s, str.length(t))
plot(close)
`;
    expect(s.compile(src).errors).toEqual([]);
    const r: any = s.runHistory(bars);
    expect(r.errors).toEqual([]);
    expect(r.logs.map((l: any) => l.message)).toEqual(["12.5|hi|hi|4"]);
  });
});
