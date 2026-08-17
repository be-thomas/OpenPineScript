
import * as antlr from "antlr4ng";
import { Token } from "antlr4ng";

import { PineV4ParserVisitor } from "./PineV4ParserVisitor.js";

// for running tests with parameters, TODO: discuss strategy for typed parameters in CI
// eslint-disable-next-line no-unused-vars
type int = number;


export class PineV4Parser extends antlr.Parser {
    public static readonly BEGIN = 1;
    public static readonly END = 2;
    public static readonly LEND = 3;
    public static readonly VAR = 4;
    public static readonly VARIP = 5;
    public static readonly SERIES = 6;
    public static readonly SIMPLE = 7;
    public static readonly CONST = 8;
    public static readonly INT_TYPE = 9;
    public static readonly FLOAT_TYPE = 10;
    public static readonly BOOL_TYPE = 11;
    public static readonly STRING_TYPE = 12;
    public static readonly COLOR_TYPE = 13;
    public static readonly LINE_TYPE = 14;
    public static readonly LABEL_TYPE = 15;
    public static readonly BOX_TYPE = 16;
    public static readonly TABLE_TYPE = 17;
    public static readonly ASSIGN = 18;
    public static readonly LBEG = 19;
    public static readonly IF_COND = 20;
    public static readonly IF_COND_ELSE = 21;
    public static readonly FOR_STMT = 22;
    public static readonly FOR_STMT_TO = 23;
    public static readonly FOR_STMT_BY = 24;
    public static readonly BREAK = 25;
    public static readonly CONTINUE = 26;
    public static readonly OR = 27;
    public static readonly AND = 28;
    public static readonly NOT = 29;
    public static readonly BOOL_LITERAL = 30;
    public static readonly COND = 31;
    public static readonly COND_ELSE = 32;
    public static readonly EQ = 33;
    public static readonly NEQ = 34;
    public static readonly GT = 35;
    public static readonly GE = 36;
    public static readonly LT = 37;
    public static readonly LE = 38;
    public static readonly PLUS = 39;
    public static readonly MINUS = 40;
    public static readonly MUL = 41;
    public static readonly DIV = 42;
    public static readonly MOD = 43;
    public static readonly DEFINE = 44;
    public static readonly ARROW = 45;
    public static readonly COMMA = 46;
    public static readonly LPAR = 47;
    public static readonly RPAR = 48;
    public static readonly LSQBR = 49;
    public static readonly RSQBR = 50;
    public static readonly INT_LITERAL = 51;
    public static readonly FLOAT_LITERAL = 52;
    public static readonly STR_LITERAL = 53;
    public static readonly COLOR_LITERAL = 54;
    public static readonly ID = 55;
    public static readonly WS = 56;
    public static readonly LINE_COMMENT = 57;
    public static readonly BLOCK_COMMENT = 58;
    public static readonly DOT = 59;
    public static readonly RULE_decl_mod = 0;
    public static readonly RULE_type_qual = 1;
    public static readonly RULE_type_name = 2;
    public static readonly RULE_id_part = 3;
    public static readonly RULE_id = 4;
    public static readonly RULE_var_def = 5;
    public static readonly RULE_var_defs = 6;
    public static readonly RULE_var_assign = 7;
    public static readonly RULE_global_stmt_content = 8;
    public static readonly RULE_local_stmt_content = 9;
    public static readonly RULE_pine_script = 10;
    public static readonly RULE_stmt = 11;
    public static readonly RULE_global_stmt = 12;
    public static readonly RULE_fun_def_stmt = 13;
    public static readonly RULE_fun_def_singleline = 14;
    public static readonly RULE_fun_def_multiline = 15;
    public static readonly RULE_fun_head = 16;
    public static readonly RULE_fun_body_singleline = 17;
    public static readonly RULE_local_stmt_singleline = 18;
    public static readonly RULE_loop_break = 19;
    public static readonly RULE_loop_continue = 20;
    public static readonly RULE_fun_body_multiline = 21;
    public static readonly RULE_local_stmts_multiline = 22;
    public static readonly RULE_local_stmts_list = 23;
    public static readonly RULE_local_stmt_multiline = 24;
    public static readonly RULE_ids_array = 25;
    public static readonly RULE_arith_exprs = 26;
    public static readonly RULE_arith_expr = 27;
    public static readonly RULE_if_expr = 28;
    public static readonly RULE_for_expr = 29;
    public static readonly RULE_stmts_block = 30;
    public static readonly RULE_ternary_expr = 31;
    public static readonly RULE_or_expr = 32;
    public static readonly RULE_and_expr = 33;
    public static readonly RULE_eq_expr = 34;
    public static readonly RULE_cmp_expr = 35;
    public static readonly RULE_add_expr = 36;
    public static readonly RULE_mult_expr = 37;
    public static readonly RULE_unary_expr = 38;
    public static readonly RULE_sqbr_expr = 39;
    public static readonly RULE_atom = 40;
    public static readonly RULE_fun_call = 41;
    public static readonly RULE_fun_actual_args = 42;
    public static readonly RULE_pos_args = 43;
    public static readonly RULE_kw_args = 44;
    public static readonly RULE_kw_arg = 45;
    public static readonly RULE_literal = 46;
    public static readonly RULE_num_literal = 47;
    public static readonly RULE_other_literal = 48;

    public static readonly literalNames = [
        null, null, null, null, "'var'", "'varip'", "'series'", "'simple'", 
        "'const'", "'int'", "'float'", "'bool'", "'string'", "'color'", 
        "'line'", "'label'", "'box'", "'table'", "':='", null, "'if'", "'else'", 
        "'for'", "'to'", "'by'", "'break'", "'continue'", "'or'", "'and'", 
        "'not'", null, "'?'", "':'", "'=='", "'!='", "'>'", "'>='", "'<'", 
        "'<='", "'+'", "'-'", "'*'", "'/'", "'%'", "'='", "'=>'", "','", 
        "'('", "')'", "'['", "']'", null, null, null, null, null, null, 
        null, null, "'.'"
    ];

    public static readonly symbolicNames = [
        null, "BEGIN", "END", "LEND", "VAR", "VARIP", "SERIES", "SIMPLE", 
        "CONST", "INT_TYPE", "FLOAT_TYPE", "BOOL_TYPE", "STRING_TYPE", "COLOR_TYPE", 
        "LINE_TYPE", "LABEL_TYPE", "BOX_TYPE", "TABLE_TYPE", "ASSIGN", "LBEG", 
        "IF_COND", "IF_COND_ELSE", "FOR_STMT", "FOR_STMT_TO", "FOR_STMT_BY", 
        "BREAK", "CONTINUE", "OR", "AND", "NOT", "BOOL_LITERAL", "COND", 
        "COND_ELSE", "EQ", "NEQ", "GT", "GE", "LT", "LE", "PLUS", "MINUS", 
        "MUL", "DIV", "MOD", "DEFINE", "ARROW", "COMMA", "LPAR", "RPAR", 
        "LSQBR", "RSQBR", "INT_LITERAL", "FLOAT_LITERAL", "STR_LITERAL", 
        "COLOR_LITERAL", "ID", "WS", "LINE_COMMENT", "BLOCK_COMMENT", "DOT"
    ];
    public static readonly ruleNames = [
        "decl_mod", "type_qual", "type_name", "id_part", "id", "var_def", 
        "var_defs", "var_assign", "global_stmt_content", "local_stmt_content", 
        "pine_script", "stmt", "global_stmt", "fun_def_stmt", "fun_def_singleline", 
        "fun_def_multiline", "fun_head", "fun_body_singleline", "local_stmt_singleline", 
        "loop_break", "loop_continue", "fun_body_multiline", "local_stmts_multiline", 
        "local_stmts_list", "local_stmt_multiline", "ids_array", "arith_exprs", 
        "arith_expr", "if_expr", "for_expr", "stmts_block", "ternary_expr", 
        "or_expr", "and_expr", "eq_expr", "cmp_expr", "add_expr", "mult_expr", 
        "unary_expr", "sqbr_expr", "atom", "fun_call", "fun_actual_args", 
        "pos_args", "kw_args", "kw_arg", "literal", "num_literal", "other_literal",
    ];

    public get grammarFileName(): string { return "PineV4Parser.g4"; }
    public get literalNames(): (string | null)[] { return PineV4Parser.literalNames; }
    public get symbolicNames(): (string | null)[] { return PineV4Parser.symbolicNames; }
    public get ruleNames(): string[] { return PineV4Parser.ruleNames; }
    public get serializedATN(): number[] { return PineV4Parser._serializedATN; }

    protected createFailedPredicateException(predicate?: string, message?: string): antlr.FailedPredicateException {
        return new antlr.FailedPredicateException(this, predicate, message);
    }

    public constructor(input: antlr.TokenStream) {
        super(input);
        this.interpreter = new antlr.ParserATNSimulator(this, PineV4Parser._ATN, PineV4Parser.decisionsToDFA, new antlr.PredictionContextCache());
    }
    public decl_mod(): Decl_modContext {
        let localContext = new Decl_modContext(this.context, this.state);
        this.enterRule(localContext, 0, PineV4Parser.RULE_decl_mod);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 98;
            _la = this.tokenStream.LA(1);
            if(!(_la === 4 || _la === 5)) {
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
        this.enterRule(localContext, 2, PineV4Parser.RULE_type_qual);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 100;
            _la = this.tokenStream.LA(1);
            if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 448) !== 0))) {
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
        this.enterRule(localContext, 4, PineV4Parser.RULE_type_name);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 102;
            _la = this.tokenStream.LA(1);
            if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 261632) !== 0))) {
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
    public id_part(): Id_partContext {
        let localContext = new Id_partContext(this.context, this.state);
        this.enterRule(localContext, 6, PineV4Parser.RULE_id_part);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 104;
            _la = this.tokenStream.LA(1);
            if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 262080) !== 0) || _la === 55)) {
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
        this.enterRule(localContext, 8, PineV4Parser.RULE_id);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 106;
            this.id_part();
            this.state = 111;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 59) {
                {
                {
                this.state = 107;
                this.match(PineV4Parser.DOT);
                this.state = 108;
                this.id_part();
                }
                }
                this.state = 113;
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
        this.enterRule(localContext, 10, PineV4Parser.RULE_var_def);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 115;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 4 || _la === 5) {
                {
                this.state = 114;
                this.decl_mod();
                }
            }

            this.state = 118;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 2, this.context) ) {
            case 1:
                {
                this.state = 117;
                this.type_qual();
                }
                break;
            }
            this.state = 121;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 3, this.context) ) {
            case 1:
                {
                this.state = 120;
                this.type_name();
                }
                break;
            }
            this.state = 123;
            this.id();
            this.state = 124;
            this.match(PineV4Parser.DEFINE);
            this.state = 125;
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
        this.enterRule(localContext, 12, PineV4Parser.RULE_var_defs);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 128;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 4 || _la === 5) {
                {
                this.state = 127;
                this.decl_mod();
                }
            }

            this.state = 131;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 448) !== 0)) {
                {
                this.state = 130;
                this.type_qual();
                }
            }

            this.state = 134;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 261632) !== 0)) {
                {
                this.state = 133;
                this.type_name();
                }
            }

            this.state = 136;
            this.ids_array();
            this.state = 137;
            this.match(PineV4Parser.DEFINE);
            this.state = 138;
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
    public var_assign(): Var_assignContext {
        let localContext = new Var_assignContext(this.context, this.state);
        this.enterRule(localContext, 14, PineV4Parser.RULE_var_assign);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 140;
            this.id();
            this.state = 141;
            this.match(PineV4Parser.ASSIGN);
            this.state = 142;
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
    public global_stmt_content(): Global_stmt_contentContext {
        let localContext = new Global_stmt_contentContext(this.context, this.state);
        this.enterRule(localContext, 16, PineV4Parser.RULE_global_stmt_content);
        try {
            this.state = 153;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 7, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 144;
                this.var_def();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 145;
                this.var_defs();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 146;
                this.fun_call();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 147;
                this.if_expr();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 148;
                this.var_assign();
                }
                break;
            case 6:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 149;
                this.for_expr();
                }
                break;
            case 7:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 150;
                this.loop_break();
                }
                break;
            case 8:
                this.enterOuterAlt(localContext, 8);
                {
                this.state = 151;
                this.loop_continue();
                }
                break;
            case 9:
                this.enterOuterAlt(localContext, 9);
                {
                this.state = 152;
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
        this.enterRule(localContext, 18, PineV4Parser.RULE_local_stmt_content);
        try {
            this.state = 162;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 8, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 155;
                this.var_def();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 156;
                this.var_defs();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 157;
                this.arith_expr();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 158;
                this.arith_exprs();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 159;
                this.var_assign();
                }
                break;
            case 6:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 160;
                this.loop_break();
                }
                break;
            case 7:
                this.enterOuterAlt(localContext, 7);
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
    public pine_script(): Pine_scriptContext {
        let localContext = new Pine_scriptContext(this.context, this.state);
        this.enterRule(localContext, 20, PineV4Parser.RULE_pine_script);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 168;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 1716781048) !== 0) || ((((_la - 39)) & ~0x1F) === 0 && ((1 << (_la - 39)) & 128259) !== 0)) {
                {
                this.state = 166;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case PineV4Parser.VAR:
                case PineV4Parser.VARIP:
                case PineV4Parser.SERIES:
                case PineV4Parser.SIMPLE:
                case PineV4Parser.CONST:
                case PineV4Parser.INT_TYPE:
                case PineV4Parser.FLOAT_TYPE:
                case PineV4Parser.BOOL_TYPE:
                case PineV4Parser.STRING_TYPE:
                case PineV4Parser.COLOR_TYPE:
                case PineV4Parser.LINE_TYPE:
                case PineV4Parser.LABEL_TYPE:
                case PineV4Parser.BOX_TYPE:
                case PineV4Parser.TABLE_TYPE:
                case PineV4Parser.IF_COND:
                case PineV4Parser.FOR_STMT:
                case PineV4Parser.BREAK:
                case PineV4Parser.CONTINUE:
                case PineV4Parser.NOT:
                case PineV4Parser.BOOL_LITERAL:
                case PineV4Parser.PLUS:
                case PineV4Parser.MINUS:
                case PineV4Parser.LPAR:
                case PineV4Parser.LSQBR:
                case PineV4Parser.INT_LITERAL:
                case PineV4Parser.FLOAT_LITERAL:
                case PineV4Parser.STR_LITERAL:
                case PineV4Parser.COLOR_LITERAL:
                case PineV4Parser.ID:
                    {
                    this.state = 164;
                    this.stmt();
                    }
                    break;
                case PineV4Parser.LEND:
                    {
                    this.state = 165;
                    this.match(PineV4Parser.LEND);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                this.state = 170;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 171;
            this.match(PineV4Parser.EOF);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
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
        this.enterRule(localContext, 22, PineV4Parser.RULE_stmt);
        try {
            this.state = 175;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 11, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 173;
                this.fun_def_stmt();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 174;
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
        this.enterRule(localContext, 24, PineV4Parser.RULE_global_stmt);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 177;
            this.global_stmt_content();
            this.state = 182;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 46) {
                {
                {
                this.state = 178;
                this.match(PineV4Parser.COMMA);
                this.state = 179;
                this.global_stmt_content();
                }
                }
                this.state = 184;
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
        this.enterRule(localContext, 26, PineV4Parser.RULE_fun_def_stmt);
        try {
            this.state = 187;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 13, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 185;
                this.fun_def_singleline();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 186;
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
        this.enterRule(localContext, 28, PineV4Parser.RULE_fun_def_singleline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 189;
            this.id();
            this.state = 190;
            this.fun_head();
            this.state = 191;
            this.match(PineV4Parser.ARROW);
            this.state = 192;
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
        this.enterRule(localContext, 30, PineV4Parser.RULE_fun_def_multiline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 194;
            this.id();
            this.state = 195;
            this.fun_head();
            this.state = 196;
            this.match(PineV4Parser.ARROW);
            this.state = 197;
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
        this.enterRule(localContext, 32, PineV4Parser.RULE_fun_head);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 199;
            this.match(PineV4Parser.LPAR);
            this.state = 208;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 262080) !== 0) || _la === 55) {
                {
                this.state = 200;
                this.id();
                this.state = 205;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 46) {
                    {
                    {
                    this.state = 201;
                    this.match(PineV4Parser.COMMA);
                    this.state = 202;
                    this.id();
                    }
                    }
                    this.state = 207;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                }
            }

            this.state = 210;
            this.match(PineV4Parser.RPAR);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
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
        this.enterRule(localContext, 34, PineV4Parser.RULE_fun_body_singleline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 212;
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
        this.enterRule(localContext, 36, PineV4Parser.RULE_local_stmt_singleline);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 214;
            this.local_stmt_content();
            this.state = 219;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 46) {
                {
                {
                this.state = 215;
                this.match(PineV4Parser.COMMA);
                this.state = 216;
                this.local_stmt_content();
                }
                }
                this.state = 221;
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
        this.enterRule(localContext, 38, PineV4Parser.RULE_loop_break);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 222;
            this.match(PineV4Parser.BREAK);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
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
        this.enterRule(localContext, 40, PineV4Parser.RULE_loop_continue);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 224;
            this.match(PineV4Parser.CONTINUE);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
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
        this.enterRule(localContext, 42, PineV4Parser.RULE_fun_body_multiline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 226;
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
        this.enterRule(localContext, 44, PineV4Parser.RULE_local_stmts_multiline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 228;
            this.match(PineV4Parser.BEGIN);
            this.state = 229;
            this.local_stmts_list();
            this.state = 230;
            this.match(PineV4Parser.END);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
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
        this.enterRule(localContext, 46, PineV4Parser.RULE_local_stmts_list);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 234;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                this.state = 234;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case PineV4Parser.VAR:
                case PineV4Parser.VARIP:
                case PineV4Parser.SERIES:
                case PineV4Parser.SIMPLE:
                case PineV4Parser.CONST:
                case PineV4Parser.INT_TYPE:
                case PineV4Parser.FLOAT_TYPE:
                case PineV4Parser.BOOL_TYPE:
                case PineV4Parser.STRING_TYPE:
                case PineV4Parser.COLOR_TYPE:
                case PineV4Parser.LINE_TYPE:
                case PineV4Parser.LABEL_TYPE:
                case PineV4Parser.BOX_TYPE:
                case PineV4Parser.TABLE_TYPE:
                case PineV4Parser.IF_COND:
                case PineV4Parser.FOR_STMT:
                case PineV4Parser.BREAK:
                case PineV4Parser.CONTINUE:
                case PineV4Parser.NOT:
                case PineV4Parser.BOOL_LITERAL:
                case PineV4Parser.PLUS:
                case PineV4Parser.MINUS:
                case PineV4Parser.LPAR:
                case PineV4Parser.LSQBR:
                case PineV4Parser.INT_LITERAL:
                case PineV4Parser.FLOAT_LITERAL:
                case PineV4Parser.STR_LITERAL:
                case PineV4Parser.COLOR_LITERAL:
                case PineV4Parser.ID:
                    {
                    this.state = 232;
                    this.local_stmt_multiline();
                    }
                    break;
                case PineV4Parser.LEND:
                    {
                    this.state = 233;
                    this.match(PineV4Parser.LEND);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                this.state = 236;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 1716781048) !== 0) || ((((_la - 39)) & ~0x1F) === 0 && ((1 << (_la - 39)) & 128259) !== 0));
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
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
        this.enterRule(localContext, 48, PineV4Parser.RULE_local_stmt_multiline);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 238;
            this.local_stmt_content();
            this.state = 243;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 46) {
                {
                {
                this.state = 239;
                this.match(PineV4Parser.COMMA);
                this.state = 240;
                this.local_stmt_content();
                }
                }
                this.state = 245;
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
        this.enterRule(localContext, 50, PineV4Parser.RULE_ids_array);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 246;
            this.match(PineV4Parser.LSQBR);
            this.state = 247;
            this.id();
            this.state = 252;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 46) {
                {
                {
                this.state = 248;
                this.match(PineV4Parser.COMMA);
                this.state = 249;
                this.id();
                }
                }
                this.state = 254;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 255;
            this.match(PineV4Parser.RSQBR);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
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
        this.enterRule(localContext, 52, PineV4Parser.RULE_arith_exprs);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 257;
            this.match(PineV4Parser.LSQBR);
            this.state = 258;
            this.arith_expr();
            this.state = 263;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 46) {
                {
                {
                this.state = 259;
                this.match(PineV4Parser.COMMA);
                this.state = 260;
                this.arith_expr();
                }
                }
                this.state = 265;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 266;
            this.match(PineV4Parser.RSQBR);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
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
        this.enterRule(localContext, 54, PineV4Parser.RULE_arith_expr);
        try {
            this.state = 271;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV4Parser.SERIES:
            case PineV4Parser.SIMPLE:
            case PineV4Parser.CONST:
            case PineV4Parser.INT_TYPE:
            case PineV4Parser.FLOAT_TYPE:
            case PineV4Parser.BOOL_TYPE:
            case PineV4Parser.STRING_TYPE:
            case PineV4Parser.COLOR_TYPE:
            case PineV4Parser.LINE_TYPE:
            case PineV4Parser.LABEL_TYPE:
            case PineV4Parser.BOX_TYPE:
            case PineV4Parser.TABLE_TYPE:
            case PineV4Parser.NOT:
            case PineV4Parser.BOOL_LITERAL:
            case PineV4Parser.PLUS:
            case PineV4Parser.MINUS:
            case PineV4Parser.LPAR:
            case PineV4Parser.INT_LITERAL:
            case PineV4Parser.FLOAT_LITERAL:
            case PineV4Parser.STR_LITERAL:
            case PineV4Parser.COLOR_LITERAL:
            case PineV4Parser.ID:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 268;
                this.ternary_expr();
                }
                break;
            case PineV4Parser.IF_COND:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 269;
                this.if_expr();
                }
                break;
            case PineV4Parser.FOR_STMT:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 270;
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
        this.enterRule(localContext, 56, PineV4Parser.RULE_if_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 273;
            this.match(PineV4Parser.IF_COND);
            this.state = 274;
            this.ternary_expr();
            this.state = 275;
            this.stmts_block();
            this.state = 284;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 24, this.context) ) {
            case 1:
                {
                this.state = 279;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 3) {
                    {
                    {
                    this.state = 276;
                    this.match(PineV4Parser.LEND);
                    }
                    }
                    this.state = 281;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                this.state = 282;
                this.match(PineV4Parser.IF_COND_ELSE);
                this.state = 283;
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
        this.enterRule(localContext, 58, PineV4Parser.RULE_for_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 286;
            this.match(PineV4Parser.FOR_STMT);
            this.state = 287;
            this.var_def();
            this.state = 288;
            this.match(PineV4Parser.FOR_STMT_TO);
            this.state = 289;
            this.ternary_expr();
            this.state = 292;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 24) {
                {
                this.state = 290;
                this.match(PineV4Parser.FOR_STMT_BY);
                this.state = 291;
                this.ternary_expr();
                }
            }

            this.state = 294;
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
        this.enterRule(localContext, 60, PineV4Parser.RULE_stmts_block);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 296;
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
        this.enterRule(localContext, 62, PineV4Parser.RULE_ternary_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 298;
            this.or_expr();
            this.state = 304;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 31) {
                {
                this.state = 299;
                this.match(PineV4Parser.COND);
                this.state = 300;
                this.ternary_expr();
                this.state = 301;
                this.match(PineV4Parser.COND_ELSE);
                this.state = 302;
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
        this.enterRule(localContext, 64, PineV4Parser.RULE_or_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 306;
            this.and_expr();
            this.state = 311;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 27) {
                {
                {
                this.state = 307;
                this.match(PineV4Parser.OR);
                this.state = 308;
                this.and_expr();
                }
                }
                this.state = 313;
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
        this.enterRule(localContext, 66, PineV4Parser.RULE_and_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 314;
            this.eq_expr();
            this.state = 319;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 28) {
                {
                {
                this.state = 315;
                this.match(PineV4Parser.AND);
                this.state = 316;
                this.eq_expr();
                }
                }
                this.state = 321;
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
        this.enterRule(localContext, 68, PineV4Parser.RULE_eq_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 322;
            this.cmp_expr();
            this.state = 327;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 33 || _la === 34) {
                {
                {
                this.state = 323;
                _la = this.tokenStream.LA(1);
                if(!(_la === 33 || _la === 34)) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                this.state = 324;
                this.cmp_expr();
                }
                }
                this.state = 329;
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
        this.enterRule(localContext, 70, PineV4Parser.RULE_cmp_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 330;
            this.add_expr();
            this.state = 335;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (((((_la - 35)) & ~0x1F) === 0 && ((1 << (_la - 35)) & 15) !== 0)) {
                {
                {
                this.state = 331;
                _la = this.tokenStream.LA(1);
                if(!(((((_la - 35)) & ~0x1F) === 0 && ((1 << (_la - 35)) & 15) !== 0))) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                this.state = 332;
                this.add_expr();
                }
                }
                this.state = 337;
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
        this.enterRule(localContext, 72, PineV4Parser.RULE_add_expr);
        let _la: number;
        try {
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 338;
            this.mult_expr();
            this.state = 343;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 31, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
                    {
                    {
                    this.state = 339;
                    _la = this.tokenStream.LA(1);
                    if(!(_la === 39 || _la === 40)) {
                    this.errorHandler.recoverInline(this);
                    }
                    else {
                        this.errorHandler.reportMatch(this);
                        this.consume();
                    }
                    this.state = 340;
                    this.mult_expr();
                    }
                    }
                }
                this.state = 345;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 31, this.context);
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
        this.enterRule(localContext, 74, PineV4Parser.RULE_mult_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 346;
            this.unary_expr();
            this.state = 351;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (((((_la - 41)) & ~0x1F) === 0 && ((1 << (_la - 41)) & 7) !== 0)) {
                {
                {
                this.state = 347;
                _la = this.tokenStream.LA(1);
                if(!(((((_la - 41)) & ~0x1F) === 0 && ((1 << (_la - 41)) & 7) !== 0))) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                this.state = 348;
                this.unary_expr();
                }
                }
                this.state = 353;
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
        this.enterRule(localContext, 76, PineV4Parser.RULE_unary_expr);
        try {
            this.state = 361;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV4Parser.SERIES:
            case PineV4Parser.SIMPLE:
            case PineV4Parser.CONST:
            case PineV4Parser.INT_TYPE:
            case PineV4Parser.FLOAT_TYPE:
            case PineV4Parser.BOOL_TYPE:
            case PineV4Parser.STRING_TYPE:
            case PineV4Parser.COLOR_TYPE:
            case PineV4Parser.LINE_TYPE:
            case PineV4Parser.LABEL_TYPE:
            case PineV4Parser.BOX_TYPE:
            case PineV4Parser.TABLE_TYPE:
            case PineV4Parser.BOOL_LITERAL:
            case PineV4Parser.LPAR:
            case PineV4Parser.INT_LITERAL:
            case PineV4Parser.FLOAT_LITERAL:
            case PineV4Parser.STR_LITERAL:
            case PineV4Parser.COLOR_LITERAL:
            case PineV4Parser.ID:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 354;
                this.sqbr_expr();
                }
                break;
            case PineV4Parser.NOT:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 355;
                this.match(PineV4Parser.NOT);
                this.state = 356;
                this.sqbr_expr();
                }
                break;
            case PineV4Parser.PLUS:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 357;
                this.match(PineV4Parser.PLUS);
                this.state = 358;
                this.sqbr_expr();
                }
                break;
            case PineV4Parser.MINUS:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 359;
                this.match(PineV4Parser.MINUS);
                this.state = 360;
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
        this.enterRule(localContext, 78, PineV4Parser.RULE_sqbr_expr);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 363;
            this.atom();
            this.state = 368;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 34, this.context) ) {
            case 1:
                {
                this.state = 364;
                this.match(PineV4Parser.LSQBR);
                this.state = 365;
                this.arith_expr();
                this.state = 366;
                this.match(PineV4Parser.RSQBR);
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
        this.enterRule(localContext, 80, PineV4Parser.RULE_atom);
        try {
            this.state = 377;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 35, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 370;
                this.fun_call();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 371;
                this.id();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 372;
                this.literal();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 373;
                this.match(PineV4Parser.LPAR);
                this.state = 374;
                this.arith_expr();
                this.state = 375;
                this.match(PineV4Parser.RPAR);
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
        this.enterRule(localContext, 82, PineV4Parser.RULE_fun_call);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 379;
            this.id();
            this.state = 380;
            this.match(PineV4Parser.LPAR);
            this.state = 382;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 1616117696) !== 0) || ((((_la - 39)) & ~0x1F) === 0 && ((1 << (_la - 39)) & 127235) !== 0)) {
                {
                this.state = 381;
                this.fun_actual_args();
                }
            }

            this.state = 384;
            this.match(PineV4Parser.RPAR);
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
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
        this.enterRule(localContext, 84, PineV4Parser.RULE_fun_actual_args);
        let _la: number;
        try {
            this.state = 392;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 38, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 386;
                this.kw_args();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 387;
                this.pos_args();
                this.state = 390;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 46) {
                    {
                    this.state = 388;
                    this.match(PineV4Parser.COMMA);
                    this.state = 389;
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
        this.enterRule(localContext, 86, PineV4Parser.RULE_pos_args);
        try {
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 394;
            this.arith_expr();
            this.state = 399;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 39, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
                    {
                    {
                    this.state = 395;
                    this.match(PineV4Parser.COMMA);
                    this.state = 396;
                    this.arith_expr();
                    }
                    }
                }
                this.state = 401;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 39, this.context);
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
        this.enterRule(localContext, 88, PineV4Parser.RULE_kw_args);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 402;
            this.kw_arg();
            this.state = 407;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 46) {
                {
                {
                this.state = 403;
                this.match(PineV4Parser.COMMA);
                this.state = 404;
                this.kw_arg();
                }
                }
                this.state = 409;
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
        this.enterRule(localContext, 90, PineV4Parser.RULE_kw_arg);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 410;
            this.id();
            this.state = 411;
            this.match(PineV4Parser.DEFINE);
            this.state = 414;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV4Parser.SERIES:
            case PineV4Parser.SIMPLE:
            case PineV4Parser.CONST:
            case PineV4Parser.INT_TYPE:
            case PineV4Parser.FLOAT_TYPE:
            case PineV4Parser.BOOL_TYPE:
            case PineV4Parser.STRING_TYPE:
            case PineV4Parser.COLOR_TYPE:
            case PineV4Parser.LINE_TYPE:
            case PineV4Parser.LABEL_TYPE:
            case PineV4Parser.BOX_TYPE:
            case PineV4Parser.TABLE_TYPE:
            case PineV4Parser.IF_COND:
            case PineV4Parser.FOR_STMT:
            case PineV4Parser.NOT:
            case PineV4Parser.BOOL_LITERAL:
            case PineV4Parser.PLUS:
            case PineV4Parser.MINUS:
            case PineV4Parser.LPAR:
            case PineV4Parser.INT_LITERAL:
            case PineV4Parser.FLOAT_LITERAL:
            case PineV4Parser.STR_LITERAL:
            case PineV4Parser.COLOR_LITERAL:
            case PineV4Parser.ID:
                {
                this.state = 412;
                this.arith_expr();
                }
                break;
            case PineV4Parser.LSQBR:
                {
                this.state = 413;
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
        this.enterRule(localContext, 92, PineV4Parser.RULE_literal);
        try {
            this.state = 418;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV4Parser.INT_LITERAL:
            case PineV4Parser.FLOAT_LITERAL:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 416;
                this.num_literal();
                }
                break;
            case PineV4Parser.BOOL_LITERAL:
            case PineV4Parser.STR_LITERAL:
            case PineV4Parser.COLOR_LITERAL:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 417;
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
        this.enterRule(localContext, 94, PineV4Parser.RULE_num_literal);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 420;
            _la = this.tokenStream.LA(1);
            if(!(_la === 51 || _la === 52)) {
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
        this.enterRule(localContext, 96, PineV4Parser.RULE_other_literal);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 422;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 30)) & ~0x1F) === 0 && ((1 << (_la - 30)) & 25165825) !== 0))) {
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
        4,1,59,425,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,2,6,7,
        6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,2,11,7,11,2,12,7,12,2,13,7,13,
        2,14,7,14,2,15,7,15,2,16,7,16,2,17,7,17,2,18,7,18,2,19,7,19,2,20,
        7,20,2,21,7,21,2,22,7,22,2,23,7,23,2,24,7,24,2,25,7,25,2,26,7,26,
        2,27,7,27,2,28,7,28,2,29,7,29,2,30,7,30,2,31,7,31,2,32,7,32,2,33,
        7,33,2,34,7,34,2,35,7,35,2,36,7,36,2,37,7,37,2,38,7,38,2,39,7,39,
        2,40,7,40,2,41,7,41,2,42,7,42,2,43,7,43,2,44,7,44,2,45,7,45,2,46,
        7,46,2,47,7,47,2,48,7,48,1,0,1,0,1,1,1,1,1,2,1,2,1,3,1,3,1,4,1,4,
        1,4,5,4,110,8,4,10,4,12,4,113,9,4,1,5,3,5,116,8,5,1,5,3,5,119,8,
        5,1,5,3,5,122,8,5,1,5,1,5,1,5,1,5,1,6,3,6,129,8,6,1,6,3,6,132,8,
        6,1,6,3,6,135,8,6,1,6,1,6,1,6,1,6,1,7,1,7,1,7,1,7,1,8,1,8,1,8,1,
        8,1,8,1,8,1,8,1,8,1,8,3,8,154,8,8,1,9,1,9,1,9,1,9,1,9,1,9,1,9,3,
        9,163,8,9,1,10,1,10,5,10,167,8,10,10,10,12,10,170,9,10,1,10,1,10,
        1,11,1,11,3,11,176,8,11,1,12,1,12,1,12,5,12,181,8,12,10,12,12,12,
        184,9,12,1,13,1,13,3,13,188,8,13,1,14,1,14,1,14,1,14,1,14,1,15,1,
        15,1,15,1,15,1,15,1,16,1,16,1,16,1,16,5,16,204,8,16,10,16,12,16,
        207,9,16,3,16,209,8,16,1,16,1,16,1,17,1,17,1,18,1,18,1,18,5,18,218,
        8,18,10,18,12,18,221,9,18,1,19,1,19,1,20,1,20,1,21,1,21,1,22,1,22,
        1,22,1,22,1,23,1,23,4,23,235,8,23,11,23,12,23,236,1,24,1,24,1,24,
        5,24,242,8,24,10,24,12,24,245,9,24,1,25,1,25,1,25,1,25,5,25,251,
        8,25,10,25,12,25,254,9,25,1,25,1,25,1,26,1,26,1,26,1,26,5,26,262,
        8,26,10,26,12,26,265,9,26,1,26,1,26,1,27,1,27,1,27,3,27,272,8,27,
        1,28,1,28,1,28,1,28,5,28,278,8,28,10,28,12,28,281,9,28,1,28,1,28,
        3,28,285,8,28,1,29,1,29,1,29,1,29,1,29,1,29,3,29,293,8,29,1,29,1,
        29,1,30,1,30,1,31,1,31,1,31,1,31,1,31,1,31,3,31,305,8,31,1,32,1,
        32,1,32,5,32,310,8,32,10,32,12,32,313,9,32,1,33,1,33,1,33,5,33,318,
        8,33,10,33,12,33,321,9,33,1,34,1,34,1,34,5,34,326,8,34,10,34,12,
        34,329,9,34,1,35,1,35,1,35,5,35,334,8,35,10,35,12,35,337,9,35,1,
        36,1,36,1,36,5,36,342,8,36,10,36,12,36,345,9,36,1,37,1,37,1,37,5,
        37,350,8,37,10,37,12,37,353,9,37,1,38,1,38,1,38,1,38,1,38,1,38,1,
        38,3,38,362,8,38,1,39,1,39,1,39,1,39,1,39,3,39,369,8,39,1,40,1,40,
        1,40,1,40,1,40,1,40,1,40,3,40,378,8,40,1,41,1,41,1,41,3,41,383,8,
        41,1,41,1,41,1,42,1,42,1,42,1,42,3,42,391,8,42,3,42,393,8,42,1,43,
        1,43,1,43,5,43,398,8,43,10,43,12,43,401,9,43,1,44,1,44,1,44,5,44,
        406,8,44,10,44,12,44,409,9,44,1,45,1,45,1,45,1,45,3,45,415,8,45,
        1,46,1,46,3,46,419,8,46,1,47,1,47,1,48,1,48,1,48,0,0,49,0,2,4,6,
        8,10,12,14,16,18,20,22,24,26,28,30,32,34,36,38,40,42,44,46,48,50,
        52,54,56,58,60,62,64,66,68,70,72,74,76,78,80,82,84,86,88,90,92,94,
        96,0,10,1,0,4,5,1,0,6,8,1,0,9,17,2,0,6,17,55,55,1,0,33,34,1,0,35,
        38,1,0,39,40,1,0,41,43,1,0,51,52,2,0,30,30,53,54,435,0,98,1,0,0,
        0,2,100,1,0,0,0,4,102,1,0,0,0,6,104,1,0,0,0,8,106,1,0,0,0,10,115,
        1,0,0,0,12,128,1,0,0,0,14,140,1,0,0,0,16,153,1,0,0,0,18,162,1,0,
        0,0,20,168,1,0,0,0,22,175,1,0,0,0,24,177,1,0,0,0,26,187,1,0,0,0,
        28,189,1,0,0,0,30,194,1,0,0,0,32,199,1,0,0,0,34,212,1,0,0,0,36,214,
        1,0,0,0,38,222,1,0,0,0,40,224,1,0,0,0,42,226,1,0,0,0,44,228,1,0,
        0,0,46,234,1,0,0,0,48,238,1,0,0,0,50,246,1,0,0,0,52,257,1,0,0,0,
        54,271,1,0,0,0,56,273,1,0,0,0,58,286,1,0,0,0,60,296,1,0,0,0,62,298,
        1,0,0,0,64,306,1,0,0,0,66,314,1,0,0,0,68,322,1,0,0,0,70,330,1,0,
        0,0,72,338,1,0,0,0,74,346,1,0,0,0,76,361,1,0,0,0,78,363,1,0,0,0,
        80,377,1,0,0,0,82,379,1,0,0,0,84,392,1,0,0,0,86,394,1,0,0,0,88,402,
        1,0,0,0,90,410,1,0,0,0,92,418,1,0,0,0,94,420,1,0,0,0,96,422,1,0,
        0,0,98,99,7,0,0,0,99,1,1,0,0,0,100,101,7,1,0,0,101,3,1,0,0,0,102,
        103,7,2,0,0,103,5,1,0,0,0,104,105,7,3,0,0,105,7,1,0,0,0,106,111,
        3,6,3,0,107,108,5,59,0,0,108,110,3,6,3,0,109,107,1,0,0,0,110,113,
        1,0,0,0,111,109,1,0,0,0,111,112,1,0,0,0,112,9,1,0,0,0,113,111,1,
        0,0,0,114,116,3,0,0,0,115,114,1,0,0,0,115,116,1,0,0,0,116,118,1,
        0,0,0,117,119,3,2,1,0,118,117,1,0,0,0,118,119,1,0,0,0,119,121,1,
        0,0,0,120,122,3,4,2,0,121,120,1,0,0,0,121,122,1,0,0,0,122,123,1,
        0,0,0,123,124,3,8,4,0,124,125,5,44,0,0,125,126,3,54,27,0,126,11,
        1,0,0,0,127,129,3,0,0,0,128,127,1,0,0,0,128,129,1,0,0,0,129,131,
        1,0,0,0,130,132,3,2,1,0,131,130,1,0,0,0,131,132,1,0,0,0,132,134,
        1,0,0,0,133,135,3,4,2,0,134,133,1,0,0,0,134,135,1,0,0,0,135,136,
        1,0,0,0,136,137,3,50,25,0,137,138,5,44,0,0,138,139,3,54,27,0,139,
        13,1,0,0,0,140,141,3,8,4,0,141,142,5,18,0,0,142,143,3,54,27,0,143,
        15,1,0,0,0,144,154,3,10,5,0,145,154,3,12,6,0,146,154,3,82,41,0,147,
        154,3,56,28,0,148,154,3,14,7,0,149,154,3,58,29,0,150,154,3,38,19,
        0,151,154,3,40,20,0,152,154,3,54,27,0,153,144,1,0,0,0,153,145,1,
        0,0,0,153,146,1,0,0,0,153,147,1,0,0,0,153,148,1,0,0,0,153,149,1,
        0,0,0,153,150,1,0,0,0,153,151,1,0,0,0,153,152,1,0,0,0,154,17,1,0,
        0,0,155,163,3,10,5,0,156,163,3,12,6,0,157,163,3,54,27,0,158,163,
        3,52,26,0,159,163,3,14,7,0,160,163,3,38,19,0,161,163,3,40,20,0,162,
        155,1,0,0,0,162,156,1,0,0,0,162,157,1,0,0,0,162,158,1,0,0,0,162,
        159,1,0,0,0,162,160,1,0,0,0,162,161,1,0,0,0,163,19,1,0,0,0,164,167,
        3,22,11,0,165,167,5,3,0,0,166,164,1,0,0,0,166,165,1,0,0,0,167,170,
        1,0,0,0,168,166,1,0,0,0,168,169,1,0,0,0,169,171,1,0,0,0,170,168,
        1,0,0,0,171,172,5,0,0,1,172,21,1,0,0,0,173,176,3,26,13,0,174,176,
        3,24,12,0,175,173,1,0,0,0,175,174,1,0,0,0,176,23,1,0,0,0,177,182,
        3,16,8,0,178,179,5,46,0,0,179,181,3,16,8,0,180,178,1,0,0,0,181,184,
        1,0,0,0,182,180,1,0,0,0,182,183,1,0,0,0,183,25,1,0,0,0,184,182,1,
        0,0,0,185,188,3,28,14,0,186,188,3,30,15,0,187,185,1,0,0,0,187,186,
        1,0,0,0,188,27,1,0,0,0,189,190,3,8,4,0,190,191,3,32,16,0,191,192,
        5,45,0,0,192,193,3,34,17,0,193,29,1,0,0,0,194,195,3,8,4,0,195,196,
        3,32,16,0,196,197,5,45,0,0,197,198,3,42,21,0,198,31,1,0,0,0,199,
        208,5,47,0,0,200,205,3,8,4,0,201,202,5,46,0,0,202,204,3,8,4,0,203,
        201,1,0,0,0,204,207,1,0,0,0,205,203,1,0,0,0,205,206,1,0,0,0,206,
        209,1,0,0,0,207,205,1,0,0,0,208,200,1,0,0,0,208,209,1,0,0,0,209,
        210,1,0,0,0,210,211,5,48,0,0,211,33,1,0,0,0,212,213,3,36,18,0,213,
        35,1,0,0,0,214,219,3,18,9,0,215,216,5,46,0,0,216,218,3,18,9,0,217,
        215,1,0,0,0,218,221,1,0,0,0,219,217,1,0,0,0,219,220,1,0,0,0,220,
        37,1,0,0,0,221,219,1,0,0,0,222,223,5,25,0,0,223,39,1,0,0,0,224,225,
        5,26,0,0,225,41,1,0,0,0,226,227,3,44,22,0,227,43,1,0,0,0,228,229,
        5,1,0,0,229,230,3,46,23,0,230,231,5,2,0,0,231,45,1,0,0,0,232,235,
        3,48,24,0,233,235,5,3,0,0,234,232,1,0,0,0,234,233,1,0,0,0,235,236,
        1,0,0,0,236,234,1,0,0,0,236,237,1,0,0,0,237,47,1,0,0,0,238,243,3,
        18,9,0,239,240,5,46,0,0,240,242,3,18,9,0,241,239,1,0,0,0,242,245,
        1,0,0,0,243,241,1,0,0,0,243,244,1,0,0,0,244,49,1,0,0,0,245,243,1,
        0,0,0,246,247,5,49,0,0,247,252,3,8,4,0,248,249,5,46,0,0,249,251,
        3,8,4,0,250,248,1,0,0,0,251,254,1,0,0,0,252,250,1,0,0,0,252,253,
        1,0,0,0,253,255,1,0,0,0,254,252,1,0,0,0,255,256,5,50,0,0,256,51,
        1,0,0,0,257,258,5,49,0,0,258,263,3,54,27,0,259,260,5,46,0,0,260,
        262,3,54,27,0,261,259,1,0,0,0,262,265,1,0,0,0,263,261,1,0,0,0,263,
        264,1,0,0,0,264,266,1,0,0,0,265,263,1,0,0,0,266,267,5,50,0,0,267,
        53,1,0,0,0,268,272,3,62,31,0,269,272,3,56,28,0,270,272,3,58,29,0,
        271,268,1,0,0,0,271,269,1,0,0,0,271,270,1,0,0,0,272,55,1,0,0,0,273,
        274,5,20,0,0,274,275,3,62,31,0,275,284,3,60,30,0,276,278,5,3,0,0,
        277,276,1,0,0,0,278,281,1,0,0,0,279,277,1,0,0,0,279,280,1,0,0,0,
        280,282,1,0,0,0,281,279,1,0,0,0,282,283,5,21,0,0,283,285,3,60,30,
        0,284,279,1,0,0,0,284,285,1,0,0,0,285,57,1,0,0,0,286,287,5,22,0,
        0,287,288,3,10,5,0,288,289,5,23,0,0,289,292,3,62,31,0,290,291,5,
        24,0,0,291,293,3,62,31,0,292,290,1,0,0,0,292,293,1,0,0,0,293,294,
        1,0,0,0,294,295,3,60,30,0,295,59,1,0,0,0,296,297,3,42,21,0,297,61,
        1,0,0,0,298,304,3,64,32,0,299,300,5,31,0,0,300,301,3,62,31,0,301,
        302,5,32,0,0,302,303,3,62,31,0,303,305,1,0,0,0,304,299,1,0,0,0,304,
        305,1,0,0,0,305,63,1,0,0,0,306,311,3,66,33,0,307,308,5,27,0,0,308,
        310,3,66,33,0,309,307,1,0,0,0,310,313,1,0,0,0,311,309,1,0,0,0,311,
        312,1,0,0,0,312,65,1,0,0,0,313,311,1,0,0,0,314,319,3,68,34,0,315,
        316,5,28,0,0,316,318,3,68,34,0,317,315,1,0,0,0,318,321,1,0,0,0,319,
        317,1,0,0,0,319,320,1,0,0,0,320,67,1,0,0,0,321,319,1,0,0,0,322,327,
        3,70,35,0,323,324,7,4,0,0,324,326,3,70,35,0,325,323,1,0,0,0,326,
        329,1,0,0,0,327,325,1,0,0,0,327,328,1,0,0,0,328,69,1,0,0,0,329,327,
        1,0,0,0,330,335,3,72,36,0,331,332,7,5,0,0,332,334,3,72,36,0,333,
        331,1,0,0,0,334,337,1,0,0,0,335,333,1,0,0,0,335,336,1,0,0,0,336,
        71,1,0,0,0,337,335,1,0,0,0,338,343,3,74,37,0,339,340,7,6,0,0,340,
        342,3,74,37,0,341,339,1,0,0,0,342,345,1,0,0,0,343,341,1,0,0,0,343,
        344,1,0,0,0,344,73,1,0,0,0,345,343,1,0,0,0,346,351,3,76,38,0,347,
        348,7,7,0,0,348,350,3,76,38,0,349,347,1,0,0,0,350,353,1,0,0,0,351,
        349,1,0,0,0,351,352,1,0,0,0,352,75,1,0,0,0,353,351,1,0,0,0,354,362,
        3,78,39,0,355,356,5,29,0,0,356,362,3,78,39,0,357,358,5,39,0,0,358,
        362,3,78,39,0,359,360,5,40,0,0,360,362,3,78,39,0,361,354,1,0,0,0,
        361,355,1,0,0,0,361,357,1,0,0,0,361,359,1,0,0,0,362,77,1,0,0,0,363,
        368,3,80,40,0,364,365,5,49,0,0,365,366,3,54,27,0,366,367,5,50,0,
        0,367,369,1,0,0,0,368,364,1,0,0,0,368,369,1,0,0,0,369,79,1,0,0,0,
        370,378,3,82,41,0,371,378,3,8,4,0,372,378,3,92,46,0,373,374,5,47,
        0,0,374,375,3,54,27,0,375,376,5,48,0,0,376,378,1,0,0,0,377,370,1,
        0,0,0,377,371,1,0,0,0,377,372,1,0,0,0,377,373,1,0,0,0,378,81,1,0,
        0,0,379,380,3,8,4,0,380,382,5,47,0,0,381,383,3,84,42,0,382,381,1,
        0,0,0,382,383,1,0,0,0,383,384,1,0,0,0,384,385,5,48,0,0,385,83,1,
        0,0,0,386,393,3,88,44,0,387,390,3,86,43,0,388,389,5,46,0,0,389,391,
        3,88,44,0,390,388,1,0,0,0,390,391,1,0,0,0,391,393,1,0,0,0,392,386,
        1,0,0,0,392,387,1,0,0,0,393,85,1,0,0,0,394,399,3,54,27,0,395,396,
        5,46,0,0,396,398,3,54,27,0,397,395,1,0,0,0,398,401,1,0,0,0,399,397,
        1,0,0,0,399,400,1,0,0,0,400,87,1,0,0,0,401,399,1,0,0,0,402,407,3,
        90,45,0,403,404,5,46,0,0,404,406,3,90,45,0,405,403,1,0,0,0,406,409,
        1,0,0,0,407,405,1,0,0,0,407,408,1,0,0,0,408,89,1,0,0,0,409,407,1,
        0,0,0,410,411,3,8,4,0,411,414,5,44,0,0,412,415,3,54,27,0,413,415,
        3,52,26,0,414,412,1,0,0,0,414,413,1,0,0,0,415,91,1,0,0,0,416,419,
        3,94,47,0,417,419,3,96,48,0,418,416,1,0,0,0,418,417,1,0,0,0,419,
        93,1,0,0,0,420,421,7,8,0,0,421,95,1,0,0,0,422,423,7,9,0,0,423,97,
        1,0,0,0,43,111,115,118,121,128,131,134,153,162,166,168,175,182,187,
        205,208,219,234,236,243,252,263,271,279,284,292,304,311,319,327,
        335,343,351,361,368,377,382,390,392,399,407,414,418
    ];

    private static __ATN: antlr.ATN;
    public static get _ATN(): antlr.ATN {
        if (!PineV4Parser.__ATN) {
            PineV4Parser.__ATN = new antlr.ATNDeserializer().deserialize(PineV4Parser._serializedATN);
        }

        return PineV4Parser.__ATN;
    }


    private static readonly vocabulary = new antlr.Vocabulary(PineV4Parser.literalNames, PineV4Parser.symbolicNames, []);

    public override get vocabulary(): antlr.Vocabulary {
        return PineV4Parser.vocabulary;
    }

    private static readonly decisionsToDFA = PineV4Parser._ATN.decisionToState.map( (ds: antlr.DecisionState, index: number) => new antlr.DFA(ds, index) );
}

export class Decl_modContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public VAR(): antlr.TerminalNode | null {
        return this.getToken(PineV4Parser.VAR, 0);
    }
    public VARIP(): antlr.TerminalNode | null {
        return this.getToken(PineV4Parser.VARIP, 0);
    }
    public override get ruleIndex(): number {
        return PineV4Parser.RULE_decl_mod;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV4Parser.SERIES, 0);
    }
    public SIMPLE(): antlr.TerminalNode | null {
        return this.getToken(PineV4Parser.SIMPLE, 0);
    }
    public CONST(): antlr.TerminalNode | null {
        return this.getToken(PineV4Parser.CONST, 0);
    }
    public override get ruleIndex(): number {
        return PineV4Parser.RULE_type_qual;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV4Parser.INT_TYPE, 0);
    }
    public FLOAT_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV4Parser.FLOAT_TYPE, 0);
    }
    public BOOL_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV4Parser.BOOL_TYPE, 0);
    }
    public STRING_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV4Parser.STRING_TYPE, 0);
    }
    public COLOR_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV4Parser.COLOR_TYPE, 0);
    }
    public LINE_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV4Parser.LINE_TYPE, 0);
    }
    public LABEL_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV4Parser.LABEL_TYPE, 0);
    }
    public BOX_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV4Parser.BOX_TYPE, 0);
    }
    public TABLE_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV4Parser.TABLE_TYPE, 0);
    }
    public override get ruleIndex(): number {
        return PineV4Parser.RULE_type_name;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
        if (visitor.visitType_name) {
            return visitor.visitType_name(this);
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
        return this.getToken(PineV4Parser.ID, 0);
    }
    public SERIES(): antlr.TerminalNode | null {
        return this.getToken(PineV4Parser.SERIES, 0);
    }
    public SIMPLE(): antlr.TerminalNode | null {
        return this.getToken(PineV4Parser.SIMPLE, 0);
    }
    public CONST(): antlr.TerminalNode | null {
        return this.getToken(PineV4Parser.CONST, 0);
    }
    public INT_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV4Parser.INT_TYPE, 0);
    }
    public FLOAT_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV4Parser.FLOAT_TYPE, 0);
    }
    public BOOL_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV4Parser.BOOL_TYPE, 0);
    }
    public STRING_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV4Parser.STRING_TYPE, 0);
    }
    public COLOR_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV4Parser.COLOR_TYPE, 0);
    }
    public LINE_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV4Parser.LINE_TYPE, 0);
    }
    public LABEL_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV4Parser.LABEL_TYPE, 0);
    }
    public BOX_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV4Parser.BOX_TYPE, 0);
    }
    public TABLE_TYPE(): antlr.TerminalNode | null {
        return this.getToken(PineV4Parser.TABLE_TYPE, 0);
    }
    public override get ruleIndex(): number {
        return PineV4Parser.RULE_id_part;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
        if (visitor.visitId_part) {
            return visitor.visitId_part(this);
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
    		return this.getTokens(PineV4Parser.DOT);
    	} else {
    		return this.getToken(PineV4Parser.DOT, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV4Parser.RULE_id;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
        if (visitor.visitId) {
            return visitor.visitId(this);
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
        return this.getToken(PineV4Parser.DEFINE, 0)!;
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
    public type_name(): Type_nameContext | null {
        return this.getRuleContext(0, Type_nameContext);
    }
    public override get ruleIndex(): number {
        return PineV4Parser.RULE_var_def;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV4Parser.DEFINE, 0)!;
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
    public type_name(): Type_nameContext | null {
        return this.getRuleContext(0, Type_nameContext);
    }
    public override get ruleIndex(): number {
        return PineV4Parser.RULE_var_defs;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
        if (visitor.visitVar_defs) {
            return visitor.visitVar_defs(this);
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
        return this.getToken(PineV4Parser.ASSIGN, 0)!;
    }
    public arith_expr(): Arith_exprContext {
        return this.getRuleContext(0, Arith_exprContext)!;
    }
    public override get ruleIndex(): number {
        return PineV4Parser.RULE_var_assign;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
        if (visitor.visitVar_assign) {
            return visitor.visitVar_assign(this);
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
        return PineV4Parser.RULE_global_stmt_content;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
    public loop_break(): Loop_breakContext | null {
        return this.getRuleContext(0, Loop_breakContext);
    }
    public loop_continue(): Loop_continueContext | null {
        return this.getRuleContext(0, Loop_continueContext);
    }
    public override get ruleIndex(): number {
        return PineV4Parser.RULE_local_stmt_content;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
        if (visitor.visitLocal_stmt_content) {
            return visitor.visitLocal_stmt_content(this);
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
        return this.getToken(PineV4Parser.EOF, 0)!;
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
    		return this.getTokens(PineV4Parser.LEND);
    	} else {
    		return this.getToken(PineV4Parser.LEND, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV4Parser.RULE_pine_script;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
        return PineV4Parser.RULE_stmt;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
    		return this.getTokens(PineV4Parser.COMMA);
    	} else {
    		return this.getToken(PineV4Parser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV4Parser.RULE_global_stmt;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
        return PineV4Parser.RULE_fun_def_stmt;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV4Parser.ARROW, 0)!;
    }
    public fun_body_singleline(): Fun_body_singlelineContext {
        return this.getRuleContext(0, Fun_body_singlelineContext)!;
    }
    public override get ruleIndex(): number {
        return PineV4Parser.RULE_fun_def_singleline;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV4Parser.ARROW, 0)!;
    }
    public fun_body_multiline(): Fun_body_multilineContext {
        return this.getRuleContext(0, Fun_body_multilineContext)!;
    }
    public override get ruleIndex(): number {
        return PineV4Parser.RULE_fun_def_multiline;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV4Parser.LPAR, 0)!;
    }
    public RPAR(): antlr.TerminalNode {
        return this.getToken(PineV4Parser.RPAR, 0)!;
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
    		return this.getTokens(PineV4Parser.COMMA);
    	} else {
    		return this.getToken(PineV4Parser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV4Parser.RULE_fun_head;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
        return PineV4Parser.RULE_fun_body_singleline;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
    		return this.getTokens(PineV4Parser.COMMA);
    	} else {
    		return this.getToken(PineV4Parser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV4Parser.RULE_local_stmt_singleline;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV4Parser.BREAK, 0)!;
    }
    public override get ruleIndex(): number {
        return PineV4Parser.RULE_loop_break;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV4Parser.CONTINUE, 0)!;
    }
    public override get ruleIndex(): number {
        return PineV4Parser.RULE_loop_continue;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
        return PineV4Parser.RULE_fun_body_multiline;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV4Parser.BEGIN, 0)!;
    }
    public local_stmts_list(): Local_stmts_listContext {
        return this.getRuleContext(0, Local_stmts_listContext)!;
    }
    public END(): antlr.TerminalNode {
        return this.getToken(PineV4Parser.END, 0)!;
    }
    public override get ruleIndex(): number {
        return PineV4Parser.RULE_local_stmts_multiline;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
    		return this.getTokens(PineV4Parser.LEND);
    	} else {
    		return this.getToken(PineV4Parser.LEND, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV4Parser.RULE_local_stmts_list;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
    		return this.getTokens(PineV4Parser.COMMA);
    	} else {
    		return this.getToken(PineV4Parser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV4Parser.RULE_local_stmt_multiline;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV4Parser.LSQBR, 0)!;
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
        return this.getToken(PineV4Parser.RSQBR, 0)!;
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV4Parser.COMMA);
    	} else {
    		return this.getToken(PineV4Parser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV4Parser.RULE_ids_array;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV4Parser.LSQBR, 0)!;
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
        return this.getToken(PineV4Parser.RSQBR, 0)!;
    }
    public COMMA(): antlr.TerminalNode[];
    public COMMA(i: number): antlr.TerminalNode | null;
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV4Parser.COMMA);
    	} else {
    		return this.getToken(PineV4Parser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV4Parser.RULE_arith_exprs;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
        return PineV4Parser.RULE_arith_expr;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV4Parser.IF_COND, 0)!;
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
        return this.getToken(PineV4Parser.IF_COND_ELSE, 0);
    }
    public LEND(): antlr.TerminalNode[];
    public LEND(i: number): antlr.TerminalNode | null;
    public LEND(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV4Parser.LEND);
    	} else {
    		return this.getToken(PineV4Parser.LEND, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV4Parser.RULE_if_expr;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV4Parser.FOR_STMT, 0)!;
    }
    public var_def(): Var_defContext {
        return this.getRuleContext(0, Var_defContext)!;
    }
    public FOR_STMT_TO(): antlr.TerminalNode {
        return this.getToken(PineV4Parser.FOR_STMT_TO, 0)!;
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
        return this.getToken(PineV4Parser.FOR_STMT_BY, 0);
    }
    public override get ruleIndex(): number {
        return PineV4Parser.RULE_for_expr;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
        return PineV4Parser.RULE_stmts_block;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV4Parser.COND, 0);
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
        return this.getToken(PineV4Parser.COND_ELSE, 0);
    }
    public override get ruleIndex(): number {
        return PineV4Parser.RULE_ternary_expr;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
    		return this.getTokens(PineV4Parser.OR);
    	} else {
    		return this.getToken(PineV4Parser.OR, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV4Parser.RULE_or_expr;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
    		return this.getTokens(PineV4Parser.AND);
    	} else {
    		return this.getToken(PineV4Parser.AND, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV4Parser.RULE_and_expr;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
    		return this.getTokens(PineV4Parser.EQ);
    	} else {
    		return this.getToken(PineV4Parser.EQ, i);
    	}
    }
    public NEQ(): antlr.TerminalNode[];
    public NEQ(i: number): antlr.TerminalNode | null;
    public NEQ(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV4Parser.NEQ);
    	} else {
    		return this.getToken(PineV4Parser.NEQ, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV4Parser.RULE_eq_expr;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
    		return this.getTokens(PineV4Parser.GT);
    	} else {
    		return this.getToken(PineV4Parser.GT, i);
    	}
    }
    public GE(): antlr.TerminalNode[];
    public GE(i: number): antlr.TerminalNode | null;
    public GE(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV4Parser.GE);
    	} else {
    		return this.getToken(PineV4Parser.GE, i);
    	}
    }
    public LT(): antlr.TerminalNode[];
    public LT(i: number): antlr.TerminalNode | null;
    public LT(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV4Parser.LT);
    	} else {
    		return this.getToken(PineV4Parser.LT, i);
    	}
    }
    public LE(): antlr.TerminalNode[];
    public LE(i: number): antlr.TerminalNode | null;
    public LE(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV4Parser.LE);
    	} else {
    		return this.getToken(PineV4Parser.LE, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV4Parser.RULE_cmp_expr;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
    		return this.getTokens(PineV4Parser.PLUS);
    	} else {
    		return this.getToken(PineV4Parser.PLUS, i);
    	}
    }
    public MINUS(): antlr.TerminalNode[];
    public MINUS(i: number): antlr.TerminalNode | null;
    public MINUS(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV4Parser.MINUS);
    	} else {
    		return this.getToken(PineV4Parser.MINUS, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV4Parser.RULE_add_expr;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
    		return this.getTokens(PineV4Parser.MUL);
    	} else {
    		return this.getToken(PineV4Parser.MUL, i);
    	}
    }
    public DIV(): antlr.TerminalNode[];
    public DIV(i: number): antlr.TerminalNode | null;
    public DIV(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV4Parser.DIV);
    	} else {
    		return this.getToken(PineV4Parser.DIV, i);
    	}
    }
    public MOD(): antlr.TerminalNode[];
    public MOD(i: number): antlr.TerminalNode | null;
    public MOD(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
    	if (i === undefined) {
    		return this.getTokens(PineV4Parser.MOD);
    	} else {
    		return this.getToken(PineV4Parser.MOD, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV4Parser.RULE_mult_expr;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV4Parser.NOT, 0);
    }
    public PLUS(): antlr.TerminalNode | null {
        return this.getToken(PineV4Parser.PLUS, 0);
    }
    public MINUS(): antlr.TerminalNode | null {
        return this.getToken(PineV4Parser.MINUS, 0);
    }
    public override get ruleIndex(): number {
        return PineV4Parser.RULE_unary_expr;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV4Parser.LSQBR, 0);
    }
    public arith_expr(): Arith_exprContext | null {
        return this.getRuleContext(0, Arith_exprContext);
    }
    public RSQBR(): antlr.TerminalNode | null {
        return this.getToken(PineV4Parser.RSQBR, 0);
    }
    public override get ruleIndex(): number {
        return PineV4Parser.RULE_sqbr_expr;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV4Parser.LPAR, 0);
    }
    public arith_expr(): Arith_exprContext | null {
        return this.getRuleContext(0, Arith_exprContext);
    }
    public RPAR(): antlr.TerminalNode | null {
        return this.getToken(PineV4Parser.RPAR, 0);
    }
    public override get ruleIndex(): number {
        return PineV4Parser.RULE_atom;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV4Parser.LPAR, 0)!;
    }
    public RPAR(): antlr.TerminalNode {
        return this.getToken(PineV4Parser.RPAR, 0)!;
    }
    public fun_actual_args(): Fun_actual_argsContext | null {
        return this.getRuleContext(0, Fun_actual_argsContext);
    }
    public override get ruleIndex(): number {
        return PineV4Parser.RULE_fun_call;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV4Parser.COMMA, 0);
    }
    public override get ruleIndex(): number {
        return PineV4Parser.RULE_fun_actual_args;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
    		return this.getTokens(PineV4Parser.COMMA);
    	} else {
    		return this.getToken(PineV4Parser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV4Parser.RULE_pos_args;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
    		return this.getTokens(PineV4Parser.COMMA);
    	} else {
    		return this.getToken(PineV4Parser.COMMA, i);
    	}
    }
    public override get ruleIndex(): number {
        return PineV4Parser.RULE_kw_args;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV4Parser.DEFINE, 0)!;
    }
    public arith_expr(): Arith_exprContext | null {
        return this.getRuleContext(0, Arith_exprContext);
    }
    public arith_exprs(): Arith_exprsContext | null {
        return this.getRuleContext(0, Arith_exprsContext);
    }
    public override get ruleIndex(): number {
        return PineV4Parser.RULE_kw_arg;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
        return PineV4Parser.RULE_literal;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV4Parser.INT_LITERAL, 0);
    }
    public FLOAT_LITERAL(): antlr.TerminalNode | null {
        return this.getToken(PineV4Parser.FLOAT_LITERAL, 0);
    }
    public override get ruleIndex(): number {
        return PineV4Parser.RULE_num_literal;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV4Parser.STR_LITERAL, 0);
    }
    public BOOL_LITERAL(): antlr.TerminalNode | null {
        return this.getToken(PineV4Parser.BOOL_LITERAL, 0);
    }
    public COLOR_LITERAL(): antlr.TerminalNode | null {
        return this.getToken(PineV4Parser.COLOR_LITERAL, 0);
    }
    public override get ruleIndex(): number {
        return PineV4Parser.RULE_other_literal;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
        if (visitor.visitOther_literal) {
            return visitor.visitOther_literal(this);
        } else {
            return visitor.visitChildren(this);
        }
    }
}
