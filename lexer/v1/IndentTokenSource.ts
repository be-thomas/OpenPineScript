/**
 * Indentation-sensitive token source — BASE (v1).
 *
 * Pine Script is indentation-structured, but ANTLR lexers are not. This wraps a
 * generated lexer and rewrites its raw LBEG (newline + leading whitespace)
 * tokens into the virtual BEGIN / END / LEND tokens the parser grammars expect.
 *
 * ── Why this is a MIXIN and not a plain base class ──────────────────────────
 *
 * Every version generates its own lexer class (PineV1Lexer, PineV2Lexer, …), and
 * a class can only extend one of them. A subclass chain like
 * `PineV2TokenSource extends PineV1TokenSource` would therefore inherit v1's
 * LEXER, not v2's — silently parsing every version with v1's token set.
 *
 * The mixin inverts that: each version applies this shared logic to ITS OWN
 * generated lexer, so the behaviour is inherited while the token set is not.
 *
 * ── Why token ids are read off the class, not imported ──────────────────────
 *
 * Token numbering differs per version: v3 declares ASSIGN in the importing
 * grammar, which shifts every inherited token's id. Hard-coding v1's numbers
 * would mis-identify parentheses in v3. Ids are read from the concrete lexer
 * class passed in, so each version is self-consistent by construction.
 */
import { Token, CharStream, TokenFactory, CommonToken, Interval } from "antlr4ng";

/** The token ids this logic needs. Every version's lexer declares all of them. */
export interface IndentTokenIds {
  readonly LPAR: number;
  readonly RPAR: number;
  readonly LSQBR: number;
  readonly RSQBR: number;
  readonly LBEG: number;
  readonly BEGIN: number;
  readonly END: number;
  readonly LEND: number;
}

/**
 * The slice of a generated lexer this logic touches.
 *
 * Deliberately NOT antlr4ng's `Lexer`: that class is abstract, and a mixin whose
 * base is typed as an abstract class is itself treated as abstract, so the
 * returned class cannot be instantiated. The concrete generated lexers supply
 * those members; describing only what is used here keeps the mixin concrete.
 */
interface LexerLike {
  nextToken(): Token;
  readonly inputStream: { getText(interval: Interval): string; LA(offset: number): number } | null;
}

/** Mixin bases must accept `...args: any[]` — TS2545. */
type GeneratedLexerCtor = new (...args: any[]) => LexerLike;

/**
 * Wraps `Base` — a generated Pine lexer class — with indentation handling.
 * Returns a new class; it is not applied to any version here.
 */
/**
 * Tokens that cannot END an expression. A line finishing on one of these has an
 * incomplete expression, so the following newline is a CONTINUATION rather than
 * a new statement or a block.
 *
 * Named rather than numbered because token ids differ per version — v2 adds
 * ASSIGN, which renumbers everything inherited. Resolved against each version's
 * own lexer, so a version that lacks one of these simply skips it.
 *
 * ARROW ('=>') is deliberately ABSENT: `f(x) =>` at end of line introduces an
 * indented function BODY, not a continuation. Treating it as one would delete
 * every multi-line function definition.
 */
const CONTINUATION_TOKEN_NAMES = [
  "DEFINE", "ASSIGN", "COMMA",
  "PLUS", "MINUS", "MUL", "DIV", "MOD",
  "COND", "COND_ELSE",
  "AND", "OR", "NOT",
  "EQ", "NEQ", "GT", "GE", "LT", "LE",
];

export function IndentTokenSource<TBase extends GeneratedLexerCtor>(Base: TBase) {
  // Resolved once per version, from that version's own generated lexer.
  const T = Base as unknown as IndentTokenIds;

  const CONTINUATION_IDS = new Set<number>(
    CONTINUATION_TOKEN_NAMES
      .map(n => (Base as unknown as Record<string, number>)[n])
      .filter((id): id is number => typeof id === "number"),
  );

  return class IndentAwareTokenSource extends Base {
    private pendingTokens: Token[] = [];
    private indentStack: number[] = [0];

    /** Established by the first indent; later indents must be a multiple of it. */
    private indentUnit: number | null = null;
    /** Inside ( ) or [ ], newlines are plain whitespace. */
    private parenLevel: number = 0;
    /** Type of the last real (non-virtual) token, for continuation detection. */
    private lastRealToken: number = -1;

    /**
     * Structural indentation errors, drained by createParser.
     *
     * Public because it crosses the lexer/parser boundary: the token source has
     * no access to the parser's error listeners, and these must be reported
     * alongside syntax errors rather than written to the console.
     */
    public indentErrors: { line: number; column: number; message: string }[] = [];

    public tokenFactory: TokenFactory<Token>;

    constructor(...args: any[]) {
      super(args[0] as CharStream);
      this.tokenFactory = {
        create: (source, type, text, channel, start, stop, line, charPositionInLine) => {
          const t = new CommonToken(source, type, channel, start, stop);
          t.line = line;
          t.column = charPositionInLine;
          if (text !== undefined && text !== null) (t as any).text = text;
          return t;
        },
      };
    }

    public override nextToken(): Token {
      // 1. Flush Pending Tokens (Virtual tokens queued up)
      if (this.pendingTokens.length > 0) {
        return this.pendingTokens.shift()!;
      }

      const t = super.nextToken();

      // Remember the last REAL token so the LBEG branch below can tell a
      // continuation from a new statement. LBEG itself is not a real token.
      if (t.type !== T.LBEG && t.type !== Token.EOF) {
        this.lastRealToken = t.type;
      }

      // 2. Track Parentheses/Brackets (Ignore indentation inside parens)
      if (t.type === T.LPAR || t.type === T.LSQBR) {
        this.parenLevel++;
      } else if (t.type === T.RPAR || t.type === T.RSQBR) {
        if (this.parenLevel > 0) this.parenLevel--;
      }

      // 3. Handle Explicit Indentation (LBEG)
      // LBEG matches: Newline(s) + Spaces/Tabs
      if (t.type === T.LBEG) {
        // Inside ( ) or [ ], a newline is just whitespace — that is what lets a
        // function call span lines. Drop the token entirely and take the next one.
        //
        // This previously called this.getChannel(), which does not exist on the
        // generated lexer, so any script with a multi-line call crashed with
        // "this.getChannel is not a function". Emitting the LBEG instead is not an
        // option either: no parser rule matches LBEG, so it would be a syntax error.
        if (this.parenLevel > 0) {
          return this.nextToken();
        }

        // A CONTINUATION line: the previous line ended on a token that cannot
        // finish an expression, so this newline is inside an expression, not
        // between statements. Pine allows:
        //
        //     shortTermDays_adj =
        //       not allowAdamOverride ? shortTermDays :
        //       ticker == "BTCUSD"    ? 16 :
        //       20
        //
        // Measured naively the second line is an INDENT, so the lexer emitted
        // <BEGIN> and the parser rejected it — 598 errors on one 708-line
        // script. Drop the newline entirely, exactly as inside parentheses.
        //
        // The indent stack is deliberately untouched: nothing was pushed, so
        // returning to column 0 afterwards needs no matching dedent.
        if (CONTINUATION_IDS.has(this.lastRealToken) || this.nextLineStartsWithOperator()) {
          return this.nextToken();
        }

        // A line with no CODE on it carries no indentation information.
        //
        // Two kinds qualify:
        //
        //  BLANK. LBEG is `('\r'? '\n' | '\r')+ [ \t]*`, so for
        //  "x = 1\n \nplot(x)" it matches "\n " — a newline plus the one space
        //  that is the whole of the next line. Measured naively that is an
        //  INDENT of 1, so the lexer emitted <BEGIN>, then <END> on the
        //  following newline, and the parser rejected both. A single space on an
        //  otherwise empty line broke the whole script, in every version.
        //
        //  COMMENT-ONLY. LINE_COMMENT is `-> skip`, so by the time the parser
        //  sees the stream the comment is gone — but the indentation in front of
        //  it was already measured, and an indented comment therefore opened a
        //  block with no statements in it:
        //
        //      // if crossover(corHighYield, .60)
        //          //signal1 := 100          <- <BEGIN> here, body empty
        //          //strategy.close('buy')
        //      plot(signal1)                 <- <END>
        //
        //  Commenting out the body of a block is ordinary editing and
        //  TradingView accepts it; this engine rejected the whole script.
        //
        // The LBEG is DROPPED rather than turned into a <LEND>, which is the
        // part that matters. A <LEND> here would land between a block header and
        // its body —
        //
        //      if cond
        //          // what this branch does        <- <LEND> before <BEGIN>
        //          x = 1
        //
        // — and `if_expr` takes its block immediately after the condition, so
        // emitting one broke every commented block instead. Dropping the token
        // lets the next line with actual code establish the indent, which is
        // exactly where the structure is.
        const nextChar = this.inputStream?.LA(1);
        const secondChar = this.inputStream?.LA(2);
        const atComment =
          nextChar === 0x2f /* / */ && (secondChar === 0x2f /* / */ || secondChar === 0x2a /* * */);
        const atBlankLine = nextChar === 0x0a || nextChar === 0x0d || nextChar === -1;
        if (atBlankLine || atComment) {
          return this.nextToken();
        }

        // Calculate Indent Length
        // Safe Text Retrieval:
        let text = t.text;
        if (!text && this.inputStream) {
          text = this.inputStream.getText(new Interval(t.start, t.stop));
        }
        text = text || "";

        // Calculate length relative to the last newline
        const lastNewLineIndex = text.lastIndexOf("\n");
        const indentStr = lastNewLineIndex === -1 ? text : text.substring(lastNewLineIndex + 1);

        // Tab Expansion: 1 Tab = 4 Spaces (Standardize width)
        const indentLength = indentStr.replace(/\t/g, "    ").length;

        return this.handleIndentation(indentLength, t);
      }

      // 4. Handle Implicit Dedent (Column 0 check)
      // If we see a token starting at Col 0 that isn't EOF and isn't a Newline,
      // it implies we dropped back to base level (or some previous level).
      else if (t.column === 0 && t.type !== Token.EOF && this.indentStack.length > 1) {
        // We defer processing this token until we emit the Dedents
        this.pendingTokens.push(t);
        return this.handleIndentation(0, t);
      }

      // 5. Handle EOF (Force Dedent to 0)
      if (t.type === Token.EOF) {
        return this.handleIndentation(0, t, true);
      }

      return t;
    }

    private handleIndentation(indentLength: number, triggerToken: Token, isEOF = false): Token {
      const currentIndent = this.indentStack[this.indentStack.length - 1];

      if (indentLength > currentIndent) {
        // --- INDENT ---
        const delta = indentLength - currentIndent;

        // The first indent establishes the unit. Deltas that are not a multiple
        // of it are ACCEPTED, deliberately: `indentUnit` is this engine's
        // heuristic, not TradingView's rule (which is a tab or four spaces per
        // level, with its own allowances for continuation lines). Rejecting on a
        // heuristic would reject valid scripts, so nothing is reported here.
        // A genuinely broken structure is caught by the dedent branch below,
        // where the token stream is provably wrong rather than merely unusual.
        if (this.indentUnit === null) this.indentUnit = delta;

        this.indentStack.push(indentLength);
        return this.createVirtualToken(T.BEGIN, "<BEGIN>", triggerToken);
      } else if (indentLength < currentIndent) {
        // --- DEDENT ---
        const tokensToEmit: Token[] = [];

        // 1. Finish the previous statement
        tokensToEmit.push(this.createVirtualToken(T.LEND, "<LEND>", triggerToken));

        // 2. Pop stack until we find the matching level
        while (
          this.indentStack.length > 1 &&
          indentLength < this.indentStack[this.indentStack.length - 1]
        ) {
          this.indentStack.pop();
          tokensToEmit.push(this.createVirtualToken(T.END, "<END>", triggerToken));
        }

        // An unindent that lands between two levels is a REJECTION, not a note.
        //
        // This used to `console.error` and carry on, so the parser then ran over
        // a token stream the lexer already knew was wrong — either producing a
        // confusing downstream syntax error or, worse, transpiling something the
        // author did not write. TradingView rejects this outright, and rejecting
        // rather than approximating is the rule everywhere else in this engine
        // (v3's guards, UnimplementedVersionError, the null rows in PIPELINES).
        //
        // Recorded on the token source rather than thrown: createParser merges
        // these with the parser's own diagnostics, so the caller gets one list
        // and the usual "parsing failed with N error(s)" instead of an exception
        // from inside the lexer.
        if (indentLength !== this.indentStack[this.indentStack.length - 1]) {
          this.indentErrors.push({
            line: triggerToken.line,
            column: indentLength,
            message:
              `unindent does not match any outer indentation level ` +
              `(dedented to column ${indentLength}; open levels are ` +
              `${this.indentStack.join(", ")})`,
          });
        }

        // 3. If we landed on an existing level, this newline is also a separator for that level
        if (this.indentStack.length > 0) {
          tokensToEmit.push(this.createVirtualToken(T.LEND, "<LEND>", triggerToken));
        }

        // 4. Queue Tokens
        // If trigger was NOT LBEG (e.g. Implicit Dedent on 'if'), preserve it.
        // If trigger WAS LBEG, we consume it (it becomes the LENDs).
        if (triggerToken.type !== T.LBEG && !isEOF) {
          // pendingTokens already holds [triggerToken] from step 4 of nextToken();
          // the virtual tokens must come BEFORE it, so pop and re-push in order.
          const existingTrigger = this.pendingTokens.pop();
          this.pendingTokens.push(...tokensToEmit);
          if (existingTrigger) this.pendingTokens.push(existingTrigger);
        } else {
          // LBEG case: Just emit virtuals, consume LBEG.
          this.pendingTokens.push(...tokensToEmit);
        }

        if (isEOF) {
          this.pendingTokens.push(triggerToken); // Push EOF last
        }

        return this.pendingTokens.shift()!;
      } else {
        // --- SAME INDENT ---
        // Convert LBEG -> LEND (Logical Newline)
        if (triggerToken.type === T.LBEG) {
          return this.createVirtualToken(T.LEND, "<LEND>", triggerToken);
        }
        return triggerToken;
      }
    }

    /**
     * Does the line about to start BEGIN with an operator?
     *
     * The other half of continuation detection. A break can be written either
     * side of the operator, and published code does both:
     *
     *     esam = poles == 3
     *          ? get3PoleSSF(mom, length)      <- leading '?'
     *          : get2PoleSSF(mom, length)
     *
     * The previous line ends on a complete expression (`3`), so the
     * end-of-line test cannot see this one.
     *
     * Read straight off the character stream because the token for that line
     * has not been produced yet, and a token source cannot look ahead through
     * itself. Restricted to '?', ':', 'and' and 'or' — the forms that actually
     * occur — because a leading '-' or '*' is ambiguous with a statement, and
     * over-reaching here would silently glue two statements together.
     */
    private nextLineStartsWithOperator(): boolean {
      const s = this.inputStream;
      if (!s) return false;

      const c1 = s.LA(1);
      if (c1 === 0x3f /* ? */ || c1 === 0x3a /* : */) return true;

      const at = (n: number) => String.fromCharCode(s.LA(n));
      const word = at(1) + at(2) + at(3) + at(4);
      // Require a following space or '(' so identifiers like `android` or
      // `orders` are not mistaken for the operators.
      if (/^and[\s(]/.test(word)) return true;
      if (/^or[\s(]/.test(word)) return true;
      return false;
    }

    private createVirtualToken(type: number, text: string, original: Token): Token {
      const sourceTuple: any = [this, this.inputStream];
      return this.tokenFactory.create(
        sourceTuple,
        type,
        text,
        original.channel,
        original.start,
        original.stop,
        original.line,
        original.column,
      );
    }
  };
}
