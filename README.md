# OpenPineScript

**OpenPineScript** is an open-source runtime for executing Pine Script code. The goal is to provide an alternative platform for Pine Script developers to run and experiment with their code in open environments, free from proprietary constraints.

OpenPineScript replicates the core functionality of Pine Script, making it accessible and extensible for developers across various platforms.

---

## What’s implemented

- **Lexer** (v2) – ANTLR-based lexer for Pine Script (tokens, keywords, literals, operators).
- **Parser** (v2) – ANTLR-based parser; grammar in `grammar/v2/`.
- **Transpiler** (v2) – Transpiles Pine Script to JavaScript; all identifiers are prefixed with `opsv2_` in the sandbox. See [transpiler/transpiler-usage.md](transpiler/transpiler-usage.md).
- **REPL** – Read-eval-print loop; optional `-v` to show lexer and parser output.

---

## Features

- **Open source** – Transparent and free to use, modify, and extend.
- **Pine Script execution** – Run Pine Script via transpilation to JavaScript (Node.js).
- **ANTLR-powered** – Lexer and parser generated from ANTLR v4 grammars; prebuilt runtime, no Java required to run (only to regenerate).
- **Modular** – Lexer, parser, and transpiler are separate; easy to extend or replace.
- **Cross-platform** – Runs wherever Node.js runs.

---

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+

### Install and build

```bash
git clone https://github.com/be-thomas/OpenPineScript.git
cd OpenPineScript
npm install
```

Parser is generated on `npm install`. To regenerate after grammar changes:

```bash
npm run generate:parser
```

### Run tests

```bash
npm test
```

### Try the REPL

```bash
npm run replv2
```

Example session:

![OpenPineScript REPL](/images/repl-1.png)

The REPL supports **Up/Down** for command history and **multi-line input** with a 4-space continuation prompt (Python-style) when the parser expects more input (e.g. unclosed brackets).

To also print **lexer** and **parser** output for each line, use the `-v` flag:

```bash
npm run replv2 -- -v
```

Example with verbose output:

```
OpenPineScript REPL (type .exit to quit) [verbose: lexer + parser]

> a = 1
  [lexer] ID "a" DEFINE "=" INT_LITERAL "1" LEND "\n"
  [parser] (opsv2_script (stmt (global_stmt_or_multistmt ... ) \n) <EOF>)
  → a=1
> .exit
```

### Parse a file

```bash
npm run parse path/to/script.pine
```

With no path, parses an inline example.

---

## Project layout

- **grammar/v2/** – ANTLR lexer and parser grammars (`.g4`).
- **parser/v2/** – Generated parser and `parse()` API.
- **transpiler/v2/** – Pine → JavaScript transpiler; [transpiler/transpiler-usage.md](transpiler/transpiler-usage.md) for API and usage.
- **repl/v2/** – REPL entry point (`npm run repl`).
- **tests/v2/** – Tests for lexer, parser, and transpiler.

---

## License

GNU GPL-3.0. See [LICENSE](LICENSE).


## Contributing

OpenchartingView is a solo pursuit of the 'Perfect Charting Engine.' To ensure the highest level of speed, security, and architectural consistency, I am currently the sole maintainer and contributor to the codebase.

How you can help:

Bug Reports: If the Pine v2/v3 parser trips up, I want to know exactly where.

Feature Requests: Tell me what TradingView paywalls are bothering you most.

Discussion: Join the community to talk about the best ways to optimize local execution.

Note: I am not accepting Pull Requests at this time to keep the development cycle fast and the engine lean. If you find a bug, report it, and I’ll aim to ship a fix within 24 hours.

