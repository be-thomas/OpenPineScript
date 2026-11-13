/**
 * A built-in series' history is recorded on every bar, wherever its only `[n]`
 * read sits (if / for / function body). From TradingView:
 *   dev-docs/tv-parity/_probes/hlc3/20261110-024554_BINANCE_HYPEUSDT_1m
 *     (`hlc3 == hlc3[1]` inside `if sameP` logs true)
 *   dev-docs/tv-parity/_probes/sizing  (`strategy.equity[1]` inside an `if`)
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const bars = (n: number) => Array.from({ length: n }, (_, i) => ({
  time: 1_700_000_000 + i * 3600, open: 100 + i, high: 101 + i * 2, low: 99, close: 100 + i, volume: 10 + i,
}));

function logs(src: string, n = 8): string[] {
  const s = new Session();
  expect(s.compile(src).errors).toEqual([]);
  const r: any = s.runHistory(bars(n));
  return (r.logs ?? []).map((l: any) => l.message ?? String(l));
}

const lastLog = (src: string) => logs(src).filter(m => m.startsWith("r "));

describe("built-in history read only inside a block", () => {
  it("hlc3[1] inside an if that skips earlier bars", () => {
    const out = lastLog(`//@version=6
indicator("x")
if bar_index == 5
    log.info("r {0} {1}", hlc3[1], hlc3 == hlc3[1])
`);
    // bar 4: high 109, low 99, close 104
    expect(out).toEqual([`r ${(109 + 99 + 104) / 3} false`]);
  });

  for (const [name, expr, want] of [
    ["hl2[1]", "hl2[1]", (109 + 99) / 2],
    ["ohlc4[2]", "ohlc4[2]", (103 + 107 + 99 + 103) / 4],
    ["time[1]", "time[1]", 1_700_000_000 + 4 * 3600],
    ["volume[1]", "volume[1]", 14],
  ] as [string, string, number][]) {
    it(`${name} inside an if`, () => {
      const out = lastLog(`//@version=6
indicator("x")
if bar_index == 5
    log.info("r {0}", ${expr})
`);
      // str.format groups thousands, as TradingView does (v6-str-format-numbers)
      expect(out).toEqual([`r ${want.toLocaleString("en-US")}`]);
    });
  }

  it("hlc3[1] inside a function body", () => {
    const out = lastLog(`//@version=6
indicator("x")
f() =>
    hlc3[1]
if bar_index == 5
    log.info("r {0}", f())
`);
    expect(out).toEqual([`r ${(109 + 99 + 104) / 3}`]);
  });

  it("hlc3[1] inside a loop", () => {
    const out = lastLog(`//@version=6
indicator("x")
if bar_index == 5
    for i = 0 to 0
        log.info("r {0}", hlc3[1])
`);
    expect(out).toEqual([`r ${(109 + 99 + 104) / 3}`]);
  });

  it("strategy.equity[1] and strategy.position_size[1] inside an if", () => {
    const out = lastLog(`//@version=6
strategy("x", initial_capital=1000)
if bar_index == 5
    log.info("r {0} {1}", strategy.equity[1], strategy.position_size[1])
`);
    expect(out).toEqual(["r 1,000 0"]);
  });
});
