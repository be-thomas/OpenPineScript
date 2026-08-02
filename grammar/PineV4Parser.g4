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

type_name
  : INT_TYPE | FLOAT_TYPE | BOOL_TYPE | STRING_TYPE | COLOR_TYPE
  | LINE_TYPE | LABEL_TYPE | BOX_TYPE | TABLE_TYPE
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
