/**
 * Pine Script v2 parser entry point.
 *
 * The parse procedure is inherited from v1; only the generated classes differ.
 */
import { PineV2Parser } from "./generated/PineV2Parser.js";
import { PineV2TokenSource } from "../../lexer/v2/PineV2TokenSource.js";
import { createParser } from "../v1/index.js";

export type { ParserError, ParseResult } from "../v1/index.js";

export const parse = createParser(PineV2TokenSource, PineV2Parser, p => p.pine_script());
