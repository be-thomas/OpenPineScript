# Integrating OpenPineScript with a charting UI

How to embed the engine in a product: compile a user's Pine script, run it over
candles, and turn the result into lines, markers, fills, drawings and a
strategy's trades on a chart.

Every type below is the real exported type and every claim about ordering or
timing is one the engine guarantees (the host-facing ones are pinned by
[`tests/v5/runtime/host_contract.test.ts`](../../../tests/v5/runtime/host_contract.test.ts)).
To see the shape working before you build it, [Zeal Terminal](https://zealterminal.com)
is this engine behind a chart, in open beta.

## Read in this order

| # | Doc | What it answers |
|---|-----|-----------------|
| 1 | [01-getting-started.md](01-getting-started.md) | Install, import, first run, candle format |
| 2 | [02-engine-api.md](02-engine-api.md) | `Session`: every method, every type, call order, errors, telling the engine its chart |
| 3 | [03-plotting.md](03-plotting.md) | The render model as chart primitives: series, panes, fills, drawings, logs |
| 4 | [04-strategies.md](04-strategies.md) | Trades, open position, equity, performance, order timing |
| 5 | [05-live-data.md](05-live-data.md) | Streaming ticks onto the forming bar, and committing it |
| 6 | [06-recipes.md](06-recipes.md) | Web Worker wrapper, bundler notes, the mistakes that cost the most time |

## The mental model in sixty seconds

The engine is **not** a chart. It takes candles in and gives data out; you own
every pixel.

```
 Pine source ──► Session.setChart(chart)        the timeframe and symbol facts
             ──► Session.compile(source)  ──►   inputs + properties + meta + errors
 candles     ──► Session.runHistory(candles) ─► SimResult: series, fills, drawings,
                                                logs, trades, position, equity, warnings
 live tick   ──► Session.tick(candle)  ──────►  RenderDelta (the forming bar)
             ──► Session.commit(finalCandle?)   the bar closed
```

Four things to internalise before you write code:

1. **One array per plot, index-aligned with your candles.** `series.data[i]`
   belongs to `candles[i]`. `null` means `na`: draw nothing, never a zero.
2. **Drawings are not series.** A `line` or `label` has coordinates and a
   lifetime; they come back in `result.drawings`.
3. **The script decides the pane.** `series.pane` is `"main"` or `"sub"`.
4. **Errors are returned, not thrown.** A script that fails on bar 900 gives you
   the first 900 bars **and** an error. Render what you got.

And one thing a host must do that scripts silently depend on: **tell the engine
its chart** with `setChart` ([02](02-engine-api.md#setchartchart-chartsettings)).
A timeframe cannot be derived from bars, and `timeframe.period`, `syminfo.*` and
session windows all read it.

## The shortest thing that works

```ts
import { runScript } from "open-pinescript";

const result = runScript(
  `//@version=5
   indicator("My SMA", overlay = true)
   plot(ta.sma(close, 20), "SMA 20", color = color.blue)`,
  { candles, chart: { symbol: "AAPL", timeframe: "D" } },
);

for (const series of result.series) {
  chart.addLineSeries({ title: series.title, color: typeof series.color === "string" ? series.color : undefined })
       .setData(candles.map((c, i) => {
         const point = series.data[i];   // longer than candles only with a positive offset
         return { time: c.time, value: point && "value" in point ? point.value : undefined };
       }));
}
```

## What the engine does not do

- **No chart, no DOM, no rendering.** Bring your own charting library.
- **No data feed.** You supply candles, and higher-timeframe or other-symbol
  candles for `request.security` ([02](02-engine-api.md#providedatasymbol-resolution-candles)).
- **No network.** A `library()` import is resolved from source you pass in
  ([LIBRARIES.md](../LIBRARIES.md)).
- **No timeout.** A script with an infinite loop hangs the thread it runs on,
  which is the main argument for a Web Worker ([06](06-recipes.md#run-it-in-a-web-worker)).
