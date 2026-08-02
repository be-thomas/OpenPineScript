/**
 * v2 → v3 porting.
 *
 * The v2→v3 migration is mechanical: replace self-reference with
 * declare-then-':=', make bool→number conversions explicit, and pin the
 * security() lookahead if the script relied on the old default.
 *
 * A correct port must not change a single number. These tests run the v2
 * original and its v3 port over the same bars and assert bar-for-bar equality —
 * which is what "mechanical" has to mean to be worth anything.
 *
 * They also record how the real corpus in validation/ is affected, so the
 * blast radius of the v3 rules on actual published scripts is visible rather
 * than assumed.
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { transpile } from "../../transpiler";
import { compile, Context } from "../../runtime/v1";
import { profileFor } from "../../transpiler/profiles";
import { attempt, PineVersion } from "../../test-utils/transpileAs";
import { PREFIX } from "../../utils/v2/common";

const ROOT = path.resolve(__dirname, "../..");

/** Runs `src` under `version` and returns `name`'s value on each bar. */
function trace(src: string, version: PineVersion, name: string, bars = 6): number[] {
  const ctx = new Context(profileFor(version));
  const exec = compile(transpile(src, { version }), ctx, { ctx } as any);
  const out: number[] = [];
  for (let i = 0; i < bars; i++) {
    ctx.currentBarIndex = i;
    // Deterministic zig-zag: the running total keeps changing, AND the bar
    // alternates up/down so `close > open` is not constant. A constant
    // comparison would make the bool-conversion ports compare all-equal
    // sequences and prove nothing.
    const close = 10 + (i % 3) * 2 + i;
    const open = i % 2 === 0 ? close - 1 : close + 1;
    ctx.setBar(i * 1000, open, Math.max(open, close) + 1, Math.min(open, close) - 1, close, 100 + i);
    exec();
    ctx.finalizeBar();
    out.push(Number(ctx.vars.get(`${PREFIX}${name}`)?.valueOf()));
  }
  return out;
}

interface Port {
  label: string;
  v2: string;
  v3: string;
  observe: string;
}

const PORTS: Port[] = [
  {
    label: "cumulative sum via self-reference",
    v2: "s = nz(s[1]) + close\n",
    v3: "s = 0.0\ns := nz(s[1]) + close\n",
    observe: "s",
  },
  {
    label: "bar counter",
    v2: "c = nz(c[1]) + 1\n",
    v3: "c = 0\nc := nz(c[1]) + 1\n",
    observe: "c",
  },
  {
    label: "conditional running total",
    v2: "t = close > open ? nz(t[1]) + close : nz(t[1])\n",
    v3: "t = 0.0\nt := close > open ? nz(t[1]) + close : nz(t[1])\n",
    observe: "t",
  },
  {
    label: "bool arithmetic made explicit",
    v2: "n = (close > open) + 1\n",
    v3: "n = (close > open ? 1 : 0) + 1\n",
    observe: "n",
  },
  {
    label: "counting bars that satisfy a condition",
    v2: "k = nz(k[1]) + (close > open)\n",
    v3: "k = 0\nk := nz(k[1]) + (close > open ? 1 : 0)\n",
    observe: "k",
  },
];

describe("a mechanical v2→v3 port changes no numbers", () => {
  for (const port of PORTS) {
    it(port.label, () => {
      const before = trace(port.v2, 2, port.observe);
      const after = trace(port.v3, 3, port.observe);

      // Guard against a vacuous pass: if the trace is all-NaN or constant, the
      // comparison proves nothing.
      expect(before.some(Number.isNaN)).toBe(false);
      expect(new Set(before).size).toBeGreaterThan(1);

      expect(after).toEqual(before);
    });
  }

  it("each v2 original is genuinely rejected at v3", () => {
    // Otherwise the ports above would be busywork rather than migrations.
    for (const port of PORTS) {
      expect(attempt(3, port.v2).ok, `v3 accepted the v2 form of "${port.label}"`).toBe(false);
    }
  });

  it("each v3 port still compiles at v2 — the migration is one-directional", () => {
    // This assertion used to be the opposite: that the ports were REJECTED at
    // v2, on the theory that v2 forbade ':=' outside a for-loop. It did not —
    // ':=' has taken any scope since v2 (see transpiler/v2/ToJsVisitor.ts), so
    // the ported form is valid v2 as well.
    //
    // That asymmetry is the real content of the migration: v3 rejects the v2
    // self-reference idiom (asserted above), but the replacement written for v3
    // runs unchanged on v2. A script can be migrated before its annotation is.
    for (const port of PORTS.filter(p => p.v3.includes(":="))) {
      const result = attempt(2, port.v3);
      expect(result.ok, `v2 rejected the v3 port of "${port.label}": ` +
        `${result.ok ? "" : result.message}`).toBe(true);
    }
  });
});

describe("blast radius on the real corpus", () => {
  const files = fs.readdirSync(path.join(ROOT, "validation"))
    .filter(f => f.endsWith(".pine")).sort()
    .map(f => `validation/${f}`);

  const classified = files.map(f => {
    const src = fs.readFileSync(path.join(ROOT, f), "utf8");
    return { file: f, v2: attempt(2, src), v3: attempt(3, src) };
  });

  it("scripts that transpile at v2 and break at v3 do so for a documented v3 rule", () => {
    const regressed = classified.filter(c => c.v2.ok && !c.v3.ok);

    // These are real published v2 strategies. If any of them fails for a reason
    // that is NOT one of the four v3 tightenings, the guards are over-reaching.
    const V3_RULES = /cannot reference itself|used before it is declared|cannot use a bool|cannot use mutable variable/;
    for (const c of regressed) {
      expect((c.v3 as any).message, c.file).toMatch(V3_RULES);
    }

    // Recorded, not asserted as a fixed count — a parser fix would change it.
    expect(regressed.length).toBeGreaterThan(0);
  });

  it("no script gains acceptance at v3 that v2 rejected for a parse error", () => {
    // v3 relaxes ':=' only. It must not paper over a parse failure.
    for (const c of classified) {
      if (!c.v2.ok && c.v3.ok) {
        expect((c.v2 as any).message).not.toMatch(/parsing failed/);
      }
    }
  });
});
