/**
 * The broker survives a live-tick rollback.
 *
 * `Context` rolls the forming bar back between ticks by `structuredClone`-ing
 * broker state — `_pendingEntries`, `_pendingExits`, `_riskState` — and
 * restoring it (`RuntimeSnapshot`, runtime/v1/context.ts).
 *
 * `structuredClone` does not preserve prototypes. The moment broker BEHAVIOUR
 * moved into a class (runtime/v1/broker/Broker.ts), that became a trap: put the
 * instance anywhere the snapshot clones and the restored copy comes back as a
 * plain object with no methods, and the next order throws. It would not show up
 * in the ordinary suite either, because nothing else re-ticks a forming bar
 * while trading.
 *
 * The design avoids it by keeping state on the context and behaviour on the
 * class. These tests exist so that stays true: they fail loudly if the broker
 * instance is ever added to the snapshot, or if its state stops being cloned.
 */
import { describe, it, expect } from "vitest";
import { transpile } from "../../../transpiler/common";
import { compile, Context } from "../../../runtime/v1";
import { Broker, brokerFor } from "../../../runtime/v1/broker";

function build(pine: string) {
    const js = transpile(pine).replace(/\blet\b/g, "var ");
    const ctx = new Context();
    const exec = compile(js, ctx, Object.create(null));
    return { ctx, exec };
}

/** Buys once, as soon as it is allowed to. */
const BUYER =
    'strategy("Buyer", initial_capital = 10000)\n' +
    'if close > 0\n' +
    '    strategy.entry("L", strategy.long, 1)\n';

describe("the broker across a live-tick rollback", () => {
    it("is still a Broker, with its methods, after a rollback", () => {
        const { ctx, exec } = build(BUYER);

        ctx.setBar(0, 10, 10, 10, 10, 1); exec(); ctx.finalizeBar();
        const before = brokerFor(ctx);
        expect(before).toBeInstanceOf(Broker);

        // Two ticks on the same forming bar: the second rolls the first back.
        ctx.applyTick(1, 11, 11, 11, 11, 1); exec();
        ctx.applyTick(1, 12, 12, 12, 12, 1); exec();

        const after = brokerFor(ctx);
        expect(after, "the instance must survive the rollback").toBeInstanceOf(Broker);
        expect(typeof (after as any).entry).toBe("function");
        expect(after, "and it should be the same one, not rebuilt").toBe(before);
    });

    it("does not double-count an entry across re-ticks of one bar", () => {
        const { ctx, exec } = build(BUYER);

        ctx.setBar(0, 10, 10, 10, 10, 1); exec(); ctx.finalizeBar();
        ctx.applyTick(1, 11, 11, 11, 11, 1); exec();
        const once = ctx.position.size;

        // Re-ticking the SAME bar must roll the previous tick's order back
        // rather than stack another one on top of it.
        ctx.applyTick(1, 11, 11, 11, 11, 1); exec();
        ctx.applyTick(1, 11, 11, 11, 11, 1); exec();

        expect(ctx.position.size).toBe(once);
    });

    it("keeps trading correctly after the rollback, not just intact", () => {
        const { ctx, exec } = build(BUYER);

        ctx.setBar(0, 10, 10, 10, 10, 1); exec(); ctx.finalizeBar();
        ctx.applyTick(1, 11, 11, 11, 11, 1); exec();
        ctx.applyTick(1, 11, 11, 11, 11, 1); exec();
        ctx.commitBar();

        // A fill on a LATER bar proves the restored state is usable, which an
        // `instanceof` check alone would not: a broker whose pending maps came
        // back as plain objects is still a Broker.
        ctx.setBar(2, 12, 12, 12, 12, 1); exec(); ctx.finalizeBar();
        expect(ctx.position.size).toBeGreaterThan(0);
    });

    it("clones broker state rather than sharing it with the snapshot", () => {
        const { ctx, exec } = build(BUYER);
        ctx.setBar(0, 10, 10, 10, 10, 1); exec(); ctx.finalizeBar();
        ctx.applyTick(1, 11, 11, 11, 11, 1); exec();

        // If the snapshot held the live Map instead of a copy, rolling back
        // would restore the mutated object and the rollback would be a no-op.
        const pending = (ctx as any)._pendingEntries;
        ctx.applyTick(1, 11, 11, 11, 11, 1); exec();
        expect((ctx as any)._pendingEntries).not.toBe(pending);
    });
});
