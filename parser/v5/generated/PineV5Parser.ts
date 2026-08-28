
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
    public static readonly PLUS_ASSIGN = 25;
    public static readonly MINUS_ASSIGN = 26;
    public static readonly MUL_ASSIGN = 27;
    public static readonly DIV_ASSIGN = 28;
    public static readonly MOD_ASSIGN = 29;
    public static readonly ASSIGN = 30;
    public static readonly LBEG = 31;
    public static readonly IF_COND = 32;
    public static readonly IF_COND_ELSE = 33;
    public static readonly FOR_STMT = 34;
    public static readonly FOR_STMT_TO = 35;
    public static readonly FOR_STMT_BY = 36;
    public static readonly BREAK = 37;
    public static readonly CONTINUE = 38;
    public static readonly OR = 39;
    public static readonly AND = 40;
    public static readonly NOT = 41;
    public static readonly BOOL_LITERAL = 42;
    public static readonly COND = 43;
    public static readonly COND_ELSE = 44;
    public static readonly EQ = 45;
    public static readonly NEQ = 46;
    public static readonly GT = 47;
    public static readonly GE = 48;
    public static readonly LT = 49;
    public static readonly LE = 50;
    public static readonly PLUS = 51;
    public static readonly MINUS = 52;
    public static readonly MUL = 53;
    public static readonly DIV = 54;
    public static readonly MOD = 55;
    public static readonly DEFINE = 56;
    public static readonly ARROW = 57;
    public static readonly COMMA = 58;
    public static readonly LPAR = 59;
    public static readonly RPAR = 60;
    public static readonly LSQBR = 61;
    public static readonly RSQBR = 62;
    public static readonly INT_LITERAL = 63;
    public static readonly FLOAT_LITERAL = 64;
    public static readonly STR_LITERAL = 65;
    public static readonly COLOR_LITERAL = 66;
    public static readonly ID = 67;
    public static readonly WS = 68;
    public static readonly LINE_COMMENT = 69;
    public static readonly BLOCK_COMMENT = 70;
    public static readonly DOT = 71;
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
    public static readonly RULE_compound_assign_op = 28;
    public static readonly RULE_var_assign = 29;
    public static readonly RULE_pine_script = 30;
    public static readonly RULE_global_stmt = 31;
    public static readonly RULE_fun_def_stmt = 32;
    public static readonly RULE_fun_def_singleline = 33;
    public static readonly RULE_fun_def_multiline = 34;
    public static readonly RULE_fun_body_singleline = 35;
    public static readonly RULE_local_stmt_singleline = 36;
    public static readonly RULE_loop_break = 37;
    public static readonly RULE_loop_continue = 38;
    public static readonly RULE_fun_body_multiline = 39;
    public static readonly RULE_local_stmts_multiline = 40;
    public static readonly RULE_local_stmts_list = 41;
    public static readonly RULE_local_stmt_multiline = 42;
    public static readonly RULE_ids_array = 43;
    public static readonly RULE_arith_exprs = 44;
    public static readonly RULE_if_expr = 45;
    public static readonly RULE_for_expr = 46;
    public static readonly RULE_stmts_block = 47;
    public static readonly RULE_ternary_expr = 48;
    public static readonly RULE_or_expr = 49;
    public static readonly RULE_and_expr = 50;
    public static readonly RULE_eq_expr = 51;
    public static readonly RULE_cmp_expr = 52;
    public static readonly RULE_add_expr = 53;
    public static readonly RULE_mult_expr = 54;
    public static readonly RULE_unary_expr = 55;
    public static readonly RULE_sqbr_expr = 56;
    public static readonly RULE_atom = 57;
    public static readonly RULE_fun_actual_args = 58;
    public static readonly RULE_pos_args = 59;
    public static readonly RULE_kw_args = 60;
    public static readonly RULE_kw_arg = 61;
    public static readonly RULE_literal = 62;
    public static readonly RULE_num_literal = 63;
    public static readonly RULE_other_literal = 64;

    public static readonly literalNames = [
        null, null, null, null, "'while'", "'switch'", "'type'", "'method'", 
        "'import'", "'export'", "'as'", "'var'", "'varip'", "'series'", 
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
        "IMPORT", "EXPORT", "AS", "VAR", "VARIP", "SERIES", "SIMPLE", "CONST", 
        "INT_TYPE", "FLOAT_TYPE", "BOOL_TYPE", "STRING_TYPE", "COLOR_TYPE", 
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
        "fun_call", "stmt", "fun_head", "var_def", "var_defs", "id_part", 
        "global_stmt_content", "local_stmt_content", "arith_expr", "decl_mod", 
        "type_qual", "type_name", "id", "compound_assign_op", "var_assign", 
        "pine_script", "global_stmt", "fun_def_stmt", "fun_def_singleline", 
        "fun_def_multiline", "fun_body_singleline", "local_stmt_singleline", 
        "loop_break", "loop_continue", "fun_body_multiline", "local_stmts_multiline", 
        "local_stmts_list", "local_stmt_multiline", "ids_array", "arith_exprs", 
        "if_expr", "for_expr", "stmts_block", "ternary_expr", "or_expr", 
        "and_expr", "eq_expr", "cmp_expr", "add_expr", "mult_expr", "unary_expr", 
        "sqbr_expr", "atom", "fun_actual_args", "pos_args", "kw_args", "kw_arg", 
        "literal", "num_literal", "other_literal",
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
            this.state = 130;
            this.match(PineV5Parser.WHILE);
            this.state = 131;
            this.ternary_expr();
            this.state = 132;
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
            this.state = 134;
            this.match(PineV5Parser.SWITCH);
            this.state = 136;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 33547264) !== 0) || ((((_la - 41)) & ~0x1F) === 0 && ((1 << (_la - 41)) & 130288643) !== 0)) {
                {
                this.state = 135;
                this.ternary_expr();
                }
            }

            this.state = 138;
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
            this.state = 140;
            this.match(PineV5Parser.BEGIN);
            this.state = 143;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                this.state = 143;
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
                    this.state = 141;
                    this.switch_case();
                    }
                    break;
                case PineV5Parser.LEND:
                    {
                    this.state = 142;
                    this.match(PineV5Parser.LEND);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                this.state = 145;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 33547272) !== 0) || ((((_la - 41)) & ~0x1F) === 0 && ((1 << (_la - 41)) & 130354179) !== 0));
            this.state = 147;
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
            this.state = 150;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 33547264) !== 0) || ((((_la - 41)) & ~0x1F) === 0 && ((1 << (_la - 41)) & 130288643) !== 0)) {
                {
                this.state = 149;
                this.ternary_expr();
                }
            }

            this.state = 152;
            this.match(PineV5Parser.ARROW);
            this.state = 155;
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
                this.state = 153;
                this.local_stmt_singleline();
                }
                break;
            case PineV5Parser.BEGIN:
                {
                this.state = 154;
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
            this.state = 159;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 5, this.context) ) {
            case 1:
                {
                this.state = 157;
                this.type_name();
                }
                break;
            case 2:
                {
                this.state = 158;
                this.id();
                }
                break;
            }
            this.state = 162;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 49) {
                {
                this.state = 161;
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
            this.state = 164;
            this.match(PineV5Parser.TYPE);
            this.state = 165;
            this.id();
            this.state = 166;
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
            this.state = 168;
            this.match(PineV5Parser.BEGIN);
            this.state = 171;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                this.state = 171;
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
                    this.state = 169;
                    this.type_field();
                    }
                    break;
                case PineV5Parser.LEND:
                    {
                    this.state = 170;
                    this.match(PineV5Parser.LEND);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                this.state = 173;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 33547272) !== 0) || _la === 67);
            this.state = 175;
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
            this.state = 178;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 9, this.context) ) {
            case 1:
                {
                this.state = 177;
                this.type_qual();
                }
                break;
            }
            this.state = 180;
            this.field_type();
            this.state = 181;
            this.id();
            this.state = 184;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 56) {
                {
                this.state = 182;
                this.match(PineV5Parser.DEFINE);
                this.state = 183;
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
            this.state = 186;
            this.match(PineV5Parser.METHOD);
            this.state = 187;
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
            this.state = 189;
            this.match(PineV5Parser.EXPORT);
            this.state = 193;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV5Parser.TYPE:
                {
                this.state = 190;
                this.type_def_stmt();
                }
                break;
            case PineV5Parser.METHOD:
                {
                this.state = 191;
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
                this.state = 192;
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
            this.state = 195;
            this.match(PineV5Parser.IMPORT);
            this.state = 196;
            this.import_path();
            this.state = 199;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 12, this.context) ) {
            case 1:
                {
                this.state = 197;
                this.match(PineV5Parser.AS);
                this.state = 198;
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
            this.state = 201;
            this.id();
            this.state = 210;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 54) {
                {
                {
                this.state = 202;
                this.match(PineV5Parser.DIV);
                this.state = 206;
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
                    this.state = 203;
                    this.id();
                    }
                    break;
                case PineV5Parser.INT_LITERAL:
                    {
                    this.state = 204;
                    this.match(PineV5Parser.INT_LITERAL);
                    }
                    break;
                case PineV5Parser.FLOAT_LITERAL:
                    {
                    this.state = 205;
                    this.match(PineV5Parser.FLOAT_LITERAL);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                }
                this.state = 212;
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
            this.state = 214;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 15, this.context) ) {
            case 1:
                {
                this.state = 213;
                this.type_qual();
                }
                break;
            }
            this.state = 217;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 16, this.context) ) {
            case 1:
                {
                this.state = 216;
                this.field_type();
                }
                break;
            }
            this.state = 219;
            this.id();
            this.state = 222;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 56) {
                {
                this.state = 220;
                this.match(PineV5Parser.DEFINE);
                this.state = 221;
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
            this.state = 224;
            this.match(PineV5Parser.LT);
            this.state = 225;
            this.type_arg();
            this.state = 230;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 58) {
                {
                {
                this.state = 226;
                this.match(PineV5Parser.COMMA);
                this.state = 227;
                this.type_arg();
                }
                }
                this.state = 232;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 233;
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
            this.state = 237;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 19, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 235;
                this.type_name();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 236;
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
            this.state = 239;
            this.id();
            this.state = 241;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 49) {
                {
                this.state = 240;
                this.type_args();
                }
            }

            this.state = 243;
            this.match(PineV5Parser.LPAR);
            this.state = 245;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (((((_la - 5)) & ~0x1F) === 0 && ((1 << (_la - 5)) & 672136993) !== 0) || ((((_la - 41)) & ~0x1F) === 0 && ((1 << (_la - 41)) & 130288643) !== 0)) {
                {
                this.state = 244;
                this.fun_actual_args();
                }
            }

            this.state = 247;
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
            this.state = 255;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 22, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 249;
                this.import_stmt();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 250;
                this.export_stmt();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 251;
                this.type_def_stmt();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 252;
                this.method_def_stmt();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 253;
                this.fun_def_stmt();
                }
                break;
            case 6:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 254;
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
            this.state = 257;
            this.match(PineV5Parser.LPAR);
            this.state = 266;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 33547264) !== 0) || _la === 67) {
                {
                this.state = 258;
                this.fun_param();
                this.state = 263;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 58) {
                    {
                    {
                    this.state = 259;
                    this.match(PineV5Parser.COMMA);
                    this.state = 260;
                    this.fun_param();
                    }
                    }
                    this.state = 265;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                }
            }

            this.state = 268;
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
            this.state = 271;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 11 || _la === 12) {
                {
                this.state = 270;
                this.decl_mod();
                }
            }

            this.state = 274;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 26, this.context) ) {
            case 1:
                {
                this.state = 273;
                this.type_qual();
                }
                break;
            }
            this.state = 277;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 27, this.context) ) {
            case 1:
                {
                this.state = 276;
                this.field_type();
                }
                break;
            }
            this.state = 279;
            this.id();
            this.state = 280;
            this.match(PineV5Parser.DEFINE);
            this.state = 281;
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
            this.state = 284;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 11 || _la === 12) {
                {
                this.state = 283;
                this.decl_mod();
                }
            }

            this.state = 287;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 29, this.context) ) {
            case 1:
                {
                this.state = 286;
                this.type_qual();
                }
                break;
            }
            this.state = 290;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 33547264) !== 0) || _la === 67) {
                {
                this.state = 289;
                this.field_type();
                }
            }

            this.state = 292;
            this.ids_array();
            this.state = 293;
            this.match(PineV5Parser.DEFINE);
            this.state = 294;
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
            this.state = 296;
            _la = this.tokenStream.LA(1);
            if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 33547264) !== 0) || _la === 67)) {
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
            this.state = 309;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 31, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 298;
                this.var_def();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 299;
                this.var_defs();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 300;
                this.fun_call();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 301;
                this.if_expr();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 302;
                this.var_assign();
                }
                break;
            case 6:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 303;
                this.for_expr();
                }
                break;
            case 7:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 304;
                this.while_expr();
                }
                break;
            case 8:
                this.enterOuterAlt(localContext, 8);
                {
                this.state = 305;
                this.switch_expr();
                }
                break;
            case 9:
                this.enterOuterAlt(localContext, 9);
                {
                this.state = 306;
                this.loop_break();
                }
                break;
            case 10:
                this.enterOuterAlt(localContext, 10);
                {
                this.state = 307;
                this.loop_continue();
                }
                break;
            case 11:
                this.enterOuterAlt(localContext, 11);
                {
                this.state = 308;
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
            this.state = 319;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 32, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 311;
                this.var_def();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 312;
                this.var_defs();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 313;
                this.arith_expr();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 314;
                this.arith_exprs();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 315;
                this.var_assign();
                }
                break;
            case 6:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 316;
                this.while_expr();
                }
                break;
            case 7:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 317;
                this.loop_break();
                }
                break;
            case 8:
                this.enterOuterAlt(localContext, 8);
                {
                this.state = 318;
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
            this.state = 325;
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
                this.state = 321;
                this.ternary_expr();
                }
                break;
            case PineV5Parser.IF_COND:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 322;
                this.if_expr();
                }
                break;
            case PineV5Parser.FOR_STMT:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 323;
                this.for_expr();
                }
                break;
            case PineV5Parser.SWITCH:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 324;
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
            this.state = 327;
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
            this.state = 329;
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
            this.state = 331;
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
            this.state = 333;
            this.id_part();
            this.state = 338;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 71) {
                {
                {
                this.state = 334;
                this.match(PineV5Parser.DOT);
                this.state = 335;
                this.id_part();
                }
                }
                this.state = 340;
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
    public compound_assign_op(): Compound_assign_opContext {
        let localContext = new Compound_assign_opContext(this.context, this.state);
        this.enterRule(localContext, 56, PineV5Parser.RULE_compound_assign_op);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 341;
            _la = this.tokenStream.LA(1);
            if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 1040187392) !== 0))) {
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
        this.enterRule(localContext, 58, PineV5Parser.RULE_var_assign);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 343;
            this.id();
            this.state = 346;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV5Parser.ASSIGN:
                {
                this.state = 344;
                this.match(PineV5Parser.ASSIGN);
                }
                break;
            case PineV5Parser.PLUS_ASSIGN:
            case PineV5Parser.MINUS_ASSIGN:
            case PineV5Parser.MUL_ASSIGN:
            case PineV5Parser.DIV_ASSIGN:
            case PineV5Parser.MOD_ASSIGN:
                {
                this.state = 345;
                this.compound_assign_op();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
            this.state = 348;
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
        this.enterRule(localContext, 60, PineV5Parser.RULE_pine_script);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 354;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (((((_la - 3)) & ~0x1F) === 0 && ((1 << (_la - 3)) & 2688548863) !== 0) || ((((_la - 37)) & ~0x1F) === 0 && ((1 << (_la - 37)) & 2101395507) !== 0)) {
                {
                this.state = 352;
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
                    this.state = 350;
                    this.stmt();
                    }
                    break;
                case PineV5Parser.LEND:
                    {
                    this.state = 351;
                    this.match(PineV5Parser.LEND);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                this.state = 356;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 357;
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
        this.enterRule(localContext, 62, PineV5Parser.RULE_global_stmt);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 359;
            this.global_stmt_content();
            this.state = 364;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 58) {
                {
                {
                this.state = 360;
                this.match(PineV5Parser.COMMA);
                this.state = 361;
                this.global_stmt_content();
                }
                }
                this.state = 366;
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
        this.enterRule(localContext, 64, PineV5Parser.RULE_fun_def_stmt);
        try {
            this.state = 369;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 39, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 367;
                this.fun_def_singleline();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 368;
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
        this.enterRule(localContext, 66, PineV5Parser.RULE_fun_def_singleline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 371;
            this.id();
            this.state = 372;
            this.fun_head();
            this.state = 373;
            this.match(PineV5Parser.ARROW);
            this.state = 374;
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
        this.enterRule(localContext, 68, PineV5Parser.RULE_fun_def_multiline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 376;
            this.id();
            this.state = 377;
            this.fun_head();
            this.state = 378;
            this.match(PineV5Parser.ARROW);
            this.state = 379;
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
        this.enterRule(localContext, 70, PineV5Parser.RULE_fun_body_singleline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 381;
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
        this.enterRule(localContext, 72, PineV5Parser.RULE_local_stmt_singleline);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 383;
            this.local_stmt_content();
            this.state = 388;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 58) {
                {
                {
                this.state = 384;
                this.match(PineV5Parser.COMMA);
                this.state = 385;
                this.local_stmt_content();
                }
                }
                this.state = 390;
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
        this.enterRule(localContext, 74, PineV5Parser.RULE_loop_break);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 391;
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
        this.enterRule(localContext, 76, PineV5Parser.RULE_loop_continue);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 393;
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
        this.enterRule(localContext, 78, PineV5Parser.RULE_fun_body_multiline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 395;
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
        this.enterRule(localContext, 80, PineV5Parser.RULE_local_stmts_multiline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 397;
            this.match(PineV5Parser.BEGIN);
            this.state = 398;
            this.local_stmts_list();
            this.state = 399;
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
        this.enterRule(localContext, 82, PineV5Parser.RULE_local_stmts_list);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 403;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                this.state = 403;
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
                    this.state = 401;
                    this.local_stmt_multiline();
                    }
                    break;
                case PineV5Parser.LEND:
                    {
                    this.state = 402;
                    this.match(PineV5Parser.LEND);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                this.state = 405;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while (((((_la - 3)) & ~0x1F) === 0 && ((1 << (_la - 3)) & 2688548743) !== 0) || ((((_la - 37)) & ~0x1F) === 0 && ((1 << (_la - 37)) & 2101395507) !== 0));
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
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
        this.enterRule(localContext, 84, PineV5Parser.RULE_local_stmt_multiline);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 407;
            this.local_stmt_content();
            this.state = 412;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 58) {
                {
                {
                this.state = 408;
                this.match(PineV5Parser.COMMA);
                this.state = 409;
                this.local_stmt_content();
                }
                }
                this.state = 414;
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
        this.enterRule(localContext, 86, PineV5Parser.RULE_ids_array);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 415;
            this.match(PineV5Parser.LSQBR);
            this.state = 416;
            this.id();
            this.state = 421;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 58) {
                {
                {
                this.state = 417;
                this.match(PineV5Parser.COMMA);
                this.state = 418;
                this.id();
                }
                }
                this.state = 423;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 424;
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
        this.enterRule(localContext, 88, PineV5Parser.RULE_arith_exprs);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 426;
            this.match(PineV5Parser.LSQBR);
            this.state = 427;
            this.arith_expr();
            this.state = 432;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 58) {
                {
                {
                this.state = 428;
                this.match(PineV5Parser.COMMA);
                this.state = 429;
                this.arith_expr();
                }
                }
                this.state = 434;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 435;
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
        this.enterRule(localContext, 90, PineV5Parser.RULE_if_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 437;
            this.match(PineV5Parser.IF_COND);
            this.state = 438;
            this.ternary_expr();
            this.state = 439;
            this.stmts_block();
            this.state = 448;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 47, this.context) ) {
            case 1:
                {
                this.state = 443;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 3) {
                    {
                    {
                    this.state = 440;
                    this.match(PineV5Parser.LEND);
                    }
                    }
                    this.state = 445;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                this.state = 446;
                this.match(PineV5Parser.IF_COND_ELSE);
                this.state = 447;
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
        this.enterRule(localContext, 92, PineV5Parser.RULE_for_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 450;
            this.match(PineV5Parser.FOR_STMT);
            this.state = 451;
            this.var_def();
            this.state = 452;
            this.match(PineV5Parser.FOR_STMT_TO);
            this.state = 453;
            this.ternary_expr();
            this.state = 456;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 36) {
                {
                this.state = 454;
                this.match(PineV5Parser.FOR_STMT_BY);
                this.state = 455;
                this.ternary_expr();
                }
            }

            this.state = 458;
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
        this.enterRule(localContext, 94, PineV5Parser.RULE_stmts_block);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 460;
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
        this.enterRule(localContext, 96, PineV5Parser.RULE_ternary_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 462;
            this.or_expr();
            this.state = 468;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 43) {
                {
                this.state = 463;
                this.match(PineV5Parser.COND);
                this.state = 464;
                this.ternary_expr();
                this.state = 465;
                this.match(PineV5Parser.COND_ELSE);
                this.state = 466;
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
        this.enterRule(localContext, 98, PineV5Parser.RULE_or_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 470;
            this.and_expr();
            this.state = 475;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 39) {
                {
                {
                this.state = 471;
                this.match(PineV5Parser.OR);
                this.state = 472;
                this.and_expr();
                }
                }
                this.state = 477;
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
        this.enterRule(localContext, 100, PineV5Parser.RULE_and_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 478;
            this.eq_expr();
            this.state = 483;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 40) {
                {
                {
                this.state = 479;
                this.match(PineV5Parser.AND);
                this.state = 480;
                this.eq_expr();
                }
                }
                this.state = 485;
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
        this.enterRule(localContext, 102, PineV5Parser.RULE_eq_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 486;
            this.cmp_expr();
            this.state = 491;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 45 || _la === 46) {
                {
                {
                this.state = 487;
                _la = this.tokenStream.LA(1);
                if(!(_la === 45 || _la === 46)) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                this.state = 488;
                this.cmp_expr();
                }
                }
                this.state = 493;
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
        this.enterRule(localContext, 104, PineV5Parser.RULE_cmp_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 494;
            this.add_expr();
            this.state = 499;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (((((_la - 47)) & ~0x1F) === 0 && ((1 << (_la - 47)) & 15) !== 0)) {
                {
                {
                this.state = 495;
                _la = this.tokenStream.LA(1);
                if(!(((((_la - 47)) & ~0x1F) === 0 && ((1 << (_la - 47)) & 15) !== 0))) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                this.state = 496;
                this.add_expr();
                }
                }
                this.state = 501;
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
        this.enterRule(localContext, 106, PineV5Parser.RULE_add_expr);
        let _la: number;
        try {
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 502;
            this.mult_expr();
            this.state = 507;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 54, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
                    {
                    {
                    this.state = 503;
                    _la = this.tokenStream.LA(1);
                    if(!(_la === 51 || _la === 52)) {
                    this.errorHandler.recoverInline(this);
                    }
                    else {
                        this.errorHandler.reportMatch(this);
                        this.consume();
                    }
                    this.state = 504;
                    this.mult_expr();
                    }
                    }
                }
                this.state = 509;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 54, this.context);
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
        this.enterRule(localContext, 108, PineV5Parser.RULE_mult_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 510;
            this.unary_expr();
            this.state = 515;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (((((_la - 53)) & ~0x1F) === 0 && ((1 << (_la - 53)) & 7) !== 0)) {
                {
                {
                this.state = 511;
                _la = this.tokenStream.LA(1);
                if(!(((((_la - 53)) & ~0x1F) === 0 && ((1 << (_la - 53)) & 7) !== 0))) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                this.state = 512;
                this.unary_expr();
                }
                }
                this.state = 517;
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
        this.enterRule(localContext, 110, PineV5Parser.RULE_unary_expr);
        try {
            this.state = 525;
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
                this.state = 518;
                this.sqbr_expr();
                }
                break;
            case PineV5Parser.NOT:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 519;
                this.match(PineV5Parser.NOT);
                this.state = 520;
                this.sqbr_expr();
                }
                break;
            case PineV5Parser.PLUS:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 521;
                this.match(PineV5Parser.PLUS);
                this.state = 522;
                this.sqbr_expr();
                }
                break;
            case PineV5Parser.MINUS:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 523;
                this.match(PineV5Parser.MINUS);
                this.state = 524;
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
        this.enterRule(localContext, 112, PineV5Parser.RULE_sqbr_expr);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 527;
            this.atom();
            this.state = 532;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 57, this.context) ) {
            case 1:
                {
                this.state = 528;
                this.match(PineV5Parser.LSQBR);
                this.state = 529;
                this.arith_expr();
                this.state = 530;
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
        this.enterRule(localContext, 114, PineV5Parser.RULE_atom);
        try {
            this.state = 541;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 58, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 534;
                this.fun_call();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 535;
                this.id();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 536;
                this.literal();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 537;
                this.match(PineV5Parser.LPAR);
                this.state = 538;
                this.arith_expr();
                this.state = 539;
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
        this.enterRule(localContext, 116, PineV5Parser.RULE_fun_actual_args);
        let _la: number;
        try {
            this.state = 549;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 60, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 543;
                this.kw_args();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 544;
                this.pos_args();
                this.state = 547;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 58) {
                    {
                    this.state = 545;
                    this.match(PineV5Parser.COMMA);
                    this.state = 546;
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
        this.enterRule(localContext, 118, PineV5Parser.RULE_pos_args);
        try {
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 551;
            this.arith_expr();
            this.state = 556;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 61, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
                    {
                    {
                    this.state = 552;
                    this.match(PineV5Parser.COMMA);
                    this.state = 553;
                    this.arith_expr();
                    }
                    }
                }
                this.state = 558;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 61, this.context);
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
        this.enterRule(localContext, 120, PineV5Parser.RULE_kw_args);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 559;
            this.kw_arg();
            this.state = 564;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 58) {
                {
                {
                this.state = 560;
                this.match(PineV5Parser.COMMA);
                this.state = 561;
                this.kw_arg();
                }
                }
                this.state = 566;
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
        this.enterRule(localContext, 122, PineV5Parser.RULE_kw_arg);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 567;
            this.id();
            this.state = 568;
            this.match(PineV5Parser.DEFINE);
            this.state = 571;
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
                this.state = 569;
                this.arith_expr();
                }
                break;
            case PineV5Parser.LSQBR:
                {
                this.state = 570;
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
        this.enterRule(localContext, 124, PineV5Parser.RULE_literal);
        try {
            this.state = 575;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV5Parser.INT_LITERAL:
            case PineV5Parser.FLOAT_LITERAL:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 573;
                this.num_literal();
                }
                break;
            case PineV5Parser.BOOL_LITERAL:
            case PineV5Parser.STR_LITERAL:
            case PineV5Parser.COLOR_LITERAL:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 574;
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
        this.enterRule(localContext, 126, PineV5Parser.RULE_num_literal);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 577;
            _la = this.tokenStream.LA(1);
            if(!(_la === 63 || _la === 64)) {
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
        this.enterRule(localContext, 128, PineV5Parser.RULE_other_literal);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 579;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 42)) & ~0x1F) === 0 && ((1 << (_la - 42)) & 25165825) !== 0))) {
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
        4,1,71,582,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,2,6,7,
        6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,2,11,7,11,2,12,7,12,2,13,7,13,
        2,14,7,14,2,15,7,15,2,16,7,16,2,17,7,17,2,18,7,18,2,19,7,19,2,20,
        7,20,2,21,7,21,2,22,7,22,2,23,7,23,2,24,7,24,2,25,7,25,2,26,7,26,
        2,27,7,27,2,28,7,28,2,29,7,29,2,30,7,30,2,31,7,31,2,32,7,32,2,33,
        7,33,2,34,7,34,2,35,7,35,2,36,7,36,2,37,7,37,2,38,7,38,2,39,7,39,
        2,40,7,40,2,41,7,41,2,42,7,42,2,43,7,43,2,44,7,44,2,45,7,45,2,46,
        7,46,2,47,7,47,2,48,7,48,2,49,7,49,2,50,7,50,2,51,7,51,2,52,7,52,
        2,53,7,53,2,54,7,54,2,55,7,55,2,56,7,56,2,57,7,57,2,58,7,58,2,59,
        7,59,2,60,7,60,2,61,7,61,2,62,7,62,2,63,7,63,2,64,7,64,1,0,1,0,1,
        0,1,0,1,1,1,1,3,1,137,8,1,1,1,1,1,1,2,1,2,1,2,4,2,144,8,2,11,2,12,
        2,145,1,2,1,2,1,3,3,3,151,8,3,1,3,1,3,1,3,3,3,156,8,3,1,4,1,4,3,
        4,160,8,4,1,4,3,4,163,8,4,1,5,1,5,1,5,1,5,1,6,1,6,1,6,4,6,172,8,
        6,11,6,12,6,173,1,6,1,6,1,7,3,7,179,8,7,1,7,1,7,1,7,1,7,3,7,185,
        8,7,1,8,1,8,1,8,1,9,1,9,1,9,1,9,3,9,194,8,9,1,10,1,10,1,10,1,10,
        3,10,200,8,10,1,11,1,11,1,11,1,11,1,11,3,11,207,8,11,5,11,209,8,
        11,10,11,12,11,212,9,11,1,12,3,12,215,8,12,1,12,3,12,218,8,12,1,
        12,1,12,1,12,3,12,223,8,12,1,13,1,13,1,13,1,13,5,13,229,8,13,10,
        13,12,13,232,9,13,1,13,1,13,1,14,1,14,3,14,238,8,14,1,15,1,15,3,
        15,242,8,15,1,15,1,15,3,15,246,8,15,1,15,1,15,1,16,1,16,1,16,1,16,
        1,16,1,16,3,16,256,8,16,1,17,1,17,1,17,1,17,5,17,262,8,17,10,17,
        12,17,265,9,17,3,17,267,8,17,1,17,1,17,1,18,3,18,272,8,18,1,18,3,
        18,275,8,18,1,18,3,18,278,8,18,1,18,1,18,1,18,1,18,1,19,3,19,285,
        8,19,1,19,3,19,288,8,19,1,19,3,19,291,8,19,1,19,1,19,1,19,1,19,1,
        20,1,20,1,21,1,21,1,21,1,21,1,21,1,21,1,21,1,21,1,21,1,21,1,21,3,
        21,310,8,21,1,22,1,22,1,22,1,22,1,22,1,22,1,22,1,22,3,22,320,8,22,
        1,23,1,23,1,23,1,23,3,23,326,8,23,1,24,1,24,1,25,1,25,1,26,1,26,
        1,27,1,27,1,27,5,27,337,8,27,10,27,12,27,340,9,27,1,28,1,28,1,29,
        1,29,1,29,3,29,347,8,29,1,29,1,29,1,30,1,30,5,30,353,8,30,10,30,
        12,30,356,9,30,1,30,1,30,1,31,1,31,1,31,5,31,363,8,31,10,31,12,31,
        366,9,31,1,32,1,32,3,32,370,8,32,1,33,1,33,1,33,1,33,1,33,1,34,1,
        34,1,34,1,34,1,34,1,35,1,35,1,36,1,36,1,36,5,36,387,8,36,10,36,12,
        36,390,9,36,1,37,1,37,1,38,1,38,1,39,1,39,1,40,1,40,1,40,1,40,1,
        41,1,41,4,41,404,8,41,11,41,12,41,405,1,42,1,42,1,42,5,42,411,8,
        42,10,42,12,42,414,9,42,1,43,1,43,1,43,1,43,5,43,420,8,43,10,43,
        12,43,423,9,43,1,43,1,43,1,44,1,44,1,44,1,44,5,44,431,8,44,10,44,
        12,44,434,9,44,1,44,1,44,1,45,1,45,1,45,1,45,5,45,442,8,45,10,45,
        12,45,445,9,45,1,45,1,45,3,45,449,8,45,1,46,1,46,1,46,1,46,1,46,
        1,46,3,46,457,8,46,1,46,1,46,1,47,1,47,1,48,1,48,1,48,1,48,1,48,
        1,48,3,48,469,8,48,1,49,1,49,1,49,5,49,474,8,49,10,49,12,49,477,
        9,49,1,50,1,50,1,50,5,50,482,8,50,10,50,12,50,485,9,50,1,51,1,51,
        1,51,5,51,490,8,51,10,51,12,51,493,9,51,1,52,1,52,1,52,5,52,498,
        8,52,10,52,12,52,501,9,52,1,53,1,53,1,53,5,53,506,8,53,10,53,12,
        53,509,9,53,1,54,1,54,1,54,5,54,514,8,54,10,54,12,54,517,9,54,1,
        55,1,55,1,55,1,55,1,55,1,55,1,55,3,55,526,8,55,1,56,1,56,1,56,1,
        56,1,56,3,56,533,8,56,1,57,1,57,1,57,1,57,1,57,1,57,1,57,3,57,542,
        8,57,1,58,1,58,1,58,1,58,3,58,548,8,58,3,58,550,8,58,1,59,1,59,1,
        59,5,59,555,8,59,10,59,12,59,558,9,59,1,60,1,60,1,60,5,60,563,8,
        60,10,60,12,60,566,9,60,1,61,1,61,1,61,1,61,3,61,572,8,61,1,62,1,
        62,3,62,576,8,62,1,63,1,63,1,64,1,64,1,64,0,0,65,0,2,4,6,8,10,12,
        14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44,46,48,50,52,54,56,
        58,60,62,64,66,68,70,72,74,76,78,80,82,84,86,88,90,92,94,96,98,100,
        102,104,106,108,110,112,114,116,118,120,122,124,126,128,0,11,3,0,
        10,10,13,24,67,67,1,0,11,12,1,0,13,15,1,0,16,24,1,0,25,29,1,0,45,
        46,1,0,47,50,1,0,51,52,1,0,53,55,1,0,63,64,2,0,42,42,65,66,608,0,
        130,1,0,0,0,2,134,1,0,0,0,4,140,1,0,0,0,6,150,1,0,0,0,8,159,1,0,
        0,0,10,164,1,0,0,0,12,168,1,0,0,0,14,178,1,0,0,0,16,186,1,0,0,0,
        18,189,1,0,0,0,20,195,1,0,0,0,22,201,1,0,0,0,24,214,1,0,0,0,26,224,
        1,0,0,0,28,237,1,0,0,0,30,239,1,0,0,0,32,255,1,0,0,0,34,257,1,0,
        0,0,36,271,1,0,0,0,38,284,1,0,0,0,40,296,1,0,0,0,42,309,1,0,0,0,
        44,319,1,0,0,0,46,325,1,0,0,0,48,327,1,0,0,0,50,329,1,0,0,0,52,331,
        1,0,0,0,54,333,1,0,0,0,56,341,1,0,0,0,58,343,1,0,0,0,60,354,1,0,
        0,0,62,359,1,0,0,0,64,369,1,0,0,0,66,371,1,0,0,0,68,376,1,0,0,0,
        70,381,1,0,0,0,72,383,1,0,0,0,74,391,1,0,0,0,76,393,1,0,0,0,78,395,
        1,0,0,0,80,397,1,0,0,0,82,403,1,0,0,0,84,407,1,0,0,0,86,415,1,0,
        0,0,88,426,1,0,0,0,90,437,1,0,0,0,92,450,1,0,0,0,94,460,1,0,0,0,
        96,462,1,0,0,0,98,470,1,0,0,0,100,478,1,0,0,0,102,486,1,0,0,0,104,
        494,1,0,0,0,106,502,1,0,0,0,108,510,1,0,0,0,110,525,1,0,0,0,112,
        527,1,0,0,0,114,541,1,0,0,0,116,549,1,0,0,0,118,551,1,0,0,0,120,
        559,1,0,0,0,122,567,1,0,0,0,124,575,1,0,0,0,126,577,1,0,0,0,128,
        579,1,0,0,0,130,131,5,4,0,0,131,132,3,96,48,0,132,133,3,94,47,0,
        133,1,1,0,0,0,134,136,5,5,0,0,135,137,3,96,48,0,136,135,1,0,0,0,
        136,137,1,0,0,0,137,138,1,0,0,0,138,139,3,4,2,0,139,3,1,0,0,0,140,
        143,5,1,0,0,141,144,3,6,3,0,142,144,5,3,0,0,143,141,1,0,0,0,143,
        142,1,0,0,0,144,145,1,0,0,0,145,143,1,0,0,0,145,146,1,0,0,0,146,
        147,1,0,0,0,147,148,5,2,0,0,148,5,1,0,0,0,149,151,3,96,48,0,150,
        149,1,0,0,0,150,151,1,0,0,0,151,152,1,0,0,0,152,155,5,57,0,0,153,
        156,3,72,36,0,154,156,3,94,47,0,155,153,1,0,0,0,155,154,1,0,0,0,
        156,7,1,0,0,0,157,160,3,52,26,0,158,160,3,54,27,0,159,157,1,0,0,
        0,159,158,1,0,0,0,160,162,1,0,0,0,161,163,3,26,13,0,162,161,1,0,
        0,0,162,163,1,0,0,0,163,9,1,0,0,0,164,165,5,6,0,0,165,166,3,54,27,
        0,166,167,3,12,6,0,167,11,1,0,0,0,168,171,5,1,0,0,169,172,3,14,7,
        0,170,172,5,3,0,0,171,169,1,0,0,0,171,170,1,0,0,0,172,173,1,0,0,
        0,173,171,1,0,0,0,173,174,1,0,0,0,174,175,1,0,0,0,175,176,5,2,0,
        0,176,13,1,0,0,0,177,179,3,50,25,0,178,177,1,0,0,0,178,179,1,0,0,
        0,179,180,1,0,0,0,180,181,3,8,4,0,181,184,3,54,27,0,182,183,5,56,
        0,0,183,185,3,46,23,0,184,182,1,0,0,0,184,185,1,0,0,0,185,15,1,0,
        0,0,186,187,5,7,0,0,187,188,3,64,32,0,188,17,1,0,0,0,189,193,5,9,
        0,0,190,194,3,10,5,0,191,194,3,16,8,0,192,194,3,64,32,0,193,190,
        1,0,0,0,193,191,1,0,0,0,193,192,1,0,0,0,194,19,1,0,0,0,195,196,5,
        8,0,0,196,199,3,22,11,0,197,198,5,10,0,0,198,200,3,54,27,0,199,197,
        1,0,0,0,199,200,1,0,0,0,200,21,1,0,0,0,201,210,3,54,27,0,202,206,
        5,54,0,0,203,207,3,54,27,0,204,207,5,63,0,0,205,207,5,64,0,0,206,
        203,1,0,0,0,206,204,1,0,0,0,206,205,1,0,0,0,207,209,1,0,0,0,208,
        202,1,0,0,0,209,212,1,0,0,0,210,208,1,0,0,0,210,211,1,0,0,0,211,
        23,1,0,0,0,212,210,1,0,0,0,213,215,3,50,25,0,214,213,1,0,0,0,214,
        215,1,0,0,0,215,217,1,0,0,0,216,218,3,8,4,0,217,216,1,0,0,0,217,
        218,1,0,0,0,218,219,1,0,0,0,219,222,3,54,27,0,220,221,5,56,0,0,221,
        223,3,46,23,0,222,220,1,0,0,0,222,223,1,0,0,0,223,25,1,0,0,0,224,
        225,5,49,0,0,225,230,3,28,14,0,226,227,5,58,0,0,227,229,3,28,14,
        0,228,226,1,0,0,0,229,232,1,0,0,0,230,228,1,0,0,0,230,231,1,0,0,
        0,231,233,1,0,0,0,232,230,1,0,0,0,233,234,5,47,0,0,234,27,1,0,0,
        0,235,238,3,52,26,0,236,238,3,54,27,0,237,235,1,0,0,0,237,236,1,
        0,0,0,238,29,1,0,0,0,239,241,3,54,27,0,240,242,3,26,13,0,241,240,
        1,0,0,0,241,242,1,0,0,0,242,243,1,0,0,0,243,245,5,59,0,0,244,246,
        3,116,58,0,245,244,1,0,0,0,245,246,1,0,0,0,246,247,1,0,0,0,247,248,
        5,60,0,0,248,31,1,0,0,0,249,256,3,20,10,0,250,256,3,18,9,0,251,256,
        3,10,5,0,252,256,3,16,8,0,253,256,3,64,32,0,254,256,3,62,31,0,255,
        249,1,0,0,0,255,250,1,0,0,0,255,251,1,0,0,0,255,252,1,0,0,0,255,
        253,1,0,0,0,255,254,1,0,0,0,256,33,1,0,0,0,257,266,5,59,0,0,258,
        263,3,24,12,0,259,260,5,58,0,0,260,262,3,24,12,0,261,259,1,0,0,0,
        262,265,1,0,0,0,263,261,1,0,0,0,263,264,1,0,0,0,264,267,1,0,0,0,
        265,263,1,0,0,0,266,258,1,0,0,0,266,267,1,0,0,0,267,268,1,0,0,0,
        268,269,5,60,0,0,269,35,1,0,0,0,270,272,3,48,24,0,271,270,1,0,0,
        0,271,272,1,0,0,0,272,274,1,0,0,0,273,275,3,50,25,0,274,273,1,0,
        0,0,274,275,1,0,0,0,275,277,1,0,0,0,276,278,3,8,4,0,277,276,1,0,
        0,0,277,278,1,0,0,0,278,279,1,0,0,0,279,280,3,54,27,0,280,281,5,
        56,0,0,281,282,3,46,23,0,282,37,1,0,0,0,283,285,3,48,24,0,284,283,
        1,0,0,0,284,285,1,0,0,0,285,287,1,0,0,0,286,288,3,50,25,0,287,286,
        1,0,0,0,287,288,1,0,0,0,288,290,1,0,0,0,289,291,3,8,4,0,290,289,
        1,0,0,0,290,291,1,0,0,0,291,292,1,0,0,0,292,293,3,86,43,0,293,294,
        5,56,0,0,294,295,3,46,23,0,295,39,1,0,0,0,296,297,7,0,0,0,297,41,
        1,0,0,0,298,310,3,36,18,0,299,310,3,38,19,0,300,310,3,30,15,0,301,
        310,3,90,45,0,302,310,3,58,29,0,303,310,3,92,46,0,304,310,3,0,0,
        0,305,310,3,2,1,0,306,310,3,74,37,0,307,310,3,76,38,0,308,310,3,
        46,23,0,309,298,1,0,0,0,309,299,1,0,0,0,309,300,1,0,0,0,309,301,
        1,0,0,0,309,302,1,0,0,0,309,303,1,0,0,0,309,304,1,0,0,0,309,305,
        1,0,0,0,309,306,1,0,0,0,309,307,1,0,0,0,309,308,1,0,0,0,310,43,1,
        0,0,0,311,320,3,36,18,0,312,320,3,38,19,0,313,320,3,46,23,0,314,
        320,3,88,44,0,315,320,3,58,29,0,316,320,3,0,0,0,317,320,3,74,37,
        0,318,320,3,76,38,0,319,311,1,0,0,0,319,312,1,0,0,0,319,313,1,0,
        0,0,319,314,1,0,0,0,319,315,1,0,0,0,319,316,1,0,0,0,319,317,1,0,
        0,0,319,318,1,0,0,0,320,45,1,0,0,0,321,326,3,96,48,0,322,326,3,90,
        45,0,323,326,3,92,46,0,324,326,3,2,1,0,325,321,1,0,0,0,325,322,1,
        0,0,0,325,323,1,0,0,0,325,324,1,0,0,0,326,47,1,0,0,0,327,328,7,1,
        0,0,328,49,1,0,0,0,329,330,7,2,0,0,330,51,1,0,0,0,331,332,7,3,0,
        0,332,53,1,0,0,0,333,338,3,40,20,0,334,335,5,71,0,0,335,337,3,40,
        20,0,336,334,1,0,0,0,337,340,1,0,0,0,338,336,1,0,0,0,338,339,1,0,
        0,0,339,55,1,0,0,0,340,338,1,0,0,0,341,342,7,4,0,0,342,57,1,0,0,
        0,343,346,3,54,27,0,344,347,5,30,0,0,345,347,3,56,28,0,346,344,1,
        0,0,0,346,345,1,0,0,0,347,348,1,0,0,0,348,349,3,46,23,0,349,59,1,
        0,0,0,350,353,3,32,16,0,351,353,5,3,0,0,352,350,1,0,0,0,352,351,
        1,0,0,0,353,356,1,0,0,0,354,352,1,0,0,0,354,355,1,0,0,0,355,357,
        1,0,0,0,356,354,1,0,0,0,357,358,5,0,0,1,358,61,1,0,0,0,359,364,3,
        42,21,0,360,361,5,58,0,0,361,363,3,42,21,0,362,360,1,0,0,0,363,366,
        1,0,0,0,364,362,1,0,0,0,364,365,1,0,0,0,365,63,1,0,0,0,366,364,1,
        0,0,0,367,370,3,66,33,0,368,370,3,68,34,0,369,367,1,0,0,0,369,368,
        1,0,0,0,370,65,1,0,0,0,371,372,3,54,27,0,372,373,3,34,17,0,373,374,
        5,57,0,0,374,375,3,70,35,0,375,67,1,0,0,0,376,377,3,54,27,0,377,
        378,3,34,17,0,378,379,5,57,0,0,379,380,3,78,39,0,380,69,1,0,0,0,
        381,382,3,72,36,0,382,71,1,0,0,0,383,388,3,44,22,0,384,385,5,58,
        0,0,385,387,3,44,22,0,386,384,1,0,0,0,387,390,1,0,0,0,388,386,1,
        0,0,0,388,389,1,0,0,0,389,73,1,0,0,0,390,388,1,0,0,0,391,392,5,37,
        0,0,392,75,1,0,0,0,393,394,5,38,0,0,394,77,1,0,0,0,395,396,3,80,
        40,0,396,79,1,0,0,0,397,398,5,1,0,0,398,399,3,82,41,0,399,400,5,
        2,0,0,400,81,1,0,0,0,401,404,3,84,42,0,402,404,5,3,0,0,403,401,1,
        0,0,0,403,402,1,0,0,0,404,405,1,0,0,0,405,403,1,0,0,0,405,406,1,
        0,0,0,406,83,1,0,0,0,407,412,3,44,22,0,408,409,5,58,0,0,409,411,
        3,44,22,0,410,408,1,0,0,0,411,414,1,0,0,0,412,410,1,0,0,0,412,413,
        1,0,0,0,413,85,1,0,0,0,414,412,1,0,0,0,415,416,5,61,0,0,416,421,
        3,54,27,0,417,418,5,58,0,0,418,420,3,54,27,0,419,417,1,0,0,0,420,
        423,1,0,0,0,421,419,1,0,0,0,421,422,1,0,0,0,422,424,1,0,0,0,423,
        421,1,0,0,0,424,425,5,62,0,0,425,87,1,0,0,0,426,427,5,61,0,0,427,
        432,3,46,23,0,428,429,5,58,0,0,429,431,3,46,23,0,430,428,1,0,0,0,
        431,434,1,0,0,0,432,430,1,0,0,0,432,433,1,0,0,0,433,435,1,0,0,0,
        434,432,1,0,0,0,435,436,5,62,0,0,436,89,1,0,0,0,437,438,5,32,0,0,
        438,439,3,96,48,0,439,448,3,94,47,0,440,442,5,3,0,0,441,440,1,0,
        0,0,442,445,1,0,0,0,443,441,1,0,0,0,443,444,1,0,0,0,444,446,1,0,
        0,0,445,443,1,0,0,0,446,447,5,33,0,0,447,449,3,94,47,0,448,443,1,
        0,0,0,448,449,1,0,0,0,449,91,1,0,0,0,450,451,5,34,0,0,451,452,3,
        36,18,0,452,453,5,35,0,0,453,456,3,96,48,0,454,455,5,36,0,0,455,
        457,3,96,48,0,456,454,1,0,0,0,456,457,1,0,0,0,457,458,1,0,0,0,458,
        459,3,94,47,0,459,93,1,0,0,0,460,461,3,78,39,0,461,95,1,0,0,0,462,
        468,3,98,49,0,463,464,5,43,0,0,464,465,3,96,48,0,465,466,5,44,0,
        0,466,467,3,96,48,0,467,469,1,0,0,0,468,463,1,0,0,0,468,469,1,0,
        0,0,469,97,1,0,0,0,470,475,3,100,50,0,471,472,5,39,0,0,472,474,3,
        100,50,0,473,471,1,0,0,0,474,477,1,0,0,0,475,473,1,0,0,0,475,476,
        1,0,0,0,476,99,1,0,0,0,477,475,1,0,0,0,478,483,3,102,51,0,479,480,
        5,40,0,0,480,482,3,102,51,0,481,479,1,0,0,0,482,485,1,0,0,0,483,
        481,1,0,0,0,483,484,1,0,0,0,484,101,1,0,0,0,485,483,1,0,0,0,486,
        491,3,104,52,0,487,488,7,5,0,0,488,490,3,104,52,0,489,487,1,0,0,
        0,490,493,1,0,0,0,491,489,1,0,0,0,491,492,1,0,0,0,492,103,1,0,0,
        0,493,491,1,0,0,0,494,499,3,106,53,0,495,496,7,6,0,0,496,498,3,106,
        53,0,497,495,1,0,0,0,498,501,1,0,0,0,499,497,1,0,0,0,499,500,1,0,
        0,0,500,105,1,0,0,0,501,499,1,0,0,0,502,507,3,108,54,0,503,504,7,
        7,0,0,504,506,3,108,54,0,505,503,1,0,0,0,506,509,1,0,0,0,507,505,
        1,0,0,0,507,508,1,0,0,0,508,107,1,0,0,0,509,507,1,0,0,0,510,515,
        3,110,55,0,511,512,7,8,0,0,512,514,3,110,55,0,513,511,1,0,0,0,514,
        517,1,0,0,0,515,513,1,0,0,0,515,516,1,0,0,0,516,109,1,0,0,0,517,
        515,1,0,0,0,518,526,3,112,56,0,519,520,5,41,0,0,520,526,3,112,56,
        0,521,522,5,51,0,0,522,526,3,112,56,0,523,524,5,52,0,0,524,526,3,
        112,56,0,525,518,1,0,0,0,525,519,1,0,0,0,525,521,1,0,0,0,525,523,
        1,0,0,0,526,111,1,0,0,0,527,532,3,114,57,0,528,529,5,61,0,0,529,
        530,3,46,23,0,530,531,5,62,0,0,531,533,1,0,0,0,532,528,1,0,0,0,532,
        533,1,0,0,0,533,113,1,0,0,0,534,542,3,30,15,0,535,542,3,54,27,0,
        536,542,3,124,62,0,537,538,5,59,0,0,538,539,3,46,23,0,539,540,5,
        60,0,0,540,542,1,0,0,0,541,534,1,0,0,0,541,535,1,0,0,0,541,536,1,
        0,0,0,541,537,1,0,0,0,542,115,1,0,0,0,543,550,3,120,60,0,544,547,
        3,118,59,0,545,546,5,58,0,0,546,548,3,120,60,0,547,545,1,0,0,0,547,
        548,1,0,0,0,548,550,1,0,0,0,549,543,1,0,0,0,549,544,1,0,0,0,550,
        117,1,0,0,0,551,556,3,46,23,0,552,553,5,58,0,0,553,555,3,46,23,0,
        554,552,1,0,0,0,555,558,1,0,0,0,556,554,1,0,0,0,556,557,1,0,0,0,
        557,119,1,0,0,0,558,556,1,0,0,0,559,564,3,122,61,0,560,561,5,58,
        0,0,561,563,3,122,61,0,562,560,1,0,0,0,563,566,1,0,0,0,564,562,1,
        0,0,0,564,565,1,0,0,0,565,121,1,0,0,0,566,564,1,0,0,0,567,568,3,
        54,27,0,568,571,5,56,0,0,569,572,3,46,23,0,570,572,3,88,44,0,571,
        569,1,0,0,0,571,570,1,0,0,0,572,123,1,0,0,0,573,576,3,126,63,0,574,
        576,3,128,64,0,575,573,1,0,0,0,575,574,1,0,0,0,576,125,1,0,0,0,577,
        578,7,9,0,0,578,127,1,0,0,0,579,580,7,10,0,0,580,129,1,0,0,0,65,
        136,143,145,150,155,159,162,171,173,178,184,193,199,206,210,214,
        217,222,230,237,241,245,255,263,266,271,274,277,284,287,290,309,
        319,325,338,346,352,354,364,369,388,403,405,412,421,432,443,448,
        456,468,475,483,491,499,507,515,525,532,541,547,549,556,564,571,
        575
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
