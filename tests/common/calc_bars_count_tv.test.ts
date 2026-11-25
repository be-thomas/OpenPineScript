/**
 * `indicator(calc_bars_count = N)` runs the script on the last N bars only; the
 * first of them is bar_index 0. TradingView capture, popular-author batch
 * 2026-11-21 (v6); v5's indicator() is the same declaration. strategy() is in
 * round4_slice_c_tv.test.ts (capture n51); v4's study() was not probed and is unchanged.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../runtime/v1/session";

const bars = Array.from({ length: 120 }, (_, i) => ({
  time: 1_700_000_000_000 + i * 3600_000, open: 1, high: 2, low: 0, close: 1 + i, volume: 1,
}));

describe.each(["5", "6"])("calc_bars_count, v%s", (v) => {
  it("executes on the last 50 of 120 bars", () => {
    const s = new Session();
    expect(s.compile(`//@version=${v}
indicator("t", calc_bars_count = 50)
var int runs = 0
runs += 1
if barstate.isfirst
    log.info("first bi={0} last={1} close={2}", bar_index, last_bar_index, close)
plot(bar_index, "bi")
plot(runs, "runs")
`).errors).toEqual([]);
    const r: any = s.runHistory(bars);
    expect(r.errors).toEqual([]);
    const bi = r.series.find((x: any) => x.title === "bi").data.map((p: any) => p?.value ?? null);
    expect(bi.length).toBe(120);
    expect(bi.slice(0, 70).every((x: any) => x === null)).toBe(true);
    expect(bi.slice(70)).toEqual(Array.from({ length: 50 }, (_, i) => i));
    expect(r.series.find((x: any) => x.title === "runs").data.at(-1).value).toBe(50);
    expect(r.logs.map((l: any) => l.message)).toEqual(["first bi=0 last=49 close=71"]);
  });

  it("does nothing when N covers the whole history", () => {
    const s = new Session();
    expect(s.compile(`//@version=${v}\nindicator("t", calc_bars_count = 500)\nplot(bar_index)\n`).errors).toEqual([]);
    const r: any = s.runHistory(bars);
    expect(r.series[0].data.length).toBe(120);
    expect(r.series[0].data[0].value).toBe(0);
  });
});

describe.each(["5", "6"])("calc_bars_count drawings and logs are in chart bar indices, v%s", (v) => {
  it("shifts bar-index coordinates by the skipped bars, leaves times, and keeps Pine's bar_index script-relative", () => {
    const s = new Session();
    expect(s.compile(`//@version=${v}
indicator("t", overlay = true, calc_bars_count = 50)
if barstate.islast
    label.new(bar_index, close, "x")
    line.new(bar_index - 5, low, bar_index, high)
    line.new(time - 5 * 3600000, low, time, high, xloc = xloc.bar_time)
    log.info("bi={0}", bar_index)
plot(close)
`).errors).toEqual([]);
    const r: any = s.runHistory(bars);
    expect(r.errors).toEqual([]);
    const label = r.drawings.find((d: any) => d.kind === "label");
    const [byIndex, byTime] = r.drawings.filter((d: any) => d.kind === "line");
    expect(label.props.x).toBe(119);
    expect(byIndex.props.x1).toBe(114);
    expect(byIndex.props.x2).toBe(119);
    expect(byTime.props.x2).toBe(bars[119].time);
    expect(r.logs[0].message).toBe("bi=49");
    expect(r.logs[0].bar).toBe(119);
    expect(r.barsProcessed).toBe(120);
  });
});

describe("calc_bars_count with live ticks, v6", () => {
  it("reports chart indices for the live bar, while Pine's bar_index stays script-relative", () => {
    const s = new Session();
    expect(s.compile(`//@version=6
indicator("t", overlay = true, calc_bars_count = 50)
if barstate.islast
    label.new(bar_index, close, "x")
    log.info("bi={0}", bar_index)
plot(bar_index, "bi")
`).errors).toEqual([]);
    s.runHistory(bars);
    const live = (i: number, close: number) =>
      ({ time: bars[119].time + (i + 1) * 3600_000, open: 1, high: 2, low: 0, close, volume: 1 });

    const d1 = s.tick(live(0, 500));
    expect(d1.barIndex).toBe(120);
    expect(d1.series[0].value).toBe(50);
    const d2 = s.tick(live(0, 501));          // the same bar ticks again
    expect(d2.barIndex).toBe(120);
    expect(d2.series[0].value).toBe(50);

    let r = s.render();
    const pts = (res: any) => res.series.find((x: any) => x.title === "bi").data.map((p: any) => p?.value ?? null);
    expect(pts(r).length).toBe(121);
    expect(pts(r).slice(0, 70).every((x: any) => x === null)).toBe(true);
    expect(pts(r)[70]).toBe(0);
    expect(pts(r)[120]).toBe(50);
    const label = r.drawings.filter((d: any) => d.kind === "label").at(-1)!;
    expect(label.props.x).toBe(120);
    expect(r.logs.at(-1)!.message).toBe("bi=50");
    expect(r.logs.at(-1)!.bar).toBe(120);

    expect(s.commit().barIndex).toBe(120);
    const d3 = s.tick(live(1, 502));
    expect(d3.barIndex).toBe(121);
    expect(d3.series[0].value).toBe(51);
    r = s.render();
    expect(pts(r).length).toBe(122);
    expect(pts(r).slice(119)).toEqual([49, 50, 51]);
  });
});

describe("calc_bars_count on a v4 study()", () => {
  it("is not applied (not probed)", () => {
    const s = new Session();
    expect(s.compile(`//@version=4\nstudy("t", calc_bars_count = 50)\nplot(bar_index)\n`).errors).toEqual([]);
    const r: any = s.runHistory(bars);
    expect(r.series[0].data.length).toBe(120);
    expect(r.series[0].data[0].value).toBe(0);
  });
});
