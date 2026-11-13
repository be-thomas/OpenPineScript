# What TradingView's logs proved

This is the record of every question we asked TradingView, and what it answered. Each run was a harness script, collected by the owner on TradingView and saved beside the harness. A replay test checks the engine against every logged value on every bar, and against every closed and open trade. [`golden.md`](golden.md) explains how a run is collected; this file says what each run settled.

The rule this work followed: **no engine behaviour from memory.** A rule is either proven by a log here, or it is marked doc-only (from TradingView's documentation) or unverified. The same status is kept in the table at the top of [`runtime/v1/broker/Broker.ts`](../../runtime/v1/broker/Broker.ts).

Logs are BINANCE:BTCUSDT unless a row says otherwise. Paths are relative to `conformance/`.

## Strategies

### Pyramiding, partial closes, opposite orders: `pyr0`, `pyr3`, `pooc`
**Logs:** `v5/parity/harness_strategy_{pyr0,pyr3,pooc}.BTCUSDT.1D.csv`, v5, 1D.

**What it overturned:** the engine merged pyramided entries into one trade at the average price. It also had a separate "non-tracking" model for every version below v6.

**What TradingView does:**
- **Per-entry trades.** Each entry is its own trade, closed oldest first. pyr0 has 18 closed trades and a net profit of 3,774.195. pyr3 has 26 and −9,290.49.
- **Opposite orders.** An opposite `strategy.order` takes its quantity off the oldest entry. Only the excess opens the other way. The engine had closed everything and reversed.
- **`process_orders_on_close=true`** fills at the bar's close. The engine had ignored it. pooc: 18 closed, net profit 3,741.08.
- **`strategy.close(id)`** takes the id's quantity off the whole position, oldest first, whatever the id. In pyr3 phase d, `close("A")` with A(1), B(2), A(3) open sold 1 + 2 + 1.
- **`close(immediately=true)`** fills at the bar's close after the script runs. The position still reads open on that bar's row.

### The same three on v6: `*_v6`
**Logs:** `v6/golden/harness_strategy_{pyr0,pyr3,pooc}_v6.BTCUSDT.1D.csv`.

The output is identical to v5 on all 315 values of each log. Every rule above is the same on v6.

### Partial exits with trailing stops: `release_notes_04`
**Logs:** `v5/parity/harness_release_notes_04.BTCUSDT.1D.csv` and `v6/golden/harness_release_notes_04_v6.BTCUSDT.1D.csv`.

The script is TradingView's own `strategy.exit()` example: buy 100 on every bar, with two trailing exits of 20% each.
- **v5.** It ends with 60 held at 4,285.08, 1 open trade, 2 closed and a net profit of 30. The engine had produced 796 trades. **Exits fire once per entry.**
- **Trailing stop with offset 0.** It fills at its activation level: 4,285.58 and 4,286.08, the entry price plus 50 and 100 ticks. A nonzero offset follows the bar intrabar (from `harness_v6_strategy`).
- **v6 at 100K capital** (the owner's Properties setting): no trades on any of the 3,368 bars. v6's default margin is 100%, so 100 × 4,285 ≈ 428K can't be opened with 100K. The v6 migration guide documents this as "Default margin percentage".
- **v6 at 1M capital** (List of Trades screenshot): the same trades as v5.

### v4 List of Trades: `v4_long`
**Evidence:** the owner's screenshot. The test is `common/strategy_v4_trades_golden.test.ts`.

All 9 trades are reproduced to the cent. Trade 9 confirms the opposite-order rule: P qty 2 against a short of 1 leaves a long of 1.

### Which versions share the broker
- **Sources:** the to-pine-version-3, 4 and 5 migration guides.
  - Versions 3 and 4 list no strategy changes.
  - Version 5 lists only compile-time checks:
    - a `strategy.exit` must set an exit level;
    - `strategy.long` is no longer accepted as `when`;
    - `long` is renamed `direction`.
- **The rule:** one broker serves v1–v5.
- **v6** overrides only what its guide documents: margin, exit parameter pairs, trimming past 9,000 orders, and the removal of `when`.
- **Commission timing:** entry commission charged at the fill is shown only by a v6 log, but the guides document no difference, so it applies to all versions.

### Exits against several entries: `exit_mix`
**Log:** `v5/parity/harness_strategy_exit_mix.BTCUSDT.1D.csv`, v5, 1D.
- **Two ledgers.**
  - Each entry id owns a quantity, apart from the list of trades.
  - `exit(from_entry="B", qty=1)` takes 1 off B's quantity, but the fill closes the **oldest trade**: in phase a, the oldest trade was A's.
  - A later `close("A")` sells A's full quantity, oldest first, which in phase a was A:1, then B:1.
- **Relative levels come from the named entry's price, not the average.** In phase a, profit = 1 tick from B gives 4,120.99. In phase e, C's target of 7,303.02 is never reached.
- **An exit with no `from_entry`** applies to each entry. In phase d, `xb` with qty 1 sold 1 of A and 1 of B.
- **Phase f:** the short Q triggered first, reversed the 3 longs and cancelled P through the OCA group. So the log does not show whether a pending entry blocked by pyramiding stays pending.

### Re-entry, per-trade targets, two exits in one bar: `reentry`
**Logs:** `v5/parity/harness_strategy_reentry.BTCUSDT.{1D,5}.csv`. The first run was on 5m by mistake, and still answered two of the three questions.
- **Re-arm.** When an id re-enters, its exit fires again. In phase a, `xa` fills a second time and closes the oldest A.
- **Per-trade targets.** Each trade's target is measured from its own fill price.
  - In phase b, L was filled at 4,691.66 and 4,258.81 with a $100 target.
  - The second fill's target, 4,358.81, was hit first and closed the oldest trade.
- **Path order.** A bar's exits fill in the order the price path reaches them, each taking the oldest trade, whatever `from_entry` names.
  - When the open is nearer the high, the limit fills first (phases c1 and c2).
  - When the open is nearer the low, the stop fills first (phases c3 and c4).
  - This was answered on the 1D run; on 5m, ±2% was never reached.

### An exit called before its entry exists: `exit_order`
**Log:** `v5/parity/harness_strategy_exit_order.AAPL.5.csv`, BATS:AAPL 5m. It was run on that chart by mistake, but phase d is still decisive.
- **d1:** `strategy.exit` is called once, **before** `strategy.entry` on the same bar. It never fires, even though its target trades on four bars after the fill.
- **d2:** the same, **after** `strategy.entry`. It fires on the entry's fill bar.
- **Rule:** an exit whose `from_entry` has no open trade and no pending entry at the moment of the call has no effect for that call. reentry phase a, on both of its runs, showed the same thing first.

## request.security

### Own timeframe, lower timeframe, calc_bars_count: `security_tf`
**Log:** `v5/parity/harness_security_tf.BTCUSDT.5.csv`, 5m.
- **Lower timeframe:** the empty and own-timeframe requests, the SMAs through security, and the `security_lower_tf` arrays all match.
- **HTF close timing.** A higher-timeframe bar **closes with the chart bar that ends it**: the hourly value steps on the hour's last 5-minute bar (bars 4475, 4487, …). The engine had stepped one bar later on v1–v5. No log showed the late timing, so it is now the rule for every version.

### calc_bars_count: `security_cbc`
**Log:** `v5/parity/harness_security_cbc.BTCUSDT.5.csv`, probing with `bar_index` and `ta.cum(1)` inside the request.
- **No effect.** `calc_bars_count` (50 on "60", 200 on `security_lower_tf` "1") changes nothing on any of the 276 logged rows. The hourly context had 6,983 hours of history before the chart's first bar.
- **Data supply:** a lower-timeframe context starts at the chart's first bar.

### Sessions: `security_session`
**Log:** `v5/parity/harness_security_session.AAPL.5.csv`, BATS:AAPL 5m, regular session. The first attempt ran on BTCUSDT 1D and could not answer the question.
- **Session-anchored buckets.** A stock's hourly bars start at the session open (09:30, 10:30, … 15:30), not on the clock.
- **Close at the session end.** The day's last hourly bar and the daily bar step **on the session's last bar** (15:55), and Friday's close lands on Friday.
- **Official close.** TradingView's daily close is the exchange's official close (343.99 against a last 5-minute close of 344.12). Some hourly closes differ the same way.
- **Engine:** derived bars are anchored at the session open, which the gap between sessions reveals, and close with their last chart bar. Crypto has no gaps and stays on the clock.

## Errors and visuals

### Parse and runtime errors: `parse_errors/pe1`–`pe6b`
**Evidence:** the screenshots beside each script.
- **pe1, pe2, pe3, pe5.** The engine's first error lands on TradingView's line (3, 3, 1 and 4), with TradingView's wording kept in `detail`.
- **pe4.** `//@version=5//@version=5` is **rejected**: "…is not supported. Supported versions are <= 6".
- **pe6 / pe6b: dead code.** An out-of-bounds `array.get` assigned to a local nothing reads does **not** error (pe6). Used, it errors (pe6b): "Error on bar 10: In 'array.get()' function. Index 5 is out of bounds, array size is 3." So TradingView doesn't evaluate unused values. The engine does, which is an open gap.

### `fill(show_last=5)`
**Evidence:** `v5/parity/harness_fill_show_last.png`. The band covers the last 5 bars, and the live bar counts as one of them.

## Run notes
- **Check the log's first line** before replaying it: `tickerid` and `timeframe` show where it ran. Three runs landed on a chart other than the intended one (reentry on 5m, security_session on BTCUSDT 1D, exit_order on AAPL 5m). The bars are in each log, so a wrong-chart log still replays. It may just not answer its question.
- **Properties override the script.** Initial capital set in Properties overrides `strategy()`. The 100K run is why v6 showed no trades.
- **Message length.** Pine strings stop at 4,096 characters. Harnesses batch rows under 3,900, and per-bar arrays are logged as `count:` plus the first and last elements.

## Still unverified
- Whether a pending entry blocked by pyramiding stays pending. The engine keeps it pending.
- An explicit `qty` on an exit spread across several trades of one id. The engine treats it as one order per id.
- What counts toward the 9,000-order halt. The engine counts filled orders, which is doc-only.
- v6 margin calls on shorts (doc-only).
- `strategy.exit` parameter pairs on v6 (doc-only).
- The live last bar of a stock session. The engine steps the hour at the next bar, because it has no exchange calendar.
- Skipping unused values (pe6): designed, not implemented.
