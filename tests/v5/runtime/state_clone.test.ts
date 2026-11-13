/**
 * The per-bar rollback copy of a built-in's state gives what `structuredClone`
 * gives, for plain data, and hands anything else to it.
 */
import { describe, it, expect, vi } from "vitest";
import { cloneState } from "../../../runtime/v1/stateClone";
import { Session } from "../../../runtime/v1/session";

describe("cloneState", () => {
  it("copies plain state, independent of the original", () => {
    const state = { buffer: [1, NaN, -0, 4.5], sum: 3, prev: undefined, name: "x", nested: { seed: [1, 2], n: null } };
    const c = cloneState(state);
    expect(c).toEqual(structuredClone(state));
    expect(Object.is(c.buffer[2], -0)).toBe(true);
    expect("prev" in c).toBe(true);
    state.buffer.push(9); state.nested.seed[0] = 7;
    expect(c.buffer).toEqual([1, NaN, -0, 4.5]);
    expect(c.nested.seed).toEqual([1, 2]);
  });

  it("hands other values to structuredClone", () => {
    const m = { map: new Map([[1, 2]]), d: new Date(5) };
    const c = cloneState(m);
    expect(c.map).toBeInstanceOf(Map);
    expect(c.map.get(1)).toBe(2);
    expect(c.d.getTime()).toBe(5);
  });

  it("keeps holes, shared references and cycles, as structuredClone does", () => {
    const sparse = [1, , 3];   // eslint-disable-line no-sparse-arrays
    const c1 = cloneState({ a: sparse });
    expect(1 in c1.a).toBe(false);
    const shared = [{ x: 1 }];
    const c2 = cloneState({ p: shared, q: shared });
    expect(c2.p).toBe(c2.q);
    const cyc: any = { n: 1 }; cyc.self = cyc;
    const c3 = cloneState(cyc);
    expect(c3.self).toBe(c3);
  });

  it("still refuses what structuredClone refuses", () => {
    expect(() => cloneState({ f: () => 1 })).toThrow();
  });
});

describe("a site reached twice on one bar still rolls back", () => {
  it("ta.sma called three times in a loop gives the same value each reach, as ta.sma once does", () => {
    const bars = Array.from({ length: 40 }, (_, i) => ({
      time: Date.UTC(2024, 0, 1) + i * 86_400_000, open: 100 + i, high: 105 + i, low: 95 + i, close: 100 + i * i % 7, volume: 1,
    }));
    const s = new Session();
    const c = s.compile('//@version=5\nindicator("t")\nt = 0.0\nfor i = 1 to 3\n    t += ta.sma(close, 5)\nplot(t / 3, "loop")\nplot(ta.sma(close, 5), "one")\n');
    expect(c.errors).toEqual([]);
    const r = s.runHistory(bars);
    const loop = r.series.find((p) => p.title === "loop")!.data.map((d: any) => d?.value);
    const one = r.series.find((p) => p.title === "one")!.data.map((d: any) => d?.value);
    loop.slice(4).forEach((v: number, i: number) => expect(v).toBeCloseTo(one[i + 4], 9));
    expect(Number.isFinite(loop[39])).toBe(true);
  });

  it("copies a rolling buffer without structuredClone", () => {
    const bars = Array.from({ length: 300 }, (_, i) => ({
      time: Date.UTC(2024, 0, 1) + i * 60_000, open: 100, high: 101, low: 99, close: 100 + (i % 5), volume: 1,
    }));
    const s = new Session();
    s.compile('//@version=5\nindicator("t")\nplot(ta.sma(close, 20))\n');
    const spy = vi.spyOn(globalThis, "structuredClone");
    s.runHistory(bars);
    const calls = spy.mock.calls.length;
    spy.mockRestore();
    expect(calls).toBeLessThan(10);
  });
});
