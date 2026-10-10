/**
 * Numerical parity against TradingView's OWN indicator values.
 *
 * ── What this is, and what it is not ────────────────────────────────────────
 *
 * tradingview_golden.test.ts next door is the fuller evidence: a chart export
 * carries a whole series, over whichever indicators the harness plots. It also
 * needs a human with a TradingView session, which is why six of its seven
 * harnesses have never been collected and the parity evidence in this repo is
 * one file wide.
 *
 * This suite is the half that automates. TradingView's screener backend answers
 * an UNAUTHENTICATED request with the values IT computed, and those are ground
 * truth in exactly the sense that matters: they come from TradingView, not from
 * a spec, not from another version of this engine, and not from a number
 * someone worked out by hand.
 *
 * It is narrow. ONE bar, not a series, and a fixed list of indicators chosen by
 * the screener rather than by this repo. A function can agree here on the bar
 * that was captured and still be wrong on the bar before it. So this does not
 * replace the chart exports — it anchors 36 values that were anchored to
 * nothing, and unlike the exports it runs on every commit.
 *
 * ── Why the comparison is attributable ──────────────────────────────────────
 *
 * Agreement means nothing unless both sides computed from the same bars, and
 * TradingView does not publish its history. The fixture gets around that by
 * choosing a symbol where it does not have to: TradingView's BINANCE:BTCUSDT
 * feed is Binance's, Binance serves its klines publicly, and the collector
 * refuses to write a fixture unless the bar TradingView reported matches the
 * bar Binance served to the last decimal. The first case below re-checks that
 * on the frozen data, so a hand-edited fixture fails loudly rather than
 * quietly comparing two different instruments.
 *
 * Regenerate with:  node scripts/common/fetch-scanner-anchors.mjs
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { compileScript } from "../../transpiler/common";
import { compile } from "../../runtime/v1";
import { Context } from "../../runtime/v1/context";

const FIXTURE = path.join(__dirname, "scanner-anchors.json");

type Anchors = {
  symbol: string; interval: string; barTime: string;
  bar: Record<string, number>;
  indicators: Record<string, number>;
  bars: number[][];
};

const anchors: Anchors = JSON.parse(fs.readFileSync(FIXTURE, "utf8"));

/**
 * Each screener column, and the Pine expression it should equal.
 *
 * The lengths are the screener's defaults. Where a column's source is not its
 * name — `CCI20` is computed on the typical price, not on `close`, which is the
 * classic definition and was a 16% disagreement until it was corrected — the
 * expression says so.
 */
const COLUMNS: Record<string, string> = {
  SMA5: "ta.sma(close, 5)",
  SMA10: "ta.sma(close, 10)",
  SMA20: "ta.sma(close, 20)",
  SMA30: "ta.sma(close, 30)",
  SMA50: "ta.sma(close, 50)",
  SMA100: "ta.sma(close, 100)",
  SMA200: "ta.sma(close, 200)",
  EMA5: "ta.ema(close, 5)",
  EMA10: "ta.ema(close, 10)",
  EMA20: "ta.ema(close, 20)",
  EMA30: "ta.ema(close, 30)",
  EMA50: "ta.ema(close, 50)",
  EMA100: "ta.ema(close, 100)",
  EMA200: "ta.ema(close, 200)",
  RSI: "ta.rsi(close, 14)",
  RSI7: "ta.rsi(close, 7)",
  "MACD.macd": "ta.ema(close, 12) - ta.ema(close, 26)",
  "MACD.signal": "ta.ema(ta.ema(close, 12) - ta.ema(close, 26), 9)",
  CCI20: "ta.cci(hlc3, 20)",
  ATR: "ta.atr(14)",
  "BB.upper": "ta.sma(close, 20) + 2 * ta.stdev(close, 20)",
  "BB.lower": "ta.sma(close, 20) - 2 * ta.stdev(close, 20)",
  Mom: "ta.mom(close, 10)",
  AO: "ta.sma(hl2, 5) - ta.sma(hl2, 34)",
  "W.R": "ta.wpr(14)",
  ROC: "ta.roc(close, 9)",
  HullMA9: "ta.hma(close, 9)",
  VWMA: "ta.vwma(close, 20)",
  "P.SAR": "ta.sar(0.02, 0.02, 0.2)",
  "Ichimoku.CLine": "(ta.highest(high, 9) + ta.lowest(low, 9)) / 2",
  "Ichimoku.BLine": "(ta.highest(high, 26) + ta.lowest(low, 26)) / 2",
  "DonchCh20.Upper": "ta.highest(high, 20)",
  BBPower: "high + low - 2 * ta.ema(close, 13)",
  "Stoch.RSI.K": "ta.sma(ta.stoch(ta.rsi(close,14), ta.rsi(close,14), ta.rsi(close,14), 14), 3)",
  "Stoch.RSI.D": "ta.sma(ta.sma(ta.stoch(ta.rsi(close,14), ta.rsi(close,14), ta.rsi(close,14), 14), 3), 3)",
};

/** `ta.dmi` returns a tuple, so its three columns are read positionally. */
const DMI: Record<string, number> = { "ADX+DI": 0, "ADX-DI": 1, ADX: 2 };

/**
 * `Stoch.K` and `Stoch.D` are collected by the fetch script and NOT compared.
 *
 * Not because they disagree — because their history index does not line up with
 * every other column's, so there is no bar at which the comparison is honest.
 * Read at `[1]`, like everything else here, they are 4–6% out. Read at `[2]`
 * they are EXACT: TradingView's `Stoch.K[2]` is 33.190603 and this engine's
 * value one bar earlier is 33.190603, and the same holds for the
 * double-smoothed `Stoch.D[2]` at 51.690044. Two independent exact matches say
 * the formula — K = sma(raw, 3), D = sma(K, 3) — is right and the column's
 * indexing is the anomaly.
 *
 * Comparing them at `[2]` while everything else is at `[1]` would be fitting
 * the test to the answer, so they are left out and the reason written down.
 * `ta.stoch` is covered by its own suite and by `Stoch.RSI.*` above, which is
 * the same function over a different source and IS aligned.
 */
const NOT_COMPARED = ["Stoch.K", "Stoch.D"];

/**
 * Relative tolerance.
 *
 * Nearly everything agrees to 1e-14, which is floating-point noise. Two do not,
 * and neither is a formula difference:
 *
 *   VWMA   5.2e-9, unchanged whether the window is 999 bars or the full 3341.
 *          A 20-bar weighted mean cannot depend on history depth, so this is
 *          the VOLUME the two sides divide by, not the arithmetic.
 *   EMA200 4.3e-15 here, but 7.6e-6 over a 999-bar window — the seed this
 *          fixture's window cannot see. The same convergence allowance
 *          tradingview_golden.test.ts documents, handled there by skipping a
 *          warm-up and here by freezing enough bars.
 *
 * 1e-6 clears both with room and is far tighter than any real defect. The
 * failures this suite exists for — a seed one bar early, a wrong smoothing
 * constant, a population/sample mix-up — are 1e-2 and larger.
 */
const REL_TOL = 1e-6;

/** Every column in one script, so the 2000-bar run happens once. */
function run(): Record<string, number> {
  const names = Object.keys(COLUMNS);
  const src =
    `//@version=5\nindicator("anchors")\n` +
    `[pdi, mdi, adx] = ta.dmi(14, 14)\n` +
    names.map((n, i) => `plot(${COLUMNS[n]}, "c${i}")`).join("\n") +
    `\nplot(pdi, "d0")\nplot(mdi, "d1")\nplot(adx, "d2")\n`;

  const { js, profile } = compileScript(src);
  const ctx = new Context(profile);
  const exec = compile(js, ctx, { ctx } as any);
  ctx.provideDatasetExtent(anchors.bars.length, anchors.bars[anchors.bars.length - 1][0]);
  for (const [t, o, h, l, c, v] of anchors.bars) {
    ctx.is_new = true;
    ctx.setBar(t, o, h, l, c, v);
    exec();
    ctx.finalizeBar();
  }

  const series = [...(ctx as any).plots.values()];
  const last = (k: number) => {
    const point = series[k]?.[anchors.bars.length - 1];
    const value = point?.value ?? point;
    return typeof value === "number" ? value : NaN;
  };
  const out: Record<string, number> = {};
  names.forEach((n, i) => { out[n] = last(i); });
  for (const [n, k] of Object.entries(DMI)) out[n] = last(names.length + k);
  return out;
}

const COMPUTED = run();

describe("the fixture describes one bar, and both sides agree which", () => {
  it("has bars to compute from (guards every case below)", () => {
    expect(anchors.bars.length).toBeGreaterThan(1500);
  });

  it("TradingView's bar IS the bar the engine was fed", () => {
    // The guard the whole suite rests on. If these ever differ, a mismatch
    // below is unattributable — nobody could say whether the engine or the data
    // was wrong — so it is checked here rather than trusted from the collector.
    const [, o, h, l, c] = anchors.bars[anchors.bars.length - 1];
    expect(o).toBeCloseTo(anchors.bar.open, 9);
    expect(h).toBeCloseTo(anchors.bar.high, 9);
    expect(l).toBeCloseTo(anchors.bar.low, 9);
    expect(c).toBeCloseTo(anchors.bar.close, 9);
  });

  it("every anchored column has a value and is mapped, or is named as excluded", () => {
    // A column the fetch script collects and nothing compares would be silent
    // dead weight; a mapping with no anchor would assert nothing.
    const collected = Object.keys(anchors.indicators);
    const compared = [...Object.keys(COLUMNS), ...Object.keys(DMI)];
    expect([...compared].sort()).toEqual(
      collected.filter(c => !NOT_COMPARED.includes(c)).sort(),
    );
  });
});

describe(`matches TradingView on ${anchors.symbol} ${anchors.interval}`, () => {
  for (const name of [...Object.keys(COLUMNS), ...Object.keys(DMI)]) {
    it(name, () => {
      const expected = anchors.indicators[name];
      const actual = COMPUTED[name];

      expect(Number.isFinite(actual), `${name} computed ${actual}`).toBe(true);
      const rel = Math.abs(actual - expected) / Math.max(Math.abs(expected), 1e-12);
      expect(
        rel,
        `${name}: TradingView ${expected}, engine ${actual} (relative ${rel.toExponential(2)})`,
      ).toBeLessThan(REL_TOL);
    });
  }
});

describe("what is deliberately not compared", () => {
  for (const name of NOT_COMPARED) {
    it(`${name} is collected but excluded, and the reason is recorded`, () => {
      // A pin that names nothing is not a pin: if the column stops being
      // collected, this fails and the comment above has to be revisited.
      expect(anchors.indicators).toHaveProperty(name);
      expect(COLUMNS).not.toHaveProperty(name);
    });
  }
});
