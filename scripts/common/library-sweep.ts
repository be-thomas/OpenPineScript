/**
 * Imports every scraped TradingView library into a v6 script, compiles it and
 * runs 60 bars, and reports what passes and why the rest fail.
 *
 *     npx tsx scripts/common/library-sweep.ts [--out file.json] [--only v6]
 *
 * The scrape lives in dev-docs/library-scrape, which is git-excluded: these are
 * other people's published libraries, kept locally as a corpus. Every one of
 * them compiles on TradingView, so each failure here is the engine's.
 *
 * Every scraped library is supplied as importable, so nested imports resolve.
 * A library that imports one missing from the scrape is counted apart.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Session } from "../../runtime/v1";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DIR = join(ROOT, "dev-docs", "library-scrape");
const args = process.argv.slice(2);
const opt = (name: string) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };

if (!existsSync(join(DIR, "manifest.json"))) {
  console.error(`No scrape at ${DIR}.`);
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(join(DIR, "manifest.json"), "utf8")).scraped as Record<string, any>;
const libs: Record<string, string> = {};
const all: Array<{ path: string; version: number }> = [];
for (const e of Object.values(manifest)) {
  if (!e.import_path || !e.file || !existsSync(join(DIR, "libraries", e.file))) continue;
  const src = readFileSync(join(DIR, "libraries", e.file), "utf8");
  libs[e.import_path] = src;
  all.push({ path: e.import_path, version: Number(/\/\/\s*@version\s*=\s*(\d)/.exec(src)?.[1] ?? 0) });
}

const only = opt("only");
const targets = only ? all.filter(l => `v${l.version}` === only) : all;
const candles = Array.from({ length: 60 }, (_, i) => ({
  time: 1792368000000 + i * 60000, open: 100 + i, high: 101 + i, low: 99 + i, close: 100.5 + i, volume: 10,
}));

const results = targets.map(({ path, version }) => {
  const host = `//@version=6\nindicator("t")\nimport ${path} as L\nplot(close)\n`;
  try {
    const s = new Session();
    const c = s.compile(host, { libraries: libs });
    if (c.errors.length) return { path, version, stage: "compile", msg: String(c.errors[0].message) };
    const r: any = s.runHistory(candles);
    if (r.errors?.length) return { path, version, stage: "run", msg: String(r.errors[0].message ?? r.errors[0]) };
    return { path, version, stage: "ok", msg: "" };
  } catch (e: any) {
    return { path, version, stage: "throw", msg: String(e?.message ?? e) };
  }
});

const missing = (r: { msg: string }) => /no source was supplied for the library/.test(r.msg);
for (const v of [...new Set(results.map(r => r.version))].sort()) {
  const rows = results.filter(r => r.version === v);
  const ok = rows.filter(r => r.stage === "ok").length;
  const dep = rows.filter(missing).length;
  console.log(`v${v}: ${ok}/${rows.length} pass, ${rows.length - ok - dep} engine failures, ${dep} missing a dependency`);
}
const out = opt("out");
if (out) writeFileSync(out, JSON.stringify(results, null, 1));
