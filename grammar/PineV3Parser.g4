// ============================================================================
// Pine Script v3 — PARSER
// ============================================================================
// v3 adds no syntax over v2; every rule is inherited unchanged.
//
// v3's headline change — ':=' available at every scope rather than only on a
// for-loop accumulator — is NOT a grammar change. The rule already parses from
// v2; what changes is that V3ToJsVisitor overrides enforceNoReassignment to a
// no-op. Scope is invisible to a grammar, so it could not have been expressed
// here in the first place.
//
// `options` are NOT inherited from an imported grammar — only the root grammar's
// options apply — so tokenVocab must be restated here, pointing at v3's own
// lexer. Omitting it silently binds v3's parser to v2's token numbering.
// ============================================================================
parser grammar PineV3Parser;

import PineV2Parser;

options { tokenVocab = PineV3Lexer; }
