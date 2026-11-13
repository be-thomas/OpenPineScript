/**
 * TradingView's runtime error for an out-of-bounds array.get whose value is
 * used (conformance/v5/parity/parse_errors/pe6b_array_get_out_of_bounds_used.png):
 *
 *   Runtime error: RE10045
 *   Error on bar 10: In 'array.get()' function. Index 5 is out of bounds, array size is 3.
 *   at #main():6
 *
 * The same call assigned to a local nothing reads (pe6) raised NO error on
 * TradingView: a plain local nothing reads is not evaluated.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Session } from "../../../runtime/v1/session";

const DIR = join(__dirname, "..", "..", "..", "conformance", "v5", "parity", "parse_errors");
const bars = Array.from({ length: 30 }, (_, i) => ({
  time: Date.UTC(2024, 0, 1) + i * 86_400_000, open: 100, high: 101, low: 99, close: 100, volume: 1,
}));

describe("pe6b: array.get out of bounds, value used", () => {
  it("raises on bar 10, at line 6, in TradingView's words", () => {
    const s = new Session();
    expect(s.compile(readFileSync(join(DIR, "pe6b_array_get_out_of_bounds_used.pine"), "utf8")).errors).toEqual([]);
    const r = s.runHistory(bars);
    expect(r.errors).toHaveLength(1);
    expect(r.errors[0]).toMatchObject({
      phase: "runtime", bar: 10, line: 6,
      message: "In 'array.get()' function. Index 5 is out of bounds, array size is 3.",
    });
  });

  // TradingView ran pe6 clean: an unused local with a side-effect-free
  // initialiser is never evaluated.
  it("pe6: the same call into a local nothing reads raises no error", () => {
    const s = new Session();
    expect(s.compile(readFileSync(join(DIR, "pe6_array_get_out_of_bounds.pine"), "utf8")).errors).toEqual([]);
    expect(s.runHistory(bars).errors).toEqual([]);
  });
});
