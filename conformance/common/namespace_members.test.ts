/**
 * A member of a known namespace must EXIST.
 *
 * ── The defect ──────────────────────────────────────────────────────────────
 *
 * `checkUndeclaredRead` rejected a bare name nothing declares. Its mirror —
 * an unknown MEMBER of a real namespace — was never written, so `visitId` fell
 * through to prefixing and emitted
 *
 *     opsv2_syminfo.opsv2_nonesuch
 *
 * which reads as `undefined` on every bar. Nothing said so. `color.from_gradient`
 * at v2, a v4 addition, compiled and every colour derived from it was `na`
 * forever; `barstate.isconfirmed` compiled and the guarded block was silently
 * never entered.
 *
 * Adding the check turned that class of silence into 34 distinct named gaps
 * across TradingView's own documentation corpus, every one of which was a
 * built-in this engine had simply never implemented.
 *
 * ── The three answers ───────────────────────────────────────────────────────
 *
 *   'x' is not a namespace                 the ROOT is unknown here
 *   'x.y' is not available in v4           the member exists, in a later version
 *   'x' has no member 'y'                  it is a typo
 *
 * They are different problems and must not share a message: the second has a
 * version for an answer and the third does not.
 */
import { describe, it, expect } from "vitest";
import { transpile } from "../../transpiler/common";

const head = (v: number) =>
  v === 1 ? 'study("t")\n'
          : `//@version=${v}\n${v >= 5 ? 'indicator("t")' : 'study("t")'}\n`;

const compile = (v: number, body: string) => () => transpile(head(v) + body + "\n");

describe("an unknown member is refused", () => {
  for (const v of [1, 2, 3, 4, 5]) {
    it(`v${v}: a typo in a namespace this version has`, () => {
      expect(compile(v, "x = math.nonesuch")).toThrow();
    });
  }

  it("names the namespace and the member", () => {
    expect(compile(5, "x = math.nonesuch"))
      .toThrow(/'math' has no member 'nonesuch'/);
  });

  it("a member that exists in a LATER version says which", () => {
    // Not "has no member": the name is real Pine and the answer is a version.
    expect(compile(2, "x = color.from_gradient(close, 0, 1, color.red, color.blue)"))
      .toThrow(/'color\.from_gradient' is not available in Pine Script v2\. It was added in a later version/);
  });

  it("an unknown ROOT is still the other error", () => {
    expect(compile(2, "x = nosuchns.member"))
      .toThrow(/'nosuchns' is not a namespace in Pine Script v2/);
  });

  it("...and a root that arrives in a later version says THAT instead", () => {
    // `matrix` is real Pine, so "not a namespace" would be a half-truth. The
    // member check answers first because the whole key is in the union.
    expect(compile(2, "x = matrix.get(m, 0, 0)"))
      .toThrow(/'matrix\.get' is not available in Pine Script v2/);
  });
});

describe("what the check must NOT refuse", () => {
  it("an inner namespace, which is not a member of anything", () => {
    // `strategy.risk` holds `strategy.risk.max_drawdown` and is not a key of
    // its own, so a naive check reported it missing and took out every script
    // that set a risk rule.
    expect(() => transpile(
      '//@version=4\nstrategy("t")\nstrategy.risk.max_drawdown(10, strategy.percent_of_equity)\n',
    )).not.toThrow();
  });

  it("a bare namespace root used as a value", () => {
    // `line` is a v1–v3 plot style AND a v4+ drawing namespace.
    expect(compile(3, "plot(close, style = line)")).not.toThrow();
  });

  it("a name deliberately left unimplemented, which reports its own reason", () => {
    // `ta.accdist` is real Pine that this engine refuses to approximate. Saying
    // it does not exist would be a lie, and would fire on a script that never
    // reaches it.
    expect(compile(5, "x = ta.accdist")).not.toThrow();
  });

  it("a method called on a namespace member's VALUE", () => {
    // `label.all.size()` — `id` is greedy, so the whole dotted name arrives as
    // one callee. `label.all` is an array and `size` is a method on it.
    expect(compile(5, "x = label.all.size()")).not.toThrow();
    expect(compile(5, "x = array.size(label.all)")).not.toThrow();
  });
});

describe("the members the corpus proved were missing", () => {
  /**
   * Every one of these compiled to `undefined` before the check existed. They
   * are grouped by the version that owns them, and the count is how many of
   * TradingView's own examples used each.
   */
  const V5: Array<[string, string]> = [
    ["barstate.islastconfirmedhistory", "x = barstate.islastconfirmedhistory ? 1 : 0"],
    ["barstate.isconfirmed", "x = barstate.isconfirmed ? 1 : 0"],
    ["str.format_time", 'x = str.format_time(time, "yyyy-MM-dd")'],
    ["str.replace", 'x = str.replace("a-a", "a", "b")'],
    ["str.trim", 'x = str.trim(" a ")'],
    ["timeframe.in_seconds", "x = timeframe.in_seconds()"],
    ["timeframe.from_seconds", "x = timeframe.from_seconds(3600)"],
    ["timeframe.change", "x = timeframe.change(timeframe.period) ? 1 : 0"],
    ["timeframe.isseconds", "x = timeframe.isseconds ? 1 : 0"],
    ["math.pi", "x = math.pi"],
    ["ta.max", "x = ta.max(close)"],
    ["ta.min", "x = ta.min(close)"],
    ["array.first", "x = array.first(array.from(1.0, 2.0))"],
    ["array.last", "x = array.last(array.from(1.0, 2.0))"],
    ["array.binary_search", "x = array.binary_search(array.from(1.0, 2.0), 2.0)"],
    ["label.all", "x = array.size(label.all)"],
    ["box.all", "x = array.size(box.all)"],
    ["line.all", "x = array.size(line.all)"],
    ["table.cell_set_text", 'x = 1\nt = table.new(position.top_right, 1, 1)\ntable.cell_set_text(t, 0, 0, "a")'],
    ["ticker.modify", "x = ticker.modify(syminfo.tickerid, session.extended)"],
    ["ticker.inherit", "x = ticker.inherit(syminfo.tickerid, syminfo.tickerid)"],
    ["request.currency_rate", 'x = request.currency_rate("USD", "USD")'],
    ["request.seed", 'x = request.seed("repo", "file", close)'],
    ["strategy.netprofit", "x = strategy.netprofit"],
    ["strategy.closedtrades", "x = strategy.closedtrades"],
    ["strategy.position_avg_price", "x = strategy.position_avg_price"],
    ["strategy.wintrades", "x = strategy.wintrades"],
    ["strategy.losstrades", "x = strategy.losstrades"],
    ["strategy.netprofit_percent", "x = strategy.netprofit_percent"],
    ["strategy.account_currency", "x = strategy.account_currency"],
    ["strategy.opentrades.entry_price", "x = strategy.opentrades.entry_price(0)"],
    ["strategy.closedtrades.profit", "x = strategy.closedtrades.profit(0)"],
    ["currency.KRW", "x = currency.KRW"],
    ["plot.style_stepline_diamond", "x = plot.style_stepline_diamond"],
    ["line.set_second_point", "l = line.new(0, 0, 1, 1)\nline.set_second_point(l, chart.point.new(2, 2, 2.0))\nx = 1"],
    ["label.set_point", "l = label.new(0, 0)\nlabel.set_point(l, chart.point.new(2, 2, 2.0))\nx = 1"],
    ["box.set_bottom_right_point", "b = box.new(0, 1, 1, 0)\nbox.set_bottom_right_point(b, chart.point.new(2, 2, 2.0))\nx = 1"],
  ];

  for (const [name, body] of V5) {
    it(`${name} resolves at v5`, () => {
      // `strategy.*` needs a strategy() declaration; the rest do not care.
      const directive = name.startsWith("strategy")
        ? '//@version=5\nstrategy("t")\n'
        : head(5);
      expect(() => transpile(directive + body + "\n")).not.toThrow();
    });
  }
});
