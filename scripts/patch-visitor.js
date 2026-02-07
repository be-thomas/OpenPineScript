/**
 * antlr4ng exports ParseTreeVisitor, not AbstractParseTreeVisitor.
 * Patch the generated visitor so it extends ParseTreeVisitor.
 * Also patch the lexer: semantic predicate uses getCharPositionInLine() but antlr4ng
 * Lexer exposes .column; fix LBEG_sempred to use this.column === 0.
 */
const fs = require("fs");
const path = require("path");
const genDir = path.join(__dirname, "../parser/v2/generated");

let s = fs.readFileSync(path.join(genDir, "PineScriptParserVisitor.ts"), "utf-8");
s = s.replace(/import \{ AbstractParseTreeVisitor \} from "antlr4ng";/, 'import { ParseTreeVisitor } from "antlr4ng";');
s = s.replace(/extends AbstractParseTreeVisitor<Result>/, "extends ParseTreeVisitor<Result>");
fs.writeFileSync(path.join(genDir, "PineScriptParserVisitor.ts"), s);
console.log("Patched PineScriptParserVisitor.ts for antlr4ng");

const lexerPath = path.join(genDir, "PineScriptLexer.ts");
let lexer = fs.readFileSync(lexerPath, "utf-8");
lexer = lexer.replace(/\bgetCharPositionInLine\(\)\s*==\s*0\s*/, "this.column === 0 ");
fs.writeFileSync(lexerPath, lexer);
console.log("Patched PineScriptLexer.ts LBEG predicate for antlr4ng");
