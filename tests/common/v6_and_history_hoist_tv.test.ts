/**
 * v6 `and`/`or` evaluate their right operand lazily, but a history reference in it
 * (`a.get(0)[1]`) still needs its series on every bar, so the call under `[1]` runs
 * even when the left operand is false. On an empty array that is an error.
 *
 * TradingView probe pr33-review/01_p1-guarded (BINANCE:BTCUSDT 1h, v6): the script
 * below stops with "Error on bar 0: In 'array.get()' function. Index 0 is out of
 * bounds, array size is 0." (RE10045) although `a.size() > 0` is false there.
 * This looks like a regression and is not one: keep the error.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../runtime/v1/session";

const bars = Array.from({ length: 5 }, (_, i) => ({ time: 1_700_000_000_000 + i * 3600_000, open: 1, high: 2, low: 0, close: 1 + i, volume: 1 }));

describe("v6: `size() > 0 and a.get(0)[1] > 0` on an empty array (probe 01_p1-guarded), v6", () => {
  it("fails on bar 0 with index 0 out of bounds", () => {
    const s = new Session();
    const src = `//@version=6
indicator("p1 guarded")
var a = array.new_float()
if bar_index > 250
    a.push(close)
ok = a.size() > 0 and a.get(0)[1] > 0
plot(ok ? 1 : 0, "ok")
plot(a.size(), "size")
`;
    const comp = s.compile(src);
    const errors: any[] = comp.errors.length > 0 ? comp.errors : (s.runHistory(bars) as any).errors;
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toMatch(/Index 0 is out of bounds/);
    expect(errors[0].message).toMatch(/size is 0/);
  });
});
