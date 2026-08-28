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

export class V4ToJsVisitor extends V3ToJsVisitor {
  protected override readonly version: PineVersion = 4;

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
    if (!text.includes(".")) this.enforceRenamedInV4(text, ctx);
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
    const persistence = this.persistenceOf(ctx);
    if (!persistence) return super.visitVar_def(ctx as any);

    // The v3 guards still apply to the initialiser — `var s = nz(s[1])` is a
    // self-reference in v4 exactly as it is in v3.
    this.enforceNoSelfReference(ctx.id().getText(), ctx.arith_expr(), ctx);

    const name = this.visit(ctx.id());
    const value = this.visit(ctx.arith_expr());
    const key = this.getLocId(ctx as SourceLocated);
    const ip = persistence === "varip" ? ", true" : "";

    return `let ${name} = ctx.var_def("${name}", "${key}", () => (${value})${ip})`;
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
   * self-contained: `visitOr_expr` produces `a || b` with no brackets, so
   * `x *= a or b` would otherwise bind as `(x * a) || b`.
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
    if (!op) return super.visitVar_assign(ctx as any);

    this.enforceDeclaredBeforeReassignment(ctx as any);
    const name = this.visit(ctx.id());
    const value = this.visit(ctx.arith_expr());
    return `${name} = ctx.new_var("${name}", ${this.compoundValue(op, name, value)})`;
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
    const third = positional[2]?.arith_exprs();
    if (third) return third.arith_expr().length;

    for (const kw of args.kw_args()?.kw_arg() ?? []) {
      if (kw.id().getText() !== "expression") continue;
      const list = kw.arith_exprs();
      if (list) return list.arith_expr().length;
    }
    return null;
  }
}
