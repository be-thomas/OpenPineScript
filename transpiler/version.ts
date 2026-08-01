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

export const SUPPORTED_VERSIONS: readonly PineVersion[] = [1, 2, 3, 4, 5];

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
        if (source[i] === "\\") { i += 2; continue; }
        if (source[i] === quote) { i++; break; }
        if (source[i] === "\n") break;
        i++;
      }
      continue;
    }

    // Line comment — capture to end of line.
    if (c === "/" && source[i + 1] === "/") {
      let j = i + 2;
      while (j < n && source[j] !== "\n" && source[j] !== "\r") j++;
      found.push(source.slice(i + 2, j));
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

export class UnsupportedVersionError extends Error {
  constructor(public readonly requested: number) {
    super(
      `Unsupported Pine Script version ${requested}. ` +
      `OpenPineScript supports versions ${SUPPORTED_VERSIONS.join(", ")}.`
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
    if (!SUPPORTED_VERSIONS.includes(n as PineVersion)) {
      throw new UnsupportedVersionError(n);
    }
    return n as PineVersion;
  }

  return DEFAULT_VERSION;
}
