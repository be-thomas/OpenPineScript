/**
 * Multi-timeframe security().
 *
 * security(symbol, resolution, expr) evaluates `expr` over the supplied HTF
 * candles in a sub-context and aligns the result onto the chart's bars.
 *
 * How far it may see is the `lookahead` argument, and its DEFAULT is
 * version-dependent — the one v2→v3 change that is a behaviour flip rather than
 * a rejection rule (dev-docs/01-version-delta-spec.md §2 D3.1):
 *
 *   v1 / v2 → barmerge.lookahead_on   (sees the HTF bar it is inside; repaints)
 *   v3      → barmerge.lookahead_off  (only HTF bars that have closed)
 *
 * The two modes must produce DIFFERENT numbers on the same data, or the test is
 * not testing anything — `on and off actually differ` pins that.
 */
import { describe, it } from "vitest";
import assert from "node:assert";
import { transpile } from "../../../transpiler";
import { compile, Context } from "../../../runtime/v1";
import { profileFor } from "../../../transpiler/profiles";
import type { PineVersion } from "../../../transpiler/version";

function build(pine: string, version: PineVersion = 1) {
    const js = transpile(pine, { version }).replace(/\blet\b/g, "var ");
    const ctx = new Context(profileFor(version));
    const exec = compile(js, ctx, Object.create(null));
    return { ctx, exec };
}
const vv = (ctx: Context, name: string): any => ctx.vars.get("opsv2_" + name)?.valueOf();

// Daily candles: closes 100, 110, 120 opening at t = 0, 100, 200.
const DAILY = [
    { time: 0, open: 100, high: 100, low: 100, close: 100, volume: 1 },
    { time: 100, open: 110, high: 110, low: 110, close: 110, volume: 1 },
    { time: 200, open: 120, high: 120, low: 120, close: 120, volume: 1 },
];

/** Runs one bar per chart time and returns `h` at each. */
function trace(pine: string, version: PineVersion, times: number[]): number[] {
    const { ctx, exec } = build(pine, version);
    ctx.provideSecurityData("AAPL", "D", DAILY);
    return times.map(t => {
        ctx.setBar(t, 5, 5, 5, 5, 1);
        exec();
        const v = vv(ctx, "h");
        ctx.finalizeBar();
        return v;
    });
}

const SRC = 'h = security("AAPL", "D", close)\n';
const TIMES = [50, 150, 250];

describe("security() lookahead default is version-dependent", () => {
    it("v1 defaults to lookahead_on — sees the HTF bar it is inside", () => {
        // t=50 is inside daily[0], so its close is visible before it closes.
        assert.deepStrictEqual(trace(SRC, 1, TIMES), [100, 110, 120]);
    });

    it("v2 defaults to lookahead_on, same as v1", () => {
        assert.deepStrictEqual(trace(SRC, 2, TIMES), [100, 110, 120]);
    });

    it("v3 defaults to lookahead_off — only closed HTF bars", () => {
        // t=50: no daily bar has closed yet. t=250: daily[2] is still forming,
        // so the value is daily[1], never 120.
        const got = trace(SRC, 3, TIMES);
        assert.ok(Number.isNaN(got[0]));
        assert.deepStrictEqual(got.slice(1), [100, 110]);
    });

    it("on and off actually differ — guards against a vacuous comparison", () => {
        const on = trace(SRC, 2, TIMES);
        const off = trace(SRC, 3, TIMES);
        assert.notDeepStrictEqual(on, off);
    });
});

describe("security() explicit lookahead overrides the default", () => {
    const OFF = 'h = security("AAPL", "D", close, false, barmerge.lookahead_off)\n';
    const ON = 'h = security("AAPL", "D", close, false, barmerge.lookahead_on)\n';

    it("v2 with explicit lookahead_off behaves like v3's default", () => {
        const got = trace(OFF, 2, TIMES);
        assert.ok(Number.isNaN(got[0]));
        assert.deepStrictEqual(got.slice(1), [100, 110]);
    });

    it("v3 with explicit lookahead_on behaves like v2's default", () => {
        assert.deepStrictEqual(trace(ON, 3, TIMES), [100, 110, 120]);
    });
});

describe("security() — HTF expression sub-evaluation", () => {
    it("evaluates an indicator (sma) over the HTF series", () => {
        const { ctx, exec } = build('v = security("AAPL", "D", sma(close, 2))\n', 3);
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
        const { ctx, exec } = build(SRC, 3);
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
