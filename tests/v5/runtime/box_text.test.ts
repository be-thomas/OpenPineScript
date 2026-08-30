/**
 * A box's TEXT, and a fractional array index.
 *
 * ── box text ────────────────────────────────────────────────────────────────
 *
 * "box.set_text(), box.set_text_size(), box.set_text_color(),
 *  box.set_text_halign(), box.set_text_valign(), box.set_text_wrap(), and
 *  box.set_text_font_family() update the id box's text-related properties",
 * and `box.new` takes the same seven. The whole family was absent, so
 * `lastBox.set_text(…)` — which TradingView's own lines-and-boxes example calls
 * — died with "'box' has no method 'set_text'".
 *
 * ── a fractional index ──────────────────────────────────────────────────────
 *
 * TradingView states the rule in a comment on the line that needs it, in
 * `v5-language-arrays-06`: "The index used by `array.get()` will be the
 * equivalent of `floor(fillNo)`", where `fillNo` is
 * `math.min(lastHiBar / (lookbackInput / 5), 4)` — an ordinary float. Requiring
 * an integer rejected the script on its first bar.
 */
import { describe, it, expect } from "vitest";
import { HEAD, value, build } from "../helpers";

const boxProps = (src: string) => {
  const { ctx, exec } = build(src);
  exec();
  return [...(ctx as any).drawings.values()].filter((d: any) => d.kind === "box")[0].props;
};

describe("box text", () => {
  it("set_text writes it", () => {
    const src = HEAD + "b = box.new(0, 1.0, 1, 0.0)\nb.set_text('hello')\n";
    expect(boxProps(src).text).toBe("hello");
  });

  it("box.new takes it as a keyword argument", () => {
    const src = HEAD + "b = box.new(0, 1.0, 1, 0.0, text = 'hi', text_color = color.red)\n";
    const p = boxProps(src);
    expect(p.text).toBe("hi");
    expect(p.text_color).toBe("#FF5252");
  });

  it("the other six setters", () => {
    const src = HEAD +
      "b = box.new(0, 1.0, 1, 0.0)\n" +
      "b.set_text_size(size.large)\n" +
      "b.set_text_color(color.blue)\n" +
      "b.set_text_halign(text.align_left)\n" +
      "b.set_text_valign(text.align_top)\n" +
      "b.set_text_wrap(text.wrap_auto)\n" +
      "b.set_text_font_family(font.family_monospace)\n";
    const p = boxProps(src);
    expect(p.text_size).toBe("large");
    expect(p.text_halign).toBe("left");
    expect(p.text_valign).toBe("top");
    expect(p.text_wrap).toBe("auto");
  });

  it("the defaults are centred and empty", () => {
    const p = boxProps(HEAD + "b = box.new(0, 1.0, 1, 0.0)\n");
    expect(p.text).toBe("");
    expect(p.text_halign).toBe("center");
    expect(p.text_valign).toBe("center");
    expect(p.text_wrap).toBe("none");
  });
});

describe("a fractional array index is floored", () => {
  it("0.05 reads element 0", () => {
    expect(value(HEAD + "xs = array.from(10.0, 20.0, 30.0)\nx = array.get(xs, 0.05)\n", "x"))
      .toBe(10);
  });

  it("2.9 reads element 2, not 3", () => {
    expect(value(HEAD + "xs = array.from(10.0, 20.0, 30.0)\nx = array.get(xs, 2.9)\n", "x"))
      .toBe(30);
  });

  it("array.set takes one too", () => {
    const src = HEAD + "xs = array.from(1.0, 2.0)\narray.set(xs, 1.7, 9.0)\nx = array.get(xs, 1)\n";
    expect(value(src, "x")).toBe(9);
  });

  it("a genuinely out-of-range index is still refused", () => {
    expect(() => build(HEAD + "xs = array.from(1.0)\nx = array.get(xs, 3.2)\n").exec())
      .toThrow(/index 3 is out of bounds \(size 1\)/);
  });

  it("na as an index is refused rather than floored to something", () => {
    expect(() => build(HEAD + "xs = array.from(1.0)\nx = array.get(xs, na)\n").exec())
      .toThrow(/out of bounds/);
  });

  it("an na ARRAY names itself in the diagnostic", () => {
    expect(() => build(HEAD + "array<int> a = na\narray.push(a, 1)\n").exec())
      .toThrow(/expected an array, got na/);
  });
});
