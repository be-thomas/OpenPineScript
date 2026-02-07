lexer grammar PineScriptLexer;

// 1. DEFINE VIRTUAL TOKENS
// These are injected by the TokenSource logic.
tokens {
  BEGIN,
  END,
  LEND
}

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
ASSIGN      : ':=' ;
ARROW       : '=>' ;
COMMA       : ',' ;
LPAR        : '(' ;
RPAR        : ')' ;
LSQBR       : '[' ;
RSQBR       : ']' ;

// ----- Indentation / Line Structure -----
// Matches ANY newline sequence + indentation spaces.
// The TokenSource analyzes this to generate BEGIN/END/LEND.
LBEG : ('\r'? '\n' | '\r')+ [ \t]* ;

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

// ----- Skip (Mid-line whitespace) -----
WS          : [ \t]+ -> skip ;

// ----- Comments -----
LINE_COMMENT  : '//' ~[\r\n]* -> skip ;
BLOCK_COMMENT : '/*' .*? '*/' -> skip ;
