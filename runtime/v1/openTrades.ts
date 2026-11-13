/**
 * The open trades: one per filled entry that has not been fully closed.
 *
 * `strategy.opentrades` is their count and `strategy.opentrades.*(n)` index
 * the same list, oldest first, so both read it from here. It is the broker's
 * `position.entries`; a position with no entries recorded (one a test or a
 * host built by hand) is a single trade described by the position itself.
 *
 * Lives outside ./stdlib/ because every export there becomes a Pine built-in.
 */
import type { Context, OpenEntry } from "./context";

export function openTrades(ctx: Context): readonly OpenEntry[] {
  const pos = ctx.position;
  // Flat is no trades, whatever a stale list says.
  if (pos.size === 0) return [];
  if (pos.entries?.length) return pos.entries;
  const held = Math.abs(pos.size);
  return [{
    id: pos.entryId ?? "", qty: held, opened: held, price: pos.avgPrice,
    bar: pos.entryBarIndex ?? NaN, time: pos.entryTime ?? NaN,
    commission: pos.entryCommission ?? 0,
  }];
}
