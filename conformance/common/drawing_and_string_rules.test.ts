/**
 * Rules taken from the Trader Club replay (trader_club_golden.test.ts) and the
 * drawing-limit probe (drawing_limits_golden.test.ts), pinned in isolation:
 * `color(na)`, the string length limit, and the default drawing limit.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../index";

function run(source: string, bars = 4): any {
  const session = new Session();
  const compiled = session.compile(source, { symbol: { tickerid: "BINANCE:BTCUSDT", mintick: 0.01 }, timeframe: "5" } as any);
  expect(compiled.errors).toEqual([]);
  return session.runHistory(Array.from({ length: bars }, (_, i) => ({
    time: 1_760_000_000_000 + i * 300_000, open: 1, high: 2, low: 1, close: 1, volume: 1,
  })));
}

describe("color(na)", () => {
  it("is na, as `color = na` is, rather than the string \"NaNff\"", () => {
    const result = run(`//@version=5
indicator("x", overlay = true)
label.new(bar_index, close, "a", color = na)
label.new(bar_index, close, "b", color = color(na))
`, 1);
    const [plain, cast] = result.drawings.filter((d: any) => d.kind === "label");
    expect(plain.props.color).toBeNaN();
    expect(cast.props.color).toBeNaN();
    // The render model is JSON, where na is null.
    expect(JSON.parse(JSON.stringify(cast.props)).color).toBeNull();
  });
});

/** A script that builds a string of `n` characters, one more on bar 2. */
function concat(version: 4 | 5 | 6, n: number): string {
  return `//@version=${version}
${version === 4 ? "study" : "indicator"}("x")
s = ""
n = bar_index == 2 ? ${n + 1} : ${n}
for i = 1 to n
    s := s + "a"
plot(1)
`;
}

describe("string length limit on concatenation", () => {
  it("v5 allows 4096 characters and raises on the bar that reaches 4097", () => {
    const result = run(concat(5, 4096));
    expect(result.errors).toMatchObject([
      { phase: "runtime", message: "String is too long 4097, max allowed length is 4096.", severity: "error" },
    ]);
    // Bars 0 and 1 built 4096 characters and ran; bar 2 raised.
    expect(result.barsProcessed).toBe(2);
  });

  it("v5 allows exactly 4096 on every bar", () => {
    const result = run(concat(5, 4095));
    expect(result.errors).toEqual([]);
    expect(result.barsProcessed).toBe(4);
  });

  it("v6 allows 40,960 characters and raises at 40,961 with the v6 limit", () => {
    const result = run(concat(6, 40960));
    expect(result.errors).toMatchObject([
      { phase: "runtime", message: "String is too long 40961, max allowed length is 40960.", severity: "error" },
    ]);
    expect(result.barsProcessed).toBe(2);
  });

  it("v4 is unaffected (no evidence of a limit)", () => {
    const result = run(concat(4, 5000));
    expect(result.errors).toEqual([]);
    expect(result.barsProcessed).toBe(4);
  });
});

describe("default drawing limit", () => {
  // INFERRED: the rule (cut back to the limit once the count passes limit + 5)
  // was measured at limits 10 and 500, not at the default of 50.
  it("60 lines in one bar leave 54", () => {
    const result = run(`//@version=5
indicator("x", overlay = true)
for k = 1 to 60
    line.new(bar_index, close, bar_index + 1, close)
`, 1);
    expect(result.drawings.filter((d: any) => d.kind === "line").length).toBe(54);
  });

  it("max_lines_count on the declaration replaces the default", () => {
    const result = run(`//@version=5
indicator("x", overlay = true, max_lines_count = 10)
for k = 1 to 16
    line.new(bar_index, close, bar_index + 1, close)
`, 1);
    expect(result.drawings.filter((d: any) => d.kind === "line").length).toBe(10);
  });
});

describe("drawing defaults are TradingView's, in the script's own palette", () => {
  const drawings = (version: 4 | 5, kind: string) => {
    const decl = version === 4 ? "study" : "indicator";
    const result = run(`//@version=${version}
${decl}("x", overlay = true)
label.new(bar_index, close, "default colours")
line.new(bar_index, close, bar_index + 1, close)
box.new(bar_index, close, bar_index + 1, close + 1)
${version === 4 ? "" : "polyline.new(array.from(chart.point.from_index(bar_index, close), chart.point.from_index(bar_index + 1, close + 1)))"}
`, 1);
    return result.drawings.filter((d: any) => d.kind === kind)[0].props;
  };

  it("v5 label: #2962FF bubble, #363A45 text", () => {
    const p = drawings(5, "label");
    expect(p.color).toBe("#2962FF");
    expect(p.textcolor).toBe("#363A45");
  });
  it("v5 line, box border and polyline: #2962FF", () => {
    expect(drawings(5, "line").color).toBe("#2962FF");
    expect(drawings(5, "box").border_color).toBe("#2962FF");
    expect(drawings(5, "box").text_color).toBe("#363A45");
    expect(drawings(5, "polyline").line_color).toBe("#2962FF");
  });
  it("v4 label: #2196F3 bubble, #363A45 text", () => {
    const p = drawings(4, "label");
    expect(p.color).toBe("#2196F3");
    expect(p.textcolor).toBe("#363A45");
  });
});

describe("plotshape text colour reaches the render model", () => {
  const marker = (args: string) => run(`//@version=5
indicator("x", overlay = true)
plotshape(close > open or true, "s", shape.triangleup, location.abovebar${args})
`, 2).series.find((s: any) => s.type === "marker");

  it("carries the script's textcolor", () => {
    expect(marker(`, text = "Buy", textcolor = color.white`).textcolor).toBe("#FFFFFF");
  });
  it("defaults to color.blue in the script's palette (#2962FF on v5)", () => {
    expect(marker(`, text = "Buy"`).textcolor).toBe("#2962FF");
  });
});
