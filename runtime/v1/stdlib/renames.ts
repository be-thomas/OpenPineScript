/**
 * The v3 → v4 rename table.
 *
 * ── What this is ────────────────────────────────────────────────────────────
 *
 * §3a of the v3→v4 migration guide is a pure alias list: v4 moved a pile of
 * loose globals into namespaces and changed nothing about what they mean.
 * `red` became `color.red`, `period` became `timeframe.period`, `ticker` became
 * `syminfo.ticker`. Same value, same implementation, new spelling.
 *
 * So this is DATA, not code. Each entry names the v4 spelling and the v1–v3
 * registry key it renames, and the alias inherits that key's entry wholesale —
 * `uses_context`, `is_getter`, `args`, `returns`, `ref`. Re-implementing
 * `timeframe.period` as a second function beside `period` would be two things
 * to keep in step with no test that could catch them drifting.
 *
 * ── The bar counter is NOT here ─────────────────────────────────────────────
 *
 * `n` → `bar_index` is the one rename that is not an alias: v4 REMOVES `n`.
 * Every other old spelling below is also removed at v4, but they are removed by
 * absence from v4's registry view, which costs nothing. The bar counter needs a
 * real poison pill because the runtime binds it directly as a series rather
 * than through the registry — so it lives in LANGUAGE_PROFILES[4].banned.
 *
 * ── Source ──────────────────────────────────────────────────────────────────
 *
 * https://www.tradingview.com/pine-script-docs/migration-guides/to-pine-version-4/
 * transcribed into dev-docs/01-version-delta-spec.md §3a.
 */

/** One rename: the v4 spelling, and where its value comes from. */
export interface RenameSpec {
  /** The v4 spelling, e.g. "color.red". */
  readonly to: string;
  /** The v1–v3 registry key it renames, e.g. "red". */
  readonly from?: string;
  /**
   * A literal, for the handful of v4 constants with no reachable v1–v3
   * spelling in this engine. Used only where `from` genuinely cannot be given.
   */
  readonly value?: unknown;
}

const group = (namespace: string, names: readonly string[], prefix = ""): RenameSpec[] =>
  names.map(n => ({ to: `${namespace}.${prefix}${n}`, from: n }));

/**
 * The 17 named colours. v4 keeps every one, moved under `color.`.
 */
const COLORS = group("color", [
  "aqua", "black", "blue", "fuchsia", "gray", "green", "lime", "maroon",
  "navy", "olive", "orange", "purple", "red", "silver", "teal", "white",
  "yellow",
]);

/**
 * `input()`'s `type=` constants. The FUNCTION `input()` keeps its flat name in
 * v4 — only the type constants move — so `input` is deliberately absent from
 * the removal list at the bottom of this file.
 */
const INPUT_TYPES = group("input", [
  "integer", "float", "bool", "string", "resolution", "session", "symbol",
  "source",
]);

/**
 * Plot styles gain a `style_` prefix as well as a namespace:
 * `histogram` → `plot.style_histogram`.
 */
const PLOT_STYLES: RenameSpec[] = [
  ...group("plot", ["histogram", "line", "stepline", "area", "columns",
                    "circles", "linebr", "areabr"], "style_"),
  // v3's plot style `cross` is unreachable in this engine: the flat name `cross`
  // resolves to ta.cross(). Pine keeps functions and variables in separate
  // namespaces and can tell them apart; one flat registry cannot, and the
  // function won. v4 removes the ambiguity by renaming the style, so the v4
  // spelling CAN be given a value even though the v3 one cannot.
  { to: "plot.style_cross", value: "cross" },
];

/** hline styles, same shape: `dotted` → `hline.style_dotted`. */
const HLINE_STYLES = group("hline", ["dotted", "dashed", "solid"], "style_");

/** Weekday constants. */
const WEEKDAYS = group("dayofweek", [
  "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday",
]);

/**
 * Chart-timeframe globals. `interval` is the one that also changes NAME rather
 * than just gaining a namespace.
 */
const TIMEFRAME: RenameSpec[] = [
  ...group("timeframe", ["period", "isintraday", "isdaily", "isweekly", "ismonthly"]),
  { to: "timeframe.multiplier", from: "interval" },
];

/** Symbol information. */
const SYMINFO: RenameSpec[] = [
  { to: "syminfo.ticker", from: "ticker" },
  { to: "syminfo.tickerid", from: "tickerid" },
];

/**
 * Namespaces that exist ONLY from v4, and are therefore removed from the v1–v3
 * registry view.
 *
 * They live in the ordinary stdlib source files — the runtime is one
 * implementation across versions by design — so without this list the
 * generator would make `array.new_float` and `label.new` resolvable at v1,
 * where TradingView reports `Undeclared identifier`.
 *
 * Dates, from the v4 release notes:
 *   line, label      June 2019
 *   array            September 2020
 *   box, table       May 2021
 *
 * `xloc`, `yloc`, `extend`, `position` and `text` are the constant namespaces
 * that only exist to parameterise the above, so they are v4-only for the same
 * reason.
 */
export const V4_ONLY_NAMESPACES: readonly string[] = [
  "array", "line", "label", "box", "table",
  "xloc", "yloc", "extend", "position", "text", "order",
];

/**
 * FLAT names that exist only from v4 — the indicator functions TradingView
 * added in March 2020.
 *
 * Separate from V4_ONLY_NAMESPACES because these are not namespaces: they are
 * bare function names sitting in the same flat space as `sma` and `rsi`, so
 * gating them needs an exact-name list rather than a root-prefix one.
 *
 * Until this existed, a //@version=3 script calling `bb()` compiled and ran
 * here while TradingView answered
 *
 *     Could not find function or function reference 'bb'
 *
 * — a parity gap in the opposite direction from most: the engine was too
 * permissive, not too strict. It was recorded in conformance/golden/README.md
 * as unfixable-for-now, because gating it would have made
 * golden/v4/harness_builtins.pine unrunnable while v4 had no pipeline. It has
 * one now, so the gate costs nothing.
 *
 * The volume family — obv, pvt, nvi, pvi, accdist, iii, wad, wvad — is still
 * absent from the registry, so there is nothing to gate for those. Each has
 * published variants that disagree on the SEED value, and a seed guessed wrong
 * produces a series that is the right shape and the wrong number forever;
 * an absent name is refused instead.
 */
export const V4_ONLY_NAMES: readonly string[] = [
    "bb", "wpr", "mfi",
    "bbw", "kc", "kcw", "hma", "cmo", "dmi", "supertrend",
    "range", "median", "mode",

    // The rest of the March-2020 and 2021 batches, from the v4 release notes:
    //
    //   "todegrees(radians) … toradians(degrees) … random(min, max, seed) -
    //    returns a pseudo-random value."
    //   "New function was added: round_to_mintick(x)"
    //   "New variable was added: time_tradingday" (February 2021)
    //   "New argument for time and time_close functions was added: timezone"
    //    (July 2021 — so time_close predates it, and it is absent from the v3
    //    documentation, which places it in v4)
    //   "max_bars_back function to control series variables internal history
    //    buffer sizes" and "functions for explicit type casting" (June 2019)
    "random", "todegrees", "toradians", "round_to_mintick",
    "time_close", "time_tradingday", "max_bars_back", "int",
];

export const V4_RENAMES: readonly RenameSpec[] = [
  ...COLORS,
  ...INPUT_TYPES,
  ...PLOT_STYLES,
  ...HLINE_STYLES,
  ...WEEKDAYS,
  ...TIMEFRAME,
  ...SYMINFO,
];

/**
 * The v1–v3 spellings v4 removes.
 *
 * Every `from` above, minus the names that survive v4 under their old spelling
 * because something ELSE of that name is what moved. `line` is the clearest
 * case: `plot.style_line` is the renamed constant, but v4 also has a `line`
 * DRAWING type, so the word itself is very much still in the language.
 *
 * Removal is what makes a v4 script fail on a v3 spelling the way TradingView
 * does, instead of silently accepting both dialects.
 */
export const V4_REMOVED: readonly string[] = (() => {
  const removed = new Set(
    V4_RENAMES.map(r => r.from).filter((f): f is string => Boolean(f)),
  );
  // `line` and `area` are removed as PLOT STYLES but the words remain in v4 —
  // `line` as a drawing type, `area` only ever as a style. Keeping `line`
  // spellable matters; `area` is genuinely gone.
  removed.delete("line");
  return [...removed];
})();

/**
 * Pine names this engine knows about and deliberately does NOT implement.
 *
 * The volume family has published variants that disagree on the SEED value,
 * and a seed guessed wrong produces a series that is the right shape and the
 * wrong number forever — so no implementation is offered. See the note in
 * runtime/v1/stdlib/renames.ts.
 *
 * They are listed here because "absent from the registry" and "not a Pine name
 * at all" must not produce the same diagnostic. `accdist` is real Pine, so
 * `Undeclared identifier` would be a lie; it also cannot be allowed to compile
 * into a silent `undefined`. runtime/v1/index.ts binds each one as a poison pill that
 * throws only when READ, which is what lets
 * conformance/corpus/v3/cci_commodity_channel_index.pine keep running: it
 * mentions `accdist` in a branch selected by an input, and every other branch
 * still works.
 */
export const UNIMPLEMENTED_BUILTINS: ReadonlySet<string> = new Set([
  "accdist", "iii", "nvi", "obv", "pvi", "pvt", "wad", "wvad",
]);
