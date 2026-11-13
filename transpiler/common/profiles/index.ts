/**
 * Language profiles — per-version RUNTIME configuration.
 *
 * ── SCOPE, AND WHAT USED TO BE HERE ─────────────────────────────────────────
 *
 * This file once carried a `restrictions: Set<RestrictionId>` that the emitter
 * consulted on every guard (`if (!this.restricts("no_reassignment")) return`).
 * That is gone. Language rules now live in the version that owns them:
 *
 *   - SYNTAX differences are grammar files    (grammar/v{N}/PineV{N}Lexer|Parser.g4)
 *   - EMIT differences are visitor subclasses (transpiler/v{N}/ToJsVisitor.ts)
 *
 * A flag table cannot express "v1 has never heard of ':='" — it can only express
 * "v1 parses ':=' and then complains", which is not what TradingView does.
 * Inheritance can.
 *
 * What remains is configuration the RUNTIME reads at execution time, which has
 * no parse tree to hang off: banned identifiers and behavioural defaults.
 *
 * Sources for every entry: docs/common/VERSIONS.md, which cites
 * TradingView's official migration guides.
 */

import { PineVersion, DEFAULT_VERSION, implementedVersions } from "../version";

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

    /**
     * ── v6 behavioural flags ──────────────────────────────────────────────
     *
     * Optional, and ABSENT on v1–v5 rather than set to a v5 value. Absence is
     * what "this version predates the question" looks like, and it keeps the
     * five earlier profile literals byte-identical — so no v5 script can pick
     * up a v6 default by way of an edit to a shared helper.
     *
     * Each is read in exactly one place, named on the field.
     */

    /**
     * Colour constants whose VALUE changed, keyed by their dotted name.
     * MG §"Color changes". Read by createStdlib in runtime/v1/stdlib/index.ts.
     */
    readonly palette?: Readonly<Record<string, string>>;

    /**
     * `time(timeframe)` returns the start of that timeframe's bar, not the
     * chart bar's own time. Verified for v5 against TradingView's log
     * (conformance/common/v5_gaps_golden.test.ts). Read by `time()` in
     * runtime/v1/stdlib/time.ts.
     */
    readonly alignsTimeframe?: boolean;

    /**
     * `timeframe.period` always carries a multiplier: "D" -> "1D".
     * MG §"Timeframes must include a multiplier". Read by `period()` in
     * runtime/v1/stdlib/chart.ts.
     */
    readonly timeframeAlwaysMultiplied?: boolean;

    /**
     * Array accessors read -1 as the last element. MG §"Negative indices in
     * arrays". Read by the index check in runtime/v1/stdlib/arrays.ts.
     */
    readonly negativeArrayIndices?: boolean;

    /**
     * A bool can never be `na`, so history past the start of a bool series is
     * `false`. MG §"Boolean values cannot be na". Read by Context.get.
     */
    readonly boolsCanBeNa?: boolean;

    /**
     * How many of the most recent closed trades stay inspectable. Older ones
     * are "trimmed": `strategy.closedtrades.*()` returns na for them and
     * `strategy.closedtrades.first_index` names the oldest kept. MG §"Excess
     * orders are trimmed", detailed on the Strategies page's trade-limit
     * section. Read by `closed()` in runtime/v1/stdlib/trades.ts.
     */
    readonly retainedClosedTrades?: number;

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

/**
 * The colour constants whose v5 value differs from the shared stdlib's, as
 * TradingView reports them through `color.r/g/b` on every bar of the v5 gaps
 * probe. The other nine — aqua, fuchsia, green, olive, orange, purple, red,
 * white, yellow — already matched.
 */
const V5_PALETTE: Readonly<Record<string, string>> = {
  "color.black": "#363A45",
  "color.blue": "#2962FF",
  "color.gray": "#787B86",
  "color.lime": "#00E676",
  "color.maroon": "#880E4F",
  "color.navy": "#311B92",
  "color.silver": "#B2B5BE",
  "color.teal": "#00897B",
};

/**
 * v1–v3 named colours, spelled bare (`red`, not `color.red`). Measured on
 * TradingView per version (dev-docs/tv-parity/_probes/version-scope/
 * v{1,2,3}-palette-17): the original pure-RGB set, which is neither v4's nor
 * the shared stdlib's Material values.
 */
const V1_PALETTE: Readonly<Record<string, string>> = {
  "aqua": "#00FFFF",
  "black": "#000000",
  "blue": "#0000FF",
  "fuchsia": "#FF00FF",
  "gray": "#808080",
  "green": "#008000",
  "lime": "#00FF00",
  "maroon": "#800000",
  "navy": "#000080",
  "olive": "#808000",
  "orange": "#FF7F00",
  "purple": "#800080",
  "red": "#FF0000",
  "silver": "#C0C0C0",
  "teal": "#008080",
  "white": "#FFFFFF",
  "yellow": "#FFFF00",
};

/**
 * v4 named colours (dev-docs/tv-parity/_probes/version-scope/v4-palette-17).
 * Differs from v5 in blue (#2196F3) and from the shared stdlib in seven.
 */
const V4_PALETTE: Readonly<Record<string, string>> = {
  "color.aqua": "#00BCD4",
  "color.black": "#363A45",
  "color.blue": "#2196F3",
  "color.fuchsia": "#E040FB",
  "color.gray": "#787B86",
  "color.green": "#4CAF50",
  "color.lime": "#00E676",
  "color.maroon": "#880E4F",
  "color.navy": "#311B92",
  "color.olive": "#808000",
  "color.orange": "#FF9800",
  "color.purple": "#9C27B0",
  "color.red": "#FF5252",
  "color.silver": "#B2B5BE",
  "color.teal": "#00897B",
  "color.white": "#FFFFFF",
  "color.yellow": "#FFEB3B",
};

function withPalette(p: LanguageProfile, palette: Readonly<Record<string, string>>): LanguageProfile {
  return { ...p, defaults: { ...p.defaults, palette } };
}

export const LANGUAGE_PROFILES: Readonly<Record<PineVersion, LanguageProfile>> = {
  // v1 and v2 are semantically identical — TradingView states v2 is "fully
  // backwards compatible" with v1, the annotation being the only difference.
  1: withPalette(profile(1), V1_PALETTE),
  2: withPalette(profile(2), V1_PALETTE),

  // The one v2→v3 behaviour change that is neither syntax nor a rejection rule.
  3: profile(3, { defaults: { scriptDirective: "study", securityLookahead: "off", palette: V1_PALETTE } }),

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
    defaults: { scriptDirective: "study", securityLookahead: "off", palette: V4_PALETTE },
  },

  // v5 keeps v4's bar-counter rename and renames the DIRECTIVE: study()
  // becomes indicator(). securityLookahead stays "off" — v3 flipped it and
  // neither v4 nor v5 flips it back.
  //
  // Its palette and `time()` alignment are corrections measured against
  // TradingView's own Pine Logs (conformance/common/v5_gaps_golden.test.ts):
  // eight of the seventeen colour constants had stale values. v1–v4 keep
  // theirs, measured separately (V1_PALETTE, V4_PALETTE).
  5: {
    ...profile(5),
    banned: bannedBarCounter(5),
    defaults: {
      scriptDirective: "indicator",
      securityLookahead: "off",
      palette: V5_PALETTE,
      alignsTimeframe: true,
    },
  },

  // v6 renames nothing and keeps v5's bar counter and directive. Its
  // behavioural differences are added here one at a time, each beside the
  // consumer that reads it.
  6: {
    ...profile(6),
    banned: bannedBarCounter(6),
    defaults: {
      scriptDirective: "indicator",
      securityLookahead: "off",
      // v5's palette, then the three constants v6 changed (MG §"Color
      // changes"). The guide lists only those three, so the rest are v5's.
      palette: {
        ...V5_PALETTE,
        "color.red": "#F23645",
        "color.teal": "#089981",
        "color.yellow": "#FDD835",
      },
      alignsTimeframe: true,
      timeframeAlwaysMultiplied: true,
      negativeArrayIndices: true,
      boolsCanBeNa: false,
      retainedClosedTrades: 9000,
    },
  },
};

export function profileFor(version: PineVersion): LanguageProfile {
  return LANGUAGE_PROFILES[version];
}

export const DEFAULT_PROFILE = LANGUAGE_PROFILES[DEFAULT_VERSION];

export class UnimplementedVersionError extends Error {
  constructor(public readonly version: PineVersion) {
    super(
      // Reads the registered list rather than naming versions inline. The
      // message used to say "implements v1, v2, v3, v4, and v5" as a literal,
      // which was correct only for as long as nobody added a version — the
      // failure mode being a diagnostic that confidently lists the version it
      // is refusing.
      `Pine Script v${version} support is not yet implemented. ` +
      `This engine currently implements ` +
      `${implementedVersions().map(v => `v${v}`).join(", ") || "no versions"}.`
    );
    this.name = "UnimplementedVersionError";
  }
}
