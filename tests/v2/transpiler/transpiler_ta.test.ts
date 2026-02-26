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

/**
 * Custom runner for TA tests that ensures variables are visible on the sandbox.
 */
function runBarTA(js: string, ctx: Context, sandbox: any) {
    // We strip 'let ' so variables like 'opsv2_res' become global on the sandbox
    const globalJs = js.replace(/\blet\b/g, ""); 
    sandbox.ctx = ctx;
    return compile(globalJs, ctx, sandbox);
}

describe("transpiler ta differential testing", () => {
    const prices = [10, 12, 11, 15, 14, 13, 16, 18, 17, 20];

    it("matches Naive SMA calculation (Post-Warmup)", () => {
        const len = 5;
        const pine = `res = sma(close, ${len})`;
        const ctx = new Context();
        const sandbox: any = Object.create(null);
        const exec = runBarTA(transpile(pine), ctx, sandbox);
        const naive = new NaiveTA();

        prices.forEach((p, i) => {
            ctx.setBar(i, p, p, p, p, 100);
            exec();
            naive.add(p, 100);

            if (i >= len - 1) {
                // Now opsv2_res exists on the sandbox
                const engineVal = sandbox[`${OPSV2}res`];
                assert.strictEqual(fix(engineVal), fix(naive.sma(len)), `SMA Mismatch at bar ${i}`);
            }
            ctx.finalizeBar();
        });
    });

    it("matches Naive Highest/Lowest calculation (Post-Warmup)", () => {
        const len = 3;
        const pine = `hi = highest(close, ${len})\nlo = lowest(close, ${len})`;
        const ctx = new Context();
        const sandbox: any = Object.create(null);
        const exec = runBarTA(transpile(pine), ctx, sandbox);
        const naive = new NaiveTA();

        prices.forEach((p, i) => {
            ctx.setBar(i, p, p, p, p, 100);
            exec();
            naive.add(p, 100);

            if (i >= len - 1) {
                assert.strictEqual(fix(sandbox[`${OPSV2}hi`]), fix(naive.highest(len)), `Hi mismatch at bar ${i}`);
                assert.strictEqual(fix(sandbox[`${OPSV2}lo`]), fix(naive.lowest(len)), `Lo mismatch at bar ${i}`);
            }
            ctx.finalizeBar();
        });
    });

    it("matches Naive HighestBars/LowestBars offsets (Post-Warmup)", () => {
        const len = 4;
        const pine = `hib = highestbars(close, ${len})\nlob = lowestbars(close, ${len})`;
        const ctx = new Context();
        const sandbox: any = Object.create(null);
        const exec = runBarTA(transpile(pine), ctx, sandbox);
        const naive = new NaiveTA();

        prices.forEach((p, i) => {
            ctx.setBar(i, p, p, p, p, 100);
            exec();
            naive.add(p, 100);

            if (i >= len - 1) {
                assert.strictEqual(fix(sandbox[`${OPSV2}hib`]), fix(naive.highestbars(len)), `HiBars mismatch at bar ${i}`);
                assert.strictEqual(fix(sandbox[`${OPSV2}lob`]), fix(naive.lowestbars(len)), `LoBars mismatch at bar ${i}`);
            }
            ctx.finalizeBar();
        });
    });

    it("matches Naive BB (Tuple) destructuring (Post-Warmup)", () => {
        const len = 5;
        const pine = `[basis, upper, lower] = bb(close, ${len}, 2)`;
        const ctx = new Context();
        const sandbox: any = Object.create(null);
        const exec = runBarTA(transpile(pine), ctx, sandbox);
        const naive = new NaiveTA();

        prices.forEach((p, i) => {
            ctx.setBar(i, p, p, p, p, 100);
            exec();
            naive.add(p, 100);

            if (i >= len - 1) {
                const [nBasis, nUpper, nLower] = naive.bb(len, 2);
                assert.strictEqual(fix(sandbox[`${OPSV2}basis`]), fix(nBasis), `Basis mismatch at bar ${i}`);
                assert.strictEqual(fix(sandbox[`${OPSV2}upper`]), fix(nUpper), `Upper mismatch at bar ${i}`);
                assert.strictEqual(fix(sandbox[`${OPSV2}lower`]), fix(nLower), `Lower mismatch at bar ${i}`);
            }
            ctx.finalizeBar();
        });
    });
});