/**
 * Scripts TradingView's chart editor refuses must not compile here either.
 * Ground truth: dev-docs/tv-parity/_probes/compile-checks/README.md.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const errors = (src: string) => new Session().compile(src).errors;
const rejects = (src: string, phrase: string) => {
  const e = errors(src);
  expect(e).toHaveLength(1);
  expect(e[0].message).toContain(phrase);
};
const accepts = (src: string) => expect(errors(src)).toHaveLength(0);

const V5 = "//@version=5\n";
const V6 = "//@version=6\n";
const REQ = "Cannot use `request.*()` call within loops or conditional structures";

describe("request.*() scope at v5 (dynamic_requests defaults to false)", () => {
  const inIf = (decl: string, v = V5) =>
    `${v}${decl}\ny = 0.0\nif bar_index > 5\n    y := request.security(syminfo.tickerid, "60", close)\nplot(y)\n`;
  it("rejects a request inside an if", () => rejects(inIf('indicator("x")'), REQ));
  it("rejects a request inside a for loop", () =>
    rejects(`${V5}indicator("x")\nfor i = 0 to 2\n    y = request.security(syminfo.tickerid, "60", close)\nplot(close)\n`, REQ));
  it("rejects security_lower_tf in a nested if", () =>
    rejects(`${V5}indicator("x")\nif bar_index > 1\n    if bar_index > 5\n        a = request.security_lower_tf(syminfo.tickerid, "1", close)\nplot(close)\n`, REQ));
  it("allows a requesting user function called inside an if (TradingView does)", () =>
    accepts(`${V5}indicator("x")\nf() => request.security(syminfo.tickerid, "60", close)\nif bar_index > 5\n    x = f()\nplot(close)\n`));
  it("allows a request inside a global function body", () =>
    accepts(`${V5}indicator("x")\nf() =>\n    request.security(syminfo.tickerid, "60", close)\nplot(f())\n`));
  it("allows it with dynamic_requests = true", () => accepts(inIf("indicator(\"x\", dynamic_requests = true)")));
  it("allows a request at global scope", () =>
    accepts(`${V5}indicator("x")\ny = request.security(syminfo.tickerid, "60", close)\nplot(y)\n`));
  it("allows the same if at v6 (default true)", () => accepts(inIf('indicator("x")', V6)));
});

describe("color.new without transparency", () => {
  it("v5 positional", () =>
    rejects(`${V5}indicator("x")\nc = color.new(color.red)\nplot(close, color = c)\n`, "No value assigned to the `transp` parameter in color.new()"));
  it("v6 positional", () =>
    rejects(`${V6}indicator("x")\nc = color.new(color.red)\nplot(close, color = c)\n`, 'No value assigned to the "transp" parameter in color.new()'));
  it("keyword form without transp", () =>
    rejects(`${V5}indicator("x")\nc = color.new(color = color.red)\nplot(close, color = c)\n`, "No value assigned to the `transp`"));
  it("allows a transparency argument", () =>
    accepts(`${V6}indicator("x")\nc = color.new(color.red, 50)\nplot(close, color = c)\n`));
  it("allows keyword transp", () =>
    accepts(`${V5}indicator("x")\nc = color.new(color.red, transp = 50)\nplot(close, color = c)\n`));
});

describe("input.string with a colour default", () => {
  it("v6", () =>
    rejects(`${V6}indicator("x")\ns = input.string(defval = color.red, title = "c")\nplot(close)\n`,
      'Cannot call "input.string" with argument "defval"="color.red". An argument of "const color" type was used but a "const string" is expected.'));
  it("v5", () =>
    rejects(`${V5}indicator("x")\ns = input.string(defval = color.green, title = "c")\nplot(close)\n`,
      "Cannot call 'input.string' with argument 'defval'='color.green'. An argument of 'const color' type was used but a 'const string' is expected."));
  it("positional hex literal", () =>
    rejects(`${V6}indicator("x")\ns = input.string(#ff0000)\nplot(close)\n`, "'const color'".replace(/'/g, '"')));
  it("allows a string", () => accepts(`${V6}indicator("x")\ns = input.string("a")\nplot(close)\n`));
});

describe("an indicator with no output", () => {
  const MSG = "An indicator must contain at least one of the following";
  it("v5", () => rejects(`${V5}indicator("x")\nx = close\n`, MSG));
  it("v6", () => rejects(`${V6}indicator("x")\nx = close\n`, MSG));
  it("is reported at line 1", () => expect(errors(`${V6}indicator("x")\nx = close\n`)[0].message).toContain("at @L1:C0"));
  // A log-only v5 indicator loads on TradingView's chart (dev-docs/tv-parity/_probes/
  // compile-checks/20261112-040624_BINANCE_BTCUSDT_5m), though log.* is not in its message.
  it("log.info alone is enough", () => accepts(`${V6}indicator("x")\nlog.info("a")\n`));
  it("bgcolor alone is enough", () => accepts(`${V6}indicator("x")\nbgcolor(color.new(color.red, 90))\n`));
  it("alertcondition alone is enough", () =>
    accepts(`${V5}indicator("x")\nalertcondition(close > open, "a", "b")\n`));
  it("a label.new inside an if is enough", () =>
    accepts(`${V6}indicator("x")\nif bar_index == 1\n    label.new(bar_index, close, "a")\n`));
  it("strategy() is exempt", () => accepts(`${V5}strategy("x")\nx = close\n`));
  it("library() is exempt", () => accepts(`${V5}library("x")\nexport f(float a) => a\n`));
});

// TradingView compiler, 2026-11-13: v5 and v6 both refuse these, each in its own quoting.
describe("ta.vwap with stdev_mult but no anchor", () => {
  const MSG6 = 'No value assigned to the "anchor" parameter in ta.vwap()';
  const MSG5 = "No value assigned to the `anchor` parameter in ta.vwap()";
  const head = `${V6}indicator("x")\n`;
  it("v6 keyword stdev_mult, no anchor", () =>
    rejects(`${head}[v, u, l] = ta.vwap(hlc3, stdev_mult=3.0)\nplot(v)\n`, MSG6));
  it("v5 keyword stdev_mult, no anchor", () =>
    rejects(`${V5}indicator("x")\n[v, u, l] = ta.vwap(hlc3, stdev_mult=3.0)\nplot(v)\n`, MSG5));
  it("is refused outside a destructuring too", () =>
    rejects(`${head}x = ta.vwap(hlc3, stdev_mult = 2)\nplot(close)\n`, MSG6));
  it("ta.vwap(source) compiles", () => accepts(`${head}plot(ta.vwap(hlc3))\n`));
  it("ta.vwap(source, anchor) compiles", () =>
    accepts(`${head}plot(ta.vwap(hlc3, timeframe.change("D")))\n`));
  it("the 3-argument tuple with anchor compiles", () =>
    accepts(`${head}[v, u, l] = ta.vwap(hlc3, timeframe.change("D"), 3.0)\nplot(v)\nplot(u)\nplot(l)\n`));
  it("v5 3-argument tuple with anchor compiles", () =>
    accepts(`${V5}indicator("x")\n[v, u, l] = ta.vwap(hlc3, timeframe.change("D"), 3.0)\nplot(v)\n`));
  it("keyword anchor with stdev_mult compiles", () =>
    accepts(`${head}[v, u, l] = ta.vwap(hlc3, anchor = timeframe.change("D"), stdev_mult = 3.0)\nplot(v)\n`));
});

describe("hline display", () => {
  const MSG6 = 'Invalid argument "display" in "hline" call. Possible values: [display.none, display.all]';
  const MSG5 = "Invalid argument 'display' in 'hline' call. Possible values: [display.none, display.all]";
  const head = `${V6}indicator("x")\n`;
  it("v6 display.data_window is refused", () =>
    rejects(`${head}hline(1.0, "Neutral Line", color = color.gray, display = display.data_window)\n`, MSG6));
  it("v5 display.data_window is refused", () =>
    rejects(`${V5}indicator("x")\nhline(1.0, "n", display = display.data_window)\n`, MSG5));
  it("display.status_line is refused", () =>
    rejects(`${head}hline(1.0, "n", display = display.status_line)\n`, MSG6));
  it("display.all compiles", () => accepts(`${head}hline(1.0, "n", display = display.all)\n`));
  it("display.none compiles", () => accepts(`${head}hline(1.0, "n", display = display.none)\n`));
  it("v5 display.all and none compile", () =>
    accepts(`${V5}indicator("x")\nhline(1.0, "n", display = display.all)\nhline(2.0, "m", display = display.none)\n`));
  it("no display argument compiles", () =>
    accepts(`${head}hline(1.0, "Neutral Line", color = color.gray)\n`));
});
