# 5 · Live data

Streaming updates onto the bar that is still forming, without re-running the
whole history.

## The model

A tick is an **absolute snapshot of the forming bar**, not a delta. Send the
bar's current OHLCV each time; the engine rolls back the previous tick before
re-running, so accumulating state (`cum`, an EMA's previous value, broker
orders) never double-counts.

```ts
session.runHistory(candles);          // closed bars

session.tick({ time: t, open: 100, high: 104, low: 99, close: 103, volume: 500 });
session.tick({ time: t, open: 100, high: 106, low: 99, close: 105, volume: 900 });
//                ↑ same time: still the same bar, with a new high and close

session.commit(finalCandle);          // the bar closed; it is now permanent
```

Then the next bar begins with its own `tick` calls. `tick` requires a prior
`runHistory` on the same session (it throws `"runHistory() first"` otherwise).

## What `tick()` returns

```ts
interface RenderDelta {
  barIndex: number;
  time: number;
  provisional: true;                  // always: this bar can still change
  series: Array<{
    id: string;                       // matches a RenderSeries.id
    value?: number;                   // line / marker / arrow
    ohlc?: [number, number, number, number];
    color?: string;                   // bgcolor / barcolor
  }>;
}
```

Only the **forming bar's** values, only for plots that produced something. Patch
the last point of each series rather than appending:

```ts
const delta = session.tick(candle);
for (const s of delta.series) {
  chart.series(s.id).update({ time: delta.time, value: s.value });
}
```

Because every tick is a rollback and a re-run, a value that rose on one tick can
fall on the next. That is correct, and why `provisional` is on the type.

## `commit()`

```ts
const { barIndex } = session.commit(finalCandle?);
```

Closes the forming bar, makes its state permanent, and advances the index. Call it
exactly once per bar, when your feed says the bar closed. Forgetting it means the
next `tick` keeps overwriting the same bar and the chart appears to freeze.

**The closing run (v5 and v6).** TradingView runs the script one more time as a
bar closes, with `barstate.isconfirmed` true and `barstate.isnew` false. So does
`commit()`: it re-runs the script on the bar's **final** candle, then commits.
Pass that candle as `finalCandle` (the feed's closed bar); without it the last
tick's values are used, and a bar that never ticked gets no closing run.

| | `barstate.isnew` | `barstate.isconfirmed` |
|---|:--:|:--:|
| Historical bar | true | true |
| First tick of a live bar | true | false |
| Later ticks of the same bar | false | false |
| The closing run in `commit()` | false | true |

A script that acts on `barstate.isconfirmed` therefore sees the closed bar's
final values, not the last tick's. A strategy with `calc_on_every_tick = false`
runs only in `commit()`, where `isnew` and `isconfirmed` are both true. On v1 to
v4 there is no closing run: `isnew` stays true on every tick, `isconfirmed` is
never set, and `finalCandle` is ignored (the bar commits with its last tick).

## `calc_on_every_tick`

An indicator recomputes on every tick. A **strategy** does not, unless it asked to:

| `strategy(calc_on_every_tick = …)` | `tick()` | `commit()` |
|---|---|---|
| `true` (or an indicator) | Runs the script, returns live values | Commits |
| `false` (the default for a strategy) | Rolls the bar back but does **not** run; `series` is empty | Runs once (v5/v6: the closing run above), then commits |

So a default strategy's values only move at bar close, which matches TradingView
and stops a backtest firing orders on an unconfirmed price.
`result.meta.calc_on_every_tick` tells you which mode you are in.

## Drawings, logs and trades during live

`tick()` returns series deltas only. Drawings, logs and trades produced on the
forming bar are not in the delta. To show them, re-run `runHistory` on the
closed bars when a bar commits (cheap enough for most charts), or drive the
low-level API and call `buildRenderModel(ctx)` yourself
([02](02-engine-api.md#lower-level)).

## A complete loop

```ts
const session = new Session();
session.setChart({ symbol: "AAPL", timeframe: "5" });
if (session.compile(source).errors.length) return;

render(session.runHistory(closedBars), closedBars);

let currentBarTime: number | null = null;   // the forming bar, once a tick has arrived

feed.on("tick", (c: Candle) => {
  if (currentBarTime !== null && c.time !== currentBarTime) {
    session.commit();                    // a new bar started: close the old one on its last tick
                                         // (pass the feed's final candle instead, if it sends one)
  }
  currentBarTime = c.time;
  const delta = session.tick(c);
  for (const s of delta.series) chart.series(s.id).update({ time: c.time, ...s });
});
```
