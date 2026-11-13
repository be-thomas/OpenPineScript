# 1 · Getting started

## Install

```bash
npm install openpinescript
```

One runtime dependency (`antlr4ng`). Node 20 or newer; the library build is
platform-neutral and runs in a browser or a Web Worker unchanged.

## Import the compiled build

The package ships **prebuilt**: no parser generation, no postinstall step.

| Artefact | What it is | Used by |
|---|---|---|
| `dist/index.mjs` | ESM bundle, platform-neutral | `import`: bundlers, browsers, workers, modern Node |
| `dist/index.cjs` | CommonJS bundle | `require` |
| `dist/types/index.d.ts` | Type declarations | TypeScript |
| `dist/cli.mjs` | The `openpinescript` command | `npx openpinescript …` |

```ts
import { Session, runScript, compileScript } from "openpinescript";   // ESM
```

```js
const { Session } = require("openpinescript");                        // CJS
```

**Always import from the package root.** Paths inside the package are not a
public API and are not exported. Everything intended for hosts is re-exported
from [`index.ts`](../../../index.ts).

## A complete first run

```ts
import { Session } from "openpinescript";
import type { Candle, SimResult } from "openpinescript";

const candles: Candle[] = [
  { time: 1704067200000, open: 100, high: 104, low: 99,  close: 103, volume: 1200 },
  { time: 1704153600000, open: 103, high: 107, low: 102, close: 105, volume:  900 },
  // … UNIX milliseconds, ascending, one per bar
];

const session = new Session();
session.setChart({ symbol: "AAPL", timeframe: "D" });   // Pine's spelling: "5", "60", "D", "W"

const compiled = session.compile(`//@version=5
indicator("Demo", overlay = true)
length = input.int(20, "Length", minval = 1)
plot(ta.sma(close, length), "SMA", color = color.blue)
`);

if (compiled.errors.length > 0) {
  for (const e of compiled.errors) {
    console.error(`${e.phase} ${e.line}:${e.col} ${e.message}`);
  }
} else {
  // compiled.inputs describes the controls to render; see 02-engine-api.md
  session.setInputs({ [compiled.inputs[0].id]: 50 });

  const result: SimResult = session.runHistory(candles);
  console.log(result.series[0].title, result.series[0].data.length, result.warnings);
}
```

### What `compile()` does that you might not expect

It **runs the script once** on a synthetic bar. That is how `input()` calls and
the `indicator()` / `strategy()` declaration are discovered, and why
`compiled.inputs`, `compiled.properties` and `compiled.meta` are populated before
any candle exists. A script whose first bar throws fails at `compile()`, with
`phase: "runtime"` (or `"transpile"` when the script itself is at fault).

## Candle format

```ts
interface Candle {
  time: number;    // UNIX milliseconds, the bar's OPEN time
  open: number; high: number; low: number; close: number;
  volume: number;
}
```

None of this is validated for you:

- **Ascending by `time`**, no duplicates. The bar index is the array index.
- **Milliseconds, not seconds.** Seconds put every calendar function (`year`,
  `dayofweek`, `time`) in 1970.
- **`volume` is required.** Pass `0` for an instrument without one.
- The engine counts bars, not calendar time, exactly as TradingView does; a
  missing session is just a bar that is not there.

## Using the CLI instead

```bash
npx openpinescript script.pine --data candles.csv --json
```

Full flag reference: [CLI-Usage.md](../../../CLI-Usage.md).

## Running from the repository

```bash
git clone https://github.com/be-thomas/OpenPineScript.git
cd OpenPineScript
npm install          # `prepare` generates the ANTLR parsers
npm test
npm run build        # regenerate parsers + emit dist/
```
