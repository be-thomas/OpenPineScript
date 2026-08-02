// ============================================================================
// Pine Script v1 — BASE PARSER
// ============================================================================
// The ROOT of the version hierarchy. Describes Pine Script v1 and nothing else.
//
// RULES FOR EDITING THIS FILE
//   1. Only add a rule here if it existed in Pine Script v1.
//   2. NEVER widen a rule to accommodate a later version. If v3 needs an extra
//      alternative, v3 OVERRIDES the rule in PineV3Parser.g4.
//   3. Overriding is safe and type-checked: the generated context classes are
//      structurally compatible for rules a version did not touch, and the
//      TypeScript compiler rejects a subclass visitor that fails to override a
//      rule whose shape actually changed.
//
// Worked example: `var_assign` (`x := expr`) is deliberately ABSENT. v1 has no
// reassignment, so it must be a syntax error. v3 adds the rule and overrides
// `global_stmt_content` / `local_stmt_content` to admit it.
// ============================================================================
parser grammar PineV1Parser;

options { tokenVocab = PineV1Lexer; }

// Entry Point
pine_script : ( stmt | LEND )* EOF ;

stmt : fun_def_stmt | global_stmt ;

global_stmt : global_stmt_content ( COMMA global_stmt_content )* ;

global_stmt_content
  : var_def | var_defs | fun_call | if_expr
  | for_expr | loop_break | loop_continue | arith_expr
  ;

// Function Defs
fun_def_stmt : fun_def_singleline | fun_def_multiline ;
fun_def_singleline : id fun_head ARROW fun_body_singleline ;
fun_def_multiline : id fun_head ARROW fun_body_multiline ;

fun_head : LPAR ( id ( COMMA id )* )? RPAR ;

fun_body_singleline : local_stmt_singleline ;
local_stmt_singleline : local_stmt_content ( COMMA local_stmt_content )* ;

local_stmt_content
  : var_def | var_defs | arith_expr | arith_exprs
  | loop_break | loop_continue
  ;

loop_break : BREAK ;
loop_continue : CONTINUE ;

// Multiline Blocks (Strict Indentation)
fun_body_multiline : local_stmts_multiline ;

// We expect BEGIN here because TokenSource will generate it now!
local_stmts_multiline : BEGIN local_stmts_list END ;

local_stmts_list : ( local_stmt_multiline | LEND )+ ;
local_stmt_multiline : local_stmt_content ( COMMA local_stmt_content )* ;

// Variables
var_def : id DEFINE arith_expr ;
var_defs : ids_array DEFINE arith_expr ;
ids_array : LSQBR id ( COMMA id )* RSQBR ;
arith_exprs : LSQBR arith_expr ( COMMA arith_expr )* RSQBR ;
arith_expr : ternary_expr | if_expr | for_expr ;

// Control Flow (Strict)
// We remove the optional (LEND|LBEG)? hack because TokenSource converts LBEG->BEGIN
//
// LEND* before 'else' is REQUIRED, not defensive. Dedenting out of the 'then'
// block emits LEND, END, LEND — the trailing LEND is the statement separator for
// the level being returned to — so the token stream reaching 'else' is:
//
//     IF_COND <cond> BEGIN <then> LEND END  LEND  IF_COND_ELSE BEGIN <else> END
//                                           ^^^^
// Without this, EVERY if/else in every version failed to parse.
if_expr
  : IF_COND ternary_expr stmts_block ( LEND* IF_COND_ELSE stmts_block )?
  ;

for_expr
  : FOR_STMT var_def FOR_STMT_TO ternary_expr ( FOR_STMT_BY ternary_expr )? stmts_block
  ;

// A block MUST be indented
stmts_block : fun_body_multiline ;

// Expressions (Standard)
ternary_expr : or_expr ( COND ternary_expr COND_ELSE ternary_expr )? ;
or_expr      : and_expr ( OR and_expr )* ;
and_expr     : eq_expr ( AND eq_expr )* ;
eq_expr      : cmp_expr ( ( EQ | NEQ ) cmp_expr )* ;
cmp_expr     : add_expr ( ( GT | GE | LT | LE ) add_expr )* ;
add_expr     : mult_expr ( ( PLUS | MINUS ) mult_expr )* ;
mult_expr    : unary_expr ( ( MUL | DIV | MOD ) unary_expr )* ;
unary_expr   : sqbr_expr | NOT sqbr_expr | PLUS sqbr_expr | MINUS sqbr_expr ;
sqbr_expr    : atom ( LSQBR arith_expr RSQBR )? ;

atom : fun_call | id | literal | LPAR arith_expr RPAR ;
fun_call : id LPAR ( fun_actual_args )? RPAR ;
fun_actual_args : kw_args | pos_args ( COMMA kw_args )? ;
pos_args : arith_expr ( COMMA arith_expr )* ;
kw_args : kw_arg ( COMMA kw_arg )* ;
// An array literal is legal as a keyword-argument VALUE — `input(...,
// options=["close", "high", "low"])` is the standard way to declare a dropdown
// input, and it appears in a large share of published indicators. It is not
// legal as a general expression, so `arith_exprs` is admitted here rather than
// in `atom`.
kw_arg : id DEFINE ( arith_expr | arith_exprs ) ;
literal : num_literal | other_literal ;
num_literal : INT_LITERAL | FLOAT_LITERAL ;
other_literal : STR_LITERAL | BOOL_LITERAL | COLOR_LITERAL ;

id : ID ( DOT ID )* ;
