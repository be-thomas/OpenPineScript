/**
 * A runtime error names the Pine line it came from.
 *
 * `In 'array.get()' function. Index 2 is out of bounds, array size is 2.` said what was wrong and not
 * where, so a 2,000-line script gave its author nothing to look at. The call
 * ids the transpiler emits carry their position (`array.get@L5:C4`), and
 * `Context.call` pins an error to the innermost one as it unwinds.
 *
 * Lines are 1-based and columns 0-based, as for compile errors. Each source
 * below is written with its failing line as a numbered comment.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const bars = Array.from({ length: 6 }, (_, i) => ({
  time: Date.UTC(2024, 0, 1) + i * 86_400_000, open: 100, high: 101, low: 99, close: 100, volume: 1,
}));

function run(src: string, libraries?: Record<string, string>) {
  const s = new Session();
  const c = s.compile(src, { libraries });
  expect(c.errors, "the error must come at run time, not in the compile dry run").toEqual([]);
  return s.runHistory(bars);
}

describe("the line of a runtime error", () => {
  it("is the array.get call, at top level", () => {
    const r = run([
      '//@version=5',                       // 1
      'indicator("t")',                     // 2
      'a = array.from(1.0, 2.0)',           // 3
      'x = 1',                              // 4
      'y = array.get(a, bar_index)',        // 5  <- bar 2 reads index 2 of 2
      'plot(y)',                            // 6
    ].join("\n"));
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0]).toMatchObject({
      phase: "runtime", line: 5, col: 4, severity: "error",
      message: "In 'array.get()' function. Index 2 is out of bounds, array size is 2.",
    });
    expect(r.errors[0].library).toBeUndefined();
    // Bars 0 and 1 ran: the error is at the bar it is about.
    expect(r.barsProcessed).toBe(2);
  });

  it("is the call INSIDE a user function, not the call to it", () => {
    const r = run([
      '//@version=5',                       // 1
      'indicator("t")',                     // 2
      'a = array.from(1.0, 2.0)',           // 3
      'pick(array<float> arr, int i) =>',   // 4
      '    float v = 0.0',                  // 5
      '    v := array.get(arr, i)',         // 6  <- here
      '    v',                              // 7
      'plot(pick(a, bar_index))',           // 8  (the call to it)
    ].join("\n"));
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0]).toMatchObject({ phase: "runtime", line: 6, col: 9 });
  });

  it("is the line in the main script that called a library function, with the library's own line", () => {
    const lib = [
      '//@version=5',                       // 1
      'library("mylib")',                   // 2
      'export pick(array<float> a, int i) =>', // 3
      '    float v = array.get(a, i)',      // 4  <- inside the library
      '    v * 2',                          // 5
    ].join("\n");
    const r = run([
      '//@version=5',                       // 1
      'indicator("t")',                     // 2
      'import me/mylib/1 as L',             // 3
      'a = array.from(1.0, 2.0)',           // 4
      'x = 1',                              // 5
      'y = L.pick(a, bar_index)',           // 6  <- the call the user wrote
      'plot(y)',                            // 7
    ].join("\n"), { "me/mylib/1": lib });
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0]).toMatchObject({
      phase: "runtime", line: 6, col: 4,
      library: { alias: "L", line: 4, col: 14 },
    });
  });

  it("is the innermost call when calls nest: the outer array.get is fine", () => {
    const r = run([
      '//@version=5',                                   // 1
      'indicator("t")',                                 // 2
      'a = array.from(1.0, 2.0)',                       // 3
      'b = array.from(0, 1)',                           // 4
      'y = array.get(b, array.get(a, bar_index) > 0 ? 0 : 1)', // 5
      'plot(y)',                                        // 6
    ].join("\n"));
    // The inner array.get(a, 2) fails at bar 2. "y = array.get(b, " is 17
    // characters, so the inner call starts at column 17; the outer one at 4.
    expect(r.errors[0].line).toBe(5);
    expect(r.errors[0].col).toBe(17);
  });

  it("is reported by a result that still clones", () => {
    const r = run('//@version=5\nindicator("t")\na = array.from(1.0)\nplot(array.get(a, bar_index))\n');
    expect(r.errors[0].line).toBe(4);
    expect(() => structuredClone(r)).not.toThrow();
  });

  it("leaves a message alone: runtime.error still reads as the script wrote it", () => {
    // plot(): TradingView refuses an indicator with no output before it runs.
    const r = run('//@version=5\nindicator("t")\nif bar_index == 3\n    runtime.error("boom")\nplot(close)\n');
    expect(r.errors[0]).toMatchObject({ phase: "runtime", line: 4, col: 4, message: "boom" });
  });
});
