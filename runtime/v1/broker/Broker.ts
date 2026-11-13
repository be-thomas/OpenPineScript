/**
 * The broker for Pine v1 to v5. TradingView's migration guides list no strategy
 * or broker change between those versions: to-pine-version-3 and -4 have none,
 * and to-pine-version-5 lists compile-time checks only (https://www.tradingview.com/pine-script-docs/migration-guides/to-pine-version-3/,
 * .../to-pine-version-4/, .../to-pine-version-5/). It holds every rule
 * TradingView's own logs have shown, and V6Broker extends it, overriding only
 * what the v6 guide documents (https://www.tradingview.com/pine-script-docs/migration-guides/to-pine-version-6/).
 *
 *   rule                                                    v1–v5            v6               status
 *   per-entry closed trades, first in first out             yes              yes (same)       log-verified (pyr0, pyr3: v5 and v6 identical)
 *   strategy.close(id) takes its qty off the position FIFO  yes              yes (same)       log-verified (pyr3 phase d)
 *   an opposite strategy.order closes the oldest entry      yes              yes (same)       log-verified (pyr0 phase c)
 *   process_orders_on_close fills at the placing bar close  yes              yes (same)       log-verified (pooc)
 *   close(immediately) fills at the bar close, after script yes              yes (same)       log-verified (pyr0 g2, g4)
 *   strategy.exit once per entry, qty_percent of opened     yes              yes (same)       log-verified (v5 release_notes_04, v6 golden)
 *   two ledgers: an id's quantity apart from the trades    yes              yes (same)       log-verified (exit_mix a; pyr3 d). from_entry / close(id) draw on the id, the fill takes the OLDEST trades
 *   relative exit levels from each trade's own fill price   yes              yes (same)       log-verified (exit_mix a, e; reentry b: two L fills, each its own target)
 *   an exit with no from_entry is one order per entry id    yes              yes (same)       log-verified (exit_mix c, d). Each id has its own qty and its own trail
 *   one exit unit per trade, re-armed when the id re-enters yes              yes (same)       log-verified (reentry a, 5m and 1D: xa fills again for the second A)
 *   a bar's exits fill in price-path order, oldest trade    yes              yes (same)       log-verified (reentry c1-c4: limit first when the open is nearer the high, stop first when nearer the low)
 *   exit() before its entry exists has no effect that call  yes              yes (same)       log-verified (exit_order d1/d2 on AAPL 5m; reentry a; release_notes_04)
 *   trailing stop with offset 0 holds at its activation    yes              yes (same)       log-verified (v5 and v6 release_notes_04: fills at 4285.58, 4286.08); a nonzero offset follows intrabar (v6 harness_v6_strategy), the same rule for all
 *   margin_long / margin_short                              0, no checks     100, entries blocked, shorts called   log-verified for the block (v6 release_notes_04 at 100K capital); margin calls doc-only (MG "Default margin percentage")
 *   strategy.exit absolute vs relative pairs                absolute wins    nearer level wins     doc-only (MG "strategy.exit() evaluates parameter pairs")
 *   9000 orders                                             runtime error    oldest trimmed   doc-only (MG "Excess orders are trimmed")
 *   `when` argument                                         accepted         compile error    doc-only (MG "Removal of when parameter")
 *   calc_bars_count (security, security_lower_tf)           no effect        no effect        log-verified (harness_security_cbc, v5): accepted, never limits history
 *   entry commission charged at the fill                    yes              yes (same)       log-verified on v6 (harness_v6_strategy), applied to all: the guides document no difference
 */
/**
 * runtime/v1/broker/Broker.ts
 *
 * The broker emulator, as a class so a Pine version can extend it.
 *
 * ── Why a class, when four versions needed no such thing ──────────────────
 *
 * TradingView did not change the broker across v1-v5. The v2->v3, v3->v4 and
 * v4->v5 migration guides document no change to order fills, trade
 * calculation or the emulator: every strategy delta in them is compile-time
 * API shape (`strategy.exit()` must have an effect, named constants
 * mandatory, `long` renamed to `direction`) or a general language rule, and
 * each is already handled in the transpiler or the registry.
 *
 * v6 is the first version where the EMULATOR itself differs. `strategy.exit()`
 * now evaluates its relative and absolute parameters as a pair and takes
 * whichever level is expected to trigger first, where v5 always took the
 * absolute one; and the 9000-order cap trims the oldest orders instead of
 * halting the script. The same orders produce different fills depending on the
 * `//@version` line, which is what a subclass is for.
 *
 * ── State stays on the Context, and that is deliberate ────────────────────
 *
 * `Context` snapshots broker state for live-tick re-evaluation and restores it
 * with `structuredClone` (`RuntimeSnapshot`, ../context.ts). `structuredClone`
 * does not preserve prototypes: cloning an instance would return a plain
 * object with no methods, and the next call on the restored broker would throw
 * — on the live path, which the ordinary suite does not exercise on every run.
 *
 * So this class is BEHAVIOUR and the context keeps the DATA. The accessors
 * below still read `(ctx as any)._pendingExits` and friends, which is exactly
 * what the snapshot already clones by name.
 */
import type { Context } from "../context";
/**
 * ── The alias is an IMPORT, not a `const` ─────────────────────────────────
 *
 * `strategy.ts` imports `brokerFor` from this directory and this file imports
 * its constants back, so the two modules form a cycle. That is fine for
 * anything read inside a method — by then both modules are initialised — but
 * it is fatal for anything read while the module is still evaluating.
 *
 * `const DIR = direction;` was exactly that: when `strategy.ts` loads first it
 * pulls in this file before its own `export const direction` has run, so the
 * alias captured `undefined`, every direction comparison failed, and no order
 * ever filled. 95 tests caught it.
 *
 * `import { direction as DIR }` is a live binding instead of a snapshot: it
 * resolves when it is used, which is always inside a method.
 */
import { val } from "./val";
import {
    commission, direction, direction as DIR, oca, equity, cash, percent_of_equity,
    type PendingExit, type ExitUnit, type PendingEntry, type RiskState, type MarketOrder,
} from "../stdlib/strategy";

/** An entry holding less than this is closed: below it a size is float noise. */
const ENTRY_EPS = 1e-10;

/** The most orders a strategy before v6 may fill. */
const ORDER_LIMIT = 9000;

/**
 * Whether a `strategy.risk.*` type argument means a percentage. The script passes the constant
 * `strategy.percent_of_equity` ("strategy.percent_of_equity"); "percent" is the engine's own
 * default spelling. Anything else is cash.
 */
function isPercentType(type: unknown): boolean {
    return type === "percent" || type === percent_of_equity;
}

export class Broker {
    constructor(protected readonly ctx: Context) {}

    protected getPendingExits(): Map<string, PendingExit> {
        const ctx = this.ctx;
        if (!(ctx as any)._pendingExits) {
            (ctx as any)._pendingExits = new Map<string, PendingExit>();
        }
        return (ctx as any)._pendingExits;
    }

    protected getPendingEntries(): Map<string, PendingEntry> {
        const ctx = this.ctx;
        if (!(ctx as any)._pendingEntries) {
            (ctx as any)._pendingEntries = new Map<string, PendingEntry>();
        }
        return (ctx as any)._pendingEntries;
    }

    getRiskState(): RiskState {
        const ctx = this.ctx;
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

    protected syncRiskState(): RiskState {
        const ctx = this.ctx;
        const rs = this.getRiskState();
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
        const cur = this.drawdownEquity();
        if (cur > rs.peak_equity) rs.peak_equity = cur;

        return rs;
    }

    /**
     * The equity `strategy.risk.max_drawdown` measures: open equity before v5, where nothing
     * contradicts it (see V5Broker for what TradingView does).
     */
    protected drawdownEquity(): number { return equity(this.ctx); }

    protected checkRiskHalt(rs: RiskState): boolean {
        const ctx = this.ctx;
        if (rs.is_halted) return true;

        // 1. Max consecutive loss days
        if (rs.cons_loss_days >= rs.max_cons_loss_days) {
            rs.is_halted = true;
            return true;
        }

        // 2. Max drawdown (from peak equity)
        if (!Number.isNaN(rs.max_drawdown)) {
            const cur = this.drawdownEquity();
            if (isPercentType(rs.max_drawdown_type)) {
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

    protected gated(when: any): boolean {
        if (when === undefined || when === null) return true;
        const v = val(when);
        if (v === null || v === undefined) return false;
        if (typeof v === "number") return !Number.isNaN(v) && v !== 0;
        return Boolean(v);
    }

    order(
        id: string,
        dir: string,
        qty: any = undefined,
        limit: any = Number.NaN,
        stop: any = Number.NaN,
        oca_name: string = "",
        oca_type: string = oca.none,
        comment: string = "",
        when: any = undefined,
        alert_message: string = "",
        // Not a Pine parameter: true when `strategy.entry` hands a limit or stop
        // order here, which obeys `pyramiding`. `strategy.order` itself does not.
        obeysPyramiding: boolean = false,
    ): void {
        const ctx = this.ctx;
        if (!this.gated(when)) return;
        void comment; void alert_message;

        const lim = val(limit);
        const stp = val(stop);

        // If no limit/stop, it's a market order — execute immediately.
        if (Number.isNaN(lim) && Number.isNaN(stp)) {
            this.entry(id, dir, qty, Number.NaN, Number.NaN, oca_name, oca_type,
                       "", undefined, "", undefined, false, !obeysPyramiding);
            return;
        }

        const entries = this.getPendingEntries();
        const existing = entries.get(id);
        entries.set(id, {
            id,
            dir,
            // `undefined` means "the strategy did not say", which `entry` reads as
            // "use the declared default size". `val(undefined)` is NaN, and NaN is
            // not `undefined`, so the default was skipped and the finite-quantity
            // guard then threw the order away: a limit or stop entry written
            // without an explicit size silently never filled. The market-order
            // path above passes `qty` through untouched, which is why only the
            // pending orders were affected.
            qty: qty === undefined ? undefined : val(qty),
            limit: lim,
            stop: stp,
            placedBar: existing ? existing.placedBar : ctx.currentBarIndex,
            oca_name: oca_name || "",
            oca_type: oca_type || oca.none,
            exempt: !obeysPyramiding,
        });
    }

    /**
     * Fills the queued market orders at `price`: the open of the bar after the
     * one that placed them, or with `process_orders_on_close` the close of the
     * bar that did (see `Context.finalizeBar`).
     */
    fillMarketOrders(price: number = this.ctx.open): void {
        const ctx = this.ctx;
        const queue = ctx.marketOrders;
        if (queue.length === 0) return;
        ctx.marketOrders = [];

        for (const o of queue) {
            if (o.kind === "entry") {
                this.entry(o.id, o.direction!, o.qty, Number.NaN, Number.NaN,
                      "", oca.none, o.comment ?? "", undefined, "", price, false, o.exempt,
                      this.sizingPriceFor(o.placedClose));
            } else {
                this.fillClose(o, price);
            }
        }
    }

    /** Fills a queued `strategy.close` / `close_all` at `price`. */
    protected fillClose(o: MarketOrder, price: number): void {
        const ctx = this.ctx;
        if (o.entry === undefined) {
            this.closeAt(o.comment ?? "", price, "Close position order", o.comment || undefined);
        } else {
            const held = this.openQty(o.entry);
            if (held <= 0) return;
            // `qty` wins over `qty_percent`, as for `strategy.exit`; neither
            // closes every entry with this id.
            const want = !Number.isNaN(o.qty ?? Number.NaN) ? o.qty!
                : !Number.isNaN(o.qty_percent ?? Number.NaN) ? held * Math.min(100, Math.max(0, o.qty_percent!)) / 100
                : held;
            const take = Math.min(held, want, Math.abs(ctx.position.size));
            if (!(take > 0)) return;
            const isLong = ctx.position.size > 0;
            // `take` is how much the entries named `id` hold, but it comes off
            // the position first in, first out, whichever entries are oldest: with
            // A (1), B (2), A (3) open, close("A") sells 1 + 2 + 1, not A's four
            // (TradingView's log, harness_strategy_pyr3 phase d).
            this.closeEntries(take, this.toTick(this.slip(price, !isLong)), undefined, {
                id: o.id, exitId: `Close entry(s) order ${o.entry}`, exitComment: o.comment || undefined,
                ledger: o.entry,
            });
        }
    }

    entry(
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
        // Not a Pine parameter. `strategy.order` calls back in here once a pending
        // limit or stop has been triggered, and passes the price it filled at.
        overridePrice?: number,
        // Nor this. True when the fill came from the LIMIT leg, which fills at
        // its price or better and so takes no slippage.
        viaLimit: boolean = false,
        // Nor this: `strategy.order` is not bound by `pyramiding`.
        exempt: boolean = false,
        // Nor this: the price a cash / percent-of-equity size is computed at, when
        // that is not the fill price (see `sizingPriceFor`).
        sizingPrice?: number,
    ): boolean {
        const ctx = this.ctx;
        if (!this.gated(when)) return false;

        // A limit or stop price makes this a PENDING order rather than a market
        // one — "limit (float) Limit price of the order" — and `strategy.order`
        // already owns that queue.
        const lim = val(limit);
        const stp = val(stop);
        if (overridePrice === undefined && (!Number.isNaN(lim) || !Number.isNaN(stp))) {
            this.order(id, direction, qty, limit, stop, oca_name, oca_type, comment, undefined, "", true);
            return false;
        }

        const dir = direction;
        void comment; void alert_message; void oca_name; void oca_type;

        // No fill price means this came from the SCRIPT, and a market order waits
        // for the next bar's open. A price means the broker is filling it now —
        // `fillMarketOrders` draining this queue, `processPendingOrders` matching a
        // limit or stop, or a risk rule liquidating — and those execute in place.
        if (overridePrice === undefined) {
            // `undefined` travels with the order: a cash or percent-of-equity
            // size is resolved at the price it fills at, which is not known yet.
            ctx.marketOrders.push({
                kind: "entry", id, direction: dir,
                qty: qty === undefined ? undefined : val(qty),
                comment, exempt, placedClose: ctx.close,
            });
            return false;
        }

        const rs = this.syncRiskState();
        if (rs.is_halted) return false;
        if (this.checkRiskHalt(rs)) return false;

        // max_intraday_filled_orders check
        if (rs.daily_filled_orders >= rs.max_intraday_filled_orders) return false;

        const isLong = dir === DIR.long;

        // allow_entry_in check
        if (rs.allow_entry_in !== "all") {
            if (isLong && rs.allow_entry_in !== DIR.long) return false;
            if (!isLong && rs.allow_entry_in !== DIR.short) return false;
        }

        // `pyramiding`: "the maximum number of entries allowed in the same
        // direction"; 0, the default, and 1 both allow one. Counted when the
        // order fills, over the entries still open, so orders queued on one bar
        // count one another. An entry the other way reverses the position and is
        // not held back. `strategy.order` is not bound by it.
        if (this.pyramidingBlocks(isLong, exempt)) return false;

        const modelPrice = overridePrice !== undefined ? overridePrice : ctx.close;
        // A triggered LIMIT order fills at its price or better, so slippage does
        // not apply to it. Market and stop orders are the ones that slip.
        const currentPrice = viaLimit
            ? this.toTick(modelPrice)
            : this.toTick(this.slip(modelPrice, isLong));
        let numQty = this.floorToMinContract(qty === undefined ? this.defaultQty(sizingPrice ?? currentPrice) : val(qty));
        if (!Number.isFinite(numQty) || numQty <= 0) return false;

        // max_position_size clamp
        if (rs.max_position_size !== Infinity) {
            const currentAbs = Math.abs(ctx.position.size);
            const sameDir = (isLong && ctx.position.size >= 0) || (!isLong && ctx.position.size <= 0);
            if (sameDir) {
                const remaining = rs.max_position_size - currentAbs;
                if (remaining <= 0) return false;
                if (numQty > remaining) numQty = remaining;
            }
        }

        // Whether the account can carry this order at all. Always yes before
        // v6, which never modelled margin; V6Broker blocks what it cannot fund.
        if (!this.admitsEntry(isLong, numQty, currentPrice)) return false;

        // 1. Reverse opposite position
        if (ctx.position.size !== 0) {
            const isCurrentLong = ctx.position.size > 0;
            if (isLong !== isCurrentLong && exempt) {
                // `strategy.order` against an open position is not a reversal:
                // it takes its size off the position, oldest entry first, and
                // only what is more than the position opens the other way. A
                // short order of 1 against three longs closes the oldest one and
                // leaves two (TradingView's log, harness_strategy_pyr0 phase c).
                const take = Math.min(numQty, Math.abs(ctx.position.size));
                this.closeEntries(take, this.toTick(this.slip(modelPrice, !isCurrentLong)), undefined, {
                    id: `Reverse for ${id}`, exitId: id,
                });
                numQty -= take;
                if (numQty <= ENTRY_EPS) { rs.daily_filled_orders++; return true; }
            } else if (isLong !== isCurrentLong) {
                // The MODEL price, not the slipped one. `closeAt` slips what it
                // is given, in the direction of the trade that closes the
                // position — which for a reversal is the same direction as this
                // entry — so handing it `currentPrice` applied slippage twice.
                // Reversing a short with `slippage = 2` closed it four ticks
                // above the open instead of two, and every reversal's P&L was
                // short by `slippage * mintick * qty`.
                // TradingView names the reversing entry as the exit.
                this.closeAt(`Reverse for ${id}`, modelPrice, id);
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
        ctx.position.openedQty = wasFlat
            ? Math.abs(ctx.position.size)
            : Math.max(ctx.position.openedQty ?? 0, Math.abs(ctx.position.size));

        // Stamp the OPENING fill only. A pyramided add does not restart the trade,
        // so `strategy.opentrades.entry_bar_index` must keep naming the bar the
        // position began on.
        if (wasFlat) {
            ctx.position.entryBarIndex = ctx.currentBarIndex;
            ctx.position.entryTime = ctx.time;
            ctx.position.entryId = id;
            ctx.position.entryCommission = 0;
            // A NEW position measures its excursion from here. Leaving the old
            // figures in place made a reversal inherit them, because a reversal
            // never passes through flat at a bar boundary and the end-of-bar
            // reset therefore never fired — so a short that gave back 1.74 was
            // still reporting 1.74 three long trades later.
            ctx.positionRunup = 0;
            ctx.positionDrawdown = 0;
        }

        // Counted at the FILL, not only at the end of the bar. `sampleEquity`
        // takes its reading after the script and the broker have both had the
        // bar, so a position opened at the open and stopped out on the same bar
        // was flat again by the time it looked and never counted at all.
        const held = Math.abs(ctx.position.size);
        if (held > ctx.maxContractsHeld) ctx.maxContractsHeld = held;

        // Commission on the ENTRY side is charged here, at the fill, because it is
        // a fee on an ORDER. `recordTrade` used to compute a whole round turn per
        // closed-trade record, which is only the same thing when one entry is
        // closed by one exit. Two partial exits of one entry are three orders and
        // were billed for four; three pyramided entries closed in one go are four
        // orders and were billed for two. An exit now charges its own side and
        // claims its share of what the entries already paid.
        const entryFee = this.commissionFor(currentPrice, numQty);
        if (entryFee !== 0) {
            ctx.cash -= entryFee;
            ctx.commissionPaid += entryFee;
            ctx.position.entryCommission = (ctx.position.entryCommission ?? 0) + entryFee;
        }
        if (wasFlat) { ctx.position.entries = []; ctx.position.ledger = {}; }
        const owned = (ctx.position.ledger ??= {});
        owned[id] = { qty: (owned[id]?.qty ?? 0) + numQty, opened: (owned[id]?.opened ?? 0) + numQty };
        (ctx.position.entries ??= []).push({
            id, qty: numQty, opened: numQty, price: this.exactTick(currentPrice),
            bar: ctx.currentBarIndex, time: ctx.time, commission: entryFee,
            uid: `${ctx.currentBarIndex}:${ctx.filledOrderCount}`,
        });

        // Track filled orders for intraday limit
        rs.daily_filled_orders++;
        this.countOrder();
        return true;
    }

    /**
     * Whether `pyramiding` holds back an entry in this direction: the position
     * is already open the same way with as many entries as it allows.
     */
    protected pyramidingBlocks(isLong: boolean, exempt: boolean): boolean {
        const ctx = this.ctx;
        if (exempt || ctx.position.size === 0 || (ctx.position.size > 0) !== isLong) return false;
        const limit = Math.max(1, Number(ctx.scriptMeta?.pyramiding ?? 0) || 0);
        return (ctx.position.entries?.length ?? 1) >= limit;
    }

    /**
     * Whether a cash / percent-of-equity size is computed at the price the ORDER names rather
     * than the price it fills at: a market entry at the close of the bar that placed it, a
     * limit entry at its limit price even when it fills at a better open. TradingView v6,
     * AAPL 1D: dev-docs/tv-parity/_probes/sizing-price/run-20261113-043958 (market ps = qc,
     * floor(eq/close[1]); limit ps = ql, floor(eq/limit)). Only v6 has the evidence; V6Broker
     * turns it on, and moving the override to V5Broker (or here) widens it.
     */
    protected sizesAtOrderPrice(): boolean { return false; }

    /** `orderPrice` when sizing follows the order's price, else undefined (size at the fill price). */
    protected sizingPriceFor(orderPrice: number | undefined): number | undefined {
        return this.sizesAtOrderPrice() && orderPrice !== undefined && Number.isFinite(orderPrice)
            ? orderPrice : undefined;
    }

    /** The quantity an entry with no `qty` takes at `price`: `strategy.default_entry_qty`. */
    entryQtyAt(price: number): number {
        return this.defaultQty(price);
    }

    /**
     * TradingView floors an order's quantity to `syminfo.mincontract`, the
     * script's own variable staying as written. Only when the host supplied
     * the minimum: the context default (1) would floor fractional sizes to 0.
     */
    /**
     * Whether quantities are floored to `syminfo.mincontract`. TradingView evidence: v4
     * (Adaptive Momentum Test, floor to 0.00001), v5 (_probes/v5-sizing) and v6 (_probes/sizing). Overridden in
     * V4Broker (v5, v6 inherit); v2 and v3 were not probed and keep the unfloored size.
     */
    protected floorsToMinContract(): boolean { return false; }

    /**
     * Whether a percent_of_equity size leaves room for the entry commission:
     * `equity * pct / (price * (1 + commission%))`. Evidence: v4 (_probes/version-scope/v4-sizing,
     * 30/30 trades), v5 (_probes/v5-sizing) and v6 (_probes/sizing). Overridden in V4Broker (v5, v6 inherit).
     */
    protected sizesWithCommissionRoom(): boolean { return false; }

    /**
     * Whether each fill's commission is rounded to 8 decimals. Evidence: v6 only
     * (_probes/sizing-precision); v4-sizing checks position sizes, not commission values.
     */
    protected roundsCommissionTo8(): boolean { return false; }

    protected floorToMinContract(qty: number): number {
        const ctx = this.ctx;
        const m = ctx.mincontract;
        if (!this.floorsToMinContract() || !ctx.mincontractSupplied || !Number.isFinite(qty) || !(m > 0)) return qty;
        const steps = Math.floor(qty / m + 1e-9);
        // Multiply back, then trim the float noise (0.001 * 22 = 0.022000000000000002).
        return Number((steps * m).toPrecision(12));
    }

    protected defaultQty(price: number): number {
        const ctx = this.ctx;
        const meta = ctx.scriptMeta;
        const value = Number(meta?.default_qty_value ?? 1);
        if (!Number.isFinite(value) || value <= 0) return 0;

        switch (meta?.default_qty_type) {
            case cash:
                return price > 0 ? value / price : 0;
            case percent_of_equity:
            {
                // TradingView sizes the order so the entry commission fits in the equity.
                const fee = this.sizesWithCommissionRoom() && meta?.commission_type === commission.percent
                    ? 1 + Number(meta?.commission_value ?? 0) / 100 : 1;
                return price > 0 ? (equity(ctx) * value / 100) / (price * fee) : 0;
            }
            default:
                return value;
        }
    }

    close(
        id: string, when: any = undefined, comment: string = "",
        qty: any = Number.NaN, qty_percent: any = Number.NaN, alert_message: string = "",
        immediately: any = false,
    ) {
        const ctx = this.ctx;
        if (!this.gated(when)) return;
        void alert_message;
        // `strategy.close(id)` exits the entries opened with this id and
        // nothing else; with none open it does nothing.
        if (this.openQty(id) === 0) return;
        const order: MarketOrder = {
            kind: "close", id: comment || `Close ${id}`, comment, entry: id,
            qty: val(qty), qty_percent: val(qty_percent),
        };
        this.placeClose(order, immediately);
    }

    close_all(
        comment: string = "", when: any = undefined, alert_message: string = "",
        immediately: any = false,
    ) {
        if (!this.gated(when)) return;
        void alert_message;
        this.placeClose({ kind: "close", id: comment, comment }, immediately);
    }

    /**
     * Queues a close for the next bar's open -- see MarketOrder -- or, with
     * `immediately`, fills it now. strategy.close_all: "immediately (series
     * bool) If true, the closing order will be executed on the tick where it
     * has been placed, ignoring the strategy parameters that restrict the
     * order execution to the open of the next bar." On a historical bar the
     * tick that places it is the bar's close.
     */
    protected placeClose(order: MarketOrder, immediately: any): void {
        if (val(immediately) === 1 && this.ctx.is_realtime) {
            // A live tick: "executed on the tick where it has been placed", at that
            // tick's price. The next tick rolls it back with the rest of the bar.
            this.fillClose(order, this.ctx.close);
        } else if (val(immediately) === 1) {
            // On the tick that places it is the bar's close, but AFTER the script
            // has run: the row harness_strategy_pyr0 logs on that bar still shows
            // the position open, and the trade closes at the close.
            this.ctx.marketOrders.push({ ...order, atClose: true });
        } else this.ctx.marketOrders.push(order);
    }

    closeAt(comment: string, price: number, exitId?: string, exitComment?: string): void {
        const ctx = this.ctx;
        if (ctx.position.size === 0) return;

        const isLong = ctx.position.size > 0;
        const currentPrice = this.toTick(this.slip(price, !isLong));
        const qty = Math.abs(ctx.position.size);

        this.closeEntries(qty, currentPrice, undefined, { id: comment || "Close", exitId, exitComment });
    }

    cancel(id: string, when: any = undefined): void {
        const ctx = this.ctx;
        if (!this.gated(when)) return;
        this.getPendingEntries().delete(id);
        this.getPendingExits().delete(id);
    }

    cancel_all(): void {
        const ctx = this.ctx;
        this.getPendingEntries().clear();
        this.getPendingExits().clear();
    }

    exit(
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
        comment_profit: string = "",
        comment_loss: string = "",
        comment_trailing: string = "",
    ): void {
        const ctx = this.ctx;
        if (!this.gated(when)) return;
        void alert_message;
        const exits = this.getPendingExits();
        const existing = exits.get(id);
        // An exit whose `from_entry` has neither an open trade nor an order pending
        // at the moment of the call has no effect FOR THAT CALL: the next call, once
        // the trade exists, arms it, so it is live from the bar after that. Log-
        // verified: harness_strategy_exit_order phase d (d1, exit() once before
        // entry(): never exits though its target trades on four bars; d2, entry()
        // then exit(): exits on the fill bar), after harness_strategy_reentry phase a
        // and release_notes_04 first showed it.
        const pos = ctx.position;
        const named = (e: { id: string }) => !from_entry || e.id === from_entry;
        const trades = (pos.size !== 0 ? pos.entries ?? [] : []).filter(named);
        const pendingIds = [
            ...[...this.getPendingEntries().values()].map(p => p.id),
            ...ctx.marketOrders.filter(o => o.kind === "entry").map(o => o.id),
        ].filter(i => named({ id: i }));
        if (trades.length === 0 && pendingIds.length === 0) return;
        const units = existing?.units ?? [];
        for (const t of trades) {
            if (this.hasUnit(units, t.uid)) continue;
            units.push({ uid: t.uid!, id: t.id, basis: t.price, opened: t.opened, placedBar: ctx.currentBarIndex, trail_peak: Number.NaN, filled: false });
        }
        const arms = { ...(existing?.arms ?? {}) };
        for (const i of pendingIds) arms[i] ??= ctx.currentBarIndex;
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
            // trail's high-water mark and which units have filled (`units`) have to
            // survive the re-registration, or the stop would never move and a spent
            // exit would sell again.
            trail_peak: Number.NaN,
            units, arms,
            // Set when the order is CREATED and carried across re-registration. A
            // script re-issues `strategy.exit` every bar, and restamping it here
            // would hold it one bar behind the market forever — it would never
            // become live at all.
            placedBar: existing ? existing.placedBar : ctx.currentBarIndex,
            oca_name: oca_name || "",
            comment, comment_profit, comment_loss, comment_trailing,
        });
    }


    /**
     * May an entry of `qty` at `price` be placed? A seam for V6Broker's margin
     * rule; every version before it admits every entry, as it always has.
     */
    protected admitsEntry(_isLong: boolean, _qty: number, _price: number): boolean {
        return true;
    }

    /**
     * `strategy.netprofit`: the closed trades' profit, which already carries
     * each trade's commission. Summed as the trades close (`recordTrade`), in
     * the order a re-sum would add them, and rolled back with the snapshot.
     */
    netProfit(): number {
        return this.ctx.netProfitSum;
    }

    /**
     * What `strategy.netprofit` reports: the closed trades' profit less the
     * open position's entry commission, charged when the entry FILLS, not when
     * the trade closes. TradingView's v6 log reads -12.0041896 the bar a 0.731
     * entry at 82108 fills, at 0.02% (conformance/v6/golden/harness_v6_strategy).
     * The migration guides document no difference between versions, so every
     * version has it. Only the accessor: `avg_trade` and `netprofit_percent`
     * are defined over closed trades, and stay on `netProfit`.
     */
    reportedNetProfit(): number {
        return this.netProfit() - (this.ctx.position.entryCommission ?? 0);
    }

    /**
     * The margin requirement for a side, as a ratio: 25% margin is 0.25, and
     * 0 when the script sets none. Enforced only by V6Broker; read by
     * `strategy.margin_liquidation_price` too, so the two cannot disagree.
     */
    marginRatio(isLong: boolean): number {
        const meta: any = this.ctx.scriptMeta ?? {};
        const pct = Number(isLong ? meta.margin_long : meta.margin_short);
        return Number.isFinite(pct) && pct > 0 ? pct / 100 : 0;
    }

    /**
     * Fills at the bar's close what is due there once the script has run: every
     * queued market order under `process_orders_on_close`, otherwise the
     * closes placed with `immediately`.
     */
    fillAtClose(): void {
        const ctx = this.ctx;
        if (ctx.marketOrders.length === 0) return;
        if (this.fillsOnClose()) { this.fillMarketOrders(ctx.close); return; }
        const now = ctx.marketOrders.filter(o => o.atClose);
        if (now.length === 0) return;
        const rest = ctx.marketOrders.filter(o => !o.atClose);
        ctx.marketOrders = now;
        this.fillMarketOrders(ctx.close);
        ctx.marketOrders = rest;
    }

    /**
     * Whether the strategy halts at its 9000th order (v4, v5) instead of
     * trimming the oldest (v6, which overrides this). Doc-only; see the table at the top of this file.
     */
    protected haltsAtOrderLimit(): boolean {
        return true;
    }

    /** One more order filled: past 9000 a pre-v6 strategy stops with a runtime error. */
    protected countOrder(): void {
        const ctx = this.ctx;
        ctx.filledOrderCount++;
        if (ctx.filledOrderCount > ORDER_LIMIT && this.haltsAtOrderLimit()) {
            throw new Error(
                `The strategy has filled more than ${ORDER_LIMIT} orders. Before Pine Script v6 a strategy ` +
                "stops there; v6 trims the oldest orders and continues.");
        }
    }

    /** Whether market orders fill at the close of the bar that placed them. */
    fillsOnClose(): boolean {
        return Boolean(this.ctx.scriptMeta?.process_orders_on_close);
    }

    /**
     * One exit level, given as an absolute PRICE and/or a RELATIVE distance
     * (already converted to a price). Either may be NaN.
     *
     * v1–v5: "When both absolute (limit, stop) and relative (profit, loss)
     * parameters are given, the absolute ones always win" — the v6 migration
     * guide, describing v5. `favourable` and `isLong` are unused here; they are
     * what V6Broker needs to choose between the two instead.
     */
    protected pairLevel(absolute: number, relative: number, _isLong: boolean, _favourable: boolean): number {
        return !Number.isNaN(absolute) ? absolute : relative;
    }

    protected applyEntryOCA(entries: Map<string, PendingEntry>, filledOrder: PendingEntry, price: number): void {
        if (!filledOrder.oca_name) return;

        const toDelete: string[] = [];
        for (const [id, ord] of entries.entries()) {
            if (id === filledOrder.id) continue;
            if (ord.oca_name !== filledOrder.oca_name) continue;

            if (filledOrder.oca_type === oca.cancel) {
                toDelete.push(id);
            } else if (filledOrder.oca_type === oca.reduce) {
                // An order with no `qty` takes the default size, at the price it fills at.
                const size = (o: PendingEntry) => o.qty === undefined ? this.defaultQty(price) : o.qty;
                ord.qty = Math.max(0, size(ord) - size(filledOrder));
                if (ord.qty <= 0) toDelete.push(id);
            }
            // oca.none — do nothing
        }
        for (const id of toDelete) entries.delete(id);
    }

    protected applyExitOCA(exits: Map<string, PendingExit>, filledExit: PendingExit): void {
        if (!filledExit.oca_name) return;

        const toDelete: string[] = [];
        for (const [id, ex] of exits.entries()) {
            if (id === filledExit.id) continue;
            if (ex.oca_name !== filledExit.oca_name) continue;
            toDelete.push(id);
        }
        for (const id of toDelete) exits.delete(id);
    }

    protected commissionFor(price: number, qty: number): number {
        const ctx = this.ctx;
        const meta = ctx.scriptMeta;
        const value = Number(meta?.commission_value ?? 0);
        if (!Number.isFinite(value) || value === 0) return 0;
        // Each fill's commission is rounded to 8 decimals: TradingView's logged
        // netprofit and equity carry the rounded fees, and the difference in the 8th
        // decimal compounds over hundreds of trades (_probes/sizing-precision).
        const round8 = this.roundsCommissionTo8() ? (x: number): number => Math.round(x * 1e8) / 1e8 : (x: number): number => x;
        switch (meta?.commission_type) {
            case commission.cash_per_contract: return round8(value * Math.abs(qty));
            case commission.cash_per_order: return value;
            default: return round8(Math.abs(price * qty) * value / 100);
        }
    }

    protected slip(price: number, buying: boolean): number {
        const ctx = this.ctx;
        const ticks = Number(ctx.scriptMeta?.slippage ?? 0);
        const tick = Number(ctx.mintick);
        if (!Number.isFinite(ticks) || ticks === 0) return price;
        if (!Number.isFinite(tick) || tick <= 0 || !Number.isFinite(price)) return price;
        return price + (buying ? 1 : -1) * ticks * tick;
    }

    protected recordTrade(t: {
        id: string; entryPrice: number; exitPrice: number;
        qty: number; pnl: number; direction: "long" | "short";
        exitId?: string; exitComment?: string;
        /** The entry this trade closes, where the broker tracks entries. */
        entry?: { id: string; bar: number; time: number; commission: number };
        /** A further entry closed by the same order: a flat per-order fee was paid by the first. */
        sameOrder?: boolean;
    }): void {
        const ctx = this.ctx;
        // The exit's own order fee, plus this trade's share of what the position's
        // entries already paid — pro rata by quantity, which is exact for the two
        // per-contract and percentage types and the only sensible split of a flat
        // per-order fee across a partial exit. The position has not been reduced
        // yet at this point, so `size` is what was held going in.
        // The bar this exit filled on has not been through `sampleEquity` yet:
        // bracket exits fill in `setBar` before the script runs, and a market
        // close fills at the next open, both ahead of the end-of-bar sample. So
        // the excursion was read WITHOUT the bar the trade died on — a long at
        // 100 stopped out at 95 on the next bar reported a drawdown of zero.
        //
        // Folding in the exit price is a lower bound, deliberately. Where the
        // price went between this bar's open and the fill is not knowable from a
        // candle, and claiming the bar's full high and low would credit the trade
        // with an extreme it may have been closed before reaching.
        const travelled = t.direction === "long"
            ? t.exitPrice - t.entryPrice
            : t.entryPrice - t.exitPrice;
        const runup = Math.max(ctx.positionRunup, Math.max(0, travelled) * t.qty);
        const drawdown = Math.max(ctx.positionDrawdown, Math.max(0, -travelled) * t.qty);

        const exitFee = t.sameOrder && this.ctx.scriptMeta?.commission_type === commission.cash_per_order
            ? 0 : this.commissionFor(t.exitPrice, t.qty);
        const held = Math.abs(ctx.position.size) || t.qty;
        const paidOnEntry = ctx.position.entryCommission ?? 0;
        const entryShare = t.entry ? t.entry.commission
            : held > 0 ? paidOnEntry * Math.min(1, t.qty / held) : paidOnEntry;
        ctx.position.entryCommission = paidOnEntry - entryShare;

        // A strategy in another currency books each closed trade, and its
        // commission, at the exit bar's rate (1 when nothing converts).
        const rate = ctx.accountRate();
        const fee = (exitFee + entryShare) * rate;
        const net = rate === 1 ? t.pnl - fee : (t.pnl - exitFee - entryShare) * rate;

        ctx.netProfitSum += net;
        ctx.trades.push({
            id: t.id,
            entryTime: t.entry ? t.entry.time : this.entryTimeOf(),
            entryPrice: t.entryPrice,
            exitTime: ctx.time,
            exitPrice: t.exitPrice,
            qty: t.qty,
            pnl: net,
            direction: t.direction,
            entryBarIndex: t.entry ? t.entry.bar : ctx.position.entryBarIndex,
            exitBarIndex: ctx.currentBarIndex,
            entryId: t.entry ? t.entry.id : ctx.position.entryId,
            runup,
            drawdown,
            commission: fee,
            ...(t.exitId !== undefined ? { exitId: t.exitId } : {}),
            ...(t.exitComment !== undefined ? { exitComment: t.exitComment } : {}),
        });

        // Only the exit side moves cash and the running total here; the entry
        // side left both at its own fill.
        // The entry fee left cash unconverted at the entry fill, so it is given
        // back before the converted trade is booked.
        ctx.cash += rate === 1 ? t.pnl - exitFee : net + entryShare;
        ctx.commissionPaid += exitFee * rate;
    }

    protected entryTimeOf(): number {
        const ctx = this.ctx;
        const stamped = ctx.position.entryTime;
        if (typeof stamped === "number") return stamped;
        const bar = ctx.position.entryBarIndex;
        if (bar === undefined) return 0;
        const at = ctx.barTimes[bar];
        return typeof at === "number" ? at : 0;
    }

    protected toTick(price: number): number {
        const ctx = this.ctx;
        const tick = Number(ctx.mintick);
        if (!Number.isFinite(tick) || tick <= 0 || !Number.isFinite(price)) return price;
        return this.exactTick(Math.round(price / tick) * tick);
    }

    /**
     * A price already on the tick, with the float noise `round(p / tick) * tick`
     * leaves (92.85 comes out 92.85000000000001) written off. The entry's own
     * fill price is what a closed trade reports, so it has to read as the price.
     */
    protected exactTick(price: number): number {
        const tick = Number(this.ctx.mintick);
        if (!Number.isFinite(tick) || tick <= 0 || !Number.isFinite(price)) return price;
        const places = Math.min(12, Math.max(0, Math.ceil(-Math.log10(tick) - 1e-9)));
        const clean = Number(price.toFixed(places));
        return Math.abs(clean - price) < tick * 1e-6 ? clean : price;
    }

    protected levelToTick(level: number, above: boolean): number {
        const ctx = this.ctx;
        const tick = Number(ctx.mintick);
        if (!Number.isFinite(tick) || tick <= 0 || !Number.isFinite(level)) return level;
        const n = level / tick;
        // Nudge before rounding: 7334.5125/0.01 is 733451.2499999999 in binary
        // floating point, and a bare Math.ceil would take it to the wrong tick.
        const eps = 1e-9;
        return this.exactTick((above ? Math.ceil(n - eps) : Math.floor(n + eps)) * tick);
    }

    protected fillPrice(level: number, open: number, worseIsHigher: boolean): number {
        if (!Number.isFinite(open)) return level;
        return worseIsHigher ? Math.max(level, open) : Math.min(level, open);
    }

    protected livesYet(placedBar: number): boolean {
        const ctx = this.ctx;
        // Re-running a bar after a fill (`calc_on_order_fills`): what the re-run
        // placed is matched against the rest of the same bar.
        if (ctx.intrabar) return placedBar <= ctx.currentBarIndex;
        return placedBar < ctx.currentBarIndex;
    }

    /**
     * One step of `calc_on_order_fills`: fills the FIRST pending entry or exit
     * the rest of the bar's path reaches, and moves the cursor there. False
     * when nothing more is reached. Market orders are not handled here (they
     * fill at the cursor's price, see `Context.runBarWithFills`).
     */
    processIntrabarStep(): boolean {
        const before = this.ctx.filledOrderCount;
        // A candidate that does not fill is spent (dropped or marked), so this
        // ends: every pass either fills, or removes the order it picked.
        for (;;) {
            const picked = this.pickIntrabar();
            if (picked === "none") return false;
            if (this.ctx.filledOrderCount !== before) return true;
        }
    }

    private pickIntrabar(): "none" | "picked" {
        const ctx = this.ctx;
        const ib = ctx.intrabar!;
        const rs = this.syncRiskState();
        if (this.riskGate(rs, ctx.high, ctx.low)) return "none";

        const whole = Math.abs(ctx.high - ctx.open) <= Math.abs(ctx.open - ctx.low)
            ? [ctx.open, ctx.high, ctx.low, ctx.close] : [ctx.open, ctx.low, ctx.high, ctx.close];
        const k = Math.min(Math.floor(ib.cursor), whole.length - 1);
        const f0 = ib.cursor - k;
        const from = whole[k] + ((whole[Math.min(k + 1, whole.length - 1)] - whole[k]) * f0);
        const rest = [from, ...whole.slice(k + 1)];
        // A position on the remaining path, as a position on the whole one.
        const global = (at: number): number => {
            if (!Number.isFinite(at)) return at;
            const j = Math.floor(at), f = at - j;
            return j === 0 ? k + f0 + f * (1 - f0) : k + j + f;
        };
        // The first position on `rest` at which the price is at or beyond `level`.
        const reach = (level: number, up: boolean): { price: number; at: number } | null => {
            if (Number.isNaN(level)) return null;
            if (up ? rest[0] >= level : rest[0] <= level) return { price: rest[0], at: 0 };
            for (let i = 1; i < rest.length; i++) {
                const a = rest[i - 1], b = rest[i];
                if (up ? (b > a && b >= level) : (b < a && b <= level)) {
                    const px = up ? Math.max(level, a) : Math.min(level, a);
                    return { price: px, at: i - 1 + (px - a) / (b - a) };
                }
            }
            return null;
        };

        // The earliest candidate wins; an entry before an exit at the same point.
        type Pick = { at: number; rank: number; run: () => void };
        let best: Pick | null = null;
        const consider = (c: Pick) => {
            if (!best || c.at < best.at || (c.at === best.at && c.rank < best.rank)) best = c;
        };

        const entries = this.getPendingEntries();
        for (const [id, ord] of entries.entries()) {
            if (rs.daily_filled_orders >= rs.max_intraday_filled_orders) break;
            if (!this.livesYet(ord.placedBar)) continue;
            const buying = ord.dir === direction.long;
            // Held back by `pyramiding`: still working, but not fillable now.
            if (this.pyramidingBlocks(buying, ord.exempt === true)) continue;
            const limitLevel = this.levelToTick(ord.limit, !buying);
            const lim = reach(limitLevel, !buying);
            const stp = reach(this.levelToTick(ord.stop, buying), buying);
            const hit = lim && (!stp || lim.at <= stp.at) ? lim : stp;
            if (!hit) continue;
            const onLimit = hit === lim;
            consider({ at: global(hit.at), rank: 0, run: () => {
                const filled = this.entry(id, ord.dir, ord.qty, Number.NaN, Number.NaN,
                    ord.oca_name, ord.oca_type, "", undefined, "", hit.price, onLimit, ord.exempt,
                    this.sizingPriceFor(onLimit ? limitLevel : undefined));
                if (filled) {
                    entries.delete(id);
                    this.applyEntryOCA(entries, ord, this.sizingPriceFor(onLimit ? limitLevel : undefined) ?? hit.price);
                } else if (!this.pyramidingBlocks(buying, ord.exempt === true)) {
                    entries.delete(id);
                }
            } });
        }

        const exits = this.getPendingExits();
        if (ctx.position.size !== 0 && exits.size > 0) {
            const isLong = ctx.position.size > 0;
            for (const pendingExit of exits.values()) {
                const units = (pendingExit.units ??= []);
                for (const t of ctx.position.entries ?? []) {
                    const armed = pendingExit.arms?.[t.id];
                    if (armed === undefined || (pendingExit.from_entry && pendingExit.from_entry !== t.id)) continue;
                    if (this.hasUnit(units, t.uid)) continue;
                    units.push({ uid: t.uid!, id: t.id, basis: t.price, opened: t.opened, placedBar: armed, trail_peak: Number.NaN, filled: false });
                }
            }
            for (const [exitId, exit] of exits) {
                for (const unit of exit.units ?? []) {
                    if (unit.filled || !this.livesYet(unit.placedBar) || this.openQty(unit.id) <= 0) continue;
                    const path = this.walkExit(exit, unit, unit.basis, isLong, rest[0], 0, 0, 0, rest);
                    if (!path.hit) continue;
                    const hit = path.hit;
                    // Exits come after entries at the same point.
                    consider({ at: global(path.at), rank: 1, run: () => {
                        const n = ctx.filledOrderCount;
                        this.fillExitHit(rs, exits, exitId, exit, unit, hit, isLong);
                        if (ctx.filledOrderCount === n) unit.filled = true;
                    } });
                }
            }
        }

        const pick = best as Pick | null;
        if (!pick) return "none";
        // Where the fill happened is where the next step starts from.
        ib.cursor = Math.max(ib.cursor, pick.at);
        const i = Math.min(Math.floor(ib.cursor), whole.length - 1);
        ib.price = whole[i] + (whole[Math.min(i + 1, whole.length - 1)] - whole[i]) * (ib.cursor - i);
        pick.run();
        return "picked";
    }

    processPendingOrders(high: number, low: number): void {
        const ctx = this.ctx;
        // Once per bar. `Context.setBar` calls this for every run, and the strategy
        // test harness calls it directly as well; without a guard the second call
        // would fill a pending entry that the first one just placed.
        const state = ctx as any;
        if (state._ordersProcessedBar === ctx.currentBarIndex) return;
        state._ordersProcessedBar = ctx.currentBarIndex;

        const rs = this.syncRiskState();
        if (this.riskGate(rs, high, low)) return;
        this.processBarOrders(rs, high, low);
    }

    /**
     * The risk checks that run before any order is matched: true when one of
     * them halted the strategy (and so ends the bar's order processing).
     */
    protected riskGate(rs: any, high: number, low: number): boolean {
        const ctx = this.ctx;

        // --- Max Intraday Loss check ---
        if (!rs.is_halted && !Number.isNaN(rs.max_intraday_loss) && ctx.position.size !== 0) {
            const worstPrice = ctx.position.size > 0 ? low : high;
            const unrealized = (worstPrice - ctx.position.avgPrice) * ctx.position.size;
            const currentEquity = ctx.cash + unrealized;

            let breached = false;
            if (isPercentType(rs.max_intraday_loss_type)) {
                const lossPct = rs.start_equity > 0 ? ((rs.start_equity - currentEquity) / rs.start_equity) * 100 : 0;
                breached = lossPct >= rs.max_intraday_loss;
            } else {
                breached = (rs.start_equity - currentEquity) >= rs.max_intraday_loss;
            }

            if (breached) {
                rs.is_halted = true;

                const targetEquity = isPercentType(rs.max_intraday_loss_type)
                    ? rs.start_equity * (1 - rs.max_intraday_loss / 100)
                    : rs.start_equity - rs.max_intraday_loss;
                const liquidationPrice = ctx.position.avgPrice + (targetEquity - ctx.cash) / ctx.position.size;

                // Liquidated AT the level that breaches the limit, not at the
                // close. This used to be done by assigning over `ctx.close` for
                // the duration of the call, which `closeAt` makes unnecessary.
                this.closeAt("Max Intraday Loss Breach", liquidationPrice);

                this.cancel_all();
                return true;
            }
        }

        // Global risk checks
        if (this.checkRiskHalt(rs)) {
            this.cancel_all();
            if (ctx.position.size !== 0) this.closeAt("Risk Halt", ctx.open);
            return true;
        }

        // If halted from previous bar, block everything
        if (rs.is_halted) {
            this.cancel_all();
            if (ctx.position.size !== 0) this.closeAt("Risk Halt", ctx.open);
            return true;
        }
        return false;
    }

    /** Matches the pending entries and exits against the whole bar. */
    protected processBarOrders(rs: any, high: number, low: number): void {
        const ctx = this.ctx;

        // 1. Process Pending Entries (strategy.order)
        const entries = this.getPendingEntries();
        const filledEntryIds: string[] = [];

        for (const [id, ord] of entries.entries()) {
            // Check intraday filled orders limit
            if (rs.daily_filled_orders >= rs.max_intraday_filled_orders) break;
            if (!this.livesYet(ord.placedBar)) continue;

            // Snapped the same way an exit's levels are: a level the caller named
            // has to land on a tradeable increment, and rounding it toward the
            // market would fill at a price the order never agreed to. Buying, a
            // limit sits BELOW the market and a stop above; selling, the reverse.
            const buying = ord.dir === direction.long;
            const entryLimit = this.levelToTick(ord.limit, !buying);
            const entryStop = this.levelToTick(ord.stop, buying);

            let price = Number.NaN;
            let filledOnLimit = false;
            if (buying) {
                // A limit waits for the price to FALL to it, a stop for it to
                // rise. Either way the open can have passed it already.
                if (!Number.isNaN(entryLimit) && low <= entryLimit) {
                    price = this.fillPrice(entryLimit, ctx.open, false);
                    filledOnLimit = true;
                } else if (!Number.isNaN(entryStop) && high >= entryStop) {
                    price = this.fillPrice(entryStop, ctx.open, true);
                }
            } else {
                if (!Number.isNaN(entryLimit) && high >= entryLimit) {
                    price = this.fillPrice(entryLimit, ctx.open, true);
                    filledOnLimit = true;
                } else if (!Number.isNaN(entryStop) && low <= entryStop) {
                    price = this.fillPrice(entryStop, ctx.open, false);
                }
            }

            if (!Number.isNaN(price)) {
                // The fill price goes in the LAST slot now: the Pine signature owns
                // the five before it (`limit`, `stop`, `oca_name`, `oca_type`,
                // `comment`, `when`, `alert_message`).
                const filled = this.entry(id, ord.dir, ord.qty, Number.NaN, Number.NaN,
                      ord.oca_name, ord.oca_type, "", undefined, "", price, filledOnLimit, ord.exempt,
                      this.sizingPriceFor(filledOnLimit ? entryLimit : undefined));
                // Only a fill spends the order and cancels or reduces its OCA
                // group. One that `pyramiding` held back is still working: it
                // fills if an entry closes and frees the slot while its price
                // holds. (Whether TradingView keeps it or drops it is an open
                // question, see conformance/v5/parity/harness_strategy_exit_mix.)
                // Any other refusal -- margin, a size of nothing -- drops it.
                if (filled) {
                    filledEntryIds.push(id);
                    this.applyEntryOCA(entries, ord, this.sizingPriceFor(filledOnLimit ? entryLimit : undefined) ?? price);
                } else if (!this.pyramidingBlocks(buying, ord.exempt === true)) {
                    filledEntryIds.push(id);
                }
            }
        }
        for (const id of filledEntryIds) entries.delete(id);

        // 2. Process Pending Exits (strategy.exit)
        if (ctx.position.size === 0) return;

        const exits = this.getPendingExits();
        if (exits.size === 0) return;

        const isLong = ctx.position.size > 0;

        // An entry that was pending when the exit was called gets its unit when
        // it fills, live from the bar after that call.
        for (const pendingExit of exits.values()) {
            const units = (pendingExit.units ??= []);
            for (const t of ctx.position.entries ?? []) {
                const armed = pendingExit.arms?.[t.id];
                if (armed === undefined || (pendingExit.from_entry && pendingExit.from_entry !== t.id)) continue;
                if (this.hasUnit(units, t.uid)) continue;
                units.push({ uid: t.uid!, id: t.id, basis: t.price, opened: t.opened, placedBar: armed, trail_peak: Number.NaN, filled: false });
            }
        }

        // Every live unit walks the bar and says where along the broker emulator's
        // path (open, the nearer extreme, the other, close) it is reached. The fills
        // then happen in that order, not in the order the exits were placed
        // (TradingView's log, harness_strategy_reentry phase c: the limit first
        // when the open is closer to the high, the stop first when it is closer to
        // the low), and each takes the oldest trade whatever its own.
        const hits: Array<{ exitId: string; exit: PendingExit; unit: ExitUnit; hit: { price: number; kind: string }; at: number }> = [];
        for (const [exitId, exit] of exits) {
            // Performance: an exit with only absolute levels and no trail reads
            // nothing from its unit (`walkExit` has no side effect then either),
            // so every unit walks the bar to the same answer: once is enough. A
            // unit is kept for every trade the exit ever armed, and a position
            // that is reversed rather than closed leaves its units behind, so a
            // strategy that re-issues one `strategy.exit` per bar while reversing
            // collects thousands of unfilled units, and walking each one made a
            // long run quadratic (108,900 bars: 127 s, now 5.3 s).
            //
            // Invariant: while `levelsFixed`, `walkExit` must read nothing from
            // `unit` or `basis` (`basis`, `trail_peak`, `placedBar`, `opened`,
            // `uid`) and must change nothing. Anything that makes it do so for
            // such an exit has to narrow `levelsFixed` in the same edit, or the
            // shared answer is silently wrong for every unit but the first.
            // Guarded by tests/v1/runtime/broker_exit_sharing.test.ts.
            let shared: { hit: { price: number; kind: "limit" | "stop" | "trail" } | null; at: number } | undefined;
            const levelsFixed = Number.isNaN(exit.profit) && Number.isNaN(exit.loss)
                && Number.isNaN(exit.trail_price) && Number.isNaN(exit.trail_points);
            for (const unit of exit.units ?? []) {
                if (unit.filled || !this.livesYet(unit.placedBar) || this.openQty(unit.id) <= 0) continue;
                const path = levelsFixed
                    ? (shared ??= this.walkExit(exit, unit, unit.basis, isLong, ctx.open, high, low, ctx.close))
                    : this.walkExit(exit, unit, unit.basis, isLong, ctx.open, high, low, ctx.close);
                if (path.hit) hits.push({ exitId, exit, unit, hit: path.hit, at: path.at });
            }
        }
        hits.sort((x, y) => x.at - y.at);

        for (const { exitId, exit: pendingExit, unit, hit } of hits) {
            if (ctx.position.size === 0) return;
            if (unit.filled || this.openQty(unit.id) <= 0) continue;
            this.fillExitHit(rs, exits, exitId, pendingExit, unit, hit, isLong);
        }
    }

    /** Fills one exit unit at the level `hit` says the bar reached. */
    protected fillExitHit(
        rs: any, exits: Map<string, PendingExit>, exitId: string, pendingExit: PendingExit, unit: ExitUnit,
        hit: { price: number; kind: string }, isLong: boolean,
    ): void {
        const ctx = this.ctx;
        {
            const exitOnLimit = hit.kind === "limit";
            const exitOnTrail = hit.kind === "trail";

            // Closing a long is a sell, closing a short a buy — slippage is
            // adverse either way. But only on the STOP leg: a limit order
            // fills at its price or better, and slipping the take-profit
            // recorded it filling WORSE than the limit, which is something a
            // limit order cannot do. Every take-profit trade's P&L was short
            // by `slippage * mintick * qty`.
            const executedPrice = exitOnLimit
                ? this.toTick(hit.price)
                : this.toTick(this.slip(hit.price, !isLong));
            // Each unit sells its trade's share (`qty`, else `qty_percent` of what
            // the trade opened, else all of it), less what the units before it
            // have reserved on the same entry id, and never more than the id owns.
            const qty = Math.min(this.reservedQty(exits, unit), Math.abs(ctx.position.size));
            if (!(qty > 0)) return;
            const exitComment = (exitOnLimit ? pendingExit.comment_profit
                : exitOnTrail ? pendingExit.comment_trailing
                : pendingExit.comment_loss) || pendingExit.comment || undefined;
            // What is sold comes off the oldest trades, whatever their id;
            // only the ledger knows which id gave it up.
            this.closeEntries(qty, executedPrice, undefined, {
                id: `Exit ${exitId}`, exitId, exitComment, ledger: unit.id,
            });
            rs.daily_filled_orders++;
            if (pendingExit.oca_name) this.applyExitOCA(exits, pendingExit);
            // Spent, but kept so the next bar's call does not re-place it; the
            // others may still fill on this same bar.
            unit.filled = true;
            // An explicit `qty` is one order per entry id, not one per trade
            // (exit_mix phase d: `qty = 1` against A and B sells 1 of each, and
            // against one id with several trades it is still 1 in all): its
            // other units on that id are spent with it. Unverified for several
            // trades under one id.
            if (!Number.isNaN(pendingExit.qty)) {
                for (const u of pendingExit.units ?? []) if (u.id === unit.id) u.filled = true;
            }
        }
    }

    /**
     * Where the bar first reaches an exit's limit, stop or trailing stop,
     * walking the bar the way TradingView's broker emulator does: "if the
     * high is closer to the open than the low, open → high → low → close,
     * otherwise open → low → high → close". Used where the broker tracks
     * trades (every version).
     *
     * The order matters for a trailing stop more than for anything else. A
     * bar that opens at its high and falls through the activation level arms
     * the trail at the LOW; the high came before, so it cannot stop the
     * position out. Testing the bar's high against a trail armed by its low
     * exited a short TradingView kept (bar 220 of
     * conformance/v6/golden/harness_v6_strategy).
     *
     * Prices are mirrored for a short, so "up" is always the favourable side:
     * the limit above, the stops below. The trail's best price is carried
     * across bars in `trail_peak`, in real prices.
     *
     * Performance: `processPendingOrders` calls this once per exit, not once per
     * unit, for an exit with no relative levels (`profit`, `loss`) and no trail
     * (`trail_price`, `trail_points`), and gives every unit the one answer. That
     * holds only while, for such an exit, this reads nothing from `st` or `basis`
     * and leaves `st.trail_peak` as it found it (it writes back what it read,
     * NaN or the unit's own peak, which is no change). If this ever reads the
     * unit or `basis` there, update `levelsFixed` in `processPendingOrders`
     * together with it. Guarded by tests/v1/runtime/broker_exit_sharing.test.ts.
     */
    protected walkExit(
        ex: PendingExit, st: { trail_peak: number }, basis: number,
        isLong: boolean, open: number, high: number, low: number, close: number,
        // The path to walk instead of open, the nearer extreme, the other, close:
        // what is left of the bar after a fill (`calc_on_order_fills`).
        path?: number[],
    ): { hit: { price: number; kind: "limit" | "stop" | "trail" } | null; at: number } {
        const ctx = this.ctx;
        const tick = ctx.mintick > 0 ? ctx.mintick : 0.01;
        const entry = basis;
        const s = isLong ? 1 : -1;
        const away = (ticks: number, favourable: boolean): number =>
            entry + (isLong === favourable ? 1 : -1) * ticks * tick;
        const m = (x: number) => s * x;

        const limit = m(this.levelToTick(this.pairLevel(ex.limit, away(ex.profit, true), isLong, true), isLong));
        const stop = m(this.levelToTick(this.pairLevel(ex.stop, away(ex.loss, false), isLong, false), !isLong));
        const activation = m(this.pairLevel(ex.trail_price, away(ex.trail_points, true), isLong, true));
        const offset = ex.trail_offset * tick;
        const trails = !Number.isNaN(activation) && !Number.isNaN(offset);
        let peak = Number.isNaN(st.trail_peak) ? NaN : m(st.trail_peak);

        const trailStop = () => (trails && !Number.isNaN(peak) ? peak - offset : NaN);
        const stopNow = (): { level: number; kind: "stop" | "trail" } | null => {
            const t = trailStop();
            if (Number.isNaN(stop) && Number.isNaN(t)) return null;
            if (Number.isNaN(t) || (!Number.isNaN(stop) && stop >= t)) return { level: stop, kind: "stop" };
            return { level: t, kind: "trail" };
        };
        // With a zero offset the trail is armed AT its activation level and then holds
        // there for the rest of that bar: the bar's higher prices move it only
        // when the bar is over. harness_release_notes_04's v5 log: two exits
        // with `trail_points` 50 and 100 and a zero offset, on a bar that ran
        // far above both, closed 20 contracts each at the activation prices
        // (net profit 30), not at the bar's high.
        const live = offset > 0;
        let barHigh = NaN;
        const arm = (x: number) => {
            if (!trails) return;
            if (!live) {
                if (Number.isNaN(peak) && x >= activation) peak = activation;
                if (!Number.isNaN(peak) && !(x <= peak)) barHigh = Number.isNaN(barHigh) ? x : Math.max(barHigh, x);
                return;
            }
            if (!Number.isNaN(peak)) peak = Math.max(peak, x);
            else if (x >= activation) peak = x;
        };
        // `at` is how far along the bar's path the level is reached: the segment
        // index plus the share of that segment covered. Fills happen in that order.
        const done = (price: number, kind: "limit" | "stop" | "trail", at = 0) => {
            st.trail_peak = Number.isNaN(peak) ? NaN : m(peak);
            return { hit: { price: m(price), kind }, at };
        };

        const points = path ?? (Math.abs(high - open) <= Math.abs(open - low)
            ? [open, high, low, close] : [open, low, high, close]);
        const p = points.map(m);

        // The open: a gap through a level fills there, at the open.
        if (!Number.isNaN(limit) && p[0] >= limit) return done(p[0], "limit");
        const atOpen = stopNow();
        if (atOpen && p[0] <= atOpen.level) return done(p[0], atOpen.kind);
        arm(p[0]);

        for (let i = 1; i < p.length; i++) {
            const a = p[i - 1], b = p[i];
            if (b > a) {
                if (!Number.isNaN(limit) && b >= limit) {
                    const px = Math.max(limit, a);
                    return done(px, "limit", i - 1 + (px - a) / (b - a));
                }
                arm(b);
            } else if (b < a) {
                const st = stopNow();
                if (st && b <= st.level) {
                    const px = Math.min(st.level, a);
                    return done(px, st.kind, i - 1 + (a - px) / (a - b));
                }
            }
        }
        if (!Number.isNaN(barHigh)) peak = Math.max(peak, barHigh);
        st.trail_peak = Number.isNaN(peak) ? NaN : m(peak);
        return { hit: null, at: Infinity };
    }

    /**
     * Whether the exit already has a unit for trade `uid`. Performance: a scan
     * from the newest, where the live trade's unit is, instead of
     * `units.some` over the thousands a reversing strategy leaves behind.
     */
    protected hasUnit(units: ExitUnit[], uid: string | undefined): boolean {
        for (let i = units.length - 1; i >= 0; i--) if (units[i].uid === uid) return true;
        return false;
    }

    /**
     * How much the exit unit `unit` may sell: its trade's share (`qty`, else
     * `qty_percent` of what the trade opened, else all of it), less what the
     * unfilled units BEFORE it (exits in placement order, units in trade order)
     * have reserved on the same entry id, and never more than the id still owns.
     */
    protected reservedQty(exits: Map<string, PendingExit>, unit: ExitUnit): number {
        const held = this.openQty(unit.id);
        const wants = (e: PendingExit, u: ExitUnit): number =>
            !Number.isNaN(e.qty) ? e.qty
            : !Number.isNaN(e.qty_percent) ? u.opened * Math.min(100, Math.max(0, e.qty_percent)) / 100
            : u.opened;
        let reserved = 0;
        let own = 0;
        outer: for (const e of exits.values()) {
            for (const u of e.units ?? []) {
                if (u.id !== unit.id) continue;
                if (u === unit) { own = wants(e, u); break outer; }
                if (!u.filled) reserved += wants(e, u);
            }
        }
        const scale = 1e10;
        return Math.round(Math.max(0, Math.min(own, held - reserved)) * scale) / scale;
    }

    /** What the entry id still owns on the ledger; see `Position.ledger`. */
    protected openQty(id: string): number {
        const pos = this.ctx.position;
        if (pos.size === 0) return 0;
        return pos.ledger?.[id]?.qty ?? 0;
    }

    /**
     * The price a relative level is measured from for an exit scoped to entry
     * `id`: the fill price of the oldest open trade with that id
     * (harness_strategy_exit_mix: `profit = 1` from_entry "B" exits at B's fill
     * plus one tick, not at the average). Several trades under one id are not
     * covered by the log; the oldest is a choice. With none open, the average.
     */
    protected basisPrice(id: string): number {
        const pos = this.ctx.position;
        return pos.entries?.find(e => e.id === id)?.price ?? pos.avgPrice;
    }

    /**
     * Closes `qty` of the position at `price` (already on the tick and
     * slipped), from the entries named `only` or else oldest first, and books
     * ONE TRADE PER ENTRY it consumes, at that entry's own price and with that
     * entry's own commission — TradingView's list of trades. What is left
     * re-averages: the position's price is the remaining entries'.
     */
    protected closeEntries(
        qty: number, price: number, only: string | undefined,
        names: { id: string; exitId?: string; exitComment?: string; ledger?: string },
    ): void {
        const ctx = this.ctx;
        const pos = ctx.position;
        const isLong = pos.size > 0;
        const entries = pos.entries ?? [];
        const EPS = ENTRY_EPS;
        this.countOrder();
        let left = qty;
        let booked = 0;
        const consumed: Array<[string, number]> = [];
        for (const e of entries) {
            if (left <= EPS) break;
            if (only !== undefined && e.id !== only) continue;
            const take = Math.min(e.qty, left);
            const share = e.qty > 0 ? e.commission * take / e.qty : 0;
            this.recordTrade({
                id: names.id, entryPrice: e.price, exitPrice: price, qty: take,
                pnl: (isLong ? price - e.price : e.price - price) * take,
                direction: isLong ? "long" : "short",
                exitId: names.exitId, exitComment: names.exitComment,
                entry: { id: e.id, bar: e.bar, time: e.time, commission: share },
                sameOrder: booked++ > 0,
            });
            e.commission -= share;
            e.qty = Math.round((e.qty - take) / EPS) * EPS;
            left -= take;
            consumed.push([e.id, take]);
        }
        // The ledger: the id the order named gives up everything taken; with no
        // id named, each trade's own id gives up what came off it.
        const owned = (pos.ledger ??= {});
        const give = (id: string, q: number) => { if (owned[id]) owned[id].qty = Math.max(0, owned[id].qty - q); };
        if (names.ledger !== undefined) give(names.ledger, qty - left);
        else for (const [id, q] of consumed) give(id, q);
        pos.entries = entries.filter(e => e.qty > EPS);
        const held = pos.entries.reduce((s, e) => s + e.qty, 0);
        if (held <= EPS) {
            pos.size = 0;
            pos.avgPrice = 0;
            pos.entryBarIndex = undefined;
            pos.entryTime = undefined;
            pos.entryCommission = 0;
            pos.entryId = undefined;
            pos.entries = [];
            // Flat. The exits of the entries that were just closed go with them; an
            // exit whose `from_entry` has not filled yet (a stop for an entry still
            // pending behind a reversal) is still waiting and stays.
            const closedIds = new Set(Object.keys(pos.ledger ?? {}));
            for (const [exitId, e] of this.getPendingExits()) {
                if (!e.from_entry || closedIds.has(e.from_entry)) this.getPendingExits().delete(exitId);
            }
            pos.ledger = {};
            return;
        }
        pos.size = isLong ? held : -held;
        pos.avgPrice = pos.entries.reduce((s, e) => s + e.price * e.qty, 0) / held;
        pos.entryId = pos.entries[0].id;
        pos.entryBarIndex = pos.entries[0].bar;
        pos.entryTime = pos.entries[0].time;
        pos.entryCommission = pos.entries.reduce((s, e) => s + e.commission, 0);
    }
}
