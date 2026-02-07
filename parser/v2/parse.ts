/**
 * Parse Pine Script using the ANTLR-generated lexer and parser.
 */

import { CharStreams, CommonTokenStream } from "antlr4ng";
import { PineScriptLexer } from "./generated/PineScriptLexer.js";
import { PineScriptParser } from "./generated/PineScriptParser.js";

export function parse(source: string): {
  tree: ReturnType<PineScriptParser["tvscript"]>;
  errorCount: number;
} {
  const inputStream = CharStreams.fromString(source);
  const lexer = new PineScriptLexer(inputStream);
  const tokenStream = new CommonTokenStream(lexer);
  const parser = new PineScriptParser(tokenStream);
  const tree = parser.tvscript();
  return { tree, errorCount: parser.numberOfSyntaxErrors };
}
