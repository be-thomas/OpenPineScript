/**
 * test/verify_ta.ts
 * Stress test for the Optimized TA Engine.
 */
import { Context } from "../../../runtime/v2/context";
import * as ta from "../../../runtime/v2/stdlib/ta";
import { NaiveTA } from "./naive_ta";

const C = {
    Green: "\x1b[32m",
    Red: "\x1b[31m",
    Cyan: "\x1b[36m",
    Reset: "\x1b[0m",
};

const EPSILON = 0.000001; 
const TOTAL_BARS = 5000;

function assertClose(name: string, actual: number, expected: number, barIdx: number, length: number) {
    if (Number.isNaN(actual) && Number.isNaN(expected)) return;
    
    const diff = Math.abs(actual - expected);
    if (diff > EPSILON) {
        console.error(`${C.Red}[FAIL] ${name} Bar:${barIdx} Len:${length} | Actual: ${actual} vs Ref: ${expected}${C.Reset}`);
        process.exit(1);
    }
}

function runStressTest(mode: "STABLE" | "INCREASING" | "DECREASING" | "OSCILLATING") {
    console.log(`\n${C.Cyan}=== Running Test: ${mode} LENGTH ===${C.Reset}`);

    const ctx = new Context();
    const naive = new NaiveTA();
    
    let price = 100;
    // We'll track condition history for valuewhen/barssince
    const conditionHistory: boolean[] = [];
    const sourceHistory: number[] = [];
    
    for (let i = 0; i < TOTAL_BARS; i++) {
        // 1. Generate Realistic OHLCV Data
        const change = (Math.random() - 0.5) * 2;
        const open = price;
        const close = price + change;
        const high = Math.max(open, close) + Math.random();
        const low = Math.min(open, close) - Math.random();
        const vol = Math.abs(Math.random() * 1000);
        price = close;

        // Update Context (mimicking the real engine's setBar behavior)
        (ctx as any).high = high;
        (ctx as any).low = low;
        ctx.close = close;
        ctx.volume = vol;
        
        // Update Naive
        naive.add(close, vol, high, low);

        // Track conditions for state lookups
        const isBullish = close > open;
        conditionHistory.push(isBullish);
        sourceHistory.push(close);

        // 2. Determine Length
        let len = 14;
        if (mode === "STABLE") len = 14;
        if (mode === "INCREASING") len = Math.min(100, 5 + Math.floor(i / 50));
        if (mode === "DECREASING") len = Math.max(2, 100 - Math.floor(i / 50));
        if (mode === "OSCILLATING") len = Math.floor(Math.random() * 40) + 5;

        // 3. EXECUTE OPTIMIZED
        const resSMA = ctx.call("ta.sma@test", ta.sma, ctx, ctx.close, len);
        const resWMA = ctx.call("ta.wma@test", ta.wma, ctx, ctx.close, len);
        const resBB = ctx.call("ta.bb@test", ta.bb, ctx, ctx.close, len, 2.0);
        const resHigh = ctx.call("ta.highest@test", ta.highest, ctx, ctx.close, len);
        const resLow = ctx.call("ta.lowest@test", ta.lowest, ctx, ctx.close, len);
        
        // New Indicators
        const resATR = ctx.call("ta.atr@test", ta.atr, ctx, len);
        const resVWAP = ctx.call("ta.vwap@test", ta.vwap, ctx, ctx.close);
        const resLinreg = ctx.call("ta.linreg@test", ta.linreg, ctx, ctx.close, len, 0);
        const resSAR = ctx.call("ta.sar@test", ta.sar, ctx, 0.02, 0.02, 0.2);
        
        // State Lookups
        const resVW = ctx.call("ta.valuewhen@test", ta.valuewhen, ctx, isBullish, ctx.close, 0);
        const resBS = ctx.call("ta.barssince@test", ta.barssince, ctx, isBullish);

        // 4. EXECUTE NAIVE
        const refSMA = naive.sma(len);
        const refWMA = naive.wma(len);
        const refBB = naive.bb(len, 2.0);
        const refHigh = naive.highest(len);
        const refLow = naive.lowest(len);
        const refATR = naive.atr(len);
        const refVWAP = naive.vwap();
        const refLinreg = naive.linreg(len, 0);
        const refSAR = naive.sar(0.02, 0.02, 0.2);
        const refVW = naive.valuewhen(conditionHistory, sourceHistory, 0);
        const refBS = naive.barssince(conditionHistory);

        // 5. COMPARE
        if (i > 100) {
            assertClose("SMA", resSMA, refSMA, i, len);
            assertClose("WMA", resWMA, refWMA, i, len);
            assertClose("BB.basis", resBB[0], refBB[0], i, len);
            assertClose("Highest", resHigh, refHigh, i, len);
            assertClose("Lowest", resLow, refLow, i, len);
            
            // New Comparisons
            assertClose("ATR", resATR, refATR, i, len);
            assertClose("VWAP", resVWAP, refVWAP, i, len);
            assertClose("Linreg", resLinreg, refLinreg, i, len);
            assertClose("SAR", resSAR, refSAR, i, len);
            assertClose("ValueWhen", resVW, refVW, i, len);
            assertClose("BarsSince", resBS, refBS, i, len);
        }
    }
    console.log(`${C.Green}✔ Passed 5000 iterations.${C.Reset}`);
}

// Run All Modes
try {
    runStressTest("STABLE");
    runStressTest("INCREASING");
    runStressTest("DECREASING");
    runStressTest("OSCILLATING");
    console.log(`\n${C.Green}ALL SYSTEMS GREEN. ENGINE IS PRODUCTION READY.${C.Reset}`);
} catch (e) {
    console.error(e);
}