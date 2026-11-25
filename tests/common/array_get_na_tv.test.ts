/**
 * `array.get(id, na)` is na with no error. TradingView capture, popular-author
 * batch 2026-11-21 (v6); only `get`: `set` still rejects an na index.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../runtime/v1/session";

const bars = [0, 1].map((i) => ({ time: 1_700_000_000 + i * 3600, open: 1, high: 2, low: 0, close: 1, volume: 1 }));

describe.each(["5", "6"])("array.get with an na index, v%s", (v) => {
  it("returns na, by function and by method", () => {
    const s = new Session();
    expect(s.compile(`//@version=${v}
indicator("t")
a = array.from(1.0, 2.0)
int i = na
x = array.get(a, i)
y = a.get(i)
z = a.get(1)
log.info("{0} {1} {2}", na(x), na(y), z)
plot(close)
`).errors).toEqual([]);
    const r: any = s.runHistory(bars);
    expect(r.errors).toEqual([]);
    expect(r.logs[0].message).toBe("true true 2");
  });

  it("array.set with an na index still fails", () => {
    const s = new Session();
    // the one-bar dry run in compile() already raises it
    const errors = s.compile(`//@version=${v}\nindicator("t")\na = array.from(1.0)\nint i = na\narray.set(a, i, 5.0)\nplot(close)\n`).errors;
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toMatch(/out of bounds/);
  });
});
