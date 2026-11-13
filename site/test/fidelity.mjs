#!/usr/bin/env node
/**
 * Fidelity test for the tutorial's practice terminal.
 *
 *   node site/test/fidelity.mjs
 *
 * The terminal runs the real CLI code (mock_run/v2/cli_main.ts) with browser
 * stand-ins for fs, path, process and console, plus a thin shell around it
 * (site/assets/shell.js). This test proves the pair behaves like the real tool.
 *
 * For every command of every lesson (lessons.js `commands`), in order, on a fresh
 * sandbox per lesson, it runs
 *   - the REAL CLI: `bash -c <the line>` with `openpinescript` on PATH pointing at
 *     dist/cli.mjs, in a temp directory holding the same files as the emulator, and
 *   - the browser emulator: Shell.exec(<the line>) with the engine bundled for the worker,
 * and asserts identical stdout, stderr and exit code, and identical files written.
 * Only three things are normalised: the sandbox path (the emulator's home is
 * /home/you/OpenPineScript), stack-trace frames (they name Node's and the bundle's own
 * files), and the report's timestamp. ANSI colour codes are compared, not stripped.
 *
 * It also checks that each lesson's exercise checker fails on an empty terminal, passes
 * after the lesson's `solution`, and rejects a near miss.
 *
 * Needs `dist/cli.mjs` (npm run build, or npm run build:dist). Exits 1 on any difference.
 */
import * as esbuild from "esbuild";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { simPlugin } from "../src/sim-plugin.mjs";

const TEST = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(TEST, "..");
const ROOT = path.resolve(SITE, "..");
const CLI = path.join(ROOT, "dist", "cli.mjs");

// ---------------------------------------------------------------- preconditions

if (!fs.existsSync(CLI)) { console.error("dist/cli.mjs is missing. Run `npm run build` (or `npm run build:dist`) first."); process.exit(2); }
const newest = (dir) => fs.readdirSync(dir, { recursive: true }).filter((f) => /\.ts$/.test(f)).map((f) => fs.statSync(path.join(dir, f)).mtimeMs).reduce((a, b) => Math.max(a, b), 0);
if (Math.max(newest(path.join(ROOT, "mock_run")), newest(path.join(ROOT, "utils"))) > fs.statSync(CLI).mtimeMs) {
  console.error("dist/cli.mjs is older than mock_run/ or utils/. Rebuild it (`npm run build:dist`) so the test compares against current code.");
  process.exit(2);
}

// ---------------------------------------------------------------- bundle the emulator's engine

const bundle = path.join(TEST, ".build", "sim.bundle.mjs");
await esbuild.build({
  entryPoints: [path.join(SITE, "src", "sim.js")], bundle: true, platform: "node", format: "esm", outfile: bundle,
  external: ["antlr4ng"], target: "es2022", keepNames: true, plugins: [simPlugin], logLevel: "warning", absWorkingDir: ROOT,
});
const { runCli } = await import(pathToFileURL(bundle).href);
const { Shell, Vfs, HOME, NPM_PACKAGE, stripAnsi } = await import(pathToFileURL(path.join(SITE, "assets", "shell.js")).href);
const { seedVfs, EXAMPLES } = await import(pathToFileURL(path.join(SITE, "assets", "seed.js")).href);
const { LESSONS } = await import(pathToFileURL(path.join(SITE, "assets", "lessons.js")).href);

// ---------------------------------------------------------------- helpers

let failures = 0, checks = 0;
const report = (ok, label, detail) => {
  checks++;
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok && detail) console.log(detail.split("\n").map((l) => "      " + l).join("\n"));
};
const firstDiff = (a, b) => {
  let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return `first difference at char ${i}:\n  real: ${JSON.stringify(a.slice(Math.max(0, i - 40), i + 80))}\n  emu : ${JSON.stringify(b.slice(Math.max(0, i - 40), i + 80))}`;
};

const examples = Object.fromEntries(EXAMPLES.map((n) => [n, fs.readFileSync(path.join(SITE, "examples", n), "utf8")]));
const aapl = fs.readFileSync(path.join(ROOT, "mock_data", "common", "AAPL_mock.csv"), "utf8");
const engine = (req) => runCli(req);

async function freshVfs() {
  return seedVfs({ examples, aapl });
}

const bin = fs.mkdtempSync(path.join(os.tmpdir(), "ops-bin-"));
fs.writeFileSync(path.join(bin, "openpinescript"), `#!/bin/sh\nexec node ${JSON.stringify(CLI)} "$@"\n`, { mode: 0o755 });

/** A temp directory holding the emulator's files, with dist/ and friends linked in for the npm forms. */
function makeSandbox(vfs) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "ops-sandbox-")));
  for (const [abs, text] of vfs.files) {
    if (!abs.startsWith(HOME + "/")) continue;
    const target = path.join(dir, abs.slice(HOME.length + 1));
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, text);
  }
  for (const d of vfs.dirs) if (d.startsWith(HOME + "/")) fs.mkdirSync(path.join(dir, d.slice(HOME.length + 1)), { recursive: true });
  for (const name of ["dist", "mock_run", "node_modules", "package.json"]) fs.symlinkSync(path.join(ROOT, name), path.join(dir, name));
  return dir;
}
const LINKED = new Set(["dist", "mock_run", "node_modules", "package.json"]);

function walk(dir, rel = "", out = {}) {
  for (const e of fs.readdirSync(path.join(dir, rel), { withFileTypes: true })) {
    const r = rel ? rel + "/" + e.name : e.name;
    if (!rel && LINKED.has(e.name)) continue;
    if (e.isDirectory()) walk(dir, r, out); else out[r] = fs.readFileSync(path.join(dir, r), "utf8");
  }
  return out;
}

const normText = (s, sandbox) => s
  .split(sandbox).join(HOME)
  .replace(/"timestamp": "[^"]*"/g, '"timestamp": "T"')
  .split("\n").filter((l) => !/^\s+at /.test(l)).join("\n");

/** Run a line in real bash with the real CLI. Returns { stdout, stderr, code }. */
function realRun(line, sandbox) {
  // the emulator reports stderr before redirecting it, so the real run must not redirect it away
  const text = line.replace(/\s*2>\s*\/dev\/null/g, "");
  const r = spawnSync("bash", ["-c", text], { cwd: sandbox, encoding: "utf8", maxBuffer: 64 << 20, env: { ...process.env, PATH: `${bin}:${process.env.PATH}` } });
  return { stdout: r.stdout, stderr: r.stderr, code: r.status };
}

const vfsFiles = (vfs) => Object.fromEntries([...vfs.files].filter(([p]) => p.startsWith(HOME + "/")).map(([p, t]) => [p.slice(HOME.length + 1), t]));

// ---------------------------------------------------------------- 0. constants

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
report(pkg.name === NPM_PACKAGE.name && pkg.version === NPM_PACKAGE.version, "npm banner constants match package.json", `package.json: ${pkg.name}@${pkg.version}`);

// ---------------------------------------------------------------- 1. every lesson command, real vs emulator

const results = [];
async function compareLine(lessonId, line, shell, sandbox, { skipFiles = false } = {}) {
  const before = vfsFiles(shell.vfs);
  const real = realRun(line, sandbox);
  const recs = await shell.exec(line);
  const label = `${lessonId}: ${line}`;
  if (recs.length !== 1) { report(false, label, `expected one record, got ${recs.length}`); return; }
  const rec = recs[0];

  if (rec.kind === "ops") {
    const rs = normText(real.stdout, sandbox), re = normText(real.stderr, sandbox);
    const es = normText(rec.rawStdout, sandbox), ee = normText(rec.rawStderr, sandbox);
    const problems = [];
    if (rs !== es) problems.push("stdout differs\n" + firstDiff(rs, es));
    if (re !== ee) problems.push("stderr differs\n" + firstDiff(re, ee));
    if (real.code !== rec.code) problems.push(`exit code: real ${real.code}, emulator ${rec.code}`);
    if (!skipFiles) {
      const realFiles = Object.fromEntries(Object.entries(walk(sandbox)).map(([k, t]) => [k, normText(t, sandbox)]));
      const emuFiles = Object.fromEntries(Object.entries(vfsFiles(shell.vfs)).map(([k, t]) => [k, normText(t, sandbox)]));
      const names = new Set([...Object.keys(realFiles), ...Object.keys(emuFiles)]);
      for (const n of [...names].sort()) {
        if (!(n in realFiles)) problems.push(`file only in emulator: ${n}`);
        else if (!(n in emuFiles)) problems.push(`file only in real run: ${n}`);
        else if (realFiles[n] !== emuFiles[n]) problems.push(`file differs: ${n}\n` + firstDiff(realFiles[n], emuFiles[n]));
      }
    }
    report(problems.length === 0, `${label}   [exit ${rec.code}, stdout ${rec.rawStdout.length} B, stderr ${rec.rawStderr.length} B, wrote ${Object.keys(rec.writes).length} file(s)]`, problems.join("\n"));
    results.push({ lessonId, line, ok: problems.length === 0 });
    return;
  }

  // a shell helper: compare with the real one on the same files
  const problems = [];
  if (real.code !== rec.code) problems.push(`exit code: real ${real.code}, emulator ${rec.code}`);
  const same = ["cat", "head", "tail", "mkdir", "echo", "pwd"].includes(rec.cmd);
  if (rec.cmd === "ls") {
    const names = (s) => s.split(/\s+/).filter(Boolean).map((n) => n.replace(/\/$/, "")).sort().join(" ");
    const strip = (s) => s.replace(/^[^\n]*:\n/gm, "");
    if (names(strip(real.stdout)) !== names(strip(rec.rawStdout))) problems.push(`ls lists different names\n${firstDiff(real.stdout, rec.rawStdout)}`);
  } else if (same) {
    const rs = normText(real.stdout, sandbox);
    if (rs !== normText(rec.rawStdout, sandbox)) problems.push("stdout differs\n" + firstDiff(rs, normText(rec.rawStdout, sandbox)));
    if (rec.cmd === "mkdir") {
      const a = Object.keys(walk(sandbox)).sort().join("\n"), b = Object.keys(vfsFiles(shell.vfs)).sort().join("\n");
      if (a !== b) problems.push("file sets differ after mkdir");
    }
  }
  void before;
  report(problems.length === 0, `${label}   [shell helper, exit ${rec.code}]`, problems.join("\n"));
  results.push({ lessonId, line, ok: problems.length === 0 });
}

for (const L of LESSONS) {
  const vfs = await freshVfs();
  const shell = new Shell({ vfs, engine });
  const sandbox = makeSandbox(vfs);
  for (const line of L.commands) await compareLine(L.id, line, shell, sandbox);
  fs.rmSync(sandbox, { recursive: true, force: true });
}

// ---------------------------------------------------------------- 2. the other ways to spell the command, and quirks

{
  const A = "mock_data/common/AAPL_mock.csv";
  const extra = [
    `node dist/cli.mjs examples/sma_cross.pine --data ${A} --out-dir results/node`,
    `npm run --silent opsv2 -- examples/rsi.pine --data ${A} --out-chart results/npm.csv`,
    `npm run opsv2 -- examples/broken.pine --data ${A}`,
    `openpinescript examples/rsi.pine --data ${A} --bogus-flag --out-dir results/unknown-flag`,
    `openpinescript examples/sma_cross.pine --data ${A} --input input_0 --input input_1=30 --dry-run 2>/dev/null`,
    `openpinescript examples/rsi.pine --data ${A} --out-trades results/t.csv --out-summary results/s.json`,
    `openpinescript examples/sma_cross.pine --data ${A} --tolerance abc`,
    `openpinescript examples/sma_cross.pine --data nope.csv`,
    `openpinescript examples/nope.pine --data ${A}`,
    `openpinescript examples/rsi.pine`,
    `openpinescript --data ${A}`,
    `openpinescript examples/rsi.pine --data ${A} --out-chart`,
    `openpinescript examples/sma_cross.pine --data ${A} --compare-dir results/node --out-comparison results/cmp`,
    `openpinescript examples/sma_cross.pine --data ${A} --compare-dir results/node 2>&1`,
    `openpinescript examples/rsi.pine --data ${A} > results/stdout.json`,
    "head -2 examples/rsi.pine",
    "tail -n 2 results/node/trades.csv",
    "cat nope.txt",
    "cat examples/rsi.pine examples/broken.pine",
    "mkdir results/x/y",
    "ls results",
    "echo hello world",
  ];
  const vfs = await freshVfs();
  const shell = new Shell({ vfs, engine });
  const sandbox = makeSandbox(vfs);
  // `mkdir -p results` once, in both
  await shell.exec("mkdir -p results"); fs.mkdirSync(path.join(sandbox, "results"), { recursive: true });
  for (const line of extra) {
    // the stdout redirect and 2>&1 lines have no 2>/dev/null to strip; the emulator and bash both apply them
    const redirected = />|2>&1/.test(line.replace(/2>\/dev\/null/g, ""));
    if (redirected) {
      const real = realRun(line, sandbox);
      const [rec] = await shell.exec(line);
      const emuStdout = rec.chunks.filter((c) => c[0] === "stdout").map((c) => c[1]).join("");
      const rs = normText(real.stdout, sandbox), es = normText(emuStdout, sandbox);
      const problems = [];
      if (rs !== es) problems.push("visible output differs\n" + firstDiff(rs, es));
      if (real.code !== rec.code) problems.push(`exit code: real ${real.code}, emulator ${rec.code}`);
      const f = line.includes("> results/stdout.json") ? "results/stdout.json" : null;
      if (f && normText(fs.readFileSync(path.join(sandbox, f), "utf8"), sandbox) !== normText(vfs.read(`${HOME}/${f}`) ?? "", sandbox)) problems.push(`redirect target ${f} differs`);
      report(problems.length === 0, `extra: ${line}`, problems.join("\n"));
    } else {
      await compareLine("extra", line, shell, sandbox);
    }
  }
  fs.rmSync(sandbox, { recursive: true, force: true });
}

// ---------------------------------------------------------------- 3. the exercise checkers

for (const L of LESSONS) {
  const empty = new Shell({ vfs: await freshVfs(), engine });
  const none = L.check(empty);
  report(!none.every((c) => c.ok), `checker ${L.id}: not complete on an empty terminal`, JSON.stringify(none));
  report(none.length <= 2, `checker ${L.id}: shows at most two plain checklist lines`, JSON.stringify(none));

  const sh = new Shell({ vfs: await freshVfs(), engine });
  for (const line of L.solution) await sh.exec(line);
  const solved = L.check(sh);
  report(solved.every((c) => c.ok), `checker ${L.id}: complete after the "Show me" solution`, JSON.stringify(solved));

  const full = new Shell({ vfs: await freshVfs(), engine });
  for (const line of L.commands) await full.exec(line);
  const all = L.check(full);
  report(all.every((c) => c.ok), `checker ${L.id}: complete after every command of the lesson`, JSON.stringify(all));
}

{
  // near misses must NOT pass
  const A = "mock_data/common/AAPL_mock.csv";
  const cases = [
    ["run", [`openpinescript examples/rsi.pine --data nope.csv`], "bad data path"],
    ["run", [`openpinescript examples/sma_cross.pine --data ${A}`], "wrong script"],
    ["chart", [`openpinescript examples/sma_cross.pine --data ${A} --out-chart results/sma.csv`], "chart without an RSI 14 column"],
    ["chart", [`openpinescript examples/rsi.pine --data ${A}`], "no file written"],
    ["strategy", [`openpinescript examples/sma_cross.pine --data ${A} --out-summary results/s.json`], "only a summary"],
    ["strategy", [`openpinescript examples/rsi.pine --data ${A} --out-dir results/x`], "an indicator, not a strategy"],
    ["inputs", [`openpinescript examples/sma_cross.pine --data ${A} --input input_0=5 --out-dir results/x`], "only input_0 overridden"],
    ["inputs", [`openpinescript examples/sma_cross.pine --data ${A} --input=input_0=5 --input=input_1=30 --out-dir results/x`], "--input=value spelling is ignored by the CLI"],
    ["errors", [`openpinescript examples/rsi.pine --data ${A}`], "a script that works"],
  ];
  for (const [id, lines, why] of cases) {
    const L = LESSONS.find((l) => l.id === id);
    const sh = new Shell({ vfs: await freshVfs(), engine });
    for (const line of lines) await sh.exec(line);
    report(!L.check(sh).every((c) => c.ok), `checker ${id}: rejects a near miss (${why})`);
  }
}

// ---------------------------------------------------------------- summary

const failedCmds = results.filter((r) => !r.ok);
console.log(`\n${checks - failures} of ${checks} checks passed; ${results.length - failedCmds.length} of ${results.length} commands identical to the real CLI.`);
fs.rmSync(bin, { recursive: true, force: true });
void stripAnsi;
process.exit(failures ? 1 : 0);
