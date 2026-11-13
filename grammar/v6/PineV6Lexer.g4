// ============================================================================
// Pine Script v6 — LEXER
// ============================================================================
// v6's headline changes are SEMANTIC, not lexical. "int and float are no
// longer implicitly cast to bool", "int / int is always fractional", "and/or
// are lazily evaluated" — none of those is a token. They are decided in
// transpiler/v6/ToJsVisitor.ts, over a tree this grammar already produces.
//
// WHAT IT ADDS
//
// Two things, both from the release notes rather than the migration guide:
//
//     once close > ta.sma(close, 20)    // August 2026: run the body the
//         label.new(...)                 // first time the condition holds
//
//     s = """line one            // April 2026: strings that span lines
//            line two"""
//
// `once` is a keyword, so `once` cannot name a variable in v6 — the same trade
// v5 made for `while` and `switch`. It is NOT admitted to `id_part`: admitting
// a reserved word as a name fragment un-reserves it.
//
// Multiline strings need their own token because the inherited STRING rule
// stops at a newline — deliberately, since Pine strings have never spanned
// lines and letting one swallow the rest of the file turns a missing quote
// into a parse error hundreds of lines away. The triple-quoted rules are
// declared BEFORE anything can shadow them, and a rule in an importing grammar
// is matched before the inherited one, so `"""` wins over STRING's `"` with no
// edit to v1–v5.
//
// WHAT IT DOES NOT ADD
//
// The December 2025 relaxation — "wrapped lines inside parentheses may use any
// indentation" — is not lexical either, despite looking like it. Indentation
// is synthesised by lexer/v1/IndentTokenSource.ts, not by a grammar rule, so
// the change lands there, gated on version. See lexer/v6/PineV6TokenSource.ts.
// ============================================================================
lexer grammar PineV6Lexer;

import PineV5Lexer;

// --- `once` ----------------------------------------------------------------
//
// Release notes, August 2026: "a conditional structure that executes a block
// of code when its condition evaluates to true", and then never again — the
// `var bool fired = false` idiom, as a keyword.
ONCE : 'once' ;

// --- Multiline strings -----------------------------------------------------
//
// Release notes, April 2026: `"""` and `'''` delimit a string that may contain
// newlines. Both spellings exist, matching the single-quote/double-quote pair
// Pine has always had, and each is terminated only by its own delimiter — so a
// `'''` string may contain a bare `"""` and vice versa.
//
// Non-greedy, so the FIRST closing delimiter ends the string rather than the
// last one in the file. Escapes are handled the same way the inherited STRING
// rule handles them: a backslash consumes the next character whatever it is,
// which is what lets `\"""` appear inside a `"""` string.
MLSTRING_DQ : '"""' ( '\\' . | . )*? '"""' ;
MLSTRING_SQ : '\'\'\'' ( '\\' . | . )*? '\'\'\'' ;
