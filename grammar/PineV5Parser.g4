// ============================================================================
// Pine Script v5 — PARSER
// ============================================================================
// v5's syntactic delta is two control structures: `while` and `switch`.
// Everything else v5 changed is a NAME — `ta.sma`, `math.abs`, `indicator` —
// and the inherited `id` rule already parses dotted names, so none of it
// reaches the grammar.
//
// ── while is a STATEMENT, switch is an EXPRESSION ───────────────────────────
//
// The distinction is TradingView's, not a convenience: `while` evaluates to
// nothing and may not be bound, whereas `switch` is routinely written as
//
//     dir = switch signal
//         1  => "long"
//         -1 => "short"
//         => "flat"
//
// So `while_expr` is admitted only in the two *_stmt_content rules, and
// `switch_expr` is additionally an alternative of `arith_expr`. Putting `while`
// in `arith_expr` would accept `x = while ...`, which TradingView rejects.
//
// ── Why switch_case takes an optional subject ───────────────────────────────
//
// v5 has two switch forms and they differ only in whether an expression
// follows the keyword:
//
//     switch x        with a subject: each case value is compared to x
//         1 => ...
//
//     switch          without one:   each case is a condition in its own right
//         x > 5 => ...
//
// and in BOTH forms the final case may drop its label entirely to become the
// default (`=> ...`). One rule covers all of it: `ternary_expr? ARROW body`.
// Which of the two comparisons a case means is decided by the emitter, which
// can see whether the switch had a subject.
//
// ── options are not inherited ───────────────────────────────────────────────
//
// Only the ROOT grammar's `options` apply, so tokenVocab must be restated here
// pointing at v5's own lexer. Omitting it silently binds this parser to v4's
// token numbering, and v5 adds two tokens, so every id would shift.
// ============================================================================
parser grammar PineV5Parser;

import PineV4Parser;

options { tokenVocab = PineV5Lexer; }

// --- New in v5 -------------------------------------------------------------

/**
 * `while cond` + an indented block. Unlike `for`, the bound is re-evaluated
 * every pass, so the emitter has to guard against a condition that never goes
 * false — see V5ToJsVisitor.visitWhile_expr.
 */
while_expr : WHILE ternary_expr stmts_block ;

/**
 * `switch` with or without a subject.
 *
 * The body is its own rule rather than `stmts_block` because a case is not a
 * statement: `1 => "one"` has no meaning outside a switch, and admitting it
 * into `local_stmt_content` would make a stray `=> x` legal anywhere a
 * statement is.
 */
switch_expr : SWITCH ternary_expr? switch_body ;

switch_body : BEGIN ( switch_case | LEND )+ END ;

/**
 * One arm. The label is optional — a label-less arm is the DEFAULT.
 *
 * The body is either on the same line (`1 => "one"`) or an indented block
 * beneath it, and Pine allows both in the same switch.
 */
switch_case : ternary_expr? ARROW ( local_stmt_singleline | stmts_block ) ;

// --- User-defined types, methods, libraries --------------------------------

/**
 * A TYPE, as written in a declaration position.
 *
 *     float x                 a built-in type word (v4's tokens)
 *     Point p                 a user-defined type — an ordinary identifier
 *     array<float> xs         either of the above, parameterised
 *
 * `(type_name | id)` rather than just `id` because v4 turned the built-in type
 * words into their own tokens, so `float` no longer lexes as an ID.
 */
field_type : ( type_name | id ) type_args? ;

/**
 * `type Name` + an indented list of fields.
 *
 *     type Point
 *         float x
 *         float y = 0.0
 *
 * A field's default is optional; a field with none starts as `na`.
 */
type_def_stmt : TYPE id type_body ;
type_body : BEGIN ( type_field | LEND )+ END ;
type_field : type_qual? field_type id ( DEFINE arith_expr )? ;

/**
 * `method name(Receiver self, …) => …`.
 *
 * The body is an ORDINARY function definition — a method is a function whose
 * first parameter is the receiver, and Pine lets you call it either way
 * (`r.area()` and `area(r)` are the same call). Reusing `fun_def_stmt` here is
 * therefore not a shortcut; it is the shape of the feature.
 */
method_def_stmt : METHOD fun_def_stmt ;

/**
 * `export` marks a declaration as a library's public surface. It attaches to a
 * function, a method or a type, and changes nothing about how any of them is
 * written.
 */
export_stmt : EXPORT ( type_def_stmt | method_def_stmt | fun_def_stmt ) ;

/**
 * `import user/library/version as alias`.
 *
 * The path is slash-separated, so it lexes as ID DIV ID DIV INT_LITERAL — the
 * same tokens as a division. Nothing else can start with IMPORT, so there is no
 * ambiguity to resolve.
 */
import_stmt : IMPORT import_path ( AS id )? ;
import_path : id ( DIV ( id | INT_LITERAL | FLOAT_LITERAL ) )* ;

/**
 * One parameter of a function or method.
 *
 * v5 allows a parameter to carry a TYPE and a DEFAULT — `f(float x, int n = 2)`
 * — and a method's first parameter must carry the receiver's type. Both are
 * parsed; the type is checked for well-formedness and then discarded, because
 * this engine evaluates everything as a series and a type annotation cannot
 * change a result.
 */
fun_param : type_qual? field_type? id ( DEFINE arith_expr )? ;

/**
 * A collection constructor's TYPE ARGUMENTS — `matrix.new<float>(2, 3)`,
 * `map.new<string, int>()`, `array.new<float>(0)`.
 *
 * v5's collections are typed at construction and there is no other way to build
 * a map or a matrix, so without this rule those namespaces are unreachable
 * however completely they are implemented.
 *
 * ── Why '<' is safe to admit here ───────────────────────────────────────────
 *
 * LT is also the less-than operator, so `id LT` is ambiguous in principle. It
 * is not in practice: this rule requires a TYPE NAME after the '<', and
 * `type_name` is the keyword-token set v4 introduced (int, float, bool, string,
 * color, line, label, box, table). Those words cannot name a variable at v4 or
 * v5, so `x < float` is not something a script can mean. Anything else after
 * the '<' — a literal, an ordinary identifier — fails this rule immediately and
 * parses as the comparison it is.
 */
type_args : LT type_arg ( COMMA type_arg )* GT ;

/** A built-in type word, or a user-defined type's name. */
type_arg : type_name | id ;

// --- Overrides -------------------------------------------------------------

fun_call : id type_args? LPAR ( fun_actual_args )? RPAR ;

// A statement may now also DECLARE a type, a method, a library export, or a
// library import. The two inherited alternatives are kept, in the same order.
stmt
  : import_stmt | export_stmt | type_def_stmt | method_def_stmt
  | fun_def_stmt | global_stmt
  ;

// Parameters gain an optional type and an optional default.
fun_head : LPAR ( fun_param ( COMMA fun_param )* )? RPAR ;

// v4's `type_name?` prefix widens to a full `field_type`, so a declaration can
// name a user type or a parameterised collection:
//
//     Point  p  = Point.new(1, 2)
//     array<float> xs = array.new<float>(0)
var_def  : decl_mod? type_qual? field_type? id DEFINE arith_expr ;
var_defs : decl_mod? type_qual? field_type? ids_array DEFINE arith_expr ;

// `as` is a name part so that a script may still bind a variable called `as`;
// the other four v5 keywords are deliberately absent (see PineV5Lexer.g4).
id_part
  : ID
  | SERIES | SIMPLE | CONST
  | INT_TYPE | FLOAT_TYPE | BOOL_TYPE | STRING_TYPE | COLOR_TYPE
  | LINE_TYPE | LABEL_TYPE | BOX_TYPE | TABLE_TYPE
  | AS
  ;


global_stmt_content
  : var_def | var_defs | fun_call | if_expr | var_assign
  | for_expr | while_expr | switch_expr
  | loop_break | loop_continue | arith_expr
  ;

local_stmt_content
  : var_def | var_defs | arith_expr | arith_exprs | var_assign
  | while_expr
  | loop_break | loop_continue
  ;

// `switch` joins `if` and `for` as a construct that is both a statement and an
// expression; `while` deliberately does not.
arith_expr : ternary_expr | if_expr | for_expr | switch_expr ;
