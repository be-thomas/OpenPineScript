/**
 * A plain local nothing reads is not evaluated, from TradingView:
 *   dev-docs/tv-parity/_probes/version-scope/v6-dead-local       (ran clean)
 *   dev-docs/tv-parity/_probes/version-scope/v6-dead-local-used  (RE on bar 1)
 *   conformance/common/tradingview-findings.md (pe6 / pe6b, v5)
 * Only a side-effect-free initialiser is skipped; v1-v4 are unprobed and unchanged.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const bars = (n: number) => Array.from({ length: n }, (_, i) => ({
  time: 1_700_000_000 + i * 3600, open: 100, high: 101 + i, low: 99, close: 100 + i, volume: 1,
}));

function run(src: string, n = 5): any {
  const s = new Session();
  expect(s.compile(src).errors).toEqual([]);
  return s.runHistory(bars(n));
}

const DEAD_V6 = `//@version=6
indicator("dead local v6")
type C
    float h
var a = array.new<float>()
var u = array.new<C>()
a.push(close)
u.push(C.new(high))
sz = a.size()
int n = 0
if sz > 1
    for i = 2 to sz - 2
        float v = a.get(i)
        C c = u.get(i)
        n += 1
if bar_index < 5
    log.info("bar {0} sz {1} n {2}", bar_index, sz, n)
plot(n)
`;

const USED_V6 = `//@version=6
indicator("dead local v6 used")
var a = array.new<float>()
a.push(close)
sz = a.size()
int n = 0
if sz > 1
    for i = 2 to sz - 2
        float v = a.get(i)
        n += int(v)
if bar_index < 5
    log.info("bar {0} sz {1} n {2}", bar_index, sz, n)
plot(n)
`;

describe("dead local (v6 probe)", () => {
  it("runs clean and counts 0,3,2,1,2", () => {
    const r = run(DEAD_V6);
    expect(r.errors).toEqual([]);
    expect(r.logs.map((l: any) => l.message)).toEqual([
      "bar 0 sz 1 n 0", "bar 1 sz 2 n 3", "bar 2 sz 3 n 2", "bar 3 sz 4 n 1", "bar 4 sz 5 n 2",
    ]);
  });

  it("errors on bar 1 when the value is used", () => {
    const r = run(USED_V6);
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0]).toMatchObject({
      phase: "runtime", bar: 1,
      message: "In 'array.get()' function. Index 2 is out of bounds, array size is 2.",
    });
  });
});

describe("dead local, other versions and initialisers", () => {
  const body = (v: number, last: string) => `//@version=${v}
${v === 4 ? 'study("x")' : 'indicator("x")'}
a = array.new_float(3, 1.0)
if bar_index == 2
    ${last}
    plot_value = 1
plot(close)
`;

  it("v5 pe6: the same call into a local nothing reads raises no error", () => {
    const r = run(body(5, "dead = array.get(a, 5)"));
    expect(r.errors).toEqual([]);
  });

  it("v4 is unchanged: still errors", () => {
    const r = run(body(4, "dead = array.get(a, 5)"));
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0].message).toContain("Index 5 is out of bounds");
  });

  it("a local read afterwards still errors (v5)", () => {
    const r = run(body(5, "dead = array.get(a, 5)").replace("plot_value = 1", "plot_value = dead"));
    expect(r.errors).toHaveLength(1);
  });

  it("a dead local calling a user function still runs it", () => {
    const r = run(`//@version=6
indicator("x")
var calls = array.new_int()
f(int i) =>
    calls.push(i)
    i
if bar_index >= 0
    int dead = f(1)
    int other = 2
    other += 1
if bar_index == 4
    log.info("calls {0}", calls.size())
plot(close)
`);
    expect(r.errors).toEqual([]);
    expect(r.logs.map((l: any) => l.message)).toEqual(["calls 5"]);
  });
});
