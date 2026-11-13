/**
 * tests/v1/runtime/lazy_rollback_points.test.ts
 *
 * A history run takes a per-bar rollback point only at the call sites the script
 * repeats on one bar (`Context.repeatingSites`, `Session.runHistory`), and starts
 * over when it finds one it did not know. The forming bar that follows takes one
 * at every site, as it always did. These pin what that must not change:
 * a loop that starts repeating late is still rolled back, and a live bar
 * re-ticked after a long history still rolls back exactly.
 *
 * Guards: `Context.repeatingSites` / `missedRepeat` / `siteReach` (the check in
 * the call-site prologue, runtime/v1/context.ts) and `Session.runHistory` /
 * `runHistoryOnce` (runtime/v1/session.ts). These pin that the RESULTS equal a
 * run that snapshots everything; that the cloning is actually spared is pinned
 * by rollback_snapshot_work.test.ts. Background: docs/common/ARCHITECTURE.md ("Performance invariants").
 */
import { describe, it } from "vitest";
import assert from "node:assert";
import { Session } from "../../../runtime/v1";

const BARS = 1200;

const candle = (i: number, close = 100 + Math.sin(i / 7) * 10 + (i % 5)) =>
    ({ time: i * 60_000, open: close - 1, high: close + 2, low: close - 2, close, volume: 1000 + i });

const history = (n: number) => Array.from({ length: n }, (_, i) => candle(i));

const values = (series: Array<{ id: string; title?: string; data?: any[] }>, title: string): number[] => {
    const s = series.find(x => x.title === title)!;
    return (s.data ?? []).map((v: any) => (v && typeof v === "object" ? v.value : v));
};

// `q` loops three times from bar 300 on, `e` is the same average called once.
const SCRIPT = [
    "//@version=5",
    'indicator("t")',
    "reps = bar_index < 300 ? 0 : 2",
    "t = 0.0",
    "for i = 0 to reps",
    "    t := t + ta.ema(close, 4)",
    'plot(t / (reps + 1), "q")',
    'plot(ta.ema(close, 4), "e")',
    'plot(ta.sma(close, 50), "s")',
    'plot(ta.cum(close), "c")',
].join("\n");

const session = () => {
    const s = new Session();
    assert.strictEqual(s.compile(SCRIPT).errors.length, 0);
    return s;
};

describe("history runs with rollback points only where a call repeats", () => {
    it("a loop that starts repeating on bar 300 is still rolled back", () => {
        const r = session().runHistory(history(BARS));
        assert.strictEqual(r.errors.length, 0);
        const q = values(r.series as any, "q"), e = values(r.series as any, "e");
        assert.strictEqual(q.length, BARS);
        for (let i = 0; i < BARS; i++) assert.ok(Math.abs(q[i] - e[i]) < 1e-9, `bar ${i}: q=${q[i]} e=${e[i]}`);
    });

    it("re-ticking a live bar after a long history rolls state back exactly", () => {
        const s = session();
        s.runHistory(history(BARS));

        // Whatever the last tick was, the answer is the one a run that ends on
        // that bar gives.
        for (const close of [90, 140, 55, 120]) {
            const live = s.tick(candle(BARS, close));
            const ref = session().runHistory([...history(BARS), candle(BARS, close)]);
            for (const title of ["q", "e", "s", "c"]) {
                const want = values(ref.series as any, title)[BARS];
                const got = (live.series.find(x => x.id === (ref.series as any[]).find(y => y.title === title).id) as any).value;
                assert.ok(Math.abs(got - want) < 1e-9, `${title} after tick ${close}: got ${got}, want ${want}`);
            }
        }
    });

    it("the history's snapshots are switched back to every site for the forming bar", () => {
        const s = session();
        s.runHistory(history(10));
        assert.strictEqual((s as any).ctx.repeatingSites, null);
    });
});
