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

export const direction = {
    long: long,
    short: short
};

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
    limit: number;
    stop: number;
    oca_name: string;
}

export interface PendingEntry {
    id: string;
    dir: string;
    qty: number;
    limit: number;
    stop: number;
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
    oca_type: string = oca.none
): void {
    const lim = val(limit);
    const stp = val(stop);

    // If no limit/stop, it's a market order — execute immediately.
    if (Number.isNaN(lim) && Number.isNaN(stp)) {
        return entry(ctx, id, dir, qty);
    }

    const entries = getPendingEntries(ctx);
    entries.set(id, {
        id,
        dir,
        qty: val(qty),
        limit: lim,
        stop: stp,
        oca_name: oca_name || "",
        oca_type: oca_type || oca.none
    });
}

/**
 * Enters a position.
 * If we are in the opposite position, it closes it first (reverses).
 */
export function entry(ctx: Context, id: string, dir: string, qty: any = 1, overridePrice?: number) {
    const rs = syncRiskState(ctx);
    if (rs.is_halted) return;
    if (checkRiskHalt(ctx, rs)) return;

    // max_intraday_filled_orders check
    if (rs.daily_filled_orders >= rs.max_intraday_filled_orders) return;

    const isLong = dir === direction.long;

    // allow_entry_in check
    if (rs.allow_entry_in !== "all") {
        if (isLong && rs.allow_entry_in !== direction.long) return;
        if (!isLong && rs.allow_entry_in !== direction.short) return;
    }

    const currentPrice = overridePrice !== undefined ? overridePrice : ctx.close;
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
            close_all(ctx, `Reverse for ${id}`);
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

    ctx.position.size += newQty;

    // Track filled orders for intraday limit
    rs.daily_filled_orders++;
}

/**
 * Closes a specific position or all positions.
 */
export function close(ctx: Context, id: string) {
    close_all(ctx, `Close ${id}`);
}

export function close_all(ctx: Context, comment: string = "") {
    if (ctx.position.size === 0) return;

    const currentPrice = ctx.close;
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
    getPendingExits(ctx).clear();
}

/**
 * Cancels a pending order by ID.
 */
export function cancel(ctx: Context, id: string): void {
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
    profit: any = Number.NaN,
    limit: any = Number.NaN,
    loss: any = Number.NaN,
    stop: any = Number.NaN,
    oca_name: string = ""
): void {
    const exits = getPendingExits(ctx);
    exits.set(id, {
        id,
        from_entry,
        qty: Number.isNaN(val(qty)) ? Math.abs(ctx.position.size) : val(qty),
        limit: val(limit),
        stop: val(stop),
        oca_name: oca_name || ""
    });
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
 * Processes pending orders against the current bar's High and Low.
 * Called by the runtime engine after script evaluation on each bar.
 */
export function processPendingOrders(ctx: Context, high: number, low: number): void {
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

            const originalClose = ctx.close;
            ctx.close = liquidationPrice;
            close_all(ctx, "Max Intraday Loss Breach");
            ctx.close = originalClose;

            cancel_all(ctx);
            return;
        }
    }

    // Global risk checks
    if (checkRiskHalt(ctx, rs)) {
        cancel_all(ctx);
        if (ctx.position.size !== 0) close_all(ctx, "Risk Halt");
        return;
    }

    // If halted from previous bar, block everything
    if (rs.is_halted) {
        cancel_all(ctx);
        if (ctx.position.size !== 0) close_all(ctx, "Risk Halt");
        return;
    }

    // 1. Process Pending Entries (strategy.order)
    const entries = getPendingEntries(ctx);
    const filledEntryIds: string[] = [];

    for (const [id, ord] of entries.entries()) {
        // Check intraday filled orders limit
        if (rs.daily_filled_orders >= rs.max_intraday_filled_orders) break;

        let price = Number.NaN;
        if (ord.dir === direction.long) {
            if (!Number.isNaN(ord.limit) && low <= ord.limit) price = ord.limit;
            else if (!Number.isNaN(ord.stop) && high >= ord.stop) price = ord.stop;
        } else {
            if (!Number.isNaN(ord.limit) && high >= ord.limit) price = ord.limit;
            else if (!Number.isNaN(ord.stop) && low <= ord.stop) price = ord.stop;
        }

        if (!Number.isNaN(price)) {
            entry(ctx, id, ord.dir, ord.qty, price);
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
        let executedPrice = Number.NaN;

        if (isLong) {
            if (!Number.isNaN(pendingExit.limit) && high >= pendingExit.limit) {
                executedPrice = pendingExit.limit;
            } else if (!Number.isNaN(pendingExit.stop) && low <= pendingExit.stop) {
                executedPrice = pendingExit.stop;
            }
        } else {
            if (!Number.isNaN(pendingExit.limit) && low <= pendingExit.limit) {
                executedPrice = pendingExit.limit;
            } else if (!Number.isNaN(pendingExit.stop) && high >= pendingExit.stop) {
                executedPrice = pendingExit.stop;
            }
        }

        if (!Number.isNaN(executedPrice)) {
            const qty = Number.isNaN(pendingExit.qty) ? Math.abs(ctx.position.size) : pendingExit.qty;
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

            // Close full position
            ctx.position.size = 0;
            ctx.position.avgPrice = 0;

            // Remove the filled exit and clear remaining (position is flat)
            exits.clear();
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

export const __IS_NAMESPACE__ = true;
