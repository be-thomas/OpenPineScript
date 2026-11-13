// Browser stand-ins for the four Node things the CLI touches: `node:fs`,
// `node:path`, `process` and `console`. sim-plugin.mjs points the CLI's own
// imports here, so mock_run/v2/cli_main.ts runs unmodified in a Web Worker
// against a virtual file system, and everything it prints is captured.
//
// Only what cli_main.ts and utils/v2/comparison_engine.ts call is here:
//   fs.readFileSync, fs.writeFileSync, fs.mkdirSync
//   path.resolve, path.join, path.basename
//   process.stdout.write, process.stderr.write, process.exit, process.argv
//   console.log, console.warn, console.error

/** The state of one CLI invocation; sim.js fills it in before `main` runs. */
export const host = {
  files: new Map(),     // absolute path -> text
  dirs: new Set(["/"]), // absolute path
  cwd: "/",
  chunks: [],           // [["stdout" | "stderr", text], ...] in the order they were printed
  writes: new Map(),    // files this invocation wrote
  newDirs: new Set(),   // directories this invocation created
};

/** What `process.exit()` throws, so the caller can stop `main` and learn the code. */
export class ExitSignal { constructor(code) { this.code = code; } }

// ---- path (posix) ----

function normalize(p) {
  const abs = p.startsWith("/");
  const out = [];
  for (const seg of p.split("/")) {
    if (seg === "" || seg === ".") continue;
    if (seg === "..") { if (out.length && out[out.length - 1] !== "..") out.pop(); else if (!abs) out.push(".."); }
    else out.push(seg);
  }
  const s = out.join("/");
  return abs ? "/" + s : (s || ".");
}

export function resolve(...segs) {
  let r = "";
  for (let i = segs.length - 1; i >= 0 && !r.startsWith("/"); i--) if (segs[i]) r = segs[i] + (r ? "/" + r : "");
  if (!r.startsWith("/")) r = host.cwd + (r ? "/" + r : "");
  return normalize(r);
}
export function join(...segs) { const j = segs.filter((s) => s !== "").join("/"); return j ? normalize(j) : "."; }
export function basename(p, ext) {
  let b = p.replace(/\/+$/, "").split("/").pop() || "";
  if (ext && b.endsWith(ext) && b !== ext) b = b.slice(0, -ext.length);
  return b;
}
export function dirname(p) { const n = normalize(p); const i = n.lastIndexOf("/"); return i <= 0 ? (n.startsWith("/") ? "/" : ".") : n.slice(0, i); }

// ---- fs ----

const ERRNO = { ENOENT: [-2, "no such file or directory"], EISDIR: [-21, "illegal operation on a directory"], EEXIST: [-17, "file already exists"], ENOTDIR: [-20, "not a directory"] };

function fsError(code, syscall, p, frames) {
  const [errno, text] = ERRNO[code];
  const err = new Error(`${code}: ${text}, ${syscall} '${p}'`);
  err.errno = errno; err.code = code; err.syscall = syscall; err.path = p;
  // Node's frames name its own files; a browser has none, so these stand in for them.
  err.stack = `Error: ${err.message}\n` + frames.map((f) => `    at ${f}`).join("\n");
  return err;
}

export function readFileSync(p /* , encoding */) {
  const abs = resolve(String(p));
  if (host.files.has(abs)) return host.files.get(abs);
  if (host.dirs.has(abs)) {
    const err = new Error("EISDIR: illegal operation on a directory, read");
    err.errno = -21; err.code = "EISDIR"; err.syscall = "read";
    err.stack = `Error: ${err.message}\n    at Object.readSync (node:fs:741:3)\n    at tryReadSync (node:fs:442:20)\n    at Object.readFileSync (node:fs:488:19)`;
    throw err;
  }
  throw fsError("ENOENT", "open", abs, ["Object.openSync (node:fs:573:18)", "Object.readFileSync (node:fs:452:35)"]);
}

export function writeFileSync(p, data /* , encoding */) {
  const abs = resolve(String(p));
  const frames = ["Object.openSync (node:fs:573:18)", "Object.writeFileSync (node:fs:2409:20)"];
  if (host.dirs.has(abs)) throw fsError("EISDIR", "open", abs, frames);
  const parent = dirname(abs);
  if (!host.dirs.has(parent)) {
    throw fsError(host.files.has(parent) ? "ENOTDIR" : "ENOENT", "open", abs, frames);
  }
  host.files.set(abs, String(data));
  host.writes.set(abs, String(data));
}

export function mkdirSync(p, opts) {
  const abs = resolve(String(p));
  if (host.files.has(abs)) throw fsError("EEXIST", "mkdir", abs, ["Object.mkdirSync (node:fs:1349:3)"]);
  const recursive = !!(opts && opts.recursive);
  const parts = abs.split("/").filter(Boolean);
  let cur = "";
  for (let i = 0; i < parts.length; i++) {
    cur += "/" + parts[i];
    if (host.dirs.has(cur)) continue;
    if (!recursive && i < parts.length - 1) throw fsError("ENOENT", "mkdir", abs, ["Object.mkdirSync (node:fs:1349:3)"]);
    if (host.files.has(cur)) throw fsError("ENOTDIR", "mkdir", abs, ["Object.mkdirSync (node:fs:1349:3)"]);
    host.dirs.add(cur); host.newDirs.add(cur);
  }
}

// ---- process and console ----

const emit = (stream, text) => host.chunks.push([stream, text]);
const show = (args) => args.map((a) => (typeof a === "string" ? a : a && a.stack ? a.stack : String(a))).join(" ");

export const process = {
  argv: [],
  stdout: { write: (s) => { emit("stdout", String(s)); return true; } },
  stderr: { write: (s) => { emit("stderr", String(s)); return true; } },
  exit: (code) => { throw new ExitSignal(code === undefined ? 0 : code); },
  cwd: () => host.cwd,
};

export const console = {
  log: (...a) => emit("stdout", show(a) + "\n"),
  info: (...a) => emit("stdout", show(a) + "\n"),
  warn: (...a) => emit("stderr", show(a) + "\n"),
  error: (...a) => emit("stderr", show(a) + "\n"),
};
