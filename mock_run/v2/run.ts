/**
 * mock_run/v2/run.ts - CLI Runner for OpenPineScript v2
 *
 * Usage:
 *   npm run opsv2 -- <script.pine> --data <data.csv> [flags]
 *
 * Output flags:
 *   --out-dir <dir>        Write chart.csv, trades.csv, and summary.json to <dir>
 *   --out-chart <file>     Write chart + plots as CSV
 *   --out-trades <file>    Write trade log as CSV (strategy scripts only)
 *   --out-summary <file>   Write performance summary as JSON
 *
 * Comparison flags (validate against TradingView exports):
 *   --compare-dir <dir>    Directory containing chart_data.csv, trades.csv, summary.json
 *   --compare-chart <file> Compare chart/indicator data against this TV export
 *   --compare-trades <file>Compare trade log against this TV export
 *   --compare-summary <file> Compare summary against this TV export
 *   --tolerance <float>    Floating-point epsilon for comparisons (default: 0.0001)
 *
 * Input overrides:
 *   --input <key=value>    Override a Pine Script input (e.g. --input input_0=20)
 *                          Repeat for multiple inputs. Run once to see available IDs.
 *
 * Debug:
 *   --show-transpiled      Print the compiled JavaScript before running
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { Context } from "../../runtime/v2/context";
import { compile } from "../../runtime/v2";
import { transpile } from "../../transpiler/v2/";
import { runComparison } from "../../utils/v2/comparison_engine";

// --- Terminal Colors ---
const C = {
    Cyan:   "\x1b[36m",
    Gray:   "\x1b[90m",
    Green:  "\x1b[32m",
    Red:    "\x1b[31m",
    Yellow: "\x1b[33m",
    Bold:   "\x1b[1m",
    Reset:  "\x1b[0m",
};

// --- Argument Parser ---
interface CliArgs {
    scriptPath: string;
    dataPath: string;
    // Output flags
    outDir:     string | null;
    outChart:   string | null;
    outTrades:  string | null;
    outSummary: string | null;
    // Comparison flags
    compareDir:     string | null;
    compareChart:   string | null;
    compareTrades:  string | null;
    compareSummary:    string | null;
    outComparison:     string | null;
    tolerance: number;
    // Misc
    inputs: Record<string, string>;
    showTranspiled: boolean;
}

function getFlag(args: string[], flag: string): string | null {
    const i = args.indexOf(flag);
    return i !== -1 && i + 1 < args.length ? args[i + 1] : null;
}

function parseArgs(argv: string[]): CliArgs {
    const args = argv.slice(2);

    const scriptPath = args.find(a => a.endsWith(".pine")) ?? null;
    if (!scriptPath) {
        console.error(`${C.Red}Error:${C.Reset} No .pine script file specified.\n`);
        printUsage();
        process.exit(1);
    }

    const dataPath = getFlag(args, "--data");
    if (!dataPath) {
        console.error(`${C.Red}Error:${C.Reset} --data <csv> is required.\n`);
        printUsage();
        process.exit(1);
    }

    // Collect all --input key=value pairs
    const inputs: Record<string, string> = {};
    for (let i = 0; i < args.length; i++) {
        if (args[i] === "--input" && i + 1 < args.length) {
            const kv = args[i + 1];
            const eqIdx = kv.indexOf("=");
            if (eqIdx > 0) {
                inputs[kv.slice(0, eqIdx)] = kv.slice(eqIdx + 1);
            } else {
                console.warn(`${C.Yellow}⚠ Warning:${C.Reset} --input value "${kv}" is not in key=value format, skipping.`);
            }
            i++;
        }
    }

    const rawTol = getFlag(args, "--tolerance");
    const tolerance = rawTol !== null ? parseFloat(rawTol) : 0.0001;
    if (rawTol !== null && isNaN(tolerance)) {
        console.error(`${C.Red}Error:${C.Reset} --tolerance must be a number (got "${rawTol}").`);
        process.exit(1);
    }

    return {
        scriptPath,
        dataPath,
        outDir:         getFlag(args, "--out-dir"),
        outChart:       getFlag(args, "--out-chart"),
        outTrades:      getFlag(args, "--out-trades"),
        outSummary:     getFlag(args, "--out-summary"),
        compareDir:     getFlag(args, "--compare-dir"),
        compareChart:   getFlag(args, "--compare-chart"),
        compareTrades:  getFlag(args, "--compare-trades"),
        compareSummary: getFlag(args, "--compare-summary"),
        outComparison:  getFlag(args, "--out-comparison"),
        tolerance,
        inputs,
        showTranspiled: args.includes("--show-transpiled"),
    };
}

function printUsage() {
    console.log(
`${C.Bold}Usage:${C.Reset} npm run opsv2 -- <script.pine> --data <data.csv> [flags]

${C.Bold}Output flags:${C.Reset}
  --out-dir <dir>        Write chart.csv, trades.csv, and summary.json to <dir>
  --out-chart <file>     Write chart + plots as CSV
  --out-trades <file>    Write trade log as CSV (strategy scripts only)
  --out-summary <file>   Write performance summary as JSON

  If no output flag is given, a formatted summary is printed to the terminal.

${C.Bold}Comparison flags (validate against TradingView exports):${C.Reset}
  --compare-dir <dir>    Directory with chart_data.csv, trades.csv, summary.json
  --compare-chart <file> Compare chart/indicator data against this TV export
  --compare-trades <file>Compare trade log against this TV export
  --compare-summary <file> Compare performance summary against this TV export
  --out-comparison <dir> Write comparison_report.json here (falls back to --out-dir)
  --tolerance <float>    Epsilon for floating-point comparisons (default: 0.0001)

${C.Bold}Input overrides:${C.Reset}
  --input <key=value>    Override a Pine Script input by its sequential ID.
                         E.g. --input input_0=20 --input input_1=0.5
                         Run the script once to discover available input IDs.

${C.Bold}Debug:${C.Reset}
  --show-transpiled      Print the compiled JavaScript before running
`);
}

// --- CSV Parsing ---
interface Bar {
    time:   number;
    open:   number;
    high:   number;
    low:    number;
    close:  number;
    volume: number;
}

function loadCsv(csvPath: string): Bar[] {
    const content = fs.readFileSync(path.resolve(csvPath), "utf8").trim();
    const lines = content.split(/\r?\n/);
    // Auto-detect header row
    const dataLines = lines[0].toLowerCase().includes("time") ? lines.slice(1) : lines;

    return dataLines
        .map(l => l.trim())
        .filter(l => l.length > 0)
        .map(line => {
            const cols = line.split(",");
            return {
                time:   new Date(cols[0]).getTime(),
                open:   parseFloat(cols[1]),
                high:   parseFloat(cols[2]),
                low:    parseFloat(cols[3]),
                close:  parseFloat(cols[4]),
                volume: parseFloat(cols[5]) || 0,
            };
        })
        .filter(b => !isNaN(b.close));
}

// --- Output Generators ---

/**
 * Builds a CSV with OHLCV columns + one column per plot().
 * Headers use each plot's `title` as the column name.
 */
function generateChartCsv(bars: Bar[], ctx: Context): string {
    const plotEntries = [...ctx.plots.entries()];

    // Derive a display name for each plot series from the first non-null data point.
    // Guard against runtime cases where title ends up as a non-string (e.g. a color object).
    const plotHeaders = plotEntries.map(([, series], idx) => {
        const first = series.find(p => p !== null);
        const raw   = first?.title;
        const title = typeof raw === "string" && raw.length > 0 ? raw : `Plot_${idx + 1}`;
        return title.replace(/,/g, ";"); // Escape commas so CSV stays valid
    });

    const header = ["time", "open", "high", "low", "close", "volume", ...plotHeaders].join(",");

    const rows = bars.map((bar, i) => {
        const ts = new Date(bar.time).toISOString();
        const ohlcv = [ts, bar.open, bar.high, bar.low, bar.close, bar.volume];
        const plotValues = plotEntries.map(([, series]) => {
            const pt = series[i];
            return pt !== null && pt !== undefined && !isNaN(pt.value) ? pt.value.toFixed(6) : "";
        });
        return [...ohlcv, ...plotValues].join(",");
    });

    return [header, ...rows].join("\n");
}

/**
 * Builds a TradingView-style trade log CSV.
 * Each Trade in ctx.trades produces one Entry row and one Exit row.
 */
function generateTradesCsv(ctx: Context): string {
    if (ctx.trades.length === 0) return "";

    const INITIAL_CAPITAL = 100000;
    const header = "Trade #,Type,Signal,Date/Time,Price,Contracts,Profit,Profit %,Cum. Profit";

    let cumProfit = 0;
    const rows: string[] = [];

    ctx.trades.forEach((trade, i) => {
        const num      = i + 1;
        const isLong   = trade.direction === "long";
        const signal   = trade.id.replace(/^(Close|Exit)\s*/i, "").trim() || "Signal";
        const entryDt  = trade.entryTime ? new Date(trade.entryTime).toISOString() : "N/A";
        const exitDt   = new Date(trade.exitTime).toISOString();
        const profitPct = (trade.pnl / INITIAL_CAPITAL) * 100;
        cumProfit += trade.pnl;

        // Entry row — profit columns are 0 at entry
        rows.push([
            num,
            isLong ? "Entry Long" : "Entry Short",
            signal,
            entryDt,
            trade.entryPrice.toFixed(4),
            trade.qty,
            "0.00",
            "0.00",
            (cumProfit - trade.pnl).toFixed(2),
        ].join(","));

        // Exit row
        rows.push([
            num,
            isLong ? "Exit Long" : "Exit Short",
            trade.id,
            exitDt,
            trade.exitPrice.toFixed(4),
            trade.qty,
            trade.pnl.toFixed(2),
            profitPct.toFixed(2),
            cumProfit.toFixed(2),
        ].join(","));
    });

    return [header, ...rows].join("\n");
}

/**
 * Computes performance metrics from ctx.trades and returns a JSON-serialisable object.
 */
function generateSummary(ctx: Context): Record<string, number | null> {
    const INITIAL_CAPITAL = 100000;
    const trades = ctx.trades;

    const netProfit    = ctx.cash - INITIAL_CAPITAL;
    const netProfitPct = (netProfit / INITIAL_CAPITAL) * 100;

    const winners = trades.filter(t => t.pnl > 0);
    const losers  = trades.filter(t => t.pnl < 0);

    const grossProfit = winners.reduce((s, t) => s + t.pnl, 0);
    const grossLoss   = Math.abs(losers.reduce((s, t) => s + t.pnl, 0));
    const rawPF       = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? Infinity : 0);

    const winRate = trades.length > 0 ? (winners.length / trades.length) * 100 : 0;
    const avgWin  = winners.length > 0 ? grossProfit / winners.length : 0;
    const avgLoss = losers.length  > 0 ? grossLoss   / losers.length  : 0;

    // Max drawdown from equity curve
    let equity = INITIAL_CAPITAL;
    let peak   = INITIAL_CAPITAL;
    let maxDrawdown = 0;
    for (const t of trades) {
        equity += t.pnl;
        if (equity > peak) peak = equity;
        const dd = peak > 0 ? ((peak - equity) / peak) * 100 : 0;
        if (dd > maxDrawdown) maxDrawdown = dd;
    }

    const fmt = (n: number, d = 2) => parseFloat(n.toFixed(d));

    return {
        net_profit:           fmt(netProfit),
        net_profit_percent:   fmt(netProfitPct),
        gross_profit:         fmt(grossProfit),
        gross_loss:           fmt(grossLoss),
        total_closed_trades:  trades.length,
        winning_trades:       winners.length,
        losing_trades:        losers.length,
        win_rate:             fmt(winRate),
        avg_win:              fmt(avgWin),
        avg_loss:             fmt(avgLoss),
        profit_factor:        isFinite(rawPF) ? fmt(rawPF, 3) : null,
        max_drawdown_percent: fmt(maxDrawdown),
    };
}

// --- Console Summary ---
function printConsoleSummary(ctx: Context, totalBars: number, scriptName: string) {
    const isStrategy = ctx.trades.length > 0 || ctx.position.size !== 0;
    const plotCount  = ctx.plots.size;

    console.log(`\n${C.Bold}${C.Cyan}=== ${path.basename(scriptName)} — Summary ===${C.Reset}`);
    console.log(`${C.Gray}Bars processed : ${totalBars}${C.Reset}`);
    console.log(`${C.Gray}Plots recorded : ${plotCount}${C.Reset}`);

    if (isStrategy) {
        const s = generateSummary(ctx);
        const profit = s.net_profit as number;
        const sign   = profit >= 0 ? "+" : "";
        const pc     = s.net_profit_percent as number;
        const col    = profit >= 0 ? C.Green : C.Red;

        console.log(`\n${C.Bold}Performance:${C.Reset}`);
        console.log(`  Net Profit         ${col}${sign}$${profit.toFixed(2)} (${sign}${pc.toFixed(2)}%)${C.Reset}`);
        console.log(`  Total Trades       ${s.total_closed_trades}`);
        console.log(`  Win Rate           ${(s.win_rate as number).toFixed(1)}%  (${s.winning_trades}W / ${s.losing_trades}L)`);
        console.log(`  Profit Factor      ${s.profit_factor ?? "N/A"}`);
        console.log(`  Max Drawdown       ${(s.max_drawdown_percent as number).toFixed(2)}%`);
        console.log(`  Avg Win / Avg Loss $${(s.avg_win as number).toFixed(2)} / $${(s.avg_loss as number).toFixed(2)}`);
    }

    // Print input definitions so users know what --input flags to use
    if (ctx.inputDefs.length > 0) {
        console.log(`\n${C.Bold}Script Inputs:${C.Reset}`);
        ctx.inputDefs.forEach(def => {
            const override = ctx.userInputs[def.id];
            const valStr   = override !== undefined
                ? `${override} ${C.Gray}(overridden from ${def.defval})${C.Reset}`
                : `${def.defval} ${C.Gray}(default)${C.Reset}`;
            console.log(`  ${C.Cyan}${def.id}${C.Reset}  "${def.title}"  [${def.type}]  = ${valStr}`);
        });
        if (Object.keys(ctx.userInputs).length === 0) {
            console.log(`  ${C.Gray}Tip: override with --input input_0=<value>${C.Reset}`);
        }
    }
}

// --- Main ---
async function main() {
    const cli = parseArgs(process.argv);

    // 1. Load and Transpile
    process.stderr.write(`${C.Cyan}Compiling:${C.Reset} ${path.basename(cli.scriptPath)}...\n`);

    let pineSource: string;
    try {
        pineSource = fs.readFileSync(path.resolve(cli.scriptPath), "utf8");
    } catch {
        console.error(`${C.Red}Error:${C.Reset} Cannot read script: ${cli.scriptPath}`);
        process.exit(1);
    }

    let jsCode: string;
    try {
        jsCode = transpile(pineSource);
    } catch (e: any) {
        console.error(`${C.Red}Transpilation failed:${C.Reset} ${e.message}`);
        if (Array.isArray(e.errors)) {
            e.errors.forEach((err: any) => {
                const line = err.line ?? err.startLineNumber ?? "?";
                const col  = err.column ?? err.startColumn ?? "?";
                console.error(`  ${C.Red}[Line ${line}:${col}]${C.Reset} ${err.message ?? "Unknown error"}`);
            });
        }
        process.exit(1);
    }

    if (cli.showTranspiled) {
        console.log(`\n${C.Gray}--- Transpiled JavaScript ---${C.Reset}\n${jsCode}\n${C.Gray}-----------------------------${C.Reset}\n`);
    }

    // 2. Load CSV data
    let bars: Bar[];
    try {
        bars = loadCsv(cli.dataPath);
    } catch {
        console.error(`${C.Red}Error:${C.Reset} Cannot read CSV: ${cli.dataPath}`);
        process.exit(1);
    }

    if (bars.length === 0) {
        console.error(`${C.Red}Error:${C.Reset} CSV has no valid data rows.`);
        process.exit(1);
    }

    // 3. Setup Context — apply any input overrides before first bar
    const ctx = new Context();

    for (const [key, rawVal] of Object.entries(cli.inputs)) {
        const numVal = parseFloat(rawVal);
        ctx.userInputs[key] = isNaN(numVal) ? rawVal : numVal;
    }

    const sandbox = { ctx };
    const executeBar = compile(jsCode, ctx, sandbox);

    process.stderr.write(`${C.Cyan}Running backtest:${C.Reset} ${bars.length} bars...\n`);

    // 4. Bar-by-bar execution loop
    bars.forEach((bar, i) => {
        ctx.is_new      = true;
        ctx.is_last     = i === bars.length - 1;
        ctx.is_history  = !ctx.is_last;
        ctx.is_realtime = ctx.is_last;

        ctx.setBar(bar.time, bar.open, bar.high, bar.low, bar.close, bar.volume);
        executeBar();
        ctx.finalizeBar();
    });

    process.stderr.write(`${C.Green}✔ Done.${C.Reset}\n`);

    // 5. Generate output data (always in-memory; written to disk only if flags are set)
    const isStrategy  = ctx.trades.length > 0 || ctx.position.size !== 0;
    const chartCsv    = generateChartCsv(bars, ctx);
    const tradesCsv   = isStrategy ? generateTradesCsv(ctx) : "";
    const summaryJson = generateSummary(ctx);

    // 6. Write output files
    const hasOutputFlag = cli.outDir || cli.outChart || cli.outTrades || cli.outSummary;

    if (hasOutputFlag) {
        if (cli.outDir) {
            fs.mkdirSync(path.resolve(cli.outDir), { recursive: true });
        }

        /** Resolve a file path: use explicit flag > fallback under --out-dir > skip */
        const resolve = (flag: string | null, fallback: string): string | null =>
            flag ?? (cli.outDir ? path.join(cli.outDir, fallback) : null);

        const chartFile   = resolve(cli.outChart,   "chart.csv");
        const tradesFile  = resolve(cli.outTrades,  "trades.csv");
        const summaryFile = resolve(cli.outSummary, "summary.json");

        if (chartFile) {
            fs.writeFileSync(path.resolve(chartFile), chartCsv, "utf8");
            console.log(`${C.Green}✔${C.Reset} Chart    → ${chartFile}`);
        }

        if (tradesFile) {
            if (!isStrategy) {
                console.warn(`${C.Yellow}⚠ Warning:${C.Reset} --out-trades requested but no trades were recorded. Is this an indicator rather than a strategy?`);
            } else {
                fs.writeFileSync(path.resolve(tradesFile), tradesCsv, "utf8");
                console.log(`${C.Green}✔${C.Reset} Trades   → ${tradesFile}  (${ctx.trades.length} trades)`);
            }
        }

        if (summaryFile) {
            if (!isStrategy) {
                console.warn(`${C.Yellow}⚠ Warning:${C.Reset} --out-summary requested but no trades were recorded.`);
            }
            fs.writeFileSync(path.resolve(summaryFile), JSON.stringify(summaryJson, null, 2), "utf8");
            console.log(`${C.Green}✔${C.Reset} Summary  → ${summaryFile}`);
        }
    }

    // 7. Comparison engine
    const hasCompareFlag = cli.compareDir || cli.compareChart || cli.compareTrades || cli.compareSummary;

    if (hasCompareFlag) {
        // --compare-dir expands to individual file paths (conventional TV export names)
        const tvChartPath   = cli.compareChart   ?? (cli.compareDir ? path.join(cli.compareDir, "chart_data.csv") : undefined);
        const tvTradesPath  = cli.compareTrades  ?? (cli.compareDir ? path.join(cli.compareDir, "trades.csv")     : undefined);
        const tvSummaryPath = cli.compareSummary ?? (cli.compareDir ? path.join(cli.compareDir, "summary.json")   : undefined);

        // The report lands in --out-dir if set, otherwise the compare source directory
        const reportOutDir = cli.outDir ?? cli.outComparison ?? undefined;

        runComparison(
            {
                chartCsv:      tvChartPath   ? chartCsv    : undefined,
                tradesCsv:     tvTradesPath  ? tradesCsv   : undefined,
                summaryJson:   tvSummaryPath ? summaryJson : undefined,
                tvChartPath,
                tvTradesPath,
                tvSummaryPath,
            },
            {
                tolerance:    cli.tolerance,
                reportOutDir,
            }
        );
    }

    // 8. Console summary (always printed last)
    printConsoleSummary(ctx, bars.length, cli.scriptPath);
}

main().catch(err => {
    console.error(`\n${C.Red}Critical error:${C.Reset}`, err.stack ?? err.message);
    process.exit(1);
});
