/**
 * request.security over an expression that reads the script's own STATE (`var` globals,
 * `:=` / `+=` updates, a function reading them). (request.security_lower_tf evaluates it in place: see its test below.)
 *
 * TradingView evaluates that state in the requested context: each requested
 * (symbol, timeframe, call) runs its own copy, fed by the requested bars. Probe
 * p_n53 (dev-docs/tv-parity/_probes/triage/r4, BTCUSDT 1h): with
 * `var firstLow = low` and a `flips += 1` counter, request.security("BINANCE:ETHUSDT",
 * timeframe.period, [firstLow, flips]) is ETH's first low and ETH's own count on all
 * 300 captured bars, not the chart's. The same probe shows the same-timeframe
 * request starting at the chart's first bar. Synthetic data here.
 */
import { describe, it, expect, vi } from "vitest";
import { Session } from "../../runtime/v1/session";
import { Context } from "../../runtime/v1/context";

const H = 3600_000;
const t0 = 1_700_000_000_000 - (1_700_000_000_000 % (4 * H));   // on a 4h boundary
const mk = (n: number, close: (i: number) => number, step = H, from = t0) =>
  Array.from({ length: n }, (_, i) => ({ time: from + i * step, open: close(i), high: close(i) + 1, low: close(i) - 1, close: close(i), volume: 1 }));
const bars = mk(12, (i) => 100 + (i % 3));
const eth = mk(12, (i) => 500 + ((i * 7) % 5));

function run(src: string, opts: { data?: Array<[string, string, any[]]>; bars?: any[]; inputs?: Record<string, any>; history?: any } = {}) {
  const s = new Session();
  s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "60" });
  for (const [sym, tf, c] of opts.data ?? []) s.provideData(sym, tf, c);
  const comp = s.compile(src);
  expect(comp.errors).toEqual([]);
  if (opts.inputs) s.setInputs(opts.inputs);
  const r: any = s.runHistory(opts.bars ?? bars, opts.history);
  expect(r.errors).toEqual([]);
  const col = (title: string) => r.series.find((x: any) => x.title === title).data.map((p: any) => p?.value ?? null);
  return { s, r, col, js: (s as any).js as string, logs: r.logs.map((l: any) => l.message) as string[] };
}

describe("request.security runs the script's state in the requested context", () => {
  it("var and += state are the requested symbol's own (probe p_n53)", () => {
    const { col } = run(`//@version=6
indicator("t")
var float firstLow = low
var int flips = 0
if close > close[1] and close[1] <= close[2]
    flips += 1
[a, b] = request.security("BINANCE:ETHUSDT", timeframe.period, [firstLow, flips])
plot(a, "a")
plot(b, "b")
plot(firstLow, "c")
plot(flips, "d")
`, { data: [["BINANCE:ETHUSDT", "60", eth]] });
    // ETH closes 500,502,504,501,503,500,502,504,501,503,500,502: flips on bars 4, 6, 9, 11.
    expect(col("a")).toEqual(Array(12).fill(499));
    expect(col("b")).toEqual([0, 0, 0, 0, 1, 1, 2, 2, 2, 3, 3, 4]);
    // The chart's own state is untouched by the requested runs.
    expect(col("c")).toEqual(Array(12).fill(99));
    expect(col("d")).toEqual([0, 0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3]);
  });

  it("a higher timeframe counts its own bars, as ta.cum does there", () => {
    const { col } = run(`//@version=6
indicator("t")
var int n = 0
n += 1
plot(request.security(syminfo.tickerid, "240", n), "n")
plot(request.security(syminfo.tickerid, "240", ta.cum(1)), "cum")
plot(n, "chart")
`, { bars: mk(16, (i) => 100 + i) });
    expect(col("n")).toEqual(col("cum"));
    expect(col("n")).toEqual([NaN, NaN, NaN, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4].map((x) => Number.isNaN(x) ? null : x));
    expect(col("chart")[15]).toBe(16);
  });

  it("each call has its own copy: two timeframes, two expressions", () => {
    const { col } = run(`//@version=6
indicator("t")
var int n = 0
n += 1
var float hi = high
hi := math.max(hi, high)
plot(request.security(syminfo.tickerid, "120", n), "n2")
plot(request.security(syminfo.tickerid, "240", n), "n4")
plot(request.security(syminfo.tickerid, "240", hi), "hi4")
`, { bars: mk(16, (i) => 100 + i) });
    expect(col("n2")[15]).toBe(8);
    expect(col("n4")[15]).toBe(4);
    expect(col("hi4")[15]).toBe(116);
  });

  it("a function reading the state is evaluated there too", () => {
    const { col } = run(`//@version=6
indicator("t")
var int flips = 0
if close > close[1] and close[1] <= close[2]
    flips += 1
f() => flips * 10
plot(request.security("BINANCE:ETHUSDT", "60", f()), "f")
`, { data: [["BINANCE:ETHUSDT", "60", eth]] });
    expect(col("f")).toEqual([0, 0, 0, 0, 10, 10, 20, 20, 20, 30, 30, 40]);
  });

  it("the requested run reads the inputs the host set", () => {
    const src = `//@version=6
indicator("t")
step = input.int(1, "step")
var int s = 0
s += step
plot(request.security("BINANCE:ETHUSDT", "60", s), "s")
`;
    const s = new Session();
    s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "60" });
    s.provideData("BINANCE:ETHUSDT", "60", eth);
    const comp = s.compile(src);
    expect(comp.errors).toEqual([]);
    s.setInputs({ [comp.inputs[0].id]: 5 });
    const r: any = s.runHistory(bars);
    expect(r.errors).toEqual([]);
    expect(r.series[0].data.map((p: any) => p.value)[11]).toBe(60);
  });

  it("plots, drawings and logs of the requested runs are not output", () => {
    const { r, logs } = run(`//@version=6
indicator("t")
var int n = 0
n += 1
label.new(bar_index, high, str.tostring(n))
log.info("n={0}", n)
plot(request.security("BINANCE:ETHUSDT", "60", n), "eth")
plot(n, "chart")
`, { data: [["BINANCE:ETHUSDT", "60", eth]] });
    expect(r.series.map((x: any) => x.title)).toEqual(["eth", "chart"]);
    expect(logs.length).toBe(12);
    expect(r.drawings.filter((d: any) => d.kind === "label").length).toBe(12);
  });

  it("security_lower_tf does not run the script per intrabar (no TradingView probe of state there)", () => {
    // Running the script in the lower-timeframe context would cost one script execution per
    // intrabar (up to 100,000), and no TradingView probe shows what state read through
    // request.security_lower_tf returns. Until one does, the expression is evaluated in place,
    // as before context runs existed. The request.security call is the control: it does run.
    const spy = vi.spyOn(Context.prototype as any, "runInContext");
    try {
      const ltf = mk(48, (i) => 100 + i, H / 4);
      const { logs } = run(`//@version=6
indicator("t")
var int n = 0
n += 1
count() => n
a = request.security_lower_tf(syminfo.tickerid, "15", count())
c = request.security_lower_tf(syminfo.tickerid, "15", ta.cum(1))
if barstate.islast
    log.info("{0} {1}", str.tostring(a.size()), str.tostring(c))
plot(close)
`, { data: [["BINANCE:BTCUSDT", "15", ltf]] });
      expect(logs).toEqual(["4 [45, 46, 47, 48]"]);
      expect(spy).not.toHaveBeenCalled();
      run(`//@version=6
indicator("t")
var int n = 0
n += 1
plot(request.security(syminfo.tickerid, "240", n), "n")
`, { bars: mk(16, (i) => 100 + i) });
      expect(spy).toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });

  it("a call that reads no state keeps the plain deferred expression", () => {
    const { js } = run(`//@version=6
indicator("t")
var int k = 0
x = ta.sma(close, 3)
plot(request.security("BINANCE:ETHUSDT", "60", x + k), "x")
`, { data: [["BINANCE:ETHUSDT", "60", eth]] });
    expect(js).not.toContain("ctx.inContext(");
  });

  it("a live bar re-runs the requested state from its rollback point on every tick", () => {
    const s = new Session();
    s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "60" });
    const comp = s.compile(`//@version=6
indicator("t")
var int n = 0
n += 1
var float mx = 0.0
mx := math.max(mx, close)
[a, b] = request.security(syminfo.tickerid, "240", [n, mx])
plot(a, "a")
plot(b, "b")
`);
    expect(comp.errors).toEqual([]);
    const hist = mk(14, (i) => 100 + i);
    const r: any = s.runHistory(hist, { realtimeFollows: true });
    expect(r.errors).toEqual([]);
    const t = hist[13].time + H;   // 15th hour: inside the 4th 4h bar
    s.tick({ time: t, open: 1, high: 500, low: 0, close: 400, volume: 1 });
    s.tick({ time: t, open: 1, high: 500, low: 0, close: 300, volume: 1 });
    const d: any = s.tick({ time: t, open: 1, high: 500, low: 0, close: 200, volume: 1 });
    const a = d.series[0].value;
    const b = d.series[1].value;
    // The forming 4h bar is counted once, and its max is the last tick's, not the 400 an earlier tick saw.
    expect(a).toBe(4);
    expect(b).toBe(200);
  });
});
