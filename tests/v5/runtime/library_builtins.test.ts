/**
 * A library function reads built-in series the way a script does.
 *
 * Names a library DECLARES are scoped (`$lib$<alias>$`) so two libraries'
 * `len` cannot share a series. The scope decision was made from the flat set
 * of every name the library binds anywhere, so a function PARAMETER called
 * `high` in one function turned every bare `high` in every other function into
 * a read of a variable that does not exist: "opsv2_$lib$ml$high is not defined".
 * A built-in is only shadowed where a binding is actually in scope.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const bars = Array.from({ length: 30 }, (_, i) => ({
  time: Date.UTC(2024, 0, 1) + i * 3_600_000, open: 100 + i, high: 102 + i, low: 98 + i, close: 101 + i, volume: 10,
}));

const LIB = [
  '//@version=5',
  'library("Ml")',
  // reads built-ins bare, with a `ta.` call
  'export range() =>',
  '    r = high - low',
  '    ta.sma(r, 3) + close * 0 + bar_index * 0 + time * 0',
  // a parameter that shadows a built-in, in a DIFFERENT function
  'export spread(series float high, series float low) =>',
  '    high - low',
  // a built-in-named local in one function must not leak into the next
  'export tail() =>',
  '    high',
].join("\n") + "\n";

const HOST = [
  '//@version=5',
  'indicator("t")',
  'import me/Ml/1 as ml',
  'plot(ml.range(), "range")',
  'plot(ml.spread(close, open), "spread")',
  'plot(ml.tail(), "tail")',
].join("\n") + "\n";

describe("built-ins inside a library function", () => {
  it("are not scoped just because another function takes a parameter of the same name", () => {
    const s = new Session();
    const c = s.compile(HOST, { libraries: { "me/Ml/1": LIB } });
    expect(c.errors).toEqual([]);
    const r = s.runHistory(bars);
    expect(r.errors).toEqual([]);
    const last = (id: string) => {
      const pts = r.series.find((x: any) => x.title === id || x.id === id)!.data;
      return pts[pts.length - 1].value;
    };
    expect(last("range")).toBe(4);          // (102+i) - (98+i)
    expect(last("spread")).toBe(1);         // close - open = 101+i - (100+i)
    expect(last("tail")).toBe(102 + 29);    // the bar's own high
  });

  it("still reads the parameter, not the built-in, inside the function that declares it", () => {
    const s = new Session();
    s.compile(HOST, { libraries: { "me/Ml/1": LIB } });
    const r = s.runHistory(bars);
    const spread = r.series.find((x: any) => x.title === "spread" || x.id === "spread")!;
    // high=close(101+i), low=open(100+i): 1, never the bar's high-low of 4
    expect(spread.data.every((p: any) => p.value === 1)).toBe(true);
  });
});
