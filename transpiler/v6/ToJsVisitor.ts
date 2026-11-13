/**
 * Pine Script v6 → JavaScript emitter.
 *
 * v6 inherits every line of emit logic from v5 (and so from v1 through v4).
 * This file contains only what TradingView's v6 migration guide and release
 * notes document as different.
 *
 * ── Why so much of v6 lands here ───────────────────────────────────────────
 *
 * "Breaking changes" is TradingView's term for USER SCRIPTS moving v5 to v6.
 * Sorted by where each of the 25 actually lands in this engine, 11 are emit
 * decisions — a different JavaScript expression, or a new compile error over a
 * tree that parses fine. 9 are registry or profile DATA. 5 are run-time, and
 * all 5 are a flag or a broker override rather than a second runtime.
 *
 * So this file is where v6 mostly lives, exactly as transpiler/v5 is where v5
 * mostly lives. Nothing in v1–v5 is touched to add any of it: a v5 script
 * reaches V5ToJsVisitor and emits what it always did.
 */
import type { PineVersion } from "../common/version";
import { detectVersion } from "../common/version";
import { V5ToJsVisitor, V5Options } from "../v5/ToJsVisitor";
import type { StdlibEntry } from "../../runtime/v1/stdlib/metadata";
import { V6_VIEW } from "../../runtime/v1/stdlib";
import { parse as parseV6 } from "../../parser/v6";
import { isStaticallyBool } from "../common/passes/ScopeAnalysis";
import {
  isStaticallyNumeric, numericTypeName, isLiteral, isNaLiteral, isUniqueConstant,
  isStaticallySeries, isLiteralBelowOne, unwrap, ruleName,
  declaresStaticRequests, findRequestingFunctions, insideConditionalOrLoop,
  WHEN_REMOVED, TRANSP_REMOVED, isUniqueParam, SIMPLE_LENGTH_PARAMS,
} from "./rules";
import {
  Once_exprContext,
  Other_literalContext,
} from "../../parser/v6/generated/PineV6Parser";

export interface V6Options extends V5Options {}

/** Anything carrying a source position (see the v1 base for why it is structural). */
interface SourceLocated {
  start?: { line: number; column: number } | null;
}

/**
 * A triple-quoted literal's text, as a JavaScript string literal.
 *
 * Quoted, from the release notes (April 2026):
 *
 *   "All code between the """ or ''' delimiters in a multiline string
 *    definition represents literal text."
 *   "Each code line between the delimiters defines a separate text line"
 *   "multiline strings automatically include all spaces used for indentation"
 *
 * So newlines are KEPT, and so is every leading space — unlike the inherited
 * `unwrapString`, which collapses a wrapped ordinary string onto one line.
 * Stripping a common indent, the way some languages do, would be the wrong
 * guess: the notes' own example says "any indentation in the definition is
 * still included literally in the string".
 *
 * Escapes keep their ordinary meaning (`\t`, `\\`, `\"`), which is why a
 * backslash and the character after it are copied as a pair. Everything else
 * is re-escaped for JavaScript: a raw newline becomes `\n`, and a bare `"`
 * — legal inside `'''…'''` — becomes `\"`.
 */
export function unwrapMultilineString(text: string): string {
  const inner = text.slice(3, -3);
  let out = '"';
  for (let i = 0; i < inner.length; i++) {
    const c = inner[i];
    // A backslash with nothing after it — `"""abc\\"""` lexes with inner
    // text `abc\\` — is a literal backslash. Copied bare, it escaped the
    // closing quote of the emitted literal and the script failed to compile.
    if (c === "\\" && i + 1 >= inner.length) { out += "\\\\"; continue; }
    if (c === "\\" && i + 1 < inner.length) {
      const next = inner[i + 1];
      // A backslash before a raw line break. TradingView turns each break
      // into the escape `\n` and THEN reads escapes, so the author's backslash
      // escapes the backslash of that `\n`: the string holds a literal
      // backslash and the letter n, and no break. Its log shows the
      // first line of `"""first \` + break + `second"""` as `first \nsecond`,
      // 24 characters in all (conformance/v6/golden/harness_v6_language).
      if (next === "\n" || next === "\r") {
        out += "\\\\n";
        i += next === "\r" && inner[i + 2] === "\n" ? 2 : 1;
        continue;
      }
      out += c + next;
      i++;
      continue;
    }
    if (c === "\r") {
      if (inner[i + 1] === "\n") i++;
      out += "\\n";
      continue;
    }
    if (c === "\n") { out += "\\n"; continue; }
    if (c === '"') { out += '\\"'; continue; }
    out += c;
  }
  return out + '"';
}

export class V6ToJsVisitor extends V5ToJsVisitor {
  protected override readonly version: PineVersion = 6;

  constructor(options: V6Options = {}) {
    super(options);
  }

  /**
   * MG §"Fractional division of constants": "Non-even int division always
   * returns a fraction (5/2 = 2.5) for all qualifiers." v5 truncated two
   * constant ints; v6 does not.
   */
  protected override truncatesConstIntDivision(): boolean {
    return false;
  }

  /** v6's view of the stdlib. See V6_VIEW for what differs from v5's. */
  protected override get registry(): Record<string, StdlibEntry> {
    return V6_VIEW;
  }

  // ── Libraries ─────────────────────────────────────────────────────────────

  /**
   * A library is read by the grammar of the version IT declares.
   *
   * A v6 script may import a v5 library, and the two grammars disagree: v5
   * lets a library bind a variable called `once`, v6 does not. Parsing every
   * library as v6 would reject published v5 libraries for using a word that
   * was legal when they were written.
   */
  protected override parseLibrary(source: string) {
    const declared = detectVersion(source);
    if (declared === 6) return { parsed: parseV6(source), version: 6 as PineVersion };
    return super.parseLibrary(source);
  }

  protected override createLibraryVisitor(version: PineVersion, options: V5Options): V5ToJsVisitor {
    const visitor = version === 6 ? new V6ToJsVisitor(options) : super.createLibraryVisitor(version, options);
    this.lastLibraryVisitor = visitor;
    return visitor;
  }

  // ── Library constants ─────────────────────────────────────────────────────

  /** The types a library constant may have. Release notes, June 2025. */
  private static readonly CONSTANT_TYPES = new Set(["int", "float", "bool", "color", "string"]);

  /** Names this library exports as constants. */
  protected exportedConstants: Set<string> = new Set();

  /** alias → the constants that library exports, so `alias.NAME` resolves. */
  protected libraryConstants: Map<string, Set<string>> = new Map();

  /** The visitor of the library compiled most recently — see compileLibrary. */
  private lastLibraryVisitor: V5ToJsVisitor | null = null;

  /**
   * `export const <type> <NAME> = <value>` — the only form the release notes
   * allow: the `const` qualifier, and one of five types. Anything else is a
   * variable a library cannot export, and is refused here by name.
   */
  override visitExport_stmt(ctx: any): string {
    const def = ctx.var_def?.();
    if (!def) return super.visitExport_stmt(ctx);

    const name: string = def.id().getText();
    const qualifier = def.type_qual?.()?.getText?.();
    const type = def.field_type?.()?.getText?.();
    if (!this.declaresLibrary) {
      throw this.err(
        ctx,
        `'export ${name}' is only allowed in a library. Declare the script with ` +
        `library("…") instead of indicator("…").`,
      );
    }
    if (qualifier !== "const" || !type || !V6ToJsVisitor.CONSTANT_TYPES.has(type)) {
      throw this.err(
        ctx,
        `a library can export a variable only as 'export const <type> ${name} = …', ` +
        `with a type of int, float, bool, color or string.`,
      );
    }
    this.exportedNames.add(name);
    this.exportedConstants.add(name);
    return this.visit(def);
  }

  protected override exportedMemberJs(
    name: string, types: ReadonlyMap<string, unknown>, enums: ReadonlyMap<string, unknown>,
  ): string {
    return this.exportedConstants.has(name)
      ? this.localName(name)
      : super.exportedMemberJs(name, types, enums);
  }

  protected override compileLibrary(path: string, alias: string, source: string, ctx: SourceLocated) {
    const result = super.compileLibrary(path, alias, source, ctx);
    const inner = this.lastLibraryVisitor as V6ToJsVisitor | null;
    this.libraryConstants.set(alias, new Set(inner?.exportedConstants ?? []));
    return result;
  }

  /** `alias.NAME` — a constant an imported library exports. */
  protected override emitFieldChain(text: string): string | null {
    const dot = text.indexOf(".");
    if (dot > 0) {
      const alias = text.slice(0, dot);
      const member = text.slice(dot + 1);
      if (this.libraryConstants.get(alias)?.has(member)) {
        return `${this.libraryNamespace(alias)}[${JSON.stringify(member)}]`;
      }
    }
    return super.emitFieldChain(text);
  }

  // ── Multiline strings ─────────────────────────────────────────────────────

  // `any`, as V5's overrides of inherited rules are: each version's generator
  // emits its own context classes, so v6's Other_literalContext is not v1's.
  override visitOther_literal(ctx: any): string {
    const lit = ctx as Other_literalContext;
    const ml = lit.MLSTRING_DQ() ?? lit.MLSTRING_SQ();
    if (ml) return unwrapMultilineString(ml.getText());
    return super.visitOther_literal(ctx);
  }

  // ── `once` ────────────────────────────────────────────────────────────────

  protected override visitContent(ctx: any): string {
    if (ctx.once_expr?.()) return this.visit(ctx.once_expr()!);
    return super.visitContent(ctx);
  }

  /**
   * `once [<condition>]` — run the block the first time the condition holds,
   * and never again.
   *
   * Lowered onto `var`, because that is precisely the state the manual
   * describes. From the Conditional structures page:
   *
   *   - on historical bars the block runs once, the first time the condition
   *     is true, and never again;
   *   - on the realtime bar the structure's state is ROLLED BACK between ticks,
   *     so the block can run on several ticks of one bar, and the structure
   *     only goes inactive when the block runs on the bar's closing tick.
   *
   * A `var` flag is committed on a confirmed bar and rolled back on an
   * unconfirmed tick — which is that behaviour exactly, with no new runtime
   * mechanism. `varip` would be wrong: it survives rollback, and would stop
   * the block after the first realtime tick.
   *
   * The flag is keyed by the structure's SOURCE LOCATION through
   * `seriesKey`, so two `once` blocks never share it, and one inside a user
   * function gets the same per-call-site storage a `var` there gets. The
   * manual does not say whether a `once` in a function fires once per call
   * site or once overall; following `var` is the reading consistent with the
   * rest of the language, and it is stated here because it is an assumption.
   *
   * Emitted as a plain `if`, never an IIFE: `once` is a statement with no
   * value (the manual makes assigning one a compile error), and a plain block
   * is what lets `break` and `continue` inside it reach an enclosing loop.
   */
  visitOnce_expr(ctx: Once_exprContext): string {
    const loc = this.getLocId(ctx as SourceLocated);
    const flag = `${this.PREFIX}$once${loc.replace(/[@:]/g, "_")}`;
    const key = this.seriesKey(flag);
    this.enforceBoolCondition(ctx.ternary_expr());
    const cond = ctx.ternary_expr() ? this.visit(ctx.ternary_expr()!) : "true";

    const saved = this.suppressBlockReturn;
    this.suppressBlockReturn = saved + 1;
    let body: string;
    try {
      body = this.visit(ctx.stmts_block());
    } finally {
      this.suppressBlockReturn = saved;
    }

    // The flag is set BEFORE the body runs, so a body that throws or `break`s
    // still counts as having run — the block began executing, which is what
    // "executes for the first time" means.
    return (
      `let ${flag} = ctx.var_def("${key}", "${loc}", () => (false));\n` +
      `if (!ctx.truthy(${flag}) && ctx.truthy(${cond})) {\n` +
      `${flag} = ctx.new_var("${key}", true);\n` +
      `${body}\n` +
      `}`
    );
  }

  // ══ Migration-guide rules ═══════════════════════════════════════════════
  //
  // Each method below cites the guide section it implements. Every one is a
  // COMPILE-TIME rule over a tree v5 already parses, which is why v6's grammar
  // is so small and this file is not.

  /** The value of a block's last statement, or null. */
  protected blockTail(block: any): any | null {
    const lines = block?.fun_body_multiline?.()?.local_stmts_multiline?.()
      ?.local_stmts_list?.()?.local_stmt_multiline?.();
    const contents = lines?.[lines.length - 1]?.local_stmt_content?.();
    return contents?.[contents.length - 1] ?? null;
  }

  /** The value an arm of a switch ends with, or null. */
  protected caseTail(arm: any): any | null {
    const block = arm.stmts_block?.();
    if (block) return this.blockTail(block);
    const contents = arm.local_stmt_singleline?.()?.local_stmt_content?.();
    return contents?.[contents.length - 1] ?? null;
  }

  /**
   * MG §"Explicit bool casting": "int and float values are no longer
   * implicitly cast to bool". A numeric value where a condition is required
   * is a compile error; the fix the guide gives is `bool(x)`.
   */
  protected enforceBoolCondition(node: any, where: SourceLocated = node): void {
    if (!node || !isStaticallyNumeric(node, this.scopes)) return;
    const type = numericTypeName(node, this.scopes);
    throw this.err(
      where,
      `cannot use '${type}' as a condition — Pine Script v6 does not cast ` +
      `'int' or 'float' to 'bool' implicitly. Wrap it in bool().`,
    );
  }

  override visitIf_expr(ctx: any): string {
    this.enforceBoolCondition(ctx.ternary_expr());
    this.enforceUniqueIfHasElse(ctx);
    return super.visitIf_expr(ctx);
  }

  override visitTernary_expr(ctx: any): string {
    if (ctx.COND?.()) this.enforceBoolCondition(ctx.or_expr());
    return super.visitTernary_expr(ctx);
  }

  override visitUnary_expr(ctx: any): string {
    if (ctx.NOT?.()) this.enforceBoolCondition(ctx.sqbr_expr());
    return super.visitUnary_expr(ctx);
  }

  override visitWhile_expr(ctx: any): string {
    this.enforceBoolCondition(ctx.ternary_expr());
    return super.visitWhile_expr(ctx);
  }

  /**
   * MG §"Lazy evaluation of conditions": "evaluation stops once the result is
   * determined". v5 evaluated every operand (see the long note on
   * `visitOr_expr` in the v1 base for why, and the golden export that proved
   * it); v6 short-circuits, so a `ta.*` call on the right of an `and` really
   * is skipped on bars where the left is false — the guide's own warning, and
   * TradingView's behaviour, which this engine must reproduce surprise and all.
   *
   * The guide also names the payoff: `arr.size() != 0 and arr.first()` no
   * longer reads an empty array.
   */
  override visitOr_expr(ctx: any): string {
    const operands = ctx.and_expr();
    if (operands.length === 1) return this.visit(operands[0]);
    for (const o of operands) this.enforceBoolCondition(o);
    return `(${operands.map((o: any) => `ctx.truthy(${this.visit(o)})`).join(" || ")})`;
  }

  override visitAnd_expr(ctx: any): string {
    const operands = ctx.eq_expr();
    if (operands.length === 1) return this.visit(operands[0]);
    for (const o of operands) this.enforceBoolCondition(o);
    return `(${operands.map((o: any) => `ctx.truthy(${this.visit(o)})`).join(" && ")})`;
  }

  /**
   * MG §"Boolean values cannot be na": "In if/switch expressions returning
   * bool, a missing branch yields false instead of na."
   *
   * Decided from the FIRST branch's value, which is the type the structure
   * has: Pine requires every branch to agree, and disagreeing is a separate
   * compile error on TradingView.
   */
  protected override ifFallthrough(ctx: any): string {
    const tail = this.blockTail(ctx.stmts_block(0));
    return tail && isStaticallyBool(tail, this.scopes.booleans) ? "false" : super.ifFallthrough(ctx);
  }

  protected override switchFallthrough(ctx: any): string {
    for (const arm of ctx.switch_body().switch_case()) {
      const tail = this.caseTail(arm);
      if (tail) return isStaticallyBool(tail, this.scopes.booleans) ? "false" : super.switchFallthrough(ctx);
    }
    return super.switchFallthrough(ctx);
  }

  /**
   * MG §"Unique parameters cannot be na": "switch needs a default branch, and
   * if needs an else branch, when the result is a unique type" — because the
   * missing branch would be `na`, which a unique type can no longer hold.
   *
   * Only in VALUE position. A statement-`if` produces nothing, so its missing
   * branch produces no `na` either.
   */
  protected enforceUniqueIfHasElse(ctx: any): void {
    if (this.isStatementPosition(ctx)) return;
    // Walk the else-if chain to its end; an `else` block anywhere terminates it.
    let node = ctx;
    while (node) {
      if (node.stmts_block().length > 1) return;
      const next = node.if_expr?.();
      if (!next) break;
      node = next;
    }
    const tail = this.blockTail(ctx.stmts_block(0));
    if (tail && isUniqueConstant(tail)) {
      throw this.err(
        ctx,
        `this 'if' returns '${unwrap(tail).getText()}', a value of a unique type, ` +
        `and has no 'else'. Pine Script v6 requires one: the missing branch would be ` +
        `'na', which a unique type cannot hold.`,
      );
    }
  }

  override visitSwitch_expr(ctx: any): string {
    const arms = ctx.switch_body().switch_case();
    const subject = ctx.ternary_expr?.();
    if (!subject) for (const arm of arms) this.enforceBoolCondition(arm.ternary_expr());

    const hasDefault = arms.some((a: any) => !a.ternary_expr());
    const firstTail = arms.map((a: any) => this.caseTail(a)).find(Boolean);
    if (!hasDefault && firstTail && isUniqueConstant(firstTail) && !this.isStatementSwitch(ctx)) {
      throw this.err(
        ctx,
        `this 'switch' returns '${unwrap(firstTail).getText()}', a value of a unique ` +
        `type, and has no default arm. Pine Script v6 requires one: an unmatched ` +
        `switch would be 'na', which a unique type cannot hold.`,
      );
    }
    return super.visitSwitch_expr(ctx);
  }

  /** Is this switch a statement whose value is discarded? */
  protected isStatementSwitch(ctx: any): boolean {
    let node = ctx.parent;
    while (ruleName(node) === "Arith_exprContext") node = node.parent;
    return ruleName(node) === "Global_stmt_contentContext"
        || ruleName(node) === "Local_stmt_contentContext";
  }

  /**
   * MG §"Boolean values cannot be na": "Declaring a bool with na as its
   * default is invalid."
   */
  override visitVar_def(ctx: any): string {
    const type = ctx.field_type?.()?.getText?.();
    if (type === "bool" && isNaLiteral(ctx.arith_expr())) {
      throw this.err(
        ctx,
        `a 'bool' cannot be 'na' in Pine Script v6 — declare it as true or false.`,
      );
    }
    return super.visitVar_def(ctx);
  }

  /**
   * MG §"History-referencing operator":
   *
   *   - "[] on a literal or constant is a compile error"
   *   - "obj.field[10] is invalid. Use (obj[10]).field"
   */
  override visitSqbr_expr(ctx: any): string {
    if (ctx.arith_expr?.(0)) {
      const atom = ctx.atom();
      if (isLiteral(atom) || isNaLiteral(atom)) {
        throw this.err(
          ctx,
          `cannot use the history-referencing operator '[]' on the literal ` +
          `'${atom.getText()}' in Pine Script v6.`,
        );
      }
      const id = atom.id?.();
      if (id && !atom.fun_call?.()) {
        const text: string = id.getText();
        const dot = text.indexOf(".");
        if (dot > 0) {
          const root = text.slice(0, dot);
          const isObject = this.scopes.bound.has(root)
            && !this.userTypes.has(root)
            && !this.userEnums.has(root)
            && !this.importAliases.has(root);
          if (isObject) {
            throw this.err(
              ctx,
              `cannot use '[]' on the field '${text}' in Pine Script v6. ` +
              `Reference the object's history instead: (${root}[…])${text.slice(dot)}.`,
            );
          }
        }
      }
    }
    return super.visitSqbr_expr(ctx);
  }

  /**
   * MG §"Dynamic for loop boundaries": "The to_num expression ... is
   * re-evaluated before every iteration." v5 read it once.
   *
   * The same loop as the v1 base in every other respect — start value, step
   * magnitude and DIRECTION are still fixed when the loop starts — with the
   * bound moved into a thunk that is called once before the first iteration
   * and again after each one. Calling it in the loop CONDITION instead would
   * evaluate it twice before the first pass, and a bound with a side effect —
   * the guide's own example appends to an array — would see that.
   */
  override visitFor_expr(ctx: any): string {
    const varName = this.visit(ctx.var_def().id());
    const startVal = this.visit(ctx.var_def().arith_expr());
    const endVal = this.visit(ctx.ternary_expr(0));
    this.loopDepth++;
    let rawBody: string;
    try { rawBody = this.visit(ctx.stmts_block()); }
    finally { this.loopDepth--; }

    const stepVal = ctx.FOR_STMT_BY() ? this.visit(ctx.ternary_expr(1)) : "1";

    const id = this.anonCounter++;
    const res = `_res${id}`;
    const safeBody = this.captureLoopResult(rawBody, res);
    const s = `_s${id}`, e = `_e${id}`, ef = `_ef${id}`, st = `_st${id}`, up = `_up${id}`;

    const loopDef =
      `for (let ${s} = ${startVal}, ${e} = ${ef}(), ${st} = Math.abs(${stepVal}), ` +
      `${up} = ${s} <= ${e}, ${varName} = ${s}; ` +
      `${up} ? ${varName} <= ${e} : ${varName} >= ${e}; ` +
      `${varName} += (${up} ? ${st} : -${st}), ${e} = ${ef}())`;

    const loop =
      `const ${ef} = () => (${endVal});\n  let ${res} = NaN;\n  ${loopDef} {\n    ${safeBody}\n  }\n  return ${res};`;
    return `(() => {\n  ${loop}\n})()`;
  }

  // ── dynamic_requests ──────────────────────────────────────────────────────

  /**
   * True when the declaration says `dynamic_requests = false`.
   *
   * MG §"Dynamic requests": v6 defaults it to true, so `request.*()` may run
   * in loops and conditional blocks. Turned off EXPLICITLY, "calling
   * request.*() inside loop or conditional scopes, even through a wrapper
   * function, is a compile error". This engine never restricted request scope
   * at v5 either, so the default case needs nothing; only the opt-out does.
   */
  protected dynamicRequestsOff = false;

  /**
   * User functions that issue a request, directly or through another user
   * function — the "wrapper function" of the rule.
   */
  protected requestingFunctions: Set<string> = new Set();

  override visitPine_script(ctx: any): string {
    this.dynamicRequestsOff = declaresStaticRequests(ctx);
    if (this.dynamicRequestsOff) this.requestingFunctions = findRequestingFunctions(ctx);
    return super.visitPine_script(ctx);
  }

  protected enforceStaticRequestScope(ctx: any, callee: string): void {
    if (!this.dynamicRequestsOff) return;
    const requests = callee.startsWith("request.") || this.requestingFunctions.has(callee);
    if (!requests || !insideConditionalOrLoop(ctx)) return;
    throw this.err(
      ctx,
      callee.startsWith("request.")
        ? `'${callee}' cannot be called inside a loop or conditional block while ` +
          `'dynamic_requests = false'. Remove that argument — v6 allows dynamic requests by default.`
        : `'${callee}' calls request.*(), so it cannot be called inside a loop or ` +
          `conditional block while 'dynamic_requests = false'.`,
    );
  }

  // ── Call-site rules ───────────────────────────────────────────────────────

  override visitFun_call(ctx: any): string {
    this.enforceV6CallRules(ctx);
    return super.visitFun_call(ctx);
  }

  /** The keyword arguments of a call, in order. */
  protected kwArgs(ctx: any): Array<{ name: string; value: any; node: any }> {
    const list = ctx.fun_actual_args?.()?.kw_args?.()?.kw_arg?.() ?? [];
    return list.map((k: any) => ({ name: k.id().getText(), value: k.arith_expr?.(), node: k }));
  }

  /** The positional arguments of a call, in order. */
  protected posArgs(ctx: any): any[] {
    const pos = ctx.fun_actual_args?.()?.pos_args?.();
    return pos ? this.positionalArgs(pos) : [];
  }

  protected enforceV6CallRules(ctx: any): void {
    const callee: string = ctx.id().getText();
    this.enforceStaticRequestScope(ctx, callee);
    const kw = this.kwArgs(ctx);
    const builtin = !this.userFunctions.has(callee) && callee in this.registry;

    // MG §"Cannot repeat parameters": "Duplicates are a compile error." v5
    // warned and used the first.
    const seen = new Set<string>();
    for (const a of kw) {
      if (seen.has(a.name)) {
        throw this.err(a.node, `the argument '${a.name}' is specified more than once.`);
      }
      seen.add(a.name);
    }

    if (!builtin) return;

    for (const a of kw) {
      // MG §"Removal of when parameter".
      if (a.name === "when" && WHEN_REMOVED.has(callee)) {
        throw this.err(
          a.node,
          `'${callee}' has no 'when' parameter in Pine Script v6. ` +
          `Put the call inside an 'if' instead.`,
        );
      }
      // MG §"The transp parameter is removed".
      if (a.name === "transp" && TRANSP_REMOVED.has(callee)) {
        throw this.err(
          a.node,
          `'${callee}' has no 'transp' parameter in Pine Script v6. ` +
          `Use color.new(color, transparency) instead.`,
        );
      }
      // MG §"Unique parameters cannot be na".
      if (isUniqueParam(callee, a.name) && a.value && isNaLiteral(a.value)) {
        throw this.err(
          a.node,
          `'${a.name}' cannot be 'na' in Pine Script v6 — it takes a value of a ` +
          `unique type, which can no longer be 'na'.`,
        );
      }
      // MG §"Minimum linewidth is 1".
      if (a.name === "linewidth" && a.value && isLiteralBelowOne(a.value)) {
        throw this.err(a.node, `'linewidth' must be at least 1 in Pine Script v6.`);
      }
      // MG §"No series offset values": offset must be "simple" or weaker.
      if (a.name === "offset" && a.value && isStaticallySeries(a.value, this.scopes)) {
        throw this.err(
          a.node,
          `'offset' cannot be a "series" value in Pine Script v6 — it must be ` +
          `"simple" or weaker.`,
        );
      }
    }

    // MG §"Boolean values cannot be na": "The bool overloads [of na(), nz(),
    // fixnan()] are removed, so bool arguments fail to compile."
    if (callee === "na" || callee === "nz" || callee === "fixnan") {
      const first = this.posArgs(ctx)[0] ?? kw.find(a => a.name === "source" || a.name === "x")?.value;
      if (first && isStaticallyBool(first, this.scopes.booleans)) {
        throw this.err(
          ctx,
          `'${callee}()' does not accept a 'bool' in Pine Script v6 — a bool can no ` +
          `longer be 'na'.`,
        );
      }
    }

    // MG §"Mutable variables are always series": a variable reassigned with
    // ':=' is "series", so passing it where "simple int" is required fails.
    const simple = SIMPLE_LENGTH_PARAMS.get(callee);
    if (simple) {
      const pos = this.posArgs(ctx);
      for (const [index, name] of simple) {
        const arg = pos[index] ?? kw.find(a => a.name === name)?.value;
        const n = arg && unwrap(arg);
        // `mutated` is script scope: a parameter or local of the same name —
        // `f(len) => ta.ema(close, len)` — is a different variable.
        if (n && ruleName(n) === "IdContext" && this.scopes.mutated.has(n.getText())
            && !this.scopes.functionScoped.has(n.getText())) {
          throw this.err(
            ctx,
            `'${n.getText()}' is reassigned with ':=', which makes it "series" in ` +
            `Pine Script v6, but '${callee}' requires a "simple int" ${name}.`,
          );
        }
      }
    }
  }
}
