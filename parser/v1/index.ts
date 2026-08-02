/**
 * Pine Script v1 parser entry point — the base of the parser hierarchy.
 *
 * The parse procedure itself (wire up the token source, collect lexer AND parser
 * diagnostics, run the entry rule) is identical for every version. It lives here
 * as `createParser`, and each later version applies it to its own generated
 * classes. See parser/v2/index.ts and parser/v3/index.ts.
 */
import { CharStreams, CommonTokenStream, BaseErrorListener, Lexer, Parser } from "antlr4ng";
import { PineV1Parser } from "./generated/PineV1Parser.js";
import { PineV1TokenSource } from "../../lexer/v1/PineV1TokenSource.js";

export interface ParserError {
  line: number;
  column: number;
  message: string;
}

/**
 * Collects diagnostics from either a lexer or a parser.
 *
 * The parameters are `any` because antlr4ng types this callback against the
 * recogniser's ATN simulator, which differs between the two — one listener class
 * cannot satisfy both signatures nominally, and only `line`/`column`/`msg` are
 * read here.
 */
export class ErrorCollector extends BaseErrorListener<any> {
  errors: ParserError[] = [];

  override syntaxError(
    recognizer: any,
    offendingSymbol: any,
    line: number,
    charPositionInLine: number,
    msg: string,
    e: any,
  ): void {
    this.errors.push({ line, column: charPositionInLine, message: msg });
  }
}

export interface ParseResult<TTree> {
  tree: TTree;
  errorCount: number;
  errors: ParserError[];
}

/**
 * Builds a `parse(source)` for one version, from that version's token source
 * and parser. `entry` names the grammar's start rule.
 */
export function createParser<TParser extends Parser, TTree>(
  TokenSourceCtor: new (input: any) => Lexer,
  ParserCtor: new (input: CommonTokenStream) => TParser,
  entry: (parser: TParser) => TTree,
): (source: string) => ParseResult<TTree> {
  return function parse(source: string): ParseResult<TTree> {
    const inputStream = CharStreams.fromString(source);

    // The custom token source wraps the generated lexer and turns indentation
    // into the virtual BEGIN/END/LEND tokens the grammar expects.
    const lexer = new TokenSourceCtor(inputStream);

    lexer.removeErrorListeners();
    const lexerListener = new ErrorCollector();
    lexer.addErrorListener(lexerListener);

    const tokenStream = new CommonTokenStream(lexer);
    const parser = new ParserCtor(tokenStream);

    parser.removeErrorListeners();
    const parserListener = new ErrorCollector();
    parser.addErrorListener(parserListener);

    const tree = entry(parser);

    // Lexer and parser diagnostics are reported together — a bad token and the
    // syntax error it causes are one problem to the caller.
    //
    // `indentErrors` comes from IndentTokenSource, which cannot reach the error
    // listeners: it rewrites the token stream rather than failing to read a
    // character, so ANTLR never learns anything went wrong. A mismatched
    // unindent used to be written to the console and ignored, letting the parser
    // run over a stream the lexer knew was broken.
    const indentErrors = (lexer as any).indentErrors ?? [];
    const allErrors = [...lexerListener.errors, ...indentErrors, ...parserListener.errors];

    return { tree, errorCount: allErrors.length, errors: allErrors };
  };
}

export const parse = createParser(PineV1TokenSource, PineV1Parser, p => p.pine_script());
