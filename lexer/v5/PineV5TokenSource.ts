/**
 * Pine Script v5 token source.
 *
 * v5 adds two tokens (WHILE, SWITCH), which shifts every inherited token id.
 * The shared indentation logic reads its ids from the lexer class it is applied
 * to, so that renumbering is absorbed automatically — nothing here needs to
 * know about it.
 *
 * Indentation behaviour itself is unchanged. `while` and `switch` open blocks
 * exactly the way `if` and `for` do — a newline plus an indent — so the
 * inherited BEGIN/END/LEND logic already describes them. `switch` bodies are
 * the one new shape, and they are ordinary indented blocks whose lines happen
 * to contain '=>'; ARROW is already excluded from the continuation set for
 * multi-line function definitions, which is the same reason it must be
 * excluded here.
 */
import { PineV5Lexer } from "../../parser/v5/generated/PineV5Lexer.js";
import { IndentTokenSource } from "../v1/IndentTokenSource.js";

export class PineV5TokenSource extends IndentTokenSource(PineV5Lexer) {}
