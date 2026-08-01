
import { ParseTreeVisitor } from "antlr4ng";


import { Var_assignContext } from "./PineV3Parser.js";
import { Global_stmt_contentContext } from "./PineV3Parser.js";
import { Local_stmt_contentContext } from "./PineV3Parser.js";
import { Pine_scriptContext } from "./PineV3Parser.js";
import { StmtContext } from "./PineV3Parser.js";
import { Global_stmtContext } from "./PineV3Parser.js";
import { Fun_def_stmtContext } from "./PineV3Parser.js";
import { Fun_def_singlelineContext } from "./PineV3Parser.js";
import { Fun_def_multilineContext } from "./PineV3Parser.js";
import { Fun_headContext } from "./PineV3Parser.js";
import { Fun_body_singlelineContext } from "./PineV3Parser.js";
import { Local_stmt_singlelineContext } from "./PineV3Parser.js";
import { Loop_breakContext } from "./PineV3Parser.js";
import { Loop_continueContext } from "./PineV3Parser.js";
import { Fun_body_multilineContext } from "./PineV3Parser.js";
import { Local_stmts_multilineContext } from "./PineV3Parser.js";
import { Local_stmts_listContext } from "./PineV3Parser.js";
import { Local_stmt_multilineContext } from "./PineV3Parser.js";
import { Var_defContext } from "./PineV3Parser.js";
import { Var_defsContext } from "./PineV3Parser.js";
import { Ids_arrayContext } from "./PineV3Parser.js";
import { Arith_exprsContext } from "./PineV3Parser.js";
import { Arith_exprContext } from "./PineV3Parser.js";
import { If_exprContext } from "./PineV3Parser.js";
import { For_exprContext } from "./PineV3Parser.js";
import { Stmts_blockContext } from "./PineV3Parser.js";
import { Ternary_exprContext } from "./PineV3Parser.js";
import { Or_exprContext } from "./PineV3Parser.js";
import { And_exprContext } from "./PineV3Parser.js";
import { Eq_exprContext } from "./PineV3Parser.js";
import { Cmp_exprContext } from "./PineV3Parser.js";
import { Add_exprContext } from "./PineV3Parser.js";
import { Mult_exprContext } from "./PineV3Parser.js";
import { Unary_exprContext } from "./PineV3Parser.js";
import { Sqbr_exprContext } from "./PineV3Parser.js";
import { AtomContext } from "./PineV3Parser.js";
import { Fun_callContext } from "./PineV3Parser.js";
import { Fun_actual_argsContext } from "./PineV3Parser.js";
import { Pos_argsContext } from "./PineV3Parser.js";
import { Kw_argsContext } from "./PineV3Parser.js";
import { Kw_argContext } from "./PineV3Parser.js";
import { LiteralContext } from "./PineV3Parser.js";
import { Num_literalContext } from "./PineV3Parser.js";
import { Other_literalContext } from "./PineV3Parser.js";
import { IdContext } from "./PineV3Parser.js";


/**
 * This interface defines a complete generic visitor for a parse tree produced
 * by `PineV3Parser`.
 *
 * @param <Result> The return type of the visit operation. Use `void` for
 * operations with no return type.
 */
export class PineV3ParserVisitor<Result> extends ParseTreeVisitor<Result> {
    /**
     * Visit a parse tree produced by `PineV3Parser.var_assign`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitVar_assign?: (ctx: Var_assignContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.global_stmt_content`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitGlobal_stmt_content?: (ctx: Global_stmt_contentContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.local_stmt_content`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLocal_stmt_content?: (ctx: Local_stmt_contentContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.pine_script`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitPine_script?: (ctx: Pine_scriptContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.stmt`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitStmt?: (ctx: StmtContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.global_stmt`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitGlobal_stmt?: (ctx: Global_stmtContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.fun_def_stmt`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFun_def_stmt?: (ctx: Fun_def_stmtContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.fun_def_singleline`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFun_def_singleline?: (ctx: Fun_def_singlelineContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.fun_def_multiline`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFun_def_multiline?: (ctx: Fun_def_multilineContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.fun_head`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFun_head?: (ctx: Fun_headContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.fun_body_singleline`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFun_body_singleline?: (ctx: Fun_body_singlelineContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.local_stmt_singleline`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLocal_stmt_singleline?: (ctx: Local_stmt_singlelineContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.loop_break`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLoop_break?: (ctx: Loop_breakContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.loop_continue`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLoop_continue?: (ctx: Loop_continueContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.fun_body_multiline`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFun_body_multiline?: (ctx: Fun_body_multilineContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.local_stmts_multiline`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLocal_stmts_multiline?: (ctx: Local_stmts_multilineContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.local_stmts_list`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLocal_stmts_list?: (ctx: Local_stmts_listContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.local_stmt_multiline`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLocal_stmt_multiline?: (ctx: Local_stmt_multilineContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.var_def`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitVar_def?: (ctx: Var_defContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.var_defs`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitVar_defs?: (ctx: Var_defsContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.ids_array`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitIds_array?: (ctx: Ids_arrayContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.arith_exprs`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitArith_exprs?: (ctx: Arith_exprsContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.arith_expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitArith_expr?: (ctx: Arith_exprContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.if_expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitIf_expr?: (ctx: If_exprContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.for_expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFor_expr?: (ctx: For_exprContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.stmts_block`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitStmts_block?: (ctx: Stmts_blockContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.ternary_expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTernary_expr?: (ctx: Ternary_exprContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.or_expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitOr_expr?: (ctx: Or_exprContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.and_expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAnd_expr?: (ctx: And_exprContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.eq_expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitEq_expr?: (ctx: Eq_exprContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.cmp_expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitCmp_expr?: (ctx: Cmp_exprContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.add_expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAdd_expr?: (ctx: Add_exprContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.mult_expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitMult_expr?: (ctx: Mult_exprContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.unary_expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitUnary_expr?: (ctx: Unary_exprContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.sqbr_expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSqbr_expr?: (ctx: Sqbr_exprContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.atom`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAtom?: (ctx: AtomContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.fun_call`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFun_call?: (ctx: Fun_callContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.fun_actual_args`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFun_actual_args?: (ctx: Fun_actual_argsContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.pos_args`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitPos_args?: (ctx: Pos_argsContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.kw_args`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitKw_args?: (ctx: Kw_argsContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.kw_arg`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitKw_arg?: (ctx: Kw_argContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.literal`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLiteral?: (ctx: LiteralContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.num_literal`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitNum_literal?: (ctx: Num_literalContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.other_literal`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitOther_literal?: (ctx: Other_literalContext) => Result;
    /**
     * Visit a parse tree produced by `PineV3Parser.id`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitId?: (ctx: IdContext) => Result;
}

