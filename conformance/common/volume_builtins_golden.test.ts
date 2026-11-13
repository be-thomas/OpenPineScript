/**
 * The volume family — accdist, iii, nvi, obv, pvi, pvt, wad, wvad — against
 * TradingView, at v4 (bare names), v5 and v6 (`ta.*`).
 *
 * Evidence: dev-docs/tv-parity/_probes/volume-builtins (run 2026-11-13,
 * BINANCE:BTCUSDT 1D, bar 0 = 2017-08-17). The probes plot all eight at each
 * version and log them at v5/v6; the last 300 plotted bars are saved as
 * volume_builtins.v{4,5,6}.expected.csv, minus the last one, which was still
 * forming. The candles are Binance's own daily klines for the whole history
 * (volume_builtins.BTCUSDT.1D.csv), because the cumulative series need it.
 *
 * Binance's public klines differ a little from the feed TradingView held in
 * the early years, so a cumulative series is off by a CONSTANT from some bar
 * before the captured window (accdist -3818.53, obv +8983.17, pvt +261.21,
 * wad -49.93; nvi and pvi by a constant FACTOR, 1.00701 and 0.99304). The
 * window therefore compares each such series as the change since its first
 * bar (nvi and pvi as the ratio to it) -- which a wrong formula cannot
 * satisfy -- while iii and wvad, which are not cumulative, are compared
 * outright. Bars 0-5 do match outright, against TradingView's Pine Logs.
 *
 * v1-v3 (probed 2026-11-13, runs run-20261113-v1v3 and
 * run-20261113-accdist-v1v3): `accdist` exists there and its values are
 * identical to v4's (max abs diff 0.0 over the 299 shared bars), so it is
 * checked below against the v4 CSV. The other seven are undeclared identifiers
 * at v1-v3 on TradingView and are rejected here (poison_pill.test.ts).
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Session } from "../../index";

const DIR = join(__dirname, "..", "v5", "parity");
const NAMES = ["accdist", "iii", "nvi", "obv", "pvi", "pvt", "wad", "wvad"] as const;
type Name = typeof NAMES[number];

const table = (file: string): number[][] =>
  readFileSync(join(DIR, file), "utf8").trim().split("\n").slice(1).map(l => l.split(",").map(Number));
const candles = table("volume_builtins.BTCUSDT.1D.csv").map(r => ({
  time: r[0], open: r[1], high: r[2], low: r[3], close: r[4], volume: r[5],
}));

function script(version: number, body: (n: Name) => string = n => n): string {
  const ref = (n: Name) => (version === 4 ? n : `ta.${n}`);
  const head = version === 4 ? 'study("t")' : 'indicator("t")';
  return `//@version=${version}\n${head}\n` + NAMES.map(n => `plot(${body(ref(n) as Name)}, "${n}")`).join("\n") + "\n";
}

/** Runs `src` over `bars` and returns each plot's values by title, na as NaN. */
function run(src: string, bars: typeof candles = candles): Record<string, number[]> {
  const s = new Session();
  s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "D", mintick: 0.01, timezone: "UTC", type: "crypto" });
  const compiled = s.compile(src);
  expect(compiled.errors).toEqual([]);
  const result: any = s.runHistory(bars);
  expect(result.errors).toEqual([]);
  return Object.fromEntries(result.series.map((p: any) => [p.title, p.data.map((d: any) => d?.value ?? NaN)]));
}

const rel = (a: number, b: number) => Math.abs(a - b) / Math.max(1, Math.abs(b));

// TradingView's Pine Logs (v5 and v6 identical), 3-decimal display.
const LOGS: Record<Name, number[]> = {
  accdist: [-323.954, -583.341, -303.907, -490.049, -488.085, 300.794],
  iii: [-323.954, -259.387, 279.434, -186.142, 1.964, 788.879],
  nvi: [1, 1, 1.008, 1.008, 1.008, 1.008],
  obv: [NaN, -1199.888, -818.579, -1285.662, -1977.405, -1010.72],
  pvi: [1, 0.959, 0.959, 0.946, 0.93, 0.936],
  pvt: [NaN, -49.482, -46.548, -52.605, -64.504, -58.727],
  wad: [0, -263.15, 26.83, -97.96, -201.58, 438.42],
  wvad: [65.925, -489.965, 36.013, -90.794, -176.838, 32.917],
};

describe.each([4, 5, 6])("volume built-ins at v%i against TradingView", (version) => {
  const out = run(script(version));
  const tv = table(`volume_builtins.v${version}.expected.csv`);
  const first = candles.findIndex(c => c.time === tv[0][0]);

  it("the window starts where the capture says it does (bar_index 3076 on 2026-01-18 at v4)", () => {
    expect(first).toBe(3076);
    expect(tv.length).toBe(299);
  });

  it.each(NAMES.map((n, i) => [n, i + 1] as const))("%s over bars 0-5 matches the Pine Logs", (name, _col) => {
    LOGS[name].forEach((want, bar) => {
      const got = out[name][bar];
      if (Number.isNaN(want)) expect(got, `${name} bar ${bar}`).toBeNaN();
      else expect(Math.abs(got - want), `${name} bar ${bar}`).toBeLessThanOrEqual(0.0005 + 1e-9);
    });
  });

  it.each(["iii", "wvad"] as const)("%s (not cumulative) matches on all 299 captured bars", (name) => {
    const col = NAMES.indexOf(name) + 1;
    const bad = tv.filter((r, i) => rel(out[name][first + i], r[col]) > 1e-9).length;
    expect(bad).toBe(0);
  });

  it.each(["accdist", "obv", "pvt", "wad"] as const)("%s changes as TradingView's does over the window", (name) => {
    const col = NAMES.indexOf(name) + 1;
    const bad = tv.filter((r, i) =>
      rel(out[name][first + i] - out[name][first], r[col] - tv[0][col]) > 1e-9).length;
    expect(bad).toBe(0);
  });

  it.each(["nvi", "pvi"] as const)("%s scales as TradingView's does over the window", (name) => {
    const col = NAMES.indexOf(name) + 1;
    const bad = tv.filter((r, i) =>
      rel(out[name][first + i] / out[name][first], r[col] / tv[0][col]) > 1e-9).length;
    expect(bad).toBe(0);
  });
});

describe("a read inside an `if` still sees every bar", () => {
  // TradingView evaluates these variables on every bar; so must a getter.
  it.each([4, 5, 6])("v%i obv, accdist and nvi read only on odd bars equal the unconditional series", (version) => {
    const ref = (n: string) => (version === 4 ? n : `ta.${n}`);
    const head = version === 4 ? 'study("t")' : 'indicator("t")';
    const src = `//@version=${version}\n${head}\n` + ["obv", "accdist", "nvi"].map(n =>
      `${n}_x = 0.0\nif bar_index % 2 == 1\n    ${n}_x := ${ref(n)}\nplot(${n}_x, "${n}_c")\nplot(${ref(n)}, "${n}_u")`).join("\n") + "\n";
    const out = run(src, candles.slice(0, 200));
    for (const n of ["obv", "accdist", "nvi"]) {
      for (let i = 1; i < 200; i += 2) expect(out[`${n}_c`][i]).toBe(out[`${n}_u`][i]);
    }
  });
});

describe("edge bars", () => {
  // Hand-worked from the definitions the TradingView run confirmed.
  //   0: o10 h12 l8  c11 v100   2: o11 h13 l10 c12 v0 (no volume)
  //   1: o11 h11 l11 c11 v50 (high == low, unchanged close)   3: o12 h12 l10 c10 v30
  const bars = [
    { time: 1, open: 10, high: 12, low: 8, close: 11, volume: 100 },
    { time: 2, open: 11, high: 11, low: 11, close: 11, volume: 50 },
    { time: 3, open: 11, high: 13, low: 10, close: 12, volume: 0 },
    { time: 4, open: 12, high: 12, low: 10, close: 10, volume: 30 },
  ];
  const nan = NaN;
  const want: Record<Name, number[]> = {
    accdist: [50, 50, 50, 20],                   // a high == low bar and a zero-volume bar add 0; bar 3 adds -30
    iii: [50, nan, 0, -30],                      // no range is na, not 0
    nvi: [1, 1, 12 / 11, 12 / 11],               // moves only when volume fell
    obv: [nan, 0, 0, -30],                       // na on bar 0, then from 0
    pvi: [1, 1, 1, 1 - 2 / 12],                  // moves only when volume rose (bar 3: 0 -> 30)
    pvt: [nan, 0, 0, -5],
    wad: [0, 0, 2, 0],                           // 12 - min(10, 11), then 10 - max(12, 12)
    wvad: [25, nan, 0, -30],
  };

  it.each([4, 5, 6])("v%i", (version) => {
    const out = run(script(version), bars);
    for (const n of NAMES) {
      want[n].forEach((w, i) => {
        if (Number.isNaN(w)) expect(out[n][i], `${n}[${i}]`).toBeNaN();
        else expect(out[n][i], `${n}[${i}]`).toBeCloseTo(w, 10);
      });
    }
  });
});

describe.each([1, 2, 3])("accdist at v%i against TradingView", (version) => {
  // v1 has no //@version line and spells the declaration `study`; its plot
  // titles need `title=`.
  const line = version === 1 ? "" : `//@version=${version}\n`;
  const out = run(`${line}study("t")\nplot(accdist, title="accdist")\n`);
  const tv = table("volume_builtins.v4.expected.csv");
  const first = candles.findIndex(c => c.time === tv[0][0]);

  it("matches the Pine Logs over bars 0-5", () => {
    LOGS.accdist.forEach((want, bar) => {
      expect(Math.abs(out.accdist[bar] - want), `bar ${bar}`).toBeLessThanOrEqual(0.0005 + 1e-9);
    });
  });

  it("changes as TradingView's does over the 299 captured bars", () => {
    const bad = tv.filter((r, i) =>
      rel(out.accdist[first + i] - out.accdist[first], r[1] - tv[0][1]) > 1e-9).length;
    expect(bad).toBe(0);
  });
});

describe.each([1, 2, 3])("the other seven are undeclared at v%i, as on TradingView", (version) => {
  it.each(NAMES.filter(n => n !== "accdist"))("%s is a compile error", (name) => {
    const line = version === 1 ? "" : `//@version=${version}\n`;
    const compiled = new Session().compile(`${line}study("t")\nplot(${name}, title="x")\n`);
    expect(compiled.errors.map((e: any) => e.message).join("\n"))
      .toMatch(new RegExp(`'${name}' is not available in Pine Script v${version}`));
  });
});
