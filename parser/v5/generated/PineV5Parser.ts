
import * as antlr from "antlr4ng";
import { Token } from "antlr4ng";

import { PineV5ParserVisitor } from "./PineV5ParserVisitor.js";

// for running tests with parameters, TODO: discuss strategy for typed parameters in CI
// eslint-disable-next-line no-unused-vars
type int = number;


export class PineV5Parser extends antlr.Parser {
    public static readonly BEGIN = 1;
    public static readonly END = 2;
    public static readonly LEND = 3;
    public static readonly WHILE = 4;
    public static readonly SWITCH = 5;
    public static readonly TYPE = 6;
    public static readonly METHOD = 7;
    public static readonly IMPORT = 8;
    public static readonly EXPORT = 9;
    public static readonly AS = 10;
    public static readonly VAR = 11;
    public static readonly VARIP = 12;
    public static readonly SERIES = 13;
    public static readonly SIMPLE = 14;
    public static readonly CONST = 15;
    public static readonly INT_TYPE = 16;
    public static readonly FLOAT_TYPE = 17;
    public static readonly BOOL_TYPE = 18;
    public static readonly STRING_TYPE = 19;
    public static readonly COLOR_TYPE = 20;
    public static readonly LINE_TYPE = 21;
    public static readonly LABEL_TYPE = 22;
    public static readonly BOX_TYPE = 23;
    public static readonly TABLE_TYPE = 24;
    public static readonly ASSIGN = 25;
    public static readonly LBEG = 26;
    public static readonly IF_COND = 27;
    public static readonly IF_COND_ELSE = 28;
    public static readonly FOR_STMT = 29;
    public static readonly FOR_STMT_TO = 30;
    public static readonly FOR_STMT_BY = 31;
    public static readonly BREAK = 32;
    public static readonly CONTINUE = 33;
    public static readonly OR = 34;
    public static readonly AND = 35;
    public static readonly NOT = 36;
    public static readonly BOOL_LITERAL = 37;
    public static readonly COND = 38;
    public static readonly COND_ELSE = 39;
    public static readonly EQ = 40;
    public static readonly NEQ = 41;
    public static readonly GT = 42;
    public static readonly GE = 43;
    public static readonly LT = 44;
    public static readonly LE = 45;
    public static readonly PLUS = 46;
    public static readonly MINUS = 47;
    public static readonly MUL = 48;
    public static readonly DIV = 49;
    public static readonly MOD = 50;
    public static readonly DEFINE = 51;
    public static readonly ARROW = 52;
    public static readonly COMMA = 53;
    public static readonly LPAR = 54;
    public static readonly RPAR = 55;
    public static readonly LSQBR = 56;
    public static readonly RSQBR = 57;
    public static readonly INT_LITERAL = 58;
    public static readonly FLOAT_LITERAL = 59;
    public static readonly STR_LITERAL = 60;
    public static readonly COLOR_LITERAL = 61;
    public static readonly ID = 62;
    public static readonly WS = 63;
    public static readonly LINE_COMMENT = 64;
    public static readonly BLOCK_COMMENT = 65;
    public static readonly DOT = 66;
    public static readonly RULE_while_expr = 0;
    public static readonly RULE_switch_expr = 1;
    public static readonly RULE_switch_body = 2;
    public static readonly RULE_switch_case = 3;
    public static readonly RULE_field_type = 4;
    public static readonly RULE_type_def_stmt = 5;
    public static readonly RULE_type_body = 6;
    public static readonly RULE_type_field = 7;
    public static readonly RULE_method_def_stmt = 8;
    public static readonly RULE_export_stmt = 9;
    public static readonly RULE_import_stmt = 10;
    public static readonly RULE_import_path = 11;
    public static readonly RULE_fun_param = 12;
    public static readonly RULE_type_args = 13;
    public static readonly RULE_type_arg = 14;
    public static readonly RULE_fun_call = 15;
    public static readonly RULE_stmt = 16;
    public static readonly RULE_fun_head = 17;
    public static readonly RULE_var_def = 18;
    public static readonly RULE_var_defs = 19;
    public static readonly RULE_id_part = 20;
    public static readonly RULE_global_stmt_content = 21;
    public static readonly RULE_local_stmt_content = 22;
    public static readonly RULE_arith_expr = 23;
    public static readonly RULE_decl_mod = 24;
    public static readonly RULE_type_qual = 25;
    public static readonly RULE_type_name = 26;
    public static readonly RULE_id = 27;
    public static readonly RULE_var_assign = 28;
    public static readonly RULE_pine_script = 29;
    public static readonly RULE_global_stmt = 30;
    public static readonly RULE_fun_def_stmt = 31;
    public static readonly RULE_fun_def_singleline = 32;
    public static readonly RULE_fun_def_multiline = 33;
    public static readonly RULE_fun_body_singleline = 34;
    public static readonly RULE_local_stmt_singleline = 35;
    public static readonly RULE_loop_break = 36;
    public static readonly RULE_loop_continue = 37;
    public static readonly RULE_fun_body_multiline = 38;
    public static readonly RULE_local_stmts_multiline = 39;
    public static readonly RULE_local_stmts_list = 40;
    public static readonly RULE_local_stmt_multiline = 41;
    public static readonly RULE_ids_array = 42;
    public static readonly RULE_arith_exprs = 43;
    public static readonly RULE_if_expr = 44;
    public static readonly RULE_for_expr = 45;
    public static readonly RULE_stmts_block = 46;
    public static readonly RULE_ternary_expr = 47;
    public static readonly RULE_or_expr = 48;
    public static readonly RULE_and_expr = 49;
    public static readonly RULE_eq_expr = 50;
    public static readonly RULE_cmp_expr = 51;
    public static readonly RULE_add_expr = 52;
    public static readonly RULE_mult_expr = 53;
    public static readonly RULE_unary_expr = 54;
    public static readonly RULE_sqbr_expr = 55;
    public static readonly RULE_atom = 56;
    public static readonly RULE_fun_actual_args = 57;
    public static readonly RULE_pos_args = 58;
    public static readonly RULE_kw_args = 59;
    public static readonly RULE_kw_arg = 60;
    public static readonly RULE_literal = 61;
    public static readonly RULE_num_literal = 62;
    public static readonly RULE_other_literal = 63;

    public static readonly literalNames = [
        null, null, null, null, "'while'", "'switch'", "'type'", "'method'", 
        "'import'", "'export'", "'as'", "'var'", "'varip'", "'series'", 
        "'simple'", "'const'", "'int'", "'float'", "'bool'", "'string'", 
        "'color'", "'line'", "'label'", "'box'", "'table'", "':='", null, 
        "'if'", "'else'", "'for'", "'to'", "'by'", "'break'", "'continue'", 
        "'or'", "'and'", "'not'", null, "'?'", "':'", "'=='", "'!='", "'>'", 
        "'>='", "'<'", "'<='", "'+'", "'-'", "'*'", "'/'", "'%'", "'='", 
        "'=>'", "','", "'('", "')'", "'['", "']'", null, null, null, null, 
        null, null, null, null, "'.'"
    ];

    public static readonly symbolicNames = [
        null, "BEGIN", "END", "LEND", "WHILE", "SWITCH", "TYPE", "METHOD", 
        "IMPORT", "EXPORT", "AS", "VAR", "VARIP", "SERIES", "SIMPLE", "CONST", 
        "INT_TYPE", "FLOAT_TYPE", "BOOL_TYPE", "STRING_TYPE", "COLOR_TYPE", 
        "LINE_TYPE", "LABEL_TYPE", "BOX_TYPE", "TABLE_TYPE", "ASSIGN", "LBEG", 
        "IF_COND", "IF_COND_ELSE", "FOR_STMT", "FOR_STMT_TO", "FOR_STMT_BY", 
        "BREAK", "CONTINUE", "OR", "AND", "NOT", "BOOL_LITERAL", "COND", 
        "COND_ELSE", "EQ", "NEQ", "GT", "GE", "LT", "LE", "PLUS", "MINUS", 
        "MUL", "DIV", "MOD", "DEFINE", "ARROW", "COMMA", "LPAR", "RPAR", 
        "LSQBR", "RSQBR", "INT_LITERAL", "FLOAT_LITERAL", "STR_LITERAL", 
        "COLOR_LITERAL", "ID", "WS", "LINE_COMMENT", "BLOCK_COMMENT", "DOT"
    ];
    public static readonly ruleNames = [
        "while_expr", "switch_expr", "switch_body", "switch_case", "field_type", 
        "type_def_stmt", "type_body", "type_field", "method_def_stmt", "export_stmt", 
        "import_stmt", "import_path", "fun_param", "type_args", "type_arg", 
        "fun_call", "stmt", "fun_head", "var_def", "var_defs", "id_part", 
        "global_stmt_content", "local_stmt_content", "arith_expr", "decl_mod", 
        "type_qual", "type_name", "id", "var_assign", "pine_script", "global_stmt", 
        "fun_def_stmt", "fun_def_singleline", "fun_def_multiline", "fun_body_singleline", 
        "local_stmt_singleline", "loop_break", "loop_continue", "fun_body_multiline", 
        "local_stmts_multiline", "local_stmts_list", "local_stmt_multiline", 
        "ids_array", "arith_exprs", "if_expr", "for_expr", "stmts_block", 
        "ternary_expr", "or_expr", "and_expr", "eq_expr", "cmp_expr", "add_expr", 
        "mult_expr", "unary_expr", "sqbr_expr", "atom", "fun_actual_args", 
        "pos_args", "kw_args", "kw_arg", "literal", "num_literal", "other_literal",
    ];

    public get grammarFileName(): string { return "PineV5Parser.g4"; }
    public get literalNames(): (string | null)[] { return PineV5Parser.literalNames; }
    public get symbolicNames(): (string | null)[] { return PineV5Parser.symbolicNames; }
    public get ruleNames(): string[] { return PineV5Parser.ruleNames; }
    public get serializedATN(): number[] { return PineV5Parser._serializedATN; }

    protected createFailedPredicateException(predicate?: string, message?: string): antlr.FailedPredicateException {
        return new antlr.FailedPredicateException(this, predicate, message);
    }

    public constructor(input: antlr.TokenStream) {
        super(input);
        this.interpreter = new antlr.ParserATNSimulator(this, PineV5Parser._ATN, PineV5Parser.decisionsToDFA, new antlr.PredictionContextCache());
    }
    public while_expr(): While_exprContext {
        let localContext = new While_exprContext(this.context, this.state);
        this.enterRule(localContext, 0, PineV5Parser.RULE_while_expr);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 128;
            this.match(PineV5Parser.WHILE);
            this.state = 129;
            this.ternary_expr();
            this.state = 130;
            this.stmts_block();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public switch_expr(): Switch_exprContext {
        let localContext = new Switch_exprContext(this.context, this.state);
        this.enterRule(localContext, 2, PineV5Parser.RULE_switch_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 132;
            this.match(PineV5Parser.SWITCH);
            this.state = 134;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 33547264) !== 0) || ((((_la - 36)) & ~0x1F) === 0 && ((1 << (_la - 36)) & 130288643) !== 0)) {
                {
                this.state = 133;
                this.ternary_expr();
                }
            }

            this.state = 136;
            this.switch_body();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public switch_body(): Switch_bodyContext {
        let localContext = new Switch_bodyContext(this.context, this.state);
        this.enterRule(localContext, 4, PineV5Parser.RULE_switch_body);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 138;
            this.match(PineV5Parser.BEGIN);
            this.state = 141;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                this.state = 141;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case PineV5Parser.AS:
                case PineV5Parser.SERIES:
                case PineV5Parser.SIMPLE:
                case PineV5Parser.CONST:
                case PineV5Parser.INT_TYPE:
                case PineV5Parser.FLOAT_TYPE:
                case PineV5Parser.BOOL_TYPE:
                case PineV5Parser.STRING_TYPE:
                case PineV5Parser.COLOR_TYPE:
                case PineV5Parser.LINE_TYPE:
                case PineV5Parser.LABEL_TYPE:
                case PineV5Parser.BOX_TYPE:
                case PineV5Parser.TABLE_TYPE:
                case PineV5Parser.NOT:
                case PineV5Parser.BOOL_LITERAL:
                case PineV5Parser.PLUS:
                case PineV5Parser.MINUS:
                case PineV5Parser.ARROW:
                case PineV5Parser.LPAR:
                case PineV5Parser.INT_LITERAL:
                case PineV5Parser.FLOAT_LITERAL:
                case PineV5Parser.STR_LITERAL:
                case PineV5Parser.COLOR_LITERAL:
                case PineV5Parser.ID:
                    {
                    this.state = 139;
                    this.switch_case();
                    }
                    break;
                case PineV5Parser.LEND:
                    {
                    this.state = 140;
                    this.match(PineV5Parser.LEND);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                this.state = 143;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 33547272) !== 0) || ((((_la - 36)) & ~0x1F) === 0 && ((1 << (_la - 36)) & 130354179) !== 0));
            this.state = 145;
            this.match(PineV5Parser.END);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public switch_case(): Switch_caseContext {
        let localContext = new Switch_caseContext(this.context, this.state);
        this.enterRule(localContext, 6, PineV5Parser.RULE_switch_case);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 148;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 33547264) !== 0) || ((((_la - 36)) & ~0x1F) === 0 && ((1 << (_la - 36)) & 130288643) !== 0)) {
                {
                this.state = 147;
                this.ternary_expr();
                }
            }

            this.state = 150;
            this.match(PineV5Parser.ARROW);
            this.state = 153;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV5Parser.WHILE:
            case PineV5Parser.SWITCH:
            case PineV5Parser.AS:
            case PineV5Parser.VAR:
            case PineV5Parser.VARIP:
            case PineV5Parser.SERIES:
            case PineV5Parser.SIMPLE:
            case PineV5Parser.CONST:
            case PineV5Parser.INT_TYPE:
            case PineV5Parser.FLOAT_TYPE:
            case PineV5Parser.BOOL_TYPE:
            case PineV5Parser.STRING_TYPE:
            case PineV5Parser.COLOR_TYPE:
            case PineV5Parser.LINE_TYPE:
            case PineV5Parser.LABEL_TYPE:
            case PineV5Parser.BOX_TYPE:
            case PineV5Parser.TABLE_TYPE:
            case PineV5Parser.IF_COND:
            case PineV5Parser.FOR_STMT:
            case PineV5Parser.BREAK:
            case PineV5Parser.CONTINUE:
            case PineV5Parser.NOT:
            case PineV5Parser.BOOL_LITERAL:
            case PineV5Parser.PLUS:
            case PineV5Parser.MINUS:
            case PineV5Parser.LPAR:
            case PineV5Parser.LSQBR:
            case PineV5Parser.INT_LITERAL:
            case PineV5Parser.FLOAT_LITERAL:
            case PineV5Parser.STR_LITERAL:
            case PineV5Parser.COLOR_LITERAL:
            case PineV5Parser.ID:
                {
                this.state = 151;
                this.local_stmt_singleline();
                }
                break;
            case PineV5Parser.BEGIN:
                {
                this.state = 152;
                this.stmts_block();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public field_type(): Field_typeContext {
        let localContext = new Field_typeContext(this.context, this.state);
        this.enterRule(localContext, 8, PineV5Parser.RULE_field_type);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 157;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 5, this.context) ) {
            case 1:
                {
                this.state = 155;
                this.type_name();
                }
                break;
            case 2:
                {
                this.state = 156;
                this.id();
                }
                break;
            }
            this.state = 160;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 44) {
                {
                this.state = 159;
                this.type_args();
                }
            }

            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public type_def_stmt(): Type_def_stmtContext {
        let localContext = new Type_def_stmtContext(this.context, this.state);
        this.enterRule(localContext, 10, PineV5Parser.RULE_type_def_stmt);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 162;
            this.match(PineV5Parser.TYPE);
            this.state = 163;
            this.id();
            this.state = 164;
            this.type_body();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public type_body(): Type_bodyContext {
        let localContext = new Type_bodyContext(this.context, this.state);
        this.enterRule(localContext, 12, PineV5Parser.RULE_type_body);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 166;
            this.match(PineV5Parser.BEGIN);
            this.state = 169;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                this.state = 169;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case PineV5Parser.AS:
                case PineV5Parser.SERIES:
                case PineV5Parser.SIMPLE:
                case PineV5Parser.CONST:
                case PineV5Parser.INT_TYPE:
                case PineV5Parser.FLOAT_TYPE:
                case PineV5Parser.BOOL_TYPE:
                case PineV5Parser.STRING_TYPE:
                case PineV5Parser.COLOR_TYPE:
                case PineV5Parser.LINE_TYPE:
                case PineV5Parser.LABEL_TYPE:
                case PineV5Parser.BOX_TYPE:
                case PineV5Parser.TABLE_TYPE:
                case PineV5Parser.ID:
                    {
                    this.state = 167;
                    this.type_field();
                    }
                    break;
                case PineV5Parser.LEND:
                    {
                    this.state = 168;
                    this.match(PineV5Parser.LEND);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                this.state = 171;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 33547272) !== 0) || _la === 62);
            this.state = 173;
            this.match(PineV5Parser.END);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public type_field(): Type_fieldContext {
        let localContext = new Type_fieldContext(this.context, this.state);
        this.enterRule(localContext, 14, PineV5Parser.RULE_type_field);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 176;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 9, this.context) ) {
            case 1:
                {
                this.state = 175;
                this.type_qual();
                }
                break;
            }
            this.state = 178;
            this.field_type();
            this.state = 179;
            this.id();
            this.state = 182;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 51) {
                {
                this.state = 180;
                this.match(PineV5Parser.DEFINE);
                this.state = 181;
                this.arith_expr();
                }
            }

            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public method_def_stmt(): Method_def_stmtContext {
        let localContext = new Method_def_stmtContext(this.context, this.state);
        this.enterRule(localContext, 16, PineV5Parser.RULE_method_def_stmt);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 184;
            this.match(PineV5Parser.METHOD);
            this.state = 185;
            this.fun_def_stmt();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public export_stmt(): Export_stmtContext {
        let localContext = new Export_stmtContext(this.context, this.state);
        this.enterRule(localContext, 18, PineV5Parser.RULE_export_stmt);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 187;
            this.match(PineV5Parser.EXPORT);
            this.state = 191;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV5Parser.TYPE:
                {
                this.state = 188;
                this.type_def_stmt();
                }
                break;
            case PineV5Parser.METHOD:
                {
                this.state = 189;
                this.method_def_stmt();
                }
                break;
            case PineV5Parser.AS:
            case PineV5Parser.SERIES:
            case PineV5Parser.SIMPLE:
            case PineV5Parser.CONST:
            case PineV5Parser.INT_TYPE:
            case PineV5Parser.FLOAT_TYPE:
            case PineV5Parser.BOOL_TYPE:
            case PineV5Parser.STRING_TYPE:
            case PineV5Parser.COLOR_TYPE:
            case PineV5Parser.LINE_TYPE:
            case PineV5Parser.LABEL_TYPE:
            case PineV5Parser.BOX_TYPE:
            case PineV5Parser.TABLE_TYPE:
            case PineV5Parser.ID:
                {
                this.state = 190;
                this.fun_def_stmt();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public import_stmt(): Import_stmtContext {
        let localContext = new Import_stmtContext(this.context, this.state);
        this.enterRule(localContext, 20, PineV5Parser.RULE_import_stmt);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 193;
            this.match(PineV5Parser.IMPORT);
            this.state = 194;
            this.import_path();
            this.state = 197;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 12, this.context) ) {
            case 1:
                {
                this.state = 195;
                this.match(PineV5Parser.AS);
                this.state = 196;
                this.id();
                }
                break;
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public import_path(): Import_pathContext {
        let localContext = new Import_pathContext(this.context, this.state);
        this.enterRule(localContext, 22, PineV5Parser.RULE_import_path);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 199;
            this.id();
            this.state = 208;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 49) {
                {
                {
                this.state = 200;
                this.match(PineV5Parser.DIV);
                this.state = 204;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case PineV5Parser.AS:
                case PineV5Parser.SERIES:
                case PineV5Parser.SIMPLE:
                case PineV5Parser.CONST:
                case PineV5Parser.INT_TYPE:
                case PineV5Parser.FLOAT_TYPE:
                case PineV5Parser.BOOL_TYPE:
                case PineV5Parser.STRING_TYPE:
                case PineV5Parser.COLOR_TYPE:
                case PineV5Parser.LINE_TYPE:
                case PineV5Parser.LABEL_TYPE:
                case PineV5Parser.BOX_TYPE:
                case PineV5Parser.TABLE_TYPE:
                case PineV5Parser.ID:
                    {
                    this.state = 201;
                    this.id();
                    }
                    break;
                case PineV5Parser.INT_LITERAL:
                    {
                    this.state = 202;
                    this.match(PineV5Parser.INT_LITERAL);
                    }
                    break;
                case PineV5Parser.FLOAT_LITERAL:
                    {
                    this.state = 203;
                    this.match(PineV5Parser.FLOAT_LITERAL);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                }
                this.state = 210;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public fun_param(): Fun_paramContext {
        let localContext = new Fun_paramContext(this.context, this.state);
        this.enterRule(localContext, 24, PineV5Parser.RULE_fun_param);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 212;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 15, this.context) ) {
            case 1:
                {
                this.state = 211;
                this.type_qual();
                }
                break;
            }
            this.state = 215;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 16, this.context) ) {
            case 1:
                {
                this.state = 214;
                this.field_type();
                }
                break;
            }
            this.state = 217;
            this.id();
            this.state = 220;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 51) {
                {
                this.state = 218;
                this.match(PineV5Parser.DEFINE);
                this.state = 219;
                this.arith_expr();
                }
            }

            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public type_args(): Type_argsContext {
        let localContext = new Type_argsContext(this.context, this.state);
        this.enterRule(localContext, 26, PineV5Parser.RULE_type_args);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 222;
            this.match(PineV5Parser.LT);
            this.state = 223;
            this.type_arg();
            this.state = 228;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 53) {
                {
                {
                this.state = 224;
                this.match(PineV5Parser.COMMA);
                this.state = 225;
                this.type_arg();
                }
                }
                this.state = 230;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 231;
            this.match(PineV5Parser.GT);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public type_arg(): Type_argContext {
        let localContext = new Type_argContext(this.context, this.state);
        this.enterRule(localContext, 28, PineV5Parser.RULE_type_arg);
        try {
            this.state = 235;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 19, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 233;
                this.type_name();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 234;
                this.id();
                }
                break;
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public fun_call(): Fun_callContext {
        let localContext = new Fun_callContext(this.context, this.state);
        this.enterRule(localContext, 30, PineV5Parser.RULE_fun_call);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 237;
            this.id();
            this.state = 239;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 44) {
                {
                this.state = 238;
                this.type_args();
                }
            }

            this.state = 241;
            this.match(PineV5Parser.LPAR);
            this.state = 243;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 704635936) !== 0) || ((((_la - 36)) & ~0x1F) === 0 && ((1 << (_la - 36)) & 130288643) !== 0)) {
                {
                this.state = 242;
                this.fun_actual_args();
                }
            }

            this.state = 245;
            this.match(PineV5Parser.RPAR);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public stmt(): StmtContext {
        let localContext = new StmtContext(this.context, this.state);
        this.enterRule(localContext, 32, PineV5Parser.RULE_stmt);
        try {
            this.state = 253;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 22, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 247;
                this.import_stmt();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 248;
                this.export_stmt();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 249;
                this.type_def_stmt();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 250;
                this.method_def_stmt();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 251;
                this.fun_def_stmt();
                }
                break;
            case 6:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 252;
                this.global_stmt();
                }
                break;
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public fun_head(): Fun_headContext {
        let localContext = new Fun_headContext(this.context, this.state);
        this.enterRule(localContext, 34, PineV5Parser.RULE_fun_head);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 255;
            this.match(PineV5Parser.LPAR);
            this.state = 264;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 33547264) !== 0) || _la === 62) {
                {
                this.state = 256;
                this.fun_param();
                this.state = 261;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 53) {
                    {
                    {
                    this.state = 257;
                    this.match(PineV5Parser.COMMA);
                    this.state = 258;
                    this.fun_param();
                    }
                    }
                    this.state = 263;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                }
            }

            this.state = 266;
            this.match(PineV5Parser.RPAR);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public var_def(): Var_defContext {
        let localContext = new Var_defContext(this.context, this.state);
        this.enterRule(localContext, 36, PineV5Parser.RULE_var_def);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 269;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 11 || _la === 12) {
                {
                this.state = 268;
                this.decl_mod();
                }
            }

            this.state = 272;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 26, this.context) ) {
            case 1:
                {
                this.state = 271;
                this.type_qual();
                }
                break;
            }
            this.state = 275;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 27, this.context) ) {
            case 1:
                {
                this.state = 274;
                this.field_type();
                }
                break;
            }
            this.state = 277;
            this.id();
            this.state = 278;
            this.match(PineV5Parser.DEFINE);
            this.state = 279;
            this.arith_expr();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public var_defs(): Var_defsContext {
        let localContext = new Var_defsContext(this.context, this.state);
        this.enterRule(localContext, 38, PineV5Parser.RULE_var_defs);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 282;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 11 || _la === 12) {
                {
                this.state = 281;
                this.decl_mod();
                }
            }

            this.state = 285;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 29, this.context) ) {
            case 1:
                {
                this.state = 284;
                this.type_qual();
                }
                break;
            }
            this.state = 288;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 33547264) !== 0) || _la === 62) {
                {
                this.state = 287;
                this.field_type();
                }
            }

            this.state = 290;
            this.ids_array();
            this.state = 291;
            this.match(PineV5Parser.DEFINE);
            this.state = 292;
            this.arith_expr();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public id_part(): Id_partContext {
        let localContext = new Id_partContext(this.context, this.state);
        this.enterRule(localContext, 40, PineV5Parser.RULE_id_part);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 294;
            _la = this.tokenStream.LA(1);
            if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 33547264) !== 0) || _la === 62)) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public global_stmt_content(): Global_stmt_contentContext {
        let localContext = new Global_stmt_contentContext(this.context, this.state);
        this.enterRule(localContext, 42, PineV5Parser.RULE_global_stmt_content);
        try {
            this.state = 307;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 31, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 296;
                this.var_def();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 297;
                this.var_defs();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 298;
                this.fun_call();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 299;
                this.if_expr();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 300;
                this.var_assign();
                }
                break;
            case 6:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 301;
                this.for_expr();
                }
                break;
            case 7:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 302;
                this.while_expr();
                }
                break;
            case 8:
                this.enterOuterAlt(localContext, 8);
                {
                this.state = 303;
                this.switch_expr();
                }
                break;
            case 9:
                this.enterOuterAlt(localContext, 9);
                {
                this.state = 304;
                this.loop_break();
                }
                break;
            case 10:
                this.enterOuterAlt(localContext, 10);
                {
                this.state = 305;
                this.loop_continue();
                }
                break;
            case 11:
                this.enterOuterAlt(localContext, 11);
                {
                this.state = 306;
                this.arith_expr();
                }
                break;
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public local_stmt_content(): Local_stmt_contentContext {
        let localContext = new Local_stmt_contentContext(this.context, this.state);
        this.enterRule(localContext, 44, PineV5Parser.RULE_local_stmt_content);
        try {
            this.state = 317;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 32, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 309;
                this.var_def();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 310;
                this.var_defs();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 311;
                this.arith_expr();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 312;
                this.arith_exprs();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 313;
                this.var_assign();
                }
                break;
            case 6:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 314;
                this.while_expr();
                }
                break;
            case 7:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 315;
                this.loop_break();
                }
                break;
            case 8:
                this.enterOuterAlt(localContext, 8);
                {
                this.state = 316;
                this.loop_continue();
                }
                break;
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public arith_expr(): Arith_exprContext {
        let localContext = new Arith_exprContext(this.context, this.state);
        this.enterRule(localContext, 46, PineV5Parser.RULE_arith_expr);
        try {
            this.state = 323;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV5Parser.AS:
            case PineV5Parser.SERIES:
            case PineV5Parser.SIMPLE:
            case PineV5Parser.CONST:
            case PineV5Parser.INT_TYPE:
            case PineV5Parser.FLOAT_TYPE:
            case PineV5Parser.BOOL_TYPE:
            case PineV5Parser.STRING_TYPE:
            case PineV5Parser.COLOR_TYPE:
            case PineV5Parser.LINE_TYPE:
            case PineV5Parser.LABEL_TYPE:
            case PineV5Parser.BOX_TYPE:
            case PineV5Parser.TABLE_TYPE:
            case PineV5Parser.NOT:
            case PineV5Parser.BOOL_LITERAL:
            case PineV5Parser.PLUS:
            case PineV5Parser.MINUS:
            case PineV5Parser.LPAR:
            case PineV5Parser.INT_LITERAL:
            case PineV5Parser.FLOAT_LITERAL:
            case PineV5Parser.STR_LITERAL:
            case PineV5Parser.COLOR_LITERAL:
            case PineV5Parser.ID:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 319;
                this.ternary_expr();
                }
                break;
            case PineV5Parser.IF_COND:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 320;
                this.if_expr();
                }
                break;
            case PineV5Parser.FOR_STMT:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 321;
                this.for_expr();
                }
                break;
            case PineV5Parser.SWITCH:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 322;
                this.switch_expr();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public decl_mod(): Decl_modContext {
        let localContext = new Decl_modContext(this.context, this.state);
        this.enterRule(localContext, 48, PineV5Parser.RULE_decl_mod);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 325;
            _la = this.tokenStream.LA(1);
            if(!(_la === 11 || _la === 12)) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public type_qual(): Type_qualContext {
        let localContext = new Type_qualContext(this.context, this.state);
        this.enterRule(localContext, 50, PineV5Parser.RULE_type_qual);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 327;
            _la = this.tokenStream.LA(1);
            if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 57344) !== 0))) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public type_name(): Type_nameContext {
        let localContext = new Type_nameContext(this.context, this.state);
        this.enterRule(localContext, 52, PineV5Parser.RULE_type_name);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 329;
            _la = this.tokenStream.LA(1);
            if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 33488896) !== 0))) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public id(): IdContext {
        let localContext = new IdContext(this.context, this.state);
        this.enterRule(localContext, 54, PineV5Parser.RULE_id);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 331;
            this.id_part();
            this.state = 336;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 66) {
                {
                {
                this.state = 332;
                this.match(PineV5Parser.DOT);
                this.state = 333;
                this.id_part();
                }
                }
                this.state = 338;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public var_assign(): Var_assignContext {
        let localContext = new Var_assignContext(this.context, this.state);
        this.enterRule(localContext, 56, PineV5Parser.RULE_var_assign);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 339;
            this.id();
            this.state = 340;
            this.match(PineV5Parser.ASSIGN);
            this.state = 341;
            this.arith_expr();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public pine_script(): Pine_scriptContext {
        let localContext = new Pine_scriptContext(this.context, this.state);
        this.enterRule(localContext, 58, PineV5Parser.RULE_pine_script);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 347;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 704643064) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 2101395507) !== 0)) {
                {
                this.state = 345;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case PineV5Parser.WHILE:
                case PineV5Parser.SWITCH:
                case PineV5Parser.TYPE:
                case PineV5Parser.METHOD:
                case PineV5Parser.IMPORT:
                case PineV5Parser.EXPORT:
                case PineV5Parser.AS:
                case PineV5Parser.VAR:
                case PineV5Parser.VARIP:
                case PineV5Parser.SERIES:
                case PineV5Parser.SIMPLE:
                case PineV5Parser.CONST:
                case PineV5Parser.INT_TYPE:
                case PineV5Parser.FLOAT_TYPE:
                case PineV5Parser.BOOL_TYPE:
                case PineV5Parser.STRING_TYPE:
                case PineV5Parser.COLOR_TYPE:
                case PineV5Parser.LINE_TYPE:
                case PineV5Parser.LABEL_TYPE:
                case PineV5Parser.BOX_TYPE:
                case PineV5Parser.TABLE_TYPE:
                case PineV5Parser.IF_COND:
                case PineV5Parser.FOR_STMT:
                case PineV5Parser.BREAK:
                case PineV5Parser.CONTINUE:
                case PineV5Parser.NOT:
                case PineV5Parser.BOOL_LITERAL:
                case PineV5Parser.PLUS:
                case PineV5Parser.MINUS:
                case PineV5Parser.LPAR:
                case PineV5Parser.LSQBR:
                case PineV5Parser.INT_LITERAL:
                case PineV5Parser.FLOAT_LITERAL:
                case PineV5Parser.STR_LITERAL:
                case PineV5Parser.COLOR_LITERAL:
                case PineV5Parser.ID:
                    {
                    this.state = 343;
                    this.stmt();
                    }
                    break;
                case PineV5Parser.LEND:
                    {
                    this.state = 344;
                    this.match(PineV5Parser.LEND);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                this.state = 349;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 350;
            this.match(PineV5Parser.EOF);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public global_stmt(): Global_stmtContext {
        let localContext = new Global_stmtContext(this.context, this.state);
        this.enterRule(localContext, 60, PineV5Parser.RULE_global_stmt);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 352;
            this.global_stmt_content();
            this.state = 357;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 53) {
                {
                {
                this.state = 353;
                this.match(PineV5Parser.COMMA);
                this.state = 354;
                this.global_stmt_content();
                }
                }
                this.state = 359;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public fun_def_stmt(): Fun_def_stmtContext {
        let localContext = new Fun_def_stmtContext(this.context, this.state);
        this.enterRule(localContext, 62, PineV5Parser.RULE_fun_def_stmt);
        try {
            this.state = 362;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 38, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 360;
                this.fun_def_singleline();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 361;
                this.fun_def_multiline();
                }
                break;
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public fun_def_singleline(): Fun_def_singlelineContext {
        let localContext = new Fun_def_singlelineContext(this.context, this.state);
        this.enterRule(localContext, 64, PineV5Parser.RULE_fun_def_singleline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 364;
            this.id();
            this.state = 365;
            this.fun_head();
            this.state = 366;
            this.match(PineV5Parser.ARROW);
            this.state = 367;
            this.fun_body_singleline();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public fun_def_multiline(): Fun_def_multilineContext {
        let localContext = new Fun_def_multilineContext(this.context, this.state);
        this.enterRule(localContext, 66, PineV5Parser.RULE_fun_def_multiline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 369;
            this.id();
            this.state = 370;
            this.fun_head();
            this.state = 371;
            this.match(PineV5Parser.ARROW);
            this.state = 372;
            this.fun_body_multiline();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public fun_body_singleline(): Fun_body_singlelineContext {
        let localContext = new Fun_body_singlelineContext(this.context, this.state);
        this.enterRule(localContext, 68, PineV5Parser.RULE_fun_body_singleline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 374;
            this.local_stmt_singleline();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public local_stmt_singleline(): Local_stmt_singlelineContext {
        let localContext = new Local_stmt_singlelineContext(this.context, this.state);
        this.enterRule(localContext, 70, PineV5Parser.RULE_local_stmt_singleline);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 376;
            this.local_stmt_content();
            this.state = 381;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 53) {
                {
                {
                this.state = 377;
                this.match(PineV5Parser.COMMA);
                this.state = 378;
                this.local_stmt_content();
                }
                }
                this.state = 383;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public loop_break(): Loop_breakContext {
        let localContext = new Loop_breakContext(this.context, this.state);
        this.enterRule(localContext, 72, PineV5Parser.RULE_loop_break);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 384;
            this.match(PineV5Parser.BREAK);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public loop_continue(): Loop_continueContext {
        let localContext = new Loop_continueContext(this.context, this.state);
        this.enterRule(localContext, 74, PineV5Parser.RULE_loop_continue);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 386;
            this.match(PineV5Parser.CONTINUE);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public fun_body_multiline(): Fun_body_multilineContext {
        let localContext = new Fun_body_multilineContext(this.context, this.state);
        this.enterRule(localContext, 76, PineV5Parser.RULE_fun_body_multiline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 388;
            this.local_stmts_multiline();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public local_stmts_multiline(): Local_stmts_multilineContext {
        let localContext = new Local_stmts_multilineContext(this.context, this.state);
        this.enterRule(localContext, 78, PineV5Parser.RULE_local_stmts_multiline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 390;
            this.match(PineV5Parser.BEGIN);
            this.state = 391;
            this.local_stmts_list();
            this.state = 392;
            this.match(PineV5Parser.END);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public local_stmts_list(): Local_stmts_listContext {
        let localContext = new Local_stmts_listContext(this.context, this.state);
        this.enterRule(localContext, 80, PineV5Parser.RULE_local_stmts_list);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 396;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                this.state = 396;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case PineV5Parser.WHILE:
                case PineV5Parser.SWITCH:
                case PineV5Parser.AS:
                case PineV5Parser.VAR:
                case PineV5Parser.VARIP:
                case PineV5Parser.SERIES:
                case PineV5Parser.SIMPLE:
                case PineV5Parser.CONST:
                case PineV5Parser.INT_TYPE:
                case PineV5Parser.FLOAT_TYPE:
                case PineV5Parser.BOOL_TYPE:
                case PineV5Parser.STRING_TYPE:
                case PineV5Parser.COLOR_TYPE:
                case PineV5Parser.LINE_TYPE:
                case PineV5Parser.LABEL_TYPE:
                case PineV5Parser.BOX_TYPE:
                case PineV5Parser.TABLE_TYPE:
                case PineV5Parser.IF_COND:
                case PineV5Parser.FOR_STMT:
                case PineV5Parser.BREAK:
                case PineV5Parser.CONTINUE:
                case PineV5Parser.NOT:
                case PineV5Parser.BOOL_LITERAL:
                case PineV5Parser.PLUS:
                case PineV5Parser.MINUS:
                case PineV5Parser.LPAR:
                case PineV5Parser.LSQBR:
                case PineV5Parser.INT_LITERAL:
                case PineV5Parser.FLOAT_LITERAL:
                case PineV5Parser.STR_LITERAL:
                case PineV5Parser.COLOR_LITERAL:
                case PineV5Parser.ID:
                    {
                    this.state = 394;
                    this.local_stmt_multiline();
                    }
                    break;
                case PineV5Parser.LEND:
                    {
                    this.state = 395;
                    this.match(PineV5Parser.LEND);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                this.state = 398;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 704642104) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 2101395507) !== 0));
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public local_stmt_multiline(): Local_stmt_multilineContext {
        let localContext = new Local_stmt_multilineContext(this.context, this.state);
        this.enterRule(localContext, 82, PineV5Parser.RULE_local_stmt_multiline);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 400;
            this.local_stmt_content();
            this.state = 405;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 53) {
                {
                {
                this.state = 401;
                this.match(PineV5Parser.COMMA);
                this.state = 402;
                this.local_stmt_content();
                }
                }
                this.state = 407;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public ids_array(): Ids_arrayContext {
        let localContext = new Ids_arrayContext(this.context, this.state);
        this.enterRule(localContext, 84, PineV5Parser.RULE_ids_array);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 408;
            this.match(PineV5Parser.LSQBR);
            this.state = 409;
            this.id();
            this.state = 414;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 53) {
                {
                {
                this.state = 410;
                this.match(PineV5Parser.COMMA);
                this.state = 411;
                this.id();
                }
                }
                this.state = 416;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 417;
            this.match(PineV5Parser.RSQBR);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public arith_exprs(): Arith_exprsContext {
        let localContext = new Arith_exprsContext(this.context, this.state);
        this.enterRule(localContext, 86, PineV5Parser.RULE_arith_exprs);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 419;
            this.match(PineV5Parser.LSQBR);
            this.state = 420;
            this.arith_expr();
            this.state = 425;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 53) {
                {
                {
                this.state = 421;
                this.match(PineV5Parser.COMMA);
                this.state = 422;
                this.arith_expr();
                }
                }
                this.state = 427;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 428;
            this.match(PineV5Parser.RSQBR);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public if_expr(): If_exprContext {
        let localContext = new If_exprContext(this.context, this.state);
        this.enterRule(localContext, 88, PineV5Parser.RULE_if_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 430;
            this.match(PineV5Parser.IF_COND);
            this.state = 431;
            this.ternary_expr();
            this.state = 432;
            this.stmts_block();
            this.state = 441;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 46, this.context) ) {
            case 1:
                {
                this.state = 436;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 3) {
                    {
                    {
                    this.state = 433;
                    this.match(PineV5Parser.LEND);
                    }
                    }
                    this.state = 438;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                this.state = 439;
                this.match(PineV5Parser.IF_COND_ELSE);
                this.state = 440;
                this.stmts_block();
                }
                break;
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public for_expr(): For_exprContext {
        let localContext = new For_exprContext(this.context, this.state);
        this.enterRule(localContext, 90, PineV5Parser.RULE_for_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 443;
            this.match(PineV5Parser.FOR_STMT);
            this.state = 444;
            this.var_def();
            this.state = 445;
            this.match(PineV5Parser.FOR_STMT_TO);
            this.state = 446;
            this.ternary_expr();
            this.state = 449;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 31) {
                {
                this.state = 447;
                this.match(PineV5Parser.FOR_STMT_BY);
                this.state = 448;
                this.ternary_expr();
                }
            }

            this.state = 451;
            this.stmts_block();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public stmts_block(): Stmts_blockContext {
        let localContext = new Stmts_blockContext(this.context, this.state);
        this.enterRule(localContext, 92, PineV5Parser.RULE_stmts_block);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 453;
            this.fun_body_multiline();
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public ternary_expr(): Ternary_exprContext {
        let localContext = new Ternary_exprContext(this.context, this.state);
        this.enterRule(localContext, 94, PineV5Parser.RULE_ternary_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 455;
            this.or_expr();
            this.state = 461;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 38) {
                {
                this.state = 456;
                this.match(PineV5Parser.COND);
                this.state = 457;
                this.ternary_expr();
                this.state = 458;
                this.match(PineV5Parser.COND_ELSE);
                this.state = 459;
                this.ternary_expr();
                }
            }

            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public or_expr(): Or_exprContext {
        let localContext = new Or_exprContext(this.context, this.state);
        this.enterRule(localContext, 96, PineV5Parser.RULE_or_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 463;
            this.and_expr();
            this.state = 468;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 34) {
                {
                {
                this.state = 464;
                this.match(PineV5Parser.OR);
                this.state = 465;
                this.and_expr();
                }
                }
                this.state = 470;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public and_expr(): And_exprContext {
        let localContext = new And_exprContext(this.context, this.state);
        this.enterRule(localContext, 98, PineV5Parser.RULE_and_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 471;
            this.eq_expr();
            this.state = 476;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 35) {
                {
                {
                this.state = 472;
                this.match(PineV5Parser.AND);
                this.state = 473;
                this.eq_expr();
                }
                }
                this.state = 478;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public eq_expr(): Eq_exprContext {
        let localContext = new Eq_exprContext(this.context, this.state);
        this.enterRule(localContext, 100, PineV5Parser.RULE_eq_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 479;
            this.cmp_expr();
            this.state = 484;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 40 || _la === 41) {
                {
                {
                this.state = 480;
                _la = this.tokenStream.LA(1);
                if(!(_la === 40 || _la === 41)) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                this.state = 481;
                this.cmp_expr();
                }
                }
                this.state = 486;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public cmp_expr(): Cmp_exprContext {
        let localContext = new Cmp_exprContext(this.context, this.state);
        this.enterRule(localContext, 102, PineV5Parser.RULE_cmp_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 487;
            this.add_expr();
            this.state = 492;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (((((_la - 42)) & ~0x1F) === 0 && ((1 << (_la - 42)) & 15) !== 0)) {
                {
                {
                this.state = 488;
                _la = this.tokenStream.LA(1);
                if(!(((((_la - 42)) & ~0x1F) === 0 && ((1 << (_la - 42)) & 15) !== 0))) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                this.state = 489;
                this.add_expr();
                }
                }
                this.state = 494;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public add_expr(): Add_exprContext {
        let localContext = new Add_exprContext(this.context, this.state);
        this.enterRule(localContext, 104, PineV5Parser.RULE_add_expr);
        let _la: number;
        try {
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 495;
            this.mult_expr();
            this.state = 500;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 53, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
                    {
                    {
                    this.state = 496;
                    _la = this.tokenStream.LA(1);
                    if(!(_la === 46 || _la === 47)) {
                    this.errorHandler.recoverInline(this);
                    }
                    else {
                        this.errorHandler.reportMatch(this);
                        this.consume();
                    }
                    this.state = 497;
                    this.mult_expr();
                    }
                    }
                }
                this.state = 502;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 53, this.context);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public mult_expr(): Mult_exprContext {
        let localContext = new Mult_exprContext(this.context, this.state);
        this.enterRule(localContext, 106, PineV5Parser.RULE_mult_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 503;
            this.unary_expr();
            this.state = 508;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (((((_la - 48)) & ~0x1F) === 0 && ((1 << (_la - 48)) & 7) !== 0)) {
                {
                {
                this.state = 504;
                _la = this.tokenStream.LA(1);
                if(!(((((_la - 48)) & ~0x1F) === 0 && ((1 << (_la - 48)) & 7) !== 0))) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                this.state = 505;
                this.unary_expr();
                }
                }
                this.state = 510;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public unary_expr(): Unary_exprContext {
        let localContext = new Unary_exprContext(this.context, this.state);
        this.enterRule(localContext, 108, PineV5Parser.RULE_unary_expr);
        try {
            this.state = 518;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV5Parser.AS:
            case PineV5Parser.SERIES:
            case PineV5Parser.SIMPLE:
            case PineV5Parser.CONST:
            case PineV5Parser.INT_TYPE:
            case PineV5Parser.FLOAT_TYPE:
            case PineV5Parser.BOOL_TYPE:
            case PineV5Parser.STRING_TYPE:
            case PineV5Parser.COLOR_TYPE:
            case PineV5Parser.LINE_TYPE:
            case PineV5Parser.LABEL_TYPE:
            case PineV5Parser.BOX_TYPE:
            case PineV5Parser.TABLE_TYPE:
            case PineV5Parser.BOOL_LITERAL:
            case PineV5Parser.LPAR:
            case PineV5Parser.INT_LITERAL:
            case PineV5Parser.FLOAT_LITERAL:
            case PineV5Parser.STR_LITERAL:
            case PineV5Parser.COLOR_LITERAL:
            case PineV5Parser.ID:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 511;
                this.sqbr_expr();
                }
                break;
            case PineV5Parser.NOT:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 512;
                this.match(PineV5Parser.NOT);
                this.state = 513;
                this.sqbr_expr();
                }
                break;
            case PineV5Parser.PLUS:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 514;
                this.match(PineV5Parser.PLUS);
                this.state = 515;
                this.sqbr_expr();
                }
                break;
            case PineV5Parser.MINUS:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 516;
                this.match(PineV5Parser.MINUS);
                this.state = 517;
                this.sqbr_expr();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public sqbr_expr(): Sqbr_exprContext {
        let localContext = new Sqbr_exprContext(this.context, this.state);
        this.enterRule(localContext, 110, PineV5Parser.RULE_sqbr_expr);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 520;
            this.atom();
            this.state = 525;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 56, this.context) ) {
            case 1:
                {
                this.state = 521;
                this.match(PineV5Parser.LSQBR);
                this.state = 522;
                this.arith_expr();
                this.state = 523;
                this.match(PineV5Parser.RSQBR);
                }
                break;
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public atom(): AtomContext {
        let localContext = new AtomContext(this.context, this.state);
        this.enterRule(localContext, 112, PineV5Parser.RULE_atom);
        try {
            this.state = 534;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 57, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 527;
                this.fun_call();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 528;
                this.id();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 529;
                this.literal();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 530;
                this.match(PineV5Parser.LPAR);
                this.state = 531;
                this.arith_expr();
                this.state = 532;
                this.match(PineV5Parser.RPAR);
                }
                break;
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public fun_actual_args(): Fun_actual_argsContext {
        let localContext = new Fun_actual_argsContext(this.context, this.state);
        this.enterRule(localContext, 114, PineV5Parser.RULE_fun_actual_args);
        let _la: number;
        try {
            this.state = 542;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 59, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 536;
                this.kw_args();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 537;
                this.pos_args();
                this.state = 540;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 53) {
                    {
                    this.state = 538;
                    this.match(PineV5Parser.COMMA);
                    this.state = 539;
                    this.kw_args();
                    }
                }

                }
                break;
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public pos_args(): Pos_argsContext {
        let localContext = new Pos_argsContext(this.context, this.state);
        this.enterRule(localContext, 116, PineV5Parser.RULE_pos_args);
        try {
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 544;
            this.arith_expr();
            this.state = 549;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 60, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
                    {
                    {
                    this.state = 545;
                    this.match(PineV5Parser.COMMA);
                    this.state = 546;
                    this.arith_expr();
                    }
                    }
                }
                this.state = 551;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 60, this.context);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public kw_args(): Kw_argsContext {
        let localContext = new Kw_argsContext(this.context, this.state);
        this.enterRule(localContext, 118, PineV5Parser.RULE_kw_args);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 552;
            this.kw_arg();
            this.state = 557;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 53) {
                {
                {
                this.state = 553;
                this.match(PineV5Parser.COMMA);
                this.state = 554;
                this.kw_arg();
                }
                }
                this.state = 559;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public kw_arg(): Kw_argContext {
        let localContext = new Kw_argContext(this.context, this.state);
        this.enterRule(localContext, 120, PineV5Parser.RULE_kw_arg);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 560;
            this.id();
            this.state = 561;
            this.match(PineV5Parser.DEFINE);
            this.state = 564;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV5Parser.SWITCH:
            case PineV5Parser.AS:
            case PineV5Parser.SERIES:
            case PineV5Parser.SIMPLE:
            case PineV5Parser.CONST:
            case PineV5Parser.INT_TYPE:
            case PineV5Parser.FLOAT_TYPE:
            case PineV5Parser.BOOL_TYPE:
            case PineV5Parser.STRING_TYPE:
            case PineV5Parser.COLOR_TYPE:
            case PineV5Parser.LINE_TYPE:
            case PineV5Parser.LABEL_TYPE:
            case PineV5Parser.BOX_TYPE:
            case PineV5Parser.TABLE_TYPE:
            case PineV5Parser.IF_COND:
            case PineV5Parser.FOR_STMT:
            case PineV5Parser.NOT:
            case PineV5Parser.BOOL_LITERAL:
            case PineV5Parser.PLUS:
            case PineV5Parser.MINUS:
            case PineV5Parser.LPAR:
            case PineV5Parser.INT_LITERAL:
            case PineV5Parser.FLOAT_LITERAL:
            case PineV5Parser.STR_LITERAL:
            case PineV5Parser.COLOR_LITERAL:
            case PineV5Parser.ID:
                {
                this.state = 562;
                this.arith_expr();
                }
                break;
            case PineV5Parser.LSQBR:
                {
                this.state = 563;
                this.arith_exprs();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public literal(): LiteralContext {
        let localContext = new LiteralContext(this.context, this.state);
        this.enterRule(localContext, 122, PineV5Parser.RULE_literal);
        try {
            this.state = 568;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV5Parser.INT_LITERAL:
            case PineV5Parser.FLOAT_LITERAL:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 566;
                this.num_literal();
                }
                break;
            case PineV5Parser.BOOL_LITERAL:
            case PineV5Parser.STR_LITERAL:
            case PineV5Parser.COLOR_LITERAL:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 567;
                this.other_literal();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public num_literal(): Num_literalContext {
        let localContext = new Num_literalContext(this.context, this.state);
        this.enterRule(localContext, 124, PineV5Parser.RULE_num_literal);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 570;
            _la = this.tokenStream.LA(1);
            if(!(_la === 58 || _la === 59)) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }
    public other_literal(): Other_literalContext {
        let localContext = new Other_literalContext(this.context, this.state);
        this.enterRule(localContext, 126, PineV5Parser.RULE_other_literal);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 572;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 37)) & ~0x1F) === 0 && ((1 << (_la - 37)) & 25165825) !== 0))) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
            } else {
                throw re;
            }
        }
        finally {
            this.exitRule();
        }
        return localContext;
    }

    public static readonly _serializedATN: number[] = [
        4,1,66,575,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,2,6,7,
        6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,2,11,7,11,2,12,7,12,2,13,7,13,
        2,14,7,14,2,15,7,15,2,16,7,16,2,17,7,17,2,18,7,18,2,19,7,19,2,20,
        7,20,2,21,7,21,2,22,7,22,2,23,7,23,2,24,7,24,2,25,7,25,2,26,7,26,
        2,27,7,27,2,28,7,28,2,29,7,29,2,30,7,30,2,31,7,31,2,32,7,32,2,33,
        7,33,2,34,7,34,2,35,7,35,2,36,7,36,2,37,7,37,2,38,7,38,2,39,7,39,
        2,40,7,40,2,41,7,41,2,42,7,42,2,43,7,43,2,44,7,44,2,45,7,45,2,46,
        7,46,2,47,7,47,2,48,7,48,2,49,7,49,2,50,7,50,2,51,7,51,2,52,7,52,
        2,53,7,53,2,54,7,54,2,55,7,55,2,56,7,56,2,57,7,57,2,58,7,58,2,59,
        7,59,2,60,7,60,2,61,7,61,2,62,7,62,2,63,7,63,1,0,1,0,1,0,1,0,1,1,
        1,1,3,1,135,8,1,1,1,1,1,1,2,1,2,1,2,4,2,142,8,2,11,2,12,2,143,1,
        2,1,2,1,3,3,3,149,8,3,1,3,1,3,1,3,3,3,154,8,3,1,4,1,4,3,4,158,8,
        4,1,4,3,4,161,8,4,1,5,1,5,1,5,1,5,1,6,1,6,1,6,4,6,170,8,6,11,6,12,
        6,171,1,6,1,6,1,7,3,7,177,8,7,1,7,1,7,1,7,1,7,3,7,183,8,7,1,8,1,
        8,1,8,1,9,1,9,1,9,1,9,3,9,192,8,9,1,10,1,10,1,10,1,10,3,10,198,8,
        10,1,11,1,11,1,11,1,11,1,11,3,11,205,8,11,5,11,207,8,11,10,11,12,
        11,210,9,11,1,12,3,12,213,8,12,1,12,3,12,216,8,12,1,12,1,12,1,12,
        3,12,221,8,12,1,13,1,13,1,13,1,13,5,13,227,8,13,10,13,12,13,230,
        9,13,1,13,1,13,1,14,1,14,3,14,236,8,14,1,15,1,15,3,15,240,8,15,1,
        15,1,15,3,15,244,8,15,1,15,1,15,1,16,1,16,1,16,1,16,1,16,1,16,3,
        16,254,8,16,1,17,1,17,1,17,1,17,5,17,260,8,17,10,17,12,17,263,9,
        17,3,17,265,8,17,1,17,1,17,1,18,3,18,270,8,18,1,18,3,18,273,8,18,
        1,18,3,18,276,8,18,1,18,1,18,1,18,1,18,1,19,3,19,283,8,19,1,19,3,
        19,286,8,19,1,19,3,19,289,8,19,1,19,1,19,1,19,1,19,1,20,1,20,1,21,
        1,21,1,21,1,21,1,21,1,21,1,21,1,21,1,21,1,21,1,21,3,21,308,8,21,
        1,22,1,22,1,22,1,22,1,22,1,22,1,22,1,22,3,22,318,8,22,1,23,1,23,
        1,23,1,23,3,23,324,8,23,1,24,1,24,1,25,1,25,1,26,1,26,1,27,1,27,
        1,27,5,27,335,8,27,10,27,12,27,338,9,27,1,28,1,28,1,28,1,28,1,29,
        1,29,5,29,346,8,29,10,29,12,29,349,9,29,1,29,1,29,1,30,1,30,1,30,
        5,30,356,8,30,10,30,12,30,359,9,30,1,31,1,31,3,31,363,8,31,1,32,
        1,32,1,32,1,32,1,32,1,33,1,33,1,33,1,33,1,33,1,34,1,34,1,35,1,35,
        1,35,5,35,380,8,35,10,35,12,35,383,9,35,1,36,1,36,1,37,1,37,1,38,
        1,38,1,39,1,39,1,39,1,39,1,40,1,40,4,40,397,8,40,11,40,12,40,398,
        1,41,1,41,1,41,5,41,404,8,41,10,41,12,41,407,9,41,1,42,1,42,1,42,
        1,42,5,42,413,8,42,10,42,12,42,416,9,42,1,42,1,42,1,43,1,43,1,43,
        1,43,5,43,424,8,43,10,43,12,43,427,9,43,1,43,1,43,1,44,1,44,1,44,
        1,44,5,44,435,8,44,10,44,12,44,438,9,44,1,44,1,44,3,44,442,8,44,
        1,45,1,45,1,45,1,45,1,45,1,45,3,45,450,8,45,1,45,1,45,1,46,1,46,
        1,47,1,47,1,47,1,47,1,47,1,47,3,47,462,8,47,1,48,1,48,1,48,5,48,
        467,8,48,10,48,12,48,470,9,48,1,49,1,49,1,49,5,49,475,8,49,10,49,
        12,49,478,9,49,1,50,1,50,1,50,5,50,483,8,50,10,50,12,50,486,9,50,
        1,51,1,51,1,51,5,51,491,8,51,10,51,12,51,494,9,51,1,52,1,52,1,52,
        5,52,499,8,52,10,52,12,52,502,9,52,1,53,1,53,1,53,5,53,507,8,53,
        10,53,12,53,510,9,53,1,54,1,54,1,54,1,54,1,54,1,54,1,54,3,54,519,
        8,54,1,55,1,55,1,55,1,55,1,55,3,55,526,8,55,1,56,1,56,1,56,1,56,
        1,56,1,56,1,56,3,56,535,8,56,1,57,1,57,1,57,1,57,3,57,541,8,57,3,
        57,543,8,57,1,58,1,58,1,58,5,58,548,8,58,10,58,12,58,551,9,58,1,
        59,1,59,1,59,5,59,556,8,59,10,59,12,59,559,9,59,1,60,1,60,1,60,1,
        60,3,60,565,8,60,1,61,1,61,3,61,569,8,61,1,62,1,62,1,63,1,63,1,63,
        0,0,64,0,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,
        42,44,46,48,50,52,54,56,58,60,62,64,66,68,70,72,74,76,78,80,82,84,
        86,88,90,92,94,96,98,100,102,104,106,108,110,112,114,116,118,120,
        122,124,126,0,10,3,0,10,10,13,24,62,62,1,0,11,12,1,0,13,15,1,0,16,
        24,1,0,40,41,1,0,42,45,1,0,46,47,1,0,48,50,1,0,58,59,2,0,37,37,60,
        61,601,0,128,1,0,0,0,2,132,1,0,0,0,4,138,1,0,0,0,6,148,1,0,0,0,8,
        157,1,0,0,0,10,162,1,0,0,0,12,166,1,0,0,0,14,176,1,0,0,0,16,184,
        1,0,0,0,18,187,1,0,0,0,20,193,1,0,0,0,22,199,1,0,0,0,24,212,1,0,
        0,0,26,222,1,0,0,0,28,235,1,0,0,0,30,237,1,0,0,0,32,253,1,0,0,0,
        34,255,1,0,0,0,36,269,1,0,0,0,38,282,1,0,0,0,40,294,1,0,0,0,42,307,
        1,0,0,0,44,317,1,0,0,0,46,323,1,0,0,0,48,325,1,0,0,0,50,327,1,0,
        0,0,52,329,1,0,0,0,54,331,1,0,0,0,56,339,1,0,0,0,58,347,1,0,0,0,
        60,352,1,0,0,0,62,362,1,0,0,0,64,364,1,0,0,0,66,369,1,0,0,0,68,374,
        1,0,0,0,70,376,1,0,0,0,72,384,1,0,0,0,74,386,1,0,0,0,76,388,1,0,
        0,0,78,390,1,0,0,0,80,396,1,0,0,0,82,400,1,0,0,0,84,408,1,0,0,0,
        86,419,1,0,0,0,88,430,1,0,0,0,90,443,1,0,0,0,92,453,1,0,0,0,94,455,
        1,0,0,0,96,463,1,0,0,0,98,471,1,0,0,0,100,479,1,0,0,0,102,487,1,
        0,0,0,104,495,1,0,0,0,106,503,1,0,0,0,108,518,1,0,0,0,110,520,1,
        0,0,0,112,534,1,0,0,0,114,542,1,0,0,0,116,544,1,0,0,0,118,552,1,
        0,0,0,120,560,1,0,0,0,122,568,1,0,0,0,124,570,1,0,0,0,126,572,1,
        0,0,0,128,129,5,4,0,0,129,130,3,94,47,0,130,131,3,92,46,0,131,1,
        1,0,0,0,132,134,5,5,0,0,133,135,3,94,47,0,134,133,1,0,0,0,134,135,
        1,0,0,0,135,136,1,0,0,0,136,137,3,4,2,0,137,3,1,0,0,0,138,141,5,
        1,0,0,139,142,3,6,3,0,140,142,5,3,0,0,141,139,1,0,0,0,141,140,1,
        0,0,0,142,143,1,0,0,0,143,141,1,0,0,0,143,144,1,0,0,0,144,145,1,
        0,0,0,145,146,5,2,0,0,146,5,1,0,0,0,147,149,3,94,47,0,148,147,1,
        0,0,0,148,149,1,0,0,0,149,150,1,0,0,0,150,153,5,52,0,0,151,154,3,
        70,35,0,152,154,3,92,46,0,153,151,1,0,0,0,153,152,1,0,0,0,154,7,
        1,0,0,0,155,158,3,52,26,0,156,158,3,54,27,0,157,155,1,0,0,0,157,
        156,1,0,0,0,158,160,1,0,0,0,159,161,3,26,13,0,160,159,1,0,0,0,160,
        161,1,0,0,0,161,9,1,0,0,0,162,163,5,6,0,0,163,164,3,54,27,0,164,
        165,3,12,6,0,165,11,1,0,0,0,166,169,5,1,0,0,167,170,3,14,7,0,168,
        170,5,3,0,0,169,167,1,0,0,0,169,168,1,0,0,0,170,171,1,0,0,0,171,
        169,1,0,0,0,171,172,1,0,0,0,172,173,1,0,0,0,173,174,5,2,0,0,174,
        13,1,0,0,0,175,177,3,50,25,0,176,175,1,0,0,0,176,177,1,0,0,0,177,
        178,1,0,0,0,178,179,3,8,4,0,179,182,3,54,27,0,180,181,5,51,0,0,181,
        183,3,46,23,0,182,180,1,0,0,0,182,183,1,0,0,0,183,15,1,0,0,0,184,
        185,5,7,0,0,185,186,3,62,31,0,186,17,1,0,0,0,187,191,5,9,0,0,188,
        192,3,10,5,0,189,192,3,16,8,0,190,192,3,62,31,0,191,188,1,0,0,0,
        191,189,1,0,0,0,191,190,1,0,0,0,192,19,1,0,0,0,193,194,5,8,0,0,194,
        197,3,22,11,0,195,196,5,10,0,0,196,198,3,54,27,0,197,195,1,0,0,0,
        197,198,1,0,0,0,198,21,1,0,0,0,199,208,3,54,27,0,200,204,5,49,0,
        0,201,205,3,54,27,0,202,205,5,58,0,0,203,205,5,59,0,0,204,201,1,
        0,0,0,204,202,1,0,0,0,204,203,1,0,0,0,205,207,1,0,0,0,206,200,1,
        0,0,0,207,210,1,0,0,0,208,206,1,0,0,0,208,209,1,0,0,0,209,23,1,0,
        0,0,210,208,1,0,0,0,211,213,3,50,25,0,212,211,1,0,0,0,212,213,1,
        0,0,0,213,215,1,0,0,0,214,216,3,8,4,0,215,214,1,0,0,0,215,216,1,
        0,0,0,216,217,1,0,0,0,217,220,3,54,27,0,218,219,5,51,0,0,219,221,
        3,46,23,0,220,218,1,0,0,0,220,221,1,0,0,0,221,25,1,0,0,0,222,223,
        5,44,0,0,223,228,3,28,14,0,224,225,5,53,0,0,225,227,3,28,14,0,226,
        224,1,0,0,0,227,230,1,0,0,0,228,226,1,0,0,0,228,229,1,0,0,0,229,
        231,1,0,0,0,230,228,1,0,0,0,231,232,5,42,0,0,232,27,1,0,0,0,233,
        236,3,52,26,0,234,236,3,54,27,0,235,233,1,0,0,0,235,234,1,0,0,0,
        236,29,1,0,0,0,237,239,3,54,27,0,238,240,3,26,13,0,239,238,1,0,0,
        0,239,240,1,0,0,0,240,241,1,0,0,0,241,243,5,54,0,0,242,244,3,114,
        57,0,243,242,1,0,0,0,243,244,1,0,0,0,244,245,1,0,0,0,245,246,5,55,
        0,0,246,31,1,0,0,0,247,254,3,20,10,0,248,254,3,18,9,0,249,254,3,
        10,5,0,250,254,3,16,8,0,251,254,3,62,31,0,252,254,3,60,30,0,253,
        247,1,0,0,0,253,248,1,0,0,0,253,249,1,0,0,0,253,250,1,0,0,0,253,
        251,1,0,0,0,253,252,1,0,0,0,254,33,1,0,0,0,255,264,5,54,0,0,256,
        261,3,24,12,0,257,258,5,53,0,0,258,260,3,24,12,0,259,257,1,0,0,0,
        260,263,1,0,0,0,261,259,1,0,0,0,261,262,1,0,0,0,262,265,1,0,0,0,
        263,261,1,0,0,0,264,256,1,0,0,0,264,265,1,0,0,0,265,266,1,0,0,0,
        266,267,5,55,0,0,267,35,1,0,0,0,268,270,3,48,24,0,269,268,1,0,0,
        0,269,270,1,0,0,0,270,272,1,0,0,0,271,273,3,50,25,0,272,271,1,0,
        0,0,272,273,1,0,0,0,273,275,1,0,0,0,274,276,3,8,4,0,275,274,1,0,
        0,0,275,276,1,0,0,0,276,277,1,0,0,0,277,278,3,54,27,0,278,279,5,
        51,0,0,279,280,3,46,23,0,280,37,1,0,0,0,281,283,3,48,24,0,282,281,
        1,0,0,0,282,283,1,0,0,0,283,285,1,0,0,0,284,286,3,50,25,0,285,284,
        1,0,0,0,285,286,1,0,0,0,286,288,1,0,0,0,287,289,3,8,4,0,288,287,
        1,0,0,0,288,289,1,0,0,0,289,290,1,0,0,0,290,291,3,84,42,0,291,292,
        5,51,0,0,292,293,3,46,23,0,293,39,1,0,0,0,294,295,7,0,0,0,295,41,
        1,0,0,0,296,308,3,36,18,0,297,308,3,38,19,0,298,308,3,30,15,0,299,
        308,3,88,44,0,300,308,3,56,28,0,301,308,3,90,45,0,302,308,3,0,0,
        0,303,308,3,2,1,0,304,308,3,72,36,0,305,308,3,74,37,0,306,308,3,
        46,23,0,307,296,1,0,0,0,307,297,1,0,0,0,307,298,1,0,0,0,307,299,
        1,0,0,0,307,300,1,0,0,0,307,301,1,0,0,0,307,302,1,0,0,0,307,303,
        1,0,0,0,307,304,1,0,0,0,307,305,1,0,0,0,307,306,1,0,0,0,308,43,1,
        0,0,0,309,318,3,36,18,0,310,318,3,38,19,0,311,318,3,46,23,0,312,
        318,3,86,43,0,313,318,3,56,28,0,314,318,3,0,0,0,315,318,3,72,36,
        0,316,318,3,74,37,0,317,309,1,0,0,0,317,310,1,0,0,0,317,311,1,0,
        0,0,317,312,1,0,0,0,317,313,1,0,0,0,317,314,1,0,0,0,317,315,1,0,
        0,0,317,316,1,0,0,0,318,45,1,0,0,0,319,324,3,94,47,0,320,324,3,88,
        44,0,321,324,3,90,45,0,322,324,3,2,1,0,323,319,1,0,0,0,323,320,1,
        0,0,0,323,321,1,0,0,0,323,322,1,0,0,0,324,47,1,0,0,0,325,326,7,1,
        0,0,326,49,1,0,0,0,327,328,7,2,0,0,328,51,1,0,0,0,329,330,7,3,0,
        0,330,53,1,0,0,0,331,336,3,40,20,0,332,333,5,66,0,0,333,335,3,40,
        20,0,334,332,1,0,0,0,335,338,1,0,0,0,336,334,1,0,0,0,336,337,1,0,
        0,0,337,55,1,0,0,0,338,336,1,0,0,0,339,340,3,54,27,0,340,341,5,25,
        0,0,341,342,3,46,23,0,342,57,1,0,0,0,343,346,3,32,16,0,344,346,5,
        3,0,0,345,343,1,0,0,0,345,344,1,0,0,0,346,349,1,0,0,0,347,345,1,
        0,0,0,347,348,1,0,0,0,348,350,1,0,0,0,349,347,1,0,0,0,350,351,5,
        0,0,1,351,59,1,0,0,0,352,357,3,42,21,0,353,354,5,53,0,0,354,356,
        3,42,21,0,355,353,1,0,0,0,356,359,1,0,0,0,357,355,1,0,0,0,357,358,
        1,0,0,0,358,61,1,0,0,0,359,357,1,0,0,0,360,363,3,64,32,0,361,363,
        3,66,33,0,362,360,1,0,0,0,362,361,1,0,0,0,363,63,1,0,0,0,364,365,
        3,54,27,0,365,366,3,34,17,0,366,367,5,52,0,0,367,368,3,68,34,0,368,
        65,1,0,0,0,369,370,3,54,27,0,370,371,3,34,17,0,371,372,5,52,0,0,
        372,373,3,76,38,0,373,67,1,0,0,0,374,375,3,70,35,0,375,69,1,0,0,
        0,376,381,3,44,22,0,377,378,5,53,0,0,378,380,3,44,22,0,379,377,1,
        0,0,0,380,383,1,0,0,0,381,379,1,0,0,0,381,382,1,0,0,0,382,71,1,0,
        0,0,383,381,1,0,0,0,384,385,5,32,0,0,385,73,1,0,0,0,386,387,5,33,
        0,0,387,75,1,0,0,0,388,389,3,78,39,0,389,77,1,0,0,0,390,391,5,1,
        0,0,391,392,3,80,40,0,392,393,5,2,0,0,393,79,1,0,0,0,394,397,3,82,
        41,0,395,397,5,3,0,0,396,394,1,0,0,0,396,395,1,0,0,0,397,398,1,0,
        0,0,398,396,1,0,0,0,398,399,1,0,0,0,399,81,1,0,0,0,400,405,3,44,
        22,0,401,402,5,53,0,0,402,404,3,44,22,0,403,401,1,0,0,0,404,407,
        1,0,0,0,405,403,1,0,0,0,405,406,1,0,0,0,406,83,1,0,0,0,407,405,1,
        0,0,0,408,409,5,56,0,0,409,414,3,54,27,0,410,411,5,53,0,0,411,413,
        3,54,27,0,412,410,1,0,0,0,413,416,1,0,0,0,414,412,1,0,0,0,414,415,
        1,0,0,0,415,417,1,0,0,0,416,414,1,0,0,0,417,418,5,57,0,0,418,85,
        1,0,0,0,419,420,5,56,0,0,420,425,3,46,23,0,421,422,5,53,0,0,422,
        424,3,46,23,0,423,421,1,0,0,0,424,427,1,0,0,0,425,423,1,0,0,0,425,
        426,1,0,0,0,426,428,1,0,0,0,427,425,1,0,0,0,428,429,5,57,0,0,429,
        87,1,0,0,0,430,431,5,27,0,0,431,432,3,94,47,0,432,441,3,92,46,0,
        433,435,5,3,0,0,434,433,1,0,0,0,435,438,1,0,0,0,436,434,1,0,0,0,
        436,437,1,0,0,0,437,439,1,0,0,0,438,436,1,0,0,0,439,440,5,28,0,0,
        440,442,3,92,46,0,441,436,1,0,0,0,441,442,1,0,0,0,442,89,1,0,0,0,
        443,444,5,29,0,0,444,445,3,36,18,0,445,446,5,30,0,0,446,449,3,94,
        47,0,447,448,5,31,0,0,448,450,3,94,47,0,449,447,1,0,0,0,449,450,
        1,0,0,0,450,451,1,0,0,0,451,452,3,92,46,0,452,91,1,0,0,0,453,454,
        3,76,38,0,454,93,1,0,0,0,455,461,3,96,48,0,456,457,5,38,0,0,457,
        458,3,94,47,0,458,459,5,39,0,0,459,460,3,94,47,0,460,462,1,0,0,0,
        461,456,1,0,0,0,461,462,1,0,0,0,462,95,1,0,0,0,463,468,3,98,49,0,
        464,465,5,34,0,0,465,467,3,98,49,0,466,464,1,0,0,0,467,470,1,0,0,
        0,468,466,1,0,0,0,468,469,1,0,0,0,469,97,1,0,0,0,470,468,1,0,0,0,
        471,476,3,100,50,0,472,473,5,35,0,0,473,475,3,100,50,0,474,472,1,
        0,0,0,475,478,1,0,0,0,476,474,1,0,0,0,476,477,1,0,0,0,477,99,1,0,
        0,0,478,476,1,0,0,0,479,484,3,102,51,0,480,481,7,4,0,0,481,483,3,
        102,51,0,482,480,1,0,0,0,483,486,1,0,0,0,484,482,1,0,0,0,484,485,
        1,0,0,0,485,101,1,0,0,0,486,484,1,0,0,0,487,492,3,104,52,0,488,489,
        7,5,0,0,489,491,3,104,52,0,490,488,1,0,0,0,491,494,1,0,0,0,492,490,
        1,0,0,0,492,493,1,0,0,0,493,103,1,0,0,0,494,492,1,0,0,0,495,500,
        3,106,53,0,496,497,7,6,0,0,497,499,3,106,53,0,498,496,1,0,0,0,499,
        502,1,0,0,0,500,498,1,0,0,0,500,501,1,0,0,0,501,105,1,0,0,0,502,
        500,1,0,0,0,503,508,3,108,54,0,504,505,7,7,0,0,505,507,3,108,54,
        0,506,504,1,0,0,0,507,510,1,0,0,0,508,506,1,0,0,0,508,509,1,0,0,
        0,509,107,1,0,0,0,510,508,1,0,0,0,511,519,3,110,55,0,512,513,5,36,
        0,0,513,519,3,110,55,0,514,515,5,46,0,0,515,519,3,110,55,0,516,517,
        5,47,0,0,517,519,3,110,55,0,518,511,1,0,0,0,518,512,1,0,0,0,518,
        514,1,0,0,0,518,516,1,0,0,0,519,109,1,0,0,0,520,525,3,112,56,0,521,
        522,5,56,0,0,522,523,3,46,23,0,523,524,5,57,0,0,524,526,1,0,0,0,
        525,521,1,0,0,0,525,526,1,0,0,0,526,111,1,0,0,0,527,535,3,30,15,
        0,528,535,3,54,27,0,529,535,3,122,61,0,530,531,5,54,0,0,531,532,
        3,46,23,0,532,533,5,55,0,0,533,535,1,0,0,0,534,527,1,0,0,0,534,528,
        1,0,0,0,534,529,1,0,0,0,534,530,1,0,0,0,535,113,1,0,0,0,536,543,
        3,118,59,0,537,540,3,116,58,0,538,539,5,53,0,0,539,541,3,118,59,
        0,540,538,1,0,0,0,540,541,1,0,0,0,541,543,1,0,0,0,542,536,1,0,0,
        0,542,537,1,0,0,0,543,115,1,0,0,0,544,549,3,46,23,0,545,546,5,53,
        0,0,546,548,3,46,23,0,547,545,1,0,0,0,548,551,1,0,0,0,549,547,1,
        0,0,0,549,550,1,0,0,0,550,117,1,0,0,0,551,549,1,0,0,0,552,557,3,
        120,60,0,553,554,5,53,0,0,554,556,3,120,60,0,555,553,1,0,0,0,556,
        559,1,0,0,0,557,555,1,0,0,0,557,558,1,0,0,0,558,119,1,0,0,0,559,
        557,1,0,0,0,560,561,3,54,27,0,561,564,5,51,0,0,562,565,3,46,23,0,
        563,565,3,86,43,0,564,562,1,0,0,0,564,563,1,0,0,0,565,121,1,0,0,
        0,566,569,3,124,62,0,567,569,3,126,63,0,568,566,1,0,0,0,568,567,
        1,0,0,0,569,123,1,0,0,0,570,571,7,8,0,0,571,125,1,0,0,0,572,573,
        7,9,0,0,573,127,1,0,0,0,64,134,141,143,148,153,157,160,169,171,176,
        182,191,197,204,208,212,215,220,228,235,239,243,253,261,264,269,
        272,275,282,285,288,307,317,323,336,345,347,357,362,381,396,398,
        405,414,425,436,441,449,461,468,476,484,492,500,508,518,525,534,
        540,542,549,557,564,568
    ];

    private static __ATN: antlr.ATN;
    public static get _ATN(): antlr.ATN {
        if (!PineV5Parser.__ATN) {
            PineV5Parser.__ATN = new antlr.ATNDeserializer().deserialize(PineV5Parser._serializedATN);
        }

        return PineV5Parser.__ATN;
    }


    private static readonly vocabulary = new antlr.Vocabulary(PineV5Parser.literalNames, PineV5Parser.symbolicNames, []);

    public override get vocabulary(): antlr.Vocabulary {
        return PineV5Parser.vocabulary;
    }

    private static readonly decisionsToDFA = PineV5Parser._ATN.decisionToState.map( (ds: antlr.DecisionState, index: number) => new antlr.DFA(ds, index) );
}

export class While_exprContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public WHILE(): antlr.TerminalNode {
        return this.getToken(PineV5Parser.WHILE, 0)!;
    }
    public ternary_expr(): Ternary_exprContext {
        return this.getRuleContext(0, Ternary_exprContext)!;
    }
    public stmts_block(): Stmts_blockContext {
        return this.getRuleContext(0, Stmts_blockContext)!;
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_while_expr;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitWhile_expr) {
            return visitor.visitWhile_expr(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Switch_exprContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public SWITCH(): antlr.TerminalNode {
        return this.getToken(PineV5Parser.SWITCH, 0)!;
    }
    public switch_body(): Switch_bodyContext {
        return this.getRuleContext(0, Switch_bodyContext)!;
    }
    public ternary_expr(): Ternary_exprContext | null {
        return this.getRuleContext(0, Ternary_exprContext);
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_switch_expr;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitSwitch_expr) {
            return visitor.visitSwitch_expr(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Switch_bodyContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public BEGIN(): antlr.TerminalNode {
        return this.getToken(PineV5Parser.BEGIN, 0)!;
    }
    public END(): antlr.TerminalNode {
        return this.getToken(PineV5Parser.END, 0)!;
    }
    public switch_case(): Switch_caseContext[];
    public switch_case(i: number): Switch_caseContext | null;
    public switch_case(i?: number): Switch_caseContext[] | Switch_caseContext | null {
        if (i === undefined) {
            return this.getRuleContexts(Switch_caseContext);
        }

        return this.getRuleContext(i, Switch_caseContext);
    }
    public LEND(): antlr.TerminalNode[];
    public LEND(i: number): antlr.TerminalNode | null;
    public LEND(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV5Parser.LEND);
    	} else {
    		return this.getToken(PineV5Parser.LEND, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_switch_body;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitSwitch_body) {
            return visitor.visitSwitch_body(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Switch_caseContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public ARROW(): antlr.TerminalNode {
        return this.getToken(PineV5Parser.ARROW, 0)!;
    }
    public local_stmt_singleline(): Local_stmt_singlelineContext | null {
        return this.getRuleContext(0, Local_stmt_singlelineContext);
    }
    public stmts_block(): Stmts_blockContext | null {
        return this.getRuleContext(0, Stmts_blockContext);
    }
    public ternary_expr(): Ternary_exprContext | null {
        return this.getRuleContext(0, Ternary_exprContext);
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_switch_case;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitSwitch_case) {
            return visitor.visitSwitch_case(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Field_typeContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public type_name(): Type_nameContext | null {
        return this.getRuleContext(0, Type_nameContext);
    }
    public id(): IdContext | null {
        return this.getRuleContext(0, IdContext);
    }
    public type_args(): Type_argsContext | null {
        return this.getRuleContext(0, Type_argsContext);
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_field_type;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitField_type) {
            return visitor.visitField_type(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Type_def_stmtContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public TYPE(): antlr.TerminalNode {
        return this.getToken(PineV5Parser.TYPE, 0)!;
    }
    public id(): IdContext {
        return this.getRuleContext(0, IdContext)!;
    }
    public type_body(): Type_bodyContext {
        return this.getRuleContext(0, Type_bodyContext)!;
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_type_def_stmt;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitType_def_stmt) {
            return visitor.visitType_def_stmt(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Type_bodyContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public BEGIN(): antlr.TerminalNode {
        return this.getToken(PineV5Parser.BEGIN, 0)!;
    }
    public END(): antlr.TerminalNode {
        return this.getToken(PineV5Parser.END, 0)!;
    }
    public type_field(): Type_fieldContext[];
    public type_field(i: number): Type_fieldContext | null;
    public type_field(i?: number): Type_fieldContext[] | Type_fieldContext | null {
        if (i === undefined) {
            return this.getRuleContexts(Type_fieldContext);
        }

        return this.getRuleContext(i, Type_fieldContext);
    }
    public LEND(): antlr.TerminalNode[];
    public LEND(i: number): antlr.TerminalNode | null;
    public LEND(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV5Parser.LEND);
    	} else {
    		return this.getToken(PineV5Parser.LEND, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_type_body;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitType_body) {
            return visitor.visitType_body(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Type_fieldContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public field_type(): Field_typeContext {
        return this.getRuleContext(0, Field_typeContext)!;
    }
    public id(): IdContext {
        return this.getRuleContext(0, IdContext)!;
    }
    public type_qual(): Type_qualContext | null {
        return this.getRuleContext(0, Type_qualContext);
    }
    public DEFINE(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.DEFINE, 0);
    }
    public arith_expr(): Arith_exprContext | null {
        return this.getRuleContext(0, Arith_exprContext);
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_type_field;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitType_field) {
            return visitor.visitType_field(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Method_def_stmtContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public METHOD(): antlr.TerminalNode {
        return this.getToken(PineV5Parser.METHOD, 0)!;
    }
    public fun_def_stmt(): Fun_def_stmtContext {
        return this.getRuleContext(0, Fun_def_stmtContext)!;
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_method_def_stmt;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitMethod_def_stmt) {
            return visitor.visitMethod_def_stmt(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Export_stmtContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public EXPORT(): antlr.TerminalNode {
        return this.getToken(PineV5Parser.EXPORT, 0)!;
    }
    public type_def_stmt(): Type_def_stmtContext | null {
        return this.getRuleContext(0, Type_def_stmtContext);
    }
    public method_def_stmt(): Method_def_stmtContext | null {
        return this.getRuleContext(0, Method_def_stmtContext);
    }
    public fun_def_stmt(): Fun_def_stmtContext | null {
        return this.getRuleContext(0, Fun_def_stmtContext);
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_export_stmt;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitExport_stmt) {
            return visitor.visitExport_stmt(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Import_stmtContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public IMPORT(): antlr.TerminalNode {
        return this.getToken(PineV5Parser.IMPORT, 0)!;
    }
    public import_path(): Import_pathContext {
        return this.getRuleContext(0, Import_pathContext)!;
    }
    public AS(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.AS, 0);
    }
    public id(): IdContext | null {
        return this.getRuleContext(0, IdContext);
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_import_stmt;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitImport_stmt) {
            return visitor.visitImport_stmt(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Import_pathContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public id(): IdContext[];
    public id(i: number): IdContext | null;
    public id(i?: number): IdContext[] | IdContext | null {
        if (i === undefined) {
            return this.getRuleContexts(IdContext);
        }

        return this.getRuleContext(i, IdContext);
    }
    public DIV(): antlr.TerminalNode[];
    public DIV(i: number): antlr.TerminalNode | null;
    public DIV(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV5Parser.DIV);
    	} else {
    		return this.getToken(PineV5Parser.DIV, i);
    	}
    }
    public INT_LITERAL(): antlr.TerminalNode[];
    public INT_LITERAL(i: number): antlr.TerminalNode | null;
    public INT_LITERAL(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV5Parser.INT_LITERAL);
    	} else {
    		return this.getToken(PineV5Parser.INT_LITERAL, i);
    	}
    }
    public FLOAT_LITERAL(): antlr.TerminalNode[];
    public FLOAT_LITERAL(i: number): antlr.TerminalNode | null;
    public FLOAT_LITERAL(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV5Parser.FLOAT_LITERAL);
    	} else {
    		return this.getToken(PineV5Parser.FLOAT_LITERAL, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_import_path;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitImport_path) {
            return visitor.visitImport_path(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Fun_paramContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public id(): IdContext {
        return this.getRuleContext(0, IdContext)!;
    }
    public type_qual(): Type_qualContext | null {
        return this.getRuleContext(0, Type_qualContext);
    }
    public field_type(): Field_typeContext | null {
        return this.getRuleContext(0, Field_typeContext);
    }
    public DEFINE(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.DEFINE, 0);
    }
    public arith_expr(): Arith_exprContext | null {
        return this.getRuleContext(0, Arith_exprContext);
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_fun_param;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitFun_param) {
            return visitor.visitFun_param(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Type_argsContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public LT(): antlr.TerminalNode {
        return this.getToken(PineV5Parser.LT, 0)!;
    }
    public type_arg(): Type_argContext[];
    public type_arg(i: number): Type_argContext | null;
    public type_arg(i?: number): Type_argContext[] | Type_argContext | null {
        if (i === undefined) {
            return this.getRuleContexts(Type_argContext);
        }

        return this.getRuleContext(i, Type_argContext);
    }
    public GT(): antlr.TerminalNode {
        return this.getToken(PineV5Parser.GT, 0)!;
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV5Parser.COMMA);
    	} else {
    		return this.getToken(PineV5Parser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_type_args;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitType_args) {
            return visitor.visitType_args(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Type_argContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public type_name(): Type_nameContext | null {
        return this.getRuleContext(0, Type_nameContext);
    }
    public id(): IdContext | null {
        return this.getRuleContext(0, IdContext);
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_type_arg;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitType_arg) {
            return visitor.visitType_arg(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Fun_callContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public id(): IdContext {
        return this.getRuleContext(0, IdContext)!;
    }
    public LPAR(): antlr.TerminalNode {
        return this.getToken(PineV5Parser.LPAR, 0)!;
    }
    public RPAR(): antlr.TerminalNode {
        return this.getToken(PineV5Parser.RPAR, 0)!;
    }
    public type_args(): Type_argsContext | null {
        return this.getRuleContext(0, Type_argsContext);
    }
    public fun_actual_args(): Fun_actual_argsContext | null {
        return this.getRuleContext(0, Fun_actual_argsContext);
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_fun_call;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitFun_call) {
            return visitor.visitFun_call(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class StmtContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public import_stmt(): Import_stmtContext | null {
        return this.getRuleContext(0, Import_stmtContext);
    }
    public export_stmt(): Export_stmtContext | null {
        return this.getRuleContext(0, Export_stmtContext);
    }
    public type_def_stmt(): Type_def_stmtContext | null {
        return this.getRuleContext(0, Type_def_stmtContext);
    }
    public method_def_stmt(): Method_def_stmtContext | null {
        return this.getRuleContext(0, Method_def_stmtContext);
    }
    public fun_def_stmt(): Fun_def_stmtContext | null {
        return this.getRuleContext(0, Fun_def_stmtContext);
    }
    public global_stmt(): Global_stmtContext | null {
        return this.getRuleContext(0, Global_stmtContext);
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_stmt;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitStmt) {
            return visitor.visitStmt(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Fun_headContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public LPAR(): antlr.TerminalNode {
        return this.getToken(PineV5Parser.LPAR, 0)!;
    }
    public RPAR(): antlr.TerminalNode {
        return this.getToken(PineV5Parser.RPAR, 0)!;
    }
    public fun_param(): Fun_paramContext[];
    public fun_param(i: number): Fun_paramContext | null;
    public fun_param(i?: number): Fun_paramContext[] | Fun_paramContext | null {
        if (i === undefined) {
            return this.getRuleContexts(Fun_paramContext);
        }

        return this.getRuleContext(i, Fun_paramContext);
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV5Parser.COMMA);
    	} else {
    		return this.getToken(PineV5Parser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_fun_head;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitFun_head) {
            return visitor.visitFun_head(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Var_defContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public id(): IdContext {
        return this.getRuleContext(0, IdContext)!;
    }
    public DEFINE(): antlr.TerminalNode {
        return this.getToken(PineV5Parser.DEFINE, 0)!;
    }
    public arith_expr(): Arith_exprContext {
        return this.getRuleContext(0, Arith_exprContext)!;
    }
    public decl_mod(): Decl_modContext | null {
        return this.getRuleContext(0, Decl_modContext);
    }
    public type_qual(): Type_qualContext | null {
        return this.getRuleContext(0, Type_qualContext);
    }
    public field_type(): Field_typeContext | null {
        return this.getRuleContext(0, Field_typeContext);
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_var_def;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitVar_def) {
            return visitor.visitVar_def(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Var_defsContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public ids_array(): Ids_arrayContext {
        return this.getRuleContext(0, Ids_arrayContext)!;
    }
    public DEFINE(): antlr.TerminalNode {
        return this.getToken(PineV5Parser.DEFINE, 0)!;
    }
    public arith_expr(): Arith_exprContext {
        return this.getRuleContext(0, Arith_exprContext)!;
    }
    public decl_mod(): Decl_modContext | null {
        return this.getRuleContext(0, Decl_modContext);
    }
    public type_qual(): Type_qualContext | null {
        return this.getRuleContext(0, Type_qualContext);
    }
    public field_type(): Field_typeContext | null {
        return this.getRuleContext(0, Field_typeContext);
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_var_defs;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitVar_defs) {
            return visitor.visitVar_defs(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Id_partContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public ID(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.ID, 0);
    }
    public SERIES(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.SERIES, 0);
    }
    public SIMPLE(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.SIMPLE, 0);
    }
    public CONST(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.CONST, 0);
    }
    public INT_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.INT_TYPE, 0);
    }
    public FLOAT_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.FLOAT_TYPE, 0);
    }
    public BOOL_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.BOOL_TYPE, 0);
    }
    public STRING_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.STRING_TYPE, 0);
    }
    public COLOR_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.COLOR_TYPE, 0);
    }
    public LINE_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.LINE_TYPE, 0);
    }
    public LABEL_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.LABEL_TYPE, 0);
    }
    public BOX_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.BOX_TYPE, 0);
    }
    public TABLE_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.TABLE_TYPE, 0);
    }
    public AS(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.AS, 0);
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_id_part;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitId_part) {
            return visitor.visitId_part(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Global_stmt_contentContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public var_def(): Var_defContext | null {
        return this.getRuleContext(0, Var_defContext);
    }
    public var_defs(): Var_defsContext | null {
        return this.getRuleContext(0, Var_defsContext);
    }
    public fun_call(): Fun_callContext | null {
        return this.getRuleContext(0, Fun_callContext);
    }
    public if_expr(): If_exprContext | null {
        return this.getRuleContext(0, If_exprContext);
    }
    public var_assign(): Var_assignContext | null {
        return this.getRuleContext(0, Var_assignContext);
    }
    public for_expr(): For_exprContext | null {
        return this.getRuleContext(0, For_exprContext);
    }
    public while_expr(): While_exprContext | null {
        return this.getRuleContext(0, While_exprContext);
    }
    public switch_expr(): Switch_exprContext | null {
        return this.getRuleContext(0, Switch_exprContext);
    }
    public loop_break(): Loop_breakContext | null {
        return this.getRuleContext(0, Loop_breakContext);
    }
    public loop_continue(): Loop_continueContext | null {
        return this.getRuleContext(0, Loop_continueContext);
    }
    public arith_expr(): Arith_exprContext | null {
        return this.getRuleContext(0, Arith_exprContext);
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_global_stmt_content;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitGlobal_stmt_content) {
            return visitor.visitGlobal_stmt_content(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Local_stmt_contentContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public var_def(): Var_defContext | null {
        return this.getRuleContext(0, Var_defContext);
    }
    public var_defs(): Var_defsContext | null {
        return this.getRuleContext(0, Var_defsContext);
    }
    public arith_expr(): Arith_exprContext | null {
        return this.getRuleContext(0, Arith_exprContext);
    }
    public arith_exprs(): Arith_exprsContext | null {
        return this.getRuleContext(0, Arith_exprsContext);
    }
    public var_assign(): Var_assignContext | null {
        return this.getRuleContext(0, Var_assignContext);
    }
    public while_expr(): While_exprContext | null {
        return this.getRuleContext(0, While_exprContext);
    }
    public loop_break(): Loop_breakContext | null {
        return this.getRuleContext(0, Loop_breakContext);
    }
    public loop_continue(): Loop_continueContext | null {
        return this.getRuleContext(0, Loop_continueContext);
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_local_stmt_content;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitLocal_stmt_content) {
            return visitor.visitLocal_stmt_content(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Arith_exprContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public ternary_expr(): Ternary_exprContext | null {
        return this.getRuleContext(0, Ternary_exprContext);
    }
    public if_expr(): If_exprContext | null {
        return this.getRuleContext(0, If_exprContext);
    }
    public for_expr(): For_exprContext | null {
        return this.getRuleContext(0, For_exprContext);
    }
    public switch_expr(): Switch_exprContext | null {
        return this.getRuleContext(0, Switch_exprContext);
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_arith_expr;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitArith_expr) {
            return visitor.visitArith_expr(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Decl_modContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public VAR(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.VAR, 0);
    }
    public VARIP(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.VARIP, 0);
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_decl_mod;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitDecl_mod) {
            return visitor.visitDecl_mod(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Type_qualContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public SERIES(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.SERIES, 0);
    }
    public SIMPLE(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.SIMPLE, 0);
    }
    public CONST(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.CONST, 0);
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_type_qual;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitType_qual) {
            return visitor.visitType_qual(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Type_nameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public INT_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.INT_TYPE, 0);
    }
    public FLOAT_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.FLOAT_TYPE, 0);
    }
    public BOOL_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.BOOL_TYPE, 0);
    }
    public STRING_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.STRING_TYPE, 0);
    }
    public COLOR_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.COLOR_TYPE, 0);
    }
    public LINE_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.LINE_TYPE, 0);
    }
    public LABEL_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.LABEL_TYPE, 0);
    }
    public BOX_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.BOX_TYPE, 0);
    }
    public TABLE_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.TABLE_TYPE, 0);
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_type_name;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitType_name) {
            return visitor.visitType_name(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class IdContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public id_part(): Id_partContext[];
    public id_part(i: number): Id_partContext | null;
    public id_part(i?: number): Id_partContext[] | Id_partContext | null {
        if (i === undefined) {
            return this.getRuleContexts(Id_partContext);
        }

        return this.getRuleContext(i, Id_partContext);
    }
    public DOT(): antlr.TerminalNode[];
    public DOT(i: number): antlr.TerminalNode | null;
    public DOT(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV5Parser.DOT);
    	} else {
    		return this.getToken(PineV5Parser.DOT, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_id;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitId) {
            return visitor.visitId(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Var_assignContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public id(): IdContext {
        return this.getRuleContext(0, IdContext)!;
    }
    public ASSIGN(): antlr.TerminalNode {
        return this.getToken(PineV5Parser.ASSIGN, 0)!;
    }
    public arith_expr(): Arith_exprContext {
        return this.getRuleContext(0, Arith_exprContext)!;
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_var_assign;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitVar_assign) {
            return visitor.visitVar_assign(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Pine_scriptContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public EOF(): antlr.TerminalNode {
        return this.getToken(PineV5Parser.EOF, 0)!;
    }
    public stmt(): StmtContext[];
    public stmt(i: number): StmtContext | null;
    public stmt(i?: number): StmtContext[] | StmtContext | null {
        if (i === undefined) {
            return this.getRuleContexts(StmtContext);
        }

        return this.getRuleContext(i, StmtContext);
    }
    public LEND(): antlr.TerminalNode[];
    public LEND(i: number): antlr.TerminalNode | null;
    public LEND(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV5Parser.LEND);
    	} else {
    		return this.getToken(PineV5Parser.LEND, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_pine_script;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitPine_script) {
            return visitor.visitPine_script(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Global_stmtContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public global_stmt_content(): Global_stmt_contentContext[];
    public global_stmt_content(i: number): Global_stmt_contentContext | null;
    public global_stmt_content(i?: number): Global_stmt_contentContext[] | Global_stmt_contentContext | null {
        if (i === undefined) {
            return this.getRuleContexts(Global_stmt_contentContext);
        }

        return this.getRuleContext(i, Global_stmt_contentContext);
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV5Parser.COMMA);
    	} else {
    		return this.getToken(PineV5Parser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_global_stmt;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitGlobal_stmt) {
            return visitor.visitGlobal_stmt(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Fun_def_stmtContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public fun_def_singleline(): Fun_def_singlelineContext | null {
        return this.getRuleContext(0, Fun_def_singlelineContext);
    }
    public fun_def_multiline(): Fun_def_multilineContext | null {
        return this.getRuleContext(0, Fun_def_multilineContext);
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_fun_def_stmt;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitFun_def_stmt) {
            return visitor.visitFun_def_stmt(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Fun_def_singlelineContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public id(): IdContext {
        return this.getRuleContext(0, IdContext)!;
    }
    public fun_head(): Fun_headContext {
        return this.getRuleContext(0, Fun_headContext)!;
    }
    public ARROW(): antlr.TerminalNode {
        return this.getToken(PineV5Parser.ARROW, 0)!;
    }
    public fun_body_singleline(): Fun_body_singlelineContext {
        return this.getRuleContext(0, Fun_body_singlelineContext)!;
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_fun_def_singleline;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitFun_def_singleline) {
            return visitor.visitFun_def_singleline(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Fun_def_multilineContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public id(): IdContext {
        return this.getRuleContext(0, IdContext)!;
    }
    public fun_head(): Fun_headContext {
        return this.getRuleContext(0, Fun_headContext)!;
    }
    public ARROW(): antlr.TerminalNode {
        return this.getToken(PineV5Parser.ARROW, 0)!;
    }
    public fun_body_multiline(): Fun_body_multilineContext {
        return this.getRuleContext(0, Fun_body_multilineContext)!;
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_fun_def_multiline;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitFun_def_multiline) {
            return visitor.visitFun_def_multiline(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Fun_body_singlelineContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public local_stmt_singleline(): Local_stmt_singlelineContext {
        return this.getRuleContext(0, Local_stmt_singlelineContext)!;
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_fun_body_singleline;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitFun_body_singleline) {
            return visitor.visitFun_body_singleline(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Local_stmt_singlelineContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public local_stmt_content(): Local_stmt_contentContext[];
    public local_stmt_content(i: number): Local_stmt_contentContext | null;
    public local_stmt_content(i?: number): Local_stmt_contentContext[] | Local_stmt_contentContext | null {
        if (i === undefined) {
            return this.getRuleContexts(Local_stmt_contentContext);
        }

        return this.getRuleContext(i, Local_stmt_contentContext);
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV5Parser.COMMA);
    	} else {
    		return this.getToken(PineV5Parser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_local_stmt_singleline;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitLocal_stmt_singleline) {
            return visitor.visitLocal_stmt_singleline(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Loop_breakContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public BREAK(): antlr.TerminalNode {
        return this.getToken(PineV5Parser.BREAK, 0)!;
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_loop_break;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitLoop_break) {
            return visitor.visitLoop_break(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Loop_continueContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public CONTINUE(): antlr.TerminalNode {
        return this.getToken(PineV5Parser.CONTINUE, 0)!;
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_loop_continue;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitLoop_continue) {
            return visitor.visitLoop_continue(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Fun_body_multilineContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public local_stmts_multiline(): Local_stmts_multilineContext {
        return this.getRuleContext(0, Local_stmts_multilineContext)!;
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_fun_body_multiline;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitFun_body_multiline) {
            return visitor.visitFun_body_multiline(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Local_stmts_multilineContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public BEGIN(): antlr.TerminalNode {
        return this.getToken(PineV5Parser.BEGIN, 0)!;
    }
    public local_stmts_list(): Local_stmts_listContext {
        return this.getRuleContext(0, Local_stmts_listContext)!;
    }
    public END(): antlr.TerminalNode {
        return this.getToken(PineV5Parser.END, 0)!;
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_local_stmts_multiline;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitLocal_stmts_multiline) {
            return visitor.visitLocal_stmts_multiline(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Local_stmts_listContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public local_stmt_multiline(): Local_stmt_multilineContext[];
    public local_stmt_multiline(i: number): Local_stmt_multilineContext | null;
    public local_stmt_multiline(i?: number): Local_stmt_multilineContext[] | Local_stmt_multilineContext | null {
        if (i === undefined) {
            return this.getRuleContexts(Local_stmt_multilineContext);
        }

        return this.getRuleContext(i, Local_stmt_multilineContext);
    }
    public LEND(): antlr.TerminalNode[];
    public LEND(i: number): antlr.TerminalNode | null;
    public LEND(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV5Parser.LEND);
    	} else {
    		return this.getToken(PineV5Parser.LEND, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_local_stmts_list;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitLocal_stmts_list) {
            return visitor.visitLocal_stmts_list(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Local_stmt_multilineContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public local_stmt_content(): Local_stmt_contentContext[];
    public local_stmt_content(i: number): Local_stmt_contentContext | null;
    public local_stmt_content(i?: number): Local_stmt_contentContext[] | Local_stmt_contentContext | null {
        if (i === undefined) {
            return this.getRuleContexts(Local_stmt_contentContext);
        }

        return this.getRuleContext(i, Local_stmt_contentContext);
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV5Parser.COMMA);
    	} else {
    		return this.getToken(PineV5Parser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_local_stmt_multiline;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitLocal_stmt_multiline) {
            return visitor.visitLocal_stmt_multiline(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Ids_arrayContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public LSQBR(): antlr.TerminalNode {
        return this.getToken(PineV5Parser.LSQBR, 0)!;
    }
    public id(): IdContext[];
    public id(i: number): IdContext | null;
    public id(i?: number): IdContext[] | IdContext | null {
        if (i === undefined) {
            return this.getRuleContexts(IdContext);
        }

        return this.getRuleContext(i, IdContext);
    }
    public RSQBR(): antlr.TerminalNode {
        return this.getToken(PineV5Parser.RSQBR, 0)!;
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV5Parser.COMMA);
    	} else {
    		return this.getToken(PineV5Parser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_ids_array;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitIds_array) {
            return visitor.visitIds_array(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Arith_exprsContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public LSQBR(): antlr.TerminalNode {
        return this.getToken(PineV5Parser.LSQBR, 0)!;
    }
    public arith_expr(): Arith_exprContext[];
    public arith_expr(i: number): Arith_exprContext | null;
    public arith_expr(i?: number): Arith_exprContext[] | Arith_exprContext | null {
        if (i === undefined) {
            return this.getRuleContexts(Arith_exprContext);
        }

        return this.getRuleContext(i, Arith_exprContext);
    }
    public RSQBR(): antlr.TerminalNode {
        return this.getToken(PineV5Parser.RSQBR, 0)!;
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV5Parser.COMMA);
    	} else {
    		return this.getToken(PineV5Parser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_arith_exprs;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitArith_exprs) {
            return visitor.visitArith_exprs(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class If_exprContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public IF_COND(): antlr.TerminalNode {
        return this.getToken(PineV5Parser.IF_COND, 0)!;
    }
    public ternary_expr(): Ternary_exprContext {
        return this.getRuleContext(0, Ternary_exprContext)!;
    }
    public stmts_block(): Stmts_blockContext[];
    public stmts_block(i: number): Stmts_blockContext | null;
    public stmts_block(i?: number): Stmts_blockContext[] | Stmts_blockContext | null {
        if (i === undefined) {
            return this.getRuleContexts(Stmts_blockContext);
        }

        return this.getRuleContext(i, Stmts_blockContext);
    }
    public IF_COND_ELSE(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.IF_COND_ELSE, 0);
    }
    public LEND(): antlr.TerminalNode[];
    public LEND(i: number): antlr.TerminalNode | null;
    public LEND(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV5Parser.LEND);
    	} else {
    		return this.getToken(PineV5Parser.LEND, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_if_expr;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitIf_expr) {
            return visitor.visitIf_expr(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class For_exprContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public FOR_STMT(): antlr.TerminalNode {
        return this.getToken(PineV5Parser.FOR_STMT, 0)!;
    }
    public var_def(): Var_defContext {
        return this.getRuleContext(0, Var_defContext)!;
    }
    public FOR_STMT_TO(): antlr.TerminalNode {
        return this.getToken(PineV5Parser.FOR_STMT_TO, 0)!;
    }
    public ternary_expr(): Ternary_exprContext[];
    public ternary_expr(i: number): Ternary_exprContext | null;
    public ternary_expr(i?: number): Ternary_exprContext[] | Ternary_exprContext | null {
        if (i === undefined) {
            return this.getRuleContexts(Ternary_exprContext);
        }

        return this.getRuleContext(i, Ternary_exprContext);
    }
    public stmts_block(): Stmts_blockContext {
        return this.getRuleContext(0, Stmts_blockContext)!;
    }
    public FOR_STMT_BY(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.FOR_STMT_BY, 0);
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_for_expr;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitFor_expr) {
            return visitor.visitFor_expr(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Stmts_blockContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public fun_body_multiline(): Fun_body_multilineContext {
        return this.getRuleContext(0, Fun_body_multilineContext)!;
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_stmts_block;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitStmts_block) {
            return visitor.visitStmts_block(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Ternary_exprContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public or_expr(): Or_exprContext {
        return this.getRuleContext(0, Or_exprContext)!;
    }
    public COND(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.COND, 0);
    }
    public ternary_expr(): Ternary_exprContext[];
    public ternary_expr(i: number): Ternary_exprContext | null;
    public ternary_expr(i?: number): Ternary_exprContext[] | Ternary_exprContext | null {
        if (i === undefined) {
            return this.getRuleContexts(Ternary_exprContext);
        }

        return this.getRuleContext(i, Ternary_exprContext);
    }
    public COND_ELSE(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.COND_ELSE, 0);
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_ternary_expr;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitTernary_expr) {
            return visitor.visitTernary_expr(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Or_exprContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public and_expr(): And_exprContext[];
    public and_expr(i: number): And_exprContext | null;
    public and_expr(i?: number): And_exprContext[] | And_exprContext | null {
        if (i === undefined) {
            return this.getRuleContexts(And_exprContext);
        }

        return this.getRuleContext(i, And_exprContext);
    }
    public OR(): antlr.TerminalNode[];
    public OR(i: number): antlr.TerminalNode | null;
    public OR(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV5Parser.OR);
    	} else {
    		return this.getToken(PineV5Parser.OR, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_or_expr;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitOr_expr) {
            return visitor.visitOr_expr(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class And_exprContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public eq_expr(): Eq_exprContext[];
    public eq_expr(i: number): Eq_exprContext | null;
    public eq_expr(i?: number): Eq_exprContext[] | Eq_exprContext | null {
        if (i === undefined) {
            return this.getRuleContexts(Eq_exprContext);
        }

        return this.getRuleContext(i, Eq_exprContext);
    }
    public AND(): antlr.TerminalNode[];
    public AND(i: number): antlr.TerminalNode | null;
    public AND(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV5Parser.AND);
    	} else {
    		return this.getToken(PineV5Parser.AND, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_and_expr;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitAnd_expr) {
            return visitor.visitAnd_expr(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Eq_exprContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public cmp_expr(): Cmp_exprContext[];
    public cmp_expr(i: number): Cmp_exprContext | null;
    public cmp_expr(i?: number): Cmp_exprContext[] | Cmp_exprContext | null {
        if (i === undefined) {
            return this.getRuleContexts(Cmp_exprContext);
        }

        return this.getRuleContext(i, Cmp_exprContext);
    }
    public EQ(): antlr.TerminalNode[];
    public EQ(i: number): antlr.TerminalNode | null;
    public EQ(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV5Parser.EQ);
    	} else {
    		return this.getToken(PineV5Parser.EQ, i);
    	}
    }
    public NEQ(): antlr.TerminalNode[];
    public NEQ(i: number): antlr.TerminalNode | null;
    public NEQ(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV5Parser.NEQ);
    	} else {
    		return this.getToken(PineV5Parser.NEQ, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_eq_expr;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitEq_expr) {
            return visitor.visitEq_expr(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Cmp_exprContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public add_expr(): Add_exprContext[];
    public add_expr(i: number): Add_exprContext | null;
    public add_expr(i?: number): Add_exprContext[] | Add_exprContext | null {
        if (i === undefined) {
            return this.getRuleContexts(Add_exprContext);
        }

        return this.getRuleContext(i, Add_exprContext);
    }
    public GT(): antlr.TerminalNode[];
    public GT(i: number): antlr.TerminalNode | null;
    public GT(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV5Parser.GT);
    	} else {
    		return this.getToken(PineV5Parser.GT, i);
    	}
    }
    public GE(): antlr.TerminalNode[];
    public GE(i: number): antlr.TerminalNode | null;
    public GE(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV5Parser.GE);
    	} else {
    		return this.getToken(PineV5Parser.GE, i);
    	}
    }
    public LT(): antlr.TerminalNode[];
    public LT(i: number): antlr.TerminalNode | null;
    public LT(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV5Parser.LT);
    	} else {
    		return this.getToken(PineV5Parser.LT, i);
    	}
    }
    public LE(): antlr.TerminalNode[];
    public LE(i: number): antlr.TerminalNode | null;
    public LE(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV5Parser.LE);
    	} else {
    		return this.getToken(PineV5Parser.LE, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_cmp_expr;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitCmp_expr) {
            return visitor.visitCmp_expr(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Add_exprContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public mult_expr(): Mult_exprContext[];
    public mult_expr(i: number): Mult_exprContext | null;
    public mult_expr(i?: number): Mult_exprContext[] | Mult_exprContext | null {
        if (i === undefined) {
            return this.getRuleContexts(Mult_exprContext);
        }

        return this.getRuleContext(i, Mult_exprContext);
    }
    public PLUS(): antlr.TerminalNode[];
    public PLUS(i: number): antlr.TerminalNode | null;
    public PLUS(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV5Parser.PLUS);
    	} else {
    		return this.getToken(PineV5Parser.PLUS, i);
    	}
    }
    public MINUS(): antlr.TerminalNode[];
    public MINUS(i: number): antlr.TerminalNode | null;
    public MINUS(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV5Parser.MINUS);
    	} else {
    		return this.getToken(PineV5Parser.MINUS, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_add_expr;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitAdd_expr) {
            return visitor.visitAdd_expr(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Mult_exprContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public unary_expr(): Unary_exprContext[];
    public unary_expr(i: number): Unary_exprContext | null;
    public unary_expr(i?: number): Unary_exprContext[] | Unary_exprContext | null {
        if (i === undefined) {
            return this.getRuleContexts(Unary_exprContext);
        }

        return this.getRuleContext(i, Unary_exprContext);
    }
    public MUL(): antlr.TerminalNode[];
    public MUL(i: number): antlr.TerminalNode | null;
    public MUL(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV5Parser.MUL);
    	} else {
    		return this.getToken(PineV5Parser.MUL, i);
    	}
    }
    public DIV(): antlr.TerminalNode[];
    public DIV(i: number): antlr.TerminalNode | null;
    public DIV(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV5Parser.DIV);
    	} else {
    		return this.getToken(PineV5Parser.DIV, i);
    	}
    }
    public MOD(): antlr.TerminalNode[];
    public MOD(i: number): antlr.TerminalNode | null;
    public MOD(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV5Parser.MOD);
    	} else {
    		return this.getToken(PineV5Parser.MOD, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_mult_expr;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitMult_expr) {
            return visitor.visitMult_expr(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Unary_exprContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public sqbr_expr(): Sqbr_exprContext {
        return this.getRuleContext(0, Sqbr_exprContext)!;
    }
    public NOT(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.NOT, 0);
    }
    public PLUS(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.PLUS, 0);
    }
    public MINUS(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.MINUS, 0);
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_unary_expr;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitUnary_expr) {
            return visitor.visitUnary_expr(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Sqbr_exprContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public atom(): AtomContext {
        return this.getRuleContext(0, AtomContext)!;
    }
    public LSQBR(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.LSQBR, 0);
    }
    public arith_expr(): Arith_exprContext | null {
        return this.getRuleContext(0, Arith_exprContext);
    }
    public RSQBR(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.RSQBR, 0);
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_sqbr_expr;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitSqbr_expr) {
            return visitor.visitSqbr_expr(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class AtomContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public fun_call(): Fun_callContext | null {
        return this.getRuleContext(0, Fun_callContext);
    }
    public id(): IdContext | null {
        return this.getRuleContext(0, IdContext);
    }
    public literal(): LiteralContext | null {
        return this.getRuleContext(0, LiteralContext);
    }
    public LPAR(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.LPAR, 0);
    }
    public arith_expr(): Arith_exprContext | null {
        return this.getRuleContext(0, Arith_exprContext);
    }
    public RPAR(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.RPAR, 0);
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_atom;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitAtom) {
            return visitor.visitAtom(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Fun_actual_argsContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public kw_args(): Kw_argsContext | null {
        return this.getRuleContext(0, Kw_argsContext);
    }
    public pos_args(): Pos_argsContext | null {
        return this.getRuleContext(0, Pos_argsContext);
    }
    public COMMA(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.COMMA, 0);
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_fun_actual_args;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitFun_actual_args) {
            return visitor.visitFun_actual_args(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Pos_argsContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public arith_expr(): Arith_exprContext[];
    public arith_expr(i: number): Arith_exprContext | null;
    public arith_expr(i?: number): Arith_exprContext[] | Arith_exprContext | null {
        if (i === undefined) {
            return this.getRuleContexts(Arith_exprContext);
        }

        return this.getRuleContext(i, Arith_exprContext);
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV5Parser.COMMA);
    	} else {
    		return this.getToken(PineV5Parser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_pos_args;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitPos_args) {
            return visitor.visitPos_args(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Kw_argsContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public kw_arg(): Kw_argContext[];
    public kw_arg(i: number): Kw_argContext | null;
    public kw_arg(i?: number): Kw_argContext[] | Kw_argContext | null {
        if (i === undefined) {
            return this.getRuleContexts(Kw_argContext);
        }

        return this.getRuleContext(i, Kw_argContext);
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV5Parser.COMMA);
    	} else {
    		return this.getToken(PineV5Parser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_kw_args;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitKw_args) {
            return visitor.visitKw_args(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Kw_argContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public id(): IdContext {
        return this.getRuleContext(0, IdContext)!;
    }
    public DEFINE(): antlr.TerminalNode {
        return this.getToken(PineV5Parser.DEFINE, 0)!;
    }
    public arith_expr(): Arith_exprContext | null {
        return this.getRuleContext(0, Arith_exprContext);
    }
    public arith_exprs(): Arith_exprsContext | null {
        return this.getRuleContext(0, Arith_exprsContext);
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_kw_arg;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitKw_arg) {
            return visitor.visitKw_arg(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class LiteralContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public num_literal(): Num_literalContext | null {
        return this.getRuleContext(0, Num_literalContext);
    }
    public other_literal(): Other_literalContext | null {
        return this.getRuleContext(0, Other_literalContext);
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_literal;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitLiteral) {
            return visitor.visitLiteral(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Num_literalContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public INT_LITERAL(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.INT_LITERAL, 0);
    }
    public FLOAT_LITERAL(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.FLOAT_LITERAL, 0);
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_num_literal;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitNum_literal) {
            return visitor.visitNum_literal(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Other_literalContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public STR_LITERAL(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.STR_LITERAL, 0);
    }
    public BOOL_LITERAL(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.BOOL_LITERAL, 0);
    }
    public COLOR_LITERAL(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.COLOR_LITERAL, 0);
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_other_literal;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitOther_literal) {
            return visitor.visitOther_literal(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
