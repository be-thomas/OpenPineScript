// The interactive tutorial for the openpinescript command line tool.
//
// A practice terminal runs the real CLI code in a Web Worker against a small
// virtual file system. Files the commands write show up in the Files panel
// (tables, summary, report) and on the chart. Each lesson ends with an exercise
// whose checker reads what the learner's commands did (lessons.js).

import { LESSONS, DATA_PATH } from "./lessons.js";
import { Shell, Vfs, HOME } from "./shell.js";
import { seedVfs, EXAMPLES } from "./seed.js";
import { Terminal } from "./terminal.js";
import { FilesPanel } from "./viewer.js";
import { Chart } from "./chart.js";
import { barsFromInput, chartModel, tradesFrom } from "./outputs.js";
import { store, toast, copyText, remember } from "./shared.js";

remember("human");

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const DONE_KEY = "ops-cli-done";

const state = {
  index: 0,
  bars: [],               // the bundled AAPL candles
  base: null,             // Vfs: the starting files
  worker: null,
  ready: false,
  seq: 0,
  pending: new Map(),
  done: new Set(JSON.parse(store.get(DONE_KEY) || "[]")),
  hintStep: 0,
  // per lesson
  shell: null, term: null, files: null, chart: null, baseline: new Set(),
  graph: { chart: null, trades: null },
};

// ---------------------------------------------------------------- engine (the CLI in a worker)

function setStatus(kind, text) {
  const el = $("#engine-status");
  el.className = "engine-status " + kind;
  $("span", el).textContent = text;
}

function startWorker() {
  if (state.worker) state.worker.terminate();
  state.ready = false;
  return new Promise((resolve, reject) => {
    const w = new Worker("assets/engine.js");
    state.worker = w;
    w.onmessage = (ev) => {
      const m = ev.data;
      if (m.type === "ready") { state.ready = true; resolve(); }
      else if (m.type === "result") {
        const p = state.pending.get(m.id);
        if (p) { clearTimeout(p.timer); state.pending.delete(m.id); p.resolve(m); }
      }
    };
    w.onerror = (e) => { setStatus("fail", "Something went wrong loading the engine"); console.error("engine worker error", e.message); reject(e); };
  });
}

/** Run `openpinescript <args>` in the worker. Same shape as sim.js's runCli. */
function engine(req) {
  return new Promise((resolve) => {
    const id = ++state.seq;
    const timer = setTimeout(() => {
      // A run that never ends must not hold the tab: kill the worker and start a fresh one.
      state.pending.delete(id);
      startWorker();
      resolve({ code: 1, chunks: [["stderr", "The command ran for more than 20 seconds and was stopped.\n"]], writes: {}, dirs: [] });
    }, 20000);
    state.pending.set(id, { resolve, timer });
    state.worker.postMessage({ type: "cli", id, ...req });
  });
}

// ---------------------------------------------------------------- lesson view

function renderNav() {
  const nav = $("#lesson-nav");
  nav.innerHTML = LESSONS.map((L, i) =>
    `<button type="button" data-i="${i}" class="${state.done.has(L.id) ? "done" : ""}" aria-current="${i === state.index}"><span class="num">${state.done.has(L.id) ? "✔" : i + 1}</span><span class="t">${esc(L.title)}</span></button>`).join("");
  const sel = $("#lesson-select");
  sel.innerHTML = LESSONS.map((L, i) => `<option value="${i}" ${i === state.index ? "selected" : ""}>${state.done.has(L.id) ? "✔ " : ""}${i + 1}. ${esc(L.title)}</option>`).join("");
  const n = LESSONS.filter((L) => state.done.has(L.id)).length;
  $("#progress-text").textContent = `Lesson ${state.index + 1} of ${LESSONS.length}`;
  const bar = $("#progress-bar");
  bar.setAttribute("aria-valuenow", n);
  bar.setAttribute("aria-valuemax", LESSONS.length);
  $("i", bar).style.width = (n / LESSONS.length) * 100 + "%";
}

function renderLesson(i, { focus = false } = {}) {
  state.index = i;
  state.hintStep = 0;
  const L = LESSONS[i];
  history.replaceState(null, "", "#" + (i + 1));
  store.set("ops-lesson", String(i));
  renderNav();

  $("#lesson").innerHTML = `
    <div class="lesson">
      <div class="col">
        <section class="panel lesson-intro o-intro" aria-labelledby="lt">
          <div class="body">
            <div class="kicker">${esc(L.kicker)}</div>
            <h2 id="lt">${esc(L.title)}</h2>
            ${L.intro}
          </div>
        </section>

        <section class="panel task o-task" id="task" aria-label="Exercise">
          <header><span id="task-title">Exercise</span></header>
          <div class="body">
            <p class="goal">${L.task}</p>
            <ul class="checks" id="checks"></ul>
            <div class="actions" style="margin-top:12px">
              <button class="btn small" type="button" id="hint">Hint</button>
              <button class="btn small" type="button" id="solution">Show me</button>
              <button class="btn small primary" type="button" id="next" hidden>Next lesson →</button>
            </div>
            <div class="hint-box" id="hint-box" hidden></div>
          </div>
        </section>

        ${L.after || ""}

        <div class="lesson-pager o-pager">
          <button class="btn small" type="button" id="prev" ${i === 0 ? "disabled" : ""}>← Previous</button>
          <button class="btn small" type="button" id="skip" ${i === LESSONS.length - 1 ? "disabled" : ""}>Skip →</button>
        </div>
      </div>

      <div class="col" id="outcol">
        <section class="panel o-term" aria-label="Practice terminal">
          <header>
            <span>Terminal</span><span class="grow"></span>
            <button class="btn small" type="button" id="reset" title="Start this lesson's files and terminal over">Reset</button>
          </header>
          <div id="term-host"></div>
        </section>

        <section class="panel o-files" aria-label="Files">
          <header><span>Files</span><span class="grow"></span></header>
          <div id="files-host"></div>
        </section>

        <section class="panel o-chart" aria-label="Chart">
          <header>
            <span>Chart</span><span class="grow"></span>
            <span class="chart-tools">
              <button class="btn small" type="button" id="z-in" aria-label="Zoom in">+</button>
              <button class="btn small" type="button" id="z-out" aria-label="Zoom out">−</button>
              <button class="btn small" type="button" id="z-all">All</button>
              <button class="btn small" type="button" id="z-last">Latest</button>
            </span>
          </header>
          <div class="chart-wrap"><canvas id="chart" tabindex="0" role="img" aria-label="Candlestick chart"></canvas></div>
          <div class="legend" id="legend"></div>
          <div class="readout" id="readout" aria-live="off"></div>
        </section>
      </div>
    </div>`;

  startPractice(L);
  wireLesson(L);
  if (focus) $("#lt").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
}

/** A fresh file system, shell and terminal for the lesson. */
function startPractice(L) {
  const vfs = state.base.clone();
  state.baseline = new Set(vfs.paths(HOME));
  state.shell = new Shell({ vfs, engine });
  // arrow-up history survives from lesson to lesson
  state.shell.history = state.history || (state.history = []);
  state.graph = { chart: null, trades: null };

  state.term = new Terminal($("#term-host"), { shell: state.shell, onRun: (records) => afterRun(L, records) });
  state.term.notice("Type here, or press Type it.");
  state.files = new FilesPanel($("#files-host"), {
    onOpen: (path, kind, text) => showOnChart(path, kind, text),
    onRowClick: (iso) => state.chart.centerOn(iso),
  });
  state.files.refresh(vfs, state.baseline);
  state.chart = new Chart($("#chart"), $("#readout"));
  state.chart.setData(state.bars, null, { animate: false });
  renderLegend(null);
  renderChecks(L, L.check(state.shell), false, false);
  window.__opsLesson = { shell: state.shell, term: state.term };   // for the end-to-end test
}

function wireLesson(L) {
  $("#reset").addEventListener("click", () => { startPractice(L); $("#next").hidden = true; toast("Lesson reset"); });
  $("#hint").addEventListener("click", () => {
    const box = $("#hint-box");
    const step = Math.min(state.hintStep, L.hints.length - 1);
    box.hidden = false;
    box.innerHTML = L.hints.length > 1 ? `<strong>Hint ${step + 1} of ${L.hints.length}</strong><br>${L.hints[step]}` : L.hints[step];
    state.hintStep = Math.min(state.hintStep + 1, L.hints.length);
    if (L.hints.length > 1) $("#hint").textContent = state.hintStep >= L.hints.length ? "Hint (last one shown)" : "Another hint";
  });
  $("#solution").addEventListener("click", async () => {
    const box = $("#hint-box");
    box.hidden = false;
    box.innerHTML = `<strong>Show me</strong><br>Typing it for you. Watch the screen.`;
    $("#solution").disabled = true;
    for (const line of L.solution) await state.term.run(line);
    $("#solution").disabled = false;
    box.innerHTML = `<strong>Here is what was typed</strong>${L.solution.map((s) => `<pre class="terminal" style="margin-top:8px">${esc(s)}</pre>`).join("")}`;
  });
  $("#next").addEventListener("click", () => go(state.index + 1, true));
  $("#prev").addEventListener("click", () => go(state.index - 1, true));
  $("#skip").addEventListener("click", () => go(state.index + 1, true));

  $("#z-in").addEventListener("click", () => state.chart.zoom(1 / 1.3));
  $("#z-out").addEventListener("click", () => state.chart.zoom(1.3));
  $("#z-all").addEventListener("click", () => state.chart.showAll());
  $("#z-last").addEventListener("click", () => state.chart.showLatest());

  // command snippets in the lesson text
  for (const pre of document.querySelectorAll("pre[data-copy], pre[data-try]")) {
    const host = pre.parentElement;
    const copy = document.createElement("button");
    copy.className = "btn small"; copy.type = "button"; copy.textContent = "Copy"; copy.setAttribute("aria-label", "Copy this command");
    copy.addEventListener("click", async () => { toast((await copyText(pre.textContent)) ? "Copied" : "Copy failed"); });
    host.appendChild(copy);
    if (pre.hasAttribute("data-try")) {
      const type = document.createElement("button");
      type.className = "btn small primary"; type.type = "button"; type.textContent = "Type it"; type.setAttribute("aria-label", "Put this command in the terminal");
      type.addEventListener("click", () => { state.term.fill(pre.textContent); state.term.input.scrollIntoView({ block: "nearest", behavior: reduceMotion ? "auto" : "smooth" }); });
      host.appendChild(type);
    }
  }
}

function go(i, focus) {
  if (i < 0 || i >= LESSONS.length) return;
  renderLesson(i, { focus });
}

// ---------------------------------------------------------------- after each command

function afterRun(L, records) {
  state.files.refresh(state.shell.vfs, state.baseline);
  // open the most telling file this line wrote: trades (with its chart), else a chart, else the first file
  const written = records.flatMap((r) => Object.keys(r.writes || {})).map((p) => p.slice(HOME.length + 1));
  const pick = written.find((p) => p.endsWith("trades.csv")) || written.find((p) => p.endsWith(".csv")) || written[0];
  if (pick) state.files.open(pick);
  const results = L.check(state.shell);
  renderChecks(L, results, results.every((r) => r.ok), true);
}

/** Chart: candles, plus the lines of the opened chart file and the trades of the opened trades file. */
function showOnChart(path, kind, text) {
  const dir = path.includes("/") ? path.slice(0, path.lastIndexOf("/") + 1) : "";
  const vfs = state.shell.vfs;
  const sibling = (name) => vfs.read(`${HOME}/${dir}${name}`);
  if (kind === "chart") { state.graph = { chart: text, trades: sibling("trades.csv") }; }
  else if (kind === "trades") { state.graph = { chart: sibling("chart.csv"), trades: text }; }
  else return;
  if (!state.graph.chart) {   // trades without their chart.csv: markers on the plain candles
    const model = { series: [], trades: tradesFrom(state.graph.trades), position: null };
    state.chart.setData(state.bars, model, { animate: !reduceMotion });
    renderLegend(model);
    return;
  }
  const { bars, model } = chartModel(state.graph.chart, state.graph.trades);
  state.chart.setData(bars.length ? bars : state.bars, model, { animate: !reduceMotion });
  renderLegend(model);
}

function renderLegend(model) {
  const el = $("#legend");
  const items = [];
  if (model) {
    for (const s of model.series) if (!String(s.id).startsWith("hline")) items.push(`<span><i style="background:${esc(s.color)}"></i>${esc(s.title)}</span>`);
    if (model.trades.length) items.push(`<span><i style="background:var(--accent)"></i>buy · <i style="background:var(--up)"></i>sell at a profit · <i style="background:var(--down)"></i>sell at a loss</span>`);
  }
  el.innerHTML = items.length ? items.join("") : "<span>Apple's daily prices.</span>";
}

// ---------------------------------------------------------------- checking

function renderChecks(L, results, allOk, ran) {
  const ul = $("#checks");
  const task = $("#task");
  ul.innerHTML = results.map((r) => `<li class="${r.ok ? "ok" : ""}">${esc(r.label)}</li>`).join("");
  task.classList.toggle("done", allOk);
  $("#task-title").textContent = allOk ? "✔ Exercise complete" : "Exercise";
  $("#next").hidden = !allOk || state.index === LESSONS.length - 1;
  if (allOk && ran) {
    const first = !state.done.has(L.id);
    state.done.add(L.id);
    store.set(DONE_KEY, JSON.stringify([...state.done]));
    renderNav();
    celebrate(first);
    if (state.done.size === LESSONS.length) showFinish();
  }
}

function showFinish() {
  const box = $("#hint-box");
  box.hidden = false;
  box.style.borderLeftColor = "var(--accent-2)";
  box.innerHTML = `<div class="finish"><h3>All five lessons done.</h3><p>You ran a script, drew it on a chart, tested a strategy, changed a number and read an error. The <a href="cli.md">CLI guide</a> has the rest.</p><p><a class="btn primary" href="https://zealterminal.com" target="_blank" rel="noopener">Open Zeal Terminal ↗</a> <a class="btn" href="cli.md">CLI guide</a></p></div>`;
}

// ---------------------------------------------------------------- celebration

function celebrate(first) {
  toast(first ? "Exercise complete. Nice." : "Still passing.");
  if (reduceMotion || !first) return;
  const c = $("#confetti");
  const dpr = Math.min(devicePixelRatio || 1, 2);
  c.width = innerWidth * dpr; c.height = innerHeight * dpr;
  const ctx = c.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const colors = ["#22d3a6", "#8b6cff", "#ffb454", "#ff5c7a", "#6fb8ff"];
  const parts = Array.from({ length: 110 }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * 120, y: innerHeight * 0.55,
    vx: (Math.random() - 0.5) * 11, vy: -Math.random() * 12 - 4,
    r: Math.random() * 5 + 3, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
    c: colors[(Math.random() * colors.length) | 0],
  }));
  const t0 = performance.now();
  (function frame(now) {
    const t = now - t0;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.vy += 0.32; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.vx *= 0.99;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = Math.max(0, 1 - t / 1900);
      ctx.fillStyle = p.c; ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); ctx.restore();
    }
    if (t < 1900) requestAnimationFrame(frame); else ctx.clearRect(0, 0, innerWidth, innerHeight);
  })(t0);
}

// ---------------------------------------------------------------- boot

async function boot() {
  $("#lesson-nav").addEventListener("click", (e) => { const b = e.target.closest("button[data-i]"); if (b && state.base) go(+b.dataset.i, false); });
  $("#lesson-select").addEventListener("change", (e) => { if (state.base) go(+e.target.value, false); });
  window.addEventListener("hashchange", () => { const n = parseInt(location.hash.slice(1), 10); if (state.base && n >= 1 && n <= LESSONS.length && n - 1 !== state.index) go(n - 1, false); });
  window.addEventListener("themechange", () => { state.chart && state.chart.refreshColors(); });

  const fromHash = parseInt(location.hash.slice(1), 10);
  const saved = parseInt(store.get("ops-lesson") || "0", 10);
  const start = fromHash >= 1 && fromHash <= LESSONS.length ? fromHash - 1 : (saved >= 0 && saved < LESSONS.length ? saved : 0);
  renderNav();

  let aapl, examples = {};
  try {
    const get = async (url) => { const r = await fetch(url); if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`); return r.text(); };
    aapl = await get("data/AAPL.csv");
    await Promise.all(EXAMPLES.map(async (n) => { examples[n] = await get("examples/" + n); }));
  } catch (e) {
    setStatus("fail", "Could not load the sample files");
    $("#lesson").innerHTML = `<div class="panel"><div class="body"><h2>The tutorial needs to be served over http</h2><p>Browsers will not load data files or Web Workers from <code>file://</code>. From the repository root run <code>python3 -m http.server -d site</code> and open <code>http://localhost:8000/learn.html</code>. (${esc(e.message)})</p></div></div>`;
    return;
  }
  state.bars = barsFromInput(aapl);
  try { await startWorker(); } catch { setStatus("fail", "Web Workers are not available in this browser"); return; }

  setStatus("busy", "Getting ready…");
  state.base = seedVfs({ examples, aapl });
  setStatus("ready", "Ready");
  renderLesson(start);
  window.__opsState = state;   // for the end-to-end test
}

boot();
void DATA_PATH; void Vfs;
