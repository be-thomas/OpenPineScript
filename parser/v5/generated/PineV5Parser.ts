
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
    public static readonly IN = 11;
    public static readonly VAR = 12;
    public static readonly VARIP = 13;
    public static readonly SERIES = 14;
    public static readonly SIMPLE = 15;
    public static readonly CONST = 16;
    public static readonly INT_TYPE = 17;
    public static readonly FLOAT_TYPE = 18;
    public static readonly BOOL_TYPE = 19;
    public static readonly STRING_TYPE = 20;
    public static readonly COLOR_TYPE = 21;
    public static readonly LINE_TYPE = 22;
    public static readonly LABEL_TYPE = 23;
    public static readonly BOX_TYPE = 24;
    public static readonly TABLE_TYPE = 25;
    public static readonly PLUS_ASSIGN = 26;
    public static readonly MINUS_ASSIGN = 27;
    public static readonly MUL_ASSIGN = 28;
    public static readonly DIV_ASSIGN = 29;
    public static readonly MOD_ASSIGN = 30;
    public static readonly ASSIGN = 31;
    public static readonly LBEG = 32;
    public static readonly IF_COND = 33;
    public static readonly IF_COND_ELSE = 34;
    public static readonly FOR_STMT = 35;
    public static readonly FOR_STMT_TO = 36;
    public static readonly FOR_STMT_BY = 37;
    public static readonly BREAK = 38;
    public static readonly CONTINUE = 39;
    public static readonly OR = 40;
    public static readonly AND = 41;
    public static readonly NOT = 42;
    public static readonly BOOL_LITERAL = 43;
    public static readonly COND = 44;
    public static readonly COND_ELSE = 45;
    public static readonly EQ = 46;
    public static readonly NEQ = 47;
    public static readonly GT = 48;
    public static readonly GE = 49;
    public static readonly LT = 50;
    public static readonly LE = 51;
    public static readonly PLUS = 52;
    public static readonly MINUS = 53;
    public static readonly MUL = 54;
    public static readonly DIV = 55;
    public static readonly MOD = 56;
    public static readonly DEFINE = 57;
    public static readonly ARROW = 58;
    public static readonly COMMA = 59;
    public static readonly LPAR = 60;
    public static readonly RPAR = 61;
    public static readonly LSQBR = 62;
    public static readonly RSQBR = 63;
    public static readonly INT_LITERAL = 64;
    public static readonly FLOAT_LITERAL = 65;
    public static readonly STR_LITERAL = 66;
    public static readonly COLOR_LITERAL = 67;
    public static readonly ID = 68;
    public static readonly WS = 69;
    public static readonly LINE_COMMENT = 70;
    public static readonly BLOCK_COMMENT = 71;
    public static readonly DOT = 72;
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
    public static readonly RULE_for_in_expr = 15;
    public static readonly RULE_call_suffix = 16;
    public static readonly RULE_fun_call = 17;
    public static readonly RULE_id = 18;
    public static readonly RULE_stmt = 19;
    public static readonly RULE_fun_head = 20;
    public static readonly RULE_var_def = 21;
    public static readonly RULE_var_defs = 22;
    public static readonly RULE_id_part = 23;
    public static readonly RULE_global_stmt_content = 24;
    public static readonly RULE_local_stmt_content = 25;
    public static readonly RULE_arith_expr = 26;
    public static readonly RULE_decl_mod = 27;
    public static readonly RULE_type_qual = 28;
    public static readonly RULE_type_name = 29;
    public static readonly RULE_compound_assign_op = 30;
    public static readonly RULE_var_assign = 31;
    public static readonly RULE_if_expr = 32;
    public static readonly RULE_pos_arg = 33;
    public static readonly RULE_pos_args = 34;
    public static readonly RULE_pine_script = 35;
    public static readonly RULE_global_stmt = 36;
    public static readonly RULE_fun_def_stmt = 37;
    public static readonly RULE_fun_def_singleline = 38;
    public static readonly RULE_fun_def_multiline = 39;
    public static readonly RULE_fun_body_singleline = 40;
    public static readonly RULE_local_stmt_singleline = 41;
    public static readonly RULE_loop_break = 42;
    public static readonly RULE_loop_continue = 43;
    public static readonly RULE_fun_body_multiline = 44;
    public static readonly RULE_local_stmts_multiline = 45;
    public static readonly RULE_local_stmts_list = 46;
    public static readonly RULE_local_stmt_multiline = 47;
    public static readonly RULE_ids_array = 48;
    public static readonly RULE_arith_exprs = 49;
    public static readonly RULE_for_expr = 50;
    public static readonly RULE_stmts_block = 51;
    public static readonly RULE_ternary_expr = 52;
    public static readonly RULE_or_expr = 53;
    public static readonly RULE_and_expr = 54;
    public static readonly RULE_eq_expr = 55;
    public static readonly RULE_cmp_expr = 56;
    public static readonly RULE_add_expr = 57;
    public static readonly RULE_mult_expr = 58;
    public static readonly RULE_unary_expr = 59;
    public static readonly RULE_sqbr_expr = 60;
    public static readonly RULE_atom = 61;
    public static readonly RULE_fun_actual_args = 62;
    public static readonly RULE_kw_args = 63;
    public static readonly RULE_kw_arg = 64;
    public static readonly RULE_literal = 65;
    public static readonly RULE_num_literal = 66;
    public static readonly RULE_other_literal = 67;

    public static readonly literalNames = [
        null, null, null, null, "'while'", "'switch'", "'type'", "'method'", 
        "'import'", "'export'", "'as'", "'in'", "'var'", "'varip'", "'series'", 
        "'simple'", "'const'", "'int'", "'float'", "'bool'", "'string'", 
        "'color'", "'line'", "'label'", "'box'", "'table'", "'+='", "'-='", 
        "'*='", "'/='", "'%='", "':='", null, "'if'", "'else'", "'for'", 
        "'to'", "'by'", "'break'", "'continue'", "'or'", "'and'", "'not'", 
        null, "'?'", "':'", "'=='", "'!='", "'>'", "'>='", "'<'", "'<='", 
        "'+'", "'-'", "'*'", "'/'", "'%'", "'='", "'=>'", "','", "'('", 
        "')'", "'['", "']'", null, null, null, null, null, null, null, null, 
        "'.'"
    ];

    public static readonly symbolicNames = [
        null, "BEGIN", "END", "LEND", "WHILE", "SWITCH", "TYPE", "METHOD", 
        "IMPORT", "EXPORT", "AS", "IN", "VAR", "VARIP", "SERIES", "SIMPLE", 
        "CONST", "INT_TYPE", "FLOAT_TYPE", "BOOL_TYPE", "STRING_TYPE", "COLOR_TYPE", 
        "LINE_TYPE", "LABEL_TYPE", "BOX_TYPE", "TABLE_TYPE", "PLUS_ASSIGN", 
        "MINUS_ASSIGN", "MUL_ASSIGN", "DIV_ASSIGN", "MOD_ASSIGN", "ASSIGN", 
        "LBEG", "IF_COND", "IF_COND_ELSE", "FOR_STMT", "FOR_STMT_TO", "FOR_STMT_BY", 
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
        "for_in_expr", "call_suffix", "fun_call", "id", "stmt", "fun_head", 
        "var_def", "var_defs", "id_part", "global_stmt_content", "local_stmt_content", 
        "arith_expr", "decl_mod", "type_qual", "type_name", "compound_assign_op", 
        "var_assign", "if_expr", "pos_arg", "pos_args", "pine_script", "global_stmt", 
        "fun_def_stmt", "fun_def_singleline", "fun_def_multiline", "fun_body_singleline", 
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
            this.state = 136;
            this.match(PineV5Parser.WHILE);
            this.state = 137;
            this.ternary_expr();
            this.state = 138;
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
            this.state = 140;
            this.match(PineV5Parser.SWITCH);
            this.state = 142;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 67093504) !== 0) || ((((_la - 42)) & ~0x1F) === 0 && ((1 << (_la - 42)) & 130288643) !== 0)) {
                {
                this.state = 141;
                this.ternary_expr();
                }
            }

            this.state = 144;
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
            this.state = 146;
            this.match(PineV5Parser.BEGIN);
            this.state = 149;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                this.state = 149;
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
                    this.state = 147;
                    this.switch_case();
                    }
                    break;
                case PineV5Parser.LEND:
                    {
                    this.state = 148;
                    this.match(PineV5Parser.LEND);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                this.state = 151;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 67093512) !== 0) || ((((_la - 42)) & ~0x1F) === 0 && ((1 << (_la - 42)) & 130354179) !== 0));
            this.state = 153;
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
            this.state = 156;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 67093504) !== 0) || ((((_la - 42)) & ~0x1F) === 0 && ((1 << (_la - 42)) & 130288643) !== 0)) {
                {
                this.state = 155;
                this.ternary_expr();
                }
            }

            this.state = 158;
            this.match(PineV5Parser.ARROW);
            this.state = 161;
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
                this.state = 159;
                this.local_stmt_singleline();
                }
                break;
            case PineV5Parser.BEGIN:
                {
                this.state = 160;
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
            this.state = 165;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 5, this.context) ) {
            case 1:
                {
                this.state = 163;
                this.type_name();
                }
                break;
            case 2:
                {
                this.state = 164;
                this.id();
                }
                break;
            }
            this.state = 168;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 50) {
                {
                this.state = 167;
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
            this.state = 170;
            this.match(PineV5Parser.TYPE);
            this.state = 171;
            this.id();
            this.state = 172;
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
            this.state = 174;
            this.match(PineV5Parser.BEGIN);
            this.state = 177;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                this.state = 177;
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
                    this.state = 175;
                    this.type_field();
                    }
                    break;
                case PineV5Parser.LEND:
                    {
                    this.state = 176;
                    this.match(PineV5Parser.LEND);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                this.state = 179;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 67093512) !== 0) || _la === 68);
            this.state = 181;
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
            this.state = 184;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 9, this.context) ) {
            case 1:
                {
                this.state = 183;
                this.type_qual();
                }
                break;
            }
            this.state = 186;
            this.field_type();
            this.state = 187;
            this.id();
            this.state = 190;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 57) {
                {
                this.state = 188;
                this.match(PineV5Parser.DEFINE);
                this.state = 189;
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
            this.state = 192;
            this.match(PineV5Parser.METHOD);
            this.state = 193;
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
            this.state = 195;
            this.match(PineV5Parser.EXPORT);
            this.state = 199;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV5Parser.TYPE:
                {
                this.state = 196;
                this.type_def_stmt();
                }
                break;
            case PineV5Parser.METHOD:
                {
                this.state = 197;
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
                this.state = 198;
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
            this.state = 201;
            this.match(PineV5Parser.IMPORT);
            this.state = 202;
            this.import_path();
            this.state = 205;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 12, this.context) ) {
            case 1:
                {
                this.state = 203;
                this.match(PineV5Parser.AS);
                this.state = 204;
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
            this.state = 207;
            this.id();
            this.state = 216;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 55) {
                {
                {
                this.state = 208;
                this.match(PineV5Parser.DIV);
                this.state = 212;
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
                    this.state = 209;
                    this.id();
                    }
                    break;
                case PineV5Parser.INT_LITERAL:
                    {
                    this.state = 210;
                    this.match(PineV5Parser.INT_LITERAL);
                    }
                    break;
                case PineV5Parser.FLOAT_LITERAL:
                    {
                    this.state = 211;
                    this.match(PineV5Parser.FLOAT_LITERAL);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                }
                this.state = 218;
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
            this.state = 220;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 15, this.context) ) {
            case 1:
                {
                this.state = 219;
                this.type_qual();
                }
                break;
            }
            this.state = 223;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 16, this.context) ) {
            case 1:
                {
                this.state = 222;
                this.field_type();
                }
                break;
            }
            this.state = 225;
            this.id();
            this.state = 228;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 57) {
                {
                this.state = 226;
                this.match(PineV5Parser.DEFINE);
                this.state = 227;
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
            this.state = 230;
            this.match(PineV5Parser.LT);
            this.state = 231;
            this.type_arg();
            this.state = 236;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 59) {
                {
                {
                this.state = 232;
                this.match(PineV5Parser.COMMA);
                this.state = 233;
                this.type_arg();
                }
                }
                this.state = 238;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 239;
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
            this.state = 243;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 19, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 241;
                this.type_name();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 242;
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
        this.enterRule(localContext, 30, PineV5Parser.RULE_for_in_expr);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 245;
            this.match(PineV5Parser.FOR_STMT);
            this.state = 248;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV5Parser.LSQBR:
                {
                this.state = 246;
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
                this.state = 247;
                this.id();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
            this.state = 250;
            this.match(PineV5Parser.IN);
            this.state = 251;
            this.ternary_expr();
            this.state = 252;
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
        this.enterRule(localContext, 32, PineV5Parser.RULE_call_suffix);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 254;
            this.match(PineV5Parser.DOT);
            this.state = 255;
            this.id();
            this.state = 257;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 50) {
                {
                this.state = 256;
                this.type_args();
                }
            }

            this.state = 259;
            this.match(PineV5Parser.LPAR);
            this.state = 261;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (((((_la - 5)) & ~0x1F) === 0 && ((1 << (_la - 5)) & 1344273953) !== 0) || ((((_la - 42)) & ~0x1F) === 0 && ((1 << (_la - 42)) & 131337219) !== 0)) {
                {
                this.state = 260;
                this.fun_actual_args();
                }
            }

            this.state = 263;
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
        this.enterRule(localContext, 34, PineV5Parser.RULE_fun_call);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 265;
            this.id();
            this.state = 267;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 50) {
                {
                this.state = 266;
                this.type_args();
                }
            }

            this.state = 269;
            this.match(PineV5Parser.LPAR);
            this.state = 271;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (((((_la - 5)) & ~0x1F) === 0 && ((1 << (_la - 5)) & 1344273953) !== 0) || ((((_la - 42)) & ~0x1F) === 0 && ((1 << (_la - 42)) & 131337219) !== 0)) {
                {
                this.state = 270;
                this.fun_actual_args();
                }
            }

            this.state = 273;
            this.match(PineV5Parser.RPAR);
            this.state = 277;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 72) {
                {
                {
                this.state = 274;
                this.call_suffix();
                }
                }
                this.state = 279;
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
        this.enterRule(localContext, 36, PineV5Parser.RULE_id);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 280;
            this.id_part();
            this.state = 291;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 72) {
                {
                {
                this.state = 281;
                this.match(PineV5Parser.DOT);
                this.state = 287;
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
                    this.state = 282;
                    this.id_part();
                    }
                    break;
                case PineV5Parser.TYPE:
                    {
                    this.state = 283;
                    this.match(PineV5Parser.TYPE);
                    }
                    break;
                case PineV5Parser.METHOD:
                    {
                    this.state = 284;
                    this.match(PineV5Parser.METHOD);
                    }
                    break;
                case PineV5Parser.IMPORT:
                    {
                    this.state = 285;
                    this.match(PineV5Parser.IMPORT);
                    }
                    break;
                case PineV5Parser.EXPORT:
                    {
                    this.state = 286;
                    this.match(PineV5Parser.EXPORT);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                }
                this.state = 293;
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
        this.enterRule(localContext, 38, PineV5Parser.RULE_stmt);
        try {
            this.state = 300;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 28, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 294;
                this.import_stmt();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 295;
                this.export_stmt();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 296;
                this.type_def_stmt();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 297;
                this.method_def_stmt();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 298;
                this.fun_def_stmt();
                }
                break;
            case 6:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 299;
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
        this.enterRule(localContext, 40, PineV5Parser.RULE_fun_head);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 302;
            this.match(PineV5Parser.LPAR);
            this.state = 311;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 67093504) !== 0) || _la === 68) {
                {
                this.state = 303;
                this.fun_param();
                this.state = 308;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 59) {
                    {
                    {
                    this.state = 304;
                    this.match(PineV5Parser.COMMA);
                    this.state = 305;
                    this.fun_param();
                    }
                    }
                    this.state = 310;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                }
            }

            this.state = 313;
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
        this.enterRule(localContext, 42, PineV5Parser.RULE_var_def);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 316;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 12 || _la === 13) {
                {
                this.state = 315;
                this.decl_mod();
                }
            }

            this.state = 319;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 32, this.context) ) {
            case 1:
                {
                this.state = 318;
                this.type_qual();
                }
                break;
            }
            this.state = 322;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 33, this.context) ) {
            case 1:
                {
                this.state = 321;
                this.field_type();
                }
                break;
            }
            this.state = 324;
            this.id();
            this.state = 325;
            this.match(PineV5Parser.DEFINE);
            this.state = 326;
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
        this.enterRule(localContext, 44, PineV5Parser.RULE_var_defs);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 329;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 12 || _la === 13) {
                {
                this.state = 328;
                this.decl_mod();
                }
            }

            this.state = 332;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 35, this.context) ) {
            case 1:
                {
                this.state = 331;
                this.type_qual();
                }
                break;
            }
            this.state = 335;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 67093504) !== 0) || _la === 68) {
                {
                this.state = 334;
                this.field_type();
                }
            }

            this.state = 337;
            this.ids_array();
            this.state = 338;
            this.match(PineV5Parser.DEFINE);
            this.state = 339;
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
        this.enterRule(localContext, 46, PineV5Parser.RULE_id_part);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 341;
            _la = this.tokenStream.LA(1);
            if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 67093504) !== 0) || _la === 68)) {
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
        this.enterRule(localContext, 48, PineV5Parser.RULE_global_stmt_content);
        try {
            this.state = 355;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 37, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 343;
                this.var_def();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 344;
                this.var_defs();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 345;
                this.fun_call();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 346;
                this.if_expr();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 347;
                this.var_assign();
                }
                break;
            case 6:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 348;
                this.for_expr();
                }
                break;
            case 7:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 349;
                this.for_in_expr();
                }
                break;
            case 8:
                this.enterOuterAlt(localContext, 8);
                {
                this.state = 350;
                this.while_expr();
                }
                break;
            case 9:
                this.enterOuterAlt(localContext, 9);
                {
                this.state = 351;
                this.switch_expr();
                }
                break;
            case 10:
                this.enterOuterAlt(localContext, 10);
                {
                this.state = 352;
                this.loop_break();
                }
                break;
            case 11:
                this.enterOuterAlt(localContext, 11);
                {
                this.state = 353;
                this.loop_continue();
                }
                break;
            case 12:
                this.enterOuterAlt(localContext, 12);
                {
                this.state = 354;
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
        this.enterRule(localContext, 50, PineV5Parser.RULE_local_stmt_content);
        try {
            this.state = 365;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 38, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 357;
                this.var_def();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 358;
                this.var_defs();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 359;
                this.arith_expr();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 360;
                this.arith_exprs();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 361;
                this.var_assign();
                }
                break;
            case 6:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 362;
                this.while_expr();
                }
                break;
            case 7:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 363;
                this.loop_break();
                }
                break;
            case 8:
                this.enterOuterAlt(localContext, 8);
                {
                this.state = 364;
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
        this.enterRule(localContext, 52, PineV5Parser.RULE_arith_expr);
        try {
            this.state = 372;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 39, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 367;
                this.ternary_expr();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 368;
                this.if_expr();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 369;
                this.for_expr();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 370;
                this.for_in_expr();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 371;
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
        this.enterRule(localContext, 54, PineV5Parser.RULE_decl_mod);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 374;
            _la = this.tokenStream.LA(1);
            if(!(_la === 12 || _la === 13)) {
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
        this.enterRule(localContext, 56, PineV5Parser.RULE_type_qual);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 376;
            _la = this.tokenStream.LA(1);
            if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 114688) !== 0))) {
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
        this.enterRule(localContext, 58, PineV5Parser.RULE_type_name);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 378;
            _la = this.tokenStream.LA(1);
            if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 66977792) !== 0))) {
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
    public compound_assign_op(): Compound_assign_opContext {
        let localContext = new Compound_assign_opContext(this.context, this.state);
        this.enterRule(localContext, 60, PineV5Parser.RULE_compound_assign_op);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 380;
            _la = this.tokenStream.LA(1);
            if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 2080374784) !== 0))) {
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
        this.enterRule(localContext, 62, PineV5Parser.RULE_var_assign);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 382;
            this.id();
            this.state = 385;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV5Parser.ASSIGN:
                {
                this.state = 383;
                this.match(PineV5Parser.ASSIGN);
                }
                break;
            case PineV5Parser.PLUS_ASSIGN:
            case PineV5Parser.MINUS_ASSIGN:
            case PineV5Parser.MUL_ASSIGN:
            case PineV5Parser.DIV_ASSIGN:
            case PineV5Parser.MOD_ASSIGN:
                {
                this.state = 384;
                this.compound_assign_op();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
            this.state = 387;
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
        this.enterRule(localContext, 64, PineV5Parser.RULE_if_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 389;
            this.match(PineV5Parser.IF_COND);
            this.state = 390;
            this.ternary_expr();
            this.state = 391;
            this.stmts_block();
            this.state = 403;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 43, this.context) ) {
            case 1:
                {
                this.state = 395;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 3) {
                    {
                    {
                    this.state = 392;
                    this.match(PineV5Parser.LEND);
                    }
                    }
                    this.state = 397;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                this.state = 398;
                this.match(PineV5Parser.IF_COND_ELSE);
                this.state = 401;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case PineV5Parser.IF_COND:
                    {
                    this.state = 399;
                    this.if_expr();
                    }
                    break;
                case PineV5Parser.BEGIN:
                    {
                    this.state = 400;
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
        this.enterRule(localContext, 66, PineV5Parser.RULE_pos_arg);
        try {
            this.state = 407;
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
                this.state = 405;
                this.arith_expr();
                }
                break;
            case PineV5Parser.LSQBR:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 406;
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
        this.enterRule(localContext, 68, PineV5Parser.RULE_pos_args);
        try {
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 409;
            this.pos_arg();
            this.state = 414;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 45, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
                    {
                    {
                    this.state = 410;
                    this.match(PineV5Parser.COMMA);
                    this.state = 411;
                    this.pos_arg();
                    }
                    }
                }
                this.state = 416;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 45, this.context);
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
        this.enterRule(localContext, 70, PineV5Parser.RULE_pine_script);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 421;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 67106808) !== 0) || ((((_la - 33)) & ~0x1F) === 0 && ((1 << (_la - 33)) & 2820146789) !== 0) || ((((_la - 65)) & ~0x1F) === 0 && ((1 << (_la - 65)) & 15) !== 0)) {
                {
                this.state = 419;
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
                    this.state = 417;
                    this.stmt();
                    }
                    break;
                case PineV5Parser.LEND:
                    {
                    this.state = 418;
                    this.match(PineV5Parser.LEND);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                this.state = 423;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 424;
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
        this.enterRule(localContext, 72, PineV5Parser.RULE_global_stmt);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 426;
            this.global_stmt_content();
            this.state = 431;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 59) {
                {
                {
                this.state = 427;
                this.match(PineV5Parser.COMMA);
                this.state = 428;
                this.global_stmt_content();
                }
                }
                this.state = 433;
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
        this.enterRule(localContext, 74, PineV5Parser.RULE_fun_def_stmt);
        try {
            this.state = 436;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 49, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 434;
                this.fun_def_singleline();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 435;
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
        this.enterRule(localContext, 76, PineV5Parser.RULE_fun_def_singleline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 438;
            this.id();
            this.state = 439;
            this.fun_head();
            this.state = 440;
            this.match(PineV5Parser.ARROW);
            this.state = 441;
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
        this.enterRule(localContext, 78, PineV5Parser.RULE_fun_def_multiline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 443;
            this.id();
            this.state = 444;
            this.fun_head();
            this.state = 445;
            this.match(PineV5Parser.ARROW);
            this.state = 446;
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
        this.enterRule(localContext, 80, PineV5Parser.RULE_fun_body_singleline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 448;
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
        this.enterRule(localContext, 82, PineV5Parser.RULE_local_stmt_singleline);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 450;
            this.local_stmt_content();
            this.state = 455;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 59) {
                {
                {
                this.state = 451;
                this.match(PineV5Parser.COMMA);
                this.state = 452;
                this.local_stmt_content();
                }
                }
                this.state = 457;
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
        this.enterRule(localContext, 84, PineV5Parser.RULE_loop_break);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 458;
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
        this.enterRule(localContext, 86, PineV5Parser.RULE_loop_continue);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 460;
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
        this.enterRule(localContext, 88, PineV5Parser.RULE_fun_body_multiline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 462;
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
        this.enterRule(localContext, 90, PineV5Parser.RULE_local_stmts_multiline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 464;
            this.match(PineV5Parser.BEGIN);
            this.state = 465;
            this.local_stmts_list();
            this.state = 466;
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
        this.enterRule(localContext, 92, PineV5Parser.RULE_local_stmts_list);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 470;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                this.state = 470;
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
                    this.state = 468;
                    this.local_stmt_multiline();
                    }
                    break;
                case PineV5Parser.LEND:
                    {
                    this.state = 469;
                    this.match(PineV5Parser.LEND);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                this.state = 472;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 67105848) !== 0) || ((((_la - 33)) & ~0x1F) === 0 && ((1 << (_la - 33)) & 2820146789) !== 0) || ((((_la - 65)) & ~0x1F) === 0 && ((1 << (_la - 65)) & 15) !== 0));
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
        this.enterRule(localContext, 94, PineV5Parser.RULE_local_stmt_multiline);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 474;
            this.local_stmt_content();
            this.state = 479;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 59) {
                {
                {
                this.state = 475;
                this.match(PineV5Parser.COMMA);
                this.state = 476;
                this.local_stmt_content();
                }
                }
                this.state = 481;
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
        this.enterRule(localContext, 96, PineV5Parser.RULE_ids_array);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 482;
            this.match(PineV5Parser.LSQBR);
            this.state = 483;
            this.id();
            this.state = 488;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 59) {
                {
                {
                this.state = 484;
                this.match(PineV5Parser.COMMA);
                this.state = 485;
                this.id();
                }
                }
                this.state = 490;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 491;
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
        this.enterRule(localContext, 98, PineV5Parser.RULE_arith_exprs);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 493;
            this.match(PineV5Parser.LSQBR);
            this.state = 494;
            this.arith_expr();
            this.state = 499;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 59) {
                {
                {
                this.state = 495;
                this.match(PineV5Parser.COMMA);
                this.state = 496;
                this.arith_expr();
                }
                }
                this.state = 501;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 502;
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
        this.enterRule(localContext, 100, PineV5Parser.RULE_for_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 504;
            this.match(PineV5Parser.FOR_STMT);
            this.state = 505;
            this.var_def();
            this.state = 506;
            this.match(PineV5Parser.FOR_STMT_TO);
            this.state = 507;
            this.ternary_expr();
            this.state = 510;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 37) {
                {
                this.state = 508;
                this.match(PineV5Parser.FOR_STMT_BY);
                this.state = 509;
                this.ternary_expr();
                }
            }

            this.state = 512;
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
        this.enterRule(localContext, 102, PineV5Parser.RULE_stmts_block);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 514;
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
        this.enterRule(localContext, 104, PineV5Parser.RULE_ternary_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 516;
            this.or_expr();
            this.state = 522;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 44) {
                {
                this.state = 517;
                this.match(PineV5Parser.COND);
                this.state = 518;
                this.ternary_expr();
                this.state = 519;
                this.match(PineV5Parser.COND_ELSE);
                this.state = 520;
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
        this.enterRule(localContext, 106, PineV5Parser.RULE_or_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 524;
            this.and_expr();
            this.state = 529;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 40) {
                {
                {
                this.state = 525;
                this.match(PineV5Parser.OR);
                this.state = 526;
                this.and_expr();
                }
                }
                this.state = 531;
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
        this.enterRule(localContext, 108, PineV5Parser.RULE_and_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 532;
            this.eq_expr();
            this.state = 537;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 41) {
                {
                {
                this.state = 533;
                this.match(PineV5Parser.AND);
                this.state = 534;
                this.eq_expr();
                }
                }
                this.state = 539;
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
        this.enterRule(localContext, 110, PineV5Parser.RULE_eq_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 540;
            this.cmp_expr();
            this.state = 545;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 46 || _la === 47) {
                {
                {
                this.state = 541;
                _la = this.tokenStream.LA(1);
                if(!(_la === 46 || _la === 47)) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                this.state = 542;
                this.cmp_expr();
                }
                }
                this.state = 547;
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
        this.enterRule(localContext, 112, PineV5Parser.RULE_cmp_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 548;
            this.add_expr();
            this.state = 553;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (((((_la - 48)) & ~0x1F) === 0 && ((1 << (_la - 48)) & 15) !== 0)) {
                {
                {
                this.state = 549;
                _la = this.tokenStream.LA(1);
                if(!(((((_la - 48)) & ~0x1F) === 0 && ((1 << (_la - 48)) & 15) !== 0))) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                this.state = 550;
                this.add_expr();
                }
                }
                this.state = 555;
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
        this.enterRule(localContext, 114, PineV5Parser.RULE_add_expr);
        let _la: number;
        try {
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 556;
            this.mult_expr();
            this.state = 561;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 62, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
                    {
                    {
                    this.state = 557;
                    _la = this.tokenStream.LA(1);
                    if(!(_la === 52 || _la === 53)) {
                    this.errorHandler.recoverInline(this);
                    }
                    else {
                        this.errorHandler.reportMatch(this);
                        this.consume();
                    }
                    this.state = 558;
                    this.mult_expr();
                    }
                    }
                }
                this.state = 563;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 62, this.context);
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
        this.enterRule(localContext, 116, PineV5Parser.RULE_mult_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 564;
            this.unary_expr();
            this.state = 569;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (((((_la - 54)) & ~0x1F) === 0 && ((1 << (_la - 54)) & 7) !== 0)) {
                {
                {
                this.state = 565;
                _la = this.tokenStream.LA(1);
                if(!(((((_la - 54)) & ~0x1F) === 0 && ((1 << (_la - 54)) & 7) !== 0))) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                this.state = 566;
                this.unary_expr();
                }
                }
                this.state = 571;
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
        this.enterRule(localContext, 118, PineV5Parser.RULE_unary_expr);
        try {
            this.state = 579;
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
                this.state = 572;
                this.sqbr_expr();
                }
                break;
            case PineV5Parser.NOT:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 573;
                this.match(PineV5Parser.NOT);
                this.state = 574;
                this.sqbr_expr();
                }
                break;
            case PineV5Parser.PLUS:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 575;
                this.match(PineV5Parser.PLUS);
                this.state = 576;
                this.sqbr_expr();
                }
                break;
            case PineV5Parser.MINUS:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 577;
                this.match(PineV5Parser.MINUS);
                this.state = 578;
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
        this.enterRule(localContext, 120, PineV5Parser.RULE_sqbr_expr);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 581;
            this.atom();
            this.state = 586;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 65, this.context) ) {
            case 1:
                {
                this.state = 582;
                this.match(PineV5Parser.LSQBR);
                this.state = 583;
                this.arith_expr();
                this.state = 584;
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
        this.enterRule(localContext, 122, PineV5Parser.RULE_atom);
        try {
            this.state = 595;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 66, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 588;
                this.fun_call();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 589;
                this.id();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 590;
                this.literal();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 591;
                this.match(PineV5Parser.LPAR);
                this.state = 592;
                this.arith_expr();
                this.state = 593;
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
        this.enterRule(localContext, 124, PineV5Parser.RULE_fun_actual_args);
        let _la: number;
        try {
            this.state = 603;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 68, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 597;
                this.kw_args();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 598;
                this.pos_args();
                this.state = 601;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 59) {
                    {
                    this.state = 599;
                    this.match(PineV5Parser.COMMA);
                    this.state = 600;
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
        this.enterRule(localContext, 126, PineV5Parser.RULE_kw_args);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 605;
            this.kw_arg();
            this.state = 610;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 59) {
                {
                {
                this.state = 606;
                this.match(PineV5Parser.COMMA);
                this.state = 607;
                this.kw_arg();
                }
                }
                this.state = 612;
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
        this.enterRule(localContext, 128, PineV5Parser.RULE_kw_arg);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 613;
            this.id();
            this.state = 614;
            this.match(PineV5Parser.DEFINE);
            this.state = 617;
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
                this.state = 615;
                this.arith_expr();
                }
                break;
            case PineV5Parser.LSQBR:
                {
                this.state = 616;
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
        this.enterRule(localContext, 130, PineV5Parser.RULE_literal);
        try {
            this.state = 621;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV5Parser.INT_LITERAL:
            case PineV5Parser.FLOAT_LITERAL:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 619;
                this.num_literal();
                }
                break;
            case PineV5Parser.BOOL_LITERAL:
            case PineV5Parser.STR_LITERAL:
            case PineV5Parser.COLOR_LITERAL:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 620;
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
        this.enterRule(localContext, 132, PineV5Parser.RULE_num_literal);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 623;
            _la = this.tokenStream.LA(1);
            if(!(_la === 64 || _la === 65)) {
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
        this.enterRule(localContext, 134, PineV5Parser.RULE_other_literal);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 625;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 43)) & ~0x1F) === 0 && ((1 << (_la - 43)) & 25165825) !== 0))) {
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
        4,1,72,628,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,2,6,7,
        6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,2,11,7,11,2,12,7,12,2,13,7,13,
        2,14,7,14,2,15,7,15,2,16,7,16,2,17,7,17,2,18,7,18,2,19,7,19,2,20,
        7,20,2,21,7,21,2,22,7,22,2,23,7,23,2,24,7,24,2,25,7,25,2,26,7,26,
        2,27,7,27,2,28,7,28,2,29,7,29,2,30,7,30,2,31,7,31,2,32,7,32,2,33,
        7,33,2,34,7,34,2,35,7,35,2,36,7,36,2,37,7,37,2,38,7,38,2,39,7,39,
        2,40,7,40,2,41,7,41,2,42,7,42,2,43,7,43,2,44,7,44,2,45,7,45,2,46,
        7,46,2,47,7,47,2,48,7,48,2,49,7,49,2,50,7,50,2,51,7,51,2,52,7,52,
        2,53,7,53,2,54,7,54,2,55,7,55,2,56,7,56,2,57,7,57,2,58,7,58,2,59,
        7,59,2,60,7,60,2,61,7,61,2,62,7,62,2,63,7,63,2,64,7,64,2,65,7,65,
        2,66,7,66,2,67,7,67,1,0,1,0,1,0,1,0,1,1,1,1,3,1,143,8,1,1,1,1,1,
        1,2,1,2,1,2,4,2,150,8,2,11,2,12,2,151,1,2,1,2,1,3,3,3,157,8,3,1,
        3,1,3,1,3,3,3,162,8,3,1,4,1,4,3,4,166,8,4,1,4,3,4,169,8,4,1,5,1,
        5,1,5,1,5,1,6,1,6,1,6,4,6,178,8,6,11,6,12,6,179,1,6,1,6,1,7,3,7,
        185,8,7,1,7,1,7,1,7,1,7,3,7,191,8,7,1,8,1,8,1,8,1,9,1,9,1,9,1,9,
        3,9,200,8,9,1,10,1,10,1,10,1,10,3,10,206,8,10,1,11,1,11,1,11,1,11,
        1,11,3,11,213,8,11,5,11,215,8,11,10,11,12,11,218,9,11,1,12,3,12,
        221,8,12,1,12,3,12,224,8,12,1,12,1,12,1,12,3,12,229,8,12,1,13,1,
        13,1,13,1,13,5,13,235,8,13,10,13,12,13,238,9,13,1,13,1,13,1,14,1,
        14,3,14,244,8,14,1,15,1,15,1,15,3,15,249,8,15,1,15,1,15,1,15,1,15,
        1,16,1,16,1,16,3,16,258,8,16,1,16,1,16,3,16,262,8,16,1,16,1,16,1,
        17,1,17,3,17,268,8,17,1,17,1,17,3,17,272,8,17,1,17,1,17,5,17,276,
        8,17,10,17,12,17,279,9,17,1,18,1,18,1,18,1,18,1,18,1,18,1,18,3,18,
        288,8,18,5,18,290,8,18,10,18,12,18,293,9,18,1,19,1,19,1,19,1,19,
        1,19,1,19,3,19,301,8,19,1,20,1,20,1,20,1,20,5,20,307,8,20,10,20,
        12,20,310,9,20,3,20,312,8,20,1,20,1,20,1,21,3,21,317,8,21,1,21,3,
        21,320,8,21,1,21,3,21,323,8,21,1,21,1,21,1,21,1,21,1,22,3,22,330,
        8,22,1,22,3,22,333,8,22,1,22,3,22,336,8,22,1,22,1,22,1,22,1,22,1,
        23,1,23,1,24,1,24,1,24,1,24,1,24,1,24,1,24,1,24,1,24,1,24,1,24,1,
        24,3,24,356,8,24,1,25,1,25,1,25,1,25,1,25,1,25,1,25,1,25,3,25,366,
        8,25,1,26,1,26,1,26,1,26,1,26,3,26,373,8,26,1,27,1,27,1,28,1,28,
        1,29,1,29,1,30,1,30,1,31,1,31,1,31,3,31,386,8,31,1,31,1,31,1,32,
        1,32,1,32,1,32,5,32,394,8,32,10,32,12,32,397,9,32,1,32,1,32,1,32,
        3,32,402,8,32,3,32,404,8,32,1,33,1,33,3,33,408,8,33,1,34,1,34,1,
        34,5,34,413,8,34,10,34,12,34,416,9,34,1,35,1,35,5,35,420,8,35,10,
        35,12,35,423,9,35,1,35,1,35,1,36,1,36,1,36,5,36,430,8,36,10,36,12,
        36,433,9,36,1,37,1,37,3,37,437,8,37,1,38,1,38,1,38,1,38,1,38,1,39,
        1,39,1,39,1,39,1,39,1,40,1,40,1,41,1,41,1,41,5,41,454,8,41,10,41,
        12,41,457,9,41,1,42,1,42,1,43,1,43,1,44,1,44,1,45,1,45,1,45,1,45,
        1,46,1,46,4,46,471,8,46,11,46,12,46,472,1,47,1,47,1,47,5,47,478,
        8,47,10,47,12,47,481,9,47,1,48,1,48,1,48,1,48,5,48,487,8,48,10,48,
        12,48,490,9,48,1,48,1,48,1,49,1,49,1,49,1,49,5,49,498,8,49,10,49,
        12,49,501,9,49,1,49,1,49,1,50,1,50,1,50,1,50,1,50,1,50,3,50,511,
        8,50,1,50,1,50,1,51,1,51,1,52,1,52,1,52,1,52,1,52,1,52,3,52,523,
        8,52,1,53,1,53,1,53,5,53,528,8,53,10,53,12,53,531,9,53,1,54,1,54,
        1,54,5,54,536,8,54,10,54,12,54,539,9,54,1,55,1,55,1,55,5,55,544,
        8,55,10,55,12,55,547,9,55,1,56,1,56,1,56,5,56,552,8,56,10,56,12,
        56,555,9,56,1,57,1,57,1,57,5,57,560,8,57,10,57,12,57,563,9,57,1,
        58,1,58,1,58,5,58,568,8,58,10,58,12,58,571,9,58,1,59,1,59,1,59,1,
        59,1,59,1,59,1,59,3,59,580,8,59,1,60,1,60,1,60,1,60,1,60,3,60,587,
        8,60,1,61,1,61,1,61,1,61,1,61,1,61,1,61,3,61,596,8,61,1,62,1,62,
        1,62,1,62,3,62,602,8,62,3,62,604,8,62,1,63,1,63,1,63,5,63,609,8,
        63,10,63,12,63,612,9,63,1,64,1,64,1,64,1,64,3,64,618,8,64,1,65,1,
        65,3,65,622,8,65,1,66,1,66,1,67,1,67,1,67,0,0,68,0,2,4,6,8,10,12,
        14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44,46,48,50,52,54,56,
        58,60,62,64,66,68,70,72,74,76,78,80,82,84,86,88,90,92,94,96,98,100,
        102,104,106,108,110,112,114,116,118,120,122,124,126,128,130,132,
        134,0,11,3,0,10,10,14,25,68,68,1,0,12,13,1,0,14,16,1,0,17,25,1,0,
        26,30,1,0,46,47,1,0,48,51,1,0,52,53,1,0,54,56,1,0,64,65,2,0,43,43,
        66,67,663,0,136,1,0,0,0,2,140,1,0,0,0,4,146,1,0,0,0,6,156,1,0,0,
        0,8,165,1,0,0,0,10,170,1,0,0,0,12,174,1,0,0,0,14,184,1,0,0,0,16,
        192,1,0,0,0,18,195,1,0,0,0,20,201,1,0,0,0,22,207,1,0,0,0,24,220,
        1,0,0,0,26,230,1,0,0,0,28,243,1,0,0,0,30,245,1,0,0,0,32,254,1,0,
        0,0,34,265,1,0,0,0,36,280,1,0,0,0,38,300,1,0,0,0,40,302,1,0,0,0,
        42,316,1,0,0,0,44,329,1,0,0,0,46,341,1,0,0,0,48,355,1,0,0,0,50,365,
        1,0,0,0,52,372,1,0,0,0,54,374,1,0,0,0,56,376,1,0,0,0,58,378,1,0,
        0,0,60,380,1,0,0,0,62,382,1,0,0,0,64,389,1,0,0,0,66,407,1,0,0,0,
        68,409,1,0,0,0,70,421,1,0,0,0,72,426,1,0,0,0,74,436,1,0,0,0,76,438,
        1,0,0,0,78,443,1,0,0,0,80,448,1,0,0,0,82,450,1,0,0,0,84,458,1,0,
        0,0,86,460,1,0,0,0,88,462,1,0,0,0,90,464,1,0,0,0,92,470,1,0,0,0,
        94,474,1,0,0,0,96,482,1,0,0,0,98,493,1,0,0,0,100,504,1,0,0,0,102,
        514,1,0,0,0,104,516,1,0,0,0,106,524,1,0,0,0,108,532,1,0,0,0,110,
        540,1,0,0,0,112,548,1,0,0,0,114,556,1,0,0,0,116,564,1,0,0,0,118,
        579,1,0,0,0,120,581,1,0,0,0,122,595,1,0,0,0,124,603,1,0,0,0,126,
        605,1,0,0,0,128,613,1,0,0,0,130,621,1,0,0,0,132,623,1,0,0,0,134,
        625,1,0,0,0,136,137,5,4,0,0,137,138,3,104,52,0,138,139,3,102,51,
        0,139,1,1,0,0,0,140,142,5,5,0,0,141,143,3,104,52,0,142,141,1,0,0,
        0,142,143,1,0,0,0,143,144,1,0,0,0,144,145,3,4,2,0,145,3,1,0,0,0,
        146,149,5,1,0,0,147,150,3,6,3,0,148,150,5,3,0,0,149,147,1,0,0,0,
        149,148,1,0,0,0,150,151,1,0,0,0,151,149,1,0,0,0,151,152,1,0,0,0,
        152,153,1,0,0,0,153,154,5,2,0,0,154,5,1,0,0,0,155,157,3,104,52,0,
        156,155,1,0,0,0,156,157,1,0,0,0,157,158,1,0,0,0,158,161,5,58,0,0,
        159,162,3,82,41,0,160,162,3,102,51,0,161,159,1,0,0,0,161,160,1,0,
        0,0,162,7,1,0,0,0,163,166,3,58,29,0,164,166,3,36,18,0,165,163,1,
        0,0,0,165,164,1,0,0,0,166,168,1,0,0,0,167,169,3,26,13,0,168,167,
        1,0,0,0,168,169,1,0,0,0,169,9,1,0,0,0,170,171,5,6,0,0,171,172,3,
        36,18,0,172,173,3,12,6,0,173,11,1,0,0,0,174,177,5,1,0,0,175,178,
        3,14,7,0,176,178,5,3,0,0,177,175,1,0,0,0,177,176,1,0,0,0,178,179,
        1,0,0,0,179,177,1,0,0,0,179,180,1,0,0,0,180,181,1,0,0,0,181,182,
        5,2,0,0,182,13,1,0,0,0,183,185,3,56,28,0,184,183,1,0,0,0,184,185,
        1,0,0,0,185,186,1,0,0,0,186,187,3,8,4,0,187,190,3,36,18,0,188,189,
        5,57,0,0,189,191,3,52,26,0,190,188,1,0,0,0,190,191,1,0,0,0,191,15,
        1,0,0,0,192,193,5,7,0,0,193,194,3,74,37,0,194,17,1,0,0,0,195,199,
        5,9,0,0,196,200,3,10,5,0,197,200,3,16,8,0,198,200,3,74,37,0,199,
        196,1,0,0,0,199,197,1,0,0,0,199,198,1,0,0,0,200,19,1,0,0,0,201,202,
        5,8,0,0,202,205,3,22,11,0,203,204,5,10,0,0,204,206,3,36,18,0,205,
        203,1,0,0,0,205,206,1,0,0,0,206,21,1,0,0,0,207,216,3,36,18,0,208,
        212,5,55,0,0,209,213,3,36,18,0,210,213,5,64,0,0,211,213,5,65,0,0,
        212,209,1,0,0,0,212,210,1,0,0,0,212,211,1,0,0,0,213,215,1,0,0,0,
        214,208,1,0,0,0,215,218,1,0,0,0,216,214,1,0,0,0,216,217,1,0,0,0,
        217,23,1,0,0,0,218,216,1,0,0,0,219,221,3,56,28,0,220,219,1,0,0,0,
        220,221,1,0,0,0,221,223,1,0,0,0,222,224,3,8,4,0,223,222,1,0,0,0,
        223,224,1,0,0,0,224,225,1,0,0,0,225,228,3,36,18,0,226,227,5,57,0,
        0,227,229,3,52,26,0,228,226,1,0,0,0,228,229,1,0,0,0,229,25,1,0,0,
        0,230,231,5,50,0,0,231,236,3,28,14,0,232,233,5,59,0,0,233,235,3,
        28,14,0,234,232,1,0,0,0,235,238,1,0,0,0,236,234,1,0,0,0,236,237,
        1,0,0,0,237,239,1,0,0,0,238,236,1,0,0,0,239,240,5,48,0,0,240,27,
        1,0,0,0,241,244,3,58,29,0,242,244,3,36,18,0,243,241,1,0,0,0,243,
        242,1,0,0,0,244,29,1,0,0,0,245,248,5,35,0,0,246,249,3,96,48,0,247,
        249,3,36,18,0,248,246,1,0,0,0,248,247,1,0,0,0,249,250,1,0,0,0,250,
        251,5,11,0,0,251,252,3,104,52,0,252,253,3,102,51,0,253,31,1,0,0,
        0,254,255,5,72,0,0,255,257,3,36,18,0,256,258,3,26,13,0,257,256,1,
        0,0,0,257,258,1,0,0,0,258,259,1,0,0,0,259,261,5,60,0,0,260,262,3,
        124,62,0,261,260,1,0,0,0,261,262,1,0,0,0,262,263,1,0,0,0,263,264,
        5,61,0,0,264,33,1,0,0,0,265,267,3,36,18,0,266,268,3,26,13,0,267,
        266,1,0,0,0,267,268,1,0,0,0,268,269,1,0,0,0,269,271,5,60,0,0,270,
        272,3,124,62,0,271,270,1,0,0,0,271,272,1,0,0,0,272,273,1,0,0,0,273,
        277,5,61,0,0,274,276,3,32,16,0,275,274,1,0,0,0,276,279,1,0,0,0,277,
        275,1,0,0,0,277,278,1,0,0,0,278,35,1,0,0,0,279,277,1,0,0,0,280,291,
        3,46,23,0,281,287,5,72,0,0,282,288,3,46,23,0,283,288,5,6,0,0,284,
        288,5,7,0,0,285,288,5,8,0,0,286,288,5,9,0,0,287,282,1,0,0,0,287,
        283,1,0,0,0,287,284,1,0,0,0,287,285,1,0,0,0,287,286,1,0,0,0,288,
        290,1,0,0,0,289,281,1,0,0,0,290,293,1,0,0,0,291,289,1,0,0,0,291,
        292,1,0,0,0,292,37,1,0,0,0,293,291,1,0,0,0,294,301,3,20,10,0,295,
        301,3,18,9,0,296,301,3,10,5,0,297,301,3,16,8,0,298,301,3,74,37,0,
        299,301,3,72,36,0,300,294,1,0,0,0,300,295,1,0,0,0,300,296,1,0,0,
        0,300,297,1,0,0,0,300,298,1,0,0,0,300,299,1,0,0,0,301,39,1,0,0,0,
        302,311,5,60,0,0,303,308,3,24,12,0,304,305,5,59,0,0,305,307,3,24,
        12,0,306,304,1,0,0,0,307,310,1,0,0,0,308,306,1,0,0,0,308,309,1,0,
        0,0,309,312,1,0,0,0,310,308,1,0,0,0,311,303,1,0,0,0,311,312,1,0,
        0,0,312,313,1,0,0,0,313,314,5,61,0,0,314,41,1,0,0,0,315,317,3,54,
        27,0,316,315,1,0,0,0,316,317,1,0,0,0,317,319,1,0,0,0,318,320,3,56,
        28,0,319,318,1,0,0,0,319,320,1,0,0,0,320,322,1,0,0,0,321,323,3,8,
        4,0,322,321,1,0,0,0,322,323,1,0,0,0,323,324,1,0,0,0,324,325,3,36,
        18,0,325,326,5,57,0,0,326,327,3,52,26,0,327,43,1,0,0,0,328,330,3,
        54,27,0,329,328,1,0,0,0,329,330,1,0,0,0,330,332,1,0,0,0,331,333,
        3,56,28,0,332,331,1,0,0,0,332,333,1,0,0,0,333,335,1,0,0,0,334,336,
        3,8,4,0,335,334,1,0,0,0,335,336,1,0,0,0,336,337,1,0,0,0,337,338,
        3,96,48,0,338,339,5,57,0,0,339,340,3,52,26,0,340,45,1,0,0,0,341,
        342,7,0,0,0,342,47,1,0,0,0,343,356,3,42,21,0,344,356,3,44,22,0,345,
        356,3,34,17,0,346,356,3,64,32,0,347,356,3,62,31,0,348,356,3,100,
        50,0,349,356,3,30,15,0,350,356,3,0,0,0,351,356,3,2,1,0,352,356,3,
        84,42,0,353,356,3,86,43,0,354,356,3,52,26,0,355,343,1,0,0,0,355,
        344,1,0,0,0,355,345,1,0,0,0,355,346,1,0,0,0,355,347,1,0,0,0,355,
        348,1,0,0,0,355,349,1,0,0,0,355,350,1,0,0,0,355,351,1,0,0,0,355,
        352,1,0,0,0,355,353,1,0,0,0,355,354,1,0,0,0,356,49,1,0,0,0,357,366,
        3,42,21,0,358,366,3,44,22,0,359,366,3,52,26,0,360,366,3,98,49,0,
        361,366,3,62,31,0,362,366,3,0,0,0,363,366,3,84,42,0,364,366,3,86,
        43,0,365,357,1,0,0,0,365,358,1,0,0,0,365,359,1,0,0,0,365,360,1,0,
        0,0,365,361,1,0,0,0,365,362,1,0,0,0,365,363,1,0,0,0,365,364,1,0,
        0,0,366,51,1,0,0,0,367,373,3,104,52,0,368,373,3,64,32,0,369,373,
        3,100,50,0,370,373,3,30,15,0,371,373,3,2,1,0,372,367,1,0,0,0,372,
        368,1,0,0,0,372,369,1,0,0,0,372,370,1,0,0,0,372,371,1,0,0,0,373,
        53,1,0,0,0,374,375,7,1,0,0,375,55,1,0,0,0,376,377,7,2,0,0,377,57,
        1,0,0,0,378,379,7,3,0,0,379,59,1,0,0,0,380,381,7,4,0,0,381,61,1,
        0,0,0,382,385,3,36,18,0,383,386,5,31,0,0,384,386,3,60,30,0,385,383,
        1,0,0,0,385,384,1,0,0,0,386,387,1,0,0,0,387,388,3,52,26,0,388,63,
        1,0,0,0,389,390,5,33,0,0,390,391,3,104,52,0,391,403,3,102,51,0,392,
        394,5,3,0,0,393,392,1,0,0,0,394,397,1,0,0,0,395,393,1,0,0,0,395,
        396,1,0,0,0,396,398,1,0,0,0,397,395,1,0,0,0,398,401,5,34,0,0,399,
        402,3,64,32,0,400,402,3,102,51,0,401,399,1,0,0,0,401,400,1,0,0,0,
        402,404,1,0,0,0,403,395,1,0,0,0,403,404,1,0,0,0,404,65,1,0,0,0,405,
        408,3,52,26,0,406,408,3,98,49,0,407,405,1,0,0,0,407,406,1,0,0,0,
        408,67,1,0,0,0,409,414,3,66,33,0,410,411,5,59,0,0,411,413,3,66,33,
        0,412,410,1,0,0,0,413,416,1,0,0,0,414,412,1,0,0,0,414,415,1,0,0,
        0,415,69,1,0,0,0,416,414,1,0,0,0,417,420,3,38,19,0,418,420,5,3,0,
        0,419,417,1,0,0,0,419,418,1,0,0,0,420,423,1,0,0,0,421,419,1,0,0,
        0,421,422,1,0,0,0,422,424,1,0,0,0,423,421,1,0,0,0,424,425,5,0,0,
        1,425,71,1,0,0,0,426,431,3,48,24,0,427,428,5,59,0,0,428,430,3,48,
        24,0,429,427,1,0,0,0,430,433,1,0,0,0,431,429,1,0,0,0,431,432,1,0,
        0,0,432,73,1,0,0,0,433,431,1,0,0,0,434,437,3,76,38,0,435,437,3,78,
        39,0,436,434,1,0,0,0,436,435,1,0,0,0,437,75,1,0,0,0,438,439,3,36,
        18,0,439,440,3,40,20,0,440,441,5,58,0,0,441,442,3,80,40,0,442,77,
        1,0,0,0,443,444,3,36,18,0,444,445,3,40,20,0,445,446,5,58,0,0,446,
        447,3,88,44,0,447,79,1,0,0,0,448,449,3,82,41,0,449,81,1,0,0,0,450,
        455,3,50,25,0,451,452,5,59,0,0,452,454,3,50,25,0,453,451,1,0,0,0,
        454,457,1,0,0,0,455,453,1,0,0,0,455,456,1,0,0,0,456,83,1,0,0,0,457,
        455,1,0,0,0,458,459,5,38,0,0,459,85,1,0,0,0,460,461,5,39,0,0,461,
        87,1,0,0,0,462,463,3,90,45,0,463,89,1,0,0,0,464,465,5,1,0,0,465,
        466,3,92,46,0,466,467,5,2,0,0,467,91,1,0,0,0,468,471,3,94,47,0,469,
        471,5,3,0,0,470,468,1,0,0,0,470,469,1,0,0,0,471,472,1,0,0,0,472,
        470,1,0,0,0,472,473,1,0,0,0,473,93,1,0,0,0,474,479,3,50,25,0,475,
        476,5,59,0,0,476,478,3,50,25,0,477,475,1,0,0,0,478,481,1,0,0,0,479,
        477,1,0,0,0,479,480,1,0,0,0,480,95,1,0,0,0,481,479,1,0,0,0,482,483,
        5,62,0,0,483,488,3,36,18,0,484,485,5,59,0,0,485,487,3,36,18,0,486,
        484,1,0,0,0,487,490,1,0,0,0,488,486,1,0,0,0,488,489,1,0,0,0,489,
        491,1,0,0,0,490,488,1,0,0,0,491,492,5,63,0,0,492,97,1,0,0,0,493,
        494,5,62,0,0,494,499,3,52,26,0,495,496,5,59,0,0,496,498,3,52,26,
        0,497,495,1,0,0,0,498,501,1,0,0,0,499,497,1,0,0,0,499,500,1,0,0,
        0,500,502,1,0,0,0,501,499,1,0,0,0,502,503,5,63,0,0,503,99,1,0,0,
        0,504,505,5,35,0,0,505,506,3,42,21,0,506,507,5,36,0,0,507,510,3,
        104,52,0,508,509,5,37,0,0,509,511,3,104,52,0,510,508,1,0,0,0,510,
        511,1,0,0,0,511,512,1,0,0,0,512,513,3,102,51,0,513,101,1,0,0,0,514,
        515,3,88,44,0,515,103,1,0,0,0,516,522,3,106,53,0,517,518,5,44,0,
        0,518,519,3,104,52,0,519,520,5,45,0,0,520,521,3,104,52,0,521,523,
        1,0,0,0,522,517,1,0,0,0,522,523,1,0,0,0,523,105,1,0,0,0,524,529,
        3,108,54,0,525,526,5,40,0,0,526,528,3,108,54,0,527,525,1,0,0,0,528,
        531,1,0,0,0,529,527,1,0,0,0,529,530,1,0,0,0,530,107,1,0,0,0,531,
        529,1,0,0,0,532,537,3,110,55,0,533,534,5,41,0,0,534,536,3,110,55,
        0,535,533,1,0,0,0,536,539,1,0,0,0,537,535,1,0,0,0,537,538,1,0,0,
        0,538,109,1,0,0,0,539,537,1,0,0,0,540,545,3,112,56,0,541,542,7,5,
        0,0,542,544,3,112,56,0,543,541,1,0,0,0,544,547,1,0,0,0,545,543,1,
        0,0,0,545,546,1,0,0,0,546,111,1,0,0,0,547,545,1,0,0,0,548,553,3,
        114,57,0,549,550,7,6,0,0,550,552,3,114,57,0,551,549,1,0,0,0,552,
        555,1,0,0,0,553,551,1,0,0,0,553,554,1,0,0,0,554,113,1,0,0,0,555,
        553,1,0,0,0,556,561,3,116,58,0,557,558,7,7,0,0,558,560,3,116,58,
        0,559,557,1,0,0,0,560,563,1,0,0,0,561,559,1,0,0,0,561,562,1,0,0,
        0,562,115,1,0,0,0,563,561,1,0,0,0,564,569,3,118,59,0,565,566,7,8,
        0,0,566,568,3,118,59,0,567,565,1,0,0,0,568,571,1,0,0,0,569,567,1,
        0,0,0,569,570,1,0,0,0,570,117,1,0,0,0,571,569,1,0,0,0,572,580,3,
        120,60,0,573,574,5,42,0,0,574,580,3,120,60,0,575,576,5,52,0,0,576,
        580,3,120,60,0,577,578,5,53,0,0,578,580,3,120,60,0,579,572,1,0,0,
        0,579,573,1,0,0,0,579,575,1,0,0,0,579,577,1,0,0,0,580,119,1,0,0,
        0,581,586,3,122,61,0,582,583,5,62,0,0,583,584,3,52,26,0,584,585,
        5,63,0,0,585,587,1,0,0,0,586,582,1,0,0,0,586,587,1,0,0,0,587,121,
        1,0,0,0,588,596,3,34,17,0,589,596,3,36,18,0,590,596,3,130,65,0,591,
        592,5,60,0,0,592,593,3,52,26,0,593,594,5,61,0,0,594,596,1,0,0,0,
        595,588,1,0,0,0,595,589,1,0,0,0,595,590,1,0,0,0,595,591,1,0,0,0,
        596,123,1,0,0,0,597,604,3,126,63,0,598,601,3,68,34,0,599,600,5,59,
        0,0,600,602,3,126,63,0,601,599,1,0,0,0,601,602,1,0,0,0,602,604,1,
        0,0,0,603,597,1,0,0,0,603,598,1,0,0,0,604,125,1,0,0,0,605,610,3,
        128,64,0,606,607,5,59,0,0,607,609,3,128,64,0,608,606,1,0,0,0,609,
        612,1,0,0,0,610,608,1,0,0,0,610,611,1,0,0,0,611,127,1,0,0,0,612,
        610,1,0,0,0,613,614,3,36,18,0,614,617,5,57,0,0,615,618,3,52,26,0,
        616,618,3,98,49,0,617,615,1,0,0,0,617,616,1,0,0,0,618,129,1,0,0,
        0,619,622,3,132,66,0,620,622,3,134,67,0,621,619,1,0,0,0,621,620,
        1,0,0,0,622,131,1,0,0,0,623,624,7,9,0,0,624,133,1,0,0,0,625,626,
        7,10,0,0,626,135,1,0,0,0,72,142,149,151,156,161,165,168,177,179,
        184,190,199,205,212,216,220,223,228,236,243,248,257,261,267,271,
        277,287,291,300,308,311,316,319,322,329,332,335,355,365,372,385,
        395,401,403,407,414,419,421,431,436,455,470,472,479,488,499,510,
        522,529,537,545,553,561,569,579,586,595,601,603,610,617,621
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
