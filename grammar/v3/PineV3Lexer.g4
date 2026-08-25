// ============================================================================
// Pine Script v3 — LEXER
// ============================================================================
// v3 introduces no new tokens. Its changes are semantic: self- and forward-
// reference become errors, bools stop coercing to numbers, a ':='-mutated
// variable may not be passed to security(), and security()'s lookahead default
// flips. ':=' arrives in v2 and is inherited unchanged.
//
// The file exists anyway, and is NOT collapsed into v2, because every version
// owns its own grammar in this hierarchy. When a v3-only token is discovered,
// it is added HERE and nowhere else — no edit to v1 or v2 is required.
// ============================================================================
lexer grammar PineV3Lexer;

import PineV2Lexer;
