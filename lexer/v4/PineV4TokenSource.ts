/**
 * Pine Script v4 token source.
 *
 * v4 adds eleven tokens (VAR, VARIP, three qualifiers, nine type names), which
 * shifts every inherited token id. The shared indentation logic reads its ids
 * from the lexer class it is applied to, so that renumbering is absorbed
 * automatically — nothing here needs to know about it.
 *
 * Indentation behaviour itself is unchanged from v1: v4 introduces no new block
 * form. `var`/`varip` are modifiers on a declaration, not block openers.
 */
import { PineV4Lexer } from "../../parser/v4/generated/PineV4Lexer.js";
import { IndentTokenSource } from "../v1/IndentTokenSource.js";

export class PineV4TokenSource extends IndentTokenSource(PineV4Lexer) {}
