/**
 * `str.tostring(x, format)` against TradingView. Every expected string is what
 * TradingView's Pine Logs printed (BINANCE:BTCUSDT, mintick 0.01; the EURUSDC
 * case is run a8ade4d1, mintick 0.0001), read from the two probe runs:
 *
 *   dev-docs/tv-parity/_probes/udt-cond-formats/tv-run/pine_logs.json
 *   dev-docs/tv-parity/_probes/formats2/pine_logs_download.csv
 *
 * Each case runs through a real script so the whole path is exercised.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const bars = Array.from({ length: 3 }, (_, i) => ({
  time: Date.UTC(2024, 0, 1) + i * 3_600_000, open: 100, high: 101, low: 99, close: 100, volume: 1,
}));

/** [number literal, format expression, expected]. */
type Case = [string, string, string];

function run(mintick: number, cases: Case[]): string[] {
  const body = cases.map(([x, f]) => `    log.info(str.tostring(${x}, ${f}))`).join("\n");
  const src = `//@version=5\nindicator("t")\nif barstate.islast\n${body}\nplot(close)\n`;
  const s = new Session();
  s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "60", mintick });
  expect(s.compile(src).errors).toEqual([]);
  const r: any = s.runHistory(bars);
  expect(r.errors ?? []).toEqual([]);
  return r.logs.map((l: any) => l.message);
}

const q = (p: string) => JSON.stringify(p);

const cases: Case[] = [
  // format.mintick (0.01)
  ["74485.6", "format.mintick", "74485.60"],
  ["74485.0", "format.mintick", "74485.00"],
  ["74485.123", "format.mintick", "74485.12"],
  // format.volume
  ["0", "format.volume", "0"],
  ["0.5", "format.volume", "1"],
  ["12.3456", "format.volume", "12"],
  ["999", "format.volume", "999"],
  ["999.9", "format.volume", "1000"],
  ["1000", "format.volume", "1K"],
  ["1234.5678", "format.volume", "1.235K"],
  ["999999", "format.volume", "999.999K"],
  ["1234567", "format.volume", "1.235M"],
  ["1500000000", "format.volume", "1.5B"],
  ["2500000000000", "format.volume", "2.5T"],
  ["-12295.92", "format.volume", "-12.296K"],
  ["5", "format.volume", "5"],
  ["12295.92", "format.volume", "12.296K"],
  // format.percent
  ["12.3456", "format.percent", "12.35%"],
  ["0", "format.percent", "0.00%"],
  ["-0.5", "format.percent", "-0.50%"],
  ["100", "format.percent", "100.00%"],
  ["1234.5678", "format.percent", "1234.57%"],
  // price / inherit are plain literal patterns on TradingView
  ["74485.6", "format.price", "price74486"],
  ["1.23456789", "format.price", "price1"],
  ["74485.6", "format.inherit", "inherit74486"],
  // patterns
  ["0", q("#.0"), ".0"],
  ["0.5", q("#.0"), ".5"],
  ["12.34", q("#.0"), "12.3"],
  ["0", q("0.0"), "0.0"],
  ["-3.0", q("0.0"), "-3.0"],
  ["1234567.891", q("#,##0.00"), "1,234,567.89"],
  ["12.5", q("#"), "13"],
  ["13.5", q("#"), "14"],
  ["0.0005", q("#.###"), "0.001"],
  ["5.25", q("000.0"), "005.3"],
  ["1.005", q("0.00"), "1.01"],
  ["2.675", q("0.00"), "2.68"],
  ["-0.0001", q("0.00"), "0.00"],
  ["-1.234", q("+0.00;-0.00"), "-1.23"],
  ["0", q("+0.00;-0.00"), "+0.00"],
  ["1.234", q("+0.00;-0.00"), "+1.23"],
  ["0.1234", q("0.00%"), "12.34%"],
  ["0", q("#.##"), "0"],
];

describe("str.tostring(x, format) matches TradingView", () => {
  const logs = run(0.01, cases);
  it("logs one line per case", () => expect(logs).toHaveLength(cases.length));
  cases.forEach(([x, f, expected], i) => {
    it(`${x} with ${f} -> ${expected}`, () => expect(logs[i]).toBe(expected));
  });

  it("format.mintick 0.0001: 1.1258000000000001 -> 1.1258", () => {
    expect(run(0.0001, [["1.1258000000000001", "format.mintick", ""]])).toEqual(["1.1258"]);
  });

  it("no format keeps the shortest round-trip form", () => {
    const s = new Session();
    s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "60", mintick: 0.01 });
    s.compile(`//@version=5\nindicator("t")\nif barstate.islast\n    log.info(str.tostring(0.1 + 0.2))\nplot(close)\n`);
    expect((s.runHistory(bars) as any).logs.map((l: any) => l.message)).toEqual(["0.30000000000000004"]);
  });
});

/**
 * v4's `tostring(x, format)`: the same formats, the same output. TradingView v4
 * accepts `format.mintick`, `format.volume`, `format.percent`, `format.price`,
 * `format.inherit` and patterns; the engine refused `format.*` on v4 and its
 * one-argument `tostring` ignored the format. Expected strings are the label
 * texts TradingView drew (no log.* on v4):
 *   dev-docs/tv-parity/_probes/version-scope/v4-draw-fmt/drawings.json
 * with close 73750 and volume 207 on the bar the labels were made.
 */
describe("v4 tostring(x, format)", () => {
  const label = (expr: string) => {
    const src = `//@version=4\nstudy("t", overlay=true)\nif barstate.islast\n    label.new(bar_index, high, ${expr})\nplot(close)\n`;
    const s = new Session();
    s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "60", mintick: 0.01 });
    expect(s.compile(src).errors).toEqual([]);
    const r: any = s.runHistory(Array.from({ length: 3 }, (_, i) => ({
      time: Date.UTC(2024, 0, 1) + i * 3_600_000, open: 1, high: 2, low: 0, close: 73750, volume: 207,
    })));
    return r.drawings[0].props.text;
  };

  it("mintick, volume", () => {
    expect(label('tostring(close, format.mintick) + "|" + tostring(volume, format.volume) + "|" + ' +
      'tostring(1234567.891, format.volume) + "|" + tostring(999.5, format.volume)'))
      .toBe("73750.00|207|1.235M|1000");
  });

  it("patterns and the one-argument form", () => {
    expect(label('tostring(12.3456, "#.##") + "|" + tostring(0.5, "#.0") + "|" + tostring(-0.0001, "#.##") + "|" + ' +
      'tostring(1.005, "#.##") + "|" + tostring(0.0005, "#.###") + "|" + tostring(close)'))
      .toBe("12.35|.5|0|1.01|0.001|73750");
  });

  it("percent, price, inherit, sub-pattern", () => {
    expect(label('tostring(0.12345, format.percent) + "|" + tostring(close, format.price) + "|" + ' +
      'tostring(close, format.inherit) + "|" + tostring(1234.5, "#,###.0;(#)")'))
      .toBe("0.12%|price73750|inherit73750|1,234.5");
  });
});
