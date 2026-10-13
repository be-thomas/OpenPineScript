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
import type { Context as Ctx, PlotData, ScriptMeta, SecurityCandle, Drawing, LogEntry, Position, InputDef } from "./context";

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
    type: "float" | "integer";
    current: number;
    declared: number;
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
    fills: Array<{ plotId1: string; plotId2: string; color: string; title: string }>;
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
        position: { ...ctx.position },
        summary: buildSummary(ctx),
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
    const declared = ctx.declaredProperties;
    return [
        {
            key: "initial_capital", title: "Initial capital", type: "float",
            current: ctx.initialCapital,
            declared: Number(declared.initial_capital ?? ctx.initialCapital),
        },
        {
            key: "pyramiding", title: "Pyramiding (max entries)", type: "integer",
            current: ctx.scriptMeta.pyramiding ?? 0,
            declared: Number(declared.pyramiding ?? 0),
        },
    ];
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
            drawings: [], logs: [], alerts: [], errors: compiled.errors,
        };
    }
    if (opts.inputs) s.setInputs(opts.inputs);
    for (const sec of opts.securities ?? []) s.provideData(sec.symbol, sec.resolution, sec.candles);
    return s.runHistory(opts.candles);
}
