/**
 * The contract a HOST depends on, as distinct from the one a script does.
 *
 * These are the guarantees dev-docs/integration/ tells an integrator to rely
 * on. Every one of them was broken at some point while that guide was being
 * written, and none of the other suites noticed: they drive the engine the way
 * the engine's own tests do, not the way an embedding application does.
 */
import { describe, it, expect } from "vitest";
import { Session, runScript } from "../../../runtime/v1/session";

const bars = (n: number) =>
  Array.from({ length: n }, (_, i) => {
    const p = 100 + Math.sin(i / 4) * 12;
    return {
      time: Date.UTC(2024, 0, 1) + i * 86_400_000,
      open: p, high: p + 3, low: p - 3, close: p + (i % 2 ? 1 : -1), volume: 1000 + i,
    };
  });

describe("an input override applies to every bar", () => {
  const source =
    '//@version=5\nindicator("i")\n' +
    'n = input.int(20, "Len", minval = 5, maxval = 30)\nplot(n, "n")\n';

  it("not only to the first one", () => {
    const session = new Session();
    session.compile(source);
    session.setInputs({ input_0: 12 });

    const data = session.runHistory(bars(40)).series[0].data as any[];
    const seen = [...new Set(data.map(d => d && d.value))];

    // `input()` numbers its calls in execution order and the body re-runs each
    // bar, so an unreset counter made the same call `input_0` on bar 0 and
    // `input_1` on bar 1. The override matched the first bar and nothing else,
    // which reads as "my setting is ignored" with no error anywhere.
    expect(seen).toEqual([12]);
  });

  it("and the declared bounds still clamp it", () => {
    const session = new Session();
    session.compile(source);
    session.setInputs({ input_0: 999 });
    const data = session.runHistory(bars(40)).series[0].data as any[];
    expect([...new Set(data.map(d => d && d.value))]).toEqual([30]);
  });

  it("and the input list does not grow with the bar count", () => {
    const session = new Session();
    const compiled = session.compile(source);
    expect(compiled.inputs.length).toBe(1);
    session.runHistory(bars(40));
    // One script, one input, whatever the chart's length.
    expect(session.compile(source).inputs.length).toBe(1);
  });
});

describe("the render model says `na` exactly one way", () => {
  it("a warming-up indicator is null, never NaN", () => {
    const result = runScript(
      '//@version=5\nindicator("i")\nplot(ta.sma(close, 20), "SMA")\n',
      { candles: bars(40) },
    );
    const data = result.series[0].data as any[];

    // A host finds its gaps with `point === null`. NaN leaking through as
    // `{ value: NaN }` made the first nineteen bars look like real values, and
    // a chart library renders those as zero.
    expect(data.slice(0, 19).every(d => d === null)).toBe(true);
    expect(data[19]).not.toBeNull();
    expect(data.every(d => d === null || Number.isFinite(d.value))).toBe(true);
  });

  it("bgcolor(na) is null rather than a blank colour", () => {
    const result = runScript(
      '//@version=5\nindicator("i", overlay = true)\n' +
      'bgcolor(close > open ? color.green : na)\n',
      { candles: bars(40) },
    );
    const data = result.series.find(s => s.type === "bgcolor")!.data as any[];
    expect(data.some(d => d === null)).toBe(true);
    expect(data.every(d => d === null || (d.color && d.color !== ""))).toBe(true);
  });
});

describe("a closed trade knows when it was entered", () => {
  it("entryTime is the bar the entry filled on", () => {
    const candles = bars(40);
    const result = runScript(
      '//@version=5\nstrategy("s")\n' +
      'if bar_index == 10\n    strategy.entry("L", strategy.long, 1)\n' +
      'if bar_index == 20\n    strategy.close("L")\n',
      { candles },
    );

    expect(result.trades.length).toBe(1);
    // A market order placed on bar 10 fills at bar 11's open. `entryTime` was
    // written as a literal 0, so a host had no bar to draw the entry on and
    // `strategy.closedtrades.entry_bar_index()` resolved it to `na`.
    expect(result.trades[0].entryTime).toBe(candles[11].time);
    expect(result.trades[0].exitTime).toBe(candles[21].time);
  });

  it("and the still-open trade is reported separately", () => {
    const result = runScript(
      '//@version=5\nstrategy("s")\n' +
      'if bar_index == 10\n    strategy.entry("L", strategy.long, 1)\n',
      { candles: bars(40) },
    );
    // Not in `trades` — it has not closed — so a host that reads only `trades`
    // loses the last, usually most interesting, position.
    expect(result.trades).toEqual([]);
    expect(result.position.size).toBe(1);
    expect(result.position.entryBarIndex).toBe(11);
  });
});
