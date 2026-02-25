/**
 * mock_run/v2/run.ts - CLI Runner for local CSV backtesting
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { Context } from "../../runtime/v2/context";
import { compile } from "../../runtime/v2"; 
import { transpile } from "../../transpiler/v2/";

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
            // Re-integrated detailed syntax error logging
            if (e.errors && Array.isArray(e.errors)) {
                console.log(`\n${C.Yellow}Syntax Error Details:${C.Reset}`);
                e.errors.forEach((err: any) => {
                    const line = err.line || err.startLineNumber || "?";
                    const col = err.column || err.startColumn || "?";
                    const msg = err.message || "Unknown error";
                    console.error(`  ${C.Red}[Line ${line}:${col}]${C.Reset} ${msg}`);
                });
            }
            process.exit(1);
        }

        if (showTranspiled) {
            console.log(`\n${C.Gray}--- Transpiled JavaScript ---${C.Reset}\n${jsCode}\n${C.Gray}-----------------------------${C.Reset}\n`);
        }

        // 2. Load CSV
        const csvContent = fs.readFileSync(path.resolve(csvPath), "utf8").trim();
        const rows = csvContent.split("\n").slice(1); 

        // 3. Setup Runtime
        const ctx = new Context();
        const sandbox = { ctx }; 
        const executeBar = compile(jsCode, ctx, sandbox);

        console.log(`${C.Cyan}Starting Backtest on ${rows.length} bars...${C.Reset}\n`);

        // 4. Execution Loop
        rows.forEach((line, index) => {
            const cols = line.split(",");
            if (cols.length < 5) return;

            ctx.time   = new Date(cols[0]).getTime();
            ctx.open   = parseFloat(cols[1]);
            ctx.high   = parseFloat(cols[2]);
            ctx.low    = parseFloat(cols[3]);
            ctx.close  = parseFloat(cols[4]);
            ctx.volume = parseFloat(cols[5]) || 0;

            executeBar();
            ctx.finalizeBar();

            // Periodic Log Output
            if (index % 100 === 0 || index === rows.length - 1) {
                const plotOutputs: string[] = [];
                
                for (const [title, series] of ctx.plots.entries()) {
                    const dataPoint = series[index];
                    if (dataPoint && dataPoint.value !== null && !Number.isNaN(dataPoint.value)) {
                        const jsonStr = JSON.stringify(dataPoint, (k, v) => k === 'title' ? undefined : v);
                        plotOutputs.push(`${C.Green}${title}${C.Reset}: ${jsonStr}`);
                    } else {
                        plotOutputs.push(`${C.Gray}${title}: ⏳ Warming Up (NaN)${C.Reset}`);
                    }
                }
                
                const plotString = plotOutputs.length > 0 ? `\n    ${plotOutputs.join("\n    ")}` : "";
                const posSize = (ctx as any).strategy?.position_size ?? 0;
                
                console.log(
                    `${C.Gray}[Bar ${index.toString().padEnd(4)}]${C.Reset} ` +
                    `Close: ${ctx.close.toFixed(2).padEnd(8)} ` +
                    (posSize !== 0 ? `${C.Yellow}Pos: ${posSize}${C.Reset}` : "") + 
                    `${plotString}` 
                );
            }
        });

        console.log(`\n${C.Green}✔ Backtest Finished.${C.Reset}`);

        // 5. Strategy Summary (Optional re-addition)
        if ((ctx as any).strategy?.trades?.length > 0) {
            console.log(`\n${C.Cyan}=== STRATEGY REPORT ===${C.Reset}`);
            console.log(`Final Equity: $${ctx.cash.toFixed(2)}`);
        }

    } catch (err: any) {
        console.error(`\n${C.Red}Critical Runtime Error:${C.Reset}\n`, err.stack || err.message);
        process.exit(1);
    }
}

start();
