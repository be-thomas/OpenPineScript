/**
 * Re-fetch the TradingView documentation examples in examples/<version>/tradingview-docs/
 * and verify that every committed file is still byte-identical to its source.
 *
 * ── Why this script exists ──────────────────────────────────────────────────
 *
 * The examples are used for PARITY checking: run one here, run the same script
 * on TradingView, compare the logs. That comparison is only meaningful if the
 * two sides are running the same bytes. A file someone "tidied" — a reflowed
 * line, a normalised quote, a stripped trailing space — silently turns a parity
 * failure into a parity failure about the wrong thing.
 *
 * So the files are never edited, and this script is the check that proves it.
 *
 * ── The one transformation applied ──────────────────────────────────────────
 *
 * The docs serve each example inside <div class="pine-colorizer not-content">,
 * with the source HTML-escaped. Un-escaping (&amp; → &, &lt; → <, &quot; → ")
 * recovers the bytes the author wrote; it is a decoding step, not an edit.
 * Nothing else is touched — not indentation, not trailing whitespace, not the
 * absence of a final newline, not the zero-width spaces that
 * v5-concepts-text-and-shapes-05.pine genuinely contains.
 *
 * Usage:
 *   node scripts/common/fetch-doc-examples.mjs verify    # default; fails on any drift
 *   node scripts/common/fetch-doc-examples.mjs write     # re-download and rewrite
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";

const ROOT = "examples";
const MANIFEST = join(ROOT, "common", "tradingview-docs", "MANIFEST.json");

/**
 * Where one example lives on disk.
 *
 * The repository partitions every top-level folder by Pine version, so an
 * example declaring `//@version=4` sits under `examples/v4/`. The manifest key
 * stays `v4/<name>.pine` — short, stable, and the thing a human quotes — and
 * this is the single place that turns it into a path.
 */
const fileOnDisk = key => {
  const [version, name] = key.split("/");
  return join(ROOT, version, "tradingview-docs", name);
};
const MODE = process.argv[2] ?? "verify";

/** Docs archives to walk. Each has its own nav; v1 has no archive. */
const ARCHIVES = ["v3", "v4", "v5"];

/** Pages whose examples are deliberately broken — they document error messages. */
const EXCLUDE_PAGE = /compilation-errors/;

const sha256 = s => createHash("sha256").update(s, "utf8").digest("hex");

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", "#39": "'", nbsp: " " };
const unescapeHtml = s =>
  s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (m, e) => {
    if (e in ENTITIES) return ENTITIES[e];
    if (e[0] === "#") return String.fromCodePoint(parseInt(e.slice(e[1] === "x" ? 2 : 1), e[1] === "x" ? 16 : 10));
    return m;
  });

async function get(url) {
  const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 OpenPineScript-doc-fetch" } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
}

const CODE_BLOCK = /<div class="pine-colorizer not-content">([\s\S]*?)<\/div>/g;
const DECLARATION = /^(indicator|strategy|library|study)\s*\(/m;

/** Every distinct page linked from an archive's nav, in nav order. */
async function pagesOf(archive) {
  const html = await get(`https://www.tradingview.com/pine-script-docs/${archive}/welcome/`);
  const hrefs = [...html.matchAll(new RegExp(`href="(/pine-script-docs/${archive}/[^"]+)"`, "g"))].map(m => m[1]);
  return [...new Set(hrefs)].filter(p => !EXCLUDE_PAGE.test(p));
}

/**
 * A block is kept only if it is a COMPLETE, RUNNABLE script: a `//@version`
 * annotation and a declaration statement. The docs are full of two-line
 * fragments that illustrate a point and cannot be executed; those would add
 * files to the corpus without adding anything to run.
 */
async function harvest() {
  const found = [];
  for (const archive of ARCHIVES) {
    for (const page of await pagesOf(archive)) {
      const html = await get(`https://www.tradingview.com${page}/`);
      let m, idx = 0;
      while ((m = CODE_BLOCK.exec(html))) {
        const code = unescapeHtml(m[1]);
        const v = /^\/\/@version=(\d)/.exec(code);
        const i = idx++;
        if (!v || !DECLARATION.test(code)) continue;
        found.push({ page, idx: i, url: `https://www.tradingview.com${page}/`, version: +v[1], code });
      }
      CODE_BLOCK.lastIndex = 0;
    }
  }
  return found;
}

/**
 * The filename records where the example came from: the docs archive that
 * served it, the page, and its position on that page. Two archives can serve
 * the same page name, and one page can serve several examples, so all three
 * parts are load-bearing.
 */
const fileNameFor = (page, idx) => {
  const slug = page.replace("/pine-script-docs/", "").replace(/\//g, "-");
  return `${slug}-${String(idx).padStart(2, "0")}.pine`;
};

const seen = new Set();
const entries = [];
for (const x of (await harvest()).sort((a, b) => a.version - b.version || a.page.localeCompare(b.page) || a.idx - b.idx)) {
  const digest = sha256(x.code);
  if (seen.has(digest)) continue;          // the same example appears on several pages
  seen.add(digest);
  entries.push({ file: `v${x.version}/${fileNameFor(x.page, x.idx)}`, version: x.version, source: x.url, sha256: digest, code: x.code });
}

let drift = 0, missing = 0, extra = 0;
for (const e of entries) {
  const path = fileOnDisk(e.file);
  if (MODE === "write") {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, e.code, "utf8");
    continue;
  }
  if (!existsSync(path)) { console.error(`MISSING  ${e.file}`); missing++; continue; }
  if (sha256(readFileSync(path, "utf8")) !== e.sha256) { console.error(`DRIFTED  ${e.file}  (${e.source})`); drift++; }
}

if (MODE === "write") {
  writeFileSync(MANIFEST, JSON.stringify(entries.map(({ code, ...rest }) => rest), null, 1) + "\n", "utf8");
  console.log(`wrote ${entries.length} examples`);
} else {
  const onDisk = new Set();
  for (const dir of readdirSync(ROOT).filter(d => /^v\d$/.test(d))) {
    const sub = join(ROOT, dir, "tradingview-docs");
    if (!existsSync(sub)) continue;
    for (const f of readdirSync(sub)) onDisk.add(`${dir}/${f}`);
  }
  for (const f of onDisk) if (!entries.some(e => e.file === f)) { console.error(`EXTRA    ${f}`); extra++; }
  console.log(`${entries.length} upstream examples; ${drift} drifted, ${missing} missing, ${extra} extra`);
  if (drift || missing || extra) process.exit(1);
}
