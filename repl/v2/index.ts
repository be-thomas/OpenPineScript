#!/usr/bin/env node
/**
 * Pine Script REPL: read-eval-print loop.
 * Usage: npm run repl [ -v ]
 */

import * as repl from "node:repl";
import * as vm from "node:vm";
import * as util from "node:util"; 
import { CharStreams, CommonTokenStream, Lexer, Token } from "antlr4ng";
import { PineScriptLexer } from "../../parser/v2/generated/PineScriptLexer.js"; // Import Lexer Class for IDs
import { parse } from "../../parser/v2/parse.js";
import { transpile } from "../../transpiler/v2/transpile.js";
import { PineScriptTokenSource } from "../../lexer/v2/PineScriptTokenSource.js";

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

function hasVerboseFlag(): boolean {
  return process.argv.includes("-v");
}

function looksIncomplete(code: string): boolean {
  const t = code.trim();
  if (!t) return true;

  let open = 0, openSquare = 0, openCurly = 0;
  for (const c of code) {
    if (c === "(") open++;
    else if (c === ")") open--;
    else if (c === "[") openSquare++;
    else if (c === "]") openSquare--;
    else if (c === "{") openCurly++;
    else if (c === "}") openCurly--;
  }
  if (open > 0 || openSquare > 0 || openCurly > 0) return true;

  const lines = t.split('\n');
  const lastLine = lines[lines.length - 1].trim();
  
  if (/(=>|:|,|\\|=|\+|\-|\*|\/)$/.test(lastLine)) return true;
  if (/[(\[{]$/.test(lastLine)) return true;
  if (/^(if|for|while|switch|else|do)\b/.test(lastLine)) return true;

  return false;
}

function colorizeToken(lexer: PineScriptTokenSource, t: Token): string {
  const typeName = lexer.vocabulary.getSymbolicName(t.type) ?? String(t.type);
  const text = t.text ?? "";
  
  let color = C.White;
  if (["IF_COND", "FOR_STMT", "BREAK", "CONTINUE", "RETURN", "DEFINE", "ASSIGN"].some(k => typeName.startsWith(k))) {
    color = C.Magenta;
  } else if (typeName.includes("LITERAL")) {
    color = typeName.includes("STR") ? C.Green : C.Yellow;
  } else if (typeName === "ID") {
    color = C.Cyan;
  } else if (["BEGIN", "END", "LEND"].includes(typeName)) {
    color = C.Gray;
  }

  const displayVal = text === "\n" ? "\\n" : text;
  return `${color}${typeName}${C.Gray}(${C.Reset}${displayVal}${C.Gray})${C.Reset}`;
}

function printLexerOutput(tokens: Token[], lexer: PineScriptTokenSource): void {
  if (tokens.length === 0) {
    console.log(C.Gray + "  [lexer] (no tokens)" + C.Reset);
    return;
  }
  const parts = tokens.map((t) => colorizeToken(lexer, t));
  console.log(C.Gray + "  [tokens] " + C.Reset + parts.join(" "));
}

function main(): void {
  const verbose = hasVerboseFlag();
  const sandbox: Record<string, unknown> = Object.create(null);
  const sandboxContext = vm.createContext(sandbox);
  const defaultPrompt = C.Green + "> " + C.Reset;

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

    // 1. Tokenize (for verbose output AND for inspection)
    const inputStream = CharStreams.fromString(source);
    const lexer = new PineScriptTokenSource(inputStream);
    const tokenStream = new CommonTokenStream(lexer as unknown as Lexer);
    tokenStream.fill();
    // Filter out EOF for display/logic
    const tokens = tokenStream.getTokens().filter((t) => t.type !== Token.EOF);

    if (verbose) printLexerOutput(tokens, lexer);

    // 2. Parse
    const { tree, errorCount, firstError } = parse(source);

    if (errorCount > 0) {
      if (looksIncomplete(source)) {
        callback(new repl.Recoverable(new Error("incomplete")), undefined);
        return;
      }
      console.error(`${C.Red}Parse Error:${C.Reset} ${firstError}`); 
      callback(new Error(`Parsing failed.`), undefined);
      return;
    }

    let result: any;
    try {
      let js = transpile(source);
      js = js.replace(/\blet\b/g, "var"); 
      
      result = vm.runInContext(js, sandboxContext);

      // --- ENHANCED OUTPUT LOGIC ---

      // Case A: Variable Definition or Function Definition (Result is undefined)
      if (result === undefined) {
          const firstStmt = tree.stmt(0);
          if (firstStmt) {
              const funDef = firstStmt.fun_def_stmt();
              const globalStmt = firstStmt.global_stmt();
              
              if (funDef) {
                  const single = funDef.fun_def_singleline();
                  const multi = funDef.fun_def_multiline();
                  const nameCtx = single ? single.id() : multi ? multi.id() : null;
                  if (nameCtx) result = `${nameCtx.getText()}=[function]`;
              }
              else if (globalStmt) {
                  const content = globalStmt.global_stmt_content(0);
                  const def = content?.var_def();
                  const assign = content?.var_assign();
                  const target = def ? def.id() : assign ? assign.id() : null;
                  
                  if (target) {
                      const name = target.getText();
                      const val = sandbox[PREFIX + name];
                      result = `${name}=${JSON.stringify(val)}`;
                  }
              }
          }
      } 
      // Case B: Variable Access (Result is a value, Input was just an ID)
      else {
          // Filter out "noise" tokens (Newlines, Indents, Comments) to see what's real
          const meaningfulTokens = tokens.filter(t => 
             t.type !== PineScriptLexer.LEND && 
             t.type !== PineScriptLexer.BEGIN && 
             t.type !== PineScriptLexer.END && 
             t.type !== PineScriptLexer.WS &&
             t.type !== PineScriptLexer.LINE_COMMENT
          );

          // If there is exactly ONE meaningful token, and it is an ID
          if (meaningfulTokens.length === 1 && meaningfulTokens[0].type === PineScriptLexer.ID) {
              const name = meaningfulTokens[0].text;
              if (typeof result === 'function') {
                  result = `${name}=[function]`;
              } else {
                  result = `${name}=${JSON.stringify(result)}`;
              }
          }
      }

    } catch (err) {
      callback(err instanceof Error ? err : new Error(String(err)), undefined);
      return;
    }

    callback(null, result);
  };

  console.log(C.Cyan + "OpenPineScript REPL" + C.Reset + " (type .exit to quit)");
  console.log(C.Gray + "  Multi-line enabled: Type 'if x > 1' or 'fun()=>' and hit Enter." + C.Reset);
  console.log("");

  const replServer = repl.start({
    prompt: defaultPrompt,
    eval: pineEval as any,
    writer: (output: any) => {
      let formatted = "";
      
      // Highlight the variable name in Cyan if output matches "name=..."
      if (typeof output === "string" && (output.includes("=[function]") || output.includes("="))) {
          formatted = output.replace(/^([^=]+)=/, `${C.Cyan}$1${C.Reset}=`);
      } else {
          formatted = util.inspect(output, { colors: true, showHidden: false, depth: 2 });
      }

      // Add extra newline for cleanliness
      return formatted + "\n";
    },
    ignoreUndefined: true,
  });

  replServer.on("exit", () => {
    console.log(""); // Print a newline so the shell prompt is clean
    process.exit(0);
  });
}

main();