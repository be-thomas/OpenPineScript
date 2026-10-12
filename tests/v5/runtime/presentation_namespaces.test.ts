/**
 * The v5 namespaces that describe the CHART and its presentation:
 * `chart.*`, `format.*`, `display.*`, `font.*`, `session.*`.
 *
 * Most of these do not change a single number a script computes — `display`
 * says where a plot appears, `font` says which typeface a label uses — and the
 * temptation is to treat them as decoration. They are not: a missing member of
 * an EXISTING namespace reads as `undefined` rather than erroring, so
 * `color = chart.fg_color` silently produced no colour, and a whole namespace
 * missing stops the script compiling at all. Between them these five accounted
 * for 82 of the 763 scripts in the TradingView documentation corpus.
 *
 * SOURCING is quoted at the head of each runtime module. What is asserted here
 * is behaviour, plus the two things that are genuinely computed rather than
 * carried: `chart.fg_color`'s contrast choice and the `display.*` arithmetic.
 */
import { describe, it, expect } from "vitest";
import { compileScript, transpile } from "../../../transpiler/common";
import { compile, Context } from "../../../runtime/v5";
import { compile as compileV1, Context as ContextV1 } from "../../../runtime/v1";
import { HEAD, value } from "../helpers";

/** Runs `bars` daily bars and returns the final value of `name`. */
function run(src: string, name: string, bars = 3, tune?: (ctx: Context) => void): any {
  const { js, profile } = compileScript(src);
  const ctx = new Context(profile);
  tune?.(ctx);
  const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
  for (let i = 0; i < bars; i++) {
    ctx.setBar(i * 86400000, 10, 12, 9, 11, 100);
    exec();
    ctx.finalizeBar();
  }
  return ctx.vars.get("opsv2_" + name)?.valueOf();
}

describe("chart.*", () => {
  it("bg_color is what the host declared", () => {
    expect(run(HEAD + "c = chart.bg_color\n", "c", 1, ctx => ctx.provideChartBackground("#131722")))
      .toBe("#131722");
  });

  it("fg_color contrasts: white on a dark background, black on a light one", () => {
    // "chart.fg_color returns a color providing optimal contrast with
    //  chart.bg_color." The END of the scale is the promise; the exact shade
    //  is not published, so only the end is asserted.
    const fg = (bg: string) =>
      run(HEAD + "c = chart.fg_color\n", "c", 1, ctx => ctx.provideChartBackground(bg));
    expect(fg("#131722")).toBe("#ffffffff");   // TradingView's dark theme
    expect(fg("#000000")).toBe("#ffffffff");
    expect(fg("#ffffff")).toBe("#000000ff");
    expect(fg("#fafafa")).toBe("#000000ff");
  });

  it("defaults to a light background, so fg_color is black", () => {
    expect(run(HEAD + "c = chart.fg_color\n", "c", 1)).toBe("#000000ff");
  });

  it("is_standard is true — every non-standard type refuses rather than approximating", () => {
    expect(run(HEAD + "c = chart.is_standard\n", "c", 1)).toBe(true);
  });

  it("the visible range spans the whole run when no viewport is declared", () => {
    const src = HEAD + "l = chart.left_visible_bar_time\nr = chart.right_visible_bar_time\n";
    expect(run(src, "l", 3)).toBe(0);
    expect(run(src, "r", 3)).toBe(2 * 86400000);
  });

  it("...and the declared viewport when there is one", () => {
    const src = HEAD + "l = chart.left_visible_bar_time\n";
    expect(run(src, "l", 3, ctx => ctx.provideVisibleRange(86400000, 86400000 * 2)))
      .toBe(86400000);
  });
});

describe("format.*", () => {
  it("str.tostring(x, format.mintick) rounds to the tick size first", () => {
    // "use str.tostring(myValue, format.mintick) to first round the number to
    //  tick precision and then return its string representation."
    expect(run(HEAD + "s = str.tostring(1.23456, format.mintick)\n", "s", 1)).toBe("1.23");
    expect(run(HEAD + "s = str.tostring(1.23456, format.mintick)\n", "s", 1,
      ctx => { ctx.mintick = 0.5; })).toBe("1");
  });

  it("a format STRING still takes the digit-mask path", () => {
    // The two kinds of second argument have to stay distinguishable; a
    // sentinel that leaked into the mask parser would print an empty string.
    expect(run(HEAD + 's = str.tostring(1.23456, "#.##")\n', "s", 1)).toBe("1.23");
    expect(run(HEAD + 's = str.tostring(1.5, "0.000")\n', "s", 1)).toBe("1.500");
  });

  it("the axis-formatting constants render the value plainly", () => {
    // format.price/volume/percent describe the price axis and Data Window,
    // neither of which exists here.
    expect(run(HEAD + "s = str.tostring(5183, format.volume)\n", "s", 1)).toBe("5183");
    expect(run(HEAD + "s = str.tostring(0.25, format.percent)\n", "s", 1)).toBe("0.25");
  });

  it("is accepted as indicator()'s format argument", () => {
    expect(() => transpile(
      '//@version=5\nindicator("t", format = format.price, precision = 2)\nplot(close)\n',
    )).not.toThrow();
  });
});

describe("display.*", () => {
  it("composes with + and - the way the manual says", () => {
    // "display.all - display.pane hides the pane visuals but displays the
    //  plot's numeric results everywhere else, while
    //  display.status_line + display.data_window displays results only in
    //  those two locations."
    //
    // Only disjoint bits make both of those mean what they say, which is what
    // these two assertions pin down.
    expect(run(HEAD + "d = display.all - display.pane\n", "d", 1))
      .toBe(run(HEAD + "d = display.data_window + display.price_scale + display.status_line\n", "d", 1));

    expect(run(HEAD + "d = display.status_line + display.data_window\n", "d", 1))
      .toBe(run(HEAD + "d = display.all - display.pane - display.price_scale\n", "d", 1));
  });

  it("none is zero and all is every bit", () => {
    expect(run(HEAD + "d = display.none\n", "d", 1)).toBe(0);
    expect(run(HEAD + "d = display.all - display.none\n", "d", 1))
      .toBe(run(HEAD + "d = display.all\n", "d", 1));
  });

  it("is accepted on plot()", () => {
    expect(() => transpile(HEAD + "plot(close, display = display.data_window)\n")).not.toThrow();
  });
});

describe("font.*", () => {
  it("names the two families", () => {
    expect(run(HEAD + "f = font.family_monospace\n", "f", 1)).toBe("monospace");
    expect(run(HEAD + "f = font.family_default\n", "f", 1)).toBe("default");
  });
});

describe("session.*", () => {
  it("regular and extended are the two named sessions", () => {
    expect(run(HEAD + "s = session.regular\n", "s", 1)).toBe("regular");
    expect(run(HEAD + "s = session.extended\n", "s", 1)).toBe("extended");
  });

  it("every bar is a regular-hours bar, because that is the data supplied", () => {
    expect(run(HEAD + "b = session.ismarket\n", "b", 1)).toBe(true);
    expect(run(HEAD + "b = session.ispremarket\n", "b", 1)).toBe(false);
    expect(run(HEAD + "b = session.ispostmarket\n", "b", 1)).toBe(false);
  });

  it("isfirstbar is true when the bar opens a new calendar day", () => {
    // The harness feeds one bar per day, so every bar opens one.
    expect(run(HEAD + "b = session.isfirstbar\n", "b", 3)).toBe(true);
  });

  it("...and false on a second bar within the same day", () => {
    const { js, profile } = compileScript(HEAD + "b = session.isfirstbar\n");
    const ctx = new Context(profile);
    const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
    const day = Date.UTC(2024, 0, 2);
    const seen: any[] = [];
    for (const t of [day, day + 3600000, day + 86400000]) {
      ctx.setBar(t, 10, 12, 9, 11, 100);
      exec();
      seen.push(ctx.vars.get("opsv2_b")?.valueOf());
      ctx.finalizeBar();
    }
    expect(seen).toEqual([true, false, true]);
  });

  it("islastbar is true on daily bars, where one bar IS one session", () => {
    expect(run(HEAD + "b = session.islastbar\n", "b", 2)).toBe(true);
  });

  it("...and false intraday, where it cannot be known without lookahead", () => {
    const { js, profile } = compileScript(HEAD + "b = session.islastbar\n");
    const ctx = new Context(profile);
    ctx.resolution = "5";
    const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
    ctx.setBar(0, 10, 12, 9, 11, 100);
    exec();
    expect(ctx.vars.get("opsv2_b")?.valueOf()).toBe(false);
  });
});

describe("`session` is a CONSTANT at v1–v3 and a NAMESPACE at v5", () => {
  /**
   * One sandbox slot, two meanings. Installing both let the registry union's
   * last writer decide, and `x = session` at v3 came out as the namespace
   * object — so `input(s, type = session)` recorded its type as an object.
   */
  it("v3 reads it as the input-type string", () => {
    const { js, profile } = compileScript('//@version=3\nstudy("t")\nx = session\n');
    const ctx = new ContextV1(profile);
    const exec = compileV1(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
    ctx.setBar(0, 10, 12, 9, 11, 100);
    exec();
    expect(ctx.vars.get("opsv2_x")?.valueOf()).toBe("session");
  });

  it("v3 records it as an input's declared type", () => {
    const { js, profile } = compileScript(
      '//@version=3\nstudy("t")\ns = input("0930-1600", "Session", type=session)\n',
    );
    const ctx = new ContextV1(profile);
    const exec = compileV1(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
    ctx.setBar(0, 10, 12, 9, 11, 100);
    exec();
    expect(ctx.inputDefs[0].type).toBe("session");
  });

  it("v5 reads it as a namespace", () => {
    expect(value(HEAD + "x = session.regular\n", "x")).toBe("regular");
  });
});

describe("four of the five are v5-only", () => {
  const CASES: Array<[string, string]> = [
    ["chart", "x = chart.fg_color"],
    ["format", "x = format.price"],
    ["display", "x = display.all"],
    ["font", "x = font.family_default"],
  ];

  for (const [name, body] of CASES) {
    it(`${name}.* is refused at v4`, () => {
      expect(() => transpile(`//@version=4\nstudy("t")\n${body}\n`))
        .toThrow(new RegExp(`'${name}' is not a namespace in Pine Script v4`));
    });
  }

  /**
   * `session` is the exception, and it is a v4 namespace that GREW at v5.
   *
   * From the v4 release notes, April 2021: "session.ismarket - returns true if
   * the current bar is a part of the regular trading hours ...
   * session.ispremarket ... session.ispostmarket". `session.regular` appears in
   * the v4 manual's own extended-session examples. The four bar-position
   * members appear in no v4 release note and in none of the 148 v4 examples.
   */
  it("session.* is available at v4 — the namespace is v4, not v5", () => {
    expect(() => transpile('//@version=4\nstudy("t")\nx = session.regular\n')).not.toThrow();
    expect(() => transpile('//@version=4\nstudy("t")\nx = session.ismarket\n')).not.toThrow();
  });

  it("...and refused at v3", () => {
    expect(() => transpile('//@version=3\nstudy("t")\nx = session.regular\n'))
      .toThrow(/'session' is not a namespace in Pine Script v3/);
  });
});
