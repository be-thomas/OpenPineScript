// ============================================================================
// Pine Script v1 — BASE LEXER
// ============================================================================
// This is the ROOT of the version hierarchy. It describes Pine Script v1 and
// NOTHING ELSE. Later versions import it (see PineV2Lexer.g4, PineV3Lexer.g4).
//
// RULES FOR EDITING THIS FILE
//   1. Only add a token here if it existed in Pine Script v1.
//   2. NEVER add a token "so a later version can use it" — that leaks the
//      future into the base and breaks version-accurate error reporting.
//   3. A token added in version N belongs in PineV<N>Lexer.g4, where ANTLR
//      gives it precedence over inherited rules (new rules are matched first).
//
// Worked example: ':=' is deliberately ABSENT here. v1 has no reassignment
// operator, so `x := 1` must lex as COND_ELSE '=' DEFINE and fail to parse —
// which is what TradingView does. v3 introduces it in PineV3Lexer.g4.
// ============================================================================
lexer grammar PineV1Lexer;

// 1. DEFINE VIRTUAL TOKENS
// These are injected by the TokenSource logic (lexer/v1/IndentTokenSource.ts).
tokens {
  BEGIN,
  END,
  LEND
}

// ----- Indentation / Line Structure -----
// Matches ANY newline sequence + indentation spaces.
// The TokenSource analyzes this to generate BEGIN/END/LEND.
LBEG : ('\r'? '\n' | '\r')+ [ \t]* ;

// ----- Keywords -----
IF_COND     : 'if' ;
IF_COND_ELSE: 'else' ;
FOR_STMT    : 'for' ;
FOR_STMT_TO : 'to' ;
FOR_STMT_BY : 'by' ;
BREAK       : 'break' ;
CONTINUE    : 'continue' ;
OR          : 'or' ;
AND         : 'and' ;
NOT         : 'not' ;
BOOL_LITERAL: 'true' | 'false' ;

// ----- Operators -----
COND        : '?' ;
COND_ELSE   : ':' ;
EQ          : '==' ;
NEQ         : '!=' ;
GT          : '>' ;
GE          : '>=' ;
LT          : '<' ;
LE          : '<=' ;
PLUS        : '+' ;
MINUS       : '-' ;
MUL         : '*' ;
DIV         : '/' ;
MOD         : '%' ;
DEFINE      : '=' ;
ARROW       : '=>' ;
COMMA       : ',' ;
LPAR        : '(' ;
RPAR        : ')' ;
LSQBR       : '[' ;
RSQBR       : ']' ;

// ----- Literals -----
INT_LITERAL   : [0-9]+ ;
FLOAT_LITERAL : [0-9]+ '.' [0-9]* ([eE] [+-]? [0-9]+)?
              | '.' [0-9]+ ([eE] [+-]? [0-9]+)?
              | [0-9]+ [eE] [+-]? [0-9]+
              ;
// A literal string may be WRAPPED across code lines, and the wrap is part of
// the token rather than a line break the indenter should see.
//
// From the manual's Strings page: "programmers can use line wrapping to define
// single-line literal strings across multiple code lines, where each wrapped
// line has an indentation of one or more spaces. However, the resulting
// character sequence adds only one space to the start of the wrapped lines, and
// it does not automatically add line terminators. This line-wrapping behavior is
// deprecated; future versions of Pine Script will not support it."
//
// It sits in the BASE lexer because no documentation dates its arrival. It is a
// consequence of the line-continuation PRE-PASS that TradingView's own published
// v2 lexer grammar implies — that grammar forbids '\n' inside STR_LITERAL and
// still declares a LINE_CONTINUATION token, so by the time the lexer runs the
// wrap has already been folded away. Deprecating it in v6 says it was there
// before; nothing says when it started. Same reading as `syminfo`: a rule with
// no stated introduction version is treated as always having been there.
//
// The indentation is REQUIRED. A quote left open with the next line at column 0
// is an unterminated string, and must keep failing.
STR_LITERAL   : '"' ( ~["\r\n\\] | '\\' . | STR_WRAP )* '"'
              | '\'' ( ~['\r\n\\] | '\\' . | STR_WRAP )* '\''
              ;
fragment STR_WRAP : ( '\r'? '\n' | '\r' ) [ \t]+ ;
// ANTLR4 lexer rules do NOT support {n} repetition — `{6}` is parsed as an
// ACTION block, so '#' [0-9a-fA-F]{6} matched '#' plus a SINGLE hex digit and
// left the rest as an identifier ('#0ebb23' lexed as '#0' then 'ebb23').
// The counts must be written out.
COLOR_LITERAL : '#' HEX HEX HEX HEX HEX HEX ( HEX HEX )? ;
fragment HEX  : [0-9a-fA-F] ;

// ----- Identifier -----
ID          : [a-zA-Z_][a-zA-Z0-9_]* ;

// ----- Skip (Mid-line whitespace) -----
WS          : [ \t]+ -> skip ;

// ----- Comments -----
LINE_COMMENT  : '//' ~[\r\n]* -> skip ;
BLOCK_COMMENT : '/*' .*? '*/' -> skip ;

DOT : '.' ;
