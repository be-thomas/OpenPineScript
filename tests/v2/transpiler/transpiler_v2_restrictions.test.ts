/**
 * tests/v2/transpiler/transpiler_v2_restrictions.test.ts
 *
 * Pine Script v2 language restrictions enforced by ToJsVisitor:
 *   - ':=' rejected on a name that was never declared
 *   - '==' / '!=' against 'na' rejected (must use na(x))
 *   - direct recursion in user functions rejected
 *   - 'else if' is rejected at the parser layer (verified here for completeness)
 *
 * Also verifies the guards are overridable so a future v3 visitor can lift them.
 */
import { describe, it } from "vitest";
import assert from "node:assert";
import { transpile } from "../../../transpiler";
import { parse } from "../../../parser/v2";
import { V2ToJsVisitor } from "../../../transpiler/v2/ToJsVisitor";

// Every source here is v2, and must say so: an unannotated script is Pine
// Script v1, whose grammar has no ':=' token at all, so these would fail as
// syntax errors before reaching the v2 guards they are meant to exercise.
const throws = (src: string, re: RegExp) =>
    assert.throws(() => transpile(src, { version: 2 }), re);
const ok = (src: string) => assert.doesNotThrow(() => transpile(src, { version: 2 }));

// ─── ':=' reassignment ──────────────────────────────────────────────────────

// The rule is a DECLARATION rule, not a scope rule:
//
//   "Use the ':=' operator to assign a new value to a variable that has
//    already been defined."   — TradingView release notes, Pine v2
//
// An earlier version of this suite asserted the opposite — that ':=' was legal
// only on a for-loop accumulator. That was inferred rather than sourced, and it
// rejected two real published //@version=2 scripts (gap_down_reversal_strategy,
// VIX_bonds_strategy) that TradingView compiles. See transpiler/v2/ToJsVisitor.ts.
describe("v2 restriction: ':=' assigns only to a declared variable", () => {
    it("rejects assignment to a name that was never declared", () => {
        throws("x := 2\n", /'x' is not declared/);
    });

    it("rejects it inside an if-block too — scope is not what matters", () => {
        throws("a = 1\nif a == 1\n    y := 2\n", /'y' is not declared/);
    });

    it("allows reassignment at script scope", () => {
        ok("x = 1\nx := 2\n");
    });

    it("allows reassignment inside an if-block", () => {
        ok("a = 1\nif a == 1\n    a := 2\n");
    });

    it("allows ':=' on accumulators inside a for-loop", () => {
        ok("sum = 0\nfor i = 0 to 5\n    sum := sum + i\n");
    });

    it("allows ':=' after a loop has closed", () => {
        ok("y = 0\nfor i = 0 to 3\n    y := y + 1\ny := 9\n");
    });

    it("checks that the name is declared, not WHERE — v2 still allows forward references", () => {
        // Removing forward references is a v3 change (enforceNoForwardReference).
        // A lexical "seen so far" check here would reject valid v2 code, so the
        // guard asks whether the name is bound anywhere in the script.
        ok("x := 2\nx = 1\n");
    });
});

// ─── comparison against 'na' ────────────────────────────────────────────────

describe("v2 restriction: comparison against 'na'", () => {
    it("rejects 'x == na'", () => {
        throws('y = close == na ? 1 : 0\n', /compare to 'na'/);
    });

    it("rejects 'x != na'", () => {
        throws('y = close != na ? 1 : 0\n', /compare to 'na'/);
    });

    it("rejects 'na' on the left-hand side", () => {
        throws('y = na == close ? 1 : 0\n', /compare to 'na'/);
    });

    it("allows the na(x) function", () => {
        ok('y = na(close) ? 1 : 0\n');
    });

    it("allows plain assignment of na", () => {
        ok("y = na\n");
    });

    it("allows normal comparisons between non-na operands", () => {
        ok("y = close == open ? 1 : 0\n");
    });
});

// ─── recursion ──────────────────────────────────────────────────────────────

describe("v2 restriction: recursion", () => {
    it("rejects direct single-line recursion", () => {
        throws("f(x) => f(x)\n", /recursion is not allowed/);
    });

    it("rejects direct multi-line recursion", () => {
        throws("f(x) =>\n    y = f(x - 1)\n    y + 1\n", /recursion is not allowed/);
    });

    it("allows non-recursive functions", () => {
        ok("f(x) => x + 1\n");
    });

    it("allows one function calling another", () => {
        ok("g(x) => x + 1\nf(x) => g(x) + 2\n");
    });
});

// ─── else if (parser-layer rejection) ───────────────────────────────────────

describe("v2 restriction: 'else if'", () => {
    it("is rejected (handled at the parser layer)", () => {
        throws("x = if close > 1\n    1\nelse if close > 2\n    2\n", /Parsing failed|else/i);
    });
});

// ─── v3 extensibility: guards are overridable ───────────────────────────────

describe("v2 guards are overridable for a future v3 visitor", () => {
    // A v3-style visitor that lifts the v2-only restrictions.
    class V3Visitor extends V2ToJsVisitor {
        protected override enforceDeclaredBeforeReassignment(): void { /* lifted */ }
        protected override enforceNaComparison(): void { /* v3 relaxes na compare */ }
        protected override enforceNoRecursion(): void { /* v3 allows recursion */ }
    }

    const transpileV3 = (src: string): string => {
        const { tree, errorCount } = parse(src);
        if (errorCount > 0) throw new Error("parse failed");
        return new V3Visitor().visit(tree);
    };

    it("overriding enforceDeclaredBeforeReassignment lets an undeclared ':=' through", () => {
        const js = transpileV3("x := 2\n");
        assert.match(js, /opsv2_x = ctx\.new_var/);
    });

    it("overriding enforceNaComparison lets 'x == na' through", () => {
        const js = transpileV3("y = close == na ? 1 : 0\n");
        assert.match(js, /opsv2_close == opsv2_na/);
    });

    it("overriding enforceNoRecursion lets a function recurse", () => {
        assert.doesNotThrow(() => transpileV3("f(x) => f(x)\n"));
    });
});
