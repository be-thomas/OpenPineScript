import { describe, it } from "node:test";
import assert from "node:assert";
import { transpile } from "../../../transpiler/v2";
import { compile, Context } from "../../../runtime/v2";
import { NaiveTA } from "../ta/naive_ta";
import { PREFIX as OPSV2 } from "../../../utils/v2/common";

function fix(val: any): number | null {
    if (val === null || val === undefined || (typeof val === 'number' && isNaN(val))) return null;
    const raw = (val && typeof val.valueOf === 'function') ? val.valueOf() : val;
    return isNaN(raw) ? null : parseFloat(Number(raw).toFixed(6));
}

function setupEngine(pine: string, ctx: Context) {
    const sandbox: any = Object.create(null);
    return compile(transpile(pine), ctx, sandbox);
}

describe("transpiler ta differential testing", () => {
    const prices = [10, 12, 11, 15, 14, 13, 16, 18, 17, 20];

    it("matches Naive SMA calculation (Post-Warmup)", () => {
        const len = 5;
        const ctx = new Context();
        const exec = setupEngine(`res = sma(close, ${len})`.trim(), ctx);
        const naive = new NaiveTA();

        prices.forEach((p, i) => {
            ctx.setBar(i, p, p, p, p, 100);
            exec();
            naive.add(p, 100);

            if (i >= len - 1) {
                // Read directly from the Engine's Series memory! Offset 0 = current bar.
                assert.strictEqual(fix(ctx.getSeries(`${OPSV2}res`, 0)), fix(naive.sma(len)), `SMA Mismatch at bar ${i}`);
            }
            ctx.finalizeBar();
        });
    });

    it("matches Naive Highest/Lowest calculation (Post-Warmup)", () => {
        const len = 3;
        const ctx = new Context();
        const exec = setupEngine(`hi = highest(close, ${len})\nlo = lowest(close, ${len})`.trim(), ctx);
        const naive = new NaiveTA();

        prices.forEach((p, i) => {
            ctx.setBar(i, p, p, p, p, 100);
            exec();
            naive.add(p, 100);

            if (i >= len - 1) {
                assert.strictEqual(fix(ctx.getSeries(`${OPSV2}hi`, 0)), fix(naive.highest(len)), `Hi mismatch at bar ${i}`);
                assert.strictEqual(fix(ctx.getSeries(`${OPSV2}lo`, 0)), fix(naive.lowest(len)), `Lo mismatch at bar ${i}`);
            }
            ctx.finalizeBar();
        });
    });

    it("matches Naive HighestBars/LowestBars offsets (Post-Warmup)", () => {
        const len = 4;
        const ctx = new Context();
        const exec = setupEngine(`hib = highestbars(close, ${len})\nlob = lowestbars(close, ${len})`.trim(), ctx);
        const naive = new NaiveTA();

        prices.forEach((p, i) => {
            ctx.setBar(i, p, p, p, p, 100);
            exec();
            naive.add(p, 100);

            if (i >= len - 1) {
                assert.strictEqual(fix(ctx.getSeries(`${OPSV2}hib`, 0)), fix(naive.highestbars(len)), `HiBars mismatch at bar ${i}`);
                assert.strictEqual(fix(ctx.getSeries(`${OPSV2}lob`, 0)), fix(naive.lowestbars(len)), `LoBars mismatch at bar ${i}`);
            }
            ctx.finalizeBar();
        });
    });

    it("matches Naive BB (Tuple) destructuring (Post-Warmup)", () => {
        const len = 5;
        const ctx = new Context();
        const exec = setupEngine(`[basis, upper, lower] = bb(close, ${len}, 2)`.trim(), ctx);
        const naive = new NaiveTA();

        prices.forEach((p, i) => {
            ctx.setBar(i, p, p, p, p, 100);
            exec();
            naive.add(p, 100);

            if (i >= len - 1) {
                const [nBasis, nUpper, nLower] = naive.bb(len, 2);
                assert.strictEqual(fix(ctx.getSeries(`${OPSV2}basis`, 0)), fix(nBasis), `Basis mismatch at bar ${i}`);
                assert.strictEqual(fix(ctx.getSeries(`${OPSV2}upper`, 0)), fix(nUpper), `Upper mismatch at bar ${i}`);
                assert.strictEqual(fix(ctx.getSeries(`${OPSV2}lower`, 0)), fix(nLower), `Lower mismatch at bar ${i}`);
            }
            ctx.finalizeBar();
        });
    });
});