/**
 * The bar-counter poison pill, and whether it really is "ready to invert for v4".
 *
 * One series, two spellings: v1-v3 call it `n` and ban `bar_index`; v4 renamed
 * it and inverts that. The claim is that flipping `profile.banned` is all it
 * takes. That claim is only true if BOTH names are bound to the series, so the
 * surviving one resolves to data rather than a ReferenceError.
 */
import { describe, it, expect } from "vitest";
import { Context, compile } from "../../runtime/v1";
import { transpile } from "../../transpiler/common";
import { LANGUAGE_PROFILES, LanguageProfile } from "../../transpiler/common/profiles";
import { PREFIX } from "../../utils/v2/common";
import { UNIMPLEMENTED_BUILTINS } from "../../runtime/v1/stdlib/renames";

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

/**
 * The other register: Pine names this engine knowingly does not implement.
 *
 * It is empty. The volume family — `accdist`, `iii`, `nvi`, `obv`, `pvi`, `pvt`,
 * `wad`, `wvad` — sat in it while v1–v3 were unprobed. TradingView answered
 * (dev-docs/tv-parity/_probes/volume-builtins): `accdist` exists at v1–v3 with
 * v4's values, and the other seven are undeclared there and exist from v4
 * (bare names) and v5/v6 (`ta.*`). volume_builtins_golden.test.ts holds the
 * numbers; this holds the per-version availability, and that a ternary reads
 * both of its branches at v1–v3, as TradingView's does.
 *
 * ── A failure this once closed ──────────────────────────────────────────────
 *
 * A dotted name has to be poisoned on its NAMESPACE OBJECT: a sandbox property
 * named `opsv2_ta.accdist` is a key no identifier can reach, so the v5 spelling
 * read `undefined` and TradingView's own Chaikin oscillator was NaN on every
 * bar with nothing said. No name is poisoned any more, but the loop in
 * runtime/v1/index.ts still handles dotted names, and the Chaikin example now
 * runs (docs_corpus_execution.test.ts).
 */
describe("the volume built-ins, version by version", () => {
  const SEVEN = ["iii", "nvi", "obv", "pvi", "pvt", "wad", "wvad"];

  it("the register of unimplemented built-ins is empty", () => {
    expect(UNIMPLEMENTED_BUILTINS.size).toBe(0);
  });

  for (const version of [1, 2, 3, 4]) {
    it(`v${version} reads 'accdist'`, () => {
      expect(() => runWith(LANGUAGE_PROFILES[version], "val = accdist\n")).not.toThrow();
    });
  }
  for (const version of [5, 6]) {
    it(`v${version} reads 'ta.accdist'`, () => {
      expect(() => runWith(LANGUAGE_PROFILES[version], "val = ta.accdist\n")).not.toThrow();
    });
  }

  for (const name of SEVEN) {
    for (const version of [1, 2, 3]) {
      it(`v${version} rejects '${name}' at compile time`, () => {
        expect(() => runWith(LANGUAGE_PROFILES[version], `val = ${name}\n`))
          .toThrow(new RegExp(`'${name}' is not available in Pine Script v${version}`));
      });
    }

    it(`v4 and v5 read '${name}'`, () => {
      expect(() => runWith(LANGUAGE_PROFILES[4], `val = ${name}\n`)).not.toThrow();
      expect(() => runWith(LANGUAGE_PROFILES[5], `val = ta.${name}\n`)).not.toThrow();
    });
  }

  it("a name that is not Pine at all is still reported as such", () => {
    expect(() => runWith(LANGUAGE_PROFILES[5], "val = ta.nonesuch\n"))
      .toThrow(/'ta' has no member 'nonesuch'/);
  });

  it("an unselected ternary branch naming 'accdist' still runs: both branches are read, and it exists", () => {
    // conformance/v3/corpus/cci_commodity_channel_index.pine names `accdist` in
    // a branch its inputs never select.
    expect(runWith(LANGUAGE_PROFILES[3], "val = false ? accdist : 42.0\n")).toBe(42);
  });
});
