/**
 * The CLI's performance summary and its data CSV.
 *
 * The summary used to subtract a hard-coded 100,000 from the final cash, so a
 * strategy on TradingView's default capital (1,000,000 at v5) reported +900%
 * for a run that made +0.43%, and every percentage was taken of that 100,000.
 * Its drawdown walked closed trades only. A time column in epoch numbers
 * crashed the run with `RangeError: Invalid time value` after "Done".
 *
 * The golden numbers are TradingView's own Strategy Tester report for the probe
 * script below on BINANCE:BTCUSDT 1h (see tests/common/max_drawdown_tv.test.ts):
 * net profit 6,408.37 (64.08%), gross profit 7,539.28, gross loss 1,130.91,
 * profit factor 6.667, 3 trades, 1 winner, max drawdown 624.49 (5.41%), on
 * initial capital 10,000. Per-trade "Profit %" is TradingView's trade return:
 * -14.02, 11.70, -6.99.
 */
import { describe, it, expect, vi, afterEach, beforeAll } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { main, parseCsv, parseCsvTime, CsvFormatError } from "../../../mock_run/v2/cli_main";
import { BTCUSDT_1H_DD_WINDOWS } from "../../common/fixtures/btcusdt_1h_dd_windows";

async function runCli(args: string[]) {
    const out: string[] = [];
    const err: string[] = [];
    const argv = process.argv;
    process.argv = ["node", "openpinescript", ...args];
    vi.spyOn(console, "log").mockImplementation((...a) => { out.push(a.join(" ")); });
    vi.spyOn(console, "warn").mockImplementation((...a) => { err.push(a.join(" ")); });
    vi.spyOn(console, "error").mockImplementation((...a) => { err.push(a.join(" ")); });
    vi.spyOn(process.stderr, "write").mockImplementation(((s: string) => { err.push(String(s)); return true; }) as never);
    vi.spyOn(process.stdout, "write").mockImplementation(((s: string) => { out.push(String(s)); return true; }) as never);
    const exit = vi.spyOn(process, "exit").mockImplementation(((code?: number) => { throw new Error(`exit:${code}`); }) as never);
    let code: number | null = 0;
    try { await main(); } catch (e: any) {
        const m = /^exit:(\d+)$/.exec(e.message);
        if (!m) throw e;
        code = Number(m[1]);
    } finally { process.argv = argv; exit.mockRestore(); vi.restoreAllMocks(); }
    // eslint-disable-next-line no-control-regex
    const plain = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, "");
    return { code, stdout: plain(out.join("\n")), stderr: plain(err.join("\n")) };
}

afterEach(() => vi.restoreAllMocks());

const PROBE = (capital: string) => `//@version=5
strategy("DD probe", overlay = true${capital})
if time == timestamp("UTC", 2026, 2, 4, 23, 0)
    strategy.entry("T1", strategy.long, qty = 0.05)
if time == timestamp("UTC", 2026, 2, 5, 23, 0)
    strategy.close("T1")
if time == timestamp("UTC", 2026, 8, 19, 10, 0)
    strategy.entry("T2", strategy.long, qty = 1)
if time == timestamp("UTC", 2026, 8, 20, 10, 0)
    strategy.close("T2")
if time == timestamp("UTC", 2026, 11, 12, 4, 0)
    strategy.entry("T3", strategy.long, qty = 0.12)
if time == timestamp("UTC", 2026, 11, 13, 4, 0)
    strategy.close("T3")
`;

let dir: string;
const file = (name: string, text: string) => {
    const p = path.join(dir, name);
    fs.writeFileSync(p, text);
    return p;
};
const csvWith = (time: (ms: number) => string, header = "time,open,high,low,close,volume") =>
    [header, ...BTCUSDT_1H_DD_WINDOWS.map(([t, o, h, l, c]) => `${time(t)},${o},${h},${l},${c},1`)].join("\n") + "\n";

beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "ops-cli-summary-"));
});

describe("summary.json against TradingView's report (initial_capital = 10000)", () => {
    const cases: Array<[string, (ms: number) => string]> = [
        ["ISO 8601", (ms) => new Date(ms).toISOString()],
        ["epoch milliseconds", (ms) => String(ms)],
        ["epoch seconds", (ms) => String(ms / 1000)],
        ["epoch microseconds", (ms) => String(ms * 1000)],
    ];
    for (const [label, fmt] of cases) {
        it(`time as ${label}`, async () => {
            const script = file("probe10k.pine", PROBE(", initial_capital = 10000"));
            const data = file(`data-${label.replace(/\W/g, "")}.csv`, csvWith(fmt));
            const out = path.join(dir, `out-${label.replace(/\W/g, "")}`);
            const r = await runCli([script, "--data", data, "--out-dir", out]);
            expect(r.code).toBe(0);
            const s = JSON.parse(fs.readFileSync(path.join(out, "summary.json"), "utf8"));
            expect(Object.keys(s).sort()).toEqual([
                "avg_loss", "avg_win", "gross_loss", "gross_profit", "initial_capital", "losing_trades",
                "max_drawdown", "max_drawdown_percent", "net_profit", "net_profit_percent", "profit_factor",
                "total_closed_trades", "win_rate", "winning_trades",
            ]);
            expect(s.avg_loss).toBeCloseTo(1130.91 / 2, 1);
            expect(s).toMatchObject({
                initial_capital: 10000,
                net_profit: 6408.37,
                net_profit_percent: 64.08,
                gross_profit: 7539.28,
                gross_loss: 1130.91,
                total_closed_trades: 3,
                winning_trades: 1,
                losing_trades: 2,
                win_rate: 33.33,
                avg_win: 7539.28,
                profit_factor: 6.667,
                max_drawdown: 624.49,
                max_drawdown_percent: 5.41,
            });
            const trades = fs.readFileSync(path.join(out, "trades.csv"), "utf8").trim().split("\n").slice(1);
            const exitPct = trades.filter((l) => l.includes(",Exit ")).map((l) => Number(l.split(",")[7]));
            expect(exitPct).toEqual([-14.02, 11.7, -6.99]);
            // Times survive as the instants they were, whatever the unit.
            const chart = fs.readFileSync(path.join(out, "chart.csv"), "utf8").split("\n");
            expect(chart[1].split(",")[0]).toBe("2026-02-04T23:00:00.000Z");
        });
    }

    it("prints the capital, net profit and drawdown on the terminal", async () => {
        const script = file("probe10k.pine", PROBE(", initial_capital = 10000"));
        const data = file("data-ms.csv", csvWith((ms) => String(ms)));
        const r = await runCli([script, "--data", data]);
        expect(r.code).toBe(0);
        expect(r.stderr).toContain("Initial Capital    $10000.00");
        expect(r.stderr).toContain("Net Profit         +$6408.37 (+64.08%)");
        expect(r.stderr).toContain("Max Drawdown       $624.49 (5.41%)");
        const json = JSON.parse(r.stdout);
        expect(json.performance.net_profit_percent).toBe(64.08);
        expect(json.performance.max_drawdown_percent).toBe(5.41);
    });
});

describe("avg_win and avg_loss count closed trades only", () => {
    // TradingView's "Avg losing trade" is the closed losing trades' loss over their count. The
    // report's gross loss also carries the open position's entry commission (session.ts
    // buildPerformance, openFee), which is in no closed trade. Expected values come from the
    // closed trades' own P&L in trades.csv.
    const script = (extra: string) => `//@version=5
strategy("fees", overlay = true, initial_capital = 10000,
     commission_type = strategy.commission.cash_per_order, commission_value = 25, pyramiding = 2)
${extra}
if bar_index == last_bar_index - 3
    strategy.entry("Open", strategy.long, qty = 0.01)
`;
    const closed = (out: string) => fs.readFileSync(path.join(out, "trades.csv"), "utf8").trim().split("\n").slice(1)
        .filter((l) => l.includes(",Exit ")).map((l) => Number(l.split(",")[6]));

    it("a position open at the end does not change avg_loss", async () => {
        const body = PROBE("").split("\n").slice(2).join("\n");
        const src = file("fees.pine", script(body));
        const data = file("data-fees.csv", csvWith((ms) => String(ms)));
        const out = path.join(dir, "out-fees");
        const r = await runCli([src, "--data", data, "--out-dir", out]);
        expect(r.code).toBe(0);
        const s = JSON.parse(fs.readFileSync(path.join(out, "summary.json"), "utf8"));
        const pnl = closed(out);
        const losses = pnl.filter((x) => x < 0), wins = pnl.filter((x) => x > 0);
        expect(losses.length).toBe(2);
        expect(s.losing_trades).toBe(2);
        expect(s.avg_loss).toBeCloseTo(-losses.reduce((a, b) => a + b, 0) / 2, 1);
        expect(s.avg_win).toBeCloseTo(wins.reduce((a, b) => a + b, 0) / wins.length, 1);
        // The open entry's 25 commission is in gross_loss and not in the closed trades.
        expect(s.gross_loss).toBeCloseTo(-losses.reduce((a, b) => a + b, 0) + 25, 1);
    });
});

describe("summary without initial_capital uses the version's default capital", () => {
    // TradingView backtests a v5 strategy with no initial_capital on 1,000,000
    // (runtime/v1/context.ts DEFAULT_INITIAL_CAPITAL). The trades take fixed
    // quantities, so the money figures are the report's; only the percentages
    // move: 6408.37 / 1e6 and, by TradingView's definition, the larger of
    // 541.04 / 1,000,000 (T1) and 624.49 / 1,007,026.48 (T3).
    it("percentages are of 1,000,000, not 100,000", async () => {
        const script = file("probe-default.pine", PROBE(""));
        const data = file("data-ms.csv", csvWith((ms) => String(ms)));
        const out = path.join(dir, "out-default");
        fs.mkdirSync(out, { recursive: true });
        const r2 = await runCli([script, "--data", data, "--out-summary", path.join(out, "s.json")]);
        expect(r2.code).toBe(0);
        const s = JSON.parse(fs.readFileSync(path.join(out, "s.json"), "utf8"));
        expect(s.initial_capital).toBe(1000000);
        expect(s.net_profit).toBe(6408.37);
        expect(s.net_profit_percent).toBe(0.64);
        expect(s.max_drawdown).toBe(624.49);
        expect(s.max_drawdown_percent).toBe(0.06);
        expect(r2.stderr).toContain("Net Profit         +$6408.37 (+0.64%)");
    });
});

describe("data CSV times", () => {
    it("reads each epoch unit by its size", () => {
        const ms = Date.UTC(2026, 1, 4, 23);
        expect(parseCsvTime(String(ms / 1000))).toBe(ms);
        expect(parseCsvTime(String(ms))).toBe(ms);
        expect(parseCsvTime(String(ms * 1000))).toBe(ms);
        expect(parseCsvTime(String(ms * 1_000_000))).toBe(ms);
        expect(parseCsvTime("2026-02-04T23:00:00Z")).toBe(ms);
        expect(parseCsvTime("2026-02-04")).toBe(Date.UTC(2026, 1, 4));
        // No zone: UTC, whatever the machine's zone is.
        expect(parseCsvTime("2026-02-04 23:00")).toBe(ms);
        expect(parseCsvTime("2026-02-04T23:00:00")).toBe(ms);
        expect(parseCsvTime("2026-02-04 23:00:00.000")).toBe(ms);
        expect(parseCsvTime("2026-02-05T00:00:00+01:00")).toBe(ms);
        expect(parseCsvTime('"1770246000"')).toBe(ms);
        expect(parseCsvTime("yesterday")).toBeNaN();
    });

    it("reads a compact YYYYMMDD date as that day, not as epoch seconds in 1970", () => {
        expect(parseCsvTime("20240301")).toBe(Date.UTC(2024, 2, 1));
        expect(parseCsvTime('"19991231"')).toBe(Date.UTC(1999, 11, 31));
        expect(parseCsvTime("20240229")).toBe(Date.UTC(2024, 1, 29));
        // No such day: unreadable, so parseCsv reports the line.
        expect(parseCsvTime("20241340")).toBeNaN();
        expect(parseCsvTime("20230229")).toBeNaN();
        expect(() => parseCsv("time,open,high,low,close,volume\n20230229,1,2,0.5,1.5,10\n"))
            .toThrow('line 2: cannot read the time "20230229"');
        // Outside the date range an integer is still an epoch.
        expect(parseCsvTime("18991231")).toBe(18991231 * 1000);
        expect(parseCsvTime("1709251200")).toBe(Date.UTC(2024, 2, 1));
    });

    it("still drops a header it does not recognise (its close is not a number)", () => {
        const bars = parseCsv("Date,Open,High,Low,Close,Volume\n2024-03-01,1,2,0.5,1.5,10\n");
        expect(bars).toEqual([{ time: Date.UTC(2024, 2, 1), open: 1, high: 2, low: 0.5, close: 1.5, volume: 10 }]);
    });

    it("throws a CsvFormatError naming the line and the value", () => {
        expect(() => parseCsv("time,open,high,low,close,volume\n2024-03-01,1,2,0.5,1.5,10\nnot-a-date,1,2,0.5,1.5,10\n"))
            .toThrow(CsvFormatError);
        expect(() => parseCsv("time,open,high,low,close,volume\nnot-a-date,1,2,0.5,1.5,10\n"))
            .toThrow('line 2: cannot read the time "not-a-date"');
    });

    it("an unreadable time exits 1 with that message and no stack trace", async () => {
        const script = file("probe10k.pine", PROBE(", initial_capital = 10000"));
        const data = file("bad.csv", "time,open,high,low,close,volume\n2024-03-01,1,2,0.5,1.5,10\n03/02/2024 garbage,1,2,0.5,1.5,10\n");
        const r = await runCli([script, "--data", data]);
        expect(r.code).toBe(1);
        expect(r.stderr).toContain('line 3: cannot read the time "03/02/2024 garbage"');
        expect(r.stderr).not.toContain("RangeError");
        expect(r.stderr).not.toContain("Done");
    });
});
