/**
 * Every v5 script this repository holds, compiled as v6.
 *
 * The guard against FALSE POSITIVES. Each v6 rule is a new compile error, and
 * the predicates behind them are conservative by contract (transpiler/v6/
 * rules.ts) — but a contract is not evidence. This is: of the v5 scripts that
 * compile at v5, every one must compile at v6 too, unless it uses something
 * the migration guide actually removed.
 *
 * Those exceptions are listed by file with the reason, and each was read and
 * confirmed by hand. A new entry here should be just as deliberate: if a
 * script lands in the rejected set for a reason not on this list, a rule is
 * over-reaching.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { compileScript } from "../../transpiler/common";

const ROOTS = ["conformance", "docs", "examples", "tests"];

function pineFiles(dir: string, out: string[] = []): string[] {
  let entries: string[];
  try { entries = readdirSync(dir); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) pineFiles(p, out);
    else if (p.endsWith(".pine")) out.push(p);
  }
  return out;
}

/** Scripts that are genuinely not v6, and why. */
const KNOWN_INCOMPATIBLE: Record<string, RegExp> = {
  // `plot(…, transp = 40)` — MG §"The transp parameter is removed".
  "examples/v5/tradingview-docs/v5-concepts-colors-00.pine": /no 'transp' parameter/,
  // `float fillPrice … fillPrice ? open : na` — MG §"Explicit bool casting".
  "examples/v5/tradingview-docs/v5-concepts-strategies-41.pine": /cannot use 'float' as a condition/,
  // `float randomValue … if randomValue` — the script's own comment says
  // "`if` expects a bool". MG §"Explicit bool casting".
  "examples/v5/tradingview-docs/v5-language-type-system-35.pine": /cannot use 'float' as a condition/,
  // A published user script, kept as written: `if i%2 and showNadaray`.
  // MG §"Explicit bool casting".
  "conformance/v5/parity/harness_trader_club.pine": /cannot use 'float' as a condition/,
  // A published user script (LuxAlgo), kept as written: `slope_ph := ph ? …`.
  // MG §"Explicit bool casting".
  "conformance/v5/parity/harness_trendlines.pine": /cannot use 'float' as a condition/,
  // A published user script (LuxAlgo), kept as written: `bool active = na`.
  // MG §"Boolean values cannot be na".
  "conformance/v5/parity/harness_ict_silver_bullet.pine": /a 'bool' cannot be 'na'/,
};

describe("the v5 corpus under v6", () => {
  const files = ROOTS.flatMap(r => pineFiles(r))
    .filter(f => /\/\/@version=5\b/.test(readFileSync(f, "utf8")))
    .sort();

  it("finds the corpus", () => {
    expect(files.length).toBeGreaterThan(500);
  });

  for (const f of files) {
    const reason = KNOWN_INCOMPATIBLE[f];
    it(reason ? `${f} is rejected for its documented reason` : f, () => {
      const src = readFileSync(f, "utf8");
      // Only scripts v5 accepts say anything about v6. A script the engine
      // cannot run at v5 either is a v5 gap, tracked elsewhere.
      try { compileScript(src, { version: 5 }); } catch { return; }

      if (reason) {
        // Still an exception: a rule that stops firing on its own documented
        // example has regressed as surely as one that over-reaches.
        expect(() => compileScript(src, { version: 6 })).toThrow(reason);
      } else {
        expect(() => compileScript(src, { version: 6 })).not.toThrow();
      }
    });
  }
});
