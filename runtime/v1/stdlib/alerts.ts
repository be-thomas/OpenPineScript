/**
 * The `alert.*` constants.
 *
 * ── Why they are not in ui.ts beside alert() ────────────────────────────────
 *
 * Pine spells `alert` as BOTH a function and a namespace — `alert(msg, freq)`
 * and `alert.freq_all`. The registry generator takes a namespace from the NAME
 * of an exported object, and one module cannot export both a function and an
 * object called `alert`.
 *
 * So the pair is split across two files, exactly as `input` already is:
 * ./input.ts holds `input()` and ./inputs.ts holds the `input` object. The
 * merge in ./index.ts then hangs these members off the function object, which
 * is what makes `alert.freq_all` resolvable at the same time as `alert(…)`.
 *
 * ── What the values mean ────────────────────────────────────────────────────
 *
 * They select how often ONE alert() call may re-fire within a single realtime
 * bar. They are recorded on the alert rather than enforced — see the note on
 * alert() in ./ui.ts for why that depends on a tick feed the host supplies.
 *
 * Source: https://www.tradingview.com/pine-script-docs/v4/essential/alerts/
 */

export const alert = {
    /** Only the first call per realtime bar triggers. TradingView's default. */
    freq_once_per_bar: "freq_once_per_bar",
    /** Triggers only when the realtime bar closes. */
    freq_once_per_bar_close: "freq_once_per_bar_close",
    /** Every call during the realtime bar triggers. */
    freq_all: "freq_all",
};
