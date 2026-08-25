/**
 * The v4 → v5 rename table.
 *
 * ── What this is ────────────────────────────────────────────────────────────
 *
 * v5 is, in bulk, one enormous renaming. §4a of the migration guide moves the
 * entire technical-analysis library under `ta.`, the maths under `math.`, the
 * data requests under `request.`, the ticker constructors under `ticker.` and
 * string handling under `str.`. Nothing about what any of them MEAN changed:
 * `sma(close, 20)` and `ta.sma(close, 20)` are the same function.
 *
 * So this is DATA, exactly as ./renames.ts is for v3 → v4, and it shares that
 * file's `RenameSpec` shape. Each entry names the v5 spelling and the v4
 * registry key it renames, and the alias inherits that key's entry wholesale —
 * `uses_context`, `is_getter`, `args`, `returns`, `ref`. Re-implementing
 * `ta.sma` beside `sma` would be two things to keep in step with no test that
 * could catch them drifting.
 *
 * ── The source list, and the two names that are not on it ───────────────────
 *
 * The lists below are transcribed from dev-docs/01-version-delta-spec.md §4a,
 * which in turn is transcribed from TradingView's v4 → v5 migration guide.
 *
 * `fixnan` and `trix` are the exceptions: neither appears in the guide's
 * enumeration, and both are moved here anyway. The rule the guide states is
 * that the technical-analysis library moved to `ta.` — the enumeration is the
 * list of members, not a set of exceptions to it — and `ta.fixnan` is used by
 * conformance/v5/golden/harness_state.pine, which was generated from the v3
 * harness against that same rule. Leaving them flat would make v5 the only
 * version where part of the TA library has no namespace.
 *
 * ── The bar counter is NOT here ─────────────────────────────────────────────
 *
 * `n` → `bar_index` happened at v4 and v5 inherits it. It is a poison pill on
 * the language profile rather than an alias, for the reasons in ./renames.ts.
 *
 * ── Source ──────────────────────────────────────────────────────────────────
 *
 * https://www.tradingview.com/pine-script-docs/migration-guides/to-pine-version-5/
 * transcribed into dev-docs/01-version-delta-spec.md §4.
 */

import type { RenameSpec } from "./renames";

const group = (namespace: string, names: readonly string[]): RenameSpec[] =>
    names.map(n => ({ to: `${namespace}.${n}`, from: n }));

/**
 * The technical-analysis library.
 *
 * The migration guide lists ~65 members; only the ones this engine actually
 * implements are named, because a rename pointing at a missing source is an
 * error (see V5_REGISTRY in ./index.ts) rather than a placeholder. The absent
 * ones are the volume family — accdist, iii, nvi, obv, pvi, pvt, wad, wvad —
 * whose published definitions disagree on the seed value; see the note in
 * ./renames.ts.
 */
const TA = group("ta", [
    "alma", "atr", "barssince", "bb", "bbw", "cci", "change", "cmo", "cog",
    "correlation", "cross", "crossover", "crossunder", "cum", "dev", "dmi",
    "ema", "falling", "fixnan", "highest", "highestbars", "hma", "kc", "kcw",
    "linreg", "lowest", "lowestbars", "macd", "median", "mfi", "mode", "mom",
    "percentile_linear_interpolation", "percentile_nearest_rank", "percentrank",
    "pivothigh", "pivotlow", "range", "rising", "rma", "roc", "rsi", "sar",
    "sma", "stdev", "stoch", "supertrend", "swma", "tr", "trix", "tsi",
    "valuewhen", "variance", "vwap", "vwma", "wma", "wpr",
]);

/**
 * The maths library.
 *
 * `random`, `todegrees`, `toradians` and `round_to_mintick` ARE here. They were
 * previously excluded on the grounds that they had no v1–v4 spelling to inherit
 * from; TradingView's v4 release notes list all four as v4 additions, so they
 * are ordinary renames like the rest of the library. See ./math.ts.
 */
const MATH = group("math", [
    "abs", "acos", "asin", "atan", "avg", "ceil", "cos", "exp", "floor", "log",
    "log10", "max", "min", "pow", "round", "sign", "sin", "sqrt", "sum", "tan",
    "random", "todegrees", "toradians", "round_to_mintick",
]);

/**
 * Data requests.
 *
 * Only `security` is a RENAME — the rest of `request.*` has no v1–v4 spelling
 * to inherit from, so `financial`, `quandl`, `dividends`, `splits` and
 * `earnings` are implemented directly in ./request.ts and reach v5 through
 * V5_ONLY_NAMESPACES instead.
 */
const REQUEST: RenameSpec[] = [{ to: "request.security", from: "security" }];

/**
 * Chart-type ticker constructors, plus `tickerid()` → `ticker.new()`.
 *
 * `ticker.new` inherits `syminfo.tickerid`, which is v4's spelling of the same
 * registry entry. That conflation predates v5: TradingView keeps the ticker-id
 * STRING (`syminfo.tickerid`) apart from the FUNCTION that builds one
 * (`tickerid()` / `ticker.new()`), and this engine has always had one entry
 * doing both jobs. Carried forward rather than fixed here, because fixing it is
 * a change to v4's behaviour and belongs in its own change.
 */
const TICKER: RenameSpec[] = [
    { to: "ticker.heikinashi", from: "heikinashi" },
    { to: "ticker.new", from: "syminfo.tickerid" },
    // The non-standard chart types. All four are documented on the v3 page as
    // well as the v4 one, so they are v1–v4 flat names that v5 namespaced —
    // the same shape as heikinashi. Their implementations refuse rather than
    // approximate; see runtime/v1/stdlib/chart.ts.
    { to: "ticker.renko", from: "renko" },
    { to: "ticker.linebreak", from: "linebreak" },
    { to: "ticker.kagi", from: "kagi" },
    { to: "ticker.pointfigure", from: "pointfigure" },
];

/** Strings. The rest of `str.*` is new at v5 and lives in ./str.ts. */
const STR: RenameSpec[] = [{ to: "str.tostring", from: "tostring" }];

/**
 * Namespaces that exist ONLY from v5, and are therefore removed from the v1–v4
 * registry views.
 *
 * They live in the ordinary stdlib source files — the runtime is one
 * implementation across versions by design — so without this list the generator
 * would make `str.length` and `matrix.new` resolvable at v1, where TradingView
 * reports `Undeclared identifier`.
 *
 * Dates, from the v5 release notes:
 *   str, math, ta, request, ticker, log, runtime   v5 launch
 *   matrix                                          May 2022
 *   map                                             August 2023
 *
 * `ta`, `math` and `ticker` carry no generated keys of their own — every member
 * arrives as an ALIAS — so listing them removes nothing today. They are here so
 * that a future `ta.*` implemented directly rather than aliased is gated by
 * default rather than by remembering to.
 */
export const V5_ONLY_NAMESPACES: readonly string[] = [
    "str", "math", "matrix", "map", "log", "runtime", "ta", "request", "ticker",
];

/**
 * EXACT keys that exist only from v5 — the typed input functions, and the
 * dataset-extent variables.
 *
 * Separate from V5_ONLY_NAMESPACES because `input.*` is not a v5-only
 * namespace: v4 has `input.float` as a CONSTANT and v5 has it as a FUNCTION, so
 * gating the whole root would take v4's constants away with it. See the header
 * of ./inputs.ts for how one runtime object serves both readings.
 */
export const V5_ONLY_NAMES: readonly string[] = [
    "input.int", "input.float", "input.bool", "input.string", "input.color",
    "input.timeframe", "input.session", "input.symbol", "input.source",
    "input.time", "input.price", "input.text_area",

    // Added December 2021, per the v5 release notes: "Added new built-in
    // variables that return the bar_index and time values of the last bar in
    // the dataset. Their values are known at the beginning of the script's
    // calculation." Flat names rather than a namespace, so they are listed
    // here rather than in V5_ONLY_NAMESPACES. See ./dataset.ts.
    "last_bar_index", "last_bar_time", "hlcc4",
];

export const V5_RENAMES: readonly RenameSpec[] = [
    ...TA,
    ...MATH,
    ...REQUEST,
    ...TICKER,
    ...STR,
];

/**
 * v4 spellings that v5 removes with NO replacement of the same meaning.
 *
 * `iff(cond, t, f)` becomes the ternary `cond ? t : f`, and `offset(x, n)`
 * becomes `x[n]` — neither is a rename, so neither can be an alias. `offset` is
 * absent from the list because it is absent from the registry at every version.
 *
 * The two `input.*` entries are removals of a different kind: the CONSTANT is
 * gone and a FUNCTION of a different name replaced it (`integer` → `int`,
 * `resolution` → `timeframe`, §4c). The other six constants keep their
 * spelling, so they are not removed — they are re-declared as functions by
 * V5_ONLY_NAMES above.
 */
const V5_DROPPED: readonly string[] = ["iff", "input.integer", "input.resolution"];

/**
 * Every v4 spelling that is not writable at v5.
 *
 * The `from` side of every rename above, plus the outright removals. Removal is
 * what makes a v5 script fail on `sma(close, 20)` the way TradingView does,
 * instead of silently accepting both dialects — which is the failure mode this
 * whole table exists to prevent.
 */
export const V5_REMOVED: readonly string[] = (() => {
    const removed = new Set(
        V5_RENAMES.map(r => r.from).filter((f): f is string => Boolean(f)),
    );
    for (const name of V5_DROPPED) removed.add(name);

    // `syminfo.tickerid` is the SOURCE of `ticker.new` but survives v5 under its
    // own spelling: it is a live v5 variable, and only the FUNCTION moved. See
    // the note on TICKER above for why one entry currently serves both.
    removed.delete("syminfo.tickerid");

    return [...removed];
})();
