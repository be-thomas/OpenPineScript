# CLI Usage Guide

> For a quick-start overview see the [README](README.md). This document covers every flag in detail.

---

## Basic invocation

```bash
npm run opsv2 -- <script.pine> --data <data.csv> [flags]
```

`script.pine` and `--data` are always required. All other flags are optional.

---

## Output flags

These control where results are written. If none are given, a formatted summary is printed to the terminal and nothing is written to disk.

### `--out-chart <file>`

Writes a time-series CSV containing the OHLCV candle data plus one column per `plot()` call in the script.

```bash
npm run opsv2 -- strategy.pine --data data.csv --out-chart ./results/chart.csv
```

**Format:**

```
time,open,high,low,close,volume,SMA_20,RSI_14
2024-03-01T00:00:00.000Z,150.5,151.2,149.8,151.0,12000,148.5,65.2
```

Cells are empty (not `NaN`) during the indicator warm-up period.

---

### `--out-trades <file>`

Writes the trade log as a CSV. Only meaningful for `strategy()` scripts — a warning is printed if the script produced no trades.

```bash
npm run opsv2 -- strategy.pine --data data.csv --out-trades ./results/trades.csv
```

**Format** (TradingView-compatible):

```
Trade #,Type,Signal,Date/Time,Price,Contracts,Profit,Profit %,Cum. Profit
1,Entry Long,Buy_Sig,2024-03-01T10:00:00.000Z,45000.0000,1,0.00,0.00,0.00
1,Exit Long,Take_Profit,2024-03-01T14:00:00.000Z,46000.0000,1,1000.00,1.00,1000.00
```

Each trade produces two rows — one for the entry and one for the exit.

---

### `--out-summary <file>`

Writes the strategy performance summary as a JSON file.

```bash
npm run opsv2 -- strategy.pine --data data.csv --out-summary ./results/summary.json
```

**Format:**

```json
{
  "net_profit": 1000.00,
  "net_profit_percent": 1.00,
  "gross_profit": 1200.00,
  "gross_loss": 200.00,
  "total_closed_trades": 12,
  "winning_trades": 8,
  "losing_trades": 4,
  "win_rate": 66.67,
  "avg_win": 150.00,
  "avg_loss": 50.00,
  "profit_factor": 6.000,
  "max_drawdown_percent": 1.25
}
```

---

## Comparison flags

These validate `opsv2` output against reference data exported from TradingView, proving mathematical parity.

### `--compare-chart <file>`

Compares the indicator/plot columns from `opsv2` against a TradingView chart export CSV.

```bash
npm run opsv2 -- strategy.pine --data data.csv --compare-chart ./tv_exports/chart_data.csv
```

Rows are aligned by timestamp (timezone-aware — handles both ISO strings and Unix epoch seconds). Columns are matched by name, falling back to case-insensitive matching, then positional matching when both sides have exactly one unmatched column.

---

### `--compare-trades <file>`

Compares the trade log from `opsv2` against a TradingView trade export CSV.

```bash
npm run opsv2 -- strategy.pine --data data.csv --compare-trades ./tv_exports/trades.csv
```

Checks (in order):
1. Total trade count
2. Entry price per trade
3. Exit price per trade
4. Profit per trade
5. Exit timestamp (a 60-second tolerance is applied to account for bar boundary differences)

---

### `--compare-summary <file>`

Compares the performance summary from `opsv2` against a TradingView summary export. Accepts both JSON and key-value CSV formats.

```bash
npm run opsv2 -- strategy.pine --data data.csv --compare-summary ./tv_exports/summary.json
```

Fields compared: `net_profit`, `net_profit_percent`, `gross_profit`, `gross_loss`, `total_closed_trades`, `win_rate`, `profit_factor`, `max_drawdown_percent`.

---

### `--tolerance <float>`

Sets the epsilon used for all floating-point comparisons. Defaults to `0.0001`.

```bash
npm run opsv2 -- strategy.pine --data data.csv \
  --compare-chart ./tv_exports/chart_data.csv \
  --tolerance 0.01
```

Any deviation `<= tolerance` is treated as a pass. Useful when comparing against data that has been rounded to fewer decimal places.

---

### `--out-comparison <dir>`

Writes `comparison_report.json` to the specified directory. Falls back to `--out-dir` if set. If neither is given, no report file is written (the console summary is always printed regardless).

```bash
npm run opsv2 -- strategy.pine --data data.csv \
  --compare-chart ./tv_exports/chart_data.csv \
  --out-comparison ./reports
```

**Report format:**

```json
{
  "overall_match": "partial",
  "tolerance_used": 0.0001,
  "timestamp": "2026-03-15T10:00:00.000Z",
  "chart_data": {
    "status": "pass",
    "rows_compared": 5000,
    "mismatched_rows": 0,
    "max_deviation": { "SMA_20↔SMA_20": 0.00005 },
    "mismatches": []
  },
  "trades": {
    "status": "fail",
    "total_tv_trades": 105,
    "total_opsv2_trades": 104,
    "discrepancies": [
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
    "net_profit_delta_percent": 0.05,
    "mismatches": []
  }
}
```

`overall_match` is `"pass"` when all active sections pass, `"fail"` when all fail, `"partial"` when results are mixed, and `"skip"` when no comparison was run.

---

## Input overrides

Override `input.int()` / `input.float()` / `input.bool()` values defined in the script without editing the `.pine` file. Run the script once to discover the available input IDs printed in the terminal summary.

### `--input <key=value>`

```bash
# Single override
npm run opsv2 -- strategy.pine --data data.csv --input input_0=20

# Multiple overrides
npm run opsv2 -- strategy.pine --data data.csv \
  --input input_0=20 \
  --input input_1=2.5 \
  --input input_2=false
```

String values are kept as strings; values that parse as numbers are coerced automatically.

---

## Debug flags

### `--show-transpiled`

Prints the JavaScript generated by the transpiler before execution. Useful for debugging unexpected behavior in complex scripts.

```bash
npm run opsv2 -- strategy.pine --data data.csv --show-transpiled
```

---

## Common combinations

**Full export + comparison in one command:**

```bash
npm run opsv2 -- strategy.pine --data data.csv \
  --out-dir ./results \
  --compare-dir ./tv_exports \
  --tolerance 0.001
```

Writes `chart.csv`, `trades.csv`, `summary.json`, and `comparison_report.json` all into `./results/`.

**CI/CD pipeline — exit code reflects comparison result:**

```bash
npm run opsv2 -- strategy.pine --data data.csv \
  --compare-dir ./tv_exports \
  --out-comparison ./reports
# Check ./reports/comparison_report.json in your pipeline
```
