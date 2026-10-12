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
 * ── What is not modelled ────────────────────────────────────────────────────
 *
 * This engine's broker emulator holds ONE net position rather than a list of
 * open trades, so `strategy.opentrades` is 0 or 1 and the open-trade accessors
 * describe that one position. A pyramided strategy on TradingView would have
 * several, and its per-trade answers would differ. Closed trades ARE a list, so
 * the `closedtrades` family is exact.
 */
import { Context } from "../context";
import { val } from "../../../utils/v2/common";

/** The closed trade at `n`, oldest first, or null when `n` is out of range. */
function closed(ctx: Context, n: any) {
  const index = Math.trunc(Number(val(n)));
  return Number.isFinite(index) && index >= 0 && index < ctx.trades.length
    ? ctx.trades[index]
    : null;
}

/** Is there an open position, and is `n` its (only) index? */
function openAt(ctx: Context, n: any): boolean {
  const index = Math.trunc(Number(val(n)));
  return ctx.position.size !== 0 && index === 0;
}

export const strategy = {
  opentrades: {
    /** The entry price of the open trade at `trade_num`. */
    entry_price: (ctx: Context, trade_num: any = 0): number =>
      openAt(ctx, trade_num) ? ctx.position.avgPrice : NaN,

    /** The bar index on which the open trade at `trade_num` was entered. */
    entry_bar_index: (ctx: Context, trade_num: any = 0): number =>
      openAt(ctx, trade_num) ? ctx.position.entryBarIndex ?? NaN : NaN,

    /** The order id that opened the trade at `trade_num`. */
    entry_id: (ctx: Context, trade_num: any = 0): string =>
      openAt(ctx, trade_num) ? ctx.position.entryId ?? "" : String(NaN),

    /** The trade's UNREALISED profit, in the strategy's currency. */
    profit: (ctx: Context, trade_num: any = 0): number =>
      openAt(ctx, trade_num)
        ? (ctx.close - ctx.position.avgPrice) * ctx.position.size
        : NaN,

    /** The trade's direction as a signed size: positive long, negative short. */
    size: (ctx: Context, trade_num: any = 0): number =>
      openAt(ctx, trade_num) ? ctx.position.size : NaN,
  },

  closedtrades: {
    /** The entry price of the closed trade at `trade_num`. */
    entry_price: (ctx: Context, trade_num: any = 0): number =>
      closed(ctx, trade_num)?.entryPrice ?? NaN,

    /** The exit price of the closed trade at `trade_num`. */
    exit_price: (ctx: Context, trade_num: any = 0): number =>
      closed(ctx, trade_num)?.exitPrice ?? NaN,

    /** The order id that opened the closed trade at `trade_num`. */
    entry_id: (ctx: Context, trade_num: any = 0): string =>
      closed(ctx, trade_num)?.id ?? String(NaN),

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
  },
};
