import { cloneState } from "./stateClone";
import { PREFIX, removePrefix, extractFunctionName } from "../../utils/v2/common";
import { Series, SeriesSnapshot } from "./Series";
import { REGISTRY, viewFor } from "./stdlib";
import { legacyFromGradient } from "./stdlib/color";
import { MATRIX_TAG } from "./stdlib/matrix";
import { DerivedSeries, canonicalTimeframe, periodIndex, specSeconds } from "./timeframes";
import { processPendingOrders, MarketOrder } from "./stdlib/strategy";
import { brokerFor } from "./broker";
import { V6_ONLY_PARAMS, V6_POSITIONAL } from "./stdlib/renames6";
import { V5_POSITIONAL, V4_RENAMED_PARAMS } from "./stdlib/renames5";
import type { FootprintLevel } from "./footprint";
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
    /**
     * The bars the trade opened and closed on.
     *
     * A time alone cannot be aligned to a chart without searching the bar
     * list for it, and "Avg # Bars in Trades" — a row of TradingView's
     * performance summary — is `exitBarIndex - entryBarIndex` and nothing
     * else. Both are recorded at the fill, where they are known for free.
     */
    entryBarIndex?: number;
    exitBarIndex?: number;
    /**
     * The order id that OPENED the position, which TradingView's list of
     * trades calls the trade's signal. `id` names the closing order, so
     * without this the entry row of every trade reads "Close".
     */
    entryId?: string;
    /**
     * Favourable and adverse excursion, in currency, over the life of the
     * trade — how far the position ran in the script's favour before it
     * closed, and how far against.
     *
     *   run-up   = (highest price while open - entry price) * qty   [long]
     *   drawdown = (entry price - lowest price while open)  * qty   [long]
     *
     * mirrored for a short. TradingView states the price form of both and
     * reports them per trade; the exit price does not enter either one.
     * Both are >= 0, and both are measured against the position's average
     * price so a pyramided add moves them the way it moves the P&L.
     */
    runup?: number;
    drawdown?: number;
    /** Commission charged on the round turn, already deducted from `pnl`. */
    commission?: number;
    /**
     * `strategy.closedtrades.exit_id` and `.exit_comment`, as TradingView
     * names them: the exit's own id, "Close entry(s) order <entry>" for
     * `strategy.close`, "Close position order" for `close_all` and a margin
     * call. Absent where no version records them yet, and the accessors fall
     * back to `id`.
     */
    exitId?: string;
    exitComment?: string;
}

/**
 * One row of the equity curve: what the account was worth at a bar's close.
 *
 * Sampled every bar rather than every fill because that is what a chart
 * plots — TradingView's overview draws equity against time, and a curve
 * that only moves when a trade closes is a staircase that hides the open
 * position's swing. `openPL` is the part of `equity` that is not yet
 * realized, which is what makes the difference visible.
 */
export interface EquityPoint {
    time: number;
    /** Realized cash plus the open position's mark-to-market. */
    equity: number;
    /** Unrealized P&L of the position held at this bar's close; 0 while flat. */
    openPL: number;
}

/** One entry still open inside a position. See Position.entries. */
export interface OpenEntry {
    id: string;
    /** Still open, and as filled. `qty_percent` exits are a share of `opened`. */
    qty: number;
    opened: number;
    price: number;
    bar: number;
    time: number;
    /** Entry commission not yet claimed by a closing trade. */
    commission: number;
    /** Identifies the trade for as long as it lives: the bar and the fill's order count. */
    uid?: string;
}

export interface Position {
    size: number;      // + for Long, - for Short
    avgPrice: number;
    /**
     * The bar the position was OPENED on, the time of that bar, and the order
     * id that opened it.
     *
     * Recorded so `strategy.opentrades.entry_bar_index` and `.entry_id` have
     * something to answer with. Undefined while flat, which is the same fact as
     * `size === 0` and reads as `na` either way.
     *
     * `entryTime` is here because a host has to PLACE this position on a
     * chart, and a bar index cannot be placed: the chart's bar list grows as
     * older bars page in, so index 40 is a different bar after a scroll.
     * `Trade` carries both for the same reason; leaving it off `Position`
     * meant the still-open position could only be drawn on the last bar.
     */
    entryBarIndex?: number;
    entryTime?: number;
    entryId?: string;
    /**
     * Entry-side commission already paid on the position still open, so an
     * exit can charge its own side and claim a share of this rather than
     * recomputing a whole round turn.
     *
     * `commission.cash_per_order` is a flat fee PER ORDER, and it used to be
     * charged twice per closed-trade record. Two partial exits of one entry
     * are three orders and were billed for four; three pyramided entries
     * closed in one go are four orders and were billed for two. The other two
     * commission types scale with quantity, so they came out right by
     * accident and this changes nothing for them.
     */
    entryCommission?: number;
    /**
     * The largest size this position has held since it opened: what a v6
     * `qty_percent` exit is a percentage OF. Half of a 0.731 entry is 0.3655
     * whether or not another exit has already sold part of it.
     */
    openedQty?: number;
    /**
     * The entries that make up the position, oldest first — what TradingView
     * calls its open trades. Kept by every broker and READ only where the
     * broker tracks trades (V6Broker): `strategy.close(id)` and an exit's
     * `from_entry` act on the entries with that id, and a close records one
     * trade per entry it consumes, at that entry's own price.
     */
    entries?: OpenEntry[];
    /**
     * The id ledger, apart from `entries` (the trades, first in first out):
     * what each entry id still owns, and what it opened with. An exit with
     * `from_entry` and `close(id)` draw on an id's quantity, but what they sell
     * comes off the OLDEST trades whatever their id (TradingView's log,
     * harness_strategy_exit_mix and harness_strategy_pyr3 phase d).
     */
    ledger?: Record<string, { qty: number; opened: number }>;
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

/** Where in the Pine source a runtime error was raised; see `Context.locateError`. */
export interface PineLocation {
    line: number;
    col: number;
    /** The alias of the imported library the error was raised in, if it was in one. */
    library?: string;
    /** For an error inside a library: the call in the script that led there. */
    caller?: { line: number; col: number };
}

export interface FillData {
    plotId1: string; // The ID of the first line
    plotId2: string; // The ID of the second line
    color: string;
    title: string;
    /** `fill(show_last)`: draw only the last N bars. Absent when the script gave none. */
    showLast?: number;
    /** The gradient overload, `fill(p1, p2, top_value, bottom_value, top_color, bottom_color)`. */
    gradient?: true;
    /** `top_color` is drawn at the price `top_value`, `bottom_color` at `bottom_value`; this bar's. */
    top_value?: number;
    bottom_value?: number;
    top_color?: string;
    bottom_color?: string;
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
 * (conformance/v5/parity/harness_strategy.BTCUSDT.1D.log). The engine used to
 * start at 100000, which put every equity-derived figure — `netprofit_percent`,
 * `grossprofit_percent` — out by a factor of ten.
 */
export const DEFAULT_INITIAL_CAPITAL = 1_000_000;

/**
 * ...but only for Pine v5. Read off TradingView with a strategy that passes no
 * `initial_capital`: v2, v3, v4 and v6 start at 100,000, v5 at 1,000,000.
 */
export function defaultInitialCapital(version: number): number {
    return version === 5 ? DEFAULT_INITIAL_CAPITAL : 100_000;
}

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
    /**
     * The rest of the `strategy()` declaration — the backtest settings a
     * TradingView user reads off the Properties tab and changes without
     * touching the script.
     *
     * Recorded whether or not the broker acts on each one, because a host
     * cannot show a properties panel for arguments it was never told about,
     * and a panel that invents its own defaults will disagree with the
     * script the moment the script sets one.
     */
    initial_capital?: number;
    default_qty_type?: string;
    default_qty_value?: number;
    commission_type?: string;
    commission_value?: number;
    slippage?: number;
    margin_long?: number;
    margin_short?: number;
    process_orders_on_close?: boolean;
    risk_free_rate?: number;
    /**
     * v6, July 2026: run once per tick of every HISTORICAL bar. Recorded for a
     * host to display; this engine is given bars, not their ticks, so it has
     * nothing to run per tick and computes exactly as if this were false.
     * Present only when a v6 script declares it.
     */
    calc_on_every_history_tick?: boolean;
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
    equityLen: number;
    positionRunup: number;
    positionDrawdown: number;
    maxContractsHeld: number;
    commissionPaid: number;
    filledOrderCount: number;
    netProfitSum: number;
    orders: any[];
    marketOrders: MarketOrder[];
    pendingEntries: Map<string, any>;
    pendingExits: Map<string, any>;
    riskState: any;
    /** Live drawings and their eviction queues: a re-run of the bar re-creates its own. */
    drawings: Map<string, Drawing>;
    drawingOrder: Map<Drawing["kind"], string[]>;
    drawingCounter: number;
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
    if (Array.isArray(v)) return v.map(plainValue);
    if (typeof v === "function") {
        const unwrapped = v.valueOf();
        return typeof unwrapped === "function" ? undefined : unwrapped;
    }
    return v;
}

/**
 * A drawing with its own copy of `props`: one level deep, and the cells of a
 * table (a Map of records), which is as deep as any drawing's props go. Cost
 * is one small object per live drawing (at most ~50 of each kind) per snapshot.
 */
function cloneDrawing(d: Drawing): Drawing {
    const props: Record<string, any> = { ...d.props };
    for (const k in props) {
        const v = props[k];
        if (v instanceof Map) props[k] = new Map([...v].map(([ck, cv]) => [ck, cv && typeof cv === "object" ? { ...cv } : cv]));
        else if (Array.isArray(v)) props[k] = v.slice();
    }
    return { ...d, props };
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
    /**
     * When the bar closes, if the host knows it. A stock's hourly and daily bars end
     * where the SESSION ends, not on a clock boundary (the last hourly bar of a
     * 09:30-16:00 session is 15:30-16:00); without it the end is the calendar's.
     * `request.security` closes a bar with the chart bar that ends it, so a host
     * with a session calendar should give this (TradingView's `time_close`).
     */
    closeTime?: number;
}


/** The marker `heikinashi()` puts on a symbol; see stdlib/chart.ts. */
const HEIKINASHI = "heikinashi:";

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
class HeikinAshiSeries {
    readonly out: SecurityCandle[] = [];
    private src: SecurityCandle[] | null = null;

    /**
     * The transform of `candles`, built forward from where it last stopped. The
     * last candle is always done again: it may have been re-ticked, or it is
     * the forming candle of a derived series. A different array, or a shorter
     * one, is another series and starts over.
     */
    of(candles: SecurityCandle[]): SecurityCandle[] {
        const out = this.out;
        if (candles !== this.src || candles.length < out.length) { out.length = 0; this.src = candles; }
        let i = Math.max(0, out.length - 1);
        out.length = i;
        for (; i < candles.length; i++) {
            const c = candles[i];
            const prev = out[i - 1];
            const haClose = (c.open + c.high + c.low + c.close) / 4;
            const haOpen = prev && Number.isFinite(prev.open) && Number.isFinite(prev.close)
                ? (prev.open + prev.close) / 2
                : (c.open + c.close) / 2;
            out.push({
                time: c.time,
                open: haOpen,
                high: Math.max(c.high, haOpen, haClose),
                low: Math.min(c.low, haOpen, haClose),
                close: haClose,
                volume: c.volume,
            });
        }
        return out;
    }
}

/**
 * The stack of call ids being executed, with the joined key of every depth
 * kept as it moves.
 *
 * A call site's key was rebuilt by joining the whole stack on every call,
 * which was a tenth of a run's time. The keys are interned, so each is one
 * string whose hash is computed once. A built-in that names a frame of its own
 * (`ta.ts` pushes "rsi_gain" and the like) pushes through the same methods.
 */
class CallStack {
    private ids: string[] = [];
    /** `keys[i]` is the first `i + 1` ids joined with "/". */
    readonly keys: string[] = [];
    private intern: Map<string, Map<string, string>> = new Map();

    get length(): number { return this.ids.length; }
    /** The innermost id. */
    get top(): string | undefined { return this.ids[this.ids.length - 1]; }
    /** The whole stack joined with "/", "" when empty. */
    get path(): string { return this.keys.length > 0 ? this.keys[this.keys.length - 1] : ""; }

    /** Returns the new path. */
    push(id: string): string {
        const parent = this.path;
        let children = this.intern.get(parent);
        if (!children) this.intern.set(parent, children = new Map());
        let key = children.get(id);
        if (key === undefined) children.set(id, key = parent ? `${parent}/${id}` : id);
        this.ids.push(id);
        this.keys.push(key);
        return key;
    }

    pop(): void {
        this.ids.pop();
        this.keys.pop();
    }

    join(sep: string): string { return this.ids.join(sep); }
    [Symbol.iterator](): Iterator<string> { return this.ids[Symbol.iterator](); }
}

const INPUT_IDS: string[] = [];

/** A value that cannot change under the same identity: not an object, not a Series. */
function isPlainInput(v: any): boolean {
    const t = typeof v;
    return t !== "function" && (t !== "object" || v === null);
}

/** The arguments of two `input()` calls are the same plain values. */
function sameInputArgs(a: Record<string, any>, b: Record<string, any>): boolean {
    let count = 0;
    for (const k in b) {
        count++;
        const x = a[k], y = b[k];
        if (x === y) { if (!isPlainInput(x)) return false; continue; }
        if (!Array.isArray(x) || !Array.isArray(y) || x.length !== y.length) return false;
        for (let i = 0; i < x.length; i++) if (x[i] !== y[i] || !isPlainInput(x[i])) return false;
    }
    for (const _ in a) count--;
    return count === 0;
}

/** The keyword names of a call that passed none. Never mutated. */
const EMPTY_NAMES: Set<string> = new Set();

/** The built-in series every context registers; their history stays bar-indexed everywhere. */
const BASE_SERIES: Set<string> = new Set(
    ["open", "high", "low", "close", "volume", "time", "bar_index"].map((n) => `opsv2_${n}`),
);

export class Context {
    // 1. Internal Execution State (Private)
    protected callStack: CallStack = new CallStack();

    /** What a call id says about itself, which never changes: its name and whether it is a user frame. */
    private callIds: Map<string, { fname: string; userFrame: boolean; entry: any; resolved: boolean; plan?: { keys: string[]; indices: number[]; named: Set<string> } }> = new Map();


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
    /** Which user-function CALL is running: a fresh number per call, 0 at script scope. */
    private frameSeq = 0;
    private frameSeqs: number[] = [];
    private frameSeqCounter = 0;
    /** The series the running user call was handed as arguments: a parameter's history stays bar-indexed. */
    private argSeries: any[] = [];
    private frameArgs: any[][] = [];

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

    // v6 additions. The defaults are those of the same US equity the rest
    // assume: whole shares, no ISIN on record, not a continuous future.
    public mincontract: number = 1;
    /** True once the host supplied `mincontract`; only then are order quantities floored to it. */
    public mincontractSupplied: boolean = false;
    public isin: string = "";
    public currentContract: string | null = null;

    /** The live quote, for `bid` / `ask` (v6). Not in an OHLCV bar. */
    public bid: number = NaN;
    public ask: number = NaN;

    /**
     * Volume at price, per bar, for `request.footprint()` (v6). Keyed by bar
     * open time. `null` until a host supplies any — see getFootprintLevels.
     */
    private footprints: Map<number, FootprintLevel[]> | null = null;

    /** Supplies footprint data: for each bar, its volume per price level. */
    public provideFootprints(bars: ReadonlyArray<{ time: number; levels: FootprintLevel[] }>): void {
        this.footprints ??= new Map();
        for (const b of bars) this.footprints.set(Number(b.time), b.levels);
    }

    /**
     * This bar's levels, `null` when the host has none for it, and a refusal
     * when the host has supplied no footprints at all — the `request.*` rule:
     * a series this engine cannot fetch is asked for, not silently `na`.
     */
    public getFootprintLevels(): FootprintLevel[] | null {
        if (this.footprints === null) {
            throw new Error(
                "request.footprint: no footprint data was supplied. This engine " +
                "cannot fetch volume at price — provide it with ctx.provideFootprints(bars).",
            );
        }
        return this.footprints.get(this.time) ?? null;
    }

    /** The source location of the one `request.footprint()` call, once seen. */
    private footprintSite: string | null = null;

    /**
     * "Scripts can make only one request.footprint() call. Multiple calls
     * cause a runtime error." A CALL is a place in the source: the innermost
     * call id, which carries its location. Counting executions instead
     * rejected one call inside a `for` loop on the first bar.
     */
    public countFootprintRequest(): void {
        const site = this.callStack.top ?? "";
        if (this.footprintSite === null) this.footprintSite = site;
        else if (this.footprintSite !== site) {
            throw new Error("request.footprint: a script can make only one request.footprint() call.");
        }
    }

    /** Declares the current bid and ask. See `bid` in stdlib/v6_members.ts. */
    public provideQuote(quote: { bid?: number; ask?: number }): void {
        if (quote.bid !== undefined) this.bid = Number(quote.bid);
        if (quote.ask !== undefined) this.ask = Number(quote.ask);
    }

    /** Declares the instrument's metadata. Every field is optional. */
    public provideSymbolInfo(info: {
        symbol?: string; mintick?: number; currency?: string; basecurrency?: string;
        description?: string; type?: string; root?: string; timezone?: string;
        pointvalue?: number; session?: string;
        mincontract?: number; isin?: string; current_contract?: string;
    }): void {
        if (info.mincontract !== undefined) { this.mincontract = Number(info.mincontract); this.mincontractSupplied = true; }
        if (info.isin !== undefined) this.isin = String(info.isin);
        if (info.current_contract !== undefined) this.currentContract = String(info.current_contract);
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
     * Is the script executing on the dataset's final bar — `barstate.islast`?
     *
     * Derived, not stored. `is_last` is written only by `applyTick`, which is
     * the LIVE path, so on a purely historical run nothing ever set it and
     * `barstate.islast` was false on every bar including the last one. That
     * silently broke the commonest idiom in Pine — `if barstate.islast` is how
     * every dashboard table, summary label and end-of-chart drawing is guarded,
     * and all of them simply never ran.
     *
     * The extent is known: `runHistory` declares it before the first bar. So
     * the answer is the comparison, with the live flag kept as an override for
     * the realtime bar, which is last by definition however long the dataset is.
     */
    public get onLastBar(): boolean {
        if (this.is_last) return true;
        return this.datasetSize != null && this.currentBarIndex === this.datasetSize - 1;
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
     * How many drawings of each kind survive, and when the rest are deleted.
     *
     * The limit is the script's own: `max_lines_count`, `max_labels_count`,
     * `max_boxes_count` and `max_polylines_count` on `indicator()` /
     * `study()` / `strategy()`, each defaulting to 50 (`declareScript` applies
     * them). Linefills are fixed at 50. Tables are absent deliberately: Pine
     * limits them by POSITION (one per slot), not by count, so an eviction rule
     * would be the wrong shape.
     *
     * ── The rule, as TradingView applies it ─────────────────────────────────
     *
     * It does NOT hold the count at `limit`. Drawings pile up past the limit
     * and are then cut back in one go: when creating a drawing makes the live
     * count of that kind exceed `limit + 5`, the oldest are deleted until the
     * count equals `limit`. It happens at the creation itself, so it also
     * happens in the middle of one bar's execution.
     *
     * Measured with conformance/v5/parity/probe_drawing_limits.pine:
     *
     *   limit 10, one line per bar   the count after each bar goes
     *                                1, 2, ... 15, then 10, 11 ... 15, 10, ...
     *   limit 10, 30 labels in one   the same sawtooth, per label.new
     *   execution
     *   limit 500, 1003 lines        505 remain, the newest 505
     *     (harness_trader_club)
     *
     * Log: conformance/v5/parity/probe_drawing_limits.BTCUSDT.5.csv. Only
     * limits 10 and 500 were measured; the +5 slack is assumed to be constant
     * in between and at the default of 50.
     *
     * Without any cap, `label.new` on every bar of a 6,000-bar chart retains
     * 6,000 records here while TradingView shows about 50, so a script that
     * reads its own drawings back diverges, and memory grows without bound on
     * exactly the scripts most likely to be long-running.
     */
    private drawingLimits: Partial<Record<Drawing["kind"], number>> = {
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
        this.drawingOrder.set(kind, order);

        const limit = this.drawingLimits[kind];
        if (limit !== undefined && order.length > limit + 5) {
            if (this.profile.version >= 5) {
                this.evictDrawings(order, limit);
            } else {
                // The same bookkeeping `deleteDrawing` uses: shifting the ids
                // off the queue and out of `drawings` together.
                while (order.length > limit) {
                    this.drawings.delete(order.shift()!);
                }
            }
        }

        return id;
    }

    /**
     * v5 and v6: who goes when a kind passes `limit + 5`.
     *
     * Measured on TradingView (dev-docs/tv-parity/_probes/version-scope/
     * v6-gc-order-1, -2, -3 and v5-gc-order, limit 10; golden test
     * tests/v6/runtime/drawing_eviction_tv.test.ts):
     *
     *   - A drawing a `var` / `varip` variable holds RIGHT NOW is never
     *     evicted. One held only inside an array is not protected. UDT fields,
     *     maps and plain variables were not probed and are treated as not
     *     protected.
     *   - On a historical bar the oldest unprotected drawings go, whatever bar
     *     they were drawn on, until the count is `limit`.
     *   - On the realtime bar a pass first removes unprotected drawings from
     *     EARLIER bars, oldest first, and stops there, even with the count
     *     still above `limit`. Only a pass that finds no such drawing removes
     *     the current bar's own, oldest first, down to `limit`.
     *
     * v4 and earlier were not probed and keep the plain oldest-first cut.
     */
    private evictDrawings(order: string[], limit: number): void {
        const protectedIds = this.varHeldDrawings();
        const evict = (candidate: (d: Drawing) => boolean, stopAtLimit: boolean): boolean => {
            let removed = false;
            for (let i = 0; i < order.length && (!stopAtLimit || order.length > limit);) {
                const d = this.drawings.get(order[i]);
                if (d && (protectedIds.has(d.id) || !candidate(d))) { i++; continue; }
                this.drawings.delete(order[i]);
                order.splice(i, 1);
                removed = true;
            }
            return removed;
        };
        if (this.is_realtime) {
            const now = this.currentBarIndex;
            if (evict(d => d.bar < now, true)) return;
        }
        evict(() => true, true);
    }

    /** Ids of drawings that a `var` / `varip` variable holds at this moment, in any frame. */
    private varHeldDrawings(): Set<string> {
        const held = new Set<string>();
        for (const name of this.varSeries) {
            const v = this.vars.get(name)?.valueOf();
            if (typeof v === "string" && this.drawings.has(v)) held.add(v);
        }
        return held;
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
    // (docs/common/ARCHITECTURE.md ("Design rules")), and only V5ToJsVisitor can
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
    /**
     * The value a UDT field stores: a series argument's value on this bar.
     *
     * `Item.new(bx, bar_index, t)` with `box bx = box.new(…)` and `float t =
     * high` hands the constructor SERIES -- the variables' wrappers -- and an
     * object that kept the wrapper would read whatever the variable holds on
     * the bar it is READ, not the one it was built on. A `var` array of such
     * objects then saw every element change together: all reported the latest
     * bar's values, and `box.delete(oldest.bx)` deleted the NEWEST box.
     * TradingView stores the value (checked with Pine Logs:
     * dev-docs/tv-parity/_probes/na-drawings/parity-udt-fields.pine), as `setField` already did for writes.
     *
     * Arrays, maps, matrices, drawings and nested objects are values that are
     * references, so unwrapping keeps sharing them exactly as Pine does.
     */
    public fieldValue(value: any): any {
        return value instanceof Series ? value.valueOf() : value;
    }

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
    /**
     * Which declaration of an overloaded user function or method a call
     * reaches, chosen from the VALUES: the emitted dispatcher's job when the
     * types are not written down where the call is (see
     * V5ToJsVisitor.emitOverloadDispatcher).
     *
     * Candidates are `[fn, min, max, declared parameter types]`. Those whose
     * arity fits are scored by how well each argument's own type matches the
     * declared one — a user-defined object by its `__type`, a drawing by its
     * `__builtin`, an array by its first element, a number as int or float —
     * and the best wins; a tie goes to the first declared.
     */
    public pickOverload(name: string, args: any[], candidates: Array<[Function, number, number, Array<string | null>]>): Function | null {
        const last = args[args.length - 1];
        const kwargs = last && typeof last === "object" && !Array.isArray(last) && last.constructor === Object
            && Object.keys(last).length > 0 && Object.keys(last).every(k => k.startsWith("opsv"));
        // Keyword arguments arrive as one trailing bundle; each counts.
        const positional = args.length - (kwargs ? 1 : 0);
        const count = positional + (kwargs ? Object.keys(last).length : 0);
        // A keyword names a parameter: an overload without that name cannot be it.
        const names = kwargs ? Object.keys(last).map(k => k.replace(/^opsv\d*_/, "")) : [];
        const fitting = candidates.filter(c => count >= c[1] && count <= c[2]
            && names.every(n => !Array.isArray((c[0] as any).__params) || (c[0] as any).__params.includes(n)));
        const pool = fitting.length > 0 ? fitting : candidates;
        let best = pool[0], bestScore = -Infinity;
        for (const c of pool) {
            let score = 0;
            c[3].forEach((declared, i) => {
                if (i >= positional || declared === null) return;
                score += typeFit(declared, args[i]);
            });
            if (score > bestScore) { best = c; bestScore = score; }
        }
        if (!best) throw new Error(`'${name}': no declaration takes ${count} argument(s).`);
        // Every declaration disagrees with the receiver's own type: not one of
        // ours. The dispatcher hands the call to the built-in method.
        if (bestScore < 0 && fitting.length > 0 && valueType(args[0]) !== null) {
            const receiverFits = fitting.some(c => c[3][0] === null || typeFit(c[3][0]!, args[0]) >= 0);
            if (!receiverFits) return null;
        }
        return best[0];
    }

    /** Calls the overload a dispatcher picked, binding keyword arguments by its own parameter names. */
    public callPicked(fn: Function, args: any[], name: string): any {
        const params: unknown = (fn as any).__params;
        if (Array.isArray(params) && params.length > 0) {
            return fn(...this.bindKeywordArguments(args, params as string[], name));
        }
        return fn(...args);
    }

    /** Loop signals thrown across a `switch` arm's function boundary. */
    public readonly LOOP_BREAK = Object.freeze({ loopSignal: "break" });
    public readonly LOOP_CONTINUE = Object.freeze({ loopSignal: "continue" });

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
        // v6's built-in object types — `footprint` and `volume_row` — carry
        // their namespace on the object. `__builtin`, not `__type`, so they can
        // never be mistaken for a user-defined type.
        if (v && typeof v === "object" && (v.__builtin === "footprint" || v.__builtin === "volume_row")) {
            return v.__builtin;
        }
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
        // Deleted -- by the script, or evicted past max_*_count -- behaves like
        // `na`: setters do nothing and getters return na. TradingView does not
        // raise an error here (Pine Logs, dev-docs/tv-parity/_probes/na-drawings/parity-udt-fields.pine: a
        // deleted box's set_right is ignored and get_top gives NaN), and a
        // script that keeps ids of drawings the cap has since removed is
        // ordinary Pine, not a mistake to stop the run for.
        if (!drawing) return Context.naDrawing();
        return drawing;
    }

    // NEW: Barstate Flags (Required for barstate.ts getters)
    public is_history: boolean = true;
    public is_realtime: boolean = false;
    public is_new: boolean = true;
    /** True only during a realtime bar's closing execution (`Session.commit`); see `barstate.isconfirmed`. */
    public is_confirmed: boolean = false;
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
     * The equity curve, one point per CLOSED bar, for strategies only.
     *
     * A study never opens a position, so sampling one would append a flat
     * line of `initial_capital` to every indicator's render model.
     */
    public equityCurve: EquityPoint[] = [];

    /**
     * Excursion of the position currently open, in currency, reset when a
     * position is opened from flat and read when it closes. Both are >= 0.
     *
     * Tracked on the Context rather than on the Position because they are
     * measured across bars and the broker only ever sees one: by the time
     * `closeAt` runs, the high the trade reached three bars ago is gone.
     */
    public positionRunup: number = 0;
    public positionDrawdown: number = 0;

    /** The largest absolute position size held at any point in the run. */
    public maxContractsHeld: number = 0;

    /** Commission charged across the whole run, for the performance summary. */
    public commissionPaid: number = 0;

    /**
     * The first and last close the strategy saw, for the buy & hold baseline
     * TradingView draws against the equity curve. Recorded here because the
     * render model is built from the Context alone and the candles are the
     * caller's.
     */
    public firstClose: number = NaN;
    public lastClose: number = NaN;

    /**
     * Market orders placed on this bar, waiting for the next bar's open.
     *
     * `setBar` drains it; see MarketOrder in ./stdlib/strategy.ts for why a
     * market order does not fill on the bar that places it.
     */
    public marketOrders: MarketOrder[] = [];
    /** Orders filled this run: entries and exits. See `Broker.countOrder`. */
    public filledOrderCount = 0;
    /** The closed trades' profit, summed as they close, in order: `netProfit()` reads it instead of re-adding every trade. */
    public netProfitSum = 0;

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
        this.callStack = new CallStack();
        this.footprintSite = null;
        this.states.clear();
        this.inputCounter = 0;
        // A `var` initialiser must run again on a fresh pass, or a re-run would
        // carry the previous pass's value in and never re-evaluate it.
        this.varInitialised.clear();
        this.varipSeries.clear();
        this.varSeries.clear();

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
        this.netProfitSum = 0;
        this.orders = [];
        this.marketOrders = [];
        this.filledOrderCount = 0;
        this.equityCurve = [];
        this.positionRunup = 0;
        this.positionDrawdown = 0;
        this.maxContractsHeld = 0;
        this.commissionPaid = 0;
        this.firstClose = NaN;
        this.lastClose = NaN;

        // 6. Reset Script Metadata (re-declared on the next pass)
        this.scriptMeta = null;

        // 7. Reset live-tick baseline, and every per-pass tracker with it.
        //    `repeatableCalls` goes too: a second pass is a second script run,
        //    and carrying its snapshots over would restore a site from the
        //    previous run's inputs.
        this.committedSnapshot = null;
        this.forgetBarProgress();
        this.siteReach.clear();
        this.missedRepeat = null;
        this.statefulSites.clear();
        this.stateKeysBySite.clear();
        this.indexedStateKeys.clear();
        this.inputMemo = [];

        // 8. Reset MTF eval state (keep provided securityData — it's supplied input)
        this.htfStates.clear();
        this.requestedSecurities.clear();
        this.chartBars = [];
        this.chartAhead = null;
        this.derivedSeries.clear();
        this.heikinAshi.clear();

        // 9. Forget what was learned about the previous script's call sites. The
        //    ids are positional (`ta.sma#3`), so a second script reuses them
        //    for different calls, and a cached entry or argument plan from the
        //    first ran the wrong function with the wrong arguments.
        this.callIds.clear();
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

        // Drawing limits, read the way the other declaration arguments are.
        // Keyword-only in practice, so they are not in `order`.
        for (const [kind, name] of [
            ['line', 'max_lines_count'], ['label', 'max_labels_count'],
            ['box', 'max_boxes_count'], ['polyline', 'max_polylines_count'],
        ] as const) {
            const n = Number(arg(name));
            if (arg(name) !== undefined && Number.isFinite(n) && n > 0) {
                this.drawingLimits[kind] = Math.floor(n);
            }
        }

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
            const num = (name: string, fallback?: number): number | undefined => {
                const v = arg(name);
                return v !== undefined && Number.isFinite(Number(v)) ? Number(v) : fallback;
            };
            const str = (name: string): string | undefined => {
                const v = arg(name);
                return v !== undefined ? String(v) : undefined;
            };

            this.scriptMeta = {
                kind, title, shorttitle, overlay,
                pyramiding: arg('pyramiding') !== undefined ? Number(arg('pyramiding')) : 0,
                calc_on_every_tick: Boolean(arg('calc_on_every_tick')),
                calc_on_order_fills: Boolean(arg('calc_on_order_fills')),
                currency: arg('currency') !== undefined ? String(arg('currency')) : undefined,
                // Defaults are TradingView's own: one contract per order, no
                // costs, 100% margin, orders filled on the next bar's open.
                // The constants' own values, as `strategy.fixed` and friends
                // evaluate to — so a host comparing against them matches.
                default_qty_type: str('default_qty_type') ?? 'strategy.fixed',
                default_qty_value: num('default_qty_value', 1),
                commission_type: str('commission_type') ?? 'commission.percent',
                commission_value: num('commission_value', 0),
                slippage: num('slippage', 0),
                margin_long: num('margin_long', 100),
                margin_short: num('margin_short', 100),
                process_orders_on_close: Boolean(arg('process_orders_on_close')),
                ...(this.profile.version >= 6 && declared('calc_on_every_history_tick') !== undefined
                    ? { calc_on_every_history_tick: Boolean(declared('calc_on_every_history_tick')) }
                    : {}),
                risk_free_rate: num('risk_free_rate', 2),
            };

            // The broker's starting balance, which until now was read from
            // `strategy()` and thrown away — a script declaring
            // `initial_capital = 1000` was still backtested on 1,000,000, and
            // every percentage it reported was wrong by the ratio.
            //
            // `cash` moves with the first fill, so it can only be seeded here,
            // before the script's first bar.
            const capital = arg('initial_capital') ?? defaultInitialCapital(this.profile.version);
            if (capital !== undefined && Number.isFinite(Number(capital))) {
                this.initialCapital = Number(capital);
                // ONLY on the first bar. `strategy()` is a statement in the
                // script body, so it runs again on every bar — and re-seeding
                // `cash` each time handed the balance back to the broker after
                // every trade, leaving it permanently equal to the starting
                // capital. Nothing read `cash` closely enough to notice until
                // the equity curve plotted it.
                if (this.currentBarIndex === 0) {
                    this.cash = Number(capital);
                    // The broker's order pass ran before the script on this bar and
                    // seeded the `strategy.risk` baselines from the default capital:
                    // a 10,000 account then read as a 90% drawdown from a 100,000 peak.
                    const rs = (this as any)._riskState;
                    if (rs) rs.start_equity = rs.peak_equity = rs.prev_day_equity = this.cash;
                }
            }

            // Recorded before any override so a host can offer the script's
            // own value back.
            const declaredCapital = declared('initial_capital');
            this.declaredProperties.initial_capital =
                declaredCapital !== undefined && Number.isFinite(Number(declaredCapital))
                    ? Number(declaredCapital)
                    : defaultInitialCapital(this.profile.version);
            this.declaredProperties.pyramiding =
                declared('pyramiding') !== undefined ? Number(declared('pyramiding')) : 0;

            this.scriptMeta.initial_capital = this.initialCapital;

            // Every other overridable declaration argument, recorded before
            // the override so the properties panel can offer "reset to the
            // script's value" for each of them too.
            for (const key of ['commission_type', 'commission_value', 'slippage',
                               'default_qty_type', 'default_qty_value',
                               'margin_long', 'margin_short', 'risk_free_rate'] as const) {
                const v = declared(key);
                if (v !== undefined) this.declaredProperties[key] = v;
            }
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
        const n = this.inputCounter++;
        const currentId = INPUT_IDS[n] ??= `input_${n}`;

        // Where every bar after the first lands: the same call, handed the same
        // arguments, with the same override, answers the same value. The work
        // below (unwrapping, building the definition, clamping) is for the
        // first time, and for a call whose arguments are not plain values.
        const userSet = currentId in this.userInputs;
        const userVal = userSet ? this.userInputs[currentId] : undefined;
        const memo = this.inputMemo[n];
        if (memo && memo.defval === defval && memo.title === title && memo.type === type
            && memo.userSet === userSet && memo.userVal === userVal
            && isPlainInput(defval) && isPlainInput(userVal) && sameInputArgs(memo.meta, meta)) {
            return memo.result;
        }

        // Everything recorded here leaves the engine — a host reads `inputDefs`
        // to build its settings dialog, across a postMessage. And these values
        // come straight off the script, so
        //
        //     string SIZE_LARGE = "Large"
        //     input.string(SIZE_NORMAL, "Size", options = [SIZE_LARGE, …])
        //
        // hands over an array of `Series`, each holding this Context and through
        // it the whole sandbox. Unwrapping also makes `constrainInput` work:
        // `options.includes(value)` compared a Series against a string and was
        // never true, so every option list silently fell back to its default.
        const plainMeta: Record<string, any> = {};
        for (const [k, v] of Object.entries(meta)) plainMeta[k] = plainValue(v);

        // If it's the dry run (first time seeing this), save the definition
        if (this.inputDefs.length < this.inputCounter) {
            this.inputDefs.push({
                id: currentId,
                defval: plainValue(defval),
                title: title || currentId,
                type,
                ...plainMeta,
            });
        }

        // Return user override if it exists, otherwise return the default
        const raw = currentId in this.userInputs ? this.userInputs[currentId] : plainValue(defval);
        const result = Context.constrainInput(raw, { ...plainMeta, defval: plainValue(defval) });
        this.inputMemo[n] = { defval, title, type, meta, userSet, userVal, result };
        return result;
    }

    /** `registerInput`'s last answer for each input, by its position in the run. */
    private inputMemo: Array<{ defval: any; title: string; type: string; meta: Record<string, any>;
        userSet: boolean; userVal: any; result: any } | undefined> = [];

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

    /**
     * Does `fname` have a parameter called `name` at THIS version?
     *
     * The stdlib is one implementation across versions, so a parameter added
     * for v6 — `active` on every input, `text_formatting` on labels — is on
     * the shared function. V6_ONLY_PARAMS says which those are, and below v6
     * they are treated as absent.
     */
    private parameterExists(fname: string, name: string): boolean {
        if (this.profile.version >= 6) return true;
        return !V6_ONLY_PARAMS[fname]?.includes(name);
    }

    /**
     * Positional arguments, re-slotted for the signature THIS version has.
     *
     * The stdlib keeps one signature per function, the union of every
     * version's, and two kinds of version difference sit in the middle of one:
     *
     *   below v6   a parameter v6 ADDED (V6_ONLY_PARAMS). Filled by position
     *              it is cleared, so it does what it did before it existed:
     *              nothing. Keyword use is refused separately, in the binding
     *              below.
     *   at v6      a function whose v6 order differs from the shared one —
     *              v6 removed `transp` and `when` from the middle of several.
     *              Positional arguments are placed BY NAME from V6_POSITIONAL:
     *              v6 `plot(close, "p", c, 2, style, false)` means trackprice =
     *              false, not transp. A name the shared signature lacks is
     *              dropped and recorded, like an unknown keyword.
     */
    private positionalForVersion(fname: string, params: readonly string[], positional: any[]): any[] {
        const byName = this.profile.version >= 6 ? V6_POSITIONAL[fname]
            : this.profile.version === 5 ? V5_POSITIONAL[fname] : undefined;
        if (this.profile.version >= 6 || byName) {
            const order = byName;
            if (!order) return positional;
            const out: any[] = [];
            positional.forEach((value, i) => {
                const name = order[i];
                const at = name === undefined ? -1 : params.indexOf(name);
                if (at < 0) { this.droppedArguments.add(`${fname}(${name ?? `#${i + 1}`})`); return; }
                while (out.length < at) out.push(undefined);
                out[at] = value;
            });
            return out;
        }
        let out = positional;
        for (const name of V6_ONLY_PARAMS[fname] ?? []) {
            const at = params.indexOf(name);
            if (at >= 0 && at < out.length) {
                if (out === positional) out = [...positional];
                out[at] = undefined;
            }
        }
        return out;
    }

    public call(id: string, fn: Function, ...args: any[]) {
        // DIAGNOSTIC: If this triggers, the transpiler passed a null function reference
        if (typeof fn !== 'function') {
            throw new TypeError(`[Context.call] Execution error for ID "${id}": The provided reference is not a function. Check if the function exists in the stdlib.`);
        }

        const identity = id; 
        const path = this.callStack.push(identity);
        let info = this.callIds.get(id);
        if (!info) {
            this.callIds.set(id, info = { fname: removePrefix(extractFunctionName(id)), userFrame: id.includes("$fn_"), entry: undefined, resolved: false });
        }

        // A USER function's frame opens a series namespace; a built-in's does
        // not, because a built-in holds its state in a closure rather than in
        // `vars`. The emitter names every user function `<prefix>$fn_<name>`
        // and puts that name in the call id, which is what makes the two
        // tellable apart here.
        const userFrame = info.userFrame;
        if (userFrame) {
            this.seriesScopes.push(this.seriesScope);
            this.seriesScope = `${this.seriesScope}${identity}|`;
            this.frameSeqs.push(this.frameSeq);
            this.frameSeq = ++this.frameSeqCounter;
            this.frameArgs.push(this.argSeries);
            this.argSeries = args.filter((a) => a && typeof a.get === "function" && typeof a.id === "string");
        }

        // A BUILT-IN reached again on one bar overwrites that bar's slot
        // rather than appending a second one — see `barStateSnapshot`. User
        // frames are excluded: that is the rule for a series function's own
        // history, and a user function is an ordinary call that may
        // legitimately return two different things on one bar.
        const siteKey = userFrame ? "" : path;
        if (siteKey) {
            let reach = this.siteReach.get(siteKey);
            if (!reach) this.siteReach.set(siteKey, reach = { bar: -1, pass: -1, ever: false, probed: false, skipped: false });
            if (reach.bar === this.currentBarIndex && reach.pass === this.barPass) {
                if (reach.skipped) {
                    // A history run that takes rollback points only where the
                    // script is known to repeat a call: this is one it did not
                    // know. The run starts over knowing it (`Session.runHistory`).
                    this.missedRepeat = siteKey;
                    throw new Error(`'${removePrefix(extractFunctionName(id))}' was reached twice on bar ${this.currentBarIndex} without a rollback point.`);
                }
                this.restoreCallState(siteKey);
            } else {
                reach.bar = this.currentBarIndex;
                reach.pass = this.barPass;
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
                //
                // Performance: a history run may be told where the script
                // repeats a call (`repeatingSites`), and then only those sites
                // keep the snapshot on every bar: a site that never repeats
                // never reads it, and cloning a 5,000-value buffer per site per
                // bar was most of a long run (77 s, now 11.8 s). A site is
                // still snapshotted once while stateful, so state that cannot
                // be cloned is refused as ever.
                //
                // Invariant: a site reached twice on a bar without a snapshot
                // throws (above) rather than rolling back to the wrong state,
                // and `Session.runHistory` restarts with it added, so results
                // equal those of a run that snapshots everything. Whatever
                // changes what a snapshot holds or when a site counts as
                // reached twice must keep that throw reachable.
                // Guarded by tests/v1/runtime/lazy_rollback_points.test.ts
                // (results) and rollback_snapshot_work.test.ts (cloning spared).
                reach.skipped = false;
                if (!reach.ever) {
                    reach.ever = true;
                    this.snapshotCallState(siteKey, id);
                } else if (this.statefulSites.has(siteKey)) {
                    if (!this.repeatingSites || !reach.probed || this.repeatingSites.has(siteKey)) {
                        reach.probed = true;
                        this.snapshotCallState(siteKey, id);
                    } else {
                        reach.skipped = true;
                    }
                }
            }
        }

        try {
            const fname = info.fname;
            if (!info.resolved) { info.entry = this.entryFor(fname); info.resolved = true; }
            const entry = info.entry;

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

            // The positional arguments, mapped onto THIS version's signature
            // before any keyword is placed — see positionalForVersion.
            const positionalArgs = this.positionalForVersion(
                fname, entry.args, hasKwargs ? args.slice(0, -1) : args);
            let finalArgs = positionalArgs;
            // Only a keyword call names anything; the others share one empty set.
            let namedHere: Set<string> = EMPTY_NAMES;
            let positionalHere = positionalArgs.length;

            if (hasKwargs) {
                const kwargs = lastArg;

                if (entry.args.length > 0) {
                    // Which parameter each keyword names depends on the call
                    // SITE alone: the names are written in the source. So the
                    // binding is worked out the first time the site runs, and
                    // the other bars only copy values across.
                    let plan = info.plan;
                    if (!plan) {
                        plan = { keys: [], indices: [], named: new Set<string>() };
                        const params = entry.args;
                        for (const key of Object.keys(kwargs)) {
                            let cleanKey = removePrefix(key);
                            // v1-v4 spelled a few keywords differently; see
                            // V4_RENAMED_PARAMS.
                            if (this.profile.version < 5) cleanKey = V4_RENAMED_PARAMS[fname]?.[cleanKey] ?? cleanKey;
                            // A parameter v6 ADDED to a function earlier versions
                            // share is not part of their signature: it is dropped
                            // and recorded below exactly as before it existed, so
                            // a v5 script naming it behaves as it always did.
                            const index = this.parameterExists(fname, cleanKey)
                                ? params.indexOf(cleanKey) : -1;
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
                            else plan.named.add(cleanKey);
                            plan.keys.push(key);
                            plan.indices.push(index);
                        }
                        info.plan = plan;
                    }
                    finalArgs = [...positionalArgs];
                    for (let k = 0; k < plan.keys.length; k++) {
                        const index = plan.indices[k];
                        if (index === -1) continue;
                        while (finalArgs.length <= index) finalArgs.push(undefined);
                        finalArgs[index] = kwargs[plan.keys[k]];
                    }
                    namedHere = plan.named;
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

        } catch (e) {
            this.locateError(e, identity);
            throw e;
        } finally {
            if (userFrame) {
                this.seriesScope = this.seriesScopes.pop()!;
                this.frameSeq = this.frameSeqs.pop()!;
                this.argSeries = this.frameArgs.pop()!;
            }
            this.callStack.pop();
        }
    }

    /**
     * Pins a runtime error to the Pine source position of the call it passed
     * through, so the host can say WHERE the script failed.
     *
     * Every call id carries its position -- `array.get@L45:C12`, and
     * `array.get@L4:C14@L` for a call inside the library imported as `L` -- so
     * the position costs nothing until something throws: this runs only on
     * the way out, once per frame, and the first frame an error passes through
     * is the innermost call, which is the one that raised it. It is a property
     * of the error rather than text in its message, which other code matches.
     *
     * An error inside a library is located at the library's own line, and
     * the first frame outside it -- the call in the user's own script, the
     * line an editor can show -- is kept as `caller`.
     *
     * Not covered: an error raised in script code that is not inside any call
     * (nothing the stdlib throws is), which has no position to report.
     */
    private locateError(e: unknown, id: string): void {
        if (e === null || typeof e !== "object") return;
        const err = e as { pine?: PineLocation };
        const at = /@L(\d+):C(\d+)(?:@(.+))?$/.exec(id);
        if (!at) return;
        if (!err.pine) {
            err.pine = { line: Number(at[1]), col: Number(at[2]), ...(at[3] ? { library: at[3] } : {}) };
        } else if (err.pine.library && !err.pine.caller && !at[3]) {
            err.pine.caller = { line: Number(at[1]), col: Number(at[2]) };
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
        let entry = this.entries.get(name);
        if (entry === undefined && !this.entries.has(name)) {
            entry = viewFor(this.profile.version)[name] ?? REGISTRY[name];
            // color.from_gradient truncates RGB on v5 and v6 (probed); v4 was not, and keeps rounding.
            if (entry && name === "color.from_gradient" && this.profile.version === 4) {
                entry = { ...entry, ref: legacyFromGradient };
            }
            this.entries.set(name, entry);
        }
        return entry;
    }

    /** `entryFor`'s answers: the registries are large and the same few names are asked for on every bar. */
    private entries: Map<string, any> = new Map();

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

    /**
     * Per call site: the bar and pass it was last reached on, and whether it
     * has run at all. One lookup per call where there were three.
     */
    private siteReach: Map<string, { bar: number; pass: number; ever: boolean; probed: boolean; skipped: boolean }> = new Map();

    /**
     * The call sites a script is known to reach more than once on a bar. Null
     * (the default, and always for a forming bar) takes a rollback point at
     * every stateful site on every bar; a set takes one only at the sites in it,
     * and `missedRepeat` reports the first site that needed one and had none.
     *
     * Performance: only `Session.runHistory` sets it, for the history bars,
     * which are never re-ticked. A live or forming bar is re-ticked and rolled
     * back at every site, so it must keep this null: `runHistoryOnce` resets it
     * before returning, and anything else that runs bars must not set it.
     * Guarded by tests/v1/runtime/rollback_snapshot_work.test.ts. See
     * docs/common/ARCHITECTURE.md ("Performance invariants").
     */
    public repeatingSites: Set<string> | null = null;

    /** The site that was reached again on a bar with no rollback point; see `repeatingSites`. */
    public missedRepeat: string | null = null;

    /** Counts passes over a bar: `forgetBarProgress` starts a new one. */
    private barPass = 0;

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

    /** State keys already indexed in `stateKeysBySite`. */
    private indexedStateKeys: Set<string> = new Set();


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
        this.barPass++;
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
                copy.set(k, cloneState(v));
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
        for (const [k, v] of saved.states) this.states.set(k, cloneState(v));
    }

    public getPersistentState<T>(initFn: () => T): T {
        const key = this.callStack.length > 0 ? this.callStack.path : "global";

        // Index the key under its own site and every site it nests inside, so
        // `collectCallState` is a lookup rather than a scan. Once per key: the
        // index only ever grows, and is emptied with `reset`.
        if (!this.indexedStateKeys.has(key)) {
            this.indexedStateKeys.add(key);
            for (const prefix of this.callStack.keys) {
                this.statefulSites.add(prefix);
                let owned = this.stateKeysBySite.get(prefix);
                if (!owned) { owned = new Set(); this.stateKeysBySite.set(prefix, owned); }
                owned.add(key);
            }
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
    // (docs/common/ARCHITECTURE.md ("Design rules")). Only V4ToJsVisitor can emit
    // a call to it: v1–v3 have no `var` token, so their scripts cannot reach it.

    /** Declaration sites whose initialiser has already run, keyed by @L:C. */
    private varInitialised: Set<string> = new Set();

    /** Series declared `varip`, exempt from intra-bar rollback. */
    private varipSeries: Set<string> = new Set();

    /** Every series declared `var` or `varip`, by scoped name: what drawing eviction treats as a holder. */
    private varSeries: Set<string> = new Set();

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
        this.varSeries.add(scopedName);

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
     * `new_var` for the series behind a history reference on an expression,
     * `(close + 0)[3]`: bar-indexed, carrying its last value over the bars the
     * expression was not evaluated on. See `Series.updateCarry`.
     */
    public new_anon(name: string, val: any): Series {
        const key = this.scoped(name);
        let series = this.vars.get(key);
        if (!series) {
            series = new Series(this, key);
            this.vars.set(key, series);
        }
        const resolvedVal = val && typeof val.get === 'function' && typeof val.valueOf === 'function'
            ? val.valueOf() : val;
        return series.updateCarry(resolvedVal);
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
        // Case B: Raw Number (Expression) -> Fallback to Local History Lookup
        //
        // The series is resolved ONCE and kept, because the v6 rule below
        // needs it again: re-resolving it by name repeated the scoped map
        // search on every na history read, float and int series included.
        const series = target && typeof target.get === 'function' ? target : this.findSeries(id);
        // The call-site path returns here too, but through the bool rule below.
        const found = series && series === target && this.seriesScope !== "" && this.isOuterUserSeries(series)
            ? this.callSiteHistory(series, offset)
            : series ? series.get(offset) : NaN;

        // v6, MG §"Boolean values cannot be na": "`[]` on a bool variable on
        // the first bar returns false in v6, not na." A bool series is
        // recognised by its CURRENT value, which is the only one guaranteed to
        // exist when history runs out.
        //
        // Decided at run time rather than by the emitter, so a bool that the
        // static pass cannot see — a function local, a UDT field read into a
        // variable — is covered too. Gated on the profile flag, so v1–v5 keep
        // their `na`. History past the start reads back as null from a Series
        // and NaN from the fallback, so both count as "ran out".
        if (this.profile.defaults.boolsCanBeNa === false && series
            && (found === null || found === undefined || (typeof found === "number" && Number.isNaN(found)))
            && typeof series.get(0) === "boolean") {
            return false as any;
        }
        return found;
    }

    /**
     * A user variable declared OUTSIDE the running function: not one of its own
     * locals (their ids carry the frame's scope) and not a built-in series.
     */
    private isOuterUserSeries(series: any): boolean {
        const id = series.id;
        return typeof id === "string" && !id.startsWith(this.seriesScope) && !BASE_SERIES.has(id)
            && !id.startsWith("opsv2_builtin_hist_")   // a built-in's history, kept every bar
            && !this.argSeries.includes(series);
    }

    /**
     * `v[n]` on a variable from outside the running function. TradingView keeps
     * a history of it per CALL SITE, recorded only when that call runs
     * (Pine Logs, dev-docs/tv-parity/_probes/fn-history): `[n]` is its value at
     * the n-th previous call of this site, not on the n-th previous bar. Before
     * that many calls it is na. The probe's first calls (bars 0, 0) log na, and
     * the next ones read the value the variable had at those first calls.
     */
    private callSiteHistory(series: any, offset: number): any {
        const key = `${this.seriesScope}|hist|${series.id}`;
        let rec = this.states.get(key);
        if (!rec) this.states.set(key, rec = { seq: -1, vals: [], max: 0 });
        // The deepest offset this site has asked for: older entries can never be read.
        if (offset > rec.max) rec.max = offset;
        // Once per call: a second `v[k]` in the same call must not push again.
        if (rec.seq !== this.frameSeq) {
            rec.seq = this.frameSeq;
            rec.vals.push(series.get(0));
            // Trimmed in batches, not per call. The record is cloned on every realtime tick and
            // every calc_on_order_fills re-run, so it must not grow with the chart.
            const keep = rec.max + 1;
            if (rec.vals.length > 2 * keep + 16) rec.vals.splice(0, rec.vals.length - keep);
        }
        const at = rec.vals.length - 1 - offset;
        return at >= 0 ? rec.vals[at] : NaN;
    }

    /** The series registered under `name`, this frame's instance first. */
    private findSeries(name: string): any {
        // The frame first — a self-referential local (`s = nz(s[1]) + close`)
        // reaches this while its own `let` is still in the temporal dead zone,
        // and must find ITS instance rather than another call site's.
        return this.vars.get(this.scoped(name)) ?? this.vars.get(name);
    }

    /**
     * Internal helper for fallback lookups
     */
    public getSeries(name: string, offset: number): number {
        const series = this.findSeries(name);
        return series ? series.get(offset) : NaN;
    }

    public setBar(
        time: number, open: number, high: number, low: number, close: number, volume: number,
        // `calc_on_order_fills`: the caller fills this bar's orders itself, in
        // path order, see `runBarWithFills`.
        deferFills: boolean = false,
    ) {
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
        if (!deferFills && this._marketOrdersFilledBar !== this.currentBarIndex) {
            this._marketOrdersFilledBar = this.currentBarIndex;
            brokerFor(this).fillMarketOrders();

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

    /** Whether the script asked to be re-run after each order fill. */
    public get calcOnOrderFills(): boolean {
        // TradingView evidence on v4 (version-scope/v4-cof), v5 (calc-on-fills) and v6 (v6-cof).
        // The parameter does not exist before v4.
        return this.profile.version >= 4 && Boolean((this.scriptMeta as any)?.calc_on_order_fills);
    }

    /**
     * Set while a bar is being replayed for `calc_on_order_fills`: how far along
     * the bar's price path (segment index plus the share of it covered) the
     * last fill was, and the price there. Null otherwise.
     */
    public intrabar: { cursor: number; price: number } | null = null;

    /** The most times one bar is re-run after fills; TradingView's own limit is unknown. */
    private static readonly MAX_FILL_RERUNS = 100;

    /**
     * Runs one historical bar of a `calc_on_order_fills` strategy.
     *
     * Each fill, in the order it happens along the bar's path, re-runs the
     * script on the whole bar with `var` and series state put back to the bar's
     * start (as a realtime tick does; `varip` keeps its value), while the broker
     * keeps what filled. A market order the re-run places fills at once at the
     * price of the fill that triggered it, and a limit or stop order it places
     * can fill later on the same bar. The ordinary run comes last, and its
     * effects are what the next bar sees. Verified on TradingView's probe
     * calc-on-fills (dev-docs/tv-parity/_probes/calc-on-fills) and the 12/26-IT
     * strategy (ENGINE-BUGS.md section 1).
     */
    public runBarWithFills(
        time: number, open: number, high: number, low: number, close: number, volume: number,
        exec: () => void,
    ): void {
        this.setBar(time, open, high, low, close, volume, true);
        const broker = brokerFor(this);
        this.intrabar = { cursor: 0, price: open };
        let base: RuntimeSnapshot | null = null;
        try {
            const settle = (): boolean => {
                const before = this.filledOrderCount;
                if (this.marketOrders.length > 0) {
                    broker.fillMarketOrders(this.intrabar!.price);
                    if (this.filledOrderCount !== before) return true;
                }
                return broker.processIntrabarStep();
            };
            let more = settle();
            for (let reruns = 0; more && reruns < Context.MAX_FILL_RERUNS; reruns++) {
                if (!base) base = this.captureSnapshot();
                else this.restoreSnapshot(base, true);
                exec();
                more = settle();
            }
            if (base) this.restoreSnapshot(base, true);
        } finally {
            this.intrabar = null;
        }
        exec();
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
        // Copied only when something actually needs unwrapping. `plainValue`
        // is identity for everything except a Series, an array and a
        // function, and a plot record is overwhelmingly numbers and strings —
        // so rebuilding every record, field by field, on every bar, for every
        // plot, allocated an object per plot per bar to return the same
        // values. The scan below is a few typeof checks and no allocation.
        let needsUnwrapping = false;
        for (const k in data) {
            const v = data[k];
            if (v instanceof Series || Array.isArray(v) || typeof v === "function") {
                needsUnwrapping = true;
                break;
            }
        }
        if (!needsUnwrapping) return data;

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
            ? this.callStack.top
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

    public registerFill(id1: any, id2: any, options: { color?: string, title?: string, [k: string]: any } = {}) {
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
        if (options.gradient) {
            data.gradient = true;
            data.top_value = options.top_value;
            data.bottom_value = options.bottom_value;
            data.top_color = options.top_color;
            data.bottom_color = options.bottom_color;
        }
        const showLast = Number((options as any).show_last);
        if (Number.isFinite(showLast) && showLast >= 0) data.showLast = Math.trunc(showLast);

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
        // `process_orders_on_close`: market orders fill at the close of the bar
        // that placed them, once the script has run, rather than at the next
        // open. TradingView's log: the first trade of harness_strategy_pooc
        // enters at bar 1's close, 4108.37, where without it bar 2's open
        // fills the same order. `immediately` changes nothing there: every
        // market order already fills on the placing bar. Below v6 a close
        // placed with `immediately` fills here too.
        if (this.marketOrders.length > 0) brokerFor(this).fillAtClose();
        // After them: TradingView filled a scale-out market order at the close first and
        // then the stop that took the rest (see `Broker.fillBreachedExitsAtClose`).
        brokerFor(this).fillBreachedExitsAtClose();
        this.sampleEquity();
        this.currentBarIndex++;
    }

    /**
     * Records one equity point and advances the open position's excursion.
     *
     * Run at the END of a bar, after the script and the broker have both had
     * it: an entry placed on this bar is already in `position`, and the high
     * and low of the bar it filled on count towards its run-up, which is what
     * TradingView reports.
     */
    /**
     * Mark-to-market on the open position, at a price the caller names.
     *
     * One formula, three callers: the equity curve samples it at each bar's
     * close, `strategy.equity()` answers with it, and the performance report
     * takes it at the last close. All three had their own copy, so a change
     * to any of them — deducting the entry commission, say — would have
     * landed in one place and quietly disagreed with the other two.
     *
     * The price is a parameter rather than read from the Context because the
     * report deliberately uses `lastClose` and the other two use `close`.
     */
    openProfitAt(price: number): number {
        return this.position.size === 0
            ? 0
            : (price - this.position.avgPrice) * this.position.size * this.accountRate();
    }

    /**
     * What one unit of the symbol's currency is worth in the strategy's
     * currency (`strategy(currency = ...)`) on this bar: the latest sample of
     * the host's `currency_rate` series at or before the bar's time. 1 when the
     * script asked for no other currency, or the host supplied no series, so
     * nothing converts and nothing throws.
     *
     * TradingView converts each closed trade at the exit bar's rate
     * (_probes/currency-usd-1btc). Open profit converted at the current bar's
     * rate, and sizing (percent_of_equity, cash qty) left unconverted, are
     * unverified against TradingView.
     */
    accountRate(): number {
        const to = this.scriptMeta?.currency;
        if (!to || to === this.currency) return 1;
        const samples = this.getRequestData("currency_rate", `${this.currency}|${to}`);
        if (!samples) return 1;
        for (let i = samples.length - 1; i >= 0; i--) {
            if (samples[i].time <= this.time) return Number.isFinite(samples[i].value) ? samples[i].value : 1;
        }
        return 1;
    }

    private sampleEquity() {
        if (this.scriptMeta?.kind !== "strategy") return;

        if (Number.isNaN(this.firstClose)) this.firstClose = this.close;
        this.lastClose = this.close;

        const size = this.position.size;
        const openPL = this.openProfitAt(this.close);
        this.equityCurve.push({ time: this.time, equity: this.cash + openPL, openPL });

        if (size === 0) {
            this.positionRunup = 0;
            this.positionDrawdown = 0;
            return;
        }

        const qty = Math.abs(size);
        if (qty > this.maxContractsHeld) this.maxContractsHeld = qty;

        // Excursion is measured in price against the position's average, then
        // scaled by size - so a pyramided add moves it the way it moves P&L.
        const best = size > 0 ? this.high - this.position.avgPrice : this.position.avgPrice - this.low;
        const worst = size > 0 ? this.position.avgPrice - this.low : this.high - this.position.avgPrice;
        this.positionRunup = Math.max(this.positionRunup, best * qty);
        this.positionDrawdown = Math.max(this.positionDrawdown, worst * qty);
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
    /**
     * `barstate.isnew` / `isconfirmed` follow TradingView's realtime bar states, and `Session.commit`
     * runs the closing execution. Probed on v5 (rt-confirmed-v5) and v6 (rt-semantics-v6,
     * rt-confirmed-v6); v1-v4 keep the older reading (isnew always true, isconfirmed = not realtime).
     */
    public get realtimeBarStates(): boolean { return this.profile.version >= 5; }

    public applyTick(time: number, open: number, high: number, low: number, close: number, volume: number) {
        if (this.committedSnapshot === null) {
            this.committedSnapshot = this.captureSnapshot(); // baseline = state after last commit
            if (this.realtimeBarStates) this.is_new = true;  // first execution of this bar
        } else {
            this.restoreSnapshot(this.committedSnapshot);    // roll back the previous tick
            // Every later tick of the bar, rollback or not. Verified on TradingView:
            // dev-docs/tv-parity/_probes/realtime/rt-semantics-v6/run-20261113-040218.
            if (this.realtimeBarStates) this.is_new = false;
        }
        this.is_confirmed = false;
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
        if (this.realtimeBarStates) this.is_new = true; // the next bar's first execution
        this.is_confirmed = false;
    }

    /** A rollback point for a sub-context (see `request.security_lower_tf`): opaque to the caller. */
    public checkpoint(): unknown { return this.captureSnapshot(); }

    /** Rolls this context back to a `checkpoint()`. */
    public rollbackTo(cp: unknown): void { this.restoreSnapshot(cp as RuntimeSnapshot); }

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
            // The curve is append-only, so a length is a complete rollback
            // point for it and clones nothing.
            equityLen: this.equityCurve.length,
            positionRunup: this.positionRunup,
            positionDrawdown: this.positionDrawdown,
            maxContractsHeld: this.maxContractsHeld,
            commissionPaid: this.commissionPaid,
            filledOrderCount: this.filledOrderCount,
            netProfitSum: this.netProfitSum,
            orders: structuredClone(this.orders),
            marketOrders: structuredClone(this.marketOrders),
            pendingEntries: structuredClone((this as any)._pendingEntries ?? new Map()),
            pendingExits: structuredClone((this as any)._pendingExits ?? new Map()),
            riskState: structuredClone((this as any)._riskState ?? null),
            // A tick re-runs the bar: the drawings it made must go, an evicted one comes
            // back, and a setter's change (`set_x2`, `set_text`) is undone, so each
            // drawing's props are copied (see `cloneDrawing`).
            drawings: new Map([...this.drawings].map(([k, d]) => [k, cloneDrawing(d)])),
            drawingOrder: new Map([...this.drawingOrder].map(([k, v]) => [k, [...v]])),
            drawingCounter: this.drawingCounter,
        };
    }

    // `scriptOnly` puts back what the SCRIPT owns (series, `var` state, plots)
    // and keeps the broker as it is: a re-run after a fill must not undo the fill.
    private restoreSnapshot(s: RuntimeSnapshot, scriptOnly: boolean = false) {
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
        // Cloned again so the baseline stays pristine across repeated ticks.
        this.drawings = new Map([...s.drawings].map(([k, d]) => [k, cloneDrawing(d)]));
        this.drawingOrder = new Map([...s.drawingOrder].map(([k, v]) => [k, [...v]]));
        this.drawingCounter = s.drawingCounter;
        if (scriptOnly) return;
        this.position = structuredClone(s.position);
        this.cash = s.cash;
        this.trades = structuredClone(s.trades);
        this.equityCurve.length = s.equityLen;
        this.positionRunup = s.positionRunup;
        this.positionDrawdown = s.positionDrawdown;
        this.maxContractsHeld = s.maxContractsHeld;
        this.commissionPaid = s.commissionPaid;
        this.filledOrderCount = s.filledOrderCount;
        this.netProfitSum = s.netProfitSum;
        this.orders = structuredClone(s.orders);
        this.marketOrders = structuredClone(s.marketOrders);
        (this as any)._pendingEntries = structuredClone(s.pendingEntries);
        (this as any)._pendingExits = structuredClone(s.pendingExits);
        (this as any)._riskState = structuredClone(s.riskState);
    }

    // --- Multi-timeframe / security() (P1) ---

    private secKey(symbol: string, resolution: string): string {
        // "D" and "1D" are one timeframe, so data supplied for one answers a
        // request for the other, and a missing one is reported once.
        return `${symbol}@${canonicalTimeframe(resolution)}`;
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

    /**
     * The history run's whole dataset, set by `Session.runHistory`: only the TIMES
     * of the bars after the current one are read, to tell where a session or a
     * higher-timeframe bar ends. No price is ever taken from it.
     */
    public chartAhead: readonly { time: number }[] | null = null;

    /** Derived higher-timeframe series, keyed by resolution, extended as bars arrive. */
    private derivedSeries: Map<string, DerivedSeries> = new Map();

    /** Heikin-Ashi transforms of a request's candles, keyed like `securityData`. */
    private heikinAshi: Map<string, HeikinAshiSeries> = new Map();

    /**
     * Does `symbol` name the chart's OWN instrument?
     *
     * `request.security(syminfo.tickerid, …)` is how nearly every published
     * script asks for a higher timeframe of what it is already looking at, and
     * `syminfo.tickerid` is the exchange-qualified spelling of the same thing
     * `syminfo.ticker` gives bare. An empty symbol means the chart's too.
     */
    private isChartSymbol(symbol: string): boolean {
        // `ticker.heikinashi(syminfo.tickerid)` names the chart's instrument
        // too; only its candles differ, and `getSecurityData` transforms them.
        if (symbol.startsWith(HEIKINASHI)) symbol = symbol.slice(HEIKINASHI.length);
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
    private deriveSecurityData(symbol: string, resolution: string, lookaheadOn = false): SecurityCandle[] | undefined {
        if (!this.isChartSymbol(symbol)) return undefined;

        const want = specSeconds(resolution);
        const have = specSeconds(String(this.resolution));
        if (!Number.isFinite(want) || !Number.isFinite(have) || want < have) return undefined;

        // lookahead_on on a historical bar: TradingView gives the chart bar the
        // WHOLE higher-timeframe bar it belongs to, chart bars still to come
        // included, and a history run has them all. The live bar has no future,
        // so it keeps the causal fold below.
        const ahead = this.chartAhead as readonly SecurityCandle[] | null;
        if (lookaheadOn && !this.is_realtime && ahead && ahead.length > this.currentBarIndex
            && ahead[this.currentBarIndex].time === this.chartBars[this.currentBarIndex]?.time) {
            const key = resolution + "|ahead";
            let full = this.derivedSeries.get(key);
            if (!full || full.upto !== ahead.length) {
                const chartSeconds = specSeconds(String(this.resolution));
                this.derivedSeries.set(key, full = new DerivedSeries(resolution, Number.isFinite(chartSeconds) ? chartSeconds * 1000 : undefined));
                full.extend(ahead as SecurityCandle[], ahead.length);
            }
            return full.candles;
        }

        const seen = this.currentBarIndex + 1;
        let derived = this.derivedSeries.get(resolution);
        // A live bar is re-ticked with the same `seen`, but its candle has moved.
        if (derived && derived.upto === seen && !this.is_realtime) return derived.candles;

        // Extended by the bars that arrived since; started again when the run
        // has gone back to an earlier bar.
        if (!derived || derived.upto > seen) {
            const chartSeconds = specSeconds(String(this.resolution));
            this.derivedSeries.set(resolution, derived = new DerivedSeries(resolution, Number.isFinite(chartSeconds) ? chartSeconds * 1000 : undefined));
        }
        // A history run has the dataset in hand, so the chart bar after this one is
        // known and says whether a derived bar ends here; the live bar has none.
        derived.extend(this.chartBars, seen, this.chartAhead?.[seen]?.time);
        return derived.candles;
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

    /**
     * Where a request's history starts: always the first bar. `calc_bars_count`
     * ("the maximum number of recent historical bars the function can request")
     * is accepted and has NO observable effect, which TradingView's own log
     * shows (conformance/v5/parity/harness_security_cbc, BTCUSDT 5m, 5,464 bars):
     * `request.security("60", bar_index, calc_bars_count = 50)` equals the same
     * call without it on every row, and `ta.cum(1)` inside it is 6984 at chart
     * bar 0; `security_lower_tf("1", bar_index, calc_bars_count = 200)` likewise
     * equals the call without it. 50 and 200 limited nothing.
     *
     * (A data-supply fact for hosts, not a broker rule: the hourly context's
     * history starts long before the chart's first bar, with 6,983 hourly bars
     * ahead of it there, while the 1-minute lower-timeframe context starts at the
     * chart's first bar.)
     */
    public securityFirstBar(_symbol: string, _resolution: string, _calcBarsCount: any, _fname: string): number {
        return 0;
    }

    public getSecurityData(symbol: string, resolution: string, lookaheadOn = false): SecurityCandle[] | undefined {
        // Host-supplied data always wins: it is real data for the context the
        // script asked for, and a derivation is only ever a fallback.
        //
        // The chart's own symbol at the chart's own timeframe is the chart
        // series itself, bar for bar. It is not aggregated: grouping bars into
        // periods of their own length is the identity only while every bar
        // sits on its period's boundary, and a feed with its own session
        // offset does not.
        const candles = this.securityData.get(this.secKey(symbol, resolution))
            ?? (this.isOwnChartSeries(symbol, resolution)
                ? this.chartBars
                : this.deriveSecurityData(symbol, resolution, lookaheadOn));
        if (!candles) return candles;
        // heikinashi(tickerid) marks the symbol rather than wrapping the series,
        // which is how Pine models it — so the transform belongs here, at the
        // point the candles are read, and every security() behaviour above it
        // (alignment, no-lookahead, per-call-site state) is unchanged.
        if (!symbol.startsWith(HEIKINASHI)) return candles;
        // Built forward as bars arrive, not again from the first on every read:
        // a Heikin-Ashi request on the chart's own series is read on every bar.
        const key = this.secKey(symbol, resolution);
        let ha = this.heikinAshi.get(key);
        if (!ha) this.heikinAshi.set(key, ha = new HeikinAshiSeries());
        return ha.of(candles);
    }

    /** Records a (symbol, resolution) the script needs but hasn't been given. */
    public requestSecurity(symbol: string, resolution: string): void {
        this.requestedSecurities.add(this.secKey(symbol, resolution));
    }

    /**
     * The chart's context, for a sub-context that evaluates a requested
     * expression; null on the chart's own. `syminfo.main_tickerid` and
     * `timeframe.main_period` read it.
     */
    public main: Context | null = null;

    /**
     * A context to evaluate a `request.security` expression in: the requested
     * timeframe and symbol, and the chart's symbol facts when it is the
     * chart's symbol — `timeframe.period` inside the request is "5" for a
     * 5-minute request, as TradingView logs it, where a bare context said "1D".
     */
    public securitySubContext(symbol: string, resolution: string): Context {
        const sub = new (this.constructor as new (p: any) => Context)(this.profile);
        sub.main = this.main ?? this;
        sub.resolution = resolution === "" ? this.resolution : resolution;
        sub.timezone = this.timezone;
        // Every spelling of the chart's own symbol — the ticker id, the bare
        // ticker, "" — gets the chart's facts and reports the chart's ticker id,
        // the rule getSecurityData already uses to serve it the chart's bars.
        const chart = this.isChartSymbol(symbol);
        if (chart) {
            sub.mintick = this.mintick; sub.currency = this.currency; sub.basecurrency = this.basecurrency;
            sub.description = this.description; sub.symbolType = this.symbolType; sub.symbolRoot = this.symbolRoot;
            sub.pointvalue = this.pointvalue; sub.sessionSpec = this.sessionSpec; sub.mincontract = this.mincontract;
            sub.isin = this.isin; sub.currentContract = this.currentContract;
        }
        sub.symbol = chart ? this.symbol : symbol;
        return sub;
    }

    /** Stable key for the current call site (used for per-`security()` HTF state). */
    public currentCallKey(): string {
        return this.callStack.length > 0 ? this.callStack.path : "global";
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
    public evalSecurityBar(sub: Context, bar: SecurityCandle, thunk: () => any, provisional = false): any {
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
            // A provisional bar is a forming bar of the sub-context: rolled back to
            // the state before it on every evaluation (`applyTick`), and committed
            // (`commitBar`) when it is evaluated for good.
            const forming = provisional || sub.committedSnapshot !== null;
            if (forming) sub.applyTick(bar.time, bar.open, bar.high, bar.low, bar.close, bar.volume);
            else sub.setBar(bar.time, bar.open, bar.high, bar.low, bar.close, bar.volume);
            const r = thunk();
            const unwrap = (x: any) =>
                (x !== null && x !== undefined && typeof x.valueOf === "function") ? x.valueOf() : x;
            const num = unwrap(r);
            if (provisional) { /* stays forming */ }
            else if (forming) sub.commitBar();
            else sub.finalizeBar();

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


/** The type a runtime value shows: `Point`, `label`, `array<float>`, `int`. */
function valueType(x: any, depth = 0): string | null {
    const v = x instanceof Series ? x.valueOf() : x;
    if (v === null || v === undefined || (typeof v === "number" && Number.isNaN(v))) return null;
    if (typeof v === "number") return Number.isInteger(v) ? "int" : "float";
    if (typeof v === "boolean") return "bool";
    if (typeof v === "string") {
        // A drawing is held by its id, `<kind>_<n>` (Context.newDrawing).
        const drawing = /^(line|label|box|table|linefill|polyline)_\d+$/.exec(v);
        if (drawing) return drawing[1];
        return /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(v) ? "color" : "string";
    }
    if (typeof v !== "object") return null;
    if (typeof v.__type === "string") return v.__type;
    if (typeof v.__builtin === "string") return v.__builtin;
    if (v instanceof Map) return "map";
    if (Array.isArray(v)) {
        if ((v as any)[MATRIX_TAG]) return "matrix";
        if (depth > 0) return "array";
        const first = v.find(e => valueType(e, 1) !== null);
        return `array<${first === undefined ? "?" : valueType(first, 1)}>`;
    }
    return null;
}

/**
 * How well a value fits a declared parameter type: 3 exact, 1 compatible
 * (int as float, a colour as a string, an empty array as any array), 0 for
 * na, which fits anything, and a large negative for a mismatch.
 *
 * A whole number fits `float` better than `int`: it may be a float that
 * happens to be whole (`close` of 11.0), and the float body accepts an int,
 * as Pine widens every int, while the int body is wrong for a float. The
 * emitter resolves every int/float choice whose type it can see, so this
 * only decides the ones it cannot.
 */
function typeFit(declared: string, value: any): number {
    // The qualifier is a whole word: `seriesData` is a type, not `Data`.
    const want = declared.replace(/^\s*(series|simple|const)\s+/, "").replace(/\s+/g, "").replace(/\b[A-Za-z_]\w*\./g, "");
    const got = valueType(value);
    if (got === null) return 0;
    if (got === "int") return want === "float" ? 2 : want === "int" ? 1 : -100;
    if (want === got) return 3;
    // An enum member is the string "<Enum>.<member>" (Context.declareEnum).
    if (got === "string") {
        const member = /(?:^|\.)([A-Za-z_]\w*)\.[A-Za-z_]\w*$/.exec(String(value instanceof Series ? value.valueOf() : value));
        if (member && member[1] === want) return 3;
    }
    if (want === "string" && got === "color") return 1;
    if (want === "color" && got === "string") return 0;
    const arr = /^array<(.+)>$/.exec(want) ?? (/^(\w+)\[\]$/.exec(want));
    if (arr && got.startsWith("array<")) {
        const inner = got.slice(6, -1);
        if (inner === "?") return 1;
        // Whole-number elements, as for a whole number above.
        if (inner === "int") return arr[1] === "float" ? 2 : arr[1] === "int" ? 1 : -100;
        if (inner === arr[1]) return 3;
        return -100;
    }
    if (/^(map|matrix)</.test(want) && got === want.slice(0, want.indexOf("<"))) return 2;
    return -100;
}
