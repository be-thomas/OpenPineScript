# 4 · Strategies

A `strategy()` script plots like an indicator **and** drives a broker emulator.
Everything in [03-plotting.md](03-plotting.md) still applies; this covers what a
strategy adds. Check `result.meta?.kind === "strategy"` before showing any of it.

## What comes back

```ts
interface Trade {
  id: string;                      // the CLOSING order's id
  entryTime: number;               // UNIX ms, the bar the entry FILLED on
  entryPrice: number;
  exitTime: number;
  exitPrice: number;
  qty: number;
  pnl: number;                     // in the instrument's currency, after commission
  direction: "long" | "short";
  entryBarIndex?: number;          // index into your candles
  exitBarIndex?: number;
  entryId?: string;                // the order that OPENED it (TradingView's "signal")
  runup?: number;                  // favourable / adverse excursion, in currency, both >= 0
  drawdown?: number;
  commission?: number;             // round-turn commission, already deducted from pnl
  exitId?: string; exitComment?: string;
}

interface Position {
  size: number;                    // + long, - short, 0 flat
  avgPrice: number;
  entryBarIndex?: number;          // undefined while flat
  entryTime?: number;
  entryId?: string;
  // plus bookkeeping for pyramided entries (`entries`, `ledger`, …)
}

interface EquityPoint { time: number; equity: number; openPL: number }
```

| Field | Holds |
|---|---|
| `result.trades` | **Closed** trades only, in the order they closed |
| `result.position` | The trade still open at the last bar, if any |
| `result.equity` | One point per bar: realized cash plus open P&L, with `openPL` split out |
| `result.summary` | `{ netProfit, closedTrades, winRate }`, or `null` when nothing closed |
| `result.performance` | TradingView's performance summary, see below |

A strategy still in the market when the data ends has **no entry in `trades`**:
it is in `position`. A host that only reads `trades` silently drops the final,
usually most interesting, trade.

### `result.performance`

The rows of TradingView's performance summary tab, each figure reported three
times as `all`, `long` and `short` (`PerformanceStats`: `netProfit`,
`grossProfit`, `grossLoss`, `profitFactor`, `maxDrawdown`, `maxRunup`,
`percentProfitable`, `avgTrade`, `avgBarsInTrades`, `commissionPaid`, trade
counts, and the percentage forms). Account-level figures sit beside them:
`initialCapital`, `openPL`, `openTrades`, `maxContractsHeld`, `buyHoldReturn`,
`buyHoldReturnPercent`, `sharpeRatio`, `sortinoRatio`. Ratios with a zero
denominator read `NaN`, not `Infinity`.

## Order timing: the part that surprises people

These rules were measured against TradingView's own backtest output, not assumed.

**1 · A market order fills at the OPEN of the NEXT bar.**

```pine
if ta.crossover(fast, slow)
    strategy.entry("L", strategy.long)
```

The signal fires on bar *N*. `strategy.position_size` read on bar *N* is still
the old value; it changes on bar *N+1*, and the fill price is `open[N+1]`, not
`close[N]`. (`process_orders_on_close = true` fills at the placing bar's close.)

For a host: **draw the entry marker on the fill bar, not the signal bar.**
`trade.entryTime` / `entryBarIndex` is already the fill bar; deriving a marker
from the signal plot is not.

**2 · A limit or stop becomes live on the bar AFTER it is placed.** A bracket
registered on the entry bar is not matched against that bar's range.

**3 · An order the bar has gapped past fills at the OPEN.** A stop at 37,250 on a
bar that opens at 36,056 fills at 36,056, the price that actually traded.

**4 · Prices snap to the instrument's tick.** Fills round to `syminfo.mintick`,
and an order's *level* rounds **away** from the market, so a 5% target on
6,985.25 becomes 7,334.52 rather than 7,334.51. Set the tick through
`setChart({ mintick })` ([02](02-engine-api.md#setchartchart-chartsettings));
the default is 0.01.

## Instrument and account settings

- **Tick size, currency, point value** come from `setChart`.
- **Starting capital, order size, pyramiding, commission, slippage** come from the
  script's `strategy()` call (default capital 100,000 on v3, v4 and v6 and
  1,000,000 on v5, as on TradingView). A host can override them with `setProperties`, using the rows of
  `compiled.properties` to build the panel ([02](02-engine-api.md#setpropertiesvalues-and-compiledproperties)).
- **Currency.** `strategy(currency = currency.EUR)` on a symbol quoted in another
  currency converts each closed trade's profit and commission at the exit bar's
  rate, if the host supplied one with
  [`provideCurrencyRate`](02-engine-api.md#providecurrencyratefrom-to-samples);
  otherwise results stay in the symbol's currency and `result.warnings` says so.
  Open profit is converted at the current bar's rate and order sizing is left
  unconverted; neither is verified against TradingView.
- Commission (percent, cash per contract, cash per order) and slippage in ticks
  are applied and reported, per trade and in `performance.commissionPaid`.
- Margin: from `//@version=6`, `margin_long`/`margin_short` block entries that
  exceed the margin. v1 to v5 scripts run with no margin checks, as on
  TradingView. Margin calls (forced liquidation) are not verified against
  TradingView.

Getting `mintick` wrong does not break a backtest, but it moves `netProfit` by a
fraction of a tick per fill, which compounds across trades.

## Drawing the results

```ts
if (result.meta?.kind === "strategy") {
  for (const t of result.trades) {
    chart.marker({ time: t.entryTime, price: t.entryPrice,
                   shape: t.direction === "long" ? "arrowUp" : "arrowDown",
                   text: `${t.entryId ?? t.id} ×${t.qty}` });
    chart.marker({ time: t.exitTime, price: t.exitPrice,
                   shape: "square", color: t.pnl >= 0 ? "#26a69a" : "#ef5350",
                   text: t.pnl.toFixed(2) });
    chart.connect(t.entryTime, t.entryPrice, t.exitTime, t.exitPrice);
  }

  // The open trade has no exit yet: draw its entry.
  const p = result.position;
  if (p.size !== 0 && p.entryTime !== undefined) {
    chart.marker({ time: p.entryTime, price: p.avgPrice,
                   shape: p.size > 0 ? "arrowUp" : "arrowDown", text: "open" });
  }
}
```

Prefer `entryTime` to a bar index when placing something: a chart's bar list grows
as older bars page in, so an index names a different bar after a scroll.

## An equity curve

`result.equity` is the curve TradingView's overview tab draws, sampled every bar
so the open position's swing shows:

```ts
const curve = result.equity.map(p => ({ time: p.time, value: p.equity }));
```

A script can also `plot(strategy.equity, "Equity")`, which arrives as an
ordinary series.

## What is not modelled

- **Intrabar order of events.** The engine sees one OHLC per bar, so when both a
  target and a stop fall inside one bar it infers which came first from the open's
  distance to each, as TradingView does on the same data. Expect small
  trade-price differences where TradingView's own intrabar assumptions are
  unpublished.
- **Margin calls**, as above.
