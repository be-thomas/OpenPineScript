lexer grammar PineScriptLexer;

// ----- Keywords (must appear before ID) -----
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
ASSIGN      : ':=' ;
ARROW       : '=>' ;
COMMA       : ',' ;
LPAR        : '(' ;
RPAR        : ')' ;
LSQBR       : '[' ;
RSQBR       : ']' ;

// ----- Indentation / line structure -----
// LBEG only at line start (column 0) so mid-line spaces are WS
LBEG        : { getCharPositionInLine() == 0 }? [ \t]+ ;
LEND        : '\r'? '\n' ;
EMPTY_LINE  : '\r'? '\n' [ \t]* '\r'? '\n' ;
BEGIN       : '<BEGIN>' ;
END         : '<END>' ;
PLEND       : '<PLEND>' ;

// ----- Literals -----
INT_LITERAL   : [0-9]+ ;
FLOAT_LITERAL : [0-9]+ '.' [0-9]* ([eE] [+-]? [0-9]+)?
               | '.' [0-9]+ ([eE] [+-]? [0-9]+)?
               | [0-9]+ [eE] [+-]? [0-9]+
               ;
STR_LITERAL   : '"' ( ~["\r\n\\] | '\\' . )* '"'
               | '\'' ( ~['\r\n\\] | '\\' . )* '\''
               ;
COLOR_LITERAL : '#' [0-9a-fA-F]{6} | '#' [0-9a-fA-F]{8} ;

// ----- Identifier -----
ID          : [a-zA-Z_][a-zA-Z0-9_]* ;

// ----- Skip (mid-line spaces; line-start spaces are LBEG) -----
WS          : [ \t]+ -> skip ;
