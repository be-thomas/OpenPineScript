/**
 * Every keyword alias the v5 emitter applies must name a real parameter.
 *
 * `Context.call` DROPS a keyword the callee's signature does not carry, and
 * says nothing at compile time. PR #10 renamed two runtime parameters while
 * KEYWORD_ALIASES still pointed at the old names, and `strategy.entry(
 * direction = strategy.long)` opened shorts. This is the check that makes the
 * next rename on either side a failing test.
 */
import { describe, it, expect } from "vitest";
import { KEYWORD_ALIASES } from "../../../transpiler/v5/ToJsVisitor";
import { REGISTRY } from "../../../runtime/v1/stdlib";

// Directives are consumed by Context.declareScript, not looked up in the
// registry; it reads neither `resolution` nor `timeframe`, so their aliases
// cannot misbind anything.
const DIRECTIVES = new Set(["indicator"]);

describe("KEYWORD_ALIASES", () => {
  for (const [fn, aliases] of Object.entries(KEYWORD_ALIASES)) {
    if (DIRECTIVES.has(fn)) continue;
    describe(fn, () => {
      it("is a builtin in the runtime registry", () => {
        expect(REGISTRY[fn], `${fn} is not in the registry`).toBeDefined();
      });

      for (const [written, target] of Object.entries(aliases)) {
        it(`${written} -> ${target} names one of its parameters`, () => {
          expect(REGISTRY[fn]?.args).toContain(target);
        });
      }
    });
  }

  it("covers no directive that has since entered the registry", () => {
    for (const fn of DIRECTIVES) expect(REGISTRY[fn]).toBeUndefined();
  });
});
