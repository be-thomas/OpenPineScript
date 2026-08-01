/**
 * Structural guards.
 *
 * These do not test Pine Script — they stop two specific failure modes that
 * this repository has already hit once:
 *
 *  1. Modules left behind after a refactor that import files which no longer
 *     exist. Nothing imports them, so nothing fails, and they mislead every
 *     later search for "where does transpiling happen".
 *  2. Test files that are never run, because the runner was given a
 *     hand-maintained file list instead of a glob.
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = path.resolve(__dirname, "../..");

const SOURCE_DIRS = [
  "lexer", "parser", "transpiler", "runtime", "repl",
  "mock_run", "utils", "scripts", "tests",
];

const SKIP_DIRS = new Set(["node_modules", "generated", ".git"]);

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(ts|js)$/.test(entry.name)) out.push(full);
  }
  return out;
}

/** Every relative import specifier in a source file. */
function relativeImports(file: string): string[] {
  const src = fs.readFileSync(file, "utf8");
  const specs: string[] = [];
  const patterns = [
    /\bfrom\s+["'](\.[^"']+)["']/g,
    /\bimport\s+["'](\.[^"']+)["']/g,
    /\brequire\(\s*["'](\.[^"']+)["']\s*\)/g,
  ];
  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) {
      // Skip interpolated specifiers: scripts/generate-metadata.ts EMITS import
      // statements as template literals, and those are not imports of its own.
      if (m[1].includes("${")) continue;
      specs.push(m[1]);
    }
  }
  return specs;
}

function resolves(fromFile: string, spec: string): boolean {
  const base = path.resolve(path.dirname(fromFile), spec);
  // A ".js" specifier commonly refers to a ".ts" source under ts/tsx tooling.
  const candidates = [
    base, `${base}.ts`, `${base}.js`,
    base.replace(/\.js$/, ".ts"),
    path.join(base, "index.ts"), path.join(base, "index.js"),
  ];
  return candidates.some(c => fs.existsSync(c));
}

describe("no unreachable or broken modules", () => {
  const files = SOURCE_DIRS.flatMap(d => walk(path.join(ROOT, d)));

  it("finds source files to check", () => {
    expect(files.length).toBeGreaterThan(20);
  });

  it("every relative import resolves to a real file", () => {
    const broken: string[] = [];

    for (const file of files) {
      for (const spec of relativeImports(file)) {
        if (!resolves(file, spec)) {
          broken.push(`${path.relative(ROOT, file)} → ${spec}`);
        }
      }
    }

    expect(broken, `broken imports:\n${broken.join("\n")}`).toEqual([]);
  });
});

describe("docs do not reference deleted modules", () => {
  // The import scan above only walks .ts/.js, so it cannot catch a Markdown
  // file still documenting a module this repo removed.
  const DOC_DIRS = [".", "transpiler", "tests", "tests/v2", "lexer", "parser", "runtime", "grammar", "repl"];

  const docs = DOC_DIRS.flatMap(d => {
    const abs = path.join(ROOT, d);
    if (!fs.existsSync(abs)) return [];
    return fs.readdirSync(abs, { withFileTypes: true })
      .filter(e => e.isFile() && e.name.endsWith(".md"))
      .map(e => path.join(abs, e.name));
  });

  it("finds docs to check", () => {
    expect(docs.length).toBeGreaterThan(5);
  });

  it("every source path named in a doc exists", () => {
    // Backticked paths that look like real repo files.
    const PATH_REF = /`([A-Za-z0-9_./-]+\.(?:ts|js|sh|g4))`/g;
    const stale: string[] = [];

    for (const doc of docs) {
      const text = fs.readFileSync(doc, "utf8");
      let m: RegExpExecArray | null;
      while ((m = PATH_REF.exec(text)) !== null) {
        const ref = m[1];
        if (!ref.includes("/")) continue;              // bare filenames: too ambiguous
        if (ref.startsWith("http")) continue;
        if (!fs.existsSync(path.join(ROOT, ref))) {
          stale.push(`${path.relative(ROOT, doc)} → ${ref}`);
        }
      }
    }

    expect(stale, `stale doc references:\n${stale.join("\n")}`).toEqual([]);
  });
});

describe("test discovery", () => {
  it("the runner uses a glob, not a hand-listed set of files", () => {
    // A literal file list silently drops suites as versions are added.
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
    expect(pkg.scripts.test).toMatch(/^vitest run/);

    const config = fs.readFileSync(path.join(ROOT, "vitest.config.ts"), "utf8");
    expect(config).toMatch(/tests\/\*\*\/\*\.test\.ts/);
  });

  it("discovers suites outside tests/v2", () => {
    // This file lives in tests/conformance/ — if it ran, discovery is not
    // pinned to the original v2-only directory.
    expect(__filename).toContain(path.join("tests", "conformance"));
  });
});
