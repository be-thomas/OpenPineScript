/**
 * `strategy.opentrades.*` and `strategy.closedtrades.*` — the trade inspectors.
 *
 * SOURCING. From the manual's strategies page, these are indexed accessors:
 * `strategy.opentrades.entry_price(trade_num)` "returns the entry price of the
 * open trade at `trade_num`", and the `closedtrades` family answers the same
 * questions about trades that have already been closed. Trade numbers are
 * ZERO-BASED and count from the oldest.
 *
 * ── Why this is a file of its own ───────────────────────────────────────────
 *
 * `strategy.opentrades` is BOTH a number — how many trades are open — and the
 * root of these functions. `runtime/v1/stdlib/strategy.ts` is a namespace
 * module, so its exported `function opentrades(ctx)` already claims that key,
 * and TypeScript will not let one name be a function and an object literal in
 * one file.
 *
 * So the sub-members are declared here, in a non-namespace file whose exported
 * object is called `strategy`. The generator reads the object literal and emits
 * `strategy.opentrades.entry_price`; `createStdlib` then attaches those members
 * onto the getter function, which is the merge it already does for `log.info`
 * beside a flat `log`.
 *
 * ── What is a trade ─────────────────────────────────────────────────────────
 *
 * An open trade is one filled entry not yet fully closed (see ../openTrades),
 * so `strategy.opentrades` is the length of the list these functions index. A
 * partial close shrinks the oldest entry's size; it does not add a trade.
 * The excursions (`max_drawdown`, `max_runup`) are tracked for the position as
 * a whole, and every open trade reports that figure.
 */
import { Context } from "../context";
import { val } from "../../../utils/v2/common";
import { openTrades } from "../openTrades";

/**
 * The index of the oldest closed trade that is still inspectable.
 *
 * 0 unless the profile caps how many are kept. v6 does: "By default,
 * strategies preserve information for up to the latest 9000 trades", trimming
 * "the oldest closed trades", and "the strategy.closedtrades.*() functions
 * return na for all trimmed trades" — the Strategies page, trade limit.
 *
 * Trimming is a REPORTING rule, so the trades are not deleted: the same page
 * says the limit "does not affect the data displayed in the Metrics tab or
 * accessed by other strategy.* built-ins", so netprofit and the trade count
 * still see every trade. Only the per-trade accessors stop answering, which is
 * why this is an index rather than a splice.
 *
 * v1–v5 have no such field and keep every trade inspectable. (TradingView
 * halts a v5 strategy past 9000 orders instead: v4 and v5 do, in
 * `Broker.countOrder`.)
 */
function firstRetained(ctx: Context): number {
  const keep = ctx.profile?.defaults.retainedClosedTrades;
  return keep === undefined ? 0 : Math.max(0, ctx.trades.length - keep);
}

/** The closed trade at `n`, oldest first, or null when `n` is out of range. */
function closed(ctx: Context, n: any) {
  const index = Math.trunc(Number(val(n)));
  return Number.isFinite(index) && index >= firstRetained(ctx) && index < ctx.trades.length
    ? ctx.trades[index]
    : null;
}

/** The open trade at `n`, oldest first, or null when `n` is out of range. */
function open(ctx: Context, n: any) {
  const index = Math.trunc(Number(val(n)));
  const list = openTrades(ctx);
  return Number.isFinite(index) && index >= 0 && index < list.length ? list[index] : null;
}

/** The trade's size as a signed number: positive long, negative short. */
const signed = (ctx: Context, qty: number): number => (ctx.position.size < 0 ? -qty : qty);

export const strategy = {
  opentrades: {
    /** The entry price of the open trade at `trade_num`. */
    entry_price: (ctx: Context, trade_num: any = 0): number =>
      open(ctx, trade_num)?.price ?? NaN,

    /** The bar index on which the open trade at `trade_num` was entered. */
    entry_bar_index: (ctx: Context, trade_num: any = 0): number =>
      open(ctx, trade_num)?.bar ?? NaN,

    /** The order id that opened the trade at `trade_num`. */
    entry_id: (ctx: Context, trade_num: any = 0): any =>
      open(ctx, trade_num)?.id ?? NaN,

    /** The trade's UNREALISED profit, in the strategy's currency. */
    profit: (ctx: Context, trade_num: any = 0): number => {
      const t = open(ctx, trade_num);
      return t ? (ctx.close - t.price) * signed(ctx, t.qty) : NaN;
    },

    /** The trade's direction as a signed size: positive long, negative short. */
    size: (ctx: Context, trade_num: any = 0): number => {
      const t = open(ctx, trade_num);
      return t ? signed(ctx, t.qty) : NaN;
    },

    /** The open position's largest adverse and favourable excursions so far. */
    max_drawdown: (ctx: Context, trade_num: any = 0): number =>
      open(ctx, trade_num) ? ctx.positionDrawdown : NaN,
    max_runup: (ctx: Context, trade_num: any = 0): number =>
      open(ctx, trade_num) ? ctx.positionRunup : NaN,
    /** Unrealised result as a percentage of the entry value. */
    profit_percent: (ctx: Context, trade_num: any = 0): number => {
      const t = open(ctx, trade_num);
      return t ? ((ctx.close - t.price) * signed(ctx, t.qty)) / (t.price * t.qty) * 100 : NaN;
    },
    /** When the open trade began, UNIX ms. */
    entry_time: (ctx: Context, trade_num: any = 0): number =>
      open(ctx, trade_num)?.time ?? NaN,
    /** Entry commission paid on the open trade. */
    commission: (ctx: Context, trade_num: any = 0): number => {
      const t = open(ctx, trade_num);
      return t ? t.commission : NaN;
    },
    /** The entry order's comment, which this engine does not record: na. */
    entry_comment: (_ctx: Context, _trade_num: any = 0): any => NaN,
  },

  closedtrades: {
    /**
     * v6: the index of the oldest closed trade that has not been trimmed —
     * "0, representing the actual first trade in the simulation" until the
     * strategy has more than 9000. A v6-only name; see renames6.ts.
     * @getter
     */
    first_index: (ctx: Context): number => firstRetained(ctx),

    /** The entry price of the closed trade at `trade_num`. */
    entry_price: (ctx: Context, trade_num: any = 0): number =>
      closed(ctx, trade_num)?.entryPrice ?? NaN,

    /** The exit price of the closed trade at `trade_num`. */
    exit_price: (ctx: Context, trade_num: any = 0): number =>
      closed(ctx, trade_num)?.exitPrice ?? NaN,

    /**
     * The order id that opened the closed trade at `trade_num`. `id` is the
     * CLOSING order's name, which is what this returned until TradingView's
     * log showed "L" where it read "Exit XL1".
     */
    entry_id: (ctx: Context, trade_num: any = 0): any => {
      const t = closed(ctx, trade_num);
      return t ? t.entryId ?? t.id : NaN;
    },

    /**
     * The id of the order that closed the trade at `trade_num`, or na when
     * there is no such trade — the string "NaN" passed `na()` as a value.
     */
    exit_id: (ctx: Context, trade_num: any = 0): any => {
      const t = closed(ctx, trade_num);
      return t ? t.exitId ?? t.id : NaN;
    },

    /** The comment of the order that closed the trade, or na when it had none. */
    exit_comment: (ctx: Context, trade_num: any = 0): any => {
      const t = closed(ctx, trade_num);
      return t?.exitComment ? t.exitComment : NaN;
    },

    /** Commission paid on the trade's entry and exit, in the account currency. */
    commission: (ctx: Context, trade_num: any = 0): number => {
      const t = closed(ctx, trade_num);
      return t ? t.commission ?? 0 : NaN;
    },

    /** The bar index the closed trade was entered on. */
    entry_bar_index: (ctx: Context, trade_num: any = 0): number => {
      const t = closed(ctx, trade_num);
      return t ? ctx.barIndexOfTime(t.entryTime) : NaN;
    },

    /** The bar index the closed trade was exited on. */
    exit_bar_index: (ctx: Context, trade_num: any = 0): number => {
      const t = closed(ctx, trade_num);
      return t ? ctx.barIndexOfTime(t.exitTime) : NaN;
    },

    /** The trade's REALISED profit, in the strategy's currency. */
    profit: (ctx: Context, trade_num: any = 0): number =>
      closed(ctx, trade_num)?.pnl ?? NaN,

    /** The trade's size as a signed number: positive long, negative short. */
    size: (ctx: Context, trade_num: any = 0): number => {
      const t = closed(ctx, trade_num);
      return t ? (t.direction === "short" ? -t.qty : t.qty) : NaN;
    },

    /** The largest adverse excursion while the trade was open, in money. */
    max_drawdown: (ctx: Context, trade_num: any = 0): number =>
      closed(ctx, trade_num)?.drawdown ?? NaN,
    /** The largest favourable excursion, in money. */
    max_runup: (ctx: Context, trade_num: any = 0): number =>
      closed(ctx, trade_num)?.runup ?? NaN,
    /** The drawdown as a percentage of the trade's entry value. */
    max_drawdown_percent: (ctx: Context, trade_num: any = 0): number => {
      const t = closed(ctx, trade_num);
      return t ? ((t.drawdown ?? NaN) / (t.entryPrice * t.qty)) * 100 : NaN;
    },
    /** The run-up as a percentage of the trade's entry value. */
    max_runup_percent: (ctx: Context, trade_num: any = 0): number => {
      const t = closed(ctx, trade_num);
      return t ? ((t.runup ?? NaN) / (t.entryPrice * t.qty)) * 100 : NaN;
    },
    /** The trade's result as a percentage of its entry value. */
    profit_percent: (ctx: Context, trade_num: any = 0): number => {
      const t = closed(ctx, trade_num);
      return t ? (t.pnl / (t.entryPrice * t.qty)) * 100 : NaN;
    },
    /** When the trade opened and closed, UNIX ms. */
    entry_time: (ctx: Context, trade_num: any = 0): number =>
      closed(ctx, trade_num)?.entryTime ?? NaN,
    exit_time: (ctx: Context, trade_num: any = 0): number =>
      closed(ctx, trade_num)?.exitTime ?? NaN,
    /** The entry order's comment, which this engine does not record: na. */
    entry_comment: (_ctx: Context, _trade_num: any = 0): any => NaN,
  },
};
