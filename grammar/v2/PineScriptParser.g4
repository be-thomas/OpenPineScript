parser grammar PineScriptParser;

options { tokenVocab = PineScriptLexer; }

// Entry point
tvscript
  : ( stmt )+ EOF
  ;

stmt
  : fun_def_stmt
  | global_stmt_or_multistmt
  ;

global_stmt_or_multistmt
  : BEGIN global_stmt_or_multistmt END
  | global_stmt_or_multistmt2
  | EMPTY_LINE
  ;

global_stmt_or_multistmt2
  : ( LBEG )? global_stmt_content ( COMMA global_stmt_content )* ( COMMA )? ( LEND | PLEND )
  ;

global_stmt_content
  : var_def
  | var_defs
  | fun_call
  | if_expr
  | var_assign
  | for_expr
  | loop_break
  | loop_continue
  ;

fun_def_stmt
  : ( LBEG )? fun_def_singleline LEND
  | ( LBEG )? fun_def_multiline PLEND
  ;

fun_def_singleline
  : id fun_head ARROW fun_body_singleline
  ;

fun_def_multiline
  : id fun_head ARROW ( LEND )? fun_body_multiline
  ;

fun_head
  : LPAR ( id ( COMMA id )* )? RPAR
  ;

fun_body_singleline
  : local_stmt_singleline
  ;

local_stmt_singleline
  : BEGIN local_stmt_singleline END
  | local_stmt_singleline2
  ;

local_stmt_singleline2
  : local_stmt_content ( COMMA local_stmt_content )* ( COMMA )?
  ;

local_stmt_content
  : var_def
  | var_defs
  | arith_expr
  | arith_exprs
  | var_assign
  | loop_break
  | loop_continue
  ;

loop_break  : BREAK ;
loop_continue : CONTINUE ;

fun_body_multiline
  : local_stmts_multiline
  ;

local_stmts_multiline
  : ( EMPTY_LINE )* BEGIN local_stmts_multiline2 END
  ;

local_stmts_multiline2
  : ( local_stmt_multiline )+
  ;

local_stmt_multiline
  : LBEG local_stmt_content ( COMMA local_stmt_content )* ( COMMA )? ( LEND | PLEND )
  | EMPTY_LINE
  ;

var_def
  : id DEFINE arith_expr
  ;

var_defs
  : ids_array DEFINE arith_expr
  ;

var_assign
  : id ASSIGN arith_expr
  ;

ids_array
  : LSQBR id ( COMMA id )* RSQBR
  ;

arith_exprs
  : LSQBR arith_expr ( COMMA arith_expr )* RSQBR
  ;

arith_expr
  : ternary_expr
  | if_expr
  | for_expr
  ;

if_expr
  : IF_COND ternary_expr LEND stmts_block PLEND LBEG IF_COND_ELSE LEND stmts_block
  | IF_COND ternary_expr LEND stmts_block
  ;

for_expr
  : FOR_STMT var_def FOR_STMT_TO ternary_expr FOR_STMT_BY ternary_expr LEND stmts_block
  | FOR_STMT var_def FOR_STMT_TO ternary_expr LEND stmts_block
  ;

stmts_block
  : fun_body_multiline
  ;

ternary_expr
  : or_expr ( COND ternary_expr2 )?
  ;

ternary_expr2
  : ternary_expr COND_ELSE ternary_expr
  ;

or_expr
  : and_expr ( OR and_expr )*
  ;

and_expr
  : eq_expr ( AND eq_expr )*
  ;

eq_expr
  : cmp_expr ( ( EQ | NEQ ) cmp_expr )*
  ;

cmp_expr
  : add_expr ( ( GT | GE | LT | LE ) add_expr )*
  ;

add_expr
  : mult_expr ( ( PLUS | MINUS ) mult_expr )*
  ;

mult_expr
  : unary_expr ( ( MUL | DIV | MOD ) unary_expr )*
  ;

unary_expr
  : sqbr_expr
  | NOT sqbr_expr
  | PLUS sqbr_expr
  | MINUS sqbr_expr
  ;

sqbr_expr
  : atom ( LSQBR arith_expr RSQBR )?
  ;

atom
  : fun_call
  | id
  | literal
  | LPAR arith_expr RPAR
  ;

fun_call
  : id LPAR ( fun_actual_args )? RPAR
  ;

fun_actual_args
  : kw_args
  | pos_args ( COMMA kw_args )?
  ;

pos_args
  : arith_expr ( COMMA arith_expr )*
  ;

kw_args
  : kw_arg ( COMMA kw_arg )*
  ;

kw_arg
  : id DEFINE arith_expr
  ;

literal
  : num_literal
  | other_literal
  ;

num_literal
  : INT_LITERAL
  | FLOAT_LITERAL
  ;

other_literal
  : STR_LITERAL
  | BOOL_LITERAL
  | COLOR_LITERAL
  ;

id
  : ID
  ;
