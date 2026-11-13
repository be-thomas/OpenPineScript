import type { Context } from "../context";
import { brokerFor } from "../broker";
import { val, text, directionOf } from "../broker/val";
import { openTrades } from "../openTrades";

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

// `val` lives in ../broker/val.ts: every export of a stdlib module becomes a
// Pine built-in, and an unwrapping helper is not one.

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
    /** `comment`, and the three that replace it by how the exit filled. */
    comment?: string;
    comment_profit?: string;
    comment_loss?: string;
    comment_trailing?: string;
    /**
     * One unit per TRADE the exit applies to (the trades `from_entry` names, or
     * every trade): its own price to measure relative levels from, its own
     * trailing high-water mark, and whether it has filled. A script re-issues the
     * same `strategy.exit` every bar, and the units survive that. A trade filled
     * after the last call has no unit until the next call (or, for an entry
     * that was pending at the call, `arms`).
     */
    units?: ExitUnit[];
    /** Entry ids that had an order pending when the exit was called, and the bar of that first call. */
    arms?: Record<string, number>;
}

/** One trade's share of a `strategy.exit`; see `PendingExit.units`. */
export interface ExitUnit {
    /** `OpenEntry.uid` of the trade. */
    uid: string;
    /** The trade's entry id: what `from_entry` and the id ledger speak of. */
    id: string;
    /** The trade's fill price: relative levels (`profit`, `loss`, `trail_points`) are measured from it. */
    basis: number;
    /** What the trade opened with: a `qty_percent` is a share of it. */
    opened: number;
    /** The bar the unit was created on; it is live from the next. */
    placedBar: number;
    trail_peak: number;
    filled: boolean;
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
    /** Placed by `strategy.order`, which `pyramiding` does not bind. */
    exempt?: boolean;
}
export interface RiskState {
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
export const risk = {
    max_intraday_loss: (ctx: Context, value: any, type: string = "cash") => {
        const state = brokerFor(ctx).getRiskState();
        state.max_intraday_loss = val(value);
        state.max_intraday_loss_type = type;
    },

    max_intraday_filled_orders: (ctx: Context, count: any) => {
        const state = brokerFor(ctx).getRiskState();
        state.max_intraday_filled_orders = val(count);
    },

    max_drawdown: (ctx: Context, value: any, type: string = "percent") => {
        const state = brokerFor(ctx).getRiskState();
        state.max_drawdown = val(value);
        state.max_drawdown_type = type;
    },

    max_cons_loss_days: (ctx: Context, count: any) => {
        const state = brokerFor(ctx).getRiskState();
        state.max_cons_loss_days = val(count);
    },

    max_position_size: (ctx: Context, size: any) => {
        const state = brokerFor(ctx).getRiskState();
        state.max_position_size = val(size);
    },

    allow_entry_in: (ctx: Context, dir: string) => {
        const state = brokerFor(ctx).getRiskState();
        state.allow_entry_in = dir; // "long", "short", or strategy.direction.long / .short
    }
};

// --- DAY TRANSITION & RISK SYNC ---


export function order(
    ctx: Context,
    id: string,
    dir: string,
    qty: any = undefined,
    limit: any = Number.NaN,
    stop: any = Number.NaN,
    oca_name: string = "",
    oca_type: string = oca.none,
    comment: string = "",
    when: any = undefined,
    alert_message: string = ""): void {
    return brokerFor(ctx).order(text(id), directionOf(dir), qty, limit, stop, text(oca_name), text(oca_type), text(comment), when, text(alert_message));
}



export function entry(
    ctx: Context,
    id: string,
    direction: string,
    // Absent, not 1: an omitted `qty` is what hands the size over to
    // `default_qty_type`, and a literal 1 cannot be told from no answer.
    qty: any = undefined,
    limit: any = Number.NaN,
    stop: any = Number.NaN,
    oca_name: string = "",
    oca_type: string = oca.none,
    comment: string = "",
    when: any = undefined,
    alert_message: string = "",
    // `overridePrice` is NOT here, though the broker method takes it: it is
    // the price a triggered pending order fills at, passed by the broker to
    // itself. Everything this wrapper declares is a Pine argument, and with
    // it declared a script's eleventh positional argument — `disable_alert`
    // on TradingView — became a fill price.
    ): any {
    // The broker reports whether it filled; the Pine function returns nothing.
    brokerFor(ctx).entry(text(id), directionOf(direction), qty, limit, stop, text(oca_name), text(oca_type), text(comment), when, text(alert_message));
}


export function close(
    ctx: Context, id: string, when: any = undefined, comment: string = "",
    qty: any = Number.NaN, qty_percent: any = Number.NaN, alert_message: string = "",
    // Appended, not where TradingView lists it: the shared signature keeps v4's
    // order, as for `strategy.exit`'s `comment_*`. See V6_POSITIONAL.
    immediately: any = false, disable_alert: any = false): any {
    void disable_alert;
    return brokerFor(ctx).close(text(id), when, text(comment), qty, qty_percent, text(alert_message), immediately);
}


export function close_all(
    ctx: Context, comment: string = "", when: any = undefined, alert_message: string = "",
    immediately: any = false, disable_alert: any = false): any {
    void disable_alert;
    return brokerFor(ctx).close_all(text(comment), when, text(alert_message), immediately);
}



export function cancel(ctx: Context, id: string, when: any = undefined): void {
    return brokerFor(ctx).cancel(text(id), when);
}


export function cancel_all(ctx: Context): void {
    return brokerFor(ctx).cancel_all();
}


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
    // Appended rather than placed where TradingView's reference lists them, so
    // a v1–v5 call passing `when` or `alert_message` by position still lands
    // there. Keyword use, the only kind the reference examples show, finds
    // them by name.
    comment_profit: string = "",
    comment_loss: string = "",
    comment_trailing: string = ""): void {
        return brokerFor(ctx).exit(text(id), text(from_entry), qty, qty_percent, profit, limit, loss, stop, trail_price, trail_points, trail_offset, text(oca_name), text(comment), when, text(alert_message), text(comment_profit), text(comment_loss), text(comment_trailing));
}


export function processPendingOrders(ctx: Context, high: number, low: number): void {
    return brokerFor(ctx).processPendingOrders(high, low);
}
export interface MarketOrder {
    kind: "entry" | "close";
    id: string;
    direction?: string;
    qty?: number;
    comment?: string;
    /** For a close: the entry it closes, or absent for the whole position. */
    entry?: string;
    /** For a close: `qty` / `qty_percent`, which limit how much of that entry goes. */
    qty_percent?: number;
    /** For an entry placed by `strategy.order`, which `pyramiding` does not bind. */
    exempt?: boolean;
    /** For an entry: the close of the bar that placed it, which sizes it (see `Broker.sizesAtOrderPrice`). */
    placedClose?: number;
    /** For a close placed with `immediately`: it fills at the close of this bar, once the script has run. */
    atClose?: boolean;
}

/** @getter */
export function position_size(ctx: Context): number {
    return ctx.position.size;
}

/** @getter */
export function opentrades(ctx: Context): number {
    return openTrades(ctx).length;
}

/**
 * `strategy.max_drawdown` / `max_runup` and their percentages — the largest
 * fall from a peak, and rise from a trough, of the strategy's equity over the
 * whole run, read off the per-bar equity curve and the bar in progress.
 * The percentage is of the peak (or trough) it was measured from.
 */
function equityExtremes(ctx: Context): { drawdown: number; drawdownPct: number; runup: number; runupPct: number } {
    const points = [...((ctx as any).equityCurve ?? []).map((p: any) => Number(p?.equity ?? p)), equity(ctx)]
        .filter(Number.isFinite);
    let peak = -Infinity, trough = Infinity;
    let drawdown = 0, drawdownPct = 0, runup = 0, runupPct = 0;
    for (const e of points) {
        if (e > peak) peak = e;
        if (e < trough) trough = e;
        if (peak - e > drawdown) { drawdown = peak - e; drawdownPct = peak > 0 ? (drawdown / peak) * 100 : 0; }
        if (e - trough > runup) { runup = e - trough; runupPct = trough > 0 ? (runup / trough) * 100 : 0; }
    }
    return { drawdown, drawdownPct, runup, runupPct };
}

/** @getter */
export function max_drawdown(ctx: Context): number { return equityExtremes(ctx).drawdown; }
/** @getter */
export function max_drawdown_percent(ctx: Context): number { return equityExtremes(ctx).drawdownPct; }
/** @getter */
export function max_runup(ctx: Context): number { return equityExtremes(ctx).runup; }
/** @getter */
export function max_runup_percent(ctx: Context): number { return equityExtremes(ctx).runupPct; }

/**
 * Converts between the strategy's account currency and the symbol's. One
 * currency runs here, so a value converts to itself.
 */
export function convert_to_symbol(value: any): number { return Number(val(value)); }
export function convert_to_account(value: any): number { return Number(val(value)); }

/**
 * `strategy.default_entry_qty(fill_price)` — the quantity a `strategy.entry`
 * with no `qty` would take at that price, by the script's default_qty_type.
 */
export function default_entry_qty(ctx: Context, fill_price: any): number {
    return brokerFor(ctx).entryQtyAt(Number(val(fill_price)));
}

/**
 * `strategy.margin_liquidation_price` — where the open position would be
 * margin-called: the price at which equity falls to the margin it requires,
 *
 *     cash + (price - entry) * size = |size| * price * margin
 *
 * solved for price. `na` when flat, when the side's margin is 0, and for a
 * long at 100% margin, which no price can call. TradingView's log has na on
 * every long and 82588.14 for a 1.209 short entered at 82387.95.
 *
 * @getter
 */
export function margin_liquidation_price(ctx: Context): number {
    const pos = ctx.position;
    if (pos.size === 0) return NaN;
    // The broker's own ratio, so this cannot drift from where it liquidates.
    const m = brokerFor(ctx).marginRatio(pos.size > 0);
    if (m === 0) return NaN;
    const q = Math.abs(pos.size);
    const price = pos.size > 0
        ? (pos.avgPrice * q - ctx.cash) / (q * (1 - m))
        : (ctx.cash + pos.avgPrice * q) / (q * (1 + m));
    if (!(Number.isFinite(price) && price > 0)) return NaN;
    // On the tick grid, toward the ADVERSE side: TradingView reports a short's
    // 82806.1605… as 82806.17 and 82588.1388… as 82588.14. A long's is rounded
    // down by the same rule; the log has no long at less than 100% margin.
    const tick = ctx.mintick > 0 ? ctx.mintick : 0;
    if (tick === 0) return price;
    const decimals = Math.max(0, Math.ceil(-Math.log10(tick) - 1e-9));
    const steps = price / tick;
    const snapped = pos.size < 0 ? Math.ceil(steps - 1e-9) : Math.floor(steps + 1e-9);
    return Number((snapped * tick).toFixed(decimals));
}

/** @getter */
export function equity(ctx: Context): number {
    return ctx.cash + ctx.openProfitAt(ctx.close);
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
    return brokerFor(ctx).reportedNetProfit();
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

/**
 * `strategy.avg_trade_percent` — the mean of each closed trade's result as a
 * percentage of what it cost to enter (entry price × size).
 * @getter
 */
export function avg_trade_percent(ctx: Context): number {
    const pct = ctx.trades.map(t => t.pnl / (t.entryPrice * t.qty) * 100).filter(Number.isFinite);
    return pct.length === 0 ? NaN : pct.reduce((s, x) => s + x, 0) / pct.length;
}

/**
 * `strategy.openprofit_percent` — the open position's unrealised result as a
 * percentage of the initial capital, as `netprofit_percent` is of realised.
 * @getter
 */
export function openprofit_percent(ctx: Context): number {
    return ctx.initialCapital === 0 ? NaN : (openprofit(ctx) / ctx.initialCapital) * 100;
}

/** `strategy.avg_trade` — the mean result of ALL closed trades, signed. @getter */
export function avg_trade(ctx: Context): number {
    return ctx.trades.length === 0 ? NaN : brokerFor(ctx).netProfit() / ctx.trades.length;
}

/**
 * `strategy.netprofit_percent` — realised profit as a percentage of the
 * starting equity.
 *
 * @getter
 */
export function netprofit_percent(ctx: Context): number {
    return ctx.initialCapital === 0 ? NaN : (brokerFor(ctx).netProfit() / ctx.initialCapital) * 100;
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