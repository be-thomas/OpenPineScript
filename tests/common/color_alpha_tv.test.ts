/**
 * Colour alpha, from TradingView captures (popular-author batch 2026-11-21, v6):
 * color.new's alpha is round(255 * (1 - t / 100)) in doubles, and
 * color.from_gradient truncates R, G, B and alpha alike in 0-255 space. An
 * endpoint with transparency 100 contributes no RGB.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../runtime/v1/session";

const bars = [0, 1].map((i) => ({ time: 1_700_000_000 + i * 3600, open: 1, high: 2, low: 0, close: 1, volume: 1 }));

function logs(v: string, body: string): string[] {
  const s = new Session();
  expect(s.compile(`//@version=${v}\nindicator("t")\nif barstate.islast\n${body}\nplot(close)\n`).errors).toEqual([]);
  const r: any = s.runHistory(bars);
  expect(r.errors).toEqual([]);
  return r.logs.map((l: any) => l.message);
}
const hex = (n: number) => n.toString(16).padStart(2, "0");

describe.each(["5", "6"])("colour alpha, v%s", (v) => {
  it("color.new alpha", () => {
    const cases: Array<[number, number]> = [[90, 25], [50, 128], [10, 230], [1, 252], [97, 8], [99, 3]];
    const out = logs(v, cases.map(([t]) => `    log.info(str.tostring(color.new(#112233, ${t})))`).join("\n"));
    expect(out.map((x) => x.toLowerCase())).toEqual(cases.map(([, a]) => `#112233${hex(a)}`));
  });

  it("color.rgb alpha is color.new's (probe t02)", () => {
    const out = logs(v, `    log.info(str.tostring(color.rgb(27, 183, 255, 90)))
    log.info(str.tostring(color.rgb(1, 2, 3, 50)))`);
    expect(out.map((x) => x.slice(-2).toLowerCase())).toEqual(["19", "80"]);
  });

  it("color.rgb truncates a fractional channel, as from_gradient does (capture n175)", () => {
    const out = logs(v, `    c = color.rgb(214 + 41 * 0.7, 200 + 28.6, 9.99, 0)
    log.info("{0} {1} {2}", color.r(c), color.g(c), color.b(c))`);
    expect(out[0]).toBe("242 228 9");
  });

  it("from_gradient truncates RGB and alpha", () => {
    const out = logs(v, `    c = color.from_gradient(0.9, 0, 1, #102030, #F0E0D0)
    log.info("{0} {1} {2}", color.r(c), color.g(c), color.b(c))
    for f in array.from(0.1, 0.5, 0.9)
        d = color.from_gradient(f, 0, 1, #FFFFFF, color.new(#FFFFFF, 100))
        log.info("a {0}", str.tostring(d))`);
    expect(out[0]).toBe("217 204 192");
    expect(out.slice(1).map((l) => l.slice(-2).toLowerCase())).toEqual(["e5", "7f", "19"]);
  });

  it("from_gradient mixes premultiplied colours (P2 colour-rounding capture)", () => {
    // Two opaque endpoints: 255 * (1 - 0.04) + 255 * 0.04 = 254.99999999999997, truncated to 254.
    // Unequal alphas: the RGB is weighted by alpha, not a straight lerp (R would be 83).
    const out = logs(v, `    a = color.from_gradient(0.04, 0, 1, #102030, #F0E0D0)
    b = color.from_gradient(0.3, 0, 1, #102030, color.new(#F0E0D0, 50))
    log.info(str.tostring(a))
    log.info("{0} {1} {2} {3}", color.r(b), color.g(b), color.b(b), str.tostring(b))`);
    expect(out[0].slice(-2).toLowerCase()).toBe("fe");
    expect(out[1].startsWith("55 65 76 ")).toBe(true);
    expect(out[1].slice(-2).toLowerCase()).toBe("d8");   // trunc(216.9) = 216
  });

  it("a transparent endpoint contributes no RGB, and a fully transparent result is (0, 0, 0, 0)", () => {
    const out = logs(v, `    a = color.from_gradient(0.5, 0, 1, color.new(#000000, 100), #FF8040)
    b = color.from_gradient(1, 0, 1, #FF8040, color.new(#000000, 100))
    log.info("{0} {1} {2} {3}", color.r(a), color.g(a), color.b(a), color.t(a))
    log.info("{0} {1} {2} {3}", color.r(b), color.g(b), color.b(b), color.t(b))`);
    expect(out[0]).toBe("255 128 64 50");   // alpha 127 -> transparency 50
    expect(out[1]).toBe("0 0 0 100");   // alpha 0: TradingView gives (0, 0, 0, 0)
  });
});

describe("input.color default alpha (probe u6), v6", () => {
  it("is 26 for transparency 90, where color.new gives 25: the gradients differ by one", () => {
    const out = logs("6", `    ci = input.color(color.new(#089981, 90))
    cr = color.new(#089981, 90)
    g1 = color.from_gradient(0.5, 0, 1, ci, color.red)
    g2 = color.from_gradient(0.5, 0, 1, cr, color.red)
    log.info("{0}|{1}|{2},{3},{4},{5}|{6},{7},{8},{9}", color.t(ci), color.t(cr), color.r(g1), color.g(g1), color.b(g1), color.t(g1), color.r(g2), color.g(g2), color.b(g2), color.t(g2))`);
    expect(out[0]).toBe("90|90|220,63,74,45|221,62,74,45");
  });
});
