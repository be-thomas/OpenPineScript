/**
 * A calendar function given an `na` time reads it as Unix time 0, not na. On
 * TradingView, on bar 0: `year(time[1])` is 1970, `month(time[1])` 1,
 * `dayofmonth` 1, `hour`/`minute`/`second` 0, `dayofweek` 5 (Thursday),
 * `weekofyear` 1, `na(year(time[1]))` false, and `year(int(na))` 1970
 * (dev-docs/tv-parity/_probes/eqpnl/p_tna_v{1..6}, BINANCE:BTCUSDT 1h,
 * 2026-11-14).
 *
 * So `new_year = year(time) != year(time[1])` is TRUE on the first bar and
 * `new_month = month(time) != month(time[1])` is false when the data starts in
 * January. The monthly-returns tables that public strategies paste in depend on
 * it: their year accumulator resets on bar 0, and the year row is pushed on the
 * last bar. With na the accumulator stayed na all year and the row never
 * appeared ("Monthly Returns in PineScript Strategies", v4: TradingView shows
 * the 2026 row, the engine showed only the header).
 */
import { describe, it, expect } from "vitest";
import { Session, type Candle } from "../../runtime/v1/session";

const bars: Candle[] = Array.from({ length: 6 }, (_, i) => ({
  time: Date.UTC(2026, 0, 1, i), open: 10, high: 11, low: 9, close: 10 + i, volume: 1,
}));

function first(version: number) {
  const decl = version >= 5 ? "indicator" : "study";
  const s = new Session();
  s.setChart({ timeframe: "60", symbol: "BINANCE:BTCUSDT", timezone: "UTC" });
  const c = s.compile(`${version === 1 ? "" : `//@version=${version}`}
${decl}("na time v${version}")
plot(year(time[1]), "y")
plot(month(time[1]), "m")
plot(dayofmonth(time[1]), "d")
plot(hour(time[1]), "h")
plot(dayofweek(time[1]), "dw")
plot(weekofyear(time[1]), "wy")
plot(year(time) != year(time[1]) ? 1 : 0, "ny")
plot(month(time) != month(time[1]) ? 1 : 0, "nm")
plot(na(year(time[1])) ? 1 : 0, "isna")
`);
  expect(c.errors).toEqual([]);
  const r = s.runHistory(bars);
  const at0 = (t: string) => r.series.find(x => x.title === t)!.data[0].value;
  return { at0, col: (t: string) => r.series.find(x => x.title === t)!.data.map((d: any) => d.value) };
}

describe.each([1, 2, 3, 4, 5, 6])("v%i calendar functions of an na time", (version) => {
  it("read it as Unix time 0 on the first bar", () => {
    const r = first(version);
    expect([r.at0("y"), r.at0("m"), r.at0("d"), r.at0("h"), r.at0("dw"), r.at0("wy")])
      .toEqual([1970, 1, 1, 0, 5, 1]);
    expect(r.at0("isna")).toBe(0);
  });
  it("make new_year true and new_month false on a January first bar", () => {
    const r = first(version);
    expect(r.col("ny")).toEqual([1, 0, 0, 0, 0, 0]);
    expect(r.col("nm")).toEqual([0, 0, 0, 0, 0, 0]);
  });
});

describe("the bare variables still read the bar's own time", () => {
  it("year and month with no argument are the current bar's", () => {
    const s = new Session();
    s.setChart({ timeframe: "60", symbol: "BINANCE:BTCUSDT", timezone: "UTC" });
    expect(s.compile(`//@version=5\nindicator("t")\nplot(year, "y")\nplot(month(time), "m")\n`).errors).toEqual([]);
    const r = s.runHistory(bars);
    expect(r.series.find(x => x.title === "y")!.data.map((d: any) => d.value)).toEqual([2026, 2026, 2026, 2026, 2026, 2026]);
    expect(r.series.find(x => x.title === "m")!.data.map((d: any) => d.value)).toEqual([1, 1, 1, 1, 1, 1]);
  });
});

describe("a monthly-returns table pushes its year row", () => {
  it("v4: the year accumulator resets on bar 0, so the last bar pushes the year", () => {
    const s = new Session();
    s.setChart({ timeframe: "60", symbol: "BINANCE:BTCUSDT", timezone: "UTC" });
    const c = s.compile(`//@version=4
study("year row")
new_year = year(time) != year(time[1])
cur_year = 0.0
cur_year := new_year ? 0.0 : cur_year[1] + 1
var year_rows = array.new_float(0)
if not na(cur_year[1]) and (new_year or barstate.islast)
    array.push(year_rows, cur_year[1])
plot(array.size(year_rows), "rows")
`);
    expect(c.errors).toEqual([]);
    const r = s.runHistory(bars);
    const rows = r.series.find(x => x.title === "rows")!.data.map((d: any) => d.value);
    expect(rows.at(-1)).toBe(1);
  });
});
