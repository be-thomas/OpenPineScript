# Conformance corpus

Real, published Pine Script — **not** written for this project. Synthetic
fixtures only exercise the constructs their author already thought about; every
engine bug listed below was found by a published script and by nothing else.

Scripts are vendored **verbatim**. Do not reformat, fix, or modernise them.
Their value is that they are exactly what real authors publish, whitespace
quirks and all.

## Provenance

Every source repository carries a licence compatible with this project's
GPL-3.0.

| Repository | Licence | Scripts |
|---|---|---|
| [everget/tradingview-pinescript-indicators](https://github.com/everget/tradingview-pinescript-indicators) | GPL-3.0 | 21 × v3 |
| [VessoVit/PineScripts](https://github.com/VessoVit/PineScripts) | MIT | 5 × v1 |
| [reneissancek/tradingview_indicators](https://github.com/reneissancek/tradingview_indicators) | GPL-3.0 | 3 × v1 |
| [RubyCharts/rubypine](https://github.com/RubyCharts/rubypine) | MIT | 2 × v1 |
| [sibvic/pinescript-templates](https://github.com/sibvic/pinescript-templates) | MIT | 2 × v3 |
| [sawantuday/pinescripts](https://github.com/sawantuday/pinescripts) | CC0-1.0 | 1 × v1, 1 × v2 |
| [revpriest/preMeditated](https://github.com/revpriest/preMeditated) | GPL-3.0 | 1 × v2 |
| [TPCharts/TradingViewIndicators](https://github.com/TPCharts/TradingViewIndicators) | GPL-3.0 | 1 × v2 |
| [Grahamovernightly/edgefindr](https://github.com/Grahamovernightly/edgefindr) | MIT | 1 × v2 |
| [setyadhiputrad/TradingView](https://github.com/setyadhiputrad/TradingView) | GPL-3.0 | 1 × v3 |
| [bitnom/Pine-Strategy-Template](https://github.com/bitnom/Pine-Strategy-Template) | GPL-3.0 | 1 × v3 |

Plus the 12 real v2 strategies already in [`validation/`](../../../validation),
which the v2 half of `corpus_execution.test.ts` also runs.

## How the corpus was selected

**v1 and v2 are scarce, and that is a fact about the world, not about the
search.** Those versions date from 2014–2016; virtually every Pine repository on
GitHub today holds v4 and v5. After surveying ~2,000 candidate files across 19
repositories, the entire compatible-licence population of v1 and v2 scripts was
what you see here — so all of it is vendored, complex or not.

v3 had 149 candidates, so those were chosen deliberately: the bulk are scripts
that RUN (so the suite asserts real end-to-end behaviour rather than cataloguing
bugs), picked for **feature diversity** as much as size. Twenty near-identical
oscillators exercise one code path twenty times.

### Two sources were rejected outright

- **`hasnocool/tradingview-pine-scripts`** (GPL-3.0, ~1,800 files) stores each
  script as a TradingView *page scrape*: a prose header, the editor's
  line-number gutter, then the code, with spaces as U+00A0. The gutter states
  how many code lines follow, which makes truncation detectable — and **1,757 of
  1,802 files are truncated**, the survivors all v4/v5. Vendoring a half-script
  would have produced parse failures that looked like engine bugs.
- **`fmzquant/strategies`** has 464 v2 files but publishes **no licence**.

### Three files were vendored and then dropped

`15min_breakout.pine`, `simple_moving_average.pine` and
`williams_commercial_index_….pine` carry no valid `//@version` annotation — one
has the typo `//@version4` — so the engine classifies them as v1. They use
`color.*`, `syminfo.*` and `plot.style_*`, which are v4-era. They are
unannotated *modern* scripts, and keeping them would have made the v1 corpus a
lie about what v1 is. (`simple_moving_average.pine` is also simply broken: it
reads an undeclared `crosssma`.)

## What the corpus has found

### Previously

| Bug | Effect |
|-----|--------|
| `COLOR_LITERAL : '#' [0-9a-fA-F]{6}` in the lexer grammar | ANTLR4 does not support `{n}` repetition in lexer rules — it parses `{6}` as an action block, so `#0ebb23` lexed as `#0` followed by the identifier `ebb23`. **Every script using a hex colour failed to parse.** |
| `na(x)` was not callable | The sandbox binds `na` to the NaN *value* so `x = na` works, clobbering the function. The most-used function in Pine threw at runtime, in every version. |
| Self-reference emitted `let s = f(s)` | A temporal dead zone error. The documented v1/v2 state idiom crashed. |
| Built-in shadowing | `sma = sma(close, 10)` is legal Pine; the emitted `let` shadowed the function it was calling. |
| Function-local declarations leaked to script scope | A function `md()` whose body declared a local `md` made an earlier `md(...)` call look like a forward reference. |
| Trailing binding did not return | A function ending in `b = x * 2` or `acc := …` fell off the end and returned `undefined`, so callers plotted NaN throughout. |
| Duplicate `_` in destructuring | `[m, _, _] = macd(…)` emitted `let _` twice — a JavaScript `SyntaxError`. |

### Found by this expansion

Every one of these is a TradingView-parity defect: valid published Pine that
this engine rejected or mis-ran. All are now FIXED.

| Bug | Effect |
|-----|--------|
| **A whitespace-only line emitted a spurious INDENT** | `LBEG` is `('\r'? '\n' \| '\r')+ [ \t]*`, so `"x = 1\n \nplot(x)"` matched `"\n "` — a newline plus the single space that was the whole next line. Measured naively that is an indent of 1, so the lexer emitted `<BEGIN>` then `<END>`. **One stray space on a blank line broke an entire script, in every version.** |
| **`if`/`else` never parsed** | Dedenting out of the `then` block emits `LEND, END, LEND`; the grammar expected `else` immediately after `END`. **Every if/else in every version was a syntax error.** |
| **Multi-line expression continuation** | Pine lets an expression continue on an indented next line. Both break styles occur — after a trailing operator (`x =` ⏎ `cond ? a :`) and before a leading one (`poles == 3` ⏎ `? f() : g()`) — and neither parsed. This alone was 598 errors on one 708-line script. |
| **Array literals as keyword arguments** | `input(..., options=["close", "high"])` — the standard dropdown-input idiom — had no grammar rule. |
| **Forward reference to a variable's history** | `nz(Seq_Gn[1])` above the line declaring `Seq_Gn` is legal in v1/v2 and is how published code seeds a counter from its own previous bar. Emitting `let` at the declaration put the earlier read in the temporal dead zone. Such declarations are now hoisted. |
| **User-defined function shadowed by a same-named local** | `mama = mama(src, …)` is legal Pine, which keeps functions and variables in separate namespaces. JavaScript does not, so the emitted `let` shadowed the function it was initialised from. User functions now emit into their own namespace. |
| **v3 forward-reference guard fired on function locals** | A function whose body declared `src` was reported as forward-referencing an unrelated global `src` further down the file — rejecting valid published code. |
| **Missing built-ins** | `time(resolution, session)`, `period`, `interval`, `ticker`, `timenow`, the `sunday`…`saturday` constants, `scale.*`, `strategy.commission.*`, single-argument `highest(length)`/`lowest(length)`, `percentile_nearest_rank`, `percentile_linear_interpolation`, and `heikinashi()`. |

### Found by closing out the gap list

The four entries below used to be a "known gaps" table. Working through them
found three more defects — two of them the most serious on this page, because
neither depended on any script in the corpus.

| Bug | Effect |
|-----|--------|
| **An indented COMMENT opened a block** | `LINE_COMMENT` is `-> skip`, so the comment vanishes before the parser sees it — but the whitespace in front of it had already been measured as an indent. Commenting out the body of an `if` therefore emitted `<BEGIN>` with no statements between it and `<END>`, and the script was rejected. Commenting out a branch is ordinary editing; TradingView accepts it. This was the whole of the remaining `VIX_bonds_strategy.pine` parse failure. |
| **`:=` was restricted to for-loop accumulators in v2** | Invented, not sourced. The v2 release notes say only *"assign a new value to a variable that has already been defined"* — a **declaration** rule, with no scope in it. The invented rule rejected two real published `//@version=2` scripts. `:=` now takes any scope in v2, and assigning to an undeclared name is the error instead. See `transpiler/v2/ToJsVisitor.ts`. |
| **Every calendar accessor read the host's local timezone** | `year`, `month`, `dayofmonth`, `dayofweek`, `hour`, `minute`, `second` and `weekofyear` used `getFullYear`/`getDay`/… while `timestamp()`, `time(res, session)` and the resampler all worked in UTC. `year(timestamp(2020, 1, 1))` returned **2019** west of Greenwich, and `dayofweek()` was a day out for half the world — so the engine's output depended on the machine it ran on. All now read UTC. |

### And what turned out not to be a bug

| Was recorded as | Actually |
|---|---|
| 3 lexer fixtures "the parser cannot handle" | Not Pine at all. `h = foo => 1` (Pine has no lambda value), `e = [1, 2, 3]` (no array values before v4), and a bare line of reserved words. TradingView rejects all three. They are token-stream probes for `tests/v2/lexer/lexer.test.ts`, where they do their job. Now filed as `not-a-program` with the offending construct named. |
| `sunday.pine` / `monday_range_fixed.pine` produce nothing | True, but unfalsifiable — a broken `dayofweek`, a broken `sunday` constant and a broken `time('D')` all produce nothing too. They are now run against a **seven-day calendar**, where they must plot on exactly the Sundays and nowhere else, and against the equity bars, where they must plot nothing. Both assertions hold. |
| `validation/gap_down_reversal_strategy.pine` | Annotated `//@version=2` but reads `syminfo.timezone` and calls the six-argument `timestamp(timezone, …)` — both **v4** built-ins. TradingView reports `Undeclared identifier 'syminfo'`. Asserted to be rejected, and to be rejected on that identifier. |

**Both gap inventories are now empty, and a test asserts they stay empty.**
`KNOWN_PARSE_GAPS`, `KNOWN_RUNTIME_GAPS` and the `parser-gap` category in
`v1_equals_v2.test.ts` each have a ratchet test, so re-populating one takes a
deliberate edit rather than an appended line.

### Timezone caveat

Calendar values are computed in **UTC**. TradingView computes them in the
**exchange's** timezone, and this engine has no exchange calendar, so a script
that filters on session boundaries or days of the week will differ for any
symbol not on UTC. Feeding bar timestamps pre-shifted to the exchange timezone
makes the two agree — which works only because the accessors read UTC rather
than the host's zone.

### Two files were dropped as invalid

- `orb.pine` used `&&` instead of `and`. That is not Pine — TradingView rejects
  it too — so rejecting it is correct parity, not a gap.
- See also the three unannotated v4-era files under *Three files were vendored
  and then dropped*, above.
