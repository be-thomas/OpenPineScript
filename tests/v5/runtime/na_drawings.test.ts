/**
 * An `na` drawing id, and `.copy()` on a drawing.
 *
 * ── Why an na id is not an error ────────────────────────────────────────────
 *
 * Because TradingView's own examples depend on it, on three separate pages.
 *
 *   `v5-concepts-lines-and-boxes-02` declares `var line periodLine = na` and
 *   calls `line.set_color(periodLine, finalColor)` on the first period change —
 *   before anything has been assigned to it. Its OTHER branch is guarded with
 *   `else if not na(periodLine)`, so the author knew the value could be absent
 *   and did not guard the branch where it always is.
 *
 *   `v5-language-loops-17` fills an array with `array.new<line>(20)` — twenty
 *   `na` lines — and immediately loops over them reading `pivotLine.get_x2()`.
 *
 *   `v4-essential-drawings-12` and `-14` are the published Pivot Points
 *   indicators: three `var line … = na` declarations and a block that moves
 *   them before the first assignment.
 *
 * So a setter on an absent drawing does nothing and a getter on one reads `na`.
 * A STALE id — one that was deleted — is still an error, which it should be.
 *
 * ── `.copy()` ──────────────────────────────────────────────────────────────
 *
 * A drawing id is a STRING, so it is neither an array nor a map, and `.copy()`
 * fell through to the user-type shallow copy: a primitive with no fields to
 * clone, returning na. `label.copy` is a real function that clones the drawing.
 * TradingView's `v5-language-matrices-20` deep-copies a matrix of labels
 * through `.copy()` and got a matrix of `na` back.
 */
import { describe, it, expect } from "vitest";
import { HEAD, value, build } from "../helpers";

describe("a setter on an na drawing does nothing", () => {
  const CASES: Array<[string, string]> = [
    ["line",  "var line l = na\nline.set_color(l, color.red)\n"],
    ["label", "var label l = na\nlabel.set_text(l, 'x')\n"],
    ["box",   "var box b = na\nbox.set_top(b, 1.0)\n"],
    ["table", "var table t = na\ntable.cell_set_text(t, 0, 0, 'x')\n"],
  ];

  for (const [kind, body] of CASES) {
    it(`${kind} setter`, () => {
      expect(() => build(HEAD + body).exec()).not.toThrow();
    });
  }

  it("the method spelling too", () => {
    expect(() => build(HEAD + "var line l = na\nl.set_x2(bar_index)\n").exec()).not.toThrow();
  });

  it("and it really did nothing — no drawing appeared", () => {
    const { ctx, exec } = build(HEAD + "var line l = na\nline.set_color(l, color.red)\n");
    exec();
    expect(value(HEAD + "var line l = na\nline.set_color(l, color.red)\nn = array.size(line.all)\n", "n"))
      .toBe(0);
    expect(ctx).toBeDefined();
  });
});

describe("a getter on an na drawing reads na", () => {
  it("as a function", () => {
    expect(Number.isNaN(value(HEAD + "var line l = na\nx = line.get_x2(l)\n", "x"))).toBe(true);
  });

  it("as a method", () => {
    expect(Number.isNaN(value(HEAD + "var line l = na\nx = l.get_x2()\n", "x"))).toBe(true);
  });

  it("the array-of-na-lines loop that found it", () => {
    const src = HEAD +
      "var array<line> lines = array.new<line>(3)\n" +
      "int total = 0\n" +
      "for ln in lines\n" +
      "    total := total + (na(ln.get_x2()) ? 1 : 0)\n";
    expect(value(src, "total")).toBe(3);
  });
});

describe("what an na id does NOT excuse", () => {
  it("a collection method on an na receiver is still an error", () => {
    // TradingView's own "Out of bounds index" demo: `array<int> a = na` then
    // `array.push(a, 111)` raises there too.
    expect(() => build(HEAD + "array<int> a = na\narray.push(a, 111)\n").exec())
      .toThrow(/expected an array, got na/);
  });

  it("a DELETED drawing is still an error", () => {
    const src = HEAD + "l = line.new(0, 0.0, 1, 1.0)\nline.delete(l)\nline.set_color(l, color.red)\n";
    expect(() => build(src).exec()).toThrow(/no such drawing/);
  });
});

describe("copy() on a drawing clones the drawing", () => {
  it("a label copy is a NEW label, not na", () => {
    const src = HEAD +
      "a = label.new(bar_index, 0.0, 'first')\n" +
      "b = a.copy()\n" +
      "n = array.size(label.all)\n";
    expect(value(src, "n")).toBe(2);
  });

  it("...and carries the original's properties", () => {
    const src = HEAD +
      "a = label.new(bar_index, 0.0, 'first')\n" +
      "b = a.copy()\n" +
      "t = b.get_text()\n";
    expect(value(src, "t")).toBe("first");
  });

  it("changing the copy leaves the original alone", () => {
    const src = HEAD +
      "a = label.new(bar_index, 0.0, 'first')\n" +
      "b = a.copy()\n" +
      "b.set_text('second')\n" +
      "t = a.get_text()\n";
    expect(value(src, "t")).toBe("first");
  });

  it("a matrix of labels deep-copies, which is the case that found it", () => {
    const src = HEAD +
      "var label seed = label.new(bar_index, 0.0, 'orig')\n" +
      "var matrix<label> m = matrix.new<label>(1, 1, seed)\n" +
      "var matrix<label> c = m.copy()\n" +
      "c.set(0, 0, c.get(0, 0).copy())\n" +
      "c.get(0, 0).set_text('copy')\n" +
      "t = m.get(0, 0).get_text()\n";
    expect(value(src, "t")).toBe("orig");
  });

  it("a user type still gets the shallow field copy", () => {
    const src = HEAD + "type P\n    float x\n" +
      "a = P.new(1.0)\nb = a.copy()\nb.x := 2.0\nv = a.x\n";
    expect(value(src, "v")).toBe(1);
  });
});
