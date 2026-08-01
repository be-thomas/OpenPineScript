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

describe("test discovery", () => {
  it("the runner uses a glob, not a hand-listed set of files", () => {
    // A literal file list silently drops suites as versions are added.
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
    expect(pkg.scripts.test).toBe("vitest run");

    const config = fs.readFileSync(path.join(ROOT, "vitest.config.ts"), "utf8");
    expect(config).toMatch(/tests\/\*\*\/\*\.test\.ts/);
  });

  it("discovers suites outside tests/v2", () => {
    // This file lives in tests/conformance/ — if it ran, discovery is not
    // pinned to the original v2-only directory.
    expect(__filename).toContain(path.join("tests", "conformance"));
  });
});
