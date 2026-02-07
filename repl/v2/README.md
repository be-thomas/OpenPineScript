# REPL v2

Interactive read-eval-print loop for Pine Script.

## Usage

```bash
npm run repl        # normal mode
npm run repl -- -v  # verbose: show lexer and parser output for each input
```

## Commands

- **`.exit`** – Exit the REPL.
- **`.break`** – Cancel the current multi-line input.
- **`.clear`** – Clear the current multi-line input and reset context.

## Behaviour

- Each line is parsed, transpiled to JavaScript, and run in a shared VM sandbox.
- Variables and function names are prefixed with `opsv2_` in the sandbox; the REPL prints them without the prefix (e.g. `x=7`).
- With `-v`, each line is first printed as lexer tokens and parser tree, then executed.

## Line editing and multi-line

- **Up / Down arrows** – Navigate command history (provided by Node’s REPL).
- **Multi-line input** – If the parser needs more input (e.g. unclosed `(`, `[`, `{`, or line ending with `:`, `,`), the REPL shows a **continuation prompt** (4 spaces, Python-style) and waits for more lines until the input is complete.
