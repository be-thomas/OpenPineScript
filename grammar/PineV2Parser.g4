// ============================================================================
// Pine Script v2 — PARSER
// ============================================================================
// v2's only syntactic addition is reassignment: `x := expr`.
//
// Two things happen below, and they are the canonical shape of a version delta:
//
//   1. A NEW rule (`var_assign`) is declared. Nothing inherited changes.
//   2. Two inherited rules are OVERRIDDEN to admit it. An override REPLACES the
//      base rule wholesale — ANTLR has no "append an alternative" syntax — so
//      the base alternatives must be restated verbatim alongside the new one.
//
// Because of (2), an override is the one place this hierarchy can silently
// drift from its base: if PineV1Parser gains an alternative in
// `global_stmt_content`, this copy will not pick it up. That is checked
// executably by conformance/grammar_layering.test.ts, which asserts each
// overridden rule still covers every alternative its base declares.
//
// WHAT A GRAMMAR CANNOT SEE. ':=' takes any scope in v2 — there is no scope
// restriction to express here or anywhere else. The one rule it does carry is
// that the target must already be declared, which is a whole-script fact rather
// than a syntactic one, so `x := 1` PARSES here and
// V2ToJsVisitor.enforceDeclaredBeforeReassignment decides it. v3 inherits that
// guard unchanged.
//
// `options` are NOT inherited from an imported grammar — only the root grammar's
// options apply — so tokenVocab must be restated here, pointing at v2's own
// lexer. Omitting it silently binds v2's parser to v1's token numbering.
// ============================================================================
parser grammar PineV2Parser;

import PineV1Parser;

options { tokenVocab = PineV2Lexer; }

// --- New in v2 -------------------------------------------------------------
var_assign : id ASSIGN arith_expr ;

// --- Overrides: base alternatives restated, plus var_assign ----------------
global_stmt_content
  : var_def | var_defs | fun_call | if_expr | var_assign
  | for_expr | loop_break | loop_continue | arith_expr
  ;

local_stmt_content
  : var_def | var_defs | arith_expr | arith_exprs | var_assign
  | loop_break | loop_continue
  ;
