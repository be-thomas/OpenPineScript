/**
 * tests/v2/runtime/security.test.ts
 *
 * Multi-timeframe security() (P1) — ui-engine-control-protocol §8.
 * security(symbol, resolution, expr) evaluates `expr` over the supplied HTF
 * candles in a sub-context and aligns the result to the chart's bars using the
 * last CLOSED HTF bar (no lookahead / repaint).
 */
import { describe, it } from "vitest";
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

// Daily candles: closes 100,110,120 opening at t = 0,100,200.
const DAILY = [
    { time: 0, open: 100, high: 100, low: 100, close: 100, volume: 1 },
    { time: 100, open: 110, high: 110, low: 110, close: 110, volume: 1 },
    { time: 200, open: 120, high: 120, low: 120, close: 120, volume: 1 },
];

describe("security() — HTF source alignment", () => {
    it("returns the last CLOSED HTF close, NaN before any close (no lookahead)", () => {
        const { ctx, exec } = build('h = security("AAPL", "D", close)\n');
        ctx.provideSecurityData("AAPL", "D", DAILY);

        ctx.setBar(50, 5, 5, 5, 5, 1); exec();   // no daily closed yet (next=100 > 50)
        assert.ok(Number.isNaN(vv(ctx, "h")));
        ctx.finalizeBar();

        ctx.setBar(150, 5, 5, 5, 5, 1); exec();   // daily[0] closed (next=100 <= 150)
        assert.strictEqual(vv(ctx, "h"), 100);
        ctx.finalizeBar();

        ctx.setBar(250, 5, 5, 5, 5, 1); exec();   // daily[1] closed (next=200 <= 250)
        assert.strictEqual(vv(ctx, "h"), 110);    // never 120 — that bar is still forming
        ctx.finalizeBar();
    });
});

describe("security() — HTF expression sub-evaluation", () => {
    it("evaluates an indicator (sma) over the HTF series", () => {
        const { ctx, exec } = build('v = security("AAPL", "D", sma(close, 2))\n');
        ctx.provideSecurityData("AAPL", "D", DAILY);

        ctx.setBar(150, 5, 5, 5, 5, 1); exec();   // only 1 daily closed -> sma(2) = NaN
        assert.ok(Number.isNaN(vv(ctx, "v")));
        ctx.finalizeBar();

        ctx.setBar(250, 5, 5, 5, 5, 1); exec();   // 2 daily closed: 100,110 -> 105
        assert.strictEqual(vv(ctx, "v"), 105);
        ctx.finalizeBar();
    });
});

describe("security() — missing data", () => {
    it("returns NaN and records a data request when the series isn't supplied", () => {
        const { ctx, exec } = build('h = security("MSFT", "60", close)\n');
        ctx.setBar(0, 5, 5, 5, 5, 1); exec();
        assert.ok(Number.isNaN(vv(ctx, "h")));
        assert.ok(ctx.requestedSecurities.has("MSFT@60"));
    });
});

describe("security() — live-tick stability", () => {
    it("HTF value is stable across re-ticks of the forming bar (not rolled back)", () => {
        const { ctx, exec } = build('h = security("AAPL", "D", close)\n');
        ctx.provideSecurityData("AAPL", "D", DAILY);
        // commit two historical bars so daily[0] then daily[1] close
        ctx.setBar(150, 5, 5, 5, 5, 1); exec(); ctx.finalizeBar();   // h=100
        ctx.setBar(250, 5, 5, 5, 5, 1); exec(); ctx.finalizeBar();   // h=110
        // forming bar at t=260: re-tick repeatedly; HTF value must stay 110
        ctx.applyTick(260, 5, 5, 5, 5, 1); exec();
        assert.strictEqual(vv(ctx, "h"), 110);
        ctx.applyTick(260, 9, 9, 9, 9, 1); exec();
        assert.strictEqual(vv(ctx, "h"), 110);
        ctx.applyTick(260, 7, 7, 7, 7, 1); exec();
        assert.strictEqual(vv(ctx, "h"), 110);
    });
});
