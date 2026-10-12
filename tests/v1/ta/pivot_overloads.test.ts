/**
 * `ta.pivothigh` / `ta.pivotlow` — the two-argument overload.
 *
 * Pine gives each pivot function two signatures:
 *
 *     ta.pivothigh(source, leftbars, rightbars)
 *     ta.pivothigh(leftbars, rightbars)          // source defaults to `high`
 *     ta.pivotlow(source, leftbars, rightbars)
 *     ta.pivotlow(leftbars, rightbars)           // source defaults to `low`
 *
 * The registry has one entry per name and cannot express an overload, so the
 * shorter form arrived as `(5, 5, undefined)`: `rightbars` became NaN, every
 * length derived from it became NaN, and the function returned `na` on every
 * bar. It never threw — a pivot indicator written the documented short way
 * simply plotted nothing, which is the worst way for a function to be wrong.
 *
 * Found by running TradingView's own documentation examples
 * (examples/v5/tradingview-docs/v5-language-operators-08.pine) against the
 * engine: 0 of 506 bars finite where the three-argument form gave 28.
 *
 * The assertion is that the two forms AGREE. That is the actual contract, and
 * it cannot pass by accident the way a hand-picked expected value can.
 */
import { describe, it } from "vitest";
import assert from "node:assert";
import { Context } from "../../../runtime/v1/context";
import * as ta from "../../../runtime/v1/stdlib/ta";

/** A deterministic OHLC walk — no dependency on the shared bar generator. */
function bars(n: number, seed: number) {
    let s = seed, out: { high: number; low: number; close: number }[] = [];
    for (let i = 0; i < n; i++) {
        s = (s * 1103515245 + 12345) & 0x7fffffff;
        const mid = 100 + ((s % 2000) / 100);
        out.push({ high: mid + 1.5, low: mid - 1.5, close: mid });
    }
    return out;
}

describe("ta pivot overloads — two-argument form", () => {
    for (const [left, right] of [[2, 2], [5, 5], [3, 1], [1, 4]]) {
        it(`pivothigh(${left}, ${right}) equals pivothigh(high, ${left}, ${right})`, () => {
            // Separate contexts: each call site keeps its own buffer, and the
            // two forms must be compared as independent runs of one script.
            const short = new Context(), long = new Context();
            const data = bars(400, 31 + left * 7 + right);
            let finite = 0;

            for (const b of data) {
                short.setBar(0, b.close, b.high, b.low, b.close, 1);
                long.setBar(0, b.close, b.high, b.low, b.close, 1);

                const a = short.call("$probe_ph2@t", ta.pivothigh, short, left, right, undefined);
                const c = long.call("$probe_ph3@t", ta.pivothigh, long, b.high, left, right);

                assert.strictEqual(Number.isNaN(a), Number.isNaN(c), "na-ness must agree");
                if (!Number.isNaN(a)) { assert.strictEqual(a, c); finite++; }
                short.finalizeBar(); long.finalizeBar();
            }
            assert.ok(finite > 0, "the two-argument form produced no pivots at all");
        });

        it(`pivotlow(${left}, ${right}) equals pivotlow(low, ${left}, ${right})`, () => {
            const short = new Context(), long = new Context();
            const data = bars(400, 91 + left * 7 + right);
            let finite = 0;

            for (const b of data) {
                short.setBar(0, b.close, b.high, b.low, b.close, 1);
                long.setBar(0, b.close, b.high, b.low, b.close, 1);

                const a = short.call("$probe_pl2@t", ta.pivotlow, short, left, right, undefined);
                const c = long.call("$probe_pl3@t", ta.pivotlow, long, b.low, left, right);

                assert.strictEqual(Number.isNaN(a), Number.isNaN(c), "na-ness must agree");
                if (!Number.isNaN(a)) { assert.strictEqual(a, c); finite++; }
                short.finalizeBar(); long.finalizeBar();
            }
            assert.ok(finite > 0, "the two-argument form produced no pivots at all");
        });
    }
});
