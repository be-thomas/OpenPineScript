/**
 * The name lists an EDITOR needs, and why they come from here.
 *
 * A highlighter with its own copy of Pine's keywords drifts the moment either
 * side changes, and nothing fails when it does — a wrong colour is not an
 * error. These lists are derived from what the compiler itself consults: the
 * lexer grammars for the reserved words, and `viewFor(version)` for the
 * built-ins, which is the same registry the transpiler checks a name against
 * before saying it is "not available in Pine Script v{n}".
 */
import { describe, it, expect } from "vitest";
import { languageSpec } from "../../runtime/v1/language-spec";
import { IMPLEMENTED_VERSIONS } from "../../transpiler/common";

describe("the language spec", () => {
  it("is version-accurate about where a function lives", () => {
    // v5 moved the technical-analysis functions under `ta.`; before that they
    // were bare globals. Highlighting `ta.sma` in a v2 script would be
    // colouring something that version cannot spell.
    expect(languageSpec(5).builtins).toContain("ta.sma");
    expect(languageSpec(2).builtins).not.toContain("ta.sma");
    expect(languageSpec(2).builtins).toContain("sma");
  });

  it("accumulates keywords rather than replacing them", () => {
    // Each lexer grammar imports the one below it, so v5 reserves v1's words too.
    expect(languageSpec(1).keywords).toContain("if");
    expect(languageSpec(5).keywords).toContain("if");
    // `var` arrives at v4, `switch` at v5.
    expect(languageSpec(3).keywords).not.toContain("var");
    expect(languageSpec(4).keywords).toContain("var");
    expect(languageSpec(4).keywords).not.toContain("switch");
    expect(languageSpec(5).keywords).toContain("switch");
  });

  it("grows monotonically across the versions", () => {
    let previous = 0;
    for (const v of IMPLEMENTED_VERSIONS) {
      const spec = languageSpec(v);
      expect(spec.builtins.length).toBeGreaterThanOrEqual(previous);
      previous = spec.builtins.length;
    }
  });

  it("lists the leading segment of every dotted name", () => {
    const spec = languageSpec(5);
    expect(spec.namespaces).toContain("ta");
    expect(spec.namespaces).toContain("strategy");
    // A namespace is derived, never invented: each one has to own a member.
    for (const ns of spec.namespaces) {
      expect(spec.builtins.some(b => b.startsWith(`${ns}.`))).toBe(true);
    }
  });

  it("is stable to diff", () => {
    const spec = languageSpec(5);
    expect(spec.keywords).toEqual([...spec.keywords].sort());
    expect(spec.builtins).toEqual([...spec.builtins].sort());
  });
});
