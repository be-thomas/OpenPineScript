/**
 * `Undeclared identifier` — a name nothing binds is a COMPILE error.
 *
 * ── What this replaces ──────────────────────────────────────────────────────
 *
 * visitId emitted `opsv2_<name>` for any bare name it did not recognise. The
 * program runs under `with(sandbox)`, so an unrecognised name was not a Pine
 * diagnostic but a JavaScript ReferenceError on the first bar:
 *
 *     opsv2_last_bar_index is not defined
 *
 * — which reads as an engine crash. Dotted names already had a guard ("'chart'
 * is not a namespace"); bare ones had none, so every unimplemented built-in
 * surfaced as a crash rather than as the gap it was. Running TradingView's own
 * documentation corpus turned up 45 scripts failing exactly that way, including
 * one — v5/v5-concepts-colors-04.pine — where the DOCUMENTATION is at fault: it
 * declares `holidayColor` and then reads `c_holiday`. TradingView rejects that
 * script too.
 *
 * ── Three outcomes, not one ─────────────────────────────────────────────────
 *
 * The check has to tell apart names that are not Pine at all, names that are
 * Pine but belong to another version, and names that are Pine and deliberately
 * unimplemented here. Collapsing them would trade a crash for a wrong message.
 */
import { describe, it, expect } from "vitest";
import { compileScript } from "../../../transpiler";
import { compile, Context } from "../../../runtime/v1";

const v = (n: number, body: string) => `//@version=${n}\n${body}`;

describe("undeclared identifiers are rejected at compile time", () => {
  it("rejects a typo'd read", () => {
    expect(() => compileScript(v(5, 'indicator("t")\nplot(nosuchthing)\n')))
      .toThrow(/Undeclared identifier 'nosuchthing'/);
  });

  it("rejects the read TradingView's own colours example gets wrong", () => {
    // The docs declare `holidayColor` and read `c_holiday`.
    expect(() => compileScript(v(5,
      'indicator("Holiday candles", "", true)\n' +
      'color holidayColor = color.rgb(1, 2, 3)\n' +
      'plotcandle(open, high, low, close, color = c_holiday)\n',
    ))).toThrow(/Undeclared identifier 'c_holiday'/);
  });

  it("reports a later version's name as a VERSION problem, not a typo", () => {
    expect(() => compileScript(v(3, 'study("t")\nplot(supertrend(3, 10))\n')))
      .toThrow(/not available in Pine Script v3/);
  });

  it("accepts everything a script binds — params, locals, loop variables", () => {
    expect(() => compileScript(v(4,
      'study("t")\n' +
      'f(x) => x * 2\n' +
      'total = 0.0\n' +
      'for i = 0 to 3\n' +
      '    total := total + f(i)\n' +
      'plot(total)\n',
    ))).not.toThrow();
  });

  it("accepts forward references, which v1 and v2 permit", () => {
    expect(() => compileScript('a = nz(b[1])\nb = close\nplot(a)\n')).not.toThrow();
  });

  it("does not mistake a keyword argument's NAME for a variable read", () => {
    // `title` and `linewidth` are parameter names, and no script declares them.
    expect(() => compileScript(v(4,
      'study("t")\nplot(close, title = "T", linewidth = 2)\n',
    ))).not.toThrow();
  });

  it("accepts the OHLCV series and the bar counter, which have no registry entry", () => {
    expect(() => compileScript(v(4,
      'study("t")\nplot(open + high + low + close + volume + bar_index)\n',
    ))).not.toThrow();
  });

  it("behaves identically at v1 and v2 — they are the same language", () => {
    const src = "plot(nosuchthing)\n";
    // Normalise the version number and the line — a `//@version` annotation
    // shifts every line by one, which is the ONLY difference allowed here.
    const at = (n: string) => {
      try { compileScript(n + src); return "accepted"; }
      catch (e: any) { return e.message.replace(/v\d/, "vN").replace(/@L\d+:/, "@L:"); }
    };
    expect(at("")).toBe(at("//@version=2\n"));
  });
});

describe("built-ins that are Pine but deliberately unimplemented", () => {
  it("compiles rather than rejecting — the read may never happen", () => {
    // conformance/corpus/v3/cci_commodity_channel_index.pine mentions `accdist`
    // in one branch of an input-selected chain; every other branch still works.
    expect(() => compileScript(v(3,
      'study("t")\nsrc = close\nif close > open\n    src := accdist\nplot(src)\n',
    ))).not.toThrow();
  });

  it("throws a NAMED error when the read actually happens", () => {
    const { js, profile } = compileScript(v(3, 'study("t")\nplot(accdist)\n'));
    const ctx = new Context(profile);
    const exec = compile(js, ctx, { ctx });
    ctx.setBar(0, 10, 12, 8, 11, 100);
    expect(() => exec()).toThrow(/'accdist' is a Pine built-in that OpenPineScript does not implement/);
  });
});
