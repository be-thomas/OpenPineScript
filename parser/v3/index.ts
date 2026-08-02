/**
 * Pine Script v3 parser entry point.
 *
 * The parse procedure is inherited from v1; only the generated classes differ.
 * v3's parser accepts `x := expr` because PineV3Parser.g4 declares var_assign —
 * nothing in this file needs to know that.
 */
import { PineV3Parser } from "./generated/PineV3Parser.js";
import { PineV3TokenSource } from "../../lexer/v3/PineV3TokenSource.js";
import { createParser } from "../v1/index.js";

export type { ParserError, ParseResult } from "../v1/index.js";

export const parse = createParser(PineV3TokenSource, PineV3Parser, p => p.pine_script());
