// ============================================================================
// Pine Script v2 — LEXER
// ============================================================================
// v2 introduces the reassignment operator ':='.
//
// WHY THIS RULE LIVES HERE AND NOT IN THE v1 BASE
// ANTLR resolves lexer ambiguity by rule order, and rules declared in an
// IMPORTING grammar are matched BEFORE inherited ones. So declaring ASSIGN here
// makes ':=' win over the inherited COND_ELSE ':' — automatically, with no edit
// to any other version's file.
//
// The payoff is version-accurate behaviour: v1 genuinely does not know the
// token, so `x := 1` lexes there as COND_ELSE DEFINE and fails to PARSE. Putting
// ':=' in the base and rejecting it later would have been a lie about what v1 is.
//
// SOURCING NOTE — which version introduced ':='
// Quoted, from the TradingView release notes entry for Pine Script v2:
//
//   "Pine has graduated to v2! The new version of Pine Script added support for
//    `if` statements, making it easier to write more readable and concise code."
//   "`for` loops and keywords `break` and `continue` were added."
//   "Pine now supports mutable variables! Use the `:=` operator to assign a new
//    value to a variable that has already been defined."
//
// So ASSIGN belongs at v2, not v1 — and the restriction it carries is a
// DECLARATION rule ("a variable that has already been defined"), not a scope
// rule. The scope restriction this project used to enforce was invented; see the
// header of transpiler/v2/ToJsVisitor.ts for what it rejected.
// ============================================================================
lexer grammar PineV2Lexer;

import PineV1Lexer;

ASSIGN : ':=' ;
