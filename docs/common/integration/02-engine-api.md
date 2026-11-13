# 2 · The engine API

Everything here is exported from the package root.

## `Session`

A session holds one compiled script. Reuse it across runs; create a new one per
script.

```ts
const session = new Session();
```

### Call order

```
setChart(chart)            ← before compile; applies to the dry run and every run
compile(source, opts?)     ← required; discovers inputs, properties and metadata
  ├─ setInputs(values)     ← optional, any time after compile
  ├─ setProperties(values) ← optional (strategies), applies to the next runHistory
  ├─ provideData(…)        ← optional, before runHistory
  ├─ provideCurrencyRate(…)← optional, before runHistory (strategy currency conversion)
  └─ runHistory(candles)   ← the historical pass
       ├─ tick(candle)     ← optional, live edge; requires runHistory
       └─ commit(finalCandle?) ← closes the forming bar
```

Calling out of order throws a plain `Error` (`"compile() first"`,
`"runHistory() first"`). Those are host bugs, not script errors, which is why
they throw rather than appearing in `errors`.

`runHistory` may be called repeatedly. It builds a **fresh context** each time,
so changing inputs and re-running is correct and needs no reset.

---

### `setChart(chart: ChartSettings)`

Tells the engine which chart it is running on. **A host must call this**: the
timeframe and the symbol's facts cannot be derived from OHLCV bars, and scripts
branch on them (`timeframe.period`, `timeframe.multiplier`, `syminfo.type`,
`syminfo.mintick`, `time(tf, session)` windows in the exchange's timezone).

```ts
interface ChartSettings {
  symbol: string;          // non-empty; becomes syminfo.tickerid
  timeframe: string;       // Pine's spelling, see below
  mintick?: number;        // default 0.01; fills and order levels snap to it
  type?: string;           // "stock", "crypto", "futures", …
  currency?: string;
  basecurrency?: string;
  description?: string;
  timezone?: string;       // the exchange's IANA zone, e.g. "America/New_York"
  pointvalue?: number;
  session?: string;
  mincontract?: number;
  root?: string;
}
```

```ts
session.setChart({ symbol: "CME_MINI:ES1!", timeframe: "5", mintick: 0.25,
                   type: "futures", timezone: "America/Chicago" });
```

- `timeframe` is **Pine's** format: a count (optional) and a unit. `"1"`, `"5"`,
  `"60"`, `"240"` are minutes, `"1S"` seconds, `"D"`, `"W"`, `"M"`, `"12M"`. A
  charting library's `"5m"` or `"1H"` is **rejected**: `setChart` throws an
  `Error` naming the accepted forms, because `"5m"` would otherwise read as five
  months.
- `symbol` must be non-empty, or `setChart` throws.
- It takes effect from the next `compile` or `runHistory`; call it again to
  change chart. Fields you omit keep the engine's defaults.
- If you never call it, the run still works at timeframe `"D"` and symbol
  `SYMBOL`, and `result.warnings` carries
  *"chart not set: timeframe defaults to D and symbol to SYMBOL — call Session.setChart"*.
  Treat that warning as a bug in your host.

---

### `compile(source, opts?): Compiled`

```ts
interface Compiled {
  protocolVersion: number;        // PROTOCOL_VERSION; a bump is a breaking change
  engineVersion: "v2";
  meta: ScriptMeta | null;        // null when compilation failed
  inputs: InputView[];
  properties: PropertyView[];     // strategy() arguments a host may override; [] for an indicator
  errors: EngineError[];          // empty means success
}
```

`opts.libraries` is `Record<string, string>`: the source of each library the
script imports, keyed by `user/name/version`. Find which with
`requiredLibraries(source)`; see [LIBRARIES.md](../LIBRARIES.md). An import
with no source is a compile error naming the library.

The Pine version comes from the `//@version=N` annotation (absent means v1) and
is exposed as `session.pineVersion` after the call.

```ts
interface ScriptMeta {
  kind: "study" | "indicator" | "strategy" | "library";
  title: string;
  shorttitle: string;
  overlay: boolean;               // drives pane assignment
  precision?: number;             // study/indicator only
  pyramiding?: number;            // strategy only
  calc_on_every_tick?: boolean;   // strategy only
  calc_on_order_fills?: boolean;  // strategy only
  currency?: string;              // strategy only
  // plus, for a strategy, the rest of the declaration: initial_capital,
  // default_qty_type, default_qty_value, commission_type, commission_value,
  // slippage, margin_long, margin_short, process_orders_on_close, …
}
```

`kind: "library"` plots nothing and exists to be imported, so do not offer to add
one to a chart. `"strategy"` unlocks the output in [04-strategies.md](04-strategies.md).

---

### Inputs

```ts
interface InputView {
  id: string;          // "input_0", "input_1", … assigned in source order
  title: string;       // the label the script gave it
  type: string;        // "integer" | "float" | "bool" | "string" | "source" | …
  default: any;
  current: any;        // default, or the override you set
  overridden: boolean;
  // present only when the script set them, so you can build the right control:
  minval?: number; maxval?: number; step?: number;
  options?: any[];     // a dropdown
  tooltip?: string; group?: string; inline?: string; confirm?: boolean;
}
```

Render one control per entry, keyed by `id`:

```ts
session.setInputs({ input_0: 50, input_1: true });
const result = session.runHistory(candles);   // re-run to see the effect
```

`setInputs` **merges**: two calls with different keys keep both. Values apply on
the next `runHistory` and also to the live context if one exists. `minval`,
`maxval` and `options` are **enforced**, not merely reported: an override
outside the range is clamped.

---

### `setProperties(values)` and `compiled.properties`

A strategy's declaration arguments, which TradingView's Properties tab lets a
user change without editing the script.

```ts
interface PropertyView {
  key: string;                          // "initial_capital", "pyramiding", "commission_value", …
  title: string;
  type: "float" | "integer" | "string";
  current: number | string;             // in force now
  declared: number | string;            // what the script wrote
  options?: string[];                   // the only values a string property accepts
  unit?: string;                        // "%", "ticks", "contracts", a currency
  minval?: number;
  group?: string;                       // "Trading" or "Costs"
}
```

```ts
session.setProperties({ initial_capital: 50_000, commission_value: 0.1 });
session.runHistory(candles);
```

Unlike `setInputs`, a property **cannot change a run in progress**: cash moves
with the first fill, so it is seeded when the script declares itself. The next
`runHistory` picks it up. `setProperties` merges like `setInputs`.

---

### `provideData(symbol, resolution, candles)`

Fulfils a `request.security()` / `security()` / `request.security_lower_tf()`
call. The engine never fetches anything.

```ts
session.provideData("AAPL", "D", dailyCandles);   // SecurityCandle[]: Candle + optional closeTime
session.provideData("AAPL", "W", weeklyCandles);
```

- `symbol` must match what the script asks for. `syminfo.tickerid` is the
  `symbol` you gave `setChart`, so a script requesting its own symbol at another
  timeframe needs **that** string here.
- `resolution` is Pine's spelling, as in `setChart`.
- `closeTime` on a candle (when the bar closes) is optional; supply it if your
  higher-timeframe bars end where an exchange session ends rather than on a clock
  boundary.
- A request with no data returns `na` rather than raising, and
  `result.warnings` says which symbol and timeframe went unsupplied.

---

### `provideCurrencyRate(from, to, samples)`

Supplies the daily conversion rate that `request.currency_rate(from, to)` reads,
and that a strategy uses to report in its own currency. The engine never fetches
a rate.

```ts
session.setChart({ symbol: "BTCUSDT", timeframe: "60", currency: "USD" });
session.provideCurrencyRate("USD", "EUR", [
  { time: dayStartMs, value: 0.92 },     // one sample per day, time = start of the day in ms
  { time: nextDayStartMs, value: 0.91 },
]);
```

- `from` is the symbol's currency (`setChart({ currency })`); `to` is what the
  script asked for with `strategy(currency = currency.EUR)`.
- With a rate supplied, each **closed trade's** profit and commission are booked
  at the rate in effect on the **exit bar**, as TradingView does.
- **Not verified against TradingView:** open profit is converted at the current
  bar's rate, and order sizing is left unconverted.
- Calling it again for the same pair replaces that pair's series; it does not
  append.
- Without a rate for the pair, nothing is converted: results stay in the
  symbol's currency, and `result.warnings` says so (`the strategy's currency is
  EUR but the symbol's is USD, and no rate was supplied: results stay in USD`).

---

### `runHistory(candles, opts?): SimResult`

The historical pass. One script execution per candle, in order.
`opts.onProgress(done, total)` is called roughly every 1% of the bars and once
at the end; a callback that throws is ignored.

```ts
interface SimResult {
  protocolVersion: number;
  engineVersion: "v2";
  meta: ScriptMeta | null;
  barsProcessed: number;          // bars completed
  series: RenderSeries[];         // one per plot, see 03-plotting.md
  fills: Array<{ plotId1: string; plotId2: string; color: string; title: string;
                 colors?: Array<string | null>; showLast?: number }>;
  drawings: Drawing[];            // line/label/box/table/polyline/linefill
  logs: LogEntry[];               // log.info / log.warning / log.error
  trades: Trade[];                // CLOSED trades, see 04-strategies.md
  position: Position;             // the trade still open; size 0 while flat
  summary: { netProfit: number; closedTrades: number; winRate: number } | null;
  performance: Performance | null;// TradingView's performance summary; null for an indicator
  equity: EquityPoint[];          // account value at every bar's close; [] for an indicator
  alerts: any[];                  // reserved; always []
  errors: EngineError[];
  droppedArguments: string[];     // arguments the script passed that were ignored, "fill(display)"
  warnings: string[];             // things the HOST left unsaid, in words a person can act on
}
```

**`barsProcessed` is the one to check.** If a script raises on bar 900 of 2,000,
`errors` has one entry with `phase: "runtime"` and `bar: 900`, and the series are
still populated up to that point. Render them and show the error beside the
chart rather than discarding the run.

**`warnings` is for you, not the script's author.** Today it reports a chart that
was never set, a `request.security` whose data was never provided, and a
strategy whose `currency` differs from the symbol's with no rate supplied.
`droppedArguments` is the engine saying "I ignored this": show it beside a result
that differs from TradingView's.

---

### Errors

```ts
interface EngineError {
  phase: "parse" | "transpile" | "runtime";
  line?: number;                  // 1-based
  col?: number;                   // 0-based
  message: string;
  severity: "error" | "warning";
  bar?: number;                   // runtime errors from runHistory: the 0-based bar
  detail?: string;                // the parser's own text, when `message` was rewritten
  library?: { alias: string; line: number; col: number };  // raised inside an imported library
}
```

| Phase | Means | Typical UI |
|---|---|---|
| `parse` | The grammar rejected it: a syntax error | Squiggle at `line`/`col` |
| `transpile` | Parsed, but a language rule refused it: undeclared identifier, a built-in missing at this version, a type mismatch | Same, message verbatim |
| `runtime` | Threw while running: out-of-bounds array index, `runtime.error()` | A banner; keep the partial chart |

Messages are written to read like TradingView's and are safe to show as-is. A
version-specific one names the version: *"Pine Script v5 Error at @L2:C19: …"*.
For an error inside an imported library, `line`/`col` name the call in the
user's script and `library` names the position inside the library.

---

## `runScript(source, options)`

Compile and run in one call, for hosts with nothing to collect.

```ts
const result = runScript(source, {
  candles,
  chart:      { symbol: "AAPL", timeframe: "D" },
  inputs:     { input_0: 20 },
  properties: { initial_capital: 50_000 },
  securities: [{ symbol: "AAPL", resolution: "W", candles: weekly }],
  libraries:  { "user/lib/1": librarySource },
});
```

A compile failure returns a `SimResult` with `errors` set and everything else
empty, rather than throwing.

---

## Lower level

For a host that drives the bar loop itself: a custom replay, a different tick
model, a test harness. `Session` is built on exactly these:

```ts
import { compileScript, Context, compile, buildRenderModel } from "open-pinescript";

const { js, profile } = compileScript(source);               // Pine → JavaScript
const ctx = new Context(profile);                            // profile MUST match
ctx.provideSymbolInfo({ symbol: "AAPL", mintick: 0.01 });    // what setChart does
ctx.resolution = "D";
const exec = compile(js, ctx, Object.create(null));

for (const bar of candles) {
  ctx.setBar(bar.time, bar.open, bar.high, bar.low, bar.close, bar.volume);
  exec();                 // one pass of the script over this bar
  ctx.finalizeBar();      // commit the bar and advance the index
}

const model = buildRenderModel(ctx);   // series, fills, drawings, logs, trades, …
```

The `profile` from `compileScript` carries the language version and **must** be
given to the `Context`; a bare `Context()` runs the script under v1 semantics
whatever it was compiled as. `transpile(source)` returns just the JavaScript.
There is no public `exec` on `Session`: the compiled script is private to it.
