// The practice terminal's brain, with no DOM in it (the test harness imports it
// from Node).
//
//   Vfs    a tiny in-memory file system: absolute paths, directories, text files.
//   Shell  parses a command line, runs the few shell helpers itself (ls, cat,
//          head, tail, wc, mkdir, rm, echo, pwd, clear, help) and hands every
//          `openpinescript ...` command to the engine, which is the real CLI code
//          (site/src/sim.js). It keeps a record of every command run, which is
//          what the exercise checkers read.
//
// Nothing here knows what the CLI prints. That text comes from the CLI itself.

export const HOME = "/home/you/OpenPineScript";
export const SHORT_HOME = "~/OpenPineScript";

// The package name and version `npm run opsv2` prints in its banner (package.json).
// site/test/fidelity.mjs fails if these drift.
export const NPM_PACKAGE = { name: "openpinescript", version: "0.1.0" };

const ANSI = /\x1b\[[0-9;]*m/g;
export const stripAnsi = (s) => String(s).replace(ANSI, "");

// ---------------------------------------------------------------- paths

export function normalize(p) {
  const out = [];
  for (const seg of p.split("/")) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") { if (out.length) out.pop(); } else out.push(seg);
  }
  return "/" + out.join("/");
}

export function resolvePath(p, cwd = HOME) { return normalize(p.startsWith("/") ? p : cwd + "/" + p); }
export function relPath(abs, cwd = HOME) { return abs === cwd ? "." : abs.startsWith(cwd + "/") ? abs.slice(cwd.length + 1) : abs; }
const dirOf = (abs) => abs.slice(0, abs.lastIndexOf("/")) || "/";
const baseOf = (p) => p.replace(/\/+$/, "").split("/").pop();

// ---------------------------------------------------------------- file system

export class Vfs {
  constructor() { this.files = new Map(); this.dirs = new Set(["/"]); }

  mkdirp(abs) {
    let cur = "";
    for (const part of normalize(abs).split("/").filter(Boolean)) { cur += "/" + part; this.dirs.add(cur); }
  }
  write(abs, text) { this.mkdirp(dirOf(abs)); this.files.set(abs, text); }
  has(abs) { return this.files.has(abs) || this.dirs.has(abs); }
  isDir(abs) { return this.dirs.has(abs); }
  read(abs) { return this.files.get(abs) ?? null; }
  /** Immediate children of a directory: [{ name, dir }], sorted, directories first. */
  list(abs) {
    const kids = new Map();
    const prefix = abs === "/" ? "/" : abs + "/";
    for (const d of this.dirs) if (d !== abs && d.startsWith(prefix) && !d.slice(prefix.length).includes("/")) kids.set(d.slice(prefix.length), true);
    for (const f of this.files.keys()) if (f.startsWith(prefix) && !f.slice(prefix.length).includes("/")) kids.set(f.slice(prefix.length), false);
    return [...kids].map(([name, dir]) => ({ name, dir })).sort((a, b) => (a.dir === b.dir ? a.name.localeCompare(b.name) : a.dir ? -1 : 1));
  }
  remove(abs) {
    this.files.delete(abs);
    const prefix = abs + "/";
    for (const f of [...this.files.keys()]) if (f.startsWith(prefix)) this.files.delete(f);
    for (const d of [...this.dirs]) if (d === abs || d.startsWith(prefix)) this.dirs.delete(d);
  }
  clone() {
    const v = new Vfs();
    v.files = new Map(this.files); v.dirs = new Set(this.dirs);
    return v;
  }
  /** Every file under the working directory, as paths relative to it, sorted. */
  paths(cwd = HOME) { return [...this.files.keys()].filter((f) => f.startsWith(cwd + "/")).map((f) => relPath(f, cwd)).sort(); }
}

// ---------------------------------------------------------------- reading a CLI command line

const VALUE_FLAGS = ["--data", "--out-dir", "--out-chart", "--out-trades", "--out-summary", "--input", "--compare-dir", "--compare-chart", "--compare-trades", "--compare-summary", "--out-comparison", "--tolerance"];
const BOOL_FLAGS = ["--dry-run", "--show-transpiled"];
export const CLI_FLAGS = [...VALUE_FLAGS, ...BOOL_FLAGS];

/**
 * What the CLI will make of `args`, read the way mock_run/v2/cli_main.ts reads
 * them (the first argument ending in .pine, a flag's value is the next argument,
 * unknown flags are ignored). Checkers use this instead of matching text.
 */
export function describeArgs(args) {
  const flag = (name) => { const i = args.indexOf(name); return i !== -1 && i + 1 < args.length ? args[i + 1] : null; };
  const inputs = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--input" && i + 1 < args.length) {
      const kv = args[i + 1], eq = kv.indexOf("=");
      if (eq > 0) inputs[kv.slice(0, eq)] = kv.slice(eq + 1);
      i++;
    }
  }
  return {
    script: args.find((a) => a.endsWith(".pine")) ?? null,
    data: flag("--data"),
    outDir: flag("--out-dir"), outChart: flag("--out-chart"), outTrades: flag("--out-trades"), outSummary: flag("--out-summary"),
    compareDir: flag("--compare-dir"), compareChart: flag("--compare-chart"), compareTrades: flag("--compare-trades"), compareSummary: flag("--compare-summary"),
    outComparison: flag("--out-comparison"),
    tolerance: flag("--tolerance"),
    inputs,
    showTranspiled: args.includes("--show-transpiled"),
    dryRun: args.includes("--dry-run"),
    unknownFlags: args.filter((a) => a.startsWith("--") && !CLI_FLAGS.includes(a)),
  };
}

// ---------------------------------------------------------------- tokenising

/**
 * Splits a line into words and operators. Quotes group (and are removed),
 * `$?` becomes the last exit code. Operators: && ; | > >> 2> 2>&1
 * @returns {Array<{op: string} | {word: string}>}
 */
export function tokenize(line, lastCode = 0) {
  const out = [];
  let cur = "", has = false, i = 0;
  const flush = () => { if (has) { out.push({ word: cur }); cur = ""; has = false; } };
  while (i < line.length) {
    const c = line[i];
    if (c === "'") { const j = line.indexOf("'", i + 1); if (j === -1) throw new Error("unterminated quote"); cur += line.slice(i + 1, j); has = true; i = j + 1; continue; }
    if (c === '"') {
      const j = line.indexOf('"', i + 1); if (j === -1) throw new Error("unterminated quote");
      cur += line.slice(i + 1, j).replace(/\$\?/g, String(lastCode)); has = true; i = j + 1; continue;
    }
    if (c === " " || c === "\t") { flush(); i++; continue; }
    if (line.startsWith("2>&1", i)) { flush(); out.push({ op: "2>&1" }); i += 4; continue; }
    if (line.startsWith("2>", i) && !has) { out.push({ op: "2>" }); i += 2; continue; }
    if (line.startsWith("&&", i)) { flush(); out.push({ op: "&&" }); i += 2; continue; }
    if (line.startsWith(">>", i)) { flush(); out.push({ op: ">>" }); i += 2; continue; }
    if (c === ">" || c === ";" || c === "|") { flush(); out.push({ op: c }); i++; continue; }
    if (c === "$" && line[i + 1] === "?") { cur += String(lastCode); has = true; i += 2; continue; }
    cur += c; has = true; i++;
  }
  flush();
  return out;
}

// ---------------------------------------------------------------- the shell

const HELP = `This is a practice terminal. It runs the real openpinescript CLI code on a
small virtual file system, inside your browser.

  openpinescript <script.pine> --data <csv> [flags]    also: npx openpinescript ...
  ls [-l] [path...]   cat <file...>   head|tail [-n N] <file>   wc -l <file>
  mkdir -p <dir>      rm [-rf] <path> echo <text>   pwd   clear   help

Redirects work: 2>/dev/null, >/dev/null, 2>&1, > file and >> file. Chain with && or ;
Up/down arrows walk through history, Tab completes file names and flags.
Pipes, cd and everything else on a real system are not available here.`;

/** Plain-text answer for a builtin: [stdout, stderr, code]. */
function out(text, code = 0) { return { stdout: text, stderr: "", code }; }
function err(text, code = 1) { return { stdout: "", stderr: text, code }; }

export class Shell {
  /**
   * @param {object} o
   * @param {Vfs} o.vfs
   * @param {(req: object) => Promise<{code:number, chunks:Array<[string,string]>, writes:object, dirs:string[]}>} o.engine
   *        runs `openpinescript` (the real CLI) on a snapshot of the file system
   */
  constructor({ vfs, engine }) {
    this.vfs = vfs;
    this.engine = engine;
    this.cwd = HOME;
    this.lastCode = 0;
    this.runs = [];          // one record per command executed (see `record`)
    this.history = [];       // lines typed, oldest first
  }

  /** Run a whole line. Returns the records of the commands in it. */
  async exec(line) {
    const text = line.trim();
    if (!text) return [];
    if (this.history[this.history.length - 1] !== text) this.history.push(text);
    let tokens;
    try { tokens = tokenize(text, this.lastCode); } catch (e) {
      return [this.push({ line: text, cmd: "", args: [], kind: "builtin", code: 2, chunks: [["stderr", `bash: syntax error: ${e.message}\n`]] })];
    }
    // split into simple commands at && and ;
    const groups = []; let cur = [], joiner = null;
    for (const t of tokens) {
      if (t.op === "&&" || t.op === ";") { groups.push({ tokens: cur, joiner }); cur = []; joiner = t.op; } else cur.push(t);
    }
    groups.push({ tokens: cur, joiner });
    const records = [];
    for (let k = 0; k < groups.length; k++) {
      if (k > 0 && groups[k].joiner === "&&" && this.lastCode !== 0) break;
      if (!groups[k].tokens.length) continue;
      records.push(await this.simple(text, groups[k].tokens));
    }
    return records;
  }

  push(rec) {
    const r = {
      kind: "builtin", cmd: "", args: [], code: 0, chunks: [], writes: {}, stderrDiscarded: false, stdoutRedirect: null,
      rawStdout: "", rawStderr: "", ...rec,
    };
    r.stdout = stripAnsi(r.rawStdout); r.stderr = stripAnsi(r.rawStderr);
    this.lastCode = r.code;
    this.runs.push(r);
    return r;
  }

  async simple(line, tokens) {
    // peel redirections off the end of a simple command
    const words = []; let stdoutTo = null, appendTo = null, stderrTo = null, merge = false;
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (t.word !== undefined) { words.push(t.word); continue; }
      if (t.op === "2>&1") { merge = true; continue; }
      if (t.op === "|") return this.push({ line, cmd: words[0] || "", code: 1, chunks: [["stderr", "bash: pipes are not available in this practice terminal. Use a file: redirect with > and cat it.\n"]] });
      const target = tokens[i + 1] && tokens[i + 1].word;
      if (target === undefined) return this.push({ line, cmd: words[0] || "", code: 2, chunks: [["stderr", "bash: syntax error near unexpected token `newline'\n"]] });
      if (t.op === ">") stdoutTo = target; else if (t.op === ">>") appendTo = target; else if (t.op === "2>") stderrTo = target;
      i++;
    }
    if (!words.length) return this.push({ line, code: 0 });

    // a failing redirect stops the command before it runs, as in bash
    for (const target of [stdoutTo, appendTo, stderrTo]) {
      if (target === null || target === "/dev/null") continue;
      const abs = resolvePath(target, this.cwd);
      if (this.vfs.isDir(abs)) return this.push({ line, cmd: words[0], code: 1, chunks: [["stderr", `bash: ${target}: Is a directory\n`]] });
      if (!this.vfs.isDir(dirOf(abs))) return this.push({ line, cmd: words[0], code: 1, chunks: [["stderr", `bash: ${target}: No such file or directory\n`]] });
    }

    const ops = this.opsArgs(words);
    let rec;
    if (ops) rec = await this.runOps(line, words[0], ops.args, ops.banner);
    else rec = this.runBuiltin(line, words);

    // apply redirections to what the command printed
    let chunks = rec.chunks;
    const so = rec.chunks.filter((c) => c[0] === "stdout").map((c) => c[1]).join("");
    const se = rec.chunks.filter((c) => c[0] === "stderr").map((c) => c[1]).join("");
    if (merge) chunks = chunks.map(([s, t]) => ["stdout", t]);
    const target = stdoutTo ?? appendTo;
    if (target !== null) {
      if (target !== "/dev/null") {
        const abs = resolvePath(target, this.cwd);
        this.vfs.write(abs, (appendTo !== null ? this.vfs.read(abs) ?? "" : "") + so);
        rec.writes[abs] = this.vfs.read(abs);
        rec.stdoutRedirect = relPath(abs, this.cwd);
      }
      chunks = chunks.filter((c) => c[0] !== "stdout" || merge);
    }
    if (stderrTo !== null) {
      if (stderrTo !== "/dev/null") {
        const abs = resolvePath(stderrTo, this.cwd);
        this.vfs.write(abs, se); rec.writes[abs] = se;
      }
      rec.stderrDiscarded = stderrTo === "/dev/null";
      chunks = chunks.filter((c) => c[0] !== "stderr");
    }
    rec.chunks = chunks;
    return this.push(rec);
  }

  /**
   * `openpinescript`, `npx openpinescript`, `node dist/cli.mjs` or `npm run [--silent] opsv2 --` followed by arguments
   * -> { args, banner } (banner: npm prints its 3-line header unless --silent), else null.
   */
  opsArgs(words) {
    const [a, b] = words;
    if (a === "openpinescript") return { args: words.slice(1), banner: false };
    if (a === "npx" && b === "openpinescript") return { args: words.slice(2), banner: false };
    if (a === "npx" && (b === "-y" || b === "--yes") && words[2] === "openpinescript") return { args: words.slice(3), banner: false };
    if (a === "node" && (b === "dist/cli.mjs" || b === "./dist/cli.mjs")) return { args: words.slice(2), banner: false };
    if (a === "npm" && (b === "run" || b === "run-script")) {
      let i = 2, silent = false;
      while (words[i] === "--silent" || words[i] === "-s") { silent = true; i++; }
      if (words[i] !== "opsv2") return null;
      i++;
      while (words[i] === "--silent" || words[i] === "-s") { silent = true; i++; }
      if (words[i] === "--") i++;
      return { args: words.slice(i), banner: !silent };
    }
    return null;
  }

  async runOps(line, cmd, args, banner) {
    const files = Object.fromEntries(this.vfs.files);
    const res = await this.engine({ args, cwd: this.cwd, files, dirs: [...this.vfs.dirs] });
    for (const d of res.dirs) this.vfs.mkdirp(d);
    for (const [p, text] of Object.entries(res.writes)) this.vfs.write(p, text);
    const chunks = res.chunks.slice();
    if (banner) chunks.unshift(["stdout", `\n> ${NPM_PACKAGE.name}@${NPM_PACKAGE.version} opsv2\n> tsx mock_run/v2/run.ts ${args.join(" ")}\n\n`]);
    const join = (s) => chunks.filter((c) => c[0] === s).map((c) => c[1]).join("");
    return {
      line, kind: "ops", cmd, args, parsed: describeArgs(args), code: res.code, chunks,
      rawStdout: join("stdout"), rawStderr: join("stderr"), writes: { ...res.writes },
    };
  }

  runBuiltin(line, words) {
    const [cmd, ...rest] = words;
    let r;
    switch (cmd) {
      case "ls": r = this.ls(rest); break;
      case "cat": r = this.cat(rest); break;
      case "head": case "tail": r = this.headTail(cmd, rest); break;
      case "wc": r = this.wc(rest); break;
      case "mkdir": r = this.mkdir(rest); break;
      case "rm": r = this.rm(rest); break;
      case "echo": r = out(rest.join(" ") + "\n"); break;
      case "pwd": r = out(this.cwd + "\n"); break;
      case "help": r = out(HELP + "\n"); break;
      case "clear": return { line, kind: "clear", cmd, args: rest, code: 0, chunks: [] };
      case "cd": r = err("cd: this practice terminal always stays in the repository root\n"); break;
      case "npm": case "npx": case "node": case "git": case "tsx": case "python": case "python3": case "jq": case "curl":
        r = err(`${cmd}: not available in this practice terminal. Run the CLI as: openpinescript <script.pine> --data <csv> [flags]\n`, 127); break;
      default: r = err(`bash: ${cmd}: command not found\n`, 127);
    }
    const chunks = [];
    if (r.stdout) chunks.push(["stdout", r.stdout]);
    if (r.stderr) chunks.push(["stderr", r.stderr]);
    return { line, kind: "builtin", cmd, args: rest, code: r.code, chunks, rawStdout: r.stdout, rawStderr: r.stderr };
  }

  // ---- builtins ----

  ls(args) {
    const flags = args.filter((a) => a.startsWith("-") && a.length > 1);
    const paths = args.filter((a) => !(a.startsWith("-") && a.length > 1));
    const long = flags.some((f) => f.includes("l"));
    const targets = paths.length ? paths : ["."];
    let stdout = "", stderr = "", code = 0;
    const row = (name, abs, dir) => {
      if (!long) return name + (dir ? "/" : "");
      const size = dir ? 4096 : this.vfs.read(abs).length;
      return `${dir ? "drwxr-xr-x" : "-rw-r--r--"} 1 you you ${String(size).padStart(8)} Nov 12 09:00 ${name}${dir ? "/" : ""}`;
    };
    const emit = (names) => (long ? names.join("\n") : names.join("  ")) + (names.length ? "\n" : "");
    const dirsOut = [];
    for (const t of targets) {
      const abs = resolvePath(t, this.cwd);
      if (!this.vfs.has(abs)) { stderr += `ls: cannot access '${t}': No such file or directory\n`; code = 2; continue; }
      if (!this.vfs.isDir(abs)) { stdout += emit([row(t, abs, false)]); continue; }
      dirsOut.push([t, abs]);
    }
    dirsOut.forEach(([t, abs], i) => {
      if (targets.length > 1) stdout += (i > 0 || stdout ? "\n" : "") + `${t}:\n`;
      stdout += emit(this.vfs.list(abs).map((k) => row(k.name, abs === "/" ? "/" + k.name : abs + "/" + k.name, k.dir)));
    });
    return { stdout, stderr, code };
  }

  cat(args) {
    let stdout = "", stderr = "", code = 0;
    if (!args.length) return err("cat: this practice terminal needs a file name\n");
    for (const a of args) {
      const abs = resolvePath(a, this.cwd);
      if (this.vfs.isDir(abs)) { stderr += `cat: ${a}: Is a directory\n`; code = 1; }
      else if (!this.vfs.files.has(abs)) { stderr += `cat: ${a}: No such file or directory\n`; code = 1; }
      else stdout += this.vfs.read(abs);   // as is: the CLI's files have no trailing newline, and neither does `cat`'s output
    }
    return { stdout, stderr, code };
  }

  headTail(cmd, args) {
    let n = 10; const files = [];
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "-n" && args[i + 1] !== undefined) { n = parseInt(args[++i], 10); }
      else if (/^-\d+$/.test(args[i])) n = parseInt(args[i].slice(1), 10);
      else files.push(args[i]);
    }
    if (!files.length) return err(`${cmd}: this practice terminal needs a file name\n`);
    if (isNaN(n)) return err(`${cmd}: invalid number of lines\n`);
    let stdout = "", stderr = "", code = 0;
    for (const f of files) {
      const abs = resolvePath(f, this.cwd);
      if (!this.vfs.files.has(abs)) { stderr += `${cmd}: cannot open '${f}' for reading: No such file or directory\n`; code = 1; continue; }
      const text = this.vfs.read(abs);
      const lines = text.split("\n");
      const endsNl = text.endsWith("\n");
      if (endsNl) lines.pop();
      if (files.length > 1) stdout += `==> ${f} <==\n`;
      const keep = cmd === "head" ? lines.slice(0, n) : lines.slice(Math.max(0, lines.length - n));
      // like head and tail: the last line keeps its newline only if the file had one (or more lines follow)
      const reachesEnd = keep.length === lines.length || cmd === "tail";
      stdout += keep.join("\n") + (keep.length && (!reachesEnd || endsNl) ? "\n" : "");
    }
    return { stdout, stderr, code };
  }

  wc(args) {
    const files = args.filter((a) => !a.startsWith("-"));
    if (!files.length) return err("wc: this practice terminal needs a file name\n");
    let stdout = "", stderr = "", code = 0;
    for (const f of files) {
      const abs = resolvePath(f, this.cwd);
      if (!this.vfs.files.has(abs)) { stderr += `wc: ${f}: No such file or directory\n`; code = 1; continue; }
      stdout += `${(this.vfs.read(abs).match(/\n/g) || []).length} ${f}\n`;
    }
    return { stdout, stderr, code };
  }

  mkdir(args) {
    const parents = args.some((a) => a === "-p");
    const paths = args.filter((a) => !a.startsWith("-"));
    if (!paths.length) return err("mkdir: missing operand\n");
    let stderr = "", code = 0;
    for (const p of paths) {
      const abs = resolvePath(p, this.cwd);
      if (this.vfs.has(abs) && !(parents && this.vfs.isDir(abs))) { stderr += `mkdir: cannot create directory ‘${p}’: File exists\n`; code = 1; continue; }
      if (!parents && !this.vfs.isDir(dirOf(abs))) { stderr += `mkdir: cannot create directory ‘${p}’: No such file or directory\n`; code = 1; continue; }
      this.vfs.mkdirp(abs);
    }
    return { stdout: "", stderr, code };
  }

  rm(args) {
    const flags = args.filter((a) => a.startsWith("-") && a.length > 1).join("");
    const recursive = /[rR]/.test(flags), force = flags.includes("f");
    const paths = args.filter((a) => !(a.startsWith("-") && a.length > 1));
    if (!paths.length) return err("rm: missing operand\n");
    let stderr = "", code = 0;
    for (const p of paths) {
      const abs = resolvePath(p, this.cwd);
      if (abs === this.cwd || abs === "/" || this.cwd.startsWith(abs + "/")) { stderr += `rm: refusing to remove '${p}'\n`; code = 1; continue; }
      if (!this.vfs.has(abs)) { if (!force) { stderr += `rm: cannot remove '${p}': No such file or directory\n`; code = 1; } continue; }
      if (this.vfs.isDir(abs) && !recursive) { stderr += `rm: cannot remove '${p}': Is a directory\n`; code = 1; continue; }
      this.vfs.remove(abs);
    }
    return { stdout: "", stderr, code };
  }

  // ---- tab completion ----

  /** @returns {{ line: string, options: string[] }} the line with the common prefix filled in, and the candidates when ambiguous */
  complete(line) {
    const m = /(\S*)$/.exec(line);
    const word = m[1], head = line.slice(0, line.length - word.length);
    const before = head.trim().split(/\s+/).filter(Boolean);
    let cands;
    if (before.length === 0) {
      cands = ["openpinescript", "npx openpinescript", "node dist/cli.mjs", "npm run --silent opsv2 --", "ls", "cat", "head", "tail", "wc", "mkdir -p", "rm", "echo", "pwd", "clear", "help"].filter((c) => c.startsWith(word));
    } else if (word.startsWith("-") && before.some((w) => w === "openpinescript" || w === "npx" || w === "dist/cli.mjs" || w === "opsv2")) {
      cands = CLI_FLAGS.filter((f) => f.startsWith(word));
    } else {
      const slash = word.lastIndexOf("/");
      const dirPart = slash === -1 ? "" : word.slice(0, slash + 1), stem = word.slice(slash + 1);
      const abs = resolvePath(dirPart || ".", this.cwd);
      cands = this.vfs.isDir(abs) ? this.vfs.list(abs).filter((k) => k.name.startsWith(stem)).map((k) => dirPart + k.name + (k.dir ? "/" : "")) : [];
    }
    if (!cands.length) return { line, options: [] };
    let prefix = cands[0];
    for (const c of cands) { let i = 0; while (i < prefix.length && i < c.length && prefix[i] === c[i]) i++; prefix = prefix.slice(0, i); }
    const done = cands.length === 1 && !cands[0].endsWith("/") ? cands[0] + " " : prefix;
    return { line: head + done, options: cands.length > 1 ? cands : [] };
  }

  // ---- what exercise checkers read ----

  /** Text of a file by path relative to the working directory, or null. */
  readRel(rel) { return this.vfs.read(resolvePath(rel, this.cwd)); }
  /** Relative paths of all files under a directory (relative to cwd), or all files when omitted. */
  filesUnder(rel = ".") {
    const abs = resolvePath(rel, this.cwd);
    return this.vfs.paths(this.cwd).filter((p) => resolvePath(p, this.cwd).startsWith(abs === "/" ? "/" : abs + "/"));
  }
}

export { baseOf };
