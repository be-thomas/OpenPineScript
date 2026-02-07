# Pine Script Parser (ANTLR)

Parser and lexer for Pine Script v2, generated from the ANTLR v4 grammars in `grammar/`.

- **Lexer**: `grammar/PineScriptLexer.g4` → `generated/PineScriptLexer.ts`
- **Parser**: `grammar/PineScriptParser.g4` → `generated/PineScriptParser.ts`

Regenerate after grammar changes:

```bash
npm run generate:parser
```

Parse from string (Node):

```bash
npm run parse [file.pine]
```

Use programmatically:

```ts
import { parse } from "./parser/v2/parse";

const { tree, errorCount } = parse("a = 1\n");
```

## Indentation

The grammar expects `<BEGIN>` / `<END>` tokens for indented blocks (e.g. `if`/`for` bodies). The ANTLR lexer does not emit these; it emits `LBEG` (leading spaces) and `WS` (skipped). Fixtures that rely on indentation may report syntax errors until the lexer or a wrapper adds indent/dedent tokens.

## License

MIT. See repository root.
