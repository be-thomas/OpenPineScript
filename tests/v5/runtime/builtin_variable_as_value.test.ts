/**
 * A built-in variable used as a VALUE is read, not referenced.
 *
 * `timeframe.period` and `syminfo.tickerid` are getter-backed. When the script
 * also binds the namespace's root as its own name -- a parameter called
 * `timeframe` is the usual one -- the emitter took a separate route that handed
 * back the getter FUNCTION, not what it returns. In `?:`, `switch`, an
 * assignment or a return it travelled on as a value until `request.security`
 * keyed its request by the function's source text, and the request never
 * resolved.
 *
 * Reading a variable as a value is plain Pine on every version, so these cover
 * v4, v5 and v6; nothing about what the variable returns is under test.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const H = 3_600_000;
const bars = Array.from({ length: 16 }, (_, i) => ({
  time: Date.UTC(2024, 0, 1) + i * H,
  open: 100 + i, high: 110 + i, low: 90 + i, close: 100 + ((i * i) % 7) + i, volume: 1000 + i,
}));
// 4h bars over the same span, closes distinct from the chart's own.
const bars4h = Array.from({ length: 4 }, (_, i) => ({
  time: Date.UTC(2024, 0, 1) + i * 4 * H,
  open: 500 + i, high: 510 + i, low: 490 + i, close: 500 + i, volume: 1,
}));

const chart = { symbol: "BINANCE:BTCUSDT", timeframe: "60" };

function run(src: string) {
  const s = new Session();
  s.setChart(chart);
  expect(s.compile(src).errors).toEqual([]);
  s.runHistory(bars as any);
  s.provideData("BINANCE:BTCUSDT", "240", bars4h as any);
  const r = s.runHistory(bars as any) as any;
  return { s, r };
}
const values = (r: any, title: string) => r.series.find((p: any) => p.title === title).data.map((d: any) => d?.value ?? null);
const requested = (s: Session) => [...(s as any).ctx.requestedSecurities].map(String);
const finite = (xs: any[]) => xs.filter((v) => typeof v === "number" && Number.isFinite(v)).length;

// A parameter named `timeframe` binds the namespace root, which is what the
// reported script did; the plain forms (no such name) are run alongside.
const SHADOW = {
  4: 'f(timeframe) => timeframe\n',
  5: 'f(string timeframe) => timeframe\n',
  6: 'f(string timeframe) => timeframe\n',
} as const;

function sources(v: 4 | 5 | 6, shadow: boolean) {
  const head = v === 4 ? '//@version=4\nstudy("t")\n' : `//@version=${v}\nindicator("t")\n`;
  const sec = v === 4 ? "security" : "request.security";
  const pre = head + (shadow ? SHADOW[v] : "") + 'c = bar_index >= 0\n';
  const out: Record<string, string> = {
    ternary: `${pre}tf = c ? timeframe.period : "240"\nplot(${sec}(syminfo.tickerid, tf, close), "x")\nplot(c ? 1 : 0, "y")\n`,
    ternaryOther: `${pre}tf = c ? "240" : timeframe.period\nplot(${sec}(syminfo.tickerid, tf, close), "x")\n`,
    userFn: `${pre}g() => timeframe.period\ntf = c ? "240" : g()\nplot(${sec}(syminfo.tickerid, tf, close), "x")\n`,
    symbolPos: `${pre}sym = c ? syminfo.tickerid : "X"\nplot(${sec}(sym, "240", close), "x")\n`,
  };
  if (v === 4) {
    out.iff = `${pre}tf = iff(c, "240", timeframe.period)\nplot(security(syminfo.tickerid, tf, close), "x")\n`;
  } else {
    out.switch = `${pre}tf = switch\n    c => "240"\n    => timeframe.period\nplot(${sec}(syminfo.tickerid, tf, close), "x")\n`;
    out.switchBuiltinArm = `${pre}tf = switch\n    c => timeframe.period\n    => "240"\nplot(str.length(tf) > 0 ? 1 : 0, "len")\n`;
  }
  return out;
}

for (const v of [4, 5, 6] as const) {
  for (const shadow of [false, true]) {
    describe(`v${v}${shadow ? ", a parameter named timeframe in scope" : ""}`, () => {
      const srcs = sources(v, shadow);

      it("a ?: branch that is the chart's period, with the other branch the request", () => {
        // c is true, so the ?: picks the first branch of each form.
        const { s, r } = run(srcs.ternary);
        // timeframe.period is "60": the chart's own series, nothing requested.
        expect(requested(s)).toEqual([]);
        expect(finite(values(r, "x"))).toBe(bars.length);
        expect(values(r, "x")).toEqual(bars.map((b) => b.close));
      });

      it("the request is keyed by the string, never by function source", () => {
        const { s } = run(srcs.ternaryOther);
        for (const k of requested(s)) expect(k).not.toMatch(/function|=>/);
      });

      it("a user function returning timeframe.period", () => {
        const { s, r } = run(srcs.userFn);
        expect(requested(s)).toEqual([]);   // c picks "240", resolved from the supplied data
        expect(finite(values(r, "x"))).toBeGreaterThan(0);
      });

      it("syminfo.tickerid as a value in the symbol position", () => {
        const { s, r } = run(srcs.symbolPos);
        expect(requested(s)).toEqual([]);
        expect(finite(values(r, "x"))).toBeGreaterThan(0);
      });
    });
  }

  describe(`v${v}: the value itself`, () => {
    it("x = cond ? timeframe.period : \"D\" yields the string", () => {
      for (const shadow of [false, true]) {
        const head = v === 4 ? '//@version=4\nstudy("t")\n' : `//@version=${v}\nindicator("t")\n`;
        const src = head + (shadow ? SHADOW[v] : "") +
          'x = bar_index >= 0 ? timeframe.period : "D"\n' +
          'y = bar_index >= 0 ? syminfo.tickerid : "Z"\n' +
          'plot(x == "60" ? 1 : 0, "isPeriod")\nplot(y == "BINANCE:BTCUSDT" ? 1 : 0, "isTicker")\n' +
          'plot(timeframe.multiplier == 60 ? 1 : 0, "m")\n';
        const { r } = run(src);
        expect(values(r, "isPeriod").every((x: number) => x === 1)).toBe(true);
        expect(values(r, "isTicker").every((x: number) => x === 1)).toBe(true);
      }
    });
  });
}

describe("v4 iff and v5/v6 switch with a built-in variable as an arm", () => {
  it("v4 iff(c, timeframe.period, \"240\") reads the value", () => {
    const { s, r } = run(sources(4, true).iff.replace('iff(c, "240", timeframe.period)', 'iff(c, timeframe.period, "240")'));
    expect(requested(s)).toEqual([]);
    expect(values(r, "x")).toEqual(bars.map((b) => b.close));
  });

  for (const v of [5, 6] as const) {
    it(`v${v} switch with timeframe.period as an arm, a parameter named timeframe in scope`, () => {
      const { s, r } = run(sources(v, true).switchBuiltinArm.replace('plot(str.length(tf) > 0 ? 1 : 0, "len")',
        'plot(request.security(syminfo.tickerid, tf, close), "x")'));
      expect(requested(s)).toEqual([]);
      expect(values(r, "x")).toEqual(bars.map((b) => b.close));
    });

    it(`v${v} switch falling to timeframe.period reaches request.security as the string`, () => {
      const { s, r } = run(sources(v, true).switch.replace('c => "240"', 'bar_index < 0 => "240"'));
      expect(requested(s)).toEqual([]);
      expect(values(r, "x")).toEqual(bars.map((b) => b.close));
    });
  }
});
