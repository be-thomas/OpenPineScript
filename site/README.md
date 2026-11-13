# OpenPineScript docs site

Static site, no framework: a 3D gate page ("Who's reading?"), a human page, an AI-agent page, and an interactive tutorial that runs the engine in a Web Worker.

| File | Purpose |
|---|---|
| `index.html` | Gate: Human or AI agent (remembered in localStorage) |
| `human.html` | Zeal Terminal (GUI) or the CLI tutorial |
| `ai.html`, `cli.md`, `llms.txt` | CLI guide for AI agents; `cli.md` is the single source, `ai.html` renders it |
| `learn.html` | Five short lessons on using the `openpinescript` CLI, in a practice terminal, with automatic exercise checkers |
| `examples/` | The .pine files `cli.md` and the tutorial run (`rsi`, `sma_cross`, `broken`, `no_version`) |
| `src/worker.js`, `src/sim.js`, `src/shims.js`, `src/sim-plugin.mjs`, `build.mjs` | The real CLI as a Web Worker: its `fs`, `path`, `process` and `console` are swapped for browser stand-ins; and the build |
| `assets/shell.js`, `seed.js`, `terminal.js`, `viewer.js`, `outputs.js` | The practice terminal: shell helpers, the starting files, the screen, the Files panel, chart models from CSV |
| `test/fidelity.mjs` | Runs every lesson command through the real CLI and the emulator and demands identical output |

## Build

From the repository root (needs `npm install` first):

    node site/build.mjs

This writes `site/assets/engine.js` (the CLI, the engine and antlr4ng, minified, about 1 MB / 226 kB gzipped) and `site/data/AAPL.csv` (copied from `mock_data/common/AAPL_mock.csv`). Both are git-ignored. Add `--base-url https://OWNER.github.io/REPO/` to make the og:image absolute (the workflow does).

## Preview

    python3 -m http.server -d site 8000     # or: npx serve site

Open http://localhost:8000. The tutorial will not work from `file://` (Workers and fetch).

## Deploy

`.github/workflows/pages.yml` builds and deploys `site/` with `actions/deploy-pages`. It runs on every push to `main` and on `workflow_dispatch`. Set Settings > Pages > Source to "GitHub Actions" once. It deploys to https://be-thomas.github.io/OpenPineScript/ from the public repo.

## Linking from the repo

The root `README.md` links to the live docs near the top.

## Notes

- `cli.md` documents the npm package `openpinescript` (`npx openpinescript ...`); keep its commands in step with `mock_run/v2/run.ts`. Its examples download `examples/*.pine` and `data/AAPL.csv` from the live site, so the site must serve them.
- The tutorial teaches the CLI, not Pine: the scripts are supplied. The practice terminal runs `mock_run/v2/cli_main.ts` (the body of `run.ts`) unmodified, so it prints exactly what the real tool prints.
- Lesson checkers live in `assets/lessons.js`. They read what the learner's commands did (flags, exit code, files written), never the command text.
- Fidelity: `npm run build:dist && node site/test/fidelity.mjs` compares the emulator with `dist/cli.mjs` command by command (stdout, stderr, exit code, files written) and exercises every checker. Re-run it after touching `mock_run/` or `site/assets/shell.js`.
