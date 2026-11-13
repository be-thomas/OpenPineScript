// The real `openpinescript` CLI as a Web Worker. Bundled by site/build.mjs into
// assets/engine.js (the engine and antlr4ng included, the CLI's fs/path/process/
// console swapped for browser stand-ins; see site/src/shims.js).
//
//   -> { type: "cli", id, args, cwd, files, dirs }   run one command
//   <- { type: "ready" }                             the engine has loaded
//   <- { type: "result", id, code, chunks, writes, dirs }

import { runCli } from "./sim.js";

self.onmessage = async (event) => {
  const msg = event.data;
  if (msg.type !== "cli") return;
  try {
    const res = await runCli(msg);
    self.postMessage({ type: "result", id: msg.id, ...res });
  } catch (e) {
    self.postMessage({
      type: "result", id: msg.id, code: 1, writes: {}, dirs: [],
      chunks: [["stderr", `Critical error: ${(e && e.stack) || e}\n`]],
    });
  }
};
self.postMessage({ type: "ready" });
