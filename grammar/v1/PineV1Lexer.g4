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
STR_LITERAL   : '"' ( ~["\r\n\\] | '\\' . )* '"'
              | '\'' ( ~['\r\n\\] | '\\' . )* '\''
              ;
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
