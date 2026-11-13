// Small helpers shared by every page: storage that cannot throw, theme toggle,
// clipboard, toast, share button, and remembering who is reading.

export const store = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); return true; } catch { return false; } },
  remove(key) { try { localStorage.removeItem(key); } catch { /* ignore */ } },
};

export function remember(choice) { store.set("ops-reader", choice); }
export function remembered() {
  const v = store.get("ops-reader");
  return v === "human" || v === "ai" ? v : null;
}

let toastEl = null, toastTimer = 0;
export function toast(message) {
  if (!toastEl) {
    toastEl = document.createElement("div");
    toastEl.className = "toast";
    toastEl.setAttribute("role", "status");
    toastEl.setAttribute("aria-live", "polite");
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Clipboard API blocked (insecure origin, iframe, permissions): old way.
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch { ok = false; }
    ta.remove();
    return ok;
  }
}

/** Wire a button that copies `getText()` and flashes its label. */
export function wireCopy(button, getText, doneLabel = "Copied") {
  button.addEventListener("click", async () => {
    const text = await getText();
    const ok = await copyText(text);
    toast(ok ? "Copied to clipboard" : "Copy failed: select the text and copy it by hand");
    if (ok) {
      const label = button.querySelector("span") || button;
      const before = label.textContent;
      label.textContent = doneLabel;
      setTimeout(() => { label.textContent = before; }, 1500);
    }
  });
}

function wireTheme() {
  for (const btn of document.querySelectorAll("[data-theme-toggle]")) {
    btn.addEventListener("click", () => {
      const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next);
      store.set("ops-theme", next);
      window.dispatchEvent(new CustomEvent("themechange", { detail: next }));
    });
  }
}

function wireShare() {
  for (const btn of document.querySelectorAll("[data-share]")) {
    btn.addEventListener("click", async () => {
      const data = {
        title: document.title,
        text: "OpenPineScript: run TradingView Pine Script locally. Try the engine live in your browser.",
        url: location.origin + location.pathname.replace(/[^/]*$/, ""),
      };
      if (navigator.share) {
        try { await navigator.share(data); return; } catch (e) { if (e && e.name === "AbortError") return; }
      }
      const ok = await copyText(data.url);
      toast(ok ? "Link copied. Share it!" : data.url);
    });
  }
}

function wireChoice() {
  for (const el of document.querySelectorAll("[data-remember]")) {
    el.addEventListener("click", () => remember(el.getAttribute("data-remember")));
  }
}

wireTheme();
wireShare();
wireChoice();
