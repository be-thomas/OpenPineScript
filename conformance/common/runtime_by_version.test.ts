/**
 * The shared runtime behaves identically at every Pine version.
 *
 * ── Why this file exists ────────────────────────────────────────────────────
 *
 * There is ONE implementation of each built-in, in runtime/v1/stdlib/. The
 * version machinery is about NAMES, not behaviour: BASE_REGISTRY (v1–v3),
 * V4_VIEW and V5_VIEW differ in which spellings resolve, and every entry that
 * survives into a later view points at the same function object. So a fix made
 * against v5 golden data is a fix at v1 by construction, and nothing had to be
 * ported.
 *
 * "By construction" is exactly the kind of claim that stops being true quietly.
 * The transpilers are a chain of overrides (V1 ← V2 ← V3 ← V4 ← V5) and the
 * registry is a chain of views, so a later version can shadow a name, and a
 * `runtime/vN/` directory could one day hold a second implementation. Either
 * would split the versions apart with no test failing — the v5 golden suite
 * would still pass, because it only ever runs v5.
 *
 * ── Why it asserts values and not just agreement ────────────────────────────
 *
 * A table that only checked "all five agree" would pass if all five regressed
 * together, which is the likelier accident here given the shared code. So each
 * row asserts the RULE TradingView's own output established, and the agreement
 * across versions falls out of every version being asserted against it.
 *
 * Every rule below was established against TradingView's own values; see
 * conformance/v5/golden/ and the comments on the implementations.
 */
import { describe, it, expect } from "vitest";
import { compileScript } from "../../transpiler/common";
import { IMPLEMENTED_VERSIONS, PineVersion } from "../../test-utils/common/transpileAs";
import { Context } from "../../runtime/v1/context";
import { compile } from "../../runtime/v1/index";

const DAY = 86_400_000;

/**
 * Six DAILY bars. Daily matters: `ta.vwap` restarts every session, and one bar
 * per calendar day is what makes each bar its own session.
 *
 * close rises from bar 0 to bar 1, which is what `ta.sar` reads to pick its
 * initial direction, so the seed below is the up-trend one.
 */
const BARS = [
  { o: 100, h: 112, l: 96,  c: 110, v: 10 },
  { o: 110, h: 120, l: 108, c: 118, v: 20 },
  { o: 118, h: 125, l: 100, c: 104, v: 30 },
  { o: 104, h: 108, l: 90,  c: 95,  v: 40 },
  { o: 95,  h: 130, l: 94,  c: 128, v: 50 },
  { o: 128, h: 135, l: 120, c: 133, v: 60 },
];

const HEAD: Record<PineVersion, string> = {
  1: "", 2: "//@version=2\n", 3: "//@version=3\n", 4: "//@version=4\n", 5: "//@version=5\n",
};

/** Runs `body` at `version` over BARS and returns each named variable per bar. */
function runAt(version: PineVersion, body: string, want: string[]): Record<string, number[]> {
  const compiled = compileScript(HEAD[version] + body, { version });
  const ctx = new Context(compiled.profile);
  const exec = compile(compiled.js, ctx, { ctx } as any);

  const out: Record<string, number[]> = {};
  for (const w of want) out[w] = [];

  BARS.forEach((b, i) => {
    ctx.currentBarIndex = i;
    ctx.setBar(Date.UTC(2021, 0, 4) + i * DAY, b.o, b.h, b.l, b.c, b.v);
    exec();
    for (const w of want) out[w].push(Number(ctx.getSeries(`opsv2_${w}`, 0)));
    ctx.finalizeBar();
  });
  return out;
}

/**
 * A per-version source. v5 moved the TA library under `ta.` and renamed `n` to
 * `bar_index`, so a single source would be rejected at one end or the other
 * and the row would pass while asserting nothing.
 */
interface Probe {
  v1to3: string;
  v4: string;
  v5: string;
}

function sourceFor(p: Probe, version: PineVersion): string {
  return version === 5 ? p.v5 : version === 4 ? p.v4 : p.v1to3;
}

describe("ta.sar seeds on bar 1 at every version", () => {
  const probe: Probe = {
    v1to3: "s = sar(0.02, 0.02, 0.2)\n",
    v4:    "s = sar(0.02, 0.02, 0.2)\n",
    v5:    "s = ta.sar(0.02, 0.02, 0.2)\n",
  };

  for (const version of IMPLEMENTED_VERSIONS) {
    it(`v${version}: na on bar 0, then low[0]`, () => {
      const { s } = runAt(version, sourceFor(probe, version), ["s"]);

      // TradingView's pine_sar is `var float result = na` until bar_index == 1.
      // A bar-0 seed puts every later value one bar early for the whole chart.
      expect(Number.isNaN(s[0])).toBe(true);
      expect(Number.isNaN(s[1])).toBe(false);

      // close rises into bar 1, so the seed is the up-trend one: `result := low[1]`.
      expect(s[1]).toBe(BARS[0].l);
    });
  }
});

describe("ta.vwap restarts every session at every version", () => {
  const probe: Probe = {
    v1to3: "w = vwap(hlc3)\n",
    v4:    "w = vwap(hlc3)\n",
    v5:    "w = ta.vwap(hlc3)\n",
  };

  for (const version of IMPLEMENTED_VERSIONS) {
    it(`v${version}: equals hlc3 on daily bars`, () => {
      const { w } = runAt(version, sourceFor(probe, version), ["w"]);

      // One bar per day means one bar per session, so there is nothing to
      // average: TradingView returns the source, on all 2,475 daily bars of
      // conformance/v5/golden/harness_state.BTCUSDT.1D.log.
      const hlc3 = BARS.map(b => (b.h + b.l + b.c) / 3);
      w.forEach((value, i) => expect(value).toBeCloseTo(hlc3[i], 10));
    });
  }
});

describe("a strategy's starting capital at every version", () => {
  const byDefault: Probe = {
    v1to3: 'strategy("s")\nc = strategy.initial_capital\n',
    v4:    'strategy("s")\nc = strategy.initial_capital\n',
    v5:    'strategy("s")\nc = strategy.initial_capital\n',
  };
  const declared: Probe = {
    v1to3: 'strategy("s", initial_capital = 5000)\nc = strategy.initial_capital\n',
    v4:    'strategy("s", initial_capital = 5000)\nc = strategy.initial_capital\n',
    v5:    'strategy("s", initial_capital = 5000)\nc = strategy.initial_capital\n',
  };

  for (const version of IMPLEMENTED_VERSIONS) {
    it(`v${version}: 1,000,000 by default`, () => {
      // TradingView's figure, read off its own output: the golden strategy
      // export declares none and reports exactly this before the first fill.
      expect(runAt(version, sourceFor(byDefault, version), ["c"]).c[0]).toBe(1_000_000);
    });

    it(`v${version}: and honours what strategy() declares`, () => {
      expect(runAt(version, sourceFor(declared, version), ["c"]).c[0]).toBe(5000);
    });
  }
});

describe("market orders fill at the next bar's open at every version", () => {
  const probe: Probe = {
    v1to3: 'strategy("s")\nif n == 1\n    strategy.entry("L", strategy.long, 1)\nz = strategy.position_size\ne = strategy.equity\n',
    v4:    'strategy("s")\nif bar_index == 1\n    strategy.entry("L", strategy.long, 1)\nz = strategy.position_size\ne = strategy.equity\n',
    v5:    'strategy("s")\nif bar_index == 1\n    strategy.entry("L", strategy.long, 1)\nz = strategy.position_size\ne = strategy.equity\n',
  };

  for (const version of IMPLEMENTED_VERSIONS) {
    it(`v${version}: the placing bar still reads flat`, () => {
      const { z } = runAt(version, sourceFor(probe, version), ["z", "e"]);

      // Placed on bar 1; bar 1 still reports the position it had.
      expect(z).toEqual([0, 0, 1, 1, 1, 1]);
    });

    it(`v${version}: and fills at that bar's open, not the placing bar's close`, () => {
      const { e } = runAt(version, sourceFor(probe, version), ["z", "e"]);

      // equity on the fill bar is capital + (close - fill price). open[2] is
      // 118 and close[1] is 118 here by coincidence of the data, so bar 2 alone
      // cannot tell the two apart — bar 3 can, and does.
      const capital = 1_000_000;
      expect(e[2]).toBeCloseTo(capital + (BARS[2].c - BARS[2].o), 9);
      expect(e[3]).toBeCloseTo(capital + (BARS[3].c - BARS[2].o), 9);
    });
  }
});
