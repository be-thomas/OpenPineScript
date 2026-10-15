/**
 * runtime/v1/language-spec.ts
 *
 * The names a given Pine version knows, for a host that needs to HIGHLIGHT or
 * complete Pine source rather than run it.
 *
 * ── Why this lives in the engine ───────────────────────────────────────────
 *
 * An editor needs the same two lists the compiler uses, and a hand-written copy
 * in the host drifts the moment either side changes — silently, because nothing
 * fails when a highlighter is wrong. Both lists here are derived from what the
 * compiler actually consults:
 *
 *   keywords   the literal tokens the lexer grammars reserve, which is what
 *              the parser reserves. Cumulative: each grammar imports the one
 *              below it, so v5 reserves v1's words too.
 *   builtins   `viewFor(version)` — the very registry the transpiler checks a
 *              name against before deciding it is "not available in Pine
 *              Script v{n}".
 *
 * It is deliberately NOT in stdlib/: the metadata generator turns any
 * `ctx`-first export there into a built-in, and these are plain functions.
 */
import { viewFor } from "./stdlib";
import { RUNTIME_GLOBALS } from "../../transpiler/v1/ToJsVisitor";
import { profileFor } from "../../transpiler/common/profiles";
import type { PineVersion } from "../../transpiler/common/version";

/**
 * Reserved words, by the version that introduced them.
 *
 * Transcribed from the lexer grammars, which are the authority — a word is
 * reserved exactly when the lexer gives it a token of its own:
 *
 *   v1  grammar/v1/PineV1Lexer.g4
 *   v4  grammar/v4/PineV4Lexer.g4   the type words
 *   v5  grammar/v5/PineV5Lexer.g4   loops, UDTs, methods, libraries
 *
 * `true` and `false` come from BOOL_LITERAL rather than from keyword tokens,
 * and `na` is a registry value, not a keyword — both are listed here anyway
 * because an editor colours them as literals, which is what a reader expects.
 */
const KEYWORDS_BY_VERSION: Record<number, string[]> = {
    1: [
        "if", "else", "for", "to", "by", "break", "continue",
        "and", "or", "not", "true", "false", "na",
    ],
    4: [
        "var", "varip", "series", "simple", "const",
        "int", "float", "bool", "string", "color",
        "line", "label", "box", "table",
    ],
    5: [
        "while", "switch", "type", "method", "import", "export", "enum",
        "as", "in",
    ],
};

export interface LanguageSpec {
    version: PineVersion;
    /** Reserved words this version recognises, cumulative. */
    keywords: string[];
    /** Every built-in name, including dotted members like `ta.sma`. */
    builtins: string[];
    /** The leading segment of every dotted name — `ta`, `strategy`, `color`. */
    namespaces: string[];
}

/** What `version` knows. Sorted, so the output is stable to diff. */
export function languageSpec(version: PineVersion): LanguageSpec {
    const keywords = new Set<string>();
    for (const introduced of Object.keys(KEYWORDS_BY_VERSION).map(Number).sort((a, b) => a - b)) {
        if (introduced <= version) for (const k of KEYWORDS_BY_VERSION[introduced]) keywords.add(k);
    }

    const profile = profileFor(version);

    const names = new Set(Object.keys(viewFor(version)));

    // The OHLCV series and the bar counter are bound straight into the sandbox
    // as data, so they have no registry entry — `close` is the most-typed word
    // in Pine and the registry has never heard of it. The transpiler keeps its
    // own list for exactly this reason, and this is that list.
    //
    // `n` and `bar_index` both appear in it, and only one is spellable at any
    // version: the profile bans the other, and a banned name is not part of
    // the language the author is writing.
    for (const g of RUNTIME_GLOBALS) {
        if (!profile.banned.has(g)) names.add(g);
    }

    // The declaration directives are handled by the transpiler rather than the
    // registry, so they are absent too — leaving the first line of every script
    // uncoloured. v5 renamed `study` to `indicator`; the profile knows which.
    names.add(profile.defaults.scriptDirective);
    names.add("strategy");
    if (version >= 5) names.add("library");

    const builtins = [...names];
    const namespaces = new Set<string>();
    for (const name of builtins) {
        const dot = name.indexOf(".");
        if (dot > 0) namespaces.add(name.slice(0, dot));
    }

    return {
        version,
        keywords: [...keywords].sort(),
        builtins: builtins.sort(),
        namespaces: [...namespaces].sort(),
    };
}
