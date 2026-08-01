/**
 * Pine Script v3 → JavaScript emitter.
 *
 * ── THE WORKED EXAMPLE OF A VERSION DELTA ───────────────────────────────────
 *
 * v3 inherits every line of emit logic from v2 (and thus v1). This file
 * contains ONLY what the v2→v3 migration guide documents:
 *
 *   1. A variable may not reference itself in its own '=' declaration.
 *   2. An identifier may not be used before it is declared.
 *   3. Bools no longer coerce to numbers in arithmetic.
 *   4. A ':='-mutated variable may not be passed to security().
 *
 * Each is one `enforce*` method plus a two-line override that calls it and
 * delegates to `super`. Nothing in v1 or v2 was touched to add any of them.
 *
 * Every one is a TIGHTENING. v3 relaxes nothing: an earlier draft listed
 * "':=' becomes available at every scope" as a fifth delta, but v2 never had a
 * scope restriction to lift — see the sourcing note in ../v2/ToJsVisitor.ts.
 *
 * The security() lookahead default also flips in v3, but that is a RUNTIME
 * behaviour rather than an emit one — it lives in the v3 language profile and is
 * read by runtime/v1/stdlib/mtf.ts.
 *
 * NOTE ON `:=` — inherited from v2 wholesale, operator and guard alike. v1
 * rejects it as a syntax error because PineV1Lexer.g4 has no such token.
 */
import type { ParseTree } from "antlr4ng";
import type { PineVersion } from "../version";
import { V2ToJsVisitor } from "../v2/ToJsVisitor";
import { isStaticallyBool } from "../passes/ScopeAnalysis";
import {
  Var_defContext,
  Add_exprContext,
  Mult_exprContext,
  Fun_callContext,
  IdContext,
} from "../../parser/v3/generated/PineV3Parser";

/** Anything carrying a source position (see the v1 base for why it is structural). */
interface SourceLocated {
  start?: { line: number; column: number } | null;
}

export class V3ToJsVisitor extends V2ToJsVisitor {
  protected override readonly version: PineVersion = 3;

  // `scopes` and the analysis pass that fills it are inherited from v2, which
  // needs the same whole-script facts to check ':=' against declared names.

  // ── 1. No self-reference in a declaration ────────────────────────────────

  /**
   * `s = nz(s[1]) + close` was the v1/v2 state idiom. v3 requires declaring
   * first (`s = 0.0`) and then assigning with ':='.
   */
  protected enforceNoSelfReference(name: string, value: ParseTree, ctx: SourceLocated): void {
    // `skipCallees`: Pine keeps functions and variables in separate namespaces,
    // so `sma = sma(src, length)` binds a VARIABLE from the BUILTIN function and
    // is not self-reference. It is a common published idiom. Arguments are still
    // scanned, so `s = nz(s[1])` is still caught.
    if (!this.referencesIdentifier(value, name, { skipCallees: true })) return;
    throw this.err(
      ctx,
      `'${name}' cannot reference itself in its own declaration. Declare it ` +
      `first (e.g. '${name} = 0.0'), then assign with ':='.`
    );
  }

  override visitVar_def(ctx: Var_defContext): string {
    this.enforceNoSelfReference(ctx.id().getText(), ctx.arith_expr(), ctx);
    return super.visitVar_def(ctx as any);
  }

  // ── 2. No forward reference ──────────────────────────────────────────────

  /** An identifier may not be used before its declaration. Checked lexically. */
  protected enforceNoForwardReference(name: string, ctx: SourceLocated): void {
    // Functions live in their own namespace and may be called before the line
    // that declares a same-named variable.
    if (this.scopes.functions.has(name)) return;

    // A name that is also a function parameter or local says nothing about the
    // position of a same-named global: the body runs at CALL time, so it is not
    // a lexical forward reference. Skipping these trades a possible false
    // negative for the false POSITIVE that rejected valid published code.
    if (this.scopes.functionScoped.has(name)) return;

    const decl = this.scopes.declared.get(name);
    if (!decl) return; // builtin, parameter, or genuinely undefined — not our rule

    const line = ctx.start?.line ?? 0;
    const column = ctx.start?.column ?? 0;
    const isBefore = line < decl.line || (line === decl.line && column < decl.column);
    if (!isBefore) return;

    throw this.err(
      ctx,
      `'${name}' is used before it is declared (declared at @L${decl.line}:C${decl.column}). ` +
      `Move the declaration above its first use.`
    );
  }

  override visitId(ctx: IdContext): string {
    const text = ctx.getText();
    // Dotted names are namespace members (strategy.long, shape.triangleup), not
    // script-scope bindings, so the declaration rule does not apply to them.
    if (!text.includes(".")) {
      this.enforceNoForwardReference(text, ctx);
    }
    return super.visitId(ctx as any);
  }

  // ── 3. No implicit bool→number coercion in arithmetic ────────────────────

  /**
   * v1/v2 coerced true→1 and false→0; v3 requires an explicit `b ? 1 : 0`.
   *
   * Static detection only, and deliberately conservative — `isStaticallyBool`
   * answers "provably bool", not "possibly bool". A false negative is caught by
   * the runtime backstop in the arithmetic helpers; a false positive would
   * reject valid code.
   */
  protected enforceNoBoolArithmetic(operand: ParseTree, ctx: SourceLocated, op: string): void {
    if (!isStaticallyBool(operand, this.scopes.booleans)) return;
    throw this.err(
      ctx,
      `cannot use a bool as an operand of '${op}' (implicit bool-to-number ` +
      `conversion was removed). Convert explicitly with '? 1 : 0'.`
    );
  }

  override visitAdd_expr(ctx: Add_exprContext): string {
    const operands = ctx.mult_expr();
    if (operands.length > 1) {
      for (const operand of operands) {
        this.enforceNoBoolArithmetic(operand, ctx, (ctx.getChild(1) as any)?.getText() ?? "+");
      }
    }
    return super.visitAdd_expr(ctx as any);
  }

  override visitMult_expr(ctx: Mult_exprContext): string {
    const operands = ctx.unary_expr();
    if (operands.length > 1) {
      for (const operand of operands) {
        this.enforceNoBoolArithmetic(operand, ctx, (ctx.getChild(1) as any)?.getText() ?? "*");
      }
    }
    return super.visitMult_expr(ctx as any);
  }

  // ── 4. No ':='-mutated variable as a security() argument ─────────────────

  /**
   * Its value at HTF evaluation time is not the value the chart context holds,
   * so the result would be silently wrong. Wrap the calculation in a function.
   */
  protected enforceNoMutableSecurityArg(args: ParseTree | null, ctx: SourceLocated): void {
    if (!args) return;
    for (const name of this.scopes.mutated) {
      // A mutable variable reached through a function CALL is fine — that is
      // the documented workaround — so only bare references count.
      if (this.referencesIdentifier(args, name, { skipCalls: true })) {
        throw this.err(
          ctx,
          `cannot use mutable variable '${name}' as an argument for security(). ` +
          `Wrap the calculation in a function and pass the function call instead.`
        );
      }
    }
  }

  protected override emitSecurity(ctx: Fun_callContext): string {
    this.enforceNoMutableSecurityArg(ctx.fun_actual_args(), ctx);
    return super.emitSecurity(ctx as any);
  }
}
