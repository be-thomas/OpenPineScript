/**
 * Language profiles — per-version RUNTIME configuration.
 *
 * ── SCOPE, AND WHAT USED TO BE HERE ─────────────────────────────────────────
 *
 * This file once carried a `restrictions: Set<RestrictionId>` that the emitter
 * consulted on every guard (`if (!this.restricts("no_reassignment")) return`).
 * That is gone. Language rules now live in the version that owns them:
 *
 *   - SYNTAX differences are grammar files    (grammar/PineV{N}Lexer|Parser.g4)
 *   - EMIT differences are visitor subclasses (transpiler/v{N}/ToJsVisitor.ts)
 *
 * A flag table cannot express "v1 has never heard of ':='" — it can only express
 * "v1 parses ':=' and then complains", which is not what TradingView does.
 * Inheritance can.
 *
 * What remains is configuration the RUNTIME reads at execution time, which has
 * no parse tree to hang off: banned identifiers and behavioural defaults.
 *
 * Sources for every entry: dev-docs/01-version-delta-spec.md, which cites
 * TradingView's official migration guides.
 */

import { PineVersion, DEFAULT_VERSION } from "../version";

export interface LanguageProfile {
  readonly version: PineVersion;

  /**
   * Identifiers that must throw when read, mapped to their message.
   * v1–v3 ban `bar_index` (the v2-era name is `n`); v4+ invert this and ban `n`.
   */
  readonly banned: ReadonlyMap<string, string>;

  readonly defaults: {
    /** The indicator-declaration directive. v5 renames study() to indicator(). */
    readonly scriptDirective: "study" | "indicator";

    /**
     * security()'s `lookahead` default. Read by runtime/v1/stdlib/mtf.ts.
     * v1/v2 default to lookahead_on; the v2→v3 migration flipped it to off.
     *
     * Only fields with a real consumer belong here — a default nothing reads
     * lets a test assert the constant against itself and call it coverage.
     */
    readonly securityLookahead: "on" | "off";
  };
}

/**
 * ── NOT here: the §4d default-session change ────────────────────────────────
 *
 * The v4 → v5 guide records the default session for `time()` / `time_close()`
 * widening from `"0000-0000:23456"` (Mon–Fri) to `"0000-0000:1234567"`
 * (Sun–Sat), and an earlier draft of this file carried it as a third default.
 *
 * It is not here, because applying EITHER value as a day mask is wrong for this
 * engine. TradingView's actual default is the SYMBOL's session
 * (`syminfo.session`), which needs an exchange calendar this engine does not
 * have — see the timezone note on `time()` in runtime/v1/stdlib/time.ts, which
 * is the same missing piece. Filtering by Mon–Fri instead produced a concrete
 * regression: conformance/corpus/…/sunday.pine, a published v1 script whose
 * whole job is to mark Sunday opens, went permanently `na`.
 *
 * So `time()` applies no default mask, which is the behaviour every version has
 * had, and the version difference is recorded as unimplemented rather than
 * guessed at. Adding a field here that nothing could correctly read would only
 * let a test assert the constant against itself.
 */

/**
 * The bar counter is spelled `n` up to v3 and `bar_index` from v4. Whichever
 * name does not belong to this version must THROW rather than silently read as
 * `na` — a bar counter that is quietly absent produces plausible wrong numbers
 * for the whole script.
 *
 * The runtime binds both names and consults this map to poison one, so the v4
 * inversion is a data change here and nothing else.
 */
function bannedBarIndex(version: PineVersion): ReadonlyMap<string, string> {
  return new Map([
    [
      "bar_index",
      `'bar_index' is not available in Pine Script v${version}. Use 'n' instead ` +
      `('n' was renamed to 'bar_index' in v4).`,
    ],
  ]);
}

/** The v4+ direction: `bar_index` is canonical and `n` no longer exists. */
function bannedBarCounter(version: PineVersion): ReadonlyMap<string, string> {
  return new Map([
    [
      "n",
      `'n' is not available in Pine Script v${version}. Use 'bar_index' instead ` +
      `('n' was renamed to 'bar_index' in v4).`,
    ],
  ]);
}

function profile(version: PineVersion, overrides: Partial<LanguageProfile> = {}): LanguageProfile {
  return {
    version,
    banned: bannedBarIndex(version),
    defaults: { scriptDirective: "study", securityLookahead: "on" },
    ...overrides,
  };
}

export const LANGUAGE_PROFILES: Readonly<Record<PineVersion, LanguageProfile>> = {
  // v1 and v2 are semantically identical — TradingView states v2 is "fully
  // backwards compatible" with v1, the annotation being the only difference.
  1: profile(1),
  2: profile(2),

  // The one v2→v3 behaviour change that is neither syntax nor a rejection rule.
  3: profile(3, { defaults: { scriptDirective: "study", securityLookahead: "off" } }),

  // v4 INVERTS the bar-counter ban. `n` was renamed to `bar_index`, and the old
  // spelling is gone — a v4 script using `n` gets "Undeclared identifier 'n'"
  // from TradingView, so leaving it bound would accept code TradingView rejects.
  //
  // The runtime binds BOTH names and lets this map remove one, so the inversion
  // is exactly this entry and no code change.
  //
  // securityLookahead stays "off": v3 flipped it and v4 does not flip it back.
  4: {
    ...profile(4),
    banned: bannedBarCounter(4),
    defaults: { scriptDirective: "study", securityLookahead: "off" },
  },

  // v5 keeps v4's bar-counter rename and renames the DIRECTIVE: study()
  // becomes indicator(). securityLookahead stays "off" — v3 flipped it and
  // neither v4 nor v5 flips it back.
  5: {
    ...profile(5),
    banned: bannedBarCounter(5),
    defaults: { scriptDirective: "indicator", securityLookahead: "off" },
  },
};

export function profileFor(version: PineVersion): LanguageProfile {
  return LANGUAGE_PROFILES[version];
}

export const DEFAULT_PROFILE = LANGUAGE_PROFILES[DEFAULT_VERSION];

export class UnimplementedVersionError extends Error {
  constructor(public readonly version: PineVersion) {
    super(
      `Pine Script v${version} support is not yet implemented. ` +
      `OpenPineScript currently implements v1, v2, v3, v4, and v5.`
    );
    this.name = "UnimplementedVersionError";
  }
}
