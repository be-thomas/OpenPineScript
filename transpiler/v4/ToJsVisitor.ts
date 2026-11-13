/**
 * Pine Script v4 → JavaScript emitter.
 *
 * v4 inherits every guard v3 added — self-reference, forward reference, bool
 * arithmetic, mutable `security()` argument — and every line of emit logic from
 * v1. The migration guide relaxes none of them.
 *
 * What v4 adds is in two halves:
 *
 *   SYNTAX (this file)
 *     `var` / `varip` declaration modifiers, and an optional type prefix.
 *     `var` is the only one with emit consequences; the type prefix is checked
 *     and discarded, and the qualifiers are discarded outright.
 *
 *     The five compound assignment operators, `+= -= *= /= %=` (March 2021).
 *     Sourced from the v4 release notes; see PineV4Lexer.g4 for the quote.
 *
 *     `else if` (May 2020). Grammar in PineV4Parser.g4, emit below.
 *
 *   NAMES (transpiler/common/profiles/index.ts + runtime)
 *     The 3a rename table — `n` → `bar_index`, `red` → `color.red`,
 *     `period` → `timeframe.period`, and the rest. Those are lookups, not emit
 *     rules, so they do not belong here.
 *
 * NOT in v4, despite an earlier draft of the delta spec saying so: `while` and
 * `switch`. Both are v5. v4 adds no statement keyword at all, which is why this
 * file overrides declarations and nothing else.
 */
import type { PineVersion } from "../common/version";
import { V3ToJsVisitor } from "../v3/ToJsVisitor";
import type { StdlibEntry } from "../../runtime/v1/stdlib/metadata";
import { isProvablyFloat, isPlainNa, isConstNumber } from "../common/passes/TypeRules";
import { CONST_DEFAULT } from "../../runtime/v1/constDefault";
import { V4_VIEW } from "../../runtime/v1/stdlib";
import { V4_RENAMES } from "../../runtime/v1/stdlib/renames";
import {
  Var_defContext,
  Var_defsContext,
  Var_assignContext,
  If_exprContext,
  IdContext,
  Pos_argsContext,
  Pos_argContext,
  Fun_callContext,
} from "../../parser/v4/generated/PineV4Parser";

/** Anything carrying a source position (see the v1 base for why it is structural). */
interface SourceLocated {
  start?: { line: number; column: number } | null;
}

/** A declaration's `var` / `varip` modifier, or null when it has neither. */
type Persistence = "var" | "varip" | null;

// v4's stdlib view — base − removed + namespaced + aliases — is built once in
// runtime/v1/stdlib/index.ts and imported here. It lives there rather than in
// this file because v5 is derived FROM it: a registry view is data about the
// language, and an emitter is one of its consumers rather than its owner.

/** v3 spelling → the v4 spelling that replaced it, for the diagnostic. */
const REPLACEMENT = new Map<string, string>(
  V4_RENAMES.filter(r => r.from !== undefined).map(r => [r.from!, r.to]),
);

/** Functions whose second positional argument (or `length=`) is a `series int`. */
/** The x coordinates of each drawing constructor, with their positional slot. */
const DRAWING_X_PARAMS: Record<string, { name: string; index: number }[]> = {
  "label.new": [{ name: "x", index: 0 }],
  "line.new": [{ name: "x1", index: 0 }, { name: "x2", index: 2 }],
  "box.new": [{ name: "left", index: 0 }, { name: "right", index: 2 }],
};

const INT_LENGTH_CALLS = new Set([
  "sma", "ema", "rma", "wma", "vwma", "hma", "highest", "lowest", "stdev", "rsi",
]);

export class V4ToJsVisitor extends V3ToJsVisitor {
  protected override readonly version: PineVersion = 4;

  /** v4 onward keeps the lazy ternary (unprobed); see the v1 hook. */
  protected override ternaryRunsBothBranches(): boolean { return false; }

  // ── The §3a rename table ──────────────────────────────────────────────────

  /**
   * v4's view of the stdlib: the base, minus the spellings v4 removed, plus the
   * namespaced ones it introduced.
   *
   * Subtracting matters as much as adding. Leaving `red` in alongside
   * `color.red` would accept both dialects, and a script written half in each
   * would compile here and fail on TradingView — the exact class of divergence
   * this engine exists to avoid.
   */
  protected override get registry(): Record<string, StdlibEntry> {
    return V4_VIEW;
  }

  /**
   * From v4, a user-defined function MAY return a tuple.
   *
   * SOURCING. From the manual's user-defined functions page: "Programmers can
   * write functions that return multiple values or references by using a tuple
   * as the final statement in the function's body", with
   *
   *     sumDiff(float val1, float val2) =>
   *         [val1 + val2, val1 - val2]
   *
   *     [sum, diff] = sumDiff(math.random(), math.random())
   *
   * and the rule for reading one back: "the script must use a tuple declaration
   * containing one NEW variable for each returned item. It is not possible to
   * reassign existing tuples or to use previously declared variables within
   * them."
   *
   * v1–v3 keep the refusal — `conformance/common/guards_by_version.test.ts` has
   * always declared the guard for those three and left v4 and v5 unstated, and
   * this is the override that was missing. Eight of TradingView's own published
   * scripts were rejected by it, including the one on its own error-messages
   * page about tuples.
   *
   * Lifting the guard is the WHOLE change: `[a, b]` already emits a JavaScript
   * array through `visitArith_exprs`, a body's last statement is already what a
   * function returns, and `ctx.new_vars` already unpacks a built-in's tuple.
   */
  protected override enforceNoTupleReturn(): void {}

  /**
   * Rejects a v1–v3 spelling with the name that replaced it.
   *
   * Hooked on `visitId` rather than driven off the registry, because a missing
   * registry entry is not by itself an error — `visitId` emits any identifier
   * it does not recognise, since most identifiers are the script's own
   * variables. So `red` at v4 would just emit `opsv2_red` and read as
   * `undefined`: a colour that is silently `na`, on a chart that still draws.
   */
  protected enforceRenamedInV4(name: string, ctx: SourceLocated): void {
    const replacement = REPLACEMENT.get(name);
    if (!replacement) return;

    // A script may still BIND the old word as its own variable — `red = close`
    // is legal v4, the built-in is simply gone. Only an unbound reference is
    // the migration error.
    if (this.scopes.declared.has(name) || this.scopes.bound.has(name)) return;

    // The word may also survive as a FUNCTION while only the VARIABLE moved.
    // `tickerid` is that case, and the migration guide is explicit: "The
    // `ticker` and `tickerid` VARIABLES are renamed to `syminfo.ticker` and
    // `syminfo.tickerid` respectively." `tickerid(prefix, ticker, session)` is
    // still v4 — it appears in three of TradingView's own v4 examples — and
    // rejecting the call would refuse valid code in the name of a rename that
    // did not touch it.
    //
    // Gated on being a CALLEE, not on the entry existing: `x = tickerid` is a
    // read of the moved variable and must still be refused.
    if (this.isCalleeOf(ctx) && this.registry[name]) return;

    throw this.err(
      ctx,
      `'${name}' was renamed to '${replacement}' in Pine Script v4.`,
    );
  }

  /**
   * Is this identifier the CALLEE of a function call, rather than a read?
   *
   * Structural rather than `instanceof` — every version generates its own
   * context classes, so `instanceof` is false across the hierarchy (see the
   * note on `isRule` in the v1 base).
   */
  protected isCalleeOf(ctx: SourceLocated): boolean {
    const parent = (ctx as any).parent;
    return parent?.constructor?.name === "Fun_callContext" && parent.id?.() === ctx;
  }

  override visitId(ctx: IdContext): string {
    const text = ctx.getText();
    // A keyword argument's key is the CALLEE's parameter name, not a name this
    // script is reading, so the rename table does not apply to it. Two of
    // v4's renamed words are also parameter names of v4 built-ins —
    //
    //     table.new(position.top_right, columns = 5, rows = 4, ...)
    //     request.security(symbol = syminfo.tickerid, timeframe = "1D", ...)
    //
    // — and both were rejected as reads of the v3 plot-style `columns` and the
    // v3 input-type `symbol`. Four of TradingView's own v5 scripts hit it. v5's
    // own guard already skips these; v4's did not.
    if (!text.includes(".") && !this.isKeywordArgumentName(ctx as any)) {
      this.enforceRenamedInV4(text, ctx);
    }
    return super.visitId(ctx as any);
  }

  // ── `var` / `varip` ───────────────────────────────────────────────────────

  /** Reads the modifier off a declaration. Absent on every v1–v3 declaration. */
  protected persistenceOf(ctx: Var_defContext | Var_defsContext): Persistence {
    const mod = (ctx as any).decl_mod?.();
    if (!mod) return null;
    return mod.VARIP?.() ? "varip" : "var";
  }

  /**
   * `var x = expr` initialises once and then holds its value across bars.
   *
   * The initialiser is emitted as a THUNK. `ctx.var_def` runs it on the first
   * bar only, so `expr` is not re-evaluated afterwards — which matters both for
   * cost and for correctness: `var t = timenow` must keep the first bar's
   * timestamp, and passing an already-evaluated value would silently make it
   * the current one every bar while still looking like it worked.
   *
   * The @L:C key is the DECLARATION SITE, not the name. Two `var`s of the same
   * name in different scopes are different variables and must not share an
   * initialised flag.
   */
  override visitVar_def(ctx: Var_defContext): string {
    this.enforceDeclarationTypes(ctx);
    const persistence = this.persistenceOf(ctx);
    if (!persistence) return super.visitVar_def(ctx as any);

    // The v3 guards still apply to the initialiser — `var s = nz(s[1])` is a
    // self-reference in v4 exactly as it is in v3.
    this.enforceNoSelfReference(ctx.id().getText(), ctx.arith_expr(), ctx);

    const name = this.visit(ctx.id());
    const value = this.visit(ctx.arith_expr());
    const key = this.getLocId(ctx as SourceLocated);
    const ip = persistence === "varip" ? ", true" : "";

    return `let ${name} = ctx.var_def("${this.seriesKey(name)}", "${key}", () => (${value})${ip})`;
  }

  /**
   * `var [a, b] = f()` — the tuple form.
   *
   * Rejected rather than emitted wrongly. `ctx.new_vars` destructures a fresh
   * call result into several series, and there is no once-only form of it: the
   * honest options are to build one, or to say so. A wrong `var` here would
   * re-run `f()` every bar while the script says it must not, and nothing
   * downstream could detect that.
   */
  override visitVar_defs(ctx: Var_defsContext): string {
    const persistence = this.persistenceOf(ctx);
    if (!persistence) return super.visitVar_defs(ctx as any);

    throw this.err(
      ctx,
      `'${persistence}' on a tuple declaration is not implemented yet. ` +
      `Declare the elements separately, or drop '${persistence}'.`
    );
  }

  // ── Type errors TradingView raises at compile time ─────────────────────────

  /** Script-scope names declared with an explicit `int`, bound once. */
  private readonly declaredInts = new Set<string>();

  /**
   * "Value with NA type cannot be assigned to a variable that was defined
   * without type keyword" — `x = na`, and the `b = na` of `var float a = na, b = na`,
   * where the keyword covers `a` only. v1–v3 accept it, so this lives in v4.
   *
   * `int q = close` — a float stored in a declared int. Only when the
   * initialiser is PROVABLY a float (see TypeRules.ts).
   */
  protected enforceDeclarationTypes(ctx: Var_defContext): void {
    const c = ctx as any;
    const name = ctx.id().getText();
    const declared: string | null = (c.field_type?.() ?? c.type_name?.())?.getText() ?? null;
    const value = ctx.arith_expr();

    if (!declared && !c.decl_mod?.() && !c.type_qual?.() && isPlainNa(value)) {
      throw this.err(
        ctx as SourceLocated,
        `Value with NA type cannot be assigned to a variable that was defined without type keyword.`,
      );
    }

    if (declared !== "int") return;
    if (isProvablyFloat(value, this.scopes)) throw this.err(ctx as SourceLocated, this.declaredIntMessage(name));
    // Recorded for the `:=` check; a shadowed or function-local name is not.
    if (!this.scopes.functionScoped.has(name) && this.scopes.scopesOf.get(name)?.length === 1) {
      this.declaredInts.add(name);
    }
  }

  /** TradingView's wording, which differs by version. */
  protected declaredIntMessage(name: string): string {
    if (this.version === 4) {
      return `Variable '${name}' was declared with 'integer' type. Cannot assign it expression of type 'series[float]'.`;
    }
    // v5 quotes types with backticks and the name with '; v6 uses " for both.
    const [type, who] = this.version === 5 ? ["`", "'"] : ['"', '"'];
    return `Cannot assign a value of the ${type}float${type} type to the ${who}${name}${who} variable. ` +
           `The variable is declared with the ${type}int${type} type.`;
  }

  /**
   * A float argument where a `series int` length is required. The first
   * positional slot of these functions is the source, so only the second is
   * read — `ta.highest(10)` has its length first and is left alone.
   */
  protected enforceIntLengthArgument(ctx: Fun_callContext): void {
    const callee = ctx.id().getText();
    const bare = this.version === 4 ? callee : callee.startsWith("ta.") ? callee.slice(3) : null;
    if (!bare || !INT_LENGTH_CALLS.has(bare)) return;
    if (this.scopes.functions.has(callee)) return;

    const args = (ctx as any).fun_actual_args?.();
    const positional: any[] = args?.pos_args?.()?.children?.filter((x: any) => typeof x?.getChildCount === "function" && !x.symbol) ?? [];
    const keyword = (args?.kw_args?.()?.kw_arg?.() ?? []).find((k: any) => k.id().getText() === "length");
    const arg = keyword ? keyword.arith_expr?.() : positional.length >= 2 ? positional[1] : null;
    if (!arg || !isProvablyFloat(arg, this.scopes)) return;

    throw this.err(
      ctx as SourceLocated,
      this.version === 4
        ? `Cannot call '${callee}' with 'length'=float. The argument should be of type: series[integer]`
        : `Cannot call '${callee}' with argument 'length'='${arg.getText()}'. ` +
          `An argument of 'float' type was used but a 'series int' is expected.`,
    );
  }

  /**
   * A float where a drawing constructor's x coordinate (a `series int`) is
   * required: `label.new(bar_index - 10.7, ...)` is a compile error on v4, v5
   * and v6. `w / 2` between ints is no proof (see isProvablyFloat), so it still
   * compiles. The `chart.point` overloads (v5/v6) take points, not coordinates,
   * so only the 4-coordinate form (4+ positional args, or the x1/x2 keywords)
   * is read.
   */
  protected enforceIntCoordinateArguments(ctx: Fun_callContext): void {
    const callee = ctx.id().getText();
    const params = DRAWING_X_PARAMS[callee];
    if (!params || this.scopes.functions.has(callee)) return;

    const args = (ctx as any).fun_actual_args?.();
    const positional: any[] = args?.pos_args?.()?.children?.filter((x: any) => typeof x?.getChildCount === "function" && !x.symbol) ?? [];
    const keywords: any[] = args?.kw_args?.()?.kw_arg?.() ?? [];
    const kwNamed = (name: string) => keywords.find((k: any) => k.id().getText() === name)?.arith_expr?.() ?? null;

    // label.new is always treated as a coordinate call. On v4 it has only the (x, y, ...) form; v5/v6
    // also have label.new(chart.point, ...), but there the first argument is a point, which is never
    // provably a float, so nothing is flagged. The other drawings need 4 coordinates (or the first
    // coordinate by keyword) to be sure.
    const coordinateForm = callee === "label.new" || positional.length >= 4 || keywords.some((k: any) => k.id().getText() === params[0].name);
    if (!coordinateForm) return;

    for (const { name, index } of params) {
      const arg = kwNamed(name) ?? (positional.length > index ? positional[index] : null);
      if (!arg || !isProvablyFloat(arg, this.scopes)) continue;

      throw this.err(
        ctx as SourceLocated,
        this.version === 4
          ? `Cannot call '${callee}' with '${name}'=series[float]. The argument should be of type: series[integer]`
          : `Cannot call '${callee}' with argument '${name}'='${this.describeFloatOperand(arg)}'. ` +
            `An argument of 'series float' type was used but a 'series int' is expected.`,
      );
    }
  }

  /** TradingView names a binary expression `call 'operator -' (series float)`; anything else is shown as written. */
  private describeFloatOperand(node: any): string {
    let n = node;
    while (n.getChildCount?.() === 1) n = n.getChild(0);
    if (n.getChildCount?.() === 3 && n.getChild(1).symbol) {
      return `call 'operator ${n.getChild(1).getText()}' (series float)`;
    }
    return node.getText();
  }

  // `any`: the v1 base types its parameter with the v1 parser's context.
  override visitFun_call(ctx: any): string {
    this.enforceIntLengthArgument(ctx);
    this.enforceIntCoordinateArguments(ctx);
    return this.markConstTostring(ctx, super.visitFun_call(ctx as any));
  }

  /**
   * `tostring(x)` / `str.tostring(x)` of a constant number prints differently
   * from the same call on a series (runtime/v1/stdlib/str.ts `numberToString`),
   * and only the source can tell them apart. A call with no format whose
   * argument is provably constant gets the runtime's CONST_DEFAULT marker in
   * the format position.
   */
  private markConstTostring(ctx: any, emitted: string): string {
    const name = ctx.id().getText();
    if ((name !== "tostring" && name !== "str.tostring") || this.userFunctions.has(name)) return emitted;
    if (ctx.call_suffix?.()?.length || !emitted.endsWith(")")) return emitted;
    const args = ctx.fun_actual_args?.();
    if (!args || args.kw_args?.()?.kw_arg?.().length) return emitted;
    const positional = args.pos_args?.()?.pos_arg?.() ?? [];
    if (positional.length !== 1 || !isConstNumber(positional[0], this.scopes)) return emitted;
    return `${emitted.slice(0, -1)}, ${JSON.stringify(CONST_DEFAULT)})`;
  }

  // ── Compound assignment ───────────────────────────────────────────────────

  /**
   * The arithmetic half of a compound assignment — `"+"` for `+=` — or null
   * when the statement is a plain `:=`.
   */
  protected compoundOperatorOf(ctx: Var_assignContext): string | null {
    const op = (ctx as any).compound_assign_op?.();
    return op ? op.getText().slice(0, -1) : null;
  }

  /**
   * `current <op> value`, emitted EXACTLY as the binary operator would be.
   *
   * TradingView defines `x += y` as "an arithmetic operator combined with the
   * reassignment operator", so it has to mean precisely `x := x + y` — which
   * for `+` and `-` is not the JavaScript operator. `opsv2_safe_add` is what
   * `visitAdd_expr` emits, and it is what makes `na + 1` come out `na` and
   * `"a" + "b"` concatenate. Emitting a raw `+` here would have made compound
   * assignment the one place in the language where `na` behaved differently.
   *
   * `value` is parenthesised because not every emitted expression is
   * self-contained: a comparison comes out as bare `a > b`, so `x *= a > b`
   * would otherwise bind as `(x * a) > b`. (`and` and `or` used to be the
   * example here, back when they emitted `a && b`; they are now a call to
   * `ctx.allOf`, which brackets itself — see visitAnd_expr.)
   */
  protected compoundValue(op: string, current: string, value: string): string {
    if (op === "+") return `opsv2_safe_add(${current}, (${value}))`;
    if (op === "-") return `opsv2_safe_sub(${current}, (${value}))`;
    return `(${current} ${op} (${value}))`;
  }

  /**
   * `x += expr`.
   *
   * Routed through the same guard as `:=` — the target must already be
   * declared, which for a compound assignment is not a formality: there is no
   * previous value to add to otherwise.
   */
  override visitVar_assign(ctx: Var_assignContext): string {
    const op = this.compoundOperatorOf(ctx);
    const target = ctx.id().getText();
    if (this.declaredInts.has(target) && !this.scopes.functionScoped.has(target)
        && isProvablyFloat(ctx.arith_expr(), this.scopes)) {
      throw this.err(ctx as SourceLocated, this.declaredIntMessage(target));
    }
    if (!op) return super.visitVar_assign(ctx as any);

    this.enforceDeclaredBeforeReassignment(ctx as any);
    const name = this.visit(ctx.id());
    const value = this.visit(ctx.arith_expr());
    return `${name} = ctx.new_var("${this.seriesKey(name)}", ${this.compoundValue(op, name, value)})`;
  }

  // ── `else if` ─────────────────────────────────────────────────────────────

  /**
   * `else if cond` — the else branch is another `if` rather than a block.
   *
   * Emitted INLINE, as one more `else if` on the JavaScript side, instead of
   * by visiting the nested `if` normally. That distinction is the whole of the
   * work here, and it is not a matter of taste:
   *
   *     x = if a
   *             1
   *         else if b
   *             2
   *         else
   *             3
   *
   * A normal visit would give the nested `if` its own IIFE, producing
   * `(() => { if (a) { return 1; } else (() => { … })(); })()` — the inner
   * function computes 2 or 3 and the outer one throws the result away, so `x`
   * is `undefined` on every bar that takes the `else`. No error; just an `na`
   * where a number belongs.
   *
   * Recursing HERE keeps the whole chain inside the single wrapper
   * `visitIf_expr` already opened, and inside the one `suppressBlockReturn`
   * level it already set — so every arm of the chain returns, or does not,
   * together.
   */
  protected override emitElseBranch(ctx: If_exprContext): string | null {
    if (!ctx.IF_COND_ELSE()) return null;

    // `( if_expr | stmts_block )`: when the else is a plain block, v1's
    // implementation is still exactly right.
    const nested = ctx.if_expr();
    if (!nested) return super.emitElseBranch(ctx as any);

    const cond = this.visit(nested.ternary_expr());
    let out = `if (ctx.truthy(${cond})) ${this.visit(nested.stmts_block(0))}`;
    const alternative = this.emitElseBranch(nested);
    if (alternative !== null) out += ` else ${alternative}`;
    return out;
  }

  // ── Bracketed lists as positional arguments ───────────────────────────────

  /**
   * v4's `pos_args` is a list of `pos_arg`, not of `arith_expr`. Overriding the
   * SEAM rather than `visitPos_args` means `emitSecurity` — which walks the
   * same list to defer its third argument into a thunk — picks the change up
   * without knowing about it.
   */
  protected override positionalArgs(ctx: Pos_argsContext): any[] {
    return (ctx as any).pos_arg?.() ?? super.positionalArgs(ctx as any);
  }

  /** `arith_expr | arith_exprs` — a transparent wrapper either way. */
  visitPos_arg(ctx: Pos_argContext): string {
    const list = ctx.arith_exprs();
    return list ? this.visit(list) : this.visit(ctx.arith_expr()!);
  }

  /**
   * `[o, h, l, c] = security(sym, "D", [open, high, low, close])`.
   *
   * The tuple is the ARGUMENT's, so its width is read off the bracketed list
   * rather than out of the registry — `security` returns one value or four
   * depending on what it was handed, and no single registry entry can say that.
   *
   * Both spellings are read, positional and keyword, because both appear in
   * TradingView's own examples.
   */
  protected override tupleArityFromArgument(call: Fun_callContext): number | null {
    const args = call.fun_actual_args();
    if (!args) return null;

    // `expression` is the third positional parameter of every function in the
    // security family, which is the only place a tuple argument is documented.
    const positional = args.pos_args()?.pos_arg() ?? [];
    const third = this.expressionArity(positional[2]);
    if (third !== null) return third;

    for (const kw of args.kw_args()?.kw_arg() ?? []) {
      if (kw.id().getText() !== "expression") continue;
      const arity = this.expressionArity(kw);
      if (arity !== null) return arity;
    }
    return null;
  }

  /**
   * How many values this `expression` argument yields, when that is knowable.
   *
   * Two shapes, and the second is why this is not just `.arith_exprs()`:
   *
   *     [o, h, l, c] = request.security(sym, "D", [open, high, low, close])
   *     [bop, avg]   = request.security(sym, "1D", dataFunction())
   *
   * The manual's own error-messages page uses the second — a call to a
   * user-defined function whose body ends in a tuple. Its width is a fact about
   * that DEFINITION, which `ScopeInfo.tupleArity` collected for exactly this.
   */
  protected expressionArity(node: any): number | null {
    if (!node) return null;
    const list = node.arith_exprs?.();
    if (list) return list.arith_expr().length;

    const call = this.soleCall(node.arith_expr?.());
    if (!call) return null;
    return this.scopes.tupleArity?.get(call.id().getText()) ?? null;
  }

  /**
   * The call this expression consists of ENTIRELY, or null.
   *
   * Only a single-child spine is followed, so `f() + 1` is not `f()`: the
   * arithmetic makes it one value however many `f` returns.
   */
  protected soleCall(node: any): any | null {
    if (!node) return null;
    if (node.constructor?.name === "Fun_callContext") return node;
    const kids = (node.children ?? []).filter((c: any) => typeof c?.getChildCount === "function");
    return kids.length === 1 ? this.soleCall(kids[0]) : null;
  }
}
