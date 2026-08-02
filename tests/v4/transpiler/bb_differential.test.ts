/**
 * `bb()` differential against the naive reference.
 *
 * Moved here from tests/v1/transpiler/transpiler_ta.test.ts. TradingView added
 * `bb` in March 2020, under v4 — a //@version=3 script calling it gets
 *
 *     Could not find function or function reference 'bb'
 *
 * — so the engine now refuses it below v4, and this test had to move with it.
 * The arithmetic being checked is unchanged; only the version it runs at is.
 */
import { describe, it } from "vitest";
import assert from "node:assert";
import { compileScript } from "../../../transpiler";
import { compile, Context } from "../../../runtime/v4";
import { NaiveTA } from "../../v1/ta/naive_ta";
import { PREFIX as OPSV2 } from "../../../utils/v2/common";

function fix(val: any): number | null {
    if (val === null || val === undefined || (typeof val === "number" && isNaN(val))) return null;
    const raw = (val && typeof val.valueOf === "function") ? val.valueOf() : val;
    return isNaN(raw) ? null : parseFloat(Number(raw).toFixed(6));
}

const data = [
    { o: 10, h: 12, l: 9,  c: 11, v: 100 },
    { o: 11, h: 15, l: 11, c: 14, v: 150 },
    { o: 14, h: 16, l: 13, c: 15, v: 120 },
    { o: 15, h: 18, l: 14, c: 17, v: 200 },
    { o: 17, h: 20, l: 16, c: 19, v: 180 },
    { o: 19, h: 22, l: 18, c: 21, v: 250 },
    { o: 21, h: 25, l: 20, c: 24, v: 300 },
    { o: 24, h: 23, l: 20, c: 21, v: 100 },
    { o: 21, h: 22, l: 18, c: 19, v: 120 },
];

describe("v4 bb() differential", () => {
    it("matches Naive BB (Tuple) destructuring (Post-Warmup)", () => {
        const len = 5;
        const src = `//@version=4\nstudy("t")\n[basis, upper, lower] = bb(close, ${len}, 2)\n`;
        const { js, profile } = compileScript(src);
        const ctx = new Context(profile);
        const exec = compile(js, ctx, Object.create(null));
        const naive = new NaiveTA();

        data.forEach((d, i) => {
            ctx.setBar(i, d.o, d.h, d.l, d.c, d.v);
            exec();
            naive.add(d.c, d.v, d.h, d.l);

            if (i >= len - 1) {
                const [nBasis, nUpper, nLower] = naive.bb(len, 2);
                assert.strictEqual(fix(ctx.getSeries(`${OPSV2}basis`, 0)), fix(nBasis), `Basis mismatch at bar ${i}`);
                assert.strictEqual(fix(ctx.getSeries(`${OPSV2}upper`, 0)), fix(nUpper), `Upper mismatch at bar ${i}`);
                assert.strictEqual(fix(ctx.getSeries(`${OPSV2}lower`, 0)), fix(nLower), `Lower mismatch at bar ${i}`);
            }
            ctx.finalizeBar();
        });
    });

    it("v3 refuses bb(), as TradingView does", () => {
        assert.throws(
            () => compileScript("//@version=3\nstudy(\"t\")\n[a, b, c] = bb(close, 5, 2)\n"),
            /'bb' is not available in Pine Script v3/,
        );
    });
});
