/**
 * How far the dataset runs — `last_bar_index` and `last_bar_time`.
 *
 * Added in Pine v5 (December 2021). The release notes are explicit about the
 * property that makes them useful:
 *
 *   "Added new built-in variables that return the bar_index and time values of
 *    the last bar in the dataset. Their VALUES ARE KNOWN AT THE BEGINNING of
 *    the script's calculation: last_bar_index - Bar index of the last chart
 *    bar. last_bar_time - UNIX time of the last chart bar."
 *
 * That guarantee is the whole point. `bar_index == last_bar_index - 1` and
 * `last_bar_index - bar_index <= 100` are how scripts find the right-hand edge
 * of the chart, and both are meaningless if the answer only arrives on the last
 * bar.
 *
 * The Context cannot derive it — it is fed one bar at a time — so the HOST
 * declares it up front with `provideDatasetExtent`. See the note on that method
 * for what happens when a host does not, and why the fallback is a documented
 * divergence rather than a silent one.
 *
 * Source: https://www.tradingview.com/pine-script-docs/v5/release-notes/
 */
import { Context } from "../context";

/**
 * Bar index of the last bar in the dataset.
 * @getter
 * @returns {integer} The last bar's index, known from the first bar.
 */
export function last_bar_index(ctx: Context): number {
    return ctx.lastBarIndex;
}

/**
 * UNIX time of the last bar in the dataset, in milliseconds.
 * @getter
 * @returns {integer} The last bar's opening time, known from the first bar.
 */
export function last_bar_time(ctx: Context): number {
    return ctx.lastBarTime;
}
