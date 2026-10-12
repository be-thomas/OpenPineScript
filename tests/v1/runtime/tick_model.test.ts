/**
 * tests/v2/runtime/tick_model.test.ts
 *
 * Live-tick model (P3) — ui-engine-control-protocol §7.
 * A tick is an ABSOLUTE snapshot of the forming bar; re-ticking rolls back the
 * previous tick's ephemeral state, so accumulating state (cum, EMA prev, broker
 * orders) never double-counts. commitBar() makes the bar permanent.
 */
import { describe, it } from "vitest";
import assert from "node:assert";
import { transpile } from "../../../transpiler/common";
import { compile, Context } from "../../../runtime/v1";

function build(pine: string) {
    const js = transpile(pine).replace(/\blet\b/g, "var ");
    const ctx = new Context();
    const exec = compile(js, ctx, Object.create(null));
    return { ctx, exec };
}
const vv = (ctx: Context, name: string): any => ctx.vars.get("opsv2_" + name)?.valueOf();

describe("live-tick model — rollback & commit", () => {
    it("cum() does not double-count across re-ticks of the forming bar", () => {
        const { ctx, exec } = build("c = cum(close)\n");
        ctx.setBar(0, 10, 10, 10, 10, 1); exec(); ctx.finalizeBar(); // committed cum = 10

        ctx.applyTick(1, 5, 5, 5, 5, 1); exec();
        assert.strictEqual(vv(ctx, "c"), 15); // 10 + 5
        ctx.applyTick(1, 20, 20, 20, 20, 1); exec();
        assert.strictEqual(vv(ctx, "c"), 30); // 10 + 20 (NOT 10+5+20)
        ctx.applyTick(1, 7, 7, 7, 7, 1); exec();
        assert.strictEqual(vv(ctx, "c"), 17); // 10 + 7

        ctx.commitBar();
        ctx.applyTick(2, 3, 3, 3, 3, 1); exec();
        assert.strictEqual(vv(ctx, "c"), 20); // committed 17 + 3
    });

    it("EMA over ticks equals EMA computed once on the committed closes", () => {
        const a = build("e = ema(close, 3)\n");
        a.ctx.setBar(0, 10, 10, 10, 10, 1); a.exec(); a.ctx.finalizeBar();
        a.ctx.setBar(1, 12, 12, 12, 12, 1); a.exec(); a.ctx.finalizeBar();
        a.ctx.applyTick(2, 5, 5, 5, 5, 1); a.exec();
        a.ctx.applyTick(2, 99, 99, 99, 99, 1); a.exec();
        a.ctx.applyTick(2, 20, 20, 20, 20, 1); a.exec();
        const live = vv(a.ctx, "e");

        const b = build("e = ema(close, 3)\n");
        [10, 12, 20].forEach((c, i) => { b.ctx.setBar(i, c, c, c, c, 1); b.exec(); if (i < 2) b.ctx.finalizeBar(); });
        const ref = vv(b.ctx, "e");

        assert.ok(Math.abs((live as number) - (ref as number)) < 1e-9, `live=${live} ref=${ref}`);
    });

    it("pending strategy orders are not duplicated across re-ticks", () => {
        const { ctx, exec } = build('strategy.order("X", strategy.long, 1, 100)\n');
        ctx.applyTick(0, 50, 55, 45, 50, 1); exec();
        assert.strictEqual((ctx as any)._pendingEntries.size, 1);
        ctx.applyTick(0, 51, 56, 46, 51, 1); exec();
        assert.strictEqual((ctx as any)._pendingEntries.size, 1);
        ctx.applyTick(0, 52, 57, 47, 52, 1); exec();
        assert.strictEqual((ctx as any)._pendingEntries.size, 1);
    });

    it("barstate flags reflect realtime on the forming bar", () => {
        const { ctx, exec } = build("x = close\n");
        ctx.setBar(0, 10, 10, 10, 10, 1); exec();
        assert.strictEqual(ctx.is_realtime, false);
        ctx.finalizeBar();
        ctx.applyTick(1, 11, 11, 11, 11, 1); exec();
        assert.strictEqual(ctx.is_realtime, true);
        assert.strictEqual(ctx.is_last, true);
    });

    it("committed values are stable after commit (history offset reads)", () => {
        // change(close) reads close[1]; after commit, the prior bar must be the committed tick.
        const { ctx, exec } = build("d = change(close)\n");
        ctx.setBar(0, 10, 10, 10, 10, 1); exec(); ctx.finalizeBar();
        ctx.applyTick(1, 13, 13, 13, 13, 1); exec();
        assert.strictEqual(vv(ctx, "d"), 3);  // 13 - 10
        ctx.applyTick(1, 18, 18, 18, 18, 1); exec();
        assert.strictEqual(vv(ctx, "d"), 8);  // 18 - 10 (rolled back, not 18-13)
        ctx.commitBar();
        ctx.applyTick(2, 20, 20, 20, 20, 1); exec();
        assert.strictEqual(vv(ctx, "d"), 2);  // 20 - 18 (committed)
    });
});

describe("live-tick model — the broker survives a rollback", () => {
    /**
     * Entry on bar 0 (fills at bar 1's open), bracket registered on bar 1
     * (live from bar 2), and bar 2 is driven by ticks.
     */
    const strat = [
        'if n == 0',
        '    strategy.entry("L", strategy.long, 1)',
        'if n == 1',
        '    strategy.exit("tp", "L", limit = 110)',
        'sz = strategy.position_size',
    ].join('\n');

    it("a pending exit still fills on the second and third tick of a bar", () => {
        const { ctx, exec } = build(strat);
        ctx.setBar(0, 100, 105, 95, 100, 1); exec(); ctx.finalizeBar();
        ctx.setBar(1, 100, 105, 95, 100, 1); exec(); ctx.finalizeBar();

        // Tick 1: the bar has already traded through 110, so the bracket fills
        // and the script sees a flat position.
        ctx.applyTick(2, 105, 115, 100, 112, 1); exec();
        assert.strictEqual(vv(ctx, "sz"), 0, "tick 1 fills the bracket");

        // Tick 2 rolls the bar back to its committed baseline and re-runs it.
        // The rollback restores the open position and the unfilled bracket —
        // but it used to leave the per-bar "orders already matched" guards set,
        // so the re-run skipped matching entirely and the script saw the
        // position still open. The fill has to happen again.
        ctx.applyTick(2, 105, 118, 100, 116, 1); exec();
        assert.strictEqual(vv(ctx, "sz"), 0, "tick 2 fills it again after the rollback");

        ctx.applyTick(2, 105, 120, 100, 118, 1); exec();
        assert.strictEqual(vv(ctx, "sz"), 0, "and tick 3");

        // One fill, not three: each tick rolled the previous one back.
        ctx.commitBar();
        assert.strictEqual(ctx.trades.length, 1, "the bar books one exit, not one per tick");
    });

    it("a tick whose range no longer reaches the level leaves the position open", () => {
        const { ctx, exec } = build(strat);
        ctx.setBar(0, 100, 105, 95, 100, 1); exec(); ctx.finalizeBar();
        ctx.setBar(1, 100, 105, 95, 100, 1); exec(); ctx.finalizeBar();

        ctx.applyTick(2, 105, 115, 100, 112, 1); exec();
        assert.strictEqual(vv(ctx, "sz"), 0, "filled while the tick's high reached 110");

        // A later tick is an ABSOLUTE snapshot, and this one never traded up to
        // the limit. Rolling back means the fill is undone, not merely hidden.
        ctx.applyTick(2, 105, 108, 100, 106, 1); exec();
        assert.strictEqual(vv(ctx, "sz"), 1, "the fill is undone, not kept");
        assert.strictEqual(ctx.trades.length, 0);
    });
});
