import { PREFIX, removePrefix, extractFunctionName } from "../../utils/v2/common";
import { Series, SeriesSnapshot } from "./Series";
import { REGISTRY, viewFor } from "./stdlib";
import { MATRIX_TAG } from "./stdlib/matrix";
import { aggregate, periodIndex, specSeconds } from "./timeframes";
import { processPendingOrders, fillMarketOrders, MarketOrder } from "./stdlib/strategy";
import { LanguageProfile, DEFAULT_PROFILE } from "../../transpiler/common/profiles";

// Define Trade Types
export interface Trade {
    id: string;
    entryTime: number;
    entryPrice: number;
    exitTime: number;
    exitPrice: number;
    qty: number;
    pnl: number;
    direction: "long" | "short";
}

export interface Position {
    size: number;      // + for Long, - for Short
    avgPrice: number;
    /**
     * The bar the position was OPENED on, and the order id that opened it.
     *
     * Recorded so `strategy.opentrades.entry_bar_index` and `.entry_id` have
     * something to answer with. Undefined while flat, which is the same fact as
     * `size === 0` and reads as `na` either way.
     */
    entryBarIndex?: number;
    entryId?: string;
}

/**
 * One line emitted by v5's `log.*` functions.
 *
 * Declared here rather than beside the functions in stdlib/logging.ts so the
 * dependency runs one way: every stdlib module already imports the Context, and
 * having the Context import a stdlib module back would close the cycle.
 */
export interface LogEntry {
    readonly level: "info" | "warning" | "error";
    readonly message: string;
    /** The bar the line was emitted on, so a log can be aligned to a series. */
    readonly bar: number;
    /** The bar's timestamp, which is what the generated CSV rows are keyed by. */
    readonly time: number;
}

// --- Plot Data: Discriminated Union ---
// Each plot type stores only the fields it needs.
// Frontend can switch on `type` to map to KlineCharts structures.

interface PlotBase {
    title: string;
    color?: string;
}

export interface LinePlot extends PlotBase {
    type: 'line';
    value: number;
    linewidth?: number;
    style?: number;
}

export interface OHLCPlot extends PlotBase {
    type: 'candle';
    open: number;
    high: number;
    low: number;
    close: number;
}

export interface MarkerPlot extends PlotBase {
    type: 'shape' | 'char' | 'arrow';
    value: number;
    style?: string;
}

export interface ColorDirective extends PlotBase {
    type: 'bgcolor' | 'barcolor';
}

export type PlotData = LinePlot | OHLCPlot | MarkerPlot | ColorDirective;

export interface FillData {
    plotId1: string; // The ID of the first line
    plotId2: string; // The ID of the second line
    color: string;
    title: string;
}

export interface InputDef {
    id: string;      // Internal sequential ID
    defval: any;     // Default value
    title: string;   // Display name for UI
    type: string;    // 'integer', 'float', 'bool', 'string', 'source'
}

/**
 * Script-level metadata declared by the `study()` / `strategy()` directive.
 * `kind` drives mode-specific behavior (e.g. study mode disables the broker).
 */
/**
 * The directive kinds a script can declare.
 *
 * `indicator` is v5's rename of `study` and nothing else — same parameters,
 * same meaning. Both spellings are kept rather than normalised so a host
 * reading `scriptMeta.kind` sees the keyword the author actually wrote, which
 * is also what every diagnostic quotes back at them.
 *
 * `library` is v5's third kind. A library declares functions for other scripts
 * to import and plots nothing itself, so a host must be able to tell one from
 * an indicator before it tries to render anything.
 */
export type ScriptKind = 'study' | 'indicator' | 'strategy' | 'library';

/**
 * What a strategy starts with when `strategy()` does not say.
 *
 * TradingView's own figure, read off its own output: the golden strategy
 * export passes no `initial_capital` and its `strategy.equity` reads exactly
 * 1000000 on every bar before the first fill
 * (conformance/v5/golden/harness_strategy.BTCUSDT.1D.log). The engine used to
 * start at 100000, which put every equity-derived figure — `netprofit_percent`,
 * `grossprofit_percent` — out by a factor of ten.
 */
export const DEFAULT_INITIAL_CAPITAL = 1_000_000;

export interface ScriptMeta {
    kind: ScriptKind;
    title: string;
    shorttitle: string;
    overlay: boolean;
    precision?: number;          // study only
    pyramiding?: number;         // strategy only
    calc_on_every_tick?: boolean; // strategy only
    calc_on_order_fills?: boolean; // strategy only
    currency?: string;           // strategy only
}

/**
 * A rollback point for live-tick re-evaluation (P3). Captures every piece of
 * mutable runtime state that re-running the forming bar would otherwise
 * accumulate incorrectly: indicator `states`, broker state, and series/plot
 * lengths. Series buffers self-heal by truncation (head index is overwritten).
 */
interface RuntimeSnapshot {
    states: Map<string, any>;
    varMeta: Map<string, SeriesSnapshot>;
    plotLens: Map<string, number>;
    fillLens: Map<string, number>;
    position: Position;
    cash: number;
    trades: Trade[];
    orders: any[];
    marketOrders: MarketOrder[];
    pendingEntries: Map<string, any>;
    pendingExits: Map<string, any>;
    riskState: any;
}

/**
 * A v4 drawing object (line, label, box, table).
 *
 * `props` is deliberately untyped: the four kinds share no fields, every one of
 * them has ~10 optional style properties, and nothing in this engine reads them
 * — they exist so a host can render, and so a script that draws does not crash.
 */
/**
 * Reduce a runtime value to something that can leave this process.
 *
 * The render model is a DATA structure: a host reads it across a `postMessage`
 * or a JSON boundary, so anything in it that is not plain data makes the whole
 * result unusable, however correct its numbers are.
 *
 * Two things arrive here that are not:
 *
 *   a `Series`             `f = plot(...)` compiles to `ctx.new_var(...)`, so a
 *                          plot id handed to `fill()` is a Series — and a
 *                          Series holds the Context, which holds the sandbox,
 *                          which holds every stdlib function.
 *   a value-bearing FN     `cross` is the crossover function AND the v1–v3
 *                          plot style; `plot(x, style = cross)` records the
 *                          binding, and the binding is callable.
 *
 * A function that carries no value is dropped rather than stringified: the
 * render model has no reading for one, and a source dump is worse than a gap.
 */
function plainValue(v: any): any {
    if (v instanceof Series) return v.valueOf();
    if (typeof v === "function") {
        const unwrapped = v.valueOf();
        return typeof unwrapped === "function" ? undefined : unwrapped;
    }
    return v;
}

export interface Drawing {
    id: string;
    kind: 'line' | 'label' | 'box' | 'table' | 'polyline' | 'linefill';
    /** The bar the drawing was created on. */
    bar: number;
    props: Record<string, any>;
}

/**
 * One observation of a non-price series — a dividend, a quarterly figure.
 *
 * These are EVENTS, not bars: a value is published on one date and stands until
 * the next, so a request reads as a step function over its samples rather than
 * as one value per bar.
 */
export interface RequestSample {
    /** UNIX ms. The value applies to this bar and every later one until the next sample. */
    time: number;
    value: number;
}

/** A higher-timeframe candle supplied for `security()` evaluation (P1). */
export interface SecurityCandle {
    time: number; open: number; high: number; low: number; close: number; volume: number;
}


/**
 * Heikin-Ashi transform.
 *
 *   haClose = (O + H + L + C) / 4
 *   haOpen  = (previous haOpen + previous haClose) / 2   — seeded (O + C) / 2
 *   haHigh  = max(H, haOpen, haClose)
 *   haLow   = min(L, haOpen, haClose)
 *
 * haOpen is RECURSIVE, so the series must be built forward from the first
 * candle; taking a window in isolation gives different numbers.
 */
function toHeikinAshi(candles: SecurityCandle[]): SecurityCandle[] {
    const out: SecurityCandle[] = [];
    let prevOpen = NaN;
    let prevClose = NaN;

    for (const c of candles) {
        const haClose = (c.open + c.high + c.low + c.close) / 4;
        const haOpen = Number.isFinite(prevOpen) && Number.isFinite(prevClose)
            ? (prevOpen + prevClose) / 2
            : (c.open + c.close) / 2;
        out.push({
            time: c.time,
            open: haOpen,
            high: Math.max(c.high, haOpen, haClose),
            low: Math.min(c.low, haOpen, haClose),
            close: haClose,
            volume: c.volume,
        });
        prevOpen = haOpen;
        prevClose = haClose;
    }
    return out;
}

export class Context {
    // 1. Internal Execution State (Private)
    protected callStack: string[] = [];

    /**
     * Keyword arguments passed to a built-in whose signature does not name them.
     *
     * `<function>(<argument>)`, deduplicated. Empty is the only acceptable
     * value: a name Pine accepts and this engine does not model is a gap, and a
     * silently dropped argument is the worst shape one can take — the script
     * runs, and does something other than what it says.
     */
    public droppedArguments: Set<string> = new Set();

    /**
     * The series NAMESPACE of the user-function frame currently executing.
     *
     * Empty at script scope, and `<call id>|` inside a user function — nested
     * one level per frame, so a function called from two places has two
     * namespaces and a function called from inside another has one per outer
     * frame.
     *
     * ── Why this exists ─────────────────────────────────────────────────────
     *
     * "each function call has its own instance of the series variables" is how
     * Pine works, and this engine gave every call site ONE instance:
     *
     *     f() =>
     *         var c = 0
     *         c := c + 1
     *         c
     *     a = f()
     *     b = f()
     *
     * yielded a = 1,3,5 and b = 2,4,6, where TradingView gives 1,2,3 for both.
     * Both calls advanced the same counter. The same held for every function
     * local, not just `var` ones: `t = close * 2` inside a function was one
     * series shared by every caller, so a function's HISTORY (`t[1]`) mixed the
     * call sites together.
     *
     * The emitter already qualifies a local's name by its FUNCTION, which stops
     * two different functions from colliding. This is the other half: two calls
     * of the SAME function are two variables too.
     */
    private seriesScope = "";
    private seriesScopes: string[] = [];

    /** A series key in the frame that is running — the plain name at script scope. */
    private scoped(name: string): string {
        return this.seriesScope + name;
    }
    private states: Map<string, any> = new Map();
    // Committed baseline for the forming live bar (P3). Null outside live ticks.
    private committedSnapshot: RuntimeSnapshot | null = null;

    // 2. Series Registry
    // Key = Variable Name (e.g. "opsv2_close", "opsv2_myVar")
    public vars: Map<string, Series> = new Map(); // Changed to public so the runner can extract them!

    // 3. Market Data (Public primitives for internal engine use)
    public time: number = 0;
    public open: number = 0;
    public high: number = 0;
    public low: number = 0;
    public close: number = 0;
    public volume: number = 0;

    // 4. Engine State (Public)
    public currentBarIndex: number = 0;

    /**
     * The chart's timeframe, as Pine spells it: "1", "5", "60", "D", "W", "M".
     *
     * Read by `period` / `interval` in stdlib/chart.ts. A script that branches
     * on the chart timeframe (a very common pattern in session and pivot
     * indicators) computes different numbers depending on this, so a host that
     * runs intraday data MUST set it — the default is the daily bars this
     * repo's sample dataset uses, not a claim about the data supplied.
     */
    public resolution: string = "D";

    /** The chart's symbol, as `tickerid` / `ticker` report it. */
    public symbol: string = "SYMBOL";

    /**
     * The instrument's minimum price increment, read by `math.round_to_mintick`.
     *
     * A property of the SYMBOL, so a host that charts anything other than the
     * sample dataset must set it. The default is the two-decimal tick of a
     * typical equity, which is a starting point rather than a claim about the
     * data supplied — the same stance `resolution` takes above.
     */
    public mintick: number = 0.01;

    /**
     * The rest of what a script can ask about its instrument — the `syminfo.*`
     * family added at v4.
     *
     * ── Why these are host-declared, with stated defaults ───────────────────
     *
     * None of it is derivable from OHLCV bars. A CSV of prices does not say
     * which exchange listed them, what currency they are quoted in, or which
     * time zone the session runs in. So each is a field the host sets, and each
     * default below is a CHOICE that a script can act on:
     *
     *   `syminfo.type == "crypto"` selects a different pivot window in a large
     *   share of published indicators, and `syminfo.currency` appears directly
     *   in position-sizing arithmetic.
     *
     * Left unset, a script gets the defaults — a US equity quoted in USD on a
     * one-cent tick — which is exactly what this repo's sample dataset is. That
     * is a starting point, not a claim about whatever data a host supplies.
     *
     * Two are DERIVED rather than stored, because Pine defines them in terms of
     * the ticker id: `syminfo.prefix` and `syminfo.ticker` are the two halves
     * of `EXCHANGE:SYMBOL`. Storing them separately would let them drift out of
     * step with the symbol they describe.
     */
    public currency: string = "USD";
    public basecurrency: string = "";
    public description: string = "";
    public symbolType: string = "stock";
    public symbolRoot: string = "";
    public timezone: string = "UTC";
    public pointvalue: number = 1;
    public sessionSpec: string = "regular";

    /** Declares the instrument's metadata. Every field is optional. */
    public provideSymbolInfo(info: {
        symbol?: string; mintick?: number; currency?: string; basecurrency?: string;
        description?: string; type?: string; root?: string; timezone?: string;
        pointvalue?: number; session?: string;
    }): void {
        if (info.symbol !== undefined) this.symbol = String(info.symbol);
        if (info.mintick !== undefined) this.mintick = Number(info.mintick);
        if (info.currency !== undefined) this.currency = String(info.currency);
        if (info.basecurrency !== undefined) this.basecurrency = String(info.basecurrency);
        if (info.description !== undefined) this.description = String(info.description);
        if (info.type !== undefined) this.symbolType = String(info.type);
        if (info.root !== undefined) this.symbolRoot = String(info.root);
        if (info.timezone !== undefined) this.timezone = String(info.timezone);
        if (info.pointvalue !== undefined) this.pointvalue = Number(info.pointvalue);
        if (info.session !== undefined) this.sessionSpec = String(info.session);
    }

    /**
     * How many bars the host is going to feed, and when the last one opens.
     *
     * ── Why the host has to say ─────────────────────────────────────────────
     *
     * `last_bar_index` and `last_bar_time` (v5, December 2021) are documented
     * as "known at the beginning of the script's calculation" — on bar 1 a
     * script can already ask how far the dataset runs, which is how the common
     * `bar_index == last_bar_index - 1` idiom works at all.
     *
     * This engine streams bars: `setBar` is called one at a time and the
     * Context has no way to know how many more are coming. Only the caller
     * knows, so the caller declares it. `mock_run` reads it off the CSV; the
     * session API takes it from the candle array it was handed.
     *
     * ── When it is not declared ─────────────────────────────────────────────
     *
     * The fallback is the highest bar seen SO FAR, which is correct on the last
     * bar and an underestimate before it. That is a real divergence from
     * TradingView rather than a hidden approximation, and it is why
     * `provideDatasetExtent` exists: a host that can be exact should be.
     */
    public datasetSize: number | null = null;
    public datasetLastTime: number | null = null;

    /** Declare the extent of the run before the first bar. */
    public provideDatasetExtent(barCount: number, lastBarTime?: number): void {
        this.datasetSize = Number.isFinite(barCount) && barCount > 0 ? Math.trunc(barCount) : null;
        this.datasetLastTime = lastBarTime != null && Number.isFinite(lastBarTime)
            ? Number(lastBarTime) : null;
    }

    /** Bar index of the last bar in the dataset — `last_bar_index`. */
    public get lastBarIndex(): number {
        return this.datasetSize != null ? this.datasetSize - 1 : this.currentBarIndex;
    }

    /**
     * How many bars at the END of the run the host marks REALTIME.
     *
     * ── Why the host has to say ─────────────────────────────────────────────
     *
     * `barstate.islastconfirmedhistory` is "true if the script is executing on
     * the dataset's last bar when the market is closed, or on the bar
     * immediately preceding the realtime bar if the market is open". The second
     * reading needs to be answered ON that preceding bar — one bar before the
     * realtime flag arrives — so it cannot be inferred from `is_realtime`, which
     * the host sets bar by bar.
     *
     * The same shape as `provideDatasetExtent` above, and for the same reason:
     * only the caller knows how its run ends. Zero — no realtime bar, the whole
     * dataset is settled history — is the default, because a host that says
     * nothing is replaying closed bars. Every harness in this repository that
     * models an open market (`is_realtime = is_last`) sets it to 1.
     *
     * Getting this wrong is silent: with a realtime bar unaccounted for, the
     * guard fires on NO bar at all, and the twenty-nine documentation examples
     * that draw their labels and tables under it drew nothing.
     */
    public realtimeBars: number = 0;

    /** Bar index of the last bar the script may treat as settled history. */
    public get lastConfirmedHistoryIndex(): number {
        return this.lastBarIndex - this.realtimeBars;
    }

    /** Opening time of the last bar in the dataset — `last_bar_time`. */
    public get lastBarTime(): number {
        return this.datasetLastTime != null ? this.datasetLastTime : this.time;
    }

    /**
     * The chart's background colour — what `chart.bg_color` returns.
     *
     * "chart.bg_color returns the color of the chart's background from the
     *  'Chart settings/Appearance/Background' field."
     *
     * There is no chart here, so the host declares it. The default is
     * TradingView's own light-theme background, `#ffffff`, which is a CHOICE
     * and not a fact about the run — a script that draws its own dark
     * dashboard will get black text out of `chart.fg_color` unless the host
     * says otherwise. That is why the setter exists.
     */
    public chartBgColor: string = "#ffffff";

    /** Declares the chart's background colour, for `chart.bg_color`. */
    public provideChartBackground(color: string): void {
        this.chartBgColor = String(color);
    }

    /**
     * The first and last VISIBLE bar times — `chart.left_visible_bar_time` and
     * `chart.right_visible_bar_time`.
     *
     * "chart.left_visible_bar_time returns the time of the leftmost bar
     *  currently visible on the chart."
     *
     * Visibility is a property of a viewport, and this engine has none: it runs
     * every bar it is given. So the visible range defaults to the WHOLE
     * dataset, which is what a script scanning "the bars on screen" would see
     * if the user had zoomed all the way out.
     *
     * Stated rather than hidden, because it changes results: a script that
     * counts bars between the two, or anchors a VWAP to the left edge, gets the
     * full history here and a window on TradingView. A host that knows the
     * viewport should declare it.
     */
    public visibleRange: { left: number; right: number } | null = null;

    /** Declares the visible bar range, in milliseconds. */
    public provideVisibleRange(leftTime: number, rightTime: number): void {
        this.visibleRange = { left: Number(leftTime), right: Number(rightTime) };
    }

    /** Opening time of the leftmost visible bar. */
    public get leftVisibleBarTime(): number {
        return this.visibleRange ? this.visibleRange.left : this.firstBarTime;
    }

    /** Opening time of the rightmost visible bar. */
    public get rightVisibleBarTime(): number {
        return this.visibleRange ? this.visibleRange.right : this.lastBarTime;
    }

    /**
     * Opening time of the FIRST bar seen, or 0 before any bar.
     *
     * Recorded on the first `setBar` rather than derived, because the Context
     * is fed one bar at a time and nothing else remembers where the run began.
     */
    public firstBarTime: number = 0;

    /**
     * Lines emitted by `log.info` / `log.warning` / `log.error` (v5).
     *
     * Kept on the Context rather than written to the console because they are
     * OUTPUT: scripts/common/make-log-harness.ts generates harnesses whose entire
     * result is a log line per bar, and a host has to be able to read them back
     * to reproduce locally what TradingView's Pine Logs pane shows.
     */
    public logs: LogEntry[] = [];

    /**
     * Wall-clock time reported by `timenow`, in ms.
     *
     * Settable so a backtest or replay is reproducible — reading Date.now()
     * inside the script would make two runs of the same data disagree.
     */
    public now: number = Date.now();

    public plots: Map<string, (PlotData | null)[]> = new Map();
    public fills: Map<string, (FillData | null)[]> = new Map();

    /**
     * v4 drawing objects — line, label, box, table — keyed by their generated id.
     *
     * A Map rather than an array so `line.delete(id)` is O(1) and ids stay
     * stable, which is what a host needs to diff one bar's drawings against the
     * next instead of re-rendering everything.
     *
     * These do NOT feed `plots`: a drawing is not a per-bar value, it is an
     * object with a lifetime. Nothing in the golden-parity suite reads them —
     * TradingView's exported chart data does not include drawings either.
     */
    public drawings: Map<string, Drawing> = new Map();
    private drawingCounter: number = 0;

    /** Live ids per kind, oldest first, so the cap below can evict in O(1). */
    private drawingOrder: Map<Drawing["kind"], string[]> = new Map();

    /**
     * How many drawings of each kind survive.
     *
     * Pine caps these — `max_lines_count`, `max_labels_count` and
     * `max_boxes_count` all default to 50 — and DELETES THE OLDEST past the
     * cap. Without that, `label.new` on every bar of a 6,000-bar chart retains
     * 6,000 records here while TradingView is showing 50, so a script that
     * reads its own drawings back diverges, and memory grows without bound on
     * exactly the scripts most likely to be long-running.
     *
     * Tables are absent deliberately: Pine limits them by POSITION (one per
     * slot), not by count, so an eviction rule would be the wrong shape.
     */
    private static readonly DRAWING_LIMITS: Partial<Record<Drawing["kind"], number>> = {
        line: 50,
        label: 50,
        box: 50,
        // Pine's default is 50 drawings of each kind, raised by
        // `max_polylines_count` and friends on the declaration statement.
        polyline: 50,
        linefill: 50,
    };

    /** Registers a drawing and returns its id, evicting the oldest past the cap. */
    public newDrawing(kind: Drawing["kind"], props: Record<string, any>): string {
        const id = `${kind}_${this.drawingCounter++}`;
        this.drawings.set(id, { id, kind, bar: this.currentBarIndex, props });

        const order = this.drawingOrder.get(kind) ?? [];
        order.push(id);

        const limit = Context.DRAWING_LIMITS[kind];
        if (limit !== undefined) {
            while (order.length > limit) {
                this.drawings.delete(order.shift()!);
            }
        }
        this.drawingOrder.set(kind, order);

        return id;
    }

    /**
     * Removes a drawing, keeping the eviction queue in step.
     *
     * Deleting straight out of `drawings` would leave the id in `drawingOrder`,
     * so the next eviction would shift off a dead id, delete nothing, and let
     * the live count sit above the cap indefinitely.
     */
    public deleteDrawing(id: any): void {
        const key = String(id instanceof Series ? id.valueOf() : id);
        const drawing = this.drawings.get(key);
        if (!drawing) return;

        this.drawings.delete(key);
        const order = this.drawingOrder.get(drawing.kind);
        if (order) {
            const at = order.indexOf(key);
            if (at >= 0) order.splice(at, 1);
        }
    }

    // --- v5 user-defined types and method-call syntax ---------------------
    //
    // Lives on the shared base for the same reason `var_def` does: the runtime
    // is one implementation across versions by design
    // (dev-docs/00-architecture-assessment.md §5.6), and only V5ToJsVisitor can
    // emit a call to any of it — no earlier version has a `type` keyword or the
    // `receiver.method()` form to reach it with.

    /**
     * Reads a field off a user-defined-type instance.
     *
     * Unwraps a Series first: a UDT instance held in a variable is wrapped by
     * `ctx.new_var` exactly as a number is, so `p.x` reaches this with the
     * wrapper rather than the object.
     *
     * A missing field, or a read through `na`, gives `na` rather than throwing.
     * Pine's type checker catches a misspelt field at COMPILE time and this
     * engine does not model field types, so throwing here would turn a
     * legitimate `na` object — the state every UDT variable starts in — into a
     * crash.
     */
    public field(target: any, name: string): any {
        const o = target instanceof Series ? target.valueOf() : target;
        if (o === null || o === undefined || typeof o !== "object") return NaN;
        const v = (o as any)[name];
        return v === undefined ? NaN : v;
    }

    /**
     * Writes a field on a user-defined-type instance, and returns the value.
     *
     * Writing through `na` is an ERROR, unlike reading. `p.x := 1` when `p` has
     * never been constructed cannot mean anything, and silently discarding the
     * write would leave a script that looks like it is accumulating state and
     * is not — the failure this engine exists to prevent.
     */
    public setField(target: any, name: string, value: any): any {
        const o = target instanceof Series ? target.valueOf() : target;
        if (o === null || o === undefined || typeof o !== "object") {
            throw new Error(
                `cannot set field '${name}': the object is na. Construct it first ` +
                `(e.g. 'p = Point.new()').`,
            );
        }
        (o as any)[name] = value instanceof Series ? value.valueOf() : value;
        return (o as any)[name];
    }

    /**
     * `obj.copy()` — a SHALLOW copy, which is what Pine specifies.
     *
     * Shallow matters: a UDT holding an array shares that array with its copy,
     * and a script relying on the opposite would diverge from TradingView.
     */
    public copyObject(target: any): any {
        const o = target instanceof Series ? target.valueOf() : target;
        if (o === null || o === undefined || typeof o !== "object") return NaN;
        if (o instanceof Map) return new Map(o);
        if (Array.isArray(o)) return o.slice();
        return { ...(o as object) };
    }

    /**
     * `receiver.name(args)` where `name` is a BUILT-IN method — v5's method-call
     * syntax for the collection and drawing namespaces.
     *
     * `a.push(1)` and `array.push(a, 1)` are the same call in Pine, and the
     * emitter cannot tell them apart statically: it does not track types, so it
     * does not know whether `a` is an array, a matrix or a map. The receiver
     * does know, at run time, so the dispatch happens here.
     *
     * A matrix is the one case a value cannot answer for itself — it is an
     * array of arrays, which is also a valid array — so `matrix.new` marks its
     * result. See `MATRIX_TAG` in runtime/v1/stdlib/matrix.ts.
     */
    public builtinMethod(id: string, receiver: any, name: string, ...args: any[]): any {
        const v = receiver instanceof Series ? receiver.valueOf() : receiver;

        const namespace = Context.receiverNamespace(v);

        // `copy` is the one method every kind answers, and each answers it
        // differently — a matrix copies its rows, an array and a map copy
        // themselves, and a user-defined type copies its fields. Only the value
        // knows which it is, so the split happens here rather than at emit time.
        //
        // A DRAWING is the case this got wrong. Its id is a string, so it is
        // neither an array nor a map and fell through to `copyObject`, which
        // sees a primitive, has no fields to clone and returns na. `label.copy`
        // is a real function that clones the drawing on the chart, so anything
        // with a namespace of its own is left to that namespace. TradingView's
        // `v5-language-matrices-20` deep-copies a matrix of labels through
        // `.copy()` and got a matrix of `na` back.
        if (name === "copy" && args.length === 0 && namespace === null) {
            return this.copyObject(v);
        }

        if (!namespace) {
            // The method spelling of the rule on `getDrawing` above: a drawing
            // accessor called on an absent drawing does nothing and reads `na`.
            // Only names that BELONG to a drawing namespace and to no
            // collection qualify, so `array.push` on an `na` array still fails
            // — which is what TradingView's own "Out of bounds index" demo
            // shows it doing.
            if (Context.isNa(v) && Context.drawingOnlyMethods().has(name)) return NaN;

            throw new Error(
                `'.${name}()' cannot be called on this value: it is ` +
                `${v === undefined || v === null || (typeof v === "number" && isNaN(v)) ? "na" : typeof v} ` +
                `and has no methods.`,
            );
        }

        const key = `${namespace}.${name}`;
        const entry = this.entryFor(key);
        if (!entry || entry.is_value) {
            throw new Error(`'${namespace}' has no method '${name}'.`);
        }

        return this.call(`${key}${id}`, entry.ref, v, ...args);
    }

    /**
     * Method names only the DRAWING namespaces answer.
     *
     * Derived from the registry rather than listed, so a drawing member added
     * later is covered and a name a collection also spells — `copy`, `get`,
     * `set` — is not. Which of `line` and `box` a name belongs to does not
     * matter here: the call is a no-op either way.
     */
    private static drawingOnly: ReadonlySet<string> | null = null;
    private static drawingOnlyMethods(): ReadonlySet<string> {
        if (Context.drawingOnly) return Context.drawingOnly;
        const DRAWING = ["line", "label", "box", "table", "polyline", "linefill"];
        const OTHER = ["array", "map", "matrix", "str"];
        const memberOf = (roots: string[]): Set<string> => {
            const out = new Set<string>();
            for (const key of Object.keys(REGISTRY)) {
                const dot = key.indexOf(".");
                if (dot > 0 && roots.includes(key.slice(0, dot))) out.add(key.slice(dot + 1));
            }
            return out;
        };
        const others = memberOf(OTHER);
        Context.drawingOnly = new Set([...memberOf(DRAWING)].filter(n => !others.has(n)));
        return Context.drawingOnly;
    }

    /** Which built-in namespace owns this value's methods, or null. */
    private static receiverNamespace(v: any): string | null {
        if (v instanceof Map) return "map";
        if (Array.isArray(v)) return (v as any)[MATRIX_TAG] ? "matrix" : "array";
        if (typeof v === "string") {
            const kind = /^(line|label|box|table|polyline|linefill)_\d+$/.exec(v);
            if (kind) return kind[1];
            return "str";
        }
        return null;
    }

    /** Looks a drawing up, or throws — a stale id is a bug, not a no-op. */
    /**
     * Titles of every `enum` member this script declares, keyed by the member's
     * own value — `"OscType.rsi"` → `"Relative Strength Index"`.
     *
     * ── Why a member is a STRING and not an object ──────────────────────────
     *
     * Because `==` has to work, and the emitter emits JavaScript `==`. A script
     * variable holds a Series, so `x == OscType.rsi` compares a Series to the
     * member; JavaScript coerces an object against a PRIMITIVE via `valueOf`
     * and compares two OBJECTS by reference, so a member object would have made
     * every such comparison false — silently, on every bar.
     *
     * A string carries the enum name as a prefix, which keeps the rule the
     * manual states: "Scripts cannot compare members of different enums ... even
     * if the fields have identical names and titles." `A.up` and `B.up` are
     * different strings.
     *
     * The TITLE cannot live in the member for the same reason, so it lives here
     * — read back by `str.tostring`, which the manual calls "the only way to
     * retrieve its title".
     */
    public enumTitles: Map<string, string> = new Map();

    /** Members of each enum, in declaration order — what a dropdown lists. */
    public enumMembers: Map<string, string[]> = new Map();

    /**
     * Records an enum declaration and returns its member table.
     *
     * Called once per bar from the emitted script, and idempotent: re-recording
     * the same titles is a no-op, and the table it returns holds the same
     * STRINGS every time, which is what makes `==` work across bars.
     */
    public declareEnum(name: string, titles: Record<string, string>): Record<string, string> {
        const table: Record<string, string> = {};
        const members: string[] = [];
        for (const [field, title] of Object.entries(titles)) {
            const member = `${name}.${field}`;
            table[field] = member;
            members.push(member);
            this.enumTitles.set(member, title);
        }
        this.enumMembers.set(name, members);
        return table;
    }

    /** The title of an enum member, or undefined when the value is not one. */
    public enumTitle(value: any): string | undefined {
        return typeof value === "string" ? this.enumTitles.get(value) : undefined;
    }

    /**
     * Every live drawing of one kind, oldest first — `polyline.all`,
     * `linefill.all`, `label.all`.
     *
     * Reads the EVICTION QUEUE rather than filtering `drawings`, so the order
     * is the one Pine documents (creation order) and deleted ids are already
     * gone from it.
     */
    public drawingIds(kind: Drawing["kind"]): string[] {
        return [...(this.drawingOrder.get(kind) ?? [])];
    }

    /** `na`, in the sense every drawing accessor has to answer to. */
    private static isNa(v: any): boolean {
        return v === null || v === undefined || (typeof v === "number" && Number.isNaN(v));
    }

    /**
     * A stand-in drawing for an `na` id: writes are discarded, reads are `na`.
     *
     * ── Why an na id is not an error ────────────────────────────────────────
     *
     * Because TradingView's own examples depend on it, on three separate pages.
     *
     *   `v5-concepts-lines-and-boxes-02` declares `var line periodLine = na`
     *   and calls `line.set_color(periodLine, finalColor)` on the first period
     *   change — before anything has been assigned to it. Its OTHER branch is
     *   guarded with `else if not na(periodLine)`, so the author knew the value
     *   could be absent and did not guard the branch where it always is.
     *
     *   `v5-language-loops-17` fills an array with `array.new<line>(20)` — 20
     *   `na` lines — and immediately loops `for pivotLine in pivotLines`
     *   reading `pivotLine.get_x2()`.
     *
     *   `v4-essential-drawings-12` and `-14` are the published Pivot Points
     *   indicators: three `var line ... = na` declarations and a block that
     *   moves them before the first assignment.
     *
     * All four ran on TradingView, so a setter on an absent drawing does
     * nothing and a getter on one returns `na`. Modelling that here rather than
     * at each of the forty call sites keeps `getDrawing`'s contract — "hand me
     * the record" — and makes a STALE id still an error, which it is.
     *
     * Fresh each time, so a discarded write can never be read back.
     */
    private static naDrawing(): Drawing {
        const scratch: Record<string, any> = { cells: new Map() };
        return {
            id: "na", kind: "line", bar: -1,
            props: new Proxy(scratch, {
                get: (t, k) => (k in t ? t[k as string] : NaN),
                set: () => true,
            }),
        };
    }

    public getDrawing(id: any, fn: string): Drawing {
        const raw = id instanceof Series ? id.valueOf() : id;
        if (Context.isNa(raw)) return Context.naDrawing();

        const key = String(raw);
        const drawing = this.drawings.get(key);
        if (!drawing) throw new Error(`${fn}: no such drawing '${key}' (it may have been deleted)`);
        return drawing;
    }

    // NEW: Barstate Flags (Required for barstate.ts getters)
    public is_history: boolean = true;
    public is_realtime: boolean = false;
    public is_new: boolean = true;
    public is_last: boolean = false;

    // 5. Strategy State (Public)
    public position: Position = { size: 0, avgPrice: 0 };

    /** Bar timestamp by bar index — see the note where it is written. */
    public barTimes: number[] = [];

    /** The bar a timestamp falls on, or NaN when no bar has carried it. */
    public barIndexOfTime(time: number): number {
        const at = this.barTimes.indexOf(time);
        return at < 0 ? NaN : at;
    }
    public cash: number = DEFAULT_INITIAL_CAPITAL;

    /**
     * Host overrides for the `strategy()` / `indicator()` declaration.
     *
     * TradingView's settings dialog lets a user change a strategy's starting
     * capital or pyramiding without editing the script, and a host needs the
     * same. They are consulted by `declareScript`, which is the only moment
     * they can take effect: `cash` moves with the first fill, so seeding it
     * afterwards would backdate money the broker has already spent.
     *
     * A key absent here means "use whatever the script declared".
     */
    public propertyOverrides: Record<string, any> = {};

    /**
     * What the SCRIPT declared, before any host override.
     *
     * Kept apart so a settings panel can offer "reset to the script's value"
     * — reading it back off the Context afterwards returns the override, which
     * would make the reset button restore the thing it was resetting from.
     */
    public declaredProperties: Record<string, any> = {};

    /**
     * The equity the strategy started with, for `strategy.initial_capital`.
     *
     * Held separately from `cash`, which moves with every fill — the two are
     * equal only until the first trade closes, and the difference between them
     * IS the realised profit.
     *
     * Set from `strategy(initial_capital = ...)` by declareScript().
     */
    public initialCapital: number = DEFAULT_INITIAL_CAPITAL;
    public trades: Trade[] = [];
    public orders: any[] = [];

    /**
     * Market orders placed on this bar, waiting for the next bar's open.
     *
     * `setBar` drains it; see MarketOrder in ./stdlib/strategy.ts for why a
     * market order does not fill on the bar that places it.
     */
    public marketOrders: MarketOrder[] = [];

    // --- INPUT SYSTEM ---
    public inputDefs: InputDef[] = []; 
    public userInputs: Record<string, any> = {}; 
    private inputCounter: number = 0; // Tracks input execution order
    
    // 6. Built-in Constants
    public opsv2_na: number = NaN;

    // 7. Script Metadata (set by study()/strategy() directive)
    public scriptMeta: ScriptMeta | null = null;

    // 8. Multi-timeframe / security() (P1)
    // Back-reference to the VM sandbox, so security() can rebind global series to
    // a sub-context while evaluating its HTF expression (set by initializeSandbox).
    public __sandbox: any = null;
    // Provided higher-timeframe candle windows, keyed by `${symbol}@${resolution}`.
    private securityData: Map<string, SecurityCandle[]> = new Map();
    // Per-call-site HTF evaluation state (sub-context + cursor). Deliberately NOT
    // part of `states`: it must survive live-tick rollback unchanged (HTF data
    // doesn't roll back when the LTF forming bar re-ticks).
    private htfStates: Map<string, any> = new Map();
    // (symbol, resolution) pairs requested but not yet supplied — the session layer
    // fulfils these via the data-request pull protocol.
    public requestedSecurities: Set<string> = new Set();

    /**
     * The language profile this script runs under. Drives version-dependent
     * runtime behaviour: banned identifiers (`bar_index` vs `n`) and the
     * security() lookahead default.
     *
     * profiles/ depends only on version.ts and nothing in runtime/, so this
     * import direction introduces no cycle.
     */
    public readonly profile: LanguageProfile;

    constructor(profile: LanguageProfile = DEFAULT_PROFILE) {
        this.profile = profile;
        this.initBaseSeries();
    }

    private initBaseSeries() {
        this.new_var("opsv2_open", NaN);
        this.new_var("opsv2_high", NaN);
        this.new_var("opsv2_low", NaN);
        this.new_var("opsv2_close", NaN);
        this.new_var("opsv2_volume", NaN);
        this.new_var("opsv2_time", NaN);
        this.new_var("opsv2_bar_index", 0);
    }

    /**
     * Resets the entire execution environment for a new pass.
     * Crucially, preserves `inputDefs` and `userInputs`.
     */
    public reset() {
        // 1. Reset Execution State
        this.callStack = [];
        this.states.clear();
        this.inputCounter = 0;
        // A `var` initialiser must run again on a fresh pass, or a re-run would
        // carry the previous pass's value in and never re-evaluate it.
        this.varInitialised.clear();
        this.varipSeries.clear();

        // 2. Reset Registry & Re-initialize built-ins
        this.vars.clear();
        this.initBaseSeries();

        // 3. Reset Market Data
        this.time = 0;
        this.open = 0;
        this.high = 0;
        this.low = 0;
        this.close = 0;
        this.volume = 0;

        // 4. Reset Engine Output State
        this.currentBarIndex = 0;
        this.plots.clear();
        this.fills.clear();
        // Drawings are output too. Leaving them behind made `run()` accumulate
        // every drawing from every pass, with ids climbing across re-runs.
        this.drawings.clear();
        this.drawingOrder.clear();
        this.drawingCounter = 0;
        // Logs are output for the same reason drawings are: a second pass that
        // inherited the first's lines would report every bar twice.
        this.logs = [];
        // A seeded random stream restarts too, or a re-run of the same script
        // over the same bars would draw different numbers — which is precisely
        // what a seed exists to prevent.
        this.randomStreams.clear();

        // 5. Reset Strategy State
        this.position = { size: 0, avgPrice: 0 };
        this.barTimes = [];
        this.cash = DEFAULT_INITIAL_CAPITAL;
        this.initialCapital = DEFAULT_INITIAL_CAPITAL;
        this.trades = [];
        this.orders = [];
        this.marketOrders = [];

        // 6. Reset Script Metadata (re-declared on the next pass)
        this.scriptMeta = null;

        // 7. Reset live-tick baseline, and every per-pass tracker with it.
        //    `repeatableCalls` goes too: a second pass is a second script run,
        //    and carrying its snapshots over would restore a site from the
        //    previous run's inputs.
        this.committedSnapshot = null;
        this.forgetBarProgress();
        this.everReached.clear();
        this.statefulSites.clear();
        this.stateKeysBySite.clear();

        // 8. Reset MTF eval state (keep provided securityData — it's supplied input)
        this.htfStates.clear();
        this.requestedSecurities.clear();
    }

    /**
     * Records the script's `study()` / `strategy()` directive metadata.
     * Called from transpiled code; positional args are mapped to named params
     * in directive-declaration order, with keyword args (prefix-stripped) taking
     * precedence. Idempotent across bars.
     */
    public declareScript(kind: ScriptKind, positional: any[] = [], kwargs: Record<string, any> = {}): void {
        const unwrap = (x: any): any =>
            x !== null && x !== undefined && typeof x.valueOf === 'function' ? x.valueOf() : x;

        // Strip the emitter prefix from keyword keys (e.g. "opsv2_overlay" -> "overlay").
        const named: Record<string, any> = {};
        for (const [k, v] of Object.entries(kwargs)) {
            named[k.startsWith(PREFIX) ? k.slice(PREFIX.length) : k] = v;
        }

        const order = kind === 'strategy'
            ? ['title', 'shorttitle', 'overlay', 'pyramiding', 'calc_on_every_tick', 'calc_on_order_fills', 'currency']
            : ['title', 'shorttitle', 'overlay', 'precision'];

        /** What the script itself passed, ignoring any host override. */
        const declared = (name: string): any => {
            if (named[name] !== undefined) return unwrap(named[name]);
            const idx = order.indexOf(name);
            return idx >= 0 && idx < positional.length ? unwrap(positional[idx]) : undefined;
        };

        const arg = (name: string): any => {
            // A host override outranks the script, which is what makes the
            // settings dialog able to change a backtest without an edit.
            if (this.propertyOverrides[name] !== undefined) return this.propertyOverrides[name];
            return declared(name);
        };

        const title = arg('title') !== undefined ? String(arg('title')) : '';
        const shorttitle = arg('shorttitle') !== undefined ? String(arg('shorttitle')) : title;
        const overlay = arg('overlay') !== undefined ? Boolean(arg('overlay')) : false;

        // `indicator` is v5's spelling of `study` — one branch serves both, and
        // testing for 'strategy' rather than for 'study' is what keeps the new
        // spelling from silently falling into the strategy branch and being
        // given a pyramiding setting it never declared.
        if (kind !== 'strategy') {
            this.scriptMeta = {
                kind, title, shorttitle, overlay,
                precision: arg('precision') !== undefined ? Number(arg('precision')) : undefined,
            };
        } else {
            this.scriptMeta = {
                kind, title, shorttitle, overlay,
                pyramiding: arg('pyramiding') !== undefined ? Number(arg('pyramiding')) : 0,
                calc_on_every_tick: Boolean(arg('calc_on_every_tick')),
                calc_on_order_fills: Boolean(arg('calc_on_order_fills')),
                currency: arg('currency') !== undefined ? String(arg('currency')) : undefined,
            };

            // The broker's starting balance, which until now was read from
            // `strategy()` and thrown away — a script declaring
            // `initial_capital = 1000` was still backtested on 1,000,000, and
            // every percentage it reported was wrong by the ratio.
            //
            // `cash` moves with the first fill, so it can only be seeded here,
            // before the script's first bar.
            const capital = arg('initial_capital');
            if (capital !== undefined && Number.isFinite(Number(capital))) {
                this.initialCapital = Number(capital);
                this.cash = Number(capital);
            }

            // Recorded before any override so a host can offer the script's
            // own value back.
            const declaredCapital = declared('initial_capital');
            this.declaredProperties.initial_capital =
                declaredCapital !== undefined && Number.isFinite(Number(declaredCapital))
                    ? Number(declaredCapital)
                    : DEFAULT_INITIAL_CAPITAL;
            this.declaredProperties.pyramiding =
                declared('pyramiding') !== undefined ? Number(declared('pyramiding')) : 0;
        }
    }

    // Helper to register an input during dry_run and retrieve value during real run
    /**
     * @param meta the input's CONSTRAINTS and grouping — `minval`, `maxval`,
     *        `step`, `options`, `tooltip`, `inline`, `group`, `confirm`,
     *        `display`. Recorded on the definition so a host can render the
     *        control, and the numeric three are ENFORCED on the value below.
     *
     *        They used to be accepted and thrown away, on the reasoning that a
     *        constraint the engine does not enforce is worse than no constraint.
     *        The reasoning was right and the conclusion was not: the answer is
     *        to enforce it. `minval` appears on seventeen of TradingView's own
     *        examples and `options` restricts an input to a fixed set, and a
     *        user override outside either was being taken at face value.
     */
    public registerInput(
        defval: any, title: string = "", type: string = "float",
        meta: Record<string, any> = {},
    ): any {
        const currentId = `input_${this.inputCounter++}`;

        // If it's the dry run (first time seeing this), save the definition
        if (this.inputDefs.length < this.inputCounter) {
            this.inputDefs.push({
                id: currentId,
                defval,
                title: title || currentId,
                type,
                ...meta,
            });
        }

        // Return user override if it exists, otherwise return the default
        const raw = currentId in this.userInputs ? this.userInputs[currentId] : defval;
        return Context.constrainInput(raw, meta);
    }

    /** Clamp to `minval`/`maxval` and fall back to the default outside `options`. */
    private static constrainInput(value: any, meta: Record<string, any>): any {
        const options = meta.options;
        if (Array.isArray(options) && options.length > 0 && !options.includes(value)) {
            return options.includes(meta.defval) ? meta.defval : options[0];
        }
        if (typeof value !== "number" || Number.isNaN(value)) return value;
        let out = value;
        if (typeof meta.minval === "number" && out < meta.minval) out = meta.minval;
        if (typeof meta.maxval === "number" && out > meta.maxval) out = meta.maxval;
        return out;
    }

    /**
     * SMART CALL EXECUTION
     * Handles:
     * 1. Registry Lookup (Values vs Functions)
     * 2. Context Injection
     * 3. Keyword Argument Resolution (kwargs)
     */
    /**
     * How the CURRENT call was written: which parameters the caller named, and
     * how many arguments it passed positionally.
     *
     * `call` flattens keyword arguments into the positional array below, which
     * is what a JavaScript function can receive — and that flattening throws
     * away the one thing an OVERLOADED built-in needs. `line.new` has two
     * published signatures, the registry holds one, and which slot a value
     * belongs to depends on whether the caller wrote it as `width = 3` or as
     * the fifth thing in the list. See `pointTail` in stdlib/drawings.ts.
     *
     * Set for the duration of one call and restored afterwards, so a built-in
     * that calls another does not read its caller's shape.
     */
    public keywordArguments: ReadonlySet<string> = new Set();

    /** How many arguments the caller passed before any keyword. */
    public positionalArguments: number = 0;

    /**
     * Resolve a trailing keyword bundle against a parameter list.
     *
     * The same rule the built-in path applies, over names the emitter supplies
     * rather than names the registry does. A gap is left `undefined` so the
     * emitted function's own JavaScript default takes over, which is how a
     * Pine parameter default is expressed.
     */
    private bindKeywordArguments(args: any[], params: string[], fname: string): any[] {
        const last = args[args.length - 1];
        const isBundle = last && typeof last === 'object' && !Array.isArray(last)
            && !(last instanceof Series) && last.constructor === Object
            && Object.keys(last).length > 0
            && Object.keys(last).every(k => k.startsWith(PREFIX));
        if (!isBundle) return args;

        const out = args.slice(0, -1);
        for (const [key, value] of Object.entries(last)) {
            const name = removePrefix(key);
            const index = params.indexOf(name);
            // Recorded, not guessed at: a keyword the signature does not name
            // is the same class of silence the built-in path tracks.
            if (index === -1) { this.droppedArguments.add(`${fname}(${name})`); continue; }
            while (out.length <= index) out.push(undefined);
            out[index] = value;
        }
        return out;
    }

    public call(id: string, fn: Function, ...args: any[]) {
        // DIAGNOSTIC: If this triggers, the transpiler passed a null function reference
        if (typeof fn !== 'function') {
            throw new TypeError(`[Context.call] Execution error for ID "${id}": The provided reference is not a function. Check if the function exists in the stdlib.`);
        }

        const identity = id; 
        this.callStack.push(identity);

        // A USER function's frame opens a series namespace; a built-in's does
        // not, because a built-in holds its state in a closure rather than in
        // `vars`. The emitter names every user function `<prefix>$fn_<name>`
        // and puts that name in the call id, which is what makes the two
        // tellable apart here.
        const userFrame = id.includes("$fn_");
        if (userFrame) {
            this.seriesScopes.push(this.seriesScope);
            this.seriesScope = `${this.seriesScope}${identity}|`;
        }

        // A BUILT-IN reached again on one bar overwrites that bar's slot
        // rather than appending a second one — see `barStateSnapshot`. User
        // frames are excluded: that is the rule for a series function's own
        // history, and a user function is an ordinary call that may
        // legitimately return two different things on one bar.
        const siteKey = userFrame ? "" : this.callStack.join("/");
        if (siteKey) {
            if (this.reachedAtBar.get(siteKey) === this.currentBarIndex) {
                this.restoreCallState(siteKey);
            } else {
                this.reachedAtBar.set(siteKey, this.currentBarIndex);
                // Every site that owns series state gets a rollback point on
                // every bar, whether or not it has ever repeated.
                //
                // An earlier version took one only after a site had been SEEN
                // to repeat, to save the clone. That left a site which runs
                // singly for a while and only later starts repeating — a loop
                // whose bound grows — with no rollback point on the bar it
                // first repeats on. For a recursive state (`ema`, `rma`, `cum`,
                // `sar`) that bar's extra advance never washes out, so the
                // error was permanent rather than one bar wide.
                //
                // A site that has run and never asked for state is skipped,
                // which is what makes this affordable: the stateless builtins
                // are the ones called in bulk.
                if (!this.everReached.has(siteKey)) {
                    this.everReached.add(siteKey);
                    this.snapshotCallState(siteKey, id);
                } else if (this.statefulSites.has(siteKey)) {
                    this.snapshotCallState(siteKey, id);
                }
            }
        }

        try {
            const fname = removePrefix(extractFunctionName(id)); 
            const entry = this.entryFor(fname);

            // 1. Check if the entry exists. If not, we default to standard call (fail-safe)
            if (!entry) {
                // A USER-DEFINED function. The built-in registry knows nothing
                // about it, so its parameter names come from the emitter, which
                // records them on the function as `__params`.
                //
                // Without this the keyword bundle was handed to the function as
                // the next POSITIONAL argument, so
                //
                //     averages.toTable(header = headerText, textSize = txtSize)
                //
                // — TradingView's own published maps example — put `{header:…}`
                // into `position` and returned `na`. No error: the script simply
                // drew nothing, and every value that depended on it was `na`.
                const params: unknown = (fn as any).__params;
                if (Array.isArray(params) && params.length > 0) {
                    return fn(...this.bindKeywordArguments(args, params as string[], fname));
                }
                // If we don't have metadata, we assume it's a standard JS function call
                return fn(...args);
            }

            // 2. Protect Static Values
            if (entry.is_value) {
                throw new Error(`TypeError: '${fname}' is a value, not a function. You cannot call it.`);
            }

            // 3. Handle Keyword Arguments
            //
            // A kwargs bundle is a plain object whose keys are ALL emitter-
            // prefixed — `{ opsv2_title: "x" }` — which is what `visitKw_args`
            // produces and what nothing else does.
            //
            // Shape alone is not enough, and the difference is not academic. A
            // `chart.point` is `{index, time, price}` and a user-defined type
            // instance is `{__type, …fields}`; both are plain objects, so
            //
            //     array.from(chart.point.from_index(0, 1), chart.point.from_index(1, 2))
            //
            // treated its SECOND point as keyword arguments and built a
            // one-element array. No error — just a polyline with half its
            // coordinates.
            const lastArg = args[args.length - 1];
            const looksLikeBundle = lastArg && typeof lastArg === 'object' && !Array.isArray(lastArg)
                            && !(lastArg instanceof Series) && lastArg.constructor === Object;
            const bundleKeys = looksLikeBundle ? Object.keys(lastArg) : [];
            const hasKwargs = looksLikeBundle
                            && bundleKeys.length > 0
                            && bundleKeys.every(k => k.startsWith(PREFIX));

            let finalArgs = args;
            const namedHere = new Set<string>();
            let positionalHere = args.length;

            if (hasKwargs) {
                const positionalArgs = args.slice(0, -1);
                const kwargs = lastArg;
                positionalHere = positionalArgs.length;

                if (entry.args.length > 0) {
                    finalArgs = [...positionalArgs];
                    const params = entry.args; 
                    
                    for (const [_key, val] of Object.entries(kwargs)) {
                        const cleanKey = removePrefix(_key); 
                        const index = params.indexOf(cleanKey);
                        // A keyword the signature does not name is DROPPED, and
                        // silence is how that class of bug stayed hidden:
                        // `strategy.entry(when = …)` fired unconditionally,
                        // `input.int(minval = 1)` clamped nothing, `bgcolor(title
                        // = …)` named nothing, `plot(offset = …)` did not shift.
                        // Recording it makes the class visible — the corpus
                        // execution suite asserts this set is empty across 742
                        // scripts, so a signature that falls behind is caught
                        // rather than quietly ignoring what it is handed.
                        if (index === -1) this.droppedArguments.add(`${fname}(${cleanKey})`);
                        else namedHere.add(cleanKey);
                        
                        if (index !== -1) {
                            while (finalArgs.length <= index) {
                                finalArgs.push(undefined);
                            }
                            finalArgs[index] = val;
                        }
                    }
                } else {
                    finalArgs = positionalArgs; 
                }
            }

            // 4. Execute with Context Injection
            // We use the entry's 'ref' as a backup if 'fn' passed from the VM is wonky,
            // but primarily we use the 'fn' passed by the transpiled code.
            const outerNamed = this.keywordArguments;
            const outerPositional = this.positionalArguments;
            this.keywordArguments = namedHere;
            this.positionalArguments = positionalHere;
            try {
                if (entry.uses_context) {
                    return fn(this, ...finalArgs);
                } else {
                    return fn(...finalArgs);
                }
            } finally {
                this.keywordArguments = outerNamed;
                this.positionalArguments = outerPositional;
            }

        } finally {
            if (userFrame) this.seriesScope = this.seriesScopes.pop()!;
            this.callStack.pop();
        }
    }

    /**
     * Resolves a built-in by name straight from the registry.
     *
     * Pine keeps functions and variables in separate namespaces, so
     * `sma = sma(close, 10)` is legal and common. The emitted JavaScript has no
     * such separation: `let opsv2_sma = ...` shadows the sandbox binding, and
     * the call inside its own initialiser saw the variable (undefined) instead
     * of the function. The transpiler routes shadowed built-in callees here.
     */
    /**
     * The stdlib entry for `name` AT THIS SCRIPT'S VERSION.
     *
     * `REGISTRY` is deliberately the union of every version's view, so a few
     * names carry two meanings in it and the union's last writer decides which
     * one survives. `float`, `bool` and `string` are the v1–v3 `input()` type
     * CONSTANTS and v4's casting FUNCTIONS; `session` is a v1–v3 constant and a
     * v5 namespace. Reading the union directly handed a v4 script the string
     * "float" where it had called `float(na)` — "[Context.call] ... The
     * provided reference is not a function".
     *
     * This is the preference `createStdlib` already applies to the sandbox,
     * applied to the CALL path as well. Falling back to the union keeps a name
     * the view does not carry resolvable: the transpiler has already decided
     * what a script may spell, and the runtime is not the place to refuse a
     * second time.
     */
    private entryFor(name: string) {
        return viewFor(this.profile.version)[name] ?? REGISTRY[name];
    }

    public builtin(name: string): any {
        return this.entryFor(name)?.ref;
    }

    /**
     * `and` over operands that have ALREADY been evaluated.
     *
     * Pine does not short-circuit, so the emitter passes every operand as an
     * argument and lets JavaScript's own evaluation order do the work. The
     * body is trivial on purpose: all the meaning is in the call having
     * happened at all. See visitAnd_expr in transpiler/v1/ToJsVisitor.ts.
     */
    public allOf(...operands: boolean[]): boolean {
        for (const o of operands) if (!o) return false;
        return true;
    }

    /** `or` over operands that have already been evaluated. See `allOf`. */
    public anyOf(...operands: boolean[]): boolean {
        for (const o of operands) if (o) return true;
        return false;
    }

    /** Call sites that have run at least once, ever. */
    private everReached: Set<string> = new Set();

    /**
     * Call sites that own series state, learned the first time one asks for it.
     *
     * A site that has run and never asked — `hl2`, `math.abs`, `array.get` —
     * has nothing to roll back, so it is skipped entirely. Without this every
     * stateless call took the snapshot path on every bar.
     */
    private statefulSites: Set<string> = new Set();

    /**
     * State keys at or beneath each call site, so a rollback does not have to
     * scan every state in the run to find the handful it owns.
     *
     * A built-in may call another through `ctx.call` — `ta.stoch` delegates to
     * `ta.highest` — and the nested state hangs below the outer site's key, so
     * rolling the outer one back has to take the inner ones with it.
     */
    private stateKeysBySite: Map<string, Set<string>> = new Map();

    /**
     * The bar each call site was last reached on.
     *
     * Keyed by bar INDEX rather than cleared by `setBar`, so the rule holds
     * for any host that advances `currentBarIndex` — including the TA
     * differential suites, which drive the stdlib directly and never call
     * `setBar` at all.
     */
    private reachedAtBar: Map<string, number> = new Map();

    /**
     * Rollback points for the sites in `repeatableCalls`, taken at their first
     * reach of the bar, and dropped by `forgetBarProgress` when the bar moves
     * on or is re-run. The per-entry `bar` is still checked, because a host
     * may drive the stdlib directly and never call `setBar` at all.
     *
     * ── One slot per BAR, not one per call ─────────────────────────────────
     *
     * A series function's history has one slot per bar. Reaching its call site
     * again on the same bar OVERWRITES that bar's slot rather than appending a
     * second one, and the value returned is the one including whatever was
     * just written. Earlier bars keep whatever their LAST reach wrote.
     *
     * That one rule accounts for every loop probe TradingView has answered:
     *
     *   - Same arguments every reach (the loops export): each reach writes the
     *     same value into the same slot, so all three reads agree and
     *     `loopEma / 3` equals a plain `ta.ema(close, 10)` on all 2,475 bars.
     *   - Different arguments (the loopargs export): each reach overwrites,
     *     and the three reads differ. Replaying this rule against that export
     *     reproduces TradingView on all 2,464 bars it reports, na-parity
     *     included — where "the first reach wins", "the last reach wins" and
     *     "each reach keeps its own history" each miss every single bar.
     *   - Never reached at all: nothing is written, so the history does not
     *     advance and the site goes STALE. `probe_call_inside_if` and
     *     `probe_ternary_both_arms` both confirm that, and it is why this is
     *     not symmetric with the two cases above.
     *
     * Overwriting is implemented as rollback-and-rerun, which is the same
     * thing from the outside and does not require every stateful built-in to
     * grow a re-entry path of its own.
     *
     * Which sites get one, and why not all of them, is at the call site in
     * `call()`.
     */
    private barStateSnapshot: Map<string, { bar: number; states: Map<string, any> }> = new Map();

    /**
     * Forgets everything scoped to ONE PASS over the current bar.
     *
     * Called at the top of `setBar`, which covers every bar and every re-tick
     * of a forming one, and again from `restoreSnapshot` so that rolling back
     * to a baseline restores this too. "One pass" includes the script's own
     * execution-order counters, not just the broker's bookkeeping.
     *
     * The two order guards are the subtle half. They are NOT part of
     * `captureSnapshot`, so a rollback restored the broker's position and its
     * pending orders while leaving the guards saying "already done for this
     * bar". Tick 2 then skipped both the market fills and the pending-order
     * matching, and the script saw a position that had already been closed.
     *
     * `repeatableCalls` deliberately survives: which sites repeat is learned
     * about the SCRIPT, not about the bar.
     */
    private forgetBarProgress(): void {
        this.reachedAtBar.clear();
        this.barStateSnapshot.clear();
        this._marketOrdersFilledBar = -1;
        (this as any)._ordersProcessedBar = undefined;

        // `input()` numbers its calls in execution order, and the script body
        // runs again on every bar, so the counter has to restart with it.
        //
        // It did not, and both consequences were silent. The ids drifted — the
        // same `input.int` was `input_0` on bar 0, `input_1` on bar 1 — so a
        // host's override, keyed by the id it was given, applied to the FIRST
        // BAR ONLY and every later bar silently used the default. And
        // `inputDefs` gained an entry per bar, so a 2,000-bar run reported
        // 2,000 inputs for a script with one.
        this.inputCounter = 0;
    }

    /** Every state entry belonging to `key` or nested beneath it. */
    private collectCallState(key: string): Map<string, any> {
        const out = new Map<string, any>();
        for (const k of this.stateKeysBySite.get(key) ?? []) {
            if (this.states.has(k)) out.set(k, this.states.get(k));
        }
        return out;
    }

    /** Remembers `key`'s state so a later reach on this bar can undo its own. */
    private snapshotCallState(key: string, id: string): void {
        const live = this.collectCallState(key);
        const copy = new Map<string, any>();
        for (const [k, v] of live) {
            try {
                copy.set(k, structuredClone(v));
            } catch {
                // Refusing beats rolling back half a state. A built-in whose
                // state holds something uncloneable cannot take part in this,
                // and silently skipping the rollback would make it wrong only
                // inside loops, which is the hardest place to notice.
                throw new Error(
                    `'${removePrefix(extractFunctionName(id))}' is reached more than ` +
                    `once on one bar, and its internal state cannot be rolled back ` +
                    `to the start of the bar. Hoist the call out of the loop.`,
                );
            }
        }
        this.barStateSnapshot.set(key, { bar: this.currentBarIndex, states: copy });
    }

    /** Puts `key` back as it was at the start of the bar. */
    private restoreCallState(key: string): void {
        const saved = this.barStateSnapshot.get(key);
        // A rollback point from an earlier bar is not a rollback point for
        // this one: the bar it belonged to has been committed.
        if (!saved || saved.bar !== this.currentBarIndex) return;
        for (const k of this.stateKeysBySite.get(key) ?? []) this.states.delete(k);
        for (const [k, v] of saved.states) this.states.set(k, structuredClone(v));
    }

    public getPersistentState<T>(initFn: () => T): T {
        const key = this.callStack.length > 0 ? this.callStack.join("/") : "global";

        // Index the key under its own site and every site it nests inside, so
        // `collectCallState` is a lookup rather than a scan.
        let prefix = "";
        for (const frame of this.callStack) {
            prefix = prefix ? `${prefix}/${frame}` : frame;
            this.statefulSites.add(prefix);
            let owned = this.stateKeysBySite.get(prefix);
            if (!owned) { owned = new Set(); this.stateKeysBySite.set(prefix, owned); }
            owned.add(key);
        }

        if (!this.states.has(key)) {
            this.states.set(key, initFn());
        }
        return this.states.get(key);
    }

    // --- v4 `var` / `varip` declarations ---------------------------------
    //
    // Lives on the shared base rather than in runtime/v4/ because the runtime is
    // one implementation across versions by design
    // (dev-docs/00-architecture-assessment.md §5.6). Only V4ToJsVisitor can emit
    // a call to it: v1–v3 have no `var` token, so their scripts cannot reach it.

    /** Declaration sites whose initialiser has already run, keyed by @L:C. */
    private varInitialised: Set<string> = new Set();

    /** Series declared `varip`, exempt from intra-bar rollback. */
    private varipSeries: Set<string> = new Set();

    /**
     * `var x = expr` — initialise ONCE, then persist across bars.
     *
     * The initialiser is passed as a thunk, not a value: `var x = expr` must not
     * evaluate `expr` after the first bar. Passing the value would evaluate it
     * every bar and throw the result away, which is invisible for `0.0` and
     * quite visible for `var count = count + 1` or anything with a side effect.
     *
     * Persistence re-stamps the LAST value onto the current bar, read from
     * `valueOf()` rather than `get(1)`. The two differ exactly when the variable
     * was last written on an earlier bar than the previous one — a `var` inside
     * a conditional block — where `get(1)` finds a hole and returns NaN while
     * `valueOf()` returns the value that is actually still held. Pine persists
     * the value, so `valueOf()` is the right question.
     *
     * Re-stamping every bar is also what makes `:=` work unchanged: it writes
     * the current bar's slot through `new_var`, and the next bar carries that
     * forward. No write-back path and no coupling to the assignment emitter.
     *
     * @param key  the declaration's @L<line>:C<col> site, so two DIFFERENT
     *             `var` declarations do not share an initialised flag.
     *
     * ── `var` inside a user function ────────────────────────────────────────
     *
     * Every call site gets its OWN `var`, which is what Pine does — "each
     * function call has its own instance of the series variables". Given
     *
     *     f() =>
     *         var c = 0
     *         c := c + 1
     *         c
     *     a = f()
     *     b = f()
     *
     * both `a` and `b` count 1,2,3.
     *
     * This was wrong for a long time, and the note that stood here explained
     * why keying the initialised flag on the call stack was not enough: the
     * SERIES NAME was shared too, so per-site flags only redistributed the
     * error. Both halves are now in place — `seriesScope` gives each frame its
     * own namespace in `vars`, and this method scopes the flag into the same
     * namespace — so `key` alone is the declaration SITE and the frame supplies
     * the instance.
     *
     * `varipSeries` is scoped with them, so a `varip x` in one frame and a
     * `var x` in another are no longer one series and no longer share an
     * exemption from rollback.
     */
    public var_def(name: string, key: string, initFn: () => any, ip: boolean = false): Series {
        // Both the series and the "has this site run yet" flag live in the
        // FRAME. The flag has to: `var c = 0` at one call site must not count
        // as initialised for another, or the second site would read the first
        // one's empty slot and get na forever.
        const scopedName = this.scoped(name);
        const scopedKey = this.scoped(key);
        if (ip) this.varipSeries.add(scopedName);

        if (this.varInitialised.has(scopedKey)) {
            const held = this.vars.get(scopedName);
            return this.new_var(name, held ? held.valueOf() : NaN);
        }

        this.varInitialised.add(scopedKey);
        return this.new_var(name, initFn());
    }

    // --- Series Management ---

    /**
     * Pine truthiness, for anything used as a CONDITION.
     *
     * ── Why this exists ─────────────────────────────────────────────────────
     *
     * `new_var` returns a Series, and in JavaScript EVERY object is truthy. So
     * a condition stored in a variable was permanently true:
     *
     *     up = close > open        // a Series wrapping true/false
     *     plot(up ? 1 : 0)         // 1 on every bar, forever
     *
     * Relational operators hid it — `close > open` coerces through valueOf() and
     * works — but `?:`, `if`, `and`, `or` and `not` use ToBoolean, which does not
     * consult valueOf(). Naming a condition and reusing it is how nearly every
     * published script is written, so every branch in them was taken.
     *
     * The corpus suite could not see this: a script whose conditions are all
     * true still runs and still plots finite numbers.
     *
     * ── The rule ────────────────────────────────────────────────────────────
     *
     * Unwrap first, then apply Pine's own conversion: `na` is false, 0 is false,
     * any other number is true. v1–v3 coerce numbers to bool freely (`isSunday()
     * and openPrice ? ...` is published v1), so this must accept numbers rather
     * than demand a bool.
     */
    public truthy(v: any): boolean {
        const x = v instanceof Series ? v.valueOf() : v;
        if (x === null || x === undefined) return false;
        if (typeof x === "number") return !Number.isNaN(x) && x !== 0;
        return Boolean(x);
    }

    /**
     * FACTORY: Creates or Updates a Series Object.
     */
    public new_var(name: string, val: any): Series {
        const key = this.scoped(name);
        let series = this.vars.get(key);
        
        if (!series) {
            series = new Series(this, key);
            this.vars.set(key, series);
        }

        let resolvedVal: any;
        
        if (val && typeof val.get === 'function' && typeof val.valueOf === 'function') {
             resolvedVal = val.valueOf();
        } else {
             resolvedVal = val;
        }

        return series.update(resolvedVal);
    }

    /**
     * FACTORY (Tuple): Handles assignments like [a, b] = func()
     */
    public new_vars(names: string[], values: any): Series[] {
        const vals = Array.isArray(values) ? values : [values];

        return names.map((name, index) => {
            if (index >= vals.length) return this.new_var(name, NaN);

            const raw = vals[index];
            const unwrapped = (raw !== null && raw !== undefined && typeof raw.valueOf === "function")
                ? raw.valueOf() : raw;

            // NON-NUMERIC ELEMENTS SURVIVE. `Number()` was applied to every
            // element, which is right for `[m, s, h] = macd(...)` and wrong for
            // a v4 tuple expression:
            //
            //     [price, currency] = security(sym, "D", [close, syminfo.currency])
            //
            // where the second element is a string and came out `na`.
            if (typeof unwrapped === "string" || typeof unwrapped === "boolean"
                || Array.isArray(unwrapped)) {
                return this.new_var(name, unwrapped);
            }

            const numVal = Number(unwrapped);
            return this.new_var(name, isNaN(numVal) ? NaN : numVal);
        });
    }

    /**
     * `for … in` — one iteration handle over an array, matrix or map.
     *
     * Yields `[key, value]` pairs. What those mean is the collection's business,
     * and the manual states each one:
     *
     *   array   "item ... holds sequential values or references from the
     *            specified collection_id" and index is "the index ... of the
     *            retrieved item"
     *   matrix  the item is a ROW array, and the index is "the row's position
     *            within the matrix"
     *   map     "the index contains the key, and item contains the associated
     *            value from each key-value pair"
     *
     * A matrix is represented as an array of row arrays, so it needs no branch
     * of its own here: iterating an array of rows already yields rows.
     *
     * ── The size rule is different for maps, so the code is too ──────────────
     *
     * "Scripts can modify the sizes of arrays and matrices directly within a
     *  for…in loop's local scope. When a for…in loop changes the size of a
     *  collection during an iteration, the loop's header uses the UPDATED size
     *  to control subsequent iterations."
     *
     * That is why the array branch re-reads `.length` every step instead of
     * capturing it once. A snapshot would run past the end of a shrunk array
     * and stop short of a grown one.
     *
     * "Attempting to add or remove a map's key-value pairs while looping
     *  through it with this structure typically causes a runtime error."
     *
     * So the map branch does the opposite: it takes the keys once and then
     * REFUSES a size change, rather than silently iterating a stale key list.
     * `arity` is how many loop variables the script wrote, which is what makes
     * the single-variable form on a map reportable — the manual's second form
     * is the only one maps accept.
     */
    public *forIn(collection: any, arity: number, at: string): Generator<[any, any]> {
        const c = collection && typeof collection.valueOf === "function"
            ? collection.valueOf()
            : collection;

        if (c instanceof Map) {
            if (arity !== 2) {
                throw new Error(
                    `for … in at ${at}: iterating a map needs two loop variables — ` +
                    `write 'for [key, value] in ...'.`,
                );
            }
            const size = c.size;
            for (const key of [...c.keys()]) {
                if (c.size !== size) {
                    throw new Error(
                        `for … in at ${at}: the map changed size during iteration. ` +
                        `Pine does not allow adding or removing key-value pairs inside ` +
                        `a for … in over the same map.`,
                    );
                }
                yield [key, c.get(key)];
            }
            return;
        }

        if (!Array.isArray(c)) {
            throw new Error(
                `for … in at ${at}: expected an array, matrix or map, got ` +
                `${c === undefined || c === null ? "na" : typeof c}.`,
            );
        }

        // `.length` re-read each step, deliberately — see above.
        for (let i = 0; i < c.length; i++) yield [i, c[i]];
    }

    /**
     * Universal History Accessor (Called by transpiled code: [])
     */
    public get(target: any, offset: number, id: string): number {
        // Case A: Series Object (Duck Typing check for speed)
        if (target && typeof target.get === 'function') {
            return target.get(offset);
        }

        // Case B: Raw Number (Expression) -> Fallback to Local History Lookup
        return this.getSeries(id, offset);
    }

    /**
     * Internal helper for fallback lookups
     */
    public getSeries(name: string, offset: number): number {
        // The frame first — a self-referential local (`s = nz(s[1]) + close`)
        // reaches this while its own `let` is still in the temporal dead zone,
        // and must find ITS instance rather than another call site's.
        const series = this.vars.get(this.scoped(name)) ?? this.vars.get(name);
        return series ? series.get(offset) : NaN;
    }

    public setBar(time: number, open: number, high: number, low: number, close: number, volume: number) {
        // A new bar — or a re-tick of this one — starts with nothing reached.
        this.forgetBarProgress();

        if (this.currentBarIndex === 0) this.firstBarTime = time;
        // Bar timestamps, indexed by bar. `strategy.closedtrades.*` records a
        // trade's entry and exit as TIMES, and the accessors report them as bar
        // indices, so one side has to be able to translate.
        this.barTimes[this.currentBarIndex] = time;
        // The bar itself, so `request.security()` on THIS symbol can be answered
        // from the chart's own series — see `getSecurityData`. Indexed rather
        // than pushed, so a re-tick of the same bar overwrites it.
        this.chartBars[this.currentBarIndex] = { time, open, high, low, close, volume };
        // 1. Update Public Props
        this.time = time;
        this.open = open;
        this.high = high;
        this.low = low;
        this.close = close;
        this.volume = volume;

        // 2. Update Series Objects
        this.new_var("opsv2_time", time);
        this.new_var("opsv2_open", open);
        this.new_var("opsv2_high", high);
        this.new_var("opsv2_low", low);
        this.new_var("opsv2_close", close);
        this.new_var("opsv2_volume", volume);
        this.new_var("opsv2_bar_index", this.currentBarIndex);

        // 4. Fill the market orders the previous bar placed.
        //
        // This is the only moment that is both AFTER this bar's open is known
        // and BEFORE the script reads `strategy.position_size`, which is what
        // makes it the right place — see MarketOrder in ./stdlib/strategy.ts.
        //
        // Guarded per bar because a realtime bar is re-ticked: without it the
        // same order would fill on every tick of the bar it fills on.
        if (this._marketOrdersFilledBar !== this.currentBarIndex) {
            this._marketOrdersFilledBar = this.currentBarIndex;
            fillMarketOrders(this);

            // 5. Then match the standing limit and stop orders against this
            //    bar's range.
            //
            // BEFORE the script runs, not after. A fill is applied by the time
            // the script next executes: TradingView's golden exits export
            // closes a bracket intrabar on bar 402 and the row logged at the
            // close of 402 already reports `position_size` 0 and
            // `closedtrades` incremented. Doing this in `finalizeBar` put
            // every such fill one row late.
            processPendingOrders(this, this.high, this.low);
        }
    }

    /** The bar `fillMarketOrders` last ran on, so a re-tick does not refill. */
    private _marketOrdersFilledBar: number = -1;

    // --- Plotting ---

    /**
     * Registers a pre-built PlotData object for the current bar.
     * Each ui.ts function constructs the correctly-typed variant.
     */
    /**
     * Strip the runtime wrapper off every field of a plot or fill record.
     *
     * `f = plot(...)` compiles to `ctx.new_var(...)`, so the plot id a script
     * hands to `fill()` arrives as a `Series`, not a string — and a `Series`
     * holds a back-reference to this Context, which holds the sandbox, which
     * holds every stdlib function. Storing one put the entire runtime inside
     * the render model: `structuredClone` threw, so `postMessage` threw, so
     * every script using `fill()` failed in any host that runs the engine in a
     * Worker or a backend — which is the architecture the integration guide
     * documents. The values were all correct; the model just could not leave
     * the process it was built in.
     *
     * The same applies to `plot(close, color = myColorVar)`, where the colour
     * is a declared variable rather than a literal.
     */
    private plainPlotData<T extends Record<string, any>>(data: T): T {
        const out: Record<string, any> = {};
        for (const [k, v] of Object.entries(data)) {
            out[k] = plainValue(v);
        }
        return out as T;
    }

    public registerPlot(data: PlotData) {
        data = this.plainPlotData(data);
        // 1. Get the Unique Call ID (Storage Key)
        // This ensures that "plot(close)" and "plot(open)" don't overwrite each other
        // just because they both default to title="Plot".
        const id = this.callStack.length > 0
            ? this.callStack[this.callStack.length - 1]
            : data.title;

        // 2. Use ID to retrieve the series
        let series = this.plots.get(id);

        if (!series) {
            series = [];
            this.plots.set(id, series);

            // Backfill history if this plot appears conditionally later in the script
            while (series.length < this.currentBarIndex) {
                series.push(null);
            }
        }

        // `offset` moves the value to a DIFFERENT BAR, which changes the series
        // rather than its appearance — "Shifts the plot to the left or right on
        // the chart. A negative value shifts it left, a positive one right." So
        // it is applied here, unlike the other display parameters, which this
        // engine records and does not render.
        const shift = Number((data as any).offset);
        const at = this.currentBarIndex + (Number.isFinite(shift) ? Math.trunc(shift) : 0);
        if (at < 0) return;                       // shifted off the left of the dataset
        while (series.length < at) series.push(null);
        if (series.length > at) {
            series[at] = data;
        } else {
            series.push(data);
        }
    }

    public registerFill(id1: any, id2: any, options: { color?: string, title?: string } = {}) {
        // See `plainPlotData`: a plot id reaches here as a Series whenever the
        // script stored it in a variable, which is the documented way to use
        // `fill()` at all.
        id1 = plainValue(id1);
        id2 = plainValue(id2);
        options = this.plainPlotData(options);
        const title = options.title || `Fill_${id1}_${id2}`;
        
        let series = this.fills.get(title);
        if (!series) {
            series = [];
            this.fills.set(title, series);
            while (series.length < this.currentBarIndex) {
                series.push(null);
            }
        }

        const data: FillData = {
            plotId1: id1,
            plotId2: id2,
            color: options.color || "#00000000",
            title: title
        };

        // `offset` moves the value to a DIFFERENT BAR, which changes the series
        // rather than its appearance — "Shifts the plot to the left or right on
        // the chart. A negative value shifts it left, a positive one right." So
        // it is applied here, unlike the other display parameters, which this
        // engine records and does not render.
        const shift = Number((data as any).offset);
        const at = this.currentBarIndex + (Number.isFinite(shift) ? Math.trunc(shift) : 0);
        if (at < 0) return;                       // shifted off the left of the dataset
        while (series.length < at) series.push(null);
        if (series.length > at) {
            series[at] = data;
        } else {
            series.push(data);
        }
    }

    public finalizeBar() {
        // Pending orders are NOT matched here. They are matched in `setBar`,
        // before the script runs — see the note there. Matching them at the
        // end of the bar reported every fill one row late, and matched an
        // order against the very bar that placed it.
        //
        // `processPendingOrders` is idempotent per bar, so a harness that
        // still calls it explicitly does not fill the same order twice.

        this.plots.forEach((series) => {
            if (series.length <= this.currentBarIndex) {
                series.push(null);
            }
        });
        this.fills.forEach((series) => {
            if (series.length <= this.currentBarIndex) {
                series.push(null);
            }
        });
        this.currentBarIndex++;
    }

    // --- Live-tick model (P3) ---

    /**
     * Applies a real-time tick to the forming (last) bar, per the control
     * protocol §7. The candle is an ABSOLUTE snapshot of the forming bar, not an
     * increment. On the first tick of a bar we capture the committed baseline; on
     * every later tick we roll back to it first, so re-evaluation never
     * double-counts accumulating state (e.g. `cum`, EMA `prev`, broker orders).
     *
     * The caller runs the compiled script after this, then reads provisional
     * output. Finalize with `commitBar()` when the bar closes.
     */
    public applyTick(time: number, open: number, high: number, low: number, close: number, volume: number) {
        if (this.committedSnapshot === null) {
            this.committedSnapshot = this.captureSnapshot(); // baseline = state after last commit
        } else {
            this.restoreSnapshot(this.committedSnapshot);    // roll back the previous tick
        }
        this.is_history = false;
        this.is_realtime = true;
        this.is_last = true;
        this.setBar(time, open, high, low, close, volume);
    }

    /**
     * Commits the forming bar permanently and advances. After this the next
     * `applyTick` re-captures a fresh baseline for the new forming bar.
     */
    public commitBar() {
        this.finalizeBar();
        this.committedSnapshot = null;
    }

    private captureSnapshot(): RuntimeSnapshot {
        const varMeta = new Map<string, SeriesSnapshot>();
        for (const [k, s] of this.vars) varMeta.set(k, s.snapshotMeta());
        const plotLens = new Map<string, number>();
        for (const [k, a] of this.plots) plotLens.set(k, a.length);
        const fillLens = new Map<string, number>();
        for (const [k, a] of this.fills) fillLens.set(k, a.length);

        return {
            states: structuredClone(this.states),
            varMeta,
            plotLens,
            fillLens,
            position: structuredClone(this.position),
            cash: this.cash,
            trades: structuredClone(this.trades),
            orders: structuredClone(this.orders),
            marketOrders: structuredClone(this.marketOrders),
            pendingEntries: structuredClone((this as any)._pendingEntries ?? new Map()),
            pendingExits: structuredClone((this as any)._pendingExits ?? new Map()),
            riskState: structuredClone((this as any)._riskState ?? null),
        };
    }

    private restoreSnapshot(s: RuntimeSnapshot) {
        // Part of restoring the baseline: per-bar progress is context state
        // like any other, and leaving it behind would say the bar had already
        // been worked on. `applyTick` calls `setBar` straight after this, which
        // clears it too — this is here so a restore is a complete restore, not
        // because that one is insufficient.
        this.forgetBarProgress();

        // Re-clone so the baseline stays pristine across repeated ticks.
        this.states = structuredClone(s.states);

        // `varip` is the whole point of this exemption: it is defined as "like
        // var, but retains its value between the updates of a real-time bar".
        // Rolling one back would make it identical to `var`, and the difference
        // between them is only ever observable here.
        for (const [k, meta] of s.varMeta) {
            if (this.varipSeries.has(k)) continue;
            this.vars.get(k)?.restoreTo(meta);
        }
        // Series created *after* the baseline are simply truncated to empty; the
        // upcoming re-run recreates and overwrites them.
        for (const [k, s2] of this.vars) {
            if (this.varipSeries.has(k)) continue;
            if (!s.varMeta.has(k)) s2.restoreTo({ len: 0, val: null, start: -1, fallback: null, locked: false });
        }
        for (const [k, len] of s.plotLens) {
            const a = this.plots.get(k); if (a) a.length = len;
        }
        for (const [k, len] of s.fillLens) {
            const a = this.fills.get(k); if (a) a.length = len;
        }
        this.position = structuredClone(s.position);
        this.cash = s.cash;
        this.trades = structuredClone(s.trades);
        this.orders = structuredClone(s.orders);
        this.marketOrders = structuredClone(s.marketOrders);
        (this as any)._pendingEntries = structuredClone(s.pendingEntries);
        (this as any)._pendingExits = structuredClone(s.pendingExits);
        (this as any)._riskState = structuredClone(s.riskState);
    }

    // --- Multi-timeframe / security() (P1) ---

    private secKey(symbol: string, resolution: string): string {
        return `${symbol}@${resolution}`;
    }

    /** Supplies HTF candles for a (symbol, resolution); called by the session layer. */
    public provideSecurityData(symbol: string, resolution: string, candles: SecurityCandle[]): void {
        this.securityData.set(this.secKey(symbol, resolution), candles);
        this.requestedSecurities.delete(this.secKey(symbol, resolution));
    }

    /**
     * Seeded pseudo-random state, one stream per seed.
     *
     * Held on the Context rather than in the stdlib module so that two Contexts
     * — a backtest and a re-run of it — do not share a stream, and so that
     * `reset()` restarts the sequence. A seeded run that changed its numbers
     * because something else had drawn from the generator first would not be
     * reproducible, which is the only thing a seed is for.
     */
    private randomStreams: Map<number, number> = new Map();

    /**
     * The next number in the stream for `seed`, in [0, 1).
     *
     * mulberry32 — small, fast, and with a period far beyond any chart. NOT
     * TradingView's generator, which is unpublished; see `math.random`.
     */
    public seededRandom(seed: number): number {
        let state = this.randomStreams.get(seed);
        if (state === undefined) state = seed >>> 0;

        state = (state + 0x6d2b79f5) | 0;
        this.randomStreams.set(seed, state);

        let t = Math.imul(state ^ (state >>> 15), 1 | state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    // --- Non-price request data (v5 `request.*`) --------------------------

    /**
     * Timestamped samples for `request.financial` / `.dividends` / `.splits` /
     * `.earnings` / `.quandl`, keyed by kind and by the arguments that select a
     * series.
     *
     * Supplied by the host, like `securityData` above and for the same reason:
     * this engine has no connection to TradingView, and a request it cannot
     * answer must be refused rather than resolved to `na`.
     */
    private requestData: Map<string, RequestSample[]> = new Map();

    /**
     * Supplies one non-price series.
     *
     * `key` is what runtime/v1/stdlib/request.ts builds from the call's
     * arguments — `"NASDAQ:AAPL|TOTAL_REVENUE|FQ"`. Samples are sorted here, so
     * a host may provide them in any order.
     */
    public provideRequestData(kind: string, key: string, samples: RequestSample[]): void {
        this.requestData.set(`${kind}::${key}`, [...samples].sort((a, b) => a.time - b.time));
    }

    public getRequestData(kind: string, key: string): RequestSample[] | undefined {
        return this.requestData.get(`${kind}::${key}`);
    }

    /** The chart's own bars, as they arrive. The basis of a derived request. */
    private chartBars: SecurityCandle[] = [];

    /** Derived higher-timeframe series, keyed by resolution, extended as bars arrive. */
    private derivedSeries: Map<string, { candles: SecurityCandle[]; upto: number }> = new Map();

    /**
     * Does `symbol` name the chart's OWN instrument?
     *
     * `request.security(syminfo.tickerid, …)` is how nearly every published
     * script asks for a higher timeframe of what it is already looking at, and
     * `syminfo.tickerid` is the exchange-qualified spelling of the same thing
     * `syminfo.ticker` gives bare. An empty symbol means the chart's too.
     */
    private isChartSymbol(symbol: string): boolean {
        if (symbol === "") return true;
        // `this.symbol` holds the TICKER ID — "NASDAQ:AAPL" if the host gave a
        // prefix — and `syminfo.ticker` is that with the exchange stripped, so
        // both spellings name the chart.
        if (symbol === this.symbol) return true;
        const colon = this.symbol.indexOf(":");
        return colon > 0 && symbol === this.symbol.slice(colon + 1);
    }

    /**
     * `request.security()` on the chart's own symbol, at the chart's timeframe
     * or a higher one, answered from the chart's own bars.
     *
     * ── Why this is exact and not an approximation ──────────────────────────
     *
     * A higher-timeframe bar IS the aggregate of the chart bars inside it: it
     * opens where the first one opened, closes where the last one closed, spans
     * their extremes and carries their total volume. That is the relationship
     * between the two series, not a model of it. TradingView builds its own
     * weekly candles from the same daily feed.
     *
     * Before this, `request.security(syminfo.tickerid, "D", close)` on a daily
     * chart returned `na` — the most basic call there is, silently empty on
     * every bar, in twenty-five of TradingView's own examples.
     *
     * ── What is still refused ───────────────────────────────────────────────
     *
     * A LOWER timeframe, and any other symbol. The manual is explicit about the
     * first: request.security() on a lower timeframe "will evaluate the
     * expression from the LTF context", and there is no LTF context to evaluate
     * it in — the intrabar prices are not in the data. Both keep returning `na`
     * and recording the request, so a host that HAS the data can supply it.
     *
     * ── Causality ───────────────────────────────────────────────────────────
     *
     * Only bars the script has already seen are folded. Aggregating the whole
     * dataset would hand the script the future: the group containing the
     * current bar would close before its last bar had arrived. `security()`
     * then applies its own closed-bar rule on top of a series that is already
     * causal.
     */
    private deriveSecurityData(symbol: string, resolution: string): SecurityCandle[] | undefined {
        if (!this.isChartSymbol(symbol)) return undefined;

        const want = specSeconds(resolution);
        const have = specSeconds(String(this.resolution));
        if (!Number.isFinite(want) || !Number.isFinite(have) || want < have) return undefined;

        const seen = this.currentBarIndex + 1;
        const cached = this.derivedSeries.get(resolution);
        if (cached && cached.upto === seen) return cached.candles;

        const candles = aggregate(this.chartBars.slice(0, seen), resolution);
        this.derivedSeries.set(resolution, { candles, upto: seen });
        return candles;
    }

    /**
     * Is this request just the chart's own series, under another name?
     *
     * True only for a DERIVED series at the chart's own timeframe — the same
     * symbol, no host data, and a resolution that folds one chart bar into one
     * requested bar. Then the requested bar and the chart bar ARE the same bar,
     * and there is no closed-bar rule to apply: `request.security(
     * syminfo.tickerid, timeframe.period, close)` is the current close.
     *
     * Host-supplied data is never this, even at a matching label. A host may
     * hand over any series it likes under the name "D", and the conservative
     * closed-bar rule is the right default for something this engine cannot see
     * inside.
     */
    public isOwnChartSeries(symbol: string, resolution: string): boolean {
        if (this.securityData.has(this.secKey(symbol, resolution))) return false;
        if (!this.isChartSymbol(symbol)) return false;
        const want = specSeconds(resolution);
        const have = specSeconds(String(this.resolution));
        return Number.isFinite(want) && Number.isFinite(have) && want === have;
    }

    public getSecurityData(symbol: string, resolution: string): SecurityCandle[] | undefined {
        // Host-supplied data always wins: it is real data for the context the
        // script asked for, and a derivation is only ever a fallback.
        const candles = this.securityData.get(this.secKey(symbol, resolution))
            ?? this.deriveSecurityData(symbol, resolution);
        if (!candles) return candles;
        // heikinashi(tickerid) marks the symbol rather than wrapping the series,
        // which is how Pine models it — so the transform belongs here, at the
        // point the candles are read, and every security() behaviour above it
        // (alignment, no-lookahead, per-call-site state) is unchanged.
        return symbol.startsWith("heikinashi:") ? toHeikinAshi(candles) : candles;
    }

    /** Records a (symbol, resolution) the script needs but hasn't been given. */
    public requestSecurity(symbol: string, resolution: string): void {
        this.requestedSecurities.add(this.secKey(symbol, resolution));
    }

    /** Stable key for the current call site (used for per-`security()` HTF state). */
    public currentCallKey(): string {
        return this.callStack.length > 0 ? this.callStack.join("/") : "global";
    }

    /** Per-call-site HTF state, exempt from live-tick snapshot/rollback. */
    public getHtfState<T>(key: string, initFn: () => T): T {
        if (!this.htfStates.has(key)) this.htfStates.set(key, initFn());
        return this.htfStates.get(key);
    }

    /**
     * Evaluates a deferred `security()` expression for one HTF bar inside a
     * sub-context, by rebinding the VM's global series (open/high/.../close) and
     * `ctx` to the sub-context for the duration of the thunk. Restores on exit.
     */
    public evalSecurityBar(sub: Context, bar: SecurityCandle, thunk: () => any): any {
        const sb = this.__sandbox;
        if (!sb) return NaN;
        const P = "opsv2_";
        const saved = {
            ctx: sb.ctx,
            open: sb[P + "open"], high: sb[P + "high"], low: sb[P + "low"],
            close: sb[P + "close"], volume: sb[P + "volume"], time: sb[P + "time"],
        };
        sb.ctx = sub;
        sb[P + "open"] = sub.vars.get(P + "open");
        sb[P + "high"] = sub.vars.get(P + "high");
        sb[P + "low"] = sub.vars.get(P + "low");
        sb[P + "close"] = sub.vars.get(P + "close");
        sb[P + "volume"] = sub.vars.get(P + "volume");
        sb[P + "time"] = sub.vars.get(P + "time");
        try {
            sub.setBar(bar.time, bar.open, bar.high, bar.low, bar.close, bar.volume);
            const r = thunk();
            const unwrap = (x: any) =>
                (x !== null && x !== undefined && typeof x.valueOf === "function") ? x.valueOf() : x;
            const num = unwrap(r);
            sub.finalizeBar();

            // A TUPLE expression — `security(sym, "D", [close, open])`, v4,
            // May 2020 — comes back as an array, and a STRING expression
            // (`syminfo.currency`) as a string. `Number()` turned both into
            // NaN, so the tuple form silently produced `na` for every element.
            if (Array.isArray(num)) return num.map(unwrap);
            if (typeof num === "string") return num;
            return Number(num);
        } finally {
            sb.ctx = saved.ctx;
            sb[P + "open"] = saved.open; sb[P + "high"] = saved.high; sb[P + "low"] = saved.low;
            sb[P + "close"] = saved.close; sb[P + "volume"] = saved.volume; sb[P + "time"] = saved.time;
        }
    }
}
