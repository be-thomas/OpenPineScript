/**
 * v4 drawing objects — `line`, `label`, `box`, `table`.
 *
 * Drawings do not affect plotted values, so none of this is parity testing.
 * What it protects is that a script which DRAWS still runs: published v4
 * indicators label their signals constantly, and a script that dies on
 * `label.new` tells you nothing about whether its arithmetic is right.
 */
import { describe, it, expect } from "vitest";
import { compileScript } from "../../../transpiler";
import { compile, Context } from "../../../runtime/v4";

const HEAD = "//@version=4\nstudy(\"t\")\n";

function build(body: string, closes: number[] = [10, 11, 12]) {
  const { js, profile } = compileScript(HEAD + body);
  const ctx = new Context(profile);
  const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
  closes.forEach((c, i) => {
    ctx.setBar(i * 86400000, c, c, c, c, 100);
    exec();
    ctx.finalizeBar();
  });
  return ctx;
}

const value = (ctx: Context, name: string): any => ctx.vars.get("opsv2_" + name)?.valueOf();

describe("line", () => {
  it("new records a drawing per bar", () => {
    const ctx = build("l = line.new(0, 1.0, 5, 2.0)\n", [1, 2, 3]);
    expect(ctx.drawings.size).toBe(3);
    expect([...ctx.drawings.values()][0].kind).toBe("line");
  });

  it("get_* recalls what new set", () => {
    const ctx = build("l = line.new(3, 1.5, 8, 2.5)\nx = line.get_x2(l)\ny = line.get_y1(l)\n");
    expect(value(ctx, "x")).toBe(8);
    expect(value(ctx, "y")).toBe(1.5);
  });

  it("set_* mutates in place", () => {
    const ctx = build("l = line.new(0, 1.0, 5, 2.0)\nline.set_y2(l, 9.0)\ny = line.get_y2(l)\n");
    expect(value(ctx, "y")).toBe(9);
  });

  it("set_xy2 moves both coordinates", () => {
    const ctx = build("l = line.new(0, 1.0, 5, 2.0)\nline.set_xy2(l, 7, 3.0)\nx = line.get_x2(l)\ny = line.get_y2(l)\n");
    expect(value(ctx, "x")).toBe(7);
    expect(value(ctx, "y")).toBe(3);
  });

  it("get_price interpolates between the endpoints", () => {
    // (0,10) → (10,20), so bar 5 is 15.
    const ctx = build("l = line.new(0, 10.0, 10, 20.0)\np = line.get_price(l, 5)\n");
    expect(value(ctx, "p")).toBe(15);
  });

  it("get_price extrapolates past them — the trendline-projection idiom", () => {
    const ctx = build("l = line.new(0, 10.0, 10, 20.0)\np = line.get_price(l, 20)\n");
    expect(value(ctx, "p")).toBe(30);
  });

  it("a vertical line has no single price, so na", () => {
    const ctx = build("l = line.new(5, 10.0, 5, 20.0)\np = line.get_price(l, 5)\n");
    expect(Number.isNaN(value(ctx, "p"))).toBe(true);
  });

  it("delete removes it", () => {
    const ctx = build("l = line.new(0, 1.0, 5, 2.0)\nline.delete(l)\n", [1, 2, 3]);
    expect(ctx.drawings.size).toBe(0);
  });

  it("reading a deleted drawing is an error, not a silent na", () => {
    expect(() => build("l = line.new(0, 1.0, 5, 2.0)\nline.delete(l)\ny = line.get_y1(l)\n"))
      .toThrow(/no such drawing/);
  });
});

describe("label", () => {
  it("new + get_text", () => {
    const ctx = build("lb = label.new(bar_index, close, \"sig\")\nt = label.get_text(lb)\n");
    expect(value(ctx, "t")).toBe("sig");
  });

  it("set_text replaces it", () => {
    const ctx = build("lb = label.new(bar_index, close, \"a\")\nlabel.set_text(lb, \"b\")\nt = label.get_text(lb)\n");
    expect(value(ctx, "t")).toBe("b");
  });

  it("style constants are accepted as keyword arguments", () => {
    const ctx = build(
      "lb = label.new(bar_index, close, \"x\", style=label.style_label_up, " +
      "textcolor=color.white, size=size.small)\nx = label.get_x(lb)\n",
      [1, 2, 3],
    );
    expect(value(ctx, "x")).toBe(2);
  });

  it("set_xy moves both", () => {
    const ctx = build("lb = label.new(0, 1.0, \"x\")\nlabel.set_xy(lb, 4, 8.0)\nx = label.get_x(lb)\ny = label.get_y(lb)\n");
    expect(value(ctx, "x")).toBe(4);
    expect(value(ctx, "y")).toBe(8);
  });
});

describe("box and table", () => {
  it("box new + get + set", () => {
    const ctx = build("b = box.new(0, 20.0, 5, 10.0)\nbox.set_top(b, 25.0)\nt = box.get_top(b)\nl = box.get_left(b)\n");
    expect(value(ctx, "t")).toBe(25);
    expect(value(ctx, "l")).toBe(0);
  });

  it("table cells are stored sparsely", () => {
    const ctx = build(
      "var t = table.new(position.top_right, 2, 2)\n" +
      "table.cell(t, 0, 0, \"hi\")\n",
      [1, 2, 3],
    );
    const table = [...ctx.drawings.values()].find(d => d.kind === "table")!;
    expect(table.props.cells.size).toBe(1);
    expect(table.props.cells.get("0,0").text).toBe("hi");
  });

  it("`var` keeps ONE table rather than one per bar", () => {
    const ctx = build("var t = table.new(position.top_right, 2, 2)\n", [1, 2, 3, 4]);
    expect(ctx.drawings.size).toBe(1);
  });
});

describe("placement constants", () => {
  it("xloc / yloc / extend resolve", () => {
    const ctx = build(
      "l = line.new(0, 1.0, 5, 2.0, xloc=xloc.bar_index, extend=extend.right)\n" +
      "lb = label.new(0, 1.0, \"x\", yloc=yloc.abovebar)\n" +
      "y = line.get_y2(l)\n",
    );
    expect(value(ctx, "y")).toBe(2);
  });
});

describe("the drawing namespaces are v4+ only", () => {
  for (const [ns, body] of [
    ["line", "l = line.new(0, 1.0, 5, 2.0)"],
    ["label", "lb = label.new(n, close, \"x\")"],
    ["box", "b = box.new(0, 1.0, 2, 0.0)"],
    ["table", "t = table.new(position.top_right, 1, 1)"],
  ] as Array<[string, string]>) {
    it(`v3 refuses ${ns}.*`, () => {
      expect(() => compileScript(`//@version=3\nstudy("t")\n${body}\n`))
        .toThrow(new RegExp(`'${ns}\\.new' is not available in Pine Script v3`));
    });
  }

  it("but v3 keeps the flat `line` PLOT STYLE of the same spelling", () => {
    // The words collide and the versions mean different things by them. v3's
    // `line` is a plot style; v4's is a drawing type.
    expect(() => compileScript("//@version=3\nstudy(\"t\")\nplot(close, style=line)\n"))
      .not.toThrow();
  });
});
