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
 * The volume family — `accdist`, `iii`, `nvi`, `obv`, `pvi`, `pvt`, `wad`,
 * `wvad` — has published variants that disagree on the SEED value, and a seed
 * guessed wrong produces a series that is the right shape and the wrong number
 * forever. So no implementation is offered, and each name is bound to a getter
 * that throws when READ.
 *
 * ── The failure this closes ─────────────────────────────────────────────────
 *
 * v5 renames all eight into `ta.`, and the register lists both spellings. But
 * the pill was installed as a SANDBOX property named `opsv2_ta.accdist` — a
 * key containing a dot, which no identifier can reach — while the emitter
 * renders the v5 spelling `opsv2_ta.opsv2_accdist`. So `ta.accdist` read
 * `undefined`, and
 *
 *     osc = ta.ema(ta.accdist, fastLengthInput) - ta.ema(ta.accdist, slowLengthInput)
 *
 * — TradingView's own Chaikin oscillator, on the Text and shapes page — was
 * NaN on every bar with nothing said, while the v4 script one page over
 * correctly refused. A register whose whole purpose is to tell "real Pine, not
 * implemented here" from "not a Pine name at all" had stopped doing so for the
 * spelling every current script uses.
 *
 * Dotted names are therefore poisoned on their NAMESPACE OBJECT.
 */
describe("names this engine deliberately does not implement", () => {
  const VOLUME_FAMILY = ["accdist", "iii", "nvi", "obv", "pvi", "pvt", "wad", "wvad"];

  for (const name of VOLUME_FAMILY) {
    it(`v4 refuses '${name}' by name`, () => {
      expect(() => runWith(LANGUAGE_PROFILES[4], `val = ${name}\n`))
        .toThrow(new RegExp(`'${name}' is a Pine built-in that OpenPineScript does not implement`));
    });

    it(`v5 refuses 'ta.${name}' by name`, () => {
      expect(() => runWith(LANGUAGE_PROFILES[5], `val = ta.${name}\n`))
        .toThrow(new RegExp(`'ta\\.${name}' is a Pine built-in that OpenPineScript does not implement`));
    });
  }

  it("it says WHY, rather than reporting an undeclared identifier", () => {
    // "Real Pine, not implemented here" and "not a Pine name at all" must not
    // produce the same diagnostic.
    expect(() => runWith(LANGUAGE_PROFILES[5], "val = ta.accdist\n"))
      .toThrow(/published definitions disagree on the seed value/);
    expect(() => runWith(LANGUAGE_PROFILES[5], "val = ta.nonesuch\n"))
      .toThrow(/'ta' has no member 'nonesuch'/);
  });

  it("a script only MENTIONING one still runs, because the pill fires on read", () => {
    // conformance/v3/corpus/cci_commodity_channel_index.pine names `accdist` in
    // a branch its inputs never select, and keeps working.
    expect(runWith(LANGUAGE_PROFILES[5], "val = false ? ta.accdist : 42.0\n")).toBe(42);
  });
});
