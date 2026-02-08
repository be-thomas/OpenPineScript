/**
 * mock_run/v2/run.ts - CLI Runner for local CSV backtesting
 * Features:
 * - Detailed Syntax Error Logging
 * - Strategy Performance Report
 * - Plot Output
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { Context } from "../../runtime/v2/context";
import { compile } from "../../runtime/v2"; 
import { transpile } from "../../transpiler/v2";

// --- ANSI Colors for CLI output ---
const C = {
    Cyan: "\x1b[36m",
    Gray: "\x1b[90m",
    Green: "\x1b[32m",
    Red: "\x1b[31m",
    Yellow: "\x1b[33m",
    Reset: "\x1b[0m",
};

async function start() {
    const args = process.argv.slice(2);
    const showTranspiled = args.includes("--show-transpiled-code");
    
    const scriptPath = args.find(arg => arg.endsWith(".pine"));
    const csvPath = args.find(arg => arg.endsWith(".csv"));

    if (!scriptPath || !csvPath) {
        console.log(`${C.Red}Usage:${C.Reset} npx tsx mock_run/v2/run.ts <script.pine> <data.csv> [--show-transpiled-code]`);
        process.exit(1);
    }

    try {
        // 1. Load and Transpile
        console.log(`${C.Cyan}Compiling:${C.Reset} ${path.basename(scriptPath)}...`);
        const pineSource = fs.readFileSync(path.resolve(scriptPath), "utf8");
        
        let jsCode = "";
        try {
            jsCode = transpile(pineSource);
        } catch (e: any) {
            console.error(`${C.Red}Transpilation Failed:${C.Reset} ${e.message}`);
            
            // --- ERROR LOGGING UPGRADE ---
            // Iterate over the specific syntax errors provided by the parser
            if (e.errors && Array.isArray(e.errors)) {
                console.log(`\n${C.Yellow}Syntax Errors Details:${C.Reset}`);
                e.errors.forEach((err: any) => {
                    // Handle ANTLR error format or custom format
                    const line = err.line || err.startLineNumber || "?";
                    const col = err.column || err.startColumn || "?";
                    const msg = err.message || err.msg || "Unknown error";
                    console.error(`  ${C.Red}[Line ${line}:${col}]${C.Reset} ${msg}`);
                });
            }
            process.exit(1);
        }

        if (showTranspiled) {
            console.log(`\n${C.Gray}--- Transpiled JavaScript ---${C.Reset}`);
            console.log(jsCode);
            console.log(`${C.Gray}-----------------------------${C.Reset}\n`);
        }

        // 2. Load CSV
        const csvContent = fs.readFileSync(path.resolve(csvPath), "utf8").trim();
        const lines = csvContent.split("\n");
        const rows = lines.slice(1); 

        // 3. Setup Runtime
        const ctx = new Context();
        const sandbox = { ctx }; 

        console.log(`${C.Cyan}Initializing Sandbox...${C.Reset}`);
        const executeBar = compile(jsCode, ctx, sandbox);

        console.log(`${C.Cyan}Starting Backtest on ${rows.length} bars...${C.Reset}\n`);

        // 4. Execution Loop
        rows.forEach((line, index) => {
            const cols = line.split(",");
            if (cols.length < 5) return;

            // Update Market Data
            ctx.time   = new Date(cols[0]).getTime();
            ctx.open   = parseFloat(cols[1]);
            ctx.high   = parseFloat(cols[2]);
            ctx.low    = parseFloat(cols[3]);
            ctx.close  = parseFloat(cols[4]);
            ctx.volume = parseFloat(cols[5]);

            // Lifecycle
            executeBar();       // Run Script
            ctx.finalizeBar();  // Sync Plots & Trades

            // Log Output (Every 100 bars)
            if (index % 100 === 0 || index === rows.length - 1) {
                const plotSeries = ctx.plots.get("SMA"); // Look for "SMA" specifically since you named it
                const val = plotSeries ? plotSeries[index] : NaN;
                
                // Also check if we have a position
                const pos = ctx.position.size !== 0 ? `Pos: ${ctx.position.size}` : "";

                const plotStr = (Number.isNaN(val) || val === undefined)
                    ? `${C.Gray}NaN${C.Reset}` 
                    : `${C.Green}${val.toFixed(2)}${C.Reset}`;

                console.log(
                    `${C.Gray}[Bar ${index}]${C.Reset} ` +
                    `Close: ${ctx.close.toFixed(2)} | ` +
                    `SMA: ${plotStr} ${pos}`
                );
            }
        });

        console.log(`\n${C.Green}✔ Backtest Finished.${C.Reset}`);

        // --- STRATEGY REPORT ---
        if (ctx.trades && ctx.trades.length > 0) {
            console.log(`\n${C.Cyan}=== STRATEGY REPORT ===${C.Reset}`);
            
            let totalPnL = 0;
            let wins = 0;
            let losses = 0;

            console.log(`${C.Gray}Type  | Price    | Qty | PnL${C.Reset}`);
            console.log(`${C.Gray}--------------------------------${C.Reset}`);

            ctx.trades.forEach(t => {
                totalPnL += t.pnl;
                t.pnl > 0 ? wins++ : losses++;

                const pnlColor = t.pnl >= 0 ? C.Green : C.Red;
                const typeStr = t.direction === "long" ? "LONG " : "SHORT";
                
                console.log(
                    `${typeStr} | ` +
                    `${t.entryPrice.toFixed(2).padEnd(8)} | ` +
                    `${t.qty.toString().padEnd(3)} | ` +
                    `${pnlColor}${t.pnl.toFixed(2)}${C.Reset}`
                );
            });

            console.log(`\n${C.Cyan}=== PERFORMANCE ===${C.Reset}`);
            console.log(`Net Profit:   $${totalPnL.toFixed(2)}`);
            console.log(`Total Trades: ${ctx.trades.length}`);
            console.log(`Final Equity: $${ctx.cash.toFixed(2)}`);
        } else {
            console.log(`\n${C.Gray}No trades were executed.${C.Reset}`);
        }

    } catch (err: any) {
        console.error(`\n${C.Red}Critical Runtime Error:${C.Reset}\n`, err.stack || err.message);
        process.exit(1);
    }
}

start();
