# Tests v2

All v2 tests live under this folder, grouped by component. They give good coverage of lexer tokens and parser rules.

## Layout

- **lexer/** – Lexer tests (tokenize `.pine` fixtures, assert token types/values).
- **parser/** – Parser tests (ANTLR: parse fixtures, assert no syntax errors and structure).
- **transpiler/** – Transpiler tests (placeholder until wired to ANTLR).

Each of `lexer`, `parser`, and `transpiler` has:

- `fixtures/` – `.pine` source files used as input.
- `*.test.ts` – Test file run by Node’s built-in test runner.

## Coverage

**Lexer (ANTLR):** Keywords, operators, literals, LEND/LBEG, calls/brackets. Uses the generated `PineScriptLexer`; directives (`//@version=`) are not parsed by the lexer.

**Parser:** var_def, expressions and precedence (add/mul, and/or, eq/neq, unary minus, not), ternary, function calls (pos + keyword args), subscript (`a[i]`), destructuring (`[a,b]=f()`), array literals in function bodies (`=>[1,2,3]`), comma-separated statements, single- and multiline function definitions, if/for/break/continue.

## Run tests

From repo root:

```bash
npm test
```

Runs every `tests/**/*.test.ts` via vitest — discovery is a glob, so a new file
or directory is picked up with no config change.

Run a single suite, or watch:

```bash
npx vitest run tests/v2/lexer/lexer.test.ts
npm run test:watch
```

Cross-version suites live in `conformance/`; shared helpers in
`tests/helpers/`.

## Adding tests

1. Add or reuse a `.pine` file in the right `fixtures/` folder.
2. In the corresponding `*.test.ts`, add an `it("...", () => { ... })` with `assert` calls.
3. Run `npm test` to confirm.
