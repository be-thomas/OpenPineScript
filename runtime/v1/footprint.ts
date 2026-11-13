/**
 * Footprint construction for `request.footprint()` — the rows, POC, Value Area
 * and imbalances, from the volume-per-level a host supplies.
 *
 * Outside stdlib/ deliberately: every export of a stdlib module is published
 * as a Pine built-in, and this is a helper. The documented rules, and the
 * undocumented choices made here, are listed in ./stdlib/footprint.ts.
 */
/** One price level as the host supplies it. */
export interface FootprintLevel {
    price: number;
    buy: number;
    sell: number;
}

export interface Row {
    __builtin: "volume_row";
    down: number;
    up: number;
    buy: number;
    sell: number;
    buyImbalance: boolean;
    sellImbalance: boolean;
}

export interface Footprint {
    __builtin: "footprint";
    rows: Row[];
    poc: Row;
    vah: Row;
    val: Row;
}

/** Groups levels into rows and derives the footprint, or null when empty. */
export function buildFootprint(
    levels: readonly FootprintLevel[], rowSize: number, vaPercent: number, imbalancePercent: number,
): Footprint | null {
    if (!(rowSize > 0) || levels.length === 0) return null;
    const byRow = new Map<number, Row>();
    for (const l of levels) {
        // A hair of tolerance, so a level exactly on a row boundary is not sent
        // to the row below by floating-point error in price / size.
        const k = Math.floor(l.price / rowSize + 1e-9);
        const row = byRow.get(k) ?? {
            __builtin: "volume_row" as const, down: k * rowSize, up: (k + 1) * rowSize,
            buy: 0, sell: 0, buyImbalance: false, sellImbalance: false,
        };
        row.buy += Number(l.buy) || 0;
        row.sell += Number(l.sell) || 0;
        byRow.set(k, row);
    }
    // Every row between the lowest and highest traded price, including those
    // with no volume: a footprint is a ladder of price rows, and dropping the
    // empty ones made rows that are not adjacent in price look adjacent — so
    // the imbalance and Value Area rules compared the wrong neighbours.
    const keys = [...byRow.keys()];
    const lowest = Math.min(...keys), highest = Math.max(...keys);
    const rows: Row[] = [];
    for (let k = lowest; k <= highest; k++) {
        rows.push(byRow.get(k) ?? {
            __builtin: "volume_row", down: k * rowSize, up: (k + 1) * rowSize,
            buy: 0, sell: 0, buyImbalance: false, sellImbalance: false,
        });
    }
    const total = (r: Row) => r.buy + r.sell;

    let pocIndex = 0;
    rows.forEach((r, i) => { if (total(r) > total(rows[pocIndex])) pocIndex = i; });

    const target = rows.reduce((s, r) => s + total(r), 0) * vaPercent / 100;
    let lo = pocIndex, hi = pocIndex, inArea = total(rows[pocIndex]);
    while (inArea < target && (lo > 0 || hi < rows.length - 1)) {
        const above = hi + 1 < rows.length ? total(rows[hi + 1]) : -1;
        const below = lo > 0 ? total(rows[lo - 1]) : -1;
        if (above >= below) inArea += total(rows[++hi]);
        else inArea += total(rows[--lo]);
    }

    const ratio = imbalancePercent / 100;
    rows.forEach((r, i) => {
        // "a row has a buy imbalance when its buy volume exceeds the sell volume
        // of the row below by the given percentage", and a sell imbalance when
        // its sell volume exceeds the buy volume of the row above.
        const below = rows[i - 1], above = rows[i + 1];
        // Both sides must have volume: with nothing on the other side there is
        // no ratio to exceed, which is the rule stated in the module header.
        r.buyImbalance = !!below && r.buy > 0 && below.sell > 0 && r.buy >= below.sell * ratio;
        r.sellImbalance = !!above && r.sell > 0 && above.buy > 0 && r.sell >= above.buy * ratio;
    });

    return { __builtin: "footprint", rows, poc: rows[pocIndex], vah: rows[hi], val: rows[lo] };
}

