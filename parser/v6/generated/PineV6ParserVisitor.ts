
import { AbstractParseTreeVisitor } from "antlr4ng";


import { Once_exprContext } from "./PineV6Parser.js";
import { Other_literalContext } from "./PineV6Parser.js";
import { Global_stmt_contentContext } from "./PineV6Parser.js";
import { Local_stmt_contentContext } from "./PineV6Parser.js";
import { IdContext } from "./PineV6Parser.js";
import { Export_stmtContext } from "./PineV6Parser.js";
import { While_exprContext } from "./PineV6Parser.js";
import { Switch_exprContext } from "./PineV6Parser.js";
import { Switch_bodyContext } from "./PineV6Parser.js";
import { Switch_caseContext } from "./PineV6Parser.js";
import { Field_typeContext } from "./PineV6Parser.js";
import { Type_def_stmtContext } from "./PineV6Parser.js";
import { Type_bodyContext } from "./PineV6Parser.js";
import { Type_fieldContext } from "./PineV6Parser.js";
import { Method_def_stmtContext } from "./PineV6Parser.js";
import { Enum_def_stmtContext } from "./PineV6Parser.js";
import { Enum_bodyContext } from "./PineV6Parser.js";
import { Enum_fieldContext } from "./PineV6Parser.js";
import { Import_stmtContext } from "./PineV6Parser.js";
import { Import_pathContext } from "./PineV6Parser.js";
import { Import_userContext } from "./PineV6Parser.js";
import { User_partContext } from "./PineV6Parser.js";
import { Fun_paramContext } from "./PineV6Parser.js";
import { Type_argsContext } from "./PineV6Parser.js";
import { Type_argContext } from "./PineV6Parser.js";
import { For_in_exprContext } from "./PineV6Parser.js";
import { Call_suffixContext } from "./PineV6Parser.js";
import { Fun_callContext } from "./PineV6Parser.js";
import { AtomContext } from "./PineV6Parser.js";
import { StmtContext } from "./PineV6Parser.js";
import { Fun_headContext } from "./PineV6Parser.js";
import { Var_defContext } from "./PineV6Parser.js";
import { Var_defsContext } from "./PineV6Parser.js";
import { Id_partContext } from "./PineV6Parser.js";
import { Arith_exprContext } from "./PineV6Parser.js";
import { Decl_modContext } from "./PineV6Parser.js";
import { Type_qualContext } from "./PineV6Parser.js";
import { Type_nameContext } from "./PineV6Parser.js";
import { Compound_assign_opContext } from "./PineV6Parser.js";
import { Var_assignContext } from "./PineV6Parser.js";
import { If_exprContext } from "./PineV6Parser.js";
import { Pos_argContext } from "./PineV6Parser.js";
import { Pos_argsContext } from "./PineV6Parser.js";
import { Pine_scriptContext } from "./PineV6Parser.js";
import { Global_stmtContext } from "./PineV6Parser.js";
import { Fun_def_stmtContext } from "./PineV6Parser.js";
import { Fun_def_singlelineContext } from "./PineV6Parser.js";
import { Fun_def_multilineContext } from "./PineV6Parser.js";
import { Fun_body_singlelineContext } from "./PineV6Parser.js";
import { Local_stmt_singlelineContext } from "./PineV6Parser.js";
import { Loop_breakContext } from "./PineV6Parser.js";
import { Loop_continueContext } from "./PineV6Parser.js";
import { Fun_body_multilineContext } from "./PineV6Parser.js";
import { Local_stmts_multilineContext } from "./PineV6Parser.js";
import { Local_stmts_listContext } from "./PineV6Parser.js";
import { Local_stmt_multilineContext } from "./PineV6Parser.js";
import { Ids_arrayContext } from "./PineV6Parser.js";
import { Arith_exprsContext } from "./PineV6Parser.js";
import { For_exprContext } from "./PineV6Parser.js";
import { Stmts_blockContext } from "./PineV6Parser.js";
import { Ternary_exprContext } from "./PineV6Parser.js";
import { Or_exprContext } from "./PineV6Parser.js";
import { And_exprContext } from "./PineV6Parser.js";
import { Eq_exprContext } from "./PineV6Parser.js";
import { Cmp_exprContext } from "./PineV6Parser.js";
import { Add_exprContext } from "./PineV6Parser.js";
import { Mult_exprContext } from "./PineV6Parser.js";
import { Unary_exprContext } from "./PineV6Parser.js";
import { Sqbr_exprContext } from "./PineV6Parser.js";
import { Fun_actual_argsContext } from "./PineV6Parser.js";
import { Kw_argsContext } from "./PineV6Parser.js";
import { Kw_argContext } from "./PineV6Parser.js";
import { LiteralContext } from "./PineV6Parser.js";
import { Num_literalContext } from "./PineV6Parser.js";


/**
 * This interface defines a complete generic visitor for a parse tree produced
 * by `PineV6Parser`.
 *
 * @param <Result> The return type of the visit operation. Use `void` for
 * operations with no return type.
 */
export class PineV6ParserVisitor<Result> extends AbstractParseTreeVisitor<Result> {
    /**
     * Visit a parse tree produced by `PineV6Parser.once_expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitOnce_expr?: (ctx: Once_exprContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.other_literal`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitOther_literal?: (ctx: Other_literalContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.global_stmt_content`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitGlobal_stmt_content?: (ctx: Global_stmt_contentContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.local_stmt_content`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLocal_stmt_content?: (ctx: Local_stmt_contentContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.id`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitId?: (ctx: IdContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.export_stmt`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitExport_stmt?: (ctx: Export_stmtContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.while_expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitWhile_expr?: (ctx: While_exprContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.switch_expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSwitch_expr?: (ctx: Switch_exprContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.switch_body`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSwitch_body?: (ctx: Switch_bodyContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.switch_case`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSwitch_case?: (ctx: Switch_caseContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.field_type`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitField_type?: (ctx: Field_typeContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.type_def_stmt`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitType_def_stmt?: (ctx: Type_def_stmtContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.type_body`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitType_body?: (ctx: Type_bodyContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.type_field`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitType_field?: (ctx: Type_fieldContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.method_def_stmt`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitMethod_def_stmt?: (ctx: Method_def_stmtContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.enum_def_stmt`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitEnum_def_stmt?: (ctx: Enum_def_stmtContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.enum_body`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitEnum_body?: (ctx: Enum_bodyContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.enum_field`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitEnum_field?: (ctx: Enum_fieldContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.import_stmt`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitImport_stmt?: (ctx: Import_stmtContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.import_path`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitImport_path?: (ctx: Import_pathContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.import_user`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitImport_user?: (ctx: Import_userContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.user_part`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitUser_part?: (ctx: User_partContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.fun_param`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFun_param?: (ctx: Fun_paramContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.type_args`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitType_args?: (ctx: Type_argsContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.type_arg`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitType_arg?: (ctx: Type_argContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.for_in_expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFor_in_expr?: (ctx: For_in_exprContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.call_suffix`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitCall_suffix?: (ctx: Call_suffixContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.fun_call`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFun_call?: (ctx: Fun_callContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.atom`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAtom?: (ctx: AtomContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.stmt`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitStmt?: (ctx: StmtContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.fun_head`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFun_head?: (ctx: Fun_headContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.var_def`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitVar_def?: (ctx: Var_defContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.var_defs`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitVar_defs?: (ctx: Var_defsContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.id_part`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitId_part?: (ctx: Id_partContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.arith_expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitArith_expr?: (ctx: Arith_exprContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.decl_mod`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitDecl_mod?: (ctx: Decl_modContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.type_qual`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitType_qual?: (ctx: Type_qualContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.type_name`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitType_name?: (ctx: Type_nameContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.compound_assign_op`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitCompound_assign_op?: (ctx: Compound_assign_opContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.var_assign`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitVar_assign?: (ctx: Var_assignContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.if_expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitIf_expr?: (ctx: If_exprContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.pos_arg`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitPos_arg?: (ctx: Pos_argContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.pos_args`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitPos_args?: (ctx: Pos_argsContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.pine_script`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitPine_script?: (ctx: Pine_scriptContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.global_stmt`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitGlobal_stmt?: (ctx: Global_stmtContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.fun_def_stmt`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFun_def_stmt?: (ctx: Fun_def_stmtContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.fun_def_singleline`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFun_def_singleline?: (ctx: Fun_def_singlelineContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.fun_def_multiline`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFun_def_multiline?: (ctx: Fun_def_multilineContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.fun_body_singleline`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFun_body_singleline?: (ctx: Fun_body_singlelineContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.local_stmt_singleline`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLocal_stmt_singleline?: (ctx: Local_stmt_singlelineContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.loop_break`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLoop_break?: (ctx: Loop_breakContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.loop_continue`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLoop_continue?: (ctx: Loop_continueContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.fun_body_multiline`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFun_body_multiline?: (ctx: Fun_body_multilineContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.local_stmts_multiline`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLocal_stmts_multiline?: (ctx: Local_stmts_multilineContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.local_stmts_list`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLocal_stmts_list?: (ctx: Local_stmts_listContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.local_stmt_multiline`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLocal_stmt_multiline?: (ctx: Local_stmt_multilineContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.ids_array`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitIds_array?: (ctx: Ids_arrayContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.arith_exprs`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitArith_exprs?: (ctx: Arith_exprsContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.for_expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFor_expr?: (ctx: For_exprContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.stmts_block`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitStmts_block?: (ctx: Stmts_blockContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.ternary_expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitTernary_expr?: (ctx: Ternary_exprContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.or_expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitOr_expr?: (ctx: Or_exprContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.and_expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAnd_expr?: (ctx: And_exprContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.eq_expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitEq_expr?: (ctx: Eq_exprContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.cmp_expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitCmp_expr?: (ctx: Cmp_exprContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.add_expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitAdd_expr?: (ctx: Add_exprContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.mult_expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitMult_expr?: (ctx: Mult_exprContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.unary_expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitUnary_expr?: (ctx: Unary_exprContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.sqbr_expr`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitSqbr_expr?: (ctx: Sqbr_exprContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.fun_actual_args`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitFun_actual_args?: (ctx: Fun_actual_argsContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.kw_args`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitKw_args?: (ctx: Kw_argsContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.kw_arg`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitKw_arg?: (ctx: Kw_argContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.literal`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitLiteral?: (ctx: LiteralContext) => Result;
    /**
     * Visit a parse tree produced by `PineV6Parser.num_literal`.
     * @param ctx the parse tree
     * @return the visitor result
     */
    visitNum_literal?: (ctx: Num_literalContext) => Result;
}

