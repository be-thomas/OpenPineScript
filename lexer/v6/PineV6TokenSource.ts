/**
 * Pine Script v6 token source.
 *
 * v6 adds three tokens (ONCE, MLSTRING_DQ, MLSTRING_SQ), which shifts every
 * inherited token id. The shared indentation logic reads its ids from the
 * lexer class it is applied to, so that renumbering is absorbed automatically
 * — nothing here needs to know about it.
 *
 * ── The indentation relaxation that needed no code ─────────────────────────
 *
 * Release notes, December 2025: a line wrapped inside parentheses may now use
 * ANY indentation. Before v6, TradingView required a continuation line to be
 * indented by something that was NOT a multiple of four, because four spaces
 * is how a block is opened and it could not tell the two apart.
 *
 * This engine never had that restriction. IndentTokenSource drops the newline
 * entirely while `parenLevel > 0` — "inside ( ) or [ ], a newline is just
 * whitespace" — so indentation inside a wrapped call has never been measured
 * at any version. Checked rather than assumed: the same deliberately ragged
 * call parses with zero errors under both v5 and v6.
 *
 * So v6 brings TradingView to where this engine already was, and there is
 * nothing to relax. A `relaxWrappedIndent` flag was written here first and
 * then removed — a per-version flag with no consumer only lets a test assert
 * the constant against itself, which is the rule the language profiles state
 * for exactly this situation.
 *
 * The honest consequence, recorded because it cuts the other way: this engine
 * ACCEPTS a four-space wrapped line at v1–v5, where TradingView rejects it.
 * That is a pre-existing permissiveness, not something v6 introduced, and
 * tightening it would reject scripts that run here today.
 *
 * `once` opens a block the way `if` and `for` do, so the inherited
 * BEGIN/END/LEND logic already describes it and needs nothing here either.
 */
import { PineV6Lexer } from "../../parser/v6/generated/PineV6Lexer.js";
import { IndentTokenSource } from "../v1/IndentTokenSource.js";

export class PineV6TokenSource extends IndentTokenSource(PineV6Lexer, { strictContinuation: true }) {}
