## Parser rules
taken from: (tradingview)[https://www.tradingview.com/pine-script-docs/v3/appendix/pine-script-v2-lexer-grammar/]

```
tvscript : ( stmt )+ ;
stmt : ( fun_def_stmt | global_stmt_or_multistmt );
global_stmt_or_multistmt : ( BEGIN global_stmt_or_multistmt END | global_stmt_or_multistmt2 | EMPTY_LINE ->);
global_stmt_or_multistmt2 : LBEG global_stmt_content ( COMMA global_stmt_content )* ( COMMA )? ( LEND | PLEND ) -> ( global_stmt_content )+ ;
global_stmt_content : ( var_def | var_defs | fun_call | if_expr | var_assign | for_expr | loop_break | loop_continue );
fun_def_stmt : ( LBEG fun_def_singleline LEND -> fun_def_singleline | LBEG fun_def_multiline PLEND -> fun_def_multiline );
fun_def_singleline : id fun_head ARROW fun_body_singleline -> ^( FUN_DEF id ^( FUN_DEF_EXPR fun_head fun_body_singleline ) ) ;
fun_def_multiline : id fun_head ARROW ( LEND )? fun_body_multiline -> ^( FUN_DEF id ^( FUN_DEF_EXPR fun_head fun_body_multiline ) ) ;
fun_head : LPAR ( id ( COMMA id )* )? RPAR -> ^( FUN_HEAD ( id )* ) ;
fun_body_singleline : stmts= local_stmt_singleline -> ^( FUN_BODY ) ;
local_stmt_singleline : ( BEGIN local_stmt_singleline END | local_stmt_singleline2 );
local_stmt_singleline2 : local_stmt_content ( COMMA local_stmt_content )* ( COMMA )? -> ( local_stmt_content )+ ;
local_stmt_content returns [exprTree] : ( var_def | var_defs | arith_expr | arith_exprs | var_assign | loop_break | loop_continue );
loop_break : BREAK ;
loop_continue : CONTINUE ;
fun_body_multiline : stmts= local_stmts_multiline -> ^( FUN_BODY ) ;
local_stmts_multiline returns [myTree, lastStmtTree] : ( EMPTY_LINE )* BEGIN local_stmts_multiline2 END ;
local_stmts_multiline2 returns [lastStmtTree] : ( local_stmt_multiline )+ ;
local_stmt_multiline returns [lastStmtTree] : ( LBEG s1= local_stmt_content ( COMMA s2= local_stmt_content )* ( COMMA )? ( LEND | PLEND ) -> ( local_stmt_content )+ | EMPTY_LINE ->);
var_def returns [exprTree] : id DEFINE arith_expr -> ^( VAR_DEF id arith_expr ) ;
var_defs returns [exprTree] : ids_array DEFINE arith_expr ->;
var_assign returns [exprTree] : id ASSIGN arith_expr -> ^( VAR_ASSIGN id arith_expr ) ;
ids_array returns [ids] : LSQBR a= id ( COMMA b= id )* RSQBR ->;
arith_exprs : LSQBR a= arith_expr ( COMMA b= arith_expr )* RSQBR -> ^( IDS ) ;
arith_expr : ( ternary_expr | if_expr | for_expr );
if_expr : ( ( IF_COND ternary_expr LEND stmts_block PLEND LBEG IF_COND_ELSE )=> IF_COND ternary_expr LEND x= stmts_block PLEND LBEG IF_COND_ELSE LEND y= stmts_block -> ^( IF_THEN_ELSE ternary_expr THEN ELSE ) | IF_COND ternary_expr LEND x= stmts_block -> ^( IF_THEN ternary_expr THEN ) );
for_expr : ( ( FOR_STMT var_def FOR_STMT_TO ternary_expr FOR_STMT_BY )=> FOR_STMT var_def FOR_STMT_TO end= ternary_expr FOR_STMT_BY step= ternary_expr LEND stmts_block -> ^( FOR var_def stmts_block ) | FOR_STMT var_def FOR_STMT_TO ternary_expr LEND stmts_block -> ^( FOR var_def ternary_expr stmts_block ) );
stmts_block : fun_body_multiline ;
ternary_expr : or_expr ( COND ternary_expr2 )? ;
ternary_expr2 : ternary_expr COND_ELSE ternary_expr ;
or_expr : and_expr ( OR and_expr )* ;
and_expr : eq_expr ( AND eq_expr )* ;
eq_expr : cmp_expr ( ( EQ | NEQ ) cmp_expr )* ;
cmp_expr : add_expr ( ( GT | GE | LT | LE ) add_expr )* ;
add_expr : mult_expr ( ( PLUS | MINUS ) mult_expr )* ;
mult_expr : unary_expr ( ( MUL | DIV | MOD ) unary_expr )* ;
unary_expr : ( sqbr_expr | NOT sqbr_expr -> ^( NOT sqbr_expr ) | PLUS sqbr_expr -> ^( UNARY_PLUS sqbr_expr ) | MINUS sqbr_expr -> ^( UNARY_MINUS sqbr_expr ) );
sqbr_expr : atom ( LSQBR arith_expr RSQBR )? -> { squareBracketsPresent }? ^( SQBR atom arith_expr ) -> atom ;
atom : ( fun_call | id | literal | LPAR arith_expr RPAR -> arith_expr );
fun_call : id LPAR ( fun_actual_args )? RPAR -> ^( FUN_CALL id ( fun_actual_args )? ) ;
fun_actual_args : ( kw_args -> ^( FUN_ARGS kw_args ) | pos_args ( COMMA kw_args )? -> ^( FUN_ARGS pos_args ( kw_args )? ) );
pos_args : arith_expr ( COMMA arith_expr )* -> ( arith_expr )+ ;
kw_args : kw_arg ( COMMA kw_arg )* -> ( kw_arg )+ ;
kw_arg : id DEFINE arith_expr -> ^( KW_ARG id arith_expr ) ;
literal : ( num_literal | other_literal );
num_literal : ( INT_LITERAL | FLOAT_LITERAL );
other_literal : ( STR_LITERAL | BOOL_LITERAL | COLOR_LITERAL );
id returns [text] : ID ->;
synpred1_TVScriptParserMain_v2 : IF_COND ternary_expr LEND stmts_block PLEND LBEG IF_COND_ELSE ;
synpred2_TVScriptParserMain_v2 : FOR_STMT var_def FOR_STMT_TO ternary_expr FOR_STMT_BY ;
```
