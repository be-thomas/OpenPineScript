
import { ParseTreeVisitor } from "antlr4ng";


import { While_exprContext } from "./PineV5Parser.js";
import { Switch_exprContext } from "./PineV5Parser.js";
import { Switch_bodyContext } from "./PineV5Parser.js";
import { Switch_caseContext } from "./PineV5Parser.js";
import { Field_typeContext } from "./PineV5Parser.js";
import { Type_def_stmtContext } from "./PineV5Parser.js";
import { Type_bodyContext } from "./PineV5Parser.js";
import { Type_fieldContext } from "./PineV5Parser.js";
import { Method_def_stmtContext } from "./PineV5Parser.js";
import { Export_stmtContext } from "./PineV5Parser.js";
import { Import_stmtContext } from "./PineV5Parser.js";
import { Import_pathContext } from "./PineV5Parser.js";
import { Fun_paramContext } from "./PineV5Parser.js";
import { Type_argsContext } from "./PineV5Parser.js";
import { Type_argContext } from "./PineV5Parser.js";
import { Fun_callContext } from "./PineV5Parser.js";
import { StmtContext } from "./PineV5Parser.js";
import { Fun_headContext } from "./PineV5Parser.js";
import { Var_defContext } from "./PineV5Parser.js";
import { Var_defsContext } from "./PineV5Parser.js";
import { Id_partContext } from "./PineV5Parser.js";
import { Global_stmt_contentContext } from "./PineV5Parser.js";
import { Local_stmt_contentContext } from "./PineV5Parser.js";
import { Arith_exprContext } from "./PineV5Parser.js";
import { Decl_modContext } from "./PineV5Parser.js";
import { Type_qualContext } from "./PineV5Parser.js";
import { Type_nameContext } from "./PineV5Parser.js";
import { IdContext } from "./PineV5Parser.js";
import { Var_assignContext } from "./PineV5Parser.js";
import { Pine_scriptContext } from "./PineV5Parser.js";
import { Global_stmtContext } from "./PineV5Parser.js";
import { Fun_def_stmtContext } from "./PineV5Parser.js";
import { Fun_def_singlelineContext } from "./PineV5Parser.js";
import { Fun_def_multilineContext } from "./PineV5Parser.js";
import { Fun_body_singlelineContext } from "./PineV5Parser.js";
import { Local_stmt_singlelineContext } from "./PineV5Parser.js";
import { Loop_breakContext } from "./PineV5Parser.js";
import { Loop_continueContext } from "./PineV5Parser.js";
import { Fun_body_multilineContext } from "./PineV5Parser.js";
import { Local_stmts_multilineContext } from "./PineV5Parser.js";
import { Local_stmts_listContext } from "./PineV5Parser.js";
import { Local_stmt_multilineContext } from "./PineV5Parser.js";
import { Ids_arrayContext } from "./PineV5Parser.js";
import { Arith_exprsContext } from "./PineV5Parser.js";
import { If_exprContext } from "./PineV5Parser.js";
import { For_exprContext } from "./PineV5Parser.js";
import { Stmts_blockContext } from "./PineV5Parser.js";
import { Ternary_exprContext } from "./PineV5Parser.js";
import { Or_exprContext } from "./PineV5Parser.js";
import { And_exprContext } from "./PineV5Parser.js";
import { Eq_exprContext } from "./PineV5Parser.js";
import { Cmp_exprContext } from "./PineV5Parser.js";
import { Add_exprContext } from "./PineV5Parser.js";
import { Mult_exprContext } from "./PineV5Parser.js";
import { Unary_exprContext } from "./PineV5Parser.js";
import { Sqbr_exprContext } from "./PineV5Parser.js";
import { AtomContext } from "./PineV5Parser.js";
import { Fun_actual_argsContext } from "./PineV5Parser.js";
import { Pos_argsContext } from "./PineV5Parser.js";
import { Kw_argsContext } from "./PineV5Parser.js";
import { Kw_argContext } from "./PineV5Parser.js";
import { LiteralContext } from "./PineV5Parser.js";
import { Num_literalContext } from "./PineV5Parser.js";
import { Other_literalContext } from "./PineV5Parser.js";


/**
 * This interface defines a complete generic visitor for a parse tree produced
 * by `PineV5Parser`.
 *
 * @param <Result> The return type of the visit operation. Use `void` for
 * operations with no return type.
 */
export class PineV5ParserVisitor<Result> extends ParseTreeVisitor<Result> {
    /**
     * Visit a parse tree produced by `PineV5Parser.while_expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitWhile_expr?: (ctx: While_exprContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.switch_expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSwitch_expr?: (ctx: Switch_exprContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.switch_body`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSwitch_body?: (ctx: Switch_bodyContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.switch_case`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSwitch_case?: (ctx: Switch_caseContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.field_type`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitField_type?: (ctx: Field_typeContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.type_def_stmt`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitType_def_stmt?: (ctx: Type_def_stmtContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.type_body`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitType_body?: (ctx: Type_bodyContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.type_field`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitType_field?: (ctx: Type_fieldContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.method_def_stmt`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitMethod_def_stmt?: (ctx: Method_def_stmtContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.export_stmt`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitExport_stmt?: (ctx: Export_stmtContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.import_stmt`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitImport_stmt?: (ctx: Import_stmtContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.import_path`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitImport_path?: (ctx: Import_pathContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.fun_param`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFun_param?: (ctx: Fun_paramContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.type_args`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitType_args?: (ctx: Type_argsContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.type_arg`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitType_arg?: (ctx: Type_argContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.fun_call`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFun_call?: (ctx: Fun_callContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.stmt`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitStmt?: (ctx: StmtContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.fun_head`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFun_head?: (ctx: Fun_headContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.var_def`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitVar_def?: (ctx: Var_defContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.var_defs`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitVar_defs?: (ctx: Var_defsContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.id_part`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitId_part?: (ctx: Id_partContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.global_stmt_content`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitGlobal_stmt_content?: (ctx: Global_stmt_contentContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.local_stmt_content`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLocal_stmt_content?: (ctx: Local_stmt_contentContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.arith_expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitArith_expr?: (ctx: Arith_exprContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.decl_mod`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitDecl_mod?: (ctx: Decl_modContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.type_qual`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitType_qual?: (ctx: Type_qualContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.type_name`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitType_name?: (ctx: Type_nameContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.id`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitId?: (ctx: IdContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.var_assign`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitVar_assign?: (ctx: Var_assignContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.pine_script`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitPine_script?: (ctx: Pine_scriptContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.global_stmt`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitGlobal_stmt?: (ctx: Global_stmtContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.fun_def_stmt`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFun_def_stmt?: (ctx: Fun_def_stmtContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.fun_def_singleline`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFun_def_singleline?: (ctx: Fun_def_singlelineContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.fun_def_multiline`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFun_def_multiline?: (ctx: Fun_def_multilineContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.fun_body_singleline`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFun_body_singleline?: (ctx: Fun_body_singlelineContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.local_stmt_singleline`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLocal_stmt_singleline?: (ctx: Local_stmt_singlelineContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.loop_break`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLoop_break?: (ctx: Loop_breakContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.loop_continue`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLoop_continue?: (ctx: Loop_continueContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.fun_body_multiline`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFun_body_multiline?: (ctx: Fun_body_multilineContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.local_stmts_multiline`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLocal_stmts_multiline?: (ctx: Local_stmts_multilineContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.local_stmts_list`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLocal_stmts_list?: (ctx: Local_stmts_listContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.local_stmt_multiline`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLocal_stmt_multiline?: (ctx: Local_stmt_multilineContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.ids_array`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitIds_array?: (ctx: Ids_arrayContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.arith_exprs`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitArith_exprs?: (ctx: Arith_exprsContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.if_expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitIf_expr?: (ctx: If_exprContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.for_expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFor_expr?: (ctx: For_exprContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.stmts_block`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitStmts_block?: (ctx: Stmts_blockContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.ternary_expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTernary_expr?: (ctx: Ternary_exprContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.or_expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitOr_expr?: (ctx: Or_exprContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.and_expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAnd_expr?: (ctx: And_exprContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.eq_expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitEq_expr?: (ctx: Eq_exprContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.cmp_expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitCmp_expr?: (ctx: Cmp_exprContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.add_expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAdd_expr?: (ctx: Add_exprContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.mult_expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitMult_expr?: (ctx: Mult_exprContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.unary_expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitUnary_expr?: (ctx: Unary_exprContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.sqbr_expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSqbr_expr?: (ctx: Sqbr_exprContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.atom`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAtom?: (ctx: AtomContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.fun_actual_args`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFun_actual_args?: (ctx: Fun_actual_argsContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.pos_args`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitPos_args?: (ctx: Pos_argsContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.kw_args`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitKw_args?: (ctx: Kw_argsContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.kw_arg`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitKw_arg?: (ctx: Kw_argContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.literal`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLiteral?: (ctx: LiteralContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.num_literal`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitNum_literal?: (ctx: Num_literalContext) => Result;
    /**
     * Visit a parse tree produced by `PineV5Parser.other_literal`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitOther_literal?: (ctx: Other_literalContext) => Result;
}

