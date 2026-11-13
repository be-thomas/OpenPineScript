// CommonJS on purpose, hence .cjs: package.json declares "type": "module",
// which makes every bare .js in this repository an ES module. This script
// is the one that still uses require(), and renaming it is cheaper than
// porting it for the sake of a build step that runs before anything else.
/**
 * antlr4ng exports ParseTreeVisitor, not AbstractParseTreeVisitor.
 * Patch every generated visitor so it extends ParseTreeVisitor.
 *
 * Runs across the whole version hierarchy — each version has its own generated
 * parser and therefore its own visitor interface.
 */
const fs = require("fs");
const path = require("path");

// Derived from grammar/, not hard-coded: build-grammars.mjs discovers versions
// the same way, and a list here that lags behind it fails the count check below
// with "did the parser generation step fail?" — which would be the wrong answer.
const VERSIONS = fs
    .readdirSync(path.join(__dirname, "../../grammar"))
    .filter(d => /^v\d+$/.test(d))
    .map(d => Number(d.slice(1)))
    .sort((a, b) => a - b);
let patched = 0;

for (const v of VERSIONS) {
    const visitorPath = path.join(
        __dirname,
        `../../parser/v${v}/generated/PineV${v}ParserVisitor.ts`,
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
