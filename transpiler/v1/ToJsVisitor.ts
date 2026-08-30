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
import type { PineVersion } from "../common/version";
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
import type { StdlibEntry } from "../../runtime/v1/stdlib/metadata";
import { BASE_REGISTRY, REGISTRY, UNIMPLEMENTED_BUILTINS } from "../../runtime/v1/stdlib";
import { ScopeInfo, analyseScopes } from "../common/passes/ScopeAnalysis";

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
/**
 * Names the RUNTIME binds into the sandbox directly, outside the registry.
 *
 * initializeSandbox() installs the OHLCV series and both spellings of the bar
 * counter as Series objects. They have no registry entry because they are DATA
 * rather than functions, so any check asking "does this name exist?" has to
 * know about them separately or it rejects `close`.
 *
 * `n` and `bar_index` are both here on purpose. Exactly one of them is
 * spellable at any version, and the one that is not is a poison pill installed
 * by the profile — which throws its own, better message on read. Rejecting it
 * here instead would replace "renamed in v4" with "undeclared identifier".
 */
export const RUNTIME_GLOBALS: ReadonlySet<string> = new Set([
  "open", "high", "low", "close", "volume", "n", "bar_index",
]);


export function isRule(node: unknown, ruleContextName: string): boolean {
  return (node as any)?.constructor?.name === ruleContextName;
}

/**
 * Fold a WRAPPED string literal back onto one line.
 *
 * The lexer admits a newline inside a string when the next line is indented,
 * because TradingView's line-continuation pass runs before its lexer does and
 * the wrap never reaches the token. This is the other half of that rule: the
 * manual states the resulting sequence "adds only one space to the start of the
 * wrapped lines, and it does not automatically add line terminators", so the
 * newline and the indentation together become exactly one space.
 *
 * Without this the literal would reach the emitter with a real newline in it and
 * produce JavaScript that does not parse.
 */
export function unwrapString(text: string): string {
  return text.replace(/\r?\n[ \t]*|\r[ \t]*/g, " ");
}

export class V1ToJsVisitor extends ParseTreeVisitor<string> {
  /**
   * Depth of user-function bodies currently being emitted.
   *
   * Pine scopes a function body separately from script scope, and several
   * guards need to know which they are in — a name bound only inside some
   * function says nothing about script scope. Tracked here rather than in a
   * subclass so every version shares one counter.
   */
  protected fnDepth = 0;

  /**
   * The user function whose body is being emitted, if any.
   *
   * ── The bug this exists for ─────────────────────────────────────────────────
   *
   * A local's SERIES is registered on the Context under its emitted JavaScript
   * name, and that name is `opsv2_<pine name>` wherever the local is written.
   * The JavaScript `let` is per-call and correctly scoped; the SERIES KEY was
   * global. So two functions that both use the name `result`
   *
   *     hex(int value) =>
   *         string result = ""
   *         …
   *     hexMap(array<int> numbers) =>
   *         result = map.new<int, string>()
   *         result.put(number, hex(number))
   *
   * shared ONE series. `hex()` set it to a string, `hexMap()` read a map back
   * out of it, and the script died with "'str' has no method 'put'" — a
   * diagnostic about a name the script never wrote. TradingView's own
   * `v5-language-maps-09` and `v5-language-maps-18` are both this.
   *
   * The same collision applies between a function local and a script-scope
   * variable of the same name, which is ordinary shadowing and must not alias.
   *
   * ── The other half ──────────────────────────────────────────────────────────
   *
   * Pine also gives every CALL SITE its own instance of a function's locals.
   * That is a run-time question — the same declaration is one variable per
   * frame — so it is answered by `Context.call`, which opens a series namespace
   * per user-function frame. This half is the compile-time one: two DIFFERENT
   * functions that happen to use the same word are two variables, whether or
   * not either is ever called twice.
   */
  protected fnScope: string[] = [];

  /**
   * The key a variable's Series is registered under.
   *
   * The emitted JavaScript identifier at script scope, and that identifier
   * qualified by the enclosing function's emitted name inside a function body.
   * Every site that writes a series key goes through here so that a declaration,
   * a `:=`, and a history read can never disagree about which series they mean.
   */
  protected seriesKey(jsName: string): string {
    const fn = this.fnScope[this.fnScope.length - 1];
    return fn ? `${fn}$${jsName}` : jsName;
  }

  /** Depth of for-loop bodies currently being emitted. */
  protected loopDepth = 0;

  /**
   * While positive, a block does NOT turn its last statement into a `return`.
   * Set only for a statement-position `if` inside a loop — see visitIf_expr.
   */
  protected suppressBlockReturn = 0;

  /**
   * The version this emitter implements. Subclasses override it, and every
   * diagnostic is stamped with it, so an inherited guard reports the version
   * that actually rejected the code rather than the one that wrote the check.
   */
  protected readonly version: PineVersion = 1;

  /**
   * The names this VERSION may spell, and what each one means.
   *
   * An extension point, not a constant, because the stdlib is not the same set
   * at every version: v4 renamed a pile of globals into namespaces, so `red`
   * and `color.red` are each valid at exactly one version and invalid at the
   * other. A single shared table cannot say that — it would accept both
   * dialects everywhere and quietly compile scripts TradingView rejects.
   *
   * v1–v3 get the generated registry unchanged. v4 overrides this with its own
   * view. Nothing about v4 appears in this file, which is the point: adding a
   * version must never mean editing an earlier one
   * (dev-docs/00-architecture-assessment.md §5).
   */
  protected get registry(): Record<string, StdlibEntry> {
    return BASE_REGISTRY;
  }

  // Prefix for all emitted identifiers to avoid sandbox name clashes
  protected readonly PREFIX = common.PREFIX;
  protected anonCounter = 0;
  // Script kind from the study()/strategy() directive; drives strategy.*
  // enforcement. 'indicator' and 'library' are v5 directives, admitted here
  // only so the TYPE is total — v1 has neither, and detectDirective below never
  // returns either. See transpiler/v5/ToJsVisitor.ts.
  protected scriptKind: 'study' | 'indicator' | 'strategy' | 'library' | undefined = undefined;
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

  /**
   * Whole-script scope facts, filled by visitPine_script.
   *
   * Lives at v1 rather than v2 because `Undeclared identifier` must behave the
   * same at both — see conformance/v1_equals_v2.test.ts. v2 additionally uses
   * it for ':=' , which is why the analysis pass was originally introduced
   * there.
   */
  protected scopes: ScopeInfo = {
    declared: new Map(), mutated: new Set(), booleans: new Set(),
    functions: new Set(), bound: new Set(), functionScoped: new Set(),
  };

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

  /**
   * The arity of the tuple this call returns BECAUSE ITS ARGUMENT IS ONE, or
   * null when nothing about the call says it returns a tuple.
   *
   * Always null here: tuple expressions are a v4 addition ("the `expression`
   * parameter can be series or tuple", v4 release notes, May 2020), and before
   * that a bracketed list is not admitted as an argument at all.
   */
  protected tupleArityFromArgument(_call: Fun_callContext): number | null {
    return null;
  }

  /**
   * Whose return type a `[a, b] = <call>` is asking about.
   *
   * The call itself here, because before v5 a call is the whole expression.
   * v5 overrides it: in `arr.maintainQueue(x).calcBB(y)` the value being
   * unpacked is `calcBB`'s, not `maintainQueue`'s, and reading the base call
   * asked the wrong function whether it returns a tuple.
   */
  protected destructuringCallee(call: Fun_callContext): string {
    return call.id().getText();
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
    // Whole-script scope facts. v1 has no ':=' to check, but it does need to
    // know what the script binds before rejecting a read of something it does
    // not — and `Undeclared identifier` has to fire identically at v1 and v2,
    // which TradingView states are the same language.
    this.scopes = analyseScopes(ctx as any);

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

  /**
   * Find the first study()/strategy() directive call in the script, if any.
   *
   * The return type admits 'indicator' so a later version can override this
   * without widening it; v1 knows only the two spellings it tests for.
   */
  protected detectDirective(
    node: ParseTree,
  ): 'study' | 'indicator' | 'strategy' | 'library' | undefined {
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

  /**
   * The JavaScript name a function DEFINITION is emitted under.
   *
   * The same as `funcName` here, and a seam because v5's method overloads are
   * not: a name declared for several receiver types needs one JavaScript
   * function per type, and definition and call site must agree on how that name
   * is spelled.
   */
  protected definitionFunctionName(pineName: string): string {
    return this.funcName(pineName);
  }

  /**
   * The emitted name a CALL to a user function targets.
   *
   * The mirror of `definitionFunctionName`, and a seam for the same reason: v5
   * lets one name carry several definitions, so the call site has to be able to
   * choose between them. Identical here, where a name has exactly one body.
   */
  protected callFunctionName(pineName: string, _ctx: Fun_callContext): string {
    return this.funcName(pineName);
  }

  visitFun_def_singleline(ctx: Fun_def_singlelineContext): string {
    const name = this.definitionFunctionName(ctx.id().getText());
    const params = this.visit(ctx.fun_head());
    this.enforceNoRecursion(ctx.id().getText(), ctx.fun_body_singleline(), ctx);

    // V2 Constraint: Check if returning a tuple [x, y]
    const content = ctx.fun_body_singleline().local_stmt_singleline().local_stmt_content(0);
    if (content?.arith_exprs()) {
        this.enforceNoTupleReturn(ctx);
    }

    this.fnDepth++;
    this.fnScope.push(name);
    let body: string;
    try { body = this.singleLineBody(ctx.fun_body_singleline().local_stmt_singleline()); }
    finally { this.fnDepth--; this.fnScope.pop(); }   // a guard deeper in the body throws
    return `function ${name}${params} {\n  ${body};\n}`;
  }

  visitFun_def_multiline(ctx: Fun_def_multilineContext): string {
    const name = this.definitionFunctionName(ctx.id().getText());
    const params = this.visit(ctx.fun_head());
    this.enforceNoRecursion(ctx.id().getText(), ctx.fun_body_multiline(), ctx);

    // V2 Constraint: Check last statement of multiline block for tuple return
    const stmts = ctx.fun_body_multiline().local_stmts_multiline().local_stmts_list().local_stmt_multiline();
    const lastContent = stmts[stmts.length - 1]?.local_stmt_content(0);
    if (lastContent?.arith_exprs()) {
        this.enforceNoTupleReturn(ctx);
    }

    this.fnDepth++;
    this.fnScope.push(name);
    let body: string;
    try { body = this.visit(ctx.fun_body_multiline()); }
    finally { this.fnDepth--; this.fnScope.pop(); }   // a guard deeper in the body throws
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

  /**
   * A single-line body — `f(x) => a = 1, b = 2, a + b` — as the INSIDE of a
   * JavaScript block that hands back the body's value.
   *
   * SOURCING. From the manual's user-defined functions page: "The body of the
   * function must separate all individual statements in its body with commas",
   * and what a call returns is "the final expression, variable, or tuple in the
   * function's body".
   *
   * So a comma list is a list of STATEMENTS. Joining it with `,` into a
   * JavaScript comma expression works only while every one of them happens to
   * BE an expression, and Pine's do not have to be. TradingView's own
   *
   *     printTable(txt) => var table t = table.new(...), table.cell(t, 0, 0, txt)
   *
   * emitted `return let opsv2_t = ...`, which is not JavaScript — so the script
   * passed compilation and then threw a SyntaxError the moment it was run.
   */
  protected singleLineBody(ctx: Local_stmt_singlelineContext): string {
    const contents = ctx.local_stmt_content();
    return contents
      .map((content, i) => {
        const js = this.visit(content);
        return i === contents.length - 1 ? this.returnLastStatement(content, js) : js;
      })
      .join(";\n");
  }

  /**
   * Retained for generic visits only — `singleLineBody` is what the two call
   * sites for this rule (a single-line function body, and a v5 switch arm) use,
   * because they need the trailing statement's VALUE and this does not produce
   * it.
   */
  visitLocal_stmt_singleline(ctx: Local_stmt_singlelineContext): string {
    return ctx.local_stmt_content().map((c) => this.visit(c)).join(";\n");
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

  /**
   * `js`, the emitted form of a block's LAST statement, turned into whatever
   * hands that statement's value back to the caller.
   *
   * Shared with `singleLineBody`, because the rule is the same one either way:
   * a body evaluates to its final statement.
   */
  protected returnLastStatement(content: Local_stmt_contentContext, js: string): string {
    // A statement-position `if` inside a loop is emitted as a plain `if` block,
    // not an IIFE, so that break/continue are legal. It is a STATEMENT —
    // `return <that>` (or the `_res = <that>` that visitFor_expr rewrites it
    // into) is a syntax error.
    if (this.loopDepth > 0 && this.statementIf(content)) return js;

    const isExpression =
      content.arith_expr() ||
      content.arith_exprs() ||
      (content as any).fun_call?.() ||
      (content as any).if_expr?.() ||
      (content as any).for_expr?.();

    if (isExpression) return "return " + js;

    // A trailing BINDING is still the function's return value.
    //
    // Without this the function fell off the end and returned undefined, so
    // every caller plotted NaN. It is the reason the published v3 indicator
    // mcginley_dynamic.pine — whose body is `md = 0.0` then `md := ...` —
    // produced an all-NaN series.
    const bound = this.trailingValueName(content);
    if (bound) return `${js};\nreturn ${bound}`;

    // `break` / `continue`, which have no value and must not be returned.
    return js;
  }

  visitLocal_stmts_list(ctx: Local_stmts_listContext): string {
    // FLATTENED, because a comma-separated line is several statements and not
    // one — the same rule `singleLineBody` quotes. The block's value is its
    // last CONTENT, which is not the same node as its last LINE:
    //
    //     float q1 = ta.percentile(...), map.put(debugData, "q1", q1)
    //
    // is two statements, and reading only the first of them emitted
    // `let opsv2_q1 = ..., ctx.call(...)` — a `let` list whose second binding
    // is a call, so the SyntaxError landed on the `.` of `ctx.call`.
    const contents = ctx.local_stmt_multiline().flatMap(stmt => stmt.local_stmt_content());

    const lines = contents.map((content, index) => {
      const js = this.visit(content);
      if (index === contents.length - 1 && this.suppressBlockReturn === 0) {
        return this.returnLastStatement(content, js);
      }
      return js;
    });
    return lines.join(";\n") + ";";
  }

  /** @see visitLocal_stmts_list — the flattening there is what this rule needs. */
  visitLocal_stmt_multiline(ctx: Local_stmt_multilineContext): string {
    return ctx.local_stmt_content().map((c) => this.visit(c)).join(";\n");
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
    const key = this.seriesKey(name);

    if (this.hoisted.has(pineName)) {
      return `${name} = ctx.new_var("${key}", ${value})`;
    }

    if (this.referencesIdentifier(ctx.arith_expr(), pineName)) {
      return `let ${name};\n${name} = ctx.new_var("${key}", ${value})`;
    }

    // Use 'let' to create a new variable in the current scope (Shadowing allowed)
    return `let ${name} = ctx.new_var("${key}", ${value})`;
  }

  // Handle: [a, b] = myFunc()
  visitVar_defs(ctx: Var_defsContext): string {
    // Pine allows '_' as a repeated throwaway: `[macdLine, _, _] = macd(...)`.
    // JavaScript does not — `let [a, _, _] = ...` is
    // "SyntaxError: Identifier '_' has already been declared", which took out
    // the published strategy validation/v2/breakout_crossover_4H_1D.pine.
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
        const funcName = this.destructuringCallee(funCall);
        const entry = this.registry[funcName];

        // A call can return a tuple because its ARGUMENT is one:
        //
        //     [o, h, l, c] = security(sym, "D", [open, high, low, close])
        //
        // The arity is the literal's, not the function's, so no registry entry
        // could state it — `security` returns one value or four depending on
        // what it was handed. Null before v4, which has no tuple expressions.
        const argumentArity = this.tupleArityFromArgument(funCall);
        if (argumentArity !== null) {
            if (argumentArity !== ids.length) {
                throw this.err(
                    ctx,
                    `'${funcName}' was given a ${argumentArity}-element tuple, but you ` +
                    `provided ${ids.length} variables.`,
                );
            }
        }
        // If it's a built-in, check the registry for tuple return
        else if (entry) {
            if (entry.returns.kind !== "tuple") {
                throw this.err(ctx, `'${funcName}' does not return a tuple. Multi-variable assignment is only allowed for specific built-in functions.`);
            }
            if (entry.returns.itemTypes && entry.returns.itemTypes.length !== ids.length) {
                throw this.err(ctx, `'${funcName}' returns ${entry.returns.itemTypes.length} values, but you provided ${ids.length} variables.`);
            }
        } 
        // Absent from THIS version's registry but present in a later one —
        // report the version, not a generic tuple complaint.
        //
        // `[a, b, c] = bb(close, 5, 2)` at v3 said "User-defined functions
        // cannot return tuples", which sends the reader looking for a function
        // they never wrote. TradingView says "Could not find function or
        // function reference 'bb'", and the real answer is that `bb` arrived in
        // v4.
        else if (!this.userFunctions.has(funcName) && funcName in REGISTRY) {
            throw this.err(
                ctx,
                `'${funcName}' is not available in Pine Script v${this.version}. ` +
                `It was added in a later version.`,
            );
        }
        // Not in any registry, so it is user-defined. Route through the same
        // gated guard the function-definition path uses — enforcing the rule
        // unconditionally here would let a version that lifts it accept the
        // definition and then reject the call site.
        else {
            this.enforceNoTupleReturn(
                ctx,
                ` Multi-variable assignment is only allowed for specific built-in functions.`,
            );

            // Past the guard, so this version DOES admit a tuple-returning
            // user function. The arity is the definition's; see `tupleArity`.
            const arity = this.scopes.tupleArity?.get(funcName);
            if (arity === undefined) {
                throw this.err(
                    ctx,
                    `'${funcName}' does not return a tuple — its last statement is not a ` +
                    `'[ ... ]' list, so there is nothing to unpack into ${ids.length} variables.`,
                );
            }
            if (arity !== ids.length) {
                throw this.err(
                    ctx,
                    `'${funcName}' returns ${arity} values, but you provided ${ids.length} variables.`,
                );
            }
        }
    } else {
        throw this.err(ctx, `Multi-variable assignment must originate directly from a supported built-in function call.`);
    }

    const idsArrayJs = `[${ids.join(", ")}]`; 
    const idsStringsJs = `[${ids.map(id => `"${this.seriesKey(id)}"`).join(", ")}]`;
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

  /**
   * Is this `if` a STATEMENT, whose value is discarded, rather than an
   * expression being bound to something?
   *
   * The grammar admits `if_expr` in exactly two places — `*_stmt_content` and
   * `arith_expr` — so the parent rule answers it.
   */
  /**
   * The `if` this statement IS, or null if the statement is something else.
   *
   * `global_stmt_content` names if_expr directly; `local_stmt_content` reaches
   * it through the transparent `arith_expr` wrapper.
   */
  protected statementIf(content: any): any | null {
    return content?.if_expr?.() ?? content?.arith_expr?.()?.if_expr?.() ?? null;
  }

  private isStatementPosition(ctx: If_exprContext): boolean {
    // `arith_expr : ternary_expr | if_expr | for_expr` is a transparent wrapper,
    // and `local_stmt_content` reaches if_expr THROUGH it, so the immediate
    // parent is Arith_exprContext in both statement and expression position.
    // Walk past those wrappers; what is underneath tells the two apart —
    // Local_stmt_contentContext is a statement, Var_defContext is a binding.
    let node = (ctx as any).parent;
    while (isRule(node, "Arith_exprContext")) node = node.parent;
    return isRule(node, "Global_stmt_contentContext")
        || isRule(node, "Local_stmt_contentContext");
  }

  visitIf_expr(ctx: If_exprContext): string {
    const cond = this.visit(ctx.ternary_expr());

    // An `if` normally becomes an IIFE, because a block's last statement is
    // emitted as `return <value>` — Pine blocks evaluate to something, and the
    // function boundary is what contains that return.
    //
    // Inside a LOOP that boundary is fatal: `break` and `continue` cannot cross
    // a function, so
    //
    //     for i = 0 to 49
    //         if close[i] < open[i]
    //             firstDown := i
    //             break
    //
    // failed to compile with "Illegal break statement". In statement position
    // the block's value is discarded anyway, so the IIFE buys nothing there —
    // emit a plain `if` and suppress the trailing return that made it necessary.
    const plain = this.loopDepth > 0 && this.isStatementPosition(ctx);

    // Suppression stops at the IIFE boundary — it is SET, not incremented.
    //
    // A plain `if` suppresses the trailing return in its own blocks. An IIFE
    // `if` is an EXPRESSION whose blocks must return, so any suppression from
    // an enclosing plain `if` must not reach inside it.
    //
    // Incrementing unconditionally leaked it down the whole subtree, and an
    // if-EXPRESSION nested in a statement-`if` inside a loop lost its value:
    //
    //     for i = 0 to 2
    //         if close > open
    //             v = if high > low
    //                 1
    //             else
    //                 2
    //
    // emitted `(() => { if (...) { 1; } else { 2; } })()`, so `v` was
    // `undefined` on every bar — no error, just a silently empty variable.
    const saved = this.suppressBlockReturn;
    this.suppressBlockReturn = plain ? saved + 1 : 0;
    try {
      const thenBlock = this.visit(ctx.stmts_block(0));
      let result = `if (ctx.truthy(${cond})) ${thenBlock}`;
      const alternative = this.emitElseBranch(ctx);
      if (alternative !== null) result += ` else ${alternative}`;

      // "The value assigned to the variable is the return value of the
      // <local_block>, or `na` if no local block is executed."
      //   — Conditional structures, the Pine Script manual
      //
      // Without the trailing return, an `if` whose condition is false and which
      // has no `else` evaluated to JavaScript `undefined`. That reads as NaN in
      // arithmetic, so it looked right on a chart — but `na(x)` was false for
      // it, and it is not what the language says the value is.
      //
      // Unreachable whenever the chain ends in an `else`, which is most of them.
      //
      // KNOWN GAP: the manual carves out one exception — "if the structure
      // returns 'bool' values ... `false` is returned instead". Honouring it
      // needs the branch TYPE, which this emitter does not infer, so a
      // bool-valued `if` with no `else` yields `na` here and `false` on
      // TradingView.
      return plain ? result : `(() => { ${result} return NaN; })()`;
    } finally {
      this.suppressBlockReturn = saved;
    }
  }

  /**
   * The `else` branch, already emitted, or null when the `if` has none.
   *
   * A seam, not a behaviour: v1 has exactly one shape of else — a block — and
   * this returns it. v4 adds `else if`, and overrides here rather than
   * re-implementing `visitIf_expr`, because everything the chain needs is
   * decided by the code ABOVE this call:
   *
   *   - the IIFE wrapper. One `if/else if/else` is ONE expression, so it gets
   *     one wrapper. A nested `if` visited normally would build its own, and in
   *     expression position its value would be computed and then dropped.
   *   - `suppressBlockReturn`. Every block in the chain is at the same depth
   *     and must make the same return-or-not decision.
   *
   * Both are already set when this runs, so an override inherits them for free.
   */
  protected emitElseBranch(ctx: If_exprContext): string | null {
    return ctx.IF_COND_ELSE() ? this.visit(ctx.stmts_block(1)) : null;
  }

  visitFor_expr(ctx: For_exprContext): string {
    const varName = this.visit(ctx.var_def().id());
    const startVal = this.visit(ctx.var_def().arith_expr());
    const endVal = this.visit(ctx.ternary_expr(0));
    this.loopDepth++;
    let rawBody: string;
    try { rawBody = this.visit(ctx.stmts_block()); }
    finally { this.loopDepth--; }

    let stepVal = "1";
    if (ctx.FOR_STMT_BY()) {
      stepVal = this.visit(ctx.ternary_expr(1));
    }

    this.anonCounter = this.anonCounter || 0;
    const id = this.anonCounter++;
    const res = `_res${id}`;

    const safeBody = this.captureLoopResult(rawBody, res);

    const s = `_s${id}`, e = `_e${id}`, st = `_st${id}`, up = `_up${id}`;
    
    // Pure primitive loop execution
    const loopDef = `for (let ${s} = ${startVal}, ${e} = ${endVal}, ${st} = Math.abs(${stepVal}), ${up} = ${s} <= ${e}, ${varName} = ${s}; ${up} ? ${varName} <= ${e} : ${varName} >= ${e}; ${varName} += (${up} ? ${st} : -${st}))`;

    // Wrap it all together. Explicitly ensures `break` and `continue` work natively.
    //
    // `= NaN`, not bare: a loop that never runs its body has no
    // `return_expression` to evaluate, and Pine's answer for a value that was
    // never produced is `na`. Left uninitialised this returned JavaScript
    // `undefined`, which reads as NaN in arithmetic but is not `na` to `na(x)`.
    const loop = `let ${res} = NaN;\n  ${loopDef} {\n    ${safeBody}\n  }\n  return ${res};`;

    return `(() => {\n  ${loop}\n})()`;
  }

  /**
   * Rewrites a loop body's OWN trailing `return X` into `<res> = X`.
   *
   * Extracted from `visitFor_expr` so `for … in` (v5) can reuse it verbatim.
   * Every loop in the language is an EXPRESSION whose value is the last
   * `return_expression` its body evaluated, and a block emits that value as a
   * `return` — which inside a real JavaScript `for` would leave the enclosing
   * function instead.
   *
   * ── Why nesting alone is not enough ─────────────────────────────────────
   *
   * The body can contain whole FUNCTIONS — an if-expression emits
   * `(() => { … })()`, and its returns belong to that function, not to the
   * loop. Ranking by brace depth and taking the shallowest picked one of them
   * whenever the loop had no trailing return of its own, which is exactly the
   * case for a statement-`if` body:
   *
   *     v = if high > low
   *             1
   *         else
   *             2
   *
   * came out as `if (…) { return 1; } else { _res0 = 2; }`, so the else branch
   * assigned the LOOP's result variable and the expression evaluated to
   * undefined. Silent: no error, just an `na` on every bar that took the else.
   *
   * So function bodies are tracked separately from plain blocks, and only a
   * return at function depth 0 can be the loop's.
   */
  protected captureLoopResult(rawBody: string, res: string): string {
    let inString = false;
    let stringChar = '';
    /** One entry per open '{'; true when it opens a FUNCTION body. */
    const braces: boolean[] = [];
    let funcDepth = 0;
    let depth = 0;
    const returns: { index: number, depth: number }[] = [];

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

        if (char === '{') {
            // A '{' preceded by '=>' opens a function body. The emitter only
            // ever produces arrow functions, so this is the whole rule.
            const isFunctionBody = /=>\s*$/.test(rawBody.substring(0, i));
            braces.push(isFunctionBody);
            if (isFunctionBody) funcDepth++;
            depth++;
            continue;
        }
        if (char === '}') {
            if (braces.pop()) funcDepth--;
            depth--;
            continue;
        }
        if (char === '(' || char === '[') depth++;
        if (char === ')' || char === ']') depth--;

        // Check for 'return ' keyword
        if (rawBody.substring(i, i + 7) === "return ") {
            const prev = i === 0 ? ' ' : rawBody[i - 1];
            // Must be preceded by space, newline, semicolon, or block boundary
            if (/[ \n;{}]/.test(prev) && funcDepth === 0) {
                returns.push({ index: i, depth });
            }
        }
    }

    let safeBody = rawBody;
    if (returns.length > 0) {
        // Find the absolute shallowest depth where one of OUR returns exists
        const minDepth = Math.min(...returns.map(r => r.depth));
        const topLevelReturns = returns.filter(r => r.depth === minDepth);

        // The last return at this shallowest level is the one injected by stmts_block
        const target = topLevelReturns[topLevelReturns.length - 1];
        safeBody = rawBody.substring(0, target.index) + `${res} = ` + rawBody.substring(target.index + 7);
    }
    return safeBody;
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
      // ctx.truthy, not the raw value: a condition held in a variable is a
      // Series object, and every object is truthy in JS. See Context.truthy.
      return `(ctx.truthy(${cond}) ? ${trueBranch} : ${falseBranch})`;
    }
    
    return cond;
  }

  // `and` / `or` take BOOLEANS, so each operand goes through ctx.truthy for the
  // same reason the ternary condition does. A single operand is passed straight
  // through: it may be a number being used as a value, not a condition.
  visitOr_expr(ctx: Or_exprContext): string {
    const parts = ctx.and_expr().map((e) => this.visit(e));
    if (parts.length === 1) return parts[0];
    return parts.map(p => `ctx.truthy(${p})`).join(" || ");
  }

  visitAnd_expr(ctx: And_exprContext): string {
    const parts = ctx.eq_expr().map((e) => this.visit(e));
    if (parts.length === 1) return parts[0];
    return parts.map(p => `ctx.truthy(${p})`).join(" && ");
  }

  /**
   * The operator BETWEEN operand `i - 1` and operand `i`, in a flat chain.
   *
   * ── Why not ctx.MUL(i - 1) ────────────────────────────────────────────────
   *
   * Because that indexes the list of MUL tokens, not the position in the
   * expression. In `a * b / c` there is one DIV and it is `DIV(0)`, so asking
   * `MUL(1) ? "*" : DIV(1) ? "/" : "%"` for the second operator finds neither
   * and falls through to MODULO:
   *
   *     a * b / c    →    (a * b) % c
   *
   * Silent, and wrong for every mixed `*`/`/` chain — which is most of them.
   * `a > b < c` and `a != b == c` had the same defect for the same reason.
   *
   * ANTLR alternates children operand, operator, operand, so operand `i` is
   * preceded by the operator at `i * 2 - 1`. `visitAdd_expr` below already read
   * it that way; these did not.
   */
  protected operatorBefore(ctx: ParserRuleContext, index: number): string {
    return (ctx.getChild(index * 2 - 1) as any)?.getText() ?? "";
  }

  /**
   * `a == b` / `a != b`.
   *
   * Routed through a helper rather than emitted as a bare operator, because
   * every variable is a Series OBJECT and JavaScript compares two objects by
   * REFERENCE:
   *
   *     x = 1.0
   *     y = 1.0
   *     equal = x == y      // false, at every version
   *
   * `<`, `>`, `<=` and `>=` coerce through `valueOf` unconditionally, and a
   * comparison against a literal has only one object in it, so this was the one
   * shape that reached the reference test — and it was silently, permanently
   * false. See `safe_eq` for why the helper compares loosely after unwrapping
   * rather than strictly.
   */
  visitEq_expr(ctx: Eq_exprContext): string {
    this.enforceNaComparison(ctx);
    const parts = ctx.cmp_expr().map((e) => this.visit(e));
    if (parts.length === 1) return parts[0];
    let out = parts[0];
    for (let i = 1; i < parts.length; i++) {
      const helper = this.operatorBefore(ctx as any, i) === "==" ? "safe_eq" : "safe_ne";
      out = `opsv2_${helper}(${out}, ${parts[i]})`;
    }
    return out;
  }

  visitCmp_expr(ctx: Cmp_exprContext): string {
    const parts = ctx.add_expr().map((e) => this.visit(e));
    if (parts.length === 1) return parts[0];
    let out = parts[0];
    for (let i = 1; i < parts.length; i++) {
      out = `(${out} ${this.operatorBefore(ctx as any, i)} ${parts[i]})`;
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
      out = `(${out} ${this.operatorBefore(ctx as any, i)} ${parts[i]})`;
    }
    return out;
  }

  visitUnary_expr(ctx: Unary_exprContext): string {
    const inner = this.visit(ctx.sqbr_expr());
    if (ctx.NOT()) return `!ctx.truthy(${inner})`;   // see Context.truthy
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
      
      // 1. Is the EMITTED base a bare JavaScript identifier?
      //
      // The parse tree is not enough to answer this. `hl2` is an `id` atom, but
      // it is a registry getter, so it emits `ctx.call("hl2@L5:C3", opsv2_hl2)`
      // — a call, not a name. Deciding on `ctx.atom().id() != null` sent those
      // down the by-name branch, which interpolated the call into a string
      // literal WITHOUT escaping it:
      //
      //   ctx.get(ctx.call("hl2@L5:C3", opsv2_hl2), 1, "ctx.call("hl2@L5:C3", …)")
      //                                                             ^ closes early
      //
      // — syntactically invalid JavaScript, and the wrong key even if escaped,
      // since no series is registered under that name. `hl2[1]`, `hlc3[1]` and
      // `barstate.islast[1]` are ordinary Pine, so this reached real scripts.
      const isSimpleId = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(base);

      if (isSimpleId) {
        // Standard variable history lookup: close[1]
        // We pass the base string as the exact key (e.g., "opsv2_close") 
        // because Context.vars registers them under this exact name.
        return `ctx.get(${base}, ${index}, "${this.seriesKey(base)}")`;
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
    // A built-in this version does not have, but a later one does, is reported
    // as a VERSION problem. Otherwise it falls through to the plain-identifier
    // branch and fails at run time as "opsv2_bb is not a function", which reads
    // like an engine bug rather than the migration error it is. TradingView
    // says "Could not find function or function reference 'bb'".
    if (!this.registry[originalName]
        && !this.userFunctions.has(originalName)
        && originalName in REGISTRY) {
      throw this.err(
        ctx,
        `'${originalName}' is not available in Pine Script v${this.version}. ` +
        `It was added in a later version.`,
      );
    }

    // A SCRIPT-DEFINED function wins over a registry entry of the same name.
    //
    // Pine keeps functions and variables in separate namespaces, so a script
    // may define `area(x) =>` even though `area` is a built-in plot-style
    // CONSTANT. Checking the registry first resolved that call to
    // `ctx.builtin("area")` — the string "area" — and the runtime reported
    // "The provided reference is not a function", which reads as an engine bug
    // rather than as the name collision it is.
    //
    // Where the registry entry is a FUNCTION rather than a value, TradingView
    // rejects the definition outright ("cannot use a built-in name"), so no
    // valid script can reach this ordering and disagree with it.
    const isUserDefined = this.userFunctions.has(originalName);

    const transpiledName = isUserDefined
      ? this.callFunctionName(originalName, ctx)
      : this.registry[originalName]
        ? `ctx.builtin(${JSON.stringify(originalName)})`
        : this.visit(ctx.id());

    // 1. Just parse the arguments normally. NO manual 'ctx' injection!
    const args = ctx.fun_actual_args() ? this.visit(ctx.fun_actual_args()!) : "";

    // 2. Generate Deterministic ID (e.g., "sma@L4:C8").
    //
    // A user function's id carries the `$fn_` marker, because `Context.call`
    // reads the leading name out of this id to find the call's registry
    // metadata — and a user function called `area` would otherwise be handed
    // the built-in constant's entry and rejected as "a value, not a function".
    // `$` cannot occur in a Pine name, so the marked form matches nothing.
    const idName = isUserDefined ? this.callFunctionName(originalName, ctx) : originalName;
    const callId = `"${idName}${this.getLocId(ctx)}"`;

    // 3. Construct the ctx.call wrapper
    // We only add the comma after transpiledName if there are actually arguments to pass.
    const finalArgsPart = args ? `, ${args}` : "";

    return `ctx.call(${callId}, ${transpiledName}${finalArgsPart})`;
  }

  /**
   * Emit a security() call with the `expression` argument deferred as a thunk
   * `() => (expr)`, so the runtime can evaluate it in the HTF sub-context.
   * Every other argument (symbol, resolution, gaps, lookahead) is eager.
   *
   * KEYWORD ARGUMENTS ARE INCLUDED. This method used to read `pos_args()` only,
   * which silently discarded them:
   *
   *     security(tickerid, "D", close, lookahead=barmerge.lookahead_off)
   *
   * emitted no `lookahead` at all, so `resolveLookahead` in
   * runtime/v1/stdlib/mtf.ts never saw an explicit value and always applied the
   * version default. That made the documented per-call escape hatch unreachable,
   * and a v2 script asking for `lookahead_off` silently got `on` — the exact
   * behaviour the v2→v3 default flip exists to distinguish.
   *
   * `ctx.call` maps the keyword object onto positional slots by name, so the
   * object is appended unchanged and `expression=` is deferred wherever it lands.
   */
  protected emitSecurity(ctx: Fun_callContext): string {
    // The callee's OWN name, so a diagnostic points at the function the script
    // wrote. v5 routes `request.security_lower_tf` through here as well, and
    // labelling both "security" made a runtime error name the wrong one.
    const callId = `"${ctx.id().getText()}${this.getLocId(ctx)}"`;
    const transpiledName = this.visit(ctx.id());
    const aa = ctx.fun_actual_args();

    const pos = aa?.pos_args();
    const exprs = pos ? this.positionalArgs(pos) : [];
    const parts = exprs.map((e, i) => {
      const js = this.visit(e);
      return i === 2 ? `() => (${js})` : js; // positional `expression`
    });

    const kwArgs = aa?.kw_args();
    if (kwArgs) {
      const entries = kwArgs.kw_arg().map(a => {
        const key = this.visit(a.id());
        const valueCtx = a.arith_expr() ?? a.arith_exprs()!;
        const js = this.visit(valueCtx);
        // The same deferral rule, applied to the keyword spelling.
        const deferred = a.id().getText() === "expression" ? `() => (${js})` : js;
        return `${key}: ${deferred}`;
      });
      parts.push(`{ ${entries.join(", ")} }`);
    }

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

  /**
   * The positional arguments of a call, in order.
   *
   * A seam, not a behaviour. v1's `pos_args` is a list of `arith_expr`, and v4
   * widens it so a BRACKETED LIST can be one — `security(sym, tf,
   * [close, open])` and `input.string("FQ", "Period", ["FQ", "FH"])`. The
   * generated context therefore exposes `pos_arg()` at v4 and `arith_expr()`
   * before it, and every place that walks the argument list has to ask the
   * same question.
   */
  protected positionalArgs(ctx: Pos_argsContext): any[] {
    return ctx.arith_expr();
  }

  visitPos_args(ctx: Pos_argsContext): string {
    return this.positionalArgs(ctx).map((e) => this.visit(e)).join(", ");
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
    if (ctx.STR_LITERAL()) return unwrapString(text);
    return text;
  }

  // A real method, NOT an arrow-function property: a property is installed on
  // the instance and cannot be reached by `super.visitId(...)`, which would make
  // it the one visit* method a subclass could not extend.
  /**
   * The namespace roots this version knows — `strategy`, `barstate`, `color`, …
   * Derived from the version's own registry, so v4's extra roots appear only
   * there. Cached: it is a scan of ~250 keys and `visitId` runs constantly.
   */
  private namespaceRootCache: ReadonlySet<string> | null = null;
  protected get namespaceRoots(): ReadonlySet<string> {
    if (!this.namespaceRootCache) {
      this.namespaceRootCache = new Set(
        Object.keys(this.registry).filter(k => k.includes(".")).map(k => k.split(".")[0]),
      );
    }
    return this.namespaceRootCache;
  }

  /**
   * Is this identifier the NAME of a keyword argument rather than a read?
   *
   * `plot(close, title = "x")` reaches visitId twice: once for `close`, which
   * is a variable read, and once for `title`, which is the callee's parameter
   * name. Any check hooked on visitId sees both and must not treat the second
   * as a variable — no script declares `title`.
   */
  protected isKeywordArgumentName(ctx: IdContext): boolean {
    const parent = (ctx as any).parent;
    return isRule(parent, "Kw_argContext") && parent.id?.() === ctx;
  }

  /**
   * Reject a read of a name that nothing declares — the extension point.
   *
   * Lives at v1 so that v1 and v2 — which TradingView states are the same
   * language, and which conformance/v1_equals_v2.test.ts asserts over the whole
   * corpus — reject the same scripts. `bound` rather than `declared` is the
   * right question: v1 and v2 both permit forward references.
   *
   * ── Why this exists ─────────────────────────────────────────────────────
   *
   * visitId's fallback emits `opsv2_<name>` for anything it does not
   * recognise. Through `with(sandbox)` an unrecognised name is not a Pine
   * diagnostic but a JavaScript ReferenceError on the first bar:
   *
   *     opsv2_last_bar_index is not defined
   *
   * which reads as an engine crash. TradingView answers `Undeclared identifier`
   * at compile time. Dotted names already had a guard here ("'chart' is not a
   * namespace"); bare ones had none, so every unimplemented built-in surfaced
   * as a crash. Running TradingView's own documentation corpus turned up 45
   * scripts failing that way.
   */
  /**
   * Is a binding of `name` in scope at the point it is READ?
   *
   * "The global scope is all of the script that is not inside a function, if
   *  statement, or other conditional structure ... Only code that is in the
   *  same local scope can access a local variable."
   *
   * Answered by token span rather than by nesting depth, because the question
   * is about two POSITIONS: a name bound inside one `if` is invisible inside
   * the `if` beside it, and those are at the same depth. See `scopesOf`.
   *
   * A name the analysis pass records no scope for is treated as visible. That
   * is the safe direction — a binding form the pass does not model yet makes
   * this check silent rather than making it reject working code.
   */
  protected visibleAt(name: string, ctx: IdContext): boolean {
    const scopes = this.scopes.scopesOf?.get(name);
    if (!scopes?.length) return true;
    const at = (ctx as any).start?.tokenIndex;
    if (typeof at !== "number") return true;
    return scopes.some(s => s === null || (at >= s.start && at <= s.stop));
  }

  protected checkUndeclaredRead(name: string, ctx: IdContext): void {
    if (this.registry[name]) return;
    if (RUNTIME_GLOBALS.has(name)) return;
    if (UNIMPLEMENTED_BUILTINS.has(name)) return;   // bound as a poison pill
    if (this.scopes.bound.has(name) || this.scopes.declared.has(name)) {
      if (this.visibleAt(name, ctx)) return;
      // Bound, but not HERE — a local read from outside its block. The name is
      // known, so none of the branches below apply; TradingView reports the
      // same error it reports for a name that was never written at all.
      throw this.err(ctx, `Undeclared identifier '${name}'.`);
    }
    if (this.namespaceRoots.has(name)) return;

    // In the union registry but not this version's view: a MIGRATION error, not
    // a typo. Reporting it as undeclared would bury the actual problem.
    if (name in REGISTRY) {
      throw this.err(
        ctx,
        `'${name}' is not available in Pine Script v${this.version}. ` +
        `It was added in a later version.`,
      );
    }

    throw this.err(ctx, `Undeclared identifier '${name}'.`);
  }

  /**
   * A member of a KNOWN namespace that this version does not have.
   *
   * The mirror of `checkUndeclaredRead`, and it existed for neither reason nor
   * design: an unknown BARE name was rejected, while an unknown MEMBER of a
   * real namespace fell through to `opsv2_syminfo.opsv2_nonesuch` and read as
   * `undefined` on every bar. Nothing said so. `color.from_gradient` at v2 — a
   * v4 addition — compiled, and every colour computed from it was `na` forever.
   *
   * Split by whether the name exists at ALL, because the two are different
   * problems: `syminfo.tickerid` at v2 is a MIGRATION question with a version
   * for an answer, and `syminfo.nonesuch` is a typo.
   *
   * Overridable because v5 has dotted names that are not namespace members —
   * fields, enum members, library calls — and resolves those first.
   */
  protected checkNamespaceMember(root: string, text: string, ctx: IdContext): void {
    if (this.registry[text]) return;

    // A name this engine knows and deliberately does not implement is bound as
    // a poison pill, which reports its own reason when READ. Saying it does not
    // exist would be a lie, and would fire on a script that never reaches it.
    if (UNIMPLEMENTED_BUILTINS.has(text)) return;

    // The namespace itself may be a value as well as a namespace (`line` is a
    // v1–v3 plot style and a v4 drawing type), and a bare root is not a member.
    if (text === root) return;

    // ...and neither is an INNER namespace. `strategy.risk` holds
    // `strategy.risk.max_drawdown` and is not a key of its own, so it is a name
    // this version knows even though nothing answers to it directly.
    const prefix = text + ".";
    if (Object.keys(this.registry).some(key => key.startsWith(prefix))) return;

    if (text in REGISTRY) {
      throw this.err(
        ctx,
        `'${text}' is not available in Pine Script v${this.version}. ` +
        `It was added in a later version.`,
      );
    }

    throw this.err(ctx, `'${root}' has no member '${text.slice(root.length + 1)}'.`);
  }

  visitId(ctx: IdContext): string {
    const text = ctx.getText();

    // An UNKNOWN NAMESPACE is an error, not an undefined read.
    //
    // Pine has no user-defined dotted names before v5, so every dotted
    // identifier names a built-in namespace. If the root is not one this
    // version has, the script is written against a different version.
    //
    // Only the ROOT is checked, not the full key. A missing member of a real
    // namespace (`strategy.wintrades`, `barstate.isconfirmed`) is this engine's
    // gap rather than the script's mistake, and failing those here would report
    // an incomplete stdlib as a user error.
    //
    // This exists because the failure was previously an ACCIDENT: `syminfo` had
    // no entry at all, so `opsv2_syminfo.opsv2_timezone` threw a TypeError on a
    // missing object. The moment v4 added `syminfo.ticker` — which builds an
    // `opsv2_syminfo` object for every version, the runtime registry being
    // deliberately a union — the same v2 script started reading `undefined` and
    // running to completion with a silently wrong timezone.
    const dot = text.indexOf(".");
    if (dot > 0) {
      const root = text.slice(0, dot);
      if (!this.namespaceRoots.has(root)) {
        throw this.err(
          ctx,
          `'${root}' is not a namespace in Pine Script v${this.version}, so ` +
          `'${text}' cannot be resolved.`,
        );
      }
      this.checkNamespaceMember(root, text, ctx);
    }

    // strategy.* namespace (getters/constants too) requires strategy() context.
    if (text.startsWith("strategy.")) {
      this.enforceStrategyContext(text, ctx);
    }

    if (!text.includes(".") && !this.isKeywordArgumentName(ctx)) {
      this.checkUndeclaredRead(text, ctx);
    }

    // 1. Handle Transpilation (Prefixing)
    let transpiledName = text;
    if (text.includes('.')) {
        // A namespace whose ROOT the script also binds cannot be read through
        // the sandbox object, because the script's own binding shadows it.
        //
        //     extend = extendLines ? extend.right : extend.none
        //
        // is ordinary Pine — TradingView resolves the dotted form against the
        // namespace and the bare form against the variable — and it emitted
        //
        //     let opsv2_extend = ctx.new_var("opsv2_extend",
        //       … ? opsv2_extend.opsv2_right : opsv2_extend.opsv2_none)
        //
        // where `opsv2_extend` on the right is the `let` being declared, not the
        // namespace: "Cannot access 'opsv2_extend' before initialization" on the
        // first bar. A parameter default has the same shape —
        // `string position = position.middle_center` — and neither is exotic:
        // `extend`, `position`, `order` and `earnings` all read naturally as
        // variable names.
        //
        // `ctx.builtin` reaches the registry directly, so nothing in the
        // script's scope can stand in front of it.
        const root = text.slice(0, text.indexOf("."));
        if (this.scopes.bound.has(root) || this.scopes.declared.has(root)) {
            return `ctx.builtin(${JSON.stringify(text)})`;
        }
        transpiledName = text.split('.').map(p => `${this.PREFIX}${p}`).join('.');
    } else {
        transpiledName = `${this.PREFIX}${text}`;
    }

    // 2. THE GETTER CHECK
    // If the standard library registry marks this identifier as a getter,
    // we must transpile it into an execution call instead of a static reference!
    //
    // ...unless the SCRIPT binds that name. A getter reads through
    // `ctx.call(id, opsv2_hour)`, and if `opsv2_hour` is the script's own
    // `let` the call reaches a number rather than the accessor. Pine keeps the
    // two apart by resolving a declared name to the declaration; so does this.
    //
    // Nor when the id is a keyword argument's NAME. `timestamp(year = 2021)`
    // spells a PARAMETER that happens to share a built-in's name, and it is
    // emitted as an object key — `{ ctx.call("year@L3:C10", opsv2_year): 2021 }`
    // is not JavaScript. The same exemption `checkUndeclaredRead` takes.
    const entry = this.registry[text];
    if (entry && entry.is_getter && !this.isKeywordArgumentName(ctx)
        && !this.scopes.declared.has(text) && !this.scopes.bound.has(text)) {
        const callId = `"${text}${this.getLocId(ctx)}"`;
        return `ctx.call(${callId}, ${transpiledName})`;
    }

    return transpiledName;
  }
}
