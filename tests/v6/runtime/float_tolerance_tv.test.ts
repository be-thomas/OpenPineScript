/**
 * Float comparison tolerance, from TradingView Pine Logs (BINANCE:BTCUSDT 1h):
 *   dev-docs/tv-parity/_probes/float-eq/20261110-024725_BINANCE_BTCUSDT_1h/pine_logs.json
 *   dev-docs/tv-parity/_probes/float-eq/20261110-024911_BINANCE_BTCUSDT_1h/pine_logs.json
 * Two numbers are equal iff |a - b| <= 1e-10 (absolute, at any magnitude);
 * `<` is "less and not equal", `<=` is "less or equal", at every version v1-v6
 * (_probes/float-eq-versions). math.sign is EXACT (_probes/sign-tiny: sign(+-5.55e-17) = +-1).
 * ta.mfi uses the same rule to classify a bar as up or down.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const bars = (n: number) => Array.from({ length: n }, (_, i) => ({
  time: 1_700_000_000 + i * 3600, open: 100, high: 101, low: 99, close: 100, volume: 1,
}));

function logs(src: string): string[] {
  const s = new Session();
  expect(s.compile(src).errors).toEqual([]);
  const r: any = s.runHistory(bars(2));
  expect(r.errors).toEqual([]);
  return r.logs.map((l: any) => l.message);
}

/** The last bar's value of every plot, by title (v1-v4 have no log.*). */
function logsOldSyntax(src: string): Record<string, number> {
  const s = new Session();
  expect(s.compile(src).errors).toEqual([]);
  const r: any = s.runHistory(bars(2));
  expect(r.errors).toEqual([]);
  const o: Record<string, number> = {};
  for (const ser of r.series) { const d = ser.data[ser.data.length - 1]; o[ser.title] = d?.value ?? d; }
  return o;
}

const CASES: [string, boolean][] = [
  ["0.1 + 0.2 == 0.3", true],
  ["1e-14 == 0", true],
  ["1e-300 == 0", true],
  ["75 == 75 + 1e-13", true],
  ["75 == 75 + 1e-12", true],
  ["75 == 75 + 1e-11", true],
  ["75 == 75 + 1e-10", false],
  ["0 == 0 + 1e-10", true],
  ["0 == 1.1e-10", false],
  ["75 == 75 * (1 + 1e-12)", true],
  ["75 == 75 * (1 + 1e-11)", false],
  ["1e-6 == 1e-6 * (1 + 1e-12)", true],
  ["1e-12 == 2e-12", true],
  ["1e-11 == 9e-11", true],
  ["1e6 == 1e6 + 5e-11", true],
  ["1e6 == 1e6 + 1e-10", false],
  ["x < x * (1 + 1e-14)", false],
  ["x > x * (1 - 1e-14)", false],
  ["x <= x * (1 - 1e-14)", true],
  ["x >= x * (1 + 1e-14)", true],
  ["x != x * (1 + 1e-14)", false],
  ["x < x + 1", true],
  ["x > x + 1", false],
  ["d > 0", false],
  ["d == 0", true],
  ["3 == 3", true],
  ["3.0 == 3", true],
  ["0.0 == 1e-9", false],
];

describe("float comparisons use TradingView's 1e-10 absolute tolerance", () => {
  it("v6: every probed case", () => {
    const body = CASES.map(([e], i) => `    log.info("${i}:{0}", ${e} ? 1 : 0)`).join("\n");
    const out = logs(`//@version=6
indicator("tol")
x = 75.0
d = (75.32 + 75.21 + 75.24) / 3 - (75.28 + 75.21 + 75.28) / 3
if barstate.islast
${body}
    log.info("sign:{0}", math.sign(1e-11))
    log.info("sign2:{0}", math.sign(-5.55e-17))
    log.info("sign3:{0}", math.sign(-1e-9))
plot(close)
`);
    CASES.forEach(([e, want], i) => expect([e, out[i]]).toEqual([e, `${i}:${want ? 1 : 0}`]));
    expect(out.slice(CASES.length)).toEqual(["sign:1", "sign2:-1", "sign3:-1"]);
  });

  // Every version (float-eq-versions/01_fe-v1 .. 06_fe-v6): x == x + 5e-11 is true, x == x + 1.1e-10
  // is false, x < x + 5e-11 is false; sign() stays exact (sign-tiny).
  describe.each([1, 2, 3, 4, 5, 6])("v%i", (version) => {
    it("matches TradingView's probes", () => {
      const head = version >= 5 ? `//@version=${version}\nindicator("tol")\n` : `//@version=${version}\nstudy("tol")\n`;
      const sg = version >= 5 ? "math.sign" : "sign";
      expect(logsOldSyntax(head + `x = close * 0 + 75.0
plot(x == x + 5e-11 ? 1 : 0, "eq5e11")
plot(x == x + 1.1e-10 ? 1 : 0, "eq11e11")
plot(x < x + 5e-11 ? 1 : 0, "lt5e11")
plot(${sg}(x * 1e-12), "sign")
`)).toEqual({ eq5e11: 1, eq11e11: 0, lt5e11: 0, sign: 1 });
    });
  });

  it("chained comparisons and na keep their meaning", () => {
    const out = logs(`//@version=6
indicator("misc")
float n = na
if barstate.islast
    log.info("a:{0}", (1 < 2) == (2 < 3) ? 1 : 0)
    log.info("b:{0}", n < 1 ? 1 : 0)
    log.info("c:{0}", n == n ? 1 : 0)
    log.info("d:{0}", "a" == "a" ? 1 : 0)
plot(close)
`);
    expect(out).toEqual(["a:1", "b:0", "c:0", "d:1"]);
  });
});

describe("ta.mfi counts a bar as up/down only past the tolerance", () => {
  const mk = (h: number, l: number, c: number, v: number, i: number) =>
    ({ time: 1_700_000_000 + i * 60, open: c, high: h, low: l, close: c, volume: v });
  // 14 earlier bars, then the two probe bars at indices 14 and 15.
  const data: any[] = [];
  for (let i = 0; i < 14; i++) data.push(mk(70 + i, 69 + i * 0.9, 69.5 + i * 0.95 + (i % 3) * 0.3, 100 + i * 7, i));
  data.push(mk(75.32, 75.21, 75.24, 120, 14));
  data.push(mk(75.28, 75.21, 75.28, 150, 15));

  it("matches the hand computation with bar 15 neither up nor down", () => {
    const hlc3 = data.map((b) => (b.high + b.low + b.close) / 3);
    // The two probe bars' hlc3 differ by ~1e-14.
    expect(Math.abs(hlc3[15] - hlc3[14])).toBeLessThan(1e-10);
    const sums = (upTol: (d: number) => number) => {
      let pos = 0, neg = 0;
      for (let i = 2; i <= 15; i++) { // window of 14 bars ending at 15
        const d = upTol(hlc3[i] - hlc3[i - 1]);
        const mf = hlc3[i] * data[i].volume;
        if (d > 0) pos += mf; else if (d < 0) neg += mf;
      }
      return 100 - 100 / (1 + pos / neg);
    };
    const tolerant = sums((d) => (Math.abs(d) <= 1e-10 ? 0 : d));
    const strict = sums((d) => d);
    expect(Math.abs(tolerant - strict)).toBeGreaterThan(1e-6);

    const s = new Session();
    expect(s.compile(`//@version=6
indicator("mfi")
m = ta.mfi(hlc3, 14)
if barstate.islast
    log.info("{0}", str.tostring(m))
plot(m)
`).errors).toEqual([]);
    const r: any = s.runHistory(data);
    expect(r.errors).toEqual([]);
    expect(Number(r.logs[0].message)).toBeCloseTo(tolerant, 9);
  });
});
