/**
 * `runHistory(bars, { realtimeFollows })`: a chart that has just loaded. The
 * candles run as confirmed history and the LAST bar is a live bar still forming:
 * history is never `islast`, `last_bar_index` already counts the live bar, and
 * `tick()` runs it with islast / isrealtime / isnew and isconfirmed false.
 * Without the option the last candle is the last bar, as before.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../runtime/v1/session";

const H = 3600_000;
const t0 = 1_700_000_000_000;
const history = Array.from({ length: 10 }, (_, i) => ({
  time: t0 + i * H, open: 10 + i, high: 12 + i, low: 9 + i, close: 11 + i, volume: 1,
}));
const live = { time: t0 + 10 * H, open: 21, high: 23, low: 20, close: 22, volume: 1 };

const SCRIPT = (v: string) => `//@version=${v}
indicator("t", overlay = true)
log.info("bi={0} last={1} lt={2} islast={3} conf={4} rt={5} hist={6} new={7}", bar_index, last_bar_index, last_bar_time, barstate.islast, barstate.isconfirmed, barstate.isrealtime, barstate.ishistory, barstate.isnew)
if barstate.islast
    label.new(bar_index, close, "x")
plot(close)
`;

describe.each(["5", "6"])("realtimeFollows, v%s", (v) => {
  function start(opts: any) {
    const s = new Session();
    expect(s.compile(SCRIPT(v)).errors).toEqual([]);
    const r: any = s.runHistory(history, opts);
    expect(r.errors).toEqual([]);
    return { s, r };
  }
  const row = (m: string) => Object.fromEntries([...m.matchAll(/(\w+)=(\S+)/g)].map((x) => [x[1], x[2].replace(/,/g, "")]));

  it("history bars are not last, last_bar_index counts the live bar, and the live bar is last and realtime", () => {
    const { s, r } = start({ realtimeFollows: { time: live.time } });
    const rows = r.logs.map((l: any) => row(l.message));
    expect(rows.length).toBe(10);
    rows.forEach((x: any, i: number) => {
      expect(x).toMatchObject({ bi: String(i), last: "10", lt: String(live.time), islast: "false", conf: "true", rt: "false", hist: "true" });
    });
    expect(r.drawings.filter((d: any) => d.kind === "label").length).toBe(0);

    s.tick(live);
    const res = s.render();
    const tickRow = row(res.logs.at(-1)!.message);
    expect(tickRow).toMatchObject({ bi: "10", last: "10", islast: "true", conf: "false", rt: "true", hist: "false", new: "true" });
    // exactly one label, on the live bar (not on bar 9)
    const labels = res.drawings.filter((d: any) => d.kind === "label");
    expect(labels.length).toBe(1);
    expect(labels[0].props.x).toBe(10);

    // a second tick of the same bar rolls back: still one label, no new bar
    s.tick({ ...live, close: 23 });
    const again = s.render();
    expect(again.drawings.filter((d: any) => d.kind === "label").length).toBe(1);
    expect(row(again.logs.at(-1)!.message)).toMatchObject({ bi: "10", new: "false" });
  });

  it("last_bar_time falls back to the last candle plus the spacing", () => {
    const { r } = start({ realtimeFollows: true });
    expect(row(r.logs[0].message).lt).toBe(String(live.time));
  });

  it("without the option the last candle is the last bar, as before", () => {
    const { r } = start({});
    const rows = r.logs.map((l: any) => row(l.message));
    expect(rows[9]).toMatchObject({ last: "9", islast: "true" });
    expect(rows[8]).toMatchObject({ islast: "false" });
    expect(r.drawings.filter((d: any) => d.kind === "label").length).toBe(1);
  });
});

describe("realtimeFollows with a strategy, v6", () => {
  it("an order placed on the last history bar fills once, at the live bar's open", () => {
    const s = new Session();
    expect(s.compile(`//@version=6
strategy("t", overlay = true, default_qty_type = strategy.fixed)
if bar_index == 9
    strategy.entry("L", strategy.long)
plot(close)
`).errors).toEqual([]);
    s.runHistory(history, { realtimeFollows: { time: live.time } });
    s.tick(live);
    s.tick({ ...live, close: 22.5 });
    const r = s.render();
    expect(r.position.size).toBe(1);
    expect(r.trades.length + (r.position.size !== 0 ? 1 : 0)).toBe(1);
  });
});

describe("realtimeFollows with calc_bars_count and request.security, v6", () => {
  it("the live bar's label sits at its chart index, and security answers on every bar", () => {
    const bars = Array.from({ length: 30 }, (_, i) => ({
      time: t0 + i * H, open: 10, high: 12, low: 9, close: 11 + i, volume: 1,
    }));
    const liveBar = { time: t0 + 30 * H, open: 41, high: 43, low: 40, close: 42, volume: 1 };
    const s = new Session();
    expect(s.compile(`//@version=6
indicator("t", overlay = true, calc_bars_count = 10)
x = request.security(syminfo.tickerid, "60", close)
if barstate.islast
    label.new(bar_index, x, "x")
plot(x)
`).errors).toEqual([]);
    const r: any = s.runHistory(bars, { realtimeFollows: { time: liveBar.time } });
    expect(r.errors).toEqual([]);
    expect(r.drawings.length).toBe(0);
    s.tick(liveBar);
    const res = s.render();
    const labels = res.drawings.filter((d: any) => d.kind === "label");
    expect(labels.length).toBe(1);
    expect(labels[0].props.x).toBe(30);   // chart index of the live bar
  });
});
