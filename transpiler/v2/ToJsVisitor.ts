/**
 * ANTLR parse-tree visitor that emits JavaScript.
 * Target: OpenPineScript v2 Runtime (Series Object Architecture)
 */

import { ParseTreeVisitor } from "antlr4ng";
import type { TerminalNode, ParserRuleContext } from "antlr4ng";
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

export class ToJsVisitor extends ParseTreeVisitor<string> {
  // Prefix for all emitted identifiers to avoid sandbox name clashes
  private readonly PREFIX = "opsv2_";

  private readonly BUILT_INS = new Set([
      "open", "high", "low", "close", "volume", "time", "bar_index", 
      "na", "nz", "ta", "math", "strategy", "request", 'tostring'
  ]);

  protected override defaultResult(): string {
    return "";
  }
  protected override aggregateResult(aggregate: string, nextResult: string): string {
    return aggregate + nextResult;
  }
  public override visitTerminal(node: TerminalNode): string {
    return node.getText();
  }

  /** * Helper: Generates a Deterministic ID based on Source Location.
   * Example: "_L10_C5" (Line 10, Column 5)
   */
  private getLocId(ctx: ParserRuleContext): string {
    const line = ctx.start?.line || 0;
    const col = ctx.start?.column || 0;
    return `@L${line}:C${col}`;
  }

  // --- Entry Point ---
  visitOpsv2_script(ctx: Opsv2_scriptContext): string {
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
    return result + ";"; 
  }

  private visitContent(ctx: Global_stmt_contentContext | Local_stmt_contentContext): string {
    if (ctx.var_def()) return this.visit(ctx.var_def()!);
    if (ctx.var_defs()) return this.visit(ctx.var_defs()!);
    if (ctx.var_assign()) return this.visit(ctx.var_assign()!);
    if (ctx.loop_break()) return this.visit(ctx.loop_break()!);
    if (ctx.loop_continue()) return this.visit(ctx.loop_continue()!);
    
    // Check for expressions acting as statements
    if ((ctx as any).fun_call && (ctx as any).fun_call()) return this.visit((ctx as any).fun_call()!);
    if ((ctx as any).if_expr && (ctx as any).if_expr()) return this.visit((ctx as any).if_expr()!);
    if ((ctx as any).for_expr && (ctx as any).for_expr()) return this.visit((ctx as any).for_expr()!);
    if ((ctx as any).arith_expr && (ctx as any).arith_expr()) return this.visit((ctx as any).arith_expr()!);
    // Added back as requested
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

  // --- Multiline Bodies ---
  visitFun_body_multiline(ctx: Fun_body_multilineContext): string {
    return this.visit(ctx.local_stmts_multiline());
  }

  visitLocal_stmts_multiline(ctx: Local_stmts_multilineContext): string {
    return "{\n" + this.visit(ctx.local_stmts_list()) + "\n}";
  }

  visitLocal_stmts_list(ctx: Local_stmts_listContext): string {
    const stmts = ctx.local_stmt_multiline();
    
    const lines = stmts.map((stmt, index) => {
        let js = this.visit(stmt);
        
        // Return logic for last statement
        if (index === stmts.length - 1) {
             const content = stmt.local_stmt_content(0);
             if (content) {
                 const isExpression = 
                    content.arith_expr() || 
                    content.arith_exprs() || 
                    (content as any).fun_call?.() || 
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
    const parts = ctx.local_stmt_content().map((c) => this.visit(c));
    return parts.join(", ");
  }

  // --- Variables (Series Architecture) ---

  // Handle: x = 1
  visitVar_def(ctx: Var_defContext): string {
    const name = this.visit(ctx.id());
    const value = this.visit(ctx.arith_expr());
    // Use 'let' to create a new variable in the current scope (Shadowing allowed)
    return `let ${name} = ctx.new_var("${name}", ${value})`;
  }

  // Handle: [a, b] = myFunc()
  visitVar_defs(ctx: Var_defsContext): string {
    const ids = ctx.ids_array().id().map(i => this.visit(i)); 
    // JS: ["opsv2_a", "opsv2_b"]
    const idsArrayJs = `[${ids.join(", ")}]`; 
    // Strings: ["opsv2_a", "opsv2_b"] (For Context Keys)
    const idsStringsJs = `[${ids.map(id => `"${id}"`).join(", ")}]`;
    
    const value = this.visit(ctx.arith_expr());

    // Use 'let' for tuple declaration
    return `let ${idsArrayJs} = ctx.new_vars(${idsStringsJs}, ${value})`;
  }

  // Handle: x := 1
  visitVar_assign(ctx: Var_assignContext): string {
    const name = this.visit(ctx.id());
    const value = this.visit(ctx.arith_expr());
    // No 'let'. Updates the existing variable in the parent scope.
    // Note: ctx.new_var updates the internal Series and returns it.
    return `${name} = ctx.new_var("${name}", ${value})`;
  }

  visitIds_array(ctx: Ids_arrayContext): string {
    const ids = ctx.id().map((i) => this.visit(i)).join(", ");
    return `[${ids}]`;
  }

  visitArith_exprs(ctx: Arith_exprsContext): string {
    const exprs = ctx.arith_expr().map((e) => this.visit(e)).join(", ");
    return `[${exprs}]`;
  }

  // --- Expressions ---
  visitArith_expr(ctx: Arith_exprContext): string {
    if (ctx.ternary_expr()) return this.visit(ctx.ternary_expr()!);
    if (ctx.if_expr()) return this.visit(ctx.if_expr()!);
    if (ctx.for_expr()) return this.visit(ctx.for_expr()!);
    return "";
  }

  visitIf_expr(ctx: If_exprContext): string {
    const cond = this.visit(ctx.ternary_expr());
    const thenBlock = this.visit(ctx.stmts_block(0));
    let result = `if (${cond}) ${thenBlock}`;
    if (ctx.IF_COND_ELSE()) {
      const elseBlock = this.visit(ctx.stmts_block(1));
      result += ` else ${elseBlock}`;
    }
    return `(() => { ${result} })()`;
  }

  visitFor_expr(ctx: For_exprContext): string {
    const init = this.visit(ctx.var_def()); // "let opsv2_i = ctx.new_var..."
    const varName = this.visit(ctx.var_def().id());
    const end = this.visit(ctx.ternary_expr(0));
    const body = this.visit(ctx.stmts_block());
    let step = "1";
    if (ctx.FOR_STMT_BY()) {
      step = this.visit(ctx.ternary_expr(1));
    }
    
    // Loop variable MUST be a series to persist/update correctly
    const loop = `for (${init}; ${varName} <= ${end}; ${varName} = ctx.new_var("${varName}", ${varName} + ${step})) ${body}`;
    return `(() => { ${loop} })()`;
  }

  visitStmts_block(ctx: Stmts_blockContext): string {
    return this.visit(ctx.fun_body_multiline());
  }

  // --- Math ---
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
      const op = ctx.EQ(i - 1) ? "==" : "!=";
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

  // --- Series Access with ID Tagging ---
  visitSqbr_expr(ctx: Sqbr_exprContext): string {
    const base = this.visit(ctx.atom());
    const idxExpr = ctx.arith_expr(0);

    if (idxExpr) {
      const index = this.visit(idxExpr);
      // Generate ID Tag: e.g. "opsv2_close_L10_C4"
      const locId = `${base}${this.getLocId(ctx)}`; 
      
      // Emit: ctx.get(base, index, "TAG")
      return `ctx.get(${base}, ${index}, "${locId}")`;
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

  // --- Function Calls with ID Tagging ---
  visitFun_call(ctx: Fun_callContext): string {
    const originalName = ctx.id().getText(); 
    const transpiledName = this.visit(ctx.id());
    let args = ctx.fun_actual_args() ? this.visit(ctx.fun_actual_args()!) : "";
    
    // 1. Identify context-aware built-ins
    const needsCtx = 
        ["plot", "plotshape", "plotchar", "hline", "bgcolor", "barcolor", "fill", "input"].includes(originalName) ||
        originalName.startsWith("ta.") ||
        originalName.startsWith("strategy.") ||
        originalName.startsWith("request.");

    // 2. Build the parameter string for the target function
    if (needsCtx) {
        args = args ? `ctx, ${args}` : "ctx";
    }
    
    // 3. Generate Deterministic ID
    const callId = `"${originalName}${this.getLocId(ctx)}"`;

    // 4. Construct the ctx.call wrapper
    // We only add the comma after transpiledName if there are actually arguments to pass.
    const finalArgsPart = args ? `, ${args}` : "";

    return `ctx.call(${callId}, ${transpiledName}${finalArgsPart})`;
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
    const text = ctx.getText();
    
    // 1. Handle Dot Notation (e.g. "ta.sma")
    if (text.includes('.')) {
        const parts = text.split('.');
        const transformed = parts.map(p => `${this.PREFIX}${p}`).join('.');
        
        // If the namespace (e.g. "ta") is a built-in, prefix with "ctx."
        if (this.BUILT_INS.has(parts[0])) {
             return `ctx.${transformed}`;
        }
        return transformed;
    }

    // 2. Handle Simple IDs (e.g. "close", "bar_index")
    // If it's a known built-in, it lives on Context.
    if (this.BUILT_INS.has(text)) {
        return `ctx.${this.PREFIX}${text}`;
    }
    
    // 3. Default: User Variable (Local Scope)
    // e.g. "a" -> "opsv2_a" (matches "let opsv2_a = ...")
    return `${this.PREFIX}${text}`;
  }
}
