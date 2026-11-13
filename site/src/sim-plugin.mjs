// esbuild plugin that lets the real CLI (mock_run/v2/cli_main.ts) run in a
// browser or worker: its `node:fs` and `node:path` imports, and the globals
// `process` and `console`, are swapped for site/src/shims.js in the two files
// that use them. Shared by site/build.mjs and site/test/fidelity.mjs so the
// thing under test is the thing that ships.
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const SRC = path.dirname(fileURLToPath(import.meta.url));
const SHIMS = path.join(SRC, "shims.js");

export const simPlugin = {
  name: "ops-sim-shims",
  setup(build) {
    build.onResolve({ filter: /^node:(fs|path)$/ }, () => ({ path: SHIMS }));
    build.onLoad({ filter: /(cli_main|comparison_engine)\.ts$/ }, async (args) => ({
      contents: `import { process, console } from ${JSON.stringify(SHIMS)};\n` + (await fs.promises.readFile(args.path, "utf8")),
      loader: "ts",
    }));
  },
};
