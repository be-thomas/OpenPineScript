/**
 * The v5 → v6 registry delta.
 *
 * ── Why there is no rename table ───────────────────────────────────────────
 *
 * v4 and v5 were each, in bulk, a renaming: `sma` → `ta.sma`, `red` →
 * `color.red`. v6 renames NOTHING. Every v5 spelling is still a v6 spelling,
 * which is why this file has no `RenameSpec[]` and why `V6_VIEW` is built with
 * an empty rename step.
 *
 * What v6 does to the registry instead is:
 *
 *   ADD     new built-ins, from the launch notes and the two years of monthly
 *           releases after it — V6_ONLY_NAMES / V6_ONLY_NAMESPACES below
 *   CHANGE  the VALUE of three colour constants and one default — handled at
 *           the point of use, not here, because the key is unchanged
 *   REMOVE  nothing that is a NAME
 *
 * ── Why V6_REMOVED is empty rather than absent ─────────────────────────────
 *
 * The migration guide does remove things: `transp` from six plotting
 * functions, `when` from seven strategy functions. Neither is a registry key.
 * They are PARAMETERS, and a parameter is removed by refusing it at the call
 * site, where the error can name the argument and the line — which is
 * transpiler/v6/ToJsVisitor.ts.
 *
 * The empty array is kept, and spread, so that `V6_VIEW` reads the same as
 * `V4_VIEW` and `V5_VIEW` and so that the question "did v6 take a name away?"
 * has an answer in the code rather than in a reader's memory.
 *
 * ── Source ─────────────────────────────────────────────────────────────────
 *
 * https://www.tradingview.com/pine-script-docs/migration-guides/to-pine-version-6/
 * https://www.tradingview.com/pine-script-docs/release-notes/
 */

/**
 * Namespaces that exist only from v6. A member of one of these must not
 * resolve at v1–v5, however completely it is implemented in the shared
 * stdlib — the same gate `V5_ONLY_NAMESPACES` applies to `str.*` and
 * `matrix.*`.
 */
export const V6_ONLY_NAMESPACES: readonly string[] = [
    // January 2026: the footprint types' function families.
    "footprint", "volume_row",
];

/**
 * Individual names that arrive at v6, for namespaces that already existed.
 *
 * Listed by name rather than by namespace because every one of these joins a
 * namespace v5 already has — `request.footprint()` is new, `request.*` is not
 * — so gating the root would take the whole namespace out of v5 with it.
 */
export const V6_ONLY_NAMES: readonly string[] = [
    // MG §"Excess orders are trimmed".
    "strategy.closedtrades.first_index",

    // Release notes, November 2024: text formatting.
    "text.format_none", "text.format_bold", "text.format_italic",
    "label.set_text_formatting", "box.set_text_formatting", "table.cell_set_text_formatting",

    // November 2024.
    "syminfo.mincontract", "syminfo.main_tickerid", "timeframe.main_period",
    // February 2025.
    "bid", "ask",
    // March 2025.
    "box.set_xloc",
    // July 2025.
    "syminfo.current_contract",
    // September 2025.
    "plot.linestyle_solid", "plot.linestyle_dashed", "plot.linestyle_dotted",
    // November 2025.
    "syminfo.isin",
    // January 2026. `request` is a v5 namespace, so the member is listed.
    "request.footprint",
];

/**
 * The v6 POSITIONAL order of functions whose shared signature differs from it,
 * by parameter name. Read by Context.positionalForVersion.
 *
 * The shared stdlib keeps one signature per function, the union of every
 * version's, and v6 removed parameters from the middle of several — `transp`
 * (MG §"The transp parameter is removed") and `when` (§"Removal of when
 * parameter"). Opening a one-slot gap where each was assumed the rest already
 * matched v6, and it did not: `fill()` has no `show_last`, and
 * `strategy.entry`'s tenth v6 argument, `disable_alert`, landed in a broker
 * internal. Mapping BY NAME has no such assumption: the n-th positional
 * argument is the n-th name here, wherever the shared function keeps it, and a
 * name the shared function lacks is dropped and recorded like any unknown
 * argument.
 *
 * Names are the shared function's where they differ only in spelling — the
 * engine's `strategy.order` calls its direction `dir`.
 */
export const V6_POSITIONAL: Readonly<Record<string, readonly string[]>> = {
    "plot": ["series", "title", "color", "linewidth", "style", "trackprice", "histbase",
             "offset", "join", "editable", "show_last", "display", "format", "precision",
             "force_overlay", "linestyle"],
    "plotshape": ["series", "title", "style", "location", "color", "offset", "text",
                  "textcolor", "editable", "size", "show_last", "display", "format",
                  "precision", "force_overlay"],
    "plotchar": ["series", "title", "char", "location", "color", "offset", "text",
                 "textcolor", "editable", "size", "show_last", "display", "format",
                 "precision", "force_overlay"],
    "bgcolor": ["color", "offset", "editable", "show_last", "title", "display", "force_overlay"],
    "fill": ["plot1", "plot2", "color", "title", "editable", "show_last", "fillgaps", "display"],
    "strategy.entry": ["id", "direction", "qty", "limit", "stop", "oca_name", "oca_type",
                       "comment", "alert_message", "disable_alert"],
    "strategy.order": ["id", "dir", "qty", "limit", "stop", "oca_name", "oca_type",
                       "comment", "alert_message", "disable_alert"],
    "strategy.exit": ["id", "from_entry", "qty", "qty_percent", "profit", "limit", "loss",
                      "stop", "trail_price", "trail_points", "trail_offset", "oca_name",
                      "comment", "comment_profit", "comment_loss", "comment_trailing",
                      "alert_message", "alert_profit", "alert_loss", "alert_trailing",
                      "disable_alert"],
    "strategy.close": ["id", "comment", "qty", "qty_percent", "alert_message", "immediately",
                       "disable_alert"],
    "strategy.close_all": ["comment", "alert_message", "immediately", "disable_alert"],
    "strategy.cancel": ["id"],
};

/** Spellings v6 takes away. See the header: there are none. */
export const V6_REMOVED: readonly string[] = [];

/**
 * Parameters v6 added to functions that earlier versions already have,
 * keyed by registry name.
 *
 * Not a registry key, so not a view: the FUNCTION exists at every version and
 * only its signature grew. Context.call reads this when binding keyword
 * arguments, and below v6 a listed name is dropped and recorded as unknown —
 * exactly the treatment it got before it was added.
 */
export const V6_ONLY_PARAMS: Readonly<Record<string, readonly string[]>> = {
    // November 2024.
    "label.new": ["text_formatting"],
    "box.new": ["text_formatting"],
    "table.cell": ["text_formatting"],
    // July 2025: "Added to all input*() functions."
    "input": ["active"],
    "input.int": ["active"],
    "input.float": ["active"],
    "input.bool": ["active"],
    "input.string": ["active"],
    "input.color": ["active"],
    "input.timeframe": ["active"],
    "input.session": ["active"],
    "input.symbol": ["active"],
    "input.source": ["active"],
    "input.time": ["active"],
    "input.price": ["active"],
    "input.text_area": ["active"],
    "input.enum": ["active"],
    // September 2025.
    "plot": ["linestyle"],
    // October 2025.
    "time": ["timeframe_bars_back"],
    "time_close": ["timeframe_bars_back"],
    // April 2026.
    "array.sort": ["sort_field"],
    "matrix.sort": ["sort_field"],
    // August 2026.
    "array.binary_search": ["sort_field"],
};
