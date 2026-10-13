<div align="center">

# OpenPineScript

### Run TradingView Pine Script locally — offline, unlimited, and verified against TradingView itself

**Compile Pine Script to JavaScript and execute it on your own OHLCV data.**
No TradingView account. No cloud. No execution quota. No 500 ms loop timeout.

[![TradingView parity](https://img.shields.io/badge/TradingView_parity-112_columns_×_2%2C474_bars-7B3FE4?style=for-the-badge)](docs/common/CONFORMANCE.md)
[![Tests](https://img.shields.io/badge/tests-2%2C396_passing-22C55E?style=for-the-badge)](docs/common/CONFORMANCE.md#testing)
[![Pine Script](https://img.shields.io/badge/Pine_Script-v1_→_v5-F97316?style=for-the-badge)](#-supported-pine-script-versions)

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg?style=flat-square)](LICENSE)
[![Node](https://img.shields.io/badge/node-≥20-339933.svg?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6.svg?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Docs corpus](https://img.shields.io/badge/docs_corpus-741%2F763_compile-0EA5E9.svg?style=flat-square)](docs/common/CONFORMANCE.md#parity-763-real-scripts-from-tradingviews-docs)

[Quick start](#-quick-start) · [Why](#-why-openpinescript) · [Parity](#-verified-against-tradingview-itself) · [Docs](#-documentation) · [FAQ](#-faq)

</div>

---

**OpenPineScript is an open-source Pine Script engine.** It transpiles TradingView
Pine Script (`.pine`) to JavaScript and runs it against your own candles — so you
can **backtest a Pine Script strategy offline**, run a Pine indicator in CI,
convert Pine Script to JavaScript for embedding elsewhere, or batch-test
thousands of scripts without touching a browser.

Pine Script **v1, v2, v3, v4 and v5** are implemented, each with its own grammar
and its own emitter.

```
=== v4-essential-strategies-00.pine — Summary ===
Bars processed : 506
Plots recorded : 1

Performance:
  Net Profit         +$77.60 (+0.08%)
  Total Trades       199
  Win Rate           32.7%  (65W / 55L)
  Profit Factor      1.134
  Max Drawdown       0.10%
  Avg Win / Avg Loss $10.10 / $10.52
```

<sub>One of TradingView's own documentation examples, unedited, run locally.</sub>

---

## ⚡ Quick start

```bash
git clone https://github.com/be-thomas/OpenPineScript.git
cd OpenPineScript
npm install
```

Run any Pine script against a CSV of bars:

```bash
npm run opsv2 -- examples/v1/sma_crossover.pine --data mock_data/common/AAPL_mock.csv
```

Or explore interactively:

```bash
npm run replv2
```

![OpenPineScript REPL evaluating Pine Script expressions in a terminal session](https://raw.githubusercontent.com/be-thomas/OpenPineScript/main/images/common/repl-1.png)

---

## 🎯 Why OpenPineScript

| | |
|---|---|
| 📊 **Numbers you can trust** | 112 indicator, control-flow and broker columns matched **bar for bar** against TradingView's own output. Not against a spec — against the platform. |
| 🔌 **Completely offline** | Your data, your machine, your loop budget. No account, no quota, no rate limit, no network. |
| 🗂️ **Five language versions** | v1 → v5, each with its own grammar and emitter, so a v2 script is parsed by a parser that has never heard of `var`. |
| 🔁 **Pine → JavaScript** | Emit readable JS and embed it anywhere — a worker, a server, a browser, a CI job. |
| 🤖 **Built for automation** | JSON output, exit codes, input overrides, and a comparison mode that diffs your run against a TradingView export. |
| 🧪 **2,396 tests** | Differential testing against an independent oracle, a full version matrix, 763 real scripts from TradingView's docs, and the parity suites above. |

---

## 🎖️ Verified against TradingView itself

Most engines are tested against a specification or a reference implementation.
Neither catches an indicator that is subtly and **consistently** wrong.

So nine harness scripts were run **inside TradingView**, their per-bar output
copied back out, and replayed here against the same candles:

<div align="center">

### **112 columns · ~2,474 bars each · tolerance 1e-6 · all agree**

</div>

A further **38 indicators** are anchored to values TradingView's own screener
computed, from a frozen fixture that runs unattended on every commit.

This process found **eleven defects** that every other kind of test had missed —
including a Parabolic SAR that was the textbook algorithm rather than
TradingView's, market orders filling a bar early at the wrong price, and a VWAP
that never reset at session boundaries.

> 📖 **[Read the full conformance report →](docs/common/CONFORMANCE.md)**
> Every harness, every defect, how the data is collected — and an honest account
> of [what is *not* covered yet](docs/common/CONFORMANCE.md#what-is-not-covered).

---

## 🗂️ Supported Pine Script versions

The `//@version` annotation selects the language version; a script without one is v1.

| Version | State | What it adds |
|---------|-------|--------------|
| **v1** | ✅ Implemented | The base language |
| **v2** | ✅ Implemented | `:=` |
| **v3** | ✅ Implemented | A five-item tightening of v2 |
| **v4** | ✅ Implemented | `var` / `varip`, arrays, drawing objects, the namespace migration |
| **v5** | ✅ Implemented | `while`, `switch`, user-defined types, methods, libraries, matrices, maps, Pine Logs, the `ta.*` / `math.*` / `str.*` migration |

Roughly **270 standard-library names** are implemented, along with the strategy
broker emulator, multi-timeframe `security()`, and the real-time tick model.

---

## 🛠️ What you can build with it

- **Backtest Pine Script strategies offline** on years of your own data, with no execution cap
- **Run indicators in CI** and fail a build when a signal changes
- **Convert Pine Script to JavaScript** and embed it in a product
- **Batch-screen thousands of scripts** in parallel
- **Diff against TradingView** with `--compare-dir` to measure agreement on your own script

```bash
npm run opsv2 -- strategy.pine --data data.csv --out-dir ./results --json
```

> 📖 **[Full CLI reference →](CLI-Usage.md)** — output flags, comparison mode,
> input overrides, structured output, debug flags.

---

## 📚 Documentation

| Doc | What it answers |
|---|---|
| **[Conformance report](docs/common/CONFORMANCE.md)** | How the numbers are verified, what that caught, what is not covered |
| **[CLI usage](CLI-Usage.md)** | Every flag, with worked examples |
| **[Architecture](docs/common/ARCHITECTURE.md)** | The compile pipeline and the repository layout |
| **[Golden-data recipe](conformance/common/golden.md)** | How to collect a new TradingView export |
| **[Integration guide](dev-docs/integration/README.md)** | Embedding the engine in a charting UI: plotting, strategies, live ticks |
| **[Development docs](dev-docs/README.md)** | Version delta spec, roadmap, deliberate omissions |

---

## ❓ FAQ

<details>
<summary><b>Can I run Pine Script without a TradingView account?</b></summary>
<br>

Yes. That is the point of the project. OpenPineScript compiles and executes Pine
Script entirely on your machine, against CSV data you supply. Nothing is sent
anywhere and no account is involved.
</details>

<details>
<summary><b>Does it support Pine Script v5?</b></summary>
<br>

Yes — v5 is implemented, including user-defined types, methods, libraries,
`while`, `switch`, matrices, maps, enums and Pine Logs, along with the `ta.*`,
`math.*`, `str.*` and `request.*` namespace migration. v1 through v4 are
implemented too.
</details>

<details>
<summary><b>Does it support Pine Script v6?</b></summary>
<br>

Not yet. v6 is the next target. The architecture is built for it: each version
has its own grammar and its own emitter, inheriting from the one before, so
adding a version does not mean editing an earlier one.
</details>

<details>
<summary><b>Will results match TradingView exactly?</b></summary>
<br>

Where it has been measured, yes. 112 columns are compared bar for bar against
output collected from TradingView, at a relative tolerance of 1e-6, and all of
them agree. That covers roughly a tenth of the standard library, concentrated in
`ta.*`, `math.*` and `strategy.*` — the
[conformance report](docs/common/CONFORMANCE.md#what-is-not-covered) says plainly what
is not covered.

To measure it on *your* script, use `--compare-dir` against a TradingView export.
</details>

<details>
<summary><b>Can I use it to backtest a strategy?</b></summary>
<br>

Yes. `strategy()` scripts run against a broker emulator that models order
timing, fill prices, gaps, tick rounding and brackets the way TradingView's
does — each of those rules measured against TradingView's own backtest output
rather than assumed.
</details>

<details>
<summary><b>Is it a Pine Script interpreter or a compiler?</b></summary>
<br>

A compiler. Pine source is parsed by an ANTLR-generated parser into a syntax
tree, and a version-specific visitor emits JavaScript, which is then executed
bar by bar against a runtime that provides the standard library.
</details>

<details>
<summary><b>How do I convert Pine Script to JavaScript?</b></summary>
<br>

`npm run opsv2 -- script.pine --emit-js out.js`, or call `compileScript(src)`
from `transpiler/common` to get the emitted source back as a string.
</details>

---

## 🤝 Contributing

The core is developed by a single author and pull requests are not being
accepted, but **bug reports and feature requests drive the roadmap**. See
[CONTRIBUTING.md](CONTRIBUTING.md), the [Code of Conduct](CODE_OF_CONDUCT.md),
and the [Security Policy](SECURITY.md).

Writing a golden-data harness is the single highest-value contribution to the
project — the [recipe is here](conformance/common/golden.md).

## 📄 License

GNU GPL-3.0. See [LICENSE](LICENSE).

The Pine Script language and TradingView are trademarks of TradingView, Inc.
This project is not affiliated with or endorsed by TradingView. The examples in
[`examples/<version>/tradingview-docs/`](examples/common/tradingview-docs/README.md)
are © TradingView, reproduced verbatim for interoperability testing and not
covered by the licence above.

---

<div align="center">

**If this saved you a TradingView quota, a ⭐ helps others find it.**

<sub>Keywords: Pine Script, TradingView, Pine Script v5, Pine Script v4, Pine Script compiler,
Pine Script interpreter, Pine to JavaScript, run Pine Script locally, offline backtesting,
Pine Script backtest, algorithmic trading, technical analysis library, ANTLR, TypeScript,
open source trading, trading indicator engine.</sub>

</div>
