import type { ParserRuleContext } from "antlr4ng";
import {
  Fun_callContext,
  Arith_exprContext,
  LiteralContext,
  Num_literalContext,
  Other_literalContext
} from "../../parser/v2/generated/PineScriptParser";

// --- ID Generation ---

/**
 * Generates a deterministic ID based on source location.
 * Example: "@L10:C5"
 */
export function getLocId(ctx: ParserRuleContext): string {
  const line = ctx.start?.line || 0;
  const col = ctx.start?.column || 0;
  return `@L${line}:C${col}`;
}

// --- Metadata Extraction ---

export interface ScriptMetadata {
  title: string;
  isOverlay: boolean;
  inputs: Array<{
    id: string;
    type: string;
    defval: any;
  }>;
}

/**
 * Extracts title and overlay settings from an indicator()/strategy() call.
 */
export function extractScriptSettings(ctx: Fun_callContext): Partial<ScriptMetadata> {
  const args = parseArgumentsManual(ctx);
  const result: Partial<ScriptMetadata> = {};

  if (args.has("title")) result.title = args.get("title");
  else if (args.has("0")) result.title = args.get("0"); // Positional 0

  if (args.has("overlay")) result.isOverlay = Boolean(args.get("overlay"));
  
  return result;
}

/**
 * Extracts input definition from an input() call.
 */
export function extractInputSettings(ctx: Fun_callContext, type: string, index: number) {
  const args = parseArgumentsManual(ctx);

  // Default Value is usually 1st arg (defval) or positional 0
  const defval = args.get("defval") ?? args.get("0") ?? 0;

  // Title is usually 2nd arg (title) or positional 1
  const title = args.get("title") ?? args.get("1") ?? `Input_${index}`;

  return {
    id: String(title),
    type: type,
    defval: defval,
  };
}

// --- AST Traversal Helpers ---

/**
 * Manually extracts a map of arguments from a function call AST.
 * This is a "mini-interpreter" for static analysis.
 */
function parseArgumentsManual(ctx: Fun_callContext): Map<string, any> {
  const map = new Map<string, any>();
  const argsCtx = ctx.fun_actual_args();
  if (!argsCtx) return map;

  // 1. Handle Positional Args
  if (argsCtx.pos_args()) {
    const exprs = argsCtx.pos_args()!.arith_expr();
    exprs.forEach((expr, index) => {
      const val = extractLiteralValue(expr);
      map.set(String(index), val);
    });
  }

  // 2. Handle Keyword Args
  if (argsCtx.kw_args()) {
    const kws = argsCtx.kw_args()!.kw_arg();
    kws.forEach((kw) => {
      const key = kw.id().getText();
      const val = extractLiteralValue(kw.arith_expr());
      map.set(key, val);
    });
  }
  return map;
}

/**
 * Drills down into an Arithmetic Expression to find a static Literal value.
 * Returns null if the expression is too complex (e.g., involves variables).
 */
function extractLiteralValue(expr: Arith_exprContext): any {
  try {
    // Drill down: arith -> ternary -> ... -> atom -> literal
    // This chain matches the grammar structure for a simple literal
    const atom = expr
      .ternary_expr()?.or_expr()?.and_expr(0)?.eq_expr(0)
      ?.cmp_expr(0)?.add_expr(0)?.mult_expr(0)?.unary_expr(0)
      ?.sqbr_expr()?.atom();

    if (atom?.literal()) {
      const lit = atom.literal()!;
      if (lit.num_literal()) {
        const txt = lit.num_literal()!.getText();
        return txt.includes(".") ? parseFloat(txt) : parseInt(txt);
      }
      if (lit.other_literal()) {
        const txt = lit.other_literal()!.getText();
        // Remove quotes for strings
        if (txt.startsWith('"') || txt.startsWith("'")) return txt.slice(1, -1);
        if (txt === "true") return true;
        if (txt === "false") return false;
      }
    }
  } catch (e) {
    return null;
  }
  return null;
}
