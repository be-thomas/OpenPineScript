/**
 * Pine Script v2 token source.
 *
 * v2 changes nothing about indentation handling, so it imports the shared logic
 * from v1 and applies it to v2's own generated lexer.
 *
 * Note this deliberately does NOT extend PineV1TokenSource: that would inherit
 * v1's LEXER along with the behaviour, and parse v2 with v1's token set. See the
 * header of lexer/v1/IndentTokenSource.ts.
 */
import { PineV2Lexer } from "../../parser/v2/generated/PineV2Lexer.js";
import { IndentTokenSource } from "../v1/IndentTokenSource.js";

export class PineV2TokenSource extends IndentTokenSource(PineV2Lexer) {}
