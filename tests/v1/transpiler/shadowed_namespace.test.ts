/**
 * A namespace whose ROOT the script also binds.
 *
 *     extend = extendLines ? extend.right : extend.none
 *
 * is ordinary Pine — TradingView resolves the dotted form against the namespace
 * and the bare form against the variable — and it is TradingView's own
 * `v4-essential-drawings-14`. It emitted
 *
 *     let opsv2_extend = ctx.new_var("opsv2_extend",
 *       … ? opsv2_extend.opsv2_right : opsv2_extend.opsv2_none)
 *
 * where `opsv2_extend` on the right is the `let` being declared, not the
 * namespace object in the sandbox: "Cannot access 'opsv2_extend' before
 * initialization", on the first bar, from a script that is correct.
 *
 * A parameter DEFAULT has the same shape — `string position =
 * position.middle_center` in `v5-language-matrices-15` — and neither is exotic:
 * `extend`, `position`, `order` and `earnings` all read naturally as variable
 * names.
 *
 * The fix reads such a namespace through `ctx.builtin`, which goes to the
 * registry directly, so nothing in the script's scope can stand in front of it.
 */
import { describe, it, expect } from "vitest";
import { compileScript } from "../../../transpiler/common";
import { compile, Context } from "../../../runtime/v5";

function run(src: string, name: string): any {
  const { js, profile } = compileScript(src);
  const ctx = new Context(profile);
  const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
  ctx.setBar(0, 10, 12, 9, 11, 100);
  exec();
  return ctx.vars.get("opsv2_" + name)?.valueOf();
}

const V4 = '//@version=4\nstudy("t")\n';
const V5 = '//@version=5\nindicator("t")\n';

describe("a variable named after a namespace", () => {
  it("initialised FROM that namespace", () => {
    expect(run(V4 + "extend = true ? extend.right : extend.none\nx = extend\n", "x"))
      .toBe("right");
  });

  it("the bare name still reads the variable afterwards", () => {
    expect(run(V4 + "extend = extend.both\ny = extend\nx = y\n", "x")).toBe("both");
  });

  it("a v5 namespace too", () => {
    expect(run(V5 + "position = position.middle_center\nx = position\n", "x"))
      .toBe("middle_center");
  });

  it("the emitted read does not go through the shadowed binding", () => {
    const { js } = compileScript(V4 + "extend = extend.right\n");
    expect(js).toContain('ctx.builtin("extend.right")');
    expect(js).not.toContain("opsv2_extend.opsv2_right");
  });
});

describe("a PARAMETER named after a namespace", () => {
  it("a default may read the namespace it shadows", () => {
    const src = V5 +
      "f(string position = position.middle_center) =>\n    position\n" +
      "x = f()\n";
    expect(run(src, "x")).toBe("middle_center");
  });

  it("...and an argument still wins over the default", () => {
    const src = V5 +
      "f(string position = position.middle_center) =>\n    position\n" +
      'x = f("top_left")\n';
    expect(run(src, "x")).toBe("top_left");
  });
});

describe("an unshadowed namespace is untouched", () => {
  it("still reads through the sandbox object", () => {
    const { js } = compileScript(V5 + "x = color.red\n");
    expect(js).toContain("opsv2_color.opsv2_red");
  });

  it("and an unknown member of one is still an error", () => {
    expect(() => compileScript(V5 + "extend = extend.nonesuch\n"))
      .toThrow(/'extend' has no member 'nonesuch'/);
  });
});
