// ============================================================================
// Pine Script v4 — LEXER
// ============================================================================
// v4 is the first version since v2 to add SYNTAX rather than only semantics.
//
// WHAT IT ADDS, AND WHAT IT DOES NOT
//
// An earlier draft of dev-docs/01-version-delta-spec.md listed `while` and
// `switch` as v4 additions. Both are wrong — neither appears in the v4 release
// notes or the v4 manual, and both are listed as v5 additions. v4's only loop is
// `for`, inherited from v2.
//
// So v4 adds NO new statement keyword. Its entire syntactic delta is on the
// DECLARATION form:
//
//     var   float x = na          // 'var' (June 2019) + a type prefix
//     varip int   n = 0           // 'varip' (March 2021)
//
// Everything else v4 gained — arrays (September 2020), line/label (June 2019),
// box/table (May 2021) — arrives as ordinary `namespace.function(...)` calls,
// which the inherited grammar already parses. They are runtime work, not
// grammar work.
//
// WHY THE TYPE NAMES ARE TOKENS
//
// `id : ID ( DOT ID )*` in the v1 base, so a keyword token for `float` would
// stop `input.float` from lexing as one id — it would become ID DOT FLOAT.
// PineV4Parser.g4 therefore overrides `id` to admit these tokens as name parts.
// Without that override, adding a token here silently breaks every dotted name
// whose tail happens to be a type word.
//
// Rules declared in an IMPORTING grammar are matched BEFORE inherited ones, so
// each token below wins over the inherited ID with no edit to v1, v2 or v3.
// ============================================================================
lexer grammar PineV4Lexer;

import PineV3Lexer;

// --- Declaration modifiers -------------------------------------------------
VAR   : 'var'   ;
VARIP : 'varip' ;

// --- Type qualifiers -------------------------------------------------------
// `series`/`simple`/`const` describe WHEN a value is known, not what it holds.
// This engine parses them and otherwise ignores them: it evaluates everything
// as a series, so a qualifier cannot change a result. Rejecting a script for
// using one would be worse than ignoring it.
SERIES : 'series' ;
SIMPLE : 'simple' ;
CONST  : 'const'  ;

// --- Type names ------------------------------------------------------------
// `input` is deliberately ABSENT. It is a qualifier in v4's type grammar, but
// it is also the name of the most-called function in the language, and `id`
// admitting it as a name part is not enough — `input(1)` and `input x = 1`
// would need one token to serve both. No harness needs the qualifier; every
// script needs the function.
INT_TYPE    : 'int'    ;
FLOAT_TYPE  : 'float'  ;
BOOL_TYPE   : 'bool'   ;
STRING_TYPE : 'string' ;
COLOR_TYPE  : 'color'  ;
LINE_TYPE   : 'line'   ;
LABEL_TYPE  : 'label'  ;
BOX_TYPE    : 'box'    ;
TABLE_TYPE  : 'table'  ;
