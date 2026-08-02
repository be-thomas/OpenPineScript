# TradingView golden data

Numerical parity against TradingView itself. This is the only evidence in the
repo that an indicator is *numerically* right — every other suite checks the
engine against a spec, against another version of itself, or against a value
someone worked out by hand, and none of those catches an `rma` seeded one bar
early or a `linreg` off by a half-period.

**It cannot be automated.** TradingView publishes no API for indicator values,
the export needs a logged-in session, and scripting the UI would breach their
terms. A human has to do it once per harness. It takes about ten minutes.

## What you need

- A TradingView **PRO+ or Premium** plan — "Export chart data…" is gated to
  those tiers. (Essential and free plans cannot export indicator values.)
- Nothing else. No API key, no extension.

## Recipe

1. Open a chart. **Symbol and timeframe choice matters — see below.**
2. Pine editor → paste [`harness_core.pine`](harness_core.pine) → *Add to chart*.
3. If TradingView rejects `//@version=3`, change **only line 1** to
   `//@version=4`. Every built-in used is spelled the same in v4, and the test
   forces our engine to read the file as v3 regardless of the annotation.
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
8. Save the CSV into this directory as `<harness>.<symbol>.<timeframe>.csv`,
   e.g. `harness_core.BTCUSD.1D.csv`. The part **before the first dot must match
   the harness filename** — that is how the test knows which script to run.
9. Repeat for [`harness_bands.pine`](harness_bands.pine) and
   [`harness_state.pine`](harness_state.pine).
10. `npx vitest run tests/conformance/tradingview_golden.test.ts`

## Choosing a symbol and timeframe

| Harness | Needs | Why |
|---|---|---|
| `harness_core` | ≥ 400 bars, anywhere in the chart | Everything converges; the test skips a 300-bar warm-up |
| `harness_bands` | ≥ 400 bars, anywhere in the chart | Same |
| `harness_state` | **the instrument's entire history** | Nothing here converges |

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
`tests/conformance/tradingview_golden.test.ts` if you would rather defer it.

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
