// Renders cli.md (the single source of truth) as a readable page, adds a table
// of contents and copy buttons. Plain fetch + a small Markdown subset renderer:
// headings, fenced code, tables, lists, paragraphs, inline code/bold/links.

import { wireCopy, copyText, toast, remember } from "./shared.js";

remember("ai");

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const slug = (s) => s.toLowerCase().replace(/<[^>]+>/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function inline(text) {
  const codes = [];
  // Code spans first, so nothing inside them is touched. Any run of backticks may delimit.
  let t = text.replace(/(`+)([\s\S]+?)\1(?!`)/g, (_, _d, body) => {
    codes.push(`<code>${esc(body.trim())}</code>`);
    return `\u0000${codes.length - 1}\u0000`;
  });
  t = esc(t)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => `<a href="${href}">${label}</a>`);
  return t.replace(/\u0000(\d+)\u0000/g, (_, i) => codes[+i]);
}

export function renderMarkdown(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  const headings = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line)) {
      const lang = line.slice(3).trim();
      const body = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) body.push(lines[i++]);
      i++;
      out.push(`<pre data-lang="${esc(lang)}"><code>${esc(body.join("\n"))}</code></pre>`);
      continue;
    }
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      const level = h[1].length;
      const id = slug(h[2]);
      if (level === 2) headings.push({ id, text: h[2].replace(/`/g, "") });
      out.push(`<h${level} id="${id}">${inline(h[2])}</h${level}>`);
      i++; continue;
    }
    if (/^---+\s*$/.test(line)) { out.push("<hr>"); i++; continue; }
    if (/^\|/.test(line) && /^\|[\s:|-]+\|?\s*$/.test(lines[i + 1] || "")) {
      const cells = (l) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
      const head = cells(line);
      i += 2;
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) rows.push(cells(lines[i++]));
      out.push(`<div class="table-wrap"><table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${
        rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);
      continue;
    }
    const li = /^(\s*)([-*]|\d+\.)\s+(.*)$/.exec(line);
    if (li) {
      const ordered = /\d/.test(li[2]);
      const items = [];
      while (i < lines.length) {
        const m = /^(\s*)([-*]|\d+\.)\s+(.*)$/.exec(lines[i]);
        if (m) { items.push(m[3]); i++; }
        else if (/^\s{2,}\S/.test(lines[i]) && items.length) { items[items.length - 1] += " " + lines[i].trim(); i++; }
        else break;
      }
      out.push(`<${ordered ? "ol" : "ul"}>${items.map((x) => `<li>${inline(x)}</li>`).join("")}</${ordered ? "ol" : "ul"}>`);
      continue;
    }
    if (line.trim() === "") { i++; continue; }
    const para = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== "" && !/^(```|#{1,3}\s|\||---|\s*([-*]|\d+\.)\s)/.test(lines[i])) para.push(lines[i++]);
    out.push(`<p>${inline(para.join(" "))}</p>`);
  }
  return { html: out.join("\n"), headings };
}

async function main() {
  const article = document.getElementById("md");
  let md;
  try {
    const res = await fetch("cli.md", { cache: "no-cache" });
    if (!res.ok) throw new Error(String(res.status));
    md = await res.text();
  } catch {
    article.innerHTML = '<p>Could not load the guide here. Read <a href="cli.md">cli.md</a> directly.</p>';
    return;
  }
  const { html, headings } = renderMarkdown(md);
  article.innerHTML = html;
  document.getElementById("toc").innerHTML = headings.map((h) => `<a href="#${h.id}">${esc(h.text)}</a>`).join("");

  for (const pre of article.querySelectorAll("pre")) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn small copy-code";
    b.textContent = "Copy";
    b.setAttribute("aria-label", "Copy this code block");
    b.addEventListener("click", async () => {
      const ok = await copyText(pre.querySelector("code").textContent);
      b.textContent = ok ? "Copied" : "Failed";
      setTimeout(() => { b.textContent = "Copy"; }, 1400);
    });
    pre.appendChild(b);
  }

  wireCopy(document.getElementById("copy-md"), () => md);
  const base = new URL(".", location.href).href;
  const prompt = `Read ${base}cli.md and use the OpenPineScript CLI exactly as it describes. Start with the install section.`;
  document.getElementById("prompt-text").textContent = prompt;
  wireCopy(document.getElementById("copy-prompt"), () => prompt);
  if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
}
main().catch(() => toast("Could not render the guide"));
