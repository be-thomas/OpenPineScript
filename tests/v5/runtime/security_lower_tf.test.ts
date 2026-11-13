/**
 * `request.security_lower_tf`: the intrabars of each chart bar, and its
 * `ignore_invalid_symbol`, `ignore_invalid_timeframe` and `calc_bars_count`.
 *
 * The chart is hourly, four bars; the host supplies the 15-minute series, 16
 * bars, where bar m closes at m and trades 10 * m. Chart bar k therefore
 * contains the four intrabars 4k .. 4k + 3.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const T0 = Date.UTC(2024, 0, 1);
const HOUR = 3_600_000;
const chartBars = Array.from({ length: 4 }, (_, k) => ({
  time: T0 + k * HOUR, open: 1, high: 2, low: 0, close: 1, volume: 1,
}));
const m15 = Array.from({ length: 16 }, (_, m) => ({
  time: T0 + m * 15 * 60_000, open: m, high: m + 1, low: m - 1, close: m, volume: 10 * m,
}));

const values = (r: any, title: string) => r.series.find((p: any) => p.title === title).data.map((d: any) => d?.value ?? null);

function run(body: string, opts: { data?: boolean; version?: 5 | 6 } = {}) {
  const s = new Session();
  s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "60" });
  const c = s.compile(`//@version=${opts.version ?? 5}\nindicator("t")\n${body}`);
  expect(c.errors).toEqual([]);
  if (opts.data !== false) s.provideData("BINANCE:BTCUSDT", "15", m15);
  return s.runHistory(chartBars) as any;
}

describe("the intrabars of a chart bar", () => {
  it("are the lower-timeframe bars inside it: closes 0..3, 4..7, 8..11, 12..15", () => {
    const r = run('c = request.security_lower_tf(syminfo.tickerid, "15", close)\n' +
      'plot(array.size(c), "n")\nplot(array.sum(c), "sum")\nplot(array.size(c) > 0 ? array.get(c, array.size(c) - 1) : -1, "last")\n');
    expect(r.errors).toEqual([]);
    expect(r.droppedArguments).toEqual([]);
    expect(values(r, "n")).toEqual([4, 4, 4, 4]);
    expect(values(r, "sum")).toEqual([6, 22, 38, 54]);          // 0+1+2+3, 4+5+6+7, ...
    expect(values(r, "last")).toEqual([3, 7, 11, 15]);
    expect(r.warnings).toEqual([]);
  });

  it("come back as a tuple of arrays for a tuple expression: volumes are 10 * close", () => {
    const r = run('[c, v] = request.security_lower_tf(syminfo.tickerid, "15", [close, volume])\n' +
      'plot(array.sum(c), "c")\nplot(array.sum(v), "v")\n');
    expect(values(r, "c")).toEqual([6, 22, 38, 54]);
    expect(values(r, "v")).toEqual([60, 220, 380, 540]);
  });

  it("evaluate the expression on the lower timeframe's own history: sma(2) runs across chart bars", () => {
    const r = run('a = request.security_lower_tf(syminfo.tickerid, "15", ta.sma(close, 2))\n' +
      'plot(array.size(a), "n")\nplot(array.size(a) > 0 ? array.get(a, 0) : -1, "first")\nplot(array.size(a) > 0 ? array.get(a, 3) : -1, "last")\n');
    // Closes 0,1,2,... so sma(2) is na at intrabar 0 and m - 0.5 after.
    expect(values(r, "first")).toEqual([null, 3.5, 7.5, 11.5]);
    expect(values(r, "last")).toEqual([2.5, 6.5, 10.5, 14.5]);
  });

  it("are empty, and the host is told, when no data was supplied", () => {
    const r = run('c = request.security_lower_tf(syminfo.tickerid, "15", close)\nplot(array.size(c), "n")\n', { data: false });
    expect(r.errors).toEqual([]);
    expect(values(r, "n")).toEqual([0, 0, 0, 0]);
    expect(r.warnings).toHaveLength(1);
    expect(r.warnings[0]).toContain("BINANCE:BTCUSDT at timeframe 15");
  });

  it("ignore_invalid_symbol is accepted, not dropped; either way an unsupplied symbol is empty", () => {
    const r = run('c = request.security_lower_tf("BINANCE:ETHUSDT", "15", close, ignore_invalid_symbol = true)\n' +
      'plot(array.size(c), "n")\n', { data: false });
    expect(r.droppedArguments).toEqual([]);
    expect(values(r, "n")).toEqual([0, 0, 0, 0]);
  });
});

describe("ignore_invalid_timeframe", () => {
  // The chart is 60 minutes; "240" is HIGHER than it.
  it("false (the default): the script halts with a runtime error", () => {
    // The compile step runs the script once, so the error surfaces there.
    const s = new Session();
    s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "60" });
    const c = s.compile('//@version=5\nindicator("t")\nc = request.security_lower_tf(syminfo.tickerid, "240", close)\nplot(array.size(c), "n")\n');
    expect(c.errors).toHaveLength(1);
    expect(c.errors[0].message).toContain("request.security_lower_tf");
    expect(c.errors[0].message).toContain("'240'");
    expect(c.errors[0].message).toContain("'60'");
  });

  it("true: returns na and the script runs on", () => {
    const r = run('c = request.security_lower_tf(syminfo.tickerid, "240", close, ignore_invalid_timeframe = true)\n' +
      'plot(na(c) ? 1 : 0, "isna")\nplot(close, "after")\n');
    expect(r.errors).toEqual([]);
    expect(r.droppedArguments).toEqual([]);
    expect(values(r, "isna")).toEqual([1, 1, 1, 1]);
    expect(values(r, "after")).toEqual([1, 1, 1, 1]);
  });

  it("true, with a tuple: each element is na", () => {
    const r = run('[a, b] = request.security_lower_tf(syminfo.tickerid, "240", [close, open], ignore_invalid_timeframe = true)\n' +
      'plot(na(a) and na(b) ? 1 : 0, "isna")\n');
    expect(r.errors).toEqual([]);
    expect(values(r, "isna")).toEqual([1, 1, 1, 1]);
  });

  it("the chart's own timeframe is valid, and has one intrabar per chart bar", () => {
    const s = new Session();
    s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "60" });
    s.compile('//@version=5\nindicator("t")\nc = request.security_lower_tf(syminfo.tickerid, "", close)\nplot(array.size(c), "n")\nplot(array.size(c) > 0 ? array.get(c, 0) : -1, "v")\n');
    const r: any = s.runHistory(chartBars);
    expect(r.errors).toEqual([]);
    expect(values(r, "n")).toEqual([1, 1, 1, 1]);
    expect(values(r, "v")).toEqual([1, 1, 1, 1]);
  });
});

describe("calc_bars_count", () => {
  // TradingView's log (conformance/v5/parity/harness_security_cbc, BTCUSDT 5m):
  // `request.security_lower_tf("1", bar_index, calc_bars_count = 200)` equals
  // the call without it on every row, same size and same first element. It
  // has no observable effect, and is accepted rather than dropped.
  it("changes nothing: every chart bar still gets its intrabars", () => {
    const r = run('c = request.security_lower_tf(syminfo.tickerid, "15", close, calc_bars_count = 6)\n' +
      'plot(array.size(c), "n")\nplot(array.size(c) > 0 ? array.sum(c) : -1, "sum")\n');
    expect(r.droppedArguments).toEqual([]);
    expect(values(r, "n")).toEqual([4, 4, 4, 4]);
    expect(values(r, "sum")).toEqual([6, 22, 38, 54]);
  });

  it("the expression warms up from the first intrabar, whatever the count", () => {
    const r = run('a = request.security_lower_tf(syminfo.tickerid, "15", ta.sma(close, 2), calc_bars_count = 6)\n' +
      'plot(array.size(a) > 0 ? array.get(a, 0) : -1, "first")\n');
    // sma(2) is na only at the very first intrabar.
    expect(values(r, "first")).toEqual([null, 3.5, 7.5, 11.5]);
  });
});

describe("a live chart bar, ticked again", () => {
  const live = { time: T0 + 4 * HOUR, open: 1, high: 2, low: 0, close: 1, volume: 1 };
  const setup = (body: string, supplied: number) => {
    const s = new Session();
    s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "60" });
    expect(s.compile(`//@version=5\nindicator("t")\n${body}`).errors).toEqual([]);
    s.provideData("BINANCE:BTCUSDT", "15", m15.slice(0, supplied));
    s.runHistory(chartBars);
    return s;
  };
  const more = Array.from({ length: 20 }, (_, m) => ({
    time: T0 + m * 15 * 60_000, open: m, high: m + 1, low: m - 1, close: m, volume: 10 * m,
  }));

  it("is handed a fresh array each tick, not the one a script already pushed to", () => {
    // Intrabars 16..19 are the live bar's. A script that pushes to the array it
    // gets must see 4 + 1 each tick, not 4 + 1 + 1 + 1.
    const s = new Session();
    s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "60" });
    expect(s.compile(`//@version=5\nindicator("t")\na = request.security_lower_tf(syminfo.tickerid, "15", close)\narray.push(a, 99)\nplot(array.size(a), "n")\n`).errors).toEqual([]);
    s.provideData("BINANCE:BTCUSDT", "15", more);
    s.runHistory(chartBars);
    const sizes = [0, 1, 2].map((t) => (s.tick({ ...live, close: 1 + t }) as any).series.map((x: any) => x.value));
    expect(sizes).toEqual([[5], [5], [5]]);
  });

  it("copies the arrays of a tuple too", () => {
    const s = new Session();
    s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "60" });
    expect(s.compile(`//@version=5\nindicator("t")\n[c, v] = request.security_lower_tf(syminfo.tickerid, "15", [close, volume])\narray.push(c, 99)\narray.push(v, 99)\nplot(array.size(c) + array.size(v), "n")\n`).errors).toEqual([]);
    s.provideData("BINANCE:BTCUSDT", "15", more);
    s.runHistory(chartBars);
    const sizes = [0, 1, 2].map(() => (s.tick(live) as any).series.map((x: any) => x.value));
    expect(sizes).toEqual([[10], [10], [10]]);
  });

  it("picks up intrabars the host supplies while the bar is forming", () => {
    const s = setup(`a = request.security_lower_tf(syminfo.tickerid, "15", close)\nplot(array.size(a), "n")\nplot(array.size(a) > 0 ? array.get(a, array.size(a) - 1) : -1, "last")\n`, 16);
    const at = () => (s.tick(live) as any).series.map((x: any) => x.value);
    expect(at()).toEqual([0, -1]);
    s.provideData("BINANCE:BTCUSDT", "15", more.slice(0, 18));
    expect(at()).toEqual([2, 17]);                      // intrabars 16 and 17
    s.provideData("BINANCE:BTCUSDT", "15", more.slice(0, 20));
    expect(at()).toEqual([4, 19]);                      // 16..19
  });

  it("does not feed the expression a bar twice when the series is replaced: sma(2) stays right", () => {
    const s = setup(`a = request.security_lower_tf(syminfo.tickerid, "15", ta.sma(close, 2))\nplot(array.size(a) > 0 ? array.get(a, array.size(a) - 1) : -1, "last")\n`, 16);
    const at = () => (s.tick(live) as any).series.map((x: any) => x.value);
    s.provideData("BINANCE:BTCUSDT", "15", more.slice(0, 18));
    expect(at()).toEqual([16.5]);                       // (16 + 17) / 2
    // the same bars, redelivered as a new array: nothing changes
    s.provideData("BINANCE:BTCUSDT", "15", more.slice(0, 18).map((b) => ({ ...b })));
    expect(at()).toEqual([16.5]);
  });
});
