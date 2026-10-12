/**
 * `session.*` — which trading session a bar belongs to, and where in it.
 *
 * Two constants and six per-bar booleans, quoted from the manual's Sessions
 * page:
 *
 *   session.regular   "Represents the regular trading session."
 *   session.extended  "Represents the extended trading session."
 *
 *   session.ismarket        "Is true when the bar belongs to regular trading
 *                            hours. On '1D' and above timeframes, this variable
 *                            is always true."
 *   session.ispremarket     "Is true when the bar belongs to the extended
 *                            session preceding regular trading hours."
 *   session.ispostmarket    "Is true when the bar belongs to the extended
 *                            session following regular trading hours."
 *   session.isfirstbar      "Is true if the current bar is the first bar of the
 *                            day's session, and false otherwise."
 *   session.islastbar       "Is true if the current bar is the last bar of the
 *                            day's session, and false otherwise."
 *   session.isfirstbar_regular  "Is true on the first regular session bar of
 *                            the day, false otherwise."
 *   session.islastbar_regular   "Is true on the last regular session bar of the
 *                            day, false otherwise."
 *
 * ── What this engine can and cannot know ────────────────────────────────────
 *
 * A session is a property of the EXCHANGE, and this engine is handed bars and
 * nothing else — no symbol metadata, no session hours, no holiday calendar. So
 * the extended-hours questions cannot be answered from the data, and the answer
 * given is the one that matches the data actually supplied:
 *
 *   ismarket      always true
 *   ispremarket   always false
 *   ispostmarket  always false
 *
 * which is EXACTLY right for a regular-hours dataset — the ordinary OHLCV feed
 * — and wrong for one that includes extended bars. It is stated here rather
 * than hidden because a script gating entries on `not session.ispremarket`
 * would take every bar under this engine and skip some on TradingView.
 *
 * Because of that, `isfirstbar_regular` and `islastbar_regular` are the same
 * facts as `isfirstbar` and `islastbar`: with no extended bars in the dataset,
 * the first bar of the day IS the first regular bar. They are separate entries
 * anyway, so the day a host supplies extended bars there is one place to fix.
 *
 * ── Day boundaries ──────────────────────────────────────────────────────────
 *
 * `opensDay` in ../sessions.ts owns where a day starts, and its header states
 * the convention. It is shared with `ta.vwap`, which restarts its accumulation
 * on the same boundary — the two must not drift apart.
 *
 * v5-only: the registry split in ./index.ts keeps the namespace out of the
 * v1–v4 views.
 */
import { Context } from "../context";
import { opensDay } from "../sessions";

/**
 * Is the chart's timeframe intraday?
 *
 * Duplicated from ./chart.ts rather than imported: that module's `interval` is
 * a v1–v3 flat built-in, and importing a built-in from another built-in to ask
 * a question about the RUN would make the two files' registry entries look
 * related when they are not.
 */
function isIntraday(ctx: Context): boolean {
    const r = String(ctx.resolution).trim();
    const n = parseInt(r, 10);
    return Number.isFinite(n) && String(n) === r;
}

export const session = {
    // --- Constants ---------------------------------------------------------

    /** The regular trading session. */
    regular: "regular",

    /** The extended trading session. */
    extended: "extended",

    // --- Per-bar state -----------------------------------------------------

    /**
     * True when the bar belongs to regular trading hours.
     * @getter
     */
    ismarket: (_ctx: Context): boolean => true,

    /**
     * True when the bar belongs to the extended session BEFORE regular hours.
     * @getter
     */
    ispremarket: (_ctx: Context): boolean => false,

    /**
     * True when the bar belongs to the extended session AFTER regular hours.
     * @getter
     */
    ispostmarket: (_ctx: Context): boolean => false,

    /**
     * True on the first bar of the day's session.
     * @getter
     */
    isfirstbar: (ctx: Context): boolean => opensDay(ctx),

    /**
     * True on the first REGULAR-session bar of the day.
     * @getter
     */
    isfirstbar_regular: (ctx: Context): boolean => opensDay(ctx),

    /**
     * True on the last bar of the day's session.
     *
     * ── Answerable on daily and above; not answerable intraday ──────────────
     *
     * On "1D" and higher, one bar IS one session, so every bar is its session's
     * last — that is a fact about the timeframe, not a guess, and it is what
     * this returns.
     *
     * Intraday it is unanswerable here. The last bar of a day is the bar whose
     * SUCCESSOR opens a new one, and the successor has not arrived: this engine
     * is fed one bar at a time, and looking ahead is exactly the thing it must
     * not do. So intraday gets `false`, always.
     *
     * That is a stated gap rather than an approximation. A script closing
     * positions on `session.islastbar` will simply never fire intraday under
     * this engine, which is visible, instead of firing on the wrong bar, which
     * is not.
     * @getter
     */
    islastbar: (ctx: Context): boolean => !isIntraday(ctx),

    /**
     * True on the last REGULAR-session bar of the day. See `islastbar`.
     * @getter
     */
    islastbar_regular: (ctx: Context): boolean => !isIntraday(ctx),
};
