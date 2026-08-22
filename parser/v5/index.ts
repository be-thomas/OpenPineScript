/**
 * Pine Script v5 parser entry point.
 *
 * The parse procedure is inherited from v1; only the generated classes differ.
 * v5's parser accepts `while` and `switch` because PineV5Parser.g4 declares
 * them and overrides the statement rules — nothing in this file needs to know.
 */
import { PineV5Parser } from "./generated/PineV5Parser.js";
import { PineV5TokenSource } from "../../lexer/v5/PineV5TokenSource.js";
import { createParser } from "../v1/index.js";

export type { ParserError, ParseResult } from "../v1/index.js";

export const parse = createParser(PineV5TokenSource, PineV5Parser, p => p.pine_script());
