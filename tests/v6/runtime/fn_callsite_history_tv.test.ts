/**
 * `v[n]` on a variable declared outside a user function keeps one history per
 * CALL SITE, recorded only when that call runs. From TradingView Pine Logs
 * (BTCUSDT 1h):
 *   dev-docs/tv-parity/_probes/fn-history/pine_logs.json
 * Built-in series (`close[1]`) keep bar semantics inside functions.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const body = `var float v = 0.0
v := bar_index * 10
f() => [v[1], close[1]]
g() => v[1]
float a = na
float b = na
float c = na
float d = na
if bar_index % 3 == 0
    [x, y] = f()
    a := x
    b := y
    c := g()
if bar_index % 2 == 0
    d := g()
`;
const logLine = `log.info("bi={0} a={1} b={2} c={3} d={4}", bar_index, a, b, c, d)\nplot(a)\n`;

const closes = Array.from({ length: 14 }, (_, i) => 100 + ((i * 7) % 13));
const bars = closes.map((close, i) => ({
  time: 1_700_000_000 + i * 3600, open: close, high: close + 1, low: close - 1, close, volume: 1,
}));

function run(src: string): Record<string, any>[] {
  const s = new Session();
  expect(s.compile(src).errors).toEqual([]);
  const r: any = s.runHistory(bars);
  expect(r.errors).toEqual([]);
  return r.logs.map((l: any) => {
    const out: Record<string, any> = {};
    for (const m of String(l.message).matchAll(/(\w+)=(\S+)/g)) out[m[1]] = m[2] === "NaN" || m[2] === "na" ? NaN : Number(m[2]);
    return out;
  });
}

function expectProbe(rows: Record<string, any>[]) {
  const A: Record<number, number> = { 3: 0, 6: 30, 9: 60, 12: 90 };
  const D: Record<number, number> = { 2: 0, 4: 20, 6: 40, 8: 60, 10: 80, 12: 100 };
  expect(rows.length).toBe(14);
  rows.forEach((row, i) => {
    const ea = A[i] ?? NaN;
    const ed = D[i] ?? NaN;
    expect(row.a, `a on bar ${i}`).toEqual(ea);
    expect(row.c, `c on bar ${i}`).toEqual(ea);
    expect(row.d, `d on bar ${i}`).toEqual(ed);
    expect(row.b, `b on bar ${i}`).toEqual(i in A ? closes[i - 1] : NaN);
  });
}

describe("v[n] inside a user function is per call site", () => {
  it("v6 probe matches TradingView on every bar", () => {
    expectProbe(run(`//@version=6\nindicator("hist probe")\n${body}${logLine}`));
  });

  it("v5 variant gives the same results", () => {
    expectProbe(run(`//@version=5\nindicator("hist probe")\n${body}${logLine}`));
  });

  it("two call sites of one function in the same if have their own history", () => {
    const rows = run(`//@version=6
indicator("two sites")
var float v = 0.0
v := bar_index * 10
g() => v[1]
float p = na
float q = na
if bar_index % 3 == 0
    p := g()
    q := g()
if bar_index % 2 == 0
    q := q + g()
log.info("bi={0} p={1} q={2}", bar_index, p, q)
plot(p)
`);
    // bar 6: p = 30; q = the second site's 30 plus the third site's previous-call value, 40 (bar 4)
    expect(rows[3].p).toBe(0);
    expect(rows[6].p).toBe(30);
    expect(rows[9].p).toBe(60);
    expect(rows[3].q).toBe(0);
    expect(rows[6].q).toBe(30 + 40);
  });

  it("a parameter handed a series keeps bar-indexed history", () => {
    const rows = run(`//@version=6
indicator("param")
var float v = 0.0
v := bar_index * 10
h(float s) => s[1]
float p = na
if bar_index % 3 == 0
    p := h(v)
log.info("bi={0} p={1}", bar_index, p)
plot(p)
`);
    expect(rows[3].p).toBe(20);
    expect(rows[6].p).toBe(50);
  });
});
