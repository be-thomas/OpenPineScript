/**
 * `strategy.position_entry_name` at v4, v5 and v6: "Lng" while the long is held,
 * "Sht" while the short is, "" while flat. TradingView's plot of 1 / -1 / 0
 * coded that and no other value appeared, so it tracks the sign of
 * `strategy.position_size` exactly
 * (dev-docs/tv-parity/_probes/corpus98/p6_v{4,5,6}_entry_name, BINANCE:BTCUSDT
 * 1h, 2026-11-14). v2 and v3 were not probed and still refuse the name.
 */
import { describe, it, expect } from "vitest";
import { Session, type Candle } from "../../runtime/v1/session";

const bars: Candle[] = Array.from({ length: 24 }, (_, i) => ({
  time: Date.UTC(2025, 0, 1, i), open: 100, high: 101, low: 99, close: 100, volume: 1,
}));

function compile(version: number, extra = "") {
  const s = new Session();
  s.setChart({ timeframe: "60", symbol: "BINANCE:BTCUSDT" });
  const c = s.compile(`//@version=${version}
strategy("p6 v${version} entry name")
if bar_index % 10 == 0
    strategy.entry("Lng", strategy.long)
if bar_index % 10 == 5
    strategy.entry("Sht", strategy.short)
if bar_index % 10 == 8
    strategy.close_all()
plot(strategy.position_entry_name == "Lng" ? 1 : strategy.position_entry_name == "Sht" ? -1 : strategy.position_entry_name == "" ? 0 : 9, "name")
plot(strategy.position_size, "ps")
${extra}`);
  return { s, c };
}

describe.each([4, 5, 6])("v%i strategy.position_entry_name", (version) => {
  it("is Lng while long, Sht while short, and empty while flat", () => {
    const { s, c } = compile(version);
    expect(c.errors).toEqual([]);
    const r = s.runHistory(bars);
    const col = (t: string) => r.series.find(x => x.title === t)!.data.map((d: any) => d.value);
    const name = col("name");
    expect(name).toEqual(col("ps").map(Math.sign));
    expect(name.slice(0, 14)).toEqual([0, 1, 1, 1, 1, 1, -1, -1, -1, 0, 0, 1, 1, 1]);
  });

  it("is the string itself", () => {
    const s = new Session();
    s.setChart({ timeframe: "60", symbol: "BINANCE:BTCUSDT" });
    const c = s.compile(`//@version=${version}
strategy("t")
if bar_index == 0
    strategy.entry("Lng", strategy.long)
plot(strategy.position_entry_name == "Lng" ? 1 : 0, "isLng")
plot(strategy.position_entry_name == "" ? 1 : 0, "isEmpty")
`);
    expect(c.errors).toEqual([]);
    const r = s.runHistory(bars.slice(0, 3));
    const col = (t: string) => r.series.find(x => x.title === t)!.data.map((d: any) => d.value);
    expect(col("isLng")).toEqual([0, 1, 1]);
    expect(col("isEmpty")).toEqual([1, 0, 0]);
  });
});

describe.each([2, 3])("v%i (unprobed)", (version) => {
  it("still refuses strategy.position_entry_name", () => {
    const counter = "n";
    const s = new Session();
    const c = s.compile(`//@version=${version}
strategy("t")
if ${counter} == 0
    strategy.entry("Lng", strategy.long)
plot(strategy.position_entry_name == "Lng" ? 1 : 0)
`);
    expect(c.errors.length).toBeGreaterThan(0);
  });
});
