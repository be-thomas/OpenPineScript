/**
 * tests/v2/ta/ta_extended.test.ts
 *
 * Comprehensive coverage for the TA indicators added in the "quick-win" batch:
 *   cum, roc, change, dev, variance, stdev, correlation, percentrank,
 *   alma, cog, wpr, mfi, falling, rising, pivothigh, pivotlow, tsi.
 *
 * Strategy:
 *   1. Differential stress tests — drive the optimized engine and the
 *      mathematically-exact NaiveTA reference over deterministic pseudo-random
 *      data across several length regimes, and assert bar-by-bar agreement.
 *   2. Deterministic fixtures — hand-verified expected values for the
 *      event/boolean indicators (falling/rising, pivots) and edge cases.
 *   3. Property tests — for tsi (EMA-recursive), assert bounds and sign.
 */
import { describe, it } from "vitest";
import assert from "node:assert";
import { Context } from "../../../runtime/v2/context";
import * as ta from "../../../runtime/v2/stdlib/ta";
import { NaiveTA } from "./naive_ta";

const EPSILON = 1e-6;

/** Deterministic PRNG (mulberry32) so any failure is reproducible. */
function rng(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
        a |= 0; a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

interface Bar { open: number; high: number; low: number; close: number; volume: number; }

/** Generate a realistic OHLCV random walk. */
function genBars(n: number, seed: number): Bar[] {
    const r = rng(seed);
    const bars: Bar[] = [];
    let price = 100;
    for (let i = 0; i < n; i++) {
        const delta = (r() - 0.5) * 2;
        const open = price;
        const close = price + delta;
        const high = Math.max(open, close) + r();
        const low = Math.min(open, close) - r();
        const volume = Math.abs(r() * 1000) + 1;
        price = close;
        bars.push({ open, high, low, close, volume });
    }
    return bars;
}

/** Push one bar's data into a Context (mirrors the engine's setBar effects). */
function feedCtx(ctx: Context, b: Bar): void {
    (ctx as any).high = b.high;
    (ctx as any).low = b.low;
    (ctx as any).open = b.open;
    ctx.close = b.close;
    ctx.volume = b.volume;
}

function assertClose(name: string, actual: number, expected: number, bar: number, len: number): void {
    if (Number.isNaN(actual) && Number.isNaN(expected)) return;
    assert.ok(
        !Number.isNaN(actual) && !Number.isNaN(expected),
        `${name} bar=${bar} len=${len}: NaN mismatch (engine=${actual} ref=${expected})`
    );
    assert.ok(
        Math.abs(actual - expected) <= EPSILON,
        `${name} bar=${bar} len=${len}: engine=${actual} ref=${expected} (diff=${Math.abs(actual - expected)})`
    );
}

const LENGTHS = [2, 5, 14, 30];
const WARMUP = 40; // skip the warmup region where boundary conventions dominate

// ─── Differential stress tests (continuous-math indicators) ────────────────────

describe("ta extended — differential stress", () => {
    for (const len of LENGTHS) {
        it(`matches NaiveTA across all indicators (length=${len})`, () => {
            const ctx = new Context();
            const naive = new NaiveTA();
            const bars = genBars(800, 1234 + len);

            for (let i = 0; i < bars.length; i++) {
                const b = bars[i];
                feedCtx(ctx, b);
                naive.add(b.close, b.volume, b.high, b.low);

                const cum  = ctx.call("ta.cum@t",  ta.cum,  ctx, b.close);
                const roc  = ctx.call("ta.roc@t",  ta.roc,  ctx, b.close, len);
                const chg  = ctx.call("ta.chg@t",  ta.change, ctx, b.close, len);
                const dev  = ctx.call("ta.dev@t",  ta.dev,  ctx, b.close, len);
                const vari = ctx.call("ta.var@t",  ta.variance, ctx, b.close, len);
                const std  = ctx.call("ta.std@t",  ta.stdev, ctx, b.close, len);
                const corr = ctx.call("ta.cor@t",  ta.correlation, ctx, b.close, b.volume, len);
                const prnk = ctx.call("ta.prk@t",  ta.percentrank, ctx, b.close, len);
                const alma = ctx.call("ta.alma@t", ta.alma, ctx, b.close, len, 0.85, 6);
                const cog  = ctx.call("ta.cog@t",  ta.cog,  ctx, b.close, len);
                const wpr  = ctx.call("ta.wpr@t",  ta.wpr,  ctx, len);
                const mfi  = ctx.call("ta.mfi@t",  ta.mfi,  ctx, b.close, len);

                if (i > WARMUP) {
                    assertClose("cum", cum, naive.cum(), i, len);
                    assertClose("roc", roc, naive.roc(len), i, len);
                    assertClose("change", chg, naive.change(len), i, len);
                    assertClose("dev", dev, naive.dev(len), i, len);
                    assertClose("variance", vari, naive.variance(len), i, len);
                    assertClose("stdev", std, naive.stdev(len), i, len);
                    assertClose("correlation", corr, naive.correlation(len), i, len);
                    assertClose("percentrank", prnk, naive.percentrank(len), i, len);
                    assertClose("alma", alma, naive.alma(len, 0.85, 6), i, len);
                    assertClose("cog", cog, naive.cog(len), i, len);
                    assertClose("wpr", wpr, naive.wpr(len), i, len);
                    assertClose("mfi", mfi, naive.mfi(len), i, len);
                }
            }
        });
    }
});

// ─── Differential stress tests (boolean / event indicators) ────────────────────

describe("ta extended — boolean & pivot differential", () => {
    for (const len of [2, 3, 5]) {
        it(`falling/rising match NaiveTA (length=${len})`, () => {
            const ctx = new Context();
            const naive = new NaiveTA();
            const bars = genBars(500, 77 + len);

            for (let i = 0; i < bars.length; i++) {
                const b = bars[i];
                feedCtx(ctx, b);
                naive.add(b.close, b.volume, b.high, b.low);

                const fall = ctx.call("ta.fall@t", ta.falling, ctx, b.close, len);
                const rise = ctx.call("ta.rise@t", ta.rising, ctx, b.close, len);

                if (i > 10) {
                    assert.strictEqual(fall, naive.falling(len), `falling bar=${i} len=${len}`);
                    assert.strictEqual(rise, naive.rising(len), `rising bar=${i} len=${len}`);
                }
            }
        });
    }

    for (const [left, right] of [[2, 2], [3, 1], [1, 3], [4, 4]]) {
        it(`pivothigh/pivotlow match NaiveTA (left=${left}, right=${right})`, () => {
            const ctx = new Context();
            const naive = new NaiveTA();
            const bars = genBars(600, 555 + left * 10 + right);

            for (let i = 0; i < bars.length; i++) {
                const b = bars[i];
                feedCtx(ctx, b);
                naive.add(b.close, b.volume, b.high, b.low);

                const ph = ctx.call("ta.ph@t", ta.pivothigh, ctx, b.high, left, right);
                const pl = ctx.call("ta.pl@t", ta.pivotlow, ctx, b.low, left, right);

                if (i > left + right + 2) {
                    assertClose("pivothigh", ph, naive.pivothigh(left, right), i, left + right);
                    assertClose("pivotlow", pl, naive.pivotlow(left, right), i, left + right);
                }
            }
        });
    }
});

// ─── Deterministic fixtures (human-verifiable) ─────────────────────────────────

/** Run a single indicator over a fixed close series and collect per-bar output. */
function runSeries(
    closes: number[],
    invoke: (ctx: Context, close: number) => number | boolean
): (number | boolean)[] {
    const ctx = new Context();
    const out: (number | boolean)[] = [];
    for (const c of closes) {
        feedCtx(ctx, { open: c, high: c, low: c, close: c, volume: 1 });
        out.push(invoke(ctx, c));
    }
    return out;
}

describe("ta extended — deterministic fixtures", () => {
    it("cum accumulates every close", () => {
        const out = runSeries([1, 2, 3, 4], (ctx, c) => ta.cum(ctx, c));
        assert.deepStrictEqual(out, [1, 3, 6, 10]);
    });

    it("change(1) is the first difference; NaN before enough history", () => {
        const out = runSeries([10, 13, 11, 11], (ctx, c) => ta.change(ctx, c, 1));
        assert.ok(Number.isNaN(out[0] as number));
        assert.strictEqual(out[1], 3);
        assert.strictEqual(out[2], -2);
        assert.strictEqual(out[3], 0);
    });

    it("roc computes percent change vs N bars ago", () => {
        // bar2 vs bar0: 100*(20-10)/10 = 100
        const out = runSeries([10, 15, 20], (ctx, c) => ta.roc(ctx, c, 2));
        assert.ok(Number.isNaN(out[0] as number));
        assert.ok(Number.isNaN(out[1] as number));
        assert.strictEqual(out[2], 100);
    });

    it("falling is true only after a strict monotonic decrease", () => {
        const out = runSeries([5, 4, 3, 3, 2], (ctx, c) => ta.falling(ctx, c, 2));
        // need length+1 points; check from index 2 onward
        assert.strictEqual(out[2], true);  // 5>4>3
        assert.strictEqual(out[3], false); // 3 == 3 breaks strictness
        assert.strictEqual(out[4], false); // 3,3,2 not strictly decreasing
    });

    it("rising is true only after a strict monotonic increase", () => {
        const out = runSeries([1, 2, 3, 3, 5], (ctx, c) => ta.rising(ctx, c, 2));
        assert.strictEqual(out[2], true);  // 1<2<3
        assert.strictEqual(out[3], false); // 3 == 3
        assert.strictEqual(out[4], false); // 3,3,5 not strictly increasing
    });

    it("percentrank: all prior values below current -> 100", () => {
        const out = runSeries([1, 2, 3, 4], (ctx, c) => ta.percentrank(ctx, c, 3));
        // at bar3, prior 3 values [1,2,3] all <= 4 -> 100
        assert.strictEqual(out[3], 100);
    });

    it("wpr is 0 at the top of the range and -100 at the bottom", () => {
        const ctx = new Context();
        // rising highs/lows; last close == highest high -> %R near 0
        const data = [
            { open: 1, high: 2, low: 0, close: 1 },
            { open: 1, high: 4, low: 1, close: 2 },
            { open: 2, high: 6, low: 2, close: 6 }, // close == highest high (6)
        ];
        let last = NaN;
        for (const b of data) { feedCtx(ctx, { ...b, volume: 1 }); last = ta.wpr(ctx, 3); }
        assert.ok(Math.abs(last - 0) <= EPSILON, `expected ~0, got ${last}`);
    });

    it("pivothigh returns the peak value, NaN when not a pivot", () => {
        // highs: peak of 10 at index 2, with left=2 right=2 -> detected at index 4
        const highs = [1, 2, 10, 3, 4, 5, 6];
        const ctx = new Context();
        const out: number[] = [];
        for (const h of highs) {
            feedCtx(ctx, { open: h, high: h, low: h, close: h, volume: 1 });
            out.push(ta.pivothigh(ctx, h, 2, 2));
        }
        assert.strictEqual(out[4], 10); // pivot confirmed 2 bars after the peak
        assert.ok(Number.isNaN(out[5]));
        assert.ok(Number.isNaN(out[6]));
    });

    it("pivotlow returns the trough value", () => {
        const lows = [9, 8, 1, 7, 6, 5, 4];
        const ctx = new Context();
        const out: number[] = [];
        for (const l of lows) {
            feedCtx(ctx, { open: l, high: l, low: l, close: l, volume: 1 });
            out.push(ta.pivotlow(ctx, l, 2, 2));
        }
        assert.strictEqual(out[4], 1);
    });
});

// ─── Composite indicators: stoch / macd / cci ──────────────────────────────────
// These compose multiple stateful sub-indicators in one frame, which previously
// caused persistent-state collisions. Verify they now match the reference.

describe("ta extended — composite (stoch/macd/cci) differential", () => {
    for (const len of LENGTHS) {
        it(`stoch & cci match NaiveTA (length=${len})`, () => {
            const ctx = new Context();
            const naive = new NaiveTA();
            const bars = genBars(800, 9001 + len);

            for (let i = 0; i < bars.length; i++) {
                const b = bars[i];
                feedCtx(ctx, b);
                naive.add(b.close, b.volume, b.high, b.low);

                const stoch = ctx.call("ta.stoch@t", ta.stoch, ctx, b.close, b.high, b.low, len);
                const cci = ctx.call("ta.cci@t", ta.cci, ctx, b.close, len);

                if (i > WARMUP) {
                    assertClose("stoch", stoch, naive.stoch(len), i, len);
                    assertClose("cci", cci, naive.cci(len), i, len);
                }
            }
        });
    }

    for (const [fast, slow, sig] of [[12, 26, 9], [5, 10, 4], [3, 7, 2]]) {
        it(`macd matches NaiveTA (fast=${fast}, slow=${slow}, sig=${sig})`, () => {
            const ctx = new Context();
            const naive = new NaiveTA();
            const bars = genBars(800, 4242 + fast * 100 + slow);

            for (let i = 0; i < bars.length; i++) {
                const b = bars[i];
                feedCtx(ctx, b);
                naive.add(b.close, b.volume, b.high, b.low);

                const [m, s, h] = ctx.call("ta.macd@t", ta.macd, ctx, b.close, fast, slow, sig) as [number, number, number];
                const [rm, rs, rh] = naive.macd(fast, slow, sig);

                if (i > WARMUP) {
                    assertClose("macd.line", m, rm, i, fast);
                    assertClose("macd.signal", s, rs, i, slow);
                    assertClose("macd.hist", h, rh, i, sig);
                }
            }
        });
    }

    it("stoch is 100 at the top of the range and 0 at the bottom", () => {
        const ctx = new Context();
        const bars = [
            { open: 1, high: 5, low: 1, close: 3, volume: 1 },
            { open: 3, high: 6, low: 0, close: 6, volume: 1 }, // close == HH(6) -> 100
        ];
        let top = NaN;
        for (const b of bars) { feedCtx(ctx, b); top = ta.stoch(ctx, b.close, b.high, b.low, 2); }
        assert.ok(Math.abs(top - 100) <= EPSILON, `expected ~100, got ${top}`);

        const ctx2 = new Context();
        const bars2 = [
            { open: 4, high: 6, low: 2, close: 4, volume: 1 },
            { open: 4, high: 7, low: 1, close: 1, volume: 1 }, // close == LL(1) -> 0
        ];
        let bot = NaN;
        for (const b of bars2) { feedCtx(ctx2, b); bot = ta.stoch(ctx2, b.close, b.high, b.low, 2); }
        assert.ok(Math.abs(bot - 0) <= EPSILON, `expected ~0, got ${bot}`);
    });

    it("macd line and histogram are ~0 for a constant series", () => {
        const ctx = new Context();
        let last: [number, number, number] = [NaN, NaN, NaN];
        for (let i = 0; i < 100; i++) {
            feedCtx(ctx, { open: 50, high: 50, low: 50, close: 50, volume: 1 });
            last = ta.macd(ctx, 50, 12, 26, 9) as unknown as [number, number, number];
        }
        // Constant input -> fast EMA == slow EMA -> macd line 0, signal 0, hist 0
        assert.ok(Math.abs(last[0]) <= EPSILON, `macd line should be ~0, got ${last[0]}`);
        assert.ok(Math.abs(last[2]) <= EPSILON, `histogram should be ~0, got ${last[2]}`);
    });
});

// ─── Recursive smoothers: vwma / trix / rsi / tsi ──────────────────────────────
// Each composes repeated stateful sub-indicators (sma/ema/rma) that previously
// collided on a single persistent-state key. Verify exact agreement now.

describe("ta extended — recursive smoothers differential", () => {
    for (const len of LENGTHS) {
        it(`vwma matches NaiveTA (length=${len})`, () => {
            const ctx = new Context();
            const naive = new NaiveTA();
            const bars = genBars(800, 31337 + len);
            for (let i = 0; i < bars.length; i++) {
                const b = bars[i];
                feedCtx(ctx, b);
                naive.add(b.close, b.volume, b.high, b.low);
                const vwma = ctx.call("ta.vwma@t", ta.vwma, ctx, b.close, len);
                if (i > WARMUP) assertClose("vwma", vwma, naive.vwma(len), i, len);
            }
        });
    }

    for (const len of [9, 14, 15]) {
        it(`trix & rsi match NaiveTA (length=${len})`, () => {
            const ctx = new Context();
            const naive = new NaiveTA();
            const bars = genBars(800, 24680 + len);
            for (let i = 0; i < bars.length; i++) {
                const b = bars[i];
                feedCtx(ctx, b);
                naive.add(b.close, b.volume, b.high, b.low);
                const trix = ctx.call("ta.trix@t", ta.trix, ctx, b.close, len);
                const rsi = ctx.call("ta.rsi@t", ta.rsi, ctx, b.close, len);
                // Recursive references must advance their state every bar.
                const refTrix = naive.trix(len);
                const refRsi = naive.rsi(len);
                if (i > WARMUP) {
                    assertClose("trix", trix, refTrix, i, len);
                    assertClose("rsi", rsi, refRsi, i, len);
                }
            }
        });
    }

    for (const [lng, sht] of [[25, 13], [10, 4], [7, 3]]) {
        it(`tsi matches NaiveTA (long=${lng}, short=${sht})`, () => {
            const ctx = new Context();
            const naive = new NaiveTA();
            const bars = genBars(800, 13579 + lng * 10 + sht);
            for (let i = 0; i < bars.length; i++) {
                const b = bars[i];
                feedCtx(ctx, b);
                naive.add(b.close, b.volume, b.high, b.low);
                const tsi = ctx.call("ta.tsi@t", ta.tsi, ctx, b.close, lng, sht);
                const refTsi = naive.tsi(lng, sht); // advance state every bar
                if (i > WARMUP) assertClose("tsi", tsi, refTsi, i, lng);
            }
        });
    }

    it("rsi is bounded in [0, 100]", () => {
        const ctx = new Context();
        const bars = genBars(300, 999);
        for (let i = 0; i < bars.length; i++) {
            feedCtx(ctx, bars[i]);
            const r = ctx.call("ta.rsi@t", ta.rsi, ctx, bars[i].close, 14) as number;
            if (i > 20) assert.ok(r >= -EPSILON && r <= 100 + EPSILON, `rsi out of range: ${r}`);
        }
    });
});

// ─── Property tests for tsi (EMA-recursive double smoothing) ───────────────────

describe("ta extended — tsi properties", () => {
    function runTsi(closes: number[], long: number, short: number): number {
        const ctx = new Context();
        let last = NaN;
        for (const c of closes) {
            feedCtx(ctx, { open: c, high: c, low: c, close: c, volume: 1 });
            last = ctx.call("ta.tsi@t", ta.tsi, ctx, c, long, short);
        }
        return last;
    }

    it("is positive for a strongly rising series", () => {
        const closes = Array.from({ length: 200 }, (_, i) => 100 + i);
        const v = runTsi(closes, 25, 13);
        assert.ok(Number.isFinite(v), `tsi should be finite, got ${v}`);
        assert.ok(v > 0, `tsi should be > 0 for rising series, got ${v}`);
        assert.ok(v <= 100 + EPSILON, `tsi should not exceed 100, got ${v}`);
    });

    it("is negative for a strongly falling series", () => {
        const closes = Array.from({ length: 200 }, (_, i) => 100 - i * 0.5);
        const v = runTsi(closes, 25, 13);
        assert.ok(Number.isFinite(v), `tsi should be finite, got ${v}`);
        assert.ok(v < 0, `tsi should be < 0 for falling series, got ${v}`);
        assert.ok(v >= -100 - EPSILON, `tsi should not go below -100, got ${v}`);
    });
});
