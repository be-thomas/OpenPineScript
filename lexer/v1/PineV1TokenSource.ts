/**
 * Pine Script v1 token source — the base of the lexer hierarchy.
 *
 * Applies the shared indentation logic to v1's own generated lexer.
 */
import { PineV1Lexer } from "../../parser/v1/generated/PineV1Lexer.js";
import { IndentTokenSource } from "./IndentTokenSource.js";

export class PineV1TokenSource extends IndentTokenSource(PineV1Lexer) {}
