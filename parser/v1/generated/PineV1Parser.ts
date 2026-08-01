
import * as antlr from "antlr4ng";
import { Token } from "antlr4ng";

import { PineV1ParserVisitor } from "./PineV1ParserVisitor.js";

// for running tests with parameters, TODO: discuss strategy for typed parameters in CI
// eslint-disable-next-line no-unused-vars
type int = number;


export class PineV1Parser extends antlr.Parser {
    public static readonly BEGIN = 1;
    public static readonly END = 2;
    public static readonly LEND = 3;
    public static readonly LBEG = 4;
    public static readonly IF_COND = 5;
    public static readonly IF_COND_ELSE = 6;
    public static readonly FOR_STMT = 7;
    public static readonly FOR_STMT_TO = 8;
    public static readonly FOR_STMT_BY = 9;
    public static readonly BREAK = 10;
    public static readonly CONTINUE = 11;
    public static readonly OR = 12;
    public static readonly AND = 13;
    public static readonly NOT = 14;
    public static readonly BOOL_LITERAL = 15;
    public static readonly COND = 16;
    public static readonly COND_ELSE = 17;
    public static readonly EQ = 18;
    public static readonly NEQ = 19;
    public static readonly GT = 20;
    public static readonly GE = 21;
    public static readonly LT = 22;
    public static readonly LE = 23;
    public static readonly PLUS = 24;
    public static readonly MINUS = 25;
    public static readonly MUL = 26;
    public static readonly DIV = 27;
    public static readonly MOD = 28;
    public static readonly DEFINE = 29;
    public static readonly ARROW = 30;
    public static readonly COMMA = 31;
    public static readonly LPAR = 32;
    public static readonly RPAR = 33;
    public static readonly LSQBR = 34;
    public static readonly RSQBR = 35;
    public static readonly INT_LITERAL = 36;
    public static readonly FLOAT_LITERAL = 37;
    public static readonly STR_LITERAL = 38;
    public static readonly COLOR_LITERAL = 39;
    public static readonly ID = 40;
    public static readonly WS = 41;
    public static readonly LINE_COMMENT = 42;
    public static readonly BLOCK_COMMENT = 43;
    public static readonly DOT = 44;
    public static readonly RULE_pine_script = 0;
    public static readonly RULE_stmt = 1;
    public static readonly RULE_global_stmt = 2;
    public static readonly RULE_global_stmt_content = 3;
    public static readonly RULE_fun_def_stmt = 4;
    public static readonly RULE_fun_def_singleline = 5;
    public static readonly RULE_fun_def_multiline = 6;
    public static readonly RULE_fun_head = 7;
    public static readonly RULE_fun_body_singleline = 8;
    public static readonly RULE_local_stmt_singleline = 9;
    public static readonly RULE_local_stmt_content = 10;
    public static readonly RULE_loop_break = 11;
    public static readonly RULE_loop_continue = 12;
    public static readonly RULE_fun_body_multiline = 13;
    public static readonly RULE_local_stmts_multiline = 14;
    public static readonly RULE_local_stmts_list = 15;
    public static readonly RULE_local_stmt_multiline = 16;
    public static readonly RULE_var_def = 17;
    public static readonly RULE_var_defs = 18;
    public static readonly RULE_ids_array = 19;
    public static readonly RULE_arith_exprs = 20;
    public static readonly RULE_arith_expr = 21;
    public static readonly RULE_if_expr = 22;
    public static readonly RULE_for_expr = 23;
    public static readonly RULE_stmts_block = 24;
    public static readonly RULE_ternary_expr = 25;
    public static readonly RULE_or_expr = 26;
    public static readonly RULE_and_expr = 27;
    public static readonly RULE_eq_expr = 28;
    public static readonly RULE_cmp_expr = 29;
    public static readonly RULE_add_expr = 30;
    public static readonly RULE_mult_expr = 31;
    public static readonly RULE_unary_expr = 32;
    public static readonly RULE_sqbr_expr = 33;
    public static readonly RULE_atom = 34;
    public static readonly RULE_fun_call = 35;
    public static readonly RULE_fun_actual_args = 36;
    public static readonly RULE_pos_args = 37;
    public static readonly RULE_kw_args = 38;
    public static readonly RULE_kw_arg = 39;
    public static readonly RULE_literal = 40;
    public static readonly RULE_num_literal = 41;
    public static readonly RULE_other_literal = 42;
    public static readonly RULE_id = 43;

    public static readonly literalNames = [
        null, null, null, null, null, "'if'", "'else'", "'for'", "'to'", 
        "'by'", "'break'", "'continue'", "'or'", "'and'", "'not'", null, 
        "'?'", "':'", "'=='", "'!='", "'>'", "'>='", "'<'", "'<='", "'+'", 
        "'-'", "'*'", "'/'", "'%'", "'='", "'=>'", "','", "'('", "')'", 
        "'['", "']'", null, null, null, null, null, null, null, null, "'.'"
    ];

    public static readonly symbolicNames = [
        null, "BEGIN", "END", "LEND", "LBEG", "IF_COND", "IF_COND_ELSE", 
        "FOR_STMT", "FOR_STMT_TO", "FOR_STMT_BY", "BREAK", "CONTINUE", "OR", 
        "AND", "NOT", "BOOL_LITERAL", "COND", "COND_ELSE", "EQ", "NEQ", 
        "GT", "GE", "LT", "LE", "PLUS", "MINUS", "MUL", "DIV", "MOD", "DEFINE", 
        "ARROW", "COMMA", "LPAR", "RPAR", "LSQBR", "RSQBR", "INT_LITERAL", 
        "FLOAT_LITERAL", "STR_LITERAL", "COLOR_LITERAL", "ID", "WS", "LINE_COMMENT", 
        "BLOCK_COMMENT", "DOT"
    ];
    public static readonly ruleNames = [
        "pine_script", "stmt", "global_stmt", "global_stmt_content", "fun_def_stmt", 
        "fun_def_singleline", "fun_def_multiline", "fun_head", "fun_body_singleline", 
        "local_stmt_singleline", "local_stmt_content", "loop_break", "loop_continue", 
        "fun_body_multiline", "local_stmts_multiline", "local_stmts_list", 
        "local_stmt_multiline", "var_def", "var_defs", "ids_array", "arith_exprs", 
        "arith_expr", "if_expr", "for_expr", "stmts_block", "ternary_expr", 
        "or_expr", "and_expr", "eq_expr", "cmp_expr", "add_expr", "mult_expr", 
        "unary_expr", "sqbr_expr", "atom", "fun_call", "fun_actual_args", 
        "pos_args", "kw_args", "kw_arg", "literal", "num_literal", "other_literal", 
        "id",
    ];

    public get grammarFileName(): string { return "PineV1Parser.g4"; }
    public get literalNames(): (string | null)[] { return PineV1Parser.literalNames; }
    public get symbolicNames(): (string | null)[] { return PineV1Parser.symbolicNames; }
    public get ruleNames(): string[] { return PineV1Parser.ruleNames; }
    public get serializedATN(): number[] { return PineV1Parser._serializedATN; }

    protected createFailedPredicateException(predicate?: string, message?: string): antlr.FailedPredicateException {
        return new antlr.FailedPredicateException(this, predicate, message);
    }

    public constructor(input: antlr.TokenStream) {
        super(input);
        this.interpreter = new antlr.ParserATNSimulator(this, PineV1Parser._ATN, PineV1Parser.decisionsToDFA, new antlr.PredictionContextCache());
    }
    public pine_script(): Pine_scriptContext {
        let localContext = new Pine_scriptContext(this.context, this.state);
        this.enterRule(localContext, 0, PineV1Parser.RULE_pine_script);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 92;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 50384040) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 501) !== 0)) {
                {
                this.state = 90;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case PineV1Parser.IF_COND:
                case PineV1Parser.FOR_STMT:
                case PineV1Parser.BREAK:
                case PineV1Parser.CONTINUE:
                case PineV1Parser.NOT:
                case PineV1Parser.BOOL_LITERAL:
                case PineV1Parser.PLUS:
                case PineV1Parser.MINUS:
                case PineV1Parser.LPAR:
                case PineV1Parser.LSQBR:
                case PineV1Parser.INT_LITERAL:
                case PineV1Parser.FLOAT_LITERAL:
                case PineV1Parser.STR_LITERAL:
                case PineV1Parser.COLOR_LITERAL:
                case PineV1Parser.ID:
                    {
                    this.state = 88;
                    this.stmt();
                    }
                    break;
                case PineV1Parser.LEND:
                    {
                    this.state = 89;
                    this.match(PineV1Parser.LEND);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                this.state = 94;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 95;
            this.match(PineV1Parser.EOF);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
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
        this.enterRule(localContext, 2, PineV1Parser.RULE_stmt);
        try {
            this.state = 99;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 2, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 97;
                this.fun_def_stmt();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 98;
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
    public global_stmt(): Global_stmtContext {
        let localContext = new Global_stmtContext(this.context, this.state);
        this.enterRule(localContext, 4, PineV1Parser.RULE_global_stmt);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 101;
            this.global_stmt_content();
            this.state = 106;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 31) {
                {
                {
                this.state = 102;
                this.match(PineV1Parser.COMMA);
                this.state = 103;
                this.global_stmt_content();
                }
                }
                this.state = 108;
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
    public global_stmt_content(): Global_stmt_contentContext {
        let localContext = new Global_stmt_contentContext(this.context, this.state);
        this.enterRule(localContext, 6, PineV1Parser.RULE_global_stmt_content);
        try {
            this.state = 117;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 4, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 109;
                this.var_def();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 110;
                this.var_defs();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 111;
                this.fun_call();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 112;
                this.if_expr();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 113;
                this.for_expr();
                }
                break;
            case 6:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 114;
                this.loop_break();
                }
                break;
            case 7:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 115;
                this.loop_continue();
                }
                break;
            case 8:
                this.enterOuterAlt(localContext, 8);
                {
                this.state = 116;
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
    public fun_def_stmt(): Fun_def_stmtContext {
        let localContext = new Fun_def_stmtContext(this.context, this.state);
        this.enterRule(localContext, 8, PineV1Parser.RULE_fun_def_stmt);
        try {
            this.state = 121;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 5, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 119;
                this.fun_def_singleline();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 120;
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
        this.enterRule(localContext, 10, PineV1Parser.RULE_fun_def_singleline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 123;
            this.id();
            this.state = 124;
            this.fun_head();
            this.state = 125;
            this.match(PineV1Parser.ARROW);
            this.state = 126;
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
        this.enterRule(localContext, 12, PineV1Parser.RULE_fun_def_multiline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 128;
            this.id();
            this.state = 129;
            this.fun_head();
            this.state = 130;
            this.match(PineV1Parser.ARROW);
            this.state = 131;
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
    public fun_head(): Fun_headContext {
        let localContext = new Fun_headContext(this.context, this.state);
        this.enterRule(localContext, 14, PineV1Parser.RULE_fun_head);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 133;
            this.match(PineV1Parser.LPAR);
            this.state = 142;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 40) {
                {
                this.state = 134;
                this.id();
                this.state = 139;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 31) {
                    {
                    {
                    this.state = 135;
                    this.match(PineV1Parser.COMMA);
                    this.state = 136;
                    this.id();
                    }
                    }
                    this.state = 141;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                }
            }

            this.state = 144;
            this.match(PineV1Parser.RPAR);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
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
        this.enterRule(localContext, 16, PineV1Parser.RULE_fun_body_singleline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 146;
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
        this.enterRule(localContext, 18, PineV1Parser.RULE_local_stmt_singleline);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 148;
            this.local_stmt_content();
            this.state = 153;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 31) {
                {
                {
                this.state = 149;
                this.match(PineV1Parser.COMMA);
                this.state = 150;
                this.local_stmt_content();
                }
                }
                this.state = 155;
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
    public local_stmt_content(): Local_stmt_contentContext {
        let localContext = new Local_stmt_contentContext(this.context, this.state);
        this.enterRule(localContext, 20, PineV1Parser.RULE_local_stmt_content);
        try {
            this.state = 162;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 9, this.context) ) {
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
                this.arith_expr();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 159;
                this.arith_exprs();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 160;
                this.loop_break();
                }
                break;
            case 6:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 161;
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
    public loop_break(): Loop_breakContext {
        let localContext = new Loop_breakContext(this.context, this.state);
        this.enterRule(localContext, 22, PineV1Parser.RULE_loop_break);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 164;
            this.match(PineV1Parser.BREAK);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
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
        this.enterRule(localContext, 24, PineV1Parser.RULE_loop_continue);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 166;
            this.match(PineV1Parser.CONTINUE);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
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
        this.enterRule(localContext, 26, PineV1Parser.RULE_fun_body_multiline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 168;
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
        this.enterRule(localContext, 28, PineV1Parser.RULE_local_stmts_multiline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 170;
            this.match(PineV1Parser.BEGIN);
            this.state = 171;
            this.local_stmts_list();
            this.state = 172;
            this.match(PineV1Parser.END);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
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
        this.enterRule(localContext, 30, PineV1Parser.RULE_local_stmts_list);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 176;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                this.state = 176;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case PineV1Parser.IF_COND:
                case PineV1Parser.FOR_STMT:
                case PineV1Parser.BREAK:
                case PineV1Parser.CONTINUE:
                case PineV1Parser.NOT:
                case PineV1Parser.BOOL_LITERAL:
                case PineV1Parser.PLUS:
                case PineV1Parser.MINUS:
                case PineV1Parser.LPAR:
                case PineV1Parser.LSQBR:
                case PineV1Parser.INT_LITERAL:
                case PineV1Parser.FLOAT_LITERAL:
                case PineV1Parser.STR_LITERAL:
                case PineV1Parser.COLOR_LITERAL:
                case PineV1Parser.ID:
                    {
                    this.state = 174;
                    this.local_stmt_multiline();
                    }
                    break;
                case PineV1Parser.LEND:
                    {
                    this.state = 175;
                    this.match(PineV1Parser.LEND);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                this.state = 178;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 50384040) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 501) !== 0));
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
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
        this.enterRule(localContext, 32, PineV1Parser.RULE_local_stmt_multiline);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 180;
            this.local_stmt_content();
            this.state = 185;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 31) {
                {
                {
                this.state = 181;
                this.match(PineV1Parser.COMMA);
                this.state = 182;
                this.local_stmt_content();
                }
                }
                this.state = 187;
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
    public var_def(): Var_defContext {
        let localContext = new Var_defContext(this.context, this.state);
        this.enterRule(localContext, 34, PineV1Parser.RULE_var_def);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 188;
            this.id();
            this.state = 189;
            this.match(PineV1Parser.DEFINE);
            this.state = 190;
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
        this.enterRule(localContext, 36, PineV1Parser.RULE_var_defs);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 192;
            this.ids_array();
            this.state = 193;
            this.match(PineV1Parser.DEFINE);
            this.state = 194;
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
    public ids_array(): Ids_arrayContext {
        let localContext = new Ids_arrayContext(this.context, this.state);
        this.enterRule(localContext, 38, PineV1Parser.RULE_ids_array);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 196;
            this.match(PineV1Parser.LSQBR);
            this.state = 197;
            this.id();
            this.state = 202;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 31) {
                {
                {
                this.state = 198;
                this.match(PineV1Parser.COMMA);
                this.state = 199;
                this.id();
                }
                }
                this.state = 204;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 205;
            this.match(PineV1Parser.RSQBR);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
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
        this.enterRule(localContext, 40, PineV1Parser.RULE_arith_exprs);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 207;
            this.match(PineV1Parser.LSQBR);
            this.state = 208;
            this.arith_expr();
            this.state = 213;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 31) {
                {
                {
                this.state = 209;
                this.match(PineV1Parser.COMMA);
                this.state = 210;
                this.arith_expr();
                }
                }
                this.state = 215;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 216;
            this.match(PineV1Parser.RSQBR);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
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
        this.enterRule(localContext, 42, PineV1Parser.RULE_arith_expr);
        try {
            this.state = 221;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV1Parser.NOT:
            case PineV1Parser.BOOL_LITERAL:
            case PineV1Parser.PLUS:
            case PineV1Parser.MINUS:
            case PineV1Parser.LPAR:
            case PineV1Parser.INT_LITERAL:
            case PineV1Parser.FLOAT_LITERAL:
            case PineV1Parser.STR_LITERAL:
            case PineV1Parser.COLOR_LITERAL:
            case PineV1Parser.ID:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 218;
                this.ternary_expr();
                }
                break;
            case PineV1Parser.IF_COND:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 219;
                this.if_expr();
                }
                break;
            case PineV1Parser.FOR_STMT:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 220;
                this.for_expr();
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
    public if_expr(): If_exprContext {
        let localContext = new If_exprContext(this.context, this.state);
        this.enterRule(localContext, 44, PineV1Parser.RULE_if_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 223;
            this.match(PineV1Parser.IF_COND);
            this.state = 224;
            this.ternary_expr();
            this.state = 225;
            this.stmts_block();
            this.state = 234;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 17, this.context) ) {
            case 1:
                {
                this.state = 229;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 3) {
                    {
                    {
                    this.state = 226;
                    this.match(PineV1Parser.LEND);
                    }
                    }
                    this.state = 231;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                this.state = 232;
                this.match(PineV1Parser.IF_COND_ELSE);
                this.state = 233;
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
        this.enterRule(localContext, 46, PineV1Parser.RULE_for_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 236;
            this.match(PineV1Parser.FOR_STMT);
            this.state = 237;
            this.var_def();
            this.state = 238;
            this.match(PineV1Parser.FOR_STMT_TO);
            this.state = 239;
            this.ternary_expr();
            this.state = 242;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 9) {
                {
                this.state = 240;
                this.match(PineV1Parser.FOR_STMT_BY);
                this.state = 241;
                this.ternary_expr();
                }
            }

            this.state = 244;
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
        this.enterRule(localContext, 48, PineV1Parser.RULE_stmts_block);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 246;
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
        this.enterRule(localContext, 50, PineV1Parser.RULE_ternary_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 248;
            this.or_expr();
            this.state = 254;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 16) {
                {
                this.state = 249;
                this.match(PineV1Parser.COND);
                this.state = 250;
                this.ternary_expr();
                this.state = 251;
                this.match(PineV1Parser.COND_ELSE);
                this.state = 252;
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
        this.enterRule(localContext, 52, PineV1Parser.RULE_or_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 256;
            this.and_expr();
            this.state = 261;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 12) {
                {
                {
                this.state = 257;
                this.match(PineV1Parser.OR);
                this.state = 258;
                this.and_expr();
                }
                }
                this.state = 263;
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
        this.enterRule(localContext, 54, PineV1Parser.RULE_and_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 264;
            this.eq_expr();
            this.state = 269;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 13) {
                {
                {
                this.state = 265;
                this.match(PineV1Parser.AND);
                this.state = 266;
                this.eq_expr();
                }
                }
                this.state = 271;
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
        this.enterRule(localContext, 56, PineV1Parser.RULE_eq_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 272;
            this.cmp_expr();
            this.state = 277;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 18 || _la === 19) {
                {
                {
                this.state = 273;
                _la = this.tokenStream.LA(1);
                if(!(_la === 18 || _la === 19)) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                this.state = 274;
                this.cmp_expr();
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
    public cmp_expr(): Cmp_exprContext {
        let localContext = new Cmp_exprContext(this.context, this.state);
        this.enterRule(localContext, 58, PineV1Parser.RULE_cmp_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 280;
            this.add_expr();
            this.state = 285;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 15728640) !== 0)) {
                {
                {
                this.state = 281;
                _la = this.tokenStream.LA(1);
                if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 15728640) !== 0))) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                this.state = 282;
                this.add_expr();
                }
                }
                this.state = 287;
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
        this.enterRule(localContext, 60, PineV1Parser.RULE_add_expr);
        let _la: number;
        try {
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 288;
            this.mult_expr();
            this.state = 293;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 24, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
                    {
                    {
                    this.state = 289;
                    _la = this.tokenStream.LA(1);
                    if(!(_la === 24 || _la === 25)) {
                    this.errorHandler.recoverInline(this);
                    }
                    else {
                        this.errorHandler.reportMatch(this);
                        this.consume();
                    }
                    this.state = 290;
                    this.mult_expr();
                    }
                    }
                }
                this.state = 295;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 24, this.context);
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
        this.enterRule(localContext, 62, PineV1Parser.RULE_mult_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 296;
            this.unary_expr();
            this.state = 301;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 469762048) !== 0)) {
                {
                {
                this.state = 297;
                _la = this.tokenStream.LA(1);
                if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 469762048) !== 0))) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                this.state = 298;
                this.unary_expr();
                }
                }
                this.state = 303;
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
        this.enterRule(localContext, 64, PineV1Parser.RULE_unary_expr);
        try {
            this.state = 311;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV1Parser.BOOL_LITERAL:
            case PineV1Parser.LPAR:
            case PineV1Parser.INT_LITERAL:
            case PineV1Parser.FLOAT_LITERAL:
            case PineV1Parser.STR_LITERAL:
            case PineV1Parser.COLOR_LITERAL:
            case PineV1Parser.ID:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 304;
                this.sqbr_expr();
                }
                break;
            case PineV1Parser.NOT:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 305;
                this.match(PineV1Parser.NOT);
                this.state = 306;
                this.sqbr_expr();
                }
                break;
            case PineV1Parser.PLUS:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 307;
                this.match(PineV1Parser.PLUS);
                this.state = 308;
                this.sqbr_expr();
                }
                break;
            case PineV1Parser.MINUS:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 309;
                this.match(PineV1Parser.MINUS);
                this.state = 310;
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
        this.enterRule(localContext, 66, PineV1Parser.RULE_sqbr_expr);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 313;
            this.atom();
            this.state = 318;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 27, this.context) ) {
            case 1:
                {
                this.state = 314;
                this.match(PineV1Parser.LSQBR);
                this.state = 315;
                this.arith_expr();
                this.state = 316;
                this.match(PineV1Parser.RSQBR);
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
        this.enterRule(localContext, 68, PineV1Parser.RULE_atom);
        try {
            this.state = 327;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 28, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 320;
                this.fun_call();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 321;
                this.id();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 322;
                this.literal();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 323;
                this.match(PineV1Parser.LPAR);
                this.state = 324;
                this.arith_expr();
                this.state = 325;
                this.match(PineV1Parser.RPAR);
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
        this.enterRule(localContext, 70, PineV1Parser.RULE_fun_call);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 329;
            this.id();
            this.state = 330;
            this.match(PineV1Parser.LPAR);
            this.state = 332;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 50380960) !== 0) || ((((_la - 32)) & ~0x1F) === 0 && ((1 << (_la - 32)) & 497) !== 0)) {
                {
                this.state = 331;
                this.fun_actual_args();
                }
            }

            this.state = 334;
            this.match(PineV1Parser.RPAR);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
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
        this.enterRule(localContext, 72, PineV1Parser.RULE_fun_actual_args);
        let _la: number;
        try {
            this.state = 342;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 31, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 336;
                this.kw_args();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 337;
                this.pos_args();
                this.state = 340;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 31) {
                    {
                    this.state = 338;
                    this.match(PineV1Parser.COMMA);
                    this.state = 339;
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
        this.enterRule(localContext, 74, PineV1Parser.RULE_pos_args);
        try {
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 344;
            this.arith_expr();
            this.state = 349;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 32, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
                    {
                    {
                    this.state = 345;
                    this.match(PineV1Parser.COMMA);
                    this.state = 346;
                    this.arith_expr();
                    }
                    }
                }
                this.state = 351;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 32, this.context);
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
        this.enterRule(localContext, 76, PineV1Parser.RULE_kw_args);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 352;
            this.kw_arg();
            this.state = 357;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 31) {
                {
                {
                this.state = 353;
                this.match(PineV1Parser.COMMA);
                this.state = 354;
                this.kw_arg();
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
    public kw_arg(): Kw_argContext {
        let localContext = new Kw_argContext(this.context, this.state);
        this.enterRule(localContext, 78, PineV1Parser.RULE_kw_arg);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 360;
            this.id();
            this.state = 361;
            this.match(PineV1Parser.DEFINE);
            this.state = 364;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV1Parser.IF_COND:
            case PineV1Parser.FOR_STMT:
            case PineV1Parser.NOT:
            case PineV1Parser.BOOL_LITERAL:
            case PineV1Parser.PLUS:
            case PineV1Parser.MINUS:
            case PineV1Parser.LPAR:
            case PineV1Parser.INT_LITERAL:
            case PineV1Parser.FLOAT_LITERAL:
            case PineV1Parser.STR_LITERAL:
            case PineV1Parser.COLOR_LITERAL:
            case PineV1Parser.ID:
                {
                this.state = 362;
                this.arith_expr();
                }
                break;
            case PineV1Parser.LSQBR:
                {
                this.state = 363;
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
        this.enterRule(localContext, 80, PineV1Parser.RULE_literal);
        try {
            this.state = 368;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV1Parser.INT_LITERAL:
            case PineV1Parser.FLOAT_LITERAL:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 366;
                this.num_literal();
                }
                break;
            case PineV1Parser.BOOL_LITERAL:
            case PineV1Parser.STR_LITERAL:
            case PineV1Parser.COLOR_LITERAL:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 367;
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
        this.enterRule(localContext, 82, PineV1Parser.RULE_num_literal);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 370;
            _la = this.tokenStream.LA(1);
            if(!(_la === 36 || _la === 37)) {
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
        this.enterRule(localContext, 84, PineV1Parser.RULE_other_literal);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 372;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 15)) & ~0x1F) === 0 && ((1 << (_la - 15)) & 25165825) !== 0))) {
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
        this.enterRule(localContext, 86, PineV1Parser.RULE_id);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 374;
            this.match(PineV1Parser.ID);
            this.state = 379;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 44) {
                {
                {
                this.state = 375;
                this.match(PineV1Parser.DOT);
                this.state = 376;
                this.match(PineV1Parser.ID);
                }
                }
                this.state = 381;
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

    public static readonly _serializedATN: number[] = [
        4,1,44,383,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,2,6,7,
        6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,2,11,7,11,2,12,7,12,2,13,7,13,
        2,14,7,14,2,15,7,15,2,16,7,16,2,17,7,17,2,18,7,18,2,19,7,19,2,20,
        7,20,2,21,7,21,2,22,7,22,2,23,7,23,2,24,7,24,2,25,7,25,2,26,7,26,
        2,27,7,27,2,28,7,28,2,29,7,29,2,30,7,30,2,31,7,31,2,32,7,32,2,33,
        7,33,2,34,7,34,2,35,7,35,2,36,7,36,2,37,7,37,2,38,7,38,2,39,7,39,
        2,40,7,40,2,41,7,41,2,42,7,42,2,43,7,43,1,0,1,0,5,0,91,8,0,10,0,
        12,0,94,9,0,1,0,1,0,1,1,1,1,3,1,100,8,1,1,2,1,2,1,2,5,2,105,8,2,
        10,2,12,2,108,9,2,1,3,1,3,1,3,1,3,1,3,1,3,1,3,1,3,3,3,118,8,3,1,
        4,1,4,3,4,122,8,4,1,5,1,5,1,5,1,5,1,5,1,6,1,6,1,6,1,6,1,6,1,7,1,
        7,1,7,1,7,5,7,138,8,7,10,7,12,7,141,9,7,3,7,143,8,7,1,7,1,7,1,8,
        1,8,1,9,1,9,1,9,5,9,152,8,9,10,9,12,9,155,9,9,1,10,1,10,1,10,1,10,
        1,10,1,10,3,10,163,8,10,1,11,1,11,1,12,1,12,1,13,1,13,1,14,1,14,
        1,14,1,14,1,15,1,15,4,15,177,8,15,11,15,12,15,178,1,16,1,16,1,16,
        5,16,184,8,16,10,16,12,16,187,9,16,1,17,1,17,1,17,1,17,1,18,1,18,
        1,18,1,18,1,19,1,19,1,19,1,19,5,19,201,8,19,10,19,12,19,204,9,19,
        1,19,1,19,1,20,1,20,1,20,1,20,5,20,212,8,20,10,20,12,20,215,9,20,
        1,20,1,20,1,21,1,21,1,21,3,21,222,8,21,1,22,1,22,1,22,1,22,5,22,
        228,8,22,10,22,12,22,231,9,22,1,22,1,22,3,22,235,8,22,1,23,1,23,
        1,23,1,23,1,23,1,23,3,23,243,8,23,1,23,1,23,1,24,1,24,1,25,1,25,
        1,25,1,25,1,25,1,25,3,25,255,8,25,1,26,1,26,1,26,5,26,260,8,26,10,
        26,12,26,263,9,26,1,27,1,27,1,27,5,27,268,8,27,10,27,12,27,271,9,
        27,1,28,1,28,1,28,5,28,276,8,28,10,28,12,28,279,9,28,1,29,1,29,1,
        29,5,29,284,8,29,10,29,12,29,287,9,29,1,30,1,30,1,30,5,30,292,8,
        30,10,30,12,30,295,9,30,1,31,1,31,1,31,5,31,300,8,31,10,31,12,31,
        303,9,31,1,32,1,32,1,32,1,32,1,32,1,32,1,32,3,32,312,8,32,1,33,1,
        33,1,33,1,33,1,33,3,33,319,8,33,1,34,1,34,1,34,1,34,1,34,1,34,1,
        34,3,34,328,8,34,1,35,1,35,1,35,3,35,333,8,35,1,35,1,35,1,36,1,36,
        1,36,1,36,3,36,341,8,36,3,36,343,8,36,1,37,1,37,1,37,5,37,348,8,
        37,10,37,12,37,351,9,37,1,38,1,38,1,38,5,38,356,8,38,10,38,12,38,
        359,9,38,1,39,1,39,1,39,1,39,3,39,365,8,39,1,40,1,40,3,40,369,8,
        40,1,41,1,41,1,42,1,42,1,43,1,43,1,43,5,43,378,8,43,10,43,12,43,
        381,9,43,1,43,0,0,44,0,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30,
        32,34,36,38,40,42,44,46,48,50,52,54,56,58,60,62,64,66,68,70,72,74,
        76,78,80,82,84,86,0,6,1,0,18,19,1,0,20,23,1,0,24,25,1,0,26,28,1,
        0,36,37,2,0,15,15,38,39,390,0,92,1,0,0,0,2,99,1,0,0,0,4,101,1,0,
        0,0,6,117,1,0,0,0,8,121,1,0,0,0,10,123,1,0,0,0,12,128,1,0,0,0,14,
        133,1,0,0,0,16,146,1,0,0,0,18,148,1,0,0,0,20,162,1,0,0,0,22,164,
        1,0,0,0,24,166,1,0,0,0,26,168,1,0,0,0,28,170,1,0,0,0,30,176,1,0,
        0,0,32,180,1,0,0,0,34,188,1,0,0,0,36,192,1,0,0,0,38,196,1,0,0,0,
        40,207,1,0,0,0,42,221,1,0,0,0,44,223,1,0,0,0,46,236,1,0,0,0,48,246,
        1,0,0,0,50,248,1,0,0,0,52,256,1,0,0,0,54,264,1,0,0,0,56,272,1,0,
        0,0,58,280,1,0,0,0,60,288,1,0,0,0,62,296,1,0,0,0,64,311,1,0,0,0,
        66,313,1,0,0,0,68,327,1,0,0,0,70,329,1,0,0,0,72,342,1,0,0,0,74,344,
        1,0,0,0,76,352,1,0,0,0,78,360,1,0,0,0,80,368,1,0,0,0,82,370,1,0,
        0,0,84,372,1,0,0,0,86,374,1,0,0,0,88,91,3,2,1,0,89,91,5,3,0,0,90,
        88,1,0,0,0,90,89,1,0,0,0,91,94,1,0,0,0,92,90,1,0,0,0,92,93,1,0,0,
        0,93,95,1,0,0,0,94,92,1,0,0,0,95,96,5,0,0,1,96,1,1,0,0,0,97,100,
        3,8,4,0,98,100,3,4,2,0,99,97,1,0,0,0,99,98,1,0,0,0,100,3,1,0,0,0,
        101,106,3,6,3,0,102,103,5,31,0,0,103,105,3,6,3,0,104,102,1,0,0,0,
        105,108,1,0,0,0,106,104,1,0,0,0,106,107,1,0,0,0,107,5,1,0,0,0,108,
        106,1,0,0,0,109,118,3,34,17,0,110,118,3,36,18,0,111,118,3,70,35,
        0,112,118,3,44,22,0,113,118,3,46,23,0,114,118,3,22,11,0,115,118,
        3,24,12,0,116,118,3,42,21,0,117,109,1,0,0,0,117,110,1,0,0,0,117,
        111,1,0,0,0,117,112,1,0,0,0,117,113,1,0,0,0,117,114,1,0,0,0,117,
        115,1,0,0,0,117,116,1,0,0,0,118,7,1,0,0,0,119,122,3,10,5,0,120,122,
        3,12,6,0,121,119,1,0,0,0,121,120,1,0,0,0,122,9,1,0,0,0,123,124,3,
        86,43,0,124,125,3,14,7,0,125,126,5,30,0,0,126,127,3,16,8,0,127,11,
        1,0,0,0,128,129,3,86,43,0,129,130,3,14,7,0,130,131,5,30,0,0,131,
        132,3,26,13,0,132,13,1,0,0,0,133,142,5,32,0,0,134,139,3,86,43,0,
        135,136,5,31,0,0,136,138,3,86,43,0,137,135,1,0,0,0,138,141,1,0,0,
        0,139,137,1,0,0,0,139,140,1,0,0,0,140,143,1,0,0,0,141,139,1,0,0,
        0,142,134,1,0,0,0,142,143,1,0,0,0,143,144,1,0,0,0,144,145,5,33,0,
        0,145,15,1,0,0,0,146,147,3,18,9,0,147,17,1,0,0,0,148,153,3,20,10,
        0,149,150,5,31,0,0,150,152,3,20,10,0,151,149,1,0,0,0,152,155,1,0,
        0,0,153,151,1,0,0,0,153,154,1,0,0,0,154,19,1,0,0,0,155,153,1,0,0,
        0,156,163,3,34,17,0,157,163,3,36,18,0,158,163,3,42,21,0,159,163,
        3,40,20,0,160,163,3,22,11,0,161,163,3,24,12,0,162,156,1,0,0,0,162,
        157,1,0,0,0,162,158,1,0,0,0,162,159,1,0,0,0,162,160,1,0,0,0,162,
        161,1,0,0,0,163,21,1,0,0,0,164,165,5,10,0,0,165,23,1,0,0,0,166,167,
        5,11,0,0,167,25,1,0,0,0,168,169,3,28,14,0,169,27,1,0,0,0,170,171,
        5,1,0,0,171,172,3,30,15,0,172,173,5,2,0,0,173,29,1,0,0,0,174,177,
        3,32,16,0,175,177,5,3,0,0,176,174,1,0,0,0,176,175,1,0,0,0,177,178,
        1,0,0,0,178,176,1,0,0,0,178,179,1,0,0,0,179,31,1,0,0,0,180,185,3,
        20,10,0,181,182,5,31,0,0,182,184,3,20,10,0,183,181,1,0,0,0,184,187,
        1,0,0,0,185,183,1,0,0,0,185,186,1,0,0,0,186,33,1,0,0,0,187,185,1,
        0,0,0,188,189,3,86,43,0,189,190,5,29,0,0,190,191,3,42,21,0,191,35,
        1,0,0,0,192,193,3,38,19,0,193,194,5,29,0,0,194,195,3,42,21,0,195,
        37,1,0,0,0,196,197,5,34,0,0,197,202,3,86,43,0,198,199,5,31,0,0,199,
        201,3,86,43,0,200,198,1,0,0,0,201,204,1,0,0,0,202,200,1,0,0,0,202,
        203,1,0,0,0,203,205,1,0,0,0,204,202,1,0,0,0,205,206,5,35,0,0,206,
        39,1,0,0,0,207,208,5,34,0,0,208,213,3,42,21,0,209,210,5,31,0,0,210,
        212,3,42,21,0,211,209,1,0,0,0,212,215,1,0,0,0,213,211,1,0,0,0,213,
        214,1,0,0,0,214,216,1,0,0,0,215,213,1,0,0,0,216,217,5,35,0,0,217,
        41,1,0,0,0,218,222,3,50,25,0,219,222,3,44,22,0,220,222,3,46,23,0,
        221,218,1,0,0,0,221,219,1,0,0,0,221,220,1,0,0,0,222,43,1,0,0,0,223,
        224,5,5,0,0,224,225,3,50,25,0,225,234,3,48,24,0,226,228,5,3,0,0,
        227,226,1,0,0,0,228,231,1,0,0,0,229,227,1,0,0,0,229,230,1,0,0,0,
        230,232,1,0,0,0,231,229,1,0,0,0,232,233,5,6,0,0,233,235,3,48,24,
        0,234,229,1,0,0,0,234,235,1,0,0,0,235,45,1,0,0,0,236,237,5,7,0,0,
        237,238,3,34,17,0,238,239,5,8,0,0,239,242,3,50,25,0,240,241,5,9,
        0,0,241,243,3,50,25,0,242,240,1,0,0,0,242,243,1,0,0,0,243,244,1,
        0,0,0,244,245,3,48,24,0,245,47,1,0,0,0,246,247,3,26,13,0,247,49,
        1,0,0,0,248,254,3,52,26,0,249,250,5,16,0,0,250,251,3,50,25,0,251,
        252,5,17,0,0,252,253,3,50,25,0,253,255,1,0,0,0,254,249,1,0,0,0,254,
        255,1,0,0,0,255,51,1,0,0,0,256,261,3,54,27,0,257,258,5,12,0,0,258,
        260,3,54,27,0,259,257,1,0,0,0,260,263,1,0,0,0,261,259,1,0,0,0,261,
        262,1,0,0,0,262,53,1,0,0,0,263,261,1,0,0,0,264,269,3,56,28,0,265,
        266,5,13,0,0,266,268,3,56,28,0,267,265,1,0,0,0,268,271,1,0,0,0,269,
        267,1,0,0,0,269,270,1,0,0,0,270,55,1,0,0,0,271,269,1,0,0,0,272,277,
        3,58,29,0,273,274,7,0,0,0,274,276,3,58,29,0,275,273,1,0,0,0,276,
        279,1,0,0,0,277,275,1,0,0,0,277,278,1,0,0,0,278,57,1,0,0,0,279,277,
        1,0,0,0,280,285,3,60,30,0,281,282,7,1,0,0,282,284,3,60,30,0,283,
        281,1,0,0,0,284,287,1,0,0,0,285,283,1,0,0,0,285,286,1,0,0,0,286,
        59,1,0,0,0,287,285,1,0,0,0,288,293,3,62,31,0,289,290,7,2,0,0,290,
        292,3,62,31,0,291,289,1,0,0,0,292,295,1,0,0,0,293,291,1,0,0,0,293,
        294,1,0,0,0,294,61,1,0,0,0,295,293,1,0,0,0,296,301,3,64,32,0,297,
        298,7,3,0,0,298,300,3,64,32,0,299,297,1,0,0,0,300,303,1,0,0,0,301,
        299,1,0,0,0,301,302,1,0,0,0,302,63,1,0,0,0,303,301,1,0,0,0,304,312,
        3,66,33,0,305,306,5,14,0,0,306,312,3,66,33,0,307,308,5,24,0,0,308,
        312,3,66,33,0,309,310,5,25,0,0,310,312,3,66,33,0,311,304,1,0,0,0,
        311,305,1,0,0,0,311,307,1,0,0,0,311,309,1,0,0,0,312,65,1,0,0,0,313,
        318,3,68,34,0,314,315,5,34,0,0,315,316,3,42,21,0,316,317,5,35,0,
        0,317,319,1,0,0,0,318,314,1,0,0,0,318,319,1,0,0,0,319,67,1,0,0,0,
        320,328,3,70,35,0,321,328,3,86,43,0,322,328,3,80,40,0,323,324,5,
        32,0,0,324,325,3,42,21,0,325,326,5,33,0,0,326,328,1,0,0,0,327,320,
        1,0,0,0,327,321,1,0,0,0,327,322,1,0,0,0,327,323,1,0,0,0,328,69,1,
        0,0,0,329,330,3,86,43,0,330,332,5,32,0,0,331,333,3,72,36,0,332,331,
        1,0,0,0,332,333,1,0,0,0,333,334,1,0,0,0,334,335,5,33,0,0,335,71,
        1,0,0,0,336,343,3,76,38,0,337,340,3,74,37,0,338,339,5,31,0,0,339,
        341,3,76,38,0,340,338,1,0,0,0,340,341,1,0,0,0,341,343,1,0,0,0,342,
        336,1,0,0,0,342,337,1,0,0,0,343,73,1,0,0,0,344,349,3,42,21,0,345,
        346,5,31,0,0,346,348,3,42,21,0,347,345,1,0,0,0,348,351,1,0,0,0,349,
        347,1,0,0,0,349,350,1,0,0,0,350,75,1,0,0,0,351,349,1,0,0,0,352,357,
        3,78,39,0,353,354,5,31,0,0,354,356,3,78,39,0,355,353,1,0,0,0,356,
        359,1,0,0,0,357,355,1,0,0,0,357,358,1,0,0,0,358,77,1,0,0,0,359,357,
        1,0,0,0,360,361,3,86,43,0,361,364,5,29,0,0,362,365,3,42,21,0,363,
        365,3,40,20,0,364,362,1,0,0,0,364,363,1,0,0,0,365,79,1,0,0,0,366,
        369,3,82,41,0,367,369,3,84,42,0,368,366,1,0,0,0,368,367,1,0,0,0,
        369,81,1,0,0,0,370,371,7,4,0,0,371,83,1,0,0,0,372,373,7,5,0,0,373,
        85,1,0,0,0,374,379,5,40,0,0,375,376,5,44,0,0,376,378,5,40,0,0,377,
        375,1,0,0,0,378,381,1,0,0,0,379,377,1,0,0,0,379,380,1,0,0,0,380,
        87,1,0,0,0,381,379,1,0,0,0,37,90,92,99,106,117,121,139,142,153,162,
        176,178,185,202,213,221,229,234,242,254,261,269,277,285,293,301,
        311,318,327,332,340,342,349,357,364,368,379
    ];

    private static __ATN: antlr.ATN;
    public static get _ATN(): antlr.ATN {
        if (!PineV1Parser.__ATN) {
            PineV1Parser.__ATN = new antlr.ATNDeserializer().deserialize(PineV1Parser._serializedATN);
        }

        return PineV1Parser.__ATN;
    }


    private static readonly vocabulary = new antlr.Vocabulary(PineV1Parser.literalNames, PineV1Parser.symbolicNames, []);

    public override get vocabulary(): antlr.Vocabulary {
        return PineV1Parser.vocabulary;
    }

    private static readonly decisionsToDFA = PineV1Parser._ATN.decisionToState.map( (ds: antlr.DecisionState, index: number) => new antlr.DFA(ds, index) );
}

export class Pine_scriptContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public EOF(): antlr.TerminalNode {
        return this.getToken(PineV1Parser.EOF, 0)!;
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
    		return this.getTokens(PineV1Parser.LEND);
    	} else {
    		return this.getToken(PineV1Parser.LEND, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV1Parser.RULE_pine_script;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
        if (visitor.visitPine_script) {
            return visitor.visitPine_script(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class StmtContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public fun_def_stmt(): Fun_def_stmtContext | null {
        return this.getRuleContext(0, Fun_def_stmtContext);
    }
    public global_stmt(): Global_stmtContext | null {
        return this.getRuleContext(0, Global_stmtContext);
    }
    public override get ruleIndex(): number {
        return PineV1Parser.RULE_stmt;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
        if (visitor.visitStmt) {
            return visitor.visitStmt(this);
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
    		return this.getTokens(PineV1Parser.COMMA);
    	} else {
    		return this.getToken(PineV1Parser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV1Parser.RULE_global_stmt;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
        if (visitor.visitGlobal_stmt) {
            return visitor.visitGlobal_stmt(this);
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
    public for_expr(): For_exprContext | null {
        return this.getRuleContext(0, For_exprContext);
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
        return PineV1Parser.RULE_global_stmt_content;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
        if (visitor.visitGlobal_stmt_content) {
            return visitor.visitGlobal_stmt_content(this);
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
        return PineV1Parser.RULE_fun_def_stmt;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV1Parser.ARROW, 0)!;
    }
    public fun_body_singleline(): Fun_body_singlelineContext {
        return this.getRuleContext(0, Fun_body_singlelineContext)!;
    }
    public override get ruleIndex(): number {
        return PineV1Parser.RULE_fun_def_singleline;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV1Parser.ARROW, 0)!;
    }
    public fun_body_multiline(): Fun_body_multilineContext {
        return this.getRuleContext(0, Fun_body_multilineContext)!;
    }
    public override get ruleIndex(): number {
        return PineV1Parser.RULE_fun_def_multiline;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
        if (visitor.visitFun_def_multiline) {
            return visitor.visitFun_def_multiline(this);
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
        return this.getToken(PineV1Parser.LPAR, 0)!;
    }
    public RPAR(): antlr.TerminalNode {
        return this.getToken(PineV1Parser.RPAR, 0)!;
    }
    public id(): IdContext[];
    public id(i: number): IdContext | null;
    public id(i?: number): IdContext[] | IdContext | null {
        if (i === undefined) {
            return this.getRuleContexts(IdContext);
        }

        return this.getRuleContext(i, IdContext);
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV1Parser.COMMA);
    	} else {
    		return this.getToken(PineV1Parser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV1Parser.RULE_fun_head;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
        if (visitor.visitFun_head) {
            return visitor.visitFun_head(this);
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
        return PineV1Parser.RULE_fun_body_singleline;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
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
    		return this.getTokens(PineV1Parser.COMMA);
    	} else {
    		return this.getToken(PineV1Parser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV1Parser.RULE_local_stmt_singleline;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
        if (visitor.visitLocal_stmt_singleline) {
            return visitor.visitLocal_stmt_singleline(this);
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
    public loop_break(): Loop_breakContext | null {
        return this.getRuleContext(0, Loop_breakContext);
    }
    public loop_continue(): Loop_continueContext | null {
        return this.getRuleContext(0, Loop_continueContext);
    }
    public override get ruleIndex(): number {
        return PineV1Parser.RULE_local_stmt_content;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
        if (visitor.visitLocal_stmt_content) {
            return visitor.visitLocal_stmt_content(this);
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
        return this.getToken(PineV1Parser.BREAK, 0)!;
    }
    public override get ruleIndex(): number {
        return PineV1Parser.RULE_loop_break;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV1Parser.CONTINUE, 0)!;
    }
    public override get ruleIndex(): number {
        return PineV1Parser.RULE_loop_continue;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
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
        return PineV1Parser.RULE_fun_body_multiline;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV1Parser.BEGIN, 0)!;
    }
    public local_stmts_list(): Local_stmts_listContext {
        return this.getRuleContext(0, Local_stmts_listContext)!;
    }
    public END(): antlr.TerminalNode {
        return this.getToken(PineV1Parser.END, 0)!;
    }
    public override get ruleIndex(): number {
        return PineV1Parser.RULE_local_stmts_multiline;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
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
    		return this.getTokens(PineV1Parser.LEND);
    	} else {
    		return this.getToken(PineV1Parser.LEND, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV1Parser.RULE_local_stmts_list;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
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
    		return this.getTokens(PineV1Parser.COMMA);
    	} else {
    		return this.getToken(PineV1Parser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV1Parser.RULE_local_stmt_multiline;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
        if (visitor.visitLocal_stmt_multiline) {
            return visitor.visitLocal_stmt_multiline(this);
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
        return this.getToken(PineV1Parser.DEFINE, 0)!;
    }
    public arith_expr(): Arith_exprContext {
        return this.getRuleContext(0, Arith_exprContext)!;
    }
    public override get ruleIndex(): number {
        return PineV1Parser.RULE_var_def;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV1Parser.DEFINE, 0)!;
    }
    public arith_expr(): Arith_exprContext {
        return this.getRuleContext(0, Arith_exprContext)!;
    }
    public override get ruleIndex(): number {
        return PineV1Parser.RULE_var_defs;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
        if (visitor.visitVar_defs) {
            return visitor.visitVar_defs(this);
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
        return this.getToken(PineV1Parser.LSQBR, 0)!;
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
        return this.getToken(PineV1Parser.RSQBR, 0)!;
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV1Parser.COMMA);
    	} else {
    		return this.getToken(PineV1Parser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV1Parser.RULE_ids_array;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV1Parser.LSQBR, 0)!;
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
        return this.getToken(PineV1Parser.RSQBR, 0)!;
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV1Parser.COMMA);
    	} else {
    		return this.getToken(PineV1Parser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV1Parser.RULE_arith_exprs;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
        if (visitor.visitArith_exprs) {
            return visitor.visitArith_exprs(this);
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
    public override get ruleIndex(): number {
        return PineV1Parser.RULE_arith_expr;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
        if (visitor.visitArith_expr) {
            return visitor.visitArith_expr(this);
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
        return this.getToken(PineV1Parser.IF_COND, 0)!;
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
        return this.getToken(PineV1Parser.IF_COND_ELSE, 0);
    }
    public LEND(): antlr.TerminalNode[];
    public LEND(i: number): antlr.TerminalNode | null;
    public LEND(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV1Parser.LEND);
    	} else {
    		return this.getToken(PineV1Parser.LEND, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV1Parser.RULE_if_expr;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV1Parser.FOR_STMT, 0)!;
    }
    public var_def(): Var_defContext {
        return this.getRuleContext(0, Var_defContext)!;
    }
    public FOR_STMT_TO(): antlr.TerminalNode {
        return this.getToken(PineV1Parser.FOR_STMT_TO, 0)!;
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
        return this.getToken(PineV1Parser.FOR_STMT_BY, 0);
    }
    public override get ruleIndex(): number {
        return PineV1Parser.RULE_for_expr;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
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
        return PineV1Parser.RULE_stmts_block;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV1Parser.COND, 0);
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
        return this.getToken(PineV1Parser.COND_ELSE, 0);
    }
    public override get ruleIndex(): number {
        return PineV1Parser.RULE_ternary_expr;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
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
    		return this.getTokens(PineV1Parser.OR);
    	} else {
    		return this.getToken(PineV1Parser.OR, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV1Parser.RULE_or_expr;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
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
    		return this.getTokens(PineV1Parser.AND);
    	} else {
    		return this.getToken(PineV1Parser.AND, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV1Parser.RULE_and_expr;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
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
    		return this.getTokens(PineV1Parser.EQ);
    	} else {
    		return this.getToken(PineV1Parser.EQ, i);
    	}
    }
    public NEQ(): antlr.TerminalNode[];
    public NEQ(i: number): antlr.TerminalNode | null;
    public NEQ(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV1Parser.NEQ);
    	} else {
    		return this.getToken(PineV1Parser.NEQ, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV1Parser.RULE_eq_expr;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
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
    		return this.getTokens(PineV1Parser.GT);
    	} else {
    		return this.getToken(PineV1Parser.GT, i);
    	}
    }
    public GE(): antlr.TerminalNode[];
    public GE(i: number): antlr.TerminalNode | null;
    public GE(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV1Parser.GE);
    	} else {
    		return this.getToken(PineV1Parser.GE, i);
    	}
    }
    public LT(): antlr.TerminalNode[];
    public LT(i: number): antlr.TerminalNode | null;
    public LT(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV1Parser.LT);
    	} else {
    		return this.getToken(PineV1Parser.LT, i);
    	}
    }
    public LE(): antlr.TerminalNode[];
    public LE(i: number): antlr.TerminalNode | null;
    public LE(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV1Parser.LE);
    	} else {
    		return this.getToken(PineV1Parser.LE, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV1Parser.RULE_cmp_expr;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
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
    		return this.getTokens(PineV1Parser.PLUS);
    	} else {
    		return this.getToken(PineV1Parser.PLUS, i);
    	}
    }
    public MINUS(): antlr.TerminalNode[];
    public MINUS(i: number): antlr.TerminalNode | null;
    public MINUS(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV1Parser.MINUS);
    	} else {
    		return this.getToken(PineV1Parser.MINUS, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV1Parser.RULE_add_expr;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
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
    		return this.getTokens(PineV1Parser.MUL);
    	} else {
    		return this.getToken(PineV1Parser.MUL, i);
    	}
    }
    public DIV(): antlr.TerminalNode[];
    public DIV(i: number): antlr.TerminalNode | null;
    public DIV(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV1Parser.DIV);
    	} else {
    		return this.getToken(PineV1Parser.DIV, i);
    	}
    }
    public MOD(): antlr.TerminalNode[];
    public MOD(i: number): antlr.TerminalNode | null;
    public MOD(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV1Parser.MOD);
    	} else {
    		return this.getToken(PineV1Parser.MOD, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV1Parser.RULE_mult_expr;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV1Parser.NOT, 0);
    }
    public PLUS(): antlr.TerminalNode | null {
        return this.getToken(PineV1Parser.PLUS, 0);
    }
    public MINUS(): antlr.TerminalNode | null {
        return this.getToken(PineV1Parser.MINUS, 0);
    }
    public override get ruleIndex(): number {
        return PineV1Parser.RULE_unary_expr;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV1Parser.LSQBR, 0);
    }
    public arith_expr(): Arith_exprContext | null {
        return this.getRuleContext(0, Arith_exprContext);
    }
    public RSQBR(): antlr.TerminalNode | null {
        return this.getToken(PineV1Parser.RSQBR, 0);
    }
    public override get ruleIndex(): number {
        return PineV1Parser.RULE_sqbr_expr;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV1Parser.LPAR, 0);
    }
    public arith_expr(): Arith_exprContext | null {
        return this.getRuleContext(0, Arith_exprContext);
    }
    public RPAR(): antlr.TerminalNode | null {
        return this.getToken(PineV1Parser.RPAR, 0);
    }
    public override get ruleIndex(): number {
        return PineV1Parser.RULE_atom;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
        if (visitor.visitAtom) {
            return visitor.visitAtom(this);
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
        return this.getToken(PineV1Parser.LPAR, 0)!;
    }
    public RPAR(): antlr.TerminalNode {
        return this.getToken(PineV1Parser.RPAR, 0)!;
    }
    public fun_actual_args(): Fun_actual_argsContext | null {
        return this.getRuleContext(0, Fun_actual_argsContext);
    }
    public override get ruleIndex(): number {
        return PineV1Parser.RULE_fun_call;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
        if (visitor.visitFun_call) {
            return visitor.visitFun_call(this);
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
        return this.getToken(PineV1Parser.COMMA, 0);
    }
    public override get ruleIndex(): number {
        return PineV1Parser.RULE_fun_actual_args;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
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
    		return this.getTokens(PineV1Parser.COMMA);
    	} else {
    		return this.getToken(PineV1Parser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV1Parser.RULE_pos_args;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
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
    		return this.getTokens(PineV1Parser.COMMA);
    	} else {
    		return this.getToken(PineV1Parser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV1Parser.RULE_kw_args;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV1Parser.DEFINE, 0)!;
    }
    public arith_expr(): Arith_exprContext | null {
        return this.getRuleContext(0, Arith_exprContext);
    }
    public arith_exprs(): Arith_exprsContext | null {
        return this.getRuleContext(0, Arith_exprsContext);
    }
    public override get ruleIndex(): number {
        return PineV1Parser.RULE_kw_arg;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
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
        return PineV1Parser.RULE_literal;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV1Parser.INT_LITERAL, 0);
    }
    public FLOAT_LITERAL(): antlr.TerminalNode | null {
        return this.getToken(PineV1Parser.FLOAT_LITERAL, 0);
    }
    public override get ruleIndex(): number {
        return PineV1Parser.RULE_num_literal;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV1Parser.STR_LITERAL, 0);
    }
    public BOOL_LITERAL(): antlr.TerminalNode | null {
        return this.getToken(PineV1Parser.BOOL_LITERAL, 0);
    }
    public COLOR_LITERAL(): antlr.TerminalNode | null {
        return this.getToken(PineV1Parser.COLOR_LITERAL, 0);
    }
    public override get ruleIndex(): number {
        return PineV1Parser.RULE_other_literal;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
        if (visitor.visitOther_literal) {
            return visitor.visitOther_literal(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}


export class IdContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public ID(): antlr.TerminalNode[];
    public ID(i: number): antlr.TerminalNode | null;
    public ID(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV1Parser.ID);
    	} else {
    		return this.getToken(PineV1Parser.ID, i);
    	}
    }
    public DOT(): antlr.TerminalNode[];
    public DOT(i: number): antlr.TerminalNode | null;
    public DOT(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV1Parser.DOT);
    	} else {
    		return this.getToken(PineV1Parser.DOT, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV1Parser.RULE_id;
    }
    public override accept<Result>(visitor: PineV1ParserVisitor<Result>): Result | null {
        if (visitor.visitId) {
            return visitor.visitId(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
