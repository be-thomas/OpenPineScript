import { Context, Trade } from "../context";

/**
 * strategy.ts - Backtesting Engine Logic
 */

export const direction = {
    long: "long",
    short: "short"
};

// Helper to safely unwrap Series objects into primitive numbers
function val(x: any): number {
    return (x !== null && x !== undefined && typeof x.valueOf === 'function') ? Number(x.valueOf()) : Number(x);
}

// --- NEW: Pending Order Queue Interfaces & Helpers ---

export interface PendingExit {
    id: string;
    from_entry: string;
    qty: number;
    limit: number;
    stop: number;
}

// NEW: Pending Entry interface for strategy.order
export interface PendingEntry {
    id: string;
    dir: string;
    qty: number;
    limit: number;
    stop: number;
}

/**
 * Helper to dynamically attach and retrieve the pending exits queue 
 * without requiring modifications to the base Context class.
 */
function getPendingExits(ctx: Context): Map<string, PendingExit> {
    if (!(ctx as any)._pendingExits) {
        (ctx as any)._pendingExits = new Map<string, PendingExit>();
    }
    return (ctx as any)._pendingExits;
}

/**
 * Helper to dynamically attach and retrieve the pending entries queue.
 */
function getPendingEntries(ctx: Context): Map<string, PendingEntry> {
    if (!(ctx as any)._pendingEntries) {
        (ctx as any)._pendingEntries = new Map<string, PendingEntry>();
    }
    return (ctx as any)._pendingEntries;
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
    stop: any = Number.NaN
): void {
    const lim = val(limit);
    const stp = val(stop);

    // If no limit/stop is provided, it's effectively a market order; execute immediately.
    if (Number.isNaN(lim) && Number.isNaN(stp)) {
        return entry(ctx, id, dir, qty);
    }

    const entries = getPendingEntries(ctx);
    entries.set(id, {
        id,
        dir,
        qty: val(qty),
        limit: lim,
        stop: stp
    });
}

/**
 * Enters a position.
 * If we are in the opposite position, it closes it first (reverses).
 */
export function entry(ctx: Context, id: string, dir: string, qty: any = 1, overridePrice?: number) {
    const isLong = dir === direction.long;
    // Use overridePrice (Limit/Stop level) if provided, otherwise fallback to ctx.close (Market)
    const currentPrice = overridePrice !== undefined ? overridePrice : ctx.close;
    const numQty = val(qty);
    
    // 1. Check if we need to reverse (Close opposite position)
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
}

/**
 * Closes a specific position or all positions.
 */
export function close(ctx: Context, id: string) {
    // In this simple engine, 'id' is ignored for now 
    // and we just close the current position if it exists.
    close_all(ctx, `Close ${id}`);
}

export function close_all(ctx: Context, comment: string = "") {
    if (ctx.position.size === 0) return;

    const currentPrice = ctx.close;
    const qty = Math.abs(ctx.position.size);
    const isLong = ctx.position.size > 0;

    // Calculate PnL
    let pnl = 0;
    if (isLong) {
        pnl = (currentPrice - ctx.position.avgPrice) * qty;
    } else {
        pnl = (ctx.position.avgPrice - currentPrice) * qty;
    }

    // Record Trade
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
    ctx.cash += pnl; // Update Equity
    
    // Reset Position & Purge Pending Exits (OCA behavior)
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

// --- NEW: ASYNCHRONOUS EXITS & MATCHING ENGINE ---

/**
 * Registers a Take Profit / Stop Loss bracket order into the pending queue.
 */
export function exit(
    ctx: Context,
    id: string,
    from_entry: string = "",
    qty: any = Number.NaN,
    profit: any = Number.NaN, // Distance (not implemented here, requires mintick)
    limit: any = Number.NaN,  // Absolute price Take Profit
    loss: any = Number.NaN,   // Distance 
    stop: any = Number.NaN    // Absolute price Stop Loss
): void {
    const exits = getPendingExits(ctx);
    exits.set(id, {
        id,
        from_entry,
        qty: Number.isNaN(val(qty)) ? Math.abs(ctx.position.size) : val(qty),
        limit: val(limit),
        stop: val(stop)
    });
}

/**
 * Processes pending orders against the current bar's High and Low.
 * MUST be called dynamically by the runtime engine after script evaluation.
 */
export function processPendingOrders(ctx: Context, high: number, low: number): void {
    // 1. Process Pending Entries (strategy.order)
    const entries = getPendingEntries(ctx);
    for (const [id, ord] of entries.entries()) {
        let price = Number.NaN;
        if (ord.dir === direction.long) {
            if (!Number.isNaN(ord.limit) && low <= ord.limit) price = ord.limit;
            else if (!Number.isNaN(ord.stop) && high >= ord.stop) price = ord.stop;
        } else {
            if (!Number.isNaN(ord.limit) && high >= ord.limit) price = ord.limit;
            else if (!Number.isNaN(ord.stop) && low <= ord.stop) price = ord.stop;
        }

        if (!Number.isNaN(price)) {
            // PASS THE TRIGGER PRICE to entry() so avgPrice is calculated correctly
            entry(ctx, id, ord.dir, ord.qty, price);
            entries.delete(id);
        }
    }

    // 2. Process Pending Exits (strategy.exit)
    if (ctx.position.size === 0) return;
    
    const exits = getPendingExits(ctx);
    if (exits.size === 0) return;

    const isLong = ctx.position.size > 0;

    for (const [exitId, order] of exits.entries()) {
        let executedPrice = Number.NaN;

        if (isLong) {
            // Check Take Profit (Limit) - Hit high
            if (!Number.isNaN(order.limit) && high >= order.limit) {
                executedPrice = order.limit;
            }
            // Check Stop Loss (Stop) - Hit low
            else if (!Number.isNaN(order.stop) && low <= order.stop) {
                executedPrice = order.stop;
            }
        } 
        else { // Short
            // Check Take Profit (Limit) - Hit low
            if (!Number.isNaN(order.limit) && low <= order.limit) {
                executedPrice = order.limit;
            }
            // Check Stop Loss (Stop) - Hit high
            else if (!Number.isNaN(order.stop) && high >= order.stop) {
                executedPrice = order.stop;
            }
        }

        // Execution Triggered
        if (!Number.isNaN(executedPrice)) {
            const qty = Number.isNaN(order.qty) ? Math.abs(ctx.position.size) : order.qty;
            const pnl = isLong ? (executedPrice - ctx.position.avgPrice) * qty : (ctx.position.avgPrice - executedPrice) * qty;

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
            
            // Simplified: Closes full position on any exit trigger
            ctx.position.size = 0;
            ctx.position.avgPrice = 0;
            
            // OCA: Clear this exit, and since position is 0, clear everything
            exits.clear();
            break; 
        }
    }
}

// --- STATE GETTERS ---

/**
 * Returns the current position size.
 * @getter
 */
export function position_size(ctx: Context): number {
    return ctx.position.size;
}

/**
 * Returns 1 if there are open trades, 0 otherwise.
 * @getter
 */
export function opentrades(ctx: Context): number {
    return ctx.position.size !== 0 ? 1 : 0;
}

/**
 * Returns the current equity (cash + unrealized PnL).
 * @getter
 */
export function equity(ctx: Context): number {
    // Cash + Unrealized PnL
    let unrealized = 0;
    if (ctx.position.size !== 0) {
        unrealized = (ctx.close - ctx.position.avgPrice) * ctx.position.size;
    }
    return ctx.cash + unrealized;
}

export const __IS_NAMESPACE__ = true;