# Lexer Rules

Here is the lexer rules according to Pinescript documentation.
[TradingView Pinescript Manual](https://www.tradingview.com/pine-script-docs/v3/appendix/pine-script-v2-lexer-grammar/).

The manual is for version 2, that is understood. However, there hasn't been any major changes in the language syntax ever since. We can confirm this by checking their documentation for migration guides from v2 to v3, v3 to v4, v4 to v5 and v5 to v6. Most of the changes are semantic or function name changes.

```
COND : '?' ;
COND_ELSE : ':' ;
OR : 'or' ;
AND : 'and' ;
NOT : 'not' ;
EQ : '==' ;
NEQ : '!=' ;
GT : '>' ;
GE : '>=' ;
LT : '<' ;
LE : '<=' ;
PLUS : '+' ;
MINUS : '-' ;
MUL : '*' ;
DIV : '/' ;
MOD : '%' ;
COMMA : ',' ;
ARROW : '=>' ;
LPAR : '(' ;
RPAR : ')' ;
LSQBR : '[' ;
RSQBR : ']' ;
DEFINE : '=' ;
IF_COND : 'if' ;
IF_COND_ELSE : 'else' ;
BEGIN : '|BEGIN|' ;
END : '|END|' ;
ASSIGN : ':=' ;
FOR_STMT : 'for' ;
FOR_STMT_TO : 'to' ;
FOR_STMT_BY : 'by' ;
BREAK : 'break' ;
CONTINUE : 'continue' ;
LBEG : '|B|' ;
LEND : '|E|' ;
PLEND : '|PE|' ;
INT_LITERAL : ( '0' .. '9' )+ ;
FLOAT_LITERAL : ( '.' DIGITS ( EXP )? | DIGITS ( '.' ( DIGITS ( EXP )? )? | EXP ) );
STR_LITERAL : ( '"' ( ESC | ~ ( '\\' | '\n' | '"' ) )* '"' | '\'' ( ESC | ~ ( '\\' | '\n' | '\'' ) )* '\'' );
BOOL_LITERAL : ( 'true' | 'false' );
COLOR_LITERAL : ( '#' HEX_DIGIT HEX_DIGIT HEX_DIGIT HEX_DIGIT HEX_DIGIT HEX_DIGIT | '#' HEX_DIGIT HEX_DIGIT HEX_DIGIT HEX_DIGIT HEX_DIGIT HEX_DIGIT HEX_DIGIT HEX_DIGIT );
ID : ( ID_LETTER ) ( ( '\.' )? ( ID_BODY '\.' )* ID_BODY )? ;
ID_EX : ( ID_LETTER_EX ) ( ( '\.' )? ( ID_BODY_EX '\.' )* ID_BODY_EX )? ;
INDENT : '|INDENT|' ;
LINE_CONTINUATION : '|C|' ;
EMPTY_LINE_V1 : '|EMPTY_V1|' ;
EMPTY_LINE : '|EMPTY|' ;
WHITESPACE : ( ' ' | '\t' | '\n' )+ ;
fragment ID_BODY : ( ID_LETTER | DIGIT )+ ;
fragment ID_BODY_EX : ( ID_LETTER_EX | DIGIT )+ ;
fragment ID_LETTER : ( 'a' .. 'z' | 'A' .. 'Z' | '_' ) ;
fragment ID_LETTER_EX : ( 'a' .. 'z' | 'A' .. 'Z' | '_' | '#' ) ;
fragment DIGIT : ( '0' .. '9' ) ;
fragment ESC : '\\' . ;
fragment DIGITS : ( '0' .. '9' )+ ;
fragment HEX_DIGIT : ( '0' .. '9' | 'a' .. 'f' | 'A' .. 'F' ) ;
fragment EXP : ( 'e' | 'E' ) ( '+' | '-' )? DIGITS ;
Tokens : ( COND | COND_ELSE | OR | AND | NOT | EQ | NEQ | GT | GE | LT | LE | PLUS | MINUS | MUL | DIV | MOD | COMMA | ARROW | LPAR | RPAR | LSQBR | RSQBR | DEFINE | IF_COND | IF_COND_ELSE | BEGIN | END | ASSIGN | FOR_STMT | FOR_STMT_TO | FOR_STMT_BY | BREAK | CONTINUE | LBEG | LEND | PLEND | INT_LITERAL | FLOAT_LITERAL | STR_LITERAL | BOOL_LITERAL | COLOR_LITERAL | ID | ID_EX | INDENT | LINE_CONTINUATION | EMPTY_LINE_V1 | EMPTY_LINE | WHITESPACE );
```

What's implemented till now:
- COND
- COND_ELSE
- OR
- AND
- NOT
- EQ
- NEQ
- GT
- GE
- LT
- LE
- PLUS
- MINUS
- MUL
- DIV
- MOD
- COMMA
- ARROW
- LPAR
- RPAR
- LSQBR
- RSQBR
- DEFINE
- IF_COND
- IF_COND_ELSE
- ASSIGN
- FOR_STMT
- FOR_STMT_TO
- FOR_STMT_BY
- BREAK
- CONTINUE
- ID
- INDENT
- WHITESPACE
- COLOR_LITERAL
- INT_LITERAL
- FLOAT_LITERAL
- BOOL_LITERAL
- STR_LITERAL
- LBEG
- LEND
- EMPTY_LINE
- BEGIN
- END
- PLEND


What's remaining:
- need to add support for directives, other than version!!!!


No need to implement (Not being used in the parser grammar):
- EMPTY_LINE_V1
- ID_EX
- LINE_CONTINUATION

