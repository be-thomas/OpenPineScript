// ============================================================================
// Pine Script v3 — LEXER
// ============================================================================
// v3 introduces no new tokens. Its changes are semantic: ':=' becomes available
// at every scope (a visitor override, not a token), self- and forward-reference
// become errors, bools stop coercing to numbers, and security()'s lookahead
// default flips.
//
// The file exists anyway, and is NOT collapsed into v2, because every version
// owns its own grammar in this hierarchy. When a v3-only token is discovered,
// it is added HERE and nowhere else — no edit to v1 or v2 is required.
// ============================================================================
lexer grammar PineV3Lexer;

import PineV2Lexer;
