/**
 * The closing execution of a realtime bar, against TradingView. Captures:
 * dev-docs/tv-parity/_probes/realtime/rt-confirmed-v6/run-20261113-042353 and
 * rt-confirmed-v5/run-20261113-043223 (source: probe.pine there).
 *
 * `varip tb; if barstate.isrealtime: tb := isnew ? 1 : tb + 1; log.info(tb, isnew, isconfirmed, ...)`:
 * isconfirmed is false on every live tick; when the bar closes TradingView runs the script ONE MORE
 * time on the bar's FINAL candle with isconfirmed true and isnew false (tb increments), e.g. v5
 * `tb=52 vol=10.42` then `tb=53 conf=true vol=10.613`; the next bar's first tick is isnew again.
 * On history isconfirmed is true.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const H = 3_600_000;
const t0 = Date.UTC(2024, 0, 1);
const N = 3;
const hist = Array.from({ length: N }, (_, i) => ({
  time: t0 + i * H, open: 100, high: 101, low: 99, close: 100, volume: 1,
}));
const candle = (bar: number, close: number, volume = 1) =>
  ({ time: t0 + (N + bar) * H, open: 100, high: 101, low: 99, close, volume });

const indicator = `//@version=6
indicator("confirmed", overlay = false)
varip int tb = 0
if barstate.isrealtime
    tb := barstate.isnew ? 1 : tb + 1
    log.info("tb={0} new={1} conf={2} close={3} vol={4}", tb, barstate.isnew, barstate.isconfirmed, close, volume)
plot(barstate.isconfirmed ? 1 : 0, "conf")
`;

function session(src: string): Session {
  const s = new Session();
  s.setChart({ symbol: "TEST:X", timeframe: "60", mintick: 0.01 });
  expect(s.compile(src).errors).toEqual([]);
  s.runHistory(hist);
  return s;
}
const logs = (s: Session): string[] => (s as any).ctx.logs.map((l: any) => l.message);

describe("barstate.isconfirmed on a realtime bar (TradingView-verified)", () => {
  it("is true on every historical bar", () => {
    const s = new Session();
    s.setChart({ symbol: "TEST:X", timeframe: "60", mintick: 0.01 });
    s.compile(indicator);
    s.runHistory(hist);
    const conf = [...(s as any).ctx.plots.values()][0];
    expect(conf.map((x: any) => x.value)).toEqual([1, 1, 1]);
  });

  it("commit(finalCandle) runs the script once more: confirmed, not new, on the final candle", () => {
    const s = session(indicator);
    s.tick(candle(0, 100, 1));
    s.tick(candle(0, 101, 1.5));
    s.commit(candle(0, 102, 1.7)); // final update differs from the last tick
    s.tick(candle(1, 103));
    expect(logs(s)).toEqual([
      "tb=1 new=true conf=false close=100 vol=1",
      "tb=2 new=false conf=false close=101 vol=1.5",
      "tb=3 new=false conf=true close=102 vol=1.7",
      "tb=1 new=true conf=false close=103 vol=1",
    ]);
  });

  it("commit() with no candle closes on the last tick's values, still as a confirmed execution", () => {
    const s = session(indicator);
    s.tick(candle(0, 100));
    s.tick(candle(0, 101));
    s.commit();
    expect(logs(s).slice(-1)).toEqual(["tb=3 new=false conf=true close=101 vol=1"]);
  });

  it("a bar that never ticked has no closing execution", () => {
    const s = session(indicator);
    s.commit();
    expect(logs(s)).toEqual([]);
  });

  it("a strategy with calc_on_every_tick off executes once, at close: new and confirmed", () => {
    const s = session(`//@version=6
strategy("close only", calc_on_every_tick = false)
if barstate.isrealtime
    log.info("new={0} conf={1} close={2}", barstate.isnew, barstate.isconfirmed, close)
`);
    s.tick(candle(0, 100));
    s.tick(candle(0, 101));
    expect(logs(s)).toEqual([]);
    s.commit(candle(0, 102));
    expect(logs(s)).toEqual(["new=true conf=true close=102"]);
  });
});
