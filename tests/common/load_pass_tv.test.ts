/**
 * The LOAD PASS: `Session.tick(candle, { loadPass: true })`. When a chart loads with an unconfirmed last
 * bar, TradingView computes that bar once as part of the history: barstate.isrealtime and isconfirmed
 * false, isnew true, request.security (higher timeframe, lookahead off) returns the LAST CLOSED
 * requested bar and barstate.islast inside it is false (a UDT built only on it is na). Every later tick
 * is the usual realtime one: the forming requested bar, islast true. TradingView probe triage/r5
 * p1_load_pass_htf (BTCUSDT 1h, request.security "D" and "W").
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../runtime/v1/session";

const H = 3600_000, D = 24 * H;
const t0 = Date.UTC(2026, 0, 1);
const hist = Array.from({ length: 55 }, (_, i) => ({ time: t0 + i * H, open: 10, high: 12, low: 9, close: 11 + i, volume: 1 }));
const live = { time: t0 + 55 * H, open: 66, high: 68, low: 65, close: 67, volume: 1 };
// day 0 and day 1 closed, day 2 forming (its bars so far)
const daily = [0, 1, 2].map((d) => ({ time: t0 + d * D, open: 10, high: 12, low: 9, close: 100 + d, volume: 1 }));

const SCRIPT = `//@version=6
indicator("t")
type S
    float t
dT = request.security(syminfo.tickerid, "D", time)
dC = request.security(syminfo.tickerid, "D", close)
dL = request.security(syminfo.tickerid, "D", barstate.islast)
dU = request.security(syminfo.tickerid, "D", barstate.islast ? S.new(time) : na)
if barstate.islast
    log.info("rt={0} conf={1} new={2} hist={3} dT={4} dC={5} dL={6} dU={7}", barstate.isrealtime, barstate.isconfirmed, barstate.isnew, barstate.ishistory, str.tostring(dT), dC, dL ? "true" : "false", na(dU) ? "na" : "S")
plot(close)
`;

function start() {
  const s = new Session();
  s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "60", mintick: 0.01, timezone: "Etc/UTC", session: "24x7" } as any);
  expect(s.compile(SCRIPT).errors).toEqual([]);
  s.provideData("BINANCE:BTCUSDT", "D", daily);
  const r: any = s.runHistory(hist, { realtimeFollows: { time: live.time } });
  expect(r.errors).toEqual([]);
  return s;
}
const lines = (s: Session) => (s.render().logs ?? []).map((l: any) => l.message as string);

describe("load pass", () => {
  it("computes the live bar as history, with the last closed requested bar", () => {
    const s = start();
    s.tick(live, { loadPass: true });
    const m = lines(s).at(-1)!;
    expect(m).toBe(`rt=false conf=false new=true hist=true dT=${t0 + D} dC=101 dL=false dU=na`);
  });

  it("the next tick is the usual realtime one: the forming requested bar, islast true, isnew false", () => {
    const s = start();
    s.tick(live, { loadPass: true });
    s.tick({ ...live, close: 68 });
    expect(lines(s).at(-1)).toBe(`rt=true conf=false new=false hist=false dT=${t0 + 2 * D} dC=102 dL=true dU=S`);
  });

  it("without the option the first tick is realtime, as before", () => {
    const s = start();
    s.tick(live);
    expect(lines(s).at(-1)).toBe(`rt=true conf=false new=true hist=false dT=${t0 + 2 * D} dC=102 dL=true dU=S`);
  });

  it("is only the live bar's first execution", () => {
    const s = start();
    s.tick(live, { loadPass: true });
    expect(() => s.tick(live, { loadPass: true })).toThrow(/load pass/);
  });

  it("commit() after a load pass closes the bar as usual", () => {
    const s = start();
    s.tick(live, { loadPass: true });
    s.commit(live);
    expect(lines(s).at(-1)).toMatch(/^rt=true conf=true new=false/);
  });
});
