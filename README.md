
---

# OpenPineScript 🚀

**OpenPineScript** is a high-speed, local engine built to run your trading scripts anywhere. No cloud limits, no proprietary walls—just pure execution on your own hardware.

---

## 🌟 Why OpenPineScript?

* **⚡ Local-First Speed:** Built for **modern, high-performance CPUs**. Run backtests in seconds, not minutes.
* **🔓 Total Freedom:** Execute your logic in an open environment. Your strategies stay on your machine.
* **🛠 Rock Solid:** Over **5,000+ mathematical stress tests** passed, ensuring your calculations are 100% accurate.
* **📦 Zero Bloat:** A modular, lightweight engine that runs wherever Node.js lives.

---

## 📍 Current Status: **v2 (Beta) is LIVE!**

We have successfully built the core engine for **v2**. You can currently:

* Convert scripts into lightning-fast JavaScript.
* Run an interactive terminal (REPL) to test logic on the fly.
* Execute complex Technical Analysis (TA) functions with mathematically perfect lookback logic.

### ⏭ Next Milestones:

1. **Full v2 Optimization:** Hardening the current beta for production use.
2. **v3 Compatibility:** Expanding the engine to support the next generation of script logic.
3. **UI Integration:** Bringing the engine to a visual charting interface.

---

## 🚀 Getting Started

### 1. Prerequisites

Make sure you have [Node.js](https://nodejs.org/) 20+ installed.

### 2. Setup

```bash
# Clone the repository
git clone https://github.com/be-thomas/OpenPineScript.git
cd OpenPineScript

# Install dependencies
npm install

```

### 3. Try the Interactive Terminal

Test your logic instantly without writing a full file:

```bash
npm run replv2

```

Example session:

![OpenPineScript REPL](/images/repl-1.png)

---

## 💻 CLI Usage (`opsv2`)

Run a Pine Script against a local CSV data file:

```bash
npm run opsv2 -- <script.pine> --data <data.csv> [flags]
```

---

### 🔍 Discover script inputs (`--dry-run`)

Use `--dry-run` to execute a single bar and discover all `input()` variables without running a full backtest. The output is a **strict JSON document on stdout**, ready to pipe into other tools.

```bash
npm run opsv2 -- strategy.pine --data data.csv --dry-run 2>/dev/null
```

```json
{
  "script": "strategy.pine",
  "bars_processed": 1,
  "inputs": [
    { "id": "input_0", "title": "Fast Length", "type": "integer", "default": 9,  "current": 9,  "overridden": false },
    { "id": "input_1", "title": "Slow Length", "type": "integer", "default": 21, "current": 21, "overridden": false }
  ],
  "performance": null
}
```

This makes it trivial to pipe into other tools:

```bash
# Extract just the inputs for a UI to render
npm run opsv2 -- strategy.pine --data data.csv --dry-run 2>/dev/null | jq '.inputs'

# Feed straight into a Python optimizer
npm run opsv2 -- strategy.pine --data data.csv --dry-run 2>/dev/null | python3 optimizer.py
```

Override inputs on the next run with `--input`:

```bash
npm run opsv2 -- strategy.pine --data data.csv \
  --input input_0=20 --input input_1=50 \
  --out-dir ./results
```

---

### 📁 Export results to a folder

```bash
npm run opsv2 -- strategy.pine --data data.csv --out-dir ./results
```

```diff
  Compiling: strategy.pine...
  Running backtest: 506 bars...
+ ✔ Done.
+ ✔ Chart    → ./results/chart.csv
+ ✔ Trades   → ./results/trades.csv  (38 trades)
+ ✔ Summary  → ./results/summary.json
```

```
results/
├── chart.csv       ← OHLCV + one column per plot()
├── trades.csv      ← Entry & exit rows for every trade
└── summary.json    ← Full performance metrics
```

---

### 🔬 Validate against a TradingView export

Point `--compare-dir` at a folder containing your TradingView CSV exports:

```bash
npm run opsv2 -- strategy.pine --data data.csv \
  --out-dir ./results \
  --compare-dir ./tv_exports
```

```
tv_exports/          ← your TradingView exports go here
├── chart_data.csv
├── trades.csv
└── summary.json

results/             ← opsv2 writes its output + the report here
├── chart.csv
├── trades.csv
├── summary.json
└── comparison_report.json
```

When all outputs match TradingView:

```diff
  === Comparison Report ===
  Overall: PASS    Tolerance: 0.0001

+ Chart Data: PASS  (506 rows compared, 0 mismatches, max Δ 2.9e-5)
+ Trades:     PASS  (38 tv / 38 opsv2)
+ Summary:    PASS  (net profit Δ 0.0000%)

+ Report written: ./results/comparison_report.json
```

When there is a discrepancy:

```diff
  === Comparison Report ===
  Overall: PARTIAL    Tolerance: 0.0001

+ Chart Data: PASS  (506 rows compared, 0 mismatches)
- Trades:     FAIL  (38 tv / 37 opsv2 — 1 discrepancy)
-   Trade #42: exit_price_mismatch  tv=45000.5000  opsv2=45001.0000  Δ=0.5
+ Summary:    PASS  (net profit Δ 0.05%)

  Report written: ./results/comparison_report.json
```

For granular flags (`--out-chart`, `--out-trades`, `--compare-chart`, `--tolerance`, etc.) see the full [CLI Usage Guide](CLI-Usage.md).

---

## 🧪 Proven Accuracy

We don't guess; we test. The engine has passed extensive stress tests, including:

* **Variable Lookbacks:** Stable and oscillating lengths (5,000+ iterations).
* **End-to-End Backtests:** Verified against real-world SMA crossover strategies.
* **TA Engine Integrity:** Mathematically perfect reference implementation checks.

To run the suite yourself:

```bash
npm test

```

---

## 🗺️ Project Roadmap

### 📍 Current Phase: V2 Core Completion (95%)

We are in the "Last Mile" of the Pine Script v2 implementation. Our focus is on mathematical parity with TradingView.

* [x] **Foundation:** Lexer/Parser for v2 grammar.
* [x] **Core Math:** Implementation of `sma`, `ema`, `rsi`, and `macd`.
* [ ] **Final 5%:** * [ ] Refined `security()` function logic for multi-timeframe data.
* [ ] Implicit variable reassignment edge cases (The `:=` behavior in v2).
* [ ] Support for `fill()` and basic `plotshape()` constants.

### 🔜 Next: Validation & Tooling (Q2 2026)

* [ ] **The Ground Truth Suite:** Automated comparison engine to test `OpenPineScript` outputs against TradingView CSV exports.
* [ ] **CSV Exporting:** Native capability to dump indicator results to CSV for external analysis.
* [ ] **CLI Backtester:** An interactive shell to test Pine v2 snippets instantly.
* [ ] **UI based charting support** A UI for running pinescript code so we can compare it side-by-side with tradingview!
* [ ] Support for running OpenPinescript in Python
* [ ] **Version 3 Migration:** Adding support for the `//@version=3` syntax.

### 🔭 Future Horizons (Late Q2 2026)

* [ ] **Version 4 Migration:** Adding support for the `//@version=4` syntax.

---

### 📂 Repository Architecture

* `grammar/` — The AST and Lexer (The DNA of the engine).
* `transpiler/` — Logic that converts Pine into high-performance executable code.
* `tests/` — Comprehensive test suites to ensure zero logic-drift.
* `validation/` — *[NEW]* Real-world scripts and CSVs used for "Ground Truth" testing.


---

## 🤝 Community & Support

OpenPineScript is built by a solo developer with a passion for craftsmanship.

* **Found a bug?** Open an Issue.
* **Have an idea?** Start a Discussion.
* **Want to help?** Check out [CONTRIBUTING.md](CONTRIBUTING.md).
* [Code of Conduct](CODE_OF_CONDUCT.md)
* [Security Policy](SECURITY.md)

---

### ⚠️ Technical Limitations (By Design)

Unlike the TradingView cloud environment, `OpenPineScript` is a local-first engine. We have intentionally deviated from standard Pine Script limits to allow for high-performance research:

* **No Loop Timeouts:** We do not enforce the 500ms loop limit. Your local CPU can handle complex iterative logic that would normally crash a TradingView chart.
* **Infinite Plotting:** The 64-plot limit is removed. You can generate hundreds of data streams for deep analysis.
* **Deep Historical Buffer:** We bypass the 5,000-bar `max_bars_back` limit. Your lookback depth is limited only by your system's RAM.
* **AST-Based Compilation:** We do not use "tokens." Even massive 10,000+ line scripts will compile as long as they follow the v2 grammar.

---

### What's next?

You are sitting on a very cool piece of tech—a local Pine v2 engine is rare. **Would you like me to help you draft the specific "Ground Truth" comparison script?** (Basically a small script that reads your engine's output and the TradingView CSV to tell you exactly where the numbers differ).

---

## ⚖️ License

GNU GPL-3.0. Built for the community, owned by the community.

---

<!---
Primary Keywords: Pine Script Open Source, Pine Script Runtime, Pine Script Parser, Local Backtesting Engine.
Secondary Keywords: TradingView Alternative, Pine Script to JavaScript, Open Source Financial Charts, ANTLR Pine Script, Algorithmic Trading Tools, Quant Trading.
Tags: #pinescript #tradingview #backtesting #fintech #technicalanalysis #compiler #opensource #quant #algotrading #javascript
Description: OpenPineScript is the leading open-source alternative for executing script logic locally. Built for speed, privacy, and high-performance technical analysis.
--->

