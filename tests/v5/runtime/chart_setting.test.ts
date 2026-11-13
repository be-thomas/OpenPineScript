/**
 * The host tells the engine the chart (`Session.setChart`), and `time()` reads
 * its session in a timezone.
 *
 * Zeal Terminal never told the engine the timeframe, so every chart ran as
 * "D" on a symbol called SYMBOL, and `time(tf, "0300-0400", "America/New_York")`
 * ignored its zone. TradingView's log for the ICT Silver Bullet script (see
 * conformance/common/ict_silver_bullet_golden.test.ts) opens that window at
 * 07:00 UTC on 2026-10-05, which is EDT.
 */
import { describe, it, expect } from "vitest";
import { Session, runScript } from "../../../runtime/v1/session";

const bar = (time: number) => ({ time, open: 1, high: 2, low: 0.5, close: 1.5, volume: 1 });
const T0 = Date.UTC(2026, 9, 5, 0, 0);
const candles = Array.from({ length: 3 }, (_, i) => bar(T0 + i * 300_000));

const PROBE = `//@version=5
indicator("probe")
if barstate.islast
    log.info("period=" + timeframe.period + " secs=" + str.tostring(timeframe.in_seconds()) + " intraday=" + str.tostring(timeframe.isintraday) + " daily=" + str.tostring(timeframe.isdaily) + " id=" + syminfo.tickerid + " prefix=" + syminfo.prefix + " ticker=" + syminfo.ticker + " type=" + syminfo.type + " mintick=" + str.tostring(syminfo.mintick))
`;
const CHART = { symbol: "BINANCE:BTCUSDT", timeframe: "5", type: "crypto", mintick: 0.01, timezone: "Etc/UTC" };
const EXPECT = "period=5 secs=300 intraday=true daily=false id=BINANCE:BTCUSDT prefix=BINANCE ticker=BTCUSDT type=crypto mintick=0.01";

const lastLog = (r: { logs: Array<{ message?: string }> }) => String(r.logs[r.logs.length - 1]?.message);

describe("Session.setChart", () => {
  it("is what the script sees, with no warning", () => {
    const s = new Session();
    s.setChart(CHART);
    expect(s.compile(PROBE).errors).toEqual([]);
    const r = s.runHistory(candles);
    expect(r.errors).toEqual([]);
    expect(lastLog(r)).toBe(EXPECT);
    expect(r.warnings).toEqual([]);
  });

  it("survives two runHistory calls", () => {
    const s = new Session();
    s.setChart(CHART);
    s.compile(PROBE);
    expect(lastLog(s.runHistory(candles))).toBe(EXPECT);
    expect(lastLog(s.runHistory(candles))).toBe(EXPECT);
  });

  it("reaches the compile dry run", () => {
    const src = `//@version=5\nindicator(timeframe.period == "5" ? "five" : "other")\nplot(close)\n`;
    const s = new Session();
    s.setChart(CHART);
    expect(s.compile(src).meta?.title).toBe("five");
    const unset = new Session();
    expect(unset.compile(src).meta?.title).toBe("other");
  });

  it("warns when the host never set it, and says which defaults apply", () => {
    const s = new Session();
    s.compile(PROBE);
    const r = s.runHistory(candles);
    expect(r.warnings).toEqual(["chart not set: timeframe defaults to D and symbol to SYMBOL — call Session.setChart"]);
    expect(lastLog(r)).toContain("period=D");
  });

  it("runScript takes the same chart as an option", () => {
    const r = runScript(PROBE, { candles, chart: CHART });
    expect(lastLog(r)).toBe(EXPECT);
    expect(r.warnings).toEqual([]);
    expect(runScript(PROBE, { candles }).warnings.length).toBe(1);
  });

  it.each(["5m", "1H", "", "h", "0", "-5", "5 "])("rejects %j", (timeframe) => {
    expect(() => new Session().setChart({ symbol: "X", timeframe })).toThrow(/Pine timeframe/);
  });

  it.each(["1", "5", "60", "240", "D", "W", "M", "12M", "1S"])("accepts %s", (timeframe) => {
    expect(() => new Session().setChart({ symbol: "X", timeframe })).not.toThrow();
  });
});

describe("time() evaluates its session in the timezone", () => {
  const SRC = `//@version=5
indicator("tz")
plot(na(time("1", "1000-1100", "America/New_York")) ? 0 : 1)
`;
  const inside = (utc: number) => {
    const r = runScript(SRC, { candles: [bar(utc)], chart: { symbol: "X", timeframe: "1" } });
    expect(r.errors).toEqual([]);
    return r.series[0].data[0]?.value;
  };
  const at = (y: number, mo: number, d: number, h: number) => Date.UTC(y, mo - 1, d, h, 0);

  it("14:00 UTC is inside in EDT, 10:00 UTC is outside", () => {
    expect(inside(at(2026, 10, 5, 14))).toBe(1);
    expect(inside(at(2026, 10, 5, 10))).toBe(0);
  });
  it("15:00 UTC is inside in EST", () => {
    expect(inside(at(2026, 12, 7, 15))).toBe(1);
    expect(inside(at(2026, 12, 7, 14))).toBe(0);
  });

  it("without a timezone argument it uses the symbol's exchange timezone", () => {
    const src = `//@version=5\nindicator("tz")\nplot(na(time("1", "1000-1100")) ? 0 : 1)\n`;
    const run = (timezone?: string) =>
      runScript(src, { candles: [bar(at(2026, 10, 5, 14))], chart: { symbol: "X", timeframe: "1", timezone } }).series[0].data[0]?.value;
    expect(run("America/New_York")).toBe(1);
    expect(run("Etc/UTC")).toBe(0);
    expect(run()).toBe(0);
  });

  it("the day mask is read in the zone too", () => {
    // Mon 2026-10-05 02:00 UTC is still Sunday 22:00 in New York.
    const src = `//@version=5\nindicator("tz")\nplot(na(time("1", "0000-2359:1", "America/New_York")) ? 0 : 1)\n`;
    const r = runScript(src, { candles: [bar(at(2026, 10, 5, 2))], chart: { symbol: "X", timeframe: "1" } });
    expect(r.series[0].data[0]?.value).toBe(1);
  });
});
