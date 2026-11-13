/**
 * Review findings on PR #15 (be-thomas/PineScript).
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const H = 3_600_000;
const mkBars = (n: number) => Array.from({ length: n }, (_, i) => ({
  time: Date.UTC(2024, 0, 1) + i * H,
  open: 100 + i * 3, high: 110 + i * 5, low: 90 + i, close: 100 + ((i * i) % 7) + i, volume: 1000 + i,
}));

function run(src: string, bars = mkBars(12), chart: any = { symbol: "BINANCE:BTCUSDT", timeframe: "60" }) {
  const s = new Session();
  s.setChart(chart);
  expect(s.compile(src).errors).toEqual([]);
  const r: any = s.runHistory(bars);
  return { s, r };
}
const values = (r: any, title: string) => r.series.find((p: any) => p.title === title).data.map((d: any) => d?.value ?? null);

describe("history of a built-in inside a function used as a request.security expression", () => {
  for (const version of [4, 5, 6]) {
    it(`v${version}: hlc3[1] in f() evaluates on the security timeframe, like the inline form`, () => {
      const head = version >= 5 ? `//@version=${version}\nindicator("t")\n` : `//@version=${version}\nstudy("t")\n`;
      const sec = version >= 5 ? "request.security" : "security";
      const { r } = run(head + `f() =>\n    hlc3[1]\n` +
        `plot(${sec}(syminfo.tickerid, "120", f()), "viaFn")\n` +
        `plot(${sec}(syminfo.tickerid, "120", hlc3[1]), "inline")\n`);
      const inline = values(r, "inline");
      expect(inline.some((v: any) => v !== null)).toBe(true);
      expect(values(r, "viaFn")).toEqual(inline);
    });
  }
});

describe("(expr)[n] in an if body after := in the same block (v2-v4)", () => {
  // closes 11, 12, 13 ... on rising bars: x := close runs on every bar, so (x * 2)[1] is 2 * the previous close
  const rising = Array.from({ length: 5 }, (_, i) => ({
    time: Date.UTC(2024, 0, 1) + i * H, open: 10 + i, high: 20 + i, low: 5, close: 11 + i, volume: 1,
  }));
  it("v4 sees the assignment above it", () => {
    const { r } = run(`//@version=4
study("t")
var x = 0.0
y = 0.0
if close > open
    x := close
    y := (x * 2)[1]
plot(y, "y")
`, rising);
    expect(values(r, "y")).toEqual([null, 22, 24, 26, 28]);
  });
  it("v3 sees the assignment above it", () => {
    const { r } = run(`//@version=3
study("t")
x = 0.0
y = 0.0
if close > open
    x := close
    y := (x * 2)[1]
plot(y, "y")
`, rising);
    expect(values(r, "y")).toEqual([null, 22, 24, 26, 28]);
  });
});

describe("history of an outer variable read in a function (call-site history)", () => {
  const bars6 = Array.from({ length: 6 }, (_, i) => ({
    time: Date.UTC(2024, 0, 1) + i * H, open: 10, high: 20, low: 5, close: i % 2 ? 9 : 11, volume: 1,
  }));
  it("v6: a bool read as b[1] through a function is false, not na, on the first call", () => {
    const { r } = run(`//@version=6
indicator("t")
bool b = close > open
h() => b[1]
plot(na(h()) ? 1 : 0, "viaFn")
plot(na(b[1]) ? 1 : 0, "script")
`, bars6);
    expect(values(r, "script")[0]).toBe(0);
    expect(values(r, "viaFn")[0]).toBe(0);
  });
  it("v5: it stays na on the first call", () => {
    const { r } = run(`//@version=5
indicator("t")
b = close > open
h() => b[1]
plot(na(h()) ? 1 : 0, "viaFn")
`, bars6);
    expect(values(r, "viaFn")[0]).toBe(1);
  });
  it("keeps only as many values as the largest offset needs", () => {
    const many = Array.from({ length: 400 }, (_, i) => ({
      time: Date.UTC(2024, 0, 1) + i * H, open: 10, high: 20, low: 5, close: 10 + (i % 5), volume: 1,
    }));
    const { s, r } = run(`//@version=6
indicator("t")
v = close * 2
h() => v[3]
plot(h(), "h")
`, many);
    const h = values(r, "h");
    expect(h[10]).toBe(2 * many[7].close);
    expect(h[399]).toBe(2 * many[396].close);
    const recs = [...(s as any).ctx.states].filter(([k]: any) => String(k).includes("|hist|"));
    expect(recs).toHaveLength(1);
    expect(recs[0][1].vals.length).toBeLessThan(30);
  });
});

describe("snapshots undo drawing setters", () => {
  const hist = Array.from({ length: 5 }, (_, i) => ({
    time: Date.UTC(2024, 0, 1) + i * H, open: 100, high: 101, low: 99, close: 100, volume: 1,
  }));
  it("a realtime tick's line.set_x2 does not accumulate across ticks", () => {
    const s = new Session();
    s.setChart({ symbol: "TEST:X", timeframe: "60", mintick: 0.01 });
    expect(s.compile(`//@version=6
indicator("t", overlay = true)
var l = line.new(bar_index, 100, bar_index + 1, 100)
if barstate.isrealtime
    line.set_x2(l, line.get_x2(l) + 1)
`).errors).toEqual([]);
    s.runHistory(hist);
    const x2 = () => [...(s as any).ctx.drawings.values()].find((d: any) => d.kind === "line").props.x2;
    const base = x2();
    const rt = { time: Date.UTC(2024, 0, 1) + 5 * H, open: 100, high: 101, low: 99, close: 100, volume: 1 };
    s.tick(rt); s.tick(rt); s.tick(rt);
    expect(x2()).toBe(base + 1);
  });
});

describe("realtime bar states by version (probed on v5 and v6; v4 keeps the older reading)", () => {
  const t0 = Date.UTC(2024, 0, 1);
  const hist = Array.from({ length: 3 }, (_, i) => ({ time: t0 + i * H, open: 100, high: 101, low: 99, close: 100, volume: 1 }));
  const rt = (close: number) => ({ time: t0 + 3 * H, open: 100, high: 101, low: 99, close, volume: 1 });
  const last = (s: Session, i: number) => [...(s as any).ctx.plots.values()][i].at(-1).value;

  const run4 = (version: number) => {
    const s = new Session();
    s.setChart({ symbol: "TEST:X", timeframe: "60", mintick: 0.01 });
    const head = version >= 5 ? `//@version=${version}\nindicator("t")` : `//@version=${version}\nstudy("t")`;
    expect(s.compile(`${head}\nplot(barstate.isnew ? 1 : 0, "new")\nplot(barstate.isconfirmed ? 1 : 0, "conf")\n`).errors).toEqual([]);
    s.runHistory(hist);
    s.tick(rt(100));
    s.tick(rt(101));
    const afterSecondTick = { isnew: last(s, 0), conf: last(s, 1) };
    s.commit(rt(102));
    return { afterSecondTick, confAfterCommit: last(s, 1) };
  };

  it("v5: isnew is false on the second tick; commit runs a confirmed execution", () => {
    const r = run4(5);
    expect(r.afterSecondTick).toEqual({ isnew: 0, conf: 0 });
    expect(r.confAfterCommit).toBe(1);
  });
  it("v4: isnew stays true; commit does not re-run the script", () => {
    const r = run4(4);
    expect(r.afterSecondTick).toEqual({ isnew: 1, conf: 0 });
    expect(r.confAfterCommit).toBe(0);
  });
});
