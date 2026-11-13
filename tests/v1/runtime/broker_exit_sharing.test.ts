/**
 * tests/v1/runtime/broker_exit_sharing.test.ts
 *
 * Guards the exit-walk sharing in `Broker.processPendingOrders`
 * (runtime/v1/broker/Broker.ts): an exit whose levels are all absolute, with no
 * trail, is walked once per bar for all its units, not once per unit. That is
 * only right while `walkExit` reads nothing from the unit for such an exit, and
 * it is what keeps a long run that reverses position under a re-issued
 * `strategy.exit` from going quadratic. See docs/common/ARCHITECTURE.md ("Performance invariants").
 *
 *  - unit independence: `walkExit` gives one answer for every unit of a
 *    fixed-level exit, whatever the unit holds;
 *  - work bound: `walkExit` runs per exit per bar, not per unit.
 */
import { describe, it, expect } from "vitest";
import { Session, Context } from "../../../runtime/v1";
import { Broker } from "../../../runtime/v1/broker";

class Probe extends Broker {
    walk(ex: any, unit: any, isLong: boolean, o: number, h: number, l: number, c: number) {
        return this.walkExit(ex, unit, unit.basis, isLong, o, h, l, c);
    }
}

const exit = (over: Record<string, number> = {}): any => ({
    id: "x", from_entry: "", qty: NaN, qty_percent: NaN,
    limit: NaN, stop: NaN, profit: NaN, loss: NaN,
    trail_price: NaN, trail_points: NaN, trail_offset: NaN, trail_peak: NaN,
    placedBar: 0, oca_name: "", ...over,
});

const unit = (over: Record<string, any> = {}): any => ({
    uid: "u", id: "L", basis: 100, opened: 1, placedBar: 0, trail_peak: NaN, filled: false, ...over,
});

// Limit 110, stop 95: bars that gap, open near the high or the low, and reach
// the limit only, the stop only, both, or neither.
const BARS: Array<[string, number, number, number, number]> = [
    ["neither", 100, 104, 98, 102],
    ["limit only, open near low", 100, 112, 99, 111],
    ["limit only, open near high", 109, 112, 99, 111],
    ["stop only, open near high", 103, 104, 90, 92],
    ["stop only, open near low", 95.5, 98, 94, 96],
    ["both, open near high", 108, 111, 93, 100],
    ["both, open near low", 96, 111, 93, 100],
    ["gap up through the limit", 115, 118, 114, 116],
    ["gap down through the stop", 90, 92, 88, 91],
];

const UNITS = [
    unit(),
    unit({ uid: "v", basis: 250, trail_peak: 300, placedBar: 40, opened: 7 }),
    unit({ uid: "w", basis: 1, trail_peak: 50, placedBar: 3, opened: 0.5 }),
    unit({ uid: "z", basis: 109.9, trail_peak: NaN, placedBar: 999, opened: 100 }),
];

describe("walkExit for an exit with fixed levels", () => {
    for (const isLong of [true, false]) {
        for (const [name, o, h, l, c] of BARS) {
            it(`${isLong ? "long" : "short"}: ${name} is the same for every unit`, () => {
                const probe = new Probe(new Context());
                // The long's limit sits above, the stop below; a short's are mirrored.
                const ex = isLong ? exit({ limit: 110, stop: 95 }) : exit({ limit: 95, stop: 110 });
                const [first, ...rest] = UNITS.map(u => probe.walk(ex, { ...u }, isLong, o, h, l, c));
                for (const r of rest) expect(r).toEqual(first);
            });
        }
    }

    it("the bars cover a hit and a miss", () => {
        const probe = new Probe(new Context());
        const ex = exit({ limit: 110, stop: 95 });
        const kinds = new Set(BARS.map(([, o, h, l, c]) => probe.walk(ex, unit(), true, o, h, l, c).hit?.kind ?? "none"));
        expect(kinds).toEqual(new Set(["none", "limit", "stop"]));
    });
});

// One exit with fixed levels, re-issued every bar, under a position that adds a
// trade every bar for fifty bars and then reverses: dozens of units are live at
// once, and every reversal closes them all. The levels follow the direction of
// the position and are never reached.
const REVERSER = [
    "//@version=5",
    'strategy("Reverser", pyramiding = 1000)',
    "up = math.floor(bar_index / 50) % 2 == 0",
    'strategy.entry("T" + str.tostring(bar_index), up ? strategy.long : strategy.short, 1)',
    'strategy.exit("x", limit = up ? 1000 : 1, stop = up ? 1 : 1000)',
].join("\n");

const bars = (n: number) => Array.from({ length: n }, (_, i) => {
    const c = 100 + Math.sin(i / 5) * 5;
    return { time: i * 60_000, open: c - 1, high: c + 2, low: c - 2, close: c, volume: 1000 };
});

describe("the broker's work under a re-issued exit while reversing", () => {
    it("walks once per exit per bar, however many units have piled up", () => {
        const N = 3000;
        const proto = Broker.prototype as any;
        const real = proto.walkExit;
        let calls = 0;
        proto.walkExit = function (...args: any[]) { calls++; return real.apply(this, args); };
        let result: any;
        try {
            const s = new Session();
            expect(s.compile(REVERSER).errors).toHaveLength(0);
            result = s.runHistory(bars(N));
        } finally {
            proto.walkExit = real;
        }
        expect(result.errors).toHaveLength(0);
        // The trades are the same ones either way: each bar's entry, closed by the
        // reversal that follows its block of fifty.
        expect(result.trades.length).toBeGreaterThan(N - 100);
        expect(result.trades.every((t: any) => /^Reverse for /.test(t.id))).toBe(true);
        // One exit: at most one walk a bar. Per unit it is dozens a bar.
        expect(calls).toBeLessThanOrEqual(N);
    });
});
