# TradingView golden data

Numerical parity against TradingView itself. This is the only evidence in the
repo that an indicator is *numerically* right — every other suite checks the
engine against a spec, against another version of itself, or against a value
someone worked out by hand, and none of those catches an `rma` seeded one bar
early or a `linreg` off by a half-period.

**It cannot be automated.** TradingView publishes no API for indicator values,
the export needs a logged-in session, and scripting the UI would breach their
terms. A human has to do it once per harness. It takes about ten minutes.

## Two routes

| | Route A — Export chart data | Route B — Pine Logs |
|---|---|---|
| Plan | **PRO+ / Premium** | any, including free |
| Harness | `v3/` and `v4/` | `v5/` (generated) |
| Saves as | `.csv` | `.log` |
| Effort | one click | select-and-copy the log pane |

Both produce the same columns and are read by the same test. Use whichever your
plan allows.

**`alert()` cannot do this.** It is the obvious idea and it does not work: alerts
fire **only on realtime bars**, never on historical ones, so you would collect
one row per bar as it forms — 400 bars on a 1D chart is 400 days. Webhooks are
also PRO-gated. `log.info()` is the one that runs over history.

## Route B — Pine Logs (free)

1. `npx tsx scripts/make-log-harness.ts` regenerates [`v5/`](v5) from the v3 and
   v4 sources. They are committed, so you only need this after editing a harness.
2. Paste [`v5/harness_core.pine`](v5/harness_core.pine) into the Pine editor and
   add it to the chart.
3. Open **More (⋮) → Pine Logs**.
4. Select every line in the pane and copy.
5. Save as `v3/harness_core.<SYMBOL>.<TF>.log` — **beside the v3 harness**, not
   the v5 one. The v5 file is the collection tool; the v3 file is what this
   engine runs to compare against.
6. `npx vitest run conformance/tradingview_golden.test.ts`

The pane holds the last **10,000 historical messages** and each harness logs one
row per bar, so anything up to 10,000 bars arrives in one copy. Copy the WHOLE
pane — the column header is logged once, on the first bar, and the test cannot
name its columns without it. Order does not matter; rows are sorted by timestamp.

Why v5: Pine Logs were added with v5, so a v3 script cannot call `log.info()`.
The v3 harness stays the source of truth and
[`scripts/make-log-harness.ts`](../../scripts/make-log-harness.ts) derives the
v5 form — two hand-written copies would drift, and no test could catch it.

## Route A — Export chart data (PRO+ / Premium)

### Recipe

1. Open a chart. **Symbol and timeframe choice matters — see below.**
2. Pine editor → paste [`v3/harness_core.pine`](v3/harness_core.pine) →
   *Add to chart*.
3. If TradingView rejects `//@version=3`, change **only line 1** to
   `//@version=4`, and move the file to `v4/`. The test reads the version from
   the DIRECTORY, not the annotation, so a harness left in `v3/` after a bump
   still compiles as v3 — which is usually fine (the built-ins are spelled the
   same) but will not exercise the v4 gate.
4. If TradingView rejects one specific `plot(...)` line, **delete that line**.
   The test compares the intersection of the CSV's columns and our engine's
   plots, so one missing column costs one assertion, not the file.
5. Scroll left until the chart shows as much history as you want exported —
   **the export contains only the bars that are loaded**, and Premium tops out
   around 20,000.
6. Chart menu (top right, the ⌄ next to the camera) → **Export chart data…**.
7. Keep the defaults: ISO time, and make sure the **main series is included**,
   not just the indicator. The test needs the OHLCV columns to feed the engine
   the same bars TradingView used.
8. Save the CSV **next to the harness that produced it**, named
   `<harness>.<symbol>.<timeframe>.csv` — e.g.
   `v3/harness_core.BTCUSD.1D.csv`. The part before the first dot must match
   the harness filename; that is how the test knows which script to run.
9. Repeat for the other harnesses in the table below.
10. `npx vitest run conformance/tradingview_golden.test.ts`

## Choosing a symbol and timeframe

| Harness | Paste as | Needs | Why |
|---|---|---|---|
| `v3/harness_core` | v3 | ≥ 400 bars, anywhere | Everything converges; the test skips a 300-bar warm-up |
| `v3/harness_bands` | v3 | ≥ 400 bars, anywhere | Same |
| `v3/harness_loops` | v3 | ≥ 400 bars, anywhere | Loops read bounded windows |
| `v3/harness_state` | v3 | **entire history** | Nothing here converges |
| `v3/harness_control` | v3 | **entire history** | Counters and a state machine run from bar 0 |
| `v3/harness_strategy` | v3 | **entire history** | Equity and position size accumulate from the first fill |
| `v4/harness_builtins` | **v4** | ≥ 400 bars, anywhere | `bb`/`wpr`/`mfi` do not exist before v4 |

### Why there is a `v4/` folder

`bb`, `bbw`, `kc`, `kcw`, `dmi`, `wpr`, `hma`, `supertrend`, `cmo` and `mfi` —
and the variables `iii`, `wvad`, `wad`, `obv`, `pvt`, `nvi`, `pvi` — were added
by TradingView in **March 2020**, which is v4 and later only. Pasting a v3
script that calls one gives:

> Could not find function or function reference 'bb'

They are exported at v4 and **compiled as v4** — the golden test takes each
harness's version from its directory, so `v4/` runs through the v4 pipeline.

**The parity gap this section used to record is now closed.** The engine resolved
`bb`, `wpr` and `mfi` at v1–v3, where TradingView rejects them — drift in the
opposite direction from everything else in this suite: accepting scripts
TradingView will not compile. The gate was deferred because applying it would
have made `v4/harness_builtins.pine` unrunnable while v4 had no pipeline. v4 has
one now, and v1–v3 answer:

> 'bb' is not available in Pine Script v3. It was added in a later version.

The other March 2020 names (`bbw`, `kc`, `kcw`, `dmi`, `hma`, `supertrend`,
`cmo`, and the `iii`/`wvad`/`wad`/`obv`/`pvt`/`nvi`/`pvi` variables) are still
absent from the registry entirely — unimplemented rather than mis-gated.

`harness_state` is the fussy one. `cum(volume)` is a running total from bar 0,
`barssince` and `valuewhen` reach arbitrarily far back, and `sar` carries a
trend state that never forgets where it started. If the export begins in the
middle of the chart, TradingView's numbers include history the engine never
saw, and every difference is an artefact of the export rather than a bug — so
the warm-up allowance for this harness is **0** and the export must start at
the first bar.

Practical picks:

- **A recently-listed symbol on `1D`** — a stock that IPO'd in the last few
  years, or a newer crypto pair. Its whole history is a few hundred bars, so
  scrolling to the beginning is trivial and `harness_state` is exportable.
- **Crypto** (e.g. `BINANCE:BTCUSDT`) if you want a seven-day calendar with no
  session gaps — fewer moving parts than an equity.
- **Avoid** anything with dividend/split adjustments toggled, and avoid
  continuous futures contracts. Both can change historical values under you and
  make a re-export disagree with the last one.

If the full history is impractical, **export the other two harnesses only.**
The test runs whatever CSVs are present and ignores the rest.

## What the test checks

- Our plot value equals TradingView's, to a relative tolerance of `1e-6`.
- The **first non-`na` bar** matches — an indicator that is right but starts a
  bar early is a real parity bug that a value-only comparison never sees.
- Enough columns matched, enough bars compared, and TradingView's column is not
  constant. Those three guards are why a degraded export fails instead of
  quietly passing.

## Expected friction

**The suite is red until the first CSV lands.** That is deliberate: a skipped
suite reads as green, and "we have no parity evidence" is exactly what this repo
refuses to hide. Flip `it("is present")` to `it.skip` in
`conformance/tradingview_golden.test.ts` if you would rather defer it.

**If everything disagrees by a constant factor**, check whether the chart had
an adjustment applied (splits/dividends) that the OHLCV columns also reflect —
in that case the bars and the plots are consistent and the engine is at fault.

**If values look rounded to 2 decimals**, TradingView applied the chart's
display precision to the export. Re-export with the indicator's scale set to
more decimals, or accept the looser tolerance and say so here.

**Re-exporting the same symbol later may not reproduce byte-for-byte.**
Real-time bars settle, and historical data gets revised. Treat a CSV as a
snapshot; if you replace one, re-run the suite rather than assuming it still
passes.
