/**
 * tests/v2/transpiler/transpiler_metadata.test.ts
 *
 * study() / strategy() directive enforcement (spec §8):
 *   - directive metadata is parsed onto ctx.scriptMeta (positional + keyword)
 *   - a study() script (indicator mode) cannot call strategy.* (compiler error)
 *   - strategy() or no directive (permissive default) allows strategy.*
 *   - the enforcement guard is overridable for a future v3 visitor
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import { transpile } from "../../../transpiler/v2";
import { compile, Context } from "../../../runtime/v2";
import { parse } from "../../../parser/v2";
import { ToJsVisitor } from "../../../transpiler/v2/ToJsVisitor";

/** Transpile + execute one bar, returning the resulting ctx.scriptMeta. */
function metaOf(src: string) {
    const js = transpile(src).replace(/\blet\b/g, "var ");
    const ctx = new Context();
    const exec = compile(js, ctx, Object.create(null));
    ctx.setBar(0, 10, 12, 9, 11, 100);
    exec();
    return ctx.scriptMeta;
}

const throws = (src: string, re: RegExp) => assert.throws(() => transpile(src), re);
const ok = (src: string) => assert.doesNotThrow(() => transpile(src));

// ─── study() metadata ───────────────────────────────────────────────────────

describe("study() directive metadata", () => {
    it("captures title and defaults (overlay=false, shorttitle=title)", () => {
        const m = metaOf('study("My Indicator")\nplot(close)\n');
        assert.strictEqual(m?.kind, "study");
        assert.strictEqual(m?.title, "My Indicator");
        assert.strictEqual(m?.shorttitle, "My Indicator");
        assert.strictEqual(m?.overlay, false);
    });

    it("captures keyword overlay and precision", () => {
        const m = metaOf('study("Ind", "I", overlay=true, precision=4)\nplot(close)\n');
        assert.strictEqual(m?.shorttitle, "I");
        assert.strictEqual(m?.overlay, true);
        assert.strictEqual(m?.precision, 4);
    });
});

// ─── strategy() metadata ──────────────────────────────────────────────────────

describe("strategy() directive metadata", () => {
    it("captures positional + keyword params", () => {
        const m = metaOf('strategy("My Strat", "MS", overlay=true, pyramiding=3)\nplot(close)\n');
        assert.strictEqual(m?.kind, "strategy");
        assert.strictEqual(m?.title, "My Strat");
        assert.strictEqual(m?.shorttitle, "MS");
        assert.strictEqual(m?.overlay, true);
        assert.strictEqual(m?.pyramiding, 3);
    });

    it("defaults pyramiding to 0 and calc flags to false", () => {
        const m = metaOf('strategy("S")\nplot(close)\n');
        assert.strictEqual(m?.pyramiding, 0);
        assert.strictEqual(m?.calc_on_every_tick, false);
        assert.strictEqual(m?.calc_on_order_fills, false);
    });
});

// ─── enforcement: strategy.* requires strategy context ────────────────────────

describe("study() forbids strategy.* (indicator mode)", () => {
    it("rejects strategy.entry under study()", () => {
        throws('study("X")\nstrategy.entry("L", strategy.long)\n', /unavailable in a study/);
    });

    it("rejects bare strategy.* getter access under study()", () => {
        throws('study("X")\nv = strategy.position_size\n', /unavailable in a study/);
    });

    it("rejects strategy.* regardless of directive position in the script", () => {
        throws('plot(close)\nstudy("X")\nstrategy.close_all()\n', /unavailable in a study/);
    });

    it("allows strategy.* under strategy()", () => {
        ok('strategy("S")\nstrategy.entry("L", strategy.long)\n');
    });

    it("allows strategy.* with no directive (permissive default)", () => {
        ok('strategy.entry("L", strategy.long)\n');
    });

    it("does not flag a non-strategy namespace like ta/math", () => {
        ok('study("X")\nv = sma(close, 14)\nplot(v)\n');
    });
});

// ─── v3 extensibility ─────────────────────────────────────────────────────────

describe("strategy-context guard is overridable for a future v3 visitor", () => {
    class V3Visitor extends ToJsVisitor {
        protected override enforceStrategyContext(): void { /* v3 allows strategy.* anywhere */ }
    }
    const transpileV3 = (src: string): string => {
        const { tree, errorCount } = parse(src);
        if (errorCount > 0) throw new Error("parse failed");
        return new V3Visitor().visit(tree);
    };

    it("overriding enforceStrategyContext lets study() use strategy.*", () => {
        assert.doesNotThrow(() => transpileV3('study("X")\nstrategy.entry("L", strategy.long)\n'));
    });
});
