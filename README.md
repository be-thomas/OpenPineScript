
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

