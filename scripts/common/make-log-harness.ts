/**
 * Generates the Pine-Logs variant of each golden harness.
 *
 * ── Why this exists ─────────────────────────────────────────────────────────
 *
 * "Export chart data…" is gated to PRO+ and Premium. The free way to get the
 * same numbers out of TradingView is `log.info()`: Pine Logs run on HISTORICAL
 * bars (unlike `alert()`, which only ever fires on realtime bars, so it can
 * never backfill a chart), and hold the last 10,000 historical messages — far
 * more than the few hundred bars a comparison needs.
 *
 * Pine Logs require v5. Our harnesses are v3, because that is the version this
 * engine implements and the version whose semantics we want pinned. Rather than
 * keep two hand-written copies of every harness in step — a sync hazard with no
 * test that could catch it — the v3 file stays the single source of truth and
 * this script mechanically derives the v5 logging form.
 *
 * Each generated script emits one CSV row per bar, marked with a prefix so the
 * loader can find it inside whatever the Pine Logs pane wraps it in:
 *
 *     OPSHEAD|time,open,high,low,close,volume,sma_20,ema_20,…
 *     OPS|1420156800000,111.39,111.44,107.35,109.33,53204626,NaN,NaN,…
 *
 * Run:  npx tsx scripts/common/make-log-harness.ts
 */
import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = path.resolve(__dirname, "../..");
const CONFORMANCE = path.join(ROOT, "conformance");

/**
 * v3 built-in → its v5 spelling.
 *
 * v5 moved the technical-analysis library under `ta.` and the maths under
 * `math.`. Only names that appear as CALLS are rewritten (`name(`), so a
 * variable that happens to share a name is untouched.
 *
 * A v3 built-in that is absent from this map and has no `@nov5` marker makes
 * the script FAIL rather than emit a call that silently means something else.
 */
const TA = [
  "sma", "ema", "rma", "wma", "vwma", "swma", "rsi", "atr", "tr", "stdev",
  "variance", "dev", "cci", "mom", "roc", "change", "highest", "lowest",
  "highestbars", "lowestbars", "linreg", "correlation", "stoch", "cog", "alma",
  "percentrank", "macd", "tsi", "trix", "cum", "sar", "vwap", "barssince",
  "valuewhen", "rising", "falling", "cross", "crossover", "crossunder",
  "fixnan", "pivothigh", "pivotlow", "bb", "bbw", "kc", "kcw", "dmi", "wpr",
  "mfi", "hma", "supertrend", "cmo",
  "percentile_nearest_rank", "percentile_linear_interpolation",
];

const MATH = ["max", "min", "sum", "abs", "round", "floor", "ceil", "pow",
              "sqrt", "log", "log10", "exp", "sign", "avg"];

/** Global in v3 AND v5 — deliberately listed so an unknown name is an error. */
const UNCHANGED = new Set([
  "na", "nz", "time", "timestamp", "year", "month", "dayofmonth", "dayofweek",
  "hour", "minute", "second", "weekofyear", "plot", "strategy", "input",
  "str", "color", "label", "line", "log", "indicator", "alert", "int", "float",
  "bool", "string",
]);

const RENAMES = new Map<string, string>([
  ...TA.map(n => [n, `ta.${n}`] as [string, string]),
  ...MATH.map(n => [n, `math.${n}`] as [string, string]),
  ["study", "indicator"],
]);

/** Numeric formatting for a logged cell — ten decimals, well inside 1e-6. */
const FMT = '"#.##########"';

/** Split a line into code and its trailing `//` comment, ignoring `//` in strings. */
function splitComment(line: string): [string, string] {
  let inStr = false, quote = "";
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inStr) { if (c === quote && line[i - 1] !== "\\") inStr = false; continue; }
    if (c === '"' || c === "'") { inStr = true; quote = c; continue; }
    if (c === "/" && line[i + 1] === "/") return [line.slice(0, i), line.slice(i)];
  }
  return [line, ""];
}

/** Apply the v3 → v5 call renames to one line of code. */
function rename(code: string): string {
  code = rewriteIff(code);
  // Lookbehind, NOT a consumed leading character: consuming it meant a nested
  // call could not match, because its delimiter had already been eaten by the
  // enclosing match. `ema(ema(ema(x, 9), 9), 9)` came out renamed at the outer
  // and inner levels but not the middle one.
  return code.replace(/(?<![A-Za-z0-9_.])([A-Za-z_][A-Za-z0-9_]*)\s*\(/g,
    (whole, name: string) => {
      const to = RENAMES.get(name);
      return to ? `${to}(` : whole;
    });
}

/** Splits an argument list on TOP-LEVEL commas — the arguments contain their own. */
function splitTopLevel(inner: string): string[] {
  const parts: string[] = [];
  let depth = 0, cur = "", inStr = false, quote = "";
  for (const c of inner) {
    if (inStr) { cur += c; if (c === quote) inStr = false; continue; }
    if (c === '"' || c === "'") { inStr = true; quote = c; cur += c; continue; }
    if (c === "(" || c === "[") depth++;
    if (c === ")" || c === "]") depth--;
    if (c === "," && depth === 0) { parts.push(cur); cur = ""; continue; }
    cur += c;
  }
  parts.push(cur);
  return parts;
}

/**
 * `iff(cond, t, f)` → `(cond ? t : f)`.
 *
 * v5 REMOVED `iff` (dev-docs/01-version-delta-spec.md §4c), so it cannot be
 * renamed like the rest — the replacement is a different construct. Rewriting
 * it here rather than marking the source line `@nov5` keeps the column: the v3
 * harness tests `iff` and the v5 one tests the ternary it became, and the two
 * must produce the same numbers.
 *
 * Innermost-first, so a nested `iff` inside another one is rewritten too.
 */
function rewriteIff(code: string): string {
  for (;;) {
    const at = code.search(/(?<![A-Za-z0-9_.])iff\s*\(/);
    if (at === -1) return code;

    const open = code.indexOf("(", at);
    let depth = 0, close = -1;
    for (let i = open; i < code.length; i++) {
      if (code[i] === "(") depth++;
      else if (code[i] === ")" && --depth === 0) { close = i; break; }
    }
    if (close === -1) return code; // unbalanced — leave it for the reader to see

    const args = splitTopLevel(code.slice(open + 1, close)).map(a => a.trim());
    if (args.length !== 3) return code;
    code = `${code.slice(0, at)}(${args[0]} ? ${args[1]} : ${args[2]})${code.slice(close + 1)}`;
  }
}

/** `plot(EXPR, title="NAME")` → the expression and the column name. */
function parsePlot(code: string): { expr: string; title: string } | null {
  const trimmed = code.trim();
  if (!/^plot\s*\(/.test(trimmed)) return null;
  const inner = trimmed.slice(trimmed.indexOf("(") + 1, trimmed.lastIndexOf(")"));
  const parts = splitTopLevel(inner);

  const titlePart = parts.find(p => /^\s*title\s*=/.test(p));
  if (!titlePart) return null;
  const title = titlePart.slice(titlePart.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
  return { expr: parts[0].trim(), title };
}

function convert(file: string): { out: string; titles: string[] } {
  const src = fs.readFileSync(file, "utf8");
  const body: string[] = [];
  const titles: string[] = [];
  const values: string[] = [];
  let n = 0;

  for (const raw of src.split("\n")) {
    const [code, comment] = splitComment(raw);

    if (/@nov5\b/.test(comment)) {
      body.push(`// SKIPPED (marked @nov5):${comment.replace("//", "")}`);
      continue;
    }
    // The banner supplies //@version=5; a second annotation from the source is
    // at best noise and at worst read as the real one.
    if (/^\s*\/\/@version\s*=/.test(raw)) continue;

    // Instructions that only make sense for the version-N original.
    if (/bump line 1|delete any single plot|Same rules as/i.test(comment)) continue;

    if (code.trim() === "") { body.push(raw); continue; }

    const plot = parsePlot(code);
    if (plot) {
      // A plot becomes a named local, so the logged row can reference it and the
      // column order is fixed by declaration order.
      const name = `_v${n++}`;
      body.push(`${name} = ${rename(plot.expr)}${comment}`);
      titles.push(plot.title);
      values.push(name);
      continue;
    }

    body.push(rename(code) + comment);
  }

  const header = ["time", "open", "high", "low", "close", "volume", ...titles].join(",");
  const cells = [
    'str.tostring(time, "#")',
    ...["open", "high", "low", "close", "volume"].map(s => `str.tostring(${s}, ${FMT})`),
    ...values.map(v => `str.tostring(${v}, ${FMT})`),
  ];

  const emit = [
    "",
    "// ── Pine Logs emission ──────────────────────────────────────────────────",
    "// One row per bar. The OPS| marker lets the loader find the row inside",
    "// whatever prefix the Pine Logs pane adds when you copy it out.",
    "if barstate.isfirst",
    `    log.info("OPSHEAD|${header}")`,
    "",
    // The '+' goes at the END of each line, not the start of the next.
    //
    // Pine allows both and this engine now reads both — a leading operator on
    // an indented line is recognised as a continuation (see
    // `nextLineStartsWithArithmetic` in lexer/v1/IndentTokenSource.ts), which
    // was added because every generated harness used to fail to parse.
    //
    // Trailing is still what is emitted, because it needs no such rule: the
    // previous line's last token settles it, which is the older and simpler of
    // the two paths through the token source.
    "_row = " + cells.join(' + "," +\n      '),
    '',
    'log.info("OPS|" + _row)',
  ].join("\n");

  return { out: body.join("\n").replace(/\n{3,}/g, "\n\n") + emit + "\n", titles };
}

const BANNER = (from: string) => `//@version=5
// ─────────────────────────────────────────────────────────────────────────────
// GENERATED — do not edit. Source: conformance/${from}
// Regenerate with: npx tsx scripts/common/make-log-harness.ts
//
// The Pine-Logs variant of that harness, for collecting golden data WITHOUT the
// PRO+/Premium "Export chart data…" feature.
//
//   1. Paste into the Pine editor and add to the chart.
//   2. Open  More (⋮) → Pine Logs.
//   3. Select all the log lines and copy them.
//   4. Save as conformance/<version>/golden/<harness>.<SYMBOL>.<TF>.log
//
// Pine Logs run on HISTORICAL bars — unlike alert(), which only ever fires on
// realtime bars — and keep the last 10,000 historical messages.
// ─────────────────────────────────────────────────────────────────────────────
`;

let wrote = 0;
// Layout is conformance/<version>/golden/, so the version directory is the
// OUTER one and `golden` sits inside it.
for (const dir of fs.readdirSync(CONFORMANCE)) {
  if (!/^v\d+$/.test(dir) || dir === "v5") continue;
  const abs = path.join(CONFORMANCE, dir, "golden");
  if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) continue;

  const outDir = path.join(CONFORMANCE, "v5", "golden");
  fs.mkdirSync(outDir, { recursive: true });

  for (const f of fs.readdirSync(abs).filter(f => f.endsWith(".pine"))) {
    const { out, titles } = convert(path.join(abs, f));
    const name = `${path.basename(f, ".pine")}.pine`;
    fs.writeFileSync(path.join(outDir, name), BANNER(`${dir}/golden/${f}`) + out);
    console.log(`${dir}/golden/${f}  →  v5/golden/${name}   (${titles.length} columns)`);
    wrote++;
  }
}
console.log(`\n${wrote} harnesses generated into conformance/v5/golden/`);
