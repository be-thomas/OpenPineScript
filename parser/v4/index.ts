/**
 * Pine Script v4 parser entry point.
 *
 * The parse procedure is inherited from v1; only the generated classes differ.
 * v4's parser accepts `var float x = na` because PineV4Parser.g4 overrides
 * var_def — nothing in this file needs to know that.
 */
import { PineV4Parser } from "./generated/PineV4Parser.js";
import { PineV4TokenSource } from "../../lexer/v4/PineV4TokenSource.js";
import { createParser } from "../v1/index.js";

export type { ParserError, ParseResult } from "../v1/index.js";

export const parse = createParser(PineV4TokenSource, PineV4Parser, p => p.pine_script());
