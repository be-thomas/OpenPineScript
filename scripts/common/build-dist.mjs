/**
 * Builds the publishable bundle in dist/.
 *
 * Four artefacts, from one entry point (index.ts):
 *
 *   dist/index.mjs         ESM, for `import { Session } from "open-pinescript"`
 *   dist/index.cjs         CJS, for `require("open-pinescript")`
 *   dist/cli.mjs           the `openpinescript` command
 *   dist/types/index.d.ts  types, emitted by tsconfig.build.json
 *
 * ── Why esbuild and not tsc for the JavaScript ──────────────────────────────
 *
 * The emitted engine has to be ONE file a host can drop into a Web Worker, a
 * browser bundle or a serverless function without a resolver walking a few
 * hundred source files. esbuild bundles; tsc does not.
 *
 * It also does not typecheck, which is deliberate here and not laziness: the
 * repository carries pre-existing type errors in the ANTLR-generated parsers
 * and in a few visitor overrides, and `npm test` — 2,379 tests — is what this
 * project treats as the gate. A publish must not be blocked by a diagnostic
 * the test suite has already covered.
 *
 * ── antlr4ng stays external ────────────────────────────────────────────────
 *
 * It is a runtime `dependency`, so npm installs it beside the package. Bundling
 * it would give a host that also uses antlr4ng two copies.
 */
import * as esbuild from "esbuild";
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { BUNDLE_OPTIONS } from "./bundle-options.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const DIST = path.join(ROOT, "dist");

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

const shared = { ...BUNDLE_OPTIONS };

// `platform: "neutral"` so the bundle carries no Node built-ins and runs in a
// browser or a worker unchanged. Nothing on the library path touches `fs`.
await esbuild.build({ ...shared, format: "esm", platform: "neutral",
                      outfile: path.join(DIST, "index.mjs") });
await esbuild.build({ ...shared, format: "cjs", platform: "node",
                      outfile: path.join(DIST, "index.cjs") });

// The CLI is a separate entry: it reads CSVs, so it is Node-only by nature.
await esbuild.build({
  bundle: true,
  entryPoints: [path.join(ROOT, "mock_run", "v2", "run.ts")],
  external: ["antlr4ng"],
  target: "es2022",
  keepNames: true,   // same reason as in bundle-options.mjs
  platform: "node",
  format: "esm",
  banner: { js: "#!/usr/bin/env node" },
  outfile: path.join(DIST, "cli.mjs"),
  logLevel: "warning",
});
fs.chmodSync(path.join(DIST, "cli.mjs"), 0o755);

// Types. `--noEmitOnError false` is the default, so the declarations are
// written even though the generated parsers do not typecheck cleanly.
try {
  execFileSync("npx", ["tsc", "-p", "tsconfig.build.json"], { cwd: ROOT, stdio: "pipe" });
} catch {
  // tsc exits non-zero on those pre-existing errors; what matters is whether
  // it still wrote the declaration for the entry point.
}

const dts = path.join(DIST, "types", "index.d.ts");
if (!fs.existsSync(dts)) {
  console.error("build-dist: no dist/types/index.d.ts was emitted — the package would ship untyped");
  process.exit(1);
}

const size = (f) => (fs.statSync(path.join(DIST, f)).size / 1024).toFixed(0) + " kB";
for (const f of ["index.mjs", "index.cjs", "cli.mjs"]) {
  console.log(`  dist/${f.padEnd(16)} ${size(f)}`);
}
console.log(`  dist/types/index.d.ts  ${size(path.join("types", "index.d.ts"))}`);
