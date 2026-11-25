/**
 * color.from_gradient with an `na` colour endpoint: the endpoint is the other
 * endpoint's RGB at transparency 100. TradingView capture, popular-author
 * batch 2026-11-21 (v6).
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../runtime/v1/session";

const bars = Array.from({ length: 2 }, (_, i) => ({
  time: 1_700_000_000 + i * 3600, open: 1, high: 2, low: 0, close: 1, volume: 1,
}));

describe.each(["5", "6"])("color.from_gradient with an na endpoint, v%s", (v) => {
  it("keeps the other endpoint's RGB and interpolates the transparency", () => {
    const s = new Session();
    const src = `//@version=${v}
indicator("t")
if barstate.islast
    a = color.from_gradient(0.1, 0, 1, na, color.new(#E66008, 30))
    b = color.from_gradient(0.9, 0, 1, color.new(#E66008, 30), na)
    log.info("a {0} {1} {2} {3}", color.r(a), color.g(a), color.b(a), color.t(a))
    log.info("b {0} {1} {2} {3}", color.r(b), color.g(b), color.b(b), color.t(b))
plot(close)
`;
    expect(s.compile(src).errors).toEqual([]);
    const r: any = s.runHistory(bars);
    expect(r.errors).toEqual([]);
    // 100 -> 30 at ratio 0.1 is 93; the mirror image at ratio 0.9 is 93 as well. The RGB goes
    // through the premultiplied mix (P2 colour-rounding capture): at f = 0.1 it lands a hair under
    // 230 / 96 / 8 and truncates one lower, at f = 0.9 it does not (hand-picked, not captured).
    expect(r.logs.map((l: any) => l.message)).toEqual(["a 229 95 7 93", "b 230 96 8 93"]);
  });
});
