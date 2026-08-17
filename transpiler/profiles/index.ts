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

  // Declared so profileFor() is TOTAL. Whether a version actually RUNS is decided
  // by transpiler/index.ts (PIPELINES), not here — a profile is data, and data
  // cannot tell you whether a parser exists.
  //
  // v5 keeps v4's rename but renames the DIRECTIVE: study() becomes indicator().
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
      `OpenPineScript currently implements v1, v2, v3, and v4.`
    );
    this.name = "UnimplementedVersionError";
  }
}
