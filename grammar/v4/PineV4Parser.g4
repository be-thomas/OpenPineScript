// ============================================================================
// Pine Script v4 — PARSER
// ============================================================================
// v4's entire syntactic delta is the DECLARATION form. No new statement, no new
// loop, no new operator — `while` and `switch` are v5, not v4 (see the header of
// PineV4Lexer.g4 and §3b of dev-docs/01-version-delta-spec.md).
//
//     var   float x = na
//     varip int   c = 0
//     series float y = close
//
// Two rules are overridden, for two different reasons:
//
//   1. `var_def` / `var_defs` — to admit the modifier and the type prefix. This
//      is the actual feature.
//
//   2. `id` — to REPAIR damage the new tokens would otherwise do. The v1 base
//      declares `id : ID ( DOT ID )*`, so once `color` lexes as COLOR_TYPE
//      rather than ID, `color.new(...)` and `plot(x, color=red)` both stop
//      parsing. Admitting the type tokens as name parts restores them.
//
//      (2) is not optional and it is not cosmetic: without it, adding the
//      tokens in (1) silently breaks the two most common expressions in the
//      language. It is asserted by conformance/grammar_layering.test.ts.
//
// `options` are NOT inherited from an imported grammar — only the root
// grammar's options apply — so tokenVocab must be restated here, pointing at
// v4's own lexer. Omitting it silently binds v4's parser to v3's token
// numbering, and v4 adds eleven tokens, so every id would shift.
// ============================================================================
parser grammar PineV4Parser;

import PineV3Parser;

options { tokenVocab = PineV4Lexer; }

// --- New in v4 -------------------------------------------------------------

/**
 * `var` initialises once and persists; `varip` additionally survives the
 * intra-bar rollback. Both are modifiers on a declaration, not statements.
 */
decl_mod : VAR | VARIP ;

/**
 * Qualifiers describe WHEN a value is known, not what it holds. Parsed and
 * ignored — this engine evaluates everything as a series, so a qualifier cannot
 * change a result, and rejecting a script for using one would be worse.
 */
type_qual : SERIES | SIMPLE | CONST ;

/**
 * A built-in type, optionally as an ARRAY of that type.
 *
 * From the v4 manual's arrays page: "The `[]` modifier is appended to the type
 * name when declaring arrays", with the syntax
 *
 *     <type>[] <identifier> = <expression>
 *     var <type>[] <identifier> = <expression>
 *
 * The page also says when it is load-bearing rather than decoration: the
 * `<type>[]` part is "redundant, except if you initialize an array variable to
 * `na`" — because `array.new_float(0)` states the type itself and `na` cannot.
 * `float[] prices = na` is the page's own example, and it is the one form that
 * has no other spelling.
 *
 * No ambiguity with history access: `type_name` appears only as the prefix of a
 * declaration, where the next token is the name being declared.
 */
type_name
  : ( INT_TYPE | FLOAT_TYPE | BOOL_TYPE | STRING_TYPE | COLOR_TYPE
    | LINE_TYPE | LABEL_TYPE | BOX_TYPE | TABLE_TYPE
    ) ( LSQBR RSQBR )?
  ;

/**
 * A name PART. VAR and VARIP are absent deliberately: they are reserved words
 * in v4 and may not name anything. The type words are present because they very
 * much do appear in names — `color.new`, `label.new`, `line.get_price`,
 * `input.float`, and the `color=` keyword argument on almost every plot.
 */
id_part
  : ID
  | SERIES | SIMPLE | CONST
  | INT_TYPE | FLOAT_TYPE | BOOL_TYPE | STRING_TYPE | COLOR_TYPE
  | LINE_TYPE | LABEL_TYPE | BOX_TYPE | TABLE_TYPE
  ;

// --- Overrides -------------------------------------------------------------

id : id_part ( DOT id_part )* ;

var_def  : decl_mod? type_qual? type_name? id DEFINE arith_expr ;
var_defs : decl_mod? type_qual? type_name? ids_array DEFINE arith_expr ;

/**
 * `x += expr` and its four siblings.
 *
 * Modelled as a widening of v2's `var_assign` rather than as a new statement,
 * because that is what TradingView says it is:
 *
 *   "A compound assignment operator combines an arithmetic operator with the
 *    reassignment operator. It provides a shorthand way to perform an
 *    arithmetic calculation on a variable and then assign the result back to
 *    that same variable."
 *
 * Everything that already holds for ':=' therefore holds here for free — it is
 * admitted in exactly the same statement positions, and
 * V2ToJsVisitor.enforceDeclaredBeforeReassignment still requires the target to
 * have been declared, which is right: `x += 1` on an undeclared `x` has no
 * previous value to add to.
 */
compound_assign_op : PLUS_ASSIGN | MINUS_ASSIGN | MUL_ASSIGN | DIV_ASSIGN | MOD_ASSIGN ;

var_assign : id ( ASSIGN | compound_assign_op ) arith_expr ;

/**
 * `else if`.
 *
 * Quoted, from the TradingView v4 release notes, May 2020:
 *
 *   "`else if` statement was added"
 *
 * and from the manual's Conditional structures page, which gives the shape:
 *
 *   "if <expression> <local_block> {else if <expression> <local_block>}
 *    [else <local_block>]"
 *
 * Written RECURSIVELY — the else branch is either a block or another `if` —
 * rather than as the `{...}` repetition the manual draws, because that is what
 * `else if` is: `else` followed by an `if`. The two forms accept exactly the
 * same language, and the recursive one hands the emitter a tree whose shape is
 * already the JavaScript it has to produce.
 *
 * Nothing new is needed in the lexer: `else` and `if` are both v1 tokens, and
 * v1 rejects the pair only because its `if_expr` demands a block after `else`.
 *
 * The `LEND*` is the same one v1 needs before a plain `else`, for the same
 * reason: dedenting out of the `then` block emits LEND END LEND, and the
 * trailing LEND is the separator for the level being returned to.
 */
if_expr
  : IF_COND ternary_expr stmts_block ( LEND* IF_COND_ELSE ( if_expr | stmts_block ) )?
  ;

/**
 * A bracketed list as a POSITIONAL argument.
 *
 * Quoted, from the TradingView v4 release notes, May 2020:
 *
 *   "The behavior of `security` function has changed: the `expression`
 *    parameter can be series or tuple."
 *
 * so `security(sym, timeframe.period, [close, open])` is v4 syntax, and the
 * same shape covers an `options` list written positionally —
 * `input.string("FQ", "Period", ["FQ", "FH", "FY"])`.
 *
 * v1 already admits `arith_exprs` as a keyword-argument VALUE, and its header
 * explains why it stops there: a bracketed list is NOT a general expression in
 * Pine, so admitting it to `atom` would make `x = [1, 2]` legal. This widens
 * exactly one more position — an argument — and leaves that reasoning intact.
 *
 * No ambiguity with history access. `a[1]` is a `sqbr_expr`, which requires an
 * atom BEFORE the bracket; an argument that opens with '[' can only be a list.
 */
pos_arg  : arith_expr | arith_exprs ;
pos_args : pos_arg ( COMMA pos_arg )* ;
