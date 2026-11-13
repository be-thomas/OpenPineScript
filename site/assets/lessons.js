// The five lessons: prose, the commands to try, and an automatic checker per
// exercise. They teach the `openpinescript` command line tool; the Pine scripts
// are supplied (site/examples/*.pine) and nothing here asks the learner to write one.
//
// A checker never matches command text. It reads what the learner's commands DID:
// the parsed flags (`run.parsed`), the exit code, what was printed and which files
// were written (see Shell in shell.js). So `--out-dir results`, `--out-dir ./results/`
// and a different order of flags all pass, and a wrong input value does not.
//
// `commands` is every command the lesson tells the learner to try, in order, and
// `solution` is what "Show me" types. site/test/fidelity.mjs runs `commands` through
// the real CLI and through the in-browser emulator and demands identical output.
//
// Write for a complete beginner: a title of 2-4 plain words, at most two short sentences,
// one command, one sentence about what happened. Each checker shows ONE plain line; it may
// test several things inside.
//
// This file has no DOM dependency: the test harness imports it from Node.

const A = "mock_data/common/AAPL_mock.csv";
const base = (p) => (p || "").replace(/\/+$/, "").split("/").pop();
const json = (s) => { try { return JSON.parse(s); } catch { return null; } };
const csvHeader = (text) => (text || "").split("\n", 1)[0].split(",");

const opsRuns = (sh) => sh.runs.filter((r) => r.kind === "ops");
/** Runs of one script, whatever directory it was named from. */
const runsOf = (sh, script) => opsRuns(sh).filter((r) => base(r.parsed.script) === script);
const last = (list) => list[list.length - 1];
const writesNamed = (run, name) => Object.entries(run.writes).filter(([p]) => base(p) === name).map(([, t]) => t);

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
/** A command to try: the page adds a "Type it" button to every `pre[data-try]`. */
const cmd = (line) => `<div class="cmd"><pre data-try>${esc(line)}</pre></div>`;

export const LESSONS = [
  {
    id: "run",
    title: "Run a script",
    kicker: "Lesson 1 of 5",
    intro: `
      <p>Press <strong>Type it</strong>, then press Enter. Watch the screen.</p>
      ${cmd(`openpinescript examples/rsi.pine --data ${A}`)}
      <p>It read the script, ran it on the price history, and printed a result.</p>`,
    task: "Run the script.",
    commands: [`openpinescript examples/rsi.pine --data ${A}`],
    solution: [`openpinescript examples/rsi.pine --data ${A}`],
    hints: [`Type: <code>openpinescript examples/rsi.pine --data ${A}</code>`],
    check(sh) {
      const run = last(runsOf(sh, "rsi.pine").filter((r) => base(r.parsed.data) === "AAPL_mock.csv"));
      const doc = run && json(run.stdout);
      return [{ label: "You ran the script", ok: !!run && run.code === 0 && !!doc && doc.bars_processed === 506 }];
    },
  },

  {
    id: "chart",
    title: "See it on a chart",
    kicker: "Lesson 2 of 5",
    intro: `
      <p>This saves the result in a file. Click the file in Files to draw it on the chart.</p>
      ${cmd(`openpinescript examples/rsi.pine --data ${A} --out-chart results/rsi.csv`)}
      <p>See the line on the chart? That's the RSI.</p>`,
    task: "Save the RSI in a file.",
    commands: [`openpinescript examples/rsi.pine --data ${A} --out-chart results/rsi.csv`],
    solution: [`openpinescript examples/rsi.pine --data ${A} --out-chart results/rsi.csv`],
    hints: [`Type: <code>openpinescript examples/rsi.pine --data ${A} --out-chart results/rsi.csv</code>`],
    check(sh) {
      const run = last(runsOf(sh, "rsi.pine").filter((r) => r.parsed.outChart && r.code === 0));
      const files = sh.filesUnder("results").filter((p) => p.endsWith(".csv"));
      const chart = files.find((p) => csvHeader(sh.readRel(p)).slice(0, 6).join(",") === "time,open,high,low,close,volume");
      return [{ label: "You saved the RSI file", ok: !!run && !!chart && csvHeader(sh.readRel(chart)).includes("RSI 14") }];
    },
  },

  {
    id: "strategy",
    title: "Test a strategy",
    kicker: "Lesson 3 of 5",
    intro: `
      <p>This script buys and sells by a simple rule. Run it, then look at the chart.</p>
      ${cmd(`openpinescript examples/sma_cross.pine --data ${A} --out-dir results/strategy`)}
      <p>Triangles are buys, crosses are sells, and summary.json shows the profit.</p>`,
    task: "Run the strategy.",
    commands: [`openpinescript examples/sma_cross.pine --data ${A} --out-dir results/strategy`],
    solution: [`openpinescript examples/sma_cross.pine --data ${A} --out-dir results/strategy`],
    hints: [`Type: <code>openpinescript examples/sma_cross.pine --data ${A} --out-dir results/strategy</code>`],
    check(sh) {
      const run = last(runsOf(sh, "sma_cross.pine").filter((r) => r.parsed.outDir && r.code === 0));
      const names = run ? Object.keys(run.writes).map(base) : [];
      const trades = run ? writesNamed(run, "trades.csv")[0] : null;
      const summary = run ? json(writesNamed(run, "summary.json")[0]) : null;
      const count = trades ? new Set(trades.split("\n").slice(1).filter(Boolean).map((l) => l.split(",")[0])).size : -1;
      const ok = ["chart.csv", "trades.csv", "summary.json"].every((n) => names.includes(n)) && !!summary && summary.total_closed_trades === count && count === 10;
      return [{ label: "You ran the strategy", ok }];
    },
  },

  {
    id: "inputs",
    title: "Change a number",
    kicker: "Lesson 4 of 5",
    intro: `
      <p>The script has settings. This changes two of them without editing the script.</p>
      ${cmd(`openpinescript examples/sma_cross.pine --data ${A} --input input_0=5 --input input_1=30 --out-dir results/fast`)}
      <p>Now the chart shows different buys and sells.</p>`,
    task: "Run it with the new numbers.",
    commands: [`openpinescript examples/sma_cross.pine --data ${A} --input input_0=5 --input input_1=30 --out-dir results/fast`],
    solution: [`openpinescript examples/sma_cross.pine --data ${A} --input input_0=5 --input input_1=30 --out-dir results/fast`],
    hints: [`Type: <code>openpinescript examples/sma_cross.pine --data ${A} --input input_0=5 --input input_1=30 --out-dir results/fast</code>`],
    check(sh) {
      const over = last(runsOf(sh, "sma_cross.pine").filter((r) => r.code === 0 && r.parsed.inputs.input_0 === "5" && r.parsed.inputs.input_1 === "30"));
      const sums = over ? Object.entries(over.writes).filter(([p]) => p.endsWith(".json")).map(([, t]) => json(t)).filter((j) => j && "total_closed_trades" in j) : [];
      return [{ label: "You changed the numbers and ran it", ok: sums.some((j) => j.total_closed_trades === 12) }];
    },
  },

  {
    id: "errors",
    title: "When it goes wrong",
    kicker: "Lesson 5 of 5",
    intro: `
      <p>This script has a mistake on purpose. Run it and read the message.</p>
      ${cmd(`openpinescript examples/broken.pine --data ${A}`)}
      <p>The message tells you which line to fix.</p>`,
    task: "Run the broken script.",
    after: `
      <details class="install o-after">
        <summary>Want it on your own computer?</summary>
        <p>You need Node.js 20 or newer. Then, with your own script and a CSV of candles:</p>
        <div class="cmd"><pre data-copy>npx openpinescript my_script.pine --data candles.csv</pre></div>
        <p>To use the engine from JavaScript, run <code>npm install openpinescript</code>. The <a href="cli.md">CLI guide</a> has everything else.</p>
      </details>`,
    commands: [`openpinescript examples/broken.pine --data ${A}`],
    solution: [`openpinescript examples/broken.pine --data ${A}`],
    hints: [`Type: <code>openpinescript examples/broken.pine --data ${A}</code>`],
    check(sh) {
      const fails = opsRuns(sh).filter((r) => r.code === 1);
      return [{ label: "You ran the broken script", ok: fails.some((r) => base(r.parsed.script) === "broken.pine" && /\[Line \d+:\d+\]/.test(r.stderr)) }];
    },
  },
];

export { A as DATA_PATH };
