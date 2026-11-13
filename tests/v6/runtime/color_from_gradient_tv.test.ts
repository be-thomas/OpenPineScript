/**
 * color.from_gradient channel rounding, from TradingView Pine Logs (v6,
 * BINANCE:BTCUSDT 1h):
 *   dev-docs/tv-parity/_probes/color-gradient/20261110-030230_BINANCE_BTCUSDT_1h/pine_logs.json
 * R, G, B truncate (255 * 0.25 = 63.75 -> 63); transparency is interpolated in
 * 0-100 space and rounded (70 * 0.25 = 17.5 -> 18).
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const SRC = `//@version=6
indicator("gradient probe")
if barstate.islast
    for x in array.from(0.1, 0.25, 0.33, 0.5, 0.643, 0.9)
        c = color.from_gradient(x, 0, 1, #000000, #ff1100)
        c2 = color.from_gradient(x, 0, 1, color.new(#000000, 0), color.new(#ff1100, 70))
        log.info("x={0} r={1} g={2} b={3} t={4} | t2={5}", x, color.r(c), color.g(c), color.b(c), color.t(c), color.t(c2))
plot(close)
`;

const bars = Array.from({ length: 3 }, (_, i) => ({
  time: 1_700_000_000 + i * 3600, open: 100, high: 101, low: 99, close: 100, volume: 1,
}));

describe("color.from_gradient matches TradingView's channel rounding", () => {
  it("logs the six probe lines verbatim", () => {
    const s = new Session();
    expect(s.compile(SRC).errors).toEqual([]);
    const r: any = s.runHistory(bars);
    expect(r.errors).toEqual([]);
    expect(r.logs.map((l: any) => l.message)).toEqual([
      "x=0.1 r=25 g=1 b=0 t=0 | t2=7",
      "x=0.25 r=63 g=4 b=0 t=0 | t2=18",
      "x=0.33 r=84 g=5 b=0 t=0 | t2=23",
      "x=0.5 r=127 g=8 b=0 t=0 | t2=35",
      "x=0.643 r=163 g=10 b=0 t=0 | t2=45",
      "x=0.9 r=229 g=15 b=0 t=0 | t2=63",
    ]);
  });
});

// v5 was probed too (dev-docs/tv-parity/_probes/version-scope/v5-color-gradient: identical lines).
// v4 was not: it keeps the per-channel rounding (255 * 0.25 = 63.75 -> 64).
describe("color.from_gradient by version", () => {
  const first = (src: string) => {
    const s = new Session();
    expect(s.compile(src).errors).toEqual([]);
    const r: any = s.runHistory(bars);
    expect(r.errors).toEqual([]);
    return r.logs?.length ? r.logs[0].message : r.series[0].data.at(-1).value;
  };
  it("v5 truncates like v6", () => {
    expect(first(SRC.replace("version=6", "version=5")))
      .toBe("x=0.1 r=25 g=1 b=0 t=0 | t2=7");
    expect(first(`//@version=5\nindicator("g")\nplot(color.r(color.from_gradient(0.25, 0, 1, #000000, #ff1100)))`)).toBe(63);
  });
  it("v4 keeps rounding", () => {
    expect(first(`//@version=4\nstudy("g")\nplot(color.r(color.from_gradient(0.25, 0, 1, #000000, #ff1100)))`)).toBe(64);
  });
});
