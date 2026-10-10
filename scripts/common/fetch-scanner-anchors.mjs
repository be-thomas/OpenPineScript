/**
 * Collect TradingView's OWN indicator values, and the bars they were computed
 * from, into a frozen fixture.
 *
 * ── Why this exists ─────────────────────────────────────────────────────────
 *
 * conformance/common/tradingview_golden.test.ts is the only suite that compares
 * this engine against TradingView, and it needs a human to export a chart. That
 * is a ten-minute job per harness and six of the seven harnesses have never
 * been done, so the parity evidence in this repo is one file wide.
 *
 * TradingView's screener backend answers an UNAUTHENTICATED POST with the
 * values it computed for a symbol — the same numbers its own screener shows.
 * That is real ground truth, it needs no login, and it costs one HTTP call. It
 * is narrow (one bar, a fixed list of indicators) and it does not replace a
 * chart export, but it anchors roughly forty values that were anchored to
 * nothing before, and it runs in CI.
 *
 * ── Why BINANCE:BTCUSDT ─────────────────────────────────────────────────────
 *
 * The hard part is not the indicator values, it is the BARS. Comparing is only
 * meaningful if both sides computed from identical input, and TradingView does
 * not publish its history. For this symbol it does not have to: TradingView's
 * BINANCE:BTCUSDT feed IS Binance's, and Binance serves its klines publicly.
 * The two agree to the last decimal, which `verify` below asserts rather than
 * assumes — a US equity would need a data feed this repo does not have, and the
 * comparison would be unattributable the moment the bars disagreed.
 *
 * ── Why the LAST CLOSED bar ─────────────────────────────────────────────────
 *
 * Column `X[1]` is the previous bar. The current bar is still forming, so it
 * moves between the two HTTP calls this script makes: a first draft compared
 * against `[0]` and every price-derived value was off, by exactly as much as
 * `close` had ticked. Reading `[1]` and dropping the unclosed kline makes both
 * sides name the same frozen bar.
 *
 *   node scripts/common/fetch-scanner-anchors.mjs
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const OUT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)), "../../conformance/common/scanner-anchors.json",
);

const SYMBOL = "BINANCE:BTCUSDT";
const BINANCE = "BTCUSDT";
const INTERVAL = "1d";

/**
 * How many bars to freeze.
 *
 * TradingView computes from the instrument's first bar; this fixture carries a
 * window. An exponential average still remembers its seed, so the window has to
 * be long enough that the memory is below the tolerance: at 999 bars EMA200 was
 * 7.6e-6 out, over the 1e-6 the test allows, and over the full 3341-bar history
 * it agrees to 4.3e-15. 2000 keeps the fixture reasonable and leaves two orders
 * of magnitude of headroom.
 */
const BARS = 2000;

/**
 * The screener columns to anchor.
 *
 * `Stoch.K` and `Stoch.D` are collected and NOT compared — their history index
 * does not line up with the other columns', so there is no bar at which the
 * comparison would be honest. They are collected anyway so the exclusion is a
 * visible pin rather than a silent omission; the reason is in the test.
 */
const COLUMNS = [
  "SMA5", "SMA10", "SMA20", "SMA30", "SMA50", "SMA100", "SMA200",
  "EMA5", "EMA10", "EMA20", "EMA30", "EMA50", "EMA100", "EMA200",
  "RSI", "RSI7", "MACD.macd", "MACD.signal", "CCI20", "ATR",
  "BB.upper", "BB.lower", "Mom", "AO", "W.R", "ROC", "HullMA9", "VWMA",
  "P.SAR", "Ichimoku.CLine", "Ichimoku.BLine", "DonchCh20.Upper", "BBPower",
  "Stoch.RSI.K", "Stoch.RSI.D", "ADX", "ADX+DI", "ADX-DI",
  "Stoch.K", "Stoch.D",
];

/** The OHLC of the bar the values belong to, so the test can prove alignment. */
const OHLC = ["open", "high", "low", "close"];

async function scanner(columns) {
  const res = await fetch("https://scanner.tradingview.com/crypto/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      symbols: { tickers: [SYMBOL], query: { types: [] } },
      columns: columns.map(c => `${c}[1]`),
    }),
  });
  if (!res.ok) throw new Error(`scanner: HTTP ${res.status}`);
  const body = await res.json();
  if (!body.data?.[0]) throw new Error(`scanner: no data for ${SYMBOL}`);
  return Object.fromEntries(columns.map((c, i) => [c, body.data[0].d[i]]));
}

async function klines() {
  const out = [];
  for (let start = 0; ; ) {
    const url = `https://api.binance.com/api/v3/klines?symbol=${BINANCE}` +
                `&interval=${INTERVAL}&limit=1000&startTime=${start}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`binance: HTTP ${res.status}`);
    const page = await res.json();
    if (page.length === 0) break;
    for (const k of page) out.push([k[0], +k[1], +k[2], +k[3], +k[4], +k[5]]);
    if (page.length < 1000) break;
    start = page[page.length - 1][0] + 1;
  }
  return out;
}

/**
 * The guard the whole fixture rests on: the bar TradingView reported and the
 * bar Binance served must be the same bar, to the last decimal. Without this a
 * mismatch downstream is unattributable — nobody could say whether the engine
 * or the data was wrong.
 */
function verify(values, bar) {
  const mismatched = OHLC.filter((k, i) => Math.abs(values[k] - bar[i + 1]) > 1e-9);
  if (mismatched.length > 0) {
    throw new Error(
      `the scanner's bar and Binance's bar differ on ${mismatched.join(", ")} — ` +
      `refusing to write a fixture nothing could attribute a failure to. Retry; ` +
      `this happens if a daily bar rolls over between the two requests.`,
    );
  }
}

const values = await scanner([...OHLC, ...COLUMNS]);
const all = await klines();
const closed = all.slice(0, -1);              // the last kline is still forming
const bars = closed.slice(-BARS);
verify(values, bars[bars.length - 1]);

const indicators = Object.fromEntries(COLUMNS.map(c => [c, values[c]]));
const missing = COLUMNS.filter(c => indicators[c] === null || indicators[c] === undefined);
if (missing.length > 0) throw new Error(`the scanner returned no value for: ${missing.join(", ")}`);

fs.writeFileSync(OUT, JSON.stringify({
  _comment: "Generated by scripts/common/fetch-scanner-anchors.mjs — do not edit by hand.",
  symbol: SYMBOL, interval: INTERVAL,
  capturedAt: new Date().toISOString(),
  barTime: new Date(bars[bars.length - 1][0]).toISOString(),
  bar: Object.fromEntries(OHLC.map(k => [k, values[k]])),
  indicators,
  bars,
}, null, 1) + "\n");

console.log(`${OUT}\n  ${bars.length} bars ending ${new Date(bars[bars.length - 1][0]).toISOString()}` +
            `\n  ${COLUMNS.length} anchored values, bar alignment verified`);
