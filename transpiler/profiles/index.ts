/**
 * Language profiles — the per-version behaviour table.
 *
 * Version differences live here as DATA, not as `if (version === 3)` branches
 * scattered through the emitter. A profile says which restrictions are live,
 * which identifiers are banned, and which runtime defaults apply; the emit
 * logic itself stays version-agnostic.
 *
 * Sources for every entry: dev-docs/01-version-delta-spec.md, which cites
 * TradingView's official migration guides.
 */

import { PineVersion, DEFAULT_VERSION } from "../version";

/**
 * A language rule that REJECTS something. Each maps to one `enforce*` method on
 * ToJsVisitor; the guard is a no-op when its id is absent from the profile.
 */
export type RestrictionId =
  // ── v1/v2 only: lifted in v3 ────────────────────────────────────────────
  /** ':=' reassignment outside a for-loop body (v1/v2 variables are immutable). */
  | "no_reassignment"
  /** '==' / '!=' against 'na' (v1/v2 misbehave silently; use na(x)). */
  | "na_comparison"
  /** 'else if' chains. */
  | "no_else_if"
  // ── v3+: tightenings introduced by the v2→v3 migration ──────────────────
  /** `s = nz(s[1]) + close` — declare first, then assign with ':='. */
  | "no_self_reference"
  /** Using an identifier before its declaration. */
  | "no_forward_reference"
  /** Implicit bool→number coercion in arithmetic (`(close > open) + 1`). */
  | "no_bool_arithmetic"
  /** Passing a ':='-mutated variable to security(). */
  | "no_mutable_security_arg"
  // ── all versions ────────────────────────────────────────────────────────
  /** Direct self-recursion in a user-defined function. */
  | "no_recursion"
  /** strategy.* under a study() directive. */
  | "strategy_context"
  /** User-defined functions returning tuples. */
  | "no_tuple_return";

export interface LanguageProfile {
  readonly version: PineVersion;

  /** Which enforce* guards fire. */
  readonly restrictions: ReadonlySet<RestrictionId>;

  /**
   * Identifiers that must throw when read, mapped to their message.
   * v1–v3 ban `bar_index` (the v2-era name is `n`); v4+ invert this and ban `n`.
   */
  readonly banned: ReadonlyMap<string, string>;

  readonly defaults: {
    /**
     * security() `lookahead` default. v1/v2 default to lookahead_on; the v2→v3
     * migration flipped it to lookahead_off.
     */
    readonly securityLookahead: "on" | "off";
    /** Default session-day string for time()/time_close(). v5 widens to Sun–Sat. */
    readonly sessionDays: string;
    /** The indicator-declaration directive. v5 renames study() to indicator(). */
    readonly scriptDirective: "study" | "indicator";
  };

  /** False for versions the engine does not yet implement — transpile refuses. */
  readonly implemented: boolean;
}

/** Restrictions shared by v1 and v2 (which are semantically identical). */
const V1_V2_RESTRICTIONS: RestrictionId[] = [
  "no_reassignment",
  "na_comparison",
  "no_else_if",
  "no_recursion",
  "strategy_context",
  "no_tuple_return",
];

/** v3 lifts three v1/v2 rules and adds four tightenings of its own. */
const V3_RESTRICTIONS: RestrictionId[] = [
  "no_self_reference",
  "no_forward_reference",
  "no_bool_arithmetic",
  "no_mutable_security_arg",
  "no_recursion",
  "strategy_context",
  "no_tuple_return",
];

function bannedBarIndex(version: PineVersion): ReadonlyMap<string, string> {
  return new Map([
    [
      "bar_index",
      `'bar_index' is not available in Pine Script v${version}. Use 'n' instead ` +
      `('n' was renamed to 'bar_index' in v4).`,
    ],
  ]);
}

function profile(
  version: PineVersion,
  restrictions: RestrictionId[],
  overrides: Partial<LanguageProfile> = {},
): LanguageProfile {
  return {
    version,
    restrictions: new Set(restrictions),
    banned: bannedBarIndex(version),
    defaults: {
      securityLookahead: "on",
      sessionDays: "23456",
      scriptDirective: "study",
    },
    implemented: true,
    ...overrides,
  };
}

/**
 * v4 and v5 are declared but not implemented. They exist so that routing is
 * TOTAL — without them a v4 script would silently transpile under v2 rules and
 * produce wrong numbers rather than an error.
 */
function unimplemented(version: PineVersion): LanguageProfile {
  return profile(version, [], { implemented: false });
}

export const LANGUAGE_PROFILES: Readonly<Record<PineVersion, LanguageProfile>> = {
  // v1 and v2 are semantically identical — TradingView states v2 is "fully
  // backwards compatible" with v1, the annotation being the only difference.
  1: profile(1, V1_V2_RESTRICTIONS),
  2: profile(2, V1_V2_RESTRICTIONS),

  // v3's rule table is defined and ready, but the guards it names
  // (no_self_reference, no_forward_reference, no_bool_arithmetic,
  // no_mutable_security_arg) are not built yet — see dev-docs IT-02/IT-03.
  // It stays `implemented: false` until they are: routing a v3 script to a
  // profile whose tightenings are absent would silently produce wrong numbers,
  // which is worse than refusing to run it.
  3: profile(3, V3_RESTRICTIONS, {
    implemented: false,
    defaults: {
      // v2→v3 flipped the security() lookahead default.
      securityLookahead: "off",
      sessionDays: "23456",
      scriptDirective: "study",
    },
  }),

  4: unimplemented(4),
  5: unimplemented(5),
};

export function profileFor(version: PineVersion): LanguageProfile {
  return LANGUAGE_PROFILES[version];
}

export const DEFAULT_PROFILE = LANGUAGE_PROFILES[DEFAULT_VERSION];

export class UnimplementedVersionError extends Error {
  constructor(public readonly version: PineVersion) {
    super(
      `Pine Script v${version} support is not yet implemented. ` +
      `OpenPineScript currently implements v1 and v2.`
    );
    this.name = "UnimplementedVersionError";
  }
}
