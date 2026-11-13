/**
 * `Session.compile` runs the script for one bar to discover its inputs and
 * declaration. An error THROWN by that bar is the script's, at run time, and
 * was reported with phase "transpile" — so a host showed "compile error" for
 * `array.get(a, 5)` on a two-element array. Same shape, same line and column
 * as a `runHistory` error; only `phase` differs from before.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

describe("an error on the compile dry run", () => {
  it("is phase runtime, with its line, when the script fails on the first bar", () => {
    const c = new Session().compile([
      '//@version=5',                        // 1
      'indicator("t")',                      // 2
      'a = array.from(1.0, 2.0)',            // 3
      'y = array.get(a, 5)',                 // 4  <- fails on the dry bar
      'plot(y)',                             // 5
    ].join("\n"));
    expect(c.meta).toBeNull();
    expect(c.errors).toHaveLength(1);
    expect(c.errors[0]).toMatchObject({
      phase: "runtime", line: 4, col: 4, severity: "error",
      message: "In 'array.get()' function. Index 5 is out of bounds, array size is 2.",
    });
    expect(() => structuredClone(c)).not.toThrow();
  });

  it("stays phase transpile for an error the transpiler raises", () => {
    const c = new Session().compile('//@version=5\nindicator("t")\nplot(nosuchthing)\n');
    expect(c.errors[0].phase).toBe("transpile");
  });

  it("is phase transpile when it is about the script: a built-in this engine does not implement", () => {
    const c = new Session().compile('//@version=5\nindicator("x")\nplot(ta.accdist)\n');
    expect(c.errors).toHaveLength(1);
    expect(c.errors[0]).toMatchObject({ phase: "transpile", severity: "error" });
    expect(c.errors[0].message).toMatch(/'ta\.accdist' is a Pine built-in that this engine does not implement/);
  });

  it("is phase transpile for a name the version bans: bar_index in v1", () => {
    const c = new Session().compile('//@version=1\nstudy("x")\nplot(bar_index)\n');
    expect(c.errors).toHaveLength(1);
    expect(c.errors[0]).toMatchObject({ phase: "transpile", severity: "error" });
    expect(c.errors[0].message).toMatch(/'bar_index' is not available in Pine Script v1/);
  });
});
