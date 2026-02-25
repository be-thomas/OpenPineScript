# Open PineScript Lexer

This project is an open-source implementation of the lexer for TradingView's PineScript language.

The primary goal is to create a robust and accurate lexer that can be used as a foundation for building a full PineScript parser, linter, or other tooling.

## Target Version: PineScript v2

This implementation is based on the official **PineScript v2 Lexer Grammar**, as it is the most complete version with publicly available documentation.

You can find the official grammar here: [Pine Script v2 lexer grammar](https://www.tradingview.com/pine-script-docs/v3/appendix/pine-script-v2-lexer-grammar/).

While PineScript is now on v5/v6, a review of the official migration guides (v2->v3, v3->v4, etc.) shows that the core lexical syntax has remained remarkably stable. Most subsequent changes were semantic or related to the standard library, making v2 a strong and relevant starting point.

## Implementation Status

This checklist tracks the implementation progress for all tokens defined in the v2 grammar.

### Operators & Punctuation
- [x] `COND` (`?`)
- [x] `COND_ELSE` (`:`)
- [x] `OR` (`or`)
- [x] `AND` (`and`)
- [x] `NOT` (`not`)
- [x] `EQ` (`==`)
- [x] `NEQ` (`!=`)
- [x] `GT` (`>`)
- [x] `GE` (`>=`)
- [x] `LT` (`<`)
- [x] `LE` (`<=`)
- [x] `PLUS` (`+`)
- [x] `MINUS` (`-`)
- [x] `MUL` (`*`)
- [x] `DIV` (`/`)
- [x] `MOD` (`%`)
- [x] `COMMA` (`,`)
- [x] `ARROW` (`=>`)
- [x] `LPAR` (`(`)
- [x] `RPAR` (`)`)
- [x] `LSQBR` (`[`)
- [x] `RSQBR` (`]`)
- [x] `DEFINE` (`=`)
- [x] `ASSIGN` (`:=`)

### Keywords
- [x] `IF_COND` (`if`)
- [x] `IF_COND_ELSE` (`else`)
- [x] `FOR_STMT` (`for`)
- [x] `FOR_STMT_TO` (`to`)
- [x] `FOR_STMT_BY` (`by`)
- [x] `BREAK` (`break`)
- [x] `CONTINUE` (`continue`)

### Literals
- [x] `INT_LITERAL`
- [x] `FLOAT_LITERAL`
- [x] `STR_LITERAL`
- [x] `BOOL_LITERAL`
- [x] `COLOR_LITERAL`

### Identifiers & Whitespace
- [x] `ID`
- [x] `WHITESPACE`

### Internal & Structural Tokens
- [x] `INDENT` (`|INDENT|`)
- [x] `BEGIN` (`|BEGIN|`)
- [x] `END` (`|END|`)
- [x] `LBEG` (`|B|`)
- [x] `LEND` (`|E|`)
- [x] `PLEND` (`|PE|`)
- [x] `EMPTY_LINE` (`|EMPTY|`)

### Not Implemented (Parser Dependent)
The following tokens are part of the official grammar but are not required by the parser and will not be implemented at this time.
- [ ] `EMPTY_LINE_V1`
- [ ] `ID_EX`
- [ ] `LINE_CONTINUATION`

## Roadmap / Next Steps

- [ ] **Implement support for pre-processor directives.** The current lexer does not handle directives like `@version=2`. This is the next major feature to be added.

<br>

<details>
<summary><b>Reference: ANTLR v3 Grammar for PineScript v2</b></summary>

```antlr
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
