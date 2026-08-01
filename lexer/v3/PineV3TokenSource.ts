/**
 * Pine Script v3 token source.
 *
 * v3 adds the ASSIGN (':=') token, which shifts every inherited token id. The
 * shared logic reads its ids from the lexer class it is applied to, so that
 * renumbering is absorbed automatically — nothing here needs to know about it.
 */
import { PineV3Lexer } from "../../parser/v3/generated/PineV3Lexer.js";
import { IndentTokenSource } from "../v1/IndentTokenSource.js";

export class PineV3TokenSource extends IndentTokenSource(PineV3Lexer) {}
