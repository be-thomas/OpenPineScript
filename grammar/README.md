# Pine Script ANTLR 4 Grammars

One grammar pair per Pine Script version, arranged as an inheritance chain:
**v1 is the base, and each later version imports the one before it and declares
only its own delta.** See [dev-docs/00-architecture-assessment.md](../dev-docs/00-architecture-assessment.md) §5.

## Layout

| File | Role |
|---|---|
| `PineV1Lexer.g4` / `PineV1Parser.g4` | **The base.** Pine Script v1 and nothing else. |
| `PineV2Lexer.g4` / `PineV2Parser.g4` | `import PineV1*`. Adds `ASSIGN : ':='` and the `var_assign` rule. |
| `PineV3Lexer.g4` / `PineV3Parser.g4` | `import PineV2*`. No new syntax — v3's changes are semantic. |

Two rules govern edits:

1. **Only add to a version's file what that version introduced.** v1 has no
   `':='` token, so `x := 1` is a *syntax error* at v1 — which is what
   TradingView reports. Adding it to the base and rejecting it later would
   misrepresent v1.
2. **Rules declared in an importing grammar are matched BEFORE inherited ones.**
   That is what lets `PineV2Lexer` declare `':='` and have it beat the inherited
   `':'`, with no edit to v1.

### Why one flat directory

ANTLR resolves an `import` against `--lib` and the importing grammar's own
directory only — never transitively. A `grammar/v3/` importing `PineV2Lexer`
from `grammar/v2/` fails to resolve `PineV1Lexer` in turn. The layering is
carried by the `import` statements, not by folders.

## Generate the parser

From the project root:

```bash
npm run generate:parser
```

Output is written to `parser/v1/generated/`, `parser/v2/generated/` and
`parser/v3/generated/` (Lexer, Parser, Visitor per version). You need **Node.js 20+** and the `antlr-ng` CLI (installed via `npm install`).

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
