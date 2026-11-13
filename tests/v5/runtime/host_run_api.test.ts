/**
 * Host-facing additions to a run: `SimResult.droppedArguments` and
 * `Session.runHistory(bars, { onProgress })`.
 */
import { describe, it, expect } from "vitest";
import { Session, type RunOptions } from "../../../index";

const bars = (n: number) => Array.from({ length: n }, (_, i) => ({
  time: Date.UTC(2024, 0, 1) + i * 86_400_000, open: 100, high: 101, low: 99, close: 100, volume: 1,
}));

describe("SimResult.droppedArguments", () => {
  it("lists what the script passed and the engine ignored, as plain cloneable text", () => {
    const s = new Session();
    s.compile('//@version=5\nindicator("t")\nplot(close, nonesuch = 3)\n');
    const r = s.runHistory(bars(3));
    expect(r.droppedArguments).toEqual(["plot(nonesuch)"]);
    expect(structuredClone(r.droppedArguments)).toEqual(["plot(nonesuch)"]);
  });

  it("is empty when everything was honoured", () => {
    const s = new Session();
    s.compile('//@version=5\nindicator("t")\nplot(close, "c", color.red)\n');
    expect(s.runHistory(bars(3)).droppedArguments).toEqual([]);
  });
});

describe("runHistory onProgress", () => {
  const compile = () => {
    const s = new Session();
    s.compile('//@version=5\nindicator("t")\nplot(close)\n');
    return s;
  };

  it("reports about every 1%: 1000 bars is every 10, ending at 1000 of 1000", () => {
    const calls: Array<[number, number]> = [];
    const opts: RunOptions = { onProgress: (done, total) => calls.push([done, total]) };
    compile().runHistory(bars(1000), opts);
    expect(calls).toHaveLength(100);
    expect(calls[0]).toEqual([10, 1000]);
    expect(calls[1]).toEqual([20, 1000]);
    expect(calls[99]).toEqual([1000, 1000]);
    for (let i = 1; i < calls.length; i++) expect(calls[i][0]).toBeGreaterThan(calls[i - 1][0]);
  });

  it("a short run reports every bar, once each: 3 bars is 1, 2, 3", () => {
    const calls: number[] = [];
    compile().runHistory(bars(3), { onProgress: (done) => calls.push(done) });
    expect(calls).toEqual([1, 2, 3]);
  });

  it("an empty run reports 0 of 0 once", () => {
    const calls: Array<[number, number]> = [];
    compile().runHistory([], { onProgress: (d, t) => calls.push([d, t]) });
    expect(calls).toEqual([[0, 0]]);
  });

  it("gives the same result with or without it", () => {
    const a = compile().runHistory(bars(250));
    const b = compile().runHistory(bars(250), { onProgress: () => {} });
    expect(b).toEqual(a);
  });

  it("a callback that throws does not fail the run", () => {
    const r = compile().runHistory(bars(50), { onProgress: () => { throw new Error("ui"); } });
    expect(r.errors).toEqual([]);
    expect(r.series[0].data).toHaveLength(50);
  });

  it("without options, behaves as before", () => {
    expect(compile().runHistory(bars(5)).errors).toEqual([]);
  });
});
