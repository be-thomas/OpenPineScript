/**
 * Pine Script v1 → JavaScript emitter. THE BASE OF THE VISITOR HIERARCHY.
 *
 * Target: OpenPineScript Runtime (Series Object Architecture).
 *
 * ── RULES FOR EDITING THIS FILE ─────────────────────────────────────────────
 *
 * This class implements Pine Script v1 and nothing else. It must not contain a
 * rule, a flag, or an empty hook that exists only to serve a later version.
 *
 * A later version changes behaviour by SUBCLASSING and overriding the relevant
 * visit* method, usually delegating to `super`:
 *
 *     override visitVar_def(ctx: Var_defContext): string {
 *       this.enforceNoSelfReference(...);      // the v3 rule
 *       return super.visitVar_def(ctx);        // the inherited emit logic
 *     }
 *
 * That is why the helpers here are `protected` rather than `private`: they are
 * the documented extension surface. It is also why there is no `restricts(id)`
 * lookup any more — a rule that applies to v1 fires unconditionally here, and a
 * rule that does not apply to v1 simply is not written here.
 *
 * See transpiler/v3/ToJsVisitor.ts for a worked example, and
 * dev-docs/00-architecture-assessment.md for the rationale.
 */

import { ParseTreeVisitor } from "antlr4ng";
import type { TerminalNode, ParserRuleContext, ParseTree } from "antlr4ng";
import * as common from "../../utils/v2/common";
import type { PineVersion } from "../version";
import {
  Pine_scriptContext,
  StmtContext,
  Global_stmtContext,
  Global_stmt_contentContext,
  Fun_def_stmtContext,
  Fun_def_singlelineContext,
  Fun_def_multilineContext,
  Fun_headContext,
  Fun_body_singlelineContext,
  Local_stmt_singlelineContext,
  Local_stmt_contentContext,
  Loop_breakContext,
  Loop_continueContext,
  Fun_body_multilineContext,
  Local_stmts_multilineContext,
  Local_stmts_listContext,
  Local_stmt_multilineContext,
  Var_defContext,
  Var_defsContext,
  Ids_arrayContext,
  Arith_exprsContext,
  Arith_exprContext,
  If_exprContext,
  For_exprContext,
  Stmts_blockContext,
  Ternary_exprContext,
  Or_exprContext,
  And_exprContext,
  Eq_exprContext,
  Cmp_exprContext,
  Add_exprContext,
  Mult_exprContext,
  Unary_exprContext,
  Sqbr_exprContext,
  AtomContext,
  Fun_callContext,
  Fun_actual_argsContext,
  Pos_argsContext,
  Kw_argsContext,
  Kw_argContext,
  LiteralContext,
  Num_literalContext,
  Other_literalContext,
  IdContext,
} from "../../parser/v1/generated/PineV1Parser";
import { getGeneratedRegistry } from "../../runtime/v1/stdlib/metadata";

const REGISTRY = getGeneratedRegistry();

/**
 * Anything carrying a source position. Structural rather than
 * `ParserRuleContext`, because the generated context classes are generic in
 * their visit result and do not assign to the base type.
 */
interface SourceLocated {
  start?: { line: number; column: number } | null;
}

/**
 * Is `node` a parse-tree node for the named grammar rule?
 *
 * MUST be used instead of `instanceof`. TypeScript is structural, so a v3
 * `IdContext` satisfies the v1 `IdContext` TYPE and every override in the
 * hierarchy type-checks — but `instanceof` is nominal at RUNTIME, and each
 * version generates its own distinct context classes. `node instanceof
 * IdContext` in this file is therefore FALSE for every v2 or v3 tree, which
 * silently disables any guard built on it rather than failing loudly.
 *
 * Rule indices are no good either: an importing grammar lists its new and
 * overridden rules first, so the same rule has a different index per version.
 * The class NAME is the one identifier ANTLR keeps stable across the hierarchy.
 */
function isRule(node: unknown, ruleContextName: string): boolean {
  return (node as any)?.constructor?.name === ruleContextName;
}

export class V1ToJsVisitor extends ParseTreeVisitor<string> {
  /**
   * The version this emitter implements. Subclasses override it, and every
   * diagnostic is stamped with it, so an inherited guard reports the version
   * that actually rejected the code rather than the one that wrote the check.
   */
  protected readonly version: PineVersion = 1;

  // Prefix for all emitted identifiers to avoid sandbox name clashes
  protected readonly PREFIX = common.PREFIX;
  protected anonCounter = 0;
  // Script kind from the study()/strategy() directive; drives strategy.* enforcement.
  protected scriptKind: 'study' | 'strategy' | undefined = undefined;
  /** Names of user-defined functions; populated at the entry point. */
  protected userFunctions: ReadonlySet<string> = new Set();
  /**
   * Script-scope variables READ above the line that declares them.
   *
   * v1 and v2 permit forward references, and published code relies on it to
   * seed a counter from its own previous bar:
   *
   *     Seq_Gn_t = seq_diff > 0 ? nz(Seq_Gn[1]) + 1 : 0     // line 705
   *     Seq_Gn   = Seq_Gn_t > 9 ? 1 : Seq_Gn_t              // line 707
   *
   * Emitting `let opsv2_Seq_Gn` at its declaration puts line 705 in the
   * temporal dead zone. These names get a hoisted `let` prologue instead, so
   * the binding exists (as undefined) before any read — at which point
   * ctx.get() falls through to the by-name series lookup, which is the previous
   * bar's value. That is exactly Pine's semantics.
   *
   * v3 rejects forward references outright, so this set is empty there.
   */
  protected hoisted: ReadonlySet<string> = new Set();

  /** Prefix every diagnostic with the version that rejected the code. */
  protected err(ctx: SourceLocated, message: string): Error {
    return new Error(
      `Pine Script v${this.version} Error at ${this.getLocId(ctx)}: ${message}`
    );
  }

  protected override defaultResult(): string {
    return "";
  }
  protected override aggregateResult(aggregate: string, nextResult: string): string {
    return aggregate + nextResult;
  }
  public override visitTerminal(node: TerminalNode): string {
    return node.getText();
  }

  /** * Helper: Generates a Deterministic ID based on Source Location.
   * Example: "@L10:C5" (Line 10, Column 5)
   */
  protected getLocId(ctx: SourceLocated): string {
    const line = ctx.start?.line || 0;
    const col = ctx.start?.column || 0;
    return `@L${line}:C${col}`;
  }

  // ───────────────────────────────────────────────────────────────────────
  // Language restrictions — v1's own
  //
  // Each lives in its own `protected enforce*` method and is called from the
  // relevant visit* method. They fire UNCONDITIONALLY: this class is v1, so a
  // rule written here is by definition a v1 rule.
  //
  // A later version that LIFTS one of these overrides the enforce* method to a
  // no-op. A later version that ADDS a rule declares it in its own subclass —
  // never here. See dev-docs/00-architecture-assessment.md.
  //
  // NOTE: v1's two other restrictions are enforced by the GRAMMAR, not here.
  // `x := expr` and `else if` have no rule in PineV1Parser.g4, so they are
  // syntax errors — which is what TradingView reports.
  //
  // See dev-docs/01-version-delta-spec.md for the source of each rule.
  // ───────────────────────────────────────────────────────────────────────

  /** '==' / '!=' against 'na' silently misbehaves — require the na(x) function. */
  protected enforceNaComparison(ctx: Eq_exprContext): void {
    if (ctx.cmp_expr().length < 2) return; // a single operand is not a comparison
    for (const operand of ctx.cmp_expr()) {
      if (operand.getText() === "na") {
        throw this.err(
          ctx,
          `cannot compare to 'na' with '==' or '!=' (it does not behave as ` +
          `expected). Use the na(x) function instead.`
        );
      }
    }
  }

  /** User-defined functions cannot recurse — reject direct self-reference. */
  protected enforceNoRecursion(name: string, body: ParseTree, ctx: SourceLocated): void {
    if (this.callsFunction(body, name)) {
      throw this.err(ctx, `recursion is not allowed; function '${name}' refers to itself.`);
    }
  }

  /**
   * A study() script is in indicator mode — the broker emulator is disabled, so
   * any strategy.* order/state call is a fatal error. Allowed under strategy()
   * or when no directive is declared (permissive default).
   */
  protected enforceStrategyContext(name: string, ctx: SourceLocated): void {
    if (this.scriptKind === 'study') {
      // Name the directive the user actually wrote, not the profile default —
      // otherwise the message points at the wrong keyword the moment the two
      // differ (v5 renames study() to indicator()).
      throw this.err(
        ctx,
        `'${name}' is unavailable in a ${this.scriptKind}() script (indicator mode). ` +
        `Declare strategy(...) to use the broker emulator.`
      );
    }
  }

  /** User-defined functions cannot return tuples. */
  protected enforceNoTupleReturn(ctx: SourceLocated, detail = ""): void {
    throw this.err(ctx, `User-defined functions cannot return tuples.${detail}`);
  }

  /**
   * Does this subtree reference `name` as a bare identifier?
   *
   * `skipCallees` ignores the NAME position of a call while still scanning its
   * arguments — `sma(x)` is not a reference to the variable `sma`, but
   * `nz(s[1])` is a reference to `s`.
   *
   * `skipCalls` ignores whole call subtrees, arguments included.
   */
  protected referencesIdentifier(
    node: ParseTree | null,
    name: string,
    opts: { skipCalls?: boolean; skipCallees?: boolean } = {},
  ): boolean {
    if (!node) return false;
    const anyNode = node as any;

    if (isRule(anyNode, "IdContext") && anyNode.getText() === name) return true;

    const isCall = isRule(anyNode, "Fun_callContext");
    const calleeId = isCall ? anyNode.id?.() : null;

    const count = anyNode.getChildCount?.() ?? 0;
    for (let i = 0; i < count; i++) {
      const child = anyNode.getChild(i);
      if (!child) continue;
      if (opts.skipCalls && isRule(child, "Fun_callContext")) continue;
      // Skip only the callee's own name node, not the argument list.
      if (opts.skipCallees && calleeId && child === calleeId) continue;
      if (this.referencesIdentifier(child, name, opts)) return true;
    }
    return false;
  }

  /** Recursively scan a subtree for a call to the named function. */
  protected callsFunction(node: ParseTree, name: string): boolean {
    if (isRule(node, "Fun_callContext") && (node as any).id().getText() === name) return true;
    const count = node.getChildCount();
    for (let i = 0; i < count; i++) {
      const child = node.getChild(i);
      if (child && this.callsFunction(child, name)) return true;
    }
    return false;
  }

  // --- Entry Point ---
  visitPine_script(ctx: Pine_scriptContext): string {
    // Determine the script kind from its study()/strategy() directive up front,
    // so strategy.* enforcement is independent of statement visit order.
    this.scriptKind = this.detectDirective(ctx);
    // Names of user-defined functions, needed before emission so a call can be
    // emitted in the function namespace even when it appears above the
    // definition. See funcName().
    this.userFunctions = this.collectFunctionNames(ctx);
    this.hoisted = this.collectForwardReferenced(ctx);

    const stmts = ctx.stmt().map((s) => this.visit(s)).filter(Boolean);
    const body = stmts.join("\n");

    if (this.hoisted.size === 0) return body;
    const names = [...this.hoisted].map(n => `${this.PREFIX}${n}`).sort().join(", ");
    return `let ${names};\n${body}`;
  }

  /**
   * Script-scope names whose first READ is above their declaration.
   *
   * Only script scope: a function body runs at call time, so a name declared
   * inside one is not lexically ordered against the script around it.
   */
  protected collectForwardReferenced(root: ParseTree): Set<string> {
    const declaredAt = new Map<string, number>();
    const firstReadAt = new Map<string, number>();

    const pos = (n: any): number => (n?.start?.line ?? 0) * 10000 + (n?.start?.column ?? 0);

    const walk = (n: any, inFunction: boolean): void => {
      if (!n) return;
      const nowInFunction = inFunction
        || isRule(n, "Fun_def_singlelineContext") || isRule(n, "Fun_def_multilineContext");

      if (!nowInFunction && isRule(n, "Var_defContext")) {
        const name = n.id?.()?.getText?.();
        if (name && !declaredAt.has(name)) declaredAt.set(name, pos(n));
      }
      if (isRule(n, "IdContext")) {
        const name = n.getText();
        if (!firstReadAt.has(name)) firstReadAt.set(name, pos(n));
      }
      const count = n.getChildCount?.() ?? 0;
      for (let i = 0; i < count; i++) walk(n.getChild(i), nowInFunction);
    };
    walk(root, false);

    const out = new Set<string>();
    for (const [name, declPos] of declaredAt) {
      const readPos = firstReadAt.get(name);
      if (readPos !== undefined && readPos < declPos) out.add(name);
    }
    return out;
  }

  /** Every user-defined function name in the script. */
  protected collectFunctionNames(node: ParseTree): Set<string> {
    const found = new Set<string>();
    const walk = (n: any): void => {
      if (!n) return;
      if (isRule(n, "Fun_def_singlelineContext") || isRule(n, "Fun_def_multilineContext")) {
        const name = n.id?.()?.getText?.();
        if (name) found.add(name);
      }
      const count = n.getChildCount?.() ?? 0;
      for (let i = 0; i < count; i++) walk(n.getChild(i));
    };
    walk(node);
    return found;
  }

  /**
   * The emitted name of a user-defined function.
   *
   * Pine keeps FUNCTIONS and VARIABLES in separate namespaces; JavaScript does
   * not. So this is legal Pine:
   *
   *     mama(src, fast, slow) => ...
   *     mama = mama(src, fast, slow)          // variable named after the function
   *
   * Emitted with one namespace, the `let opsv2_mama` shadows the function it is
   * initialised from, and the call hits the temporal dead zone. Built-in callees
   * were already routed around this through ctx.builtin(); user-defined ones
   * need their own namespace, which is what the '$' does — it is legal in a
   * JavaScript identifier and cannot occur in a Pine one, so a collision with a
   * script variable is impossible rather than merely unlikely.
   */
  protected funcName(pineName: string): string {
    return `${this.PREFIX}$fn_${pineName}`;
  }

  /** Find the first study()/strategy() directive call in the script, if any. */
  protected detectDirective(node: ParseTree): 'study' | 'strategy' | undefined {
    if (isRule(node, "Fun_callContext")) {
      const name = node.id().getText();
      if (name === "study" || name === "strategy") return name;
    }
    const count = node.getChildCount();
    for (let i = 0; i < count; i++) {
      const child = node.getChild(i);
      if (child) {
        const found = this.detectDirective(child);
        if (found) return found;
      }
    }
    return undefined;
  }

  visitStmt(ctx: StmtContext): string {
    if (ctx.fun_def_stmt()) return this.visit(ctx.fun_def_stmt()!);
    if (ctx.global_stmt()) return this.visit(ctx.global_stmt()!);
    return "";
  }

  // --- Global Statements ---
  visitGlobal_stmt(ctx: Global_stmtContext): string {
    const parts = ctx.global_stmt_content().map((c) => this.visit(c));
    return parts.filter(Boolean).join("\n");
  }

  visitGlobal_stmt_content(ctx: Global_stmt_contentContext): string {
    const result = this.visitContent(ctx);
    return result + ";"; 
  }

  protected visitContent(ctx: Global_stmt_contentContext | Local_stmt_contentContext): string {
    if (ctx.var_def()) return this.visit(ctx.var_def()!);
    if (ctx.var_defs()) return this.visit(ctx.var_defs()!);
    if (ctx.loop_break()) return this.visit(ctx.loop_break()!);
    if (ctx.loop_continue()) return this.visit(ctx.loop_continue()!);
    
    // Check for expressions acting as statements
    if ((ctx as any).fun_call && (ctx as any).fun_call()) return this.visit((ctx as any).fun_call()!);
    if ((ctx as any).if_expr && (ctx as any).if_expr()) return this.visit((ctx as any).if_expr()!);
    if ((ctx as any).for_expr && (ctx as any).for_expr()) return this.visit((ctx as any).for_expr()!);
    if ((ctx as any).arith_expr && (ctx as any).arith_expr()) return this.visit((ctx as any).arith_expr()!);
    // Added back as requested
    if ((ctx as any).arith_exprs && (ctx as any).arith_exprs()) return this.visit((ctx as any).arith_exprs()!);
    
    return "";
  }

  // --- Functions ---
  visitFun_def_stmt(ctx: Fun_def_stmtContext): string {
    if (ctx.fun_def_singleline()) return this.visit(ctx.fun_def_singleline()!) + "\n";
    if (ctx.fun_def_multiline()) return this.visit(ctx.fun_def_multiline()!) + "\n";
    return "";
  }

  visitFun_def_singleline(ctx: Fun_def_singlelineContext): string {
    const name = this.funcName(ctx.id().getText());
    const params = this.visit(ctx.fun_head());
    this.enforceNoRecursion(ctx.id().getText(), ctx.fun_body_singleline(), ctx);

    // V2 Constraint: Check if returning a tuple [x, y]
    const content = ctx.fun_body_singleline().local_stmt_singleline().local_stmt_content(0);
    if (content?.arith_exprs()) {
        this.enforceNoTupleReturn(ctx);
    }

    const body = this.visit(ctx.fun_body_singleline());
    return `function ${name}${params} {\n  return ${body};\n}`;
  }

  visitFun_def_multiline(ctx: Fun_def_multilineContext): string {
    const name = this.funcName(ctx.id().getText());
    const params = this.visit(ctx.fun_head());
    this.enforceNoRecursion(ctx.id().getText(), ctx.fun_body_multiline(), ctx);

    // V2 Constraint: Check last statement of multiline block for tuple return
    const stmts = ctx.fun_body_multiline().local_stmts_multiline().local_stmts_list().local_stmt_multiline();
    const lastContent = stmts[stmts.length - 1]?.local_stmt_content(0);
    if (lastContent?.arith_exprs()) {
        this.enforceNoTupleReturn(ctx);
    }

    const body = this.visit(ctx.fun_body_multiline());
    return `function ${name}${params} ${body}`;
  }

  visitFun_head(ctx: Fun_headContext): string {
    if (!ctx.id()) return "()";
    const ids = ctx.id();
    const params = ids.map((id) => this.visit(id)).join(", ");
    return `(${params})`;
  }

  visitFun_body_singleline(ctx: Fun_body_singlelineContext): string {
    return this.visit(ctx.local_stmt_singleline());
  }

  visitLocal_stmt_singleline(ctx: Local_stmt_singlelineContext): string {
    const contents = ctx.local_stmt_content().map((c) => this.visit(c));
    return contents.join(", "); 
  }

  visitLocal_stmt_content(ctx: Local_stmt_contentContext): string {
    return this.visitContent(ctx);
  }

  visitLoop_break(_ctx: Loop_breakContext): string {
    return "break";
  }

  visitLoop_continue(_ctx: Loop_continueContext): string {
    return "continue";
  }

  // --- Multiline Bodies ---
  visitFun_body_multiline(ctx: Fun_body_multilineContext): string {
    return this.visit(ctx.local_stmts_multiline());
  }

  visitLocal_stmts_multiline(ctx: Local_stmts_multilineContext): string {
    return "{\n" + this.visit(ctx.local_stmts_list()) + "\n}";
  }

  /**
   * The variable a trailing BINDING statement evaluates to, or null if the
   * statement is not a binding.
   *
   * A Pine function returns the value of its last statement, whatever form that
   * statement takes. For an expression the emitted JS already IS the value; for
   * a binding (`b = x * 2`) the value is the bound variable, and the emitter has
   * to name it explicitly.
   *
   * Subclasses extend this when they add a binding form — v2 adds ':='.
   */
  protected trailingValueName(content: Local_stmt_contentContext): string | null {
    const def = content.var_def();
    return def ? this.visit(def.id()) : null;
  }

  visitLocal_stmts_list(ctx: Local_stmts_listContext): string {
    const stmts = ctx.local_stmt_multiline();

    const lines = stmts.map((stmt, index) => {
        let js = this.visit(stmt);

        // Return logic for last statement
        if (index === stmts.length - 1) {
             const content = stmt.local_stmt_content(0);
             if (content) {
                 const isExpression =
                    content.arith_expr() ||
                    content.arith_exprs() ||
                    (content as any).fun_call?.() ||
                    (content as any).if_expr?.() ||
                    (content as any).for_expr?.();

                 if (isExpression) {
                     return "return " + js;
                 }

                 // A trailing BINDING is still the function's return value.
                 //
                 // Without this the function fell off the end and returned
                 // undefined, so every caller plotted NaN. It is the reason the
                 // published v3 indicator mcginley_dynamic.pine — whose body is
                 // `md = 0.0` then `md := ...` — produced an all-NaN series.
                 const bound = this.trailingValueName(content);
                 if (bound) return `${js};\nreturn ${bound}`;
             }
        }
        return js;
    });
    return lines.join(";\n") + ";";
  }

  visitLocal_stmt_multiline(ctx: Local_stmt_multilineContext): string {
    const parts = ctx.local_stmt_content().map((c) => this.visit(c));
    return parts.join(", ");
  }

  // --- Variables (Series Architecture) ---

  // Handle: x = 1
  visitVar_def(ctx: Var_defContext): string {
    const pineName = ctx.id().getText();
    const name = this.visit(ctx.id());
    const value = this.visit(ctx.arith_expr());

    // Self-referencing declaration — `s = nz(s[1]) + close`, the canonical v1/v2
    // way to carry state across bars (spec/v2.md §4.1).
    //
    // `let s = f(s)` is a temporal-dead-zone error in JavaScript, so this must
    // be split into a declaration and an assignment. Once `s` is declared but
    // undefined, the inner `ctx.get(s, 1, "s")` falls through to the series
    // lookup by name, which is exactly the previous bar's value.
    //
    // Without the split this threw "Cannot access 's' before initialization"
    // for every caller that did not happen to rewrite `let` to `var` first.
    // Already declared by the hoisted prologue — a second `let` would be a
    // redeclaration error.
    if (this.hoisted.has(pineName)) {
      return `${name} = ctx.new_var("${name}", ${value})`;
    }

    if (this.referencesIdentifier(ctx.arith_expr(), pineName)) {
      return `let ${name};\n${name} = ctx.new_var("${name}", ${value})`;
    }

    // Use 'let' to create a new variable in the current scope (Shadowing allowed)
    return `let ${name} = ctx.new_var("${name}", ${value})`;
  }

  // Handle: [a, b] = myFunc()
  visitVar_defs(ctx: Var_defsContext): string {
    // Pine allows '_' as a repeated throwaway: `[macdLine, _, _] = macd(...)`.
    // JavaScript does not — `let [a, _, _] = ...` is
    // "SyntaxError: Identifier '_' has already been declared", which took out
    // the published strategy validation/breakout_crossover_4H_1D.pine.
    //
    // Every throwaway gets a script-unique name. The counter is per-visitor
    // rather than per-statement because that file collides ACROSS statements:
    //
    //     [currMacd, _, _] = macd(close, ...)
    //     [prevMacd, _, _] = macd(close[1], ...)
    //
    // both of which emit into the same JavaScript scope.
    //
    // The registry NAMES are disambiguated too, not just the bindings, so two
    // throwaways never share one Series slot.
    const ids = ctx.ids_array().id().map(i => {
        const name = this.visit(i);
        // Pine's throwaway convention is an identifier of underscores only.
        return /^_+$/.test(i.getText()) ? `${name}$${this.anonCounter++}` : name;
    });


    // V2 Constraint: Multi-variable assignment MUST originate from an authorized built-in tuple return
    const arith = ctx.arith_expr();
    
    // Recursive helper to find the first fun_call in an expression tree
    const findFunCall = (node: any): Fun_callContext | null => {
        if (!node) return null;
        if (isRule(node, "Fun_callContext")) return node;
        if (node.children) {
            for (const child of node.children) {
                const found = findFunCall(child);
                if (found) return found;
            }
        }
        return null;
    };

    const funCall = findFunCall(arith);
    
    if (funCall) {
        const funcName = funCall.id().getText();
        const entry = REGISTRY[funcName];

        // If it's a built-in, check the registry for tuple return
        if (entry) {
            if (entry.returns.kind !== "tuple") {
                throw this.err(ctx, `'${funcName}' does not return a tuple. Multi-variable assignment is only allowed for specific built-in functions.`);
            }
            if (entry.returns.itemTypes && entry.returns.itemTypes.length !== ids.length) {
                throw this.err(ctx, `'${funcName}' returns ${entry.returns.itemTypes.length} values, but you provided ${ids.length} variables.`);
            }
        } 
        // Not in the registry, so it is user-defined. Route through the same
        // gated guard the function-definition path uses — enforcing the rule
        // unconditionally here would let a version that lifts it accept the
        // definition and then reject the call site.
        else {
            this.enforceNoTupleReturn(
                ctx,
                ` Multi-variable assignment is only allowed for specific built-in functions.`,
            );
        }
    } else {
        throw this.err(ctx, `Multi-variable assignment must originate directly from a supported built-in function call.`);
    }

    const idsArrayJs = `[${ids.join(", ")}]`; 
    const idsStringsJs = `[${ids.map(id => `"${id}"`).join(", ")}]`;
    const value = this.visit(ctx.arith_expr());

    return `let ${idsArrayJs} = ctx.new_vars(${idsStringsJs}, ${value})`;
  }

  visitIds_array(ctx: Ids_arrayContext): string {
    const ids = ctx.id().map((i) => this.visit(i)).join(", ");
    return `[${ids}]`;
  }

  visitArith_exprs(ctx: Arith_exprsContext): string {
    const exprs = ctx.arith_expr().map((e) => this.visit(e)).join(", ");
    return `[${exprs}]`;
  }

  // --- Expressions ---
  visitArith_expr(ctx: Arith_exprContext): string {
    if (ctx.ternary_expr()) return this.visit(ctx.ternary_expr()!);
    if (ctx.if_expr()) return this.visit(ctx.if_expr()!);
    if (ctx.for_expr()) return this.visit(ctx.for_expr()!);
    return "";
  }

  visitIf_expr(ctx: If_exprContext): string {
    const cond = this.visit(ctx.ternary_expr());
    const thenBlock = this.visit(ctx.stmts_block(0));
    let result = `if (${cond}) ${thenBlock}`;
    if (ctx.IF_COND_ELSE()) {
      const elseBlock = this.visit(ctx.stmts_block(1));
      result += ` else ${elseBlock}`;
    }
    return `(() => { ${result} })()`;
  }

  visitFor_expr(ctx: For_exprContext): string {
    const varName = this.visit(ctx.var_def().id());
    const startVal = this.visit(ctx.var_def().arith_expr());
    const endVal = this.visit(ctx.ternary_expr(0));
    const rawBody = this.visit(ctx.stmts_block());

    let stepVal = "1";
    if (ctx.FOR_STMT_BY()) {
      stepVal = this.visit(ctx.ternary_expr(1));
    }

    this.anonCounter = this.anonCounter || 0;
    const id = this.anonCounter++;
    const res = `_res${id}`;

    // Forward lexical scanner to safely find the top-level 'return' statement
    let nesting = 0;
    let inString = false;
    let stringChar = '';
    const returns: { index: number, nesting: number }[] = [];

    for (let i = 0; i < rawBody.length; i++) {
        const char = rawBody[i];
        
        // Skip through strings safely
        if (inString) {
            if (char === stringChar && rawBody[i - 1] !== '\\') inString = false;
            continue;
        }
        if (char === '"' || char === "'" || char === '`') {
            inString = true;
            stringChar = char;
            continue;
        }

        // Track block nesting depths
        if (char === '{' || char === '(' || char === '[') nesting++;
        if (char === '}' || char === ')' || char === ']') nesting--;

        // Check for 'return ' keyword
        if (rawBody.substring(i, i + 7) === "return ") {
            const prev = i === 0 ? ' ' : rawBody[i - 1];
            // Must be preceded by space, newline, semicolon, or block boundary
            if (/[ \n;{}]/.test(prev)) {
                returns.push({ index: i, nesting: nesting });
            }
        }
    }

    let safeBody = rawBody;
    if (returns.length > 0) {
        // Find the absolute shallowest nesting level where a 'return' exists
        const minNesting = Math.min(...returns.map(r => r.nesting));
        const topLevelReturns = returns.filter(r => r.nesting === minNesting);
        
        // The last return at this shallowest level is the one injected by stmts_block
        const target = topLevelReturns[topLevelReturns.length - 1];
        safeBody = rawBody.substring(0, target.index) + `${res} = ` + rawBody.substring(target.index + 7);
    }

    const s = `_s${id}`, e = `_e${id}`, st = `_st${id}`, up = `_up${id}`;
    
    // Pure primitive loop execution
    const loopDef = `for (let ${s} = ${startVal}, ${e} = ${endVal}, ${st} = Math.abs(${stepVal}), ${up} = ${s} <= ${e}, ${varName} = ${s}; ${up} ? ${varName} <= ${e} : ${varName} >= ${e}; ${varName} += (${up} ? ${st} : -${st}))`;

    // Wrap it all together. Explicitly ensures `break` and `continue` work natively.
    const loop = `let ${res};\n  ${loopDef} {\n    ${safeBody}\n  }\n  return ${res};`;

    return `(() => {\n  ${loop}\n})()`;
  }

  visitStmts_block(ctx: Stmts_blockContext): string {
    return this.visit(ctx.fun_body_multiline());
  }

  // --- Math ---
// --- Math ---
  visitTernary_expr(ctx: Ternary_exprContext): string {
    const cond = this.visit(ctx.or_expr());
    
    // Check if the COND ('?') token exists
    if (ctx.COND()) {
      const trueBranch = this.visit(ctx.ternary_expr(0));
      const falseBranch = this.visit(ctx.ternary_expr(1));
      return `(${cond} ? ${trueBranch} : ${falseBranch})`;
    }
    
    return cond;
  }

  visitOr_expr(ctx: Or_exprContext): string {
    const parts = ctx.and_expr().map((e) => this.visit(e));
    return parts.join(" || ");
  }

  visitAnd_expr(ctx: And_exprContext): string {
    const parts = ctx.eq_expr().map((e) => this.visit(e));
    return parts.join(" && ");
  }

  visitEq_expr(ctx: Eq_exprContext): string {
    this.enforceNaComparison(ctx);
    const parts = ctx.cmp_expr().map((e) => this.visit(e));
    if (parts.length === 1) return parts[0];
    let out = parts[0];
    for (let i = 1; i < parts.length; i++) {
      const op = ctx.EQ(i - 1) ? "==" : "!=";
      out = `(${out} ${op} ${parts[i]})`;
    }
    return out;
  }

  visitCmp_expr(ctx: Cmp_exprContext): string {
    const parts = ctx.add_expr().map((e) => this.visit(e));
    if (parts.length === 1) return parts[0];
    let out = parts[0];
    for (let i = 1; i < parts.length; i++) {
      const op = ctx.GT(i - 1) ? ">" : ctx.GE(i - 1) ? ">=" : ctx.LT(i - 1) ? "<" : "<=";
      out = `(${out} ${op} ${parts[i]})`;
    }
    return out;
  }

  visitAdd_expr(ctx: Add_exprContext): string {
    const parts = ctx.mult_expr().map((e) => this.visit(e));
    if (parts.length === 1) return parts[0];
    
    let out = parts[0];

    // In ANTLR, children alternate: Expr(0), Op(1), Expr(2), Op(3), Expr(4)...
    // This guarantees we process operators in exact visual left-to-right order.
    for (let i = 1; i < parts.length; i++) {
      const op = ctx.getChild(i * 2 - 1).getText();
      
      if (op === "+") {
        out = `opsv2_safe_add(${out}, ${parts[i]})`;
      } else {
        out = `opsv2_safe_sub(${out}, ${parts[i]})`;
      }
    }
    
    return out;
  }

  visitMult_expr(ctx: Mult_exprContext): string {
    const parts = ctx.unary_expr().map((e) => this.visit(e));
    if (parts.length === 1) return parts[0];
    let out = parts[0];
    for (let i = 1; i < parts.length; i++) {
      const op = ctx.MUL(i - 1) ? "*" : ctx.DIV(i - 1) ? "/" : "%";
      out = `(${out} ${op} ${parts[i]})`;
    }
    return out;
  }

  visitUnary_expr(ctx: Unary_exprContext): string {
    const inner = this.visit(ctx.sqbr_expr());
    if (ctx.NOT()) return `!(${inner})`;
    if (ctx.PLUS()) return `+${inner}`;
    if (ctx.MINUS()) return `-${inner}`;
    return inner;
  }

  // --- Series Access with ID Tagging ---
  visitSqbr_expr(ctx: Sqbr_exprContext): string {
    const base = this.visit(ctx.atom());
    const idxExpr = ctx.arith_expr(0);

    if (idxExpr) {
      const index = this.visit(idxExpr);
      
      // 1. Check if the base is a simple identifier (e.g. 'close', 'myVar')
      const isSimpleId = ctx.atom().id() != null;

      if (isSimpleId) {
        // Standard variable history lookup: close[1]
        // We pass the base string as the exact key (e.g., "opsv2_close") 
        // because Context.vars registers them under this exact name.
        return `ctx.get(${base}, ${index}, "${base}")`;
      } else {
        // Complex expression history lookup: (close > open)[1] or sma(close, 14)[1]
        // We use the Inline Hook strategy to evaluate, store, and fetch in one line!
        const anonId = `"opsv2_anon_expr_${this.anonCounter++}"`;
        return `ctx.get(ctx.new_var(${anonId}, ${base}), ${index}, ${anonId})`;
      }
    }
    return base;
  }

  // --- Atoms ---
  visitAtom(ctx: AtomContext): string {
    if (ctx.fun_call()) return this.visit(ctx.fun_call()!);
    if (ctx.id()) return this.visit(ctx.id()!);
    if (ctx.literal()) return this.visit(ctx.literal()!);
    if (ctx.LPAR()) return "(" + this.visit(ctx.arith_expr(0)!) + ")";
    return "";
  }


  // --- Function Calls with ID Tagging ---
  visitFun_call(ctx: Fun_callContext): string {
    const originalName = ctx.id().getText();

    // study()/strategy() directives: record metadata instead of a normal call.
    if (originalName === "study" || originalName === "strategy") {
      return this.emitDirective(originalName, ctx);
    }

    // v2: strategy.* requires strategy() context (rejected under study()).
    if (originalName.startsWith("strategy.")) {
      this.enforceStrategyContext(originalName, ctx);
    }

    // security(): its 3rd arg is an expression evaluated in the HTF context, so it
    // must be deferred as a thunk rather than evaluated eagerly in the chart context.
    if (originalName === "security") {
      return this.emitSecurity(ctx);
    }

    // Built-in callees resolve through the registry rather than the sandbox
    // binding. Two distinct things shadow that binding, and both are real:
    //
    //   - the script itself: `sma = sma(close, 10)` is legal Pine (functions
    //     and variables are separate namespaces there, but not in JavaScript,
    //     where the emitted `let` shadows the function it is calling);
    //   - the runtime: `na` is bound to the NaN VALUE so that `x = na` works,
    //     which left `na(x)` — the most-used function in Pine — calling a
    //     number.
    //
    // A user-defined function is emitted into its own namespace (see
    // funcName()), because Pine allows a variable to share a function's name and
    // JavaScript does not. A name that is neither a built-in nor a declared
    // function keeps the plain identifier — that is a call through a parameter
    // or an outright typo, and either way the runtime should say so.
    const transpiledName = REGISTRY[originalName]
      ? `ctx.builtin(${JSON.stringify(originalName)})`
      : this.userFunctions.has(originalName)
        ? this.funcName(originalName)
        : this.visit(ctx.id());

    // 1. Just parse the arguments normally. NO manual 'ctx' injection!
    const args = ctx.fun_actual_args() ? this.visit(ctx.fun_actual_args()!) : "";
    
    // 2. Generate Deterministic ID (e.g., "sma@L4:C8")
    const callId = `"${originalName}${this.getLocId(ctx)}"`;

    // 3. Construct the ctx.call wrapper
    // We only add the comma after transpiledName if there are actually arguments to pass.
    const finalArgsPart = args ? `, ${args}` : "";

    return `ctx.call(${callId}, ${transpiledName}${finalArgsPart})`;
  }

  /**
   * Emit a security() call with its 3rd argument (the expression) deferred as a
   * thunk `() => (expr)`, so the runtime can evaluate it in the HTF sub-context.
   * Other args (symbol, resolution, gaps, lookahead) are passed eagerly.
   */
  protected emitSecurity(ctx: Fun_callContext): string {
    const callId = `"security${this.getLocId(ctx)}"`;
    const transpiledName = this.visit(ctx.id());
    const pos = ctx.fun_actual_args()?.pos_args();
    const exprs = pos ? pos.arith_expr() : [];
    const parts = exprs.map((e, i) => {
      const js = this.visit(e);
      return i === 2 ? `() => (${js})` : js; // defer the expression argument
    });
    const argsPart = parts.length ? `, ${parts.join(", ")}` : "";
    return `ctx.call(${callId}, ${transpiledName}${argsPart})`;
  }

  /** Emit a study()/strategy() directive as a metadata declaration. */
  protected emitDirective(kind: string, ctx: Fun_callContext): string {
    const aa = ctx.fun_actual_args();
    let posList = "";
    let kwObj = "{}";
    if (aa) {
      if (aa.pos_args()) posList = this.visit(aa.pos_args()!);
      if (aa.kw_args()) kwObj = this.visit(aa.kw_args()!); // "{ opsv2_key: value, ... }"
    }
    return `ctx.declareScript("${kind}", [${posList}], ${kwObj})`;
  }

  visitFun_actual_args(ctx: Fun_actual_argsContext): string {
    const hasPos = ctx.pos_args() != null;
    const hasKw = ctx.kw_args() != null;
    if (hasPos && hasKw) {
      return this.visit(ctx.pos_args()!) + ", " + this.visit(ctx.kw_args()!);
    }
    if (hasKw) return this.visit(ctx.kw_args()!);
    if (hasPos) return this.visit(ctx.pos_args()!);
    return "";
  }

  visitPos_args(ctx: Pos_argsContext): string {
    return ctx.arith_expr().map((e) => this.visit(e)).join(", ");
  }

  visitKw_args(ctx: Kw_argsContext): string {
    const args = ctx.kw_arg().map((a) => this.visit(a)).join(", ");
    return `{ ${args} }`;
  }

  visitKw_arg(ctx: Kw_argContext): string {
    const key = this.visit(ctx.id());
    // The value is either an expression or an array literal — `input(...,
    // options=["close", "high"])`. arith_expr() is null in the array case, and
    // visiting null crashes the emitter rather than producing a diagnostic.
    const value = ctx.arith_expr()
      ? this.visit(ctx.arith_expr()!)
      : this.visit(ctx.arith_exprs()!);
    return `${key}: ${value}`;
  }

  visitLiteral(ctx: LiteralContext): string {
    if (ctx.num_literal()) return this.visit(ctx.num_literal()!);
    return this.visit(ctx.other_literal()!);
  }

  visitNum_literal(ctx: Num_literalContext): string {
    const t = ctx.INT_LITERAL() ?? ctx.FLOAT_LITERAL();
    return t ? t.getText() : "";
  }

  visitOther_literal(ctx: Other_literalContext): string {
    const t = ctx.STR_LITERAL() ?? ctx.BOOL_LITERAL() ?? ctx.COLOR_LITERAL();
    if (!t) return "";
    const text = t.getText();
    if (ctx.COLOR_LITERAL()) return JSON.stringify(text);
    return text;
  }

  // A real method, NOT an arrow-function property: a property is installed on
  // the instance and cannot be reached by `super.visitId(...)`, which would make
  // it the one visit* method a subclass could not extend.
  visitId(ctx: IdContext): string {
    const text = ctx.getText();

    // strategy.* namespace (getters/constants too) requires strategy() context.
    if (text.startsWith("strategy.")) {
      this.enforceStrategyContext(text, ctx);
    }

    // 1. Handle Transpilation (Prefixing)
    let transpiledName = text;
    if (text.includes('.')) {
        transpiledName = text.split('.').map(p => `${this.PREFIX}${p}`).join('.');
    } else {
        transpiledName = `${this.PREFIX}${text}`;
    }

    // 2. THE GETTER CHECK
    // If the standard library registry marks this identifier as a getter,
    // we must transpile it into an execution call instead of a static reference!
    const entry = REGISTRY[text];
    if (entry && entry.is_getter) {
        const callId = `"${text}${this.getLocId(ctx)}"`;
        return `ctx.call(${callId}, ${transpiledName})`;
    }

    return transpiledName;
  }
}
