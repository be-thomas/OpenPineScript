/**
 * Static facts the v6 emitter needs about an expression, and the tables of
 * names the migration guide's rules apply to.
 *
 * ── The rule every predicate here follows ──────────────────────────────────
 *
 * Each answers "PROVABLY", never "probably". These feed compile errors, and
 * the two ways to be wrong are not symmetric: a missed case compiles a script
 * TradingView would have rejected — the status quo at v5 — while a false
 * positive rejects a correct script outright. So a predicate that cannot prove
 * its answer says no. This is the same contract `isStaticallyBool` in
 * ../common/passes/ScopeAnalysis.ts states, and the two are meant to be read
 * together.
 *
 * Source for every table: the v6 migration guide,
 * https://www.tradingview.com/pine-script-docs/migration-guides/to-pine-version-6/
 */
import type { ScopeInfo } from "../common/passes/ScopeAnalysis";

/** Duck-typed node access — the generated contexts share no usable base type. */
export function kids(node: any): any[] {
  const out: any[] = [];
  const n = typeof node?.getChildCount === "function" ? node.getChildCount() : 0;
  for (let i = 0; i < n; i++) out.push(node.getChild(i));
  return out;
}

export function ruleName(node: any): string {
  return node?.constructor?.name ?? "";
}

/** The rule-context children of a node, skipping terminal tokens. */
function ruleKids(node: any): any[] {
  return kids(node).filter(c => typeof c?.getChildCount === "function" && !c.symbol);
}

/**
 * Descend through single-child wrapper rules (arith_expr → ternary_expr → …
 * → atom) to the node that actually decides an expression's shape.
 */
const STOP_AT = new Set([
  "IdContext", "Fun_callContext", "Num_literalContext", "Other_literalContext",
]);

export function unwrap(node: any): any {
  let cur = node;
  for (;;) {
    const k = ruleName(cur);
    // An id is one child (id_part) deep, and a literal one token deep, but
    // descending into either loses what it is.
    if (STOP_AT.has(k)) return cur;
    if (k === "AtomContext" && cur.arith_expr?.()) { cur = cur.arith_expr(); continue; }
    const rk = ruleKids(cur);
    if (rk.length === 1 && kids(cur).length === 1) { cur = rk[0]; continue; }
    return cur;
  }
}

/**
 * The built-in variables whose type is int or float on every bar. Listed
 * rather than read off the registry because the registry's OHLCV entries are
 * bound into the sandbox as data and have no type there — see the note on
 * RUNTIME_GLOBALS in transpiler/v1/ToJsVisitor.ts.
 */
const NUMERIC_BUILTINS = new Set([
  "open", "high", "low", "close", "volume", "hl2", "hlc3", "ohlc4", "hlcc4",
  "bar_index", "last_bar_index", "time", "time_close", "timenow",
  "year", "month", "weekofyear", "dayofmonth", "dayofweek", "hour", "minute", "second",
]);

/**
 * Built-in calls that always return a number. Deliberately short: a call is
 * listed only when no overload returns anything else. `ta.change` is absent
 * because its bool overload returns a bool; `ta.cross` because it is one.
 */
const NUMERIC_CALL_PREFIXES = ["math."];
const NUMERIC_CALLS = new Set([
  "input.int", "input.float", "input.price", "input.source",
  "ta.sma", "ta.ema", "ta.rma", "ta.wma", "ta.vwma", "ta.hma", "ta.alma", "ta.swma",
  "ta.rsi", "ta.atr", "ta.tr", "ta.stdev", "ta.variance", "ta.highest", "ta.lowest",
  "ta.cci", "ta.mfi", "ta.mom", "ta.roc", "ta.cum", "ta.wpr", "ta.cog",
  "int", "float",
]);

/** Is `node` provably an int or float value? */
export function isStaticallyNumeric(node: any, scopes: ScopeInfo): boolean {
  const n = unwrap(node);
  const k = ruleName(n);

  if (k === "Num_literalContext") return true;

  // `-x` / `+x` is numeric exactly when x is; `not x` is handled by the bool
  // rules and is never numeric.
  if (k === "Unary_exprContext") {
    if (n.NOT?.()) return false;
    if (n.MINUS?.() || n.PLUS?.()) return isStaticallyNumeric(n.sqbr_expr(), scopes);
    return isStaticallyNumeric(n.sqbr_expr(), scopes);
  }

  // `*`, `/` and `%` have no string or bool overload in Pine.
  if (k === "Mult_exprContext" && n.unary_expr().length > 1) return true;

  // `-` is numeric only; `+` is also string concatenation, so it is numeric
  // only when every operand is.
  if (k === "Add_exprContext" && n.mult_expr().length > 1) {
    const ops = kids(n).filter((_: any, i: number) => i % 2 === 1).map((t: any) => t.getText());
    if (ops.includes("-")) return true;
    return n.mult_expr().every((e: any) => isStaticallyNumeric(e, scopes));
  }

  // `close[1]` has the type of `close`.
  if (k === "Sqbr_exprContext") return isStaticallyNumeric(n.atom(), scopes);

  if (k === "IdContext") {
    const name = n.getText();
    // A script binding SHADOWS a built-in of the same name, so a script that
    // declares `time = "noon"` must not have `time` read as numeric.
    // A name a function binds as a parameter or local may not be the
    // script-scope variable of the same name at this point — and this pass
    // does not track which function it is in. Not provable, so not numeric.
    if (scopes.functionScoped.has(name)) return false;
    if (scopes.bound.has(name)) {
      const t = scopes.staticTypes.get(name);
      return t === "int" || t === "float";
    }
    return NUMERIC_BUILTINS.has(name);
  }

  if (k === "Fun_callContext") {
    if (n.call_suffix?.()?.length) return false;
    const callee = n.id().getText();
    if (scopes.functions.has(callee)) return false;
    return NUMERIC_CALLS.has(callee) || NUMERIC_CALL_PREFIXES.some(p => callee.startsWith(p));
  }

  return false;
}

/** The type name to put in a diagnostic for a numeric node: int, or float. */
export function numericTypeName(node: any, scopes: ScopeInfo): "int" | "float" {
  const n = unwrap(node);
  if (ruleName(n) === "Num_literalContext") return n.INT_LITERAL?.() ? "int" : "float";
  if (ruleName(n) === "IdContext") {
    const t = scopes.staticTypes.get(n.getText());
    if (t === "int") return "int";
    if (n.getText() === "bar_index" || n.getText() === "last_bar_index") return "int";
  }
  return "float";
}

/** Is `node` a literal value — `6`, `"text"`, `true`, `#FF0000`? */
export function isLiteral(node: any): boolean {
  const n = unwrap(node);
  const k = ruleName(n);
  return k === "Num_literalContext" || k === "Other_literalContext" || k === "LiteralContext";
}

/** Is `node` the bare identifier `na`? */
export function isNaLiteral(node: any): boolean {
  const n = unwrap(node);
  return ruleName(n) === "IdContext" && n.getText() === "na";
}

/**
 * MG §"Removal of `when` parameter": removed from these seven functions.
 */
export const WHEN_REMOVED = new Set([
  "strategy.entry", "strategy.order", "strategy.exit", "strategy.close",
  "strategy.close_all", "strategy.cancel", "strategy.cancel_all",
]);

/**
 * MG §"The `transp` parameter is removed": from these six functions.
 */
export const TRANSP_REMOVED = new Set([
  "bgcolor", "fill", "plot", "plotarrow", "plotchar", "plotshape",
]);

/**
 * MG §"Unique parameters cannot be na": parameters of a UNIQUE type reject na.
 *
 * Only the unique types TradingView's docs NAME are here. The type-system page
 * says "plot.style_line and other plot.style_* constants are of the
 * plot_style type", and lists `plot_display` and `barmerge_gaps` as unique
 * types for specific built-ins. Most other constant families — `shape.*`,
 * `size.*`, `xloc.*`, `location.*`, `line.style_*` … — are, as far as the
 * reference can be read, `const string`, which CAN be na; treating them as
 * unique rejected valid v6 (`s = if c` → `size.small`, with no `else`).
 *
 * Keyed by callee, with "*" for a parameter that has the type everywhere it
 * appears. A family whose type is confirmed later is a one-line addition.
 */
const UNIQUE_PARAMS_BY_CALLEE: Readonly<Record<string, readonly string[]>> = {
  "plot": ["style"],
  "request.security": ["gaps"],
  "*": ["display"],
};

/** Does `callee`'s parameter `name` take a unique type? Built-ins only. */
export function isUniqueParam(callee: string, name: string): boolean {
  return (UNIQUE_PARAMS_BY_CALLEE[callee] ?? []).includes(name)
    || UNIQUE_PARAMS_BY_CALLEE["*"].includes(name);
}

/**
 * The namespaces whose members are values of a DOCUMENTED unique type. An
 * `if` or `switch` whose branches yield one of these needs an `else` / default
 * arm in v6 (MG §"Unique parameters cannot be na") — the guide's own example
 * is a `plot.style_*` switch.
 */
const UNIQUE_PREFIXES = [
  // The documented unique types; see UNIQUE_PARAMS_BY_CALLEE for the source.
  "plot.style_", "display.", "barmerge.gaps_",
];

/** Is `node` a bare read of a unique-type constant, like `plot.style_line`? */
export function isUniqueConstant(node: any): boolean {
  const n = unwrap(node);
  if (ruleName(n) !== "IdContext") return false;
  const t = n.getText();
  return UNIQUE_PREFIXES.some(p => t.startsWith(p));
}

/**
 * Parameters of built-ins that take a "simple" length, where v6 makes passing
 * a mutable variable a compile error (MG §"Mutable variables are always
 * series"). The guide's own example is `ta.ema`; each entry below is a
 * parameter the reference manual types as "simple int". Indices are the
 * POSITIONAL slot, names the keyword.
 */
export const SIMPLE_LENGTH_PARAMS: ReadonlyMap<string, ReadonlyArray<[number, string]>> = new Map([
  ["ta.ema", [[1, "length"]]],
  ["ta.rma", [[1, "length"]]],
  ["ta.rsi", [[1, "length"]]],
  ["ta.atr", [[0, "length"]]],
  ["ta.macd", [[1, "fastlen"], [2, "slowlen"], [3, "siglen"]]],
]);

/**
 * Built-in reads that are "series" — they change bar to bar. Used by the
 * `offset` rule, which needs "simple" or weaker.
 */
const SERIES_BUILTINS = new Set([
  ...NUMERIC_BUILTINS,
]);

/**
 * Is `node` provably a "series" value?
 *
 * True when it reads a bar-varying built-in, calls a `ta.*` or `request.*`
 * function, or reads a variable that is reassigned with `:=` — which v6 makes
 * series unconditionally (MG §"Mutable variables are always series").
 */
export function isStaticallySeries(node: any, scopes: ScopeInfo): boolean {
  let found = false;
  const walk = (x: any): void => {
    if (found || !x) return;
    const k = ruleName(x);
    if (k === "IdContext") {
      const name = x.getText();
      // `mutated` is script scope; a function's own `len` is not that one.
      if (scopes.mutated.has(name) && !scopes.functionScoped.has(name)) { found = true; return; }
      if (!scopes.bound.has(name) && SERIES_BUILTINS.has(name)) { found = true; return; }
    }
    if (k === "Fun_callContext") {
      const callee = x.id?.()?.getText?.() ?? "";
      if (callee.startsWith("ta.") || callee.startsWith("request.")) { found = true; return; }
    }
    for (const c of kids(x)) walk(c);
  };
  walk(node);
  return found;
}

/**
 * Does `node` read a numeric literal below 1 — `0`, `-5`, `0.5`?
 *
 * MG §"Minimum linewidth is 1". Only literals are decided here: a computed
 * width is a run-time value on TradingView too.
 */
export function isLiteralBelowOne(node: any): boolean {
  const n = unwrap(node);
  const k = ruleName(n);
  if (k === "Num_literalContext") return Number(n.getText()) < 1;
  if (k === "Unary_exprContext" && n.MINUS?.()) {
    const inner = unwrap(n.sqbr_expr());
    return ruleName(inner) === "Num_literalContext";
  }
  return false;
}

// ── dynamic_requests ────────────────────────────────────────────────────────

/** The script's declaration call — indicator(), strategy() or library(). */
function declaration(root: any): any | null {
  let found: any = null;
  const walk = (x: any): void => {
    if (found || !x) return;
    if (ruleName(x) === "Fun_callContext") {
      const name = x.id?.()?.getText?.();
      if (name === "indicator" || name === "strategy" || name === "library") { found = x; return; }
    }
    for (const c of kids(x)) walk(c);
  };
  walk(root);
  return found;
}

/** Does the declaration pass `dynamic_requests = false`? */
export function declaresStaticRequests(root: any): boolean {
  const decl = declaration(root);
  const args = decl?.fun_actual_args?.()?.kw_args?.()?.kw_arg?.() ?? [];
  return args.some((a: any) =>
    a.id().getText() === "dynamic_requests" && unwrap(a.arith_expr?.())?.getText?.() === "false");
}

/** Every call name in a subtree. */
function callsIn(node: any, out: Set<string> = new Set()): Set<string> {
  if (!node) return out;
  if (ruleName(node) === "Fun_callContext") {
    const name = node.id?.()?.getText?.();
    if (name) out.add(name);
  }
  for (const c of kids(node)) callsIn(c, out);
  return out;
}

/**
 * User functions that reach a `request.*()` call, directly or by calling
 * another such function. A fixed point over the call graph, because the
 * wrapper may itself be wrapped.
 */
export function findRequestingFunctions(root: any): Set<string> {
  const bodies = new Map<string, Set<string>>();
  const walk = (x: any): void => {
    if (!x) return;
    const k = ruleName(x);
    if (k === "Fun_def_singlelineContext" || k === "Fun_def_multilineContext") {
      const name = x.id?.()?.getText?.();
      if (name) bodies.set(name, callsIn(x));
    }
    for (const c of kids(x)) walk(c);
  };
  walk(root);

  const requesting = new Set<string>();
  for (let changed = true; changed;) {
    changed = false;
    for (const [name, calls] of bodies) {
      if (requesting.has(name)) continue;
      if ([...calls].some(c => c.startsWith("request.") || requesting.has(c))) {
        requesting.add(name);
        changed = true;
      }
    }
  }
  return requesting;
}

/** The structures whose BODY is a loop or conditional scope. */
const CONDITIONAL_SCOPES = new Set([
  "If_exprContext", "For_exprContext", "For_in_exprContext", "While_exprContext",
  "Switch_exprContext", "Once_exprContext",
]);

/**
 * Is `node` inside the body of a loop or conditional? Stops at a function
 * definition: a function's body is its own scope, and whether IT runs
 * conditionally is decided where it is called.
 *
 * "Body", not condition: `if request.security(…) > 0` evaluates the request in
 * the enclosing scope, so only a request below a block counts.
 */
export function insideConditionalOrLoop(node: any): boolean {
  let child = node;
  let cur = node?.parent;
  while (cur) {
    const k = ruleName(cur);
    if (k === "Fun_def_singlelineContext" || k === "Fun_def_multilineContext") return false;
    if (CONDITIONAL_SCOPES.has(k)) {
      const ck = ruleName(child);
      if (ck === "Stmts_blockContext" || ck === "Switch_bodyContext") return true;
    }
    child = cur;
    cur = cur.parent;
  }
  return false;
}

// ── Scripts TradingView's editor refuses ───────────────────────────────────

/** `dynamic_requests` as the declaration states it: "true", "false", or absent. */
export function dynamicRequestsSetting(root: any): string | null {
  const args = declaration(root)?.fun_actual_args?.()?.kw_args?.()?.kw_arg?.() ?? [];
  const a = args.find((k: any) => k.id().getText() === "dynamic_requests");
  return a ? (unwrap(a.arith_expr?.())?.getText?.() ?? null) : null;
}

/** The name of the script's declaration call: indicator, strategy or library. */
export function declarationName(root: any): string | null {
  return declaration(root)?.id?.()?.getText?.() ?? null;
}

/** Every call name in the script. */
export function allCallNames(root: any): Set<string> {
  return callsIn(root);
}

/** The calls that make an `indicator()` script display something. */
const INDICATOR_OUTPUTS = new Set([
  "plot", "plotshape", "plotchar", "plotarrow", "plotbar", "plotcandle",
  "barcolor", "bgcolor", "hline", "fill", "alertcondition",
  "line.new", "label.new", "box.new", "table.new", "polyline.new",
  // Not in TradingView's message, but a log-only indicator loads on the chart
  // (dev-docs/tv-parity/_probes/compile-checks/20261112-040624_BINANCE_BTCUSDT_5m).
  "log.info", "log.warning", "log.error",
]);

export function hasIndicatorOutput(root: any): boolean {
  for (const name of callsIn(root)) if (INDICATOR_OUTPUTS.has(name)) return true;
  return false;
}

const COLOR_CONSTANTS = new Set([
  "aqua", "black", "blue", "fuchsia", "gray", "green", "lime", "maroon", "navy",
  "olive", "orange", "purple", "red", "silver", "teal", "white", "yellow",
]);

/**
 * Is `node` PROVABLY a colour: a `color.*` constant, a `color.new/rgb/
 * from_gradient` result, or a `#hex` literal.
 */
export function isColorExpression(node: any): boolean {
  const n = unwrap(node);
  const text: string = n?.getText?.() ?? "";
  if (/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(text)) return true;
  if (ruleName(n) === "Fun_callContext") return /^color\.(new|rgb|from_gradient)$/.test(n.id().getText());
  const m = /^color\.(\w+)$/.exec(text);
  return ruleName(n) === "IdContext" && !!m && COLOR_CONSTANTS.has(m[1]);
}
