/**
 * runtime/v2/session.ts
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
import { transpile } from "../../transpiler/v2";
import { compile, Context } from "./index";
import type { Context as Ctx, PlotData, ScriptMeta, SecurityCandle } from "./context";

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
}

export interface Compiled {
    protocolVersion: number;
    engineVersion: typeof ENGINE_VERSION;
    meta: ScriptMeta | null;
    inputs: InputView[];
    errors: EngineError[];
}

type SeriesType = "line" | "candle" | "marker" | "arrow" | "bgcolor" | "barcolor";

export interface RenderSeries {
    id: string; title: string;
    type: SeriesType;
    pane: "main" | "sub";
    timeframe?: string;
    color?: string; style?: string | number; linewidth?: number;
    data: Array<{ value: number } | { open: number; high: number; low: number; close: number } | { color: string } | null>;
}

export interface SimResult {
    protocolVersion: number;
    engineVersion: typeof ENGINE_VERSION;
    meta: ScriptMeta | null;
    barsProcessed: number;
    series: RenderSeries[];
    fills: Array<{ plotId1: string; plotId2: string; color: string; title: string }>;
    trades: any[];
    summary: { netProfit: number; closedTrades: number; winRate: number } | null;
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

    const data = entries.map((d) => {
        if (d === null) return null;
        if (d.type === "candle") return { open: d.open, high: d.high, low: d.low, close: d.close };
        if (d.type === "bgcolor" || d.type === "barcolor") return { color: (d as any).color ?? "" };
        const v = (d as any).value;
        return typeof v === "number" ? { value: v } : null;
    });

    return {
        id, title: sample?.title ?? id, type,
        pane: onMain ? "main" : "sub",
        color: (sample as any)?.color,
        style: (sample as any)?.style,
        linewidth: (sample as any)?.linewidth,
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

export function buildRenderModel(ctx: Ctx): Omit<SimResult, "protocolVersion" | "engineVersion" | "errors"> {
    const meta = ctx.scriptMeta;
    const series: RenderSeries[] = [];
    for (const [id, entries] of ctx.plots) series.push(plotToSeries(id, entries, meta));

    const fills: SimResult["fills"] = [];
    for (const [, entries] of ctx.fills) {
        const f = entries.find((d) => d !== null);
        if (f) fills.push({ plotId1: f.plotId1, plotId2: f.plotId2, color: f.color, title: f.title });
    }

    return {
        meta,
        barsProcessed: ctx.currentBarIndex,
        series,
        fills,
        trades: ctx.trades.slice(),
        summary: buildSummary(ctx),
        alerts: [], // alertcondition: reserved (P2)
    };
}

// ─── Session (B3) ───────────────────────────────────────────────────────────────

export class Session {
    private js: string | null = null;
    private meta: ScriptMeta | null = null;
    private inputValues: Record<string, any> = {};
    private securities: Array<{ symbol: string; resolution: string; candles: SecurityCandle[] }> = [];
    // Runtime context for the current run (created by runHistory, continued by tick/commit).
    private ctx: Ctx | null = null;
    private exec: (() => any) | null = null;

    /** Transpile + validate; a 1-bar dry run on a throwaway context discovers inputs + metadata. */
    compile(source: string): Compiled {
        this.js = null; this.ctx = null; this.exec = null;
        let js: string;
        try {
            js = transpile(source).replace(/\blet\b/g, "var ");
        } catch (e) {
            return { protocolVersion: PROTOCOL_VERSION, engineVersion: ENGINE_VERSION, meta: null, inputs: [], errors: toEngineErrors(e) };
        }

        const ctx = new Context();
        try {
            const exec = compile(js, ctx, Object.create(null));
            ctx.setBar(0, 1, 1, 1, 1, 1); // dry bar: input()/study()/strategy() run here
            exec();
        } catch (e) {
            return { protocolVersion: PROTOCOL_VERSION, engineVersion: ENGINE_VERSION, meta: null, inputs: [], errors: toEngineErrors(e) };
        }

        this.js = js; this.meta = ctx.scriptMeta;
        return {
            protocolVersion: PROTOCOL_VERSION,
            engineVersion: ENGINE_VERSION,
            meta: ctx.scriptMeta,
            inputs: ctx.inputDefs.map((d) => ({
                id: d.id, title: d.title, type: d.type,
                default: d.defval, current: ctx.userInputs[d.id] ?? d.defval, overridden: d.id in ctx.userInputs,
            })),
            errors: [],
        };
    }

    setInputs(values: Record<string, any>): void {
        Object.assign(this.inputValues, values);
        if (this.ctx) Object.assign(this.ctx.userInputs, values);
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
        const ctx = new Context();
        const exec = compile(this.js, ctx, Object.create(null));
        Object.assign(ctx.userInputs, this.inputValues);
        for (const s of this.securities) ctx.provideSecurityData(s.symbol, s.resolution, s.candles);
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
    opts: { candles: Candle[]; inputs?: Record<string, any>; securities?: Array<{ symbol: string; resolution: string; candles: SecurityCandle[] }> } = { candles: [] }
): SimResult {
    const s = new Session();
    const compiled = s.compile(source);
    if (compiled.errors.length) {
        return {
            protocolVersion: PROTOCOL_VERSION, engineVersion: ENGINE_VERSION, meta: compiled.meta,
            barsProcessed: 0, series: [], fills: [], trades: [], summary: null, alerts: [], errors: compiled.errors,
        };
    }
    if (opts.inputs) s.setInputs(opts.inputs);
    for (const sec of opts.securities ?? []) s.provideData(sec.symbol, sec.resolution, sec.candles);
    return s.runHistory(opts.candles);
}
