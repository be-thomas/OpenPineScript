import { Context, Trade } from "../context";

/**
 * strategy.ts - Backtesting Engine Logic
 */

export const direction = {
    long: "long",
    short: "short"
};

/**
 * Enters a position.
 * If we are in the opposite position, it closes it first (reverses).
 */
export function entry(ctx: Context, id: string, dir: string, qty: number = 1) {
    const isLong = dir === direction.long;
    const currentPrice = ctx.close;
    
    // 1. Check if we need to reverse (Close opposite position)
    if (ctx.position.size !== 0) {
        const isCurrentLong = ctx.position.size > 0;
        // If direction is different, close existing first
        if (isLong !== isCurrentLong) {
            close_all(ctx, `Reverse for ${id}`);
        }
    }

    // 2. Execute Entry (Market Order at Close)
    // Update Average Price (Weighted Average)
    const newQty = isLong ? qty : -qty;
    const currentVal = Math.abs(ctx.position.size) * ctx.position.avgPrice;
    const newVal = Math.abs(newQty) * currentPrice;
    const totalQty = Math.abs(ctx.position.size + newQty);
    
    // Avoid divide by zero
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
    // Long: (Exit - Entry) * Qty
    // Short: (Entry - Exit) * Qty
    let pnl = 0;
    if (isLong) {
        pnl = (currentPrice - ctx.position.avgPrice) * qty;
    } else {
        pnl = (ctx.position.avgPrice - currentPrice) * qty;
    }

    // Record Trade
    const trade: Trade = {
        id: comment || "Close",
        entryTime: 0, // We don't track exact entry time in this simple version
        entryPrice: ctx.position.avgPrice,
        exitTime: ctx.time,
        exitPrice: currentPrice,
        qty: qty,
        pnl: pnl,
        direction: isLong ? "long" : "short"
    };
    
    ctx.trades.push(trade);
    ctx.cash += pnl; // Update Equity
    
    // Reset Position
    ctx.position.size = 0;
    ctx.position.avgPrice = 0;
}

export function position_size(ctx: Context): number {
    return ctx.position.size;
}

export function opentrades(ctx: Context): number {
    return ctx.position.size !== 0 ? 1 : 0;
}

export function equity(ctx: Context): number {
    // Cash + Unrealized PnL
    let unrealized = 0;
    if (ctx.position.size !== 0) {
        unrealized = (ctx.close - ctx.position.avgPrice) * ctx.position.size;
    }
    return ctx.cash + unrealized;
}
