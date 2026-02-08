#!/usr/bin/env node
/**
 * Pine Script REPL: read-eval-print loop (Stateful v2)
 */

import * as repl from "node:repl";
import * as vm from "node:vm";
import * as util from "node:util"; 
import { CharStreams, CommonTokenStream, Lexer, Token } from "antlr4ng";
import { PineScriptLexer } from "../../parser/v2/generated/PineScriptLexer";
import { PineScriptTokenSource } from "../../lexer/v2/PineScriptTokenSource";
import { parse } from "../../parser/v2";
import { transpile } from "../../transpiler/v2";
import { Context, run } from "../../runtime/v2";   // Import the runtime runner

// --- ANSI Colors ---
const C = {
  Reset: "\x1b[0m",
  Gray: "\x1b[90m",
  Red: "\x1b[31m",
  Green: "\x1b[32m",
  Yellow: "\x1b[33m",
  Blue: "\x1b[34m",
  Magenta: "\x1b[35m",
  Cyan: "\x1b[36m",
  White: "\x1b[37m",
};

const PREFIX = "opsv2_";

// --- Helper Functions ---
function hasVerboseFlag() { return process.argv.includes("-v"); }

function looksIncomplete(code: string): boolean {
  const t = code.trim();
  if (!t) return true;
  let open = 0, openSquare = 0, openCurly = 0;
  for (const c of code) {
    if (c === "(") open++; else if (c === ")") open--;
    else if (c === "[") openSquare++; else if (c === "]") openSquare--;
    else if (c === "{") openCurly++; else if (c === "}") openCurly--;
  }
  if (open > 0 || openSquare > 0 || openCurly > 0) return true;
  const lastLine = t.split('\n').pop()?.trim() || "";
  return /(=>|:|,|\\|=|\+|\-|\*|\/)$/.test(lastLine) || /[(\[{]$/.test(lastLine) || /^(if|for|while|switch|else|do)\b/.test(lastLine);
}

function main(): void {
  const verbose = hasVerboseFlag();
  
  // 1. Initialize the Long-lived Engine State
  const ctx = new Context(); 
  const sandbox = Object.create(null);
  const sandboxContext = vm.createContext(sandbox);

  const defaultPrompt = C.Green + "> " + C.Reset;

  const pineEval = (
    code: string,
    _context: object,
    _file: string,
    callback: (err: Error | null, result?: unknown) => void
  ): void => {
      const trimmed = code.trim();
      if (!trimmed) return callback(null, undefined);

      let source = trimmed.endsWith("\n") ? trimmed : trimmed + "\n";

      // --- Lexer/Parser Step ---
      const inputStream = CharStreams.fromString(source);
      const lexer = new PineScriptTokenSource(inputStream);
      const tokenStream = new CommonTokenStream(lexer as unknown as Lexer);
      tokenStream.fill();
      const tokens = tokenStream.getTokens().filter((t) => t.type !== Token.EOF);

      const { tree, errorCount, firstError } = parse(source);
      if (errorCount > 0) {
          if (looksIncomplete(source)) return callback(new repl.Recoverable(new Error("incomplete")), undefined);
          console.error(`${C.Red}Parse Error:${C.Reset} ${firstError}`);
          return callback(new Error(`Parsing failed.`), undefined);
      }

      try {
          // 2. Transpile using the V2 Transpiler
          const js = transpile(source);

          // 3. EXECUTE via the Runtime Engine
          const resultValue = run(js, ctx, sandboxContext);

          let outputResult = resultValue;

          // --- Enhanced Output Logic ---
          if (outputResult === undefined) {
              const firstStmt = tree.stmt(0);
              if (firstStmt) {
                  const funDef = firstStmt.fun_def_stmt();
                  const globalStmt = firstStmt.global_stmt();

                  if (funDef) {
                      const name = funDef.fun_def_singleline()?.id()?.getText() || funDef.fun_def_multiline()?.id()?.getText();
                      if (name) outputResult = `${name}=[function]`;
                  } else if (globalStmt) {
                      const content = globalStmt.global_stmt_content(0);
                      // We support both Var Definition (a = 1) and Var Assignment (a := 1)
                      const target = content?.var_def()?.id() || content?.var_assign()?.id();
                      
                      if (target) {
                          const name = target.getText();
                          const internalName = PREFIX + name;
                          
                          // FIX: Use runInContext to get the value of 'let' variables
                          try {
                              const val = vm.runInContext(internalName, sandboxContext);
                              outputResult = `${name}=${JSON.stringify(val)}`;
                          } catch (e) {
                              // Fallback if variable wasn't actually created
                              outputResult = `${name}=undefined`;
                          }
                      }
                  }
              }
          } else {
              // Check if it's a simple variable access (single ID token)
              const meaningful = tokens.filter(t => ![PineScriptLexer.LEND, PineScriptLexer.BEGIN, PineScriptLexer.END, PineScriptLexer.WS].includes(t.type));
              if (meaningful.length === 1 && meaningful[0].type === PineScriptLexer.ID) {
                  const name = meaningful[0].text;
                  // If resultValue is just the value, label it for clarity
                  outputResult = typeof resultValue === 'function' ? `${name}=[function]` : `${name}=${JSON.stringify(resultValue)}`;
              }
          }

          callback(null, outputResult);

      } catch (err) {
          callback(err instanceof Error ? err : new Error(String(err)), undefined);
      }
  };

  // --- REPL UI Setup ---
  console.log(`${C.Cyan}OpenPineScript Engine v2${C.Reset}`);
  console.log(`${C.Gray}Local stateful indicators (SMA, RSI) active.${C.Reset}\n`);

  const replServer = repl.start({
    prompt: defaultPrompt,
    eval: pineEval as any,
    writer: (output: any) => {
      if (typeof output === "string" && output.includes("=")) {
          return output.replace(/^([^=]+)=/, `${C.Cyan}$1${C.Reset}=`) + "\n";
      }
      return util.inspect(output, { colors: true, depth: 2 }) + "\n";
    }
  });

  replServer.on("exit", () => process.exit(0));
}

main();