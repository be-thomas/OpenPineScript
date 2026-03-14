/**
 * utils/v2/comparison_engine.ts
 *
 * Decoupled comparison engine for validating opsv2 output against
 * TradingView reference exports. Handles chart data, trade logs,
 * and performance summary files.
 *
 * Entry point: runComparison()
 */

import * as fs from "node:fs";
import * as path from "node:path";

// ---------------------------------------------------------------------------
// Public Types
// ---------------------------------------------------------------------------

export type CompareStatus = "pass" | "fail" | "skip";
export type OverallStatus = "pass" | "fail" | "partial" | "skip";

export interface ChartMismatch {
    time: string;
    column: string;
    opsv2_value: number;
    tv_value: number;
    deviation: number;
}

export interface ChartCompareResult {
    status: CompareStatus;
    rows_compared: number;
    mismatched_rows: number;
    /** Per-column maximum absolute deviation observed. */
    max_deviation: Record<string, number>;
    /** Full mismatch list (populated only when status is "fail"). */
    mismatches: ChartMismatch[];
}

export interface TradeDiscrepancy {
    trade_id: number;
    issue:
        | "entry_price_mismatch"
        | "exit_price_mismatch"
        | "profit_mismatch"
        | "timestamp_mismatch"
        | "missing_in_opsv2"
        | "extra_in_opsv2";
    tv_price?: number;
    opsv2_price?: number;
    tv_value?: number;
    opsv2_value?: number;
    detail?: string;
}

export interface TradesCompareResult {
    status: CompareStatus;
    total_tv_trades: number;
    total_opsv2_trades: number;
    discrepancies: TradeDiscrepancy[];
}

export interface SummaryFieldMismatch {
    field: string;
    tv_value: number;
    opsv2_value: number;
    deviation: number;
}

export interface SummaryCompareResult {
    status: CompareStatus;
    net_profit_delta_percent: number | null;
    mismatches: SummaryFieldMismatch[];
}

export interface ComparisonReport {
    overall_match: OverallStatus;
    tolerance_used: number;
    timestamp: string;
    chart_data: ChartCompareResult | null;
    trades: TradesCompareResult | null;
    summary: SummaryCompareResult | null;
}

export interface CompareInputs {
    /** opsv2-generated chart CSV content (string, not a file path). */
    chartCsv?: string;
    /** opsv2-generated trades CSV content (string, not a file path). */
    tradesCsv?: string;
    /** opsv2-generated summary object (already parsed). */
    summaryJson?: Record<string, number | null>;
    /** Path to TradingView's chart/indicator CSV. */
    tvChartPath?: string;
    /** Path to TradingView's trade log CSV. */
    tvTradesPath?: string;
    /** Path to TradingView's summary JSON or key-value CSV. */
    tvSummaryPath?: string;
}

export interface CompareOptions {
    tolerance: number;
    /** If set, comparison_report.json is written here. */
    reportOutDir?: string;
}

// ---------------------------------------------------------------------------
// Internal: CSV Parsing Utilities
// ---------------------------------------------------------------------------

interface ParsedCsv {
    headers: string[];
    /** Each row: header → raw string value. */
    rows: Record<string, string>[];
}

function parseCsv(content: string): ParsedCsv {
    const lines = content.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };

    const headers = splitCsvRow(lines[0]);
    const rows = lines.slice(1).map(line => {
        const values = splitCsvRow(line);
        const row: Record<string, string> = {};
        headers.forEach((h, i) => {
            row[h] = (values[i] ?? "").trim();
        });
        return row;
    });

    return { headers, rows };
}

/** Splits a CSV row, respecting double-quoted fields. */
function splitCsvRow(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            inQuotes = !inQuotes;
        } else if (ch === "," && !inQuotes) {
            result.push(current.trim());
            current = "";
        } else {
            current += ch;
        }
    }
    result.push(current.trim());
    return result;
}

// ---------------------------------------------------------------------------
// Internal: Time Normalization
// ---------------------------------------------------------------------------

/**
 * Converts any common timestamp representation to milliseconds since epoch.
 *
 * Handles:
 *  - ISO 8601 strings ("2024-03-01T00:00:00Z")
 *  - Unix seconds (10-digit number or string like "1709251200")
 *  - Unix milliseconds (13-digit number or string like "1709251200000")
 *  - Bare date strings ("2024-03-01")
 */
function normalizeTimestamp(raw: string | number): number {
    if (typeof raw === "number") {
        return raw < 1e12 ? raw * 1000 : raw;
    }

    const str = raw.trim();

    // Pure integer string → unix timestamp
    if (/^\d+$/.test(str)) {
        const n = parseInt(str, 10);
        return n < 1e12 ? n * 1000 : n;
    }

    // ISO / date string → parse directly
    const ms = Date.parse(str);
    if (!isNaN(ms)) return ms;

    throw new Error(`Cannot parse timestamp: "${str}"`);
}

/** Returns a UTC ISO string representation for display (date portion only). */
function tsToDisplay(ms: number): string {
    return new Date(ms).toISOString();
}

// ---------------------------------------------------------------------------
// Internal: Column Matching
// ---------------------------------------------------------------------------

/**
 * Matches opsv2 indicator columns to TradingView indicator columns.
 * Strategy:
 *   1. Exact name match
 *   2. Case-insensitive match
 *   3. If exactly one unmatched column remains on each side, pair by position.
 *
 * Returns an array of [opsv2ColName, tvColName] pairs.
 */
function matchColumns(
    opsv2Cols: string[],
    tvCols: string[]
): Array<[string, string]> {
    const pairs: Array<[string, string]> = [];
    const usedTv = new Set<string>();
    const unmatchedOpsv2: string[] = [];

    // Pass 1: exact
    for (const oc of opsv2Cols) {
        const exact = tvCols.find(tc => tc === oc && !usedTv.has(tc));
        if (exact) {
            pairs.push([oc, exact]);
            usedTv.add(exact);
        } else {
            unmatchedOpsv2.push(oc);
        }
    }

    // Pass 2: case-insensitive
    const stillUnmatched: string[] = [];
    for (const oc of unmatchedOpsv2) {
        const ci = tvCols.find(
            tc => tc.toLowerCase() === oc.toLowerCase() && !usedTv.has(tc)
        );
        if (ci) {
            pairs.push([oc, ci]);
            usedTv.add(ci);
        } else {
            stillUnmatched.push(oc);
        }
    }

    // Pass 3: positional fallback when both sides have exactly one leftover
    const unmatchedTv = tvCols.filter(tc => !usedTv.has(tc));
    if (stillUnmatched.length === 1 && unmatchedTv.length === 1) {
        pairs.push([stillUnmatched[0], unmatchedTv[0]]);
    }

    return pairs;
}

// ---------------------------------------------------------------------------
// Chart Comparison
// ---------------------------------------------------------------------------

function compareChart(
    opsv2Csv: string,
    tvCsv: string,
    tolerance: number
): ChartCompareResult {
    const opsv2 = parseCsv(opsv2Csv);
    const tv = parseCsv(tvCsv);

    // Identify indicator columns (everything after the 6 OHLCV columns)
    const OHLCV = new Set(["time", "open", "high", "low", "close", "volume"]);
    const opsv2IndicatorCols = opsv2.headers.filter(h => !OHLCV.has(h.toLowerCase()));
    const tvIndicatorCols    = tv.headers.filter(h => !OHLCV.has(h.toLowerCase()));

    // Build time-keyed lookup maps
    const tvTimeKey = tv.headers.find(h => h.toLowerCase() === "time") ?? "time";
    const opsv2TimeKey = opsv2.headers.find(h => h.toLowerCase() === "time") ?? "time";

    const tvMap = new Map<number, Record<string, string>>();
    for (const row of tv.rows) {
        try {
            const ms = normalizeTimestamp(row[tvTimeKey]);
            tvMap.set(ms, row);
        } catch { /* skip unparseable rows */ }
    }

    const opsv2Map = new Map<number, Record<string, string>>();
    for (const row of opsv2.rows) {
        try {
            const ms = normalizeTimestamp(row[opsv2TimeKey]);
            opsv2Map.set(ms, row);
        } catch { /* skip */ }
    }

    // Find common timestamps
    const commonTs = [...opsv2Map.keys()].filter(ms => tvMap.has(ms));

    if (commonTs.length === 0) {
        return {
            status: "fail",
            rows_compared: 0,
            mismatched_rows: 0,
            max_deviation: {},
            mismatches: [],
        };
    }

    // Match indicator columns
    const colPairs = matchColumns(opsv2IndicatorCols, tvIndicatorCols);

    if (colPairs.length === 0) {
        // No indicator columns to compare — just verify OHLCV alignment
        return {
            status: "pass",
            rows_compared: commonTs.length,
            mismatched_rows: 0,
            max_deviation: {},
            mismatches: [],
        };
    }

    const maxDev: Record<string, number> = {};
    const mismatches: ChartMismatch[] = [];
    const mismatchedTimes = new Set<number>();

    for (const ts of commonTs) {
        const opsv2Row = opsv2Map.get(ts)!;
        const tvRow    = tvMap.get(ts)!;

        for (const [opsv2Col, tvCol] of colPairs) {
            const opsv2Raw = opsv2Row[opsv2Col];
            const tvRaw    = tvRow[tvCol];

            // Skip empty/NaN cells (warming-up bars)
            if (!opsv2Raw && !tvRaw) continue;
            if (!opsv2Raw || !tvRaw)  continue;

            const opsv2Val = parseFloat(opsv2Raw);
            const tvVal    = parseFloat(tvRaw);

            if (isNaN(opsv2Val) || isNaN(tvVal)) continue;

            const dev = Math.abs(opsv2Val - tvVal);
            const label = `${opsv2Col}↔${tvCol}`;
            maxDev[label] = Math.max(maxDev[label] ?? 0, dev);

            if (dev > tolerance) {
                mismatchedTimes.add(ts);
                mismatches.push({
                    time:       tsToDisplay(ts),
                    column:     label,
                    opsv2_value: opsv2Val,
                    tv_value:   tvVal,
                    deviation:  dev,
                });
            }
        }
    }

    return {
        status:         mismatches.length === 0 ? "pass" : "fail",
        rows_compared:  commonTs.length,
        mismatched_rows: mismatchedTimes.size,
        max_deviation:  maxDev,
        mismatches,
    };
}

// ---------------------------------------------------------------------------
// Trades Comparison
// ---------------------------------------------------------------------------

interface ParsedTrade {
    id: number;
    entryType: string;
    entrySignal: string;
    entryTime: number | null;
    entryPrice: number;
    exitType: string;
    exitSignal: string;
    exitTime: number | null;
    exitPrice: number;
    contracts: number;
    profit: number;
    profitPct: number;
    cumProfit: number;
}

/**
 * Groups trade log rows into paired entry+exit records, keyed by trade number.
 */
function parseTradeLog(csv: string): Map<number, ParsedTrade> {
    const { rows } = parseCsv(csv);
    const map = new Map<number, ParsedTrade>();

    for (const row of rows) {
        // Locate "Trade #" column regardless of exact header casing/spacing
        const idKey  = Object.keys(row).find(k => k.replace(/\s/g, "").toLowerCase() === "trade#");
        const typeKey = Object.keys(row).find(k => k.toLowerCase() === "type");
        const sigKey  = Object.keys(row).find(k => k.toLowerCase() === "signal");
        const dtKey   = Object.keys(row).find(k =>
            k.toLowerCase().includes("date") || k.toLowerCase().includes("time")
        );
        const priceKey   = Object.keys(row).find(k => k.toLowerCase() === "price");
        const contrKey   = Object.keys(row).find(k => k.toLowerCase().startsWith("contract"));
        const profitKey  = Object.keys(row).find(k => k.toLowerCase() === "profit" && !k.toLowerCase().includes("%"));
        const profitPKey = Object.keys(row).find(k => k.toLowerCase().includes("profit") && k.includes("%"));
        const cumKey     = Object.keys(row).find(k => k.toLowerCase().includes("cum"));

        if (!idKey || !typeKey) continue;

        const id    = parseInt(row[idKey], 10);
        const type  = (row[typeKey] ?? "").toLowerCase();
        const price = parseFloat(row[priceKey ?? ""] ?? "0");
        const dt    = dtKey ? row[dtKey] : null;

        let ts: number | null = null;
        if (dt && dt !== "N/A" && dt.trim() !== "") {
            try { ts = normalizeTimestamp(dt); } catch { /* ignore */ }
        }

        const profit    = parseFloat(row[profitKey ?? ""]  ?? "0");
        const profitPct = parseFloat(row[profitPKey ?? ""] ?? "0");
        const cumProfit = parseFloat(row[cumKey ?? ""]     ?? "0");
        const contracts = parseFloat(row[contrKey ?? ""]   ?? "0");

        let trade = map.get(id);
        if (!trade) {
            trade = {
                id,
                entryType: "", entrySignal: "", entryTime: null, entryPrice: 0,
                exitType:  "", exitSignal:  "", exitTime:  null, exitPrice:  0,
                contracts, profit: 0, profitPct: 0, cumProfit: 0,
            };
            map.set(id, trade);
        }

        if (type.includes("entry")) {
            trade.entryType   = row[typeKey] ?? "";
            trade.entrySignal = row[sigKey ?? ""] ?? "";
            trade.entryTime   = ts;
            trade.entryPrice  = price;
        } else {
            trade.exitType    = row[typeKey] ?? "";
            trade.exitSignal  = row[sigKey ?? ""] ?? "";
            trade.exitTime    = ts;
            trade.exitPrice   = price;
            trade.profit      = profit;
            trade.profitPct   = profitPct;
            trade.cumProfit   = cumProfit;
        }
    }

    return map;
}

function compareTrades(
    opsv2Csv: string,
    tvCsv: string,
    tolerance: number
): TradesCompareResult {
    const opsv2Trades = parseTradeLog(opsv2Csv);
    const tvTrades    = parseTradeLog(tvCsv);

    const discrepancies: TradeDiscrepancy[] = [];

    const tvIds    = new Set(tvTrades.keys());
    const opsv2Ids = new Set(opsv2Trades.keys());

    // Trades present in TV but missing from opsv2
    for (const id of tvIds) {
        if (!opsv2Ids.has(id)) {
            discrepancies.push({ trade_id: id, issue: "missing_in_opsv2" });
        }
    }

    // Extra trades in opsv2 that TV doesn't have
    for (const id of opsv2Ids) {
        if (!tvIds.has(id)) {
            discrepancies.push({ trade_id: id, issue: "extra_in_opsv2" });
        }
    }

    // Compare matched trades
    for (const id of tvIds) {
        if (!opsv2Ids.has(id)) continue;
        const tv    = tvTrades.get(id)!;
        const opsv2 = opsv2Trades.get(id)!;

        const entryDev = Math.abs(opsv2.entryPrice - tv.entryPrice);
        if (entryDev > tolerance) {
            discrepancies.push({
                trade_id:   id,
                issue:      "entry_price_mismatch",
                tv_price:   tv.entryPrice,
                opsv2_price: opsv2.entryPrice,
                detail:     `deviation: ${entryDev.toFixed(6)}`,
            });
        }

        const exitDev = Math.abs(opsv2.exitPrice - tv.exitPrice);
        if (exitDev > tolerance) {
            discrepancies.push({
                trade_id:   id,
                issue:      "exit_price_mismatch",
                tv_price:   tv.exitPrice,
                opsv2_price: opsv2.exitPrice,
                detail:     `deviation: ${exitDev.toFixed(6)}`,
            });
        }

        const profitDev = Math.abs(opsv2.profit - tv.profit);
        if (profitDev > tolerance) {
            discrepancies.push({
                trade_id:   id,
                issue:      "profit_mismatch",
                tv_value:   tv.profit,
                opsv2_value: opsv2.profit,
                detail:     `deviation: ${profitDev.toFixed(6)}`,
            });
        }

        // Timestamp check: only flag if both sides have a timestamp and they differ by > 60s
        if (
            tv.exitTime    !== null &&
            opsv2.exitTime !== null &&
            Math.abs(opsv2.exitTime - tv.exitTime) > 60_000
        ) {
            discrepancies.push({
                trade_id: id,
                issue:    "timestamp_mismatch",
                detail:   `tv=${tsToDisplay(tv.exitTime)} opsv2=${tsToDisplay(opsv2.exitTime)}`,
            });
        }
    }

    return {
        status:               discrepancies.length === 0 ? "pass" : "fail",
        total_tv_trades:      tvTrades.size,
        total_opsv2_trades:   opsv2Trades.size,
        discrepancies,
    };
}

// ---------------------------------------------------------------------------
// Summary Comparison
// ---------------------------------------------------------------------------

/** Fields to compare, in priority order. */
const SUMMARY_FIELDS: Array<{ opsv2Key: string; tvKey: string; label: string }> = [
    { opsv2Key: "net_profit",           tvKey: "net_profit",           label: "net_profit" },
    { opsv2Key: "net_profit_percent",   tvKey: "net_profit_percent",   label: "net_profit_percent" },
    { opsv2Key: "gross_profit",         tvKey: "gross_profit",         label: "gross_profit" },
    { opsv2Key: "gross_loss",           tvKey: "gross_loss",           label: "gross_loss" },
    { opsv2Key: "total_closed_trades",  tvKey: "total_closed_trades",  label: "total_closed_trades" },
    { opsv2Key: "win_rate",             tvKey: "win_rate",             label: "win_rate" },
    { opsv2Key: "profit_factor",        tvKey: "profit_factor",        label: "profit_factor" },
    { opsv2Key: "max_drawdown_percent", tvKey: "max_drawdown_percent", label: "max_drawdown_percent" },
];

function loadSummaryFile(filePath: string): Record<string, number | null> {
    const raw = fs.readFileSync(path.resolve(filePath), "utf8").trim();

    // JSON
    if (raw.startsWith("{")) {
        return JSON.parse(raw);
    }

    // Key-value CSV fallback ("Metric,Value\nNet Profit,1000\n...")
    const { rows } = parseCsv(raw);
    const result: Record<string, number | null> = {};
    for (const row of rows) {
        const keys  = Object.keys(row);
        if (keys.length < 2) continue;
        const key = row[keys[0]]
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_|_$/g, "");
        const val = parseFloat(row[keys[1]]);
        result[key] = isNaN(val) ? null : val;
    }
    return result;
}

function compareSummary(
    opsv2Json: Record<string, number | null>,
    tvSummaryPath: string,
    tolerance: number
): SummaryCompareResult {
    let tvJson: Record<string, number | null>;
    try {
        tvJson = loadSummaryFile(tvSummaryPath);
    } catch (e: any) {
        return {
            status: "fail",
            net_profit_delta_percent: null,
            mismatches: [{ field: "_load_error", tv_value: 0, opsv2_value: 0, deviation: 0 }],
        };
    }

    const mismatches: SummaryFieldMismatch[] = [];

    for (const { opsv2Key, tvKey, label } of SUMMARY_FIELDS) {
        const opsv2Val = opsv2Json[opsv2Key];
        const tvVal    = tvJson[tvKey];

        if (opsv2Val === null || opsv2Val === undefined) continue;
        if (tvVal    === null || tvVal    === undefined) continue;

        const dev = Math.abs(opsv2Val - tvVal);
        if (dev > tolerance) {
            mismatches.push({
                field:      label,
                tv_value:   tvVal,
                opsv2_value: opsv2Val,
                deviation:  dev,
            });
        }
    }

    const opsv2NP = opsv2Json["net_profit_percent"];
    const tvNP    = tvJson["net_profit_percent"];
    const netProfitDelta =
        opsv2NP !== null && opsv2NP !== undefined &&
        tvNP    !== null && tvNP    !== undefined
            ? parseFloat(Math.abs(opsv2NP - tvNP).toFixed(4))
            : null;

    return {
        status:                   mismatches.length === 0 ? "pass" : "fail",
        net_profit_delta_percent: netProfitDelta,
        mismatches,
    };
}

// ---------------------------------------------------------------------------
// Overall Status Rollup
// ---------------------------------------------------------------------------

function rollupStatus(
    results: Array<CompareStatus | undefined>
): OverallStatus {
    const active = results.filter((r): r is CompareStatus => r !== undefined);
    if (active.length === 0)       return "skip";
    if (active.every(r => r === "pass")) return "pass";
    if (active.every(r => r === "fail")) return "fail";
    if (active.every(r => r === "skip")) return "skip";
    return "partial";
}

// ---------------------------------------------------------------------------
// Console Printer
// ---------------------------------------------------------------------------

const C = {
    Bold:   "\x1b[1m",
    Green:  "\x1b[32m",
    Red:    "\x1b[31m",
    Yellow: "\x1b[33m",
    Cyan:   "\x1b[36m",
    Gray:   "\x1b[90m",
    Reset:  "\x1b[0m",
} as const;

function statusBadge(s: CompareStatus | OverallStatus): string {
    switch (s) {
        case "pass":    return `${C.Green}PASS${C.Reset}`;
        case "fail":    return `${C.Red}FAIL${C.Reset}`;
        case "partial": return `${C.Yellow}PARTIAL${C.Reset}`;
        case "skip":    return `${C.Gray}SKIP${C.Reset}`;
    }
}

export function printComparisonReport(report: ComparisonReport): void {
    const tol = report.tolerance_used;

    console.log(`\n${C.Bold}${C.Cyan}=== Comparison Report ===${C.Reset}`);
    console.log(`  Overall:   ${statusBadge(report.overall_match)}`);
    console.log(`  Tolerance: ${tol}`);

    // --- Chart ---
    if (report.chart_data) {
        const cd = report.chart_data;
        console.log(`\n${C.Bold}Chart Data:${C.Reset} ${statusBadge(cd.status)}`);
        console.log(`  Rows compared : ${cd.rows_compared}`);
        console.log(`  Mismatched    : ${cd.mismatched_rows}`);

        const devEntries = Object.entries(cd.max_deviation);
        if (devEntries.length > 0) {
            console.log(`  Max deviation :`);
            for (const [col, dev] of devEntries) {
                const devStr = dev.toExponential(3);
                const marker = dev > tol ? C.Red : C.Green;
                console.log(`    ${marker}${col}${C.Reset}: ${devStr}`);
            }
        }

        if (cd.status === "fail" && cd.mismatches.length > 0) {
            const preview = cd.mismatches.slice(0, 5);
            console.log(`  ${C.Red}First ${preview.length} mismatch(es):${C.Reset}`);
            for (const m of preview) {
                console.log(
                    `    ${C.Gray}[${m.time}]${C.Reset} ${m.column}` +
                    ` opsv2=${m.opsv2_value} tv=${m.tv_value}` +
                    ` Δ=${m.deviation.toExponential(3)}`
                );
            }
            if (cd.mismatches.length > 5) {
                console.log(`    ${C.Gray}...and ${cd.mismatches.length - 5} more (see report JSON)${C.Reset}`);
            }
        }
    }

    // --- Trades ---
    if (report.trades) {
        const tr = report.trades;
        console.log(`\n${C.Bold}Trades:${C.Reset} ${statusBadge(tr.status)}`);
        console.log(`  TV trades    : ${tr.total_tv_trades}`);
        console.log(`  opsv2 trades : ${tr.total_opsv2_trades}`);

        if (tr.total_tv_trades !== tr.total_opsv2_trades) {
            const diff = tr.total_opsv2_trades - tr.total_tv_trades;
            const sign = diff > 0 ? "+" : "";
            console.log(`  ${C.Yellow}Count delta: ${sign}${diff}${C.Reset}`);
        }

        if (tr.discrepancies.length > 0) {
            const preview = tr.discrepancies.slice(0, 5);
            console.log(`  ${C.Red}Discrepancies (first ${preview.length}):${C.Reset}`);
            for (const d of preview) {
                const detail = d.detail ? ` — ${d.detail}` : "";
                console.log(`    Trade #${d.trade_id}: ${d.issue}${detail}`);
            }
            if (tr.discrepancies.length > 5) {
                console.log(`    ${C.Gray}...and ${tr.discrepancies.length - 5} more (see report JSON)${C.Reset}`);
            }
        }
    }

    // --- Summary ---
    if (report.summary) {
        const su = report.summary;
        console.log(`\n${C.Bold}Summary:${C.Reset} ${statusBadge(su.status)}`);

        if (su.net_profit_delta_percent !== null) {
            const dStr = su.net_profit_delta_percent.toFixed(4);
            const col  = su.net_profit_delta_percent > tol ? C.Red : C.Green;
            console.log(`  Net profit Δ% : ${col}${dStr}${C.Reset}`);
        }

        if (su.mismatches.length > 0) {
            console.log(`  Field mismatches:`);
            for (const m of su.mismatches) {
                console.log(
                    `    ${C.Red}${m.field}${C.Reset}` +
                    ` opsv2=${m.opsv2_value} tv=${m.tv_value}` +
                    ` Δ=${m.deviation.toExponential(3)}`
                );
            }
        }
    }

    console.log();
}

// ---------------------------------------------------------------------------
// Report Writer
// ---------------------------------------------------------------------------

function writeReport(report: ComparisonReport, outDir: string): void {
    fs.mkdirSync(path.resolve(outDir), { recursive: true });
    const reportPath = path.join(path.resolve(outDir), "comparison_report.json");
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
    console.log(`${C.Cyan}Report written:${C.Reset} ${reportPath}`);
}

// ---------------------------------------------------------------------------
// Public Entry Point
// ---------------------------------------------------------------------------

export function runComparison(
    inputs: CompareInputs,
    options: CompareOptions
): ComparisonReport {
    const { tolerance, reportOutDir } = options;

    let chartResult:   ChartCompareResult   | null = null;
    let tradesResult:  TradesCompareResult  | null = null;
    let summaryResult: SummaryCompareResult | null = null;

    // Chart comparison
    if (inputs.chartCsv && inputs.tvChartPath) {
        try {
            const tvCsv = fs.readFileSync(path.resolve(inputs.tvChartPath), "utf8");
            chartResult = compareChart(inputs.chartCsv, tvCsv, tolerance);
        } catch (e: any) {
            console.error(`${C.Red}[compare] Chart load error:${C.Reset} ${e.message}`);
            chartResult = {
                status: "fail", rows_compared: 0, mismatched_rows: 0,
                max_deviation: {}, mismatches: [],
            };
        }
    }

    // Trades comparison
    if (inputs.tradesCsv && inputs.tvTradesPath) {
        try {
            const tvCsv = fs.readFileSync(path.resolve(inputs.tvTradesPath), "utf8");
            tradesResult = compareTrades(inputs.tradesCsv, tvCsv, tolerance);
        } catch (e: any) {
            console.error(`${C.Red}[compare] Trades load error:${C.Reset} ${e.message}`);
            tradesResult = {
                status: "fail", total_tv_trades: 0,
                total_opsv2_trades: 0, discrepancies: [],
            };
        }
    }

    // Summary comparison
    if (inputs.summaryJson && inputs.tvSummaryPath) {
        summaryResult = compareSummary(inputs.summaryJson, inputs.tvSummaryPath, tolerance);
    }

    const report: ComparisonReport = {
        overall_match: rollupStatus([
            chartResult?.status,
            tradesResult?.status,
            summaryResult?.status,
        ]),
        tolerance_used: tolerance,
        timestamp:      new Date().toISOString(),
        chart_data:     chartResult,
        trades:         tradesResult,
        summary:        summaryResult,
    };

    printComparisonReport(report);

    if (reportOutDir) {
        writeReport(report, reportOutDir);
    }

    return report;
}
