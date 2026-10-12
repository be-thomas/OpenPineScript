# OpenPineScript — run TradingView Pine Script locally, offline

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%E2%89%A520-brightgreen.svg)](https://nodejs.org)
[![Pine Script](https://img.shields.io/badge/Pine%20Script-v1%20%E2%80%93%20v5-orange.svg)](#supported-pine-script-versions)
[![Tests](https://img.shields.io/badge/tests-2371%20passing-success.svg)](#testing)
[![TradingView parity](https://img.shields.io/badge/TradingView%20parity-112%20columns%20%C3%97%202%2C474%20bars-blueviolet.svg)](#verified-against-tradingview-itself)

**OpenPineScript is an open-source Pine Script engine.** It compiles TradingView
Pine Script source (`.pine`) to JavaScript and executes it against your own OHLCV
data — no TradingView account, no cloud, no execution quota, no 500 ms loop
timeout. Use it to backtest a Pine Script strategy offline, run a Pine indicator
in CI, or transpile Pine Script to JavaScript for embedding elsewhere.

Pine Script **v1, v2, v3, v4 and v5** are implemented, each with its own grammar
and its own emitter.

**Its numbers are checked against TradingView's own.** 112 indicator, control-flow
and broker columns are compared bar for bar against output collected from
TradingView, over 2,474 daily bars each, at a relative tolerance of 1e-6. Every
one of them agrees — see [Verified against TradingView
itself](#verified-against-tradingview-itself).

Requires Node.js 20 or newer.

## Contents

- [Quick start](#quick-start)
- [Supported Pine Script versions](#supported-pine-script-versions)
- [Verified against TradingView itself](#verified-against-tradingview-itself)
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
npm run opsv2 -- examples/v1/sma_crossover.pine --data mock_data/common/AAPL_mock.csv
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
npm run opsv2 -- examples/v4/tradingview-docs/v4-essential-strategies-00.pine \
  --data mock_data/common/AAPL_mock.csv
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

![OpenPineScript REPL evaluating Pine Script expressions in a terminal session](https://raw.githubusercontent.com/be-thomas/OpenPineScript/main/images/common/repl-1.png)

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

## Verified against TradingView itself

Most engines are tested against a specification, against a reference
implementation, or against numbers someone worked out by hand. None of those
catch an indicator that is subtly and *consistently* wrong — and this repo has
the receipts for why that matters: its hand-written `ta.sar` oracle contained
the same three mistakes as the engine it was checking, so the differential test
confirmed the bug for as long as it existed.

So the engine is held against TradingView's own output.

### Golden data: 112 columns, bar for bar

[`tradingview_golden.test.ts`](conformance/common/tradingview_golden.test.ts)
runs nine harness scripts that were pasted into TradingView, whose per-bar
output was copied back out, and replays them here against the same bars:

| Harness | Columns | What it pins |
|---|---|---|
| [`core`](conformance/v5/golden/harness_core.pine) | 28 | moving averages, oscillators, volatility, regression, `stoch`, `alma`, `percentrank` |
| [`control`](conformance/v5/golden/harness_control.pine) | 15 | `if`/`else`, ternaries, boolean operators, `barssince`, `valuewhen`, state machines |
| [`state`](conformance/v5/golden/harness_state.pine) | 15 | path-dependent values — `cum`, `sar`, `vwap`, crosses, `rising`/`falling` |
| [`loops`](conformance/v5/golden/harness_loops.pine) | 13 | `for` with `break`/`continue`, nesting, dynamic bounds, empty ranges |
| [`bands`](conformance/v5/golden/harness_bands.pine) | 11 | `macd`, Bollinger, `tsi`, and averages composed of other averages |
| [`builtins`](conformance/v5/golden/harness_builtins.pine) | 8 | built-ins against the same formula written out by hand |
| [`exits`](conformance/v5/golden/harness_exits.pine) | 8 | limit/stop brackets: when they fill, at what price, and what that leaves |
| [`strategy`](conformance/v5/golden/harness_strategy.pine) | 7 | order flow — `position_size`, `opentrades`, `equity` |
| [`loopargs`](conformance/v5/golden/harness_loopargs.pine) | 7 | one call site reached repeatedly on one bar |

**112 columns, ~2,474 daily bars each, relative tolerance 1e-6. All agree.**

The suite refuses to pass vacuously: a column compared on fewer than 50 bars, or
one that never changes value, fails rather than agreeing. Where TradingView
reports `na` and the engine reports a number, that is a disagreement too — the
bar a value *starts* on is asserted, not just the values themselves.

### What it caught

Eleven defects that every other kind of test had missed, each one now pinned to
the bar that exposed it:

| Defect | Consequence |
|---|---|
| `ta.sar` was textbook Wilder, not TradingView's `pine_sar` | every SAR value, on every chart |
| `ta.vwap` never reset at session boundaries | drifted *further* the more history it was given |
| market orders filled on the placing bar, at its close | every backtest one bar early **and** at the wrong price |
| limit/stop orders matched the bar that placed them | brackets closed at a stop the next bar never touched |
| fills were applied after the script ran | every fill reported a bar late |
| an order gapped past filled *at its level* | a price that never traded, flattering every gap |
| fills ignored `syminfo.mintick` | sub-tick drift, compounding across trades |
| `initial_capital` defaulted to 100k and ignored the declaration | every reported percentage |
| `and`/`or` short-circuited | permanent gaps in any series behind a condition |
| a call site advanced once per *reach*, not once per *bar* | anything stateful in a loop warmed up N× too fast |
| rolling windows returned a value at bar 0 | the first N bars of `highest`/`lowest`/`stoch` |

Three of those flattered backtests in the same direction, which is the kind of
error a backtester is least likely to notice and least able to afford.

### How the data is collected

TradingView has no API for indicator values, so this part is manual and
deliberately cheap to repeat. Each harness emits one CSV row per bar through
Pine Logs — free, unlike the PRO+ "Export chart data…" feature, and it runs on
historical bars:

1. Paste `conformance/v5/golden/harness_<name>.pine` into the Pine editor.
2. Open **More (⋮) → Pine Logs**, select the lines, copy.
3. Save as `conformance/v5/golden/harness_<name>.<SYMBOL>.<TF>.log`.

[`log_harnesses.test.ts`](conformance/common/log_harnesses.test.ts) compiles and
runs every harness on each commit, so a broken one is found in CI rather than in
a browser after the chart is set up.

A harness is also how an open question gets settled rather than guessed. When
the engine had no evidence for what a series function does when its call site is
reached twice on one bar, it *refused* that program — and `harness_loopargs`
was written to ask TradingView. The answer was none of the three behaviours it
was written to choose between: the history keeps one slot per **bar**, which
each reach overwrites. Replaying that rule reproduces TradingView on all 2,464
bars it reports.

### Scanner anchors: 38 indicators, every commit

The golden suite needs a human. [`scanner_anchors.test.ts`](conformance/common/scanner_anchors.test.ts)
does not — it compares 38 indicators against values **TradingView computed**, on
the bar TradingView computed them for, from a frozen fixture:

| | |
|---|---|
| moving averages | `SMA`/`EMA` at 5, 10, 20, 30, 50, 100, 200 |
| oscillators | `RSI` 14 and 7, `MACD` line and signal, `CCI`, `Stoch.RSI` %K/%D, `W%R`, `ROC`, `Mom`, `AO`, `BBPower` |
| volatility & bands | `ATR`, Bollinger upper/lower, Donchian, Ichimoku base/conversion |
| trend | `ADX` with +DI and −DI, Parabolic SAR, Hull MA, VWMA |

All 38 agree, 36 of them to 1e-14. The two that do not are understood: `VWMA`
differs at 5.2e-9 whatever the window length, which is the volume the two sides
divide by rather than the arithmetic, and `EMA200` carries a seed this fixture's
window cannot see — 7.6e-6 over 999 bars, 4.3e-15 over the full history.

A comparison is only meaningful if both sides computed from the same bars, and
TradingView does not publish its history. The fixture sidesteps that by choosing
a symbol where it does not have to: TradingView's `BINANCE:BTCUSDT` feed is
Binance's, Binance serves its klines publicly, and
[the collector](scripts/common/fetch-scanner-anchors.mjs) refuses to write a
fixture unless the bar TradingView reported matches the bar Binance served to
the last decimal — so a disagreement is always attributable to the engine.

```bash
node scripts/common/fetch-scanner-anchors.mjs   # refresh the frozen fixture
```

It is narrow, and worth saying so: ONE bar rather than a series, over a list of
indicators chosen by TradingView's screener rather than by this repo. A function
can agree on the captured bar and be wrong on the one before it. That is what
the golden harnesses are for — and unlike them, this suite runs unattended.

### What is *not* covered

Roughly a tenth of the ~700-entry standard library has ever been held against
TradingView's own numbers, concentrated in `ta.*`, `math.*` and `strategy.*`.
Eleven defects in that tenth is not a rate that suggests the rest is clean.
`str.*`, `array.*`/`matrix.*`, the drawing namespaces, `request.security` across
timeframes, and every intraday concern (sessions, `time()`, `timeframe.*`) have
no TradingView-anchored coverage yet. Every export so far is a daily chart.

Writing a harness is the contribution with the highest value per line in this
repo. [`conformance/common/golden.md`](conformance/common/golden.md) has the
recipe.

## Parity: 763 real scripts from TradingView's docs

[`examples/<version>/tradingview-docs/`](examples/common/tradingview-docs/README.md) holds 763 complete
Pine Script programs taken verbatim from TradingView's own documentation —
v2 through v5, byte-for-byte identical to their sources, never edited.

They are there so parity can be measured against code neither this engine nor
its author wrote. Run one here, run the same script on TradingView, diff the
logs.

| Declared version | Scripts | Compile today |
|---|---|---|
| `//@version=2` | 26 | 26 (100%) |
| `//@version=3` | 18 | 17 (94%) |
| `//@version=4` | 148 | 146 (99%) |
| `//@version=5` | 571 | 552 (97%) |
| **Total** | **763** | **741 (97%)** |

Byte-identity is checked rather than promised —
[`scripts/common/fetch-doc-examples.mjs`](scripts/common/fetch-doc-examples.mjs) re-downloads
every page and compares SHA-256 digests against
[`MANIFEST.json`](examples/common/tradingview-docs/MANIFEST.json):

```bash
node scripts/common/fetch-doc-examples.mjs verify
```

Every one of the 741 also emits VALID JavaScript, and running all of them over
506 bars produces no `ReferenceError` — an unknown name is reported at COMPILE
time, the way TradingView reports it, rather than crashing on the first bar or,
worse, reading as `undefined` and taking a branch nobody meant.

| Running all 741 over the sample dataset | |
|---|---|
| produces output — plots, drawings, trades or logs | 658 |
| plots only `na`, and draws nothing | 36 |
| produces nothing at all | 8 |
| raises a runtime error | 39 |

215 of the 658 have no `plot()` call at all: they draw lines, labels and boxes,
or open positions, or log.

The other two columns are accounted for one file at a time rather than assumed.
All 8 that produce nothing are correct: two are libraries, one declares three
empty collections, two guard on `bar_index > 4000` where the dataset has 506
bars, and two on `year > 2020` where it ends in 2017. Of the 36 that plot only
`na`, all but a handful ask for a symbol this dataset is not or an intraday
session it does not cover; the rest hide their plot with `offset = -99999`, plot
`na` outright, or want a date outside 2015–2017. Two are gaps of a different
kind, and named as such: `v5-language-type-system-47` and
`v5-writing-limitations-05` are errors TradingView raises and this engine does
not, one for a `series string` where a `simple string` is required and one for
the 40-call `request.*()` limit.

Every one of the 39 runtime errors is pinned by CAUSE in
[`conformance/common/docs_corpus_execution.test.ts`](conformance/common/docs_corpus_execution.test.ts),
so a new one cannot arrive quietly. Seventeen are the script's own error — a
`runtime.error()` call, or an index the page is written to show failing; eleven
need host data this engine cannot fetch (`request.financial`, `request.economic`
and the rest); eleven are deliberate refusals (`renko`, `linebreak`, `kagi`,
`pointfigure` cannot be rebuilt from OHLCV bars, and `accdist`'s published
definitions disagree on a seed).

The same suite asserts that **no keyword argument is silently dropped** across
all 741. `Context.call` binds a keyword by looking its name up in the callee's
signature and discards one it does not find, which is how
`strategy.entry(when = …)` came to fire unconditionally and `input.int(minval =
1)` to clamp nothing. Forty distinct (function, argument) pairs were being
discarded; the set is now empty and pinned that way.

The 22 that do not compile contain no known engine gap. Twelve are not runnable
Pine at all — documentation blocks rather than scripts, or scripts that exist to
DEMONSTRATE a compilation error — and are pinned as such in
[`conformance/common/docs_corpus_integrity.test.ts`](conformance/common/docs_corpus_integrity.test.ts)
so the denominator stays honest. The other ten `import` a library, which needs
that library's source; for the three whose library the docs publish alongside
them, the same suite proves both halves compile together. Every one is broken
down by cause in the
[corpus README](examples/common/tradingview-docs/README.md), along with the defects
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
npm run opsv2 -- examples/v1/sma_crossover.pine \
  --data mock_data/common/AAPL_mock.csv --show-transpiled
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

2,371 tests pass across 84 files. None fail.

Three patterns carry most of the weight:

- **Differential testing.** [`tests/v1/ta/naive_ta.ts`](tests/v1/ta/naive_ta.ts)
  is an independent naive reimplementation of the technical-analysis library.
  The engine is asserted to match it bar-for-bar over 5,000 seeded bars under
  four lookback regimes, rather than against hand-picked expected values.
- **The version matrix.** [`conformance/`](conformance/) asserts every language
  rule at every version, *including the versions where it is illegal* — so
  adding a version cannot silently relax an older one.
- **Parity against TradingView itself.** The two suites above check the engine
  against a spec or against another version of itself, and neither can catch an
  indicator that is subtly, consistently wrong — an `rma` seeded one bar early,
  an `atr` smoothed with the wrong average. Only TradingView's own numbers can.

### Parity against TradingView

See [Verified against TradingView itself](#verified-against-tradingview-itself)
— the golden-data suite and the scanner anchors both live there.

## Repository layout

Every top-level folder partitions its contents the same way: child folders are
named `v1`–`v5` for version-specific code and `common` for anything shared. The
grammars are the one place this costs something — ANTLR resolves composite
`import` chains through a single `--lib` directory, so
[`scripts/common/build-grammars.mjs`](scripts/common/build-grammars.mjs) stages
every `.g4` into one temporary folder at build time and deletes it afterwards.

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
[parity corpus](examples/common/tradingview-docs/README.md) for what is still missing.

### Does it support Pine Script v6?

No. v6 is not implemented. A v6 script is rejected rather than run under v5
rules, because silently downgrading it would produce wrong numbers instead of an
error.

### Will results match TradingView exactly?

Where it has been measured, yes. 112 columns are compared bar for bar against
output collected from TradingView, at a relative tolerance of 1e-6, and all of
them agree — see [Verified against TradingView
itself](#verified-against-tradingview-itself). That covers roughly a tenth of
the standard library, concentrated in `ta.*`, `math.*` and `strategy.*`; the
same section says plainly what is not covered.

Measuring it on *your* script is what `--compare-dir` is for. Known divergences
are documented rather than hidden — `dev-docs/01-version-delta-spec.md` §8 for
semantics, `dev-docs/04-skipped-restrictions.md` for deliberate gaps.

### Can I use it to backtest a strategy?

Yes. `strategy()` scripts run against the broker emulator and produce trades and
performance metrics. See [Export results](#export-results).

### Is it a Pine Script interpreter or a compiler?

A compiler. Pine source is parsed to a tree and emitted as JavaScript, which then
runs bar by bar against an execution context. `--show-transpiled` prints the
JavaScript.

### How do I convert Pine Script to JavaScript?

Use `--show-transpiled`, or call `compileScript()` from
[`transpiler/common/index.ts`](transpiler/common/index.ts) directly.

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
[`examples/<version>/tradingview-docs/`](examples/common/tradingview-docs/README.md) are © TradingView,
reproduced verbatim for interoperability testing and not covered by the licence
above.

---

<sub>Keywords: Pine Script, TradingView, Pine Script v5, Pine Script v4,
Pine Script compiler, Pine Script interpreter, Pine to JavaScript, run Pine
Script locally, offline backtesting, Pine Script backtest, technical analysis
library, ANTLR, TypeScript, open source trading.</sub>
