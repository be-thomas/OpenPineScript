
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
    public static readonly RULE_fun_param = 15;
    public static readonly RULE_type_args = 16;
    public static readonly RULE_type_arg = 17;
    public static readonly RULE_for_in_expr = 18;
    public static readonly RULE_call_suffix = 19;
    public static readonly RULE_fun_call = 20;
    public static readonly RULE_id = 21;
    public static readonly RULE_stmt = 22;
    public static readonly RULE_fun_head = 23;
    public static readonly RULE_var_def = 24;
    public static readonly RULE_var_defs = 25;
    public static readonly RULE_id_part = 26;
    public static readonly RULE_global_stmt_content = 27;
    public static readonly RULE_local_stmt_content = 28;
    public static readonly RULE_arith_expr = 29;
    public static readonly RULE_decl_mod = 30;
    public static readonly RULE_type_qual = 31;
    public static readonly RULE_type_name = 32;
    public static readonly RULE_compound_assign_op = 33;
    public static readonly RULE_var_assign = 34;
    public static readonly RULE_if_expr = 35;
    public static readonly RULE_pos_arg = 36;
    public static readonly RULE_pos_args = 37;
    public static readonly RULE_pine_script = 38;
    public static readonly RULE_global_stmt = 39;
    public static readonly RULE_fun_def_stmt = 40;
    public static readonly RULE_fun_def_singleline = 41;
    public static readonly RULE_fun_def_multiline = 42;
    public static readonly RULE_fun_body_singleline = 43;
    public static readonly RULE_local_stmt_singleline = 44;
    public static readonly RULE_loop_break = 45;
    public static readonly RULE_loop_continue = 46;
    public static readonly RULE_fun_body_multiline = 47;
    public static readonly RULE_local_stmts_multiline = 48;
    public static readonly RULE_local_stmts_list = 49;
    public static readonly RULE_local_stmt_multiline = 50;
    public static readonly RULE_ids_array = 51;
    public static readonly RULE_arith_exprs = 52;
    public static readonly RULE_for_expr = 53;
    public static readonly RULE_stmts_block = 54;
    public static readonly RULE_ternary_expr = 55;
    public static readonly RULE_or_expr = 56;
    public static readonly RULE_and_expr = 57;
    public static readonly RULE_eq_expr = 58;
    public static readonly RULE_cmp_expr = 59;
    public static readonly RULE_add_expr = 60;
    public static readonly RULE_mult_expr = 61;
    public static readonly RULE_unary_expr = 62;
    public static readonly RULE_sqbr_expr = 63;
    public static readonly RULE_atom = 64;
    public static readonly RULE_fun_actual_args = 65;
    public static readonly RULE_kw_args = 66;
    public static readonly RULE_kw_arg = 67;
    public static readonly RULE_literal = 68;
    public static readonly RULE_num_literal = 69;
    public static readonly RULE_other_literal = 70;

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
        "fun_param", "type_args", "type_arg", "for_in_expr", "call_suffix", 
        "fun_call", "id", "stmt", "fun_head", "var_def", "var_defs", "id_part", 
        "global_stmt_content", "local_stmt_content", "arith_expr", "decl_mod", 
        "type_qual", "type_name", "compound_assign_op", "var_assign", "if_expr", 
        "pos_arg", "pos_args", "pine_script", "global_stmt", "fun_def_stmt", 
        "fun_def_singleline", "fun_def_multiline", "fun_body_singleline", 
        "local_stmt_singleline", "loop_break", "loop_continue", "fun_body_multiline", 
        "local_stmts_multiline", "local_stmts_list", "local_stmt_multiline", 
        "ids_array", "arith_exprs", "for_expr", "stmts_block", "ternary_expr", 
        "or_expr", "and_expr", "eq_expr", "cmp_expr", "add_expr", "mult_expr", 
        "unary_expr", "sqbr_expr", "atom", "fun_actual_args", "kw_args", 
        "kw_arg", "literal", "num_literal", "other_literal",
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
            this.state = 142;
            this.match(PineV5Parser.WHILE);
            this.state = 143;
            this.ternary_expr();
            this.state = 144;
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
            this.state = 146;
            this.match(PineV5Parser.SWITCH);
            this.state = 148;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 134187008) !== 0) || ((((_la - 43)) & ~0x1F) === 0 && ((1 << (_la - 43)) & 130288643) !== 0)) {
                {
                this.state = 147;
                this.ternary_expr();
                }
            }

            this.state = 150;
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
            this.state = 152;
            this.match(PineV5Parser.BEGIN);
            this.state = 155;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                this.state = 155;
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
                    this.state = 153;
                    this.switch_case();
                    }
                    break;
                case PineV5Parser.LEND:
                    {
                    this.state = 154;
                    this.match(PineV5Parser.LEND);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                this.state = 157;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 134187016) !== 0) || ((((_la - 43)) & ~0x1F) === 0 && ((1 << (_la - 43)) & 130354179) !== 0));
            this.state = 159;
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
            this.state = 162;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 134187008) !== 0) || ((((_la - 43)) & ~0x1F) === 0 && ((1 << (_la - 43)) & 130288643) !== 0)) {
                {
                this.state = 161;
                this.ternary_expr();
                }
            }

            this.state = 164;
            this.match(PineV5Parser.ARROW);
            this.state = 167;
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
                this.state = 165;
                this.local_stmt_singleline();
                }
                break;
            case PineV5Parser.BEGIN:
                {
                this.state = 166;
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
            this.state = 171;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 5, this.context) ) {
            case 1:
                {
                this.state = 169;
                this.type_name();
                }
                break;
            case 2:
                {
                this.state = 170;
                this.id();
                }
                break;
            }
            this.state = 174;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 51) {
                {
                this.state = 173;
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
            this.state = 176;
            this.match(PineV5Parser.TYPE);
            this.state = 177;
            this.id();
            this.state = 178;
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
            this.state = 180;
            this.match(PineV5Parser.BEGIN);
            this.state = 183;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                this.state = 183;
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
                    this.state = 181;
                    this.type_field();
                    }
                    break;
                case PineV5Parser.LEND:
                    {
                    this.state = 182;
                    this.match(PineV5Parser.LEND);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                this.state = 185;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 134187016) !== 0) || _la === 69);
            this.state = 187;
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
            this.state = 190;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 9, this.context) ) {
            case 1:
                {
                this.state = 189;
                this.type_qual();
                }
                break;
            }
            this.state = 192;
            this.field_type();
            this.state = 193;
            this.id();
            this.state = 196;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 58) {
                {
                this.state = 194;
                this.match(PineV5Parser.DEFINE);
                this.state = 195;
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
            this.state = 198;
            this.match(PineV5Parser.METHOD);
            this.state = 199;
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
            this.state = 201;
            this.match(PineV5Parser.ENUM);
            this.state = 202;
            this.id();
            this.state = 203;
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
            this.state = 205;
            this.match(PineV5Parser.BEGIN);
            this.state = 208;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                this.state = 208;
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
                    this.state = 206;
                    this.enum_field();
                    }
                    break;
                case PineV5Parser.LEND:
                    {
                    this.state = 207;
                    this.match(PineV5Parser.LEND);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                this.state = 210;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 134187016) !== 0) || _la === 69);
            this.state = 212;
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
            this.state = 214;
            this.id();
            this.state = 217;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 58) {
                {
                this.state = 215;
                this.match(PineV5Parser.DEFINE);
                this.state = 216;
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
            this.state = 219;
            this.match(PineV5Parser.EXPORT);
            this.state = 224;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV5Parser.TYPE:
                {
                this.state = 220;
                this.type_def_stmt();
                }
                break;
            case PineV5Parser.ENUM:
                {
                this.state = 221;
                this.enum_def_stmt();
                }
                break;
            case PineV5Parser.METHOD:
                {
                this.state = 222;
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
                this.state = 223;
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
        this.enterRule(localContext, 26, PineV5Parser.RULE_import_stmt);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 226;
            this.match(PineV5Parser.IMPORT);
            this.state = 227;
            this.import_path();
            this.state = 230;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 15, this.context) ) {
            case 1:
                {
                this.state = 228;
                this.match(PineV5Parser.AS);
                this.state = 229;
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
            this.state = 232;
            this.id();
            this.state = 241;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 56) {
                {
                {
                this.state = 233;
                this.match(PineV5Parser.DIV);
                this.state = 237;
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
                    this.state = 234;
                    this.id();
                    }
                    break;
                case PineV5Parser.INT_LITERAL:
                    {
                    this.state = 235;
                    this.match(PineV5Parser.INT_LITERAL);
                    }
                    break;
                case PineV5Parser.FLOAT_LITERAL:
                    {
                    this.state = 236;
                    this.match(PineV5Parser.FLOAT_LITERAL);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                }
                this.state = 243;
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
        this.enterRule(localContext, 30, PineV5Parser.RULE_fun_param);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 245;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 18, this.context) ) {
            case 1:
                {
                this.state = 244;
                this.type_qual();
                }
                break;
            }
            this.state = 248;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 19, this.context) ) {
            case 1:
                {
                this.state = 247;
                this.field_type();
                }
                break;
            }
            this.state = 250;
            this.id();
            this.state = 253;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 58) {
                {
                this.state = 251;
                this.match(PineV5Parser.DEFINE);
                this.state = 252;
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
        this.enterRule(localContext, 32, PineV5Parser.RULE_type_args);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 255;
            this.match(PineV5Parser.LT);
            this.state = 256;
            this.type_arg();
            this.state = 261;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 60) {
                {
                {
                this.state = 257;
                this.match(PineV5Parser.COMMA);
                this.state = 258;
                this.type_arg();
                }
                }
                this.state = 263;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 264;
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
        this.enterRule(localContext, 34, PineV5Parser.RULE_type_arg);
        try {
            this.state = 268;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 22, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 266;
                this.type_name();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 267;
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
        this.enterRule(localContext, 36, PineV5Parser.RULE_for_in_expr);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 270;
            this.match(PineV5Parser.FOR_STMT);
            this.state = 273;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV5Parser.LSQBR:
                {
                this.state = 271;
                this.ids_array();
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
                this.state = 272;
                this.id();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
            this.state = 275;
            this.match(PineV5Parser.IN);
            this.state = 276;
            this.ternary_expr();
            this.state = 277;
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
        this.enterRule(localContext, 38, PineV5Parser.RULE_call_suffix);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 279;
            this.match(PineV5Parser.DOT);
            this.state = 280;
            this.id();
            this.state = 282;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 51) {
                {
                this.state = 281;
                this.type_args();
                }
            }

            this.state = 284;
            this.match(PineV5Parser.LPAR);
            this.state = 286;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (((((_la - 5)) & ~0x1F) === 0 && ((1 << (_la - 5)) & 2688547905) !== 0) || ((((_la - 43)) & ~0x1F) === 0 && ((1 << (_la - 43)) & 131337219) !== 0)) {
                {
                this.state = 285;
                this.fun_actual_args();
                }
            }

            this.state = 288;
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
    public fun_call(): Fun_callContext {
        let localContext = new Fun_callContext(this.context, this.state);
        this.enterRule(localContext, 40, PineV5Parser.RULE_fun_call);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 290;
            this.id();
            this.state = 292;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 51) {
                {
                this.state = 291;
                this.type_args();
                }
            }

            this.state = 294;
            this.match(PineV5Parser.LPAR);
            this.state = 296;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (((((_la - 5)) & ~0x1F) === 0 && ((1 << (_la - 5)) & 2688547905) !== 0) || ((((_la - 43)) & ~0x1F) === 0 && ((1 << (_la - 43)) & 131337219) !== 0)) {
                {
                this.state = 295;
                this.fun_actual_args();
                }
            }

            this.state = 298;
            this.match(PineV5Parser.RPAR);
            this.state = 302;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 73) {
                {
                {
                this.state = 299;
                this.call_suffix();
                }
                }
                this.state = 304;
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
    public id(): IdContext {
        let localContext = new IdContext(this.context, this.state);
        this.enterRule(localContext, 42, PineV5Parser.RULE_id);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 305;
            this.id_part();
            this.state = 317;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 73) {
                {
                {
                this.state = 306;
                this.match(PineV5Parser.DOT);
                this.state = 313;
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
                    this.state = 307;
                    this.id_part();
                    }
                    break;
                case PineV5Parser.TYPE:
                    {
                    this.state = 308;
                    this.match(PineV5Parser.TYPE);
                    }
                    break;
                case PineV5Parser.METHOD:
                    {
                    this.state = 309;
                    this.match(PineV5Parser.METHOD);
                    }
                    break;
                case PineV5Parser.IMPORT:
                    {
                    this.state = 310;
                    this.match(PineV5Parser.IMPORT);
                    }
                    break;
                case PineV5Parser.EXPORT:
                    {
                    this.state = 311;
                    this.match(PineV5Parser.EXPORT);
                    }
                    break;
                case PineV5Parser.ENUM:
                    {
                    this.state = 312;
                    this.match(PineV5Parser.ENUM);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                }
                this.state = 319;
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
    public stmt(): StmtContext {
        let localContext = new StmtContext(this.context, this.state);
        this.enterRule(localContext, 44, PineV5Parser.RULE_stmt);
        try {
            this.state = 327;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 31, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 320;
                this.import_stmt();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 321;
                this.export_stmt();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 322;
                this.type_def_stmt();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 323;
                this.enum_def_stmt();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 324;
                this.method_def_stmt();
                }
                break;
            case 6:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 325;
                this.fun_def_stmt();
                }
                break;
            case 7:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 326;
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
        this.enterRule(localContext, 46, PineV5Parser.RULE_fun_head);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 329;
            this.match(PineV5Parser.LPAR);
            this.state = 338;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 134187008) !== 0) || _la === 69) {
                {
                this.state = 330;
                this.fun_param();
                this.state = 335;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 60) {
                    {
                    {
                    this.state = 331;
                    this.match(PineV5Parser.COMMA);
                    this.state = 332;
                    this.fun_param();
                    }
                    }
                    this.state = 337;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                }
            }

            this.state = 340;
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
        this.enterRule(localContext, 48, PineV5Parser.RULE_var_def);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 343;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 13 || _la === 14) {
                {
                this.state = 342;
                this.decl_mod();
                }
            }

            this.state = 346;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 35, this.context) ) {
            case 1:
                {
                this.state = 345;
                this.type_qual();
                }
                break;
            }
            this.state = 349;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 36, this.context) ) {
            case 1:
                {
                this.state = 348;
                this.field_type();
                }
                break;
            }
            this.state = 351;
            this.id();
            this.state = 352;
            this.match(PineV5Parser.DEFINE);
            this.state = 353;
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
        this.enterRule(localContext, 50, PineV5Parser.RULE_var_defs);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 356;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 13 || _la === 14) {
                {
                this.state = 355;
                this.decl_mod();
                }
            }

            this.state = 359;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 38, this.context) ) {
            case 1:
                {
                this.state = 358;
                this.type_qual();
                }
                break;
            }
            this.state = 362;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 134187008) !== 0) || _la === 69) {
                {
                this.state = 361;
                this.field_type();
                }
            }

            this.state = 364;
            this.ids_array();
            this.state = 365;
            this.match(PineV5Parser.DEFINE);
            this.state = 366;
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
        this.enterRule(localContext, 52, PineV5Parser.RULE_id_part);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 368;
            _la = this.tokenStream.LA(1);
            if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 134187008) !== 0) || _la === 69)) {
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
        this.enterRule(localContext, 54, PineV5Parser.RULE_global_stmt_content);
        try {
            this.state = 382;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 40, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 370;
                this.var_def();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 371;
                this.var_defs();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 372;
                this.fun_call();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 373;
                this.if_expr();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 374;
                this.var_assign();
                }
                break;
            case 6:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 375;
                this.for_expr();
                }
                break;
            case 7:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 376;
                this.for_in_expr();
                }
                break;
            case 8:
                this.enterOuterAlt(localContext, 8);
                {
                this.state = 377;
                this.while_expr();
                }
                break;
            case 9:
                this.enterOuterAlt(localContext, 9);
                {
                this.state = 378;
                this.switch_expr();
                }
                break;
            case 10:
                this.enterOuterAlt(localContext, 10);
                {
                this.state = 379;
                this.loop_break();
                }
                break;
            case 11:
                this.enterOuterAlt(localContext, 11);
                {
                this.state = 380;
                this.loop_continue();
                }
                break;
            case 12:
                this.enterOuterAlt(localContext, 12);
                {
                this.state = 381;
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
        this.enterRule(localContext, 56, PineV5Parser.RULE_local_stmt_content);
        try {
            this.state = 392;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 41, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 384;
                this.var_def();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 385;
                this.var_defs();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 386;
                this.arith_expr();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 387;
                this.arith_exprs();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 388;
                this.var_assign();
                }
                break;
            case 6:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 389;
                this.while_expr();
                }
                break;
            case 7:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 390;
                this.loop_break();
                }
                break;
            case 8:
                this.enterOuterAlt(localContext, 8);
                {
                this.state = 391;
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
        this.enterRule(localContext, 58, PineV5Parser.RULE_arith_expr);
        try {
            this.state = 399;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 42, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 394;
                this.ternary_expr();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 395;
                this.if_expr();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 396;
                this.for_expr();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 397;
                this.for_in_expr();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 398;
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
        this.enterRule(localContext, 60, PineV5Parser.RULE_decl_mod);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 401;
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
        this.enterRule(localContext, 62, PineV5Parser.RULE_type_qual);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 403;
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
        this.enterRule(localContext, 64, PineV5Parser.RULE_type_name);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 405;
            _la = this.tokenStream.LA(1);
            if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 133955584) !== 0))) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            this.state = 408;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 43, this.context) ) {
            case 1:
                {
                this.state = 406;
                this.match(PineV5Parser.LSQBR);
                this.state = 407;
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
        this.enterRule(localContext, 66, PineV5Parser.RULE_compound_assign_op);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 410;
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
        this.enterRule(localContext, 68, PineV5Parser.RULE_var_assign);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 412;
            this.id();
            this.state = 415;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV5Parser.ASSIGN:
                {
                this.state = 413;
                this.match(PineV5Parser.ASSIGN);
                }
                break;
            case PineV5Parser.PLUS_ASSIGN:
            case PineV5Parser.MINUS_ASSIGN:
            case PineV5Parser.MUL_ASSIGN:
            case PineV5Parser.DIV_ASSIGN:
            case PineV5Parser.MOD_ASSIGN:
                {
                this.state = 414;
                this.compound_assign_op();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
            this.state = 417;
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
        this.enterRule(localContext, 70, PineV5Parser.RULE_if_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 419;
            this.match(PineV5Parser.IF_COND);
            this.state = 420;
            this.ternary_expr();
            this.state = 421;
            this.stmts_block();
            this.state = 433;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 47, this.context) ) {
            case 1:
                {
                this.state = 425;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 3) {
                    {
                    {
                    this.state = 422;
                    this.match(PineV5Parser.LEND);
                    }
                    }
                    this.state = 427;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                this.state = 428;
                this.match(PineV5Parser.IF_COND_ELSE);
                this.state = 431;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case PineV5Parser.IF_COND:
                    {
                    this.state = 429;
                    this.if_expr();
                    }
                    break;
                case PineV5Parser.BEGIN:
                    {
                    this.state = 430;
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
        this.enterRule(localContext, 72, PineV5Parser.RULE_pos_arg);
        try {
            this.state = 437;
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
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 435;
                this.arith_expr();
                }
                break;
            case PineV5Parser.LSQBR:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 436;
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
        this.enterRule(localContext, 74, PineV5Parser.RULE_pos_args);
        try {
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 439;
            this.pos_arg();
            this.state = 444;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 49, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
                    {
                    {
                    this.state = 440;
                    this.match(PineV5Parser.COMMA);
                    this.state = 441;
                    this.pos_arg();
                    }
                    }
                }
                this.state = 446;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 49, this.context);
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
        this.enterRule(localContext, 76, PineV5Parser.RULE_pine_script);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 451;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 134213624) !== 0) || ((((_la - 34)) & ~0x1F) === 0 && ((1 << (_la - 34)) & 2820146789) !== 0) || ((((_la - 66)) & ~0x1F) === 0 && ((1 << (_la - 66)) & 15) !== 0)) {
                {
                this.state = 449;
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
                    this.state = 447;
                    this.stmt();
                    }
                    break;
                case PineV5Parser.LEND:
                    {
                    this.state = 448;
                    this.match(PineV5Parser.LEND);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                this.state = 453;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 454;
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
        this.enterRule(localContext, 78, PineV5Parser.RULE_global_stmt);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 456;
            this.global_stmt_content();
            this.state = 461;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 60) {
                {
                {
                this.state = 457;
                this.match(PineV5Parser.COMMA);
                this.state = 458;
                this.global_stmt_content();
                }
                }
                this.state = 463;
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
        this.enterRule(localContext, 80, PineV5Parser.RULE_fun_def_stmt);
        try {
            this.state = 466;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 53, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 464;
                this.fun_def_singleline();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 465;
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
        this.enterRule(localContext, 82, PineV5Parser.RULE_fun_def_singleline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 468;
            this.id();
            this.state = 469;
            this.fun_head();
            this.state = 470;
            this.match(PineV5Parser.ARROW);
            this.state = 471;
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
        this.enterRule(localContext, 84, PineV5Parser.RULE_fun_def_multiline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 473;
            this.id();
            this.state = 474;
            this.fun_head();
            this.state = 475;
            this.match(PineV5Parser.ARROW);
            this.state = 476;
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
        this.enterRule(localContext, 86, PineV5Parser.RULE_fun_body_singleline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 478;
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
        this.enterRule(localContext, 88, PineV5Parser.RULE_local_stmt_singleline);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 480;
            this.local_stmt_content();
            this.state = 485;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 60) {
                {
                {
                this.state = 481;
                this.match(PineV5Parser.COMMA);
                this.state = 482;
                this.local_stmt_content();
                }
                }
                this.state = 487;
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
        this.enterRule(localContext, 90, PineV5Parser.RULE_loop_break);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 488;
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
        this.enterRule(localContext, 92, PineV5Parser.RULE_loop_continue);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 490;
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
        this.enterRule(localContext, 94, PineV5Parser.RULE_fun_body_multiline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 492;
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
        this.enterRule(localContext, 96, PineV5Parser.RULE_local_stmts_multiline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 494;
            this.match(PineV5Parser.BEGIN);
            this.state = 495;
            this.local_stmts_list();
            this.state = 496;
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
        this.enterRule(localContext, 98, PineV5Parser.RULE_local_stmts_list);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 500;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                this.state = 500;
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
                    this.state = 498;
                    this.local_stmt_multiline();
                    }
                    break;
                case PineV5Parser.LEND:
                    {
                    this.state = 499;
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
            } while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 134211640) !== 0) || ((((_la - 34)) & ~0x1F) === 0 && ((1 << (_la - 34)) & 2820146789) !== 0) || ((((_la - 66)) & ~0x1F) === 0 && ((1 << (_la - 66)) & 15) !== 0));
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
        this.enterRule(localContext, 100, PineV5Parser.RULE_local_stmt_multiline);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 504;
            this.local_stmt_content();
            this.state = 509;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 60) {
                {
                {
                this.state = 505;
                this.match(PineV5Parser.COMMA);
                this.state = 506;
                this.local_stmt_content();
                }
                }
                this.state = 511;
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
        this.enterRule(localContext, 102, PineV5Parser.RULE_ids_array);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 512;
            this.match(PineV5Parser.LSQBR);
            this.state = 513;
            this.id();
            this.state = 518;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 60) {
                {
                {
                this.state = 514;
                this.match(PineV5Parser.COMMA);
                this.state = 515;
                this.id();
                }
                }
                this.state = 520;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 521;
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
        this.enterRule(localContext, 104, PineV5Parser.RULE_arith_exprs);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 523;
            this.match(PineV5Parser.LSQBR);
            this.state = 524;
            this.arith_expr();
            this.state = 529;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 60) {
                {
                {
                this.state = 525;
                this.match(PineV5Parser.COMMA);
                this.state = 526;
                this.arith_expr();
                }
                }
                this.state = 531;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 532;
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
        this.enterRule(localContext, 106, PineV5Parser.RULE_for_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 534;
            this.match(PineV5Parser.FOR_STMT);
            this.state = 535;
            this.var_def();
            this.state = 536;
            this.match(PineV5Parser.FOR_STMT_TO);
            this.state = 537;
            this.ternary_expr();
            this.state = 540;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 38) {
                {
                this.state = 538;
                this.match(PineV5Parser.FOR_STMT_BY);
                this.state = 539;
                this.ternary_expr();
                }
            }

            this.state = 542;
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
        this.enterRule(localContext, 108, PineV5Parser.RULE_stmts_block);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 544;
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
        this.enterRule(localContext, 110, PineV5Parser.RULE_ternary_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 546;
            this.or_expr();
            this.state = 552;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 45) {
                {
                this.state = 547;
                this.match(PineV5Parser.COND);
                this.state = 548;
                this.ternary_expr();
                this.state = 549;
                this.match(PineV5Parser.COND_ELSE);
                this.state = 550;
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
        this.enterRule(localContext, 112, PineV5Parser.RULE_or_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 554;
            this.and_expr();
            this.state = 559;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 41) {
                {
                {
                this.state = 555;
                this.match(PineV5Parser.OR);
                this.state = 556;
                this.and_expr();
                }
                }
                this.state = 561;
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
        this.enterRule(localContext, 114, PineV5Parser.RULE_and_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 562;
            this.eq_expr();
            this.state = 567;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 42) {
                {
                {
                this.state = 563;
                this.match(PineV5Parser.AND);
                this.state = 564;
                this.eq_expr();
                }
                }
                this.state = 569;
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
        this.enterRule(localContext, 116, PineV5Parser.RULE_eq_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 570;
            this.cmp_expr();
            this.state = 575;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 47 || _la === 48) {
                {
                {
                this.state = 571;
                _la = this.tokenStream.LA(1);
                if(!(_la === 47 || _la === 48)) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                this.state = 572;
                this.cmp_expr();
                }
                }
                this.state = 577;
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
        this.enterRule(localContext, 118, PineV5Parser.RULE_cmp_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 578;
            this.add_expr();
            this.state = 583;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (((((_la - 49)) & ~0x1F) === 0 && ((1 << (_la - 49)) & 15) !== 0)) {
                {
                {
                this.state = 579;
                _la = this.tokenStream.LA(1);
                if(!(((((_la - 49)) & ~0x1F) === 0 && ((1 << (_la - 49)) & 15) !== 0))) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                this.state = 580;
                this.add_expr();
                }
                }
                this.state = 585;
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
        this.enterRule(localContext, 120, PineV5Parser.RULE_add_expr);
        let _la: number;
        try {
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 586;
            this.mult_expr();
            this.state = 591;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 66, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
                    {
                    {
                    this.state = 587;
                    _la = this.tokenStream.LA(1);
                    if(!(_la === 53 || _la === 54)) {
                    this.errorHandler.recoverInline(this);
                    }
                    else {
                        this.errorHandler.reportMatch(this);
                        this.consume();
                    }
                    this.state = 588;
                    this.mult_expr();
                    }
                    }
                }
                this.state = 593;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 66, this.context);
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
        this.enterRule(localContext, 122, PineV5Parser.RULE_mult_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 594;
            this.unary_expr();
            this.state = 599;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (((((_la - 55)) & ~0x1F) === 0 && ((1 << (_la - 55)) & 7) !== 0)) {
                {
                {
                this.state = 595;
                _la = this.tokenStream.LA(1);
                if(!(((((_la - 55)) & ~0x1F) === 0 && ((1 << (_la - 55)) & 7) !== 0))) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                this.state = 596;
                this.unary_expr();
                }
                }
                this.state = 601;
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
        this.enterRule(localContext, 124, PineV5Parser.RULE_unary_expr);
        try {
            this.state = 609;
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
                this.state = 602;
                this.sqbr_expr();
                }
                break;
            case PineV5Parser.NOT:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 603;
                this.match(PineV5Parser.NOT);
                this.state = 604;
                this.sqbr_expr();
                }
                break;
            case PineV5Parser.PLUS:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 605;
                this.match(PineV5Parser.PLUS);
                this.state = 606;
                this.sqbr_expr();
                }
                break;
            case PineV5Parser.MINUS:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 607;
                this.match(PineV5Parser.MINUS);
                this.state = 608;
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
        this.enterRule(localContext, 126, PineV5Parser.RULE_sqbr_expr);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 611;
            this.atom();
            this.state = 616;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 69, this.context) ) {
            case 1:
                {
                this.state = 612;
                this.match(PineV5Parser.LSQBR);
                this.state = 613;
                this.arith_expr();
                this.state = 614;
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
        this.enterRule(localContext, 128, PineV5Parser.RULE_atom);
        try {
            this.state = 625;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 70, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 618;
                this.fun_call();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 619;
                this.id();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 620;
                this.literal();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 621;
                this.match(PineV5Parser.LPAR);
                this.state = 622;
                this.arith_expr();
                this.state = 623;
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
        this.enterRule(localContext, 130, PineV5Parser.RULE_fun_actual_args);
        let _la: number;
        try {
            this.state = 633;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 72, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 627;
                this.kw_args();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 628;
                this.pos_args();
                this.state = 631;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 60) {
                    {
                    this.state = 629;
                    this.match(PineV5Parser.COMMA);
                    this.state = 630;
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
        this.enterRule(localContext, 132, PineV5Parser.RULE_kw_args);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 635;
            this.kw_arg();
            this.state = 640;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 60) {
                {
                {
                this.state = 636;
                this.match(PineV5Parser.COMMA);
                this.state = 637;
                this.kw_arg();
                }
                }
                this.state = 642;
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
        this.enterRule(localContext, 134, PineV5Parser.RULE_kw_arg);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 643;
            this.id();
            this.state = 644;
            this.match(PineV5Parser.DEFINE);
            this.state = 647;
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
                this.state = 645;
                this.arith_expr();
                }
                break;
            case PineV5Parser.LSQBR:
                {
                this.state = 646;
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
        this.enterRule(localContext, 136, PineV5Parser.RULE_literal);
        try {
            this.state = 651;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV5Parser.INT_LITERAL:
            case PineV5Parser.FLOAT_LITERAL:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 649;
                this.num_literal();
                }
                break;
            case PineV5Parser.BOOL_LITERAL:
            case PineV5Parser.STR_LITERAL:
            case PineV5Parser.COLOR_LITERAL:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 650;
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
        this.enterRule(localContext, 138, PineV5Parser.RULE_num_literal);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 653;
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
        this.enterRule(localContext, 140, PineV5Parser.RULE_other_literal);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 655;
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
        4,1,73,658,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,2,6,7,
        6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,2,11,7,11,2,12,7,12,2,13,7,13,
        2,14,7,14,2,15,7,15,2,16,7,16,2,17,7,17,2,18,7,18,2,19,7,19,2,20,
        7,20,2,21,7,21,2,22,7,22,2,23,7,23,2,24,7,24,2,25,7,25,2,26,7,26,
        2,27,7,27,2,28,7,28,2,29,7,29,2,30,7,30,2,31,7,31,2,32,7,32,2,33,
        7,33,2,34,7,34,2,35,7,35,2,36,7,36,2,37,7,37,2,38,7,38,2,39,7,39,
        2,40,7,40,2,41,7,41,2,42,7,42,2,43,7,43,2,44,7,44,2,45,7,45,2,46,
        7,46,2,47,7,47,2,48,7,48,2,49,7,49,2,50,7,50,2,51,7,51,2,52,7,52,
        2,53,7,53,2,54,7,54,2,55,7,55,2,56,7,56,2,57,7,57,2,58,7,58,2,59,
        7,59,2,60,7,60,2,61,7,61,2,62,7,62,2,63,7,63,2,64,7,64,2,65,7,65,
        2,66,7,66,2,67,7,67,2,68,7,68,2,69,7,69,2,70,7,70,1,0,1,0,1,0,1,
        0,1,1,1,1,3,1,149,8,1,1,1,1,1,1,2,1,2,1,2,4,2,156,8,2,11,2,12,2,
        157,1,2,1,2,1,3,3,3,163,8,3,1,3,1,3,1,3,3,3,168,8,3,1,4,1,4,3,4,
        172,8,4,1,4,3,4,175,8,4,1,5,1,5,1,5,1,5,1,6,1,6,1,6,4,6,184,8,6,
        11,6,12,6,185,1,6,1,6,1,7,3,7,191,8,7,1,7,1,7,1,7,1,7,3,7,197,8,
        7,1,8,1,8,1,8,1,9,1,9,1,9,1,9,1,10,1,10,1,10,4,10,209,8,10,11,10,
        12,10,210,1,10,1,10,1,11,1,11,1,11,3,11,218,8,11,1,12,1,12,1,12,
        1,12,1,12,3,12,225,8,12,1,13,1,13,1,13,1,13,3,13,231,8,13,1,14,1,
        14,1,14,1,14,1,14,3,14,238,8,14,5,14,240,8,14,10,14,12,14,243,9,
        14,1,15,3,15,246,8,15,1,15,3,15,249,8,15,1,15,1,15,1,15,3,15,254,
        8,15,1,16,1,16,1,16,1,16,5,16,260,8,16,10,16,12,16,263,9,16,1,16,
        1,16,1,17,1,17,3,17,269,8,17,1,18,1,18,1,18,3,18,274,8,18,1,18,1,
        18,1,18,1,18,1,19,1,19,1,19,3,19,283,8,19,1,19,1,19,3,19,287,8,19,
        1,19,1,19,1,20,1,20,3,20,293,8,20,1,20,1,20,3,20,297,8,20,1,20,1,
        20,5,20,301,8,20,10,20,12,20,304,9,20,1,21,1,21,1,21,1,21,1,21,1,
        21,1,21,1,21,3,21,314,8,21,5,21,316,8,21,10,21,12,21,319,9,21,1,
        22,1,22,1,22,1,22,1,22,1,22,1,22,3,22,328,8,22,1,23,1,23,1,23,1,
        23,5,23,334,8,23,10,23,12,23,337,9,23,3,23,339,8,23,1,23,1,23,1,
        24,3,24,344,8,24,1,24,3,24,347,8,24,1,24,3,24,350,8,24,1,24,1,24,
        1,24,1,24,1,25,3,25,357,8,25,1,25,3,25,360,8,25,1,25,3,25,363,8,
        25,1,25,1,25,1,25,1,25,1,26,1,26,1,27,1,27,1,27,1,27,1,27,1,27,1,
        27,1,27,1,27,1,27,1,27,1,27,3,27,383,8,27,1,28,1,28,1,28,1,28,1,
        28,1,28,1,28,1,28,3,28,393,8,28,1,29,1,29,1,29,1,29,1,29,3,29,400,
        8,29,1,30,1,30,1,31,1,31,1,32,1,32,1,32,3,32,409,8,32,1,33,1,33,
        1,34,1,34,1,34,3,34,416,8,34,1,34,1,34,1,35,1,35,1,35,1,35,5,35,
        424,8,35,10,35,12,35,427,9,35,1,35,1,35,1,35,3,35,432,8,35,3,35,
        434,8,35,1,36,1,36,3,36,438,8,36,1,37,1,37,1,37,5,37,443,8,37,10,
        37,12,37,446,9,37,1,38,1,38,5,38,450,8,38,10,38,12,38,453,9,38,1,
        38,1,38,1,39,1,39,1,39,5,39,460,8,39,10,39,12,39,463,9,39,1,40,1,
        40,3,40,467,8,40,1,41,1,41,1,41,1,41,1,41,1,42,1,42,1,42,1,42,1,
        42,1,43,1,43,1,44,1,44,1,44,5,44,484,8,44,10,44,12,44,487,9,44,1,
        45,1,45,1,46,1,46,1,47,1,47,1,48,1,48,1,48,1,48,1,49,1,49,4,49,501,
        8,49,11,49,12,49,502,1,50,1,50,1,50,5,50,508,8,50,10,50,12,50,511,
        9,50,1,51,1,51,1,51,1,51,5,51,517,8,51,10,51,12,51,520,9,51,1,51,
        1,51,1,52,1,52,1,52,1,52,5,52,528,8,52,10,52,12,52,531,9,52,1,52,
        1,52,1,53,1,53,1,53,1,53,1,53,1,53,3,53,541,8,53,1,53,1,53,1,54,
        1,54,1,55,1,55,1,55,1,55,1,55,1,55,3,55,553,8,55,1,56,1,56,1,56,
        5,56,558,8,56,10,56,12,56,561,9,56,1,57,1,57,1,57,5,57,566,8,57,
        10,57,12,57,569,9,57,1,58,1,58,1,58,5,58,574,8,58,10,58,12,58,577,
        9,58,1,59,1,59,1,59,5,59,582,8,59,10,59,12,59,585,9,59,1,60,1,60,
        1,60,5,60,590,8,60,10,60,12,60,593,9,60,1,61,1,61,1,61,5,61,598,
        8,61,10,61,12,61,601,9,61,1,62,1,62,1,62,1,62,1,62,1,62,1,62,3,62,
        610,8,62,1,63,1,63,1,63,1,63,1,63,3,63,617,8,63,1,64,1,64,1,64,1,
        64,1,64,1,64,1,64,3,64,626,8,64,1,65,1,65,1,65,1,65,3,65,632,8,65,
        3,65,634,8,65,1,66,1,66,1,66,5,66,639,8,66,10,66,12,66,642,9,66,
        1,67,1,67,1,67,1,67,3,67,648,8,67,1,68,1,68,3,68,652,8,68,1,69,1,
        69,1,70,1,70,1,70,0,0,71,0,2,4,6,8,10,12,14,16,18,20,22,24,26,28,
        30,32,34,36,38,40,42,44,46,48,50,52,54,56,58,60,62,64,66,68,70,72,
        74,76,78,80,82,84,86,88,90,92,94,96,98,100,102,104,106,108,110,112,
        114,116,118,120,122,124,126,128,130,132,134,136,138,140,0,11,3,0,
        11,11,15,26,69,69,1,0,13,14,1,0,15,17,1,0,18,26,1,0,27,31,1,0,47,
        48,1,0,49,52,1,0,53,54,1,0,55,57,1,0,65,66,2,0,44,44,67,68,697,0,
        142,1,0,0,0,2,146,1,0,0,0,4,152,1,0,0,0,6,162,1,0,0,0,8,171,1,0,
        0,0,10,176,1,0,0,0,12,180,1,0,0,0,14,190,1,0,0,0,16,198,1,0,0,0,
        18,201,1,0,0,0,20,205,1,0,0,0,22,214,1,0,0,0,24,219,1,0,0,0,26,226,
        1,0,0,0,28,232,1,0,0,0,30,245,1,0,0,0,32,255,1,0,0,0,34,268,1,0,
        0,0,36,270,1,0,0,0,38,279,1,0,0,0,40,290,1,0,0,0,42,305,1,0,0,0,
        44,327,1,0,0,0,46,329,1,0,0,0,48,343,1,0,0,0,50,356,1,0,0,0,52,368,
        1,0,0,0,54,382,1,0,0,0,56,392,1,0,0,0,58,399,1,0,0,0,60,401,1,0,
        0,0,62,403,1,0,0,0,64,405,1,0,0,0,66,410,1,0,0,0,68,412,1,0,0,0,
        70,419,1,0,0,0,72,437,1,0,0,0,74,439,1,0,0,0,76,451,1,0,0,0,78,456,
        1,0,0,0,80,466,1,0,0,0,82,468,1,0,0,0,84,473,1,0,0,0,86,478,1,0,
        0,0,88,480,1,0,0,0,90,488,1,0,0,0,92,490,1,0,0,0,94,492,1,0,0,0,
        96,494,1,0,0,0,98,500,1,0,0,0,100,504,1,0,0,0,102,512,1,0,0,0,104,
        523,1,0,0,0,106,534,1,0,0,0,108,544,1,0,0,0,110,546,1,0,0,0,112,
        554,1,0,0,0,114,562,1,0,0,0,116,570,1,0,0,0,118,578,1,0,0,0,120,
        586,1,0,0,0,122,594,1,0,0,0,124,609,1,0,0,0,126,611,1,0,0,0,128,
        625,1,0,0,0,130,633,1,0,0,0,132,635,1,0,0,0,134,643,1,0,0,0,136,
        651,1,0,0,0,138,653,1,0,0,0,140,655,1,0,0,0,142,143,5,4,0,0,143,
        144,3,110,55,0,144,145,3,108,54,0,145,1,1,0,0,0,146,148,5,5,0,0,
        147,149,3,110,55,0,148,147,1,0,0,0,148,149,1,0,0,0,149,150,1,0,0,
        0,150,151,3,4,2,0,151,3,1,0,0,0,152,155,5,1,0,0,153,156,3,6,3,0,
        154,156,5,3,0,0,155,153,1,0,0,0,155,154,1,0,0,0,156,157,1,0,0,0,
        157,155,1,0,0,0,157,158,1,0,0,0,158,159,1,0,0,0,159,160,5,2,0,0,
        160,5,1,0,0,0,161,163,3,110,55,0,162,161,1,0,0,0,162,163,1,0,0,0,
        163,164,1,0,0,0,164,167,5,59,0,0,165,168,3,88,44,0,166,168,3,108,
        54,0,167,165,1,0,0,0,167,166,1,0,0,0,168,7,1,0,0,0,169,172,3,64,
        32,0,170,172,3,42,21,0,171,169,1,0,0,0,171,170,1,0,0,0,172,174,1,
        0,0,0,173,175,3,32,16,0,174,173,1,0,0,0,174,175,1,0,0,0,175,9,1,
        0,0,0,176,177,5,6,0,0,177,178,3,42,21,0,178,179,3,12,6,0,179,11,
        1,0,0,0,180,183,5,1,0,0,181,184,3,14,7,0,182,184,5,3,0,0,183,181,
        1,0,0,0,183,182,1,0,0,0,184,185,1,0,0,0,185,183,1,0,0,0,185,186,
        1,0,0,0,186,187,1,0,0,0,187,188,5,2,0,0,188,13,1,0,0,0,189,191,3,
        62,31,0,190,189,1,0,0,0,190,191,1,0,0,0,191,192,1,0,0,0,192,193,
        3,8,4,0,193,196,3,42,21,0,194,195,5,58,0,0,195,197,3,58,29,0,196,
        194,1,0,0,0,196,197,1,0,0,0,197,15,1,0,0,0,198,199,5,7,0,0,199,200,
        3,80,40,0,200,17,1,0,0,0,201,202,5,10,0,0,202,203,3,42,21,0,203,
        204,3,20,10,0,204,19,1,0,0,0,205,208,5,1,0,0,206,209,3,22,11,0,207,
        209,5,3,0,0,208,206,1,0,0,0,208,207,1,0,0,0,209,210,1,0,0,0,210,
        208,1,0,0,0,210,211,1,0,0,0,211,212,1,0,0,0,212,213,5,2,0,0,213,
        21,1,0,0,0,214,217,3,42,21,0,215,216,5,58,0,0,216,218,3,58,29,0,
        217,215,1,0,0,0,217,218,1,0,0,0,218,23,1,0,0,0,219,224,5,9,0,0,220,
        225,3,10,5,0,221,225,3,18,9,0,222,225,3,16,8,0,223,225,3,80,40,0,
        224,220,1,0,0,0,224,221,1,0,0,0,224,222,1,0,0,0,224,223,1,0,0,0,
        225,25,1,0,0,0,226,227,5,8,0,0,227,230,3,28,14,0,228,229,5,11,0,
        0,229,231,3,42,21,0,230,228,1,0,0,0,230,231,1,0,0,0,231,27,1,0,0,
        0,232,241,3,42,21,0,233,237,5,56,0,0,234,238,3,42,21,0,235,238,5,
        65,0,0,236,238,5,66,0,0,237,234,1,0,0,0,237,235,1,0,0,0,237,236,
        1,0,0,0,238,240,1,0,0,0,239,233,1,0,0,0,240,243,1,0,0,0,241,239,
        1,0,0,0,241,242,1,0,0,0,242,29,1,0,0,0,243,241,1,0,0,0,244,246,3,
        62,31,0,245,244,1,0,0,0,245,246,1,0,0,0,246,248,1,0,0,0,247,249,
        3,8,4,0,248,247,1,0,0,0,248,249,1,0,0,0,249,250,1,0,0,0,250,253,
        3,42,21,0,251,252,5,58,0,0,252,254,3,58,29,0,253,251,1,0,0,0,253,
        254,1,0,0,0,254,31,1,0,0,0,255,256,5,51,0,0,256,261,3,34,17,0,257,
        258,5,60,0,0,258,260,3,34,17,0,259,257,1,0,0,0,260,263,1,0,0,0,261,
        259,1,0,0,0,261,262,1,0,0,0,262,264,1,0,0,0,263,261,1,0,0,0,264,
        265,5,49,0,0,265,33,1,0,0,0,266,269,3,64,32,0,267,269,3,42,21,0,
        268,266,1,0,0,0,268,267,1,0,0,0,269,35,1,0,0,0,270,273,5,36,0,0,
        271,274,3,102,51,0,272,274,3,42,21,0,273,271,1,0,0,0,273,272,1,0,
        0,0,274,275,1,0,0,0,275,276,5,12,0,0,276,277,3,110,55,0,277,278,
        3,108,54,0,278,37,1,0,0,0,279,280,5,73,0,0,280,282,3,42,21,0,281,
        283,3,32,16,0,282,281,1,0,0,0,282,283,1,0,0,0,283,284,1,0,0,0,284,
        286,5,61,0,0,285,287,3,130,65,0,286,285,1,0,0,0,286,287,1,0,0,0,
        287,288,1,0,0,0,288,289,5,62,0,0,289,39,1,0,0,0,290,292,3,42,21,
        0,291,293,3,32,16,0,292,291,1,0,0,0,292,293,1,0,0,0,293,294,1,0,
        0,0,294,296,5,61,0,0,295,297,3,130,65,0,296,295,1,0,0,0,296,297,
        1,0,0,0,297,298,1,0,0,0,298,302,5,62,0,0,299,301,3,38,19,0,300,299,
        1,0,0,0,301,304,1,0,0,0,302,300,1,0,0,0,302,303,1,0,0,0,303,41,1,
        0,0,0,304,302,1,0,0,0,305,317,3,52,26,0,306,313,5,73,0,0,307,314,
        3,52,26,0,308,314,5,6,0,0,309,314,5,7,0,0,310,314,5,8,0,0,311,314,
        5,9,0,0,312,314,5,10,0,0,313,307,1,0,0,0,313,308,1,0,0,0,313,309,
        1,0,0,0,313,310,1,0,0,0,313,311,1,0,0,0,313,312,1,0,0,0,314,316,
        1,0,0,0,315,306,1,0,0,0,316,319,1,0,0,0,317,315,1,0,0,0,317,318,
        1,0,0,0,318,43,1,0,0,0,319,317,1,0,0,0,320,328,3,26,13,0,321,328,
        3,24,12,0,322,328,3,10,5,0,323,328,3,18,9,0,324,328,3,16,8,0,325,
        328,3,80,40,0,326,328,3,78,39,0,327,320,1,0,0,0,327,321,1,0,0,0,
        327,322,1,0,0,0,327,323,1,0,0,0,327,324,1,0,0,0,327,325,1,0,0,0,
        327,326,1,0,0,0,328,45,1,0,0,0,329,338,5,61,0,0,330,335,3,30,15,
        0,331,332,5,60,0,0,332,334,3,30,15,0,333,331,1,0,0,0,334,337,1,0,
        0,0,335,333,1,0,0,0,335,336,1,0,0,0,336,339,1,0,0,0,337,335,1,0,
        0,0,338,330,1,0,0,0,338,339,1,0,0,0,339,340,1,0,0,0,340,341,5,62,
        0,0,341,47,1,0,0,0,342,344,3,60,30,0,343,342,1,0,0,0,343,344,1,0,
        0,0,344,346,1,0,0,0,345,347,3,62,31,0,346,345,1,0,0,0,346,347,1,
        0,0,0,347,349,1,0,0,0,348,350,3,8,4,0,349,348,1,0,0,0,349,350,1,
        0,0,0,350,351,1,0,0,0,351,352,3,42,21,0,352,353,5,58,0,0,353,354,
        3,58,29,0,354,49,1,0,0,0,355,357,3,60,30,0,356,355,1,0,0,0,356,357,
        1,0,0,0,357,359,1,0,0,0,358,360,3,62,31,0,359,358,1,0,0,0,359,360,
        1,0,0,0,360,362,1,0,0,0,361,363,3,8,4,0,362,361,1,0,0,0,362,363,
        1,0,0,0,363,364,1,0,0,0,364,365,3,102,51,0,365,366,5,58,0,0,366,
        367,3,58,29,0,367,51,1,0,0,0,368,369,7,0,0,0,369,53,1,0,0,0,370,
        383,3,48,24,0,371,383,3,50,25,0,372,383,3,40,20,0,373,383,3,70,35,
        0,374,383,3,68,34,0,375,383,3,106,53,0,376,383,3,36,18,0,377,383,
        3,0,0,0,378,383,3,2,1,0,379,383,3,90,45,0,380,383,3,92,46,0,381,
        383,3,58,29,0,382,370,1,0,0,0,382,371,1,0,0,0,382,372,1,0,0,0,382,
        373,1,0,0,0,382,374,1,0,0,0,382,375,1,0,0,0,382,376,1,0,0,0,382,
        377,1,0,0,0,382,378,1,0,0,0,382,379,1,0,0,0,382,380,1,0,0,0,382,
        381,1,0,0,0,383,55,1,0,0,0,384,393,3,48,24,0,385,393,3,50,25,0,386,
        393,3,58,29,0,387,393,3,104,52,0,388,393,3,68,34,0,389,393,3,0,0,
        0,390,393,3,90,45,0,391,393,3,92,46,0,392,384,1,0,0,0,392,385,1,
        0,0,0,392,386,1,0,0,0,392,387,1,0,0,0,392,388,1,0,0,0,392,389,1,
        0,0,0,392,390,1,0,0,0,392,391,1,0,0,0,393,57,1,0,0,0,394,400,3,110,
        55,0,395,400,3,70,35,0,396,400,3,106,53,0,397,400,3,36,18,0,398,
        400,3,2,1,0,399,394,1,0,0,0,399,395,1,0,0,0,399,396,1,0,0,0,399,
        397,1,0,0,0,399,398,1,0,0,0,400,59,1,0,0,0,401,402,7,1,0,0,402,61,
        1,0,0,0,403,404,7,2,0,0,404,63,1,0,0,0,405,408,7,3,0,0,406,407,5,
        63,0,0,407,409,5,64,0,0,408,406,1,0,0,0,408,409,1,0,0,0,409,65,1,
        0,0,0,410,411,7,4,0,0,411,67,1,0,0,0,412,415,3,42,21,0,413,416,5,
        32,0,0,414,416,3,66,33,0,415,413,1,0,0,0,415,414,1,0,0,0,416,417,
        1,0,0,0,417,418,3,58,29,0,418,69,1,0,0,0,419,420,5,34,0,0,420,421,
        3,110,55,0,421,433,3,108,54,0,422,424,5,3,0,0,423,422,1,0,0,0,424,
        427,1,0,0,0,425,423,1,0,0,0,425,426,1,0,0,0,426,428,1,0,0,0,427,
        425,1,0,0,0,428,431,5,35,0,0,429,432,3,70,35,0,430,432,3,108,54,
        0,431,429,1,0,0,0,431,430,1,0,0,0,432,434,1,0,0,0,433,425,1,0,0,
        0,433,434,1,0,0,0,434,71,1,0,0,0,435,438,3,58,29,0,436,438,3,104,
        52,0,437,435,1,0,0,0,437,436,1,0,0,0,438,73,1,0,0,0,439,444,3,72,
        36,0,440,441,5,60,0,0,441,443,3,72,36,0,442,440,1,0,0,0,443,446,
        1,0,0,0,444,442,1,0,0,0,444,445,1,0,0,0,445,75,1,0,0,0,446,444,1,
        0,0,0,447,450,3,44,22,0,448,450,5,3,0,0,449,447,1,0,0,0,449,448,
        1,0,0,0,450,453,1,0,0,0,451,449,1,0,0,0,451,452,1,0,0,0,452,454,
        1,0,0,0,453,451,1,0,0,0,454,455,5,0,0,1,455,77,1,0,0,0,456,461,3,
        54,27,0,457,458,5,60,0,0,458,460,3,54,27,0,459,457,1,0,0,0,460,463,
        1,0,0,0,461,459,1,0,0,0,461,462,1,0,0,0,462,79,1,0,0,0,463,461,1,
        0,0,0,464,467,3,82,41,0,465,467,3,84,42,0,466,464,1,0,0,0,466,465,
        1,0,0,0,467,81,1,0,0,0,468,469,3,42,21,0,469,470,3,46,23,0,470,471,
        5,59,0,0,471,472,3,86,43,0,472,83,1,0,0,0,473,474,3,42,21,0,474,
        475,3,46,23,0,475,476,5,59,0,0,476,477,3,94,47,0,477,85,1,0,0,0,
        478,479,3,88,44,0,479,87,1,0,0,0,480,485,3,56,28,0,481,482,5,60,
        0,0,482,484,3,56,28,0,483,481,1,0,0,0,484,487,1,0,0,0,485,483,1,
        0,0,0,485,486,1,0,0,0,486,89,1,0,0,0,487,485,1,0,0,0,488,489,5,39,
        0,0,489,91,1,0,0,0,490,491,5,40,0,0,491,93,1,0,0,0,492,493,3,96,
        48,0,493,95,1,0,0,0,494,495,5,1,0,0,495,496,3,98,49,0,496,497,5,
        2,0,0,497,97,1,0,0,0,498,501,3,100,50,0,499,501,5,3,0,0,500,498,
        1,0,0,0,500,499,1,0,0,0,501,502,1,0,0,0,502,500,1,0,0,0,502,503,
        1,0,0,0,503,99,1,0,0,0,504,509,3,56,28,0,505,506,5,60,0,0,506,508,
        3,56,28,0,507,505,1,0,0,0,508,511,1,0,0,0,509,507,1,0,0,0,509,510,
        1,0,0,0,510,101,1,0,0,0,511,509,1,0,0,0,512,513,5,63,0,0,513,518,
        3,42,21,0,514,515,5,60,0,0,515,517,3,42,21,0,516,514,1,0,0,0,517,
        520,1,0,0,0,518,516,1,0,0,0,518,519,1,0,0,0,519,521,1,0,0,0,520,
        518,1,0,0,0,521,522,5,64,0,0,522,103,1,0,0,0,523,524,5,63,0,0,524,
        529,3,58,29,0,525,526,5,60,0,0,526,528,3,58,29,0,527,525,1,0,0,0,
        528,531,1,0,0,0,529,527,1,0,0,0,529,530,1,0,0,0,530,532,1,0,0,0,
        531,529,1,0,0,0,532,533,5,64,0,0,533,105,1,0,0,0,534,535,5,36,0,
        0,535,536,3,48,24,0,536,537,5,37,0,0,537,540,3,110,55,0,538,539,
        5,38,0,0,539,541,3,110,55,0,540,538,1,0,0,0,540,541,1,0,0,0,541,
        542,1,0,0,0,542,543,3,108,54,0,543,107,1,0,0,0,544,545,3,94,47,0,
        545,109,1,0,0,0,546,552,3,112,56,0,547,548,5,45,0,0,548,549,3,110,
        55,0,549,550,5,46,0,0,550,551,3,110,55,0,551,553,1,0,0,0,552,547,
        1,0,0,0,552,553,1,0,0,0,553,111,1,0,0,0,554,559,3,114,57,0,555,556,
        5,41,0,0,556,558,3,114,57,0,557,555,1,0,0,0,558,561,1,0,0,0,559,
        557,1,0,0,0,559,560,1,0,0,0,560,113,1,0,0,0,561,559,1,0,0,0,562,
        567,3,116,58,0,563,564,5,42,0,0,564,566,3,116,58,0,565,563,1,0,0,
        0,566,569,1,0,0,0,567,565,1,0,0,0,567,568,1,0,0,0,568,115,1,0,0,
        0,569,567,1,0,0,0,570,575,3,118,59,0,571,572,7,5,0,0,572,574,3,118,
        59,0,573,571,1,0,0,0,574,577,1,0,0,0,575,573,1,0,0,0,575,576,1,0,
        0,0,576,117,1,0,0,0,577,575,1,0,0,0,578,583,3,120,60,0,579,580,7,
        6,0,0,580,582,3,120,60,0,581,579,1,0,0,0,582,585,1,0,0,0,583,581,
        1,0,0,0,583,584,1,0,0,0,584,119,1,0,0,0,585,583,1,0,0,0,586,591,
        3,122,61,0,587,588,7,7,0,0,588,590,3,122,61,0,589,587,1,0,0,0,590,
        593,1,0,0,0,591,589,1,0,0,0,591,592,1,0,0,0,592,121,1,0,0,0,593,
        591,1,0,0,0,594,599,3,124,62,0,595,596,7,8,0,0,596,598,3,124,62,
        0,597,595,1,0,0,0,598,601,1,0,0,0,599,597,1,0,0,0,599,600,1,0,0,
        0,600,123,1,0,0,0,601,599,1,0,0,0,602,610,3,126,63,0,603,604,5,43,
        0,0,604,610,3,126,63,0,605,606,5,53,0,0,606,610,3,126,63,0,607,608,
        5,54,0,0,608,610,3,126,63,0,609,602,1,0,0,0,609,603,1,0,0,0,609,
        605,1,0,0,0,609,607,1,0,0,0,610,125,1,0,0,0,611,616,3,128,64,0,612,
        613,5,63,0,0,613,614,3,58,29,0,614,615,5,64,0,0,615,617,1,0,0,0,
        616,612,1,0,0,0,616,617,1,0,0,0,617,127,1,0,0,0,618,626,3,40,20,
        0,619,626,3,42,21,0,620,626,3,136,68,0,621,622,5,61,0,0,622,623,
        3,58,29,0,623,624,5,62,0,0,624,626,1,0,0,0,625,618,1,0,0,0,625,619,
        1,0,0,0,625,620,1,0,0,0,625,621,1,0,0,0,626,129,1,0,0,0,627,634,
        3,132,66,0,628,631,3,74,37,0,629,630,5,60,0,0,630,632,3,132,66,0,
        631,629,1,0,0,0,631,632,1,0,0,0,632,634,1,0,0,0,633,627,1,0,0,0,
        633,628,1,0,0,0,634,131,1,0,0,0,635,640,3,134,67,0,636,637,5,60,
        0,0,637,639,3,134,67,0,638,636,1,0,0,0,639,642,1,0,0,0,640,638,1,
        0,0,0,640,641,1,0,0,0,641,133,1,0,0,0,642,640,1,0,0,0,643,644,3,
        42,21,0,644,647,5,58,0,0,645,648,3,58,29,0,646,648,3,104,52,0,647,
        645,1,0,0,0,647,646,1,0,0,0,648,135,1,0,0,0,649,652,3,138,69,0,650,
        652,3,140,70,0,651,649,1,0,0,0,651,650,1,0,0,0,652,137,1,0,0,0,653,
        654,7,9,0,0,654,139,1,0,0,0,655,656,7,10,0,0,656,141,1,0,0,0,76,
        148,155,157,162,167,171,174,183,185,190,196,208,210,217,224,230,
        237,241,245,248,253,261,268,273,282,286,292,296,302,313,317,327,
        335,338,343,346,349,356,359,362,382,392,399,408,415,425,431,433,
        437,444,449,451,461,466,485,500,502,509,518,529,540,552,559,567,
        575,583,591,599,609,616,625,631,633,640,647,651
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
