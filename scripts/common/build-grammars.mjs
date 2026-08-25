/**
 * Runs antlr-ng over the version-split grammars.
 *
 * ── Why a staging directory ─────────────────────────────────────────────────
 *
 * The grammars are COMPOSITE: PineV5Parser declares `import PineV4Parser;`,
 * which declares `import PineV3Parser;`, and so on down to v1. ANTLR resolves
 * every one of those through `--lib`, which takes a SINGLE directory and does
 * not recurse — so with the grammars split into grammar/v1…grammar/v5 no one
 * value of `--lib` can satisfy a chain that spans all five.
 *
 * Flattening them back into one folder would satisfy ANTLR and violate the
 * repository's layout rule, so the flattening happens at BUILD time instead:
 * every .g4 is copied into one temporary directory, antlr-ng runs there, and
 * the directory is thrown away. Nothing generated is written into it — `-o`
 * still points at parser/<version>/generated.
 *
 * The temp directory lives outside the repository so it cannot be mistaken for
 * a source folder, and it is rebuilt from scratch on every run so a renamed or
 * deleted grammar cannot linger and silently keep building.
 *
 * Usage: node scripts/common/build-grammars.mjs [v1 v2 …]   (default: all)
 */
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");
const GRAMMAR = join(ROOT, "grammar");

const versions = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readdirSync(GRAMMAR).filter(d => /^v\d+$/.test(d)).sort();

const stage = mkdtempSync(join(tmpdir(), "opsv2-grammar-"));
try {
  // Every version's grammars, flat, so `import PineV4Parser;` resolves.
  for (const dir of readdirSync(GRAMMAR).filter(d => /^v\d+$/.test(d)))
    for (const f of readdirSync(join(GRAMMAR, dir)).filter(f => f.endsWith(".g4")))
      cpSync(join(GRAMMAR, dir, f), join(stage, f));

  for (const v of versions) {
    const n = v.slice(1);
    const out = join(ROOT, "parser", v, "generated");
    execFileSync(
      "npx",
      ["antlr-ng", "-Dlanguage=TypeScript", "-o", out, "-l", "false", "-v", "true",
       "--lib", stage, join(stage, `PineV${n}Lexer.g4`), join(stage, `PineV${n}Parser.g4`)],
      { stdio: "inherit", cwd: ROOT },
    );
    console.log(`grammar/${v}  →  parser/${v}/generated`);
  }
} finally {
  rmSync(stage, { recursive: true, force: true });
}
