#!/usr/bin/env node
/**
 * Builds the docs site's generated files into site/assets and site/data.
 *
 *   node site/build.mjs                      # bundle the engine, copy the data
 *   node site/build.mjs --base-url https://OWNER.github.io/REPO/
 *                                            # also make og:image absolute (what social cards need)
 *
 * What it produces (both git-ignored, see site/.gitignore):
 *
 *   site/assets/engine.js   the real CLI (mock_run/v2/cli_main.ts) as a Web Worker script: the CLI, the
 *                           engine and antlr4ng, one classic-script file (IIFE), minified. Its fs, path,
 *                           process and console are browser stand-ins (site/src/shims.js).
 *   site/data/AAPL.csv      mock_data/common/AAPL_mock.csv, the candles the tutorial runs on.
 *
 * Unlike dist/index.mjs (scripts/common/build-dist.mjs) antlr4ng is NOT external here:
 * a browser has no node_modules, so the worker must carry its own copy.
 * The bundle options are shared with the package build, so the thing the tutorial
 * runs is the thing that ships (notably `keepNames`, without which the emitters
 * dispatch on mangled class names and reject valid scripts).
 */
import * as esbuild from "esbuild";
import * as fs from "node:fs";
import * as path from "node:path";
import * as zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { BUNDLE_OPTIONS } from "../scripts/common/bundle-options.mjs";
import { simPlugin } from "./src/sim-plugin.mjs";

const SITE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SITE, "..");

const { external: _external, entryPoints: _entry, sourcemap: _sm, ...shared } = BUNDLE_OPTIONS;

await esbuild.build({
  ...shared,
  entryPoints: [path.join(SITE, "src", "worker.js")],
  outfile: path.join(SITE, "assets", "engine.js"),
  format: "iife",
  platform: "browser",
  minify: true,
  legalComments: "none",
  sourcemap: false,
  plugins: [simPlugin],
});

fs.mkdirSync(path.join(SITE, "data"), { recursive: true });
fs.copyFileSync(path.join(ROOT, "mock_data", "common", "AAPL_mock.csv"), path.join(SITE, "data", "AAPL.csv"));

const engine = fs.readFileSync(path.join(SITE, "assets", "engine.js"));
console.log(`  site/assets/engine.js  ${(engine.length / 1024).toFixed(0)} kB  (${(zlib.gzipSync(engine).length / 1024).toFixed(0)} kB gzipped)`);
console.log(`  site/data/AAPL.csv     ${(fs.statSync(path.join(SITE, "data", "AAPL.csv")).size / 1024).toFixed(0)} kB`);

const flag = process.argv.indexOf("--base-url");
if (flag !== -1) {
  const base = (process.argv[flag + 1] || "").replace(/\/?$/, "/");
  if (!/^https?:\/\//.test(base)) { console.error("build: --base-url needs an absolute http(s) URL"); process.exit(1); }
  let n = 0;
  for (const f of fs.readdirSync(SITE).filter((x) => x.endsWith(".html"))) {
    const file = path.join(SITE, f);
    const html = fs.readFileSync(file, "utf8");
    const next = html.replace(/(<meta (?:property="og:image"|name="twitter:image") content=")assets\/og\.png(")/g, `$1${base}assets/og.png$2`)
                     .replace(/(<meta property="og:url" content=")[^"]*(")/g, `$1${base}${f === "index.html" ? "" : f}$2`);
    if (next !== html) { fs.writeFileSync(file, next); n++; }
  }
  console.log(`  og:image made absolute in ${n} page(s): ${base}assets/og.png`);
}
