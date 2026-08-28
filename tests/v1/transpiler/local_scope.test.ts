/**
 * Local scope — a name declared inside a block is not readable outside it.
 *
 * SOURCING. From the manual's programming FAQ: "The global scope is all of the
 * script that is not inside a function, if statement, or other conditional
 * structure", and "Only code that is in the same local scope can access a local
 * variable." The page's "Scope demo" is published precisely to show what
 * happens when you break that rule, and it names the error: the script "gives
 * an 'Undeclared identifier' error when we try to access a local variable from
 * the global scope".
 *
 * ── The failure this closes ─────────────────────────────────────────────────
 *
 * `ScopeInfo.bound` and `.declared` are flat sets over the whole file, so a
 * name bound anywhere looked bound everywhere. `checkUndeclaredRead` therefore
 * passed a local read from global scope, `visitId` emitted `opsv2_localValue`,
 * and `with(sandbox)` turned that into `opsv2_localValue is not defined` — a
 * JavaScript ReferenceError on the first bar, in the host, with no line number
 * and nothing about Pine in it. It was the LAST such crash in TradingView's
 * whole documentation corpus; every other unknown name was already reported at
 * compile time, which is the entire reason `checkUndeclaredRead` exists.
 *
 * ── Why a span and not a depth ──────────────────────────────────────────────
 *
 * Visibility relates two POSITIONS, not two nesting levels: a name bound in one
 * `if` is invisible in the `if` beside it, and those blocks are at the same
 * depth. The sibling case below is what pins that down.
 */
import { describe, it, expect } from "vitest";
import { transpile } from "../../../transpiler/common";
import * as fs from "node:fs";
import * as path from "node:path";

const head = (v: number) =>
  v === 1 ? 'study("t")\n'
          : `//@version=${v}\n${v >= 5 ? 'indicator("t")' : 'study("t")'}\n`;

const CORPUS = path.resolve(__dirname, "../../../examples");

describe("a variable local to an `if` block", () => {
  for (const v of [1, 2, 3, 4, 5]) {
    it(`v${v}: is not readable after the block`, () => {
      const src = head(v) + "if close > open\n    localValue = 1\nplot(localValue)\n";
      expect(() => transpile(src)).toThrow(/Undeclared identifier 'localValue'/);
    });

    it(`v${v}: IS readable inside the block`, () => {
      const src = head(v) + "if close > open\n    localValue = 1\n    plot(localValue)\n";
      expect(() => transpile(src)).not.toThrow();
    });
  }

  it("is not readable in the SIBLING block — same depth, different scope", () => {
    // The case a depth counter cannot see.
    const src = head(5) +
      "if close > open\n    a = 1\nif close < open\n    plot(a)\n";
    expect(() => transpile(src)).toThrow(/Undeclared identifier 'a'/);
  });

  it("IS readable in a block NESTED inside its own", () => {
    const src = head(5) +
      "if close > open\n    a = 1\n    if high > low\n        plot(a)\n";
    expect(() => transpile(src)).not.toThrow();
  });

  it("an `else` branch cannot see the `if` branch's local", () => {
    const src = head(5) +
      "if close > open\n    a = 1\nelse\n    plot(a)\n";
    expect(() => transpile(src)).toThrow(/Undeclared identifier 'a'/);
  });
});

describe("a variable local to a loop body", () => {
  it("is not readable after the loop", () => {
    const src = head(5) +
      "for i = 1 to 3\n    labelColor = color.blue\nx = labelColor\n";
    expect(() => transpile(src)).toThrow(/Undeclared identifier 'labelColor'/);
  });

  it("is readable within the body across iterations", () => {
    const src = head(5) +
      "for i = 1 to 3\n    c = close[i]\n    plot(c)\n";
    expect(() => transpile(src)).not.toThrow();
  });
});

describe("what is still global", () => {
  it("a global read from inside a block", () => {
    const src = head(5) + "g = 1\nif close > open\n    plot(g)\n";
    expect(() => transpile(src)).not.toThrow();
  });

  it("a `:=` inside a block still targets the global", () => {
    // Reassignment is not a binding, so it must not narrow the global's scope.
    const src = head(5) + "g = 0.0\nif close > open\n    g := 1.0\nplot(g)\n";
    expect(() => transpile(src)).not.toThrow();
  });

  it("a function parameter is visible in its own declaration list", () => {
    // The parameter list is itself a read of every parameter. Scoping params to
    // the BODY alone rejected the declaration site of 129 published scripts.
    const src = head(4) + "f(_text, _len) =>\n    _text + tostring(_len)\nx = f(\"a\", 1)\n";
    expect(() => transpile(src)).not.toThrow();
  });

  it("a function's local does not leak to script scope", () => {
    const src = head(5) + "f() =>\n    inner = 1\n    inner\nx = inner\n";
    expect(() => transpile(src)).toThrow(/Undeclared identifier 'inner'/);
  });

  it("...and a same-named global is still readable inside that function", () => {
    const src = head(5) + "shared = 1\nf() =>\n    shared + 1\nx = f()\n";
    expect(() => transpile(src)).not.toThrow();
  });
});

describe("TradingView's own scope demonstrations", () => {
  /**
   * Three vendored scripts are published to SHOW this error. They are the only
   * corpus files this rule newly rejects, which is the check that it rejects
   * the right thing: each one's page says in so many words that it does not
   * compile, and `v5-language-loops-04` says it in a comment in the source.
   */
  const DEMOS: Array<[string, RegExp]> = [
    ["v5/v5-faq-programming-00.pine", /Undeclared identifier 'localValue'/],
    ["v5/v5-faq-programming-02.pine", /Undeclared identifier 'isUpCandle'/],
    ["v5/v5-language-loops-04.pine", /Undeclared identifier 'labelColor'/],
  ];

  for (const [file, message] of DEMOS) {
    it(`${file} is refused, the way TradingView refuses it`, () => {
      const [version, name] = file.split("/");
      const src = fs.readFileSync(path.join(CORPUS, version, "tradingview-docs", name), "utf8");
      expect(() => transpile(src)).toThrow(message);
    });
  }
});
