# Changelog

## 0.2.1 (2026-11-25)

### CLI
- **The summary uses the strategy's own starting capital.** It used to measure against a fixed 100,000, so a v5 strategy with no `initial_capital` (TradingView's default is 1,000,000) reported +900%. Net profit and every percentage now use `initial_capital`, or the version's default when the script declares none.
- **New `Initial Capital` line** in the terminal summary; `summary.json` and the JSON output gain `initial_capital` and `max_drawdown` (the amount).
- **`trades.csv` Profit %** is the trade's return on its entry value, as in TradingView's trade list.
- **Epoch timestamps in the data CSV.** `time` can be a Unix epoch in seconds, milliseconds, microseconds or nanoseconds. ISO date-times with no zone are read as UTC. A time that cannot be read exits 1 with the line and the value, instead of crashing after "Done".
- `--help` has a short "Data CSV" section.

### Engine
- **Max drawdown matches TradingView.** The performance report and `strategy.max_drawdown` / `strategy.max_drawdown_percent` measure from the highest realized equity to the open position's worst price, as TradingView does.
- **Strategy fixes:** `strategy.direction.all` works at v2–v6; `strategy.position_entry_name` at v4–v6; exits of a trade opened on a bar only walk the rest of that bar; `percent_of_equity` sizing no longer prices the open position at the fill bar's close; a pending `strategy.entry` placed while pyramiding is full is not live.
- **`input(defval, type=input.time)`** works at v4; `display.none` / `display.all` and the `label.style_labelup` / `label.style_labeldown` spellings work at v4.
- **Functions returning tuples** work at v1–v3.
- **`x == na` and `x != na`** compile at v1–v5 and are false on every bar; v6 refuses them, as TradingView does.
- **Re-declaring an outer variable inside a block** (`score = score + 1` in an `if`) declares a new local, as on TradingView, instead of failing with "cannot reference itself".
- **Calendar functions given `na`** read Unix time 0, so `year(time[1])` on the first bar is 1970.
- **`request.security`:** script-level variables read inside the expression are computed on the requested timeframe; input overrides are honoured.
- **More scripts run as on TradingView** (checked on a set of well-known public indicators): function-local variables no longer share storage with same-named script variables, `array.stdev` / `array.variance` honour `biased`, `color.from_gradient` rounds exactly and handles `na`, deleting a line deletes its linefills, and methods named like built-ins (`push`) resolve by receiver type.
- `calc_bars_count` in `indicator()` is supported.

### Docs
- README: demo GIFs of the CLI and of Zeal Terminal running a strategy on this engine.
- README, docs site and `llms.txt`: describe the project as an open-source TradingView alternative; added a link to the community Discord.
- `CLI-Usage.md` and the CLI guide: CSV time formats, starting capital, drawdown definition, refreshed example output.

## 0.2.0 (2026-11-13)

### New
- **Volume built-ins:** `accdist`, `iii`, `nvi`, `obv`, `pvi`, `pvt`, `wad` and `wvad`, as bare names at v4 and as `ta.*` at v5 and v6. At v1–v3 only `accdist` exists; the others are refused at compile time, as on TradingView.
- **`runtime.error`** is reported with `kind: "script"`, so a host can show it as the script's own message rather than as an engine failure.

### Fixed
- **`ta.hma`** smooths over `floor(sqrt(length))`, as TradingView does; it used to round.
- **`na` comparisons:** `na != x` is false at every version, as are `==`, `>` and `<` against `na`.
- **`ta.atr` and `ta.tr` inside a branch (v4–v6):** the true range is measured from the previous chart bar's close, and the RMA advances only on the bars where the function is called.
- **v1–v3 ternaries** evaluate both branches on every bar, as TradingView does there. v4 and later stay lazy.
- **Built-in variables** such as `timeframe.period` read as values even when a script uses a namespace name as a parameter name.
- **Exits at the close (v5–v6):** under `process_orders_on_close`, a `strategy.exit` stop or limit that the close has already passed fills at that close.
- **Compiler:** `ta.vwap(src, stdev_mult=...)` without `anchor`, and `hline(..., display=...)` with a value other than `display.all` or `display.none`, are rejected with TradingView's messages (v5, v6).

### Docs
- The docs site home page no longer shows up empty when you come back with the browser's Back button.
- The npm homepage link goes to the docs site.

## 0.1.1 (2026-11-13)

### Fixed
- **Clean installs.** The parser runtime is now `antlr4ng` 3. 0.1.0 pulled in a deprecated package, which printed `npm warn deprecated` on every `npm install openpinescript` and `npx openpinescript`. A fresh install now prints no warnings.

### CLI
- Usage and `--help` show `openpinescript <script.pine> --data <data.csv> [flags]` and the `npx` form.
- `--help` / `-h` exit 0 and print to stdout. A missing script or `--data` exits 1 with the usage on stderr.

### Docs
- Install instructions teach `npx openpinescript` and `npm install openpinescript`.
- The README's `--json` and `--emit-js` examples, which never existed, use real flags.
- The browser tutorial accepts `npx openpinescript ...`.

## 0.1.0 (2026-11-13)

First release on npm: `npx openpinescript <script.pine> --data <data.csv>`, or `npm install openpinescript` for the library.

### New
- **Pine Script v6**, with its own grammar, parser and emitter: strict bools, lazy `and` / `or`, dynamic `for` bounds, `once`, multiline strings, text formatting, negative array indices, `sort_field`, `request.footprint()` and library constants.
- **v6 broker:** `strategy.exit()` takes whichever paired level triggers first, and margin is enforced.
- **`strategy(currency=...)`:** results convert into the strategy's currency at a daily rate the host supplies with `Session.provideCurrencyRate`.
- **`Session.setChart`** tells the engine the chart's symbol, timeframe, currency and `mincontract`.
- **Docs site** at https://be-thomas.github.io/OpenPineScript/: a CLI guide written for AI agents, and a five-lesson tutorial that runs the real CLI in the browser.
- **Integration guide** for embedding the engine in a charting UI, and `VERSIONS.md` listing what differs between v1 and v6.
- The package is named `openpinescript`, matching the CLI command.

### Strategy
- `calc_on_order_fills` runs the script again after each fill (v4–v6).
- Default `initial_capital` follows the version: 1,000,000 on v5, 100,000 elsewhere.
- `percent_of_equity` leaves room for commission, and quantities are floored to `syminfo.mincontract`.
- Limit and stop levels snap to the exact tick, so a limit at a bar's exact price fills.
- `strategy.risk.*` accept `strategy.percent_of_equity`.

### Fixed
- `barstate.isnew` is true only on a live bar's first tick, and `Session.commit(finalCandle?)` runs TradingView's extra bar-close execution (v5, v6).
- `request.security` honours `lookahead_on` on chart-derived higher timeframes.
- Comparisons use TradingView's 1e-10 tolerance on every version.
- `str.tostring`, `str.format` and `log.*` number formats match TradingView, including half-even rounding.
- `/` between two constant ints truncates on v1–v4.
- Long histories run faster.

### Compiler
- Scripts TradingView refuses are refused with its wording: float-to-int assignment, untyped `na`, `request.*` in a loop or `if` without `dynamic_requests` (v5), `color.new` without transparency, and indicators with no output.
- Parse errors name the line and what was expected.
- Libraries compile for `import` resolution.

### Tests
- About 4,400 tests, up from about 2,400, most of them checked against TradingView's own output.
