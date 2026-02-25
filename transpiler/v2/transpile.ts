// src/transpiler/v2/transpile.ts

import { Token } from "../../lexer/v2/tokens";
import { Directives } from "../../lexer/v2/directives";
import { createParserToken } from "../../parser/v2/parser_tokens";
import { OpenPinescriptParser } from "../../parser/v2/parser_builder";
import { PineToJsTranspiler } from "./transpiler";

/**
 * A complete pipeline function that takes lexer output, parses it,
 * and transpiles it to a JavaScript code string.
 * @param tokenized_output The output from the lexer.
 * @returns The transpiled JavaScript code.
 * @throws An error if parsing fails.
 */
export function transpile(tokenized_output: {tokens: Token[], directives: Directives}): string {
    const { tokens } = tokenized_output;
    const parserTokens = tokens.map(createParserToken);

    const parser = new OpenPinescriptParser();
    parser.input = parserTokens;
    const cst = parser.script();

    // Check for parsing errors and throw if any are found
    if (parser.errors.length > 0) {
        const errorMessages = parser.errors.map(err => err.message).join("\n");
        throw new Error(`Parsing failed with ${parser.errors.length} errors:\n${errorMessages}`);
    }
    
    // If parsing is successful, transpile the CST to JavaScript
    const transpiler = new PineToJsTranspiler();
    const jsCode = transpiler.visit(cst);
    
    return jsCode;
}
