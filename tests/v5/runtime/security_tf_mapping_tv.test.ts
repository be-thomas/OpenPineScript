/**
 * Which requested bar a chart bar sees (dev-docs/tv-parity/ENGINE-BUGS.md §2, §11).
 *
 *  - lookahead_on on a HISTORICAL bar gives the whole higher-timeframe bar the
 *    chart bar belongs to, chart bars still to come included. A series derived
 *    from the chart's own bars must say the same as one the host supplied.
 *    On the live bar only bars that exist are known.
 *  - lookahead_off on a LOWER timeframe (v5+): the last requested bar that has
 *    CLOSED by the chart bar's close (probes _probes/security-tf/20261110-030101_BINANCE_BTCUSDT_15m
 *    and strategy-20261112-082646_BINANCE_BTCUSDT_15m).
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const MIN = 60_000;
const T0 = Date.UTC(2024, 0, 1);

function walk(n: number, step = MIN) {
  let x = 12345;
  const rnd = () => (x = (x * 1664525 + 1013904223) >>> 0) / 4294967296;
  return Array.from({ length: n }, (_, i) => {
    const open = 100 + rnd() * 10, close = 100 + rnd() * 10;
    return { time: T0 + i * step, open, high: Math.max(open, close) + rnd(), low: Math.min(open, close) - rnd(), close, volume: 1 + rnd() };
  });
}

function fold(bars: ReturnType<typeof walk>, spanMs: number) {
  const out: any[] = [];
  for (const b of bars) {
    const t = Math.floor((b.time - T0) / spanMs) * spanMs + T0;
    const last = out[out.length - 1];
    if (last && last.time === t) {
      last.high = Math.max(last.high, b.high); last.low = Math.min(last.low, b.low);
      last.close = b.close; last.volume += b.volume;
    } else out.push({ ...b, time: t });
  }
  return out;
}

const values = (r: any, title: string) => r.series.find((p: any) => p.title === title).data.map((d: any) => d?.value ?? null);

function session(src: string, tf: string) {
  const s = new Session();
  s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: tf });
  expect(s.compile(`//@version=5\nindicator("t")\n${src}`).errors).toEqual([]);
  return s;
}

const SCRIPT = (look: string) =>
  `f() => ta.highest(high, 2)[1]\n` +
  `plot(request.security(syminfo.tickerid, "60", high, lookahead = barmerge.${look}), "h")\n` +
  `plot(request.security(syminfo.tickerid, "60", f(), lookahead = barmerge.${look}), "f")\n`;

describe("derived higher timeframe, lookahead_on", () => {
  const bars = walk(180);
  const hours = fold(bars, 60 * MIN);

  it("is the max high of the whole hour, later chart bars included", () => {
    const r = session(`plot(request.security(syminfo.tickerid, "60", high, lookahead = barmerge.lookahead_on), "h")\n`, "1").runHistory(bars) as any;
    const got = values(r, "h");
    bars.forEach((b, i) => {
      const h = Math.floor(i / 60);
      expect(got[i]).toBe(Math.max(...bars.slice(h * 60, h * 60 + 60).map(x => x.high)));
    });
  });

  for (const look of ["lookahead_on", "lookahead_off"]) {
    it(`${look}: derived equals supplied on every bar`, () => {
      const d = session(SCRIPT(look), "1").runHistory(bars) as any;
      const s = session(SCRIPT(look), "1");
      s.provideData("BINANCE:BTCUSDT", "60", hours);
      const p = s.runHistory(bars) as any;
      expect(values(d, "h")).toEqual(values(p, "h"));
      expect(values(d, "f")).toEqual(values(p, "f"));
    });
  }
});

describe("derived higher timeframe on the live bar", () => {
  it("lookahead_on sees only the bars that exist, the tick bar included", () => {
    const bars = walk(60);
    const s = session(`plot(request.security(syminfo.tickerid, "60", high, lookahead = barmerge.lookahead_on), "h")\n`, "1");
    s.runHistory(bars.slice(0, 30));
    const next = bars[30];
    const delta = s.tick(next);
    const v = delta.series.find((x: any) => x.value !== undefined)!.value;
    expect(v).toBe(Math.max(...bars.slice(0, 31).map(x => x.high)));
  });
});

describe("lower timeframe, lookahead_off", () => {
  const m15 = [{ time: T0, open: 1, high: 2, low: 0, close: 1, volume: 1 }];
  // 2m bars every 2 minutes: the one at 12 min closes at 14, the one at 14 closes at 16, after the chart bar (ends at 15).
  const m2 = Array.from({ length: 8 }, (_, k) => ({ time: T0 + k * 2 * MIN, open: 10, high: 20 + k, low: 5 + k, close: 10, volume: 1 }));
  const run = (version: number) => {
    const s = new Session();
    s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "15" });
    expect(s.compile(`//@version=${version}\n${version < 5 ? "study" : "indicator"}("t")\nplot(${version < 5 ? "security" : "request.security"}(syminfo.tickerid, "2", low), "l")\n`).errors).toEqual([]);
    s.provideData("BINANCE:BTCUSDT", "2", m2);
    return s.runHistory(m15) as any;
  };

  it("v5: the 2m bar that closed by the chart bar's close is the one seen, not the one still open", () => {
    expect(values(run(5), "l")).toEqual([5 + 6]);   // the bar opening at minute 12 (closes 14), not the one at 14: 5 + 7
  });

  it("v4 keeps the older rule: the bar that opens inside the chart bar and closes after it", () => {
    expect(values(run(4), "l")).toEqual([5 + 7]);
  });
});
