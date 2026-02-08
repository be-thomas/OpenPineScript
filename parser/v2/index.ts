import { CharStreams, CommonTokenStream, BaseErrorListener, RecognitionException, Recognizer } from "antlr4ng";
import { PineScriptParser } from "./generated/PineScriptParser.js";
import { PineScriptTokenSource } from "../../lexer/v2/PineScriptTokenSource"; 


export interface ParserError {
    line: number;
    column: number;
    message: string;
}

class ErrorCollector extends BaseErrorListener<any> {
    errors: ParserError[] = [];
    
    override syntaxError(
        recognizer: Recognizer<any>, 
        offendingSymbol: any, 
        line: number, 
        charPositionInLine: number, 
        msg: string, 
        e: RecognitionException | undefined
    ): void {
        this.errors.push({ 
            line, 
            column: charPositionInLine, 
            message: msg 
        });
    }
}

export function parse(source: string): {
  tree: ReturnType<PineScriptParser["opsv2_script"]>; 
  errorCount: number;
  errors: ParserError[]; 
} {
  const inputStream = CharStreams.fromString(source);
  
  // 3. USE YOUR CUSTOM TOKEN SOURCE (Instead of PineScriptLexer)
  // This wraps the lexer and handles the indentation logic.
  const lexer = new PineScriptTokenSource(inputStream);
  
  lexer.removeErrorListeners();
  const lexerListener = new ErrorCollector();
  lexer.addErrorListener(lexerListener);

  const tokenStream = new CommonTokenStream(lexer);
  const parser = new PineScriptParser(tokenStream);

  parser.removeErrorListeners();
  const parserListener = new ErrorCollector();
  parser.addErrorListener(parserListener);

  // Execute Parse
  const tree = parser.opsv2_script();
  
  // Combine errors from both Lexer and Parser
  const allErrors = [...lexerListener.errors, ...parserListener.errors];

  return { 
      tree, 
      errorCount: allErrors.length,
      errors: allErrors 
  };
}
