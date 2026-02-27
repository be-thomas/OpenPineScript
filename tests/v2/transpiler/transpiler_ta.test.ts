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
    // Enhanced data to support ATR and SAR (Highs/Lows matter now)
    const data = [
        { o: 10, h: 12, l: 9,  c: 11, v: 100 },
        { o: 11, h: 15, l: 11, c: 14, v: 150 },
        { o: 14, h: 16, l: 13, c: 15, v: 120 },
        { o: 15, h: 18, l: 14, c: 17, v: 200 },
        { o: 17, h: 20, l: 16, c: 19, v: 180 },
        { o: 19, h: 22, l: 18, c: 21, v: 250 },
        { o: 21, h: 25, l: 20, c: 24, v: 300 },
        { o: 24, h: 23, l: 20, c: 21, v: 100 }, // Bearish bar
        { o: 21, h: 22, l: 18, c: 19, v: 120 }
    ];

    it("matches Naive SMA calculation (Post-Warmup)", () => {
        const len = 5;
        const ctx = new Context();
        const exec = setupEngine(`res = sma(close, ${len})`.trim(), ctx);
        const naive = new NaiveTA();

        data.forEach((d, i) => {
            ctx.setBar(i, d.o, d.h, d.l, d.c, d.v);
            exec();
            naive.add(d.c, d.v, d.h, d.l);
            if (i >= len - 1) {
                assert.strictEqual(fix(ctx.getSeries(`${OPSV2}res`, 0)), fix(naive.sma(len)), `SMA Mismatch at bar ${i}`);
            }
            ctx.finalizeBar();
        });
    });

    it("matches Naive ATR and VWAP (Context Dependent)", () => {
        const len = 3;
        const ctx = new Context();
        const exec = setupEngine(`a = atr(${len})\nv = vwap(close)`.trim(), ctx);
        const naive = new NaiveTA();

        data.forEach((d, i) => {
            ctx.setBar(i, d.o, d.h, d.l, d.c, d.v);
            exec();
            naive.add(d.c, d.v, d.h, d.l);
            if (i >= len - 1) {
                assert.strictEqual(fix(ctx.getSeries(`${OPSV2}a`, 0)), fix(naive.atr(len)), `ATR mismatch at bar ${i}`);
                assert.strictEqual(fix(ctx.getSeries(`${OPSV2}v`, 0)), fix(naive.vwap()), `VWAP mismatch at bar ${i}`);
            }
            ctx.finalizeBar();
        });
    });

    it("matches Naive ValueWhen and BarsSince (State Lookups)", () => {
        const ctx = new Context();
        // FLUSHED TO LEFT TO PREVENT INDENT ERRORS
        const pine = [
            'cond = close > open',
            'vw = valuewhen(cond, close, 0)',
            'bs = barssince(cond)'
        ].join('\n');

        const exec = setupEngine(pine, ctx);
        const naive = new NaiveTA();
        const conditionHistory: boolean[] = [];
        const sourceHistory: number[] = [];

        data.forEach((d, i) => {
            ctx.setBar(i, d.o, d.h, d.l, d.c, d.v);
            exec();
            
            const cond = d.c > d.o;
            conditionHistory.push(cond);
            sourceHistory.push(d.c);
            naive.add(d.c, d.v, d.h, d.l);

            assert.strictEqual(fix(ctx.getSeries(`${OPSV2}vw`, 0)), fix(naive.valuewhen(conditionHistory, sourceHistory, 0)), `ValueWhen mismatch at bar ${i}`);
            assert.strictEqual(fix(ctx.getSeries(`${OPSV2}bs`, 0)), fix(naive.barssince(conditionHistory)), `BarsSince mismatch at bar ${i}`);
            
            ctx.finalizeBar();
        });
    });

    it("matches Naive Linreg and SAR (Complex Math)", () => {
        const len = 4;
        const ctx = new Context();
        const pine = [
            `lr = linreg(close, ${len}, 0)`,
            'psar = sar(0.02, 0.02, 0.2)'
        ].join('\n');

        const exec = setupEngine(pine, ctx);
        const naive = new NaiveTA();

        data.forEach((d, i) => {
            ctx.setBar(i, d.o, d.h, d.l, d.c, d.v);
            exec();
            naive.add(d.c, d.v, d.h, d.l);

            if (i >= len - 1) {
                assert.strictEqual(fix(ctx.getSeries(`${OPSV2}lr`, 0)), fix(naive.linreg(len, 0)), `Linreg mismatch at bar ${i}`);
                assert.strictEqual(fix(ctx.getSeries(`${OPSV2}psar`, 0)), fix(naive.sar(0.02, 0.02, 0.2)), `SAR mismatch at bar ${i}`);
            }
            ctx.finalizeBar();
        });
    });

    it("matches Naive HighestBars/LowestBars offsets (Post-Warmup)", () => {
        const len = 4;
        const ctx = new Context();
        const exec = setupEngine(`hib = highestbars(close, ${len})\nlob = lowestbars(close, ${len})`.trim(), ctx);
        const naive = new NaiveTA();

        data.forEach((d, i) => {
            ctx.setBar(i, d.o, d.h, d.l, d.c, d.v);
            exec();
            naive.add(d.c, d.v, d.h, d.l);

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
});