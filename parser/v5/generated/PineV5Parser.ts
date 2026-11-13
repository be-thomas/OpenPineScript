
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
    public static readonly ENUM = 10;
    public static readonly AS = 11;
    public static readonly IN = 12;
    public static readonly VAR = 13;
    public static readonly VARIP = 14;
    public static readonly SERIES = 15;
    public static readonly SIMPLE = 16;
    public static readonly CONST = 17;
    public static readonly INT_TYPE = 18;
    public static readonly FLOAT_TYPE = 19;
    public static readonly BOOL_TYPE = 20;
    public static readonly STRING_TYPE = 21;
    public static readonly COLOR_TYPE = 22;
    public static readonly LINE_TYPE = 23;
    public static readonly LABEL_TYPE = 24;
    public static readonly BOX_TYPE = 25;
    public static readonly TABLE_TYPE = 26;
    public static readonly PLUS_ASSIGN = 27;
    public static readonly MINUS_ASSIGN = 28;
    public static readonly MUL_ASSIGN = 29;
    public static readonly DIV_ASSIGN = 30;
    public static readonly MOD_ASSIGN = 31;
    public static readonly ASSIGN = 32;
    public static readonly LBEG = 33;
    public static readonly IF_COND = 34;
    public static readonly IF_COND_ELSE = 35;
    public static readonly FOR_STMT = 36;
    public static readonly FOR_STMT_TO = 37;
    public static readonly FOR_STMT_BY = 38;
    public static readonly BREAK = 39;
    public static readonly CONTINUE = 40;
    public static readonly OR = 41;
    public static readonly AND = 42;
    public static readonly NOT = 43;
    public static readonly BOOL_LITERAL = 44;
    public static readonly COND = 45;
    public static readonly COND_ELSE = 46;
    public static readonly EQ = 47;
    public static readonly NEQ = 48;
    public static readonly GT = 49;
    public static readonly GE = 50;
    public static readonly LT = 51;
    public static readonly LE = 52;
    public static readonly PLUS = 53;
    public static readonly MINUS = 54;
    public static readonly MUL = 55;
    public static readonly DIV = 56;
    public static readonly MOD = 57;
    public static readonly DEFINE = 58;
    public static readonly ARROW = 59;
    public static readonly COMMA = 60;
    public static readonly LPAR = 61;
    public static readonly RPAR = 62;
    public static readonly LSQBR = 63;
    public static readonly RSQBR = 64;
    public static readonly INT_LITERAL = 65;
    public static readonly FLOAT_LITERAL = 66;
    public static readonly STR_LITERAL = 67;
    public static readonly COLOR_LITERAL = 68;
    public static readonly ID = 69;
    public static readonly WS = 70;
    public static readonly LINE_COMMENT = 71;
    public static readonly BLOCK_COMMENT = 72;
    public static readonly DOT = 73;
    public static readonly RULE_while_expr = 0;
    public static readonly RULE_switch_expr = 1;
    public static readonly RULE_switch_body = 2;
    public static readonly RULE_switch_case = 3;
    public static readonly RULE_field_type = 4;
    public static readonly RULE_type_def_stmt = 5;
    public static readonly RULE_type_body = 6;
    public static readonly RULE_type_field = 7;
    public static readonly RULE_method_def_stmt = 8;
    public static readonly RULE_enum_def_stmt = 9;
    public static readonly RULE_enum_body = 10;
    public static readonly RULE_enum_field = 11;
    public static readonly RULE_export_stmt = 12;
    public static readonly RULE_import_stmt = 13;
    public static readonly RULE_import_path = 14;
    public static readonly RULE_import_user = 15;
    public static readonly RULE_user_part = 16;
    public static readonly RULE_fun_param = 17;
    public static readonly RULE_type_args = 18;
    public static readonly RULE_type_arg = 19;
    public static readonly RULE_for_in_expr = 20;
    public static readonly RULE_call_suffix = 21;
    public static readonly RULE_fun_call = 22;
    public static readonly RULE_atom = 23;
    public static readonly RULE_id = 24;
    public static readonly RULE_stmt = 25;
    public static readonly RULE_fun_head = 26;
    public static readonly RULE_var_def = 27;
    public static readonly RULE_var_defs = 28;
    public static readonly RULE_id_part = 29;
    public static readonly RULE_global_stmt_content = 30;
    public static readonly RULE_local_stmt_content = 31;
    public static readonly RULE_arith_expr = 32;
    public static readonly RULE_decl_mod = 33;
    public static readonly RULE_type_qual = 34;
    public static readonly RULE_type_name = 35;
    public static readonly RULE_compound_assign_op = 36;
    public static readonly RULE_var_assign = 37;
    public static readonly RULE_if_expr = 38;
    public static readonly RULE_pos_arg = 39;
    public static readonly RULE_pos_args = 40;
    public static readonly RULE_pine_script = 41;
    public static readonly RULE_global_stmt = 42;
    public static readonly RULE_fun_def_stmt = 43;
    public static readonly RULE_fun_def_singleline = 44;
    public static readonly RULE_fun_def_multiline = 45;
    public static readonly RULE_fun_body_singleline = 46;
    public static readonly RULE_local_stmt_singleline = 47;
    public static readonly RULE_loop_break = 48;
    public static readonly RULE_loop_continue = 49;
    public static readonly RULE_fun_body_multiline = 50;
    public static readonly RULE_local_stmts_multiline = 51;
    public static readonly RULE_local_stmts_list = 52;
    public static readonly RULE_local_stmt_multiline = 53;
    public static readonly RULE_ids_array = 54;
    public static readonly RULE_arith_exprs = 55;
    public static readonly RULE_for_expr = 56;
    public static readonly RULE_stmts_block = 57;
    public static readonly RULE_ternary_expr = 58;
    public static readonly RULE_or_expr = 59;
    public static readonly RULE_and_expr = 60;
    public static readonly RULE_eq_expr = 61;
    public static readonly RULE_cmp_expr = 62;
    public static readonly RULE_add_expr = 63;
    public static readonly RULE_mult_expr = 64;
    public static readonly RULE_unary_expr = 65;
    public static readonly RULE_sqbr_expr = 66;
    public static readonly RULE_fun_actual_args = 67;
    public static readonly RULE_kw_args = 68;
    public static readonly RULE_kw_arg = 69;
    public static readonly RULE_literal = 70;
    public static readonly RULE_num_literal = 71;
    public static readonly RULE_other_literal = 72;

    public static readonly literalNames = [
        null, null, null, null, "'while'", "'switch'", "'type'", "'method'", 
        "'import'", "'export'", "'enum'", "'as'", "'in'", "'var'", "'varip'", 
        "'series'", "'simple'", "'const'", "'int'", "'float'", "'bool'", 
        "'string'", "'color'", "'line'", "'label'", "'box'", "'table'", 
        "'+='", "'-='", "'*='", "'/='", "'%='", "':='", null, "'if'", "'else'", 
        "'for'", "'to'", "'by'", "'break'", "'continue'", "'or'", "'and'", 
        "'not'", null, "'?'", "':'", "'=='", "'!='", "'>'", "'>='", "'<'", 
        "'<='", "'+'", "'-'", "'*'", "'/'", "'%'", "'='", "'=>'", "','", 
        "'('", "')'", "'['", "']'", null, null, null, null, null, null, 
        null, null, "'.'"
    ];

    public static readonly symbolicNames = [
        null, "BEGIN", "END", "LEND", "WHILE", "SWITCH", "TYPE", "METHOD", 
        "IMPORT", "EXPORT", "ENUM", "AS", "IN", "VAR", "VARIP", "SERIES", 
        "SIMPLE", "CONST", "INT_TYPE", "FLOAT_TYPE", "BOOL_TYPE", "STRING_TYPE", 
        "COLOR_TYPE", "LINE_TYPE", "LABEL_TYPE", "BOX_TYPE", "TABLE_TYPE", 
        "PLUS_ASSIGN", "MINUS_ASSIGN", "MUL_ASSIGN", "DIV_ASSIGN", "MOD_ASSIGN", 
        "ASSIGN", "LBEG", "IF_COND", "IF_COND_ELSE", "FOR_STMT", "FOR_STMT_TO", 
        "FOR_STMT_BY", "BREAK", "CONTINUE", "OR", "AND", "NOT", "BOOL_LITERAL", 
        "COND", "COND_ELSE", "EQ", "NEQ", "GT", "GE", "LT", "LE", "PLUS", 
        "MINUS", "MUL", "DIV", "MOD", "DEFINE", "ARROW", "COMMA", "LPAR", 
        "RPAR", "LSQBR", "RSQBR", "INT_LITERAL", "FLOAT_LITERAL", "STR_LITERAL", 
        "COLOR_LITERAL", "ID", "WS", "LINE_COMMENT", "BLOCK_COMMENT", "DOT"
    ];
    public static readonly ruleNames = [
        "while_expr", "switch_expr", "switch_body", "switch_case", "field_type", 
        "type_def_stmt", "type_body", "type_field", "method_def_stmt", "enum_def_stmt", 
        "enum_body", "enum_field", "export_stmt", "import_stmt", "import_path", 
        "import_user", "user_part", "fun_param", "type_args", "type_arg", 
        "for_in_expr", "call_suffix", "fun_call", "atom", "id", "stmt", 
        "fun_head", "var_def", "var_defs", "id_part", "global_stmt_content", 
        "local_stmt_content", "arith_expr", "decl_mod", "type_qual", "type_name", 
        "compound_assign_op", "var_assign", "if_expr", "pos_arg", "pos_args", 
        "pine_script", "global_stmt", "fun_def_stmt", "fun_def_singleline", 
        "fun_def_multiline", "fun_body_singleline", "local_stmt_singleline", 
        "loop_break", "loop_continue", "fun_body_multiline", "local_stmts_multiline", 
        "local_stmts_list", "local_stmt_multiline", "ids_array", "arith_exprs", 
        "for_expr", "stmts_block", "ternary_expr", "or_expr", "and_expr", 
        "eq_expr", "cmp_expr", "add_expr", "mult_expr", "unary_expr", "sqbr_expr", 
        "fun_actual_args", "kw_args", "kw_arg", "literal", "num_literal", 
        "other_literal",
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
            this.state = 146;
            this.match(PineV5Parser.WHILE);
            this.state = 147;
            this.ternary_expr();
            this.state = 148;
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
            this.state = 150;
            this.match(PineV5Parser.SWITCH);
            this.state = 152;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 134187200) !== 0) || ((((_la - 43)) & ~0x1F) === 0 && ((1 << (_la - 43)) & 130288643) !== 0)) {
                {
                this.state = 151;
                this.ternary_expr();
                }
            }

            this.state = 154;
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
            this.state = 156;
            this.match(PineV5Parser.BEGIN);
            this.state = 159;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                this.state = 159;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case PineV5Parser.TYPE:
                case PineV5Parser.METHOD:
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
                    this.state = 157;
                    this.switch_case();
                    }
                    break;
                case PineV5Parser.LEND:
                    {
                    this.state = 158;
                    this.match(PineV5Parser.LEND);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                this.state = 161;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 134187208) !== 0) || ((((_la - 43)) & ~0x1F) === 0 && ((1 << (_la - 43)) & 130354179) !== 0));
            this.state = 163;
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
            this.state = 166;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 134187200) !== 0) || ((((_la - 43)) & ~0x1F) === 0 && ((1 << (_la - 43)) & 130288643) !== 0)) {
                {
                this.state = 165;
                this.ternary_expr();
                }
            }

            this.state = 168;
            this.match(PineV5Parser.ARROW);
            this.state = 171;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV5Parser.WHILE:
            case PineV5Parser.SWITCH:
            case PineV5Parser.TYPE:
            case PineV5Parser.METHOD:
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
                this.state = 169;
                this.local_stmt_singleline();
                }
                break;
            case PineV5Parser.BEGIN:
                {
                this.state = 170;
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
            this.state = 175;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 5, this.context) ) {
            case 1:
                {
                this.state = 173;
                this.type_name();
                }
                break;
            case 2:
                {
                this.state = 174;
                this.id();
                }
                break;
            }
            this.state = 178;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 51) {
                {
                this.state = 177;
                this.type_args();
                }
            }

            this.state = 182;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 7, this.context) ) {
            case 1:
                {
                this.state = 180;
                this.match(PineV5Parser.LSQBR);
                this.state = 181;
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
    public type_def_stmt(): Type_def_stmtContext {
        let localContext = new Type_def_stmtContext(this.context, this.state);
        this.enterRule(localContext, 10, PineV5Parser.RULE_type_def_stmt);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 184;
            this.match(PineV5Parser.TYPE);
            this.state = 185;
            this.id();
            this.state = 186;
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
            this.state = 188;
            this.match(PineV5Parser.BEGIN);
            this.state = 191;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                this.state = 191;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case PineV5Parser.TYPE:
                case PineV5Parser.METHOD:
                case PineV5Parser.AS:
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
                case PineV5Parser.ID:
                    {
                    this.state = 189;
                    this.type_field();
                    }
                    break;
                case PineV5Parser.LEND:
                    {
                    this.state = 190;
                    this.match(PineV5Parser.LEND);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                this.state = 193;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 134203592) !== 0) || _la === 69);
            this.state = 195;
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
            this.state = 198;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 14) {
                {
                this.state = 197;
                this.match(PineV5Parser.VARIP);
                }
            }

            this.state = 201;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 11, this.context) ) {
            case 1:
                {
                this.state = 200;
                this.type_qual();
                }
                break;
            }
            this.state = 204;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 12, this.context) ) {
            case 1:
                {
                this.state = 203;
                this.field_type();
                }
                break;
            }
            this.state = 206;
            this.id();
            this.state = 209;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 58) {
                {
                this.state = 207;
                this.match(PineV5Parser.DEFINE);
                this.state = 208;
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
            this.state = 211;
            this.match(PineV5Parser.METHOD);
            this.state = 212;
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
    public enum_def_stmt(): Enum_def_stmtContext {
        let localContext = new Enum_def_stmtContext(this.context, this.state);
        this.enterRule(localContext, 18, PineV5Parser.RULE_enum_def_stmt);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 214;
            this.match(PineV5Parser.ENUM);
            this.state = 215;
            this.id();
            this.state = 216;
            this.enum_body();
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
    public enum_body(): Enum_bodyContext {
        let localContext = new Enum_bodyContext(this.context, this.state);
        this.enterRule(localContext, 20, PineV5Parser.RULE_enum_body);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 218;
            this.match(PineV5Parser.BEGIN);
            this.state = 221;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                this.state = 221;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case PineV5Parser.TYPE:
                case PineV5Parser.METHOD:
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
                    this.state = 219;
                    this.enum_field();
                    }
                    break;
                case PineV5Parser.LEND:
                    {
                    this.state = 220;
                    this.match(PineV5Parser.LEND);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                this.state = 223;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 134187208) !== 0) || _la === 69);
            this.state = 225;
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
    public enum_field(): Enum_fieldContext {
        let localContext = new Enum_fieldContext(this.context, this.state);
        this.enterRule(localContext, 22, PineV5Parser.RULE_enum_field);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 227;
            this.id();
            this.state = 230;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 58) {
                {
                this.state = 228;
                this.match(PineV5Parser.DEFINE);
                this.state = 229;
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
    public export_stmt(): Export_stmtContext {
        let localContext = new Export_stmtContext(this.context, this.state);
        this.enterRule(localContext, 24, PineV5Parser.RULE_export_stmt);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 232;
            this.match(PineV5Parser.EXPORT);
            this.state = 237;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 17, this.context) ) {
            case 1:
                {
                this.state = 233;
                this.type_def_stmt();
                }
                break;
            case 2:
                {
                this.state = 234;
                this.enum_def_stmt();
                }
                break;
            case 3:
                {
                this.state = 235;
                this.method_def_stmt();
                }
                break;
            case 4:
                {
                this.state = 236;
                this.fun_def_stmt();
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
    public import_stmt(): Import_stmtContext {
        let localContext = new Import_stmtContext(this.context, this.state);
        this.enterRule(localContext, 26, PineV5Parser.RULE_import_stmt);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 239;
            this.match(PineV5Parser.IMPORT);
            this.state = 240;
            this.import_path();
            this.state = 243;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 18, this.context) ) {
            case 1:
                {
                this.state = 241;
                this.match(PineV5Parser.AS);
                this.state = 242;
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
        this.enterRule(localContext, 28, PineV5Parser.RULE_import_path);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 245;
            this.import_user();
            this.state = 254;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 56) {
                {
                {
                this.state = 246;
                this.match(PineV5Parser.DIV);
                this.state = 250;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case PineV5Parser.TYPE:
                case PineV5Parser.METHOD:
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
                    this.state = 247;
                    this.id();
                    }
                    break;
                case PineV5Parser.INT_LITERAL:
                    {
                    this.state = 248;
                    this.match(PineV5Parser.INT_LITERAL);
                    }
                    break;
                case PineV5Parser.FLOAT_LITERAL:
                    {
                    this.state = 249;
                    this.match(PineV5Parser.FLOAT_LITERAL);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                }
                this.state = 256;
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
    public import_user(): Import_userContext {
        let localContext = new Import_userContext(this.context, this.state);
        this.enterRule(localContext, 30, PineV5Parser.RULE_import_user);
        try {
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 257;
            this.user_part();
            this.state = 262;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 21, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
                    {
                    {
                    this.state = 258;
                    this.match(PineV5Parser.MINUS);
                    this.state = 259;
                    this.user_part();
                    }
                    }
                }
                this.state = 264;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 21, this.context);
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
    public user_part(): User_partContext {
        let localContext = new User_partContext(this.context, this.state);
        this.enterRule(localContext, 32, PineV5Parser.RULE_user_part);
        try {
            this.state = 270;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV5Parser.TYPE:
            case PineV5Parser.METHOD:
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
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 265;
                this.id();
                }
                break;
            case PineV5Parser.INT_LITERAL:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 266;
                this.match(PineV5Parser.INT_LITERAL);
                this.state = 268;
                this.errorHandler.sync(this);
                switch (this.interpreter.adaptivePredict(this.tokenStream, 22, this.context) ) {
                case 1:
                    {
                    this.state = 267;
                    this.id();
                    }
                    break;
                }
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
    public fun_param(): Fun_paramContext {
        let localContext = new Fun_paramContext(this.context, this.state);
        this.enterRule(localContext, 34, PineV5Parser.RULE_fun_param);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 273;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 24, this.context) ) {
            case 1:
                {
                this.state = 272;
                this.type_qual();
                }
                break;
            }
            this.state = 276;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 25, this.context) ) {
            case 1:
                {
                this.state = 275;
                this.field_type();
                }
                break;
            }
            this.state = 278;
            this.id();
            this.state = 281;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 58) {
                {
                this.state = 279;
                this.match(PineV5Parser.DEFINE);
                this.state = 280;
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
        this.enterRule(localContext, 36, PineV5Parser.RULE_type_args);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 283;
            this.match(PineV5Parser.LT);
            this.state = 284;
            this.type_arg();
            this.state = 289;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 60) {
                {
                {
                this.state = 285;
                this.match(PineV5Parser.COMMA);
                this.state = 286;
                this.type_arg();
                }
                }
                this.state = 291;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 292;
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
        this.enterRule(localContext, 38, PineV5Parser.RULE_type_arg);
        try {
            this.state = 296;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 28, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 294;
                this.type_name();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 295;
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
    public for_in_expr(): For_in_exprContext {
        let localContext = new For_in_exprContext(this.context, this.state);
        this.enterRule(localContext, 40, PineV5Parser.RULE_for_in_expr);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 298;
            this.match(PineV5Parser.FOR_STMT);
            this.state = 301;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV5Parser.LSQBR:
                {
                this.state = 299;
                this.ids_array();
                }
                break;
            case PineV5Parser.TYPE:
            case PineV5Parser.METHOD:
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
                this.state = 300;
                this.id();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
            this.state = 303;
            this.match(PineV5Parser.IN);
            this.state = 304;
            this.ternary_expr();
            this.state = 305;
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
    public call_suffix(): Call_suffixContext {
        let localContext = new Call_suffixContext(this.context, this.state);
        this.enterRule(localContext, 42, PineV5Parser.RULE_call_suffix);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 307;
            this.match(PineV5Parser.DOT);
            this.state = 308;
            this.id();
            this.state = 317;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 32, this.context) ) {
            case 1:
                {
                this.state = 310;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 51) {
                    {
                    this.state = 309;
                    this.type_args();
                    }
                }

                this.state = 312;
                this.match(PineV5Parser.LPAR);
                this.state = 314;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (((((_la - 5)) & ~0x1F) === 0 && ((1 << (_la - 5)) & 2688547911) !== 0) || ((((_la - 43)) & ~0x1F) === 0 && ((1 << (_la - 43)) & 131337219) !== 0)) {
                    {
                    this.state = 313;
                    this.fun_actual_args();
                    }
                }

                this.state = 316;
                this.match(PineV5Parser.RPAR);
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
    public fun_call(): Fun_callContext {
        let localContext = new Fun_callContext(this.context, this.state);
        this.enterRule(localContext, 44, PineV5Parser.RULE_fun_call);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 319;
            this.id();
            this.state = 321;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 51) {
                {
                this.state = 320;
                this.type_args();
                }
            }

            this.state = 323;
            this.match(PineV5Parser.LPAR);
            this.state = 325;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (((((_la - 5)) & ~0x1F) === 0 && ((1 << (_la - 5)) & 2688547911) !== 0) || ((((_la - 43)) & ~0x1F) === 0 && ((1 << (_la - 43)) & 131337219) !== 0)) {
                {
                this.state = 324;
                this.fun_actual_args();
                }
            }

            this.state = 327;
            this.match(PineV5Parser.RPAR);
            this.state = 331;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 73) {
                {
                {
                this.state = 328;
                this.call_suffix();
                }
                }
                this.state = 333;
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
    public atom(): AtomContext {
        let localContext = new AtomContext(this.context, this.state);
        this.enterRule(localContext, 46, PineV5Parser.RULE_atom);
        let _la: number;
        try {
            this.state = 352;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 38, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 334;
                this.fun_call();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 335;
                this.id();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 336;
                this.literal();
                this.state = 340;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 73) {
                    {
                    {
                    this.state = 337;
                    this.call_suffix();
                    }
                    }
                    this.state = 342;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 343;
                this.match(PineV5Parser.LPAR);
                this.state = 344;
                this.arith_expr();
                this.state = 345;
                this.match(PineV5Parser.RPAR);
                this.state = 349;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 73) {
                    {
                    {
                    this.state = 346;
                    this.call_suffix();
                    }
                    }
                    this.state = 351;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
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
    public id(): IdContext {
        let localContext = new IdContext(this.context, this.state);
        this.enterRule(localContext, 48, PineV5Parser.RULE_id);
        try {
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 354;
            this.id_part();
            this.state = 366;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 40, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
                    {
                    {
                    this.state = 355;
                    this.match(PineV5Parser.DOT);
                    this.state = 362;
                    this.errorHandler.sync(this);
                    switch (this.interpreter.adaptivePredict(this.tokenStream, 39, this.context) ) {
                    case 1:
                        {
                        this.state = 356;
                        this.id_part();
                        }
                        break;
                    case 2:
                        {
                        this.state = 357;
                        this.match(PineV5Parser.TYPE);
                        }
                        break;
                    case 3:
                        {
                        this.state = 358;
                        this.match(PineV5Parser.METHOD);
                        }
                        break;
                    case 4:
                        {
                        this.state = 359;
                        this.match(PineV5Parser.IMPORT);
                        }
                        break;
                    case 5:
                        {
                        this.state = 360;
                        this.match(PineV5Parser.EXPORT);
                        }
                        break;
                    case 6:
                        {
                        this.state = 361;
                        this.match(PineV5Parser.ENUM);
                        }
                        break;
                    }
                    }
                    }
                }
                this.state = 368;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 40, this.context);
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
    public stmt(): StmtContext {
        let localContext = new StmtContext(this.context, this.state);
        this.enterRule(localContext, 50, PineV5Parser.RULE_stmt);
        try {
            this.state = 376;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 41, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 369;
                this.import_stmt();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 370;
                this.export_stmt();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 371;
                this.type_def_stmt();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 372;
                this.enum_def_stmt();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 373;
                this.method_def_stmt();
                }
                break;
            case 6:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 374;
                this.fun_def_stmt();
                }
                break;
            case 7:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 375;
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
        this.enterRule(localContext, 52, PineV5Parser.RULE_fun_head);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 378;
            this.match(PineV5Parser.LPAR);
            this.state = 387;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 134187200) !== 0) || _la === 69) {
                {
                this.state = 379;
                this.fun_param();
                this.state = 384;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 60) {
                    {
                    {
                    this.state = 380;
                    this.match(PineV5Parser.COMMA);
                    this.state = 381;
                    this.fun_param();
                    }
                    }
                    this.state = 386;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                }
            }

            this.state = 389;
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
        this.enterRule(localContext, 54, PineV5Parser.RULE_var_def);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 392;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 13 || _la === 14) {
                {
                this.state = 391;
                this.decl_mod();
                }
            }

            this.state = 395;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 45, this.context) ) {
            case 1:
                {
                this.state = 394;
                this.type_qual();
                }
                break;
            }
            this.state = 398;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 46, this.context) ) {
            case 1:
                {
                this.state = 397;
                this.field_type();
                }
                break;
            }
            this.state = 400;
            this.id();
            this.state = 401;
            this.match(PineV5Parser.DEFINE);
            this.state = 402;
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
        this.enterRule(localContext, 56, PineV5Parser.RULE_var_defs);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 405;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 13 || _la === 14) {
                {
                this.state = 404;
                this.decl_mod();
                }
            }

            this.state = 408;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 48, this.context) ) {
            case 1:
                {
                this.state = 407;
                this.type_qual();
                }
                break;
            }
            this.state = 411;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 134187200) !== 0) || _la === 69) {
                {
                this.state = 410;
                this.field_type();
                }
            }

            this.state = 413;
            this.ids_array();
            this.state = 414;
            this.match(PineV5Parser.DEFINE);
            this.state = 415;
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
        this.enterRule(localContext, 58, PineV5Parser.RULE_id_part);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 417;
            _la = this.tokenStream.LA(1);
            if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 134187200) !== 0) || _la === 69)) {
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
        this.enterRule(localContext, 60, PineV5Parser.RULE_global_stmt_content);
        try {
            this.state = 431;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 50, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 419;
                this.var_def();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 420;
                this.var_defs();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 421;
                this.fun_call();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 422;
                this.if_expr();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 423;
                this.var_assign();
                }
                break;
            case 6:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 424;
                this.for_expr();
                }
                break;
            case 7:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 425;
                this.for_in_expr();
                }
                break;
            case 8:
                this.enterOuterAlt(localContext, 8);
                {
                this.state = 426;
                this.while_expr();
                }
                break;
            case 9:
                this.enterOuterAlt(localContext, 9);
                {
                this.state = 427;
                this.switch_expr();
                }
                break;
            case 10:
                this.enterOuterAlt(localContext, 10);
                {
                this.state = 428;
                this.loop_break();
                }
                break;
            case 11:
                this.enterOuterAlt(localContext, 11);
                {
                this.state = 429;
                this.loop_continue();
                }
                break;
            case 12:
                this.enterOuterAlt(localContext, 12);
                {
                this.state = 430;
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
        this.enterRule(localContext, 62, PineV5Parser.RULE_local_stmt_content);
        try {
            this.state = 441;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 51, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 433;
                this.var_def();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 434;
                this.var_defs();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 435;
                this.arith_expr();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 436;
                this.arith_exprs();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 437;
                this.var_assign();
                }
                break;
            case 6:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 438;
                this.while_expr();
                }
                break;
            case 7:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 439;
                this.loop_break();
                }
                break;
            case 8:
                this.enterOuterAlt(localContext, 8);
                {
                this.state = 440;
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
        this.enterRule(localContext, 64, PineV5Parser.RULE_arith_expr);
        try {
            this.state = 448;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 52, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 443;
                this.ternary_expr();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 444;
                this.if_expr();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 445;
                this.for_expr();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 446;
                this.for_in_expr();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 447;
                this.switch_expr();
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
    public decl_mod(): Decl_modContext {
        let localContext = new Decl_modContext(this.context, this.state);
        this.enterRule(localContext, 66, PineV5Parser.RULE_decl_mod);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 450;
            _la = this.tokenStream.LA(1);
            if(!(_la === 13 || _la === 14)) {
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
        this.enterRule(localContext, 68, PineV5Parser.RULE_type_qual);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 452;
            _la = this.tokenStream.LA(1);
            if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 229376) !== 0))) {
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
        this.enterRule(localContext, 70, PineV5Parser.RULE_type_name);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 454;
            _la = this.tokenStream.LA(1);
            if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 133955584) !== 0))) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            this.state = 457;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 53, this.context) ) {
            case 1:
                {
                this.state = 455;
                this.match(PineV5Parser.LSQBR);
                this.state = 456;
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
    public compound_assign_op(): Compound_assign_opContext {
        let localContext = new Compound_assign_opContext(this.context, this.state);
        this.enterRule(localContext, 72, PineV5Parser.RULE_compound_assign_op);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 459;
            _la = this.tokenStream.LA(1);
            if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 4160749568) !== 0))) {
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
    public var_assign(): Var_assignContext {
        let localContext = new Var_assignContext(this.context, this.state);
        this.enterRule(localContext, 74, PineV5Parser.RULE_var_assign);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 461;
            this.id();
            this.state = 464;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV5Parser.ASSIGN:
                {
                this.state = 462;
                this.match(PineV5Parser.ASSIGN);
                }
                break;
            case PineV5Parser.PLUS_ASSIGN:
            case PineV5Parser.MINUS_ASSIGN:
            case PineV5Parser.MUL_ASSIGN:
            case PineV5Parser.DIV_ASSIGN:
            case PineV5Parser.MOD_ASSIGN:
                {
                this.state = 463;
                this.compound_assign_op();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
            this.state = 466;
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
    public if_expr(): If_exprContext {
        let localContext = new If_exprContext(this.context, this.state);
        this.enterRule(localContext, 76, PineV5Parser.RULE_if_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 468;
            this.match(PineV5Parser.IF_COND);
            this.state = 469;
            this.ternary_expr();
            this.state = 470;
            this.stmts_block();
            this.state = 482;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 57, this.context) ) {
            case 1:
                {
                this.state = 474;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 3) {
                    {
                    {
                    this.state = 471;
                    this.match(PineV5Parser.LEND);
                    }
                    }
                    this.state = 476;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                this.state = 477;
                this.match(PineV5Parser.IF_COND_ELSE);
                this.state = 480;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case PineV5Parser.IF_COND:
                    {
                    this.state = 478;
                    this.if_expr();
                    }
                    break;
                case PineV5Parser.BEGIN:
                    {
                    this.state = 479;
                    this.stmts_block();
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
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
    public pos_arg(): Pos_argContext {
        let localContext = new Pos_argContext(this.context, this.state);
        this.enterRule(localContext, 78, PineV5Parser.RULE_pos_arg);
        try {
            this.state = 486;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV5Parser.SWITCH:
            case PineV5Parser.TYPE:
            case PineV5Parser.METHOD:
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
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 484;
                this.arith_expr();
                }
                break;
            case PineV5Parser.LSQBR:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 485;
                this.arith_exprs();
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
    public pos_args(): Pos_argsContext {
        let localContext = new Pos_argsContext(this.context, this.state);
        this.enterRule(localContext, 80, PineV5Parser.RULE_pos_args);
        try {
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 488;
            this.pos_arg();
            this.state = 493;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 59, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
                    {
                    {
                    this.state = 489;
                    this.match(PineV5Parser.COMMA);
                    this.state = 490;
                    this.pos_arg();
                    }
                    }
                }
                this.state = 495;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 59, this.context);
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
    public pine_script(): Pine_scriptContext {
        let localContext = new Pine_scriptContext(this.context, this.state);
        this.enterRule(localContext, 82, PineV5Parser.RULE_pine_script);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 500;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 134213624) !== 0) || ((((_la - 34)) & ~0x1F) === 0 && ((1 << (_la - 34)) & 2820146789) !== 0) || ((((_la - 66)) & ~0x1F) === 0 && ((1 << (_la - 66)) & 15) !== 0)) {
                {
                this.state = 498;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case PineV5Parser.WHILE:
                case PineV5Parser.SWITCH:
                case PineV5Parser.TYPE:
                case PineV5Parser.METHOD:
                case PineV5Parser.IMPORT:
                case PineV5Parser.EXPORT:
                case PineV5Parser.ENUM:
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
                    this.state = 496;
                    this.stmt();
                    }
                    break;
                case PineV5Parser.LEND:
                    {
                    this.state = 497;
                    this.match(PineV5Parser.LEND);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                this.state = 502;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 503;
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
        this.enterRule(localContext, 84, PineV5Parser.RULE_global_stmt);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 505;
            this.global_stmt_content();
            this.state = 510;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 60) {
                {
                {
                this.state = 506;
                this.match(PineV5Parser.COMMA);
                this.state = 507;
                this.global_stmt_content();
                }
                }
                this.state = 512;
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
        this.enterRule(localContext, 86, PineV5Parser.RULE_fun_def_stmt);
        try {
            this.state = 515;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 63, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 513;
                this.fun_def_singleline();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 514;
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
        this.enterRule(localContext, 88, PineV5Parser.RULE_fun_def_singleline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 517;
            this.id();
            this.state = 518;
            this.fun_head();
            this.state = 519;
            this.match(PineV5Parser.ARROW);
            this.state = 520;
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
        this.enterRule(localContext, 90, PineV5Parser.RULE_fun_def_multiline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 522;
            this.id();
            this.state = 523;
            this.fun_head();
            this.state = 524;
            this.match(PineV5Parser.ARROW);
            this.state = 525;
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
        this.enterRule(localContext, 92, PineV5Parser.RULE_fun_body_singleline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 527;
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
        this.enterRule(localContext, 94, PineV5Parser.RULE_local_stmt_singleline);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 529;
            this.local_stmt_content();
            this.state = 534;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 60) {
                {
                {
                this.state = 530;
                this.match(PineV5Parser.COMMA);
                this.state = 531;
                this.local_stmt_content();
                }
                }
                this.state = 536;
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
        this.enterRule(localContext, 96, PineV5Parser.RULE_loop_break);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 537;
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
        this.enterRule(localContext, 98, PineV5Parser.RULE_loop_continue);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 539;
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
        this.enterRule(localContext, 100, PineV5Parser.RULE_fun_body_multiline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 541;
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
        this.enterRule(localContext, 102, PineV5Parser.RULE_local_stmts_multiline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 543;
            this.match(PineV5Parser.BEGIN);
            this.state = 544;
            this.local_stmts_list();
            this.state = 545;
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
        this.enterRule(localContext, 104, PineV5Parser.RULE_local_stmts_list);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 549;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                this.state = 549;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case PineV5Parser.WHILE:
                case PineV5Parser.SWITCH:
                case PineV5Parser.TYPE:
                case PineV5Parser.METHOD:
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
                    this.state = 547;
                    this.local_stmt_multiline();
                    }
                    break;
                case PineV5Parser.LEND:
                    {
                    this.state = 548;
                    this.match(PineV5Parser.LEND);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                this.state = 551;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 134211832) !== 0) || ((((_la - 34)) & ~0x1F) === 0 && ((1 << (_la - 34)) & 2820146789) !== 0) || ((((_la - 66)) & ~0x1F) === 0 && ((1 << (_la - 66)) & 15) !== 0));
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
        this.enterRule(localContext, 106, PineV5Parser.RULE_local_stmt_multiline);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 553;
            this.local_stmt_content();
            this.state = 558;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 60) {
                {
                {
                this.state = 554;
                this.match(PineV5Parser.COMMA);
                this.state = 555;
                this.local_stmt_content();
                }
                }
                this.state = 560;
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
        this.enterRule(localContext, 108, PineV5Parser.RULE_ids_array);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 561;
            this.match(PineV5Parser.LSQBR);
            this.state = 562;
            this.id();
            this.state = 567;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 60) {
                {
                {
                this.state = 563;
                this.match(PineV5Parser.COMMA);
                this.state = 564;
                this.id();
                }
                }
                this.state = 569;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 570;
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
        this.enterRule(localContext, 110, PineV5Parser.RULE_arith_exprs);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 572;
            this.match(PineV5Parser.LSQBR);
            this.state = 573;
            this.arith_expr();
            this.state = 578;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 60) {
                {
                {
                this.state = 574;
                this.match(PineV5Parser.COMMA);
                this.state = 575;
                this.arith_expr();
                }
                }
                this.state = 580;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 581;
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
    public for_expr(): For_exprContext {
        let localContext = new For_exprContext(this.context, this.state);
        this.enterRule(localContext, 112, PineV5Parser.RULE_for_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 583;
            this.match(PineV5Parser.FOR_STMT);
            this.state = 584;
            this.var_def();
            this.state = 585;
            this.match(PineV5Parser.FOR_STMT_TO);
            this.state = 586;
            this.ternary_expr();
            this.state = 589;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 38) {
                {
                this.state = 587;
                this.match(PineV5Parser.FOR_STMT_BY);
                this.state = 588;
                this.ternary_expr();
                }
            }

            this.state = 591;
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
        this.enterRule(localContext, 114, PineV5Parser.RULE_stmts_block);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 593;
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
        this.enterRule(localContext, 116, PineV5Parser.RULE_ternary_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 595;
            this.or_expr();
            this.state = 601;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 45) {
                {
                this.state = 596;
                this.match(PineV5Parser.COND);
                this.state = 597;
                this.ternary_expr();
                this.state = 598;
                this.match(PineV5Parser.COND_ELSE);
                this.state = 599;
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
        this.enterRule(localContext, 118, PineV5Parser.RULE_or_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 603;
            this.and_expr();
            this.state = 608;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 41) {
                {
                {
                this.state = 604;
                this.match(PineV5Parser.OR);
                this.state = 605;
                this.and_expr();
                }
                }
                this.state = 610;
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
        this.enterRule(localContext, 120, PineV5Parser.RULE_and_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 611;
            this.eq_expr();
            this.state = 616;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 42) {
                {
                {
                this.state = 612;
                this.match(PineV5Parser.AND);
                this.state = 613;
                this.eq_expr();
                }
                }
                this.state = 618;
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
        this.enterRule(localContext, 122, PineV5Parser.RULE_eq_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 619;
            this.cmp_expr();
            this.state = 624;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 47 || _la === 48) {
                {
                {
                this.state = 620;
                _la = this.tokenStream.LA(1);
                if(!(_la === 47 || _la === 48)) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                this.state = 621;
                this.cmp_expr();
                }
                }
                this.state = 626;
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
        this.enterRule(localContext, 124, PineV5Parser.RULE_cmp_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 627;
            this.add_expr();
            this.state = 632;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (((((_la - 49)) & ~0x1F) === 0 && ((1 << (_la - 49)) & 15) !== 0)) {
                {
                {
                this.state = 628;
                _la = this.tokenStream.LA(1);
                if(!(((((_la - 49)) & ~0x1F) === 0 && ((1 << (_la - 49)) & 15) !== 0))) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                this.state = 629;
                this.add_expr();
                }
                }
                this.state = 634;
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
        this.enterRule(localContext, 126, PineV5Parser.RULE_add_expr);
        let _la: number;
        try {
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 635;
            this.mult_expr();
            this.state = 640;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 76, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
                    {
                    {
                    this.state = 636;
                    _la = this.tokenStream.LA(1);
                    if(!(_la === 53 || _la === 54)) {
                    this.errorHandler.recoverInline(this);
                    }
                    else {
                        this.errorHandler.reportMatch(this);
                        this.consume();
                    }
                    this.state = 637;
                    this.mult_expr();
                    }
                    }
                }
                this.state = 642;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 76, this.context);
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
        this.enterRule(localContext, 128, PineV5Parser.RULE_mult_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 643;
            this.unary_expr();
            this.state = 648;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (((((_la - 55)) & ~0x1F) === 0 && ((1 << (_la - 55)) & 7) !== 0)) {
                {
                {
                this.state = 644;
                _la = this.tokenStream.LA(1);
                if(!(((((_la - 55)) & ~0x1F) === 0 && ((1 << (_la - 55)) & 7) !== 0))) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                this.state = 645;
                this.unary_expr();
                }
                }
                this.state = 650;
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
        this.enterRule(localContext, 130, PineV5Parser.RULE_unary_expr);
        try {
            this.state = 658;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV5Parser.TYPE:
            case PineV5Parser.METHOD:
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
                this.state = 651;
                this.sqbr_expr();
                }
                break;
            case PineV5Parser.NOT:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 652;
                this.match(PineV5Parser.NOT);
                this.state = 653;
                this.sqbr_expr();
                }
                break;
            case PineV5Parser.PLUS:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 654;
                this.match(PineV5Parser.PLUS);
                this.state = 655;
                this.sqbr_expr();
                }
                break;
            case PineV5Parser.MINUS:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 656;
                this.match(PineV5Parser.MINUS);
                this.state = 657;
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
        this.enterRule(localContext, 132, PineV5Parser.RULE_sqbr_expr);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 660;
            this.atom();
            this.state = 665;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 79, this.context) ) {
            case 1:
                {
                this.state = 661;
                this.match(PineV5Parser.LSQBR);
                this.state = 662;
                this.arith_expr();
                this.state = 663;
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
    public fun_actual_args(): Fun_actual_argsContext {
        let localContext = new Fun_actual_argsContext(this.context, this.state);
        this.enterRule(localContext, 134, PineV5Parser.RULE_fun_actual_args);
        let _la: number;
        try {
            this.state = 673;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 81, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 667;
                this.kw_args();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 668;
                this.pos_args();
                this.state = 671;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 60) {
                    {
                    this.state = 669;
                    this.match(PineV5Parser.COMMA);
                    this.state = 670;
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
    public kw_args(): Kw_argsContext {
        let localContext = new Kw_argsContext(this.context, this.state);
        this.enterRule(localContext, 136, PineV5Parser.RULE_kw_args);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 675;
            this.kw_arg();
            this.state = 680;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 60) {
                {
                {
                this.state = 676;
                this.match(PineV5Parser.COMMA);
                this.state = 677;
                this.kw_arg();
                }
                }
                this.state = 682;
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
        this.enterRule(localContext, 138, PineV5Parser.RULE_kw_arg);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 683;
            this.id();
            this.state = 684;
            this.match(PineV5Parser.DEFINE);
            this.state = 687;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV5Parser.SWITCH:
            case PineV5Parser.TYPE:
            case PineV5Parser.METHOD:
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
                this.state = 685;
                this.arith_expr();
                }
                break;
            case PineV5Parser.LSQBR:
                {
                this.state = 686;
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
        this.enterRule(localContext, 140, PineV5Parser.RULE_literal);
        try {
            this.state = 691;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV5Parser.INT_LITERAL:
            case PineV5Parser.FLOAT_LITERAL:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 689;
                this.num_literal();
                }
                break;
            case PineV5Parser.BOOL_LITERAL:
            case PineV5Parser.STR_LITERAL:
            case PineV5Parser.COLOR_LITERAL:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 690;
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
        this.enterRule(localContext, 142, PineV5Parser.RULE_num_literal);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 693;
            _la = this.tokenStream.LA(1);
            if(!(_la === 65 || _la === 66)) {
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
        this.enterRule(localContext, 144, PineV5Parser.RULE_other_literal);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 695;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 44)) & ~0x1F) === 0 && ((1 << (_la - 44)) & 25165825) !== 0))) {
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
        4,1,73,698,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,2,6,7,
        6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,2,11,7,11,2,12,7,12,2,13,7,13,
        2,14,7,14,2,15,7,15,2,16,7,16,2,17,7,17,2,18,7,18,2,19,7,19,2,20,
        7,20,2,21,7,21,2,22,7,22,2,23,7,23,2,24,7,24,2,25,7,25,2,26,7,26,
        2,27,7,27,2,28,7,28,2,29,7,29,2,30,7,30,2,31,7,31,2,32,7,32,2,33,
        7,33,2,34,7,34,2,35,7,35,2,36,7,36,2,37,7,37,2,38,7,38,2,39,7,39,
        2,40,7,40,2,41,7,41,2,42,7,42,2,43,7,43,2,44,7,44,2,45,7,45,2,46,
        7,46,2,47,7,47,2,48,7,48,2,49,7,49,2,50,7,50,2,51,7,51,2,52,7,52,
        2,53,7,53,2,54,7,54,2,55,7,55,2,56,7,56,2,57,7,57,2,58,7,58,2,59,
        7,59,2,60,7,60,2,61,7,61,2,62,7,62,2,63,7,63,2,64,7,64,2,65,7,65,
        2,66,7,66,2,67,7,67,2,68,7,68,2,69,7,69,2,70,7,70,2,71,7,71,2,72,
        7,72,1,0,1,0,1,0,1,0,1,1,1,1,3,1,153,8,1,1,1,1,1,1,2,1,2,1,2,4,2,
        160,8,2,11,2,12,2,161,1,2,1,2,1,3,3,3,167,8,3,1,3,1,3,1,3,3,3,172,
        8,3,1,4,1,4,3,4,176,8,4,1,4,3,4,179,8,4,1,4,1,4,3,4,183,8,4,1,5,
        1,5,1,5,1,5,1,6,1,6,1,6,4,6,192,8,6,11,6,12,6,193,1,6,1,6,1,7,3,
        7,199,8,7,1,7,3,7,202,8,7,1,7,3,7,205,8,7,1,7,1,7,1,7,3,7,210,8,
        7,1,8,1,8,1,8,1,9,1,9,1,9,1,9,1,10,1,10,1,10,4,10,222,8,10,11,10,
        12,10,223,1,10,1,10,1,11,1,11,1,11,3,11,231,8,11,1,12,1,12,1,12,
        1,12,1,12,3,12,238,8,12,1,13,1,13,1,13,1,13,3,13,244,8,13,1,14,1,
        14,1,14,1,14,1,14,3,14,251,8,14,5,14,253,8,14,10,14,12,14,256,9,
        14,1,15,1,15,1,15,5,15,261,8,15,10,15,12,15,264,9,15,1,16,1,16,1,
        16,3,16,269,8,16,3,16,271,8,16,1,17,3,17,274,8,17,1,17,3,17,277,
        8,17,1,17,1,17,1,17,3,17,282,8,17,1,18,1,18,1,18,1,18,5,18,288,8,
        18,10,18,12,18,291,9,18,1,18,1,18,1,19,1,19,3,19,297,8,19,1,20,1,
        20,1,20,3,20,302,8,20,1,20,1,20,1,20,1,20,1,21,1,21,1,21,3,21,311,
        8,21,1,21,1,21,3,21,315,8,21,1,21,3,21,318,8,21,1,22,1,22,3,22,322,
        8,22,1,22,1,22,3,22,326,8,22,1,22,1,22,5,22,330,8,22,10,22,12,22,
        333,9,22,1,23,1,23,1,23,1,23,5,23,339,8,23,10,23,12,23,342,9,23,
        1,23,1,23,1,23,1,23,5,23,348,8,23,10,23,12,23,351,9,23,3,23,353,
        8,23,1,24,1,24,1,24,1,24,1,24,1,24,1,24,1,24,3,24,363,8,24,5,24,
        365,8,24,10,24,12,24,368,9,24,1,25,1,25,1,25,1,25,1,25,1,25,1,25,
        3,25,377,8,25,1,26,1,26,1,26,1,26,5,26,383,8,26,10,26,12,26,386,
        9,26,3,26,388,8,26,1,26,1,26,1,27,3,27,393,8,27,1,27,3,27,396,8,
        27,1,27,3,27,399,8,27,1,27,1,27,1,27,1,27,1,28,3,28,406,8,28,1,28,
        3,28,409,8,28,1,28,3,28,412,8,28,1,28,1,28,1,28,1,28,1,29,1,29,1,
        30,1,30,1,30,1,30,1,30,1,30,1,30,1,30,1,30,1,30,1,30,1,30,3,30,432,
        8,30,1,31,1,31,1,31,1,31,1,31,1,31,1,31,1,31,3,31,442,8,31,1,32,
        1,32,1,32,1,32,1,32,3,32,449,8,32,1,33,1,33,1,34,1,34,1,35,1,35,
        1,35,3,35,458,8,35,1,36,1,36,1,37,1,37,1,37,3,37,465,8,37,1,37,1,
        37,1,38,1,38,1,38,1,38,5,38,473,8,38,10,38,12,38,476,9,38,1,38,1,
        38,1,38,3,38,481,8,38,3,38,483,8,38,1,39,1,39,3,39,487,8,39,1,40,
        1,40,1,40,5,40,492,8,40,10,40,12,40,495,9,40,1,41,1,41,5,41,499,
        8,41,10,41,12,41,502,9,41,1,41,1,41,1,42,1,42,1,42,5,42,509,8,42,
        10,42,12,42,512,9,42,1,43,1,43,3,43,516,8,43,1,44,1,44,1,44,1,44,
        1,44,1,45,1,45,1,45,1,45,1,45,1,46,1,46,1,47,1,47,1,47,5,47,533,
        8,47,10,47,12,47,536,9,47,1,48,1,48,1,49,1,49,1,50,1,50,1,51,1,51,
        1,51,1,51,1,52,1,52,4,52,550,8,52,11,52,12,52,551,1,53,1,53,1,53,
        5,53,557,8,53,10,53,12,53,560,9,53,1,54,1,54,1,54,1,54,5,54,566,
        8,54,10,54,12,54,569,9,54,1,54,1,54,1,55,1,55,1,55,1,55,5,55,577,
        8,55,10,55,12,55,580,9,55,1,55,1,55,1,56,1,56,1,56,1,56,1,56,1,56,
        3,56,590,8,56,1,56,1,56,1,57,1,57,1,58,1,58,1,58,1,58,1,58,1,58,
        3,58,602,8,58,1,59,1,59,1,59,5,59,607,8,59,10,59,12,59,610,9,59,
        1,60,1,60,1,60,5,60,615,8,60,10,60,12,60,618,9,60,1,61,1,61,1,61,
        5,61,623,8,61,10,61,12,61,626,9,61,1,62,1,62,1,62,5,62,631,8,62,
        10,62,12,62,634,9,62,1,63,1,63,1,63,5,63,639,8,63,10,63,12,63,642,
        9,63,1,64,1,64,1,64,5,64,647,8,64,10,64,12,64,650,9,64,1,65,1,65,
        1,65,1,65,1,65,1,65,1,65,3,65,659,8,65,1,66,1,66,1,66,1,66,1,66,
        3,66,666,8,66,1,67,1,67,1,67,1,67,3,67,672,8,67,3,67,674,8,67,1,
        68,1,68,1,68,5,68,679,8,68,10,68,12,68,682,9,68,1,69,1,69,1,69,1,
        69,3,69,688,8,69,1,70,1,70,3,70,692,8,70,1,71,1,71,1,72,1,72,1,72,
        0,0,73,0,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,
        42,44,46,48,50,52,54,56,58,60,62,64,66,68,70,72,74,76,78,80,82,84,
        86,88,90,92,94,96,98,100,102,104,106,108,110,112,114,116,118,120,
        122,124,126,128,130,132,134,136,138,140,142,144,0,11,4,0,6,7,11,
        11,15,26,69,69,1,0,13,14,1,0,15,17,1,0,18,26,1,0,27,31,1,0,47,48,
        1,0,49,52,1,0,53,54,1,0,55,57,1,0,65,66,2,0,44,44,67,68,744,0,146,
        1,0,0,0,2,150,1,0,0,0,4,156,1,0,0,0,6,166,1,0,0,0,8,175,1,0,0,0,
        10,184,1,0,0,0,12,188,1,0,0,0,14,198,1,0,0,0,16,211,1,0,0,0,18,214,
        1,0,0,0,20,218,1,0,0,0,22,227,1,0,0,0,24,232,1,0,0,0,26,239,1,0,
        0,0,28,245,1,0,0,0,30,257,1,0,0,0,32,270,1,0,0,0,34,273,1,0,0,0,
        36,283,1,0,0,0,38,296,1,0,0,0,40,298,1,0,0,0,42,307,1,0,0,0,44,319,
        1,0,0,0,46,352,1,0,0,0,48,354,1,0,0,0,50,376,1,0,0,0,52,378,1,0,
        0,0,54,392,1,0,0,0,56,405,1,0,0,0,58,417,1,0,0,0,60,431,1,0,0,0,
        62,441,1,0,0,0,64,448,1,0,0,0,66,450,1,0,0,0,68,452,1,0,0,0,70,454,
        1,0,0,0,72,459,1,0,0,0,74,461,1,0,0,0,76,468,1,0,0,0,78,486,1,0,
        0,0,80,488,1,0,0,0,82,500,1,0,0,0,84,505,1,0,0,0,86,515,1,0,0,0,
        88,517,1,0,0,0,90,522,1,0,0,0,92,527,1,0,0,0,94,529,1,0,0,0,96,537,
        1,0,0,0,98,539,1,0,0,0,100,541,1,0,0,0,102,543,1,0,0,0,104,549,1,
        0,0,0,106,553,1,0,0,0,108,561,1,0,0,0,110,572,1,0,0,0,112,583,1,
        0,0,0,114,593,1,0,0,0,116,595,1,0,0,0,118,603,1,0,0,0,120,611,1,
        0,0,0,122,619,1,0,0,0,124,627,1,0,0,0,126,635,1,0,0,0,128,643,1,
        0,0,0,130,658,1,0,0,0,132,660,1,0,0,0,134,673,1,0,0,0,136,675,1,
        0,0,0,138,683,1,0,0,0,140,691,1,0,0,0,142,693,1,0,0,0,144,695,1,
        0,0,0,146,147,5,4,0,0,147,148,3,116,58,0,148,149,3,114,57,0,149,
        1,1,0,0,0,150,152,5,5,0,0,151,153,3,116,58,0,152,151,1,0,0,0,152,
        153,1,0,0,0,153,154,1,0,0,0,154,155,3,4,2,0,155,3,1,0,0,0,156,159,
        5,1,0,0,157,160,3,6,3,0,158,160,5,3,0,0,159,157,1,0,0,0,159,158,
        1,0,0,0,160,161,1,0,0,0,161,159,1,0,0,0,161,162,1,0,0,0,162,163,
        1,0,0,0,163,164,5,2,0,0,164,5,1,0,0,0,165,167,3,116,58,0,166,165,
        1,0,0,0,166,167,1,0,0,0,167,168,1,0,0,0,168,171,5,59,0,0,169,172,
        3,94,47,0,170,172,3,114,57,0,171,169,1,0,0,0,171,170,1,0,0,0,172,
        7,1,0,0,0,173,176,3,70,35,0,174,176,3,48,24,0,175,173,1,0,0,0,175,
        174,1,0,0,0,176,178,1,0,0,0,177,179,3,36,18,0,178,177,1,0,0,0,178,
        179,1,0,0,0,179,182,1,0,0,0,180,181,5,63,0,0,181,183,5,64,0,0,182,
        180,1,0,0,0,182,183,1,0,0,0,183,9,1,0,0,0,184,185,5,6,0,0,185,186,
        3,48,24,0,186,187,3,12,6,0,187,11,1,0,0,0,188,191,5,1,0,0,189,192,
        3,14,7,0,190,192,5,3,0,0,191,189,1,0,0,0,191,190,1,0,0,0,192,193,
        1,0,0,0,193,191,1,0,0,0,193,194,1,0,0,0,194,195,1,0,0,0,195,196,
        5,2,0,0,196,13,1,0,0,0,197,199,5,14,0,0,198,197,1,0,0,0,198,199,
        1,0,0,0,199,201,1,0,0,0,200,202,3,68,34,0,201,200,1,0,0,0,201,202,
        1,0,0,0,202,204,1,0,0,0,203,205,3,8,4,0,204,203,1,0,0,0,204,205,
        1,0,0,0,205,206,1,0,0,0,206,209,3,48,24,0,207,208,5,58,0,0,208,210,
        3,64,32,0,209,207,1,0,0,0,209,210,1,0,0,0,210,15,1,0,0,0,211,212,
        5,7,0,0,212,213,3,86,43,0,213,17,1,0,0,0,214,215,5,10,0,0,215,216,
        3,48,24,0,216,217,3,20,10,0,217,19,1,0,0,0,218,221,5,1,0,0,219,222,
        3,22,11,0,220,222,5,3,0,0,221,219,1,0,0,0,221,220,1,0,0,0,222,223,
        1,0,0,0,223,221,1,0,0,0,223,224,1,0,0,0,224,225,1,0,0,0,225,226,
        5,2,0,0,226,21,1,0,0,0,227,230,3,48,24,0,228,229,5,58,0,0,229,231,
        3,64,32,0,230,228,1,0,0,0,230,231,1,0,0,0,231,23,1,0,0,0,232,237,
        5,9,0,0,233,238,3,10,5,0,234,238,3,18,9,0,235,238,3,16,8,0,236,238,
        3,86,43,0,237,233,1,0,0,0,237,234,1,0,0,0,237,235,1,0,0,0,237,236,
        1,0,0,0,238,25,1,0,0,0,239,240,5,8,0,0,240,243,3,28,14,0,241,242,
        5,11,0,0,242,244,3,48,24,0,243,241,1,0,0,0,243,244,1,0,0,0,244,27,
        1,0,0,0,245,254,3,30,15,0,246,250,5,56,0,0,247,251,3,48,24,0,248,
        251,5,65,0,0,249,251,5,66,0,0,250,247,1,0,0,0,250,248,1,0,0,0,250,
        249,1,0,0,0,251,253,1,0,0,0,252,246,1,0,0,0,253,256,1,0,0,0,254,
        252,1,0,0,0,254,255,1,0,0,0,255,29,1,0,0,0,256,254,1,0,0,0,257,262,
        3,32,16,0,258,259,5,54,0,0,259,261,3,32,16,0,260,258,1,0,0,0,261,
        264,1,0,0,0,262,260,1,0,0,0,262,263,1,0,0,0,263,31,1,0,0,0,264,262,
        1,0,0,0,265,271,3,48,24,0,266,268,5,65,0,0,267,269,3,48,24,0,268,
        267,1,0,0,0,268,269,1,0,0,0,269,271,1,0,0,0,270,265,1,0,0,0,270,
        266,1,0,0,0,271,33,1,0,0,0,272,274,3,68,34,0,273,272,1,0,0,0,273,
        274,1,0,0,0,274,276,1,0,0,0,275,277,3,8,4,0,276,275,1,0,0,0,276,
        277,1,0,0,0,277,278,1,0,0,0,278,281,3,48,24,0,279,280,5,58,0,0,280,
        282,3,64,32,0,281,279,1,0,0,0,281,282,1,0,0,0,282,35,1,0,0,0,283,
        284,5,51,0,0,284,289,3,38,19,0,285,286,5,60,0,0,286,288,3,38,19,
        0,287,285,1,0,0,0,288,291,1,0,0,0,289,287,1,0,0,0,289,290,1,0,0,
        0,290,292,1,0,0,0,291,289,1,0,0,0,292,293,5,49,0,0,293,37,1,0,0,
        0,294,297,3,70,35,0,295,297,3,48,24,0,296,294,1,0,0,0,296,295,1,
        0,0,0,297,39,1,0,0,0,298,301,5,36,0,0,299,302,3,108,54,0,300,302,
        3,48,24,0,301,299,1,0,0,0,301,300,1,0,0,0,302,303,1,0,0,0,303,304,
        5,12,0,0,304,305,3,116,58,0,305,306,3,114,57,0,306,41,1,0,0,0,307,
        308,5,73,0,0,308,317,3,48,24,0,309,311,3,36,18,0,310,309,1,0,0,0,
        310,311,1,0,0,0,311,312,1,0,0,0,312,314,5,61,0,0,313,315,3,134,67,
        0,314,313,1,0,0,0,314,315,1,0,0,0,315,316,1,0,0,0,316,318,5,62,0,
        0,317,310,1,0,0,0,317,318,1,0,0,0,318,43,1,0,0,0,319,321,3,48,24,
        0,320,322,3,36,18,0,321,320,1,0,0,0,321,322,1,0,0,0,322,323,1,0,
        0,0,323,325,5,61,0,0,324,326,3,134,67,0,325,324,1,0,0,0,325,326,
        1,0,0,0,326,327,1,0,0,0,327,331,5,62,0,0,328,330,3,42,21,0,329,328,
        1,0,0,0,330,333,1,0,0,0,331,329,1,0,0,0,331,332,1,0,0,0,332,45,1,
        0,0,0,333,331,1,0,0,0,334,353,3,44,22,0,335,353,3,48,24,0,336,340,
        3,140,70,0,337,339,3,42,21,0,338,337,1,0,0,0,339,342,1,0,0,0,340,
        338,1,0,0,0,340,341,1,0,0,0,341,353,1,0,0,0,342,340,1,0,0,0,343,
        344,5,61,0,0,344,345,3,64,32,0,345,349,5,62,0,0,346,348,3,42,21,
        0,347,346,1,0,0,0,348,351,1,0,0,0,349,347,1,0,0,0,349,350,1,0,0,
        0,350,353,1,0,0,0,351,349,1,0,0,0,352,334,1,0,0,0,352,335,1,0,0,
        0,352,336,1,0,0,0,352,343,1,0,0,0,353,47,1,0,0,0,354,366,3,58,29,
        0,355,362,5,73,0,0,356,363,3,58,29,0,357,363,5,6,0,0,358,363,5,7,
        0,0,359,363,5,8,0,0,360,363,5,9,0,0,361,363,5,10,0,0,362,356,1,0,
        0,0,362,357,1,0,0,0,362,358,1,0,0,0,362,359,1,0,0,0,362,360,1,0,
        0,0,362,361,1,0,0,0,363,365,1,0,0,0,364,355,1,0,0,0,365,368,1,0,
        0,0,366,364,1,0,0,0,366,367,1,0,0,0,367,49,1,0,0,0,368,366,1,0,0,
        0,369,377,3,26,13,0,370,377,3,24,12,0,371,377,3,10,5,0,372,377,3,
        18,9,0,373,377,3,16,8,0,374,377,3,86,43,0,375,377,3,84,42,0,376,
        369,1,0,0,0,376,370,1,0,0,0,376,371,1,0,0,0,376,372,1,0,0,0,376,
        373,1,0,0,0,376,374,1,0,0,0,376,375,1,0,0,0,377,51,1,0,0,0,378,387,
        5,61,0,0,379,384,3,34,17,0,380,381,5,60,0,0,381,383,3,34,17,0,382,
        380,1,0,0,0,383,386,1,0,0,0,384,382,1,0,0,0,384,385,1,0,0,0,385,
        388,1,0,0,0,386,384,1,0,0,0,387,379,1,0,0,0,387,388,1,0,0,0,388,
        389,1,0,0,0,389,390,5,62,0,0,390,53,1,0,0,0,391,393,3,66,33,0,392,
        391,1,0,0,0,392,393,1,0,0,0,393,395,1,0,0,0,394,396,3,68,34,0,395,
        394,1,0,0,0,395,396,1,0,0,0,396,398,1,0,0,0,397,399,3,8,4,0,398,
        397,1,0,0,0,398,399,1,0,0,0,399,400,1,0,0,0,400,401,3,48,24,0,401,
        402,5,58,0,0,402,403,3,64,32,0,403,55,1,0,0,0,404,406,3,66,33,0,
        405,404,1,0,0,0,405,406,1,0,0,0,406,408,1,0,0,0,407,409,3,68,34,
        0,408,407,1,0,0,0,408,409,1,0,0,0,409,411,1,0,0,0,410,412,3,8,4,
        0,411,410,1,0,0,0,411,412,1,0,0,0,412,413,1,0,0,0,413,414,3,108,
        54,0,414,415,5,58,0,0,415,416,3,64,32,0,416,57,1,0,0,0,417,418,7,
        0,0,0,418,59,1,0,0,0,419,432,3,54,27,0,420,432,3,56,28,0,421,432,
        3,44,22,0,422,432,3,76,38,0,423,432,3,74,37,0,424,432,3,112,56,0,
        425,432,3,40,20,0,426,432,3,0,0,0,427,432,3,2,1,0,428,432,3,96,48,
        0,429,432,3,98,49,0,430,432,3,64,32,0,431,419,1,0,0,0,431,420,1,
        0,0,0,431,421,1,0,0,0,431,422,1,0,0,0,431,423,1,0,0,0,431,424,1,
        0,0,0,431,425,1,0,0,0,431,426,1,0,0,0,431,427,1,0,0,0,431,428,1,
        0,0,0,431,429,1,0,0,0,431,430,1,0,0,0,432,61,1,0,0,0,433,442,3,54,
        27,0,434,442,3,56,28,0,435,442,3,64,32,0,436,442,3,110,55,0,437,
        442,3,74,37,0,438,442,3,0,0,0,439,442,3,96,48,0,440,442,3,98,49,
        0,441,433,1,0,0,0,441,434,1,0,0,0,441,435,1,0,0,0,441,436,1,0,0,
        0,441,437,1,0,0,0,441,438,1,0,0,0,441,439,1,0,0,0,441,440,1,0,0,
        0,442,63,1,0,0,0,443,449,3,116,58,0,444,449,3,76,38,0,445,449,3,
        112,56,0,446,449,3,40,20,0,447,449,3,2,1,0,448,443,1,0,0,0,448,444,
        1,0,0,0,448,445,1,0,0,0,448,446,1,0,0,0,448,447,1,0,0,0,449,65,1,
        0,0,0,450,451,7,1,0,0,451,67,1,0,0,0,452,453,7,2,0,0,453,69,1,0,
        0,0,454,457,7,3,0,0,455,456,5,63,0,0,456,458,5,64,0,0,457,455,1,
        0,0,0,457,458,1,0,0,0,458,71,1,0,0,0,459,460,7,4,0,0,460,73,1,0,
        0,0,461,464,3,48,24,0,462,465,5,32,0,0,463,465,3,72,36,0,464,462,
        1,0,0,0,464,463,1,0,0,0,465,466,1,0,0,0,466,467,3,64,32,0,467,75,
        1,0,0,0,468,469,5,34,0,0,469,470,3,116,58,0,470,482,3,114,57,0,471,
        473,5,3,0,0,472,471,1,0,0,0,473,476,1,0,0,0,474,472,1,0,0,0,474,
        475,1,0,0,0,475,477,1,0,0,0,476,474,1,0,0,0,477,480,5,35,0,0,478,
        481,3,76,38,0,479,481,3,114,57,0,480,478,1,0,0,0,480,479,1,0,0,0,
        481,483,1,0,0,0,482,474,1,0,0,0,482,483,1,0,0,0,483,77,1,0,0,0,484,
        487,3,64,32,0,485,487,3,110,55,0,486,484,1,0,0,0,486,485,1,0,0,0,
        487,79,1,0,0,0,488,493,3,78,39,0,489,490,5,60,0,0,490,492,3,78,39,
        0,491,489,1,0,0,0,492,495,1,0,0,0,493,491,1,0,0,0,493,494,1,0,0,
        0,494,81,1,0,0,0,495,493,1,0,0,0,496,499,3,50,25,0,497,499,5,3,0,
        0,498,496,1,0,0,0,498,497,1,0,0,0,499,502,1,0,0,0,500,498,1,0,0,
        0,500,501,1,0,0,0,501,503,1,0,0,0,502,500,1,0,0,0,503,504,5,0,0,
        1,504,83,1,0,0,0,505,510,3,60,30,0,506,507,5,60,0,0,507,509,3,60,
        30,0,508,506,1,0,0,0,509,512,1,0,0,0,510,508,1,0,0,0,510,511,1,0,
        0,0,511,85,1,0,0,0,512,510,1,0,0,0,513,516,3,88,44,0,514,516,3,90,
        45,0,515,513,1,0,0,0,515,514,1,0,0,0,516,87,1,0,0,0,517,518,3,48,
        24,0,518,519,3,52,26,0,519,520,5,59,0,0,520,521,3,92,46,0,521,89,
        1,0,0,0,522,523,3,48,24,0,523,524,3,52,26,0,524,525,5,59,0,0,525,
        526,3,100,50,0,526,91,1,0,0,0,527,528,3,94,47,0,528,93,1,0,0,0,529,
        534,3,62,31,0,530,531,5,60,0,0,531,533,3,62,31,0,532,530,1,0,0,0,
        533,536,1,0,0,0,534,532,1,0,0,0,534,535,1,0,0,0,535,95,1,0,0,0,536,
        534,1,0,0,0,537,538,5,39,0,0,538,97,1,0,0,0,539,540,5,40,0,0,540,
        99,1,0,0,0,541,542,3,102,51,0,542,101,1,0,0,0,543,544,5,1,0,0,544,
        545,3,104,52,0,545,546,5,2,0,0,546,103,1,0,0,0,547,550,3,106,53,
        0,548,550,5,3,0,0,549,547,1,0,0,0,549,548,1,0,0,0,550,551,1,0,0,
        0,551,549,1,0,0,0,551,552,1,0,0,0,552,105,1,0,0,0,553,558,3,62,31,
        0,554,555,5,60,0,0,555,557,3,62,31,0,556,554,1,0,0,0,557,560,1,0,
        0,0,558,556,1,0,0,0,558,559,1,0,0,0,559,107,1,0,0,0,560,558,1,0,
        0,0,561,562,5,63,0,0,562,567,3,48,24,0,563,564,5,60,0,0,564,566,
        3,48,24,0,565,563,1,0,0,0,566,569,1,0,0,0,567,565,1,0,0,0,567,568,
        1,0,0,0,568,570,1,0,0,0,569,567,1,0,0,0,570,571,5,64,0,0,571,109,
        1,0,0,0,572,573,5,63,0,0,573,578,3,64,32,0,574,575,5,60,0,0,575,
        577,3,64,32,0,576,574,1,0,0,0,577,580,1,0,0,0,578,576,1,0,0,0,578,
        579,1,0,0,0,579,581,1,0,0,0,580,578,1,0,0,0,581,582,5,64,0,0,582,
        111,1,0,0,0,583,584,5,36,0,0,584,585,3,54,27,0,585,586,5,37,0,0,
        586,589,3,116,58,0,587,588,5,38,0,0,588,590,3,116,58,0,589,587,1,
        0,0,0,589,590,1,0,0,0,590,591,1,0,0,0,591,592,3,114,57,0,592,113,
        1,0,0,0,593,594,3,100,50,0,594,115,1,0,0,0,595,601,3,118,59,0,596,
        597,5,45,0,0,597,598,3,116,58,0,598,599,5,46,0,0,599,600,3,116,58,
        0,600,602,1,0,0,0,601,596,1,0,0,0,601,602,1,0,0,0,602,117,1,0,0,
        0,603,608,3,120,60,0,604,605,5,41,0,0,605,607,3,120,60,0,606,604,
        1,0,0,0,607,610,1,0,0,0,608,606,1,0,0,0,608,609,1,0,0,0,609,119,
        1,0,0,0,610,608,1,0,0,0,611,616,3,122,61,0,612,613,5,42,0,0,613,
        615,3,122,61,0,614,612,1,0,0,0,615,618,1,0,0,0,616,614,1,0,0,0,616,
        617,1,0,0,0,617,121,1,0,0,0,618,616,1,0,0,0,619,624,3,124,62,0,620,
        621,7,5,0,0,621,623,3,124,62,0,622,620,1,0,0,0,623,626,1,0,0,0,624,
        622,1,0,0,0,624,625,1,0,0,0,625,123,1,0,0,0,626,624,1,0,0,0,627,
        632,3,126,63,0,628,629,7,6,0,0,629,631,3,126,63,0,630,628,1,0,0,
        0,631,634,1,0,0,0,632,630,1,0,0,0,632,633,1,0,0,0,633,125,1,0,0,
        0,634,632,1,0,0,0,635,640,3,128,64,0,636,637,7,7,0,0,637,639,3,128,
        64,0,638,636,1,0,0,0,639,642,1,0,0,0,640,638,1,0,0,0,640,641,1,0,
        0,0,641,127,1,0,0,0,642,640,1,0,0,0,643,648,3,130,65,0,644,645,7,
        8,0,0,645,647,3,130,65,0,646,644,1,0,0,0,647,650,1,0,0,0,648,646,
        1,0,0,0,648,649,1,0,0,0,649,129,1,0,0,0,650,648,1,0,0,0,651,659,
        3,132,66,0,652,653,5,43,0,0,653,659,3,132,66,0,654,655,5,53,0,0,
        655,659,3,132,66,0,656,657,5,54,0,0,657,659,3,132,66,0,658,651,1,
        0,0,0,658,652,1,0,0,0,658,654,1,0,0,0,658,656,1,0,0,0,659,131,1,
        0,0,0,660,665,3,46,23,0,661,662,5,63,0,0,662,663,3,64,32,0,663,664,
        5,64,0,0,664,666,1,0,0,0,665,661,1,0,0,0,665,666,1,0,0,0,666,133,
        1,0,0,0,667,674,3,136,68,0,668,671,3,80,40,0,669,670,5,60,0,0,670,
        672,3,136,68,0,671,669,1,0,0,0,671,672,1,0,0,0,672,674,1,0,0,0,673,
        667,1,0,0,0,673,668,1,0,0,0,674,135,1,0,0,0,675,680,3,138,69,0,676,
        677,5,60,0,0,677,679,3,138,69,0,678,676,1,0,0,0,679,682,1,0,0,0,
        680,678,1,0,0,0,680,681,1,0,0,0,681,137,1,0,0,0,682,680,1,0,0,0,
        683,684,3,48,24,0,684,687,5,58,0,0,685,688,3,64,32,0,686,688,3,110,
        55,0,687,685,1,0,0,0,687,686,1,0,0,0,688,139,1,0,0,0,689,692,3,142,
        71,0,690,692,3,144,72,0,691,689,1,0,0,0,691,690,1,0,0,0,692,141,
        1,0,0,0,693,694,7,9,0,0,694,143,1,0,0,0,695,696,7,10,0,0,696,145,
        1,0,0,0,85,152,159,161,166,171,175,178,182,191,193,198,201,204,209,
        221,223,230,237,243,250,254,262,268,270,273,276,281,289,296,301,
        310,314,317,321,325,331,340,349,352,362,366,376,384,387,392,395,
        398,405,408,411,431,441,448,457,464,474,480,482,486,493,498,500,
        510,515,534,549,551,558,567,578,589,601,608,616,624,632,640,648,
        658,665,671,673,680,687,691
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
    public LSQBR(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.LSQBR, 0);
    }
    public RSQBR(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.RSQBR, 0);
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
    public id(): IdContext {
        return this.getRuleContext(0, IdContext)!;
    }
    public VARIP(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.VARIP, 0);
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


export class Enum_def_stmtContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public ENUM(): antlr.TerminalNode {
        return this.getToken(PineV5Parser.ENUM, 0)!;
    }
    public id(): IdContext {
        return this.getRuleContext(0, IdContext)!;
    }
    public enum_body(): Enum_bodyContext {
        return this.getRuleContext(0, Enum_bodyContext)!;
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_enum_def_stmt;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitEnum_def_stmt) {
            return visitor.visitEnum_def_stmt(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Enum_bodyContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public BEGIN(): antlr.TerminalNode {
        return this.getToken(PineV5Parser.BEGIN, 0)!;
    }
    public END(): antlr.TerminalNode {
        return this.getToken(PineV5Parser.END, 0)!;
    }
    public enum_field(): Enum_fieldContext[];
    public enum_field(i: number): Enum_fieldContext | null;
    public enum_field(i?: number): Enum_fieldContext[] | Enum_fieldContext | null {
        if (i === undefined) {
            return this.getRuleContexts(Enum_fieldContext);
        }

        return this.getRuleContext(i, Enum_fieldContext);
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
        return PineV5Parser.RULE_enum_body;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitEnum_body) {
            return visitor.visitEnum_body(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Enum_fieldContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public id(): IdContext {
        return this.getRuleContext(0, IdContext)!;
    }
    public DEFINE(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.DEFINE, 0);
    }
    public arith_expr(): Arith_exprContext | null {
        return this.getRuleContext(0, Arith_exprContext);
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_enum_field;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitEnum_field) {
            return visitor.visitEnum_field(this);
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
    public enum_def_stmt(): Enum_def_stmtContext | null {
        return this.getRuleContext(0, Enum_def_stmtContext);
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
    public import_user(): Import_userContext {
        return this.getRuleContext(0, Import_userContext)!;
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
    public id(): IdContext[];
    public id(i: number): IdContext | null;
    public id(i?: number): IdContext[] | IdContext | null {
        if (i === undefined) {
            return this.getRuleContexts(IdContext);
        }

        return this.getRuleContext(i, IdContext);
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


export class Import_userContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public user_part(): User_partContext[];
    public user_part(i: number): User_partContext | null;
    public user_part(i?: number): User_partContext[] | User_partContext | null {
        if (i === undefined) {
            return this.getRuleContexts(User_partContext);
        }

        return this.getRuleContext(i, User_partContext);
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
        return PineV5Parser.RULE_import_user;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitImport_user) {
            return visitor.visitImport_user(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class User_partContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public id(): IdContext | null {
        return this.getRuleContext(0, IdContext);
    }
    public INT_LITERAL(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.INT_LITERAL, 0);
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_user_part;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitUser_part) {
            return visitor.visitUser_part(this);
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


export class For_in_exprContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public FOR_STMT(): antlr.TerminalNode {
        return this.getToken(PineV5Parser.FOR_STMT, 0)!;
    }
    public IN(): antlr.TerminalNode {
        return this.getToken(PineV5Parser.IN, 0)!;
    }
    public ternary_expr(): Ternary_exprContext {
        return this.getRuleContext(0, Ternary_exprContext)!;
    }
    public stmts_block(): Stmts_blockContext {
        return this.getRuleContext(0, Stmts_blockContext)!;
    }
    public ids_array(): Ids_arrayContext | null {
        return this.getRuleContext(0, Ids_arrayContext);
    }
    public id(): IdContext | null {
        return this.getRuleContext(0, IdContext);
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_for_in_expr;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitFor_in_expr) {
            return visitor.visitFor_in_expr(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Call_suffixContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public DOT(): antlr.TerminalNode {
        return this.getToken(PineV5Parser.DOT, 0)!;
    }
    public id(): IdContext {
        return this.getRuleContext(0, IdContext)!;
    }
    public LPAR(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.LPAR, 0);
    }
    public RPAR(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.RPAR, 0);
    }
    public type_args(): Type_argsContext | null {
        return this.getRuleContext(0, Type_argsContext);
    }
    public fun_actual_args(): Fun_actual_argsContext | null {
        return this.getRuleContext(0, Fun_actual_argsContext);
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_call_suffix;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitCall_suffix) {
            return visitor.visitCall_suffix(this);
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
    public call_suffix(): Call_suffixContext[];
    public call_suffix(i: number): Call_suffixContext | null;
    public call_suffix(i?: number): Call_suffixContext[] | Call_suffixContext | null {
        if (i === undefined) {
            return this.getRuleContexts(Call_suffixContext);
        }

        return this.getRuleContext(i, Call_suffixContext);
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
    public call_suffix(): Call_suffixContext[];
    public call_suffix(i: number): Call_suffixContext | null;
    public call_suffix(i?: number): Call_suffixContext[] | Call_suffixContext | null {
        if (i === undefined) {
            return this.getRuleContexts(Call_suffixContext);
        }

        return this.getRuleContext(i, Call_suffixContext);
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
    public TYPE(): antlr.TerminalNode[];
    public TYPE(i: number): antlr.TerminalNode | null;
    public TYPE(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV5Parser.TYPE);
    	} else {
    		return this.getToken(PineV5Parser.TYPE, i);
    	}
    }
    public METHOD(): antlr.TerminalNode[];
    public METHOD(i: number): antlr.TerminalNode | null;
    public METHOD(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV5Parser.METHOD);
    	} else {
    		return this.getToken(PineV5Parser.METHOD, i);
    	}
    }
    public IMPORT(): antlr.TerminalNode[];
    public IMPORT(i: number): antlr.TerminalNode | null;
    public IMPORT(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV5Parser.IMPORT);
    	} else {
    		return this.getToken(PineV5Parser.IMPORT, i);
    	}
    }
    public EXPORT(): antlr.TerminalNode[];
    public EXPORT(i: number): antlr.TerminalNode | null;
    public EXPORT(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV5Parser.EXPORT);
    	} else {
    		return this.getToken(PineV5Parser.EXPORT, i);
    	}
    }
    public ENUM(): antlr.TerminalNode[];
    public ENUM(i: number): antlr.TerminalNode | null;
    public ENUM(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV5Parser.ENUM);
    	} else {
    		return this.getToken(PineV5Parser.ENUM, i);
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
    public enum_def_stmt(): Enum_def_stmtContext | null {
        return this.getRuleContext(0, Enum_def_stmtContext);
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
    public TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.TYPE, 0);
    }
    public METHOD(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.METHOD, 0);
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
    public for_in_expr(): For_in_exprContext | null {
        return this.getRuleContext(0, For_in_exprContext);
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
    public for_in_expr(): For_in_exprContext | null {
        return this.getRuleContext(0, For_in_exprContext);
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
    public LSQBR(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.LSQBR, 0);
    }
    public RSQBR(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.RSQBR, 0);
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


export class Compound_assign_opContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public PLUS_ASSIGN(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.PLUS_ASSIGN, 0);
    }
    public MINUS_ASSIGN(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.MINUS_ASSIGN, 0);
    }
    public MUL_ASSIGN(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.MUL_ASSIGN, 0);
    }
    public DIV_ASSIGN(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.DIV_ASSIGN, 0);
    }
    public MOD_ASSIGN(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.MOD_ASSIGN, 0);
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_compound_assign_op;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitCompound_assign_op) {
            return visitor.visitCompound_assign_op(this);
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
    public arith_expr(): Arith_exprContext {
        return this.getRuleContext(0, Arith_exprContext)!;
    }
    public ASSIGN(): antlr.TerminalNode | null {
        return this.getToken(PineV5Parser.ASSIGN, 0);
    }
    public compound_assign_op(): Compound_assign_opContext | null {
        return this.getRuleContext(0, Compound_assign_opContext);
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
    public if_expr(): If_exprContext | null {
        return this.getRuleContext(0, If_exprContext);
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


export class Pos_argContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public arith_expr(): Arith_exprContext | null {
        return this.getRuleContext(0, Arith_exprContext);
    }
    public arith_exprs(): Arith_exprsContext | null {
        return this.getRuleContext(0, Arith_exprsContext);
    }
    public override get ruleIndex(): number {
        return PineV5Parser.RULE_pos_arg;
    }
    public override accept<Result>(visitor: PineV5ParserVisitor<Result>): Result | null {
        if (visitor.visitPos_arg) {
            return visitor.visitPos_arg(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class Pos_argsContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public pos_arg(): Pos_argContext[];
    public pos_arg(i: number): Pos_argContext | null;
    public pos_arg(i?: number): Pos_argContext[] | Pos_argContext | null {
        if (i === undefined) {
            return this.getRuleContexts(Pos_argContext);
        }

        return this.getRuleContext(i, Pos_argContext);
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
