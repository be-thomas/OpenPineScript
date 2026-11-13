/**
 * `request.security` for the chart's own series, and for data the host never
 * supplied.
 *
 * "timeframe ... An empty string is interpreted as the current chart's
 * timeframe." The engine took "" for an external series called "SYMBOL@",
 * which no host could supply, so every value read from it was `na`.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const H4 = 4 * 3_600_000;
const bars = Array.from({ length: 12 }, (_, i) => ({
  time: Date.UTC(2024, 0, 1) + i * H4,
  // Closes that differ bar to bar and are not monotonic, so a lag of one bar,
  // or an aggregate over several, cannot equal the bare close by accident.
  open: 100 + i, high: 110 + i, low: 90 + i, close: 100 + ((i * i) % 7) + i, volume: 1000 + i,
}));
const closes = bars.map((b) => b.close);

const values = (r: any, title: string) => r.series.find((p: any) => p.title === title).data.map((d: any) => d?.value ?? null);

const chart = { symbol: "BINANCE:BTCUSDT", timeframe: "240" };

function run(src: string, withChart = true) {
  const s = new Session();
  if (withChart) s.setChart(chart);
  expect(s.compile(src).errors).toEqual([]);
  return { s, r: s.runHistory(bars) as any };
}

describe("the chart's own series", () => {
  const src = (version: number) => `//@version=${version}\nindicator("t")\n` +
    'plot(close, "bare")\n' +
    'plot(request.security(syminfo.tickerid, "", close), "empty")\n' +
    'plot(request.security(syminfo.tickerid, timeframe.period, close), "period")\n' +
    'plot(request.security(syminfo.tickerid, "240", close), "explicit")\n';

  it("v5: an empty timeframe, timeframe.period and the chart's own '240' all equal the bare close on every bar", () => {
    const { r } = run(src(5));
    expect(values(r, "bare")).toEqual(closes);
    expect(values(r, "empty")).toEqual(closes);
    expect(values(r, "period")).toEqual(closes);
    expect(values(r, "explicit")).toEqual(closes);
  });

  it("asks the host for nothing, and warns of nothing", () => {
    const { s, r } = run(src(5));
    expect([...(s as any).ctx.requestedSecurities]).toEqual([]);
    expect(r.warnings).toEqual([]);
  });

  it("v6: the same", () => {
    const { r } = run(src(6));
    expect(values(r, "empty")).toEqual(closes);
    expect(values(r, "period")).toEqual(closes);
  });

  it("v4: security(syminfo.tickerid, \"\", close) is the chart's close too", () => {
    const { r } = run('//@version=4\nstudy("t")\nplot(security(syminfo.tickerid, "", close), "empty")\n');
    expect(values(r, "empty")).toEqual(closes);
  });

  it("an empty symbol and an empty timeframe together", () => {
    const { r } = run('//@version=5\nindicator("t")\nplot(request.security("", "", close), "x")\n');
    expect(values(r, "x")).toEqual(closes);
  });

  it("an expression, not only a price: ta.sma over the chart's series matches the bare one", () => {
    const { r } = run('//@version=5\nindicator("t")\n' +
      'plot(ta.sma(close, 3), "bare")\nplot(request.security(syminfo.tickerid, "", ta.sma(close, 3)), "empty")\n');
    expect(values(r, "empty")).toEqual(values(r, "bare"));
    // 3-bar mean of the first three closes, so the series is not all na.
    expect(values(r, "empty")[2]).toBeCloseTo((closes[0] + closes[1] + closes[2]) / 3, 10);
  });

  it("is the chart's bars as they are, even when they do not fit the declared timeframe", () => {
    // An imported file declared as "D" whose bars are 12 hours apart: two bars
    // to a period. Folding them into periods of their own length would merge
    // the pairs and lag every value; the chart's own series is itself.
    const s = new Session();
    s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "D" });
    s.compile('//@version=5\nindicator("t")\nplot(close, "bare")\nplot(request.security(syminfo.tickerid, "", close), "empty")\n' +
      'plot(request.security(syminfo.tickerid, timeframe.period, close), "period")\n');
    const half = bars.map((b, i) => ({ ...b, time: Date.UTC(2024, 0, 1) + i * 12 * 3_600_000 }));
    const r: any = s.runHistory(half);
    expect(values(r, "empty")).toEqual(closes);
    expect(values(r, "period")).toEqual(closes);
  });

  it("a higher timeframe of the chart's symbol is still derived, and still closed-bar", () => {
    const { r } = run('//@version=5\nindicator("t")\nplot(request.security(syminfo.tickerid, "D", close), "d")\n');
    // Six 4h bars to a day. Day 0 (bars 0-5) closes on the chart bar that ends
    // it, bar 5, and its close is bar 5's (TradingView's log,
    // conformance/v5/parity/harness_security_tf.BTCUSDT.5.csv, bars 4475, 4487, ...);
    // day 1 closes on bar 11.
    const d = values(r, "d");
    expect(d.slice(0, 5)).toEqual([null, null, null, null, null]);
    expect(d.slice(5, 11)).toEqual(Array(6).fill(closes[5]));
    expect(d[11]).toBe(closes[11]);
  });
});

describe("requests the host never supplied", () => {
  const other = '//@version=5\nindicator("t")\nplot(request.security("BINANCE:ETHUSDT", "15", close), "eth")\n';

  it("are named in warnings, with the symbol and timeframe", () => {
    const { r } = run(other);
    expect(values(r, "eth").every((v: any) => v === null)).toBe(true);
    expect(r.warnings).toHaveLength(1);
    expect(r.warnings[0]).toContain("BINANCE:ETHUSDT");
    expect(r.warnings[0]).toContain("timeframe 15");
    expect(r.warnings[0]).toContain("provideData");
  });

  it("are not warned of once the host supplies them", () => {
    const s = new Session();
    s.setChart(chart);
    s.compile(other);
    const eth = Array.from({ length: 12 * 16 }, (_, i) => ({
      time: bars[0].time + i * 15 * 60_000, open: 1, high: 2, low: 0.5, close: 1.5, volume: 1 }));
    s.provideData("BINANCE:ETHUSDT", "15", eth);
    const r = s.runHistory(bars);
    expect(r.warnings).toEqual([]);
  });

  it("keep the chart-not-set warning, and add to it", () => {
    const { r } = run(other, false);
    expect(r.warnings).toHaveLength(2);
    expect(r.warnings[0]).toContain("chart not set");
    expect(r.warnings[1]).toContain("BINANCE:ETHUSDT");
  });

  it("an empty timeframe on another symbol is requested at the CHART's timeframe", () => {
    const { r } = run('//@version=5\nindicator("t")\nplot(request.security("BINANCE:ETHUSDT", "", close), "eth")\n');
    expect(r.warnings[0]).toContain("BINANCE:ETHUSDT at timeframe 240");
  });
});

describe("request.security(calc_bars_count)", () => {
  // The host's 10 daily bars of another symbol: close 200 + i.
  const DAY = 86_400_000;
  const dailyBars = Array.from({ length: 10 }, (_, i) => ({
    time: Date.UTC(2024, 0, 1) + i * DAY, open: 200 + i, high: 210 + i, low: 190 + i, close: 200 + i, volume: 1 }));
  const other = Array.from({ length: 10 }, (_, i) => ({
    time: Date.UTC(2024, 0, 1) + i * DAY, open: 200 + i, high: 210 + i, low: 190 + i, close: 200 + i, volume: 1 }));

  function runHosted(extra: string, expr = "close") {
    const s = new Session();
    s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "D" });
    s.compile('//@version=5\nindicator("t")\n' +
      `plot(request.security("BINANCE:ETHUSDT", "D", ${expr}, lookahead = barmerge.lookahead_on${extra}), "x")\n`);
    s.provideData("BINANCE:ETHUSDT", "D", other);
    return s.runHistory(dailyBars) as any;
  }

  it("without it every bar is seen", () => {
    expect(values(runHosted(""), "x")).toEqual([200, 201, 202, 203, 204, 205, 206, 207, 208, 209]);
  });

  // TradingView's log (conformance/v5/parity/harness_security_cbc, BTCUSDT 5m):
  // `request.security("60", bar_index, calc_bars_count = 50)` equals the call
  // without it on every row. calc_bars_count has no observable effect.
  it("calc_bars_count = 3 changes nothing: every bar is still seen", () => {
    const r = runHosted(", calc_bars_count = 3");
    expect(values(r, "x")).toEqual([200, 201, 202, 203, 204, 205, 206, 207, 208, 209]);
    expect(r.droppedArguments).toEqual([]);
  });

  it("the expression warms up from the first bar, whatever the count: sma(2) is na only on bar 0", () => {
    const r = runHosted(", calc_bars_count = 3", "ta.sma(close, 2)");
    expect(values(r, "x")).toEqual([null, 200.5, 201.5, 202.5, 203.5, 204.5, 205.5, 206.5, 207.5, 208.5]);
  });

  it("on the chart's own series too, and the argument is not reported as dropped", () => {
    const s = new Session();
    s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "D" });
    s.compile('//@version=5\nindicator("t")\nplot(request.security(syminfo.tickerid, "", close, calc_bars_count = 4), "x")\n');
    const r: any = s.runHistory(dailyBars);
    expect(values(r, "x")).toEqual([200, 201, 202, 203, 204, 205, 206, 207, 208, 209]);
    expect(r.droppedArguments).toEqual([]);
  });

  it("is not reported as dropped on a derived series either", () => {
    const s = new Session();
    s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "240" });
    s.compile('//@version=5\nindicator("t")\nplot(request.security(syminfo.tickerid, "D", close, calc_bars_count = 2), "x")\n');
    const r: any = s.runHistory(bars);
    expect(r.droppedArguments).toEqual([]);
  });
});
