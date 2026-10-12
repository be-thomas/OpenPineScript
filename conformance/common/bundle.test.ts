/**
 * The PUBLISHED bundle behaves like the sources.
 *
 * ── Why this file exists ────────────────────────────────────────────────────
 *
 * Everything else in this repository tests the TypeScript sources. What ships
 * to npm is a single bundled file, and bundling is a transformation that can
 * change behaviour — which it did.
 *
 * The emitters dispatch on `node.constructor.name` (`isRule`). Each of the five
 * generated parsers declares its own `Kw_argContext`, `Fun_callContext` and so
 * on, so merging them into one file forces the bundler to rename four of each.
 * Every `isRule` check then returned false for v2-v5, and the bundle rejected
 *
 *     indicator("s", overlay = true)
 *
 * with "Undeclared identifier 'overlay'" — a keyword argument read as a
 * variable — while the identical source compiled fine from the repository. The
 * full 2,379-test suite was green throughout.
 *
 * `keepNames` fixes it, and this file is what stops it being dropped again. It
 * imports the bundle options from the build script rather than restating them,
 * so the configuration under test is the configuration that ships.
 */
import { describe, it, expect, beforeAll } from "vitest";
import * as esbuild from "esbuild";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
// @ts-expect-error — plain .mjs, shared with scripts/common/build-dist.mjs
import { BUNDLE_OPTIONS } from "../../scripts/common/bundle-options.mjs";

let api: any;

beforeAll(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ops-bundle-"));
  const outfile = path.join(dir, "index.mjs");
  await esbuild.build({
    ...BUNDLE_OPTIONS,
    format: "esm",
    platform: "neutral",
    sourcemap: false,
    outfile,
  });
  api = await import(/* @vite-ignore */ outfile);
}, 120_000);

describe("the published bundle", () => {
  it("keeps class names, which the emitters dispatch on", () => {
    expect(
      (BUNDLE_OPTIONS as any).keepNames,
      "isRule() compares constructor.name; without keepNames the bundler " +
      "renames the colliding per-version context classes and every check fails",
    ).toBe(true);
  });

  it("exports the host API", () => {
    for (const name of ["Session", "runScript", "compileScript", "Context", "compile"]) {
      expect(typeof api[name], name).not.toBe("undefined");
    }
  });

  /**
   * One per version, each MIXING a positional argument with a keyword one.
   * That mix is what the renaming broke: the keyword's name was parsed as a
   * variable read. An all-positional call would have passed throughout.
   */
  const KEYWORD_ARGS: Array<[number, string]> = [
    [1, 'study("s", overlay = true)\nplot(close)\n'],
    [2, '//@version=2\nstudy("s", overlay = true)\nplot(close)\n'],
    [3, '//@version=3\nstudy("s", overlay = true)\nplot(close)\n'],
    [4, '//@version=4\nstudy("s", overlay = true)\nplot(close)\n'],
    [5, '//@version=5\nindicator("s", overlay = true)\nplot(close)\n'],
  ];

  for (const [version, source] of KEYWORD_ARGS) {
    it(`compiles a v${version} script that mixes positional and keyword arguments`, () => {
      const compiled = api.compileScript(source);
      expect(compiled.version).toBe(version);
      expect(compiled.js.length).toBeGreaterThan(0);
    });
  }

  it("runs a v5 script end to end and produces the render model", () => {
    const candles = Array.from({ length: 40 }, (_, i) => {
      const p = 100 + Math.sin(i / 3) * 10;
      return {
        time: Date.UTC(2024, 0, 1) + i * 86_400_000,
        open: p, high: p + 2, low: p - 2, close: p + 1, volume: 1000 + i,
      };
    });

    const result = api.runScript(
      '//@version=5\n' +
      'indicator("s", overlay = true)\n' +
      'plot(ta.sma(close, 5), "SMA")\n' +
      'label.new(bar_index, high, "x")\n' +
      'log.info("hello")\n',
      { candles },
    );

    expect(result.errors).toEqual([]);
    expect(result.barsProcessed).toBe(candles.length);
    expect(result.series.map((s: any) => s.title)).toContain("SMA");
    // Both of these are read off the Context rather than the plot map, so they
    // exercise a different path through the bundle.
    expect(result.drawings.length).toBeGreaterThan(0);
    expect(result.logs.length).toBe(candles.length);
  });

  it("reports a syntax error instead of throwing", () => {
    const compiled = new api.Session().compile('//@version=5\nindicator(\nplot(');
    expect(compiled.errors.length).toBeGreaterThan(0);
    expect(compiled.errors[0].phase).toBe("parse");
  });
});
