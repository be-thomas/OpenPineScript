/**
 * Object references through tuples and request.security, the function forms of
 * syminfo.ticker / syminfo.prefix, request.security over globals defined by
 * if / switch expressions, and calc_bars_count with a live bar and with
 * requested series. From TradingView captures (popular-author batch
 * 2026-11-21, v6; probe P3 for the live bar), on synthetic data.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../runtime/v1/session";

const H = 3600_000;
const t0 = 1_700_000_000_000;
const mk = (n: number, close: (i: number) => number, step = H, from = t0) =>
  Array.from({ length: n }, (_, i) => ({ time: from + i * step, open: close(i), high: close(i) + 1, low: close(i) - 1, close: close(i), volume: 1 }));
const bars = mk(12, (i) => 100 + i);
const other = mk(12, (i) => 500 + i);

function run(src: string, opts: { data?: Array<[string, string, any[]]>; bars?: any[]; history?: any } = {}) {
  const s = new Session();
  s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "60" });
  for (const [sym, tf, c] of opts.data ?? []) s.provideData(sym, tf, c);
  const comp = s.compile(src);
  expect(comp.errors).toEqual([]);
  const r: any = s.runHistory(opts.bars ?? bars, opts.history);
  expect(r.errors).toEqual([]);
  return { s, r, logs: r.logs.map((l: any) => l.message) as string[] };
}

describe("objects survive tuples and request.security, v6", () => {
  it("a UDT returned in a tuple is the object, not na", () => {
    const { logs } = run(`//@version=6
indicator("t")
type Snap
    float c
f() =>
    [true, Snap.new(close)]
[ok, snap] = f()
if barstate.islast
    log.info("ok={0} c={1}", ok, snap.c)
plot(close)
`);
    expect(logs).toEqual(["ok=true c=111"]);
  });

  it("a UDT returned by request.security is the object, not na", () => {
    const { logs } = run(`//@version=6
indicator("t")
type Snap
    float c
snap() => Snap.new(close)
if barstate.islast
    s = request.security("BINANCE:ETHUSDT", "60", snap())
    log.info("c={0}", s.c)
plot(close)
`, { data: [["BINANCE:ETHUSDT", "60", other]] });
    expect(logs).toEqual(["c=511"]);
  });
});

describe("syminfo.ticker and syminfo.prefix with a symbol, v6", () => {
  it("answer for the argument; without one, for the chart", () => {
    const { logs } = run(`//@version=6
indicator("t")
if barstate.islast
    log.info("{0}|{1}|{2}|{3}|{4}|{5}", syminfo.ticker("XAUUSD"), syminfo.ticker("OANDA:XAUUSD"), syminfo.prefix("OANDA:XAUUSD"), syminfo.ticker, syminfo.prefix, syminfo.ticker(syminfo.tickerid))
plot(close)
`);
    expect(logs).toEqual(["XAUUSD|XAUUSD|OANDA|BTCUSDT|BINANCE|BTCUSDT"]);
  });
});

describe("request.security re-evaluates globals defined by if / switch expressions, v6", () => {
  it("a switch-defined global is computed on the requested symbol's data", () => {
    const { logs } = run(`//@version=6
indicator("t")
mode = input.string("A", "m", ["A", "B"])
float v = switch mode
    "A" => close * 2
    "B" => close
w = v
if barstate.islast
    log.info("sec={0} chart={1}", request.security("BINANCE:ETHUSDT", "60", w), w)
plot(close)
`, { data: [["BINANCE:ETHUSDT", "60", other]] });
    expect(logs).toEqual(["sec=1,022 chart=222"]);
  });

  it("an if-defined global too", () => {
    const { logs } = run(`//@version=6
indicator("t")
flag = input.bool(true, "f")
float v = if flag
    close + 1
else
    close
w = v
if barstate.islast
    log.info("sec={0} chart={1}", request.security("BINANCE:ETHUSDT", "60", w), w)
plot(close)
`, { data: [["BINANCE:ETHUSDT", "60", other]] });
    expect(logs).toEqual(["sec=512 chart=112"]);
  });
});

describe("calc_bars_count, v6", () => {
  const many = mk(120, (i) => 1 + i);

  it("counts the live bar: history runs N - 1 closed bars, the live bar is bar_index N - 1", () => {
    const s = new Session();
    expect(s.compile(`//@version=6\nindicator("t", calc_bars_count = 50)\nplot(bar_index, "bi")\n`).errors).toEqual([]);
    const r: any = s.runHistory(many, { realtimeFollows: true });
    const bi = r.series.find((x: any) => x.title === "bi").data.map((p: any) => p?.value ?? null);
    expect(bi.slice(0, 71).every((x: any) => x === null)).toBe(true);
    expect(bi[71]).toBe(0);
    expect(bi[119]).toBe(48);
    const d = s.tick({ time: many[119].time + H, open: 1, high: 2, low: 0, close: 5, volume: 1 });
    expect(d.series[0].value).toBe(49);
  });

  it("requested series start at the chart's first run bar", () => {
    const longer = mk(150, () => 1, H, t0 - 30 * H);   // 30 bars before the chart's first
    const { logs } = run(`//@version=6
indicator("t", calc_bars_count = 50)
if barstate.islast
    log.info("cum={0}", request.security("BINANCE:ETHUSDT", "60", ta.cum(close)))
plot(close)
`, { data: [["BINANCE:ETHUSDT", "60", longer]], bars: many });
    expect(logs).toEqual(["cum=50"]);
  });

  it("without calc_bars_count a same-timeframe request still starts at the chart's first bar", () => {
    // TradingView probe p_n53 (dev-docs/tv-parity/_probes/triage/r4): ETH's 1h context on a
    // BTC 1h chart starts at the chart's first bar, years of earlier ETH bars notwithstanding.
    const longer = mk(150, () => 1, H, t0 - 30 * H);
    const { logs } = run(`//@version=6
indicator("t")
if barstate.islast
    log.info("cum={0}", request.security("BINANCE:ETHUSDT", "60", ta.cum(close)))
plot(close)
`, { data: [["BINANCE:ETHUSDT", "60", longer]], bars: many });
    expect(logs).toEqual(["cum=120"]);
  });

  it("without calc_bars_count a higher timeframe starts at the first supplied bar", () => {
    const longer = mk(40, () => 1, 4 * H, t0 - 40 * H);   // 10 four-hour bars before the chart's first
    const { logs } = run(`//@version=6
indicator("t")
if barstate.islast
    log.info("cum={0}", request.security("BINANCE:ETHUSDT", "240", ta.cum(close)))
plot(close)
`, { data: [["BINANCE:ETHUSDT", "240", longer]], bars: many });
    expect(logs).toEqual(["cum=40"]);   // 10 before the chart + 30 alongside it
  });
});

describe("request.security on a realtime bar (probe t05), v6", () => {
  // chart 1h, 8 closed bars (a 4h bar every 4); the live bar is inside the third 4h bar
  const hist = mk(8, (i) => 100 + i);
  const h4 = (last: number) => [...mk(2, (i) => 200 + i, 4 * H), { time: t0 + 8 * H, open: 300, high: 310, low: 290, close: last, volume: 1 }];
  const src = `//@version=6
indicator("t")
type S
    float c
h = request.security(syminfo.tickerid, "240", close)
il = request.security(syminfo.tickerid, "240", barstate.islast)
u = request.security(syminfo.tickerid, "240", S.new(close))
plot(h, "h")
plot(il ? 1 : 0, "il")
plot(na(u) ? -1 : u.c, "u")
`;

  it("returns the forming higher-timeframe bar on every tick, with islast true and a UDT intact", () => {
    const s = new Session();
    s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "60" });
    s.provideData("BINANCE:BTCUSDT", "240", h4(305));
    expect(s.compile(src).errors).toEqual([]);
    const r: any = s.runHistory(hist);
    expect(r.errors).toEqual([]);
    const live = { time: t0 + 8 * H, open: 300, high: 310, low: 290, close: 305, volume: 1 };
    const d1 = s.tick(live);
    expect(d1.series.map((x: any) => x.value)).toEqual([305, 1, 305]);
    s.provideData("BINANCE:BTCUSDT", "240", h4(307));
    const d2 = s.tick({ ...live, close: 307 });
    expect(d2.series.map((x: any) => x.value)).toEqual([307, 1, 307]);
  });
});

describe("table.new at an occupied position (probe t03), v6", () => {
  it("deletes the older table: two at top_right and one at bottom_left leave 2", () => {
    const { logs } = run(`//@version=6
indicator("t", overlay = true)
if barstate.islast
    t1 = table.new(position.top_right, 1, 1, bgcolor = color.red)
    t1.cell(0, 0, "one")
    t2 = table.new(position.top_right, 1, 1, bgcolor = color.green)
    t2.cell(0, 0, "two")
    t3 = table.new(position.bottom_left, 1, 1)
    t3.cell(0, 0, "three")
    log.info("tables={0}", table.all.size())
plot(close)
`);
    expect(logs).toEqual(["tables=2"]);
  });
});

describe("time(timeframe, session, tz) anchors intraday buckets at the session start (probe t04), v6", () => {
  it("1h chart, 0930-1600 New York", () => {
    const start = Date.UTC(2026, 10, 19, 14);   // 09:00 New York (EST)
    const day = mk(10, () => 1, H, start);
    const { logs } = run(`//@version=6
indicator("t")
fmt(t) => na(t) ? "na" : str.format_time(t, "HH:mm", "America/New_York")
t1 = time(timeframe.period, "0930-1600", "America/New_York")
t2 = time("60", "0930-1600", "America/New_York")
t3 = time("30", "0930-1600", "America/New_York")
log.info("{0} {1} {2} {3}", str.format_time(time, "HH:mm", "America/New_York"), fmt(t1), fmt(t2), fmt(t3))
plot(close)
`, { bars: day });
    expect(logs).toEqual([
      "09:00 na na na", "10:00 09:30 09:30 10:00", "11:00 10:30 10:30 11:00", "12:00 11:30 11:30 12:00",
      "13:00 12:30 12:30 13:00", "14:00 13:30 13:30 14:00", "15:00 14:30 14:30 15:00", "16:00 na na na",
      "17:00 na na na", "18:00 na na na",
    ]);
  });
});

describe("request.security_lower_tf assigns an intrabar to the chart bar its close falls in (probe t08), v6", () => {
  it("45m on a 1h chart: each intrabar once, in (open, end]", () => {
    const start = Date.UTC(2026, 10, 21);
    const chart = mk(8, () => 1, H, start);
    const m45 = mk(12, () => 1, 45 * 60_000, start);
    const { logs } = run(`//@version=6
indicator("t")
t = request.security_lower_tf(syminfo.tickerid, "45", time)
log.info("n={0} first={1} last={2}", array.size(t), array.size(t) > 0 ? str.format_time(array.first(t), "HH:mm", "UTC") : "-", array.size(t) > 0 ? str.format_time(array.last(t), "HH:mm", "UTC") : "-")
plot(close)
`, { bars: chart, data: [["BINANCE:BTCUSDT", "45", m45]] });
    expect(logs.slice(2, 6)).toEqual([
      "n=2 first=01:30 last=02:15", "n=1 first=03:00 last=03:00", "n=1 first=03:45 last=03:45", "n=2 first=04:30 last=05:15",
    ]);
  });
});

describe("na() of a division by zero (probe v2), v6", () => {
  it("na() is true for Infinity and NaN alike", () => {
    const { logs } = run(`//@version=6
indicator("t")
z = bar_index - bar_index
zf = close - close
a = close / zf
b = zf / zf
c = 1 / z
d = 7 % z
if barstate.islast
    log.info("na(a)={0} na(b)={1} na(c)={2} na(d)={3} na(1)={4}", na(a), na(b), na(c), na(d), na(1))
plot(close)
`);
    expect(logs).toEqual(["na(a)=true na(b)=true na(c)=true na(d)=true na(1)=false"]);
  });
});

// TradingView probe pr33-review/na-inf (BINANCE:BTCUSDT 1h, 300 bars): for x = close / (close - close),
// na(x) is 1, nz(x, -1) is -1 and x > 0 is 1 on every bar, at v6 and at v5. Only these two versions.
describe.each([5, 6])("nz() of a division by zero replaces it, as na() sees it (probe na-inf), v%i", (v) => {
  it("na(x) true, nz(x, -1) = -1, x > 0 true", () => {
    const { logs } = run(`//@version=${v}
indicator("t")
z = close - close
x = close / z
if barstate.islast
    log.info("na={0} nz={1} pos={2}", na(x) ? 1 : 0, nz(x, -1), x > 0 ? 1 : 0)
plot(close)
`);
    expect(logs).toEqual(["na=1 nz=-1 pos=1"]);
  });
});

// The same on v1, v3 and v4 (TradingView, BINANCE:BTCUSDT 1h, 300 bars: na 1, nz -1, pos 1 on every bar).
describe.each([["1", ""], ["3", "//@version=3\n"], ["4", "//@version=4\n"]])("nz() of a division by zero, v%s", (_v, head) => {
  it("na(x) true, nz(x, -1) = -1, x > 0 true on every bar", () => {
    const { r } = run(`${head}study("t")
x = close / (close - close)
plot(na(x) ? 1 : 0, title="na")
plot(nz(x, -1), title="nz")
plot(x > 0 ? 1 : 0, title="pos")
`);
    const cols = r.series.map((x: any) => x.data.map((p: any) => p?.value ?? NaN));
    expect(cols.length).toBe(3);
    for (const [i, want] of [1, -1, 1].entries()) expect(new Set(cols[i])).toEqual(new Set([want]));
  });
});
