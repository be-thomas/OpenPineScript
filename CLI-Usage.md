# CLI Usage Guide

> For a quick-start overview see the [README](README.md). This document covers every flag in detail.

---

## Basic invocation

```bash
npm run opsv2 -- <script.pine> --data <data.csv> [flags]
```

`script.pine` and `--data` are always required. All other flags are optional. With no output or comparison flags, a formatted summary is printed to the terminal and nothing is written to disk.

---

## Output flags

### `--out-chart <file>`

Writes a time-series CSV containing the OHLCV candle data plus one column per `plot()` call in the script.

```bash
npm run opsv2 -- strategy.pine --data data.csv --out-chart ./results/chart.csv
```

```diff
  Compiling: strategy.pine...
  Running backtest: 506 bars...
+ ✔ Done.
+ ✔ Chart    → ./results/chart.csv
```

**Output format:**

```
time,open,high,low,close,volume,SMA_20,RSI_14
2024-03-01T00:00:00.000Z,150.5,151.2,149.8,151.0,12000,148.5,65.2
2024-03-04T00:00:00.000Z,151.0,152.0,150.5,151.8,15000,148.8,68.1
```

Cells are empty (not `NaN`) during the indicator warm-up period.

---

### `--out-trades <file>`

Writes the trade log as a CSV. Only meaningful for `strategy()` scripts.

```bash
npm run opsv2 -- strategy.pine --data data.csv --out-trades ./results/trades.csv
```

```diff
  Compiling: strategy.pine...
  Running backtest: 506 bars...
+ ✔ Done.
+ ✔ Trades   → ./results/trades.csv  (38 trades)
```

If the script is an indicator and produces no trades, a warning is shown instead:

```diff
  Compiling: indicator.pine...
  Running backtest: 506 bars...
+ ✔ Done.
- ⚠ Warning: --out-trades requested but no trades were recorded.
-             Is this an indicator rather than a strategy?
```

**Output format** (TradingView-compatible, one entry + one exit row per trade):

```
Trade #,Type,Signal,Date/Time,Price,Contracts,Profit,Profit %,Cum. Profit
1,Entry Long,Buy_Sig,2024-03-01T10:00:00.000Z,45000.0000,1,0.00,0.00,0.00
1,Exit Long,Take_Profit,2024-03-01T14:00:00.000Z,46000.0000,1,1000.00,2.22,1000.00
2,Entry Long,Buy_Sig,2024-03-02T09:30:00.000Z,46100.0000,1,0.00,0.00,1000.00
2,Exit Long,Stop_Loss,2024-03-02T15:00:00.000Z,45800.0000,1,-300.00,-0.65,700.00
```

---

### `--out-summary <file>`

Writes the strategy performance summary as a JSON file.

```bash
npm run opsv2 -- strategy.pine --data data.csv --out-summary ./results/summary.json
```

```diff
  Compiling: strategy.pine...
  Running backtest: 506 bars...
+ ✔ Done.
+ ✔ Summary  → ./results/summary.json
```

**Output format:**

```json
{
  "net_profit": 4821.00,
  "net_profit_percent": 4.82,
  "gross_profit": 7200.00,
  "gross_loss": 2379.00,
  "total_closed_trades": 38,
  "winning_trades": 24,
  "losing_trades": 14,
  "win_rate": 63.16,
  "avg_win": 300.00,
  "avg_loss": 169.93,
  "profit_factor": 3.028,
  "max_drawdown_percent": 3.17
}
```

---

## Comparison flags

These validate `opsv2` output against reference data exported from TradingView, proving mathematical parity.

### `--compare-chart <file>`

Compares the indicator/plot columns from `opsv2` against a TradingView chart export CSV. Rows are aligned by timestamp — handles both ISO strings and Unix epoch seconds. Columns are matched by name, with case-insensitive and positional fallbacks.

```bash
npm run opsv2 -- strategy.pine --data data.csv --compare-chart ./tv_exports/chart_data.csv
```

When values are within tolerance:

```diff
+ Chart Data: PASS
    Rows compared : 506
    Mismatched    : 0
    Max deviation :
+     SMA_20↔SMA_20: 2.910e-5
```

When values exceed tolerance:

```diff
- Chart Data: FAIL
    Rows compared : 506
-   Mismatched    : 3
    Max deviation :
-     SMA_20↔SMA_20: 5.230e-2  (exceeds tolerance 0.0001)
-   First 3 mismatch(es):
-     [2024-03-15T10:00:00.000Z] SMA_20↔SMA_20  opsv2=148.3200  tv=148.3723  Δ=5.23e-2
-     [2024-03-16T10:00:00.000Z] SMA_20↔SMA_20  opsv2=149.1100  tv=149.1641  Δ=5.41e-2
-     [2024-03-17T10:00:00.000Z] SMA_20↔SMA_20  opsv2=149.8800  tv=149.9330  Δ=5.30e-2
-     ...and 0 more (see report JSON)
```

---

### `--compare-trades <file>`

Compares the trade log from `opsv2` against a TradingView trade export CSV. Checks trade count, then entry price, exit price, profit, and exit timestamp per trade.

```bash
npm run opsv2 -- strategy.pine --data data.csv --compare-trades ./tv_exports/trades.csv
```

When all trades match:

```diff
+ Trades: PASS
    TV trades    : 38
    opsv2 trades : 38
```

When there is a count mismatch or price discrepancy:

```diff
- Trades: FAIL
    TV trades    : 38
-   opsv2 trades : 37
-   Count delta: -1
-   Discrepancies (first 2):
-     Trade #37: missing_in_opsv2
-     Trade #42: exit_price_mismatch — tv=45000.5000  opsv2=45001.0000  Δ=0.5
```

---

### `--compare-summary <file>`

Compares the performance summary from `opsv2` against a TradingView summary export. Accepts both JSON and key-value CSV formats.

```bash
npm run opsv2 -- strategy.pine --data data.csv --compare-summary ./tv_exports/summary.json
```

Fields compared: `net_profit`, `net_profit_percent`, `gross_profit`, `gross_loss`, `total_closed_trades`, `win_rate`, `profit_factor`, `max_drawdown_percent`.

When all fields match:

```diff
+ Summary: PASS
+   Net profit Δ% : 0.0000
```

When a field diverges:

```diff
- Summary: FAIL
-   Net profit Δ% : 0.0652
-   Field mismatches:
-     net_profit_percent  opsv2=4.82  tv=4.88  Δ=6.00e-2
-     win_rate            opsv2=63.16 tv=64.00  Δ=8.40e-1
```

---

### `--tolerance <float>`

Sets the epsilon for all floating-point comparisons. Defaults to `0.0001`. Any deviation `<= tolerance` counts as a pass.

```bash
npm run opsv2 -- strategy.pine --data data.csv \
  --compare-chart ./tv_exports/chart_data.csv \
  --tolerance 0.1
```

Useful when TV exports have been rounded. Tightening or loosening the value changes which rows fail:

```diff
# With --tolerance 0.0001 (default)
- Chart Data: FAIL  (3 mismatched rows, max Δ 5.23e-2)

# With --tolerance 0.1
+ Chart Data: PASS  (506 rows compared, max Δ 5.23e-2 — within tolerance)
```

---

### `--out-comparison <dir>`

Writes `comparison_report.json` to the specified directory. If `--out-dir` is also set, that takes priority. If neither is set, no file is written — the console output is always printed regardless.

```bash
npm run opsv2 -- strategy.pine --data data.csv \
  --compare-chart ./tv_exports/chart_data.csv \
  --out-comparison ./reports
```

```diff
+ Report written: ./reports/comparison_report.json
```

**Report structure:**

```json
{
  "overall_match": "partial",
  "tolerance_used": 0.0001,
  "timestamp": "2026-03-15T10:00:00.000Z",
  "chart_data": {
    "status": "pass",
    "rows_compared": 506,
    "mismatched_rows": 0,
    "max_deviation": { "SMA_20↔SMA_20": 0.00005 },
    "mismatches": []
  },
  "trades": {
    "status": "fail",
    "total_tv_trades": 38,
    "total_opsv2_trades": 37,
    "discrepancies": [
      {
        "trade_id": 37,
        "issue": "missing_in_opsv2"
      },
      {
        "trade_id": 42,
        "issue": "exit_price_mismatch",
        "tv_price": 45000.50,
        "opsv2_price": 45001.00,
        "detail": "deviation: 0.500000"
      }
    ]
  },
  "summary": {
    "status": "pass",
    "net_profit_delta_percent": 0.0,
    "mismatches": []
  }
}
```

`overall_match` is `"pass"` when all active sections pass, `"fail"` when all fail, `"partial"` when mixed, and `"skip"` when no comparison was run.

---

## Input overrides

Override `input.int()` / `input.float()` / `input.bool()` values without editing the `.pine` file.

### `--input <key=value>`

Run the script once first to discover available input IDs:

```bash
npm run opsv2 -- strategy.pine --data data.csv
```

```diff
  === strategy.pine — Summary ===
  ...
  Script Inputs:
    input_0  "Fast Length"  [integer]  = 9  (default)
    input_1  "Slow Length"  [integer]  = 21 (default)
    Tip: override with --input input_0=<value>
```

Then pass the overrides on the next run:

```bash
npm run opsv2 -- strategy.pine --data data.csv \
  --input input_0=20 \
  --input input_1=50
```

```diff
  === strategy.pine — Summary ===
  ...
  Script Inputs:
+   input_0  "Fast Length"  [integer]  = 20 (overridden from 9)
+   input_1  "Slow Length"  [integer]  = 50 (overridden from 21)
```

String values are kept as strings; values that parse as numbers are coerced automatically.

---

## Debug flags

### `--show-transpiled`

Prints the JavaScript generated by the transpiler before execution. Useful for tracing unexpected behavior in complex scripts.

```bash
npm run opsv2 -- strategy.pine --data data.csv --show-transpiled
```

```diff
  Compiling: strategy.pine...

  --- Transpiled JavaScript ---
  var opsv2_len = 14;
  var opsv2_src = opsv2_close;
  var opsv2_mySma = ctx.call("opsv2_sma@L4:C10", opsv2_sma, opsv2_src, opsv2_len);
  ctx.call("opsv2_plot@L6:C0", opsv2_plot, opsv2_mySma, { opsv2_color: opsv2_color_red });
  -----------------------------

  Running backtest: 506 bars...
+ ✔ Done.
```

---

## Common combinations

### Full export + comparison in one command

```bash
npm run opsv2 -- strategy.pine --data data.csv \
  --out-dir ./results \
  --compare-dir ./tv_exports \
  --tolerance 0.001
```

```diff
  Compiling: strategy.pine...
  Running backtest: 506 bars...
+ ✔ Done.
+ ✔ Chart    → ./results/chart.csv
+ ✔ Trades   → ./results/trades.csv  (38 trades)
+ ✔ Summary  → ./results/summary.json

  === Comparison Report ===
  Overall: PASS    Tolerance: 0.001

+ Chart Data: PASS  (506 rows, 0 mismatches, max Δ 2.9e-5)
+ Trades:     PASS  (38 tv / 38 opsv2)
+ Summary:    PASS  (net profit Δ 0.0000%)

+ Report written: ./results/comparison_report.json
```

```
results/
├── chart.csv
├── trades.csv
├── summary.json
└── comparison_report.json
```

---

### Catching a regression mid-comparison

```bash
npm run opsv2 -- strategy.pine --data data.csv \
  --compare-dir ./tv_exports \
  --out-comparison ./reports
```

```diff
  Compiling: strategy.pine...
  Running backtest: 506 bars...
+ ✔ Done.

  === Comparison Report ===
  Overall: PARTIAL    Tolerance: 0.0001

+ Chart Data: PASS  (506 rows, 0 mismatches)
- Trades:     FAIL  (38 tv / 37 opsv2 — 1 discrepancy)
-   Trade #37: missing_in_opsv2
+ Summary:    PASS  (net profit Δ 0.0000%)

+ Report written: ./reports/comparison_report.json
```
