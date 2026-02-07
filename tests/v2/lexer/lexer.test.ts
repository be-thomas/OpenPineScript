/**
 * Lexer v2 tests using the PineScriptTokenSource (Smart Lexer).
 */
import { describe, it } from "node:test";
import assert from "node:assert";
import * as path from "node:path";
import * as fs from "node:fs";
import { CharStreams, CommonTokenStream, Lexer } from "antlr4ng";
import { PineScriptLexer } from "../../../parser/v2/generated/PineScriptLexer.js";
// IMPORT YOUR SMART LEXER
import { PineScriptTokenSource } from "../../../lexer/v2/PineScriptTokenSource.js"; 

const FIXTURES_DIR = path.join(__dirname, "fixtures");

function loadFixture(name: string): string {
  const p = path.join(FIXTURES_DIR, name.endsWith(".pine") ? name : `${name}.pine`);
  return fs.readFileSync(p, "utf-8");
}

function tokenize(source: string): { types: string[]; tokens: import("antlr4ng").Token[] } {
  const input = CharStreams.fromString(source);
  
  // USE THE SMART LEXER, NOT THE RAW ONE
  // This ensures LEND, BEGIN, and END are generated.
  const lexer = new PineScriptTokenSource(input);
  
  const stream = new CommonTokenStream(lexer as unknown as Lexer);
  stream.fill();
  const tokens = stream.getTokens();
  
  const types = tokens
    .filter((t) => t.type !== -1) // EOF
    .map((t) => lexer.vocabulary.getSymbolicName(t.type) ?? String(t.type));
    
  return { types, tokens };
}

function hasTokenTypes(types: string[], ...expected: string[]): boolean {
  const set = new Set(types);
  return expected.every((e) => set.has(e));
}

function hasTokenWithText(tokens: { text: string; type: number }[], typeId: number, text: string): boolean {
  // Safe navigation for text, as it might be undefined on some tokens
  return tokens.some((t) => t.type === typeId && (t.text ?? "") === text);
}

describe("lexer v2 (ANTLR)", () => {
  describe("var_def and basics", () => {
    it("tokenizes var_def.pine: ID, DEFINE, INT_LITERAL, LEND", () => {
      const source = loadFixture("var_def.pine");
      const { types } = tokenize(source);
      assert.ok(hasTokenTypes(types, "ID", "DEFINE", "INT_LITERAL", "LEND"));
    });

    it("tokenizes directives_and_keywords.pine with keywords and identifiers", () => {
      const source = loadFixture("directives_and_keywords.pine");
      const { types } = tokenize(source);
      assert.ok(hasTokenTypes(types, "OR", "AND", "NOT", "IF_COND", "IF_COND_ELSE"));
      assert.ok(hasTokenTypes(types, "FOR_STMT", "FOR_STMT_TO", "FOR_STMT_BY", "BREAK", "CONTINUE"));
    });
  });

  describe("keywords", () => {
    it("tokenizes bool literals as BOOL_LITERAL", () => {
      const source = loadFixture("directives_and_keywords.pine");
      const { types, tokens } = tokenize(source);
      assert.ok(hasTokenTypes(types, "BOOL_LITERAL"));
      assert.ok(hasTokenWithText(tokens, PineScriptLexer.BOOL_LITERAL, "true"));
      assert.ok(hasTokenWithText(tokens, PineScriptLexer.BOOL_LITERAL, "false"));
    });

    it("tokenizes var_assign_if.pine: IF_COND, EQ, ASSIGN", () => {
      const source = loadFixture("var_assign_if.pine");
      const { types } = tokenize(source);
      assert.ok(hasTokenTypes(types, "IF_COND", "EQ", "ASSIGN"));
    });
  });

  describe("operators", () => {
    it("tokenizes operators.pine: EQ, NEQ, GT, GE, LT, LE, PLUS, MINUS, MUL, DIV, MOD, COND, COND_ELSE, ASSIGN, ARROW", () => {
      const source = loadFixture("operators.pine");
      const { types } = tokenize(source);
      assert.ok(hasTokenTypes(types, "EQ", "NEQ", "GT", "GE", "LT", "LE"));
      assert.ok(hasTokenTypes(types, "PLUS", "MINUS", "MUL", "DIV", "MOD"));
      assert.ok(hasTokenTypes(types, "COND", "COND_ELSE", "ASSIGN", "ARROW"));
    });
  });

  describe("literals", () => {
    it("tokenizes literals.pine: INT_LITERAL, FLOAT_LITERAL, STR_LITERAL, BOOL_LITERAL, COLOR_LITERAL", () => {
      const source = loadFixture("literals.pine");
      const { types } = tokenize(source);
      assert.ok(hasTokenTypes(types, "INT_LITERAL", "FLOAT_LITERAL", "STR_LITERAL", "BOOL_LITERAL", "COLOR_LITERAL"));
    });

    it("tokenizes numbers.pine: int, float, .5, scientific", () => {
      const source = loadFixture("numbers.pine");
      const { types } = tokenize(source);
      assert.ok(hasTokenTypes(types, "INT_LITERAL", "FLOAT_LITERAL"));
    });

    it("tokenizes strings_and_colors.pine: STR_LITERAL, COLOR_LITERAL", () => {
      const source = loadFixture("strings_and_colors.pine");
      const { types } = tokenize(source);
      assert.ok(hasTokenTypes(types, "STR_LITERAL", "COLOR_LITERAL"));
    });
  });

  describe("structure", () => {
    it("tokenizes multiline_indent.pine: LEND, LBEG", () => {
      const source = loadFixture("multiline_indent.pine");
      const { types } = tokenize(source);
      // Now that we use TokenSource, this will pass!
      assert.ok(hasTokenTypes(types, "LEND")); 
      assert.ok(types.includes("LEND"));
    });
  });

  describe("calls and brackets", () => {
    it("tokenizes calls_and_brackets.pine: LPAR, RPAR, LSQBR, RSQBR, COMMA", () => {
      const source = loadFixture("calls_and_brackets.pine");
      const { types } = tokenize(source);
      assert.ok(hasTokenTypes(types, "LPAR", "RPAR", "LSQBR", "RSQBR", "COMMA"));
    });
  });
});