import { Token, CharStream, TokenFactory, CommonToken } from "antlr4ng";
import { PineScriptLexer } from "../../parser/v2/generated/PineScriptLexer.js";

export class PineScriptTokenSource extends PineScriptLexer {
  private pendingTokens: Token[] = [];
  private indentStack: number[] = [0];
  
  // New State for Style Enforcement & Multiline support
  private indentUnit: number | null = null; 
  private parenLevel: number = 0;

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
    // 1. Flush Pending Tokens (Virtual tokens queued up)
    if (this.pendingTokens.length > 0) {
      return this.pendingTokens.shift()!;
    }

    const t = super.nextToken();

    // 2. Track Parentheses/Brackets (Ignore indentation inside parens)
    if (t.type === PineScriptLexer.LPAR || t.type === PineScriptLexer.LSQBR) {
        this.parenLevel++;
    } else if (t.type === PineScriptLexer.RPAR || t.type === PineScriptLexer.RSQBR) {
        if (this.parenLevel > 0) this.parenLevel--;
    }

    // 3. Handle Explicit Indentation (LBEG)
    // LBEG matches: Newline(s) + Spaces/Tabs
    if (t.type === PineScriptLexer.LBEG) {
      // If inside parentheses, treat as simple whitespace (ignore indent logic)
      // But since LBEG contains a newline, we usually want to treat it as a hidden channel 
      // or simple separator. For strict Pine, we just return it and let parser skip/handle if needed.
      // However, usually we just skip emission if inside parens to allow multi-line function calls.
      if (this.parenLevel > 0) {
          // Return as Hidden/Skipped or just a normal token depending on grammar needs.
          // For now, we return it, but Parser rules usually don't match LBEG inside exprs.
          return this.getChannel() === Token.HIDDEN_CHANNEL ? this.nextToken() : t;
      }

      // Calculate Indent Length
      // Safe Text Retrieval:
      let text = t.text;
      if (!text && this.inputStream) {
          text = this.inputStream.getText({ start: t.start, stop: t.stop });
      }
      text = text || "";

      // Calculate length relative to the last newline
      const lastNewLineIndex = text.lastIndexOf('\n');
      const indentStr = (lastNewLineIndex === -1) ? text : text.substring(lastNewLineIndex + 1);
      
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

      // Enforce Style Consistency
      if (this.indentUnit === null) {
          this.indentUnit = delta; 
      } else if (delta % this.indentUnit !== 0) {
          console.warn(`[Lexer Warning] Inconsistent indentation at line ${triggerToken.line}. Expected multiple of ${this.indentUnit}.`);
      }

      this.indentStack.push(indentLength);
      return this.createVirtualToken(PineScriptLexer.BEGIN, "<BEGIN>", triggerToken);
    } 
    else if (indentLength < currentIndent) {
      // --- DEDENT ---
      const tokensToEmit: Token[] = [];
      
      // 1. Finish the previous statement
      tokensToEmit.push(this.createVirtualToken(PineScriptLexer.LEND, "<LEND>", triggerToken));

      // 2. Pop stack until we find the matching level
      while (this.indentStack.length > 1 && indentLength < this.indentStack[this.indentStack.length - 1]) {
        this.indentStack.pop();
        tokensToEmit.push(this.createVirtualToken(PineScriptLexer.END, "<END>", triggerToken));
      }

      // Check for alignment error
      if (indentLength !== this.indentStack[this.indentStack.length - 1]) {
          console.error(`[Lexer Error] Indentation Error at line ${triggerToken.line}: Unindent does not match any outer indentation level.`);
      }
      
      // 3. If we landed on an existing level, this newline is also a separator for that level
      if (this.indentStack.length > 0) {
           tokensToEmit.push(this.createVirtualToken(PineScriptLexer.LEND, "<LEND>", triggerToken));
      }

      // 4. Queue Tokens
      // If trigger was NOT LBEG (e.g. Implicit Dedent on 'if'), preserve it.
      // If trigger WAS LBEG, we consume it (it becomes the LENDs).
      if (triggerToken.type !== PineScriptLexer.LBEG && !isEOF) {
          // If we already pushed it in nextToken (Implicit Dedent case), 
          // we need to put our virtual tokens BEFORE it.
          // this.pendingTokens already contains [triggerToken] from step 4 above.
          // We unshift to put virtual tokens first.
          
          // Actually, step 4 above pushed it to END of pendingTokens.
          // We want the order: [LEND, END, ..., TriggerToken]
          
          // Since pendingTokens likely has [TriggerToken], we replace it:
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
    } 
    else {
      // --- SAME INDENT ---
      // Convert LBEG -> LEND (Logical Newline)
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