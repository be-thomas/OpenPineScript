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

const EPSILON = 0.000001; // Allow microscopic float drift
const TOTAL_BARS = 5000;

function assertClose(name: string, actual: number, expected: number, barIdx: number, length: number) {
    if (Number.isNaN(actual) && Number.isNaN(expected)) return;
    
    // Handle very small numbers or zero
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
    
    // Data Generators
    let price = 100;
    
    for (let i = 0; i < TOTAL_BARS; i++) {
        // 1. Generate Random Data
        const change = (Math.random() - 0.5) * 2;
        price += change;
        const vol = Math.abs(Math.random() * 1000);

        // Update Context
        ctx.close = price;
        ctx.volume = vol;
        
        // Update Naive
        naive.add(price, vol);

        // 2. Determine Length based on Mode
        let len = 14;
        if (mode === "STABLE") len = 14;
        if (mode === "INCREASING") len = Math.min(100, 5 + Math.floor(i / 50)); // Grows slowly
        if (mode === "DECREASING") len = Math.max(2, 100 - Math.floor(i / 50)); // Shrinks slowly
        if (mode === "OSCILLATING") len = Math.floor(Math.random() * 40) + 5; // Chaos (5 to 45)

        // 3. EXECUTE OPTIMIZED
        // We must call ctx.reset() before calling functions for this bar!
        ctx.reset(); 

        const resSMA = ta.sma(ctx, ctx.close, len);
        const resWMA = ta.wma(ctx, ctx.close, len);
        const resBB = ta.bb(ctx, ctx.close, len, 2.0);
        const resHigh = ta.highest(ctx, ctx.close, len);
        const resLow = ta.lowest(ctx, ctx.close, len);
        const resHighBar = ta.highestbars(ctx, ctx.close, len);
        const resLowBar = ta.lowestbars(ctx, ctx.close, len);

        // 4. EXECUTE NAIVE
        const refSMA = naive.sma(len);
        const refWMA = naive.wma(len);
        const refBB = naive.bb(len, 2.0);
        const refHigh = naive.highest(len);
        const refLow = naive.lowest(len);
        const refHighBar = naive.highestbars(len);
        const refLowBar = naive.lowestbars(len);

        // 5. COMPARE
        // Only compare if enough bars exist
        if (i > 100) {
            assertClose("SMA", resSMA, refSMA, i, len);
            assertClose("WMA", resWMA, refWMA, i, len);
            
            // BB returns [basis, upper, lower]
            assertClose("BB.basis", resBB[0], refBB[0], i, len);
            assertClose("BB.upper", resBB[1], refBB[1], i, len);
            assertClose("BB.lower", resBB[2], refBB[2], i, len);

            assertClose("Highest", resHigh, refHigh, i, len);
            assertClose("Lowest", resLow, refLow, i, len);
            
            // Use slightly higher epsilon for Bars offset as it is integer but we want to be safe
            if (resHighBar !== refHighBar) {
                 console.error(`${C.Red}[FAIL] HighestBars Bar:${i} Len:${len} | Actual: ${resHighBar} vs Ref: ${refHighBar}${C.Reset}`);
                 process.exit(1);
            }
            if (resLowBar !== refLowBar) {
                 console.error(`${C.Red}[FAIL] LowestBars Bar:${i} Len:${len} | Actual: ${resLowBar} vs Ref: ${refLowBar}${C.Reset}`);
                 process.exit(1);
            }
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
