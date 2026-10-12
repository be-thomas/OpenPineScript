/**
 * v5 `chart.point`, `polyline.*` and `linefill.*`.
 *
 * SOURCING. Polylines and `chart.point` are October 2023: "polylines were
 * introduced as drawings that sequentially connect the coordinates from an
 * array of up to 10,000 chart points using straight or curved line segments",
 * and "chart.point.new() was added ... creates a new chart.point object with
 * the specified time, index, and price". `polyline.new`'s full signature and
 * every default is quoted at the head of runtime/v1/stdlib/drawings.ts.
 *
 * ── What is asserted, and what cannot be ────────────────────────────────────
 *
 * Nothing here draws. A drawing is recorded on the Context and never rendered,
 * so these tests check the RECORD: that a point carries the three coordinates
 * it was given, that a polyline holds its own copy of them, and that the
 * defaults are the manual's. A script that draws has to RUN — that is the whole
 * value — and before this a `polyline.new` call refused to compile at all.
 */
import { describe, it, expect } from "vitest";
import { transpile, compileScript } from "../../../transpiler/common";
import { compile, Context } from "../../../runtime/v5";

function run(body: string, bars = 1): Context {
  const { js, profile } = compileScript(`//@version=5\nindicator("t")\n${body}\n`);
  const ctx = new Context(profile);
  const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
  for (let i = 0; i < bars; i++) {
    ctx.setBar(i * 86400000, 10, 12, 9, 11 + i, 100);
    exec();
    ctx.finalizeBar();
  }
  return ctx;
}

const drawingsOf = (ctx: Context, kind: string) =>
  [...(ctx as any).drawings.values()].filter((d: any) => d.kind === kind);

describe("chart.point", () => {
  it("new() takes index, time and price", () => {
    const ctx = run("p = chart.point.new(7, 1234, 55.5)\npl = polyline.new(array.from(p))");
    expect(drawingsOf(ctx, "polyline")[0].props.points[0])
      .toEqual({ index: 7, time: 1234, price: 55.5 });
  });

  it("now() takes the CURRENT bar's index and time", () => {
    const ctx = run("p = chart.point.now(close)\npl = polyline.new(array.from(p))", 3);
    const points = drawingsOf(ctx, "polyline").pop()!.props.points;
    expect(points[0]).toEqual({ index: 2, time: 2 * 86400000, price: 13 });
  });

  it("from_index() leaves time na, from_time() leaves index na", () => {
    const ctx = run(
      "a = chart.point.from_index(3, 10.0)\n" +
      "b = chart.point.from_time(999, 20.0)\n" +
      "pl = polyline.new(array.from(a, b))",
    );
    const [a, b] = drawingsOf(ctx, "polyline")[0].props.points;
    expect(a.index).toBe(3);
    expect(Number.isNaN(a.time)).toBe(true);
    expect(Number.isNaN(b.index)).toBe(true);
    expect(b.time).toBe(999);
  });

  it("copy() produces an equal but separate point", () => {
    const ctx = run(
      "a = chart.point.new(1, 2, 3.0)\n" +
      "b = chart.point.copy(a)\n" +
      "pl = polyline.new(array.from(a, b))",
    );
    const [a, b] = drawingsOf(ctx, "polyline")[0].props.points;
    expect(b).toEqual(a);
  });

  it("its fields are readable from the script", () => {
    const ctx = run("p = chart.point.new(7, 1234, 55.5)\nx = p.price\n");
    expect(ctx.vars.get("opsv2_x")?.valueOf()).toBe(55.5);
  });
});

describe("polyline.new", () => {
  it("records the points it was given", () => {
    const ctx = run(
      "pts = array.from(chart.point.from_index(0, 1.0), chart.point.from_index(1, 2.0))\n" +
      "pl = polyline.new(pts)",
    );
    expect(drawingsOf(ctx, "polyline")[0].props.points.map((p: any) => p.price)).toEqual([1, 2]);
  });

  it("holds its OWN copy — pushing to the array afterwards does not move it", () => {
    // A Pine polyline takes its coordinates at construction. Sharing the live
    // array would make a later `array.push` silently redraw it.
    const ctx = run(
      "pts = array.from(chart.point.from_index(0, 1.0))\n" +
      "pl = polyline.new(pts)\n" +
      "array.push(pts, chart.point.from_index(1, 2.0))",
    );
    expect(drawingsOf(ctx, "polyline")[0].props.points.length).toBe(1);
  });

  it("applies the manual's defaults", () => {
    const ctx = run("pl = polyline.new(array.new<chart.point>())");
    const p = drawingsOf(ctx, "polyline")[0].props;
    expect(p.curved).toBe(false);
    expect(p.closed).toBe(false);
    expect(p.xloc).toBe("bar_index");
    expect(p.line_width).toBe(1);
  });

  it("takes its keyword arguments", () => {
    const ctx = run(
      "pl = polyline.new(array.new<chart.point>(), curved = true, closed = true, line_width = 3)",
    );
    const p = drawingsOf(ctx, "polyline")[0].props;
    expect([p.curved, p.closed, p.line_width]).toEqual([true, true, 3]);
  });

  it("refuses a non-array rather than drawing nothing", () => {
    expect(() => run("pl = polyline.new(close)")).toThrow(/points must be an array/);
  });
});

describe("polyline.delete and polyline.all", () => {
  it("all lists the live polylines in creation order", () => {
    const ctx = run(
      "var pts = array.new<chart.point>()\n" +
      "a = polyline.new(pts)\n" +
      "b = polyline.new(pts)\n" +
      "n = array.size(polyline.all)\n",
    );
    expect(ctx.vars.get("opsv2_n")?.valueOf()).toBe(2);
  });

  it("delete removes one", () => {
    const ctx = run(
      "var pts = array.new<chart.point>()\n" +
      "a = polyline.new(pts)\n" +
      "b = polyline.new(pts)\n" +
      "polyline.delete(a)\n" +
      "n = array.size(polyline.all)\n",
    );
    expect(ctx.vars.get("opsv2_n")?.valueOf()).toBe(1);
  });
});

describe("linefill", () => {
  it("references the two lines rather than copying their coordinates", () => {
    const ctx = run(
      "l1 = line.new(0, 1, 1, 2)\n" +
      "l2 = line.new(0, 3, 1, 4)\n" +
      "f = linefill.new(l1, l2, color.blue)\n" +
      "a = linefill.get_line1(f)\n",
    );
    const fill = drawingsOf(ctx, "linefill")[0];
    expect(fill.props.line1).toBe(ctx.vars.get("opsv2_l1")?.valueOf());
    expect(ctx.vars.get("opsv2_a")?.valueOf()).toBe(fill.props.line1);
  });

  it("set_color changes the record", () => {
    const ctx = run(
      "l1 = line.new(0, 1, 1, 2)\n" +
      "l2 = line.new(0, 3, 1, 4)\n" +
      "f = linefill.new(l1, l2, color.blue)\n" +
      "linefill.set_color(f, color.red)\n",
    );
    expect(drawingsOf(ctx, "linefill")[0].props.color).toBe("#FF5252");
  });
});

describe("all three are v5 additions", () => {
  const CASES: Array<[string, string]> = [
    // No `<chart.point>` type argument: those are v5 grammar, and a parse
    // error at v4 would hide the version verdict this case is about.
    ["polyline", "pl = polyline.new(close)"],
    ["linefill", "f = linefill.new(line.new(0,0,1,1), line.new(0,1,1,2), color.blue)"],
  ];

  for (const [name, body] of CASES) {
    it(`${name}.* is refused at v4`, () => {
      // "added in a later version", not "not a namespace": the root IS known to
      // the runtime union, so the emitter can say which version it belongs to.
      expect(() => transpile(`//@version=4\nstudy("t")\n${body}\n`))
        .toThrow(new RegExp(`'${name}\\.[a-z_]+' is not available in Pine Script v4`));
    });
  }
});
