/**
 * Pine Script v2 → JavaScript emitter.
 *
 * v2 inherits every line of emit logic from v1 and adds exactly one thing:
 * reassignment with ':='.
 *
 * The operator is a v2 GRAMMAR addition (PineV2Lexer.g4 declares the token,
 * PineV2Parser.g4 the rule), so v1 rejects `x := 1` as a syntax error — its
 * grammar has never heard of the token. There is no "reassignment is not
 * allowed in v1" guard anywhere, because v1 cannot reach one.
 *
 * SCOPE is the part a grammar cannot express, and the documented rule is a
 * DECLARATION rule, not a scope one:
 *
 *   "Pine now supports mutable variables! Use the ':=' operator to assign a new
 *    value to a variable that has already been defined."
 *      — TradingView release notes, Pine v2
 *   "A variable must be declared before you can set a value for it."
 *      — Expressions, declarations and statements (v3 manual, which documents
 *        ':=' as requiring only //@version=2)
 *
 * Neither source restricts ':=' by scope, and the corpus agrees: two published
 * //@version=2 scripts reassign at script scope —
 *
 *     longStopPrice = 0.0                          gap_down_reversal_strategy
 *     longStopPrice := if (strategy.position_size > 0)
 *
 *     if crossunder(corVix, -.1) or ...            VIX_bonds_strategy
 *         signal1 := -100
 *
 * An earlier version of this file restricted ':=' to for-loop accumulators and
 * rejected both. That restriction was inferred, not sourced, and it was wrong:
 * TradingView compiled and published these scripts. What is enforced now is the
 * rule the documentation actually states — assign only to a name that was
 * declared.
 *
 * v3 inherits this guard unchanged. ':=' scope was never a v1→v2→v3 delta.
 *
 * ⚠ See the sourcing note in grammar/PineV2Lexer.g4 on why ':=' is placed at v2
 * rather than v1. If that turns out to be wrong, this class moves to v1 wholesale.
 */
import type { PineVersion } from "../version";
import { V1ToJsVisitor } from "../v1/ToJsVisitor";
import { ScopeInfo, analyseScopes } from "../passes/ScopeAnalysis";
import {
  Pine_scriptContext,
  Var_assignContext,
  Global_stmt_contentContext,
  Local_stmt_contentContext,
} from "../../parser/v2/generated/PineV2Parser";
export type { Local_stmt_contentContext };

/** Anything carrying a source position (see the v1 base for why it is structural). */
interface SourceLocated {
  start?: { line: number; column: number } | null;
}

export class V2ToJsVisitor extends V1ToJsVisitor {
  protected override readonly version: PineVersion = 2;

  /**
   * Whole-script facts the single-pass emitter cannot derive on its own.
   *
   * ':=' needs to know whether a name is bound ANYWHERE, including further down
   * the file: v2 still permits forward references (v3 is the version that
   * removes them), so a lexical "seen so far" set would reject valid v2 code.
   *
   * v1 never runs this pass — it has no ':=' to check.
   */
  protected scopes: ScopeInfo = {
    declared: new Map(), mutated: new Set(), booleans: new Set(),
    functions: new Set(), bound: new Set(), functionScoped: new Set(),
  };

  override visitPine_script(ctx: Pine_scriptContext): string {
    this.scopes = analyseScopes(ctx);
    return super.visitPine_script(ctx as any);
  }

  /**
   * ':=' assigns to a variable "that has already been defined". Assigning to a
   * name that is never declared is the `Undeclared identifier` error, which is
   * how `if x==1 / y := 2` fails on TradingView.
   *
   * Scope is deliberately NOT checked — see the sourcing note at the top of this
   * file. POSITION is not checked here either: forward references are legal in
   * v2, and v3 rejects them through `enforceNoForwardReference`, which already
   * sees this id because `visitVar_assign` visits it.
   */
  protected enforceDeclaredBeforeReassignment(ctx: Var_assignContext): void {
    const name = ctx.id().getText();

    // Inside a function body, the target may be a parameter or a local, neither
    // of which is a script-scope declaration. `bound` is the right question there.
    //
    // At script scope it is the WRONG question: `bound` also contains every
    // function parameter and local in the file, so
    //
    //     f(x) => x + 1
    //     x := 2            // no script-scope 'x' exists
    //
    // passed because some function happened to bind `x`. TradingView reports
    // `Undeclared identifier`. Script scope asks `declared`, which the analysis
    // pass already restricts to fnDepth 0.
    const known = this.fnDepth > 0
      ? this.scopes.bound.has(name)
      : this.scopes.declared.has(name);
    if (known) return;

    throw this.err(
      ctx,
      `'${name}' is not declared, so it cannot be assigned with ':='. ` +
      `Declare it first (e.g. '${name} = 0.0').`
    );
  }

  /** Handle: x := 1 */
  visitVar_assign(ctx: Var_assignContext): string {
    this.enforceDeclaredBeforeReassignment(ctx);
    const name = this.visit(ctx.id());
    const value = this.visit(ctx.arith_expr());
    // No 'let' — this updates the existing binding in the enclosing scope.
    // ctx.new_var() overwrites the current bar's slot and returns the Series, so
    // repeated assignment within one bar still yields exactly one history entry.
    return `${name} = ctx.new_var("${name}", ${value})`;
  }

  /**
   * v2's global_stmt_content / local_stmt_content gained a `var_assign`
   * alternative, so the statement dispatcher has to route it. Everything else
   * falls through to the inherited implementation.
   */
  protected override visitContent(
    ctx: Global_stmt_contentContext | Local_stmt_contentContext,
  ): string {
    if (ctx.var_assign()) return this.visit(ctx.var_assign()!);
    return super.visitContent(ctx as any);
  }

  /**
   * ':=' is a binding form too, so a function body ending in one returns the
   * reassigned variable. v1 only knows about '='.
   */
  protected override trailingValueName(content: Local_stmt_contentContext): string | null {
    const assign = content.var_assign();
    if (assign) return this.visit(assign.id());
    return super.trailingValueName(content as any);
  }
}
