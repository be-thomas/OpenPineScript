
import * as antlr from "antlr4ng";
import { Token } from "antlr4ng";

import { PineV6ParserVisitor } from "./PineV6ParserVisitor.js";

// for running tests with parameters, TODO: discuss strategy for typed parameters in CI
// eslint-disable-next-line no-unused-vars
type int = number;


export class PineV6Parser extends antlr.Parser {
    public static readonly BEGIN = 1;
    public static readonly END = 2;
    public static readonly LEND = 3;
    public static readonly ONCE = 4;
    public static readonly MLSTRING_DQ = 5;
    public static readonly MLSTRING_SQ = 6;
    public static readonly WHILE = 7;
    public static readonly SWITCH = 8;
    public static readonly TYPE = 9;
    public static readonly METHOD = 10;
    public static readonly IMPORT = 11;
    public static readonly EXPORT = 12;
    public static readonly ENUM = 13;
    public static readonly AS = 14;
    public static readonly IN = 15;
    public static readonly VAR = 16;
    public static readonly VARIP = 17;
    public static readonly SERIES = 18;
    public static readonly SIMPLE = 19;
    public static readonly CONST = 20;
    public static readonly INT_TYPE = 21;
    public static readonly FLOAT_TYPE = 22;
    public static readonly BOOL_TYPE = 23;
    public static readonly STRING_TYPE = 24;
    public static readonly COLOR_TYPE = 25;
    public static readonly LINE_TYPE = 26;
    public static readonly LABEL_TYPE = 27;
    public static readonly BOX_TYPE = 28;
    public static readonly TABLE_TYPE = 29;
    public static readonly PLUS_ASSIGN = 30;
    public static readonly MINUS_ASSIGN = 31;
    public static readonly MUL_ASSIGN = 32;
    public static readonly DIV_ASSIGN = 33;
    public static readonly MOD_ASSIGN = 34;
    public static readonly ASSIGN = 35;
    public static readonly LBEG = 36;
    public static readonly IF_COND = 37;
    public static readonly IF_COND_ELSE = 38;
    public static readonly FOR_STMT = 39;
    public static readonly FOR_STMT_TO = 40;
    public static readonly FOR_STMT_BY = 41;
    public static readonly BREAK = 42;
    public static readonly CONTINUE = 43;
    public static readonly OR = 44;
    public static readonly AND = 45;
    public static readonly NOT = 46;
    public static readonly BOOL_LITERAL = 47;
    public static readonly COND = 48;
    public static readonly COND_ELSE = 49;
    public static readonly EQ = 50;
    public static readonly NEQ = 51;
    public static readonly GT = 52;
    public static readonly GE = 53;
    public static readonly LT = 54;
    public static readonly LE = 55;
    public static readonly PLUS = 56;
    public static readonly MINUS = 57;
    public static readonly MUL = 58;
    public static readonly DIV = 59;
    public static readonly MOD = 60;
    public static readonly DEFINE = 61;
    public static readonly ARROW = 62;
    public static readonly COMMA = 63;
    public static readonly LPAR = 64;
    public static readonly RPAR = 65;
    public static readonly LSQBR = 66;
    public static readonly RSQBR = 67;
    public static readonly INT_LITERAL = 68;
    public static readonly FLOAT_LITERAL = 69;
    public static readonly STR_LITERAL = 70;
    public static readonly COLOR_LITERAL = 71;
    public static readonly ID = 72;
    public static readonly WS = 73;
    public static readonly LINE_COMMENT = 74;
    public static readonly BLOCK_COMMENT = 75;
    public static readonly DOT = 76;
    public static readonly RULE_once_expr = 0;
    public static readonly RULE_other_literal = 1;
    public static readonly RULE_global_stmt_content = 2;
    public static readonly RULE_local_stmt_content = 3;
    public static readonly RULE_id = 4;
    public static readonly RULE_export_stmt = 5;
    public static readonly RULE_while_expr = 6;
    public static readonly RULE_switch_expr = 7;
    public static readonly RULE_switch_body = 8;
    public static readonly RULE_switch_case = 9;
    public static readonly RULE_field_type = 10;
    public static readonly RULE_type_def_stmt = 11;
    public static readonly RULE_type_body = 12;
    public static readonly RULE_type_field = 13;
    public static readonly RULE_method_def_stmt = 14;
    public static readonly RULE_enum_def_stmt = 15;
    public static readonly RULE_enum_body = 16;
    public static readonly RULE_enum_field = 17;
    public static readonly RULE_import_stmt = 18;
    public static readonly RULE_import_path = 19;
    public static readonly RULE_import_user = 20;
    public static readonly RULE_user_part = 21;
    public static readonly RULE_fun_param = 22;
    public static readonly RULE_type_args = 23;
    public static readonly RULE_type_arg = 24;
    public static readonly RULE_for_in_expr = 25;
    public static readonly RULE_call_suffix = 26;
    public static readonly RULE_fun_call = 27;
    public static readonly RULE_atom = 28;
    public static readonly RULE_stmt = 29;
    public static readonly RULE_fun_head = 30;
    public static readonly RULE_var_def = 31;
    public static readonly RULE_var_defs = 32;
    public static readonly RULE_id_part = 33;
    public static readonly RULE_arith_expr = 34;
    public static readonly RULE_decl_mod = 35;
    public static readonly RULE_type_qual = 36;
    public static readonly RULE_type_name = 37;
    public static readonly RULE_compound_assign_op = 38;
    public static readonly RULE_var_assign = 39;
    public static readonly RULE_if_expr = 40;
    public static readonly RULE_pos_arg = 41;
    public static readonly RULE_pos_args = 42;
    public static readonly RULE_pine_script = 43;
    public static readonly RULE_global_stmt = 44;
    public static readonly RULE_fun_def_stmt = 45;
    public static readonly RULE_fun_def_singleline = 46;
    public static readonly RULE_fun_def_multiline = 47;
    public static readonly RULE_fun_body_singleline = 48;
    public static readonly RULE_local_stmt_singleline = 49;
    public static readonly RULE_loop_break = 50;
    public static readonly RULE_loop_continue = 51;
    public static readonly RULE_fun_body_multiline = 52;
    public static readonly RULE_local_stmts_multiline = 53;
    public static readonly RULE_local_stmts_list = 54;
    public static readonly RULE_local_stmt_multiline = 55;
    public static readonly RULE_ids_array = 56;
    public static readonly RULE_arith_exprs = 57;
    public static readonly RULE_for_expr = 58;
    public static readonly RULE_stmts_block = 59;
    public static readonly RULE_ternary_expr = 60;
    public static readonly RULE_or_expr = 61;
    public static readonly RULE_and_expr = 62;
    public static readonly RULE_eq_expr = 63;
    public static readonly RULE_cmp_expr = 64;
    public static readonly RULE_add_expr = 65;
    public static readonly RULE_mult_expr = 66;
    public static readonly RULE_unary_expr = 67;
    public static readonly RULE_sqbr_expr = 68;
    public static readonly RULE_fun_actual_args = 69;
    public static readonly RULE_kw_args = 70;
    public static readonly RULE_kw_arg = 71;
    public static readonly RULE_literal = 72;
    public static readonly RULE_num_literal = 73;

    public static readonly literalNames = [
        null, null, null, null, "'once'", null, null, "'while'", "'switch'", 
        "'type'", "'method'", "'import'", "'export'", "'enum'", "'as'", 
        "'in'", "'var'", "'varip'", "'series'", "'simple'", "'const'", "'int'", 
        "'float'", "'bool'", "'string'", "'color'", "'line'", "'label'", 
        "'box'", "'table'", "'+='", "'-='", "'*='", "'/='", "'%='", "':='", 
        null, "'if'", "'else'", "'for'", "'to'", "'by'", "'break'", "'continue'", 
        "'or'", "'and'", "'not'", null, "'?'", "':'", "'=='", "'!='", "'>'", 
        "'>='", "'<'", "'<='", "'+'", "'-'", "'*'", "'/'", "'%'", "'='", 
        "'=>'", "','", "'('", "')'", "'['", "']'", null, null, null, null, 
        null, null, null, null, "'.'"
    ];

    public static readonly symbolicNames = [
        null, "BEGIN", "END", "LEND", "ONCE", "MLSTRING_DQ", "MLSTRING_SQ", 
        "WHILE", "SWITCH", "TYPE", "METHOD", "IMPORT", "EXPORT", "ENUM", 
        "AS", "IN", "VAR", "VARIP", "SERIES", "SIMPLE", "CONST", "INT_TYPE", 
        "FLOAT_TYPE", "BOOL_TYPE", "STRING_TYPE", "COLOR_TYPE", "LINE_TYPE", 
        "LABEL_TYPE", "BOX_TYPE", "TABLE_TYPE", "PLUS_ASSIGN", "MINUS_ASSIGN", 
        "MUL_ASSIGN", "DIV_ASSIGN", "MOD_ASSIGN", "ASSIGN", "LBEG", "IF_COND", 
        "IF_COND_ELSE", "FOR_STMT", "FOR_STMT_TO", "FOR_STMT_BY", "BREAK", 
        "CONTINUE", "OR", "AND", "NOT", "BOOL_LITERAL", "COND", "COND_ELSE", 
        "EQ", "NEQ", "GT", "GE", "LT", "LE", "PLUS", "MINUS", "MUL", "DIV", 
        "MOD", "DEFINE", "ARROW", "COMMA", "LPAR", "RPAR", "LSQBR", "RSQBR", 
        "INT_LITERAL", "FLOAT_LITERAL", "STR_LITERAL", "COLOR_LITERAL", 
        "ID", "WS", "LINE_COMMENT", "BLOCK_COMMENT", "DOT"
    ];
    public static readonly ruleNames = [
        "once_expr", "other_literal", "global_stmt_content", "local_stmt_content", 
        "id", "export_stmt", "while_expr", "switch_expr", "switch_body", 
        "switch_case", "field_type", "type_def_stmt", "type_body", "type_field", 
        "method_def_stmt", "enum_def_stmt", "enum_body", "enum_field", "import_stmt", 
        "import_path", "import_user", "user_part", "fun_param", "type_args", 
        "type_arg", "for_in_expr", "call_suffix", "fun_call", "atom", "stmt", 
        "fun_head", "var_def", "var_defs", "id_part", "arith_expr", "decl_mod", 
        "type_qual", "type_name", "compound_assign_op", "var_assign", "if_expr", 
        "pos_arg", "pos_args", "pine_script", "global_stmt", "fun_def_stmt", 
        "fun_def_singleline", "fun_def_multiline", "fun_body_singleline", 
        "local_stmt_singleline", "loop_break", "loop_continue", "fun_body_multiline", 
        "local_stmts_multiline", "local_stmts_list", "local_stmt_multiline", 
        "ids_array", "arith_exprs", "for_expr", "stmts_block", "ternary_expr", 
        "or_expr", "and_expr", "eq_expr", "cmp_expr", "add_expr", "mult_expr", 
        "unary_expr", "sqbr_expr", "fun_actual_args", "kw_args", "kw_arg", 
        "literal", "num_literal",
    ];

    public get grammarFileName(): string { return "PineV6Parser.g4"; }
    public get literalNames(): (string | null)[] { return PineV6Parser.literalNames; }
    public get symbolicNames(): (string | null)[] { return PineV6Parser.symbolicNames; }
    public get ruleNames(): string[] { return PineV6Parser.ruleNames; }
    public get serializedATN(): number[] { return PineV6Parser._serializedATN; }

    protected createFailedPredicateException(predicate?: string, message?: string): antlr.FailedPredicateException {
        return new antlr.FailedPredicateException(this, predicate, message);
    }

    public constructor(input: antlr.TokenStream) {
        super(input);
        this.interpreter = new antlr.ParserATNSimulator(this, PineV6Parser._ATN, PineV6Parser.decisionsToDFA, new antlr.PredictionContextCache());
    }
    public once_expr(): Once_exprContext {
        let localContext = new Once_exprContext(this.context, this.state);
        this.enterRule(localContext, 0, PineV6Parser.RULE_once_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 148;
            this.match(PineV6Parser.ONCE);
            this.state = 150;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 1073497696) !== 0) || ((((_la - 46)) & ~0x1F) === 0 && ((1 << (_la - 46)) & 130288643) !== 0)) {
                {
                this.state = 149;
                this.ternary_expr();
                }
            }

            this.state = 152;
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
    public other_literal(): Other_literalContext {
        let localContext = new Other_literalContext(this.context, this.state);
        this.enterRule(localContext, 2, PineV6Parser.RULE_other_literal);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 154;
            _la = this.tokenStream.LA(1);
            if(!(_la === 5 || _la === 6 || ((((_la - 47)) & ~0x1F) === 0 && ((1 << (_la - 47)) & 25165825) !== 0))) {
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
        this.enterRule(localContext, 4, PineV6Parser.RULE_global_stmt_content);
        try {
            this.state = 169;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 1, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 156;
                this.var_def();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 157;
                this.var_defs();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 158;
                this.fun_call();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 159;
                this.if_expr();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 160;
                this.var_assign();
                }
                break;
            case 6:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 161;
                this.for_expr();
                }
                break;
            case 7:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 162;
                this.for_in_expr();
                }
                break;
            case 8:
                this.enterOuterAlt(localContext, 8);
                {
                this.state = 163;
                this.while_expr();
                }
                break;
            case 9:
                this.enterOuterAlt(localContext, 9);
                {
                this.state = 164;
                this.switch_expr();
                }
                break;
            case 10:
                this.enterOuterAlt(localContext, 10);
                {
                this.state = 165;
                this.once_expr();
                }
                break;
            case 11:
                this.enterOuterAlt(localContext, 11);
                {
                this.state = 166;
                this.loop_break();
                }
                break;
            case 12:
                this.enterOuterAlt(localContext, 12);
                {
                this.state = 167;
                this.loop_continue();
                }
                break;
            case 13:
                this.enterOuterAlt(localContext, 13);
                {
                this.state = 168;
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
        this.enterRule(localContext, 6, PineV6Parser.RULE_local_stmt_content);
        try {
            this.state = 180;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 2, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 171;
                this.var_def();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 172;
                this.var_defs();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 173;
                this.arith_expr();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 174;
                this.arith_exprs();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 175;
                this.var_assign();
                }
                break;
            case 6:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 176;
                this.while_expr();
                }
                break;
            case 7:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 177;
                this.once_expr();
                }
                break;
            case 8:
                this.enterOuterAlt(localContext, 8);
                {
                this.state = 178;
                this.loop_break();
                }
                break;
            case 9:
                this.enterOuterAlt(localContext, 9);
                {
                this.state = 179;
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
    public id(): IdContext {
        let localContext = new IdContext(this.context, this.state);
        this.enterRule(localContext, 8, PineV6Parser.RULE_id);
        try {
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 182;
            this.id_part();
            this.state = 195;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 4, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
                    {
                    {
                    this.state = 183;
                    this.match(PineV6Parser.DOT);
                    this.state = 191;
                    this.errorHandler.sync(this);
                    switch (this.interpreter.adaptivePredict(this.tokenStream, 3, this.context) ) {
                    case 1:
                        {
                        this.state = 184;
                        this.id_part();
                        }
                        break;
                    case 2:
                        {
                        this.state = 185;
                        this.match(PineV6Parser.TYPE);
                        }
                        break;
                    case 3:
                        {
                        this.state = 186;
                        this.match(PineV6Parser.METHOD);
                        }
                        break;
                    case 4:
                        {
                        this.state = 187;
                        this.match(PineV6Parser.IMPORT);
                        }
                        break;
                    case 5:
                        {
                        this.state = 188;
                        this.match(PineV6Parser.EXPORT);
                        }
                        break;
                    case 6:
                        {
                        this.state = 189;
                        this.match(PineV6Parser.ENUM);
                        }
                        break;
                    case 7:
                        {
                        this.state = 190;
                        this.match(PineV6Parser.ONCE);
                        }
                        break;
                    }
                    }
                    }
                }
                this.state = 197;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 4, this.context);
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
        this.enterRule(localContext, 10, PineV6Parser.RULE_export_stmt);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 198;
            this.match(PineV6Parser.EXPORT);
            this.state = 204;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 5, this.context) ) {
            case 1:
                {
                this.state = 199;
                this.type_def_stmt();
                }
                break;
            case 2:
                {
                this.state = 200;
                this.enum_def_stmt();
                }
                break;
            case 3:
                {
                this.state = 201;
                this.method_def_stmt();
                }
                break;
            case 4:
                {
                this.state = 202;
                this.fun_def_stmt();
                }
                break;
            case 5:
                {
                this.state = 203;
                this.var_def();
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
    public while_expr(): While_exprContext {
        let localContext = new While_exprContext(this.context, this.state);
        this.enterRule(localContext, 12, PineV6Parser.RULE_while_expr);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 206;
            this.match(PineV6Parser.WHILE);
            this.state = 207;
            this.ternary_expr();
            this.state = 208;
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
        this.enterRule(localContext, 14, PineV6Parser.RULE_switch_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 210;
            this.match(PineV6Parser.SWITCH);
            this.state = 212;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 1073497696) !== 0) || ((((_la - 46)) & ~0x1F) === 0 && ((1 << (_la - 46)) & 130288643) !== 0)) {
                {
                this.state = 211;
                this.ternary_expr();
                }
            }

            this.state = 214;
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
        this.enterRule(localContext, 16, PineV6Parser.RULE_switch_body);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 216;
            this.match(PineV6Parser.BEGIN);
            this.state = 219;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                this.state = 219;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case PineV6Parser.MLSTRING_DQ:
                case PineV6Parser.MLSTRING_SQ:
                case PineV6Parser.TYPE:
                case PineV6Parser.METHOD:
                case PineV6Parser.AS:
                case PineV6Parser.SERIES:
                case PineV6Parser.SIMPLE:
                case PineV6Parser.CONST:
                case PineV6Parser.INT_TYPE:
                case PineV6Parser.FLOAT_TYPE:
                case PineV6Parser.BOOL_TYPE:
                case PineV6Parser.STRING_TYPE:
                case PineV6Parser.COLOR_TYPE:
                case PineV6Parser.LINE_TYPE:
                case PineV6Parser.LABEL_TYPE:
                case PineV6Parser.BOX_TYPE:
                case PineV6Parser.TABLE_TYPE:
                case PineV6Parser.NOT:
                case PineV6Parser.BOOL_LITERAL:
                case PineV6Parser.PLUS:
                case PineV6Parser.MINUS:
                case PineV6Parser.ARROW:
                case PineV6Parser.LPAR:
                case PineV6Parser.INT_LITERAL:
                case PineV6Parser.FLOAT_LITERAL:
                case PineV6Parser.STR_LITERAL:
                case PineV6Parser.COLOR_LITERAL:
                case PineV6Parser.ID:
                    {
                    this.state = 217;
                    this.switch_case();
                    }
                    break;
                case PineV6Parser.LEND:
                    {
                    this.state = 218;
                    this.match(PineV6Parser.LEND);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                this.state = 221;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 1073497704) !== 0) || ((((_la - 46)) & ~0x1F) === 0 && ((1 << (_la - 46)) & 130354179) !== 0));
            this.state = 223;
            this.match(PineV6Parser.END);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
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
        this.enterRule(localContext, 18, PineV6Parser.RULE_switch_case);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 226;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 1073497696) !== 0) || ((((_la - 46)) & ~0x1F) === 0 && ((1 << (_la - 46)) & 130288643) !== 0)) {
                {
                this.state = 225;
                this.ternary_expr();
                }
            }

            this.state = 228;
            this.match(PineV6Parser.ARROW);
            this.state = 231;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV6Parser.ONCE:
            case PineV6Parser.MLSTRING_DQ:
            case PineV6Parser.MLSTRING_SQ:
            case PineV6Parser.WHILE:
            case PineV6Parser.SWITCH:
            case PineV6Parser.TYPE:
            case PineV6Parser.METHOD:
            case PineV6Parser.AS:
            case PineV6Parser.VAR:
            case PineV6Parser.VARIP:
            case PineV6Parser.SERIES:
            case PineV6Parser.SIMPLE:
            case PineV6Parser.CONST:
            case PineV6Parser.INT_TYPE:
            case PineV6Parser.FLOAT_TYPE:
            case PineV6Parser.BOOL_TYPE:
            case PineV6Parser.STRING_TYPE:
            case PineV6Parser.COLOR_TYPE:
            case PineV6Parser.LINE_TYPE:
            case PineV6Parser.LABEL_TYPE:
            case PineV6Parser.BOX_TYPE:
            case PineV6Parser.TABLE_TYPE:
            case PineV6Parser.IF_COND:
            case PineV6Parser.FOR_STMT:
            case PineV6Parser.BREAK:
            case PineV6Parser.CONTINUE:
            case PineV6Parser.NOT:
            case PineV6Parser.BOOL_LITERAL:
            case PineV6Parser.PLUS:
            case PineV6Parser.MINUS:
            case PineV6Parser.LPAR:
            case PineV6Parser.LSQBR:
            case PineV6Parser.INT_LITERAL:
            case PineV6Parser.FLOAT_LITERAL:
            case PineV6Parser.STR_LITERAL:
            case PineV6Parser.COLOR_LITERAL:
            case PineV6Parser.ID:
                {
                this.state = 229;
                this.local_stmt_singleline();
                }
                break;
            case PineV6Parser.BEGIN:
                {
                this.state = 230;
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
        this.enterRule(localContext, 20, PineV6Parser.RULE_field_type);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 235;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 11, this.context) ) {
            case 1:
                {
                this.state = 233;
                this.type_name();
                }
                break;
            case 2:
                {
                this.state = 234;
                this.id();
                }
                break;
            }
            this.state = 238;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 54) {
                {
                this.state = 237;
                this.type_args();
                }
            }

            this.state = 242;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 13, this.context) ) {
            case 1:
                {
                this.state = 240;
                this.match(PineV6Parser.LSQBR);
                this.state = 241;
                this.match(PineV6Parser.RSQBR);
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
        this.enterRule(localContext, 22, PineV6Parser.RULE_type_def_stmt);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 244;
            this.match(PineV6Parser.TYPE);
            this.state = 245;
            this.id();
            this.state = 246;
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
        this.enterRule(localContext, 24, PineV6Parser.RULE_type_body);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 248;
            this.match(PineV6Parser.BEGIN);
            this.state = 251;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                this.state = 251;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case PineV6Parser.TYPE:
                case PineV6Parser.METHOD:
                case PineV6Parser.AS:
                case PineV6Parser.VARIP:
                case PineV6Parser.SERIES:
                case PineV6Parser.SIMPLE:
                case PineV6Parser.CONST:
                case PineV6Parser.INT_TYPE:
                case PineV6Parser.FLOAT_TYPE:
                case PineV6Parser.BOOL_TYPE:
                case PineV6Parser.STRING_TYPE:
                case PineV6Parser.COLOR_TYPE:
                case PineV6Parser.LINE_TYPE:
                case PineV6Parser.LABEL_TYPE:
                case PineV6Parser.BOX_TYPE:
                case PineV6Parser.TABLE_TYPE:
                case PineV6Parser.ID:
                    {
                    this.state = 249;
                    this.type_field();
                    }
                    break;
                case PineV6Parser.LEND:
                    {
                    this.state = 250;
                    this.match(PineV6Parser.LEND);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                this.state = 253;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 1073628680) !== 0) || _la === 72);
            this.state = 255;
            this.match(PineV6Parser.END);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
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
        this.enterRule(localContext, 26, PineV6Parser.RULE_type_field);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 258;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 17) {
                {
                this.state = 257;
                this.match(PineV6Parser.VARIP);
                }
            }

            this.state = 261;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 17, this.context) ) {
            case 1:
                {
                this.state = 260;
                this.type_qual();
                }
                break;
            }
            this.state = 264;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 18, this.context) ) {
            case 1:
                {
                this.state = 263;
                this.field_type();
                }
                break;
            }
            this.state = 266;
            this.id();
            this.state = 269;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 61) {
                {
                this.state = 267;
                this.match(PineV6Parser.DEFINE);
                this.state = 268;
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
        this.enterRule(localContext, 28, PineV6Parser.RULE_method_def_stmt);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 271;
            this.match(PineV6Parser.METHOD);
            this.state = 272;
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
        this.enterRule(localContext, 30, PineV6Parser.RULE_enum_def_stmt);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 274;
            this.match(PineV6Parser.ENUM);
            this.state = 275;
            this.id();
            this.state = 276;
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
        this.enterRule(localContext, 32, PineV6Parser.RULE_enum_body);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 278;
            this.match(PineV6Parser.BEGIN);
            this.state = 281;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                this.state = 281;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case PineV6Parser.TYPE:
                case PineV6Parser.METHOD:
                case PineV6Parser.AS:
                case PineV6Parser.SERIES:
                case PineV6Parser.SIMPLE:
                case PineV6Parser.CONST:
                case PineV6Parser.INT_TYPE:
                case PineV6Parser.FLOAT_TYPE:
                case PineV6Parser.BOOL_TYPE:
                case PineV6Parser.STRING_TYPE:
                case PineV6Parser.COLOR_TYPE:
                case PineV6Parser.LINE_TYPE:
                case PineV6Parser.LABEL_TYPE:
                case PineV6Parser.BOX_TYPE:
                case PineV6Parser.TABLE_TYPE:
                case PineV6Parser.ID:
                    {
                    this.state = 279;
                    this.enum_field();
                    }
                    break;
                case PineV6Parser.LEND:
                    {
                    this.state = 280;
                    this.match(PineV6Parser.LEND);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                this.state = 283;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 1073497608) !== 0) || _la === 72);
            this.state = 285;
            this.match(PineV6Parser.END);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
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
        this.enterRule(localContext, 34, PineV6Parser.RULE_enum_field);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 287;
            this.id();
            this.state = 290;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 61) {
                {
                this.state = 288;
                this.match(PineV6Parser.DEFINE);
                this.state = 289;
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
    public import_stmt(): Import_stmtContext {
        let localContext = new Import_stmtContext(this.context, this.state);
        this.enterRule(localContext, 36, PineV6Parser.RULE_import_stmt);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 292;
            this.match(PineV6Parser.IMPORT);
            this.state = 293;
            this.import_path();
            this.state = 296;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 23, this.context) ) {
            case 1:
                {
                this.state = 294;
                this.match(PineV6Parser.AS);
                this.state = 295;
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
        this.enterRule(localContext, 38, PineV6Parser.RULE_import_path);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 298;
            this.import_user();
            this.state = 307;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 59) {
                {
                {
                this.state = 299;
                this.match(PineV6Parser.DIV);
                this.state = 303;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case PineV6Parser.TYPE:
                case PineV6Parser.METHOD:
                case PineV6Parser.AS:
                case PineV6Parser.SERIES:
                case PineV6Parser.SIMPLE:
                case PineV6Parser.CONST:
                case PineV6Parser.INT_TYPE:
                case PineV6Parser.FLOAT_TYPE:
                case PineV6Parser.BOOL_TYPE:
                case PineV6Parser.STRING_TYPE:
                case PineV6Parser.COLOR_TYPE:
                case PineV6Parser.LINE_TYPE:
                case PineV6Parser.LABEL_TYPE:
                case PineV6Parser.BOX_TYPE:
                case PineV6Parser.TABLE_TYPE:
                case PineV6Parser.ID:
                    {
                    this.state = 300;
                    this.id();
                    }
                    break;
                case PineV6Parser.INT_LITERAL:
                    {
                    this.state = 301;
                    this.match(PineV6Parser.INT_LITERAL);
                    }
                    break;
                case PineV6Parser.FLOAT_LITERAL:
                    {
                    this.state = 302;
                    this.match(PineV6Parser.FLOAT_LITERAL);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                }
                this.state = 309;
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
        this.enterRule(localContext, 40, PineV6Parser.RULE_import_user);
        try {
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 310;
            this.user_part();
            this.state = 315;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 26, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
                    {
                    {
                    this.state = 311;
                    this.match(PineV6Parser.MINUS);
                    this.state = 312;
                    this.user_part();
                    }
                    }
                }
                this.state = 317;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 26, this.context);
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
        this.enterRule(localContext, 42, PineV6Parser.RULE_user_part);
        try {
            this.state = 323;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV6Parser.TYPE:
            case PineV6Parser.METHOD:
            case PineV6Parser.AS:
            case PineV6Parser.SERIES:
            case PineV6Parser.SIMPLE:
            case PineV6Parser.CONST:
            case PineV6Parser.INT_TYPE:
            case PineV6Parser.FLOAT_TYPE:
            case PineV6Parser.BOOL_TYPE:
            case PineV6Parser.STRING_TYPE:
            case PineV6Parser.COLOR_TYPE:
            case PineV6Parser.LINE_TYPE:
            case PineV6Parser.LABEL_TYPE:
            case PineV6Parser.BOX_TYPE:
            case PineV6Parser.TABLE_TYPE:
            case PineV6Parser.ID:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 318;
                this.id();
                }
                break;
            case PineV6Parser.INT_LITERAL:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 319;
                this.match(PineV6Parser.INT_LITERAL);
                this.state = 321;
                this.errorHandler.sync(this);
                switch (this.interpreter.adaptivePredict(this.tokenStream, 27, this.context) ) {
                case 1:
                    {
                    this.state = 320;
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
        this.enterRule(localContext, 44, PineV6Parser.RULE_fun_param);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 326;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 29, this.context) ) {
            case 1:
                {
                this.state = 325;
                this.type_qual();
                }
                break;
            }
            this.state = 329;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 30, this.context) ) {
            case 1:
                {
                this.state = 328;
                this.field_type();
                }
                break;
            }
            this.state = 331;
            this.id();
            this.state = 334;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 61) {
                {
                this.state = 332;
                this.match(PineV6Parser.DEFINE);
                this.state = 333;
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
        this.enterRule(localContext, 46, PineV6Parser.RULE_type_args);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 336;
            this.match(PineV6Parser.LT);
            this.state = 337;
            this.type_arg();
            this.state = 342;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 63) {
                {
                {
                this.state = 338;
                this.match(PineV6Parser.COMMA);
                this.state = 339;
                this.type_arg();
                }
                }
                this.state = 344;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 345;
            this.match(PineV6Parser.GT);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
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
        this.enterRule(localContext, 48, PineV6Parser.RULE_type_arg);
        try {
            this.state = 349;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 33, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 347;
                this.type_name();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 348;
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
        this.enterRule(localContext, 50, PineV6Parser.RULE_for_in_expr);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 351;
            this.match(PineV6Parser.FOR_STMT);
            this.state = 354;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV6Parser.LSQBR:
                {
                this.state = 352;
                this.ids_array();
                }
                break;
            case PineV6Parser.TYPE:
            case PineV6Parser.METHOD:
            case PineV6Parser.AS:
            case PineV6Parser.SERIES:
            case PineV6Parser.SIMPLE:
            case PineV6Parser.CONST:
            case PineV6Parser.INT_TYPE:
            case PineV6Parser.FLOAT_TYPE:
            case PineV6Parser.BOOL_TYPE:
            case PineV6Parser.STRING_TYPE:
            case PineV6Parser.COLOR_TYPE:
            case PineV6Parser.LINE_TYPE:
            case PineV6Parser.LABEL_TYPE:
            case PineV6Parser.BOX_TYPE:
            case PineV6Parser.TABLE_TYPE:
            case PineV6Parser.ID:
                {
                this.state = 353;
                this.id();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
            this.state = 356;
            this.match(PineV6Parser.IN);
            this.state = 357;
            this.ternary_expr();
            this.state = 358;
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
        this.enterRule(localContext, 52, PineV6Parser.RULE_call_suffix);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 360;
            this.match(PineV6Parser.DOT);
            this.state = 361;
            this.id();
            this.state = 370;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 37, this.context) ) {
            case 1:
                {
                this.state = 363;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 54) {
                    {
                    this.state = 362;
                    this.type_args();
                    }
                }

                this.state = 365;
                this.match(PineV6Parser.LPAR);
                this.state = 367;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 1073497952) !== 0) || ((((_la - 37)) & ~0x1F) === 0 && ((1 << (_la - 37)) & 2820146693) !== 0) || ((((_la - 69)) & ~0x1F) === 0 && ((1 << (_la - 69)) & 15) !== 0)) {
                    {
                    this.state = 366;
                    this.fun_actual_args();
                    }
                }

                this.state = 369;
                this.match(PineV6Parser.RPAR);
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
        this.enterRule(localContext, 54, PineV6Parser.RULE_fun_call);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 372;
            this.id();
            this.state = 374;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 54) {
                {
                this.state = 373;
                this.type_args();
                }
            }

            this.state = 376;
            this.match(PineV6Parser.LPAR);
            this.state = 378;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 1073497952) !== 0) || ((((_la - 37)) & ~0x1F) === 0 && ((1 << (_la - 37)) & 2820146693) !== 0) || ((((_la - 69)) & ~0x1F) === 0 && ((1 << (_la - 69)) & 15) !== 0)) {
                {
                this.state = 377;
                this.fun_actual_args();
                }
            }

            this.state = 380;
            this.match(PineV6Parser.RPAR);
            this.state = 384;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 76) {
                {
                {
                this.state = 381;
                this.call_suffix();
                }
                }
                this.state = 386;
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
        this.enterRule(localContext, 56, PineV6Parser.RULE_atom);
        let _la: number;
        try {
            this.state = 405;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 43, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 387;
                this.fun_call();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 388;
                this.id();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 389;
                this.literal();
                this.state = 393;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 76) {
                    {
                    {
                    this.state = 390;
                    this.call_suffix();
                    }
                    }
                    this.state = 395;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 396;
                this.match(PineV6Parser.LPAR);
                this.state = 397;
                this.arith_expr();
                this.state = 398;
                this.match(PineV6Parser.RPAR);
                this.state = 402;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 76) {
                    {
                    {
                    this.state = 399;
                    this.call_suffix();
                    }
                    }
                    this.state = 404;
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
    public stmt(): StmtContext {
        let localContext = new StmtContext(this.context, this.state);
        this.enterRule(localContext, 58, PineV6Parser.RULE_stmt);
        try {
            this.state = 414;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 44, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 407;
                this.import_stmt();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 408;
                this.export_stmt();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 409;
                this.type_def_stmt();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 410;
                this.enum_def_stmt();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 411;
                this.method_def_stmt();
                }
                break;
            case 6:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 412;
                this.fun_def_stmt();
                }
                break;
            case 7:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 413;
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
        this.enterRule(localContext, 60, PineV6Parser.RULE_fun_head);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 416;
            this.match(PineV6Parser.LPAR);
            this.state = 425;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 1073497600) !== 0) || _la === 72) {
                {
                this.state = 417;
                this.fun_param();
                this.state = 422;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 63) {
                    {
                    {
                    this.state = 418;
                    this.match(PineV6Parser.COMMA);
                    this.state = 419;
                    this.fun_param();
                    }
                    }
                    this.state = 424;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                }
            }

            this.state = 427;
            this.match(PineV6Parser.RPAR);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
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
        this.enterRule(localContext, 62, PineV6Parser.RULE_var_def);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 430;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 16 || _la === 17) {
                {
                this.state = 429;
                this.decl_mod();
                }
            }

            this.state = 433;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 48, this.context) ) {
            case 1:
                {
                this.state = 432;
                this.type_qual();
                }
                break;
            }
            this.state = 436;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 49, this.context) ) {
            case 1:
                {
                this.state = 435;
                this.field_type();
                }
                break;
            }
            this.state = 438;
            this.id();
            this.state = 439;
            this.match(PineV6Parser.DEFINE);
            this.state = 440;
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
        this.enterRule(localContext, 64, PineV6Parser.RULE_var_defs);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 443;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 16 || _la === 17) {
                {
                this.state = 442;
                this.decl_mod();
                }
            }

            this.state = 446;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 51, this.context) ) {
            case 1:
                {
                this.state = 445;
                this.type_qual();
                }
                break;
            }
            this.state = 449;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 1073497600) !== 0) || _la === 72) {
                {
                this.state = 448;
                this.field_type();
                }
            }

            this.state = 451;
            this.ids_array();
            this.state = 452;
            this.match(PineV6Parser.DEFINE);
            this.state = 453;
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
        this.enterRule(localContext, 66, PineV6Parser.RULE_id_part);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 455;
            _la = this.tokenStream.LA(1);
            if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 1073497600) !== 0) || _la === 72)) {
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
    public arith_expr(): Arith_exprContext {
        let localContext = new Arith_exprContext(this.context, this.state);
        this.enterRule(localContext, 68, PineV6Parser.RULE_arith_expr);
        try {
            this.state = 462;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 53, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 457;
                this.ternary_expr();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 458;
                this.if_expr();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 459;
                this.for_expr();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 460;
                this.for_in_expr();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 461;
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
        this.enterRule(localContext, 70, PineV6Parser.RULE_decl_mod);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 464;
            _la = this.tokenStream.LA(1);
            if(!(_la === 16 || _la === 17)) {
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
        this.enterRule(localContext, 72, PineV6Parser.RULE_type_qual);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 466;
            _la = this.tokenStream.LA(1);
            if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 1835008) !== 0))) {
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
        this.enterRule(localContext, 74, PineV6Parser.RULE_type_name);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 468;
            _la = this.tokenStream.LA(1);
            if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 1071644672) !== 0))) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            this.state = 471;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 54, this.context) ) {
            case 1:
                {
                this.state = 469;
                this.match(PineV6Parser.LSQBR);
                this.state = 470;
                this.match(PineV6Parser.RSQBR);
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
        this.enterRule(localContext, 76, PineV6Parser.RULE_compound_assign_op);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 473;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 30)) & ~0x1F) === 0 && ((1 << (_la - 30)) & 31) !== 0))) {
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
        this.enterRule(localContext, 78, PineV6Parser.RULE_var_assign);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 475;
            this.id();
            this.state = 478;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV6Parser.ASSIGN:
                {
                this.state = 476;
                this.match(PineV6Parser.ASSIGN);
                }
                break;
            case PineV6Parser.PLUS_ASSIGN:
            case PineV6Parser.MINUS_ASSIGN:
            case PineV6Parser.MUL_ASSIGN:
            case PineV6Parser.DIV_ASSIGN:
            case PineV6Parser.MOD_ASSIGN:
                {
                this.state = 477;
                this.compound_assign_op();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
            this.state = 480;
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
        this.enterRule(localContext, 80, PineV6Parser.RULE_if_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 482;
            this.match(PineV6Parser.IF_COND);
            this.state = 483;
            this.ternary_expr();
            this.state = 484;
            this.stmts_block();
            this.state = 496;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 58, this.context) ) {
            case 1:
                {
                this.state = 488;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 3) {
                    {
                    {
                    this.state = 485;
                    this.match(PineV6Parser.LEND);
                    }
                    }
                    this.state = 490;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                this.state = 491;
                this.match(PineV6Parser.IF_COND_ELSE);
                this.state = 494;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case PineV6Parser.IF_COND:
                    {
                    this.state = 492;
                    this.if_expr();
                    }
                    break;
                case PineV6Parser.BEGIN:
                    {
                    this.state = 493;
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
        this.enterRule(localContext, 82, PineV6Parser.RULE_pos_arg);
        try {
            this.state = 500;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV6Parser.MLSTRING_DQ:
            case PineV6Parser.MLSTRING_SQ:
            case PineV6Parser.SWITCH:
            case PineV6Parser.TYPE:
            case PineV6Parser.METHOD:
            case PineV6Parser.AS:
            case PineV6Parser.SERIES:
            case PineV6Parser.SIMPLE:
            case PineV6Parser.CONST:
            case PineV6Parser.INT_TYPE:
            case PineV6Parser.FLOAT_TYPE:
            case PineV6Parser.BOOL_TYPE:
            case PineV6Parser.STRING_TYPE:
            case PineV6Parser.COLOR_TYPE:
            case PineV6Parser.LINE_TYPE:
            case PineV6Parser.LABEL_TYPE:
            case PineV6Parser.BOX_TYPE:
            case PineV6Parser.TABLE_TYPE:
            case PineV6Parser.IF_COND:
            case PineV6Parser.FOR_STMT:
            case PineV6Parser.NOT:
            case PineV6Parser.BOOL_LITERAL:
            case PineV6Parser.PLUS:
            case PineV6Parser.MINUS:
            case PineV6Parser.LPAR:
            case PineV6Parser.INT_LITERAL:
            case PineV6Parser.FLOAT_LITERAL:
            case PineV6Parser.STR_LITERAL:
            case PineV6Parser.COLOR_LITERAL:
            case PineV6Parser.ID:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 498;
                this.arith_expr();
                }
                break;
            case PineV6Parser.LSQBR:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 499;
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
        this.enterRule(localContext, 84, PineV6Parser.RULE_pos_args);
        try {
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 502;
            this.pos_arg();
            this.state = 507;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 60, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
                    {
                    {
                    this.state = 503;
                    this.match(PineV6Parser.COMMA);
                    this.state = 504;
                    this.pos_arg();
                    }
                    }
                }
                this.state = 509;
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
    public pine_script(): Pine_scriptContext {
        let localContext = new Pine_scriptContext(this.context, this.state);
        this.enterRule(localContext, 86, PineV6Parser.RULE_pine_script);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 514;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 1073709048) !== 0) || ((((_la - 37)) & ~0x1F) === 0 && ((1 << (_la - 37)) & 2820146789) !== 0) || ((((_la - 69)) & ~0x1F) === 0 && ((1 << (_la - 69)) & 15) !== 0)) {
                {
                this.state = 512;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case PineV6Parser.ONCE:
                case PineV6Parser.MLSTRING_DQ:
                case PineV6Parser.MLSTRING_SQ:
                case PineV6Parser.WHILE:
                case PineV6Parser.SWITCH:
                case PineV6Parser.TYPE:
                case PineV6Parser.METHOD:
                case PineV6Parser.IMPORT:
                case PineV6Parser.EXPORT:
                case PineV6Parser.ENUM:
                case PineV6Parser.AS:
                case PineV6Parser.VAR:
                case PineV6Parser.VARIP:
                case PineV6Parser.SERIES:
                case PineV6Parser.SIMPLE:
                case PineV6Parser.CONST:
                case PineV6Parser.INT_TYPE:
                case PineV6Parser.FLOAT_TYPE:
                case PineV6Parser.BOOL_TYPE:
                case PineV6Parser.STRING_TYPE:
                case PineV6Parser.COLOR_TYPE:
                case PineV6Parser.LINE_TYPE:
                case PineV6Parser.LABEL_TYPE:
                case PineV6Parser.BOX_TYPE:
                case PineV6Parser.TABLE_TYPE:
                case PineV6Parser.IF_COND:
                case PineV6Parser.FOR_STMT:
                case PineV6Parser.BREAK:
                case PineV6Parser.CONTINUE:
                case PineV6Parser.NOT:
                case PineV6Parser.BOOL_LITERAL:
                case PineV6Parser.PLUS:
                case PineV6Parser.MINUS:
                case PineV6Parser.LPAR:
                case PineV6Parser.LSQBR:
                case PineV6Parser.INT_LITERAL:
                case PineV6Parser.FLOAT_LITERAL:
                case PineV6Parser.STR_LITERAL:
                case PineV6Parser.COLOR_LITERAL:
                case PineV6Parser.ID:
                    {
                    this.state = 510;
                    this.stmt();
                    }
                    break;
                case PineV6Parser.LEND:
                    {
                    this.state = 511;
                    this.match(PineV6Parser.LEND);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                this.state = 516;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 517;
            this.match(PineV6Parser.EOF);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
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
        this.enterRule(localContext, 88, PineV6Parser.RULE_global_stmt);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 519;
            this.global_stmt_content();
            this.state = 524;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 63) {
                {
                {
                this.state = 520;
                this.match(PineV6Parser.COMMA);
                this.state = 521;
                this.global_stmt_content();
                }
                }
                this.state = 526;
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
        this.enterRule(localContext, 90, PineV6Parser.RULE_fun_def_stmt);
        try {
            this.state = 529;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 64, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 527;
                this.fun_def_singleline();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 528;
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
        this.enterRule(localContext, 92, PineV6Parser.RULE_fun_def_singleline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 531;
            this.id();
            this.state = 532;
            this.fun_head();
            this.state = 533;
            this.match(PineV6Parser.ARROW);
            this.state = 534;
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
        this.enterRule(localContext, 94, PineV6Parser.RULE_fun_def_multiline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 536;
            this.id();
            this.state = 537;
            this.fun_head();
            this.state = 538;
            this.match(PineV6Parser.ARROW);
            this.state = 539;
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
        this.enterRule(localContext, 96, PineV6Parser.RULE_fun_body_singleline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 541;
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
        this.enterRule(localContext, 98, PineV6Parser.RULE_local_stmt_singleline);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 543;
            this.local_stmt_content();
            this.state = 548;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 63) {
                {
                {
                this.state = 544;
                this.match(PineV6Parser.COMMA);
                this.state = 545;
                this.local_stmt_content();
                }
                }
                this.state = 550;
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
        this.enterRule(localContext, 100, PineV6Parser.RULE_loop_break);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 551;
            this.match(PineV6Parser.BREAK);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
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
        this.enterRule(localContext, 102, PineV6Parser.RULE_loop_continue);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 553;
            this.match(PineV6Parser.CONTINUE);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
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
        this.enterRule(localContext, 104, PineV6Parser.RULE_fun_body_multiline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 555;
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
        this.enterRule(localContext, 106, PineV6Parser.RULE_local_stmts_multiline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 557;
            this.match(PineV6Parser.BEGIN);
            this.state = 558;
            this.local_stmts_list();
            this.state = 559;
            this.match(PineV6Parser.END);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
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
        this.enterRule(localContext, 108, PineV6Parser.RULE_local_stmts_list);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 563;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                this.state = 563;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case PineV6Parser.ONCE:
                case PineV6Parser.MLSTRING_DQ:
                case PineV6Parser.MLSTRING_SQ:
                case PineV6Parser.WHILE:
                case PineV6Parser.SWITCH:
                case PineV6Parser.TYPE:
                case PineV6Parser.METHOD:
                case PineV6Parser.AS:
                case PineV6Parser.VAR:
                case PineV6Parser.VARIP:
                case PineV6Parser.SERIES:
                case PineV6Parser.SIMPLE:
                case PineV6Parser.CONST:
                case PineV6Parser.INT_TYPE:
                case PineV6Parser.FLOAT_TYPE:
                case PineV6Parser.BOOL_TYPE:
                case PineV6Parser.STRING_TYPE:
                case PineV6Parser.COLOR_TYPE:
                case PineV6Parser.LINE_TYPE:
                case PineV6Parser.LABEL_TYPE:
                case PineV6Parser.BOX_TYPE:
                case PineV6Parser.TABLE_TYPE:
                case PineV6Parser.IF_COND:
                case PineV6Parser.FOR_STMT:
                case PineV6Parser.BREAK:
                case PineV6Parser.CONTINUE:
                case PineV6Parser.NOT:
                case PineV6Parser.BOOL_LITERAL:
                case PineV6Parser.PLUS:
                case PineV6Parser.MINUS:
                case PineV6Parser.LPAR:
                case PineV6Parser.LSQBR:
                case PineV6Parser.INT_LITERAL:
                case PineV6Parser.FLOAT_LITERAL:
                case PineV6Parser.STR_LITERAL:
                case PineV6Parser.COLOR_LITERAL:
                case PineV6Parser.ID:
                    {
                    this.state = 561;
                    this.local_stmt_multiline();
                    }
                    break;
                case PineV6Parser.LEND:
                    {
                    this.state = 562;
                    this.match(PineV6Parser.LEND);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                this.state = 565;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 1073694712) !== 0) || ((((_la - 37)) & ~0x1F) === 0 && ((1 << (_la - 37)) & 2820146789) !== 0) || ((((_la - 69)) & ~0x1F) === 0 && ((1 << (_la - 69)) & 15) !== 0));
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
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
        this.enterRule(localContext, 110, PineV6Parser.RULE_local_stmt_multiline);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 567;
            this.local_stmt_content();
            this.state = 572;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 63) {
                {
                {
                this.state = 568;
                this.match(PineV6Parser.COMMA);
                this.state = 569;
                this.local_stmt_content();
                }
                }
                this.state = 574;
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
        this.enterRule(localContext, 112, PineV6Parser.RULE_ids_array);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 575;
            this.match(PineV6Parser.LSQBR);
            this.state = 576;
            this.id();
            this.state = 581;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 63) {
                {
                {
                this.state = 577;
                this.match(PineV6Parser.COMMA);
                this.state = 578;
                this.id();
                }
                }
                this.state = 583;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 584;
            this.match(PineV6Parser.RSQBR);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
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
        this.enterRule(localContext, 114, PineV6Parser.RULE_arith_exprs);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 586;
            this.match(PineV6Parser.LSQBR);
            this.state = 587;
            this.arith_expr();
            this.state = 592;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 63) {
                {
                {
                this.state = 588;
                this.match(PineV6Parser.COMMA);
                this.state = 589;
                this.arith_expr();
                }
                }
                this.state = 594;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 595;
            this.match(PineV6Parser.RSQBR);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
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
        this.enterRule(localContext, 116, PineV6Parser.RULE_for_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 597;
            this.match(PineV6Parser.FOR_STMT);
            this.state = 598;
            this.var_def();
            this.state = 599;
            this.match(PineV6Parser.FOR_STMT_TO);
            this.state = 600;
            this.ternary_expr();
            this.state = 603;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 41) {
                {
                this.state = 601;
                this.match(PineV6Parser.FOR_STMT_BY);
                this.state = 602;
                this.ternary_expr();
                }
            }

            this.state = 605;
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
        this.enterRule(localContext, 118, PineV6Parser.RULE_stmts_block);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 607;
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
        this.enterRule(localContext, 120, PineV6Parser.RULE_ternary_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 609;
            this.or_expr();
            this.state = 615;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 48) {
                {
                this.state = 610;
                this.match(PineV6Parser.COND);
                this.state = 611;
                this.ternary_expr();
                this.state = 612;
                this.match(PineV6Parser.COND_ELSE);
                this.state = 613;
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
        this.enterRule(localContext, 122, PineV6Parser.RULE_or_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 617;
            this.and_expr();
            this.state = 622;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 44) {
                {
                {
                this.state = 618;
                this.match(PineV6Parser.OR);
                this.state = 619;
                this.and_expr();
                }
                }
                this.state = 624;
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
        this.enterRule(localContext, 124, PineV6Parser.RULE_and_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 625;
            this.eq_expr();
            this.state = 630;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 45) {
                {
                {
                this.state = 626;
                this.match(PineV6Parser.AND);
                this.state = 627;
                this.eq_expr();
                }
                }
                this.state = 632;
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
        this.enterRule(localContext, 126, PineV6Parser.RULE_eq_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 633;
            this.cmp_expr();
            this.state = 638;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 50 || _la === 51) {
                {
                {
                this.state = 634;
                _la = this.tokenStream.LA(1);
                if(!(_la === 50 || _la === 51)) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                this.state = 635;
                this.cmp_expr();
                }
                }
                this.state = 640;
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
        this.enterRule(localContext, 128, PineV6Parser.RULE_cmp_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 641;
            this.add_expr();
            this.state = 646;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (((((_la - 52)) & ~0x1F) === 0 && ((1 << (_la - 52)) & 15) !== 0)) {
                {
                {
                this.state = 642;
                _la = this.tokenStream.LA(1);
                if(!(((((_la - 52)) & ~0x1F) === 0 && ((1 << (_la - 52)) & 15) !== 0))) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                this.state = 643;
                this.add_expr();
                }
                }
                this.state = 648;
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
        this.enterRule(localContext, 130, PineV6Parser.RULE_add_expr);
        let _la: number;
        try {
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 649;
            this.mult_expr();
            this.state = 654;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 77, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
                    {
                    {
                    this.state = 650;
                    _la = this.tokenStream.LA(1);
                    if(!(_la === 56 || _la === 57)) {
                    this.errorHandler.recoverInline(this);
                    }
                    else {
                        this.errorHandler.reportMatch(this);
                        this.consume();
                    }
                    this.state = 651;
                    this.mult_expr();
                    }
                    }
                }
                this.state = 656;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 77, this.context);
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
        this.enterRule(localContext, 132, PineV6Parser.RULE_mult_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 657;
            this.unary_expr();
            this.state = 662;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (((((_la - 58)) & ~0x1F) === 0 && ((1 << (_la - 58)) & 7) !== 0)) {
                {
                {
                this.state = 658;
                _la = this.tokenStream.LA(1);
                if(!(((((_la - 58)) & ~0x1F) === 0 && ((1 << (_la - 58)) & 7) !== 0))) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                this.state = 659;
                this.unary_expr();
                }
                }
                this.state = 664;
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
        this.enterRule(localContext, 134, PineV6Parser.RULE_unary_expr);
        try {
            this.state = 672;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV6Parser.MLSTRING_DQ:
            case PineV6Parser.MLSTRING_SQ:
            case PineV6Parser.TYPE:
            case PineV6Parser.METHOD:
            case PineV6Parser.AS:
            case PineV6Parser.SERIES:
            case PineV6Parser.SIMPLE:
            case PineV6Parser.CONST:
            case PineV6Parser.INT_TYPE:
            case PineV6Parser.FLOAT_TYPE:
            case PineV6Parser.BOOL_TYPE:
            case PineV6Parser.STRING_TYPE:
            case PineV6Parser.COLOR_TYPE:
            case PineV6Parser.LINE_TYPE:
            case PineV6Parser.LABEL_TYPE:
            case PineV6Parser.BOX_TYPE:
            case PineV6Parser.TABLE_TYPE:
            case PineV6Parser.BOOL_LITERAL:
            case PineV6Parser.LPAR:
            case PineV6Parser.INT_LITERAL:
            case PineV6Parser.FLOAT_LITERAL:
            case PineV6Parser.STR_LITERAL:
            case PineV6Parser.COLOR_LITERAL:
            case PineV6Parser.ID:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 665;
                this.sqbr_expr();
                }
                break;
            case PineV6Parser.NOT:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 666;
                this.match(PineV6Parser.NOT);
                this.state = 667;
                this.sqbr_expr();
                }
                break;
            case PineV6Parser.PLUS:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 668;
                this.match(PineV6Parser.PLUS);
                this.state = 669;
                this.sqbr_expr();
                }
                break;
            case PineV6Parser.MINUS:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 670;
                this.match(PineV6Parser.MINUS);
                this.state = 671;
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
        this.enterRule(localContext, 136, PineV6Parser.RULE_sqbr_expr);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 674;
            this.atom();
            this.state = 679;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 80, this.context) ) {
            case 1:
                {
                this.state = 675;
                this.match(PineV6Parser.LSQBR);
                this.state = 676;
                this.arith_expr();
                this.state = 677;
                this.match(PineV6Parser.RSQBR);
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
        this.enterRule(localContext, 138, PineV6Parser.RULE_fun_actual_args);
        let _la: number;
        try {
            this.state = 687;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 82, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 681;
                this.kw_args();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 682;
                this.pos_args();
                this.state = 685;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 63) {
                    {
                    this.state = 683;
                    this.match(PineV6Parser.COMMA);
                    this.state = 684;
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
        this.enterRule(localContext, 140, PineV6Parser.RULE_kw_args);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 689;
            this.kw_arg();
            this.state = 694;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 63) {
                {
                {
                this.state = 690;
                this.match(PineV6Parser.COMMA);
                this.state = 691;
                this.kw_arg();
                }
                }
                this.state = 696;
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
        this.enterRule(localContext, 142, PineV6Parser.RULE_kw_arg);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 697;
            this.id();
            this.state = 698;
            this.match(PineV6Parser.DEFINE);
            this.state = 701;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV6Parser.MLSTRING_DQ:
            case PineV6Parser.MLSTRING_SQ:
            case PineV6Parser.SWITCH:
            case PineV6Parser.TYPE:
            case PineV6Parser.METHOD:
            case PineV6Parser.AS:
            case PineV6Parser.SERIES:
            case PineV6Parser.SIMPLE:
            case PineV6Parser.CONST:
            case PineV6Parser.INT_TYPE:
            case PineV6Parser.FLOAT_TYPE:
            case PineV6Parser.BOOL_TYPE:
            case PineV6Parser.STRING_TYPE:
            case PineV6Parser.COLOR_TYPE:
            case PineV6Parser.LINE_TYPE:
            case PineV6Parser.LABEL_TYPE:
            case PineV6Parser.BOX_TYPE:
            case PineV6Parser.TABLE_TYPE:
            case PineV6Parser.IF_COND:
            case PineV6Parser.FOR_STMT:
            case PineV6Parser.NOT:
            case PineV6Parser.BOOL_LITERAL:
            case PineV6Parser.PLUS:
            case PineV6Parser.MINUS:
            case PineV6Parser.LPAR:
            case PineV6Parser.INT_LITERAL:
            case PineV6Parser.FLOAT_LITERAL:
            case PineV6Parser.STR_LITERAL:
            case PineV6Parser.COLOR_LITERAL:
            case PineV6Parser.ID:
                {
                this.state = 699;
                this.arith_expr();
                }
                break;
            case PineV6Parser.LSQBR:
                {
                this.state = 700;
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
        this.enterRule(localContext, 144, PineV6Parser.RULE_literal);
        try {
            this.state = 705;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV6Parser.INT_LITERAL:
            case PineV6Parser.FLOAT_LITERAL:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 703;
                this.num_literal();
                }
                break;
            case PineV6Parser.MLSTRING_DQ:
            case PineV6Parser.MLSTRING_SQ:
            case PineV6Parser.BOOL_LITERAL:
            case PineV6Parser.STR_LITERAL:
            case PineV6Parser.COLOR_LITERAL:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 704;
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
        this.enterRule(localContext, 146, PineV6Parser.RULE_num_literal);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 707;
            _la = this.tokenStream.LA(1);
            if(!(_la === 68 || _la === 69)) {
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
        4,1,76,710,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,2,6,7,
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
        7,72,2,73,7,73,1,0,1,0,3,0,151,8,0,1,0,1,0,1,1,1,1,1,2,1,2,1,2,1,
        2,1,2,1,2,1,2,1,2,1,2,1,2,1,2,1,2,1,2,3,2,170,8,2,1,3,1,3,1,3,1,
        3,1,3,1,3,1,3,1,3,1,3,3,3,181,8,3,1,4,1,4,1,4,1,4,1,4,1,4,1,4,1,
        4,1,4,3,4,192,8,4,5,4,194,8,4,10,4,12,4,197,9,4,1,5,1,5,1,5,1,5,
        1,5,1,5,3,5,205,8,5,1,6,1,6,1,6,1,6,1,7,1,7,3,7,213,8,7,1,7,1,7,
        1,8,1,8,1,8,4,8,220,8,8,11,8,12,8,221,1,8,1,8,1,9,3,9,227,8,9,1,
        9,1,9,1,9,3,9,232,8,9,1,10,1,10,3,10,236,8,10,1,10,3,10,239,8,10,
        1,10,1,10,3,10,243,8,10,1,11,1,11,1,11,1,11,1,12,1,12,1,12,4,12,
        252,8,12,11,12,12,12,253,1,12,1,12,1,13,3,13,259,8,13,1,13,3,13,
        262,8,13,1,13,3,13,265,8,13,1,13,1,13,1,13,3,13,270,8,13,1,14,1,
        14,1,14,1,15,1,15,1,15,1,15,1,16,1,16,1,16,4,16,282,8,16,11,16,12,
        16,283,1,16,1,16,1,17,1,17,1,17,3,17,291,8,17,1,18,1,18,1,18,1,18,
        3,18,297,8,18,1,19,1,19,1,19,1,19,1,19,3,19,304,8,19,5,19,306,8,
        19,10,19,12,19,309,9,19,1,20,1,20,1,20,5,20,314,8,20,10,20,12,20,
        317,9,20,1,21,1,21,1,21,3,21,322,8,21,3,21,324,8,21,1,22,3,22,327,
        8,22,1,22,3,22,330,8,22,1,22,1,22,1,22,3,22,335,8,22,1,23,1,23,1,
        23,1,23,5,23,341,8,23,10,23,12,23,344,9,23,1,23,1,23,1,24,1,24,3,
        24,350,8,24,1,25,1,25,1,25,3,25,355,8,25,1,25,1,25,1,25,1,25,1,26,
        1,26,1,26,3,26,364,8,26,1,26,1,26,3,26,368,8,26,1,26,3,26,371,8,
        26,1,27,1,27,3,27,375,8,27,1,27,1,27,3,27,379,8,27,1,27,1,27,5,27,
        383,8,27,10,27,12,27,386,9,27,1,28,1,28,1,28,1,28,5,28,392,8,28,
        10,28,12,28,395,9,28,1,28,1,28,1,28,1,28,5,28,401,8,28,10,28,12,
        28,404,9,28,3,28,406,8,28,1,29,1,29,1,29,1,29,1,29,1,29,1,29,3,29,
        415,8,29,1,30,1,30,1,30,1,30,5,30,421,8,30,10,30,12,30,424,9,30,
        3,30,426,8,30,1,30,1,30,1,31,3,31,431,8,31,1,31,3,31,434,8,31,1,
        31,3,31,437,8,31,1,31,1,31,1,31,1,31,1,32,3,32,444,8,32,1,32,3,32,
        447,8,32,1,32,3,32,450,8,32,1,32,1,32,1,32,1,32,1,33,1,33,1,34,1,
        34,1,34,1,34,1,34,3,34,463,8,34,1,35,1,35,1,36,1,36,1,37,1,37,1,
        37,3,37,472,8,37,1,38,1,38,1,39,1,39,1,39,3,39,479,8,39,1,39,1,39,
        1,40,1,40,1,40,1,40,5,40,487,8,40,10,40,12,40,490,9,40,1,40,1,40,
        1,40,3,40,495,8,40,3,40,497,8,40,1,41,1,41,3,41,501,8,41,1,42,1,
        42,1,42,5,42,506,8,42,10,42,12,42,509,9,42,1,43,1,43,5,43,513,8,
        43,10,43,12,43,516,9,43,1,43,1,43,1,44,1,44,1,44,5,44,523,8,44,10,
        44,12,44,526,9,44,1,45,1,45,3,45,530,8,45,1,46,1,46,1,46,1,46,1,
        46,1,47,1,47,1,47,1,47,1,47,1,48,1,48,1,49,1,49,1,49,5,49,547,8,
        49,10,49,12,49,550,9,49,1,50,1,50,1,51,1,51,1,52,1,52,1,53,1,53,
        1,53,1,53,1,54,1,54,4,54,564,8,54,11,54,12,54,565,1,55,1,55,1,55,
        5,55,571,8,55,10,55,12,55,574,9,55,1,56,1,56,1,56,1,56,5,56,580,
        8,56,10,56,12,56,583,9,56,1,56,1,56,1,57,1,57,1,57,1,57,5,57,591,
        8,57,10,57,12,57,594,9,57,1,57,1,57,1,58,1,58,1,58,1,58,1,58,1,58,
        3,58,604,8,58,1,58,1,58,1,59,1,59,1,60,1,60,1,60,1,60,1,60,1,60,
        3,60,616,8,60,1,61,1,61,1,61,5,61,621,8,61,10,61,12,61,624,9,61,
        1,62,1,62,1,62,5,62,629,8,62,10,62,12,62,632,9,62,1,63,1,63,1,63,
        5,63,637,8,63,10,63,12,63,640,9,63,1,64,1,64,1,64,5,64,645,8,64,
        10,64,12,64,648,9,64,1,65,1,65,1,65,5,65,653,8,65,10,65,12,65,656,
        9,65,1,66,1,66,1,66,5,66,661,8,66,10,66,12,66,664,9,66,1,67,1,67,
        1,67,1,67,1,67,1,67,1,67,3,67,673,8,67,1,68,1,68,1,68,1,68,1,68,
        3,68,680,8,68,1,69,1,69,1,69,1,69,3,69,686,8,69,3,69,688,8,69,1,
        70,1,70,1,70,5,70,693,8,70,10,70,12,70,696,9,70,1,71,1,71,1,71,1,
        71,3,71,702,8,71,1,72,1,72,3,72,706,8,72,1,73,1,73,1,73,0,0,74,0,
        2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44,46,
        48,50,52,54,56,58,60,62,64,66,68,70,72,74,76,78,80,82,84,86,88,90,
        92,94,96,98,100,102,104,106,108,110,112,114,116,118,120,122,124,
        126,128,130,132,134,136,138,140,142,144,146,0,11,3,0,5,6,47,47,70,
        71,4,0,9,10,14,14,18,29,72,72,1,0,16,17,1,0,18,20,1,0,21,29,1,0,
        30,34,1,0,50,51,1,0,52,55,1,0,56,57,1,0,58,60,1,0,68,69,760,0,148,
        1,0,0,0,2,154,1,0,0,0,4,169,1,0,0,0,6,180,1,0,0,0,8,182,1,0,0,0,
        10,198,1,0,0,0,12,206,1,0,0,0,14,210,1,0,0,0,16,216,1,0,0,0,18,226,
        1,0,0,0,20,235,1,0,0,0,22,244,1,0,0,0,24,248,1,0,0,0,26,258,1,0,
        0,0,28,271,1,0,0,0,30,274,1,0,0,0,32,278,1,0,0,0,34,287,1,0,0,0,
        36,292,1,0,0,0,38,298,1,0,0,0,40,310,1,0,0,0,42,323,1,0,0,0,44,326,
        1,0,0,0,46,336,1,0,0,0,48,349,1,0,0,0,50,351,1,0,0,0,52,360,1,0,
        0,0,54,372,1,0,0,0,56,405,1,0,0,0,58,414,1,0,0,0,60,416,1,0,0,0,
        62,430,1,0,0,0,64,443,1,0,0,0,66,455,1,0,0,0,68,462,1,0,0,0,70,464,
        1,0,0,0,72,466,1,0,0,0,74,468,1,0,0,0,76,473,1,0,0,0,78,475,1,0,
        0,0,80,482,1,0,0,0,82,500,1,0,0,0,84,502,1,0,0,0,86,514,1,0,0,0,
        88,519,1,0,0,0,90,529,1,0,0,0,92,531,1,0,0,0,94,536,1,0,0,0,96,541,
        1,0,0,0,98,543,1,0,0,0,100,551,1,0,0,0,102,553,1,0,0,0,104,555,1,
        0,0,0,106,557,1,0,0,0,108,563,1,0,0,0,110,567,1,0,0,0,112,575,1,
        0,0,0,114,586,1,0,0,0,116,597,1,0,0,0,118,607,1,0,0,0,120,609,1,
        0,0,0,122,617,1,0,0,0,124,625,1,0,0,0,126,633,1,0,0,0,128,641,1,
        0,0,0,130,649,1,0,0,0,132,657,1,0,0,0,134,672,1,0,0,0,136,674,1,
        0,0,0,138,687,1,0,0,0,140,689,1,0,0,0,142,697,1,0,0,0,144,705,1,
        0,0,0,146,707,1,0,0,0,148,150,5,4,0,0,149,151,3,120,60,0,150,149,
        1,0,0,0,150,151,1,0,0,0,151,152,1,0,0,0,152,153,3,118,59,0,153,1,
        1,0,0,0,154,155,7,0,0,0,155,3,1,0,0,0,156,170,3,62,31,0,157,170,
        3,64,32,0,158,170,3,54,27,0,159,170,3,80,40,0,160,170,3,78,39,0,
        161,170,3,116,58,0,162,170,3,50,25,0,163,170,3,12,6,0,164,170,3,
        14,7,0,165,170,3,0,0,0,166,170,3,100,50,0,167,170,3,102,51,0,168,
        170,3,68,34,0,169,156,1,0,0,0,169,157,1,0,0,0,169,158,1,0,0,0,169,
        159,1,0,0,0,169,160,1,0,0,0,169,161,1,0,0,0,169,162,1,0,0,0,169,
        163,1,0,0,0,169,164,1,0,0,0,169,165,1,0,0,0,169,166,1,0,0,0,169,
        167,1,0,0,0,169,168,1,0,0,0,170,5,1,0,0,0,171,181,3,62,31,0,172,
        181,3,64,32,0,173,181,3,68,34,0,174,181,3,114,57,0,175,181,3,78,
        39,0,176,181,3,12,6,0,177,181,3,0,0,0,178,181,3,100,50,0,179,181,
        3,102,51,0,180,171,1,0,0,0,180,172,1,0,0,0,180,173,1,0,0,0,180,174,
        1,0,0,0,180,175,1,0,0,0,180,176,1,0,0,0,180,177,1,0,0,0,180,178,
        1,0,0,0,180,179,1,0,0,0,181,7,1,0,0,0,182,195,3,66,33,0,183,191,
        5,76,0,0,184,192,3,66,33,0,185,192,5,9,0,0,186,192,5,10,0,0,187,
        192,5,11,0,0,188,192,5,12,0,0,189,192,5,13,0,0,190,192,5,4,0,0,191,
        184,1,0,0,0,191,185,1,0,0,0,191,186,1,0,0,0,191,187,1,0,0,0,191,
        188,1,0,0,0,191,189,1,0,0,0,191,190,1,0,0,0,192,194,1,0,0,0,193,
        183,1,0,0,0,194,197,1,0,0,0,195,193,1,0,0,0,195,196,1,0,0,0,196,
        9,1,0,0,0,197,195,1,0,0,0,198,204,5,12,0,0,199,205,3,22,11,0,200,
        205,3,30,15,0,201,205,3,28,14,0,202,205,3,90,45,0,203,205,3,62,31,
        0,204,199,1,0,0,0,204,200,1,0,0,0,204,201,1,0,0,0,204,202,1,0,0,
        0,204,203,1,0,0,0,205,11,1,0,0,0,206,207,5,7,0,0,207,208,3,120,60,
        0,208,209,3,118,59,0,209,13,1,0,0,0,210,212,5,8,0,0,211,213,3,120,
        60,0,212,211,1,0,0,0,212,213,1,0,0,0,213,214,1,0,0,0,214,215,3,16,
        8,0,215,15,1,0,0,0,216,219,5,1,0,0,217,220,3,18,9,0,218,220,5,3,
        0,0,219,217,1,0,0,0,219,218,1,0,0,0,220,221,1,0,0,0,221,219,1,0,
        0,0,221,222,1,0,0,0,222,223,1,0,0,0,223,224,5,2,0,0,224,17,1,0,0,
        0,225,227,3,120,60,0,226,225,1,0,0,0,226,227,1,0,0,0,227,228,1,0,
        0,0,228,231,5,62,0,0,229,232,3,98,49,0,230,232,3,118,59,0,231,229,
        1,0,0,0,231,230,1,0,0,0,232,19,1,0,0,0,233,236,3,74,37,0,234,236,
        3,8,4,0,235,233,1,0,0,0,235,234,1,0,0,0,236,238,1,0,0,0,237,239,
        3,46,23,0,238,237,1,0,0,0,238,239,1,0,0,0,239,242,1,0,0,0,240,241,
        5,66,0,0,241,243,5,67,0,0,242,240,1,0,0,0,242,243,1,0,0,0,243,21,
        1,0,0,0,244,245,5,9,0,0,245,246,3,8,4,0,246,247,3,24,12,0,247,23,
        1,0,0,0,248,251,5,1,0,0,249,252,3,26,13,0,250,252,5,3,0,0,251,249,
        1,0,0,0,251,250,1,0,0,0,252,253,1,0,0,0,253,251,1,0,0,0,253,254,
        1,0,0,0,254,255,1,0,0,0,255,256,5,2,0,0,256,25,1,0,0,0,257,259,5,
        17,0,0,258,257,1,0,0,0,258,259,1,0,0,0,259,261,1,0,0,0,260,262,3,
        72,36,0,261,260,1,0,0,0,261,262,1,0,0,0,262,264,1,0,0,0,263,265,
        3,20,10,0,264,263,1,0,0,0,264,265,1,0,0,0,265,266,1,0,0,0,266,269,
        3,8,4,0,267,268,5,61,0,0,268,270,3,68,34,0,269,267,1,0,0,0,269,270,
        1,0,0,0,270,27,1,0,0,0,271,272,5,10,0,0,272,273,3,90,45,0,273,29,
        1,0,0,0,274,275,5,13,0,0,275,276,3,8,4,0,276,277,3,32,16,0,277,31,
        1,0,0,0,278,281,5,1,0,0,279,282,3,34,17,0,280,282,5,3,0,0,281,279,
        1,0,0,0,281,280,1,0,0,0,282,283,1,0,0,0,283,281,1,0,0,0,283,284,
        1,0,0,0,284,285,1,0,0,0,285,286,5,2,0,0,286,33,1,0,0,0,287,290,3,
        8,4,0,288,289,5,61,0,0,289,291,3,68,34,0,290,288,1,0,0,0,290,291,
        1,0,0,0,291,35,1,0,0,0,292,293,5,11,0,0,293,296,3,38,19,0,294,295,
        5,14,0,0,295,297,3,8,4,0,296,294,1,0,0,0,296,297,1,0,0,0,297,37,
        1,0,0,0,298,307,3,40,20,0,299,303,5,59,0,0,300,304,3,8,4,0,301,304,
        5,68,0,0,302,304,5,69,0,0,303,300,1,0,0,0,303,301,1,0,0,0,303,302,
        1,0,0,0,304,306,1,0,0,0,305,299,1,0,0,0,306,309,1,0,0,0,307,305,
        1,0,0,0,307,308,1,0,0,0,308,39,1,0,0,0,309,307,1,0,0,0,310,315,3,
        42,21,0,311,312,5,57,0,0,312,314,3,42,21,0,313,311,1,0,0,0,314,317,
        1,0,0,0,315,313,1,0,0,0,315,316,1,0,0,0,316,41,1,0,0,0,317,315,1,
        0,0,0,318,324,3,8,4,0,319,321,5,68,0,0,320,322,3,8,4,0,321,320,1,
        0,0,0,321,322,1,0,0,0,322,324,1,0,0,0,323,318,1,0,0,0,323,319,1,
        0,0,0,324,43,1,0,0,0,325,327,3,72,36,0,326,325,1,0,0,0,326,327,1,
        0,0,0,327,329,1,0,0,0,328,330,3,20,10,0,329,328,1,0,0,0,329,330,
        1,0,0,0,330,331,1,0,0,0,331,334,3,8,4,0,332,333,5,61,0,0,333,335,
        3,68,34,0,334,332,1,0,0,0,334,335,1,0,0,0,335,45,1,0,0,0,336,337,
        5,54,0,0,337,342,3,48,24,0,338,339,5,63,0,0,339,341,3,48,24,0,340,
        338,1,0,0,0,341,344,1,0,0,0,342,340,1,0,0,0,342,343,1,0,0,0,343,
        345,1,0,0,0,344,342,1,0,0,0,345,346,5,52,0,0,346,47,1,0,0,0,347,
        350,3,74,37,0,348,350,3,8,4,0,349,347,1,0,0,0,349,348,1,0,0,0,350,
        49,1,0,0,0,351,354,5,39,0,0,352,355,3,112,56,0,353,355,3,8,4,0,354,
        352,1,0,0,0,354,353,1,0,0,0,355,356,1,0,0,0,356,357,5,15,0,0,357,
        358,3,120,60,0,358,359,3,118,59,0,359,51,1,0,0,0,360,361,5,76,0,
        0,361,370,3,8,4,0,362,364,3,46,23,0,363,362,1,0,0,0,363,364,1,0,
        0,0,364,365,1,0,0,0,365,367,5,64,0,0,366,368,3,138,69,0,367,366,
        1,0,0,0,367,368,1,0,0,0,368,369,1,0,0,0,369,371,5,65,0,0,370,363,
        1,0,0,0,370,371,1,0,0,0,371,53,1,0,0,0,372,374,3,8,4,0,373,375,3,
        46,23,0,374,373,1,0,0,0,374,375,1,0,0,0,375,376,1,0,0,0,376,378,
        5,64,0,0,377,379,3,138,69,0,378,377,1,0,0,0,378,379,1,0,0,0,379,
        380,1,0,0,0,380,384,5,65,0,0,381,383,3,52,26,0,382,381,1,0,0,0,383,
        386,1,0,0,0,384,382,1,0,0,0,384,385,1,0,0,0,385,55,1,0,0,0,386,384,
        1,0,0,0,387,406,3,54,27,0,388,406,3,8,4,0,389,393,3,144,72,0,390,
        392,3,52,26,0,391,390,1,0,0,0,392,395,1,0,0,0,393,391,1,0,0,0,393,
        394,1,0,0,0,394,406,1,0,0,0,395,393,1,0,0,0,396,397,5,64,0,0,397,
        398,3,68,34,0,398,402,5,65,0,0,399,401,3,52,26,0,400,399,1,0,0,0,
        401,404,1,0,0,0,402,400,1,0,0,0,402,403,1,0,0,0,403,406,1,0,0,0,
        404,402,1,0,0,0,405,387,1,0,0,0,405,388,1,0,0,0,405,389,1,0,0,0,
        405,396,1,0,0,0,406,57,1,0,0,0,407,415,3,36,18,0,408,415,3,10,5,
        0,409,415,3,22,11,0,410,415,3,30,15,0,411,415,3,28,14,0,412,415,
        3,90,45,0,413,415,3,88,44,0,414,407,1,0,0,0,414,408,1,0,0,0,414,
        409,1,0,0,0,414,410,1,0,0,0,414,411,1,0,0,0,414,412,1,0,0,0,414,
        413,1,0,0,0,415,59,1,0,0,0,416,425,5,64,0,0,417,422,3,44,22,0,418,
        419,5,63,0,0,419,421,3,44,22,0,420,418,1,0,0,0,421,424,1,0,0,0,422,
        420,1,0,0,0,422,423,1,0,0,0,423,426,1,0,0,0,424,422,1,0,0,0,425,
        417,1,0,0,0,425,426,1,0,0,0,426,427,1,0,0,0,427,428,5,65,0,0,428,
        61,1,0,0,0,429,431,3,70,35,0,430,429,1,0,0,0,430,431,1,0,0,0,431,
        433,1,0,0,0,432,434,3,72,36,0,433,432,1,0,0,0,433,434,1,0,0,0,434,
        436,1,0,0,0,435,437,3,20,10,0,436,435,1,0,0,0,436,437,1,0,0,0,437,
        438,1,0,0,0,438,439,3,8,4,0,439,440,5,61,0,0,440,441,3,68,34,0,441,
        63,1,0,0,0,442,444,3,70,35,0,443,442,1,0,0,0,443,444,1,0,0,0,444,
        446,1,0,0,0,445,447,3,72,36,0,446,445,1,0,0,0,446,447,1,0,0,0,447,
        449,1,0,0,0,448,450,3,20,10,0,449,448,1,0,0,0,449,450,1,0,0,0,450,
        451,1,0,0,0,451,452,3,112,56,0,452,453,5,61,0,0,453,454,3,68,34,
        0,454,65,1,0,0,0,455,456,7,1,0,0,456,67,1,0,0,0,457,463,3,120,60,
        0,458,463,3,80,40,0,459,463,3,116,58,0,460,463,3,50,25,0,461,463,
        3,14,7,0,462,457,1,0,0,0,462,458,1,0,0,0,462,459,1,0,0,0,462,460,
        1,0,0,0,462,461,1,0,0,0,463,69,1,0,0,0,464,465,7,2,0,0,465,71,1,
        0,0,0,466,467,7,3,0,0,467,73,1,0,0,0,468,471,7,4,0,0,469,470,5,66,
        0,0,470,472,5,67,0,0,471,469,1,0,0,0,471,472,1,0,0,0,472,75,1,0,
        0,0,473,474,7,5,0,0,474,77,1,0,0,0,475,478,3,8,4,0,476,479,5,35,
        0,0,477,479,3,76,38,0,478,476,1,0,0,0,478,477,1,0,0,0,479,480,1,
        0,0,0,480,481,3,68,34,0,481,79,1,0,0,0,482,483,5,37,0,0,483,484,
        3,120,60,0,484,496,3,118,59,0,485,487,5,3,0,0,486,485,1,0,0,0,487,
        490,1,0,0,0,488,486,1,0,0,0,488,489,1,0,0,0,489,491,1,0,0,0,490,
        488,1,0,0,0,491,494,5,38,0,0,492,495,3,80,40,0,493,495,3,118,59,
        0,494,492,1,0,0,0,494,493,1,0,0,0,495,497,1,0,0,0,496,488,1,0,0,
        0,496,497,1,0,0,0,497,81,1,0,0,0,498,501,3,68,34,0,499,501,3,114,
        57,0,500,498,1,0,0,0,500,499,1,0,0,0,501,83,1,0,0,0,502,507,3,82,
        41,0,503,504,5,63,0,0,504,506,3,82,41,0,505,503,1,0,0,0,506,509,
        1,0,0,0,507,505,1,0,0,0,507,508,1,0,0,0,508,85,1,0,0,0,509,507,1,
        0,0,0,510,513,3,58,29,0,511,513,5,3,0,0,512,510,1,0,0,0,512,511,
        1,0,0,0,513,516,1,0,0,0,514,512,1,0,0,0,514,515,1,0,0,0,515,517,
        1,0,0,0,516,514,1,0,0,0,517,518,5,0,0,1,518,87,1,0,0,0,519,524,3,
        4,2,0,520,521,5,63,0,0,521,523,3,4,2,0,522,520,1,0,0,0,523,526,1,
        0,0,0,524,522,1,0,0,0,524,525,1,0,0,0,525,89,1,0,0,0,526,524,1,0,
        0,0,527,530,3,92,46,0,528,530,3,94,47,0,529,527,1,0,0,0,529,528,
        1,0,0,0,530,91,1,0,0,0,531,532,3,8,4,0,532,533,3,60,30,0,533,534,
        5,62,0,0,534,535,3,96,48,0,535,93,1,0,0,0,536,537,3,8,4,0,537,538,
        3,60,30,0,538,539,5,62,0,0,539,540,3,104,52,0,540,95,1,0,0,0,541,
        542,3,98,49,0,542,97,1,0,0,0,543,548,3,6,3,0,544,545,5,63,0,0,545,
        547,3,6,3,0,546,544,1,0,0,0,547,550,1,0,0,0,548,546,1,0,0,0,548,
        549,1,0,0,0,549,99,1,0,0,0,550,548,1,0,0,0,551,552,5,42,0,0,552,
        101,1,0,0,0,553,554,5,43,0,0,554,103,1,0,0,0,555,556,3,106,53,0,
        556,105,1,0,0,0,557,558,5,1,0,0,558,559,3,108,54,0,559,560,5,2,0,
        0,560,107,1,0,0,0,561,564,3,110,55,0,562,564,5,3,0,0,563,561,1,0,
        0,0,563,562,1,0,0,0,564,565,1,0,0,0,565,563,1,0,0,0,565,566,1,0,
        0,0,566,109,1,0,0,0,567,572,3,6,3,0,568,569,5,63,0,0,569,571,3,6,
        3,0,570,568,1,0,0,0,571,574,1,0,0,0,572,570,1,0,0,0,572,573,1,0,
        0,0,573,111,1,0,0,0,574,572,1,0,0,0,575,576,5,66,0,0,576,581,3,8,
        4,0,577,578,5,63,0,0,578,580,3,8,4,0,579,577,1,0,0,0,580,583,1,0,
        0,0,581,579,1,0,0,0,581,582,1,0,0,0,582,584,1,0,0,0,583,581,1,0,
        0,0,584,585,5,67,0,0,585,113,1,0,0,0,586,587,5,66,0,0,587,592,3,
        68,34,0,588,589,5,63,0,0,589,591,3,68,34,0,590,588,1,0,0,0,591,594,
        1,0,0,0,592,590,1,0,0,0,592,593,1,0,0,0,593,595,1,0,0,0,594,592,
        1,0,0,0,595,596,5,67,0,0,596,115,1,0,0,0,597,598,5,39,0,0,598,599,
        3,62,31,0,599,600,5,40,0,0,600,603,3,120,60,0,601,602,5,41,0,0,602,
        604,3,120,60,0,603,601,1,0,0,0,603,604,1,0,0,0,604,605,1,0,0,0,605,
        606,3,118,59,0,606,117,1,0,0,0,607,608,3,104,52,0,608,119,1,0,0,
        0,609,615,3,122,61,0,610,611,5,48,0,0,611,612,3,120,60,0,612,613,
        5,49,0,0,613,614,3,120,60,0,614,616,1,0,0,0,615,610,1,0,0,0,615,
        616,1,0,0,0,616,121,1,0,0,0,617,622,3,124,62,0,618,619,5,44,0,0,
        619,621,3,124,62,0,620,618,1,0,0,0,621,624,1,0,0,0,622,620,1,0,0,
        0,622,623,1,0,0,0,623,123,1,0,0,0,624,622,1,0,0,0,625,630,3,126,
        63,0,626,627,5,45,0,0,627,629,3,126,63,0,628,626,1,0,0,0,629,632,
        1,0,0,0,630,628,1,0,0,0,630,631,1,0,0,0,631,125,1,0,0,0,632,630,
        1,0,0,0,633,638,3,128,64,0,634,635,7,6,0,0,635,637,3,128,64,0,636,
        634,1,0,0,0,637,640,1,0,0,0,638,636,1,0,0,0,638,639,1,0,0,0,639,
        127,1,0,0,0,640,638,1,0,0,0,641,646,3,130,65,0,642,643,7,7,0,0,643,
        645,3,130,65,0,644,642,1,0,0,0,645,648,1,0,0,0,646,644,1,0,0,0,646,
        647,1,0,0,0,647,129,1,0,0,0,648,646,1,0,0,0,649,654,3,132,66,0,650,
        651,7,8,0,0,651,653,3,132,66,0,652,650,1,0,0,0,653,656,1,0,0,0,654,
        652,1,0,0,0,654,655,1,0,0,0,655,131,1,0,0,0,656,654,1,0,0,0,657,
        662,3,134,67,0,658,659,7,9,0,0,659,661,3,134,67,0,660,658,1,0,0,
        0,661,664,1,0,0,0,662,660,1,0,0,0,662,663,1,0,0,0,663,133,1,0,0,
        0,664,662,1,0,0,0,665,673,3,136,68,0,666,667,5,46,0,0,667,673,3,
        136,68,0,668,669,5,56,0,0,669,673,3,136,68,0,670,671,5,57,0,0,671,
        673,3,136,68,0,672,665,1,0,0,0,672,666,1,0,0,0,672,668,1,0,0,0,672,
        670,1,0,0,0,673,135,1,0,0,0,674,679,3,56,28,0,675,676,5,66,0,0,676,
        677,3,68,34,0,677,678,5,67,0,0,678,680,1,0,0,0,679,675,1,0,0,0,679,
        680,1,0,0,0,680,137,1,0,0,0,681,688,3,140,70,0,682,685,3,84,42,0,
        683,684,5,63,0,0,684,686,3,140,70,0,685,683,1,0,0,0,685,686,1,0,
        0,0,686,688,1,0,0,0,687,681,1,0,0,0,687,682,1,0,0,0,688,139,1,0,
        0,0,689,694,3,142,71,0,690,691,5,63,0,0,691,693,3,142,71,0,692,690,
        1,0,0,0,693,696,1,0,0,0,694,692,1,0,0,0,694,695,1,0,0,0,695,141,
        1,0,0,0,696,694,1,0,0,0,697,698,3,8,4,0,698,701,5,61,0,0,699,702,
        3,68,34,0,700,702,3,114,57,0,701,699,1,0,0,0,701,700,1,0,0,0,702,
        143,1,0,0,0,703,706,3,146,73,0,704,706,3,2,1,0,705,703,1,0,0,0,705,
        704,1,0,0,0,706,145,1,0,0,0,707,708,7,10,0,0,708,147,1,0,0,0,86,
        150,169,180,191,195,204,212,219,221,226,231,235,238,242,251,253,
        258,261,264,269,281,283,290,296,303,307,315,321,323,326,329,334,
        342,349,354,363,367,370,374,378,384,393,402,405,414,422,425,430,
        433,436,443,446,449,462,471,478,488,494,496,500,507,512,514,524,
        529,548,563,565,572,581,592,603,615,622,630,638,646,654,662,672,
        679,685,687,694,701,705
    ];

    private static __ATN: antlr.ATN;
    public static get _ATN(): antlr.ATN {
        if (!PineV6Parser.__ATN) {
            PineV6Parser.__ATN = new antlr.ATNDeserializer().deserialize(PineV6Parser._serializedATN);
        }

        return PineV6Parser.__ATN;
    }


    private static readonly vocabulary = new antlr.Vocabulary(PineV6Parser.literalNames, PineV6Parser.symbolicNames, []);

    public override get vocabulary(): antlr.Vocabulary {
        return PineV6Parser.vocabulary;
    }

    private static readonly decisionsToDFA = PineV6Parser._ATN.decisionToState.map( (ds: antlr.DecisionState, index: number) => new antlr.DFA(ds, index) );
}

export class Once_exprContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public ONCE(): antlr.TerminalNode {
        return this.getToken(PineV6Parser.ONCE, 0)!;
    }
    public stmts_block(): Stmts_blockContext {
        return this.getRuleContext(0, Stmts_blockContext)!;
    }
    public ternary_expr(): Ternary_exprContext | null {
        return this.getRuleContext(0, Ternary_exprContext);
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_once_expr;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
        if (visitor.visitOnce_expr) {
            return visitor.visitOnce_expr(this);
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
        return this.getToken(PineV6Parser.STR_LITERAL, 0);
    }
    public BOOL_LITERAL(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.BOOL_LITERAL, 0);
    }
    public COLOR_LITERAL(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.COLOR_LITERAL, 0);
    }
    public MLSTRING_DQ(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.MLSTRING_DQ, 0);
    }
    public MLSTRING_SQ(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.MLSTRING_SQ, 0);
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_other_literal;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
        if (visitor.visitOther_literal) {
            return visitor.visitOther_literal(this);
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
    public once_expr(): Once_exprContext | null {
        return this.getRuleContext(0, Once_exprContext);
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
        return PineV6Parser.RULE_global_stmt_content;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
    public once_expr(): Once_exprContext | null {
        return this.getRuleContext(0, Once_exprContext);
    }
    public loop_break(): Loop_breakContext | null {
        return this.getRuleContext(0, Loop_breakContext);
    }
    public loop_continue(): Loop_continueContext | null {
        return this.getRuleContext(0, Loop_continueContext);
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_local_stmt_content;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
        if (visitor.visitLocal_stmt_content) {
            return visitor.visitLocal_stmt_content(this);
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
    		return this.getTokens(PineV6Parser.DOT);
    	} else {
    		return this.getToken(PineV6Parser.DOT, i);
    	}
    }
    public TYPE(): antlr.TerminalNode[];
    public TYPE(i: number): antlr.TerminalNode | null;
    public TYPE(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV6Parser.TYPE);
    	} else {
    		return this.getToken(PineV6Parser.TYPE, i);
    	}
    }
    public METHOD(): antlr.TerminalNode[];
    public METHOD(i: number): antlr.TerminalNode | null;
    public METHOD(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV6Parser.METHOD);
    	} else {
    		return this.getToken(PineV6Parser.METHOD, i);
    	}
    }
    public IMPORT(): antlr.TerminalNode[];
    public IMPORT(i: number): antlr.TerminalNode | null;
    public IMPORT(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV6Parser.IMPORT);
    	} else {
    		return this.getToken(PineV6Parser.IMPORT, i);
    	}
    }
    public EXPORT(): antlr.TerminalNode[];
    public EXPORT(i: number): antlr.TerminalNode | null;
    public EXPORT(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV6Parser.EXPORT);
    	} else {
    		return this.getToken(PineV6Parser.EXPORT, i);
    	}
    }
    public ENUM(): antlr.TerminalNode[];
    public ENUM(i: number): antlr.TerminalNode | null;
    public ENUM(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV6Parser.ENUM);
    	} else {
    		return this.getToken(PineV6Parser.ENUM, i);
    	}
    }
    public ONCE(): antlr.TerminalNode[];
    public ONCE(i: number): antlr.TerminalNode | null;
    public ONCE(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV6Parser.ONCE);
    	} else {
    		return this.getToken(PineV6Parser.ONCE, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_id;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
        if (visitor.visitId) {
            return visitor.visitId(this);
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
        return this.getToken(PineV6Parser.EXPORT, 0)!;
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
    public var_def(): Var_defContext | null {
        return this.getRuleContext(0, Var_defContext);
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_export_stmt;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
        if (visitor.visitExport_stmt) {
            return visitor.visitExport_stmt(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class While_exprContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public WHILE(): antlr.TerminalNode {
        return this.getToken(PineV6Parser.WHILE, 0)!;
    }
    public ternary_expr(): Ternary_exprContext {
        return this.getRuleContext(0, Ternary_exprContext)!;
    }
    public stmts_block(): Stmts_blockContext {
        return this.getRuleContext(0, Stmts_blockContext)!;
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_while_expr;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.SWITCH, 0)!;
    }
    public switch_body(): Switch_bodyContext {
        return this.getRuleContext(0, Switch_bodyContext)!;
    }
    public ternary_expr(): Ternary_exprContext | null {
        return this.getRuleContext(0, Ternary_exprContext);
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_switch_expr;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.BEGIN, 0)!;
    }
    public END(): antlr.TerminalNode {
        return this.getToken(PineV6Parser.END, 0)!;
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
    		return this.getTokens(PineV6Parser.LEND);
    	} else {
    		return this.getToken(PineV6Parser.LEND, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_switch_body;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.ARROW, 0)!;
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
        return PineV6Parser.RULE_switch_case;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.LSQBR, 0);
    }
    public RSQBR(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.RSQBR, 0);
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_field_type;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.TYPE, 0)!;
    }
    public id(): IdContext {
        return this.getRuleContext(0, IdContext)!;
    }
    public type_body(): Type_bodyContext {
        return this.getRuleContext(0, Type_bodyContext)!;
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_type_def_stmt;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.BEGIN, 0)!;
    }
    public END(): antlr.TerminalNode {
        return this.getToken(PineV6Parser.END, 0)!;
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
    		return this.getTokens(PineV6Parser.LEND);
    	} else {
    		return this.getToken(PineV6Parser.LEND, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_type_body;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.VARIP, 0);
    }
    public type_qual(): Type_qualContext | null {
        return this.getRuleContext(0, Type_qualContext);
    }
    public field_type(): Field_typeContext | null {
        return this.getRuleContext(0, Field_typeContext);
    }
    public DEFINE(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.DEFINE, 0);
    }
    public arith_expr(): Arith_exprContext | null {
        return this.getRuleContext(0, Arith_exprContext);
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_type_field;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.METHOD, 0)!;
    }
    public fun_def_stmt(): Fun_def_stmtContext {
        return this.getRuleContext(0, Fun_def_stmtContext)!;
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_method_def_stmt;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.ENUM, 0)!;
    }
    public id(): IdContext {
        return this.getRuleContext(0, IdContext)!;
    }
    public enum_body(): Enum_bodyContext {
        return this.getRuleContext(0, Enum_bodyContext)!;
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_enum_def_stmt;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.BEGIN, 0)!;
    }
    public END(): antlr.TerminalNode {
        return this.getToken(PineV6Parser.END, 0)!;
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
    		return this.getTokens(PineV6Parser.LEND);
    	} else {
    		return this.getToken(PineV6Parser.LEND, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_enum_body;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.DEFINE, 0);
    }
    public arith_expr(): Arith_exprContext | null {
        return this.getRuleContext(0, Arith_exprContext);
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_enum_field;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
        if (visitor.visitEnum_field) {
            return visitor.visitEnum_field(this);
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
        return this.getToken(PineV6Parser.IMPORT, 0)!;
    }
    public import_path(): Import_pathContext {
        return this.getRuleContext(0, Import_pathContext)!;
    }
    public AS(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.AS, 0);
    }
    public id(): IdContext | null {
        return this.getRuleContext(0, IdContext);
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_import_stmt;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
    		return this.getTokens(PineV6Parser.DIV);
    	} else {
    		return this.getToken(PineV6Parser.DIV, i);
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
    		return this.getTokens(PineV6Parser.INT_LITERAL);
    	} else {
    		return this.getToken(PineV6Parser.INT_LITERAL, i);
    	}
    }
    public FLOAT_LITERAL(): antlr.TerminalNode[];
    public FLOAT_LITERAL(i: number): antlr.TerminalNode | null;
    public FLOAT_LITERAL(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV6Parser.FLOAT_LITERAL);
    	} else {
    		return this.getToken(PineV6Parser.FLOAT_LITERAL, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_import_path;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
    		return this.getTokens(PineV6Parser.MINUS);
    	} else {
    		return this.getToken(PineV6Parser.MINUS, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_import_user;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.INT_LITERAL, 0);
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_user_part;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.DEFINE, 0);
    }
    public arith_expr(): Arith_exprContext | null {
        return this.getRuleContext(0, Arith_exprContext);
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_fun_param;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.LT, 0)!;
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
        return this.getToken(PineV6Parser.GT, 0)!;
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV6Parser.COMMA);
    	} else {
    		return this.getToken(PineV6Parser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_type_args;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return PineV6Parser.RULE_type_arg;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.FOR_STMT, 0)!;
    }
    public IN(): antlr.TerminalNode {
        return this.getToken(PineV6Parser.IN, 0)!;
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
        return PineV6Parser.RULE_for_in_expr;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.DOT, 0)!;
    }
    public id(): IdContext {
        return this.getRuleContext(0, IdContext)!;
    }
    public LPAR(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.LPAR, 0);
    }
    public RPAR(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.RPAR, 0);
    }
    public type_args(): Type_argsContext | null {
        return this.getRuleContext(0, Type_argsContext);
    }
    public fun_actual_args(): Fun_actual_argsContext | null {
        return this.getRuleContext(0, Fun_actual_argsContext);
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_call_suffix;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.LPAR, 0)!;
    }
    public RPAR(): antlr.TerminalNode {
        return this.getToken(PineV6Parser.RPAR, 0)!;
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
        return PineV6Parser.RULE_fun_call;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.LPAR, 0);
    }
    public arith_expr(): Arith_exprContext | null {
        return this.getRuleContext(0, Arith_exprContext);
    }
    public RPAR(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.RPAR, 0);
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_atom;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
        if (visitor.visitAtom) {
            return visitor.visitAtom(this);
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
        return PineV6Parser.RULE_stmt;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.LPAR, 0)!;
    }
    public RPAR(): antlr.TerminalNode {
        return this.getToken(PineV6Parser.RPAR, 0)!;
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
    		return this.getTokens(PineV6Parser.COMMA);
    	} else {
    		return this.getToken(PineV6Parser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_fun_head;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.DEFINE, 0)!;
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
        return PineV6Parser.RULE_var_def;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.DEFINE, 0)!;
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
        return PineV6Parser.RULE_var_defs;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.ID, 0);
    }
    public SERIES(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.SERIES, 0);
    }
    public SIMPLE(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.SIMPLE, 0);
    }
    public CONST(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.CONST, 0);
    }
    public INT_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.INT_TYPE, 0);
    }
    public FLOAT_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.FLOAT_TYPE, 0);
    }
    public BOOL_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.BOOL_TYPE, 0);
    }
    public STRING_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.STRING_TYPE, 0);
    }
    public COLOR_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.COLOR_TYPE, 0);
    }
    public LINE_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.LINE_TYPE, 0);
    }
    public LABEL_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.LABEL_TYPE, 0);
    }
    public BOX_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.BOX_TYPE, 0);
    }
    public TABLE_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.TABLE_TYPE, 0);
    }
    public AS(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.AS, 0);
    }
    public TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.TYPE, 0);
    }
    public METHOD(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.METHOD, 0);
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_id_part;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
        if (visitor.visitId_part) {
            return visitor.visitId_part(this);
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
        return PineV6Parser.RULE_arith_expr;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.VAR, 0);
    }
    public VARIP(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.VARIP, 0);
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_decl_mod;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.SERIES, 0);
    }
    public SIMPLE(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.SIMPLE, 0);
    }
    public CONST(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.CONST, 0);
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_type_qual;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.INT_TYPE, 0);
    }
    public FLOAT_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.FLOAT_TYPE, 0);
    }
    public BOOL_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.BOOL_TYPE, 0);
    }
    public STRING_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.STRING_TYPE, 0);
    }
    public COLOR_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.COLOR_TYPE, 0);
    }
    public LINE_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.LINE_TYPE, 0);
    }
    public LABEL_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.LABEL_TYPE, 0);
    }
    public BOX_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.BOX_TYPE, 0);
    }
    public TABLE_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.TABLE_TYPE, 0);
    }
    public LSQBR(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.LSQBR, 0);
    }
    public RSQBR(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.RSQBR, 0);
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_type_name;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.PLUS_ASSIGN, 0);
    }
    public MINUS_ASSIGN(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.MINUS_ASSIGN, 0);
    }
    public MUL_ASSIGN(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.MUL_ASSIGN, 0);
    }
    public DIV_ASSIGN(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.DIV_ASSIGN, 0);
    }
    public MOD_ASSIGN(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.MOD_ASSIGN, 0);
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_compound_assign_op;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.ASSIGN, 0);
    }
    public compound_assign_op(): Compound_assign_opContext | null {
        return this.getRuleContext(0, Compound_assign_opContext);
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_var_assign;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.IF_COND, 0)!;
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
        return this.getToken(PineV6Parser.IF_COND_ELSE, 0);
    }
    public if_expr(): If_exprContext | null {
        return this.getRuleContext(0, If_exprContext);
    }
    public LEND(): antlr.TerminalNode[];
    public LEND(i: number): antlr.TerminalNode | null;
    public LEND(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV6Parser.LEND);
    	} else {
    		return this.getToken(PineV6Parser.LEND, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_if_expr;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return PineV6Parser.RULE_pos_arg;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
    		return this.getTokens(PineV6Parser.COMMA);
    	} else {
    		return this.getToken(PineV6Parser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_pos_args;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.EOF, 0)!;
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
    		return this.getTokens(PineV6Parser.LEND);
    	} else {
    		return this.getToken(PineV6Parser.LEND, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_pine_script;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
    		return this.getTokens(PineV6Parser.COMMA);
    	} else {
    		return this.getToken(PineV6Parser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_global_stmt;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return PineV6Parser.RULE_fun_def_stmt;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.ARROW, 0)!;
    }
    public fun_body_singleline(): Fun_body_singlelineContext {
        return this.getRuleContext(0, Fun_body_singlelineContext)!;
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_fun_def_singleline;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.ARROW, 0)!;
    }
    public fun_body_multiline(): Fun_body_multilineContext {
        return this.getRuleContext(0, Fun_body_multilineContext)!;
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_fun_def_multiline;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return PineV6Parser.RULE_fun_body_singleline;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
    		return this.getTokens(PineV6Parser.COMMA);
    	} else {
    		return this.getToken(PineV6Parser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_local_stmt_singleline;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.BREAK, 0)!;
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_loop_break;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.CONTINUE, 0)!;
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_loop_continue;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return PineV6Parser.RULE_fun_body_multiline;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.BEGIN, 0)!;
    }
    public local_stmts_list(): Local_stmts_listContext {
        return this.getRuleContext(0, Local_stmts_listContext)!;
    }
    public END(): antlr.TerminalNode {
        return this.getToken(PineV6Parser.END, 0)!;
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_local_stmts_multiline;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
    		return this.getTokens(PineV6Parser.LEND);
    	} else {
    		return this.getToken(PineV6Parser.LEND, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_local_stmts_list;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
    		return this.getTokens(PineV6Parser.COMMA);
    	} else {
    		return this.getToken(PineV6Parser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_local_stmt_multiline;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.LSQBR, 0)!;
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
        return this.getToken(PineV6Parser.RSQBR, 0)!;
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV6Parser.COMMA);
    	} else {
    		return this.getToken(PineV6Parser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_ids_array;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.LSQBR, 0)!;
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
        return this.getToken(PineV6Parser.RSQBR, 0)!;
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV6Parser.COMMA);
    	} else {
    		return this.getToken(PineV6Parser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_arith_exprs;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.FOR_STMT, 0)!;
    }
    public var_def(): Var_defContext {
        return this.getRuleContext(0, Var_defContext)!;
    }
    public FOR_STMT_TO(): antlr.TerminalNode {
        return this.getToken(PineV6Parser.FOR_STMT_TO, 0)!;
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
        return this.getToken(PineV6Parser.FOR_STMT_BY, 0);
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_for_expr;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return PineV6Parser.RULE_stmts_block;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.COND, 0);
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
        return this.getToken(PineV6Parser.COND_ELSE, 0);
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_ternary_expr;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
    		return this.getTokens(PineV6Parser.OR);
    	} else {
    		return this.getToken(PineV6Parser.OR, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_or_expr;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
    		return this.getTokens(PineV6Parser.AND);
    	} else {
    		return this.getToken(PineV6Parser.AND, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_and_expr;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
    		return this.getTokens(PineV6Parser.EQ);
    	} else {
    		return this.getToken(PineV6Parser.EQ, i);
    	}
    }
    public NEQ(): antlr.TerminalNode[];
    public NEQ(i: number): antlr.TerminalNode | null;
    public NEQ(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV6Parser.NEQ);
    	} else {
    		return this.getToken(PineV6Parser.NEQ, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_eq_expr;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
    		return this.getTokens(PineV6Parser.GT);
    	} else {
    		return this.getToken(PineV6Parser.GT, i);
    	}
    }
    public GE(): antlr.TerminalNode[];
    public GE(i: number): antlr.TerminalNode | null;
    public GE(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV6Parser.GE);
    	} else {
    		return this.getToken(PineV6Parser.GE, i);
    	}
    }
    public LT(): antlr.TerminalNode[];
    public LT(i: number): antlr.TerminalNode | null;
    public LT(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV6Parser.LT);
    	} else {
    		return this.getToken(PineV6Parser.LT, i);
    	}
    }
    public LE(): antlr.TerminalNode[];
    public LE(i: number): antlr.TerminalNode | null;
    public LE(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV6Parser.LE);
    	} else {
    		return this.getToken(PineV6Parser.LE, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_cmp_expr;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
    		return this.getTokens(PineV6Parser.PLUS);
    	} else {
    		return this.getToken(PineV6Parser.PLUS, i);
    	}
    }
    public MINUS(): antlr.TerminalNode[];
    public MINUS(i: number): antlr.TerminalNode | null;
    public MINUS(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV6Parser.MINUS);
    	} else {
    		return this.getToken(PineV6Parser.MINUS, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_add_expr;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
    		return this.getTokens(PineV6Parser.MUL);
    	} else {
    		return this.getToken(PineV6Parser.MUL, i);
    	}
    }
    public DIV(): antlr.TerminalNode[];
    public DIV(i: number): antlr.TerminalNode | null;
    public DIV(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV6Parser.DIV);
    	} else {
    		return this.getToken(PineV6Parser.DIV, i);
    	}
    }
    public MOD(): antlr.TerminalNode[];
    public MOD(i: number): antlr.TerminalNode | null;
    public MOD(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV6Parser.MOD);
    	} else {
    		return this.getToken(PineV6Parser.MOD, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_mult_expr;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.NOT, 0);
    }
    public PLUS(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.PLUS, 0);
    }
    public MINUS(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.MINUS, 0);
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_unary_expr;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.LSQBR, 0);
    }
    public arith_expr(): Arith_exprContext | null {
        return this.getRuleContext(0, Arith_exprContext);
    }
    public RSQBR(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.RSQBR, 0);
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_sqbr_expr;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.COMMA, 0);
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_fun_actual_args;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
    		return this.getTokens(PineV6Parser.COMMA);
    	} else {
    		return this.getToken(PineV6Parser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_kw_args;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.DEFINE, 0)!;
    }
    public arith_expr(): Arith_exprContext | null {
        return this.getRuleContext(0, Arith_exprContext);
    }
    public arith_exprs(): Arith_exprsContext | null {
        return this.getRuleContext(0, Arith_exprsContext);
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_kw_arg;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return PineV6Parser.RULE_literal;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV6Parser.INT_LITERAL, 0);
    }
    public FLOAT_LITERAL(): antlr.TerminalNode | null {
        return this.getToken(PineV6Parser.FLOAT_LITERAL, 0);
    }
    public override get ruleIndex(): number {
        return PineV6Parser.RULE_num_literal;
    }
    public override accept<Result>(visitor: PineV6ParserVisitor<Result>): Result | null {
        if (visitor.visitNum_literal) {
            return visitor.visitNum_literal(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
