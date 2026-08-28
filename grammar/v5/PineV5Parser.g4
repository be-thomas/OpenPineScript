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
 * `enum Name` + an indented list of fields.
 *
 * Quoted, from the manual's Enums page:
 *
 *   [export ]enum <enumName>
 *       <field_1>[ = <title_1>]
 *       <field_2>[ = <title_2>]
 *       ...
 *
 * The title is optional — "If the programmer does not specify a field's title,
 * its title is the 'string' representation of its name" — which is why the
 * `DEFINE arith_expr` is.
 *
 * The same shape as `type_def_stmt`, deliberately: an enum is a list of named
 * things under a header, and reusing the shape means reusing the indentation
 * handling that already works for one.
 */
enum_def_stmt : ENUM id enum_body ;
enum_body : BEGIN ( enum_field | LEND )+ END ;
enum_field : id ( DEFINE arith_expr )? ;

/**
 * `export` marks a declaration as a library's public surface. It attaches to a
 * function, a method or a type, and changes nothing about how any of them is
 * written.
 */
export_stmt : EXPORT ( type_def_stmt | enum_def_stmt | method_def_stmt | fun_def_stmt ) ;

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

/**
 * `for … in` — iterate a collection rather than a numeric range.
 *
 * Quoted, from the manual's Loops page:
 *
 *   "[variables = | :=] for item in collection_id
 *        statements | continue | break
 *        return_expression"
 *
 *   "[variables = | :=] for [index, item] in collection_id"
 *
 * The two forms differ only in the loop variable, so one rule covers both:
 * `id` is the single-variable form and `ids_array` is the `[index, item]` one,
 * and `ids_array` is v1's own rule — the `[a, b]` of a tuple declaration has
 * exactly this shape.
 *
 * The leading `[variables = | :=]` of the quoted syntax is not written here.
 * It is not part of the loop: it is the ordinary `var_def` / `var_assign` that
 * surrounds any expression, and admitting `for_in_expr` to `arith_expr` below
 * is what makes it reachable there.
 *
 * The collection is a `ternary_expr`, matching v1's `for_expr` bounds rather
 * than the wider `arith_expr` — a nested `if` or `for` in the collection slot
 * is not something a script can mean.
 */
for_in_expr : FOR_STMT ( ids_array | id ) IN ternary_expr stmts_block ;

// --- Overrides -------------------------------------------------------------

/**
 * A method call CHAINED onto the result of another call.
 *
 * Quoted, from the manual's Methods page:
 *
 *   "We are able to call `copy()`, `fill()`, and `avg()` successively on the
 *    same line of code because the first two methods return an `array<float>`
 *    instance."
 *
 *     srcArray.copy().fill(1.0, 0.0, min, val).avg()
 *     m.get(0, 0).set_x(bar_index)
 *
 * A separate rule rather than a wider `id`, because the receiver here is a
 * VALUE — the previous call's result — and not a name. The emitter needs that
 * distinction: `m.get(0, 0)` is a method call whose receiver is `m`, and
 * `.set_x(...)` is a method call whose receiver is whatever that returned.
 *
 * No ambiguity with a dotted callee. `id` is greedy, so `a.b(1)` still parses
 * as one id `a.b` followed by an argument list; this rule can only start after
 * a closing parenthesis.
 */
call_suffix : DOT id type_args? LPAR ( fun_actual_args )? RPAR ;

fun_call : id type_args? LPAR ( fun_actual_args )? RPAR call_suffix* ;

/**
 * A dotted name may END in one of v5's declaration keywords.
 *
 * `syminfo.type` is the case that matters — it is a live built-in, used in six
 * of TradingView's own v5 examples — and PineV5Lexer.g4 records the trade that
 * made it unparseable: `type` had to become a token so `type Point` could be
 * told from two identifiers, which stopped `type` from lexing as an ID.
 *
 * Admitting these words only AFTER a dot recovers the built-in without undoing
 * the trade. The FIRST part of a name is still an ordinary `id_part`, so
 * `type Point` cannot be read as a name, and `type = 5` stays the error it
 * should be: v5 reserves the word.
 */
id : id_part ( DOT ( id_part | TYPE | METHOD | IMPORT | EXPORT | ENUM ) )* ;

// A statement may now also DECLARE a type, a method, a library export, or a
// library import. The two inherited alternatives are kept, in the same order.
stmt
  : import_stmt | export_stmt | type_def_stmt | enum_def_stmt | method_def_stmt
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
  | for_expr | for_in_expr | while_expr | switch_expr
  | loop_break | loop_continue | arith_expr
  ;

local_stmt_content
  : var_def | var_defs | arith_expr | arith_exprs | var_assign
  | while_expr
  | loop_break | loop_continue
  ;

// `switch` and `for … in` join `if` and `for` as constructs that are both a
// statement and an expression; `while` deliberately does not.
//
// `local_stmt_content` needs no `for_in_expr` alternative of its own: it
// reaches one through `arith_expr`, exactly as it already reaches `for_expr`.
arith_expr : ternary_expr | if_expr | for_expr | for_in_expr | switch_expr ;
