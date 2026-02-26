import { PREFIX, removePrefix, extractFunctionName } from "../../utils/v2/common";
import { Series } from "./Series";
import { REGISTRY } from "./stdlib";

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

export interface PlotData {
    value: number;
    title: string;
    color?: string;
    linewidth?: number;
    style?: any;
    type: 'line' | 'shape' | 'char' | 'bar';
}

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

export class Context {
    // 1. Internal Execution State (Private)
    protected callStack: string[] = [];
    private states: Map<string, any> = new Map();

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
    public plots: Map<string, (PlotData | null)[]> = new Map(); 
    public fills: Map<string, (FillData | null)[]> = new Map();

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

    constructor() {
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

        // 5. Reset Strategy State
        this.position = { size: 0, avgPrice: 0 };
        this.cash = 100000;
        this.trades = [];
        this.orders = [];
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
        const identity = id; 
        this.callStack.push(identity);
        
        try {
            // 1. Extract Function Name from ID (e.g. "ta.sma_L10_C4" -> "ta.sma")
            const fname = removePrefix(extractFunctionName(id)); 
            
            // 2. Fast O(1) Registry Lookup
            const entry = REGISTRY[fname];

            // 3. Protect Static Values
            if (entry && entry.is_value) {
                throw new Error(`TypeError: '${fname}' is a value, not a function. You cannot call it.`);
            }

            // 4. Handle Keyword Arguments
            const lastArg = args[args.length - 1];
            const hasKwargs = lastArg && typeof lastArg === 'object' && !Array.isArray(lastArg) 
                            && !(lastArg instanceof Series) && lastArg.constructor === Object;

            let finalArgs = args;

            if (hasKwargs) {
                const positionalArgs = args.slice(0, -1);
                const kwargs = lastArg;

                if (entry && entry.args.length > 0) {
                    finalArgs = [...positionalArgs];
                    const params = entry.args; // e.g., ["series", "title", "color"]
                    
                    for (const [_key, val] of Object.entries(kwargs)) {
                        // _key is "opsv2_color". We strip it to match "color" in the registry.
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

            // 5. Execute with Context Injection check
            if (entry && entry.uses_context) {
                return fn(this, ...finalArgs); // Inject 'this' as the first parameter
            } else {
                return fn(...finalArgs); // Standard call
            }

        } finally {
            this.callStack.pop();
        }
    }

    public getPersistentState<T>(initFn: () => T): T {
        const key = this.callStack.length > 0 ? this.callStack.join("/") : "global";
        if (!this.states.has(key)) {
            this.states.set(key, initFn());
        }
        return this.states.get(key);
    }

    // --- Series Management ---

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

    public registerPlot(
        value: number, 
        title: string = "Plot", 
        options: { 
            color?: string, 
            linewidth?: number, 
            style?: any,
            type?: 'line' | 'shape' | 'char' | 'bar'
        } = {}
    ) {
        // 1. Get the Unique Call ID (Storage Key)
        // This ensures that "plot(close)" and "plot(open)" don't overwrite each other 
        // just because they both default to title="Plot".
        const id = this.callStack.length > 0 
            ? this.callStack[this.callStack.length - 1] 
            : title;

        // 2. Use ID to retrieve the series
        let series = this.plots.get(id);

        if (!series) {
            series = [];
            this.plots.set(id, series); // Store by ID
            
            // Backfill history if this plot appears conditionally later in the script
            while (series.length < this.currentBarIndex) {
                series.push(null);
            }
        }

        const data: PlotData = {
            value: Number(value), // 3. Ensure Primitive Number
            title: title,         // 4. Store Display Title (can be duplicate)      
            color: options.color,
            linewidth: options.linewidth,
            style: options.style,
            type: options.type || 'line'
        };

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
}
