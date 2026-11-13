/**
 * `runtime.error(...)` is the script speaking, not a fault: the wire error
 * carries `kind: "script"` so a host can show it as the script's own message.
 * Every other runtime error, including the limits TradingView enforces with
 * the same error class ("String is too long ..."), has no `kind`.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const bars = Array.from({ length: 6 }, (_, i) => ({
  time: Date.UTC(2024, 0, 1) + i * 86_400_000, open: 100, high: 101, low: 99, close: 100, volume: 1,
}));

describe("kind on a runtime error", () => {
  it("is script for runtime.error raised on the compile dry run", () => {
    const c = new Session().compile([
      '//@version=5',
      'indicator("t")',
      'runtime.error("Use a daily chart")',
      'plot(close)',
    ].join("\n"));
    expect(c.errors).toHaveLength(1);
    expect(c.errors[0]).toMatchObject({ phase: "runtime", kind: "script", message: "Use a daily chart", line: 3 });
  });

  it("is script for runtime.error raised mid-history, with its bar", () => {
    const s = new Session();
    expect(s.compile([
      '//@version=6',
      'indicator("t")',
      'if bar_index == 3',
      '    runtime.error("stop at 3")',
      'plot(close)',
    ].join("\n")).errors).toEqual([]);
    const r = s.runHistory(bars);
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0]).toMatchObject({ phase: "runtime", kind: "script", message: "stop at 3", bar: 3 });
  });

  it("is absent for an out-of-bounds array.get", () => {
    const s = new Session();
    s.compile([
      '//@version=5',
      'indicator("t")',
      'a = array.from(1.0, 2.0)',
      'plot(array.get(a, bar_index))',
    ].join("\n"));
    const r = s.runHistory(bars);
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0].phase).toBe("runtime");
    expect(r.errors[0].kind).toBeUndefined();
  });

  it("is absent for the v5 string length limit, which uses the same error class", () => {
    const s = new Session();
    s.compile([
      '//@version=5',
      'indicator("t")',
      'var s = ""',
      'if bar_index == 2',
      '    s := str.repeat("x", 4096) + "y"',
      'plot(close)',
    ].join("\n"));
    const r = s.runHistory(bars);
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0].message).toMatch(/^String is too long 4097, max allowed length is 4096\./);
    expect(r.errors[0].kind).toBeUndefined();
  });
});
