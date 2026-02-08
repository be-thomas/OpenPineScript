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


export class Context {
    // 1. Internal State (Private)
    // Used for O(1) TA memory. 
    private states: any[] = [];
    private callCounter: number = 0;

    // 2. Market Data (Public)
    public time: number = 0;
    public open: number = 0;
    public high: number = 0;
    public low: number = 0;
    public close: number = 0;
    public volume: number = 0;

    // 3. Engine State (Public)
    public currentBarIndex: number = 0; // Tracks global bar index (0, 1, 2...)
    public plots: Map<string, number[]> = new Map(); // Stores the output data series

    // 4. Strategy State (Public)
    public position: Position = { size: 0, avgPrice: 0 };
    public cash: number = 100000; // Default $100k
    public trades: Trade[] = [];

    // Internal Order Queue (Executed at end of bar or next open)
    public orders: any[] = [];

    constructor() {}

    /**
     * Resets the per-bar call counter.
     * Must be called by the Runtime BEFORE executing the script for a bar.
     */
    public reset() {
        this.callCounter = 0;
    }

    /**
     * Retrieves state for the current function call (O(1) access).
     * @param initFn A function that returns the initial state if it doesn't exist.
     */
    public getPersistentState<T>(initFn: () => T): T {
        const idx = this.callCounter++;
        
        // Initialize if missing
        if (this.states[idx] === undefined) {
            this.states[idx] = initFn();
        }
        
        return this.states[idx];
    }

    /**
     * Records a plot value for the current bar.
     * Handles "Late Registration" (backfilling) and "Overwrite" (multiple calls).
     * * @param value The value to plot (number or NaN).
     * @param title The title/ID of the plot series.
     */
    public registerPlot(value: number, title: string = "Plot") {
        let series = this.plots.get(title);

        // A. Initialization & Backfill
        // If this is the first time we see this plot (e.g., it was inside an 'if' that just became true at Bar 50),
        // we must fill all previous bars (0 to 49) with NaN so the array aligns.
        if (!series) {
            series = [];
            this.plots.set(title, series);
            
            // Backfill gaps
            while (series.length < this.currentBarIndex) {
                series.push(NaN);
            }
        }

        // B. Set Value for Current Bar
        // If we already have a value for this bar (e.g. called twice), overwrite it.
        // Otherwise, push it.
        if (series.length > this.currentBarIndex) {
            series[this.currentBarIndex] = value;
        } else {
            series.push(value);
        }
    }

    /**
     * Finalizes the current bar.
     * Must be called by the Runtime AFTER executing the script for a bar.
     * 1. Fills any skipped plots with NaN (Synchronization).
     * 2. Increments the global bar index.
     */
    public finalizeBar() {
        this.plots.forEach((series) => {
            // If the series length equals the index, it means we haven't pushed a value for THIS bar yet.
            // (Index 0 needs Length 1 to be complete)
            if (series.length <= this.currentBarIndex) {
                series.push(NaN);
            }
        });
        this.currentBarIndex++;
    }
}
