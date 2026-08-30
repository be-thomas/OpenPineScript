/**
 * `request.security()` on the chart's OWN symbol.
 *
 * ── What it used to do ──────────────────────────────────────────────────────
 *
 * Return `na`. Every call — including
 * `request.security(syminfo.tickerid, timeframe.period, close)`, which asks for
 * the series the script is already running on — because the only source of
 * higher-timeframe candles was a host that had supplied them. Twenty-five of
 * TradingView's own examples plot nothing but `na` under that reading.
 *
 * ── Why deriving them is exact ──────────────────────────────────────────────
 *
 * A higher-timeframe bar IS the aggregate of the chart bars inside it: it opens
 * where the first one opened, closes where the last one closed, spans their
 * extremes and carries their total volume. TradingView builds its own weekly
 * candles from the same daily feed. Nothing is modelled or approximated.
 *
 * ── What is still refused ───────────────────────────────────────────────────
 *
 * A LOWER timeframe, and any other symbol. The manual: request.security() on a
 * lower timeframe "will evaluate the expression from the LTF context", and
 * there is no LTF context in a daily CSV. Both keep returning `na` and
 * recording the request, so a host that HAS the data can still supply it.
 */
import { describe, it, expect } from "vitest";
import { compileScript } from "../../../transpiler/common";
import { compile, Context } from "../../../runtime/v5";

const HEAD = '//@version=5\nindicator("t")\n';

/** Daily bars from a fixed Monday, so the weekly boundaries are checkable. */
const DAY = 86400000;
const MONDAY = Date.UTC(2024, 0, 1);          // 2024-01-01 is a Monday
const bars = Array.from({ length: 14 }, (_, i) => ({
  time: MONDAY + i * DAY,
  open: 100 + i, high: 110 + i, low: 90 + i, close: 100 + i, volume: 10,
}));

function series(body: string, name: string, n = bars.length): any[] {
  const { js, profile } = compileScript(HEAD + body);
  const ctx = new Context(profile);
  const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
  ctx.provideDatasetExtent(bars.length, bars[bars.length - 1].time);
  const out: any[] = [];
  for (let i = 0; i < n; i++) {
    const b = bars[i];
    ctx.setBar(b.time, b.open, b.high, b.low, b.close, b.volume);
    exec();
    out.push(ctx.vars.get("opsv2_" + name)?.valueOf());
    ctx.finalizeBar();
  }
  return out;
}

describe("the chart's own timeframe", () => {
  it("timeframe.period returns the chart series", () => {
    const got = series("x = request.security(syminfo.tickerid, timeframe.period, close)\n", "x");
    expect(got).toEqual(bars.map(b => b.close));
  });

  it("...and so does naming it, on a daily chart", () => {
    expect(series('x = request.security(syminfo.tickerid, "D", close)\n', "x"))
      .toEqual(bars.map(b => b.close));
  });

  it("an expression is evaluated in the requested context, not this one", () => {
    const got = series('x = request.security(syminfo.tickerid, "D", high - low)\n', "x");
    expect(got.every(v => v === 20)).toBe(true);
  });
});

describe("a HIGHER timeframe is folded from the chart's bars", () => {
  it("a weekly close appears on the Monday after the week ends", () => {
    const got = series('x = request.security(syminfo.tickerid, "W", close)\n', "x");
    // Bars 0-4 are Mon-Fri of week one; nothing is settled until bar 7, the
    // Monday of week two, when the first week has closed at bar 6's close.
    expect(got.slice(0, 7).every(v => Number.isNaN(v))).toBe(true);
    expect(got[7]).toBe(bars[6].close);
  });

  it("...and holds for the rest of that week", () => {
    const got = series('x = request.security(syminfo.tickerid, "W", close)\n', "x");
    expect(got.slice(7, 14).every(v => v === bars[6].close)).toBe(true);
  });

  it("a weekly high is the highest of its days", () => {
    const got = series('x = request.security(syminfo.tickerid, "W", high)\n', "x");
    expect(got[7]).toBe(Math.max(...bars.slice(0, 7).map(b => b.high)));
  });

  it("a weekly volume is the sum of its days", () => {
    const got = series('x = request.security(syminfo.tickerid, "W", volume)\n', "x");
    expect(got[7]).toBe(70);
  });

  it("nothing is visible before its bar has closed", () => {
    // The whole point of folding only the bars already seen: aggregating the
    // dataset would let bar 0 read a week that has not happened.
    const got = series('x = request.security(syminfo.tickerid, "W", close)\n', "x");
    expect(Number.isNaN(got[0])).toBe(true);
  });
});

describe("what is not derived", () => {
  it("a LOWER timeframe is still na", () => {
    const got = series('x = request.security(syminfo.tickerid, "60", close)\n', "x");
    expect(got.every(v => Number.isNaN(v))).toBe(true);
  });

  it("another symbol is still na, and is recorded as wanted", () => {
    const { js, profile } = compileScript(
      HEAD + 'x = request.security("AMEX:SPY", "D", close)\n',
    );
    const ctx = new Context(profile);
    const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
    ctx.setBar(MONDAY, 1, 1, 1, 1, 1);
    exec();
    expect(Number.isNaN(ctx.vars.get("opsv2_x")?.valueOf())).toBe(true);
    expect([...ctx.requestedSecurities]).toContain("AMEX:SPY@D");
  });

  it("host-supplied data still wins over a derivation", () => {
    const { js, profile } = compileScript(
      HEAD + 'x = request.security(syminfo.tickerid, "D", close)\n',
    );
    const ctx = new Context(profile);
    ctx.provideSecurityData("SYMBOL", "D", [
      { time: MONDAY - DAY, open: 1, high: 1, low: 1, close: 7, volume: 1 },
      { time: MONDAY, open: 1, high: 1, low: 1, close: 9, volume: 1 },
    ]);
    const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
    ctx.setBar(MONDAY, 100, 110, 90, 100, 10);
    exec();
    // 7, not 100: the supplied series is what the request reads. And 7 rather
    // than 9 because HOST data keeps the closed-bar rule even at a matching
    // label — a host may hand over any series under the name "D", and only a
    // series this engine derived from the chart's own bars is known to line up
    // with them.
    expect(ctx.vars.get("opsv2_x")?.valueOf()).toBe(7);
  });
});

describe("weeks and months are grouped by the CALENDAR", () => {
  it("a week starts on Monday, not on the epoch's Thursday", () => {
    // `floor(t / 604800000)` groups Thursday to Wednesday, because 1970-01-01
    // was a Thursday. `timeframe.change("W")` used to fire on the wrong day.
    const src = HEAD + 'var int hits = 0\nif timeframe.change("W")\n    hits += 1\nx = hits\n';
    const { js, profile } = compileScript(src);
    const ctx = new Context(profile);
    const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
    const fired: number[] = [];
    bars.forEach((b, i) => {
      ctx.setBar(b.time, b.open, b.high, b.low, b.close, b.volume);
      exec();
      const n = ctx.vars.get("opsv2_x")?.valueOf();
      if (n === fired.length + 1) fired.push(i);
      ctx.finalizeBar();
    });
    // Bar 0 is a Monday and begins no week the script has seen end; bar 7 is
    // the next Monday.
    expect(fired).toEqual([7]);
  });

  it("a month is the calendar month, not a nominal thirty days", () => {
    const jan = Date.UTC(2024, 0, 30);
    const monthly = [jan, jan + DAY, jan + 2 * DAY].map((t, i) => ({
      time: t, open: 1, high: 1, low: 1, close: 10 + i, volume: 1,
    }));
    const { js, profile } = compileScript(
      HEAD + 'var int hits = 0\nif timeframe.change("M")\n    hits += 1\nx = hits\n',
    );
    const ctx = new Context(profile);
    const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
    const out: any[] = [];
    for (const b of monthly) {
      ctx.setBar(b.time, b.open, b.high, b.low, b.close, b.volume);
      exec();
      out.push(ctx.vars.get("opsv2_x")?.valueOf());
      ctx.finalizeBar();
    }
    // Jan 30, Jan 31, Feb 1 — one change, on the first of February.
    expect(out).toEqual([0, 0, 1]);
  });
});
