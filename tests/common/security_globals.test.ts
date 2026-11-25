/**
 * A global read inside `security()` is computed on the REQUESTED timeframe.
 * TradingView (BINANCE:BTCUSDT 1h chart, "240" requested, v4 and v5, all 300
 * bars, dev-docs/tv-parity/_probes/security-globals/p_secglob_v{4,5}.pine) gave
 *
 *     src = input(close);  s2 = input(hl2);  m = close * 2;  f(x) => x[1]
 *     security(.., "240", src[1])  == security(.., "240", close[1])
 *     security(.., "240", f(src))  == security(.., "240", close[1])
 *     security(.., "240", s2)      == security(.., "240", hl2)
 *     security(.., "240", m[1])    == 2 * security(.., "240", close[1])
 *
 * The engine read the chart's own value there (and the chart's previous hourly
 * close for `src[1]`). A stateful global read twice in one expression must not
 * share one state: `e - e[1]` with `e = ema(close, 3)` is two reads of `e`.
 */
import { describe, it, expect } from "vitest";
import { Session, type Candle } from "../../runtime/v1/session";

// Not symmetric around close, so hl2 on 4h differs from hl2 on its last hour.
const bars: Candle[] = Array.from({ length: 60 }, (_, i) => {
  const close = 100 + i + ((i * i) % 17);
  return {
    time: Date.UTC(2025, 0, 1, i), open: close - 1,
    high: close + 1 + (i % 5), low: close - 0.5 - ((i * 3) % 4), close, volume: 1,
  };
});

function run(version: number) {
  const v5 = version >= 5;
  const tid = version >= 4 ? "syminfo.tickerid" : "tickerid";
  const sec = (e: string) => `${v5 ? "request.security" : "security"}(${tid}, "240", ${e})`;
  const ema = (a: string) => `${v5 ? "ta.ema" : "ema"}(${a}, 3)`;
  const inp = (d: string, t: string) => (v5 ? `input.source(${d}, "${t}")` : `input(${d})`);
  const head = `//@version=${version}\n${v5 ? "indicator" : "study"}("sg v${version}")\n`;
  const s = new Session();
  s.setChart({ timeframe: "60", symbol: "BINANCE:BTCUSDT" });
  const c = s.compile(`${head}src = ${inp("close", "src")}
s2 = ${inp("hl2", "s2")}
m = close * 2
e = ${ema("close")}
f(x) => x[1]
fp(src, n) => ${ema("src[1]").replace(", 3)", ", n)")}
gs(m) => ${sec("m")}
plot(${sec("close[1]")}, "c1")
plot(${sec("src[1]")}, "src1")
plot(${sec("f(src)")}, "fsrc")
plot(${sec("hl2")}, "hl2")
plot(${sec("s2")}, "s2")
plot(${sec("m[1]")}, "m1")
plot(${sec(ema("close"))}, "ema")
plot(${sec("e")}, "e")
plot(${sec(`${ema("close")} - ${ema("close")}[1]`)}, "dema")
plot(${sec("e - e[1]")}, "de")
plot(${sec("fp(src, 3)")}, "fp")
plot(${sec(ema("close[1]"))}, "fpref")
plot(gs(close), "gs")
plot(${sec("close")}, "c0")
`);
  if (c.errors.length) throw new Error(c.errors.map((x: any) => x.message).join("; "));
  const r = s.runHistory(bars);
  return (t: string): number[] => r.series.find(x => x.title === t)!.data.map((d: any) => d?.value ?? NaN);
}

describe.each([2, 3, 4, 5, 6])("v%i security() reads globals on the requested timeframe", (version) => {
  const col = run(version);

  it("src[1] and f(src) are close[1] on 4h", () => {
    const c1 = col("c1");
    expect(c1.filter(Number.isFinite).length).toBeGreaterThan(10);
    expect(col("src1")).toEqual(c1);
    expect(col("fsrc")).toEqual(c1);
  });

  it("an input defaulting to hl2 is hl2 on 4h", () => {
    const h = col("hl2");
    expect(h.filter(Number.isFinite).length).toBeGreaterThan(10);
    expect(col("s2")).toEqual(h);
  });

  it("m[1] is 2 * close[1] on 4h", () => {
    expect(col("m1")).toEqual(col("c1").map(x => x * 2));
  });

  it("a function parameter named like a global does not block the global", () => {
    const ref = col("fpref");
    expect(ref.filter(Number.isFinite).length).toBeGreaterThan(10);
    expect(col("fp")).toEqual(ref);
  });

  it("a security() inside a function reads that function's own parameter", () => {
    // The parameter, not the global `m = close * 2` (that would be 2 * close).
    // How a parameter read inside security() resolves is its own matter (v2
    // differs from v3+), so only the not-inlined part is pinned.
    const g = col("gs");
    expect(g.filter(Number.isFinite).length).toBeGreaterThan(10);
    expect(g.some((x, i) => Number.isFinite(x) && x === col("c0")[i] * 2)).toBe(false);
    if (version >= 3) expect(g).toEqual(col("c0"));
  });

  it("a stateful global read twice keeps one state per read", () => {
    expect(col("e")).toEqual(col("ema"));
    expect(col("de")).toEqual(col("dema"));
    expect(col("dema").filter(x => Number.isFinite(x) && x !== 0).length).toBeGreaterThan(5);
  });
});

// ---- inputs the host overrides, reference globals, and v1 ----

function plots(version: number, body: string, inputs: Record<string, any> = {}) {
  const v5 = version >= 5;
  const head = `//@version=${version}\n${v5 ? "indicator" : "study"}("sg")\n`;
  const s = new Session();
  s.setChart({ timeframe: "60", symbol: "BINANCE:BTCUSDT" });
  s.compile(head + body);
  s.setInputs(inputs);
  const r = s.runHistory(bars);
  return (t: string): number[] => r.series.find(x => x.title === t)!.data.map((d: any) => d?.value ?? NaN);
}

describe.each([4, 5, 6])("v%i security() and input overrides", (version) => {
  const sec = (e: string) => `${version >= 5 ? "request.security" : "security"}(syminfo.tickerid, "240", ${e})`;
  const src = (d: string) => (version >= 5 ? `input.source(${d}, "x")` : `input(${d})`);

  it("a constant-default input is read as the global, so the override applies", () => {
    const body = `k = input(-2.0)\nplot(${sec("close * k")}, "o")\nplot(${sec("close")}, "c")\n`;
    const c = plots(version, body)("c");
    expect(plots(version, body)("o").slice(10)).toEqual(c.slice(10).map(x => x * -2));
    expect(plots(version, body, { input_0: 5 })("o").slice(10)).toEqual(c.slice(10).map(x => x * 5));
  });

  it("a series-default input is the default unless overridden, then the override", () => {
    const body = `s = ${src("close")}\nplot(${sec("s")}, "o")\nplot(${sec("close")}, "c")\n`;
    const c = plots(version, body)("c");
    expect(plots(version, body)("o")).toEqual(c);
    expect(plots(version, body, { input_0: 123 })("o").slice(10)).toEqual(c.slice(10).map(() => 123));
  });
});

describe.each([5, 6])("v%i security() reads a global array from the chart", (version) => {
  it("array.size of a pushed array is not 0", () => {
    const body = `a = array.new_float(0)\narray.push(a, close)\n` +
      `plot(request.security(syminfo.tickerid, "240", array.size(a)), "n")\n`;
    const n = plots(version, body)("n");
    expect(n[n.length - 1]).toBeGreaterThan(0);
  });
});

// TradingView run v1 of _probes/security-globals: every plot equals v2's on the closed bars.
describe.each([1, 2])("v%i security() reads a global on the requested timeframe", (version) => {
  it("m = close * 2 is 2 * the 4h close", () => {
    const body = `m = close * 2\nplot(security(tickerid, "240", m), "o")\nplot(security(tickerid, "240", close), "c")\n`;
    const col = plots(version, body);
    expect(col("o").slice(10)).toEqual(col("c").slice(10).map(x => x * 2));
  });
});
