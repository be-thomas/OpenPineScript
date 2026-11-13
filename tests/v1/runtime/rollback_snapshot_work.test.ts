/**
 * tests/v1/runtime/rollback_snapshot_work.test.ts
 *
 * Guards the work bound of the lazy rollback points (`Context.repeatingSites`,
 * `Session.runHistory`; see docs/common/ARCHITECTURE.md ("Performance invariants")): a history run clones a
 * call site's state per bar only where the script repeats the call, so a
 * loop-free script snapshots each stateful site a handful of times in all, not
 * once per site per bar. A live tick must still snapshot every stateful site.
 * lazy_rollback_points.test.ts guards that the results do not change.
 */
import { describe, it, expect } from "vitest";
import { Session, Context } from "../../../runtime/v1";

const BARS = 2000;

const candle = (i: number) => {
    const close = 100 + Math.sin(i / 7) * 10 + (i % 5);
    return { time: i * 60_000, open: close - 1, high: close + 2, low: close - 2, close, volume: 1000 + i };
};

// Four stateful call sites, none of them in a loop or reached twice on a bar.
const SCRIPT = [
    "//@version=5",
    'indicator("t")',
    'plot(ta.ema(close, 10), "e")',
    'plot(ta.sma(close, 50), "s")',
    'plot(ta.rsi(close, 14), "r")',
    'plot(ta.cum(close), "c")',
].join("\n");
const SITES = 4;

function counting<T>(run: () => T): { out: T; snapshots: number } {
    const proto = Context.prototype as any;
    const real = proto.snapshotCallState;
    let snapshots = 0;
    proto.snapshotCallState = function (...args: any[]) { snapshots++; return real.apply(this, args); };
    try {
        return { out: run(), snapshots };
    } finally {
        proto.snapshotCallState = real;
    }
}

describe("rollback points taken by a history run", () => {
    it("are about one per stateful site, not one per site per bar", () => {
        const s = new Session();
        expect(s.compile(SCRIPT).errors).toHaveLength(0);
        const { out, snapshots } = counting(() => s.runHistory(Array.from({ length: BARS }, (_, i) => candle(i))));
        expect(out.errors).toHaveLength(0);
        expect(snapshots).toBeGreaterThan(0);
        // A site is snapshotted when first reached and once more to learn it
        // never repeats; allow a few more for the restarts a script may need.
        expect(snapshots).toBeLessThanOrEqual(SITES * 10);
    });

    it("are taken at every stateful site again on a live re-tick", () => {
        const s = new Session();
        expect(s.compile(SCRIPT).errors).toHaveLength(0);
        s.runHistory(Array.from({ length: BARS }, (_, i) => candle(i)));
        expect((s as any).ctx.repeatingSites).toBeNull();
        const { snapshots } = counting(() => {
            s.tick(candle(BARS));
            s.tick({ ...candle(BARS), close: 130 });
        });
        expect(snapshots).toBeGreaterThanOrEqual(SITES);
    });
});
