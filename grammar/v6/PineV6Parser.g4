// ============================================================================
// Pine Script v6 — PARSER
// ============================================================================
// v6's syntactic delta is small, and smaller than the migration guide makes it
// look. Most of what the guide calls a change is a RULE about a tree this
// grammar already produces:
//
//   "int and float are no longer implicitly cast to bool"   a type check
//   "int / int is always fractional"                        an emit decision
//   "and/or are lazily evaluated"                           an emit decision
//   "the same named parameter twice is an error"            a check over kw_args
//   "[] may not apply to a literal"                         a check over atom
//
// None of those has a new shape, so none of them is here. They are in
// transpiler/v6/ToJsVisitor.ts, where the emitter can see enough context to
// give the author a message naming the line.
//
// WHAT IS HERE
//
// Two additions from the release notes, both with a shape of their own:
//
//   once          August 2026 — a block that runs the first time its
//                 condition holds, and never again
//   """ / '''     April 2026 — strings that may span lines
//
// ── Only the ROOT grammar's options apply ──────────────────────────────────
//
// tokenVocab must be restated pointing at v6's own lexer. Omitting it silently
// binds this parser to v5's token numbering, and v6 adds three tokens, so
// every inherited id would shift and the parser would read the wrong words.
// ============================================================================
parser grammar PineV6Parser;

import PineV5Parser;

options { tokenVocab = PineV6Lexer; }

// --- New in v6 -------------------------------------------------------------

/**
 * `once [<condition>]` + an indented block.
 *
 * From the manual's Conditional structures page: the template is
 * `once [<condition>]`, the condition "is optional and defaults to true", and
 * the block runs the first time the condition is true and "then never again
 * after that".
 *
 * A STATEMENT and not an expression, like `while` and unlike `switch`. The
 * manual is explicit that a script cannot assign a `once` structure, or a call
 * to a function ending in one, to a variable — that is a compile error there —
 * so it is not admitted to `arith_expr`.
 *
 * `ternary_expr?` cannot swallow the block: the block opens with the synthetic
 * BEGIN token, which no expression rule starts with.
 */
once_expr : ONCE ternary_expr? stmts_block ;

// --- Overrides -------------------------------------------------------------

/**
 * A string literal may now be triple-quoted.
 *
 * Overriding `other_literal` rather than the lexer's STR_LITERAL keeps the two
 * kinds distinguishable in the tree. They are not the same value: a multiline
 * literal's text includes the newlines the author wrote, and the emitter has
 * to strip three delimiters rather than one. A single token alternation would
 * hand the emitter a string it could not tell apart without re-reading the
 * quotes.
 *
 * Inherited alternatives first and in their original order, so a v5 script's
 * parse is bit-for-bit what it was.
 */
other_literal
  : STR_LITERAL | BOOL_LITERAL | COLOR_LITERAL
  | MLSTRING_DQ | MLSTRING_SQ
  ;

/**
 * `once` joins the statement constructs at both scopes.
 *
 * Both inherited rules are restated whole, with the new alternative appended
 * and every existing one left in its original position. ANTLR resolves
 * alternatives in order, so reordering them would change which rule wins for
 * an input two of them can match — a silent reparse of valid v5 code.
 */
global_stmt_content
  : var_def | var_defs | fun_call | if_expr | var_assign
  | for_expr | for_in_expr | while_expr | switch_expr
  | once_expr
  | loop_break | loop_continue | arith_expr
  ;

local_stmt_content
  : var_def | var_defs | arith_expr | arith_exprs | var_assign
  | while_expr
  | once_expr
  | loop_break | loop_continue
  ;

/**
 * `once` is not admitted to `id_part`, for the reason v5's own keywords are
 * not: admitting a reserved word as a name fragment un-reserves it. A v6
 * script may not bind a variable called `once`, which is precisely what
 * reserving the word means.
 *
 * It IS admitted after a dot, alongside v5's declaration keywords, so a future
 * built-in whose tail is `once` stays reachable — the same recovery
 * `syminfo.type` needed at v5.
 */
id : id_part ( DOT ( id_part | TYPE | METHOD | IMPORT | EXPORT | ENUM | ONCE ) )* ;

/**
 * A library may export a CONSTANT.
 *
 * Release notes, June 2025: "Libraries can export variables declared with
 * const if their type is "int", "float", "bool", "color", or "string".
 * Syntax: export const <type> <NAME> = <value>."
 *
 * `var_def` already parses `const int NAME = 5` — v4 made `const` a type
 * qualifier — so the grammar only has to let `export` precede it. That the
 * qualifier IS `const`, and the type one of the five, are rules about a tree
 * this parses, checked in transpiler/v6/ToJsVisitor.ts where the message can
 * say which.
 */
export_stmt : EXPORT ( type_def_stmt | enum_def_stmt | method_def_stmt | fun_def_stmt | var_def ) ;
