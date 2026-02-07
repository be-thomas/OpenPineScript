# PineScript ANTLR 4 Grammar

This directory contains the ANTLR 4 grammar for PineScript v2. The parser is generated from these sources and used by the runtime.

## Layout

- **v2/PineScriptLexer.g4** – Lexer rules (keywords, operators, literals, `LBEG`/`LEND`, etc.).
- **v2/PineScriptParser.g4** – Parser rules (statements, expressions, precedence). Uses `tokenVocab = PineScriptLexer`.

Grammars live under `grammar/v2/`.

## Generate the parser

From the project root:

```bash
npm run generate:parser
```

Output is written to `parser/v2/generated/` (Lexer, Parser, Visitor). You need **Node.js 20+** and the `antlr-ng` CLI (installed via `npm install`).

## Run a quick parse

```bash
npm run parse              # parses inline "x=1\n"
npm run parse -- file.pine  # parses a file
```

## Lexer note

The built-in lexer is minimal. It treats any run of spaces/tabs as `LBEG`, so inputs **without spaces** (e.g. `x=1\n`) parse cleanly. For full Pine (indentation, `BEGIN`/`END`/`PLEND`/`EMPTY_LINE` from your two-pass lexer), you can either:

1. Extend the `.g4` lexer with modes for line-start vs in-line, or  
2. Keep using the project’s existing lexer and feed its tokens into the ANTLR parser via a custom `TokenStream` / `TokenSource` adapter.

## Reference

The parser structure follows the **PineScript v2 ANTLR v3 grammar** (see `parser/v2/README.md`). Tree rewrites (`->`) were removed; use the generated visitor to build an AST from the parse tree.
