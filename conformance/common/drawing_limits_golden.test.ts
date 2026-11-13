/**
 * TradingView's drawing-limit rule, against its own log.
 *
 * conformance/v5/parity/probe_drawing_limits.pine declares
 * `max_lines_count = 10, max_labels_count = 10` and logs, on TradingView, how
 * many drawings survive after each creation. The rule it measured is in the
 * doc comment on `Context.drawingLimits`: past `limit + 5`, cut back to
 * `limit`, at the creation itself.
 *
 * None of the logged lines depend on prices, so the candles here are made up.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Session } from "../../index";

const DIR = join(__dirname, "..", "v5", "parity");
const SCRIPT = readFileSync(join(DIR, "probe_drawing_limits.pine"), "utf8");
const CSV = readFileSync(join(DIR, "probe_drawing_limits.BTCUSDT.5.csv"), "utf8");

const tv = CSV.split("\n").slice(1).filter(Boolean).map(line => {
  const m = line.slice(line.indexOf(",") + 1);
  return m.startsWith('"') ? m.slice(1, -1).replace(/""/g, '"') : m;
});

const candles = Array.from({ length: 50 }, (_, i) => ({
  time: 1_760_000_000_000 + i * 300_000,
  open: 100 + i, high: 101 + i, low: 99 + i, close: 100.5 + i, volume: 1,
}));

const session = new Session();
const compiled = session.compile(SCRIPT, { symbol: { tickerid: "BINANCE:BTCUSDT", mintick: 0.01 }, timeframe: "5" } as any);
const result: any = compiled.errors.length ? null : session.runHistory(candles);
const ours: string[] = (result?.logs ?? []).map((l: any) => l.message ?? String(l));
const only = (msgs: string[], prefix: string) => msgs.filter(m => m.startsWith(prefix));

describe("drawing limits probe against TradingView", () => {
  it("compiles and runs", () => {
    expect(compiled.errors).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it("HIST: the line count after each bar matches", () => {
    expect(only(tv, "HIST|").length).toBe(30);
    expect(only(ours, "HIST|")).toEqual(only(tv, "HIST|"));
  });

  it("LF: linefill.new on two na lines creates nothing", () => {
    expect(only(tv, "LF|")).toEqual(["LF|0|0"]);
    expect(only(ours, "LF|")).toEqual(only(tv, "LF|"));
  });

  it("LOOP: the label count after each label.new, inside one execution, matches", () => {
    expect(only(tv, "LOOP|").length).toBe(1);
    expect(only(ours, "LOOP|")).toEqual(only(tv, "LOOP|"));
  });

  it("AFTER: 12 labels survive the run", () => {
    // TradingView logged AFTER|12 on the first realtime bar. A history run has
    // no realtime bar, so the engine's surviving label drawings are counted
    // instead; nothing creates a label after the LOOP burst.
    expect(only(tv, "AFTER|")).toEqual(["AFTER|12"]);
    expect(result.drawings.filter((d: any) => d.kind === "label").length).toBe(12);
  });
});
