/**
 * v6 constant `+ - *` expressions: each operation in IEEE double, rounded to 15 significant digits. `1.0 - 0.9` is
 * 0.1, not IEEE 0.09999999999999998. TradingView probes triage/r6 ind2p p_n128_features_adam4 (an online Adam with
 * `(1.0 - 0.9) * g` matches bit for bit over the whole history only with 0.1) and triage/r6 cfold
 * p_const_fold_rules (BTCUSDT 1h, v6): 1e16 + 1.0 - 1e16 = 0, 0.1 * 3 = 0.3, 0.3 / 0.1 = 2.9999999999999996,
 * close * 0 + 1.0 - 0.9 IEEE, typed `float x = 0.9` -> 1.0 - x = 0.1, input -> IEEE. Capture n128 likewise.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const bars = Array.from({ length: 3 }, (_, i) => ({ time: 1_700_000_000_000 + i * 3_600_000, open: 1, high: 1, low: 1, close: 1, volume: 1 }));

function values(src: string): number[] {
  const s = new Session();
  expect(s.compile(src).errors).toEqual([]);
  const r: any = s.runHistory(bars);
  expect(r.errors).toEqual([]);
  return (Object.values(r.series) as any[]).map(p => p.data.at(-1).value);
}

describe("constant folding (IEEE, 15 significant digits)", () => {
  it("v6: matches TradingView's p_const_fold_rules plots", () => {
    const v = values(`//@version=6
indicator("p_const_fold_rules")
float x = 0.9
i = input.float(0.9)
plot(1e16 + 1.0 - 1e16, "a")
plot(0.1 * 3, "b")
plot(0.3 / 0.1, "d")
plot(7.0 % 0.1, "e")
plot(close * 0 + 1.0 - 0.9, "g")
plot(1.0 - x, "h")
plot(1.0 - i, "i")
`);
    expect(v).toEqual([0, 0.3, 0.3 / 0.1, 7.0 % 0.1, 1 - 0.9, 0.1, 1.0 - 0.9]);
  });

  it("v6: a for-loop counter is not a constant name", () => {
    const [a] = values(`//@version=6
indicator("loop")
float s = 0.0
for i = 0 to 3
    s += i + 1
plot(s, "a")
`);
    expect(a).toBe(10);
  });

  it("v6: literal and const-name differences are exact", () => {
    const [a, b, c, d, e] = values(`//@version=6
indicator("fold")
beta1 = 0.9
beta2 = 0.999
f(float g) => (1.0 - beta1) * g
plot(1.0 - 0.9, "a")
plot(f(1.0), "b")
plot((1.0 - beta2) * 1.0, "c")
plot(close * (1.0 - 0.9), "d")
plot(0.1 + 0.2, "e")
`);
    expect(a).toBe(0.1);
    expect(b).toBe(0.1);
    expect(c).toBe(0.001);
    expect(d).toBe(0.1);
    expect(e).toBe(0.3);
  });

  it("v6: a series operand or a reassigned name is not folded", () => {
    const [a, b] = values(`//@version=6
indicator("fold")
x = 0.9
x := 0.9
plot(1.0 - x, "a")
plot(close - 0.9, "b")
`);
    expect(a).toBe(1.0 - 0.9);
    expect(b).toBe(1 - 0.9);
  });

  it("v5 is unchanged (no evidence there yet)", () => {
    const [a] = values(`//@version=5
indicator("fold")
plot(1.0 - 0.9, "a")
`);
    expect(a).toBe(1.0 - 0.9);
  });
});
