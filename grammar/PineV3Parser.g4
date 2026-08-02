// ============================================================================
// Pine Script v3 — PARSER
// ============================================================================
// v3 adds no syntax over v2; every rule is inherited unchanged.
//
// v3's changes are all SEMANTIC, and all tightenings: self- and forward-
// reference become errors, bools stop coercing to numbers, and a ':='-mutated
// variable may not be passed to security(). Each is a guard in
// V3ToJsVisitor. ':=' itself, operator and rules alike, comes from v2 untouched.
//
// `options` are NOT inherited from an imported grammar — only the root grammar's
// options apply — so tokenVocab must be restated here, pointing at v3's own
// lexer. Omitting it silently binds v3's parser to v2's token numbering.
// ============================================================================
parser grammar PineV3Parser;

import PineV2Parser;

options { tokenVocab = PineV3Lexer; }
