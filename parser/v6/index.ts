/**
 * Pine Script v6 parser entry point.
 *
 * The parse procedure is inherited from v1; only the generated classes differ.
 * v6's parser accepts `once` and triple-quoted strings because PineV6Parser.g4
 * declares them and overrides the statement and literal rules — nothing in
 * this file needs to know.
 */
import { PineV6Parser } from "./generated/PineV6Parser.js";
import { PineV6TokenSource } from "../../lexer/v6/PineV6TokenSource.js";
import { createParser } from "../v1/index.js";

export type { ParserError, ParseResult } from "../v1/index.js";

export const parse = createParser(PineV6TokenSource, PineV6Parser, p => p.pine_script());
