# 6 · Recipes and pitfalls

## Run it in a Web Worker

**Do this.** Pine has loops, the engine enforces no timeout, and a user's script
can hang the thread it runs on. On the main thread that is a frozen tab; in a
worker it is a worker you terminate.

```ts
// engine.worker.ts
import { Session } from "openpinescript";

let session: Session | null = null;

self.onmessage = (e: MessageEvent) => {
  const { id, cmd, args } = e.data;
  try {
    switch (cmd) {
      case "compile":
        session = new Session();
        if (args.chart) session.setChart(args.chart);
        self.postMessage({ id, ok: session.compile(args.source, { libraries: args.libraries }) });
        break;
      case "setInputs":
        session!.setInputs(args.values);
        self.postMessage({ id, ok: true });
        break;
      case "setProperties":
        session!.setProperties(args.values);
        self.postMessage({ id, ok: true });
        break;
      case "provideData":
        session!.provideData(args.symbol, args.resolution, args.candles);
        self.postMessage({ id, ok: true });
        break;
      case "provideCurrencyRate":
        session!.provideCurrencyRate(args.from, args.to, args.samples);
        self.postMessage({ id, ok: true });
        break;
      case "run":
        self.postMessage({ id, ok: session!.runHistory(args.candles) });
        break;
      case "tick":
        self.postMessage({ id, ok: session!.tick(args.candle) });
        break;
      case "commit":
        self.postMessage({ id, ok: session!.commit(args?.finalCandle) });
        break;
    }
  } catch (err: any) {
    self.postMessage({ id, err: String(err?.message ?? err) });
  }
};
```

```ts
// host.ts, with the watchdog that is the whole point
function call(cmd: string, args: any, timeoutMs = 10_000) {
  return new Promise((resolve, reject) => {
    const id = crypto.randomUUID();
    const timer = setTimeout(() => {
      worker.terminate();
      worker = spawn();                    // the old one is unrecoverable
      reject(new Error("Script timed out: it is probably looping forever."));
    }, timeoutMs);

    const onMessage = (e: MessageEvent) => {
      if (e.data.id !== id) return;
      clearTimeout(timer);
      worker.removeEventListener("message", onMessage);
      e.data.err ? reject(new Error(e.data.err)) : resolve(e.data.ok);
    };
    worker.addEventListener("message", onMessage);
    worker.postMessage({ id, cmd, args });
  });
}
```

Everything crossing the boundary is plain JSON: `SimResult`, `Compiled` and
`RenderDelta` are structured-clone safe, with no classes, functions or cycles.
A terminated worker loses its `Session`, so after a timeout replay `setChart`,
`compile`, inputs and data into the new one.

## Node.js

The CJS and ESM builds both work. For a server handling untrusted scripts, run
them in a `worker_thread` with a watchdog, because a hung script otherwise takes
the process with it.

## Bundler notes

The published `dist/` is already bundled and needs no special configuration.

If you build the engine **from source** (a monorepo, a vendored copy), keep class
names intact. The emitters dispatch on `node.constructor.name`, and every
version's generated parser declares its own `Kw_argContext`, so a bundler that
renames them silently breaks v2 to v6: keyword arguments are read as variables and
`indicator("s", overlay = true)` is rejected as *"Undeclared identifier 'overlay'"*.

| Tool | Setting |
|---|---|
| esbuild | `keepNames: true` |
| webpack + Terser | `terserOptions.keep_classnames: true` |
| Rollup + Terser | `terser({ keep_classnames: true })` |
| Vite | `build.minify: "esbuild"` keeps names by default; with Terser, set the flag above |

[`conformance/common/bundle.test.ts`](../../../conformance/common/bundle.test.ts) is
the regression test for exactly that.

## Pitfalls, ranked by how much time they cost

**1 · Treating `null` in `series.data` as zero.** It means `na`. An `sma(20)` is
`null` for 19 bars; plotting 0 draws a cliff. ([03](03-plotting.md))

**2 · Never calling `setChart`.** The script runs at timeframe `D` on a symbol
called `SYMBOL`, and anything reading `timeframe.*`, `syminfo.*` or a session
quietly computes the wrong thing. `result.warnings` says so.
([02](02-engine-api.md#setchartchart-chartsettings))

**3 · A charting library's timeframe string.** `"5m"` and `"1H"` are rejected;
Pine says `"5"` and `"60"`.

**4 · Drawing a strategy entry on the signal bar.** A market order fills at the
*next* bar's open. Use `trade.entryTime`. ([04](04-strategies.md#order-timing-the-part-that-surprises-people))

**5 · Ignoring `result.position`.** An open trade is not in `trades`, so the last
trade vanishes. ([04](04-strategies.md))

**6 · Ignoring `series.pane`.** An RSI on the price pane flattens the chart into a
line at 50.

**7 · Timestamps in seconds.** The engine wants **milliseconds**. Seconds put every
date in 1970.

**8 · Discarding a partial run.** When `errors` has a `runtime` entry, the series up
to `barsProcessed` are still good. Render them and show the error.

**9 · Forgetting `commit()`.** Live updates keep rewriting one bar and the chart
looks frozen. ([05](05-live-data.md))

**10 · Ignoring `warnings` and `droppedArguments`.** They are the engine telling you
what the host or the script left unsaid; surface them.

**11 · Expecting `alerts` to be populated.** It is reserved and always `[]`.

## Checking your integration against TradingView

Run the same script on both and compare. The engine ships harness scripts that
print one CSV row per bar through Pine Logs, which is free on any TradingView
plan; see [conformance/common/golden.md](../../../conformance/common/golden.md). It is
the mechanism the project uses for its own parity suite, and works just as well for
pinning down a disagreement in your host.

## Where to look when something is wrong

| Symptom | Likely cause |
|---|---|
| Everything is `null` | The script plots nothing, or every bar raised: check `errors` and `barsProcessed` |
| Values off by one bar | A strategy marker on the signal bar instead of the fill bar |
| A line starts at 0 then jumps | `null` rendered as zero |
| Indicator flattens the price chart | `pane` ignored |
| `"Undeclared identifier"` on valid code | Class names mangled by a bundler, see above |
| Dates in 1970 | Seconds instead of milliseconds |
| `timeframe.period` is `"D"` on an intraday chart | `setChart` never called |
| Fewer drawings than expected | The per-kind cap (50 by default), which TradingView also applies |
| A `request.security` plot is empty | No `provideData` for that symbol and timeframe: see `warnings` |
