/**
 * The esbuild options the published bundle is built with.
 *
 * Shared by scripts/common/build-dist.mjs and conformance/common/bundle.test.ts
 * so the thing under test is the thing that ships. Duplicating them would let
 * the test pass while the real build regressed.
 */
import * as path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export const BUNDLE_OPTIONS = {
  bundle: true,
  entryPoints: [path.join(ROOT, "index.ts")],
  // A runtime `dependency`, so npm installs it beside the package. Bundling it
  // would give a host that also uses antlr4ng two copies.
  external: ["antlr4ng"],
  target: "es2022",
  sourcemap: true,
  logLevel: "warning",

  // ── Load-bearing, not a nicety ────────────────────────────────────────────
  //
  // The emitters dispatch on `node.constructor.name` (see `isRule` in
  // transpiler/v1/ToJsVisitor.ts). All five generated parsers declare a class
  // called `Kw_argContext`, and bundling five modules into one file forces
  // esbuild to rename four of them — `Kw_argContext2` … `Kw_argContext5`.
  //
  // Every `isRule` check then returns false for v2-v5, and the bundle rejects
  // `indicator("s", overlay = true)` with "Undeclared identifier 'overlay'"
  // while the same source compiles from the repository. Nothing in the test
  // suite saw it, because the suite runs the sources.
  //
  // `keepNames` re-attaches the original name explicitly, which also survives
  // a consumer re-minifying the bundle: it mangles identifiers, not the string
  // literal the name is restored from.
  keepNames: true,
};
