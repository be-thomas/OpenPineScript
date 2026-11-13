// The practice terminal's screen: scrollback, a prompt that shows the last exit
// code, and an input line with history (up/down), tab completion and Ctrl+L.
// What commands do is in shell.js; this file only shows it.
//
// stdout is shown as printed, stderr dimmed. ANSI colours from the CLI become
// <span class="t-*"> so they keep their meaning (green tick, red error, cyan labels).

import { SHORT_HOME } from "./shell.js";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const SGR = { 0: null, 1: "t-bold", 31: "t-red", 32: "t-green", 33: "t-yellow", 36: "t-cyan", 90: "t-dim" };

/** ANSI-coloured text -> HTML. Unknown codes are dropped. */
export function ansiToHtml(text) {
  let html = "", open = [];
  const close = () => { html += "</span>".repeat(open.length); open = []; };
  let i = 0;
  const re = /\x1b\[([0-9;]*)m/g;
  let m;
  while ((m = re.exec(text))) {
    html += esc(text.slice(i, m.index));
    i = m.index + m[0].length;
    for (const code of m[1].split(";").map((c) => (c === "" ? 0 : +c))) {
      if (code === 0) close();
      else if (SGR[code]) { html += `<span class="${SGR[code]}">`; open.push(code); }
    }
  }
  html += esc(text.slice(i));
  close();
  return html;
}

export class Terminal {
  /**
   * @param {HTMLElement} root   where the terminal goes
   * @param {object} o
   * @param {import("./shell.js").Shell} o.shell
   * @param {(records: object[]) => void} [o.onRun]  called after each line has run
   */
  constructor(root, { shell, onRun }) {
    this.shell = shell;
    this.onRun = onRun || (() => {});
    this.busy = false;
    this.cursor = null;     // position in history while walking it
    this.draft = "";
    root.innerHTML = `
      <div class="term" role="group" aria-label="Practice terminal">
        <pre class="terminal term-out" id="term-out" tabindex="0" aria-live="polite"></pre>
        <div class="term-line"><span class="term-prompt" id="term-prompt"></span><span class="term-input" id="term-input" role="textbox" aria-label="Terminal input" aria-multiline="false" tabindex="0" spellcheck="false" autocapitalize="off" autocorrect="off" data-placeholder="type a command"></span></div>
      </div>`;
    this.out = root.querySelector("#term-out");
    // An inline editable span, not a form control: it flows right after the prompt and wraps
    // back to the left edge like a real terminal, and no browser restyles it (Safari did).
    this.input = new LineInput(root.querySelector("#term-input"));
    this.promptEl = root.querySelector("#term-prompt");
    this.renderPrompt();
    this.input.el.addEventListener("keydown", (e) => this.onKey(e));
    root.querySelector(".term").addEventListener("click", (e) => { if (!getSelection().toString() && !e.target.closest("button")) this.input.focus(); });
  }

  promptHtml() {
    const code = this.shell.runs.length ? this.shell.lastCode : null;
    const mark = code === null ? "" : `<span class="${code === 0 ? "t-green" : "t-red"}">[exit ${code}]</span> `;
    return `${mark}<span class="t-cyan">${SHORT_HOME}</span> <span class="t-dim">$</span> `;
  }
  renderPrompt() { this.promptEl.innerHTML = this.promptHtml(); }

  setBusy(on) {
    this.busy = on;
    this.input.disabled = on;
    this.input.placeholder = on ? "running…" : "type a command";
    if (!on) this.input.focus({ preventScroll: true });
  }

  /** Print raw HTML to the scrollback. */
  print(html) {
    this.out.insertAdjacentHTML("beforeend", html);
    this.out.scrollTop = this.out.scrollHeight;
  }
  clear() { this.out.innerHTML = ""; }
  notice(text) { this.print(`<span class="t-dim">${esc(text)}\n</span>`); }

  echo(line) { this.print(`${this.promptHtml()}<span class="t-cmd">${esc(line)}</span>\n`); }

  /** Run one line as if typed: echo it, execute it, show what came out. Resolves when done. */
  async run(line) {
    this.echo(line);
    this.setBusy(true);
    let records = [];
    try { records = await this.shell.exec(line); } finally { this.setBusy(false); }
    for (const r of records) {
      if (r.kind === "clear") { this.clear(); continue; }
      let text = "";
      for (const [stream, chunk] of r.chunks) {
        text += stream === "stderr" ? `<span class="t-stderr">${ansiToHtml(chunk)}</span>` : ansiToHtml(chunk);
      }
      const plain = r.chunks.map((c) => c[1]).join("");
      this.print(text + (plain && !plain.endsWith("\n") ? "\n" : ""));
    }
    this.renderPrompt();
    this.onRun(records);
    return records;
  }

  /** Put text in the input line (what the "Type it" buttons do). */
  fill(text) { this.input.value = text; this.input.focus(); this.input.toEnd(); }

  async onKey(e) {
    const el = this.input;
    if (e.key === "Enter") {
      e.preventDefault();
      const line = el.value;
      el.value = ""; this.cursor = null;
      if (!line.trim()) { this.print(`${this.promptHtml()}\n`); return; }
      await this.run(line);
    } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      const h = this.shell.history;
      if (!h.length) return;
      e.preventDefault();
      if (this.cursor === null) { if (e.key === "ArrowDown") return; this.draft = el.value; this.cursor = h.length; }
      this.cursor = Math.max(0, Math.min(h.length, this.cursor + (e.key === "ArrowUp" ? -1 : 1)));
      el.value = this.cursor === h.length ? this.draft : h[this.cursor];
      if (this.cursor === h.length) this.cursor = null;
     
      requestAnimationFrame(() => el.toEnd());
    } else if (e.key === "Tab") {
      e.preventDefault();
      const { line, options } = this.shell.complete(el.value);
      if (options.length) this.print(`${this.promptHtml()}<span class="t-cmd">${esc(el.value)}</span>\n<span class="t-dim">${esc(options.join("  "))}\n</span>`);
      el.value = line; el.toEnd();
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault(); this.clear();
    } else if (e.key === "c" && e.ctrlKey) {
      e.preventDefault();
      this.print(`${this.promptHtml()}<span class="t-cmd">${esc(el.value)}</span><span class="t-dim">^C</span>\n`);
      el.value = ""; this.cursor = null;
    }
  }
}

/** A one-line editable span with the bits of the <input> API the terminal uses. */
class LineInput {
  constructor(el) {
    this.el = el;
    this._disabled = false;
    this.enable(true);
    // Keep it one line of plain text: no pasted markup, no newlines.
    el.addEventListener("paste", (e) => {
      e.preventDefault();
      const text = (e.clipboardData?.getData("text/plain") || "").replace(/\r?\n/g, " ");
      this.insert(text);
    });
    el.addEventListener("drop", (e) => e.preventDefault());
    el.addEventListener("input", () => {
      if (/\n/.test(el.textContent) || el.children.length) { this.value = el.textContent.replace(/\n/g, " "); this.toEnd(); }
      el.classList.toggle("empty", !el.textContent);
    });
  }
  enable(on) {
    // plaintext-only keeps rich formatting out where supported; "true" is the fallback.
    this.el.setAttribute("contenteditable", on ? "plaintext-only" : "false");
    if (on && this.el.contentEditable !== "plaintext-only") this.el.setAttribute("contenteditable", "true");
    this.el.setAttribute("aria-disabled", String(!on));
  }
  get value() { return this.el.textContent; }
  set value(v) { this.el.textContent = v; this.el.classList.toggle("empty", !v); }
  get disabled() { return this._disabled; }
  set disabled(on) { this._disabled = on; this.enable(!on); }
  get placeholder() { return this.el.dataset.placeholder; }
  set placeholder(v) { this.el.dataset.placeholder = v; }
  focus(opts) { if (!this._disabled) this.el.focus(opts); }
  scrollIntoView(opts) { this.el.scrollIntoView(opts); }
  /** Put the caret after the last character. */
  toEnd() {
    if (document.activeElement !== this.el) return;
    const r = document.createRange(); r.selectNodeContents(this.el); r.collapse(false);
    const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
  }
  insert(text) {
    const sel = getSelection();
    if (!sel.rangeCount || !this.el.contains(sel.anchorNode)) { this.value += text; this.toEnd(); return; }
    const r = sel.getRangeAt(0); r.deleteContents();
    const node = document.createTextNode(text); r.insertNode(node);
    r.setStartAfter(node); r.collapse(true); sel.removeAllRanges(); sel.addRange(r);
    this.el.normalize(); this.el.classList.toggle("empty", !this.el.textContent);
  }
}
