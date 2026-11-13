/**
 * Which libraries a script needs that the host has not supplied yet.
 *
 * A v5 `import user/name/version as alias` names a library that lives on
 * TradingView; this engine cannot fetch it, so the host supplies its source
 * (`TranspileOptions.libraries`, `Session.compile(source, { libraries })`).
 * Before it can, it has to know WHICH ones to get -- including the libraries
 * those libraries import, which only become visible once their own source is
 * in hand. This answers that without compiling anything.
 *
 * The paths come from the v5 parser itself: every `import_stmt`'s
 * `import_path().getText()`, which is exactly the key the compiler looks the
 * source up by (ToJsVisitor.visitImport_stmt). Whitespace inside a path,
 * a path of any number of segments, `-` and `.` in a username, and imports
 * inside comments or strings are therefore treated the way the compiler
 * treats them, not the way a second, hand-written parser would.
 */
import type { ParseTree } from "antlr4ng";
import { parse as parseV5 } from "../../parser/v5/index.js";
import { Import_stmtContext } from "../../parser/v5/generated/PineV5Parser.js";
import { detectVersion } from "./version.js";

export interface ImportsOptions {
  /**
   * The version the script will be compiled as, when the host forces one
   * (`TranspileOptions.version`) instead of letting `//@version` decide.
   */
  readonly version?: number;
}

/**
 * The import paths written in one source, in order, without duplicates.
 * Only v5 has `import`: a script annotated v1–v4 (or forced to one), or with a
 * version this engine does not know, imports nothing as far as the host is
 * concerned.
 */
export function importsOf(source: string, opts: ImportsOptions = {}): string[] {
  let version = opts.version;
  if (version === undefined) {
    try { version = detectVersion(source); } catch { return []; }
  }
  return version < 5 ? [] : pathsIn(source);
}

/**
 * The import paths in a source parsed as v5, whatever its annotation. That is
 * how the compiler reads an IMPORTED library (compileLibrary parses it with the
 * v5 parser), so a library's own imports are followed this way.
 */
function pathsIn(source: string): string[] {
  // Most sources import nothing; skip the lex and parse for them.
  if (!/\bimport\b/.test(source)) return [];
  const out: string[] = [];
  const walk = (node: ParseTree) => {
    if (node instanceof Import_stmtContext) {
      const path = node.import_path()?.getText();
      if (path && !out.includes(path)) out.push(path);
      return;
    }
    for (let i = 0; i < node.getChildCount(); i++) walk(node.getChild(i)!);
  };
  walk(parseV5(source).tree as ParseTree);
  return out;
}

/**
 * Every library path the script needs that is not in `supplied`, following
 * imports through the supplied ones. Empty means every library the script
 * reaches has a source; whether they then compile -- a library that does not
 * declare `library()`, one that exports nothing, libraries that import each
 * other in a cycle, a chain deeper than the compiler allows -- is a compile
 * error that names the library.
 *
 * A source that does not parse yields the imports error recovery could still
 * read. For a supplied library that means its later imports may go unasked:
 * that library cannot compile whatever else is supplied, and the compile says
 * so by name ("parsing the library 'x/Y/1' failed"), which is the error the
 * author has to fix first.
 */
export function requiredLibraries(
  source: string,
  supplied: Readonly<Record<string, string>> = {},
  opts: ImportsOptions = {},
): string[] {
  const missing: string[] = [];
  const seen = new Set<string>();
  const queue = importsOf(source, opts);
  while (queue.length) {
    const path = queue.shift()!;
    if (seen.has(path)) continue;
    seen.add(path);
    const lib = supplied[path];
    if (lib === undefined) missing.push(path);
    else queue.push(...pathsIn(lib));
  }
  return missing;
}
