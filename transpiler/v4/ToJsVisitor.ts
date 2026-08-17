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
 *   NAMES (transpiler/profiles/index.ts + runtime)
 *     The 3a rename table — `n` → `bar_index`, `red` → `color.red`,
 *     `period` → `timeframe.period`, and the rest. Those are lookups, not emit
 *     rules, so they do not belong here.
 *
 * NOT in v4, despite an earlier draft of the delta spec saying so: `while` and
 * `switch`. Both are v5. v4 adds no statement keyword at all, which is why this
 * file overrides declarations and nothing else.
 */
import type { PineVersion } from "../version";
import { V3ToJsVisitor } from "../v3/ToJsVisitor";
import type { StdlibEntry } from "../../runtime/v1/stdlib/metadata";
import { BASE_REGISTRY, V4_REGISTRY, V4_NAMESPACE_REGISTRY } from "../../runtime/v1/stdlib";
import { V4_RENAMES, V4_REMOVED } from "../../runtime/v1/stdlib/renames";
import {
  Var_defContext,
  Var_defsContext,
  IdContext,
} from "../../parser/v4/generated/PineV4Parser";

/** Anything carrying a source position (see the v1 base for why it is structural). */
interface SourceLocated {
  start?: { line: number; column: number } | null;
}

/** A declaration's `var` / `varip` modifier, or null when it has neither. */
type Persistence = "var" | "varip" | null;

/**
 * v4's stdlib view, built once: base − removed + namespaced.
 *
 * Module scope rather than per-instance — it is derived from two constants and
 * cannot vary between scripts, and rebuilding a ~250-entry table per compile
 * would be pure waste.
 */
const V4_VIEW: Record<string, StdlibEntry> = (() => {
  const view: Record<string, StdlibEntry> = { ...BASE_REGISTRY };
  for (const name of V4_REMOVED) delete view[name];
  return { ...view, ...V4_NAMESPACE_REGISTRY, ...V4_REGISTRY };
})();

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

    throw this.err(
      ctx,
      `'${name}' was renamed to '${replacement}' in Pine Script v4.`,
    );
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
}
