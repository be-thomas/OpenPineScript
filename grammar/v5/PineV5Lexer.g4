// ============================================================================
// Pine Script v5 — LEXER
// ============================================================================
// v5 is overwhelmingly a RENAMING release: `sma` became `ta.sma`, `abs` became
// `math.abs`, `security` became `request.security`, `study` became
// `indicator`. None of that is lexical — a dotted name already lexes as one id
// through the inherited `id` rule — so the token delta is tiny.
//
// WHAT IT ADDS
//
//     while cond                 // loop until the condition goes false
//         ...
//
//     x = switch expr            // multi-way branch, as an EXPRESSION
//         1 => "one"
//         2 => "two"
//         => "other"
//
// Both were listed as v4 additions in an early draft of
// dev-docs/01-version-delta-spec.md. Neither appears in the v4 release notes or
// the v4 manual; both are documented v5 additions. See §3b of that document.
//
// WHAT IT DOES NOT ADD, AND WHY
//
// v5's RESERVED WORDS — catch, class, do, ellipse, in, is, polygon, range,
// return, struct, text, throw, try — are deliberately NOT tokens.
//
// Making them tokens would break the language rather than restrict it. `text`
// is a live namespace in v4 and v5 (`text.align_left` parameterises every
// label), and `range` and `return` would have to be re-admitted as `id_part`
// name fragments anyway. The rule they express is "you may not NAME something
// this", which is a rule about DECLARATIONS, not about lexing — so it is a
// guard in transpiler/v5/ToJsVisitor.ts, where it can see whether the word is
// being bound or merely read.
//
// UDTs (`type`), methods (`method`), and libraries (`import` / `export`) are
// not here either. Those are not implemented at v5 — see the header of
// transpiler/v5/ToJsVisitor.ts — and adding their keywords without their
// semantics would turn "this engine does not support it" into a parse that
// emits something the author did not write.
//
// Rules declared in an IMPORTING grammar are matched BEFORE inherited ones, so
// both tokens below win over the inherited ID with no edit to v1–v4.
// ============================================================================
lexer grammar PineV5Lexer;

import PineV4Lexer;

// --- Statement keywords ----------------------------------------------------
WHILE  : 'while'  ;
SWITCH : 'switch' ;

// --- Declaration keywords (UDTs, methods, libraries) -----------------------
//
// These are NOT admitted to `id_part` in PineV5Parser.g4, unlike v4's type
// words. The trade is deliberate:
//
//   admitting them   `type Point` becomes ambiguous with the two-identifier
//                    statement `type Point`, and the parser has to guess
//   excluding them   a dotted name whose tail is one of these words — the only
//                    real one is `syminfo.type` — fails to parse
//
// `syminfo.type` is not in this engine's registry at any version, so it was
// already unusable; a parse error is a worse message than "not a namespace
// member" but a better outcome than a mis-parsed type declaration.
TYPE   : 'type'   ;
METHOD : 'method' ;
IMPORT : 'import' ;
EXPORT : 'export' ;

// `as` IS admitted to `id_part`. It appears only in `import … as alias`, where
// nothing else can follow the path, and excluding it would stop a script
// binding a variable called `as` — which v1–v4 allow and v5 does not reserve.
AS : 'as' ;
