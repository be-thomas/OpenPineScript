/**
 * Pre-emit analysis pass.
 *
 * Collects facts about the whole script that a single-pass emitter cannot see,
 * because they depend on code that appears LATER in the file:
 *
 *  - which identifiers are declared, and where (forward-reference detection)
 *  - which identifiers are ever mutated with ':=' (v3 forbids passing those to
 *    security(), because the HTF sub-evaluation would see the wrong value)
 *  - which identifiers hold a boolean (v3 forbids implicit bool→number
 *    arithmetic, and the operand is usually a variable rather than a literal)
 *
 * Runs before ToJsVisitor and hands it a read-only ScopeInfo.
 */

import type { ParseTree, ParserRuleContext } from "antlr4ng";

export interface Declaration {
  line: number;
  column: number;
}

export interface ScopeInfo {
  /** name → position of its first '=' binding, script scope only. */
  declared: ReadonlyMap<string, Declaration>;
  /** names ever assigned with ':='. */
  mutated: ReadonlySet<string>;
  /** names whose declared value is statically a boolean. */
  booleans: ReadonlySet<string>;
  /** user-defined function names. */
  functions: ReadonlySet<string>;
  /** all identifiers bound anywhere, including function parameters and loop vars. */
  bound: ReadonlySet<string>;
  /**
   * Names bound INSIDE a function body — parameters and locals.
   *
   * A function body runs at CALL time, so a name that is local to a function
   * says nothing about the lexical position of a same-named global. Without
   * this, a function whose body declares `src` was reported as forward-
   * referencing a global `src` declared further down the file, which rejected
   * valid published code (v3/cci_commodity_channel_index.pine).
   */
  functionScoped: ReadonlySet<string>;
}

/** Duck-typed node access — the generated contexts do not share a usable base type. */
function children(node: any): any[] {
  const out: any[] = [];
  const n = typeof node?.getChildCount === "function" ? node.getChildCount() : 0;
  for (let i = 0; i < n; i++) out.push(node.getChild(i));
  return out;
}

function ruleName(node: any): string {
  return node?.constructor?.name ?? "";
}

function textOf(node: any): string {
  return typeof node?.getText === "function" ? node.getText() : "";
}

function positionOf(node: any): Declaration {
  return { line: node?.start?.line ?? 0, column: node?.start?.column ?? 0 };
}

/**
 * Is this expression statically known to be a boolean?
 *
 * Deliberately conservative — it answers "provably bool", not "possibly bool".
 * A false negative is caught by the runtime backstop in the arithmetic
 * helpers; a false positive would reject valid code.
 */
export function isStaticallyBool(node: any, booleans: ReadonlySet<string>): boolean {
  if (!node) return false;
  const kind = ruleName(node);

  // true / false literal
  if (kind === "Other_literalContext" && typeof node.BOOL_LITERAL === "function" && node.BOOL_LITERAL()) {
    return true;
  }

  // Comparison and equality yield bool when an operator is actually present.
  if (kind === "Eq_exprContext" && node.cmp_expr?.().length > 1) return true;
  if (kind === "Cmp_exprContext" && node.add_expr?.().length > 1) return true;

  // and / or / not
  if (kind === "Or_exprContext" && node.and_expr?.().length > 1) return true;
  if (kind === "And_exprContext" && node.eq_expr?.().length > 1) return true;
  if (kind === "Unary_exprContext" && typeof node.NOT === "function" && node.NOT()) return true;

  // A bare identifier previously bound to a boolean.
  if (kind === "IdContext") return booleans.has(textOf(node));

  // Single-child wrapper rules (arith_expr → ternary_expr → or_expr → ...):
  // descend so the classification survives the chain.
  const kids = children(node).filter(c => typeof c?.getChildCount === "function");
  if (kids.length === 1) return isStaticallyBool(kids[0], booleans);

  // atom wrapping a parenthesised expression or an id
  if (kind === "AtomContext") {
    for (const kid of kids) {
      if (isStaticallyBool(kid, booleans)) return true;
    }
  }

  return false;
}

class Collector {
  /** Depth of function bodies currently being walked. */
  private fnDepth = 0;
  readonly declared = new Map<string, Declaration>();
  readonly mutated = new Set<string>();
  readonly booleans = new Set<string>();
  readonly functions = new Set<string>();
  readonly bound = new Set<string>();
  readonly functionScoped = new Set<string>();

  walk(node: any): void {
    if (!node) return;
    const kind = ruleName(node);

    switch (kind) {
      case "Fun_def_singlelineContext":
      case "Fun_def_multilineContext": {
        const name = textOf(node.id?.());
        if (name) { this.functions.add(name); this.bound.add(name); }
        // Parameters are bound inside the body; record them so a reference to a
        // parameter is never mistaken for a forward reference to a global.
        const head = node.fun_head?.();
        for (const p of head?.id?.() ?? []) {
          this.bound.add(textOf(p));
          this.functionScoped.add(textOf(p));
        }

        // Walk the body with fnDepth raised so its LOCAL declarations are not
        // recorded as script-scope. A function named md() whose body declares a
        // local `md` must not make an earlier md(...) call look like a forward
        // reference to that local.
        this.fnDepth++;
        for (const child of children(node)) this.walk(child);
        this.fnDepth--;
        return;
      }

      case "Var_defContext": {
        const name = textOf(node.id?.());
        if (name) {
          this.bound.add(name);
          // Only script-scope declarations participate in forward-reference
          // checks; a function-local binding is invisible outside its body.
          if (this.fnDepth === 0 && !this.declared.has(name)) {
            this.declared.set(name, positionOf(node));
          }
          if (this.fnDepth > 0) this.functionScoped.add(name);
          if (isStaticallyBool(node.arith_expr?.(), this.booleans)) this.booleans.add(name);
        }
        break;
      }

      case "Var_defsContext": {
        // Destructuring: [a, b] = f()
        for (const id of node.ids_array?.()?.id?.() ?? []) {
          const name = textOf(id);
          if (!name) continue;
          this.bound.add(name);
          if (this.fnDepth === 0 && !this.declared.has(name)) {
            this.declared.set(name, positionOf(node));
          }
        }
        break;
      }

      case "Var_assignContext": {
        const name = textOf(node.id?.());
        if (name) {
          this.mutated.add(name);
          // A variable assigned a boolean is a boolean from then on.
          if (isStaticallyBool(node.arith_expr?.(), this.booleans)) this.booleans.add(name);
        }
        break;
      }
    }

    for (const child of children(node)) this.walk(child);
  }
}

export function analyseScopes(tree: ParseTree | ParserRuleContext): ScopeInfo {
  const c = new Collector();
  c.walk(tree);
  return {
    declared: c.declared,
    mutated: c.mutated,
    booleans: c.booleans,
    functions: c.functions,
    bound: c.bound,
    functionScoped: c.functionScoped,
  };
}
