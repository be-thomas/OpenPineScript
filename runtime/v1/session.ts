/**
 * runtime/v1/session.ts
 *
 * Embeddable engine API (B1 + B3 + B4 + B5) — the host-agnostic core a Web Worker
 * or backend wraps to drive the engine per ui-engine-control-protocol.md.
 *
 *   compile(source)                      → Compiled  { meta, inputs, errors }
 *   setInputs(values)
 *   provideData(symbol, resolution, …)   ← fulfils a security() data-request
 *   runHistory(candles)                  → SimResult { series, fills, trades, … }
 *   tick(candle) / commit()              → RenderDelta (live edge, P3)
 *
 * The render model is derived from `ctx` (plots/fills/scriptMeta/trades), so the
 * typed PlotData union maps straight onto chart structures.
 */
import { compileScript } from "../../transpiler/common";
import type { PineVersion } from "../../transpiler/common/version";
import { LanguageProfile, DEFAULT_PROFILE } from "../../transpiler/common/profiles";
import { compile, Context } from "./index";
import type { Context as Ctx, PlotData, ScriptMeta, SecurityCandle, Drawing, LogEntry, Position, InputDef, Trade, EquityPoint } from "./context";

// ─── Wire contract (mirrors ui-engine-control-protocol §5) ─────────────────────

export const PROTOCOL_VERSION = 1;
export const ENGINE_VERSION = "v2" as const;

export interface EngineError {
    phase: "parse" | "transpile" | "runtime";
    line?: number;
    col?: number;
    message: string;
    severity: "error" | "warning";
}

export interface InputView {
    id: string; title: string; type: string;
    default: any; current: any; overridden: boolean;
    /**
     * The rest of what `input()` was told, so a host can build the control the
     * script asked for rather than guessing one from the type.
     *
     * `input.int(14, "Length", minval = 2, maxval = 50)` is a bounded spinner;
     * `input.string(s, options = [...])` is a dropdown and nothing else will
     * do. The engine has always recorded these — it clamps `minval` and falls
     * back outside `options` — and simply did not pass them on, so every host
     * rendered a bare text box and learnt the bounds by having its value
     * silently changed underneath it.
     */
    minval?: number; maxval?: number; step?: number;
    options?: any[];
    tooltip?: string;
    /** `group` and `inline` lay the dialog out; they carry no value. */
    group?: string; inline?: string;
    confirm?: boolean;
}

/** A `strategy()` / `indicator()` argument a host may override. */
export interface PropertyView {
    key: string;
    title: string;
    type: "float" | "integer" | "string";
    current: number | string;
    declared: number | string;
    /** The only values a string property accepts, for a dropdown. */
    options?: string[];
    /** A unit to show beside the control — "%", "ticks", "contracts". */
    unit?: string;
    minval?: number;
    /** Which block of TradingView's properties tab the row belongs to. */
    group?: string;
}

export interface Compiled {
    protocolVersion: number;
    engineVersion: typeof ENGINE_VERSION;
    meta: ScriptMeta | null;
    inputs: InputView[];
    /** Declaration arguments a host may override; empty for a study. */
    properties: PropertyView[];
    errors: EngineError[];
}

type SeriesType = "line" | "candle" | "marker" | "arrow" | "bgcolor" | "barcolor";

/**
 * One drawable point. `color` is present only where the script set a DIFFERENT
 * colour on that bar than the series default — `plot(close, color = close >
 * open ? green : red)` is ordinary Pine, and a per-series colour cannot express
 * it. A host that ignores the field still draws the right shape in the series
 * colour; one that reads it draws what TradingView draws.
 */
export type RenderPoint =
    | { value: number; color?: string }
    | { open: number; high: number; low: number; close: number; color?: string }
    | { color: string }
    | null;

export interface RenderSeries {
    id: string; title: string;
    type: SeriesType;
    pane: "main" | "sub";
    timeframe?: string;
    color?: string; style?: string | number; linewidth?: number;
    /**
     * Where a marker sits: `abovebar`, `belowbar`, `top`, `bottom` or
     * `absolute` — `plotshape`'s own `location` argument. Absent for every
     * other series type. Without it a host cannot place a shape, because the
     * `value` of `plotshape(close > open)` is 1, not a price.
     */
    location?: string;
    /** `plotshape`/`plotchar` text, and its size, when the script set them. */
    text?: string; size?: string;
    data: RenderPoint[];
}

export interface SimResult {
    protocolVersion: number;
    engineVersion: typeof ENGINE_VERSION;
    meta: ScriptMeta | null;
    barsProcessed: number;
    series: RenderSeries[];
    fills: Array<{
        plotId1: string; plotId2: string; color: string; title: string;
        /**
         * The fill's colour BAR BY BAR, present only when the script gave it
         * more than one.
         *
         * `fill(a, b, color = spanA > spanB ? green : red)` is how every
         * Ichimoku cloud is written, and a fill carrying one colour cannot
         * express it — the model reported whichever colour happened to come
         * first and the cloud drew in that one colour for the whole chart.
         * `null` at a bar means the fill is not drawn there.
         */
        colors?: Array<string | null>;
    }>;
    trades: any[];
    /**
     * The position still OPEN at the last bar, which `trades` by definition
     * does not contain — it holds closed trades only. A strategy that is in
     * the market when the data ends has an entry a host should still draw.
     * `size` is 0 while flat.
     */
    position: Position;
    summary: { netProfit: number; closedTrades: number; winRate: number } | null;
    /**
     * The full performance report, split all / long / short — the rows of
     * TradingView's performance summary tab. Null for a study.
     */
    performance: Performance | null;
    /**
     * Account value at every bar's close, which is what the overview tab
     * plots. Empty for a study.
     */
    equity: EquityPoint[];
    /**
     * Every `line`, `box`, `label`, `table`, `polyline` and `linefill` the
     * script created, in creation order, with the bar each was created on.
     *
     * A host draws these itself — they are objects with coordinates, not a
     * series with one value per bar, so they cannot be expressed as a
     * `RenderSeries`. `props` carries the drawing's own fields verbatim
     * (`x1`/`y1`/`x2`/`y2` for a line, `text`/`style`/`color` for a label).
     */
    drawings: Drawing[];
    /**
     * Everything the script wrote with `log.info` / `log.warning` /
     * `log.error`, each tagged with the bar and timestamp it was emitted on so
     * a host can align it to the chart.
     */
    logs: LogEntry[];
    alerts: any[];
    errors: EngineError[];
}

export interface RenderDelta {
    barIndex: number;
    time: number;
    provisional: true;
    series: Array<{ id: string; value?: number; ohlc?: [number, number, number, number]; color?: string }>;
}

export interface Candle { time: number; open: number; high: number; low: number; close: number; volume: number }

// ─── Error normalization (B4) ──────────────────────────────────────────────────

function toEngineErrors(e: any): EngineError[] {
    if (e && Array.isArray(e.errors)) {
        return e.errors.map((x: any) => ({
            phase: "parse" as const, line: x.line, col: x.column, message: x.message, severity: "error" as const,
        }));
    }
    const msg = String(e?.message ?? e);
    const loc = msg.match(/@L(\d+):C(\d+)/);
    return [{
        phase: "transpile",
        line: loc ? Number(loc[1]) : undefined,
        col: loc ? Number(loc[2]) : undefined,
        message: msg,
        severity: "error",
    }];
}

// ─── Render-model serializer (B1 + B5) ──────────────────────────────────────────

const MARKER_TYPES = new Set(["shape", "char"]);

function plotToSeries(id: string, entries: (PlotData | null)[], meta: ScriptMeta | null): RenderSeries {
    const sample = entries.find((d): d is PlotData => d !== null);
    const rawType = sample?.type ?? "line";
    const type: SeriesType =
        rawType === "shape" || rawType === "char" ? "marker" : (rawType as SeriesType);

    // Pane: bgcolor/barcolor/candle render on the price (main) pane; line/marker
    // follow the script's overlay flag (default sub-pane for non-overlay studies).
    const onMain = type === "candle" || type === "bgcolor" || type === "barcolor" || meta?.overlay === true;

    // `na` is `null` here, uniformly — including a value that arrives as NaN,
    // which is what an indicator returns while it is still warming up.
    //
    // NaN used to come through as `{ value: NaN }`, so a host checking
    // `point === null` to find the gaps saw none and drew the warm-up of every
    // `ta.sma(close, 20)` as a run of zeros climbing off the axis. One
    // representation for "nothing to draw" is the whole point of the model.
    const finite = (x: any): x is number => typeof x === "number" && !Number.isNaN(x);

    const seriesColor = (sample as any)?.color;
    // Carry a point's colour only where it DIFFERS from the series default, so
    // the common case stays one string on the series and the override is the
    // exception, exactly as the script wrote it.
    const pointColor = (d: PlotData): string | undefined => {
        const c = (d as any).color;
        return typeof c === "string" && c !== "" && c !== seriesColor ? c : undefined;
    };

    const data = entries.map((d): RenderPoint => {
        if (d === null) return null;
        if (d.type === "candle") {
            if (!(finite(d.open) && finite(d.high) && finite(d.low) && finite(d.close))) return null;
            const c = pointColor(d);
            return c === undefined
                ? { open: d.open, high: d.high, low: d.low, close: d.close }
                : { open: d.open, high: d.high, low: d.low, close: d.close, color: c };
        }
        if (d.type === "bgcolor" || d.type === "barcolor") {
            const c = (d as any).color;
            // `bgcolor(na)` means "leave this bar alone", not "paint it blank".
            return typeof c === "string" && c !== "" ? { color: c } : null;
        }
        const v = (d as any).value;
        if (!finite(v)) return null;
        const c = pointColor(d);
        return c === undefined ? { value: v } : { value: v, color: c };
    });

    return {
        id, title: sample?.title ?? id, type,
        pane: onMain ? "main" : "sub",
        color: seriesColor,
        style: (sample as any)?.style,
        linewidth: (sample as any)?.linewidth,
        ...(sample && (sample as any).location !== undefined ? { location: (sample as any).location } : {}),
        ...(sample && (sample as any).text !== undefined ? { text: String((sample as any).text) } : {}),
        ...(sample && (sample as any).size !== undefined ? { size: String((sample as any).size) } : {}),
        data,
    };
}

function buildSummary(ctx: Ctx): SimResult["summary"] {
    const trades = ctx.trades;
    if (trades.length === 0) return null;
    const net = trades.reduce((a, t) => a + t.pnl, 0);
    const wins = trades.filter((t) => t.pnl > 0).length;
    return { netProfit: net, closedTrades: trades.length, winRate: (wins / trades.length) * 100 };
}

// ─── Strategy performance report ───────────────────────────────────────────────

/**
 * One column of TradingView's performance summary, which reports every figure
 * three times: over all trades, over the long ones and over the short ones.
 *
 * Where TradingView publishes a definition this follows it:
 *
 *   Profit factor   gross profit / gross loss
 *   Max drawdown    the largest peak-to-trough decline
 *   % profitable    winning trades / total closed trades
 *   Sharpe          (MR - RFR) / SD, MR the mean return over a monthly
 *                   trading period and RFR the `risk_free_rate` argument,
 *                   2% a year by default
 *
 * Sortino is the same ratio against downside deviation alone, which is the
 * only part of it TradingView states. A column's run-up and drawdown are
 * measured on the cumulative P&L of that column's trades, so the long column
 * answers "how deep did the long side go" rather than restating the whole
 * account's worst moment three times.
 */
export interface PerformanceStats {
    netProfit: number; netProfitPercent: number;
    grossProfit: number; grossLoss: number;
    maxRunup: number; maxDrawdown: number;
    maxRunupPercent: number; maxDrawdownPercent: number;
    profitFactor: number;
    commissionPaid: number;
    closedTrades: number;
    winningTrades: number; losingTrades: number; evenTrades: number;
    percentProfitable: number;
    avgTrade: number; avgWinningTrade: number; avgLosingTrade: number;
    ratioAvgWinAvgLoss: number;
    largestWinningTrade: number; largestLosingTrade: number;
    avgBarsInTrades: number; avgBarsInWinningTrades: number; avgBarsInLosingTrades: number;
}

export interface Performance {
    all: PerformanceStats;
    long: PerformanceStats;
    short: PerformanceStats;
    /** Figures that belong to the account rather than to a side of it. */
    initialCapital: number;
    openPL: number;
    openTrades: number;
    maxContractsHeld: number;
    buyHoldReturn: number;
    buyHoldReturnPercent: number;
    sharpeRatio: number;
    sortinoRatio: number;
}

/** A ratio whose denominator can legitimately be zero reads as NaN, not Infinity. */
function ratio(num: number, den: number): number {
    return den === 0 ? NaN : num / den;
}

function statsFor(trades: Trade[], capital: number): PerformanceStats {
    const wins = trades.filter((t) => t.pnl > 0);
    const losses = trades.filter((t) => t.pnl < 0);
    const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
    const mean = (xs: number[]) => (xs.length === 0 ? NaN : sum(xs) / xs.length);

    const grossProfit = sum(wins.map((t) => t.pnl));
    // Negated per element, not as a whole: `-sum([])` is -0, and -0 reads as
    // zero everywhere except in a division, where it flips the sign of the
    // profit factor.
    const grossLoss = sum(losses.map((t) => -t.pnl));
    const netProfit = grossProfit - grossLoss;

    // Run-up and drawdown of this column, walked over its own cumulative P&L.
    let cum = 0, peak = 0, trough = 0, maxRunup = 0, maxDrawdown = 0;
    for (const t of trades) {
        cum += t.pnl;
        if (cum > peak) { peak = cum; trough = cum; }
        if (cum < trough) trough = cum;
        maxRunup = Math.max(maxRunup, peak);
        maxDrawdown = Math.max(maxDrawdown, peak - trough);
    }

    const bars = (xs: Trade[]) => xs
        .filter((t) => typeof t.entryBarIndex === "number" && typeof t.exitBarIndex === "number")
        .map((t) => (t.exitBarIndex as number) - (t.entryBarIndex as number));

    const avgWin = mean(wins.map((t) => t.pnl));
    const avgLoss = mean(losses.map((t) => -t.pnl));

    return {
        netProfit,
        netProfitPercent: capital === 0 ? NaN : (netProfit / capital) * 100,
        grossProfit, grossLoss,
        maxRunup, maxDrawdown,
        maxRunupPercent: capital === 0 ? NaN : (maxRunup / capital) * 100,
        maxDrawdownPercent: capital === 0 ? NaN : (maxDrawdown / capital) * 100,
        profitFactor: ratio(grossProfit, grossLoss),
        commissionPaid: sum(trades.map((t) => t.commission ?? 0)),
        closedTrades: trades.length,
        winningTrades: wins.length,
        losingTrades: losses.length,
        evenTrades: trades.length - wins.length - losses.length,
        percentProfitable: trades.length === 0 ? NaN : (wins.length / trades.length) * 100,
        avgTrade: mean(trades.map((t) => t.pnl)),
        avgWinningTrade: avgWin,
        avgLosingTrade: avgLoss,
        ratioAvgWinAvgLoss: ratio(avgWin, avgLoss),
        largestWinningTrade: wins.length === 0 ? NaN : Math.max(...wins.map((t) => t.pnl)),
        largestLosingTrade: losses.length === 0 ? NaN : Math.min(...losses.map((t) => t.pnl)),
        avgBarsInTrades: mean(bars(trades)),
        avgBarsInWinningTrades: mean(bars(wins)),
        avgBarsInLosingTrades: mean(bars(losses)),
    };
}

/**
 * Sharpe and Sortino over the equity curve.
 *
 * TradingView states the ratio as `(MR - RFR) / SD` with MR "the average
 * return for a monthly trading period", so the curve is reduced to one
 * return per calendar month before anything is averaged. `risk_free_rate` is
 * an ANNUAL percentage — 2 by default — so a month's share of it is
 * `rate / 100 / 12`.
 *
 * Sortino replaces SD with the deviation of the negative months alone.
 * Fewer than two months of data leaves both undefined rather than zero: a
 * single return has no deviation to divide by, and reporting 0 there would
 * read as "no risk".
 */
function riskRatios(curve: EquityPoint[], annualRatePercent: number): { sharpeRatio: number; sortinoRatio: number } {
    const monthly: number[] = [];
    let monthKey = "";
    let monthStart = NaN;

    for (const p of curve) {
        const d = new Date(p.time);
        const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
        if (key !== monthKey) {
            if (monthKey !== "" && monthStart > 0) monthly.push(p.equity / monthStart - 1);
            monthKey = key;
            monthStart = p.equity;
        }
    }
    const last = curve[curve.length - 1];
    if (monthKey !== "" && monthStart > 0 && last) monthly.push(last.equity / monthStart - 1);

    if (monthly.length < 2) return { sharpeRatio: NaN, sortinoRatio: NaN };

    const rf = (Number.isFinite(annualRatePercent) ? annualRatePercent : 2) / 100 / 12;
    const excess = monthly.map((r) => r - rf);
    const mean = excess.reduce((a, b) => a + b, 0) / excess.length;

    const deviation = (xs: number[]) =>
        Math.sqrt(xs.reduce((a, x) => a + x * x, 0) / xs.length);

    const sd = deviation(excess.map((x) => x - mean));
    const downside = deviation(excess.filter((x) => x < 0));

    return {
        sharpeRatio: sd === 0 ? NaN : mean / sd,
        sortinoRatio: downside === 0 ? NaN : mean / downside,
    };
}

function buildPerformance(ctx: Ctx): Performance | null {
    if (ctx.scriptMeta?.kind !== "strategy") return null;
    const trades = ctx.trades;
    const capital = ctx.initialCapital;

    const buyHold = Number.isFinite(ctx.firstClose) && ctx.firstClose !== 0
        ? (ctx.lastClose / ctx.firstClose - 1) * capital
        : NaN;

    const openPL = ctx.position.size === 0
        ? 0
        : (ctx.lastClose - ctx.position.avgPrice) * ctx.position.size;

    return {
        all: statsFor(trades, capital),
        long: statsFor(trades.filter((t) => t.direction === "long"), capital),
        short: statsFor(trades.filter((t) => t.direction === "short"), capital),
        initialCapital: capital,
        openPL,
        openTrades: ctx.position.size === 0 ? 0 : 1,
        maxContractsHeld: ctx.maxContractsHeld,
        buyHoldReturn: buyHold,
        buyHoldReturnPercent: capital === 0 ? NaN : (buyHold / capital) * 100,
        ...riskRatios(ctx.equityCurve, Number(ctx.scriptMeta.risk_free_rate ?? 2)),
    };
}

export function buildRenderModel(ctx: Ctx): Omit<SimResult, "protocolVersion" | "engineVersion" | "errors"> {
    const meta = ctx.scriptMeta;
    const series: RenderSeries[] = [];
    for (const [id, entries] of ctx.plots) series.push(plotToSeries(id, entries, meta));

    const fills: SimResult["fills"] = [];
    for (const [, entries] of ctx.fills) {
        const f = entries.find((d) => d !== null);
        if (!f) continue;
        const colors = entries.map((d) => (d ? d.color : null));
        const distinct = new Set(colors.filter((c): c is string => c !== null));
        fills.push({
            plotId1: f.plotId1, plotId2: f.plotId2, color: f.color, title: f.title,
            // Carried only when it varies, exactly as a plot's per-point
            // colour is: one colour on the fill is the common case and the
            // array is 5,000 strings a host would have no use for.
            ...(distinct.size > 1 ? { colors } : {}),
        });
    }

    return {
        meta,
        barsProcessed: ctx.currentBarIndex,
        series,
        fills,
        trades: ctx.trades.slice(),
        position: { ...ctx.position },
        summary: buildSummary(ctx),
        performance: buildPerformance(ctx),
        equity: ctx.equityCurve.slice(),
        // Creation order, which is the order a host should draw them in: a
        // later drawing overlaps an earlier one on TradingView too.
        drawings: [...ctx.drawings.values()],
        logs: ctx.logs.slice(),
        alerts: [], // alertcondition: reserved (P2)
    };
}

/**
 * An `InputDef` as a host sees it.
 *
 * `registerInput` spreads every declared argument onto the definition, so the
 * bounds, the option list and the layout hints are already there. Only the
 * ones a host can act on are forwarded, and only when the script set them —
 * an absent key means "no constraint", which is different from `undefined`
 * meaning "unset".
 */
function toInputView(d: InputDef, userInputs: Record<string, any>): InputView {
    const def = d as InputDef & Record<string, any>;
    const view: InputView = {
        id: d.id, title: d.title, type: d.type,
        default: d.defval,
        current: userInputs[d.id] ?? d.defval,
        overridden: d.id in userInputs,
    };
    const num = (k: string) => (typeof def[k] === "number" && Number.isFinite(def[k]) ? def[k] : undefined);
    if (num("minval") !== undefined) view.minval = num("minval");
    if (num("maxval") !== undefined) view.maxval = num("maxval");
    if (num("step") !== undefined) view.step = num("step");
    if (Array.isArray(def.options) && def.options.length > 0) view.options = def.options.slice();
    if (typeof def.tooltip === "string" && def.tooltip !== "") view.tooltip = def.tooltip;
    if (typeof def.group === "string" && def.group !== "") view.group = def.group;
    if (typeof def.inline === "string" && def.inline !== "") view.inline = def.inline;
    if (def.confirm !== undefined) view.confirm = Boolean(def.confirm);
    return view;
}

/**
 * The declaration arguments a host may override, for a strategy's properties
 * panel. A study declares nothing a user can usefully change, so it gets none.
 */
function propertyViews(ctx: Ctx): PropertyView[] {
    if (ctx.scriptMeta?.kind !== "strategy") return [];
    const meta = ctx.scriptMeta;
    const declared = ctx.declaredProperties;

    /** What the script declared, falling back to the value in force. */
    const was = (key: string, current: number | string) =>
        declared[key] !== undefined ? declared[key] : current;

    const rows: PropertyView[] = [
        {
            key: "initial_capital", title: "Initial capital", type: "float",
            group: "Trading", unit: meta.currency ?? "", minval: 0,
            current: ctx.initialCapital,
            declared: Number(declared.initial_capital ?? ctx.initialCapital),
        },
        {
            key: "default_qty_type", title: "Order size", type: "string",
            group: "Trading",
            options: ["strategy.fixed", "strategy.cash", "strategy.percent_of_equity"],
            current: String(meta.default_qty_type ?? "strategy.fixed"),
            declared: String(was("default_qty_type", meta.default_qty_type ?? "strategy.fixed")),
        },
        {
            key: "default_qty_value", title: "Order size value", type: "float",
            group: "Trading", minval: 0,
            current: Number(meta.default_qty_value ?? 1),
            declared: Number(was("default_qty_value", meta.default_qty_value ?? 1)),
        },
        {
            key: "pyramiding", title: "Pyramiding (max entries)", type: "integer",
            group: "Trading", minval: 0, unit: "orders",
            current: meta.pyramiding ?? 0,
            declared: Number(declared.pyramiding ?? 0),
        },
        {
            key: "commission_type", title: "Commission type", type: "string",
            group: "Costs",
            options: ["commission.percent", "commission.cash_per_contract", "commission.cash_per_order"],
            current: String(meta.commission_type ?? "commission.percent"),
            declared: String(was("commission_type", meta.commission_type ?? "commission.percent")),
        },
        {
            key: "commission_value", title: "Commission", type: "float",
            group: "Costs", minval: 0,
            current: Number(meta.commission_value ?? 0),
            declared: Number(was("commission_value", meta.commission_value ?? 0)),
        },
        {
            key: "slippage", title: "Slippage", type: "integer",
            group: "Costs", minval: 0, unit: "ticks",
            current: Number(meta.slippage ?? 0),
            declared: Number(was("slippage", meta.slippage ?? 0)),
        },
        // `margin_long` / `margin_short` are deliberately absent. The engine
        // records them but the broker does not enforce them — there are no
        // margin calls and nothing is ever liquidated for insufficient margin
        // — and a control that changes nothing is worse than no control. They
        // are still on `ScriptMeta` for a host that wants to display them.
        {
            key: "risk_free_rate", title: "Risk-free rate", type: "float",
            group: "Costs", minval: 0, unit: "% a year",
            current: Number(meta.risk_free_rate ?? 2),
            declared: Number(was("risk_free_rate", meta.risk_free_rate ?? 2)),
        },
    ];
    return rows;
}

// ─── Session (B3) ───────────────────────────────────────────────────────────────

export class Session {
    private js: string | null = null;
    private meta: ScriptMeta | null = null;
    private inputValues: Record<string, any> = {};
    private propertyValues: Record<string, any> = {};
    private securities: Array<{ symbol: string; resolution: string; candles: SecurityCandle[] }> = [];
    // Runtime context for the current run (created by runHistory, continued by tick/commit).
    private ctx: Ctx | null = null;
    private exec: (() => any) | null = null;
    // Language profile of the compiled script; every Context created for this
    // session must run under it. Reset on each compile().
    private profile: LanguageProfile = DEFAULT_PROFILE;
    /** Pine Script version detected in the last compile(). */
    public pineVersion: PineVersion = 1;

    /** Transpile + validate; a 1-bar dry run on a throwaway context discovers inputs + metadata. */
    compile(source: string): Compiled {
        // Reset ALL per-script state up front, version included. Writing
        // profile/pineVersion only inside the try left a failed compile
        // reporting the PREVIOUS script's version through the public field.
        this.js = null; this.ctx = null; this.exec = null;
        this.profile = DEFAULT_PROFILE;
        this.pineVersion = DEFAULT_PROFILE.version;

        let js: string;
        try {
            const compiled = compileScript(source);
            js = compiled.js.replace(/\blet\b/g, "var ");
            this.profile = compiled.profile;
            this.pineVersion = compiled.version;
        } catch (e) {
            return { protocolVersion: PROTOCOL_VERSION, engineVersion: ENGINE_VERSION, meta: null, inputs: [], properties: [], errors: toEngineErrors(e) };
        }

        const ctx = new Context(this.profile);
        Object.assign(ctx.propertyOverrides, this.propertyValues);
        try {
            const exec = compile(js, ctx, Object.create(null));
            ctx.setBar(0, 1, 1, 1, 1, 1); // dry bar: input()/study()/strategy() run here
            exec();
        } catch (e) {
            return { protocolVersion: PROTOCOL_VERSION, engineVersion: ENGINE_VERSION, meta: null, inputs: [], properties: [], errors: toEngineErrors(e) };
        }

        this.js = js; this.meta = ctx.scriptMeta;
        return {
            protocolVersion: PROTOCOL_VERSION,
            engineVersion: ENGINE_VERSION,
            meta: ctx.scriptMeta,
            inputs: ctx.inputDefs.map((d) => toInputView(d, ctx.userInputs)),
            properties: propertyViews(ctx),
            errors: [],
        };
    }

    setInputs(values: Record<string, any>): void {
        Object.assign(this.inputValues, values);
        if (this.ctx) Object.assign(this.ctx.userInputs, values);
    }

    /**
     * Override `strategy()` declaration arguments — starting capital,
     * pyramiding — the way TradingView's properties panel does.
     *
     * Unlike `setInputs`, this cannot be applied to a run already in progress:
     * `cash` moves with the first fill, so it is seeded when the script
     * declares itself and never afterwards. The next `runHistory` picks it up.
     */
    setProperties(values: Record<string, any>): void {
        Object.assign(this.propertyValues, values);
    }

    provideData(symbol: string, resolution: string, candles: SecurityCandle[]): void {
        this.securities.push({ symbol, resolution, candles });
        if (this.ctx) this.ctx.provideSecurityData(symbol, resolution, candles);
    }

    /**
     * Full historical pass; returns the render model. Builds a FRESH context so
     * the sandbox's series references always match (ctx.reset() would re-create
     * the base series and orphan the sandbox bindings).
     */
    runHistory(candles: Candle[]): SimResult {
        if (!this.js) throw new Error("compile() first");
        const ctx = new Context(this.profile);
        const exec = compile(this.js, ctx, Object.create(null));
        Object.assign(ctx.userInputs, this.inputValues);
        // Before the first bar: `declareScript` reads these, and it runs on it.
        Object.assign(ctx.propertyOverrides, this.propertyValues);
        for (const s of this.securities) ctx.provideSecurityData(s.symbol, s.resolution, s.candles);
        // `last_bar_index` / `last_bar_time` are documented as known from the
        // first bar, and only the caller knows how long the run is.
        if (candles.length > 0) {
            ctx.provideDatasetExtent(candles.length, candles[candles.length - 1].time);
        }
        this.ctx = ctx; this.exec = exec;

        const errors: EngineError[] = [];
        try {
            for (let i = 0; i < candles.length; i++) {
                const b = candles[i];
                ctx.setBar(b.time, b.open, b.high, b.low, b.close, b.volume);
                exec();
                ctx.finalizeBar();
            }
        } catch (e) {
            errors.push(...toEngineErrors({ ...(e as any), message: (e as any)?.message }).map((x) => ({ ...x, phase: "runtime" as const })));
        }
        return { protocolVersion: PROTOCOL_VERSION, engineVersion: ENGINE_VERSION, ...buildRenderModel(ctx), errors };
    }

    /** Live tick on the forming bar (P3). Honors calc_on_every_tick. */
    tick(candle: Candle): RenderDelta {
        const ctx = this.ctx, exec = this.exec;
        if (!ctx || !exec) throw new Error("runHistory() first");
        const everyTick = this.meta?.kind !== "strategy" || this.meta?.calc_on_every_tick !== false;
        ctx.applyTick(candle.time, candle.open, candle.high, candle.low, candle.close, candle.volume);
        if (everyTick) exec();
        return this.deltaForFormingBar();
    }

    /** Close the forming bar; recompute once if calc_on_every_tick was off. */
    commit(): { barIndex: number } {
        const ctx = this.ctx, exec = this.exec;
        if (!ctx || !exec) throw new Error("compile() first");
        const everyTick = this.meta?.kind !== "strategy" || this.meta?.calc_on_every_tick !== false;
        if (!everyTick) exec(); // compute the bar once at close
        const barIndex = ctx.currentBarIndex;
        ctx.commitBar();
        return { barIndex };
    }

    private deltaForFormingBar(): RenderDelta {
        const ctx = this.ctx!;
        const i = ctx.currentBarIndex;
        const series: RenderDelta["series"] = [];
        for (const [id, entries] of ctx.plots) {
            const d = entries[i];
            if (!d) continue;
            if (d.type === "candle") series.push({ id, ohlc: [d.open, d.high, d.low, d.close] });
            else if (d.type === "bgcolor" || d.type === "barcolor") series.push({ id, color: (d as any).color });
            else series.push({ id, value: (d as any).value });
        }
        return { barIndex: i, time: ctx.time, provisional: true, series };
    }
}

/** One-shot convenience: compile + runHistory. */
export function runScript(
    source: string,
    opts: { candles: Candle[]; inputs?: Record<string, any>; properties?: Record<string, any>; securities?: Array<{ symbol: string; resolution: string; candles: SecurityCandle[] }> } = { candles: [] }
): SimResult {
    const s = new Session();
    if (opts.properties) s.setProperties(opts.properties);
    const compiled = s.compile(source);
    if (compiled.errors.length) {
        return {
            protocolVersion: PROTOCOL_VERSION, engineVersion: ENGINE_VERSION, meta: compiled.meta,
            barsProcessed: 0, series: [], fills: [], trades: [],
            position: { size: 0, avgPrice: 0 }, summary: null,
            performance: null, equity: [],
            drawings: [], logs: [], alerts: [], errors: compiled.errors,
        };
    }
    if (opts.inputs) s.setInputs(opts.inputs);
    for (const sec of opts.securities ?? []) s.provideData(sec.symbol, sec.resolution, sec.candles);
    return s.runHistory(opts.candles);
}
