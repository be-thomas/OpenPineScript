/**
 * The DRAWING type casts — `line()`, `linefill()`, `label()`, `box()`,
 * `table()`.
 *
 * SOURCING. The manual's type-system page names all ten casting functions in
 * one list: "int(), float(), bool(), color(), string(), line(), linefill(),
 * label(), box(), and table()", and gives these five their purpose in the
 * sentence that follows — "Explicit type casting is also handy when declaring
 * variables assigned to na", with `label myLabel = na` and
 * `myLabel = label(na)` shown as two spellings of the same thing.
 *
 * So a drawing cast is an IDENTITY whose only job is to say which type an `na`
 * is. TradingView's `v5-writing-profiling-and-optimization-34` and
 * `v5-faq-data-structures-08` both call `box(na)` / `line(na)` to type an
 * array's elements, and died with "The provided reference is not a function":
 * `box` resolved to the NAMESPACE object, which is not callable.
 *
 * ── The collision this had to survive ───────────────────────────────────────
 *
 * `line`, `label`, `box` and `table` are already namespace roots, and `line` is
 * the v1–v3 plot-style constant on top of that. One flat registry key cannot be
 * three things, so the casts are generated under `cast.*` — a name no script
 * may write — and installed under their flat names in the view of each version
 * whose type they name.
 */
import { describe, it, expect } from "vitest";
import { compileScript, transpile } from "../../../transpiler/common";
import { compile, Context } from "../../../runtime/v5";

function run(src: string, name: string): any {
  const { js, profile } = compileScript(src);
  const ctx = new Context(profile);
  const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
  ctx.setBar(0, 10, 12, 9, 11, 100);
  exec();
  return { ctx, value: ctx.vars.get("opsv2_" + name)?.valueOf() };
}

const V4 = '//@version=4\nstudy("t")\n';
const V5 = '//@version=5\nindicator("t")\n';

describe("casting na to a drawing type", () => {
  for (const kind of ["line", "label", "box", "table"]) {
    it(`${kind}(na) is na, at v4`, () => {
      expect(Number.isNaN(run(`${V4}x = ${kind}(na)\n`, "x").value)).toBe(true);
    });
  }

  it("linefill(na) is v5, where the type is", () => {
    expect(Number.isNaN(run(`${V5}x = linefill(na)\n`, "x").value)).toBe(true);
  });

  it("the array-of-typed-na case that found it", () => {
    // `array.push(boxes, box(na))` — the cast is what types the element.
    const src = V5 +
      "var array<box> boxes = array.new<box>()\n" +
      "array.push(boxes, box(na))\n" +
      "n = array.size(boxes)\n";
    expect(run(src, "n").value).toBe(1);
  });
});

describe("a cast passes a real drawing through", () => {
  it("line(l) is l", () => {
    const src = V5 + "l = line.new(0, 0.0, 1, 1.0)\nx = line(l)\ny = line.get_y2(x)\n";
    expect(run(src, "y").value).toBe(1);
  });
});

describe("the namespace still works alongside the function", () => {
  it("line.new after line() is defined", () => {
    const src = V5 + "ignored = line(na)\nl = line.new(0, 0.0, 1, 2.0)\nx = line.get_y2(l)\n";
    expect(run(src, "x").value).toBe(2);
  });

  it("box.all is still an array", () => {
    const src = V5 + "ignored = box(na)\nb = box.new(0, 1.0, 1, 0.0)\nn = array.size(box.all)\n";
    expect(run(src, "n").value).toBe(1);
  });

  it("label.style_* is still a constant", () => {
    const src = V5 + "ignored = label(na)\nx = label.style_none\n";
    expect(run(src, "x").value).toBe("none");
  });
});

describe("version gating follows the TYPE", () => {
  it("v3 has no drawing types, so no drawing casts", () => {
    expect(() => transpile('//@version=3\nstudy("t")\nx = label(na)\n')).toThrow();
  });

  it("linefill() is refused at v4, where linefill is not a type yet", () => {
    expect(() => transpile(`${V4}x = linefill(na)\n`)).toThrow();
  });
});
