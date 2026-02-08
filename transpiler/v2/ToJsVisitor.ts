/**
 * ANTLR parse-tree visitor that emits JavaScript.
 */

import { ParseTreeVisitor } from "antlr4ng";
import type { TerminalNode } from "antlr4ng";
import {
  Opsv2_scriptContext,
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
  Var_assignContext,
  Ids_arrayContext,
  Arith_exprsContext,
  Arith_exprContext,
  If_exprContext,
  For_exprContext,
  Stmts_blockContext,
  Ternary_exprContext,
  Ternary_expr2Context,
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
} from "../../parser/v2/generated/PineScriptParser";

/** Prefix for all emitted identifiers to avoid sandbox name clashes (openpinescript v2). */
const PREFIX = "opsv2_";

export class ToJsVisitor extends ParseTreeVisitor<string> {
  protected override defaultResult(): string {
    return "";
  }
  protected override aggregateResult(aggregate: string, nextResult: string): string {
    return aggregate + nextResult;
  }
  public override visitTerminal(node: TerminalNode): string {
    return node.getText();
  }

  // --- Entry Point ---
  visitOpsv2_script(ctx: Opsv2_scriptContext): string {
    // Visits all top-level statements
    const stmts = ctx.stmt().map((s) => this.visit(s)).filter(Boolean);
    return stmts.join("\n");
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
    // Ensure we don't double-semicolon if the result handles it, 
    // but usually in JS top-level, newlines are enough.
    return result + ";"; 
  }

  // Helper to dispatch content visits (shared by global and local singleline)
  private visitContent(ctx: Global_stmt_contentContext | Local_stmt_contentContext): string {
    if (ctx.var_def()) return this.visit(ctx.var_def()!);
    if (ctx.var_defs()) return this.visit(ctx.var_defs()!);
    if (ctx.var_assign()) return this.visit(ctx.var_assign()!);
    if (ctx.loop_break()) return this.visit(ctx.loop_break()!);
    if (ctx.loop_continue()) return this.visit(ctx.loop_continue()!);
    
    // Some only exist in global or local, check existence:
    if ((ctx as any).fun_call && (ctx as any).fun_call()) return this.visit((ctx as any).fun_call()!);
    if ((ctx as any).if_expr && (ctx as any).if_expr()) return this.visit((ctx as any).if_expr()!);
    if ((ctx as any).for_expr && (ctx as any).for_expr()) return this.visit((ctx as any).for_expr()!);
    if ((ctx as any).arith_expr && (ctx as any).arith_expr()) return this.visit((ctx as any).arith_expr()!);
    if ((ctx as any).arith_exprs && (ctx as any).arith_exprs()) return this.visit((ctx as any).arith_exprs()!);
    
    return "";
  }

  // --- Functions ---
  visitFun_def_stmt(ctx: Fun_def_stmtContext): string {
    if (ctx.fun_def_singleline()) return this.visit(ctx.fun_def_singleline()!) + "\n";
    if (ctx.fun_def_multiline()) return this.visit(ctx.fun_def_multiline()!) + "\n";
    return "";
  }

  visitFun_def_singleline(ctx: Fun_def_singlelineContext): string {
    const name = this.visit(ctx.id());
    const params = this.visit(ctx.fun_head());
    const body = this.visit(ctx.fun_body_singleline());
    return `function ${name}${params} {\n  return ${body};\n}`;
  }

  visitFun_def_multiline(ctx: Fun_def_multilineContext): string {
    const name = this.visit(ctx.id());
    const params = this.visit(ctx.fun_head());
    const body = this.visit(ctx.fun_body_multiline());
    // Body already includes { } from visitLocal_stmts_multiline
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

  visitLocal_stmt_singleline(ctx: Local_stmt_singlelineContext): string {
    const contents = ctx.local_stmt_content().map((c) => this.visit(c));
    // Single line function body usually returns the LAST expression
    return contents.join(", "); 
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

  // --- Multiline Bodies (Blocks) ---
  visitFun_body_multiline(ctx: Fun_body_multilineContext): string {
    return this.visit(ctx.local_stmts_multiline());
  }

  visitLocal_stmts_multiline(ctx: Local_stmts_multilineContext): string {
    // Grammar: BEGIN local_stmts_list END
    return "{\n" + this.visit(ctx.local_stmts_list()) + "\n}";
  }

  visitLocal_stmts_list(ctx: Local_stmts_listContext): string {
    const stmts = ctx.local_stmt_multiline();
    
    const lines = stmts.map((stmt, index) => {
        let js = this.visit(stmt);
        
        // If this is the LAST statement in the block
        if (index === stmts.length - 1) {
             // Check the content of the statement to see if it's an expression
             // (We look at the first content item, assuming homogenous comma lists or valid single items)
             const content = stmt.local_stmt_content(0);
             if (content) {
                 // Check if it is NOT a variable definition, assignment, or flow control
                 const isExpression = 
                    content.arith_expr() || 
                    content.arith_exprs() || 
                    (content as any).fun_call?.() || // Check if rule exists
                    (content as any).if_expr?.() ||
                    (content as any).for_expr?.();

                 if (isExpression) {
                     return "return " + js;
                 }
             }
        }
        return js;
    });
    return lines.join(";\n") + ";";
  }

  visitLocal_stmt_multiline(ctx: Local_stmt_multilineContext): string {
    // Grammar: local_stmt_content (COMMA local_stmt_content)*
    const parts = ctx.local_stmt_content().map((c) => this.visit(c));
    return parts.join(", ");
  }

  // --- Variables ---
  visitVar_def(ctx: Var_defContext): string {
    const name = this.visit(ctx.id());
    const value = this.visit(ctx.arith_expr());
    return `let ${name} = ${value}`;
  }

  visitVar_defs(ctx: Var_defsContext): string {
    const ids = this.visit(ctx.ids_array());
    const value = this.visit(ctx.arith_expr());
    return `let ${ids} = ${value}`;
  }

  visitVar_assign(ctx: Var_assignContext): string {
    const name = this.visit(ctx.id());
    const value = this.visit(ctx.arith_expr());
    return `${name} = ${value}`;
  }

  visitIds_array(ctx: Ids_arrayContext): string {
    const ids = ctx.id().map((i) => this.visit(i)).join(", ");
    return `[${ids}]`;
  }

  visitArith_exprs(ctx: Arith_exprsContext): string {
    const exprs = ctx.arith_expr().map((e) => this.visit(e)).join(", ");
    return `[${exprs}]`;
  }

  // --- Control Flow Expressions ---
  visitArith_expr(ctx: Arith_exprContext): string {
    if (ctx.ternary_expr()) return this.visit(ctx.ternary_expr()!);
    if (ctx.if_expr()) return this.visit(ctx.if_expr()!);
    if (ctx.for_expr()) return this.visit(ctx.for_expr()!);
    return "";
  }

  visitIf_expr(ctx: If_exprContext): string {
    const cond = this.visit(ctx.ternary_expr());
    const thenBlock = this.visit(ctx.stmts_block(0));
    
    // Determine if it's an IIFE (expression) or Statement. 
    // For simplicity in this visitor, we often emit IIFEs for everything in Pine.
    // However, pure statements are cleaner. Let's assume IIFE for safety in 'expr' contexts.
    
    let result = `if (${cond}) ${thenBlock}`;
    if (ctx.IF_COND_ELSE()) {
      const elseBlock = this.visit(ctx.stmts_block(1));
      result += ` else ${elseBlock}`;
    }
    
    // To allow usage as expression: (() => { if... })()
    return `(() => { ${result} })()`;
  }

  visitFor_expr(ctx: For_exprContext): string {
    const init = this.visit(ctx.var_def());
    const varName = this.visit(ctx.var_def().id());
    const end = this.visit(ctx.ternary_expr(0)); // 'to' value
    const body = this.visit(ctx.stmts_block());
    
    let step = "1";
    if (ctx.FOR_STMT_BY()) {
      step = this.visit(ctx.ternary_expr(1));
    }

    const loop = `for (${init}; ${varName} <= ${end}; ${varName} += ${step}) ${body}`;
    return `(() => { ${loop} })()`;
  }

  visitStmts_block(ctx: Stmts_blockContext): string {
    // Reuses fun_body_multiline (which handles BEGIN/END -> { })
    return this.visit(ctx.fun_body_multiline());
  }

  // --- Ternary & Math ---
  visitTernary_expr(ctx: Ternary_exprContext): string {
    const cond = this.visit(ctx.or_expr());
    if (ctx.ternary_expr2()) {
      const t2 = this.visit(ctx.ternary_expr2()!);
      return `(${cond} ? ${t2})`;
    }
    return cond;
  }

  visitTernary_expr2(ctx: Ternary_expr2Context): string {
    const t = ctx.ternary_expr().map((e) => this.visit(e));
    return t[0] + " : " + t[1];
  }

  visitOr_expr(ctx: Or_exprContext): string {
    const parts = ctx.and_expr().map((e) => this.visit(e));
    return parts.join(" || ");
  }

  visitAnd_expr(ctx: And_exprContext): string {
    const parts = ctx.eq_expr().map((e) => this.visit(e));
    return parts.join(" && ");
  }

  visitEq_expr(ctx: Eq_exprContext): string {
    const parts = ctx.cmp_expr().map((e) => this.visit(e));
    if (parts.length === 1) return parts[0];
    let out = parts[0];
    for (let i = 1; i < parts.length; i++) {
      const op = ctx.EQ(i - 1) ? "===" : "!==";
      out = `(${out} ${op} ${parts[i]})`;
    }
    return out;
  }

  visitCmp_expr(ctx: Cmp_exprContext): string {
    const parts = ctx.add_expr().map((e) => this.visit(e));
    if (parts.length === 1) return parts[0];
    let out = parts[0];
    for (let i = 1; i < parts.length; i++) {
      const op = ctx.GT(i - 1) ? ">" : ctx.GE(i - 1) ? ">=" : ctx.LT(i - 1) ? "<" : "<=";
      out = `(${out} ${op} ${parts[i]})`;
    }
    return out;
  }

  visitAdd_expr(ctx: Add_exprContext): string {
    const parts = ctx.mult_expr().map((e) => this.visit(e));
    if (parts.length === 1) return parts[0];
    let out = parts[0];
    for (let i = 1; i < parts.length; i++) {
      const op = ctx.PLUS(i - 1) ? "+" : "-";
      out = `(${out} ${op} ${parts[i]})`;
    }
    return out;
  }

  visitMult_expr(ctx: Mult_exprContext): string {
    const parts = ctx.unary_expr().map((e) => this.visit(e));
    if (parts.length === 1) return parts[0];
    let out = parts[0];
    for (let i = 1; i < parts.length; i++) {
      const op = ctx.MUL(i - 1) ? "*" : ctx.DIV(i - 1) ? "/" : "%";
      out = `(${out} ${op} ${parts[i]})`;
    }
    return out;
  }

  visitUnary_expr(ctx: Unary_exprContext): string {
    const inner = this.visit(ctx.sqbr_expr());
    if (ctx.NOT()) return `!(${inner})`;
    if (ctx.PLUS()) return `+${inner}`;
    if (ctx.MINUS()) return `-${inner}`;
    return inner;
  }

  visitSqbr_expr(ctx: Sqbr_exprContext): string {
    const base = this.visit(ctx.atom());
    const idxExpr = ctx.arith_expr(0);
    if (idxExpr) {
      return `${base}[${this.visit(idxExpr)}]`;
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

  visitFun_call(ctx: Fun_callContext): string {
    const name = this.visit(ctx.id());
    const args = ctx.fun_actual_args() ? this.visit(ctx.fun_actual_args()!) : "";
    return `${name}(${args})`;
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

  visitPos_args(ctx: Pos_argsContext): string {
    return ctx.arith_expr().map((e) => this.visit(e)).join(", ");
  }

  visitKw_args(ctx: Kw_argsContext): string {
    const args = ctx.kw_arg().map((a) => this.visit(a)).join(", ");
    return `{ ${args} }`;
  }

  visitKw_arg(ctx: Kw_argContext): string {
    const key = this.visit(ctx.id());
    const value = this.visit(ctx.arith_expr());
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
    return text;
  }

  visitId = (ctx: IdContext): string => {
    // Input: "strategy.entry"
    // Output: "opsv2_strategy.opsv2_entry"
    // Input: "close"
    // Output: "opsv2_close"
    return ctx.getText()
        .split('.')
        .map(part => `opsv2_${part}`)
        .join('.');
  }
}
