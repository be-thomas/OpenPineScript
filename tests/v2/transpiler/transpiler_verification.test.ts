/**
 * tests/v2/transpiler/transpiler_verification.test.ts
 *
 * Verifies the items previously marked "⚠️ not verified" in spec/v2_progress.md:
 *   - for-loop returns the value of its final iteration (loop-as-expression)
 *   - duplicate order ID modifies the existing pending order (does not duplicate)
 *   - timestamp() constructs a UNIX timestamp (ms)
 *
 * (for-loop auto-reverse when from > to is already covered by transpiler_for.test.ts.)
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import { transpile } from "../../../transpiler/v2";
import { compile, Context } from "../../../runtime/v2";

/** Run a single bar and return the current value of a script variable. */
function runVar(pine: string, name: string): any {
    const js = transpile(pine).replace(/\blet\b/g, "var ");
    const ctx = new Context();
    const exec = compile(js, ctx, Object.create(null));
    ctx.setBar(0, 10, 12, 9, 11, 100);
    exec();
    return ctx.vars.get("opsv2_" + name)?.valueOf();
}

/**
 * Run a single bar's script logic WITHOUT matching pending orders, so the
 * pending-order queue can be inspected directly (no fills clearing it).
 */
function placeOrders(pine: string): Context {
    const js = transpile(pine).replace(/\blet\b/g, "var ");
    const ctx = new Context();
    const exec = compile(js, ctx, Object.create(null));
    ctx.setBar(0, 50, 55, 45, 50, 1000);
    exec();
    return ctx;
}

// ─── for-loop returns final-iteration value ───────────────────────────────────

describe("for-loop returns the value of its final iteration", () => {
    it("forward loop returns the last index", () => {
        assert.strictEqual(runVar("r = for i = 1 to 3\n    i\n", "r"), 3);
    });

    it("reversed loop (from > to) returns the last index reached", () => {
        assert.strictEqual(runVar("r = for i = 3 to 1\n    i\n", "r"), 1);
    });

    it("yields the final iteration's trailing expression (after a mutation)", () => {
        // body mutates acc, then yields the bare `acc` expression as the loop value
        const r = runVar("acc = 0\nr = for i = 1 to 4\n    acc := acc + i\n    acc\n", "r");
        assert.strictEqual(r, 10); // 1+2+3+4
    });

    it("respects 'by' step for the final value", () => {
        // 0,2,4,6,8,10 -> last is 10
        assert.strictEqual(runVar("r = for i = 0 to 10 by 2\n    i\n", "r"), 10);
    });

    it("known limitation: a body ending in an assignment yields na (no trailing expression)", () => {
        // The loop-value capture rewrites a trailing expression; a bare assignment
        // leaves no value, so the loop yields undefined/na. Documented behavior.
        const r = runVar("acc = 0\nr = for i = 1 to 4\n    acc := acc + i\n", "r");
        assert.strictEqual(r, undefined);
    });
});

// ─── duplicate order ID modifies the existing order ───────────────────────────

describe("duplicate order ID modifies the existing pending order", () => {
    it("re-issuing the same id updates params instead of duplicating", () => {
        const pine = [
            "if n == 0",
            '    strategy.order("X", strategy.long, 1, 100)',
            '    strategy.order("X", strategy.long, 5, 90)',
        ].join("\n");
        const ctx = placeOrders(pine);

        const pending = (ctx as any)._pendingEntries as Map<string, any>;
        assert.strictEqual(pending.size, 1, "should hold a single pending order for id 'X'");
        const ord = pending.get("X");
        assert.strictEqual(ord.qty, 5, "qty should be the modified value");
        assert.strictEqual(ord.limit, 90, "limit should be the modified value");
    });

    it("distinct ids create separate pending orders", () => {
        const pine = [
            "if n == 0",
            '    strategy.order("A", strategy.long, 1, 100)',
            '    strategy.order("B", strategy.long, 2, 95)',
        ].join("\n");
        const ctx = placeOrders(pine);
        assert.strictEqual(((ctx as any)._pendingEntries as Map<string, any>).size, 2);
    });
});

// ─── timestamp() ──────────────────────────────────────────────────────────────

describe("timestamp() constructs a UNIX timestamp (ms)", () => {
    it("builds a date from year/month/day (UTC, 1-indexed month)", () => {
        assert.strictEqual(runVar("t = timestamp(2021, 1, 1)\n", "t"), Date.UTC(2021, 0, 1));
    });

    it("includes hour and minute components", () => {
        assert.strictEqual(
            runVar("t = timestamp(2020, 6, 15, 9, 30)\n", "t"),
            Date.UTC(2020, 5, 15, 9, 30)
        );
    });

    it("month is 1-indexed (December = 12)", () => {
        assert.strictEqual(runVar("t = timestamp(2019, 12, 31)\n", "t"), Date.UTC(2019, 11, 31));
    });
});
