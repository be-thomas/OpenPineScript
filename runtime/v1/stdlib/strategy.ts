import type { Context, Trade } from "../context";

/**
 * strategy.ts - Backtesting Engine Logic
 *
 * Implements: entry, exit, order, close, cancel, pending order matching,
 * OCA groups (cancel / reduce / none), and strategy.risk.* circuit breakers.
 */

// --- EXPORT FLAT CONSTANTS FOR PINE SCRIPT ---
export const long = "long";
export const short = "short";

/**
 * strategy.commission.* — how `commission_value` is interpreted.
 *
 *     strategy("X", commission_type=strategy.commission.percent,
 *                   commission_value=0.1)
 *
 * Nested under `strategy`, not a top-level `commission` namespace — that is
 * where Pine puts it, and a top-level constant would leave
 * `strategy.commission.percent` undefined at runtime.
 */
export const commission = {
    /** A percentage of the position's cash value. */
    percent: "commission.percent",
    /** A fixed amount per contract/share filled. */
    cash_per_contract: "commission.cash_per_contract",
    /** A fixed amount per order, regardless of size. */
    cash_per_order: "commission.cash_per_order",
};

export const direction = {
    long: long,
    short: short
};

/**
 * The same object, under a name a PARAMETER cannot shadow.
 *
 * `strategy.entry`'s second parameter is called `direction` — that is the name
 * the keyword form uses, and the registry records parameter names — which puts
 * a string in front of this object inside that function. `isLong` then compared
 * against `undefined`, every entry became a SHORT, and the only sign of it was
 * an inverted equity curve.
 */
const DIR = direction;

// --- OCA CONSTANTS ---
export const oca = {
    cancel: "cancel",
    reduce: "reduce",
    none:   "none"
};

// Helper to safely unwrap Series objects into primitive numbers
function val(x: any): number {
    return (x !== null && x !== undefined && typeof x.valueOf === 'function') ? Number(x.valueOf()) : Number(x);
}

// --- Pending Order Queue Interfaces ---

export interface PendingExit {
    id: string;
    from_entry: string;
    qty: number;
    qty_percent: number;
    /** Profit target, in PRICE. */
    limit: number;
    /** Stop loss, in PRICE. */
    stop: number;
    /** Profit target, in TICKS from the entry. */
    profit: number;
    /** Stop loss, in TICKS from the entry. */
    loss: number;
    /** Trailing-stop activation level, in PRICE. */
    trail_price: number;
    /** Trailing-stop activation offset, in TICKS from the entry. */
    trail_points: number;
    /** How far behind the extreme the trailing stop follows, in TICKS. */
    trail_offset: number;
    /** The best price seen since the trail armed, or NaN while it has not. */
    trail_peak: number;
    /** The bar this order was first registered on. See `livesYet`. */
    placedBar: number;
    oca_name: string;
}

export interface PendingEntry {
    id: string;
    dir: string;
    qty: number;
    limit: number;
    stop: number;
    /** The bar this order was first registered on. See `livesYet`. */
    placedBar: number;
    oca_name: string;
    oca_type: string;
}

function getPendingExits(ctx: Context): Map<string, PendingExit> {
    if (!(ctx as any)._pendingExits) {
        (ctx as any)._pendingExits = new Map<string, PendingExit>();
    }
    return (ctx as any)._pendingExits;
}

function getPendingEntries(ctx: Context): Map<string, PendingEntry> {
    if (!(ctx as any)._pendingEntries) {
        (ctx as any)._pendingEntries = new Map<string, PendingEntry>();
    }
    return (ctx as any)._pendingEntries;
}

// --- RISK MANAGEMENT STATE ---

interface RiskState {
    // Configured limits
    max_intraday_loss: number;
    max_intraday_loss_type: string;
    max_intraday_filled_orders: number;
    max_drawdown: number;
    max_drawdown_type: string;
    max_cons_loss_days: number;
    max_position_size: number;
    allow_entry_in: string; // "long" | "short" | "all"

    // Tracking state
    start_equity: number;
    peak_equity: number;
    last_day: number;
    daily_filled_orders: number;
    cons_loss_days: number;
    prev_day_equity: number;
    last_settled_day: number;
    is_halted: boolean;
}

function getRiskState(ctx: Context): RiskState {
    if (!(ctx as any)._riskState) {
        (ctx as any)._riskState = {
            max_intraday_loss: Number.NaN,
            max_intraday_loss_type: "cash",
            max_intraday_filled_orders: Infinity,
            max_drawdown: Number.NaN,
            max_drawdown_type: "percent",
            max_cons_loss_days: Infinity,
            max_position_size: Infinity,
            allow_entry_in: "all",

            start_equity: ctx.cash,
            peak_equity: ctx.cash,
            last_day: -1,
            daily_filled_orders: 0,
            cons_loss_days: 0,
            prev_day_equity: ctx.cash,
            last_settled_day: -1,
            is_halted: false
        } as RiskState;
    }
    return (ctx as any)._riskState;
}

/**
 * strategy.risk namespace
 */
export const risk = {
    max_intraday_loss: (ctx: Context, value: any, type: string = "cash") => {
        const state = getRiskState(ctx);
        state.max_intraday_loss = val(value);
        state.max_intraday_loss_type = type;
    },

    max_intraday_filled_orders: (ctx: Context, count: any) => {
        const state = getRiskState(ctx);
        state.max_intraday_filled_orders = val(count);
    },

    max_drawdown: (ctx: Context, value: any, type: string = "percent") => {
        const state = getRiskState(ctx);
        state.max_drawdown = val(value);
        state.max_drawdown_type = type;
    },

    max_cons_loss_days: (ctx: Context, count: any) => {
        const state = getRiskState(ctx);
        state.max_cons_loss_days = val(count);
    },

    max_position_size: (ctx: Context, size: any) => {
        const state = getRiskState(ctx);
        state.max_position_size = val(size);
    },

    allow_entry_in: (ctx: Context, dir: string) => {
        const state = getRiskState(ctx);
        state.allow_entry_in = dir; // "long", "short", or strategy.direction.long / .short
    }
};

// --- DAY TRANSITION & RISK SYNC ---

function syncRiskState(ctx: Context): RiskState {
    const rs = getRiskState(ctx);
    const date = new Date(ctx.time);
    const day = date.getUTCDate();

    if (day !== rs.last_day) {
        // Settle the previous day: check if it was a losing day
        if (rs.last_day !== -1) {
            const eod_equity = equity(ctx);
            if (eod_equity < rs.prev_day_equity) {
                rs.cons_loss_days++;
            } else {
                rs.cons_loss_days = 0;
            }
            rs.prev_day_equity = eod_equity;
        }

        rs.last_day = day;
        rs.start_equity = equity(ctx);
        rs.daily_filled_orders = 0;
        rs.is_halted = false;
    }

    // Track peak equity for max_drawdown
    const cur = equity(ctx);
    if (cur > rs.peak_equity) rs.peak_equity = cur;

    return rs;
}

/**
 * Checks all risk rules and returns true if the engine should be halted.
 * Does NOT liquidate — caller decides what to do.
 */
function checkRiskHalt(ctx: Context, rs: RiskState): boolean {
    if (rs.is_halted) return true;

    // 1. Max consecutive loss days
    if (rs.cons_loss_days >= rs.max_cons_loss_days) {
        rs.is_halted = true;
        return true;
    }

    // 2. Max drawdown (from peak equity)
    if (!Number.isNaN(rs.max_drawdown)) {
        const cur = equity(ctx);
        if (rs.max_drawdown_type === "percent") {
            const ddPct = rs.peak_equity > 0 ? ((rs.peak_equity - cur) / rs.peak_equity) * 100 : 0;
            if (ddPct >= rs.max_drawdown) {
                rs.is_halted = true;
                return true;
            }
        } else {
            const ddCash = rs.peak_equity - cur;
            if (ddCash >= rs.max_drawdown) {
                rs.is_halted = true;
                return true;
            }
        }
    }

    return false;
}

// --- CORE EXECUTIONS ---

/**
 * `when` — the v1–v4 way of gating an order.
 *
 * "when (bool) Condition. If it is false, the command is ignored." v5 removed
 * the parameter in favour of an `if` block, but every strategy function carried
 * it before that, and six of TradingView's own v4 examples use it —
 * `strategy.entry("buy", strategy.long, 4, when = strategy.position_size <= 0)`.
 *
 * The parameter was in none of these signatures, so `Context.call` dropped it
 * and the order fired UNCONDITIONALLY. A strategy that should have entered once
 * entered on every bar, and the equity curve was wrong with nothing to say so.
 *
 * Absent means true, which is the documented default.
 */
function gated(when: any): boolean {
    if (when === undefined || when === null) return true;
    const v = val(when);
    if (v === null || v === undefined) return false;
    if (typeof v === "number") return !Number.isNaN(v) && v !== 0;
    return Boolean(v);
}


/**
 * Registers a pending entry order (Limit or Stop).
 */
export function order(
    ctx: Context,
    id: string,
    dir: string,
    qty: any = 1,
    limit: any = Number.NaN,
    stop: any = Number.NaN,
    oca_name: string = "",
    oca_type: string = oca.none,
    comment: string = "",
    when: any = undefined,
    alert_message: string = "",
): void {
    if (!gated(when)) return;
    void comment; void alert_message;

    const lim = val(limit);
    const stp = val(stop);

    // If no limit/stop, it's a market order — execute immediately.
    if (Number.isNaN(lim) && Number.isNaN(stp)) {
        return entry(ctx, id, dir, qty, Number.NaN, Number.NaN, oca_name, oca_type);
    }

    const entries = getPendingEntries(ctx);
    const existing = entries.get(id);
    entries.set(id, {
        id,
        dir,
        qty: val(qty),
        limit: lim,
        stop: stp,
        placedBar: existing ? existing.placedBar : ctx.currentBarIndex,
        oca_name: oca_name || "",
        oca_type: oca_type || oca.none
    });
}

/**
 * A market order the script has placed but the broker has not filled yet.
 *
 * ── Why market orders do not fill on the bar that places them ───────────────
 *
 * TradingView executes a market order at the OPEN of the bar AFTER the one the
 * script placed it on, and `strategy.position_size` read on the placing bar
 * still reports the position as it was. Its own output says so: in
 * conformance/v5/golden/harness_strategy.BTCUSDT.1D.log the entry signal fires
 * on bar 400 while `position_size` stays 0, turns 1 on bar 401, and `equity`
 * moves by exactly `close[401] - open[401]` — the fill is at that bar's open,
 * to the last decimal.
 *
 * The engine used to fill at `close` on the placing bar, which made every
 * backtest one bar early AND filled it at the wrong price. Both errors
 * flattered a signal-following strategy, because the bar a crossover fires on
 * is by construction a bar that already moved.
 *
 * Plain data, not a closure: Context snapshots itself with `structuredClone`
 * for the live-tick baseline, and a queued order has to survive that.
 */
export interface MarketOrder {
    kind: "entry" | "close";
    id: string;
    direction?: string;
    qty?: number;
    comment?: string;
}

/**
 * Fills every market order placed on the previous bar, at this bar's open.
 *
 * Called from `Context.setBar`, which is the only moment that is both after
 * the open is known and before the script runs.
 */
export function fillMarketOrders(ctx: Context): void {
    const queue = ctx.marketOrders;
    if (queue.length === 0) return;
    ctx.marketOrders = [];

    const price = ctx.open;
    for (const o of queue) {
        if (o.kind === "entry") {
            entry(ctx, o.id, o.direction!, o.qty, Number.NaN, Number.NaN,
                  "", oca.none, o.comment ?? "", undefined, "", price);
        } else {
            closeAt(ctx, o.comment ?? "", price);
        }
    }
}

/**
 * Enters a position.
 * If we are in the opposite position, it closes it first (reverses).
 */
export function entry(
    ctx: Context,
    id: string,
    direction: string,
    qty: any = 1,
    limit: any = Number.NaN,
    stop: any = Number.NaN,
    oca_name: string = "",
    oca_type: string = oca.none,
    comment: string = "",
    when: any = undefined,
    alert_message: string = "",
    // Not a Pine parameter. `strategy.order` calls back in here once a pending
    // limit or stop has been triggered, and passes the price it filled at.
    overridePrice?: number,
) {
    if (!gated(when)) return;

    // A limit or stop price makes this a PENDING order rather than a market
    // one — "limit (float) Limit price of the order" — and `strategy.order`
    // already owns that queue.
    const lim = val(limit);
    const stp = val(stop);
    if (overridePrice === undefined && (!Number.isNaN(lim) || !Number.isNaN(stp))) {
        return order(ctx, id, direction, qty, limit, stop, oca_name, oca_type, comment);
    }

    const dir = direction;
    void comment; void alert_message; void oca_name; void oca_type;

    // No fill price means this came from the SCRIPT, and a market order waits
    // for the next bar's open. A price means the broker is filling it now —
    // `fillMarketOrders` draining this queue, `processPendingOrders` matching a
    // limit or stop, or a risk rule liquidating — and those execute in place.
    if (overridePrice === undefined) {
        ctx.marketOrders.push({ kind: "entry", id, direction: dir, qty: val(qty), comment });
        return;
    }

    const rs = syncRiskState(ctx);
    if (rs.is_halted) return;
    if (checkRiskHalt(ctx, rs)) return;

    // max_intraday_filled_orders check
    if (rs.daily_filled_orders >= rs.max_intraday_filled_orders) return;

    const isLong = dir === DIR.long;

    // allow_entry_in check
    if (rs.allow_entry_in !== "all") {
        if (isLong && rs.allow_entry_in !== DIR.long) return;
        if (!isLong && rs.allow_entry_in !== DIR.short) return;
    }

    const currentPrice = toTick(ctx, overridePrice !== undefined ? overridePrice : ctx.close);
    let numQty = val(qty);

    // max_position_size clamp
    if (rs.max_position_size !== Infinity) {
        const currentAbs = Math.abs(ctx.position.size);
        const sameDir = (isLong && ctx.position.size >= 0) || (!isLong && ctx.position.size <= 0);
        if (sameDir) {
            const remaining = rs.max_position_size - currentAbs;
            if (remaining <= 0) return;
            if (numQty > remaining) numQty = remaining;
        }
    }

    // 1. Reverse opposite position
    if (ctx.position.size !== 0) {
        const isCurrentLong = ctx.position.size > 0;
        if (isLong !== isCurrentLong) {
            closeAt(ctx, `Reverse for ${id}`, currentPrice);
        }
    }

    // 2. Execute Entry
    const newQty = isLong ? numQty : -numQty;
    const currentVal = Math.abs(ctx.position.size) * ctx.position.avgPrice;
    const newVal = Math.abs(newQty) * currentPrice;
    const totalQty = Math.abs(ctx.position.size + newQty);

    if (totalQty !== 0) {
        ctx.position.avgPrice = (currentVal + newVal) / totalQty;
    } else {
        ctx.position.avgPrice = currentPrice;
    }

    const wasFlat = ctx.position.size === 0;
    ctx.position.size += newQty;

    // Stamp the OPENING fill only. A pyramided add does not restart the trade,
    // so `strategy.opentrades.entry_bar_index` must keep naming the bar the
    // position began on.
    if (wasFlat) {
        ctx.position.entryBarIndex = ctx.currentBarIndex;
        ctx.position.entryId = id;
    }

    // Track filled orders for intraday limit
    rs.daily_filled_orders++;
}

/**
 * Closes a specific position or all positions.
 */
export function close(
    ctx: Context, id: string, when: any = undefined, comment: string = "",
    qty: any = Number.NaN, qty_percent: any = Number.NaN, alert_message: string = "",
) {
    if (!gated(when)) return;
    void qty; void qty_percent; void alert_message;
    close_all(ctx, comment || `Close ${id}`);
}

export function close_all(
    ctx: Context, comment: string = "", when: any = undefined, alert_message: string = "",
) {
    if (!gated(when)) return;
    void alert_message;
    // Queued, not filled — see MarketOrder. A caller that already knows the
    // fill price calls `closeAt` instead.
    ctx.marketOrders.push({ kind: "close", id: comment, comment });
}

/**
 * Flattens the position at a KNOWN price, now.
 *
 * The execution half of `close_all`, split out so the broker's own paths —
 * draining the market queue at the open, reversing inside an entry, a risk
 * rule liquidating at a computed level — are not routed back through the
 * queue they are supposed to be servicing.
 */
export function closeAt(ctx: Context, comment: string, price: number): void {
    if (ctx.position.size === 0) return;

    const currentPrice = toTick(ctx, price);
    const qty = Math.abs(ctx.position.size);
    const isLong = ctx.position.size > 0;

    let pnl = 0;
    if (isLong) {
        pnl = (currentPrice - ctx.position.avgPrice) * qty;
    } else {
        pnl = (ctx.position.avgPrice - currentPrice) * qty;
    }

    const trade: Trade = {
        id: comment || "Close",
        entryTime: 0,
        entryPrice: ctx.position.avgPrice,
        exitTime: ctx.time,
        exitPrice: currentPrice,
        qty: qty,
        pnl: pnl,
        direction: isLong ? "long" : "short"
    };

    ctx.trades.push(trade);
    ctx.cash += pnl;

    ctx.position.size = 0;
    ctx.position.avgPrice = 0;
    ctx.position.entryBarIndex = undefined;
    ctx.position.entryId = undefined;
    getPendingExits(ctx).clear();
}

/**
 * Cancels a pending order by ID.
 */
export function cancel(ctx: Context, id: string, when: any = undefined): void {
    if (!gated(when)) return;
    getPendingEntries(ctx).delete(id);
    getPendingExits(ctx).delete(id);
}

/**
 * Cancels all pending orders.
 */
export function cancel_all(ctx: Context): void {
    getPendingEntries(ctx).clear();
    getPendingExits(ctx).clear();
}

// --- EXITS & MATCHING ENGINE ---

/**
 * Registers a Take Profit / Stop Loss bracket order into the pending queue.
 */
export function exit(
    ctx: Context,
    id: string,
    from_entry: string = "",
    qty: any = Number.NaN,
    // "The percentage of the position to close … Ignored if `qty` is not na."
    qty_percent: any = Number.NaN,
    profit: any = Number.NaN,
    limit: any = Number.NaN,
    loss: any = Number.NaN,
    stop: any = Number.NaN,
    trail_price: any = Number.NaN,
    trail_points: any = Number.NaN,
    trail_offset: any = Number.NaN,
    oca_name: string = "",
    comment: string = "",
    when: any = undefined,
    alert_message: string = "",
): void {
    if (!gated(when)) return;
    void comment; void alert_message;
    const exits = getPendingExits(ctx);
    const existing = exits.get(id);
    exits.set(id, {
        id,
        from_entry,
        qty: val(qty),
        qty_percent: val(qty_percent),
        limit: val(limit),
        stop: val(stop),
        profit: val(profit),
        loss: val(loss),
        trail_price: val(trail_price),
        trail_points: val(trail_points),
        trail_offset: val(trail_offset),
        // A script re-issues the same `strategy.exit` call on every bar, so the
        // trail's high-water mark has to survive the re-registration or it would
        // reset each time and the stop would never move.
        trail_peak: existing ? existing.trail_peak : Number.NaN,
        // Set when the order is CREATED and carried across re-registration. A
        // script re-issues `strategy.exit` every bar, and restamping it here
        // would hold it one bar behind the market forever — it would never
        // become live at all.
        placedBar: existing ? existing.placedBar : ctx.currentBarIndex,
        oca_name: oca_name || ""
    });
}

/**
 * The prices one pending exit would fill at, on the bar just seen.
 *
 * ── Ticks and prices are different parameters ───────────────────────────────
 *
 * `strategy.exit` takes a profit target twice: `limit` is a PRICE and `profit`
 * is a distance in TICKS from the entry. The same for `stop` and `loss`. Only
 * the two price forms were kept — `profit` and `loss` were accepted and then
 * left out of the pending record — so
 *
 *     strategy.exit("bracket1", "buy", 2, profit = 10, stop = 10)
 *
 * (TradingView's own partial-exit demo) armed the stop and silently ignored the
 * target: a bracket with one side missing, which is worse than no bracket.
 *
 * ── Trailing ────────────────────────────────────────────────────────────────
 *
 * "trail_points — trailing stop activation level offset, expressed in ticks"
 * and "trail_offset — trailing stop offset, expressed in ticks". The trail ARMS
 * when price reaches the activation level, and then follows the best price seen
 * since, `trail_offset` ticks behind it. `trail_price` gives the activation
 * level as a price instead of an offset.
 */
function exitLevels(
    ctx: Context, ex: PendingExit, isLong: boolean, high: number, low: number,
): { limit: number; stop: number } {
    const tick = ctx.mintick > 0 ? ctx.mintick : 0.01;
    const entryPrice = ctx.position.avgPrice;
    const away = (ticks: number, favourable: boolean): number =>
        entryPrice + (isLong === favourable ? 1 : -1) * ticks * tick;

    const limit = !Number.isNaN(ex.limit) ? ex.limit
        : !Number.isNaN(ex.profit) ? away(ex.profit, true) : Number.NaN;

    let stop = !Number.isNaN(ex.stop) ? ex.stop
        : !Number.isNaN(ex.loss) ? away(ex.loss, false) : Number.NaN;

    const activation = !Number.isNaN(ex.trail_price) ? ex.trail_price
        : !Number.isNaN(ex.trail_points) ? away(ex.trail_points, true) : Number.NaN;

    if (!Number.isNaN(activation) && !Number.isNaN(ex.trail_offset)) {
        const best = isLong ? high : low;
        const armed = !Number.isNaN(ex.trail_peak)
            || (isLong ? high >= activation : low <= activation);
        if (armed) {
            ex.trail_peak = Number.isNaN(ex.trail_peak) ? best
                : (isLong ? Math.max(ex.trail_peak, best) : Math.min(ex.trail_peak, best));
            const trailing = ex.trail_peak + (isLong ? -1 : 1) * ex.trail_offset * tick;
            // The tighter of the two stops wins — a trailing stop that has moved
            // past the fixed one replaces it.
            stop = Number.isNaN(stop) ? trailing
                : (isLong ? Math.max(stop, trailing) : Math.min(stop, trailing));
        }
    }

    return { limit, stop };
}

// --- OCA HELPERS ---

/**
 * After a pending entry fills, apply OCA logic to other entries in the same group.
 */
function applyEntryOCA(entries: Map<string, PendingEntry>, filledOrder: PendingEntry): void {
    if (!filledOrder.oca_name) return;

    const toDelete: string[] = [];
    for (const [id, ord] of entries.entries()) {
        if (id === filledOrder.id) continue;
        if (ord.oca_name !== filledOrder.oca_name) continue;

        if (filledOrder.oca_type === oca.cancel) {
            toDelete.push(id);
        } else if (filledOrder.oca_type === oca.reduce) {
            ord.qty = Math.max(0, ord.qty - filledOrder.qty);
            if (ord.qty <= 0) toDelete.push(id);
        }
        // oca.none — do nothing
    }
    for (const id of toDelete) entries.delete(id);
}

/**
 * After a pending exit fills, apply OCA logic to other exits in the same group.
 * Exit OCA default is cancel (TradingView behavior: when one TP/SL hits, cancel the other).
 */
function applyExitOCA(exits: Map<string, PendingExit>, filledExit: PendingExit): void {
    if (!filledExit.oca_name) return;

    const toDelete: string[] = [];
    for (const [id, ex] of exits.entries()) {
        if (id === filledExit.id) continue;
        if (ex.oca_name !== filledExit.oca_name) continue;
        toDelete.push(id);
    }
    for (const id of toDelete) exits.delete(id);
}

/**
 * A fill price, snapped to the instrument's minimum tick.
 *
 * "the dataset's minimum tick size, i.e., the smallest increment by which the
 * instrument's recorded prices change" — a fill cannot land between two
 * tradeable prices, and TradingView's does not. Its golden exits export reports
 * an entry at 39030.91 where the bar's own open is 39030.9094208, and an exit
 * at 36056.47 where the open is 36056.4719785.
 *
 * Each rounding is far below the comparison tolerance on a price. It is NOT
 * below it on `strategy.netprofit`, which is a difference of two prices and so
 * carries the same absolute error against a much smaller number — that column
 * is where this showed up, at 1.2e-5 relative.
 *
 * `ctx.mintick` is host-supplied (R-12) and defaults to 0.01, so this is
 * parameterised rather than assumed for one symbol.
 */
function toTick(ctx: Context, price: number): number {
    const tick = Number(ctx.mintick);
    if (!Number.isFinite(tick) || tick <= 0 || !Number.isFinite(price)) return price;
    return Math.round(price / tick) * tick;
}

/**
 * An order's LEVEL, snapped to a tick away from the market.
 *
 * A level is a price the order may not do better than, and it has to land on a
 * tradeable increment. Rounding it to the NEAREST tick can move it closer to
 * the market, which fills the order at a price it never agreed to.
 *
 * TradingView's golden exits export: a long entered at 6985.25 carries a 5%
 * target of 7334.5125, and TradingView reports the exit at 7334.52 — up, not
 * at the nearer 7334.51. `above` says which side of the market the level sits
 * on, so a sell target rounds up and a protective stop rounds down.
 */
function levelToTick(ctx: Context, level: number, above: boolean): number {
    const tick = Number(ctx.mintick);
    if (!Number.isFinite(tick) || tick <= 0 || !Number.isFinite(level)) return level;
    const n = level / tick;
    // Nudge before rounding: 7334.5125/0.01 is 733451.2499999999 in binary
    // floating point, and a bare Math.ceil would take it to the wrong tick.
    const eps = 1e-9;
    return (above ? Math.ceil(n - eps) : Math.floor(n + eps)) * tick;
}

/**
 * The price a triggered order actually fills at.
 *
 * A limit or stop names the WORST price the order accepts, not the price it
 * gets. When the bar has already opened past the level, the level never
 * traded on that bar and the fill happens at the open instead.
 *
 * TradingView's own output, from the golden exits export: a long entered at
 * bar 532's open (38402.15) carries a 3% stop at 37250.08. Bar 533 opens at
 * 36056.47 — below the stop already — and TradingView reports the exit at
 * 36056.47, the open. Filling at the stop, as this used to, books a price
 * that did not trade, and flatters every gap the strategy is caught in.
 *
 * `worseIsHigher` is true for an order that fills by price RISING to it — a
 * sell target or a buy stop — and false for one that fills by price falling.
 */
function fillPrice(level: number, open: number, worseIsHigher: boolean): number {
    if (!Number.isFinite(open)) return level;
    return worseIsHigher ? Math.max(level, open) : Math.min(level, open);
}

/**
 * Is this order allowed to fill on the current bar yet?
 *
 * No, if it was registered on it. A limit or stop placed during bar N starts
 * being matched on bar N+1, the same bar a market order would fill on.
 *
 * TradingView's own output settles it. In the golden exits export a long is
 * entered at bar 401's open (39030.91) and its bracket — a 5% target and a 3%
 * stop — is registered on that same bar. Bar 401's own range (H 39836.03,
 * L 37151.59) dips through the stop at 37859.98 but never reaches the target
 * at 40982.46, so matching against it closes the trade at the stop. Bar 402's
 * range (H 46997.07, L 38034.25) does the opposite: it never touches the stop
 * and runs well past the target. TradingView reports the exit at 40982.46 —
 * the target, on bar 402 — so the placing bar is not matched at all.
 */
function livesYet(ctx: Context, placedBar: number): boolean {
    return placedBar < ctx.currentBarIndex;
}

/**
 * Matches the standing limit and stop orders against this bar's High and Low.
 *
 * Called from `Context.setBar`, BEFORE the script runs on the bar — a fill is
 * already applied by the time the script next executes. See the note there.
 */
export function processPendingOrders(ctx: Context, high: number, low: number): void {
    // Once per bar. `Context.setBar` calls this for every run, and the strategy
    // test harness calls it directly as well; without a guard the second call
    // would fill a pending entry that the first one just placed.
    const state = ctx as any;
    if (state._ordersProcessedBar === ctx.currentBarIndex) return;
    state._ordersProcessedBar = ctx.currentBarIndex;

    const rs = syncRiskState(ctx);

    // --- Max Intraday Loss check ---
    if (!rs.is_halted && !Number.isNaN(rs.max_intraday_loss) && ctx.position.size !== 0) {
        const worstPrice = ctx.position.size > 0 ? low : high;
        const unrealized = (worstPrice - ctx.position.avgPrice) * ctx.position.size;
        const currentEquity = ctx.cash + unrealized;

        let breached = false;
        if (rs.max_intraday_loss_type === "percent") {
            const lossPct = rs.start_equity > 0 ? ((rs.start_equity - currentEquity) / rs.start_equity) * 100 : 0;
            breached = lossPct >= rs.max_intraday_loss;
        } else {
            breached = (rs.start_equity - currentEquity) >= rs.max_intraday_loss;
        }

        if (breached) {
            rs.is_halted = true;

            const targetEquity = rs.max_intraday_loss_type === "percent"
                ? rs.start_equity * (1 - rs.max_intraday_loss / 100)
                : rs.start_equity - rs.max_intraday_loss;
            const liquidationPrice = ctx.position.avgPrice + (targetEquity - ctx.cash) / ctx.position.size;

            // Liquidated AT the level that breaches the limit, not at the
            // close. This used to be done by assigning over `ctx.close` for
            // the duration of the call, which `closeAt` makes unnecessary.
            closeAt(ctx, "Max Intraday Loss Breach", liquidationPrice);

            cancel_all(ctx);
            return;
        }
    }

    // Global risk checks
    if (checkRiskHalt(ctx, rs)) {
        cancel_all(ctx);
        if (ctx.position.size !== 0) closeAt(ctx, "Risk Halt", ctx.open);
        return;
    }

    // If halted from previous bar, block everything
    if (rs.is_halted) {
        cancel_all(ctx);
        if (ctx.position.size !== 0) closeAt(ctx, "Risk Halt", ctx.open);
        return;
    }

    // 1. Process Pending Entries (strategy.order)
    const entries = getPendingEntries(ctx);
    const filledEntryIds: string[] = [];

    for (const [id, ord] of entries.entries()) {
        // Check intraday filled orders limit
        if (rs.daily_filled_orders >= rs.max_intraday_filled_orders) break;
        if (!livesYet(ctx, ord.placedBar)) continue;

        // Snapped the same way an exit's levels are: a level the caller named
        // has to land on a tradeable increment, and rounding it toward the
        // market would fill at a price the order never agreed to. Buying, a
        // limit sits BELOW the market and a stop above; selling, the reverse.
        const buying = ord.dir === direction.long;
        const entryLimit = levelToTick(ctx, ord.limit, !buying);
        const entryStop = levelToTick(ctx, ord.stop, buying);

        let price = Number.NaN;
        if (buying) {
            // A limit waits for the price to FALL to it, a stop for it to
            // rise. Either way the open can have passed it already.
            if (!Number.isNaN(entryLimit) && low <= entryLimit) {
                price = fillPrice(entryLimit, ctx.open, false);
            } else if (!Number.isNaN(entryStop) && high >= entryStop) {
                price = fillPrice(entryStop, ctx.open, true);
            }
        } else {
            if (!Number.isNaN(entryLimit) && high >= entryLimit) {
                price = fillPrice(entryLimit, ctx.open, true);
            } else if (!Number.isNaN(entryStop) && low <= entryStop) {
                price = fillPrice(entryStop, ctx.open, false);
            }
        }

        if (!Number.isNaN(price)) {
            // The fill price goes in the LAST slot now: the Pine signature owns
            // the five before it (`limit`, `stop`, `oca_name`, `oca_type`,
            // `comment`, `when`, `alert_message`).
            entry(ctx, id, ord.dir, ord.qty, Number.NaN, Number.NaN,
                  ord.oca_name, ord.oca_type, "", undefined, "", price);
            filledEntryIds.push(id);
            applyEntryOCA(entries, ord);
        }
    }
    for (const id of filledEntryIds) entries.delete(id);

    // 2. Process Pending Exits (strategy.exit)
    if (ctx.position.size === 0) return;

    const exits = getPendingExits(ctx);
    if (exits.size === 0) return;

    const isLong = ctx.position.size > 0;

    for (const [exitId, pendingExit] of exits.entries()) {
        if (!livesYet(ctx, pendingExit.placedBar)) continue;
        let executedPrice = Number.NaN;

        const level = exitLevels(ctx, pendingExit, isLong, high, low);

        // Closing a long is a SELL: the target sits above the market and the
        // stop below it; closing a short is the mirror image.
        const limitAt = levelToTick(ctx, level.limit, isLong);
        const stopAt = levelToTick(ctx, level.stop, !isLong);

        if (isLong) {
            if (!Number.isNaN(limitAt) && high >= limitAt) {
                executedPrice = fillPrice(limitAt, ctx.open, true);
            } else if (!Number.isNaN(stopAt) && low <= stopAt) {
                executedPrice = fillPrice(stopAt, ctx.open, false);
            }
        } else {
            if (!Number.isNaN(limitAt) && low <= limitAt) {
                executedPrice = fillPrice(limitAt, ctx.open, false);
            } else if (!Number.isNaN(stopAt) && high >= stopAt) {
                executedPrice = fillPrice(stopAt, ctx.open, true);
            }
        }

        if (!Number.isNaN(executedPrice)) {
            executedPrice = toTick(ctx, executedPrice);
            const held = Math.abs(ctx.position.size);
            // "Ignored if `qty` is not na" — an explicit quantity wins over a
            // percentage, and neither given closes the whole position.
            const qty = !Number.isNaN(pendingExit.qty) ? pendingExit.qty
                : !Number.isNaN(pendingExit.qty_percent)
                    ? held * Math.min(100, Math.max(0, pendingExit.qty_percent)) / 100
                    : held;
            const pnl = isLong
                ? (executedPrice - ctx.position.avgPrice) * qty
                : (ctx.position.avgPrice - executedPrice) * qty;

            ctx.trades.push({
                id: `Exit ${exitId}`,
                entryTime: 0,
                entryPrice: ctx.position.avgPrice,
                exitTime: ctx.time,
                exitPrice: executedPrice,
                qty: qty,
                pnl: pnl,
                direction: isLong ? "long" : "short"
            });

            ctx.cash += pnl;
            rs.daily_filled_orders++;

            // Apply OCA logic for exits with named groups
            if (pendingExit.oca_name) {
                applyExitOCA(exits, pendingExit);
            }

            // A PARTIAL exit leaves a position behind. Booking the P&L on
            // `qty` and then flattening regardless made the rest of the
            // position disappear without ever being sold: long 10 at 100 with
            // `strategy.exit("tp", qty_percent = 50, limit = 110)` recorded a
            // 5-contract trade and silently dropped the other five.
            //
            // The average entry price does NOT move — selling part of a
            // position does not change what the remainder cost.
            const remaining = Math.max(0, held - Math.abs(qty));
            // `0`, never `-0`: a flat position compares equal to zero under
            // Object.is, which is what the assertions and `== 0` guards use.
            ctx.position.size = remaining === 0 ? 0 : (isLong ? remaining : -remaining);

            if (remaining === 0) {
                ctx.position.avgPrice = 0;
                ctx.position.entryBarIndex = undefined;
                ctx.position.entryId = undefined;
                // Nothing left to protect, so the other brackets go with it.
                exits.clear();
            } else {
                // Only the order that filled is spent; the rest still guard
                // what is left.
                exits.delete(exitId);
            }
            break;
        }
    }
}

// --- STATE GETTERS ---

/** @getter */
export function position_size(ctx: Context): number {
    return ctx.position.size;
}

/** @getter */
export function opentrades(ctx: Context): number {
    return ctx.position.size !== 0 ? 1 : 0;
}

/** @getter */
export function equity(ctx: Context): number {
    let unrealized = 0;
    if (ctx.position.size !== 0) {
        unrealized = (ctx.close - ctx.position.avgPrice) * ctx.position.size;
    }
    return ctx.cash + unrealized;
}

/**
 * `strategy.position_avg_price` — the average entry price of the OPEN position.
 *
 * `na` while flat rather than 0: a script that plots it should draw nothing
 * between trades, and zero would draw a line at the bottom of the chart.
 *
 * @getter
 */
export function position_avg_price(ctx: Context): number {
    return ctx.position.size === 0 ? NaN : ctx.position.avgPrice;
}

/**
 * `strategy.closedtrades` — how many trades have been closed.
 *
 * Also the root of the `strategy.closedtrades.*` accessors, which live in
 * ./trades.ts; see the note there for why the two cannot share a file.
 *
 * @getter
 */
export function closedtrades(ctx: Context): number {
    return ctx.trades.length;
}

/**
 * `strategy.netprofit` — total REALISED profit, in the strategy's currency.
 *
 * Realised only: an open position's paper gain is `strategy.openprofit`, and
 * the two together are what `strategy.equity` reports. Summed from the closed
 * trades rather than tracked incrementally, so it cannot drift from them.
 *
 * @getter
 */
export function netprofit(ctx: Context): number {
    return ctx.trades.reduce((total, t) => total + t.pnl, 0);
}

/**
 * `strategy.openprofit` — the UNREALISED profit of the open position.
 *
 * @getter
 */
export function openprofit(ctx: Context): number {
    return ctx.position.size === 0
        ? 0
        : (ctx.close - ctx.position.avgPrice) * ctx.position.size;
}

/**
 * `strategy.grossprofit` and `strategy.grossloss` — the two halves of
 * `netprofit`, both reported as POSITIVE numbers.
 *
 * @getter
 */
export function grossprofit(ctx: Context): number {
    return ctx.trades.reduce((total, t) => total + Math.max(t.pnl, 0), 0);
}

/** @getter */
export function grossloss(ctx: Context): number {
    return ctx.trades.reduce((total, t) => total - Math.min(t.pnl, 0), 0);
}

/**
 * `strategy.initial_capital` — the equity the strategy started with.
 *
 * @getter
 */
export function initial_capital(ctx: Context): number {
    return ctx.initialCapital;
}

/**
 * `strategy.wintrades` / `strategy.losstrades` / `strategy.eventrades` — how
 * the closed trades came out.
 *
 * A trade that broke exactly even is neither a win nor a loss, which is why
 * there are three and not two: `wintrades + losstrades` does NOT have to equal
 * `closedtrades`, and a script that assumes it does misreports its win rate.
 *
 * @getter
 */
export function wintrades(ctx: Context): number {
    return ctx.trades.filter(t => t.pnl > 0).length;
}

/** @getter */
export function losstrades(ctx: Context): number {
    return ctx.trades.filter(t => t.pnl < 0).length;
}

/** @getter */
export function eventrades(ctx: Context): number {
    return ctx.trades.filter(t => t.pnl === 0).length;
}

/**
 * `strategy.avg_winning_trade` / `strategy.avg_losing_trade` — the mean result
 * of the winners and of the losers, both as POSITIVE amounts.
 *
 * `na` when there are none of that kind, not 0: a strategy that has never lost
 * has no average loss, and reporting zero would make a profit factor infinite
 * in one direction and meaningless in the other.
 *
 * @getter
 */
export function avg_winning_trade(ctx: Context): number {
    const wins = ctx.trades.filter(t => t.pnl > 0);
    return wins.length === 0 ? NaN : wins.reduce((s, t) => s + t.pnl, 0) / wins.length;
}

/** @getter */
export function avg_losing_trade(ctx: Context): number {
    const losses = ctx.trades.filter(t => t.pnl < 0);
    return losses.length === 0 ? NaN : -losses.reduce((s, t) => s + t.pnl, 0) / losses.length;
}

/** `strategy.avg_trade` — the mean result of ALL closed trades, signed. @getter */
export function avg_trade(ctx: Context): number {
    return ctx.trades.length === 0 ? NaN : netprofit(ctx) / ctx.trades.length;
}

/**
 * `strategy.netprofit_percent` — realised profit as a percentage of the
 * starting equity.
 *
 * @getter
 */
export function netprofit_percent(ctx: Context): number {
    return ctx.initialCapital === 0 ? NaN : (netprofit(ctx) / ctx.initialCapital) * 100;
}

/** @getter */
export function grossprofit_percent(ctx: Context): number {
    return ctx.initialCapital === 0 ? NaN : (grossprofit(ctx) / ctx.initialCapital) * 100;
}

/** @getter */
export function grossloss_percent(ctx: Context): number {
    return ctx.initialCapital === 0 ? NaN : (grossloss(ctx) / ctx.initialCapital) * 100;
}

/**
 * `strategy.account_currency` — the currency the strategy's results are in.
 *
 * Set by `strategy(..., currency = ...)`, and `currency.NONE` — the empty
 * string — when the script did not ask, which means the symbol's own currency.
 * A script pairs it with `request.currency_rate(syminfo.currency,
 * strategy.account_currency)` to convert position values.
 *
 * @getter
 */
export function account_currency(ctx: Context): string {
    return String(ctx.scriptMeta?.currency ?? "");
}

// ─── `default_qty_type` constants ──────────────────────────────────────────
//
// The three values `strategy(..., default_qty_type = ...)` accepts. They are
// sentinels, not quantities: what each one MEANS is applied by the order sizer,
// and the string is only how a script names it.

/** Size orders in contracts/shares — the default. */
export const fixed = "strategy.fixed";
/** Size orders as an amount of CASH in the strategy's currency. */
export const cash = "strategy.cash";
/** Size orders as a PERCENTAGE of available equity. */
export const percent_of_equity = "strategy.percent_of_equity";

export const __IS_NAMESPACE__ = true;
