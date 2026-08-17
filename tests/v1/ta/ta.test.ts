/**
 * Differential stress test for the TA engine.
 *
 * Every indicator is run against `NaiveTA` — an independent from-scratch
 * reimplementation — bar-for-bar over 5000 generated bars, under four
 * length regimes (fixed, growing, shrinking, and randomly oscillating
 * lookbacks). Varying the length is the point: it is where incremental
 * ring-buffer implementations diverge from the naive definition.
 *
 * The data is generated from a SEEDED PRNG. A failure here reproduces
 * exactly on the next run — with Math.random() it would not.
 */
import { describe, it, expect } from "vitest";
import { Context } from "../../../runtime/v1/context";
import * as ta from "../../../runtime/v1/stdlib/ta";
import { NaiveTA } from "./naive_ta";

const EPSILON = 1e-6;
const TOTAL_BARS = 5000;
/** Indicators need history before they agree; skip the warm-up window. */
const WARMUP = 100;

type Mode = "STABLE" | "INCREASING" | "DECREASING" | "OSCILLATING";

/** mulberry32 — small, fast, deterministic. Same seed ⇒ same bars. */
function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function lengthFor(mode: Mode, i: number, rand: () => number): number {
  switch (mode) {
    case "STABLE":      return 14;
    case "INCREASING":  return Math.min(100, 5 + Math.floor(i / 50));
    case "DECREASING":  return Math.max(2, 100 - Math.floor(i / 50));
    case "OSCILLATING": return Math.floor(rand() * 40) + 5;
  }
}

interface Divergence {
  indicator: string;
  bar: number;
  length: number;
  actual: number;
  expected: number;
  delta: number;
}

/**
 * Runs one regime and returns every divergence found. Collecting them all
 * (rather than throwing on the first) makes a failure diagnosable: a bug in
 * one indicator does not hide the others.
 */
function collectDivergences(mode: Mode, seed: number): Divergence[] {
  const ctx = new Context();
  const naive = new NaiveTA();
  const rand = seededRandom(seed);
  const found: Divergence[] = [];

  const check = (
    indicator: string, actual: number, expected: number, bar: number, length: number,
  ) => {
    if (Number.isNaN(actual) && Number.isNaN(expected)) return;
    const delta = Math.abs(actual - expected);
    if (delta > EPSILON || Number.isNaN(delta)) {
      found.push({ indicator, bar, length, actual, expected, delta });
    }
  };

  let price = 100;
  const conditionHistory: boolean[] = [];
  const sourceHistory: number[] = [];

  for (let i = 0; i < TOTAL_BARS; i++) {
    const open = price;
    const close = price + (rand() - 0.5) * 2;
    const high = Math.max(open, close) + rand();
    const low = Math.min(open, close) - rand();
    const volume = Math.abs(rand() * 1000);
    price = close;

    // Mirror what setBar() does, without the Series bookkeeping the naive
    // reference has no equivalent for.
    (ctx as any).high = high;
    (ctx as any).low = low;
    ctx.close = close;
    ctx.volume = volume;
    naive.add(close, volume, high, low);

    const isBullish = close > open;
    conditionHistory.push(isBullish);
    sourceHistory.push(close);

    const len = lengthFor(mode, i, rand);

    const actual = {
      SMA:       ctx.call("ta.sma@test", ta.sma, ctx, ctx.close, len),
      WMA:       ctx.call("ta.wma@test", ta.wma, ctx, ctx.close, len),
      BBbasis:   ctx.call("ta.bb@test", ta.bb, ctx, ctx.close, len, 2.0)[0],
      Highest:   ctx.call("ta.highest@test", ta.highest, ctx, ctx.close, len),
      Lowest:    ctx.call("ta.lowest@test", ta.lowest, ctx, ctx.close, len),
      ATR:       ctx.call("ta.atr@test", ta.atr, ctx, len),
      VWAP:      ctx.call("ta.vwap@test", ta.vwap, ctx, ctx.close),
      Linreg:    ctx.call("ta.linreg@test", ta.linreg, ctx, ctx.close, len, 0),
      SAR:       ctx.call("ta.sar@test", ta.sar, ctx, 0.02, 0.02, 0.2),
      ValueWhen: ctx.call("ta.valuewhen@test", ta.valuewhen, ctx, isBullish, ctx.close, 0),
      BarsSince: ctx.call("ta.barssince@test", ta.barssince, ctx, isBullish),
    };

    const expected = {
      SMA:       naive.sma(len),
      WMA:       naive.wma(len),
      BBbasis:   naive.bb(len, 2.0)[0],
      Highest:   naive.highest(len),
      Lowest:    naive.lowest(len),
      ATR:       naive.atr(len),
      VWAP:      naive.vwap(),
      Linreg:    naive.linreg(len, 0),
      SAR:       naive.sar(0.02, 0.02, 0.2),
      ValueWhen: naive.valuewhen(conditionHistory, sourceHistory, 0),
      BarsSince: naive.barssince(conditionHistory),
    };

    if (i > WARMUP) {
      for (const key of Object.keys(actual) as (keyof typeof actual)[]) {
        check(key, actual[key], expected[key], i, len);
      }
    }
  }

  return found;
}

function describeFailures(mode: Mode, seed: number, found: Divergence[]): string {
  const byIndicator = new Map<string, number>();
  for (const d of found) byIndicator.set(d.indicator, (byIndicator.get(d.indicator) ?? 0) + 1);
  const summary = [...byIndicator].map(([k, n]) => `${k}×${n}`).join(", ");
  const first = found
    .slice(0, 5)
    .map(d =>
      `  ${d.indicator} bar=${d.bar} len=${d.length} ` +
      `engine=${d.actual} naive=${d.expected} Δ=${d.delta.toExponential(3)}`)
    .join("\n");
  return (
    `${found.length} divergence(s) in ${mode} regime (seed=${seed}): ${summary}\n` +
    `first ${Math.min(5, found.length)}:\n${first}`
  );
}

describe("TA engine matches the naive reference under varying lookback", () => {
  // Distinct seeds so the four regimes exercise different price paths.
  const REGIMES: [Mode, number][] = [
    ["STABLE", 0x5eed_0001],
    ["INCREASING", 0x5eed_0002],
    ["DECREASING", 0x5eed_0003],
    ["OSCILLATING", 0x5eed_0004],
  ];

  for (const [mode, seed] of REGIMES) {
    it(`${mode} length: ${TOTAL_BARS} bars agree within ${EPSILON}`, () => {
      const found = collectDivergences(mode, seed);
      expect(found, found.length ? describeFailures(mode, seed, found) : "").toEqual([]);
    });
  }

  it("is deterministic — the same seed produces the same result", () => {
    expect(collectDivergences("OSCILLATING", 0xd1ce)).toEqual(
      collectDivergences("OSCILLATING", 0xd1ce),
    );
  });
});
