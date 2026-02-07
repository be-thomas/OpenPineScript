#!/usr/bin/env node
/**
 * Pine Script REPL: read-eval-print loop with optional lexer/parser output (-v).
 * Uses Node's repl module for up/down history and multi-line input (Python-like continuation).
 * Usage: npm run repl [ -v ]
 */

import * as repl from "node:repl";
import * as vm from "node:vm";
import { CharStreams, CommonTokenStream } from "antlr4ng";
import { PineScriptLexer } from "../../parser/v2/generated/PineScriptLexer";
import { parse } from "../../parser/v2/parse";
import { transpile } from "../../transpiler/v2/transpile";

const PREFIX = "opsv2_";
const CONTINUATION_INDENT = "    "; // 4 spaces, Python-like

function hasVerboseFlag(): boolean {
  return process.argv.includes("-v");
}

/** Heuristic: input likely needs more lines (unclosed block, brackets, etc.). */
function looksIncomplete(code: string): boolean {
  const t = code.trim();
  if (!t) return true;
  let open = 0;
  let openSquare = 0;
  let openCurly = 0;
  for (const c of code) {
    if (c === "(") open++;
    else if (c === ")") open--;
    else if (c === "[") openSquare++;
    else if (c === "]") openSquare--;
    else if (c === "{") openCurly++;
    else if (c === "}") openCurly--;
  }
  if (open > 0 || openSquare > 0 || openCurly > 0) return true;
  const lastLine = t.split(/\n/).pop()?.trimEnd() ?? "";
  if (/[:,\\]$/.test(lastLine)) return true;
  if (/[(\[{]$/.test(lastLine)) return true;
  return false;
}

function printLexerOutput(source: string): void {
  const inputStream = CharStreams.fromString(source);
  const lexer = new PineScriptLexer(inputStream);
  const stream = new CommonTokenStream(lexer);
  stream.fill();
  const tokens = stream.getTokens().filter((t) => t.type !== -1);
  if (tokens.length === 0) {
    console.log("  [lexer] (no tokens)");
    return;
  }
  const parts = tokens.map((t) => {
    const sym = lexer.vocabulary.getSymbolicName(t.type) ?? String(t.type);
    const text = JSON.stringify(t.text);
    return `${sym} ${text}`;
  });
  console.log("  [lexer]", parts.join(" "));
}

function printParserOutput(source: string): void {
  const { tree, errorCount } = parse(source);
  if (errorCount > 0) {
    console.log("  [parser] (parse errors:", errorCount + ")");
    return;
  }
  console.log("  [parser]", tree.toStringTree());
}

function formatSandboxVars(sandbox: Record<string, unknown>): string {
  const vars: string[] = [];
  for (const key of Object.keys(sandbox)) {
    if (key.startsWith(PREFIX)) {
      const name = key.slice(PREFIX.length);
      const v = sandbox[key];
      const display = typeof v === "function" ? "[function]" : JSON.stringify(v);
      vars.push(`${name}=${display}`);
    }
  }
  return vars.length > 0 ? vars.join(", ") : "";
}

function main(): void {
  const verbose = hasVerboseFlag();
  const sandbox: Record<string, unknown> = Object.create(null);
  const sandboxContext = vm.createContext(sandbox);
  const defaultPrompt = "> ";
  const continuationPrompt = CONTINUATION_INDENT; // Python-style indent for next line

  const pineEval = (
    code: string,
    _context: object,
    _file: string,
    callback: (err: Error | null, result?: unknown) => void,
    replServer: repl.REPLServer,
  ): void => {
    const trimmed = code.trim();
    if (!trimmed) {
      callback(null, undefined);
      return;
    }

    let source = trimmed;
    if (!source.endsWith("\n")) source += "\n";

    if (verbose) {
      printLexerOutput(source);
      printParserOutput(source);
    }

    const { tree, errorCount } = parse(source);
    if (errorCount > 0) {
      if (looksIncomplete(source)) {
        replServer.setPrompt(continuationPrompt);
        replServer.displayPrompt();
        callback(new repl.Recoverable(new Error("incomplete")), undefined);
        return;
      }
      callback(new Error(`Parsing failed with ${errorCount} error(s)`), undefined);
      return;
    }

    replServer.setPrompt(defaultPrompt);

    try {
      let js = transpile(source);
      js = js.replace(/\blet\b/g, "var");
      vm.runInContext(js, sandboxContext);
    } catch (err) {
      callback(err instanceof Error ? err : new Error(String(err)), undefined);
      return;
    }

    const out = formatSandboxVars(sandbox);
    callback(null, out ? { _pineVars: out } : undefined);
  };

  let replServer: repl.REPLServer;
  console.log("OpenPineScript REPL (type .exit to quit)" + (verbose ? " [verbose: lexer + parser]" : ""));
  console.log("  Up/Down: history  |  Multi-line: continuation with indent");
  console.log("");

  const opts: repl.ReplOptions = {
    prompt: defaultPrompt,
    eval(code: string, context: object, file: string, callback: (err: Error | null, result?: unknown) => void): void {
      pineEval(code, context, file, callback, replServer);
    },
    writer(output: unknown): string {
      if (output && typeof output === "object" && "_pineVars" in output) {
        return "  → " + (output as { _pineVars: string })._pineVars;
      }
      return output !== undefined ? String(output) : "";
    },
    ignoreUndefined: true,
  };

  replServer = repl.start(opts);
  replServer.on("exit", () => process.exit(0));
}

main();
