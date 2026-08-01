/**
 * The bar-counter poison pill, and whether it really is "ready to invert for v4".
 *
 * One series, two spellings: v1-v3 call it `n` and ban `bar_index`; v4 renamed
 * it and inverts that. The claim is that flipping `profile.banned` is all it
 * takes. That claim is only true if BOTH names are bound to the series, so the
 * surviving one resolves to data rather than a ReferenceError.
 */
import { describe, it, expect } from "vitest";
import { Context, compile } from "../../runtime/v2";
import { transpile } from "../../transpiler/v2";
import { LANGUAGE_PROFILES, LanguageProfile } from "../../transpiler/profiles";
import { PREFIX } from "../../utils/v2/common";

/** Runs `src` for `bars` bars under `profile` and returns the value of `val`. */
function runWith(profile: LanguageProfile, src: string, bars = 3): number {
  const ctx = new Context(profile);
  const sandbox: any = { ctx };
  const exec = compile(transpile(src, { version: profile.version }), ctx, sandbox);
  for (let i = 0; i < bars; i++) {
    ctx.currentBarIndex = i;
    ctx.setBar(i * 1000, 1, 1, 1, 1, 1);
    exec();
    ctx.finalizeBar();
  }
  return Number(ctx.vars.get(`${PREFIX}val`)?.valueOf());
}

describe("bar counter under v1/v2", () => {
  it("'n' resolves to the bar index", () => {
    expect(runWith(LANGUAGE_PROFILES[2], "val = n\n")).toBe(2);
  });

  it("'bar_index' throws and names the right identifier", () => {
    expect(() => runWith(LANGUAGE_PROFILES[2], "val = bar_index\n"))
      .toThrow(/'bar_index' is not available in Pine Script v2\. Use 'n' instead/);
  });
});

describe("inverting the pill for v4 needs only the profile", () => {
  // Simulate the v4 profile: same engine, banned map inverted. If this passes,
  // IT-05 changes a data table and nothing else.
  const v4ish: LanguageProfile = {
    ...LANGUAGE_PROFILES[2],
    banned: new Map([["n", "'n' was renamed to 'bar_index' in Pine Script v4."]]),
  };

  it("'bar_index' resolves to the series once it is no longer banned", () => {
    // This is the part that was broken: only 'n' was bound to the series, so
    // un-banning 'bar_index' would have yielded a ReferenceError, not data.
    expect(runWith(v4ish, "val = bar_index\n")).toBe(2);
  });

  it("'n' throws once it is banned", () => {
    expect(() => runWith(v4ish, "val = n\n"))
      .toThrow(/'n' was renamed to 'bar_index'/);
  });

  it("both spellings address the same series", () => {
    const underV2 = runWith(LANGUAGE_PROFILES[2], "val = n\n");
    const underV4 = runWith(v4ish, "val = bar_index\n");
    expect(underV4).toBe(underV2);
  });
});
