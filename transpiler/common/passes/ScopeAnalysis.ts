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
  /**
   * Names assigned with ':=' AT SCRIPT SCOPE.
   *
   * Scope-aware for the same reason `declared` is. These were collected
   * script-wide, so a function local shadowing a global made the global look
   * mutable, and v3's security() guard rejected valid code:
   *
   *     f(z) =>
   *         src = z
   *         src := src * 2      // function-local
   *         src
   *     src = close             // never mutated
   *     a = security(tickerid, "D", src)   → "cannot use mutable variable 'src'"
   */
  mutated: ReadonlySet<string>;
  /**
   * Names whose declared value is statically a boolean, AT SCRIPT SCOPE.
   *
   * Same fix, same reason — a function-local `up = close > open` made a global
   * numeric `up` look boolean and v3's arithmetic guard rejected `up + 1`.
   *
   * The trade-off is a false NEGATIVE inside function bodies: bool arithmetic on
   * a function-local is no longer caught statically. That is the safe direction —
   * the runtime backstop in the arithmetic helpers still sees it, whereas a false
   * positive rejects a script outright.
   */
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
  /**
   * name → the LOCAL SCOPE of each of its bindings, `null` for a binding at
   * script scope.
   *
   * From the manual's programming FAQ: "The global scope is all of the script
   * that is not inside a function, if statement, or other conditional
   * structure", and "only code that is in the same local scope can access a
   * local variable."
   *
   * `bound` and `declared` are flat sets, so a name bound only inside an `if`
   * block looked declared everywhere. TradingView's own "Scope demo" —
   *
   *     if barstate.isconfirmed
   *         int localValue = close > open ? 1 : -1
   *     plot(localValue, ...)
   *
   * — exists to show that this is an error, and the page names it: "gives an
   * 'Undeclared identifier' error when we try to access a local variable from
   * the global scope". Here it emitted `opsv2_localValue`, which `with(sandbox)`
   * turned into a ReferenceError on the first bar. It was the last such crash
   * in the whole documentation corpus.
   *
   * A SPAN rather than a depth, because visibility is a question about two
   * positions and not about nesting: a name bound in one block is invisible in
   * its SIBLING, which is at the same depth.
   */
  scopesOf: ReadonlyMap<string, ReadonlyArray<Span | null>>;
  /**
   * user function name → how many values its tuple body returns.
   *
   * "Programmers can write functions that return multiple values or references
   *  by using a tuple as the FINAL STATEMENT in the function's body" — so the
   * arity is a property of the definition and nothing else can supply it. The
   * destructuring site needs it to check `[a, b] = f()` against `f`, and Pine
   * permits forward references, so it cannot be read off the emitter's own
   * left-to-right walk.
   *
   * Absent for a function whose last statement is not a `[ ... ]` list, which
   * is how the destructuring site tells "returns a tuple of the wrong size"
   * from "does not return a tuple at all".
   */
  tupleArity: ReadonlyMap<string, number>;
}

/** Half-open in neither direction: both token indices are inside the scope. */
export interface Span {
  start: number;
  stop: number;
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

/**
 * The rules that INTRODUCE a local scope.
 *
 * `local_stmts_multiline` is the body of every indented block — v1's grammar
 * routes an `if`, `for` and function body alike through
 * `stmts_block : fun_body_multiline : local_stmts_multiline` — so one entry
 * covers all of them, in every version. `local_stmt_singleline` is the other
 * body form: a single-line function, and a v5 switch arm.
 */
const SCOPE_RULES = new Set([
  "Local_stmts_multilineContext",
  "Local_stmt_singlelineContext",
]);

/** The contents of the LAST statement line of an indented block. */
function lastContents(node: any): any[] | null {
  const multi = node?.local_stmts_multiline?.()
    ?? node?.fun_body_multiline?.()?.local_stmts_multiline?.();
  const lines = multi?.local_stmts_list?.()?.local_stmt_multiline?.();
  return lines?.[lines.length - 1]?.local_stmt_content?.() ?? null;
}

/**
 * The number of elements in the `[ ... ]` list a body ENDS with, or null when
 * it ends with anything else.
 *
 * Duck-typed down every body shape — `f() => [a, b]`, an indented block whose
 * last line is `[a, b]`, and an `if` whose BRANCHES each end in one — because
 * they share no rule. The third is not an exotic case: TradingView's own v4
 * drawings page ends `pivots()` with
 *
 *     if isFound and length * 2 <= bar_index
 *         [bar_index[length], p]
 *     else
 *         [int(na), float(na)]
 *
 * and an `if` in value position evaluates to whichever branch runs, so its
 * arity is the branches'. The first branch that answers decides — Pine requires
 * them to agree, and disagreeing is the callee's error rather than this pass's.
 */
function tupleArityOfContents(contents: any[] | null): number | null {
  const last = contents?.[contents.length - 1];
  if (!last) return null;

  const list = last.arith_exprs?.();
  if (list) return list.arith_expr?.().length ?? null;

  // `local_stmt_content` reaches if_expr through the transparent `arith_expr`
  // wrapper; `global_stmt_content` names it directly.
  const conditional = last.if_expr?.() ?? last.arith_expr?.()?.if_expr?.();
  return conditional ? tupleArityOfIf(conditional) : null;
}

function tupleArityOfIf(node: any): number | null {
  for (const block of node.stmts_block?.() ?? []) {
    const arity = tupleArityOfContents(lastContents(block));
    if (arity !== null) return arity;
  }
  // v4's `else if` puts another if_expr where the else block would be.
  const chained = node.if_expr?.();
  return chained ? tupleArityOfIf(chained) : null;
}

function tupleArityOfBody(node: any): number | null {
  const single =
    node.fun_body_singleline?.()?.local_stmt_singleline?.()?.local_stmt_content?.();
  if (single) return tupleArityOfContents(single);
  return tupleArityOfContents(lastContents(node.fun_body_multiline?.()));
}

function spanOf(node: any): Span | null {
  const start = node?.start?.tokenIndex;
  const stop = node?.stop?.tokenIndex;
  return typeof start === "number" && typeof stop === "number" ? { start, stop } : null;
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
  readonly scopesOf = new Map<string, Array<Span | null>>();
  readonly tupleArity = new Map<string, number>();

  /** The local scopes currently open, innermost last. */
  private scopeStack: Array<Span | null> = [];

  /** Records that `name` is bound in whatever scope is open here. */
  private record(name: string): void {
    const scope = this.scopeStack.length ? this.scopeStack[this.scopeStack.length - 1] : null;
    const list = this.scopesOf.get(name);
    if (list) list.push(scope);
    else this.scopesOf.set(name, [scope]);
  }

  walk(node: any): void {
    if (!node) return;
    const kind = ruleName(node);

    if (SCOPE_RULES.has(kind)) {
      this.scopeStack.push(spanOf(node));
      for (const child of children(node)) this.walk(child);
      this.scopeStack.pop();
      return;
    }

    switch (kind) {
      case "Fun_def_singlelineContext":
      case "Fun_def_multilineContext": {
        const name = textOf(node.id?.());
        if (name) {
          this.functions.add(name);
          this.bound.add(name);
          this.record(name);
          const arity = tupleArityOfBody(node);
          if (arity !== null) this.tupleArity.set(name, arity);
        }

        // Parameters belong to the FUNCTION, not to the scope its declaration
        // sits in: without a scope of their own they would read as visible
        // script-wide. The span is the whole `fun_def` rather than just the
        // body, because `fun_head` is lexically OUTSIDE the body and the
        // parameter list is itself a read of every parameter — scoping them to
        // the body alone rejected the declaration site of 129 published
        // scripts, the first parameter of the first function in each.
        this.scopeStack.push(spanOf(node));
        // Parameters are bound inside the body; record them so a reference to a
        // parameter is never mistaken for a forward reference to a global.
        //
        // Two shapes, because v5 gave parameters types and defaults:
        //
        //   v1-v4   fun_head : LPAR ( id ( COMMA id )* )? RPAR
        //   v5      fun_head : LPAR ( fun_param ( COMMA fun_param )* )? RPAR
        //
        // Reading only `head.id()` therefore found NOTHING at v5, so every
        // parameter looked unbound — which took `self` in a method body with
        // it, and a method's whole job is to read `self.field`.
        const head = node.fun_head?.();
        const params = head?.fun_param?.()?.map((p: any) => p.id?.()) ?? head?.id?.() ?? [];
        for (const p of params) {
          const name = textOf(p);
          if (!name) continue;
          this.bound.add(name);
          this.functionScoped.add(name);
          this.record(name);
        }

        // Walk the body with fnDepth raised so its LOCAL declarations are not
        // recorded as script-scope. A function named md() whose body declares a
        // local `md` must not make an earlier md(...) call look like a forward
        // reference to that local.
        this.fnDepth++;
        for (const child of children(node)) this.walk(child);
        this.fnDepth--;
        this.scopeStack.pop();
        return;
      }

      case "Var_defContext": {
        const name = textOf(node.id?.());
        if (name) {
          this.bound.add(name);
          this.record(name);
          // Only script-scope declarations participate in forward-reference
          // checks; a function-local binding is invisible outside its body.
          if (this.fnDepth === 0 && !this.declared.has(name)) {
            this.declared.set(name, positionOf(node));
          }
          if (this.fnDepth > 0) this.functionScoped.add(name);
          // Script scope only — see the note on `booleans` above.
          if (this.fnDepth === 0 && isStaticallyBool(node.arith_expr?.(), this.booleans)) {
            this.booleans.add(name);
          }
        }
        break;
      }

      case "Var_defsContext": {
        // Destructuring: [a, b] = f()
        for (const id of node.ids_array?.()?.id?.() ?? []) {
          const name = textOf(id);
          if (!name) continue;
          this.bound.add(name);
          this.record(name);
          if (this.fnDepth === 0 && !this.declared.has(name)) {
            this.declared.set(name, positionOf(node));
          }
        }
        break;
      }

      case "For_in_exprContext": {
        // `for item in xs` and `for [i, item] in xs` bind their loop variables
        // for the body's lifetime. Without this they look undeclared, and v1's
        // `checkUndeclaredRead` rejects the loop body outright — the variable
        // that the loop exists to produce being the one name it cannot read.
        //
        // v5-only: no earlier grammar has this rule, so the case never fires
        // there. Recorded as function-scoped for the same reason a parameter
        // is — the binding is local to the block, so it must not be mistaken
        // for a script-scope declaration of the same name.
        const ids = node.ids_array?.()?.id?.() ?? [node.id?.()];
        for (const id of ids) {
          const name = textOf(id);
          if (!name) continue;
          this.bound.add(name);
          this.functionScoped.add(name);
          this.record(name);
        }
        break;
      }

      case "Var_assignContext": {
        const name = textOf(node.id?.());
        if (name) {
          this.bound.add(name);
          if (this.fnDepth > 0) {
            // A function-local ':=' says nothing about a same-named global —
            // see the note on `mutated` above.
            this.functionScoped.add(name);
            break;
          }
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
    scopesOf: c.scopesOf,
    tupleArity: c.tupleArity,
  };
}
