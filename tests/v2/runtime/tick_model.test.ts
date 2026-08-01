/**
 * tests/v2/runtime/tick_model.test.ts
 *
 * Live-tick model (P3) — ui-engine-control-protocol §7.
 * A tick is an ABSOLUTE snapshot of the forming bar; re-ticking rolls back the
 * previous tick's ephemeral state, so accumulating state (cum, EMA prev, broker
 * orders) never double-counts. commitBar() makes the bar permanent.
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import { transpile } from "../../../transpiler/v2";
import { compile, Context } from "../../../runtime/v2";

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
