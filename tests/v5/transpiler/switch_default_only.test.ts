/**
 * A `switch` whose only arm is the default.
 *
 *     T(string key) =>
 *         switch key
 *             => key
 *
 * is how a translation table is written before its languages are added. The
 * arms are joined into an if/else chain, and the default is an `else` — so a
 * chain that STARTED with it was `else { … }`, "Unexpected token 'else'", and
 * the script did not compile at all.
 */
import { describe, it, expect } from "vitest";
import { compileScript } from "../../../transpiler/common";
import { HEAD, value } from "../helpers";

describe("switch with only a default arm", () => {
  it("evaluates to the default, with a subject", () => {
    expect(value(HEAD + 'x = switch close\n    => 7\n', "x")).toBe(7);
  });

  it("evaluates to the default, with no subject and a block body", () => {
    const src = HEAD + 'x = switch\n    =>\n        y = 3\n        y * 2\n';
    expect(value(src, "x")).toBe(6);
  });

  it("emits JavaScript that parses, inside a function", () => {
    const src = HEAD + 'T(string key) =>\n    switch key\n        => key\nx = T("a")\n';
    const { js } = compileScript(src);
    expect(() => new Function(js)).not.toThrow();
    expect(value(src, "x")).toBe("a");
  });

  it("still chains a default after labelled arms", () => {
    const src = HEAD + 'x = switch close\n    10 => 1\n    11 => 2\n    => 3\n';
    expect(value(src, "x")).toBe(2);   // close is 11 in the helper's bars
  });
});
