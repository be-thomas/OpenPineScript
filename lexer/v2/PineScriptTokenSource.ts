import { Token, CharStream, TokenFactory, CommonToken } from "antlr4ng";
import { PineScriptLexer } from "../../parser/v2/generated/PineScriptLexer.js";

export class PineScriptTokenSource extends PineScriptLexer {
  private pendingTokens: Token[] = [];
  private indentStack: number[] = [0]; 
  public tokenFactory: TokenFactory<Token>;

  constructor(input: CharStream) {
    super(input);
    this.tokenFactory = {
        create: (source, type, text, channel, start, stop, line, charPositionInLine) => {
            const t = new CommonToken(source, type, channel, start, stop);
            t.line = line;
            t.column = charPositionInLine;
            if (text !== undefined && text !== null) (t as any).text = text;
            return t;
        }
    };
  }

  public override nextToken(): Token {
    if (this.pendingTokens.length > 0) {
      return this.pendingTokens.shift()!;
    }

    const t = super.nextToken();

    // 1. Handle Explicit Indentation (LBEG)
    if (t.type === PineScriptLexer.LBEG) {
      const text = t.text || "";
      const lastNewLineIndex = text.lastIndexOf('\n');
      const indentLength = (lastNewLineIndex === -1) ? text.length : text.length - lastNewLineIndex - 1;
      
      return this.handleIndentation(indentLength, t);
    } 
    
    // 2. Handle Implicit Dedent (Column 0 check for first line or non-newline starts)
    else if (t.column === 0 && t.type !== Token.EOF && this.indentStack.length > 1) {
        this.pendingTokens.push(t);
        return this.handleIndentation(0, t);
    }

    // 3. Handle EOF
    if (t.type === Token.EOF) {
      return this.handleIndentation(0, t, true); 
    }

    return t;
  }

  private handleIndentation(indentLength: number, triggerToken: Token, isEOF = false): Token {
    const currentIndent = this.indentStack[this.indentStack.length - 1];

    if (indentLength > currentIndent) {
      // Indent -> Emit BEGIN
      this.indentStack.push(indentLength);
      return this.createVirtualToken(PineScriptLexer.BEGIN, "<BEGIN>", triggerToken);
    } 
    else if (indentLength < currentIndent) {
      // Dedent -> We need to close the inner block(s) and potentially separate the current statement.
      
      const tokensToEmit: Token[] = [];
      
      // 1. Terminate the statement that just finished (the deeply indented one)
      tokensToEmit.push(this.createVirtualToken(PineScriptLexer.LEND, "<LEND>", triggerToken));

      // 2. Pop stack and emit ENDs until we find the matching level
      while (this.indentStack.length > 1 && indentLength < this.indentStack[this.indentStack.length - 1]) {
        this.indentStack.pop();
        tokensToEmit.push(this.createVirtualToken(PineScriptLexer.END, "<END>", triggerToken));
      }
      
      // 3. CRITICAL FIX: If we landed exactly on a previous indent level, 
      //    this newline ALSO acts as a separator (LEND) for that level.
      if (this.indentStack.length > 0 && indentLength === this.indentStack[this.indentStack.length - 1]) {
           tokensToEmit.push(this.createVirtualToken(PineScriptLexer.LEND, "<LEND>", triggerToken));
      }

      // 4. Queue tokens
      if (this.pendingTokens.length > 0 && this.pendingTokens[this.pendingTokens.length - 1] === triggerToken) {
           const trigger = this.pendingTokens.pop()!;
           this.pendingTokens.push(...tokensToEmit);
           this.pendingTokens.push(trigger);
      } else {
           this.pendingTokens.push(...tokensToEmit);
      }

      if (isEOF) {
           this.pendingTokens.push(triggerToken);
           return this.pendingTokens.shift()!;
      }

      return this.pendingTokens.shift()!;
    } 
    else {
      // Same Indent -> Emit LEND
      if (triggerToken.type === PineScriptLexer.LBEG) {
          return this.createVirtualToken(PineScriptLexer.LEND, "<LEND>", triggerToken);
      }
      return triggerToken;
    }
  }

  private createVirtualToken(type: number, text: string, original: Token): Token {
      const sourceTuple: any = [this, this.inputStream]; 
      return this.tokenFactory.create(sourceTuple, type, text, original.channel, original.start, original.stop, original.line, original.column);
  }
}
