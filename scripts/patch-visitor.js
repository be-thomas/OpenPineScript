/**
 * antlr4ng exports ParseTreeVisitor, not AbstractParseTreeVisitor.
 * Patch every generated visitor so it extends ParseTreeVisitor.
 *
 * Runs across the whole version hierarchy — each version has its own generated
 * parser and therefore its own visitor interface.
 */
const fs = require("fs");
const path = require("path");

const VERSIONS = [1, 2, 3, 4];
let patched = 0;

for (const v of VERSIONS) {
    const visitorPath = path.join(
        __dirname,
        `../parser/v${v}/generated/PineV${v}ParserVisitor.ts`,
    );
    if (!fs.existsSync(visitorPath)) continue;

    let s = fs.readFileSync(visitorPath, "utf-8");
    s = s.replace(
        /import \{ AbstractParseTreeVisitor \} from "antlr4ng";/,
        'import { ParseTreeVisitor } from "antlr4ng";',
    );
    s = s.replace(/extends AbstractParseTreeVisitor<Result>/, "extends ParseTreeVisitor<Result>");
    fs.writeFileSync(visitorPath, s);
    patched++;
    console.log(`Patched PineV${v}ParserVisitor.ts for antlr4ng`);
}

if (patched !== VERSIONS.length) {
    console.error(
        `Expected to patch ${VERSIONS.length} visitors, patched ${patched}. ` +
        `Did the parser generation step fail?`,
    );
    process.exit(1);
}
