/**
 * The built-ins the documentation corpus proved were missing.
 *
 * `conformance/common/namespace_members.test.ts` asserts every one of them
 * RESOLVES. This file asserts what they RETURN, because resolving was never the
 * hard part: each of these compiled to `undefined` before the member check
 * existed, and a value that is merely present is the same failure one step
 * later.
 *
 * SOURCING is per-describe, quoted from the release notes and reference.
 */
import { describe, it, expect } from "vitest";
import { compileScript } from "../../../transpiler/common";
import { compile, Context } from "../../../runtime/v5";

function run(body: string, bars = 1, tune?: (c: Context) => void) {
  const { js, profile } = compileScript(`//@version=5\nindicator("t")\n${body}\n`);
  const ctx = new Context(profile);
  tune?.(ctx);
  const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
  for (let i = 0; i < bars; i++) {
    ctx.setBar(i * 86400000, 10, 12, 9, 11 + i, 100);
    exec();
    ctx.finalizeBar();
  }
  return ctx;
}

const read = (body: string, name = "x", bars = 1, tune?: (c: Context) => void) =>
  run(body, bars, tune).vars.get("opsv2_" + name)?.valueOf();

describe("barstate.isconfirmed / islastconfirmedhistory", () => {
  /**
   * "barstate.isconfirmed is true on all historical bars and on the last
   *  (closing) update of a realtime bar", and "barstate.islastconfirmedhistory
   *  is true if the script is executing on the dataset's last bar when the
   *  market is closed, or on the bar immediately preceding the realtime bar if
   *  the market is open."
   *
   * Forty-seven of TradingView's examples guard on one of these, and every one
   * of them was reading `undefined` — so the guarded block never ran and the
   * script drew nothing, silently.
   */
  it("isconfirmed is true on a historical bar", () => {
    expect(read("x = barstate.isconfirmed ? 1 : 0")).toBe(1);
  });

  it("...and false while a realtime bar is forming", () => {
    const { js, profile } = compileScript(
      '//@version=5\nindicator("t")\nx = barstate.isconfirmed ? 1 : 0\n',
    );
    const ctx = new Context(profile);
    const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
    ctx.applyTick(0, 10, 12, 9, 11, 100);
    exec();
    expect(ctx.vars.get("opsv2_x")?.valueOf()).toBe(0);
  });

  it("islastconfirmedhistory fires on the dataset's last bar, once", () => {
    const src = "var int hits = 0\nif barstate.islastconfirmedhistory\n    hits += 1\nx = hits\n";
    const { js, profile } = compileScript(`//@version=5\nindicator("t")\n${src}`);
    const ctx = new Context(profile);
    const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
    for (let i = 0; i < 4; i++) {
      ctx.is_last = i === 3;
      ctx.setBar(i, 10, 12, 9, 11, 100);
      exec();
      ctx.finalizeBar();
    }
    expect(ctx.vars.get("opsv2_x")?.valueOf()).toBe(1);
  });
});

describe("timeframe.in_seconds and from_seconds", () => {
  /**
   * "The typical number of seconds in the chart's timeframe" (May 2024), and
   * "Converts a specified number of `seconds` into a valid timeframe string
   *  based on our timeframe specification format" (September 2023).
   */
  const CASES: Array<[string, number]> = [
    ["1", 60], ["5", 300], ["60", 3600],
    ["30S", 30], ["D", 86400], ["2D", 172800],
    ["W", 604800], ["M", 2592000],
  ];

  for (const [spec, seconds] of CASES) {
    it(`"${spec}" is ${seconds} seconds`, () => {
      expect(read(`x = timeframe.in_seconds("${spec}")`)).toBe(seconds);
    });
  }

  it("with no argument it is the CHART's timeframe", () => {
    expect(read("x = timeframe.in_seconds()", "x", 1, c => { c.resolution = "15"; })).toBe(900);
  });

  it("from_seconds picks the largest unit that divides evenly", () => {
    // 604800 is "1W", not "10080" — the same duration spelled usefully.
    expect(read("x = timeframe.from_seconds(604800)")).toBe("1W");
    expect(read("x = timeframe.from_seconds(3600)")).toBe("60");
    expect(read("x = timeframe.from_seconds(86400)")).toBe("1D");
  });

  it("...and falls to seconds when nothing larger divides", () => {
    expect(read("x = timeframe.from_seconds(90)")).toBe("90S");
  });

  it("the two round-trip", () => {
    expect(read('x = timeframe.in_seconds(timeframe.from_seconds(300))')).toBe(300);
  });

  it("a value with no timeframe is na, not a plausible '1'", () => {
    expect(Number.isNaN(Number(read("x = timeframe.from_seconds(0)")))).toBe(true);
  });
});

describe("timeframe.change", () => {
  // "Returns `true` on the first bar of a new `timeframe`, `false` otherwise."
  it("is false on the very first bar — no period has ended yet", () => {
    expect(read('x = timeframe.change("D") ? 1 : 0')).toBe(0);
  });

  it("fires once per period, not once per bar", () => {
    // Bars are one day apart, so a WEEKLY change fires on some of them and not
    // on others — the count is what distinguishes it from `true` every bar.
    const src = 'var int hits = 0\nif timeframe.change("W")\n    hits += 1\nx = hits\n';
    const hits = read(src, "x", 10);
    expect(hits).toBeGreaterThan(0);
    expect(hits).toBeLessThan(9);
  });
});

describe("str.format_time", () => {
  // "Converts a timestamp to a formatted string using the specified format and
  //  time zone." A Java SimpleDateFormat pattern.
  const T = "1709647629000"; // 2024-03-05T14:07:09Z

  it("renders the manual's own pattern", () => {
    expect(read(`x = str.format_time(${T}, "yyyy-MM-dd")`)).toBe("2024-03-05");
  });

  it("handles time as well as date", () => {
    expect(read(`x = str.format_time(${T}, "yyyy-MM-dd HH:mm:ss")`)).toBe("2024-03-05 14:07:09");
  });

  it("a QUOTED run is literal, which is what makes ISO 8601 expressible", () => {
    expect(read(`x = str.format_time(${T}, "yyyy-MM-dd'T'HH:mm:ss")`)).toBe("2024-03-05T14:07:09");
  });

  it("names months and days", () => {
    expect(read(`x = str.format_time(${T}, "EEEE, MMMM d")`)).toBe("Tuesday, March 5");
    expect(read(`x = str.format_time(${T}, "EEE MMM d")`)).toBe("Tue Mar 5");
  });

  it("a timezone shifts the answer", () => {
    expect(read(`x = str.format_time(${T}, "HH:mm", "UTC")`)).toBe("14:07");
    expect(read(`x = str.format_time(${T}, "HH:mm", "America/New_York")`)).toBe("09:07");
  });

  it("an unrecognised letter is COPIED, not dropped", () => {
    // A pattern this engine does not understand should be visible in the
    // output rather than vanish from it.
    expect(read(`x = str.format_time(${T}, "yyyy QQ")`)).toBe("2024 QQ");
  });
});

describe("str.replace and str.trim", () => {
  it("replace changes ONE occurrence, chosen by index", () => {
    expect(read('x = str.replace("a-a-a", "a", "b")')).toBe("b-a-a");
    expect(read('x = str.replace("a-a-a", "a", "b", 1)')).toBe("a-b-a");
  });

  it("an index past the last match leaves the string alone", () => {
    expect(read('x = str.replace("a-a", "a", "b", 9)')).toBe("a-a");
  });

  it("replace_all is the other one, and still replaces every match", () => {
    expect(read('x = str.replace_all("a-a-a", "a", "b")')).toBe("b-b-b");
  });

  it("trim removes leading and trailing whitespace", () => {
    expect(read('x = str.trim("  hi  ")')).toBe("hi");
  });
});

describe("ta.max and ta.min", () => {
  /**
   * The ALL-TIME extremes — not `math.max`, which compares arguments, and not
   * `ta.highest(source, n)`, which looks back a window.
   */
  it("remember the highest and lowest the series has held", () => {
    // `close` rises by 1 a bar in this harness, so after 4 bars it has been
    // 11, 12, 13, 14.
    expect(read("x = ta.max(close)", "x", 4)).toBe(14);
    expect(read("x = ta.min(close)", "x", 4)).toBe(11);
  });

  it("never forget — the record does not decay", () => {
    const src = "y = bar_index == 1 ? 999.0 : close\nx = ta.max(y)\n";
    expect(read(src, "x", 4)).toBe(999);
  });

  it("na is skipped rather than compared", () => {
    // One absent bar would otherwise poison the record permanently, since
    // `NaN > x` and `x > NaN` are both false.
    const src = "y = bar_index == 0 ? na : close\nx = ta.max(y)\n";
    expect(read(src, "x", 3)).toBe(13);
  });
});

describe("array.first, last and binary_search", () => {
  it("first and last are the ends", () => {
    expect(read("x = array.first(array.from(3.0, 5.0, 7.0))")).toBe(3);
    expect(read("x = array.last(array.from(3.0, 5.0, 7.0))")).toBe(7);
  });

  it("an EMPTY array is an error, not na", () => {
    // The same rule `array.get` follows for an out-of-range index: answering
    // `na` would let a script average nothing and plot it.
    expect(() => run("x = array.first(array.new<float>(0))")).toThrow(/array is empty/);
  });

  it("binary_search finds an index, or -1", () => {
    expect(read("x = array.binary_search(array.from(1.0, 3.0, 5.0, 7.0), 5.0)")).toBe(2);
    expect(read("x = array.binary_search(array.from(1.0, 3.0, 5.0), 4.0)")).toBe(-1);
  });
});

describe("math constants", () => {
  it("pi and e", () => {
    expect(read("x = math.pi")).toBeCloseTo(Math.PI, 12);
    expect(read("x = math.e")).toBeCloseTo(Math.E, 12);
  });

  it("phi and its reciprocal differ by exactly one", () => {
    expect(read("x = math.phi - math.rphi")).toBeCloseTo(1, 12);
  });
});

describe("the drawing collections", () => {
  it("label.all lists what the script drew", () => {
    expect(read("label.new(0, 0)\nlabel.new(1, 1)\nx = array.size(label.all)")).toBe(2);
  });

  it("...and the method spelling reaches the same array", () => {
    expect(read("label.new(0, 0)\nx = label.all.size()")).toBe(1);
  });

  it("line.all and box.all too", () => {
    expect(read("line.new(0, 0, 1, 1)\nx = array.size(line.all)")).toBe(1);
    expect(read("box.new(0, 1, 1, 0)\nx = array.size(box.all)")).toBe(1);
  });
});

describe("the chart.point endpoint setters", () => {
  const drawings = (ctx: Context, kind: string) =>
    [...(ctx as any).drawings.values()].filter((d: any) => d.kind === kind);

  it("line.set_second_point moves the second endpoint", () => {
    const ctx = run(
      "l = line.new(0, 0.0, 1, 1.0)\nline.set_second_point(l, chart.point.new(5, 0, 9.0))",
    );
    const p = drawings(ctx, "line")[0].props;
    expect([p.x2, p.y2]).toEqual([5, 9]);
    expect([p.x1, p.y1]).toEqual([0, 0]);
  });

  it("box.set_bottom_right_point moves the corner", () => {
    const ctx = run(
      "b = box.new(0, 5.0, 1, 1.0)\nbox.set_bottom_right_point(b, chart.point.new(7, 0, 2.0))",
    );
    const p = drawings(ctx, "box")[0].props;
    expect([p.right, p.bottom]).toEqual([7, 2]);
  });

  it("label.set_point moves the label", () => {
    const ctx = run("l = label.new(0, 0)\nlabel.set_point(l, chart.point.new(4, 0, 3.0))");
    const p = drawings(ctx, "label")[0].props;
    expect([p.x, p.y]).toEqual([4, 3]);
  });
});

describe("table.cell_set_*", () => {
  const cells = (ctx: Context) =>
    [...(ctx as any).drawings.values()].find((d: any) => d.kind === "table").props.cells;

  it("cell_set_text updates an existing cell", () => {
    const ctx = run(
      't = table.new(position.top_right, 1, 1)\n' +
      'table.cell(t, 0, 0, "before")\n' +
      'table.cell_set_text(t, 0, 0, "after")',
    );
    expect(cells(ctx).get("0,0").text).toBe("after");
  });

  it("...and creates one that was never written", () => {
    // What lets a script lay a table out once and update one field per bar.
    const ctx = run(
      't = table.new(position.top_right, 1, 1)\ntable.cell_set_text(t, 0, 0, "new")',
    );
    expect(cells(ctx).get("0,0").text).toBe("new");
  });

  it("the other setters touch only their own property", () => {
    const ctx = run(
      't = table.new(position.top_right, 1, 1)\n' +
      'table.cell(t, 0, 0, "keep")\n' +
      'table.cell_set_bgcolor(t, 0, 0, color.red)',
    );
    const cell = cells(ctx).get("0,0");
    expect(cell.text).toBe("keep");
    expect(cell.bgcolor).toBe("#FF5252");
  });
});

describe("ticker.modify and ticker.inherit", () => {
  it("modify carries the settings on the id", () => {
    const id = read('x = ticker.modify("NASDAQ:AAPL", session.extended)');
    expect(String(id)).toContain("NASDAQ:AAPL");
    expect(String(id)).toContain("session=");
  });

  it("inherit puts another id's settings onto this symbol", () => {
    const src =
      'from = ticker.modify("NASDAQ:AAPL", session.extended)\n' +
      'x = ticker.inherit("NASDAQ:MSFT", from)\n';
    const id = String(read(src));
    expect(id.startsWith("NASDAQ:MSFT")).toBe(true);
    expect(id).toContain("session=");
  });
});

describe("request.currency_rate", () => {
  it("identical currencies convert at 1, without needing any data", () => {
    // The common case: a strategy asking whether conversion is needed at all.
    expect(read('x = request.currency_rate("USD", "USD")')).toBe(1);
  });

  it("anything else is refused rather than guessed", () => {
    // An exchange rate is a fact about the world on a date. Inventing one would
    // misstate every position size computed from it.
    expect(() => run('x = request.currency_rate("USD", "EUR")'))
      .toThrow(/no data was supplied/);
  });
});

describe("request.security_lower_tf", () => {
  /**
   * "Evaluates the expression on every intrabar of the chart bar." This engine
   * is fed one series of OHLCV bars and has no finer data, so unless a host
   * supplies the lower timeframe there are no intrabars — and an EMPTY array
   * says exactly that.
   */
  it("returns an empty array rather than a fabricated intrabar", () => {
    // Returning the chart bar as its own single intrabar would make
    // `array.size` report 1 where TradingView reports 12, and every average
    // computed from it would be quietly wrong rather than visibly absent.
    const src = 'a = request.security_lower_tf(syminfo.tickerid, "1", close)\nx = array.size(a)\n';
    expect(read(src)).toBe(0);
  });

  it("a TUPLE expression gives a tuple of arrays", () => {
    const src =
      '[o, h] = request.security_lower_tf(syminfo.tickerid, "1", [open, high])\n' +
      "x = array.size(o) + array.size(h)\n";
    expect(read(src)).toBe(0);
  });
});
