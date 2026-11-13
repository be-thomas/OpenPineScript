/**
 * Parse errors a person can act on.
 *
 * ANTLR's messages describe the parser's state — `token recognition error at:
 * '$'`, `no viable alternative at input 'if…<BEGIN>…'` — and say nothing about
 * what went wrong in the script. Four causes are common enough to name:
 *
 *   - a string literal broken across two lines
 *   - `$` in a name
 *   - a script with no `//@version` line whose body is newer than v1
 *   - a file that ends in the middle of a statement (a truncated paste)
 *
 * The parser's own text is kept in `original`; `line` and `column` are never
 * touched. The visitor's errors get the same treatment for the one case that
 * is about the end of the file: see `explainEndOfFile`.
 */
import type { ParserError } from "../../parser/v1";

export interface ParseErrorContext {
  /** The source has no `//@version` line at all. */
  noVersionLine: boolean;
  /** True when the body parses as v5 or v6, evaluated only if asked. */
  parsesAsNewer: () => boolean;
}

/** Offset of a 1-based line and 0-based column, or -1 past the end. */
function offsetOf(source: string, line: number, col: number): number {
  let at = 0;
  for (let l = 1; l < line; l++) {
    const nl = source.indexOf("\n", at);
    if (nl < 0) return -1;
    at = nl + 1;
  }
  return at + col;
}

/** Where the code ends: just after the last character that is not whitespace. */
function codeEnd(source: string): number {
  return source.trimEnd().length;
}

/** The line the code ends on: a trailing newline does not start a new one. */
function lastCodeLine(source: string): number {
  return source.trimEnd().split("\n").length;
}

function endOfFileSentence(line: number): string {
  return `The script ends in the middle of a statement at line ${line} — was it pasted completely?`;
}

export function explainParseErrors(
  source: string, errors: readonly ParserError[], ctx: ParseErrorContext,
): ParserError[] {
  const end = codeEnd(source);
  const out = errors.map((e, i): ParserError => {
    const m = e.message;
    const text = /^token recognition error at: '([\s\S]*)'$/.exec(m)?.[1];
    if (text !== undefined) {
      // Only the first: the rest of a broken string is lexed as more code, and
      // each piece of it fails too.
      if (i === 0 && /^["']/.test(text) && text.includes("\n")) {
        return { ...e, original: `${m} — TradingView: mismatched character '\\n' expecting '\"'`,
          message: `A string can't continue onto the next line — close the quote on line ${e.line}, or join the lines.` };
      }
      if (text === "$") {
        const at = offsetOf(source, e.line, e.column);
        const touchesName = at >= 0 && (/\w/.test(source[at - 1] ?? "") || /\w/.test(source[at + 1] ?? ""));
        if (touchesName) {
          return { ...e, original: `${m} — TradingView: no viable alternative at character '$'`,
            message: `\`$\` can't be used in a name (line ${e.line}).` };
        }
      }
      return e;
    }
    // Only the first error can be the cause; later ones at the end are what
    // an earlier mistake leaves behind.
    if (i === 0 && source.trim() !== "") {
      const at = offsetOf(source, e.line, e.column);
      if (m.includes("'<EOF>'") || (at >= 0 && at >= end)) {
        return { ...e, original: `${m} — TradingView: Syntax error at input 'end of line without line continuation'`,
          message: `${endOfFileSentence(lastCodeLine(source))} (${m})` };
      }
    }
    return e;
  });

  if (ctx.noVersionLine && out.length > 0 && ctx.parsesAsNewer()) {
    out[0] = { ...out[0], original: out[0].original ?? out[0].message,
      message: `${out[0].message}${NO_VERSION_HINT}` };
  }
  return out;
}

/**
 * What to add to ANY error in a script with no `//@version` line that parses
 * as v5 or v6: the script was read as v1 and the error is very likely only
 * that. A parse error, a transpile error ("Undeclared identifier 'indicator'")
 * and a built-in the dry run finds missing all start here.
 */
export const NO_VERSION_HINT =
  " This script has no `//@version` line, so it was read as version 1. " +
  "Add `//@version=5` (or 6) as the first line.";

/**
 * The visitor's "Undeclared identifier 'x'" and "'ns' has no member 'x'" are
 * ordinary errors in the middle of a file. At the very end they are a script
 * cut off in the middle of a word: nothing but whitespace follows the name.
 * Returns the sentence to append, or null.
 */
export function explainEndOfFile(source: string, message: string): string | null {
  const at = /@L(\d+):C(\d+)/.exec(message);
  if (!at) return null;
  const line = Number(at[1]);
  const start = offsetOf(source, line, Number(at[2]));
  if (start < 0) return null;
  const tail = source.slice(start);
  const undeclared = /Undeclared identifier '([^']+)'/.exec(message);
  const member = /'([^']+)' has no member '([^']+)'/.exec(message);
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const last = undeclared ? new RegExp(`^${esc(undeclared[1])}\\s*$`)
    : member ? new RegExp(`^${esc(member[1])}\\s*\\.\\s*${esc(member[2])}\\s*$`) : null;
  return last && last.test(tail) ? endOfFileSentence(line) : null;
}
