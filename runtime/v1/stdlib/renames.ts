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
 * Only the three this engine implements are listed; the other March 2020
 * additions (bbw, kc, kcw, dmi, hma, supertrend, cmo, and the obv/pvt/nvi/pvi
 * family) are absent from the registry entirely, so there is nothing to remove.
 */
export const V4_ONLY_NAMES: readonly string[] = ["bb", "wpr", "mfi"];

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
