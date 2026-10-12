/**
 * Where one trading session ends and the next begins.
 *
 * Lives outside `stdlib/` deliberately: everything in that directory is scanned
 * by scripts/common/generate-metadata.ts and anything taking a `ctx` first
 * parameter becomes a BUILT-IN. `opensDay` is a shared helper, not a name any
 * Pine script may call, so it cannot live there.
 *
 * Two built-ins need the same answer and must not drift apart:
 *
 *   - `session.isfirstbar` / `session.islastbar`
 *   - `ta.vwap`, which restarts its accumulation every session
 *
 * ── Day boundaries ──────────────────────────────────────────────────────────
 *
 * "the day's session" is a calendar day in the EXCHANGE's timezone, and this
 * engine has no timezone. It compares UTC dates, matching ./stdlib/time.ts,
 * whose header states the same convention and the same remedy: a host that
 * supplies bar timestamps already shifted to the exchange timezone gets
 * agreement.
 *
 * This models a 24-hour session, which is right for crypto and wrong for an
 * equity whose session opens at 09:30 — there, an intraday VWAP would restart
 * at midnight instead of at the open. On DAILY and higher timeframes the
 * question does not arise: every bar falls on its own calendar day, so every
 * bar opens a session, and that falls out of the date comparison rather than
 * being special-cased.
 */
import { Context } from "./context";

/** The UTC calendar day a timestamp falls on, or null when there is none. */
function dayOf(time: number): number | null {
    if (!Number.isFinite(time) || time === 0) return null;
    const d = new Date(time);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Is this bar on a different calendar day from the one before it? */
export function opensDay(ctx: Context): boolean {
    const today = dayOf(ctx.time);
    if (today === null) return false;
    // Bar 0 has no predecessor, and it does open the first session on record.
    if (ctx.currentBarIndex === 0) return true;
    const previous = dayOf(ctx.getSeries("opsv2_time", 1));
    return previous === null || previous !== today;
}
