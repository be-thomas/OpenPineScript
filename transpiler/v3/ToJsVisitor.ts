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
import type { ParseTree, ParserRuleContext } from "antlr4ng";
import type { PineVersion } from "../common/version";
import { V2ToJsVisitor } from "../v2/ToJsVisitor";
import { isRule } from "../v1/ToJsVisitor";
import { isStaticallyBool } from "../common/passes/ScopeAnalysis";
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

/**
 * Is this id the KEY of a keyword argument rather than a reference to a variable?
 *
 * `kw_arg : id DEFINE ( arith_expr | arith_exprs )`, and the base
 * `visitKw_arg` visits that id to emit the key — so a guard hooked on
 * `visitId` sees it. It is not a variable read: the name belongs to the callee's
 * parameter list, not to script scope.
 *
 *     plot(close, title="hi")
 *     title = 5
 *
 * reported `'title' is used before it is declared`, rejecting valid v3. The same
 * held for `color`, `style`, `length`, `transp` — any parameter name a script
 * later happens to bind as a variable.
 *
 * Checked through the parent rather than a visitor flag so it stays correct when
 * the VALUE side contains ids of its own (`title=prefix + name`).
 */
function isKeywordArgumentName(ctx: IdContext): boolean {
  const parent = (ctx as any).parent;
  // isRule, not instanceof — see the note in the v1 base.
  return isRule(parent, "Kw_argContext") && parent.id?.() === ctx;
}

const SHADOW_BLOCKS = ["Local_stmts_multilineContext", "Fun_body_singlelineContext"];

/** `findOuterDeclaration`'s lookup: declarations and `:=` targets by name, with their enclosing blocks (outermost first). */
interface ShadowIndex {
  root: any;
  decls: Map<string, Array<{ node: any; blocks: any[] }>>;
  assigns: Map<string, Array<{ node: any; blocks: any[] }>>;
}

export class V3ToJsVisitor extends V2ToJsVisitor {
  protected override readonly version: PineVersion = 3;

  // `scopes` and the analysis pass that fills it are inherited from v2, which
  // needs the same whole-script facts to check ':=' against declared names.

  // ── 1. No self-reference in a declaration ────────────────────────────────

  /**
   * `s = nz(s[1]) + close` was the v1/v2 state idiom. v3 requires declaring
   * first (`s = 0.0`) and then assigning with ':='.
   *
   * What is NOT a self-reference (dev-docs/tv-parity/_probes/corpus98/p7_*,
   * p9_*, p10_*, BINANCE:BTCUSDT 1h, 2026-11-14):
   *
   *   - A KEYWORD ARGUMENT's name: `type = input(defval = "A", type = string)`
   *     names a parameter, never reads a variable.
   *   - An `if` expression whose branches declare the name: `hh = if c` /
   *     `hh = 1.0` / `else` / `hh = 2.0`. The branches' `hh` are their own.
   *   - An inner declaration over an OUTER variable of the same name, in a
   *     nested block or a function body: a new local whose initialiser reads the
   *     outer one. See `allowsShadowOfOuter`.
   */
  protected enforceNoSelfReference(name: string, value: ParseTree, ctx: SourceLocated): void {
    if (!this.valueReadsName(name, value)) return;
    if (this.allowsShadowOfOuter(name, ctx)) return;
    throw this.err(
      ctx,
      `'${name}' cannot reference itself in its own declaration. Declare it ` +
      `first (e.g. '${name} = 0.0'), then assign with ':='.`
    );
  }

  /**
   * Does this initialiser read the variable being declared?
   *
   * `skipCallees`: Pine keeps functions and variables in separate namespaces,
   * so `sma = sma(src, length)` binds a VARIABLE from the BUILTIN function and
   * is not self-reference. It is a common published idiom. Arguments are still
   * scanned, so `s = nz(s[1])` is still caught.
   */
  protected valueReadsName(name: string, node: ParseTree | null): boolean {
    if (!node) return false;
    const n = node as any;
    if (isRule(n, "Call_suffixContext")) {
      const args = n.fun_actual_args?.();
      return args ? this.valueReadsName(name, args) : false;
    }
    if (isRule(n, "IdContext")) {
      if (isKeywordArgumentName(n)) return false;
      if (!this.readsDottedRoots()) return n.getText() === name;
      // A dotted id: only its FIRST part names a variable, and only when
      // that part is not a namespace, type, enum or library — in
      // `position = position.middle_center` the variable does not exist yet,
      // so the dotted name is the namespace's.
      const text: string = n.getText();
      if (text.includes(".") && this.isQualifierRoot(text.split(".")[0])) return false;
      return text.split(".")[0] === name;
    }
    if (isRule(n, "Fun_callContext")) {
      // The callee is a function name, in its own namespace; its arguments
      // and any suffixes' arguments are read.
      const callee = n.id?.()?.getText?.() ?? "";
      const receiverRead = this.readsDottedRoots() && callee.includes(".") && callee.split(".")[0] === name
        && !this.isQualifierRoot(name);
      if (receiverRead) return true;
      const calleeId = n.id?.();
      for (let i = 0; i < (n.getChildCount?.() ?? 0); i++) {
        const child = n.getChild(i);
        if (child && child !== calleeId && this.valueReadsName(name, child)) return true;
      }
      return false;
    }
    // A block that declares the name binds its OWN: reads inside it are not ours.
    if (isRule(n, "Local_stmts_multilineContext")) {
      const declares = (n.local_stmts_list?.()?.local_stmt_multiline?.() ?? [])
        .some((l: any) => (l.local_stmt_content?.() ?? [])
          .some((c: any) => c.var_def?.()?.id?.()?.getText?.() === name));
      if (declares) return false;
    }
    for (let i = 0; i < (n.getChildCount?.() ?? 0); i++) {
      if (this.valueReadsName(name, n.getChild(i))) return true;
    }
    return false;
  }

  /**
   * Does a dotted id (`x.y`, `x.f()`) read the variable `x`? v5 added fields,
   * methods and user types, so there it does unless `x` is a namespace, type,
   * enum or library; before that a dotted name is always a built-in's.
   */
  protected readsDottedRoots(): boolean { return false; }

  /** Is `root` a namespace, user type, enum or library alias — a qualifier, not a variable? */
  protected isQualifierRoot(_root: string): boolean { return false; }

  /** Does this version refuse a shadow whose outer initialiser is a constant? */
  protected refusesShadowOfConstant(): boolean { return true; }

  /**
   * An inner `x = <expr using x>` over an outer `x` is a new local reading the
   * outer one; the outer keeps its value. TradingView v3 and v4 compile that
   * when the outer's initialiser is not a compile-time constant, and refuse
   * with "Undeclared identifier" when it is (a literal or operators over
   * literals); v5 and v6 compile either way.
   *
   * Returns true when the shadow is allowed, false when there is no outer
   * variable (a true self-reference), and throws for the constant case.
   */
  protected allowsShadowOfOuter(name: string, ctx: SourceLocated): boolean {
    const outer = this.findOuterDeclaration(name, ctx as any);
    if (!outer) return false;
    if (this.refusesShadowOfConstant() && this.isCompileTimeConstant(outer.arith_expr?.())
        && !this.isReassigned(name, outer)) {
      throw this.err(ctx, `Undeclared identifier '${name}'.`);
    }
    this.shadowPending = true;
    return true;
  }

  /**
   * Every `name = …` declaration and `name := …` assignment of the script, with
   * the blocks around each, built once on first use: `findOuterDeclaration` and
   * `isReassigned` run for every self-referencing declaration, and walking the
   * whole tree for each was quadratic on a large script.
   */
  private shadowIndex: ShadowIndex | null = null;

  private shadowIndexOf(ctx: any): ShadowIndex {
    let root = ctx;
    while (root.parent) root = root.parent;
    if (this.shadowIndex?.root === root) return this.shadowIndex;
    const index: ShadowIndex = { root, decls: new Map(), assigns: new Map() };
    const blocks: any[] = [];
    const walk = (node: any): void => {
      const block = SHADOW_BLOCKS.some(b => isRule(node, b));
      if (block) blocks.push(node);
      const isDef = isRule(node, "Var_defContext");
      if (isDef || isRule(node, "Var_assignContext")) {
        const name = node.id?.()?.getText?.();
        if (name !== undefined) {
          const into = isDef ? index.decls : index.assigns;
          const entry = { node, blocks: blocks.slice() };
          const list = into.get(name);
          if (list) list.push(entry); else into.set(name, [entry]);
        }
      }
      for (let i = 0; i < (node.getChildCount?.() ?? 0); i++) walk(node.getChild(i));
      if (block) blocks.pop();
    };
    walk(root);
    this.shadowIndex = index;
    return index;
  }

  /**
   * The nearest earlier declaration of `name` in a scope that strictly
   * encloses `ctx`'s: every block around it also surrounds `ctx`, and `ctx`
   * sits in at least one more. The same block is a redeclaration, not a shadow.
   */
  private findOuterDeclaration(name: string, ctx: any): any | null {
    const mine = new Set<any>();
    for (let p = ctx.parent; p; p = p.parent) if (SHADOW_BLOCKS.some(b => isRule(p, b))) mine.add(p);
    const at = ctx.start?.tokenIndex ?? 0;
    let found: any = null;
    for (const { node, blocks } of this.shadowIndexOf(ctx).decls.get(name) ?? []) {
      // `blocks` is outermost first; the block set is the same one the tree gives.
      if (node !== ctx && (node.start?.tokenIndex ?? 0) < at
          && blocks.length < mine.size && blocks.every(b => mine.has(b))) found = node;
    }
    return found;
  }

  /**
   * Is `name` the target of a `:=` anywhere in the scope `outer` was declared in
   * (before or after it)? Such a variable is no longer a constant: TradingView
   * v3 and v4 load a shadow over it (dev-docs/tv-parity/_probes/corpus98/
   * p11_*, J and L).
   *
   * Only a `:=` that assigns `outer` counts: one under a nested declaration of
   * the same name (an earlier `name = …` in a block between it and the scope),
   * or inside a function or loop that binds the name, assigns that shadow.
   */
  private isReassigned(name: string, outer: any): boolean {
    let scope = outer;
    while (scope.parent && !SHADOW_BLOCKS.some(b => isRule(scope, b))) scope = scope.parent;
    const index = this.shadowIndexOf(outer);
    const decls = index.decls.get(name) ?? [];
    for (const { node: assign } of index.assigns.get(name) ?? []) {
      const between = new Set<any>();
      let bound = false;
      let p = assign.parent;
      for (; p && p !== scope; p = p.parent) {
        if (SHADOW_BLOCKS.some(b => isRule(p, b))) between.add(p);
        else if (this.bindsName(p, name)) bound = true;
      }
      if (p !== scope) continue; // outside the scope `outer` lives in
      if (bound) continue;
      const at = assign.start?.tokenIndex ?? 0;
      if (decls.some(d => d.node !== outer && (d.node.start?.tokenIndex ?? 0) < at
          && d.blocks.length > 0 && between.has(d.blocks[d.blocks.length - 1]))) continue;
      return true;
    }
    return false;
  }

  /** A function (its parameters) or `for` (its counter) that binds `name` for its body. */
  private bindsName(node: any, name: string): boolean {
    if (isRule(node, "Fun_def_singlelineContext") || isRule(node, "Fun_def_multilineContext")) {
      const head = node.fun_head?.();
      const params = head?.fun_param?.()?.map((q: any) => q.id?.()) ?? head?.id?.() ?? [];
      return params.some((q: any) => q?.getText?.() === name);
    }
    return /^For_/.test(node?.constructor?.name ?? "") && node.id?.()?.getText?.() === name;
  }

  /**
   * A literal, or operators over literals only. Conservative: any name, call or
   * history reference makes it NOT constant, and a shadow of a non-constant is
   * the allowed direction.
   */
  protected isCompileTimeConstant(node: ParseTree | null | undefined): boolean {
    if (!node) return false;
    const n = node as any;
    if (isRule(n, "IdContext") || isRule(n, "Fun_callContext")) return false;
    if (n.symbol) return n.getText() !== "[";
    for (let i = 0; i < (n.getChildCount?.() ?? 0); i++) {
      if (!this.isCompileTimeConstant(n.getChild(i))) return false;
    }
    return true;
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
    if (!text.includes(".") && !isKeywordArgumentName(ctx)) {
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
    // `booleans` holds script-scope names. Inside a function body a name the
    // function binds itself is the function's own, not the script's bool.
    const booleans: ReadonlySet<string> = this.fnDepth > 0
      ? { has: (n: string) => this.scopes.booleans.has(n) && !this.scopes.functionScoped.has(n) } as ReadonlySet<string>
      : this.scopes.booleans;
    if (!isStaticallyBool(operand, booleans)) return;
    throw this.err(
      ctx,
      `cannot use a bool as an operand of '${op}' (implicit bool-to-number ` +
      `conversion was removed). Convert explicitly with '? 1 : 0'.`
    );
  }

  /**
   * The operator ADJACENT to operand `i`, in a flat `a + b - c` chain.
   *
   * Children alternate operand, operator, operand, …, so operand `i` is
   * preceded by the operator at `i * 2 - 1`. Reading `getChild(1)`
   * unconditionally named the FIRST operator every time, so `z = 1 + 2 - b`
   * with a bool `b` reported "cannot use a bool as an operand of '+'" when the
   * offending operator is '-'. Cosmetic, but a diagnostic that points at the
   * wrong token sends the reader to the wrong place.
   */
  private operatorFor(ctx: ParserRuleContext, index: number, fallback: string): string {
    if (index === 0) return (ctx.getChild(1) as any)?.getText() ?? fallback;
    return (ctx.getChild(index * 2 - 1) as any)?.getText() ?? fallback;
  }

  override visitAdd_expr(ctx: Add_exprContext): string {
    const operands = ctx.mult_expr();
    if (operands.length > 1) {
      operands.forEach((operand, i) => {
        this.enforceNoBoolArithmetic(operand, ctx, this.operatorFor(ctx as any, i, "+"));
      });
    }
    return super.visitAdd_expr(ctx as any);
  }

  override visitMult_expr(ctx: Mult_exprContext): string {
    const operands = ctx.unary_expr();
    if (operands.length > 1) {
      operands.forEach((operand, i) => {
        this.enforceNoBoolArithmetic(operand, ctx, this.operatorFor(ctx as any, i, "*"));
      });
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

  /**
   * Does this security-family call carry the mutable-argument restriction?
   *
   * A seam, because v5 splits the family: `request.security_lower_tf` keeps the
   * rule and `request.security` loses it. Answering here rather than in
   * `emitSecurity` keeps the walk in one place.
   */
  protected securityRestrictsMutableArgs(_ctx: Fun_callContext): boolean {
    return true;
  }

  protected override emitSecurity(ctx: Fun_callContext): string {
    if (this.securityRestrictsMutableArgs(ctx))
      this.enforceNoMutableSecurityArg(ctx.fun_actual_args(), ctx);
    return super.emitSecurity(ctx as any);
  }
}
