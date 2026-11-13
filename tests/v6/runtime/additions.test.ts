/**
 * Built-ins added in v6 and the monthly releases after it, each with the
 * release-note month it comes from — and, for each, that v5 is unaffected:
 * a new NAME is not spellable there, and a new PARAMETER is dropped and
 * recorded exactly as an unknown keyword always was.
 *
 * Source: https://www.tradingview.com/pine-script-docs/release-notes/
 */
import { describe, it, expect } from "vitest";
import { build, value } from "../helpers";
import { build as build5, value as value5 } from "../../v5/helpers";
import { attempt } from "../../../test-utils/common/transpileAs";

const H6 = '//@version=6\nindicator("t")\n';
const H5 = '//@version=5\nindicator("t")\n';

/** Runs one bar and returns every drawing's props. */
function drawings(b: ReturnType<typeof build>): any[] {
  b.ctx.setBar(0, 10, 12, 9, 11, 100);
  b.exec();
  return [...((b.ctx as any).drawings?.values?.() ?? [])].map((d: any) => d.props ?? d);
}

describe("November 2024 — text formatting", () => {
  it("label.new takes text_formatting, and bold + italic is both", () => {
    const d = drawings(build(H6 + 'l = label.new(bar_index, close, "x", text_formatting = text.format_bold + text.format_italic)\n'));
    expect(d[0].text_formatting).toBe(3);
  });

  it("the setters change it", () => {
    const src = H6 +
      'l = label.new(bar_index, close, "x")\nl.set_text_formatting(text.format_italic)\n' +
      'b = box.new(0, 1, 1, 0, text = "x")\nb.set_text_formatting(text.format_bold)\n';
    const d = drawings(build(src));
    expect(d.map(p => p.text_formatting)).toEqual([2, 1]);
  });

  it("table cells take it too", () => {
    const src = H6 + 't = table.new(position.top_right, 1, 1)\n' +
      'table.cell(t, 0, 0, "x", text_formatting = text.format_bold)\n';
    const d = drawings(build(src));
    expect(d[0].cells.get("0,0").text_formatting).toBe(1);
  });

  it("is not recorded when not given, so a label's properties are unchanged", () => {
    const d = drawings(build(H6 + 'l = label.new(bar_index, close, "x")\n'));
    expect("text_formatting" in d[0]).toBe(false);
  });

  it("v5: the constants do not exist, and the parameter is dropped as unknown", () => {
    expect(attempt(5, H5 + "x = text.format_bold\n").ok).toBe(false);
    const b = build5(H5 + 'l = label.new(bar_index, close, "x", text_formatting = 1)\n');
    const d = drawings(b as any);
    expect("text_formatting" in d[0]).toBe(false);
    expect([...b.ctx.droppedArguments]).toEqual(["label.new(text_formatting)"]);
  });
});

describe("November 2024 — syminfo and timeframe", () => {
  it("syminfo.mincontract, main_tickerid and timeframe.main_period read the main context", () => {
    const b = build(H6 + "a = syminfo.mincontract\nb = syminfo.main_tickerid\nc = timeframe.main_period\n");
    b.ctx.provideSymbolInfo({ symbol: "BINANCE:BTCUSDT", mincontract: 0.001 });
    b.ctx.resolution = "D";
    b.ctx.setBar(0, 1, 1, 1, 1, 1);
    b.exec();
    const get = (n: string) => b.ctx.vars.get(`opsv2_${n}`)?.valueOf();
    expect(get("a")).toBe(0.001);
    expect(get("b")).toBe("BINANCE:BTCUSDT");
    expect(get("c")).toBe("1D");
  });

  it("syminfo.isin is empty and syminfo.current_contract na unless declared", () => {
    expect(value(H6 + "x = syminfo.isin\n", "x")).toBe("");
    expect(Number.isNaN(Number(value(H6 + "x = syminfo.current_contract\n", "x")))).toBe(true);
  });

  it("none of them is spellable at v5", () => {
    for (const name of ["syminfo.mincontract", "syminfo.main_tickerid", "timeframe.main_period",
                        "syminfo.isin", "syminfo.current_contract"]) {
      expect(attempt(5, H5 + `x = ${name}\n`).ok, name).toBe(false);
    }
  });
});

describe("February 2025 — bid and ask", () => {
  it("are na off the 1T timeframe, and the host's quote on it", () => {
    expect(Number.isNaN(value(H6 + "x = bid\n", "x"))).toBe(true);
    const b = build(H6 + "x = ask\n");
    b.ctx.resolution = "1T";
    b.ctx.provideQuote({ bid: 99.5, ask: 100.5 });
    b.ctx.setBar(0, 1, 1, 1, 1, 1);
    b.exec();
    expect(b.ctx.vars.get("opsv2_x")?.valueOf()).toBe(100.5);
  });

  it("a v5 script may still name its own variables bid and ask", () => {
    expect(value5(H5 + "bid = close - 1\nask = close + 1\nx = ask - bid\n", "x")).toBe(2);
  });
});

describe("March 2025 — box.set_xloc", () => {
  it("sets both horizontal coordinates and what they mean", () => {
    const d = drawings(build(H6 + "b = box.new(0, 2, 1, 0)\nb.set_xloc(1000, 2000, xloc.bar_time)\n"));
    expect([d[0].left, d[0].right, d[0].xloc]).toEqual([1000, 2000, "bar_time"]);
  });
});

describe("July 2025 — input active", () => {
  it("is recorded on the input at v6", () => {
    const b = build(H6 + 'n = input.int(5, "n", active = false)\n');
    b.ctx.setBar(0, 1, 1, 1, 1, 1);
    b.exec();
    const defs = (b.ctx as any).inputDefs;
    expect(JSON.stringify(defs)).toMatch(/"active":false/);
  });

  it("is dropped as unknown at v5", () => {
    const b = build5(H5 + 'n = input.int(5, "n", active = false)\n');
    b.ctx.setBar(0, 1, 1, 1, 1, 1);
    b.exec();
    expect([...b.ctx.droppedArguments]).toEqual(["input.int(active)"]);
  });
});

describe("September 2025 — plot linestyle", () => {
  it("records plot.linestyle_* on the plot", () => {
    const b = build(H6 + "plot(close, linestyle = plot.linestyle_dashed)\n");
    b.ctx.setBar(0, 1, 1, 1, 1, 1);
    b.exec();
    const plot = [...(b.ctx as any).plots.values()][0][0];
    expect(plot.linestyle).toBe("dashed");
  });

  it("a sixth positional argument is trackprice at v6, where transp no longer exists", () => {
    const b = build(H6 + "plot(close, \"p\", color.red, 1, plot.style_line, true)\n");
    b.ctx.setBar(0, 1, 1, 1, 1, 1);
    b.exec();
    const plot = [...(b.ctx as any).plots.values()][0][0];
    expect(plot.trackprice).toBe(true);
    expect(plot.color).toBe("#F23645");
  });
});

describe("October 2025 — timeframe_bars_back", () => {
  // 2024-01-03 (a Wednesday) 15:00 UTC, on an hourly chart.
  const T = Date.UTC(2024, 0, 3, 15);
  const at = (src: string) => {
    const b = build(H6 + src);
    b.ctx.resolution = "60";
    b.ctx.setBar(T, 1, 1, 1, 1, 1);
    b.exec();
    return b.ctx.vars.get("opsv2_x")?.valueOf();
  };

  it("0 is the start of the timeframe's current bar", () => {
    expect(at('x = time("D", timeframe_bars_back = 0)\n')).toBe(Date.UTC(2024, 0, 3));
  });

  it("positive goes back, negative forward", () => {
    expect(at('x = time("D", timeframe_bars_back = 2)\n')).toBe(Date.UTC(2024, 0, 1));
    expect(at('x = time("D", timeframe_bars_back = -1)\n')).toBe(Date.UTC(2024, 0, 4));
    expect(at('x = time("W", timeframe_bars_back = 1)\n')).toBe(Date.UTC(2023, 11, 25));
    expect(at('x = time("M", timeframe_bars_back = 1)\n')).toBe(Date.UTC(2023, 11, 1));
  });

  it("time_close gives the end of that bar", () => {
    expect(at('x = time_close("D", timeframe_bars_back = 1)\n')).toBe(Date.UTC(2024, 0, 3));
  });

  it("without it, time() is the start of the timeframe's bar, as at v5", () => {
    expect(at('x = time("D")\n')).toBe(Date.UTC(2024, 0, 3));
  });
});
