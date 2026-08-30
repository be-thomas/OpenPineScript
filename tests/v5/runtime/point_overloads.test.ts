/**
 * The `chart.point` overloads of `line.new`, `box.new` and `label.new`.
 *
 * SOURCING. October 2023, alongside polylines. From the manual's Lines and
 * boxes page:
 *
 *     line.new(first_point, second_point, xloc, extend, color, style, width)
 *     box.new(top_left, bottom_right, border_color, border_width,
 *             border_style, extend, xloc, bgcolor, text, text_size, …)
 *
 * and from Text and shapes:
 *
 *     label.new(point, text, xloc, yloc, color, style, textcolor, size, …)
 *
 * with the rule for the x each takes: "The function copies the information
 * from these chart points to determine the line's coordinates. Whether it uses
 * the `index` or `time` fields from the `first_point` and `second_point` as
 * x-coordinates depends on the function's `xloc` value."
 *
 * ── The failure this closes ─────────────────────────────────────────────────
 *
 * Only the coordinate form existed, so `line.new(firstPoint, secondPoint)`
 * read a chart point where a number belongs. `Number({index, time, price})` is
 * NaN, and the line was created at (na, na)–(na, na). Nothing raised: a drawing
 * with na coordinates is legal Pine, and `line.get_price` on one legitimately
 * returns na — which is why this stayed invisible while 18 corpus files used
 * it. Over the first sixty bars of the sample dataset, 501 drawings were being
 * created with every coordinate na, across 13 of TradingView's own pages.
 *
 * `v5-language-loops-17` is what surfaced it. It averages the prices of its
 * active pivot lines, so a line it can never read a price from left
 * `avgActivePivot` na on every bar — on a page whose entire subject is that
 * line.
 *
 * ── Why the parameters carry no defaults ────────────────────────────────────
 *
 * Both overloads are one JavaScript function, because the registry holds one
 * signature per name and `Context.call` binds keyword arguments against it.
 * A keyword therefore lands in the slot its name has in the COORDINATE form,
 * and a positional argument lands where the caller put it — `drop` slots
 * earlier. Beyond the coordinates the two lists carry the same names in the
 * same order, so each parameter is read from its keyword slot first and its
 * positional slot second.
 *
 * A JavaScript parameter default fires on `undefined`, which is the value that
 * distinguishes those two cases, so declaring one breaks the resolution: with
 * `border_color: any = "#2196F3"`, `box.new(topLeft, bottomRight, upBorder, 3,
 * …)` saw a border colour nobody passed, concluded the keyword slot was taken,
 * and used the default width instead of the 3 it was given. The defaults are
 * applied in the body instead.
 */
import { describe, it, expect } from "vitest";
import { compileScript } from "../../../transpiler/common";
import { compile, Context } from "../../../runtime/v5";

const DAY = 86400000;

function run(body: string, bars = 3): Context {
  const { js, profile } = compileScript(`//@version=5\nindicator("t")\n${body}\n`);
  const ctx = new Context(profile);
  const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
  for (let i = 0; i < bars; i++) {
    ctx.setBar(i * DAY, 10, 12, 9, 11 + i, 100);
    exec();
    ctx.finalizeBar();
  }
  return ctx;
}

const drawings = (ctx: Context, kind: string) =>
  [...(ctx as any).drawings.values()].filter((d: any) => d.kind === kind);

const first = (ctx: Context, kind: string) => drawings(ctx, kind)[0].props;

const P = "a = chart.point.new(1, 100, 20.0)\nb = chart.point.new(4, 400, 25.0)\n";

describe("line.new(first_point, second_point)", () => {
  it("takes both coordinates from the points", () => {
    const p = first(run(P + "l = line.new(a, b)"), "line");
    expect([p.x1, p.y1, p.x2, p.y2]).toEqual([1, 20, 4, 25]);
  });

  it("...and they are NUMBERS, which is the whole defect", () => {
    const p = first(run(P + "l = line.new(a, b)"), "line");
    for (const k of ["x1", "y1", "x2", "y2"]) expect(Number.isNaN(p[k]), k).toBe(false);
  });

  it("keeps the coordinate form working alongside it", () => {
    const p = first(run("l = line.new(1, 20.0, 4, 25.0)"), "line");
    expect([p.x1, p.y1, p.x2, p.y2]).toEqual([1, 20, 4, 25]);
  });

  it("xloc.bar_time reads the points' TIME instead of their index", () => {
    const p = first(run(P + "l = line.new(a, b, xloc.bar_time)"), "line");
    expect([p.x1, p.x2]).toEqual([100, 400]);
    expect(p.xloc).toBe("bar_time");
  });

  it("a positional xloc and keyword arguments after it both bind", () => {
    // TradingView's own shape: `line.new(openPoint, closePoint, xloc.bar_time,
    // style = line.style_arrow_right, width = 3)`.
    const p = first(
      run(P + "l = line.new(a, b, xloc.bar_time, style = line.style_arrow_right, width = 3)"),
      "line");
    expect([p.xloc, p.style, p.width]).toEqual(["bar_time", "arrow_right", 3]);
  });

  it("keyword arguments alone bind, and the rest are the manual's defaults", () => {
    const p = first(run(P + "l = line.new(a, b, color = color.red, width = 2)"), "line");
    expect([p.color, p.width, p.xloc, p.extend, p.style])
      .toEqual(["#FF5252", 2, "bar_index", "none", "solid"]);
  });

  it("get_price reads back off a point-built line", () => {
    // The read that was na: `line.get_price` needs real x/y to interpolate.
    const ctx = run(P + "l = line.new(a, b)\nv = line.get_price(l, 2)\n");
    expect(ctx.vars.get("opsv2_v")?.valueOf()).toBeCloseTo(21.666666, 4);
  });
});

describe("box.new(top_left, bottom_right)", () => {
  it("top_left gives left and top, bottom_right gives right and bottom", () => {
    const p = first(run(P + "bx = box.new(a, b)"), "box");
    expect([p.left, p.top, p.right, p.bottom]).toEqual([1, 20, 4, 25]);
  });

  it("positional border arguments land on the border, not the coordinates", () => {
    // The case that exposed the defaults problem: four positional arguments in
    // the point form, then two keywords.
    const p = first(
      run(P + "bx = box.new(a, b, color.purple, 3, xloc = xloc.bar_time, bgcolor = color.red)"),
      "box");
    expect(p.border_color).toBe("#9C27B0");
    expect(p.border_width).toBe(3);
    expect(p.xloc).toBe("bar_time");
    expect(p.bgcolor).toBe("#FF5252");
    expect([p.left, p.right]).toEqual([100, 400]);
  });

  it("the coordinate form still applies every default", () => {
    const p = first(run("bx = box.new(1, 20.0, 4, 25.0)"), "box");
    expect([p.border_color, p.border_width, p.border_style, p.extend, p.xloc])
      .toEqual(["#2196F3", 1, "solid", "none", "bar_index"]);
    expect([p.text, p.text_size, p.text_halign]).toEqual(["", "auto", "center"]);
  });

  it("a text keyword reaches the text in the point form too", () => {
    const p = first(run(P + 'bx = box.new(a, b, text = "hi", text_color = color.red)'), "box");
    expect([p.text, p.text_color]).toEqual(["hi", "#FF5252"]);
  });
});

describe("label.new(point, text)", () => {
  it("one point supplies both coordinates", () => {
    const p = first(run(P + 'lb = label.new(a, "hi")'), "label");
    expect([p.x, p.y, p.text]).toEqual([1, 20, "hi"]);
  });

  it("its tail shifts by ONE, not two", () => {
    // `label.new(point, text, xloc, yloc, color, …)` — `style` is the 6th.
    const p = first(
      run(P + 'lb = label.new(a, "hi", xloc.bar_time, yloc.abovebar, color.red)'), "label");
    expect([p.x, p.xloc, p.yloc, p.color]).toEqual([100, "bar_time", "abovebar", "#FF5252"]);
  });

  it("keyword arguments bind past the shift", () => {
    const p = first(
      run(P + 'lb = label.new(a, "hi", style = label.style_circle, size = size.large)'), "label");
    expect([p.style, p.size, p.textcolor]).toEqual(["circle", "large", "#FFFFFF"]);
  });

  it("chart.point.now() is the usual argument, and carries this bar", () => {
    const p = first(run('lb = label.new(chart.point.now(high), "hi")', 3), "label");
    expect([p.x, p.y]).toEqual([0, 12]);
  });

  it("the coordinate form is untouched", () => {
    const p = first(run('lb = label.new(3, 42.0, "hi")'), "label");
    expect([p.x, p.y, p.text, p.style]).toEqual([3, 42, "hi", "label_down"]);
  });
});

describe("an na placeholder is still na", () => {
  it("the coordinate form with na coordinates draws nothing, deliberately", () => {
    // Three corpus scripts open a `var` drawing at na and set its coordinates
    // later. That must keep working: na is not a chart point.
    const p = first(run("var l = line.new(na, na, na, na, color = color.gray)"), "line");
    expect(Number.isNaN(p.x1)).toBe(true);
    expect(p.color).toBe("#9E9E9E");
  });
});
