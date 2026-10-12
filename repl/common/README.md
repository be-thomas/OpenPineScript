# REPL

Pine Script read-eval-print loop. Implementation lives in **v2/** (see [v2/README.md](v2/README.md)).

- **Up/Down** – Command history.
- **Multi-line** – Continuation with 4-space indent when input is incomplete (unclosed brackets, etc.).

```bash
npm run repl
npm run repl -- -v   # verbose: lexer + parser output
```
