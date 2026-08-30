/**
 * A method called through a FIELD, and a user method that shares a built-in's
 * name.
 *
 * Two emitter defects with one shape: `id` is greedy, so everything between the
 * receiver and the parentheses arrives glued together, and the emitter has to
 * take it apart correctly.
 *
 * ── `obj.field.method()` ────────────────────────────────────────────────────
 *
 * The whole of `data.size` reached `Context.builtinMethod` as a METHOD NAME. No
 * value has a method called `data.size`, so
 *
 *     type Wrapper
 *         map<string, float> data
 *     …
 *     wrapper.data.size()
 *
 * died with "'.data.size()' cannot be called on this value: it is object".
 * Five of TradingView's own examples are this — `obj.lbl.set_x()`,
 * `obj.level.get_x1()`, `obj.prices.get()`, `wrapper.data.size()` and a matrix
 * of labels deep-copied through `.copy()`.
 *
 * ── `srcArray.copy().fill(…)` ───────────────────────────────────────────────
 *
 * `Context.call` reads the call id to find the callee's registry entry, and
 * that entry decides whether a Context is injected as the first argument. A
 * USER method named `fill` was given the entry for Pine's plot-filling `fill()`
 * — so its receiver arrived as the Context object. The manual's own
 * method-chaining example is exactly that collision:
 *
 *     srcArray.copy().fill(1.0, 0.0, min, val).avg()
 */
import { describe, it, expect } from "vitest";
import { HEAD, value, build } from "../helpers";

describe("a built-in method called on a field", () => {
  const WRAPPER = "type Wrapper\n    array<float> data\n";

  it("collection method on a field", () => {
    const src = HEAD + WRAPPER +
      "w = Wrapper.new(array.from(1.0, 2.0, 3.0))\n" +
      "n = w.data.size()\n";
    expect(value(src, "n")).toBe(3);
  });

  it("...with arguments", () => {
    const src = HEAD + WRAPPER +
      "w = Wrapper.new(array.from(5.0, 6.0))\n" +
      "n = w.data.get(1)\n";
    expect(value(src, "n")).toBe(6);
  });

  it("a NESTED field path folds left to right", () => {
    const src = HEAD +
      "type Inner\n    array<float> xs\n" +
      "type Outer\n    Inner inner\n" +
      "o = Outer.new(Inner.new(array.from(1.0, 2.0)))\n" +
      "n = o.inner.xs.size()\n";
    expect(value(src, "n")).toBe(2);
  });

  it("a drawing held in a field takes its own namespace's methods", () => {
    const src = HEAD +
      "type Holder\n    label lbl\n" +
      "h = Holder.new(label.new(bar_index, 0.0, 'a'))\n" +
      "h.lbl.set_text('b')\n" +
      "t = h.lbl.get_text()\n";
    expect(value(src, "t")).toBe("b");
  });

  it("the emitted field reads are separate from the call", () => {
    const { js } = build(HEAD + WRAPPER +
      "w = Wrapper.new(array.from(1.0))\nn = w.data.size()\n");
    expect(js).toContain('ctx.field(');
    expect(js).toContain('"size"');
  });
});

describe("a user method may share a built-in's name", () => {
  it("`fill` on an array is the user's, not the plotting function", () => {
    // The receiver has to arrive as the receiver. When `Context.call` matched
    // the built-in `fill` entry it injected a Context in front of it.
    const src = HEAD +
      "method fill(array<float> srcArray, float v) =>\n" +
      "    for [i, e] in srcArray\n" +
      "        srcArray.set(i, v)\n" +
      "    srcArray\n" +
      "xs = array.from(1.0, 2.0, 3.0)\n" +
      "n = xs.copy().fill(9.0).avg()\n";
    expect(value(src, "n")).toBe(9);
  });

  it("...and the original is untouched, so `copy()` really copied", () => {
    const src = HEAD +
      "method fill(array<float> srcArray, float v) =>\n" +
      "    for [i, e] in srcArray\n" +
      "        srcArray.set(i, v)\n" +
      "    srcArray\n" +
      "xs = array.from(1.0, 2.0, 3.0)\n" +
      "ignored = xs.copy().fill(9.0)\n" +
      "n = xs.avg()\n";
    expect(value(src, "n")).toBe(2);
  });

  it("the call id carries the EMITTED name, which no registry key can equal", () => {
    const { js } = build(HEAD +
      "method fill(array<float> a, float v) =>\n    a\n" +
      "xs = array.from(1.0)\nn = xs.copy().fill(9.0)\n");
    expect(js).toContain('ctx.call("opsv2_$fn_fill@');
    expect(js).not.toContain('ctx.call("fill@');
  });

  it("a non-chained call on a named receiver takes the same route", () => {
    const src = HEAD +
      "method fill(array<float> a, float v) =>\n" +
      "    a.set(0, v)\n    a\n" +
      "xs = array.from(1.0, 2.0)\n" +
      "n = xs.fill(7.0).get(0)\n";
    expect(value(src, "n")).toBe(7);
  });
});
