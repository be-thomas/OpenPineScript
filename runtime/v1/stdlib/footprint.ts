/**
 * `request.footprint()` and the `footprint` / `volume_row` types — v6,
 * January 2026.
 *
 * Signature and semantics, from the user manual ("Other timeframes and data",
 * request.footprint()):
 *
 *   request.footprint(ticks_per_row, va_percent, imbalance_percent) → series footprint
 *
 *   ticks_per_row      "simple int": row size as a multiple of syminfo.mintick
 *   va_percent         "simple float", default 70: share of total volume in the
 *                      Value Area
 *   imbalance_percent  "simple float", default 300: the buy/sell difference
 *                      against an adjacent row that makes an imbalance
 *
 * "Returns a footprint ID, or na if no footprint is available for the bar."
 * "Scripts can make only one request.footprint() call. Multiple calls cause a
 * runtime error."
 *
 * ── Where the data comes from ──────────────────────────────────────────────
 *
 * Volume at price is not in an OHLCV bar, so the host supplies it, the way it
 * supplies higher-timeframe candles: Context.provideFootprints, as volume per
 * price LEVEL. This module groups levels into rows of `ticks_per_row` ticks and
 * derives everything else — POC, Value Area, imbalances — from them.
 *
 * A script that requests footprints from a host that supplied none is refused,
 * with the call that would fix it, which is the rule every other `request.*`
 * here follows (./request.ts). A bar the host has no footprint for is `na`, as
 * documented.
 *
 * ── Not documented, so chosen and stated ───────────────────────────────────
 *
 *   Row bounds     [k·size, (k+1)·size) — `down_price` is the row's floor and
 *                  `up_price` its ceiling.
 *   POC tie        the LOWER row, when two rows share the highest volume.
 *   Value Area     grown one row at a time from the POC, taking whichever
 *                  neighbour has more volume (the upper on a tie), until it
 *                  holds `va_percent` of the bar's volume.
 *   Imbalance      "exceeds ... by the given percentage" is read as a RATIO:
 *                  300 means at least three times the other row's volume, and
 *                  a row with no volume on the relevant side is no imbalance.
 *
 * These want a TradingView-captured fixture before they are trusted for
 * numbers.
 */
import { Context } from "../context";
import { val } from "../../../utils/v2/common";
import { buildFootprint, type Footprint, type Row } from "../footprint";

/** The footprint or row `id`, which "does not accept na". */
function must<T>(id: any, fn: string, kind: "footprint" | "volume_row"): T {
    const v = val(id);
    if (v === null || v === undefined || (typeof v === "number" && Number.isNaN(v)) || v.__builtin !== kind) {
        throw new Error(`${fn}: the ${kind} id cannot be na.`);
    }
    return v as T;
}

export const request = {
    /** See the header for the signature and for what is documented. */
    footprint: (ctx: Context, ticks_per_row: any, va_percent: any = 70, imbalance_percent: any = 300): any => {
        ctx.countFootprintRequest();
        const levels = ctx.getFootprintLevels();
        const ticks = Math.trunc(Number(val(ticks_per_row)));
        if (!(ticks > 0)) throw new Error(`request.footprint: ticks_per_row must be a positive int, got ${val(ticks_per_row)}.`);
        if (levels === null) return NaN;
        const fp = buildFootprint(levels, ticks * ctx.mintick, Number(val(va_percent)), Number(val(imbalance_percent)));
        return fp ?? NaN;
    },
};

export const footprint = {
    total_volume: (id: any): number => {
        const f = must<Footprint>(id, "footprint.total_volume", "footprint");
        return f.rows.reduce((s, r) => s + r.buy + r.sell, 0);
    },
    buy_volume: (id: any): number =>
        must<Footprint>(id, "footprint.buy_volume", "footprint").rows.reduce((s, r) => s + r.buy, 0),
    sell_volume: (id: any): number =>
        must<Footprint>(id, "footprint.sell_volume", "footprint").rows.reduce((s, r) => s + r.sell, 0),
    delta: (id: any): number => {
        const f = must<Footprint>(id, "footprint.delta", "footprint");
        return f.rows.reduce((s, r) => s + r.buy - r.sell, 0);
    },
    /** The row with the highest total volume — the Point of Control. */
    poc: (id: any): Row => must<Footprint>(id, "footprint.poc", "footprint").poc,
    /** The Value Area High row. */
    vah: (id: any): Row => must<Footprint>(id, "footprint.vah", "footprint").vah,
    /** The Value Area Low row. */
    val: (id: any): Row => must<Footprint>(id, "footprint.val", "footprint").val,
    /** "Every row, sorted by ascending price." A copy, so a script cannot reorder the footprint. */
    rows: (id: any): Row[] => [...must<Footprint>(id, "footprint.rows", "footprint").rows],
};

export const volume_row = {
    up_price: (id: any): number => must<Row>(id, "volume_row.up_price", "volume_row").up,
    down_price: (id: any): number => must<Row>(id, "volume_row.down_price", "volume_row").down,
    buy_volume: (id: any): number => must<Row>(id, "volume_row.buy_volume", "volume_row").buy,
    sell_volume: (id: any): number => must<Row>(id, "volume_row.sell_volume", "volume_row").sell,
    total_volume: (id: any): number => {
        const r = must<Row>(id, "volume_row.total_volume", "volume_row");
        return r.buy + r.sell;
    },
    delta: (id: any): number => {
        const r = must<Row>(id, "volume_row.delta", "volume_row");
        return r.buy - r.sell;
    },
    has_buy_imbalance: (id: any): boolean =>
        must<Row>(id, "volume_row.has_buy_imbalance", "volume_row").buyImbalance,
    has_sell_imbalance: (id: any): boolean =>
        must<Row>(id, "volume_row.has_sell_imbalance", "volume_row").sellImbalance,
};
