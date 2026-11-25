/**
 * Deep `[]` offsets inside a user function whose call site does not run on every bar.
 *
 * Outer variable (`g[k]` on a global read in the function): bar-indexed, carrying the value the
 * variable had at the site's last call at or before the bar k back. TradingView Pine Logs, probe
 * triage/r4 p_n33 (BTCUSDT 1h, v6): sites called every 7th / 11th bar summing g[2..5] / g[0..3] of
 * `g = bar_index` log 4 * (previous call's bar) and bar + 3 * (previous call's bar), 18 of 18 lines.
 * The engine used to read the n-th previous CALL, which is the same only for offset 1.
 *
 * Built-in series handed as an argument (`f(high)`, then `h[i]` on the parameter): carries like any
 * other argument. TradingView capture n152 (v6, a 1-D k-means called every 10th bar reading `h[i]` /
 * `l[i]` up to 179 bars back): its zone centres reproduce exactly with carried high/low and not with
 * per-bar ones. `high[i]` written in the body is not a parameter and stays per bar.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const bars = Array.from({ length: 80 }, (_, i) => ({
  time: 1_700_000_000_000 + i * 3_600_000, open: 100 + i, high: 101 + i, low: 99 + i, close: 100 + i, volume: 1,
}));

function run(src: string): Record<string, number>[] {
  const s = new Session();
  expect(s.compile(src).errors).toEqual([]);
  const r: any = s.runHistory(bars);
  expect(r.errors).toEqual([]);
  return r.logs.map((l: any) => {
    const out: Record<string, number> = {};
    for (const m of String(l.message).matchAll(/(\w+)=(\S+)/g)) out[m[1]] = m[2] === "NaN" ? NaN : Number(m[2].replace(/,/g, ""));
    return out;
  });
}

/** The last bar at or before `b` in `calls`, or -1. */
const lastCall = (calls: number[], b: number) => { let c = -1; for (const x of calls) if (x <= b) c = x; return c; };

describe("deep history offsets in a function not called on every bar", () => {
  it("an outer variable carries the value at the site's last call at or before the bar (p_n33)", () => {
    const rows = run(`//@version=6
indicator("p_n33")
float g = bar_index * 1.0
sumBack(int fromBack, int toBack) =>
    float s = 0.0
    for k = fromBack to toBack
        s += nz(g[k])
    s
if bar_index % 7 == 3 and bar_index < 80
    log.info("site=1 bi={0} g={1}", bar_index, sumBack(2, 5))
if bar_index % 11 == 5 and bar_index < 80
    log.info("site=2 bi={0} g={1}", bar_index, sumBack(0, 3))
`);
    // TradingView's lines, verbatim from the probe
    const tv: Record<string, number> = { "1:3": 0, "2:5": 5, "1:10": 12, "2:16": 31, "1:17": 40, "1:24": 68, "2:27": 75, "1:31": 96,
      "1:38": 124, "2:38": 119, "1:45": 152, "2:49": 163, "1:52": 180, "1:59": 208, "2:60": 207, "1:66": 236, "2:71": 251, "1:73": 264 };
    expect(rows.length).toBe(Object.keys(tv).length);
    for (const r of rows) expect(r.g, `site ${r.site} bar ${r.bi}`).toBe(tv[`${r.site}:${r.bi}`]);
  });

  it("an offset past several skipped calls still reads the call at or before that bar", () => {
    // site every 4th bar; g[9] at bar 20 is bar 11 -> last call at or before it is bar 8 (not the
    // 9th previous call, which does not exist yet)
    const rows = run(`//@version=6
indicator("deep")
float g = bar_index * 1.0
f() => g[9]
if bar_index % 4 == 0
    log.info("bi={0} v={1}", bar_index, f())
`);
    const calls = Array.from({ length: 20 }, (_, i) => i * 4);
    for (const r of rows) {
      const c = lastCall(calls, r.bi - 9);
      if (c < 0) expect(r.v, `bar ${r.bi}`).toBeNaN(); else expect(r.v, `bar ${r.bi}`).toBe(c);
    }
  });

  it("a built-in series argument carries; the body's own high[i] stays per bar (n152)", () => {
    const rows = run(`//@version=6
indicator("builtin arg")
f(float h, int lb) =>
    float a = 0.0
    float b = 0.0
    for i = 0 to lb - 1
        a += nz(h[i])
        b += nz(high[i])
    [a, b]
if bar_index >= 20 and bar_index % 10 == 0
    [a, b] = f(high, 35)
    log.info("bi={0} a={1} b={2}", bar_index, a, b)
`);
    const calls = [20, 30, 40, 50, 60, 70];
    expect(rows.map(r => r.bi)).toEqual(calls);
    for (const r of rows) {
      let carried = 0, perBar = 0;
      for (let i = 0; i < 35; i++) {
        const bar = r.bi - i;
        if (bar < 0) continue;
        perBar += 101 + bar;
        const c = lastCall(calls, bar);
        if (c >= 0) carried += 101 + c;
      }
      expect(r.a, `carried h[i] at bar ${r.bi}`).toBe(carried);
      expect(r.b, `per-bar high[i] at bar ${r.bi}`).toBe(perBar);
    }
  });
});
