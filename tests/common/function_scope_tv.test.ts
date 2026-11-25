/**
 * A variable declared inside a function body is local to that call, even when
 * the same name is declared at script scope, in a block, or in another
 * function. TradingView capture, popular-author batch 2026-11-21 (v6); Pine
 * function scope is the same language rule since v4.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../runtime/v1/session";

const bars = Array.from({ length: 6 }, (_, i) => {
  const close = 100 + i * 3;
  return { time: 1_700_000_000 + i * 3600, open: close, high: close + 1, low: close - 1, close, volume: 1 };
});

function run(src: string): { logs: string[]; plot: number[] } {
  const s = new Session();
  expect(s.compile(src).errors).toEqual([]);
  const r: any = s.runHistory(bars);
  expect(r.errors).toEqual([]);
  return {
    logs: r.logs.map((l: any) => String(l.message)),
    plot: r.series[0].data.map((p: any) => p?.value ?? NaN),
  };
}

const HEADS: Record<string, string> = {
  "4": '//@version=4\nstudy("t")\n',
  "5": '//@version=5\nindicator("t")\n',
  "6": '//@version=6\nindicator("t")\n',
};
const LOG: Record<string, string> = { "4": "", "5": "log", "6": "log" };

describe.each(["4", "5", "6"])("function-local variables, v%s", (v) => {
  const head = HEADS[v];
  const typed = v === "4" ? "" : "int ";

  it("a function local does not overwrite a script variable of the same name", () => {
    const { plot } = run(head + `f(k) =>
    q = k * 2
    q
q = close
r = f(3)
plot(q)
plot(r)
`.replace("plot(r)\n", ""));
    expect(plot).toEqual(bars.map((b) => b.close));
  });

  it("the function still computes with its own local", () => {
    const { plot } = run(head + `f(k) =>
    q = k * 2
    q
q = close
r = f(3)
plot(r)
`);
    expect(plot).toEqual(bars.map(() => 6));
  });

  it("two functions and a script block each keep their own n", () => {
    const { plot } = run(head + `inner() =>
    ${typed}n = 10
    n
outer() =>
    ${typed}n = 2
    inner()
    n
if true
    ${typed}n = 5
    x = n
plot(outer())
`);
    expect(plot).toEqual(bars.map(() => 2));
  });

  it("a function local used as a loop counter leaves a script variable alone", () => {
    const { plot } = run(head + `f() =>
    s = 0
    for c = 1 to 20
        s := s + 1
    s
r = f()
c = r > 0 ? 7 : 0
plot(c)
`);
    expect(plot).toEqual(bars.map(() => 7));
  });
});

describe.each(["5", "6"])("function local numeric, script local bool of one name, v%s", (v) => {
  it("compiles and computes", () => {
    const { plot } = run(HEADS[v] + `f() =>
    int valid = 0
    valid := valid + 4
    valid
if close > 0
    bool valid = f() == 4
    plot(valid ? 1 : 0)
`);
    expect(plot).toEqual(bars.map(() => 1));
  });
});
