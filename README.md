# OpenPineScript — run TradingView Pine Script locally, offline

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%E2%89%A520-brightgreen.svg)](https://nodejs.org)
[![Pine Script](https://img.shields.io/badge/Pine%20Script-v1%20%E2%80%93%20v5-orange.svg)](#supported-pine-script-versions)
[![Tests](https://img.shields.io/badge/tests-1303%20passing-success.svg)](#testing)

**OpenPineScript is an open-source Pine Script engine.** It compiles TradingView
Pine Script source (`.pine`) to JavaScript and executes it against your own OHLCV
data — no TradingView account, no cloud, no execution quota, no 500 ms loop
timeout. Use it to backtest a Pine Script strategy offline, run a Pine indicator
in CI, or transpile Pine Script to JavaScript for embedding elsewhere.

Pine Script **v1, v2, v3, v4 and v5** are implemented, each with its own grammar
and its own emitter.

Requires Node.js 20 or newer.

## Contents

- [Quick start](#quick-start)
- [Supported Pine Script versions](#supported-pine-script-versions)
- [Parity: 763 real scripts from TradingView's docs](#parity-763-real-scripts-from-tradingviews-docs)
- [Command-line interface](#command-line-interface)
- [Transpile Pine Script to JavaScript](#transpile-pine-script-to-javascript)
- [Compare against a TradingView export](#compare-against-a-tradingview-export)
- [Testing](#testing)
- [Repository layout](#repository-layout)
- [Deliberate deviations from TradingView](#deliberate-deviations-from-tradingview)
- [FAQ](#faq)
- [Contributing](#contributing)
- [License](#license)

## Quick start

```bash
git clone https://github.com/be-thomas/OpenPineScript.git
cd OpenPineScript
npm install
```

`npm install` runs `generate:parser`, which builds the ANTLR parsers from
[`grammar/`](grammar/). Then run a script against a CSV of bars:

```bash
npm run opsv2 -- examples/sma_crossover.pine --data mock_data/AAPL_mock.csv
```

```
Compiling: sma_crossover.pine...
Pine Script: v1
Running backtest: 506 bars...
✔ Done.

=== sma_crossover.pine — Summary ===
Bars processed : 506
Plots recorded : 1
```

A strategy reports performance instead. This is one of TradingView's own
documentation examples, unedited:

```bash
npm run opsv2 -- examples/tradingview-docs/v4/v4-essential-strategies-00.pine \
  --data mock_data/AAPL_mock.csv
```

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

### Interactive REPL

```bash
npm run replv2
```

![OpenPineScript REPL evaluating Pine Script expressions in a terminal session](https://raw.githubusercontent.com/be-thomas/OpenPineScript/main/images/repl-1.png)

## Supported Pine Script versions

The `//@version` annotation selects the language version; a script without one is
v1. Each version has its own grammar and its own emitter, built by inheritance
from the one before it — so a v2 script is parsed by a parser that has never
heard of `var`, and a v5 script cannot spell `sma`.

| Version | State | What it adds |
|---------|-------|--------------|
| **v1** | Implemented | The base language. TradingView states v1 and v2 are the same language, and the test suite asserts that over the whole corpus |
| **v2** | Implemented | `:=` |
| **v3** | Implemented | A five-item tightening of v2 |
| **v4** | Implemented | `var` / `varip`, arrays, drawing objects, the namespace migration |
| **v5** | Implemented | `while`, `switch`, user-defined types, methods, libraries, the `ta.*` / `math.*` / `str.*` / `request.*` migration, matrices, maps, Pine Logs |

Roughly 270 standard-library names are implemented, along with the strategy
broker emulator, multi-timeframe `security()`, and the real-time tick model.

A library cannot be fetched from TradingView, so the caller supplies its source:

```js
compileScript(src, { libraries: { "user/name/1": source } })
```

The same arrangement covers higher-timeframe candles for `request.security` and
the non-price series behind `request.financial`.

§8 of the version delta spec (`dev-docs/01-version-delta-spec.md`) lists what is
still missing, and why each item is refused rather than approximated.

## Parity: 763 real scripts from TradingView's docs

[`examples/tradingview-docs/`](examples/tradingview-docs/) holds 763 complete
Pine Script programs taken verbatim from TradingView's own documentation —
v2 through v5, byte-for-byte identical to their sources, never edited.

They are there so parity can be measured against code neither this engine nor
its author wrote. Run one here, run the same script on TradingView, diff the
logs.

| Declared version | Scripts | Compile today |
|---|---|---|
| `//@version=2` | 26 | 23 (88%) |
| `//@version=3` | 18 | 17 (94%) |
| `//@version=4` | 148 | 129 (87%) |
| `//@version=5` | 571 | 326 (57%) |
| **Total** | **763** | **495 (65%)** |

Byte-identity is checked rather than promised —
[`scripts/fetch-doc-examples.mjs`](scripts/fetch-doc-examples.mjs) re-downloads
every page and compares SHA-256 digests against
[`MANIFEST.json`](examples/tradingview-docs/MANIFEST.json):

```bash
node scripts/fetch-doc-examples.mjs verify
```

All 495 that compile also RUN — not one produces a JavaScript error. An
unimplemented built-in is now reported as `Undeclared identifier` at compile
time, the way TradingView reports it, rather than crashing on the first bar.

The 268 that do not compile are a map of what is missing — compound assignment
(`+=`), `for … in`, `else if`, the `chart.*` and `format.*` namespaces, tuple
destructuring. Every one is broken down by cause in the
[corpus README](examples/tradingview-docs/README.md), along with the defects
running it has already fixed. The files are © TradingView and are not covered by
this repository's licence.

## Command-line interface

```bash
npm run opsv2 -- <script.pine> --data <data.csv> [flags]
```

### Export results

```bash
npm run opsv2 -- strategy.pine --data data.csv --out-dir ./results
```

```
results/
├── chart.csv       OHLCV plus one column per plot()
├── trades.csv      entry and exit rows per trade
└── summary.json    performance metrics
```

Every flag — `--out-chart`, `--out-trades`, `--compare-chart`, `--tolerance`,
`--input`, `--dry-run` — is documented in the
[CLI usage guide](CLI-Usage.md).

## Transpile Pine Script to JavaScript

```bash
npm run opsv2 -- examples/sma_crossover.pine \
  --data mock_data/AAPL_mock.csv --show-transpiled
```

```js
let opsv2_len = ctx.new_var("opsv2_len", 14);
let opsv2_src = ctx.new_var("opsv2_src", opsv2_close);
let opsv2_mySma = ctx.new_var("opsv2_mySma", ctx.call("sma@L4:C8", opsv2_sma, opsv2_src, opsv2_len));
ctx.call("plot@L6:C0", opsv2_plot, opsv2_mySma, { opsv2_color: opsv2_color.opsv2_red });
```

Every identifier is prefixed to avoid collisions with the sandbox, and every
stateful call carries its source location, so per-call-site state — an
indicator's lookback buffer, for example — stays independent.

## Compare against a TradingView export

Point `--compare-dir` at a folder holding `chart_data.csv`, `trades.csv` and
`summary.json` exported from TradingView:

```bash
npm run opsv2 -- strategy.pine --data data.csv \
  --out-dir ./results \
  --compare-dir ./tv_exports
```

```
=== Comparison Report ===
Overall: PARTIAL    Tolerance: 0.0001

Chart Data: PASS  (506 rows compared, 0 mismatches)
Trades:     FAIL  (38 tv / 37 opsv2 — 1 discrepancy)
  Trade #42: exit_price_mismatch  tv=45000.5000  opsv2=45001.0000  Δ=0.5
Summary:    PASS  (net profit Δ 0.05%)

Report written: ./results/comparison_report.json
```

## Testing

```bash
npm test
```

1,303 tests pass across 50 files. None fail.

Two patterns carry most of the weight:

- **Differential testing.** [`tests/v1/ta/naive_ta.ts`](tests/v1/ta/naive_ta.ts)
  is an independent naive reimplementation of the technical-analysis library.
  The engine is asserted to match it bar-for-bar over 5,000 seeded bars under
  four lookback regimes, rather than against hand-picked expected values.
- **The version matrix.** [`conformance/`](conformance/) asserts every language
  rule at every version, *including the versions where it is illegal* — so
  adding a version cannot silently relax an older one.

## Repository layout

| Path | Contents |
|------|----------|
| [`grammar/`](grammar/) | ANTLR lexer and parser grammars (`.g4`), one pair per version |
| [`lexer/`](lexer/) | Token source that turns indentation into block tokens |
| [`parser/`](parser/) | Generated ANTLR parsers and the parse entry point |
| [`transpiler/`](transpiler/) | Parse tree to JavaScript, one emitter per version |
| [`runtime/`](runtime/) | Execution context, series storage, standard library, broker emulator |
| [`repl/`](repl/) | Interactive REPL |
| [`mock_run/`](mock_run/) | CLI runner |
| [`utils/`](utils/) | Shared helpers and the TradingView comparison engine |
| [`tests/`](tests/) | Test suites, by version |
| [`conformance/`](conformance/) | The cross-version rule matrix and golden outputs |
| [`examples/`](examples/) | Hand-written samples and the TradingView documentation corpus |
| [`validation/`](validation/) | Real-world Pine scripts used for parity checking |
| [`spec/`](spec/) | Language specification and per-version progress checklists |
| `dev-docs/` | Development plan for v1–v5 (local only, not published) |
| [`mock_data/`](mock_data/) | Sample OHLCV data |

## Deliberate deviations from TradingView

TradingView enforces limits that protect a shared cloud tier. Running locally,
those limits are not parity — they are rationing. The engine skips them:

- **No 500 ms loop timeout** and no cumulative execution cap. A genuine infinite
  loop will hang the process.
- **No plot limit.** TradingView allows 64.
- **No `max_bars_back` window.** Lookback depth is bounded by available memory.
- **No script size limits.**

Semantic rules — the ones that would silently change your numbers — are enforced,
not skipped. Every skipped item is recorded with its blast radius in
`dev-docs/04-skipped-restrictions.md`.

## FAQ

### Can I run Pine Script without a TradingView account?

Yes. That is what this is for. You supply the OHLCV data as CSV; nothing calls
TradingView.

### Does it support Pine Script v5?

Yes — including `while`, `switch`, user-defined types, methods, libraries,
matrices, maps and Pine Logs. See
[Supported Pine Script versions](#supported-pine-script-versions), and the
[parity corpus](examples/tradingview-docs/README.md) for what is still missing.

### Does it support Pine Script v6?

No. v6 is not implemented. A v6 script is rejected rather than run under v5
rules, because silently downgrading it would produce wrong numbers instead of an
error.

### Will results match TradingView exactly?

For everything the engine implements, that is the goal, and `--compare-dir`
exists to measure it against a real TradingView export. Known divergences are
documented rather than hidden — see `dev-docs/01-version-delta-spec.md` §8.

### Can I use it to backtest a strategy?

Yes. `strategy()` scripts run against the broker emulator and produce trades and
performance metrics. See [Export results](#export-results).

### Is it a Pine Script interpreter or a compiler?

A compiler. Pine source is parsed to a tree and emitted as JavaScript, which then
runs bar by bar against an execution context. `--show-transpiled` prints the
JavaScript.

### How do I convert Pine Script to JavaScript?

Use `--show-transpiled`, or call `compileScript()` from
[`transpiler/index.ts`](transpiler/index.ts) directly.

## Contributing

The core is developed by a single author and pull requests are not being
accepted, but bug reports and feature requests drive the roadmap. See
[CONTRIBUTING.md](CONTRIBUTING.md), the
[Code of Conduct](CODE_OF_CONDUCT.md), and the
[Security Policy](SECURITY.md).

The plan for v1–v5 lives in `dev-docs/`, which is kept out of the repository: an
architecture assessment, a version delta spec sourced from TradingView's
migration guides, and a 16-iteration roadmap.

## License

GNU GPL-3.0. See [LICENSE](LICENSE).

The Pine Script language and TradingView are trademarks of TradingView, Inc.
This project is not affiliated with or endorsed by TradingView. The examples in
[`examples/tradingview-docs/`](examples/tradingview-docs/) are © TradingView,
reproduced verbatim for interoperability testing and not covered by the licence
above.

---

<sub>Keywords: Pine Script, TradingView, Pine Script v5, Pine Script v4,
Pine Script compiler, Pine Script interpreter, Pine to JavaScript, run Pine
Script locally, offline backtesting, Pine Script backtest, technical analysis
library, ANTLR, TypeScript, open source trading.</sub>
