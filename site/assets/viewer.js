// The Files panel: a list of the practice file system, and a viewer that shows
// each kind of file the CLI writes in the way that suits it.
//
//   chart.csv            a table (plot columns tinted), the chart shows the lines
//   trades.csv           a table with entry/exit rows, the chart shows the markers
//   summary.json         the numbers as tiles, then the JSON
//   comparison_report    PASS / FAIL / PARTIAL badges, then the JSON with those words coloured
//   *.pine, anything     plain text with line numbers

import { HOME, relPath } from "./shell.js";
import { classify, parseCsv } from "./outputs.js";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const MAX_ROWS = 600;
// Folders that exist on disk for the commands but are not for the learner to browse.
const HIDDEN = /^(mock_data|tv_exports)/;

const KIND_LABEL = { chart: "chart", trades: "trades", summary: "summary", report: "report", pine: "pine", csv: "csv", json: "json", text: "text" };

export class FilesPanel {
  /**
   * @param {HTMLElement} root
   * @param {object} o
   * @param {(path: string, kind: string, text: string) => void} o.onOpen  a file was opened (the page updates the chart)
   * @param {(line: string, kind: string) => void} [o.onRowClick]  a table row with a time was clicked: (ISO time)
   */
  constructor(root, { onOpen, onRowClick }) {
    this.onOpen = onOpen; this.onRowClick = onRowClick || (() => {});
    root.innerHTML = `<div class="files"><div class="filelist" id="filelist" role="listbox" aria-label="Files"></div><div class="fileview" id="fileview" aria-live="polite"><p class="empty">Files you make show up here. Click one to open it.</p></div></div>`;
    this.list = root.querySelector("#filelist");
    this.view = root.querySelector("#fileview");
    this.current = null;
    this.vfs = null; this.baseline = new Set(); this.cwd = HOME;
    this.list.addEventListener("click", (e) => { const b = e.target.closest("button[data-path]"); if (b) this.open(b.dataset.path); });
  }

  /** Rebuild the list. Files not in `baseline` are the learner's and get a badge. */
  refresh(vfs, baseline, cwd = HOME) {
    this.vfs = vfs; this.baseline = baseline; this.cwd = cwd;
    const paths = vfs.paths(cwd).filter((p) => !HIDDEN.test(p));
    const groups = new Map();
    for (const p of paths) {
      const d = p.includes("/") ? p.slice(0, p.lastIndexOf("/")) : ".";
      (groups.get(d) || groups.set(d, []).get(d)).push(p);
    }
    const order = [...groups.keys()].sort((a, b) => (baseline.has(groups.get(a)[0]) === baseline.has(groups.get(b)[0]) ? a.localeCompare(b) : baseline.has(groups.get(a)[0]) ? 1 : -1));
    this.list.innerHTML = order.map((d) => `<div class="fgroup"><div class="fdir">${esc(d === "." ? "./" : d + "/")}</div>${groups.get(d).map((p) => {
      const isNew = !baseline.has(p);
      return `<button type="button" role="option" class="fitem${isNew ? " new" : ""}${p === this.current ? " sel" : ""}" data-path="${esc(p)}" aria-selected="${p === this.current}"><span class="fname">${esc(p.split("/").pop())}</span>${isNew ? '<span class="badge-new">new</span>' : ""}</button>`;
    }).join("")}</div>`).join("");
    if (this.current && !paths.includes(this.current)) { this.current = null; this.view.innerHTML = '<p class="empty">Pick a file to open it.</p>'; }
  }

  open(rel) {
    const abs = rel.startsWith("/") ? rel : `${this.cwd}/${rel}`;
    const text = this.vfs.read(abs);
    if (text === null) return;
    const path = relPath(abs, this.cwd);
    this.current = path;
    for (const b of this.list.querySelectorAll(".fitem")) { const on = b.dataset.path === path; b.classList.toggle("sel", on); b.setAttribute("aria-selected", String(on)); }
    const kind = classify(path, text);
    this.view.innerHTML = `<div class="fhead"><code>${esc(path)}</code><span class="kind">${KIND_LABEL[kind]}</span><span class="grow"></span><span class="fsize">${text.length.toLocaleString("en-US")} bytes</span></div>${this.render(kind, text)}`;
    this.view.querySelector(".data-table")?.addEventListener("click", (e) => {
      const tr = e.target.closest("tr[data-time]");
      if (tr) { for (const o of this.view.querySelectorAll("tr.sel")) o.classList.remove("sel"); tr.classList.add("sel"); this.onRowClick(tr.dataset.time); }
    });
    this.onOpen(path, kind, text);
  }

  render(kind, text) {
    switch (kind) {
      case "chart": case "trades": case "csv": return this.table(kind, text);
      case "summary": return this.summary(text);
      case "report": return this.report(text);
      default: return this.plain(text);
    }
  }

  table(kind, text) {
    const { header, rows } = parseCsv(text);
    const shown = rows.slice(0, MAX_ROWS);
    const typeCol = header.indexOf("Type"), profitCol = header.indexOf("Profit");
    const head = `<tr>${header.map((h, i) => `<th class="${kind === "chart" && i >= 6 ? "plot" : ""}">${esc(h)}</th>`).join("")}</tr>`;
    const body = shown.map((r) => {
      let cls = "";
      if (kind === "trades") cls = (/^Entry/.test(r[typeCol]) ? "entry" : "exit " + (+r[profitCol] >= 0 ? "win" : "loss"));
      const time = /^\d{4}-\d{2}-\d{2}/.test(r[0]) || (kind === "trades" && /^\d{4}-/.test(r[3] || "")) ? (kind === "trades" ? r[3] : r[0]) : "";
      return `<tr class="${cls}"${time ? ` data-time="${esc(time)}"` : ""}>${r.map((c, i) => `<td class="${c === "" ? "nil" : ""}${kind === "chart" && i >= 6 ? " plot" : ""}">${esc(c)}</td>`).join("")}</tr>`;
    }).join("");
    const note = rows.length > shown.length ? `<p class="fnote">Showing the first ${MAX_ROWS} of ${rows.length.toLocaleString("en-US")} rows.</p>` : `<p class="fnote">${rows.length.toLocaleString("en-US")} rows${kind === "chart" ? ". Empty cells are blank in the file: the indicator had no value yet." : ""}${kind === "chart" || kind === "trades" ? " Click a row to jump the chart to it." : ""}</p>`;
    return `<div class="table-wrap"><table class="data-table" aria-label="${esc(kind)} data"><thead>${head}</thead><tbody>${body}</tbody></table></div>${note}`;
  }

  summary(text) {
    let j; try { j = JSON.parse(text); } catch { return this.plain(text); }
    const money = (v) => (v >= 0 ? "+" : "-") + "$" + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const tiles = [
      ["Net profit", money(j.net_profit), j.net_profit >= 0 ? "pos" : "neg"],
      ["Net profit %", j.net_profit_percent + "%", j.net_profit >= 0 ? "pos" : "neg"],
      ["Closed trades", j.total_closed_trades, ""],
      ["Win rate", j.win_rate + "%", ""],
      ["Profit factor", j.profit_factor === null ? "null" : j.profit_factor, ""],
      ["Max drawdown", j.max_drawdown_percent + "%", j.max_drawdown_percent > 0 ? "neg" : ""],
    ];
    return `<div class="stats">${tiles.map(([k, v, c]) => `<div class="stat ${c}"><b>${esc(v)}</b><span>${esc(k)}</span></div>`).join("")}</div>${this.json(text)}`;
  }

  report(text) {
    let j; try { j = JSON.parse(text); } catch { return this.plain(text); }
    const badge = (label, status) => status ? `<span class="pill ${esc(status)}"><span>${esc(label)}</span><b>${esc(String(status).toUpperCase())}</b></span>` : "";
    return `<div class="pills">${badge("Overall", j.overall_match)}${badge("Chart data", j.chart_data && j.chart_data.status)}${badge("Trades", j.trades && j.trades.status)}${badge("Summary", j.summary && j.summary.status)}<span class="pill tol"><span>Tolerance</span><b>${esc(j.tolerance_used)}</b></span></div>${this.json(text)}`;
  }

  /** JSON text with keys dimmed and pass / fail / partial / skip coloured. */
  json(text) {
    let pretty = text;
    try { pretty = JSON.stringify(JSON.parse(text), null, 2); } catch { /* show as is */ }
    const html = esc(pretty).split("\n").map((l) => l
      .replace(/^(\s*)(&quot;|")([^"]+)(&quot;|")(:)/, '$1<span class="jk">"$3"</span>$5')
      .replace(/("(?:pass|fail|partial|skip)")/, (m) => `<span class="js ${m.slice(1, -1)}">${m}</span>`)).join("\n");
    return `<pre class="json">${html}</pre>`;
  }

  plain(text) {
    const lines = text.split("\n");
    return `<pre class="plain">${lines.map((l, i) => `<span class="ln">${i + 1}</span>${esc(l)}`).join("\n")}</pre>`;
  }
}
