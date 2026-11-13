/**
 * `input()` answers from the previous bar's answer when it is handed the same
 * plain arguments and has the same override, and works the value out again
 * otherwise. The script body runs on every bar, so a script with a hundred
 * inputs made a hundred registrations per bar.
 */
import { describe, it, expect, vi } from "vitest";
import { Context } from "../../../runtime/v1/context";
import { Session } from "../../../runtime/v1/session";

const bars = Array.from({ length: 12 }, (_, i) => ({
  time: Date.UTC(2024, 0, 1) + i * 86_400_000, open: 100 + i, high: 105 + i, low: 95 + i, close: 100 + i, volume: 1,
}));
const values = (r: any, title: string) => r.series.find((p: any) => p.title === title)!.data.map((d: any) => d?.value);

describe("input memo", () => {
  it("gives the same value every bar and one definition", () => {
    const s = new Session();
    const c = s.compile('//@version=5\nindicator("t")\nn = input.int(5, "N", minval = 2, maxval = 9)\nm = input.string("b", "M", options = ["a", "b"])\nplot(n, "n")\nplot(m == "b" ? 1 : 0, "m")\n');
    expect(c.errors).toEqual([]);
    expect(c.inputs.map((i) => [i.title, i.default])).toEqual([["N", 5], ["M", "b"]]);
    const r = s.runHistory(bars);
    expect(values(r, "n")).toEqual(Array(12).fill(5));
    expect(values(r, "m")).toEqual(Array(12).fill(1));
  });

  it("follows an override, clamped, and a changed override on the next run", () => {
    const s = new Session();
    s.compile('//@version=5\nindicator("t")\nplot(input.int(5, "N", minval = 2, maxval = 9), "n")\n');
    s.setInputs({ input_0: 20 });
    expect(values(s.runHistory(bars), "n")).toEqual(Array(12).fill(9));
    s.setInputs({ input_0: 3 });
    expect(values(s.runHistory(bars), "n")).toEqual(Array(12).fill(3));
  });

  it("works the value out again when the argument changes bar to bar", () => {
    const s = new Session();
    s.compile('//@version=5\nindicator("t")\nd = bar_index < 6 ? 3 : 7\nplot(input.int(d, "N"), "n")\n');
    expect(values(s.runHistory(bars), "n")).toEqual([3, 3, 3, 3, 3, 3, 7, 7, 7, 7, 7, 7]);
  });

  it("registers each input once, not once per bar", () => {
    const s = new Session();
    s.compile('//@version=5\nindicator("t")\nplot(input.int(5, "N", minval = 2) + input.float(1.5, "F"), "x")\n');
    const spy = vi.spyOn(Context as any, "constrainInput");
    s.runHistory(bars);
    const calls = spy.mock.calls.length;
    spy.mockRestore();
    expect(calls).toBeLessThanOrEqual(4);   // the first bar, for each of the two
  });
});
