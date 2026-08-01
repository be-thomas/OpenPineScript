/**
 * Grammar hierarchy integrity.
 *
 * The architectural law (dev-docs/00-architecture-assessment.md §5) is that v1
 * is the base and every later version imports the one before it. That law lives
 * in .g4 files, which no type checker reads — so it is asserted here.
 *
 * ── The drift this exists to catch ──────────────────────────────────────────
 *
 * ANTLR has no "append an alternative" syntax: an override REPLACES the base
 * rule wholesale, so `PineV2Parser.global_stmt_content` restates all eight of
 * v1's alternatives plus `var_assign`. If someone later adds a ninth
 * alternative to the v1 base, v2 and v3 silently keep the old eight — every
 * test still passes, and the new construct is mysteriously v1-only.
 *
 * Nothing else in the repo can see that. The generated parsers would both be
 * valid; only the language they accept would have quietly diverged.
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = path.resolve(__dirname, "../..");
const GRAMMAR = path.join(ROOT, "grammar");

/** The hierarchy, as declared by the architecture doc. */
const CHAIN: Array<{ version: number; importsFrom: number | null }> = [
  { version: 1, importsFrom: null },
  { version: 2, importsFrom: 1 },
  { version: 3, importsFrom: 2 },
];

type Kind = "Lexer" | "Parser";

const read = (v: number, kind: Kind) =>
  fs.readFileSync(path.join(GRAMMAR, `PineV${v}${kind}.g4`), "utf8");

/** Strip comments so a rule name mentioned in prose is not mistaken for code. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

/**
 * Parse `name : a | b | c ;` declarations into name → set of alternatives.
 * Deliberately simple: it only needs to handle the rule shapes this repo uses.
 */
function ruleAlternatives(src: string): Map<string, string[]> {
  const out = new Map<string, string[]>();
  const body = stripComments(src);
  const ruleRe = /^\s*([a-z_][A-Za-z0-9_]*)\s*:([^;]*);/gm;
  for (const m of body.matchAll(ruleRe)) {
    const [, name, rhs] = m;
    // Only rules that are a plain top-level alternation of single rule
    // references — that is the shape overrides use.
    const alts = rhs.split("|").map(a => a.trim()).filter(Boolean);
    if (alts.length > 1 && alts.every(a => /^[a-z_][A-Za-z0-9_]*$/.test(a))) {
      out.set(name, alts);
    }
  }
  return out;
}

describe("grammar files exist for every version in the chain", () => {
  for (const { version } of CHAIN) {
    for (const kind of ["Lexer", "Parser"] as Kind[]) {
      it(`PineV${version}${kind}.g4 exists`, () => {
        expect(fs.existsSync(path.join(GRAMMAR, `PineV${version}${kind}.g4`))).toBe(true);
      });
    }
  }

  it("all grammars are in ONE flat directory", () => {
    // ANTLR does not resolve imports transitively across directories, so a
    // grammar/v3/ layout cannot resolve v3 → v2 → v1. See §4 C1.
    const nested = fs.readdirSync(GRAMMAR, { withFileTypes: true })
      .filter(e => e.isDirectory());
    expect(nested.map(e => e.name), "grammar/ must stay flat").toEqual([]);
  });
});

describe("each version imports exactly its predecessor", () => {
  for (const { version, importsFrom } of CHAIN) {
    for (const kind of ["Lexer", "Parser"] as Kind[]) {
      it(`PineV${version}${kind} ${importsFrom ? `imports PineV${importsFrom}${kind}` : "is the base"}`, () => {
        const src = stripComments(read(version, kind));
        const imports = [...src.matchAll(/^\s*import\s+([A-Za-z0-9_]+)\s*;/gm)].map(m => m[1]);

        if (importsFrom === null) {
          expect(imports, "the base must import nothing").toEqual([]);
          return;
        }
        expect(imports).toEqual([`PineV${importsFrom}${kind}`]);
      });
    }
  }
});

describe("importing parser grammars restate tokenVocab", () => {
  // `options` are NOT inherited (§4 C2). Omitting it binds the parser to the
  // PREVIOUS version's token numbering, with no error and a wrong parse.
  for (const { version } of CHAIN) {
    it(`PineV${version}Parser sets tokenVocab = PineV${version}Lexer`, () => {
      const src = stripComments(read(version, "Parser"));
      expect(src).toMatch(new RegExp(`tokenVocab\\s*=\\s*PineV${version}Lexer`));
    });
  }
});

describe("overridden rules do not drop base alternatives", () => {
  // The core drift check. An override must cover everything its base covers.
  for (const { version, importsFrom } of CHAIN) {
    if (importsFrom === null) continue;

    it(`v${version} overrides still cover every v${importsFrom} alternative`, () => {
      const base = ruleAlternatives(read(importsFrom, "Parser"));
      const derived = ruleAlternatives(read(version, "Parser"));

      const problems: string[] = [];
      for (const [rule, derivedAlts] of derived) {
        const baseAlts = base.get(rule);
        if (!baseAlts) continue; // a brand-new rule, not an override

        const missing = baseAlts.filter(a => !derivedAlts.includes(a));
        if (missing.length) {
          problems.push(
            `PineV${version}Parser.${rule} overrides PineV${importsFrom}Parser.${rule} ` +
            `but drops: ${missing.join(", ")}`,
          );
        }
      }

      expect(problems, problems.join("\n")).toEqual([]);
    });
  }
});

describe("the v1 base does not know later versions' syntax", () => {
  it("PineV1Lexer has no ':=' token", () => {
    // The worked example of the architectural law: v1 must reject `x := 1` as a
    // SYNTAX error, not with a guard. If ASSIGN reappears here, the capability
    // matrix's "syntax" verdicts silently become "guard" verdicts.
    expect(stripComments(read(1, "Lexer"))).not.toMatch(/ASSIGN/);
  });

  it("PineV1Parser has no var_assign rule", () => {
    expect(stripComments(read(1, "Parser"))).not.toMatch(/var_assign/);
  });

  it("PineV2Lexer is where ':=' is introduced", () => {
    expect(stripComments(read(2, "Lexer"))).toMatch(/ASSIGN\s*:\s*':='/);
  });
});
