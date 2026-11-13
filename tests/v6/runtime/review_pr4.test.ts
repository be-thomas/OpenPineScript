/**
 * Regressions for the items the PR #4 review recorded as already on main —
 * each as the reviewer reproduced it.
 */
import { describe, it, expect } from "vitest";
import { compileScript } from "../../../transpiler/common";
import { compile, Context } from "../../../runtime/v6";
import { build } from "../helpers";
import { build as build5 } from "../../v5/helpers";
import { buildFootprint } from "../../../runtime/v1/footprint";

const H6 = '//@version=6\nindicator("t")\n';

function strategy(body: string, bars = 4) {
  const { js, profile } = compileScript('//@version=6\nstrategy("t")\n' + body);
  const ctx = new Context(profile);
  const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
  for (let i = 0; i < bars; i++) { ctx.setBar(i * 86_400_000, 100, 101, 99, 100, 1); exec(); ctx.finalizeBar(); }
  return ctx;
}

const drawings = (b: ReturnType<typeof build>) => {
  b.ctx.setBar(0, 1, 1, 1, 1, 1); b.exec();
  return [...((b.ctx as any).drawings?.values?.() ?? [])].map((d: any) => d.props ?? d);
};

describe("1 — strategy.entry's tenth v6 argument is disable_alert", () => {
  it("does not become a fill price", () => {
    const ctx = strategy(
      'if bar_index == 0\n    strategy.entry("L", strategy.long, 1, na, na, "", strategy.oca.none, "c", "msg", false)\n');
    // Placed on bar 0, so it fills at the NEXT bar's open — 100, never 0.
    expect(ctx.position.size).toBe(1);
    expect(ctx.position.avgPrice).toBe(100);
  });

  it("and is recorded as an argument this engine does not honour", () => {
    const ctx = strategy(
      'if bar_index == 0\n    strategy.entry("L", strategy.long, 1, na, na, "", strategy.oca.none, "c", "msg", false)\n', 1);
    expect([...ctx.droppedArguments]).toContain("strategy.entry(disable_alert)");
  });
});

describe("3 — force_overlay precedes text_formatting", () => {
  it("a positional force_overlay is not bold text", () => {
    const d = drawings(build(H6 +
      'l = label.new(bar_index, close, "x", xloc.bar_index, yloc.price, color.blue, label.style_label_down, color.white, size.normal, text.align_center, "", font.family_default, true)\n'));
    expect(d[0].force_overlay).toBe(true);
    expect("text_formatting" in d[0]).toBe(false);
  });

  it("is a v5 parameter too", () => {
    const b = build5('//@version=5\nindicator("t")\nb = box.new(0, 2, 1, 0, force_overlay = true)\n');
    expect(drawings(b as any)[0].force_overlay).toBe(true);
  });
});

describe("4 — fill()'s v6 positional order", () => {
  it("the sixth is show_last, so fillgaps and display keep their own values", () => {
    const b = build(H6 + 'p1 = plot(close)\np2 = plot(open)\nfill(p1, p2, color.red, "f", true, 10, true, display.all)\n');
    b.ctx.setBar(0, 1, 1, 1, 1, 1); b.exec();
    // Nothing is dropped: show_last is honoured (tests/v5/runtime/fill_show_last.test.ts)
    // and the seventh and eighth land on fillgaps and display, not one slot early.
    expect([...b.ctx.droppedArguments]).toEqual([]);
    expect((b.ctx as any).fills.get("f")[0].showLast).toBe(10);
  });
});

describe("5 — footprint rows", () => {
  it("include the empty rows between traded prices", () => {
    const fp = buildFootprint([{ price: 10, buy: 5, sell: 5 }, { price: 13, buy: 5, sell: 5 }], 1, 70, 300)!;
    expect(fp.rows.map(r => r.down)).toEqual([10, 11, 12, 13]);
    expect(fp.rows.map(r => r.buy + r.sell)).toEqual([10, 0, 0, 10]);
  });

  it("are no imbalance against an empty opposite side", () => {
    const fp = buildFootprint([{ price: 10, buy: 5, sell: 0 }, { price: 11, buy: 9, sell: 1 }], 1, 70, 300)!;
    expect(fp.rows[1].buyImbalance).toBe(false);
  });
});
