
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
    public static readonly PLUS_ASSIGN = 18;
    public static readonly MINUS_ASSIGN = 19;
    public static readonly MUL_ASSIGN = 20;
    public static readonly DIV_ASSIGN = 21;
    public static readonly MOD_ASSIGN = 22;
    public static readonly ASSIGN = 23;
    public static readonly LBEG = 24;
    public static readonly IF_COND = 25;
    public static readonly IF_COND_ELSE = 26;
    public static readonly FOR_STMT = 27;
    public static readonly FOR_STMT_TO = 28;
    public static readonly FOR_STMT_BY = 29;
    public static readonly BREAK = 30;
    public static readonly CONTINUE = 31;
    public static readonly OR = 32;
    public static readonly AND = 33;
    public static readonly NOT = 34;
    public static readonly BOOL_LITERAL = 35;
    public static readonly COND = 36;
    public static readonly COND_ELSE = 37;
    public static readonly EQ = 38;
    public static readonly NEQ = 39;
    public static readonly GT = 40;
    public static readonly GE = 41;
    public static readonly LT = 42;
    public static readonly LE = 43;
    public static readonly PLUS = 44;
    public static readonly MINUS = 45;
    public static readonly MUL = 46;
    public static readonly DIV = 47;
    public static readonly MOD = 48;
    public static readonly DEFINE = 49;
    public static readonly ARROW = 50;
    public static readonly COMMA = 51;
    public static readonly LPAR = 52;
    public static readonly RPAR = 53;
    public static readonly LSQBR = 54;
    public static readonly RSQBR = 55;
    public static readonly INT_LITERAL = 56;
    public static readonly FLOAT_LITERAL = 57;
    public static readonly STR_LITERAL = 58;
    public static readonly COLOR_LITERAL = 59;
    public static readonly ID = 60;
    public static readonly WS = 61;
    public static readonly LINE_COMMENT = 62;
    public static readonly BLOCK_COMMENT = 63;
    public static readonly DOT = 64;
    public static readonly RULE_decl_mod = 0;
    public static readonly RULE_type_qual = 1;
    public static readonly RULE_type_name = 2;
    public static readonly RULE_id_part = 3;
    public static readonly RULE_id = 4;
    public static readonly RULE_var_def = 5;
    public static readonly RULE_var_defs = 6;
    public static readonly RULE_compound_assign_op = 7;
    public static readonly RULE_var_assign = 8;
    public static readonly RULE_if_expr = 9;
    public static readonly RULE_pos_arg = 10;
    public static readonly RULE_pos_args = 11;
    public static readonly RULE_global_stmt_content = 12;
    public static readonly RULE_local_stmt_content = 13;
    public static readonly RULE_pine_script = 14;
    public static readonly RULE_stmt = 15;
    public static readonly RULE_global_stmt = 16;
    public static readonly RULE_fun_def_stmt = 17;
    public static readonly RULE_fun_def_singleline = 18;
    public static readonly RULE_fun_def_multiline = 19;
    public static readonly RULE_fun_head = 20;
    public static readonly RULE_fun_body_singleline = 21;
    public static readonly RULE_local_stmt_singleline = 22;
    public static readonly RULE_loop_break = 23;
    public static readonly RULE_loop_continue = 24;
    public static readonly RULE_fun_body_multiline = 25;
    public static readonly RULE_local_stmts_multiline = 26;
    public static readonly RULE_local_stmts_list = 27;
    public static readonly RULE_local_stmt_multiline = 28;
    public static readonly RULE_ids_array = 29;
    public static readonly RULE_arith_exprs = 30;
    public static readonly RULE_arith_expr = 31;
    public static readonly RULE_for_expr = 32;
    public static readonly RULE_stmts_block = 33;
    public static readonly RULE_ternary_expr = 34;
    public static readonly RULE_or_expr = 35;
    public static readonly RULE_and_expr = 36;
    public static readonly RULE_eq_expr = 37;
    public static readonly RULE_cmp_expr = 38;
    public static readonly RULE_add_expr = 39;
    public static readonly RULE_mult_expr = 40;
    public static readonly RULE_unary_expr = 41;
    public static readonly RULE_sqbr_expr = 42;
    public static readonly RULE_atom = 43;
    public static readonly RULE_fun_call = 44;
    public static readonly RULE_fun_actual_args = 45;
    public static readonly RULE_kw_args = 46;
    public static readonly RULE_kw_arg = 47;
    public static readonly RULE_literal = 48;
    public static readonly RULE_num_literal = 49;
    public static readonly RULE_other_literal = 50;

    public static readonly literalNames = [
        null, null, null, null, "'var'", "'varip'", "'series'", "'simple'", 
        "'const'", "'int'", "'float'", "'bool'", "'string'", "'color'", 
        "'line'", "'label'", "'box'", "'table'", "'+='", "'-='", "'*='", 
        "'/='", "'%='", "':='", null, "'if'", "'else'", "'for'", "'to'", 
        "'by'", "'break'", "'continue'", "'or'", "'and'", "'not'", null, 
        "'?'", "':'", "'=='", "'!='", "'>'", "'>='", "'<'", "'<='", "'+'", 
        "'-'", "'*'", "'/'", "'%'", "'='", "'=>'", "','", "'('", "')'", 
        "'['", "']'", null, null, null, null, null, null, null, null, "'.'"
    ];

    public static readonly symbolicNames = [
        null, "BEGIN", "END", "LEND", "VAR", "VARIP", "SERIES", "SIMPLE", 
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
        "decl_mod", "type_qual", "type_name", "id_part", "id", "var_def", 
        "var_defs", "compound_assign_op", "var_assign", "if_expr", "pos_arg", 
        "pos_args", "global_stmt_content", "local_stmt_content", "pine_script", 
        "stmt", "global_stmt", "fun_def_stmt", "fun_def_singleline", "fun_def_multiline", 
        "fun_head", "fun_body_singleline", "local_stmt_singleline", "loop_break", 
        "loop_continue", "fun_body_multiline", "local_stmts_multiline", 
        "local_stmts_list", "local_stmt_multiline", "ids_array", "arith_exprs", 
        "arith_expr", "for_expr", "stmts_block", "ternary_expr", "or_expr", 
        "and_expr", "eq_expr", "cmp_expr", "add_expr", "mult_expr", "unary_expr", 
        "sqbr_expr", "atom", "fun_call", "fun_actual_args", "kw_args", "kw_arg", 
        "literal", "num_literal", "other_literal",
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
            this.state = 102;
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
            this.state = 104;
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
            this.state = 106;
            _la = this.tokenStream.LA(1);
            if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 261632) !== 0))) {
            this.errorHandler.recoverInline(this);
            }
            else {
                this.errorHandler.reportMatch(this);
                this.consume();
            }
            this.state = 109;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 0, this.context) ) {
            case 1:
                {
                this.state = 107;
                this.match(PineV4Parser.LSQBR);
                this.state = 108;
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
    public id_part(): Id_partContext {
        let localContext = new Id_partContext(this.context, this.state);
        this.enterRule(localContext, 6, PineV4Parser.RULE_id_part);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 111;
            _la = this.tokenStream.LA(1);
            if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 262080) !== 0) || _la === 60)) {
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
            this.state = 113;
            this.id_part();
            this.state = 118;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 64) {
                {
                {
                this.state = 114;
                this.match(PineV4Parser.DOT);
                this.state = 115;
                this.id_part();
                }
                }
                this.state = 120;
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
            this.state = 122;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 4 || _la === 5) {
                {
                this.state = 121;
                this.decl_mod();
                }
            }

            this.state = 125;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 3, this.context) ) {
            case 1:
                {
                this.state = 124;
                this.type_qual();
                }
                break;
            }
            this.state = 128;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 4, this.context) ) {
            case 1:
                {
                this.state = 127;
                this.type_name();
                }
                break;
            }
            this.state = 130;
            this.id();
            this.state = 131;
            this.match(PineV4Parser.DEFINE);
            this.state = 132;
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
            this.state = 135;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 4 || _la === 5) {
                {
                this.state = 134;
                this.decl_mod();
                }
            }

            this.state = 138;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 448) !== 0)) {
                {
                this.state = 137;
                this.type_qual();
                }
            }

            this.state = 141;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 261632) !== 0)) {
                {
                this.state = 140;
                this.type_name();
                }
            }

            this.state = 143;
            this.ids_array();
            this.state = 144;
            this.match(PineV4Parser.DEFINE);
            this.state = 145;
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
    public compound_assign_op(): Compound_assign_opContext {
        let localContext = new Compound_assign_opContext(this.context, this.state);
        this.enterRule(localContext, 14, PineV4Parser.RULE_compound_assign_op);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 147;
            _la = this.tokenStream.LA(1);
            if(!((((_la) & ~0x1F) === 0 && ((1 << _la) & 8126464) !== 0))) {
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
        this.enterRule(localContext, 16, PineV4Parser.RULE_var_assign);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 149;
            this.id();
            this.state = 152;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV4Parser.ASSIGN:
                {
                this.state = 150;
                this.match(PineV4Parser.ASSIGN);
                }
                break;
            case PineV4Parser.PLUS_ASSIGN:
            case PineV4Parser.MINUS_ASSIGN:
            case PineV4Parser.MUL_ASSIGN:
            case PineV4Parser.DIV_ASSIGN:
            case PineV4Parser.MOD_ASSIGN:
                {
                this.state = 151;
                this.compound_assign_op();
                }
                break;
            default:
                throw new antlr.NoViableAltException(this);
            }
            this.state = 154;
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
        this.enterRule(localContext, 18, PineV4Parser.RULE_if_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 156;
            this.match(PineV4Parser.IF_COND);
            this.state = 157;
            this.ternary_expr();
            this.state = 158;
            this.stmts_block();
            this.state = 170;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 11, this.context) ) {
            case 1:
                {
                this.state = 162;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 3) {
                    {
                    {
                    this.state = 159;
                    this.match(PineV4Parser.LEND);
                    }
                    }
                    this.state = 164;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                this.state = 165;
                this.match(PineV4Parser.IF_COND_ELSE);
                this.state = 168;
                this.errorHandler.sync(this);
                switch (this.tokenStream.LA(1)) {
                case PineV4Parser.IF_COND:
                    {
                    this.state = 166;
                    this.if_expr();
                    }
                    break;
                case PineV4Parser.BEGIN:
                    {
                    this.state = 167;
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
        this.enterRule(localContext, 20, PineV4Parser.RULE_pos_arg);
        try {
            this.state = 174;
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
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 172;
                this.arith_expr();
                }
                break;
            case PineV4Parser.LSQBR:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 173;
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
        this.enterRule(localContext, 22, PineV4Parser.RULE_pos_args);
        try {
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 176;
            this.pos_arg();
            this.state = 181;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 13, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
                    {
                    {
                    this.state = 177;
                    this.match(PineV4Parser.COMMA);
                    this.state = 178;
                    this.pos_arg();
                    }
                    }
                }
                this.state = 183;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 13, this.context);
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
        this.enterRule(localContext, 24, PineV4Parser.RULE_global_stmt_content);
        try {
            this.state = 193;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 14, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 184;
                this.var_def();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 185;
                this.var_defs();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 186;
                this.fun_call();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 187;
                this.if_expr();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 188;
                this.var_assign();
                }
                break;
            case 6:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 189;
                this.for_expr();
                }
                break;
            case 7:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 190;
                this.loop_break();
                }
                break;
            case 8:
                this.enterOuterAlt(localContext, 8);
                {
                this.state = 191;
                this.loop_continue();
                }
                break;
            case 9:
                this.enterOuterAlt(localContext, 9);
                {
                this.state = 192;
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
        this.enterRule(localContext, 26, PineV4Parser.RULE_local_stmt_content);
        try {
            this.state = 202;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 15, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 195;
                this.var_def();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 196;
                this.var_defs();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 197;
                this.arith_expr();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 198;
                this.arith_exprs();
                }
                break;
            case 5:
                this.enterOuterAlt(localContext, 5);
                {
                this.state = 199;
                this.var_assign();
                }
                break;
            case 6:
                this.enterOuterAlt(localContext, 6);
                {
                this.state = 200;
                this.loop_break();
                }
                break;
            case 7:
                this.enterOuterAlt(localContext, 7);
                {
                this.state = 201;
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
        this.enterRule(localContext, 28, PineV4Parser.RULE_pine_script);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 208;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 3389259768) !== 0) || ((((_la - 34)) & ~0x1F) === 0 && ((1 << (_la - 34)) & 131337219) !== 0)) {
                {
                this.state = 206;
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
                    this.state = 204;
                    this.stmt();
                    }
                    break;
                case PineV4Parser.LEND:
                    {
                    this.state = 205;
                    this.match(PineV4Parser.LEND);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                this.state = 210;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 211;
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
        this.enterRule(localContext, 30, PineV4Parser.RULE_stmt);
        try {
            this.state = 215;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 18, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 213;
                this.fun_def_stmt();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 214;
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
        this.enterRule(localContext, 32, PineV4Parser.RULE_global_stmt);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 217;
            this.global_stmt_content();
            this.state = 222;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 51) {
                {
                {
                this.state = 218;
                this.match(PineV4Parser.COMMA);
                this.state = 219;
                this.global_stmt_content();
                }
                }
                this.state = 224;
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
        this.enterRule(localContext, 34, PineV4Parser.RULE_fun_def_stmt);
        try {
            this.state = 227;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 20, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 225;
                this.fun_def_singleline();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 226;
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
        this.enterRule(localContext, 36, PineV4Parser.RULE_fun_def_singleline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 229;
            this.id();
            this.state = 230;
            this.fun_head();
            this.state = 231;
            this.match(PineV4Parser.ARROW);
            this.state = 232;
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
        this.enterRule(localContext, 38, PineV4Parser.RULE_fun_def_multiline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 234;
            this.id();
            this.state = 235;
            this.fun_head();
            this.state = 236;
            this.match(PineV4Parser.ARROW);
            this.state = 237;
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
        this.enterRule(localContext, 40, PineV4Parser.RULE_fun_head);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 239;
            this.match(PineV4Parser.LPAR);
            this.state = 248;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 262080) !== 0) || _la === 60) {
                {
                this.state = 240;
                this.id();
                this.state = 245;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                while (_la === 51) {
                    {
                    {
                    this.state = 241;
                    this.match(PineV4Parser.COMMA);
                    this.state = 242;
                    this.id();
                    }
                    }
                    this.state = 247;
                    this.errorHandler.sync(this);
                    _la = this.tokenStream.LA(1);
                }
                }
            }

            this.state = 250;
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
        this.enterRule(localContext, 42, PineV4Parser.RULE_fun_body_singleline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 252;
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
        this.enterRule(localContext, 44, PineV4Parser.RULE_local_stmt_singleline);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 254;
            this.local_stmt_content();
            this.state = 259;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 51) {
                {
                {
                this.state = 255;
                this.match(PineV4Parser.COMMA);
                this.state = 256;
                this.local_stmt_content();
                }
                }
                this.state = 261;
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
        this.enterRule(localContext, 46, PineV4Parser.RULE_loop_break);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 262;
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
        this.enterRule(localContext, 48, PineV4Parser.RULE_loop_continue);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 264;
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
        this.enterRule(localContext, 50, PineV4Parser.RULE_fun_body_multiline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 266;
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
        this.enterRule(localContext, 52, PineV4Parser.RULE_local_stmts_multiline);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 268;
            this.match(PineV4Parser.BEGIN);
            this.state = 269;
            this.local_stmts_list();
            this.state = 270;
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
        this.enterRule(localContext, 54, PineV4Parser.RULE_local_stmts_list);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 274;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            do {
                {
                this.state = 274;
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
                    this.state = 272;
                    this.local_stmt_multiline();
                    }
                    break;
                case PineV4Parser.LEND:
                    {
                    this.state = 273;
                    this.match(PineV4Parser.LEND);
                    }
                    break;
                default:
                    throw new antlr.NoViableAltException(this);
                }
                }
                this.state = 276;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            } while ((((_la) & ~0x1F) === 0 && ((1 << _la) & 3389259768) !== 0) || ((((_la - 34)) & ~0x1F) === 0 && ((1 << (_la - 34)) & 131337219) !== 0));
            }
        }
        catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re);
                this.errorHandler.recover(this, re);
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
        this.enterRule(localContext, 56, PineV4Parser.RULE_local_stmt_multiline);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 278;
            this.local_stmt_content();
            this.state = 283;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 51) {
                {
                {
                this.state = 279;
                this.match(PineV4Parser.COMMA);
                this.state = 280;
                this.local_stmt_content();
                }
                }
                this.state = 285;
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
        this.enterRule(localContext, 58, PineV4Parser.RULE_ids_array);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 286;
            this.match(PineV4Parser.LSQBR);
            this.state = 287;
            this.id();
            this.state = 292;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 51) {
                {
                {
                this.state = 288;
                this.match(PineV4Parser.COMMA);
                this.state = 289;
                this.id();
                }
                }
                this.state = 294;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 295;
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
        this.enterRule(localContext, 60, PineV4Parser.RULE_arith_exprs);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 297;
            this.match(PineV4Parser.LSQBR);
            this.state = 298;
            this.arith_expr();
            this.state = 303;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 51) {
                {
                {
                this.state = 299;
                this.match(PineV4Parser.COMMA);
                this.state = 300;
                this.arith_expr();
                }
                }
                this.state = 305;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
            }
            this.state = 306;
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
        this.enterRule(localContext, 62, PineV4Parser.RULE_arith_expr);
        try {
            this.state = 311;
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
                this.state = 308;
                this.ternary_expr();
                }
                break;
            case PineV4Parser.IF_COND:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 309;
                this.if_expr();
                }
                break;
            case PineV4Parser.FOR_STMT:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 310;
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
    public for_expr(): For_exprContext {
        let localContext = new For_exprContext(this.context, this.state);
        this.enterRule(localContext, 64, PineV4Parser.RULE_for_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 313;
            this.match(PineV4Parser.FOR_STMT);
            this.state = 314;
            this.var_def();
            this.state = 315;
            this.match(PineV4Parser.FOR_STMT_TO);
            this.state = 316;
            this.ternary_expr();
            this.state = 319;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 29) {
                {
                this.state = 317;
                this.match(PineV4Parser.FOR_STMT_BY);
                this.state = 318;
                this.ternary_expr();
                }
            }

            this.state = 321;
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
        this.enterRule(localContext, 66, PineV4Parser.RULE_stmts_block);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 323;
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
        this.enterRule(localContext, 68, PineV4Parser.RULE_ternary_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 325;
            this.or_expr();
            this.state = 331;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if (_la === 36) {
                {
                this.state = 326;
                this.match(PineV4Parser.COND);
                this.state = 327;
                this.ternary_expr();
                this.state = 328;
                this.match(PineV4Parser.COND_ELSE);
                this.state = 329;
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
        this.enterRule(localContext, 70, PineV4Parser.RULE_or_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 333;
            this.and_expr();
            this.state = 338;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 32) {
                {
                {
                this.state = 334;
                this.match(PineV4Parser.OR);
                this.state = 335;
                this.and_expr();
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
    public and_expr(): And_exprContext {
        let localContext = new And_exprContext(this.context, this.state);
        this.enterRule(localContext, 72, PineV4Parser.RULE_and_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 341;
            this.eq_expr();
            this.state = 346;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 33) {
                {
                {
                this.state = 342;
                this.match(PineV4Parser.AND);
                this.state = 343;
                this.eq_expr();
                }
                }
                this.state = 348;
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
        this.enterRule(localContext, 74, PineV4Parser.RULE_eq_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 349;
            this.cmp_expr();
            this.state = 354;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 38 || _la === 39) {
                {
                {
                this.state = 350;
                _la = this.tokenStream.LA(1);
                if(!(_la === 38 || _la === 39)) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                this.state = 351;
                this.cmp_expr();
                }
                }
                this.state = 356;
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
        this.enterRule(localContext, 76, PineV4Parser.RULE_cmp_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 357;
            this.add_expr();
            this.state = 362;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (((((_la - 40)) & ~0x1F) === 0 && ((1 << (_la - 40)) & 15) !== 0)) {
                {
                {
                this.state = 358;
                _la = this.tokenStream.LA(1);
                if(!(((((_la - 40)) & ~0x1F) === 0 && ((1 << (_la - 40)) & 15) !== 0))) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                this.state = 359;
                this.add_expr();
                }
                }
                this.state = 364;
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
        this.enterRule(localContext, 78, PineV4Parser.RULE_add_expr);
        let _la: number;
        try {
            let alternative: number;
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 365;
            this.mult_expr();
            this.state = 370;
            this.errorHandler.sync(this);
            alternative = this.interpreter.adaptivePredict(this.tokenStream, 36, this.context);
            while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                if (alternative === 1) {
                    {
                    {
                    this.state = 366;
                    _la = this.tokenStream.LA(1);
                    if(!(_la === 44 || _la === 45)) {
                    this.errorHandler.recoverInline(this);
                    }
                    else {
                        this.errorHandler.reportMatch(this);
                        this.consume();
                    }
                    this.state = 367;
                    this.mult_expr();
                    }
                    }
                }
                this.state = 372;
                this.errorHandler.sync(this);
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 36, this.context);
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
        this.enterRule(localContext, 80, PineV4Parser.RULE_mult_expr);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 373;
            this.unary_expr();
            this.state = 378;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (((((_la - 46)) & ~0x1F) === 0 && ((1 << (_la - 46)) & 7) !== 0)) {
                {
                {
                this.state = 374;
                _la = this.tokenStream.LA(1);
                if(!(((((_la - 46)) & ~0x1F) === 0 && ((1 << (_la - 46)) & 7) !== 0))) {
                this.errorHandler.recoverInline(this);
                }
                else {
                    this.errorHandler.reportMatch(this);
                    this.consume();
                }
                this.state = 375;
                this.unary_expr();
                }
                }
                this.state = 380;
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
        this.enterRule(localContext, 82, PineV4Parser.RULE_unary_expr);
        try {
            this.state = 388;
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
                this.state = 381;
                this.sqbr_expr();
                }
                break;
            case PineV4Parser.NOT:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 382;
                this.match(PineV4Parser.NOT);
                this.state = 383;
                this.sqbr_expr();
                }
                break;
            case PineV4Parser.PLUS:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 384;
                this.match(PineV4Parser.PLUS);
                this.state = 385;
                this.sqbr_expr();
                }
                break;
            case PineV4Parser.MINUS:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 386;
                this.match(PineV4Parser.MINUS);
                this.state = 387;
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
        this.enterRule(localContext, 84, PineV4Parser.RULE_sqbr_expr);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 390;
            this.atom();
            this.state = 395;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 39, this.context) ) {
            case 1:
                {
                this.state = 391;
                this.match(PineV4Parser.LSQBR);
                this.state = 392;
                this.arith_expr();
                this.state = 393;
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
        this.enterRule(localContext, 86, PineV4Parser.RULE_atom);
        try {
            this.state = 404;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 40, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 397;
                this.fun_call();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 398;
                this.id();
                }
                break;
            case 3:
                this.enterOuterAlt(localContext, 3);
                {
                this.state = 399;
                this.literal();
                }
                break;
            case 4:
                this.enterOuterAlt(localContext, 4);
                {
                this.state = 400;
                this.match(PineV4Parser.LPAR);
                this.state = 401;
                this.arith_expr();
                this.state = 402;
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
        this.enterRule(localContext, 88, PineV4Parser.RULE_fun_call);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 406;
            this.id();
            this.state = 407;
            this.match(PineV4Parser.LPAR);
            this.state = 409;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            if ((((_la) & ~0x1F) === 0 && ((1 << _la) & 168034240) !== 0) || ((((_la - 34)) & ~0x1F) === 0 && ((1 << (_la - 34)) & 131337219) !== 0)) {
                {
                this.state = 408;
                this.fun_actual_args();
                }
            }

            this.state = 411;
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
        this.enterRule(localContext, 90, PineV4Parser.RULE_fun_actual_args);
        let _la: number;
        try {
            this.state = 419;
            this.errorHandler.sync(this);
            switch (this.interpreter.adaptivePredict(this.tokenStream, 43, this.context) ) {
            case 1:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 413;
                this.kw_args();
                }
                break;
            case 2:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 414;
                this.pos_args();
                this.state = 417;
                this.errorHandler.sync(this);
                _la = this.tokenStream.LA(1);
                if (_la === 51) {
                    {
                    this.state = 415;
                    this.match(PineV4Parser.COMMA);
                    this.state = 416;
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
        this.enterRule(localContext, 92, PineV4Parser.RULE_kw_args);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 421;
            this.kw_arg();
            this.state = 426;
            this.errorHandler.sync(this);
            _la = this.tokenStream.LA(1);
            while (_la === 51) {
                {
                {
                this.state = 422;
                this.match(PineV4Parser.COMMA);
                this.state = 423;
                this.kw_arg();
                }
                }
                this.state = 428;
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
        this.enterRule(localContext, 94, PineV4Parser.RULE_kw_arg);
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 429;
            this.id();
            this.state = 430;
            this.match(PineV4Parser.DEFINE);
            this.state = 433;
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
                this.state = 431;
                this.arith_expr();
                }
                break;
            case PineV4Parser.LSQBR:
                {
                this.state = 432;
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
        this.enterRule(localContext, 96, PineV4Parser.RULE_literal);
        try {
            this.state = 437;
            this.errorHandler.sync(this);
            switch (this.tokenStream.LA(1)) {
            case PineV4Parser.INT_LITERAL:
            case PineV4Parser.FLOAT_LITERAL:
                this.enterOuterAlt(localContext, 1);
                {
                this.state = 435;
                this.num_literal();
                }
                break;
            case PineV4Parser.BOOL_LITERAL:
            case PineV4Parser.STR_LITERAL:
            case PineV4Parser.COLOR_LITERAL:
                this.enterOuterAlt(localContext, 2);
                {
                this.state = 436;
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
        this.enterRule(localContext, 98, PineV4Parser.RULE_num_literal);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 439;
            _la = this.tokenStream.LA(1);
            if(!(_la === 56 || _la === 57)) {
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
        this.enterRule(localContext, 100, PineV4Parser.RULE_other_literal);
        let _la: number;
        try {
            this.enterOuterAlt(localContext, 1);
            {
            this.state = 441;
            _la = this.tokenStream.LA(1);
            if(!(((((_la - 35)) & ~0x1F) === 0 && ((1 << (_la - 35)) & 25165825) !== 0))) {
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
        4,1,64,444,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,5,2,6,7,
        6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,2,11,7,11,2,12,7,12,2,13,7,13,
        2,14,7,14,2,15,7,15,2,16,7,16,2,17,7,17,2,18,7,18,2,19,7,19,2,20,
        7,20,2,21,7,21,2,22,7,22,2,23,7,23,2,24,7,24,2,25,7,25,2,26,7,26,
        2,27,7,27,2,28,7,28,2,29,7,29,2,30,7,30,2,31,7,31,2,32,7,32,2,33,
        7,33,2,34,7,34,2,35,7,35,2,36,7,36,2,37,7,37,2,38,7,38,2,39,7,39,
        2,40,7,40,2,41,7,41,2,42,7,42,2,43,7,43,2,44,7,44,2,45,7,45,2,46,
        7,46,2,47,7,47,2,48,7,48,2,49,7,49,2,50,7,50,1,0,1,0,1,1,1,1,1,2,
        1,2,1,2,3,2,110,8,2,1,3,1,3,1,4,1,4,1,4,5,4,117,8,4,10,4,12,4,120,
        9,4,1,5,3,5,123,8,5,1,5,3,5,126,8,5,1,5,3,5,129,8,5,1,5,1,5,1,5,
        1,5,1,6,3,6,136,8,6,1,6,3,6,139,8,6,1,6,3,6,142,8,6,1,6,1,6,1,6,
        1,6,1,7,1,7,1,8,1,8,1,8,3,8,153,8,8,1,8,1,8,1,9,1,9,1,9,1,9,5,9,
        161,8,9,10,9,12,9,164,9,9,1,9,1,9,1,9,3,9,169,8,9,3,9,171,8,9,1,
        10,1,10,3,10,175,8,10,1,11,1,11,1,11,5,11,180,8,11,10,11,12,11,183,
        9,11,1,12,1,12,1,12,1,12,1,12,1,12,1,12,1,12,1,12,3,12,194,8,12,
        1,13,1,13,1,13,1,13,1,13,1,13,1,13,3,13,203,8,13,1,14,1,14,5,14,
        207,8,14,10,14,12,14,210,9,14,1,14,1,14,1,15,1,15,3,15,216,8,15,
        1,16,1,16,1,16,5,16,221,8,16,10,16,12,16,224,9,16,1,17,1,17,3,17,
        228,8,17,1,18,1,18,1,18,1,18,1,18,1,19,1,19,1,19,1,19,1,19,1,20,
        1,20,1,20,1,20,5,20,244,8,20,10,20,12,20,247,9,20,3,20,249,8,20,
        1,20,1,20,1,21,1,21,1,22,1,22,1,22,5,22,258,8,22,10,22,12,22,261,
        9,22,1,23,1,23,1,24,1,24,1,25,1,25,1,26,1,26,1,26,1,26,1,27,1,27,
        4,27,275,8,27,11,27,12,27,276,1,28,1,28,1,28,5,28,282,8,28,10,28,
        12,28,285,9,28,1,29,1,29,1,29,1,29,5,29,291,8,29,10,29,12,29,294,
        9,29,1,29,1,29,1,30,1,30,1,30,1,30,5,30,302,8,30,10,30,12,30,305,
        9,30,1,30,1,30,1,31,1,31,1,31,3,31,312,8,31,1,32,1,32,1,32,1,32,
        1,32,1,32,3,32,320,8,32,1,32,1,32,1,33,1,33,1,34,1,34,1,34,1,34,
        1,34,1,34,3,34,332,8,34,1,35,1,35,1,35,5,35,337,8,35,10,35,12,35,
        340,9,35,1,36,1,36,1,36,5,36,345,8,36,10,36,12,36,348,9,36,1,37,
        1,37,1,37,5,37,353,8,37,10,37,12,37,356,9,37,1,38,1,38,1,38,5,38,
        361,8,38,10,38,12,38,364,9,38,1,39,1,39,1,39,5,39,369,8,39,10,39,
        12,39,372,9,39,1,40,1,40,1,40,5,40,377,8,40,10,40,12,40,380,9,40,
        1,41,1,41,1,41,1,41,1,41,1,41,1,41,3,41,389,8,41,1,42,1,42,1,42,
        1,42,1,42,3,42,396,8,42,1,43,1,43,1,43,1,43,1,43,1,43,1,43,3,43,
        405,8,43,1,44,1,44,1,44,3,44,410,8,44,1,44,1,44,1,45,1,45,1,45,1,
        45,3,45,418,8,45,3,45,420,8,45,1,46,1,46,1,46,5,46,425,8,46,10,46,
        12,46,428,9,46,1,47,1,47,1,47,1,47,3,47,434,8,47,1,48,1,48,3,48,
        438,8,48,1,49,1,49,1,50,1,50,1,50,0,0,51,0,2,4,6,8,10,12,14,16,18,
        20,22,24,26,28,30,32,34,36,38,40,42,44,46,48,50,52,54,56,58,60,62,
        64,66,68,70,72,74,76,78,80,82,84,86,88,90,92,94,96,98,100,0,11,1,
        0,4,5,1,0,6,8,1,0,9,17,2,0,6,17,60,60,1,0,18,22,1,0,38,39,1,0,40,
        43,1,0,44,45,1,0,46,48,1,0,56,57,2,0,35,35,58,59,456,0,102,1,0,0,
        0,2,104,1,0,0,0,4,106,1,0,0,0,6,111,1,0,0,0,8,113,1,0,0,0,10,122,
        1,0,0,0,12,135,1,0,0,0,14,147,1,0,0,0,16,149,1,0,0,0,18,156,1,0,
        0,0,20,174,1,0,0,0,22,176,1,0,0,0,24,193,1,0,0,0,26,202,1,0,0,0,
        28,208,1,0,0,0,30,215,1,0,0,0,32,217,1,0,0,0,34,227,1,0,0,0,36,229,
        1,0,0,0,38,234,1,0,0,0,40,239,1,0,0,0,42,252,1,0,0,0,44,254,1,0,
        0,0,46,262,1,0,0,0,48,264,1,0,0,0,50,266,1,0,0,0,52,268,1,0,0,0,
        54,274,1,0,0,0,56,278,1,0,0,0,58,286,1,0,0,0,60,297,1,0,0,0,62,311,
        1,0,0,0,64,313,1,0,0,0,66,323,1,0,0,0,68,325,1,0,0,0,70,333,1,0,
        0,0,72,341,1,0,0,0,74,349,1,0,0,0,76,357,1,0,0,0,78,365,1,0,0,0,
        80,373,1,0,0,0,82,388,1,0,0,0,84,390,1,0,0,0,86,404,1,0,0,0,88,406,
        1,0,0,0,90,419,1,0,0,0,92,421,1,0,0,0,94,429,1,0,0,0,96,437,1,0,
        0,0,98,439,1,0,0,0,100,441,1,0,0,0,102,103,7,0,0,0,103,1,1,0,0,0,
        104,105,7,1,0,0,105,3,1,0,0,0,106,109,7,2,0,0,107,108,5,54,0,0,108,
        110,5,55,0,0,109,107,1,0,0,0,109,110,1,0,0,0,110,5,1,0,0,0,111,112,
        7,3,0,0,112,7,1,0,0,0,113,118,3,6,3,0,114,115,5,64,0,0,115,117,3,
        6,3,0,116,114,1,0,0,0,117,120,1,0,0,0,118,116,1,0,0,0,118,119,1,
        0,0,0,119,9,1,0,0,0,120,118,1,0,0,0,121,123,3,0,0,0,122,121,1,0,
        0,0,122,123,1,0,0,0,123,125,1,0,0,0,124,126,3,2,1,0,125,124,1,0,
        0,0,125,126,1,0,0,0,126,128,1,0,0,0,127,129,3,4,2,0,128,127,1,0,
        0,0,128,129,1,0,0,0,129,130,1,0,0,0,130,131,3,8,4,0,131,132,5,49,
        0,0,132,133,3,62,31,0,133,11,1,0,0,0,134,136,3,0,0,0,135,134,1,0,
        0,0,135,136,1,0,0,0,136,138,1,0,0,0,137,139,3,2,1,0,138,137,1,0,
        0,0,138,139,1,0,0,0,139,141,1,0,0,0,140,142,3,4,2,0,141,140,1,0,
        0,0,141,142,1,0,0,0,142,143,1,0,0,0,143,144,3,58,29,0,144,145,5,
        49,0,0,145,146,3,62,31,0,146,13,1,0,0,0,147,148,7,4,0,0,148,15,1,
        0,0,0,149,152,3,8,4,0,150,153,5,23,0,0,151,153,3,14,7,0,152,150,
        1,0,0,0,152,151,1,0,0,0,153,154,1,0,0,0,154,155,3,62,31,0,155,17,
        1,0,0,0,156,157,5,25,0,0,157,158,3,68,34,0,158,170,3,66,33,0,159,
        161,5,3,0,0,160,159,1,0,0,0,161,164,1,0,0,0,162,160,1,0,0,0,162,
        163,1,0,0,0,163,165,1,0,0,0,164,162,1,0,0,0,165,168,5,26,0,0,166,
        169,3,18,9,0,167,169,3,66,33,0,168,166,1,0,0,0,168,167,1,0,0,0,169,
        171,1,0,0,0,170,162,1,0,0,0,170,171,1,0,0,0,171,19,1,0,0,0,172,175,
        3,62,31,0,173,175,3,60,30,0,174,172,1,0,0,0,174,173,1,0,0,0,175,
        21,1,0,0,0,176,181,3,20,10,0,177,178,5,51,0,0,178,180,3,20,10,0,
        179,177,1,0,0,0,180,183,1,0,0,0,181,179,1,0,0,0,181,182,1,0,0,0,
        182,23,1,0,0,0,183,181,1,0,0,0,184,194,3,10,5,0,185,194,3,12,6,0,
        186,194,3,88,44,0,187,194,3,18,9,0,188,194,3,16,8,0,189,194,3,64,
        32,0,190,194,3,46,23,0,191,194,3,48,24,0,192,194,3,62,31,0,193,184,
        1,0,0,0,193,185,1,0,0,0,193,186,1,0,0,0,193,187,1,0,0,0,193,188,
        1,0,0,0,193,189,1,0,0,0,193,190,1,0,0,0,193,191,1,0,0,0,193,192,
        1,0,0,0,194,25,1,0,0,0,195,203,3,10,5,0,196,203,3,12,6,0,197,203,
        3,62,31,0,198,203,3,60,30,0,199,203,3,16,8,0,200,203,3,46,23,0,201,
        203,3,48,24,0,202,195,1,0,0,0,202,196,1,0,0,0,202,197,1,0,0,0,202,
        198,1,0,0,0,202,199,1,0,0,0,202,200,1,0,0,0,202,201,1,0,0,0,203,
        27,1,0,0,0,204,207,3,30,15,0,205,207,5,3,0,0,206,204,1,0,0,0,206,
        205,1,0,0,0,207,210,1,0,0,0,208,206,1,0,0,0,208,209,1,0,0,0,209,
        211,1,0,0,0,210,208,1,0,0,0,211,212,5,0,0,1,212,29,1,0,0,0,213,216,
        3,34,17,0,214,216,3,32,16,0,215,213,1,0,0,0,215,214,1,0,0,0,216,
        31,1,0,0,0,217,222,3,24,12,0,218,219,5,51,0,0,219,221,3,24,12,0,
        220,218,1,0,0,0,221,224,1,0,0,0,222,220,1,0,0,0,222,223,1,0,0,0,
        223,33,1,0,0,0,224,222,1,0,0,0,225,228,3,36,18,0,226,228,3,38,19,
        0,227,225,1,0,0,0,227,226,1,0,0,0,228,35,1,0,0,0,229,230,3,8,4,0,
        230,231,3,40,20,0,231,232,5,50,0,0,232,233,3,42,21,0,233,37,1,0,
        0,0,234,235,3,8,4,0,235,236,3,40,20,0,236,237,5,50,0,0,237,238,3,
        50,25,0,238,39,1,0,0,0,239,248,5,52,0,0,240,245,3,8,4,0,241,242,
        5,51,0,0,242,244,3,8,4,0,243,241,1,0,0,0,244,247,1,0,0,0,245,243,
        1,0,0,0,245,246,1,0,0,0,246,249,1,0,0,0,247,245,1,0,0,0,248,240,
        1,0,0,0,248,249,1,0,0,0,249,250,1,0,0,0,250,251,5,53,0,0,251,41,
        1,0,0,0,252,253,3,44,22,0,253,43,1,0,0,0,254,259,3,26,13,0,255,256,
        5,51,0,0,256,258,3,26,13,0,257,255,1,0,0,0,258,261,1,0,0,0,259,257,
        1,0,0,0,259,260,1,0,0,0,260,45,1,0,0,0,261,259,1,0,0,0,262,263,5,
        30,0,0,263,47,1,0,0,0,264,265,5,31,0,0,265,49,1,0,0,0,266,267,3,
        52,26,0,267,51,1,0,0,0,268,269,5,1,0,0,269,270,3,54,27,0,270,271,
        5,2,0,0,271,53,1,0,0,0,272,275,3,56,28,0,273,275,5,3,0,0,274,272,
        1,0,0,0,274,273,1,0,0,0,275,276,1,0,0,0,276,274,1,0,0,0,276,277,
        1,0,0,0,277,55,1,0,0,0,278,283,3,26,13,0,279,280,5,51,0,0,280,282,
        3,26,13,0,281,279,1,0,0,0,282,285,1,0,0,0,283,281,1,0,0,0,283,284,
        1,0,0,0,284,57,1,0,0,0,285,283,1,0,0,0,286,287,5,54,0,0,287,292,
        3,8,4,0,288,289,5,51,0,0,289,291,3,8,4,0,290,288,1,0,0,0,291,294,
        1,0,0,0,292,290,1,0,0,0,292,293,1,0,0,0,293,295,1,0,0,0,294,292,
        1,0,0,0,295,296,5,55,0,0,296,59,1,0,0,0,297,298,5,54,0,0,298,303,
        3,62,31,0,299,300,5,51,0,0,300,302,3,62,31,0,301,299,1,0,0,0,302,
        305,1,0,0,0,303,301,1,0,0,0,303,304,1,0,0,0,304,306,1,0,0,0,305,
        303,1,0,0,0,306,307,5,55,0,0,307,61,1,0,0,0,308,312,3,68,34,0,309,
        312,3,18,9,0,310,312,3,64,32,0,311,308,1,0,0,0,311,309,1,0,0,0,311,
        310,1,0,0,0,312,63,1,0,0,0,313,314,5,27,0,0,314,315,3,10,5,0,315,
        316,5,28,0,0,316,319,3,68,34,0,317,318,5,29,0,0,318,320,3,68,34,
        0,319,317,1,0,0,0,319,320,1,0,0,0,320,321,1,0,0,0,321,322,3,66,33,
        0,322,65,1,0,0,0,323,324,3,50,25,0,324,67,1,0,0,0,325,331,3,70,35,
        0,326,327,5,36,0,0,327,328,3,68,34,0,328,329,5,37,0,0,329,330,3,
        68,34,0,330,332,1,0,0,0,331,326,1,0,0,0,331,332,1,0,0,0,332,69,1,
        0,0,0,333,338,3,72,36,0,334,335,5,32,0,0,335,337,3,72,36,0,336,334,
        1,0,0,0,337,340,1,0,0,0,338,336,1,0,0,0,338,339,1,0,0,0,339,71,1,
        0,0,0,340,338,1,0,0,0,341,346,3,74,37,0,342,343,5,33,0,0,343,345,
        3,74,37,0,344,342,1,0,0,0,345,348,1,0,0,0,346,344,1,0,0,0,346,347,
        1,0,0,0,347,73,1,0,0,0,348,346,1,0,0,0,349,354,3,76,38,0,350,351,
        7,5,0,0,351,353,3,76,38,0,352,350,1,0,0,0,353,356,1,0,0,0,354,352,
        1,0,0,0,354,355,1,0,0,0,355,75,1,0,0,0,356,354,1,0,0,0,357,362,3,
        78,39,0,358,359,7,6,0,0,359,361,3,78,39,0,360,358,1,0,0,0,361,364,
        1,0,0,0,362,360,1,0,0,0,362,363,1,0,0,0,363,77,1,0,0,0,364,362,1,
        0,0,0,365,370,3,80,40,0,366,367,7,7,0,0,367,369,3,80,40,0,368,366,
        1,0,0,0,369,372,1,0,0,0,370,368,1,0,0,0,370,371,1,0,0,0,371,79,1,
        0,0,0,372,370,1,0,0,0,373,378,3,82,41,0,374,375,7,8,0,0,375,377,
        3,82,41,0,376,374,1,0,0,0,377,380,1,0,0,0,378,376,1,0,0,0,378,379,
        1,0,0,0,379,81,1,0,0,0,380,378,1,0,0,0,381,389,3,84,42,0,382,383,
        5,34,0,0,383,389,3,84,42,0,384,385,5,44,0,0,385,389,3,84,42,0,386,
        387,5,45,0,0,387,389,3,84,42,0,388,381,1,0,0,0,388,382,1,0,0,0,388,
        384,1,0,0,0,388,386,1,0,0,0,389,83,1,0,0,0,390,395,3,86,43,0,391,
        392,5,54,0,0,392,393,3,62,31,0,393,394,5,55,0,0,394,396,1,0,0,0,
        395,391,1,0,0,0,395,396,1,0,0,0,396,85,1,0,0,0,397,405,3,88,44,0,
        398,405,3,8,4,0,399,405,3,96,48,0,400,401,5,52,0,0,401,402,3,62,
        31,0,402,403,5,53,0,0,403,405,1,0,0,0,404,397,1,0,0,0,404,398,1,
        0,0,0,404,399,1,0,0,0,404,400,1,0,0,0,405,87,1,0,0,0,406,407,3,8,
        4,0,407,409,5,52,0,0,408,410,3,90,45,0,409,408,1,0,0,0,409,410,1,
        0,0,0,410,411,1,0,0,0,411,412,5,53,0,0,412,89,1,0,0,0,413,420,3,
        92,46,0,414,417,3,22,11,0,415,416,5,51,0,0,416,418,3,92,46,0,417,
        415,1,0,0,0,417,418,1,0,0,0,418,420,1,0,0,0,419,413,1,0,0,0,419,
        414,1,0,0,0,420,91,1,0,0,0,421,426,3,94,47,0,422,423,5,51,0,0,423,
        425,3,94,47,0,424,422,1,0,0,0,425,428,1,0,0,0,426,424,1,0,0,0,426,
        427,1,0,0,0,427,93,1,0,0,0,428,426,1,0,0,0,429,430,3,8,4,0,430,433,
        5,49,0,0,431,434,3,62,31,0,432,434,3,60,30,0,433,431,1,0,0,0,433,
        432,1,0,0,0,434,95,1,0,0,0,435,438,3,98,49,0,436,438,3,100,50,0,
        437,435,1,0,0,0,437,436,1,0,0,0,438,97,1,0,0,0,439,440,7,9,0,0,440,
        99,1,0,0,0,441,442,7,10,0,0,442,101,1,0,0,0,47,109,118,122,125,128,
        135,138,141,152,162,168,170,174,181,193,202,206,208,215,222,227,
        245,248,259,274,276,283,292,303,311,319,331,338,346,354,362,370,
        378,388,395,404,409,417,419,426,433,437
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
    public LSQBR(): antlr.TerminalNode | null {
        return this.getToken(PineV4Parser.LSQBR, 0);
    }
    public RSQBR(): antlr.TerminalNode | null {
        return this.getToken(PineV4Parser.RSQBR, 0);
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


export class Compound_assign_opContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState);
    }
    public PLUS_ASSIGN(): antlr.TerminalNode | null {
        return this.getToken(PineV4Parser.PLUS_ASSIGN, 0);
    }
    public MINUS_ASSIGN(): antlr.TerminalNode | null {
        return this.getToken(PineV4Parser.MINUS_ASSIGN, 0);
    }
    public MUL_ASSIGN(): antlr.TerminalNode | null {
        return this.getToken(PineV4Parser.MUL_ASSIGN, 0);
    }
    public DIV_ASSIGN(): antlr.TerminalNode | null {
        return this.getToken(PineV4Parser.DIV_ASSIGN, 0);
    }
    public MOD_ASSIGN(): antlr.TerminalNode | null {
        return this.getToken(PineV4Parser.MOD_ASSIGN, 0);
    }
    public override get ruleIndex(): number {
        return PineV4Parser.RULE_compound_assign_op;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
        return this.getToken(PineV4Parser.ASSIGN, 0);
    }
    public compound_assign_op(): Compound_assign_opContext | null {
        return this.getRuleContext(0, Compound_assign_opContext);
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
    public if_expr(): If_exprContext | null {
        return this.getRuleContext(0, If_exprContext);
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
        return PineV4Parser.RULE_pos_arg;
    }
    public override accept<Result>(visitor: PineV4ParserVisitor<Result>): Result | null {
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
