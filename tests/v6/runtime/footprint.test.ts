/**
 * `request.footprint()`, `footprint.*` and `volume_row.*` — v6, January 2026.
 *
 * The footprint below is small enough to check by hand. mintick 0.25 and
 * ticks_per_row 2 make each row 0.5 wide:
 *
 *     row          buy   sell   total
 *     [10.0,10.5)   10     40     50
 *     [10.5,11.0)   30     20     50
 *     [11.0,11.5)  120     30    150    ← POC
 *     [11.5,12.0)   20     30     50
 *
 * Total 300; the default 70% Value Area needs 210. From the POC (150) the
 * neighbours tie at 50, so the upper is taken (200), then the lower (250):
 * the Value Area runs [10.5, 12.0). Imbalances at 300%: row 3 buys 120
 * against the 20 sold below it (6×), and row 1 sells 40 against the 30
 * bought above it (1.3×, no).
 */
import { describe, it, expect } from "vitest";
import { compileScript } from "../../../transpiler/common";
import { compile, Context } from "../../../runtime/v6";
import { attempt } from "../../../test-utils/common/transpileAs";

const H6 = '//@version=6\nindicator("t")\n';
const LEVELS = [
  { price: 10.0, buy: 10, sell: 15 }, { price: 10.25, buy: 0, sell: 25 },
  { price: 10.5, buy: 30, sell: 20 },
  { price: 11.0, buy: 100, sell: 30 }, { price: 11.25, buy: 20, sell: 0 },
  { price: 11.5, buy: 20, sell: 30 },
];

function run(body: string, supply = true) {
  const { js, profile } = compileScript(H6 + body);
  const ctx = new Context(profile);
  ctx.mintick = 0.25;
  if (supply) ctx.provideFootprints([{ time: 0, levels: LEVELS }]);
  const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
  ctx.setBar(0, 10, 12, 10, 11, 300);
  exec();
  return (name: string) => ctx.vars.get(`opsv2_${name}`)?.valueOf();
}

describe("request.footprint", () => {
  it("totals the bar", () => {
    const read = run("fp = request.footprint(2)\na = fp.total_volume()\nb = fp.buy_volume()\nc = fp.sell_volume()\nd = fp.delta()\n");
    expect([read("a"), read("b"), read("c"), read("d")]).toEqual([300, 180, 120, 60]);
  });

  it("finds the POC and the Value Area", () => {
    const read = run(
      "footprint fp = request.footprint(2)\n" +
      "p = fp.poc().down_price()\nh = fp.vah().up_price()\nl = fp.val().down_price()\n");
    expect([read("p"), read("h"), read("l")]).toEqual([11, 12, 10.5]);
  });

  it("lists every row in ascending price, with imbalances", () => {
    const read = run(
      "fp = request.footprint(2)\narray<volume_row> rows = fp.rows()\n" +
      "n = rows.size()\nfirst = rows.get(0).down_price()\n" +
      "bi = rows.get(2).has_buy_imbalance()\nsi = rows.get(0).has_sell_imbalance()\n" +
      "rd = rows.get(2).delta()\n");
    expect([read("n"), read("first"), read("bi"), read("si"), read("rd")]).toEqual([4, 10, true, false, 90]);
  });

  it("is na on a bar the host has no footprint for", () => {
    const { js, profile } = compileScript(H6 + "fp = request.footprint(2)\nx = na(fp)\n");
    const ctx = new Context(profile);
    ctx.provideFootprints([{ time: 999, levels: LEVELS }]);
    const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
    ctx.setBar(0, 10, 12, 10, 11, 300);
    exec();
    expect(ctx.vars.get("opsv2_x")?.valueOf()).toBe(true);
  });

  it("is refused, with the fix, when the host supplied no footprints", () => {
    expect(() => run("fp = request.footprint(2)\n", false)).toThrow(/provideFootprints/);
  });

  it("allows only one call", () => {
    expect(() => run("a = request.footprint(2)\nb = request.footprint(4)\n")).toThrow(/only one request.footprint/);
  });

  it("refuses na as an id", () => {
    expect(() => run("footprint fp = na\nx = footprint.delta(fp)\n")).toThrow(/cannot be na/);
  });

  it("does not exist before v6", () => {
    expect(attempt(5, '//@version=5\nindicator("t")\nfp = request.footprint(2)\n').ok).toBe(false);
    expect(attempt(5, '//@version=5\nindicator("t")\nx = footprint.delta(na)\n').ok).toBe(false);
  });
});
