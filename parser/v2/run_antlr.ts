/**
 * Minimal runner for the ANTLR4-generated PineScript parser.
 * Usage: npm run parse [file.pine]
 *   With no args, parses the inline example.
 */

import { CharStreams } from "antlr4ng";
import { CommonTokenStream } from "antlr4ng";
import { PineScriptLexer } from "./generated/PineScriptLexer.js";
import { PineScriptParser } from "./generated/PineScriptParser.js";
import * as fs from "fs";
import * as path from "path";

function parse(source: string) {
  const inputStream = CharStreams.fromString(source);
  const lexer = new PineScriptLexer(inputStream);
  const tokenStream = new CommonTokenStream(lexer);
  const parser = new PineScriptParser(tokenStream);
  return parser.tvscript();
}

function main() {
  const args = process.argv.slice(2);
  const source =
    args.length > 0
      ? fs.readFileSync(path.resolve(process.cwd(), args[0]), "utf-8")
      : "x=1\n"; // minimal, no spaces (ID DEFINE INT_LITERAL LEND)

  try {
    const tree = parse(source);
    console.log("Parse succeeded.");
    console.log("Tree:", tree.toStringTree());
  } catch (e) {
    console.error("Parse failed:", e);
    process.exit(1);
  }
}

main();
