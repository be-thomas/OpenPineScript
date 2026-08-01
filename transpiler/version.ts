/**
 * Pine Script version detection.
 *
 * The `//@version=N` annotation is a comment, and the ANTLR lexer skips
 * comments — so detection happens here, in a pre-parse scan of the raw source,
 * rather than in the grammar.
 *
 * TradingView treats a script with no annotation as v1.
 */

export type PineVersion = 1 | 2 | 3 | 4 | 5;

/**
 * Versions this engine can PARSE an annotation for. Not the same as the
 * versions it can run — see LANGUAGE_PROFILES[v].implemented for that.
 */
export const KNOWN_VERSIONS: readonly PineVersion[] = [1, 2, 3, 4, 5];

/** A script with no //@version annotation is Pine Script v1. */
export const DEFAULT_VERSION: PineVersion = 1;

/**
 * Extracts the text of every `//` line comment, skipping string literals and
 * block comments.
 *
 * Scanning the raw source with a bare regex would match `//@version=5` inside a
 * string literal — e.g. `msg = "//@version=5"` — and misreport the version.
 */
function lineComments(source: string): string[] {
  const found: string[] = [];
  const n = source.length;
  let i = 0;

  while (i < n) {
    const c = source[i];

    // String literal — Pine strings do not span lines, so a newline also ends it.
    if (c === '"' || c === "'") {
      const quote = c;
      i++;
      while (i < n) {
        if (source[i] === "\n") break;
        if (source[i] === "\\") {
          // A trailing backslash must not swallow the newline — doing so would
          // hide a real annotation sitting on the following line. Pine strings
          // do not span lines, so an unterminated one just ends here.
          if (source[i + 1] === "\n" || source[i + 1] === "\r") break;
          i += 2;
          continue;
        }
        if (source[i] === quote) { i++; break; }
        i++;
      }
      continue;
    }

    // Line comment — capture to end of line, but only when the comment OWNS
    // its line. A trailing comment after code (`plot(close) //@version=2`) is
    // not a version annotation.
    if (c === "/" && source[i + 1] === "/") {
      let j = i + 2;
      while (j < n && source[j] !== "\n" && source[j] !== "\r") j++;
      if (ownsItsLine(source, i)) found.push(source.slice(i + 2, j));
      i = j;
      continue;
    }

    // Block comment — skipped entirely; the annotation must use `//`.
    if (c === "/" && source[i + 1] === "*") {
      let j = i + 2;
      while (j < n && !(source[j] === "*" && source[j + 1] === "/")) j++;
      i = j + 2;
      continue;
    }

    i++;
  }

  return found;
}

/**
 * Matches an annotation comment. The comment body must *start* with `@version`
 * (after optional whitespace), so prose that merely mentions a version — like
 * `// ported from //@version=4` — is not picked up.
 */
const ANNOTATION = /^\s*@version\s*=\s*(\d+)\s*$/;

/** True when only whitespace precedes `start` on its line. */
function ownsItsLine(source: string, start: number): boolean {
  for (let k = start - 1; k >= 0; k--) {
    const ch = source[k];
    if (ch === "\n" || ch === "\r") return true;
    if (ch !== " " && ch !== "\t") return false;
  }
  return true;
}

/**
 * Versions that actually run, registered by profiles/ at module load.
 *
 * Registration rather than an import: profiles/ already imports this module, so
 * importing it back would be a cycle. This keeps the dependency one-way and
 * still lets the diagnostic name what really works.
 */
let IMPLEMENTED: readonly PineVersion[] = [];

export function registerImplementedVersions(versions: readonly PineVersion[]): void {
  IMPLEMENTED = versions;
}

function implementedVersions(): readonly PineVersion[] {
  return IMPLEMENTED;
}

export class UnsupportedVersionError extends Error {
  constructor(public readonly requested: number, implemented: readonly PineVersion[] = []) {
    // Report what actually runs, not what merely parses. Saying "supports
    // 1, 2, 3, 4, 5" when three of those are refused a moment later is worse
    // than saying nothing.
    const runs = implemented.length ? implemented.join(", ") : "none";
    super(
      `Unknown Pine Script version ${requested}. ` +
      `OpenPineScript knows versions ${KNOWN_VERSIONS.join(", ")} ` +
      `and currently runs ${runs}.`
    );
    this.name = "UnsupportedVersionError";
  }
}

/**
 * Reads the `//@version=N` annotation. Returns 1 when absent.
 * @throws UnsupportedVersionError for a well-formed annotation naming a version
 *         we do not implement.
 */
export function detectVersion(source: string): PineVersion {
  for (const comment of lineComments(source)) {
    const m = ANNOTATION.exec(comment);
    if (!m) continue;

    const n = Number(m[1]);
    if (!KNOWN_VERSIONS.includes(n as PineVersion)) {
      throw new UnsupportedVersionError(n, implementedVersions());
    }
    return n as PineVersion;
  }

  return DEFAULT_VERSION;
}
