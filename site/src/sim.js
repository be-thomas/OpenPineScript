// Runs the real `openpinescript` CLI (mock_run/v2/cli_main.ts) against a
// virtual file system and returns what it printed and wrote. Nothing here
// re-implements the CLI: parsing, compiling, the backtest loop, the CSV and
// JSON writers, the comparison engine and every message are its own code.
// See shims.js for what stands in for Node.

import { main, onFatal } from "../../mock_run/v2/cli_main.ts";
import { host, ExitSignal } from "./shims.js";

/**
 * A browser's stack frames name the worker bundle and its minified offsets. Keep the
 * function names (the CLI bundle is built with keepNames) and point every frame that
 * is not Node's own at dist/cli.mjs, where the real CLI's frames would be.
 */
function tidyStack(e) {
  if (!e || typeof e.stack !== "string" || e.syscall) return;   // shims.js builds its own stacks for fs errors
  const file = `file://${host.cwd}/dist/cli.mjs`;
  let lines = e.stack.split("\n");
  const top = lines.findIndex((l) => /^\s+at main \(/.test(l));   // below `main` are this worker's own frames
  if (top !== -1) lines = lines.slice(0, top + 1);
  e.stack = lines.map((line) => {
    const named = /^(\s+at )(.+?) \((.*)\)$/.exec(line), bare = /^(\s+at )(\S+:\d+:\d+)$/.exec(line);
    const loc = named ? named[3] : bare ? bare[2] : null;
    if (loc === null || loc.startsWith("node:") || loc.startsWith("<anonymous>")) return line;
    return named ? `${named[1]}${named[2]} (${file})` : `${bare[1]}${file}`;
  }).join("\n");
}

/**
 * @param {object} req
 * @param {string[]} req.args   what follows `openpinescript` on the command line
 * @param {string}   req.cwd    absolute working directory
 * @param {Object<string,string>} req.files  absolute path -> text
 * @param {string[]} req.dirs   every directory, ancestors included
 * @returns {Promise<{code:number, chunks:Array<[string,string]>, writes:Object<string,string>, dirs:string[]}>}
 */
export async function runCli({ args, cwd, files, dirs }) {
  host.files = new Map(Object.entries(files));
  host.dirs = new Set(["/", ...dirs]);
  host.cwd = cwd;
  host.chunks = [];
  host.writes = new Map();
  host.newDirs = new Set();

  let code = 0;
  try {
    await main(["node", "cli.mjs", ...args]);
  } catch (e) {
    try {
      if (e instanceof ExitSignal) code = e.code;
      else { tidyStack(e); onFatal(e); }
    } catch (e2) {
      if (e2 instanceof ExitSignal) code = e2.code; else throw e2;
    }
  }
  return { code, chunks: host.chunks, writes: Object.fromEntries(host.writes), dirs: [...host.newDirs] };
}
