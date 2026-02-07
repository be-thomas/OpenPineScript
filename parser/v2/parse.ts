import { CharStreams, CommonTokenStream, BaseErrorListener, RecognitionException, Recognizer } from "antlr4ng";
import { PineScriptParser } from "./generated/PineScriptParser.js";
import { PineScriptTokenSource } from "../../lexer/v2/PinescriptTokenSource.js";

class ErrorCollector extends BaseErrorListener<any> {
    errors: string[] = [];
    
    override syntaxError(
        recognizer: Recognizer<any>, 
        offendingSymbol: any, 
        line: number, 
        charPositionInLine: number, 
        msg: string, 
        e: RecognitionException | null
    ): void {
        this.errors.push(`line ${line}:${charPositionInLine} ${msg}`);
    }
}

export function parse(source: string): {
  tree: ReturnType<PineScriptParser["tvscript"]>;
  errorCount: number;
  firstError: string | null;
} {
  const inputStream = CharStreams.fromString(source);
  const lexer = new PineScriptTokenSource(inputStream);
  
  // Capture Lexer Errors
  lexer.removeErrorListeners();
  const lexerListener = new ErrorCollector();
  lexer.addErrorListener(lexerListener);

  const tokenStream = new CommonTokenStream(lexer);
  const parser = new PineScriptParser(tokenStream);

  // Capture Parser Errors
  parser.removeErrorListeners();
  const parserListener = new ErrorCollector();
  parser.addErrorListener(parserListener);

  const tree = parser.tvscript();
  
  const allErrors = [...lexerListener.errors, ...parserListener.errors];

  return { 
      tree, 
      errorCount: allErrors.length,
      firstError: allErrors.length > 0 ? allErrors[0] : null
  };
}