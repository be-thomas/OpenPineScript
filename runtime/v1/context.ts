import { PREFIX, removePrefix, extractFunctionName } from "../../utils/v2/common";
import { Series, SeriesSnapshot } from "./Series";
import { REGISTRY } from "./stdlib";
import { MATRIX_TAG } from "./stdlib/matrix";
import { LanguageProfile, DEFAULT_PROFILE } from "../../transpiler/profiles";

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
export interface Drawing {
    id: string;
    kind: 'line' | 'label' | 'box' | 'table';
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

    /** Opening time of the last bar in the dataset — `last_bar_time`. */
    public get lastBarTime(): number {
        return this.datasetLastTime != null ? this.datasetLastTime : this.time;
    }

    /**
     * Lines emitted by `log.info` / `log.warning` / `log.error` (v5).
     *
     * Kept on the Context rather than written to the console because they are
     * OUTPUT: scripts/make-log-harness.ts generates harnesses whose entire
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

        // `copy` is the one method every kind answers, and each answers it
        // differently — a matrix copies its rows, an array and a map copy
        // themselves, and a user-defined type copies its fields. Only the value
        // knows which it is, so the split happens here rather than at emit time.
        if (name === "copy" && args.length === 0 && !Array.isArray(v) && !(v instanceof Map)) {
            return this.copyObject(v);
        }

        const namespace = Context.receiverNamespace(v);

        if (!namespace) {
            throw new Error(
                `'.${name}()' cannot be called on this value: it is ` +
                `${v === undefined || v === null || (typeof v === "number" && isNaN(v)) ? "na" : typeof v} ` +
                `and has no methods.`,
            );
        }

        const key = `${namespace}.${name}`;
        const entry = REGISTRY[key];
        if (!entry || entry.is_value) {
            throw new Error(`'${namespace}' has no method '${name}'.`);
        }

        return this.call(`${key}${id}`, entry.ref, v, ...args);
    }

    /** Which built-in namespace owns this value's methods, or null. */
    private static receiverNamespace(v: any): string | null {
        if (v instanceof Map) return "map";
        if (Array.isArray(v)) return (v as any)[MATRIX_TAG] ? "matrix" : "array";
        if (typeof v === "string") {
            const kind = /^(line|label|box|table)_\d+$/.exec(v);
            if (kind) return kind[1];
            return "str";
        }
        return null;
    }

    /** Looks a drawing up, or throws — a stale id is a bug, not a no-op. */
    public getDrawing(id: any, fn: string): Drawing {
        const key = String(id instanceof Series ? id.valueOf() : id);
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
    public cash: number = 100000; 
    public trades: Trade[] = [];
    public orders: any[] = [];

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
        this.cash = 100000;
        this.trades = [];
        this.orders = [];

        // 6. Reset Script Metadata (re-declared on the next pass)
        this.scriptMeta = null;

        // 7. Reset live-tick baseline
        this.committedSnapshot = null;

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

        const arg = (name: string): any => {
            if (named[name] !== undefined) return unwrap(named[name]);
            const idx = order.indexOf(name);
            return idx >= 0 && idx < positional.length ? unwrap(positional[idx]) : undefined;
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
        }
    }

    // Helper to register an input during dry_run and retrieve value during real run
    public registerInput(defval: any, title: string = "", type: string = "float"): any {
        const currentId = `input_${this.inputCounter++}`;
        
        // If it's the dry run (first time seeing this), save the definition
        if (this.inputDefs.length < this.inputCounter) {
            this.inputDefs.push({
                id: currentId,
                defval,
                title: title || currentId,
                type
            });
        }

        // Return user override if it exists, otherwise return the default
        if (currentId in this.userInputs) {
            return this.userInputs[currentId];
        }
        return defval;
    }

    /**
     * SMART CALL EXECUTION
     * Handles:
     * 1. Registry Lookup (Values vs Functions)
     * 2. Context Injection
     * 3. Keyword Argument Resolution (kwargs)
     */
    public call(id: string, fn: Function, ...args: any[]) {
        // DIAGNOSTIC: If this triggers, the transpiler passed a null function reference
        if (typeof fn !== 'function') {
            throw new TypeError(`[Context.call] Execution error for ID "${id}": The provided reference is not a function. Check if the function exists in the stdlib.`);
        }

        const identity = id; 
        this.callStack.push(identity);
        
        try {
            const fname = removePrefix(extractFunctionName(id)); 
            const entry = REGISTRY[fname];

            // 1. Check if the entry exists. If not, we default to standard call (fail-safe)
            if (!entry) {
                // If we don't have metadata, we assume it's a standard JS function call
                return fn(...args);
            }

            // 2. Protect Static Values
            if (entry.is_value) {
                throw new Error(`TypeError: '${fname}' is a value, not a function. You cannot call it.`);
            }

            // 3. Handle Keyword Arguments
            const lastArg = args[args.length - 1];
            const hasKwargs = lastArg && typeof lastArg === 'object' && !Array.isArray(lastArg) 
                            && !(lastArg instanceof Series) && lastArg.constructor === Object;

            let finalArgs = args;

            if (hasKwargs) {
                const positionalArgs = args.slice(0, -1);
                const kwargs = lastArg;

                if (entry.args.length > 0) {
                    finalArgs = [...positionalArgs];
                    const params = entry.args; 
                    
                    for (const [_key, val] of Object.entries(kwargs)) {
                        const cleanKey = removePrefix(_key); 
                        const index = params.indexOf(cleanKey);
                        
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
            if (entry.uses_context) {
                return fn(this, ...finalArgs); 
            } else {
                return fn(...finalArgs);
            }

        } finally {
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
    public builtin(name: string): any {
        return REGISTRY[name]?.ref;
    }

    public getPersistentState<T>(initFn: () => T): T {
        const key = this.callStack.length > 0 ? this.callStack.join("/") : "global";
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
     * ── KNOWN LIMIT: `var` inside a user function ───────────────────────────
     *
     * Every call site of a function shares one `var`. Given
     *
     *     f() =>
     *         var c = 0
     *         c := c + 1
     *         c
     *     a = f()
     *     b = f()
     *
     * this yields a = 1,3,5 and b = 2,4,6. TradingView gives 1,2,3 for both:
     * there, each call site gets its own instance of the function's locals.
     *
     * Keying on `callStack.join("/")` instead — the obvious fix — does not fix
     * it. The SERIES NAME is shared too: the body emits `new_var("opsv2_c", …)`
     * for every call site, so per-site initialisation flags just redistribute
     * the error (a = 1,2 / b = 1,3) rather than removing it.
     *
     * The real cause is older and wider than `var`: NO function local is
     * per-call-site in this engine — `t = close * 2` inside a function is one
     * `opsv2_t` series shared by every caller. Fixing it means making emitted
     * local names call-site-scoped at both the declaration and the `:=` site,
     * across v1–v4. That is a real change, not a tweak here, so this is
     * recorded rather than papered over.
     *
     * `varipSeries` has the same root cause and is therefore keyed by NAME,
     * not by site: rollback operates on series names, and a `varip x` in one
     * scope and a `var x` in another are one series here, so both end up
     * exempt. Keying it by site would not separate them either.
     */
    public var_def(name: string, key: string, initFn: () => any, ip: boolean = false): Series {
        if (ip) this.varipSeries.add(name);

        if (this.varInitialised.has(key)) {
            const held = this.vars.get(name);
            return this.new_var(name, held ? held.valueOf() : NaN);
        }

        this.varInitialised.add(key);
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
        let series = this.vars.get(name);
        
        if (!series) {
            series = new Series(this, name);
            this.vars.set(name, series);
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
            const val = (index < vals.length) ? vals[index] : NaN;
            // Unwrap potential Series object to raw number
            const numVal = Number(val); 
            return this.new_var(name, isNaN(numVal) ? NaN : numVal);
        });
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
        const series = this.vars.get(name);
        return series ? series.get(offset) : NaN;
    }

    public setBar(time: number, open: number, high: number, low: number, close: number, volume: number) {
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
    }

    // --- Plotting ---

    /**
     * Registers a pre-built PlotData object for the current bar.
     * Each ui.ts function constructs the correctly-typed variant.
     */
    public registerPlot(data: PlotData) {
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

        if (series.length > this.currentBarIndex) {
            series[this.currentBarIndex] = data;
        } else {
            series.push(data);
        }
    }

    public registerFill(id1: string, id2: string, options: { color?: string, title?: string } = {}) {
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

        if (series.length > this.currentBarIndex) {
            series[this.currentBarIndex] = data;
        } else {
            series.push(data);
        }
    }

    public finalizeBar() {
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
            pendingEntries: structuredClone((this as any)._pendingEntries ?? new Map()),
            pendingExits: structuredClone((this as any)._pendingExits ?? new Map()),
            riskState: structuredClone((this as any)._riskState ?? null),
        };
    }

    private restoreSnapshot(s: RuntimeSnapshot) {
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

    public getSecurityData(symbol: string, resolution: string): SecurityCandle[] | undefined {
        const candles = this.securityData.get(this.secKey(symbol, resolution));
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
    public evalSecurityBar(sub: Context, bar: SecurityCandle, thunk: () => any): number {
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
            const num = (r !== null && r !== undefined && typeof (r as any).valueOf === "function") ? (r as any).valueOf() : r;
            sub.finalizeBar();
            return Number(num);
        } finally {
            sb.ctx = saved.ctx;
            sb[P + "open"] = saved.open; sb[P + "high"] = saved.high; sb[P + "low"] = saved.low;
            sb[P + "close"] = saved.close; sb[P + "volume"] = saved.volume; sb[P + "time"] = saved.time;
        }
    }
}
