# OpenPineScript CLI: usage guide for AI agents

You are reading the complete, verified usage guide for the `openpinescript` command line tool.
OpenPineScript compiles TradingView Pine Script (v1 to v6) to JavaScript and runs it locally against
a CSV of candles. No network, no TradingView account. Every command and output below was run against
the real engine on `AAPL.csv`, the sample file (506 daily AAPL bars, 2015-02-17 to 2017-02-16).

Follow the steps in order. Do not invent flags: the full list is in section 3, and unknown flags are
silently ignored (they do not error), so a misspelt flag fails quietly.

---

## 1. Install

The package is on npm as `openpinescript`. Requires Node.js 20 or newer. Nothing to clone or build.

```bash
npx openpinescript <script.pine> --data <data.csv> [flags]
```

`npx` downloads the package on first use and runs its `openpinescript` command. For repeated use, install
it once: `npm install --global openpinescript`, or `npm install --save-dev openpinescript` and run it with
`npx openpinescript`. For the library (section 11): `npm install openpinescript`.

Throughout this guide `openpinescript` stands for `npx openpinescript`. Paths are relative to the
current directory.

Get the sample files the examples below use (any directory will do):

```bash
mkdir -p examples
curl -sSfo AAPL.csv https://be-thomas.github.io/OpenPineScript/data/AAPL.csv
curl -sSfo examples/rsi.pine https://be-thomas.github.io/OpenPineScript/examples/rsi.pine
curl -sSfo examples/sma_cross.pine https://be-thomas.github.io/OpenPineScript/examples/sma_cross.pine
curl -sSfo examples/broken.pine https://be-thomas.github.io/OpenPineScript/examples/broken.pine
```

Check the install:

```bash
npx openpinescript examples/rsi.pine --data AAPL.csv 2>/dev/null
```

Expected: a JSON document starting with `{ "script": "rsi.pine", "bars_processed": 506, ...`.
`npx openpinescript --help` (or `-h`) prints the usage text to stdout and exits 0. A missing script or a
missing `--data` prints an error and the usage text to stderr and exits 1.

---

## 2. Invocation

```
openpinescript <script.pine> --data <data.csv> [flags]
```

- The script is the FIRST argument that ends in `.pine`. A file named `strategy.txt` fails with
  `Error: No .pine script file specified.`
- `--data <csv>` is required.
- Flags take their value as the NEXT argument (`--out-dir results`, never `--out-dir=results`).
- The first line of the script must be `//@version=N` (N in 1 to 6). Without it the script is read
  as version 1 and `indicator(...)` fails (see section 7). Use `//@version=5` or `//@version=6`.

---

## 3. Every flag

| Flag | Value | Default | What it does |
|---|---|---|---|
| `--data` | path to CSV | none, required | Candle data. Format in section 4. |
| `--out-dir` | directory | none | Creates the directory, writes `chart.csv`, `trades.csv`, `summary.json` into it. |
| `--out-chart` | file path | none | Writes the OHLCV plus one column per `plot()` as CSV. Overrides the `--out-dir` name for that file. |
| `--out-trades` | file path | none | Writes the trade log CSV. Only written for strategies (see below). |
| `--out-summary` | file path | none | Writes the performance summary JSON. |
| `--input` | `key=value` | none | Overrides one `input()`. Repeatable. Keys are `input_0`, `input_1`, ... in call order. |
| `--dry-run` | none (boolean) | off | Runs ONE bar, prints the inputs JSON, exits 0. |
| `--show-transpiled` | none (boolean) | off | Prints the generated JavaScript (to stdout) before running. |
| `--compare-dir` | directory | none | Compare against TradingView exports named `chart_data.csv`, `trades.csv`, `summary.json` in it. |
| `--compare-chart` | file | none | Compare plot columns against a TradingView chart export CSV. |
| `--compare-trades` | file | none | Compare the trade log against a TradingView export CSV. |
| `--compare-summary` | file | none | Compare the summary against a TradingView export (JSON or key-value CSV). |
| `--out-comparison` | directory | none | Where to write `comparison_report.json`. `--out-dir`, if set, wins. |
| `--tolerance` | float | `0.0001` | Epsilon for every comparison. A non-number exits 1: `Error: --tolerance must be a number (got "abc").` |

Behaviour of the output flags:

- If NO `--out-*` and NO `--compare-*` flag is given: strict JSON goes to stdout, the human summary to stderr.
- If ANY `--out-*` flag is given: stdout carries one confirmation line per file; the JSON is NOT printed.
- `--out-trades` / `--out-summary` on an indicator prints `⚠ Warning: --out-trades requested but no trades were recorded. Is this an indicator rather than a strategy?` and exits 0. (For `--out-trades` no file is written. `--out-summary` still writes a file, but its numbers are meaningless for an indicator: `net_profit` reads 900000 because of the hard-coded capital described in section 6.)
- A flag with a missing value (`--out-chart` as the last argument) is silently ignored.
- Unknown flags are silently ignored.

---

## 4. Input CSV format

- One bar per row, oldest first, comma separated, column ORDER matters (names do not):
  `time,open,high,low,close,volume`.
- A header row is skipped only if the first line contains the text `time` (any case). Any other
  header (`Date,Open,...`) is not recognised as one, but it is dropped anyway because its close is not
  a number: rows whose close cannot be parsed are discarded.
- `time` is parsed with JavaScript `new Date(value)`: use ISO 8601 (`2024-03-01T00:00:00Z`) or
  `YYYY-MM-DD`. Unix epoch numbers (`1709251200`) are NOT supported: the run crashes with
  `Critical error: RangeError: Invalid time value`.
- `volume` may be blank or 0. Columns after the 6th are ignored (the sample AAPL file has extra columns).
- A file with no valid rows exits 1: `Error: CSV has no valid data rows.`
- There is no timeframe flag: the engine treats the bars as they come. The sample data is daily.

Sample (`AAPL.csv`, from section 1):

```
Date,AAPL.Open,AAPL.High,AAPL.Low,AAPL.Close,AAPL.Volume,AAPL.Adjusted,dn,mavg,up,direction
2015-02-17,127.489998,128.880005,126.919998,127.830002,63152400,122.905254,106.7410523,117.9276669,129.1142814,Increasing
```

---

## 5. Worked example 1: an indicator

`examples/rsi.pine`:

```pine
//@version=5
indicator("RSI 14")
r = ta.rsi(close, 14)
plot(r, title="RSI 14", color=color.purple)
hline(70)
hline(30)
```

```bash
openpinescript examples/rsi.pine --data AAPL.csv --out-chart results/rsi.csv
```

Real output (ANSI colour codes removed; the real output contains them):

```
Compiling: rsi.pine...
Pine Script: v5
Running backtest: 506 bars...
✔ Done.
✔ Chart    → results/rsi.csv

=== rsi.pine — Summary ===
Bars processed : 506
Plots recorded : 3
```

Note `Plots recorded : 3`: each `hline()` counts as a plot. Note also that `--out-chart`, `--out-trades` and `--out-summary` do not
create the parent directory (only `--out-dir` does): writing into a missing directory crashes with
`Error: ENOENT: no such file or directory` and exit code 1 (verified for `--out-chart`). Run `mkdir -p results` first.

`results/rsi.csv`, real rows around the end of the warm-up (cells are empty, never `NaN`, until the indicator has a value):

```
time,open,high,low,close,volume,RSI 14,HLine,HLine
2015-03-06T00:00:00.000Z,128.399994,129.369995,126.260002,126.599998,72842100,,70.000000,30.000000
2015-03-09T00:00:00.000Z,127.959999,129.570007,125.059998,127.139999,88528500,48.092860,70.000000,30.000000
2015-03-10T00:00:00.000Z,126.410004,127.220001,123.800003,124.510002,68856600,41.582408,70.000000,30.000000
```

Column rules: `time` is ISO 8601 UTC; plot columns are named by the plot's `title` (commas replaced
by `;`; an untitled plot is `Plot_<n>`); plot values have 6 decimals; OHLCV are printed as parsed.

With no output flag, stdout is JSON instead (section 7).

---

## 6. Worked example 2: a strategy

`examples/sma_cross.pine`:

```pine
//@version=5
strategy("SMA Cross", overlay=true, initial_capital=100000)

fastLen = input.int(9, "Fast Length")
slowLen = input.int(21, "Slow Length")

fast = ta.sma(close, fastLen)
slow = ta.sma(close, slowLen)

plot(fast, title="Fast", color=color.orange)
plot(slow, title="Slow", color=color.blue)

if ta.crossover(fast, slow)
    strategy.entry("Long", strategy.long, qty=100)
if ta.crossunder(fast, slow)
    strategy.close("Long")
```

IMPORTANT: always declare `initial_capital=100000` in `strategy(...)`. The CLI computes
`net_profit` as `cash - 100000` with 100000 hard-coded, while the engine's default starting capital is
1,000,000 (TradingView's default). Without the declaration this script reports
`net_profit: 899995.84` (+900%) for trades that really lost money. The trade list and
`gross_profit`, `gross_loss`, `win_rate`, `profit_factor` are not affected; `net_profit` and
`net_profit_percent` are.

### 6.1 All three files in one run

```bash
openpinescript examples/sma_cross.pine --data AAPL.csv --out-dir results
```

```
Compiling: sma_cross.pine...
Pine Script: v5
Running backtest: 506 bars...
✔ Done.
✔ Chart    → results/chart.csv
✔ Trades   → results/trades.csv  (10 trades)
✔ Summary  → results/summary.json

=== sma_cross.pine — Summary ===
Bars processed : 506
Plots recorded : 2

Performance:
  Net Profit         $-416.00 (-0.42%)
  Total Trades       10
  Win Rate           40.0%  (4W / 6L)
  Profit Factor      0.826
  Max Drawdown       1.44%
  Avg Win / Avg Loss $493.00 / $398.00

Script Inputs:
  input_0  "Fast Length"  [integer]  = 9 (default)
  input_1  "Slow Length"  [integer]  = 21 (default)
  Tip: override with --input input_0=<value>
```

The first four lines (`Compiling`, `Pine Script`, `Running backtest`, `✔ Done`) and the summary block go to
stderr; the three `✔ ... →` lines go to stdout. Negative money prints as `$-416.00` (sign after the dollar sign).

### 6.2 `results/trades.csv`

Header `Trade #,Type,Signal,Date/Time,Price,Contracts,Profit,Profit %,Cum. Profit`. Two rows per trade
(an Entry row and an Exit row). Real first rows:

```
Trade #,Type,Signal,Date/Time,Price,Contracts,Profit,Profit %,Cum. Profit
1,Entry Long,Long,2015-04-13T00:00:00.000Z,128.3700,100,0.00,0.00,0.00
1,Exit Long,Close Long,2015-05-11T00:00:00.000Z,127.3900,100,-98.00,-0.10,-98.00
2,Entry Long,Long,2015-05-22T00:00:00.000Z,131.6000,100,0.00,0.00,-98.00
2,Exit Long,Close Long,2015-06-11T00:00:00.000Z,129.1800,100,-242.00,-0.24,-340.00
```

Orders fill on the NEXT bar's open (the entry above is the open of 2015-04-13, the bar after the
crossover). `Profit %` is `profit / 100000 * 100`. Only trades that are CLOSED appear: a position still
open on the last bar is not in the file. The file is written only when the run had at least one trade or an open position.

### 6.3 `results/summary.json`

```json
{
  "net_profit": -416,
  "net_profit_percent": -0.42,
  "gross_profit": 1972,
  "gross_loss": 2388,
  "total_closed_trades": 10,
  "winning_trades": 4,
  "losing_trades": 6,
  "win_rate": 40,
  "avg_win": 493,
  "avg_loss": 398,
  "profit_factor": 0.826,
  "max_drawdown_percent": 1.44
}
```

All keys are numbers; `profit_factor` is `null` when there are winners and no losers. Values are
rounded to 2 decimals (3 for `profit_factor`).

### 6.4 `results/chart.csv`

Same shape as section 5: OHLCV plus one column per plot (`Fast`, `Slow` here).

---

## 7. Stdout JSON (the machine interface)

With no `--out-*` / `--compare-*` flag, stdout is exactly one JSON document and nothing else (when invoked
via `npx openpinescript` or `openpinescript`). Silence the human text with `2>/dev/null`.

```bash
openpinescript examples/sma_cross.pine --data AAPL.csv 2>/dev/null
```

```json
{
  "script": "sma_cross.pine",
  "bars_processed": 506,
  "inputs": [
    {
      "id": "input_0",
      "title": "Fast Length",
      "type": "integer",
      "default": 9,
      "current": 9,
      "overridden": false
    },
    {
      "id": "input_1",
      "title": "Slow Length",
      "type": "integer",
      "default": 21,
      "current": 21,
      "overridden": false
    }
  ],
  "performance": {
    "net_profit": -416,
    "net_profit_percent": -0.42,
    "gross_profit": 1972,
    "gross_loss": 2388,
    "total_closed_trades": 10,
    "winning_trades": 4,
    "losing_trades": 6,
    "win_rate": 40,
    "avg_win": 493,
    "avg_loss": 398,
    "profit_factor": 0.826,
    "max_drawdown_percent": 1.44
  }
}
```

`performance` is `null` for an indicator (no trades, no open position). `inputs[].type` is one of
`integer`, `float`, `bool`, `string` as the script declared it. This JSON contains no plot values:
use `--out-chart` for those.

---

## 8. Inputs: discover, then override

Discover the input IDs cheaply (one bar, no backtest). Stdout is the same JSON with `"bars_processed": 1`:

```bash
openpinescript examples/sma_cross.pine --data AAPL.csv --dry-run 2>/dev/null | jq '.inputs[] | {id, title, default}'
```

Override by ID (IDs are `input_0`, `input_1`, ... in the order the `input.*()` calls run):

```bash
openpinescript examples/sma_cross.pine --data AAPL.csv --input input_0=5 --input input_1=30 --out-dir results
```

Real summary of that run (stderr):

```
Performance:
  Net Profit         $-2338.00 (-2.34%)
  Total Trades       12
  Win Rate           16.7%  (2W / 10L)
  Profit Factor      0.39
  Max Drawdown       2.88%
  Avg Win / Avg Loss $747.00 / $383.20

Script Inputs:
  input_0  "Fast Length"  [integer]  = 5 (overridden from 9)
  input_1  "Slow Length"  [integer]  = 30 (overridden from 21)
```

Rules (verified):

- Values that parse as a number (JavaScript `parseFloat`) become numbers; anything else stays a string. Beware: `parseFloat("20abc")` is 20.
- BOOLEAN inputs: pass `0` for false and `1` for true. The text `false` is kept as a string, which is truthy, so `--input input_2=false` does NOT switch the input off (verified: output unchanged).
- `--input x` without `=` prints `⚠ Warning: --input value "x" is not in key=value format, skipping.` and continues.
- An unknown key is accepted silently and has no effect.
- There is no way to override by title; use the ID.

---

## 9. Exit codes and errors

The CLI exits `0` on success and `1` on every failure. There is no other code. On failure nothing is
written to stdout (the error goes to stderr), so branch on the exit code, and read stderr for the cause.

| Situation | stderr (ANSI removed) | Fix |
|---|---|---|
| No `.pine` argument | `Error: No .pine script file specified.` then the usage text | Pass a path ending in `.pine`. |
| No `--data` | `Error: --data <csv> is required.` then the usage text | Add `--data <csv>`. |
| Script not found | `Error: Cannot read script: nope.pine` | Fix the path (relative to the current directory). |
| CSV not found | `Error: Cannot read CSV: nope.csv` | Fix the path. |
| CSV has no usable rows | `Error: CSV has no valid data rows.` | Check column order and that `close` is numeric. |
| Bad `--tolerance` | `Error: --tolerance must be a number (got "abc").` | Pass a number. |
| Syntax error in the script | `Transpilation failed: Pine Script v5: parsing failed with 1 error(s)` then `  [Line 4:0] The script ends in the middle of a statement at line 3 — was it pasted completely? (missing ')' at '<EOF>')` | Fix the line shown. Lines are 1-based. |
| Missing `//@version` line | ``Transpilation failed: Pine Script v1 Error at @L1:C0: Undeclared identifier 'indicator'. This script has no `//@version` line, so it was read as version 1. Add `//@version=5` (or 6) as the first line.`` | Add `//@version=5` as line 1. |
| Unknown built-in | `Transpilation failed: Pine Script v5 Error at @L3:C5: 'ta' has no member 'nonexistent'.` | Use a function that exists in the Pine version you declared. |
| Runtime error in the script | `Critical error: Error: In 'array.get()' function. Index 5 is out of bounds, array size is 0.` followed by a JavaScript stack trace | Fix the script logic. The error does not say which bar or line. |
| Output directory does not exist (`--out-chart` etc.) | `Error: ENOENT: no such file or directory, open '...'` plus a stack trace | `mkdir -p` the directory, or use `--out-dir`. |
| Epoch timestamps in the CSV | `Critical error: RangeError: Invalid time value` | Convert the first column to ISO 8601. |

Real example (`examples/broken.pine`, a missing parenthesis), exit code 1:

```
Compiling: broken.pine...
Transpilation failed: Pine Script v5: parsing failed with 1 error(s)
  [Line 4:0] The script ends in the middle of a statement at line 3 — was it pasted completely? (missing ')' at '<EOF>')
```

---

## 10. Other things you need to know (all verified)

- `log.info()` / `log.warning()` / `log.error()` output is NOT printed by the CLI. It exists in the
  browser tutorial and in the `Session` API (`result.logs`), not in `openpinescript`.
- `plot` values are only available through `--out-chart`. `plotshape`, `label.*`, `line.*`, `box.*` are not exported by the CLI.
- A run with no trades and no open position is treated as an indicator (`performance: null`). A strategy
  that happens to make no trades prints no Performance block either.
- Colour: output always contains ANSI escape codes, even when piped. Strip with `sed 's/\x1b\[[0-9;]*m//g'` or ignore stderr.
- `--show-transpiled` prints the JavaScript to stdout, which breaks the pure-JSON stdout. Use it only to debug.
- Only `//@version=5` and `//@version=6` are used in this guide's examples; versions 1 to 6 each have their own grammar and all compile.
- The CLI does not set a symbol or timeframe, so scripts that read `syminfo.*` or `timeframe.*` see engine defaults. The browser tutorial's engine is configured with `AAPL` / `D`.

### Comparing against TradingView exports (optional)

Export the chart data, trade list and performance summary from TradingView, then:

```bash
openpinescript examples/sma_cross.pine --data AAPL.csv --compare-dir tv_exports --out-comparison reports
```

Real output when everything matches (here the reference files were this CLI's own `--out-dir` output, so it is a
self-consistency check, not a TradingView result):

```
=== Comparison Report ===
  Overall:   PASS
  Tolerance: 0.0001

Chart Data: PASS
  Rows compared : 506
  Mismatched    : 0
  Max deviation :
    Fast↔Fast: 0.000e+0
    Slow↔Slow: 0.000e+0

Trades: PASS
  TV trades    : 10
  opsv2 trades : 10

Summary: PASS
  Net profit Δ% : 0.0000

Report written: reports/comparison_report.json
```

`comparison_report.json` has `overall_match` (`pass` / `fail` / `partial` / `skip`), `tolerance_used`,
`chart_data`, `trades`, `summary`. The run itself still exits 0 when a comparison fails: read `overall_match`.

---

## 11. Using the engine as a library (Node or browser)

The same engine is importable. `Session` is the entry point (this is what the in-browser tutorial uses):

```js
import { Session } from "openpinescript";   // after: npm install openpinescript

const s = new Session();
s.setChart({ symbol: "AAPL", timeframe: "D" });         // Pine timeframe spelling: "D", "60", "5"
const compiled = s.compile(pineSource);                  // { errors, inputs, meta, ... }
if (compiled.errors.length === 0) {
  s.setInputs({ input_0: 50 });                          // optional
  const result = s.runHistory(candles);                  // candles: [{ time (ms), open, high, low, close, volume }]
  // result.series     one entry per plot: { title, type, pane, color, data: [{ value } | null, ...] }
  // result.trades     closed trades; result.position the open one
  // result.performance, result.equity, result.logs, result.drawings, result.errors
}
```

`compiled.errors[i]` is `{ phase: "parse" | "transpile" | "runtime", line, col, message, severity }`.
Unlike the CLI, `Session` reports runtime errors with the bar index.

---

## 12. Quick recipe

```bash
mkdir -p results
npx openpinescript YOUR_SCRIPT.pine --data YOUR_DATA.csv --out-dir results 2>/dev/null   # stdout: 3 confirmation lines
cat results/summary.json                                                                   # the numbers
head results/trades.csv                                                                    # the trades
```

Checklist before you report a result: the script starts with `//@version=5` or `6`; a strategy declares
`initial_capital=100000`; the CSV's first column is ISO dates; you read the exit code; you did not trust
a flag you did not find in section 3.
