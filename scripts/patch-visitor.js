/**
 * antlr4ng exports ParseTreeVisitor, not AbstractParseTreeVisitor.
 * Patch the generated visitor so it extends ParseTreeVisitor.
 */
const fs = require("fs");
const path = require("path");
const genDir = path.join(__dirname, "../parser/v2/generated");

// 1. Patch Visitor
const visitorPath = path.join(genDir, "PineScriptParserVisitor.ts");
if (fs.existsSync(visitorPath)) {
    let s = fs.readFileSync(visitorPath, "utf-8");
    s = s.replace(/import \{ AbstractParseTreeVisitor \} from "antlr4ng";/, 'import { ParseTreeVisitor } from "antlr4ng";');
    s = s.replace(/extends AbstractParseTreeVisitor<Result>/, "extends ParseTreeVisitor<Result>");
    fs.writeFileSync(visitorPath, s);
    console.log("Patched PineScriptParserVisitor.ts for antlr4ng");
}

// REMOVED: The Lexer patch for 'getCharPositionInLine' is no longer needed 
// because our new .g4 grammar doesn't use that predicate anymore!