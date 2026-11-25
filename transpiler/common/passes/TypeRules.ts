/**
 * What the emitter can PROVE about the type of an expression, for the type
 * errors TradingView raises at compile time (v4+): a float stored in an `int`,
 * a float passed where an `int` length is required.
 *
 * Every answer here is "provably", never "probably". A false positive rejects
 * a script TradingView accepts; a miss leaves the status quo. So anything not
 * listed below is "unknown", and unknown never produces an error. Narrower than
 * `isStaticallyNumeric` in ../../v6/rules.ts on purpose: that one answers
 * "int or float", this one answers "float".
 */
import type { ScopeInfo } from "./ScopeAnalysis";

function kids(node: any): any[] {
  const out: any[] = [];
  const n = typeof node?.getChildCount === "function" ? node.getChildCount() : 0;
  for (let i = 0; i < n; i++) out.push(node.getChild(i));
  return out;
}

function ruleName(node: any): string {
  return node?.constructor?.name ?? "";
}

const STOP_AT = new Set([
  "IdContext", "Fun_callContext", "Num_literalContext", "Other_literalContext",
]);

/** Descend through single-child wrapper rules to the node that decides the shape. */
function unwrap(node: any): any {
  let cur = node;
  for (;;) {
    const k = ruleName(cur);
    if (STOP_AT.has(k)) return cur;
    if (k === "AtomContext" && cur.arith_expr?.()) { cur = cur.arith_expr(); continue; }
    if (k === "Pos_argContext" && cur.arith_expr?.()) { cur = cur.arith_expr(); continue; }
    const rk = kids(cur).filter(c => typeof c?.getChildCount === "function" && !c.symbol);
    if (rk.length === 1 && kids(cur).length === 1) { cur = rk[0]; continue; }
    return cur;
  }
}

/** Built-in series that are floats on every bar. */
const FLOAT_BUILTINS = new Set([
  "open", "high", "low", "close", "volume", "hl2", "hlc3", "ohlc4", "hlcc4",
  "strategy.position_size", "strategy.position_avg_price", "strategy.equity",
  "strategy.netprofit", "strategy.openprofit", "strategy.initial_capital",
]);

/** Calls that return a float whatever their arguments. */
const FLOAT_CALLS = new Set([
  "float",
  "math.sqrt", "math.log", "math.log10", "math.exp", "math.pow", "math.avg",
  "math.sin", "math.cos", "math.tan", "math.asin", "math.acos", "math.atan",
  "sqrt", "log", "log10", "exp", "pow", "avg", "sin", "cos", "tan", "asin", "acos", "atan",
  "ta.sma", "ta.ema", "ta.rma", "ta.wma", "ta.vwma", "ta.hma", "ta.rsi", "ta.atr",
  "ta.tr", "ta.stdev", "ta.cci", "ta.mfi",
  "sma", "ema", "rma", "wma", "vwma", "hma", "rsi", "atr", "tr", "stdev", "cci", "mfi",
  "input.float", "input.price", "input.source",
]);

/** `abs`/`math.abs`: a float exactly when the argument is. */
const FLOAT_IF_ARG_FLOAT = new Set(["math.abs", "abs"]);

/** Is `node` provably a float? */
export function isProvablyFloat(node: any, scopes: ScopeInfo): boolean {
  const n = unwrap(node);
  const k = ruleName(n);

  if (k === "Num_literalContext") return !n.INT_LITERAL?.();

  if (k === "Unary_exprContext") {
    if (n.NOT?.()) return false;
    return isProvablyFloat(n.sqbr_expr(), scopes);
  }

  // `*`, `/` and `%` are a float as soon as one operand is. Not `/` between
  // two ints: its VALUE is a float (v6 `w / 2` logs 2.5), but TradingView loads
  // `int centerX = bar_index + settings.width / 2 + t_buffer` (TLM HTF Candles,
  // ICT HTF Candles; dev-docs/tv-parity/_probes/int-div), so it is no proof here.
  if (k === "Mult_exprContext" && n.unary_expr().length > 1) {
    return n.unary_expr().some((e: any) => isProvablyFloat(e, scopes));
  }

  if (k === "Add_exprContext" && n.mult_expr().length > 1) {
    return n.mult_expr().some((e: any) => isProvablyFloat(e, scopes));
  }

  // `close[1]` has the type of `close`.
  if (k === "Sqbr_exprContext") return isProvablyFloat(n.atom(), scopes);

  if (k === "IdContext") {
    const name = n.getText();
    if (scopes.functionScoped.has(name)) return false;
    if (scopes.bound.has(name)) {
      // A name with one binding anywhere has one type; a shadowed one is unknown.
      return scopes.staticTypes.get(name) === "float" && scopes.scopesOf.get(name)?.length === 1;
    }
    return FLOAT_BUILTINS.has(name);
  }

  if (k === "Fun_callContext") {
    if (n.call_suffix?.()?.length) return false;
    const callee: string = n.id().getText();
    if (scopes.functions.has(callee)) return false;
    if (FLOAT_CALLS.has(callee)) return true;
    if (FLOAT_IF_ARG_FLOAT.has(callee)) {
      const args = n.fun_actual_args?.()?.pos_args?.();
      const first = args ? kids(args).find((c: any) => typeof c?.getChildCount === "function" && !c.symbol) : null;
      return !!first && isProvablyFloat(first, scopes);
    }
  }

  return false;
}

/** Is `node` the bare identifier `na`? */
export function isPlainNa(node: any): boolean {
  const n = unwrap(node);
  return ruleName(n) === "IdContext" && n.getText() === "na";
}

/** Built-in names that are constant numbers. */
const CONST_NUMBERS = new Set(["math.pi", "math.e", "math.phi", "math.rphi"]);

/**
 * Is `node` provably a CONSTANT number — a literal, `math.pi`, or `+ - * / %`
 * over constants, directly or through a script-scope name bound once to one
 * and never reassigned? TradingView prints a constant float differently from a
 * series one in v4/v5 `str.tostring` (see runtime/v1/stdlib/str.ts).
 *
 * Provably, as everywhere here: anything else — inputs, `syminfo.*`, calls,
 * ternaries, a name in a function or block — is not constant.
 */
export function isConstNumber(node: any, scopes: ScopeInfo, seen: Set<string> = new Set()): boolean {
  const n = unwrap(node);
  const k = ruleName(n);

  if (k === "Num_literalContext") return true;

  if (k === "Unary_exprContext") {
    if (n.NOT?.()) return false;
    return isConstNumber(n.sqbr_expr(), scopes, seen);
  }

  if (k === "Mult_exprContext" && n.unary_expr().length > 1) {
    return n.unary_expr().every((e: any) => isConstNumber(e, scopes, seen));
  }

  if (k === "Add_exprContext" && n.mult_expr().length > 1) {
    return n.mult_expr().every((e: any) => isConstNumber(e, scopes, seen));
  }

  if (k === "IdContext") {
    const name = n.getText();
    if (CONST_NUMBERS.has(name) && !scopes.bound.has("math")) return true;
    if (seen.has(name) || scopes.functionScoped.has(name) || scopes.mutated.has(name)) return false;
    const where = scopes.scopesOf.get(name);
    const init = scopes.inits?.get(name);
    if (!init || !where || where.length !== 1 || where[0] !== null) return false;
    return isConstNumber(init, scopes, new Set(seen).add(name));
  }

  return false;
}

/**
 * TradingView's compile-time value of a constant `+ - *` expression, or null when the node is not one.
 *
 * Each `+`, `-`, `*` whose operands are both compile-time constants is done exactly on the operands' shortest
 * decimal forms and rounded back to a double per operation (`decimalOp`): `1.0 - 0.9` is 0.1 (IEEE
 * 0.09999999999999998), `0.1 * 3` is 0.3, `1e16 + 1.0 - 1e16` is 0 (1e16 + 1 rounds back to 1e16), and
 * `1e6 + 1e-10` stays above 1e6 (a 15-digit rounding would merge them; the float-eq probe says they differ).
 * Division and `%` are not folded (`0.3 / 0.1` stays
 * 2.9999999999999996) and end the constant: a chain through them is left to the runtime. Operands: numeric
 * literals, unary minus, and script-scope names bound once, never reassigned, untyped or typed int/float
 * (`float x = 0.9; 1.0 - x` is 0.1). Not: inputs, series (`close * 0 + 1.0 - 0.9` stays IEEE), calls, math.pi.
 * TradingView probes triage/r6 ind2p p_n128_features_adam4 (an Adam with `(1.0 - 0.9) * g`, bit for bit over the
 * whole history only with 0.1) and triage/r6 cfold p_const_fold_rules (a..i above); capture n128.
 * Per operation: `1e16 + 1.0 - 1e16` = 0 rules out one exact pass over the whole expression.
 */
export function constFold(node: any, scopes: ScopeInfo, seen: Set<string> = new Set()): number | null {
  const n = unwrap(node);
  const k = ruleName(n);
  if (k === "Num_literalContext") { const v = Number(n.getText()); return Number.isFinite(v) ? v : null; }
  if (k === "Unary_exprContext") {
    if (n.NOT?.()) return null;
    const v = constFold(n.sqbr_expr(), scopes, seen);
    return v !== null && n.MINUS?.() ? -v : v;
  }
  if ((k === "Mult_exprContext" && n.unary_expr().length > 1) || (k === "Add_exprContext" && n.mult_expr().length > 1)) {
    const ops = k === "Mult_exprContext" ? n.unary_expr() : n.mult_expr();
    let acc = constFold(ops[0], scopes, seen);
    for (let i = 1; acc !== null && i < ops.length; i++) {
      const op = n.getChild(i * 2 - 1)?.getText?.();
      if (op !== "+" && op !== "-" && op !== "*") return null;
      const v = constFold(ops[i], scopes, seen);
      if (v === null) return null;
      acc = decimalOp(acc, op, v);
    }
    return acc;
  }
  if (k === "IdContext") {
    const name = n.getText();
    if (seen.has(name) || scopes.functionScoped.has(name) || scopes.mutated.has(name)) return null;
    const where = scopes.scopesOf.get(name);
    const init = scopes.constInits?.get(name);
    if (!init || !where || where.length !== 1 || where[0] !== null) return null;
    return constFold(init, scopes, new Set(seen).add(name));
  }
  return null;
}

/**
 * `a op b` as TradingView's compiler folds it: each operand taken as its shortest decimal form ("0.9", "1e+16"),
 * the operation done exactly in decimal, the result rounded to the nearest double. So `1.0 - 0.9` is 0.1, while
 * `1e16 + 1.0` rounds back to 1e16 (hence `1e16 + 1.0 - 1e16` = 0) and `1e6 + 1e-10` stays distinct from 1e6
 * (float-eq probe: `1e6 == 1e6 + 1e-10` is false).
 */
function decimalOp(a: number, op: string, b: number): number {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return op === "+" ? a + b : op === "-" ? a - b : a * b;
  const x = toDecimal(a), y = toDecimal(b);
  let big: bigint, scale: number;
  if (op === "*") { big = x.big * y.big; scale = x.scale + y.scale; }
  else {
    scale = Math.max(x.scale, y.scale);
    const p = x.big * 10n ** BigInt(scale - x.scale), q = y.big * 10n ** BigInt(scale - y.scale);
    big = op === "+" ? p + q : p - q;
  }
  const neg = big < 0n;
  const v = Number(`${neg ? "-" : ""}${(neg ? -big : big).toString()}e${-scale}`);
  return v === 0 && neg ? -0 : v;
}

/** A finite double's shortest round-trip decimal (JS `String`), as big * 10^-scale. */
function toDecimal(v: number): { big: bigint; scale: number } {
  const m = /^(-?)(\d+)(?:\.(\d+))?(?:e([+-]\d+))?$/.exec(String(v))!;
  const frac = m[3] ?? "";
  let big = BigInt(m[2] + frac);
  let scale = frac.length - (m[4] ? parseInt(m[4], 10) : 0);
  if (scale < 0) { big *= 10n ** BigInt(-scale); scale = 0; }
  return { big: m[1] ? -big : big, scale };
}
