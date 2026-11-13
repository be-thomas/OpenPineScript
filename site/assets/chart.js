// A small candlestick renderer on <canvas>: our own, no library.
//
// Draws the price pane (candles, overlay plots, plotshape markers, bgcolor bands,
// strategy entries and exits), an optional second pane for plots with
// pane === "sub", a crosshair with a text readout, drag-to-pan and
// ctrl/pinch-to-zoom. Crisp on HiDPI: all drawing is in CSS pixels under a
// devicePixelRatio transform, and 1px strokes sit on half-pixels.

const MARGIN_R = 56, MARGIN_T = 8, AXIS_H = 22, SUB_GAP = 8;

function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
const finite = (v) => typeof v === "number" && isFinite(v);

export class Chart {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {HTMLElement} readout where the crosshair text goes (a normal DOM node, so it is selectable and read by screen readers)
   */
  constructor(canvas, readout) {
    this.canvas = canvas;
    this.readout = readout;
    this.ctx = canvas.getContext("2d");
    this.bars = [];
    this.model = null;
    this.view = { start: 0, count: 200 };
    this.cross = null;
    this.reveal = 1;
    this.reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.colors = {};
    this.refreshColors();

    this.ro = new ResizeObserver(() => this.render());
    this.ro.observe(canvas.parentElement);
    window.addEventListener("themechange", () => { this.refreshColors(); this.render(); });

    this.bind();
  }

  refreshColors() {
    this.colors = {
      bg: css("--code-bg"), grid: css("--grid"), text: css("--muted"), fg: css("--text"),
      up: css("--up"), down: css("--down"), accent: css("--accent"), accent2: css("--accent-2"), warn: css("--warn"),
    };
  }

  /** Replace the data. `model` is the engine's run result (or null for just candles). */
  setData(bars, model, { animate = true } = {}) {
    const first = this.bars.length === 0;
    this.bars = bars;
    this.model = model;
    if (first) this.showLatest();
    this.cross = null;
    if (this.readout) this.readout.textContent = "";
    if (animate && !this.reduceMotion && model) this.animateReveal(); else { this.reveal = 1; this.render(); }
  }

  animateReveal() {
    cancelAnimationFrame(this._raf);
    const t0 = performance.now(), dur = 650;
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      this.reveal = 1 - Math.pow(1 - p, 3);
      this.render();
      if (p < 1) this._raf = requestAnimationFrame(step);
    };
    this.reveal = 0;
    this._raf = requestAnimationFrame(step);
  }

  showLatest() { this.view = { start: Math.max(0, this.bars.length - 200), count: Math.min(200, this.bars.length) }; this.render(); }
  showAll() { this.view = { start: 0, count: this.bars.length }; this.render(); }
  zoom(factor, anchor = 0.5) {
    const n = this.bars.length;
    const count = Math.max(20, Math.min(n, this.view.count * factor));
    const focus = this.view.start + this.view.count * anchor;
    this.view = { count, start: focus - count * anchor };
    this.clamp(); this.render();
  }
  /** Scroll so the bar at `time` (ms, or anything Date parses) is in the middle of the view. */
  centerOn(time) {
    const t = new Date(time).getTime();
    let i = this.bars.findIndex((b) => b.time >= t);
    if (i === -1) i = this.bars.length - 1;
    this.view.start = i - this.view.count / 2;
    this.clamp(); this.render();
  }
  clamp() {
    const n = this.bars.length;
    this.view.count = Math.max(10, Math.min(n, this.view.count));
    this.view.start = Math.max(0, Math.min(n - this.view.count, this.view.start));
  }

  bind() {
    const c = this.canvas;
    let drag = null;
    c.addEventListener("pointerdown", (e) => {
      drag = { x: e.clientX, start: this.view.start, id: e.pointerId, moved: false };
      c.setPointerCapture(e.pointerId);
    });
    c.addEventListener("pointermove", (e) => {
      const rect = c.getBoundingClientRect();
      if (drag && e.pointerId === drag.id) {
        const plotW = rect.width - MARGIN_R;
        const dBars = ((e.clientX - drag.x) / plotW) * this.view.count;
        if (Math.abs(e.clientX - drag.x) > 3) drag.moved = true;
        this.view.start = drag.start - dBars;
        this.clamp();
      }
      this.cross = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      this.render();
      this.updateReadout();
    });
    const end = (e) => { if (drag && e.pointerId === drag.id) drag = null; };
    c.addEventListener("pointerup", end);
    c.addEventListener("pointercancel", end);
    c.addEventListener("pointerleave", () => { if (!drag) { this.cross = null; this.render(); } });
    c.addEventListener("wheel", (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;       // plain scrolling stays page scrolling
      e.preventDefault();
      const rect = c.getBoundingClientRect();
      const anchor = Math.max(0, Math.min(1, (e.clientX - rect.left) / (rect.width - MARGIN_R)));
      this.zoom(e.deltaY > 0 ? 1.15 : 1 / 1.15, anchor);
    }, { passive: false });
    c.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { this.view.start -= this.view.count * 0.1; this.clamp(); this.render(); e.preventDefault(); }
      else if (e.key === "ArrowRight") { this.view.start += this.view.count * 0.1; this.clamp(); this.render(); e.preventDefault(); }
      else if (e.key === "+" || e.key === "=") this.zoom(1 / 1.25);
      else if (e.key === "-") this.zoom(1.25);
    });
  }

  // ---- layout ----

  layout() {
    const w = this.canvas.parentElement.clientWidth;
    const hasSub = !!this.model && this.model.series.some((s) => s.pane === "sub" && s.type === "line");
    const mainH = w < 480 ? 230 : 300;
    const subH = hasSub ? (w < 480 ? 100 : 120) : 0;
    const h = MARGIN_T + mainH + (hasSub ? SUB_GAP + subH : 0) + AXIS_H;
    return { w, h, mainTop: MARGIN_T, mainH, subTop: MARGIN_T + mainH + SUB_GAP, subH, hasSub, plotW: w - MARGIN_R };
  }

  /** Bar index (float) to x pixel. Bar centres sit at +0.5. */
  xOf(i, L) { return ((i - this.view.start + 0.5) / this.view.count) * L.plotW; }
  indexAt(x, L) { return Math.floor((x / L.plotW) * this.view.count + this.view.start); }

  // ---- drawing ----

  render() {
    const canvas = this.canvas, ctx = this.ctx;
    const L = this.layout();
    if (L.w < 50) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    if (canvas.width !== Math.round(L.w * dpr) || canvas.height !== Math.round(L.h * dpr)) {
      canvas.width = Math.round(L.w * dpr); canvas.height = Math.round(L.h * dpr);
      canvas.style.height = L.h + "px";
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const C = this.colors;
    ctx.clearRect(0, 0, L.w, L.h);
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, L.w, L.h);
    if (this.bars.length === 0) return;

    this.clamp();
    const i0 = Math.max(0, Math.floor(this.view.start)), i1 = Math.min(this.bars.length - 1, Math.ceil(this.view.start + this.view.count));
    const series = this.model ? this.model.series : [];

    // ---- main pane scale ----
    let lo = Infinity, hi = -Infinity;
    for (let i = i0; i <= i1; i++) { lo = Math.min(lo, this.bars[i].low); hi = Math.max(hi, this.bars[i].high); }
    const overlay = series.filter((s) => s.pane === "main" && s.type === "line");
    for (const s of overlay) {
      for (let i = i0; i <= i1; i++) { const p = s.data[i]; if (p && finite(p.value)) { lo = Math.min(lo, p.value); hi = Math.max(hi, p.value); } }
    }
    const pad = (hi - lo) * 0.08 || 1;
    lo -= pad; hi += pad;
    const yMain = (v) => L.mainTop + (1 - (v - lo) / (hi - lo)) * L.mainH;

    this.drawGrid(L.mainTop, L.mainH, lo, hi, L, i0, i1);

    // plots are clipped by the reveal wipe; candles are always whole
    const wipeW = L.plotW * this.reveal;

    // bgcolor bands, behind candles
    ctx.save(); ctx.beginPath(); ctx.rect(0, L.mainTop, wipeW, L.mainH); ctx.clip();
    const bw = L.plotW / this.view.count;
    for (const s of series.filter((x) => x.type === "bgcolor")) {
      for (let i = i0; i <= i1; i++) {
        const p = s.data[i]; if (!p || !p.color) continue;
        ctx.fillStyle = p.color; ctx.fillRect(this.xOf(i, L) - bw / 2, L.mainTop, bw, L.mainH);
      }
    }
    ctx.restore();

    // candles
    const barColor = series.find((x) => x.type === "barcolor");
    const wick = Math.max(1, Math.min(1.5, bw * 0.12));
    const bodyW = Math.max(1, Math.min(bw * 0.72, 18));
    for (let i = i0; i <= i1; i++) {
      const b = this.bars[i];
      const x = this.xOf(i, L);
      let col = b.close >= b.open ? C.up : C.down;
      if (barColor && barColor.data[i] && barColor.data[i].color) col = barColor.data[i].color;
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = wick;
      const px = Math.round(x * dpr) / dpr;
      ctx.beginPath(); ctx.moveTo(px, yMain(b.high)); ctx.lineTo(px, yMain(b.low)); ctx.stroke();
      const yo = yMain(b.open), yc = yMain(b.close);
      const top = Math.min(yo, yc), hgt = Math.max(1 / dpr * 1.5, Math.abs(yo - yc));
      if (bodyW > 1.5) ctx.fillRect(px - bodyW / 2, top, bodyW, hgt);
    }

    // overlay plots, markers, trades (wiped in)
    ctx.save(); ctx.beginPath(); ctx.rect(0, L.mainTop - 4, wipeW + 14, L.mainH + 8); ctx.clip();
    for (const s of overlay) this.drawLine(s, i0, i1, L, yMain);
    for (const s of series.filter((x) => x.type === "marker" && x.pane === "main")) this.drawMarkers(s, i0, i1, L, yMain, lo, hi);
    if (this.model) this.drawTrades(i0, i1, L, yMain);
    ctx.restore();

    // ---- sub pane ----
    if (L.hasSub) {
      const subs = series.filter((s) => s.pane === "sub" && s.type === "line");
      let slo = Infinity, shi = -Infinity;
      for (const s of subs) for (let i = i0; i <= i1; i++) { const p = s.data[i]; if (p && finite(p.value)) { slo = Math.min(slo, p.value); shi = Math.max(shi, p.value); } }
      if (!finite(slo)) { slo = 0; shi = 1; }
      const sp = (shi - slo) * 0.1 || 1; slo -= sp; shi += sp;
      const ySub = (v) => L.subTop + (1 - (v - slo) / (shi - slo)) * L.subH;
      ctx.fillStyle = C.bg; ctx.fillRect(0, L.subTop - SUB_GAP, L.w, SUB_GAP);
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, L.subTop - SUB_GAP / 2 + 0.5); ctx.lineTo(L.w, L.subTop - SUB_GAP / 2 + 0.5); ctx.stroke();
      this.drawGrid(L.subTop, L.subH, slo, shi, L, i0, i1, 3);
      ctx.save(); ctx.beginPath(); ctx.rect(0, L.subTop, wipeW + 14, L.subH); ctx.clip();
      for (const s of subs) this.drawLine(s, i0, i1, L, ySub);
      ctx.restore();
      ctx.fillStyle = C.text; ctx.font = "600 10px Inter, system-ui, sans-serif"; ctx.textAlign = "left";
      ctx.fillText(subs.filter((s) => !String(s.id).startsWith("hline")).map((s) => s.title).join("  ·  "), 8, L.subTop + 12);
      this._ySub = ySub;
    }

    // ---- x axis ----
    ctx.fillStyle = C.text; ctx.font = "10px Inter, system-ui, sans-serif"; ctx.textAlign = "center";
    const step = Math.max(1, Math.round(this.view.count / Math.max(2, Math.floor(L.plotW / 78))));
    let lastLabel = -1e9;
    for (let i = i0; i <= i1; i++) {
      if (i % step !== 0) continue;
      const x = this.xOf(i, L);
      if (x < 20 || x > L.plotW - 20 || x - lastLabel < 60) continue;
      lastLabel = x;
      const d = new Date(this.bars[i].time);
      ctx.fillText(d.toISOString().slice(0, 7), x, L.h - 7);
    }

    // ---- crosshair ----
    if (this.cross && this.cross.x < L.plotW) {
      const idx = Math.min(this.bars.length - 1, Math.max(0, this.indexAt(this.cross.x, L)));
      const x = this.xOf(idx, L);
      ctx.strokeStyle = C.text; ctx.globalAlpha = 0.45; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(Math.round(x) + 0.5, L.mainTop); ctx.lineTo(Math.round(x) + 0.5, L.h - AXIS_H); ctx.stroke();
      if (this.cross.y >= L.mainTop && this.cross.y <= L.mainTop + L.mainH) {
        ctx.beginPath(); ctx.moveTo(0, Math.round(this.cross.y) + 0.5); ctx.lineTo(L.plotW, Math.round(this.cross.y) + 0.5); ctx.stroke();
        const price = lo + (1 - (this.cross.y - L.mainTop) / L.mainH) * (hi - lo);
        ctx.setLineDash([]); ctx.globalAlpha = 1;
        ctx.fillStyle = C.accent; ctx.fillRect(L.plotW, this.cross.y - 9, MARGIN_R, 18);
        ctx.fillStyle = "#fff"; ctx.textAlign = "left"; ctx.font = "600 10.5px Inter, system-ui, sans-serif";
        ctx.fillText(price.toFixed(2), L.plotW + 6, this.cross.y + 3.5);
      }
      ctx.setLineDash([]); ctx.globalAlpha = 1;
    }

    this._L = L;
    canvas.setAttribute("aria-label", this.describe());
  }

  drawGrid(top, h, lo, hi, L, i0, i1, rows = 5) {
    const ctx = this.ctx, C = this.colors;
    ctx.font = "10px Inter, system-ui, sans-serif"; ctx.textAlign = "left"; ctx.lineWidth = 1;
    const nice = niceStep((hi - lo) / rows);
    const first = Math.ceil(lo / nice) * nice;
    for (let v = first; v < hi; v += nice) {
      const y = Math.round(top + (1 - (v - lo) / (hi - lo)) * h) + 0.5;
      ctx.strokeStyle = C.grid; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(L.plotW, y); ctx.stroke();
      ctx.fillStyle = C.text; ctx.fillText(nice < 1 ? v.toFixed(2) : v.toFixed(nice < 5 ? 1 : 0), L.plotW + 6, y + 3.5);
    }
    // month boundaries
    let prev = -1;
    for (let i = i0; i <= i1; i++) {
      const m = new Date(this.bars[i].time).getUTCMonth();
      if (prev !== -1 && m !== prev && (m % 3 === 0)) {
        const x = Math.round(this.xOf(i, L)) + 0.5;
        ctx.strokeStyle = C.grid; ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, top + h); ctx.stroke();
      }
      prev = m;
    }
  }

  drawLine(s, i0, i1, L, yOf) {
    const ctx = this.ctx;
    const isH = String(s.id).startsWith("hline");
    ctx.strokeStyle = s.color || "#2962FF";
    ctx.lineWidth = isH ? 1 : Math.max(1.4, (s.linewidth || 1) * 1.6);
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.setLineDash(isH ? [5, 4] : []);
    ctx.globalAlpha = isH ? 0.8 : 1;
    ctx.beginPath();
    let pen = false;
    for (let i = Math.max(0, i0 - 1); i <= Math.min(s.data.length - 1, i1 + 1); i++) {
      const p = s.data[i];
      if (!p || !finite(p.value)) { pen = false; continue; }
      const x = this.xOf(i, L), y = yOf(p.value);
      if (!pen) { ctx.moveTo(x, y); pen = true; } else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]); ctx.globalAlpha = 1;
  }

  drawMarkers(s, i0, i1, L, yMain, lo, hi) {
    const ctx = this.ctx, C = this.colors;
    const size = Math.max(3.5, Math.min(7, (L.plotW / this.view.count) * 0.55 + 2.5));
    const style = String(s.style || "circle");
    for (let i = i0; i <= i1; i++) {
      const p = s.data[i]; if (!p) continue;
      const b = this.bars[i];
      const x = this.xOf(i, L);
      let y, dir = 1;
      switch (s.location) {
        case "belowbar": y = yMain(b.low) + size + 5; dir = -1; break;
        case "top": y = L.mainTop + size + 4; break;
        case "bottom": y = L.mainTop + L.mainH - size - 4; dir = -1; break;
        case "absolute": y = yMain(p.value); break;
        default: y = yMain(b.high) - size - 5;
      }
      const col = (p.color) || s.color || C.accent2;
      ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 1.6;
      this.shape(style, x, y, size, dir);
      if (s.text && this.view.count < 260) {
        ctx.fillStyle = s.textcolor || C.fg; ctx.font = "600 9px Inter, system-ui, sans-serif"; ctx.textAlign = "center";
        ctx.fillText(s.text, x, dir === 1 ? y - size - 3 : y + size + 10);
      }
    }
  }

  shape(style, x, y, r, dir) {
    const ctx = this.ctx;
    ctx.beginPath();
    switch (style) {
      case "triangleup": case "arrowup": case "labelup":
        ctx.moveTo(x, y - r); ctx.lineTo(x + r, y + r * 0.8); ctx.lineTo(x - r, y + r * 0.8); ctx.closePath(); ctx.fill(); break;
      case "triangledown": case "arrowdown": case "labeldown":
        ctx.moveTo(x, y + r); ctx.lineTo(x + r, y - r * 0.8); ctx.lineTo(x - r, y - r * 0.8); ctx.closePath(); ctx.fill(); break;
      case "square": ctx.fillRect(x - r * 0.8, y - r * 0.8, r * 1.6, r * 1.6); break;
      case "diamond": ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath(); ctx.fill(); break;
      case "xcross": case "cross": case "X":
        ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y + r); ctx.moveTo(x + r, y - r); ctx.lineTo(x - r, y + r); ctx.stroke(); break;
      case "flag": ctx.moveTo(x - r, y + r); ctx.lineTo(x - r, y - r); ctx.lineTo(x + r, y - r * 0.4); ctx.lineTo(x - r, y + r * 0.1); ctx.stroke(); break;
      default: ctx.arc(x, y, r * 0.8, 0, Math.PI * 2); ctx.fill();
    }
  }

  drawTrades(i0, i1, L, yMain) {
    const ctx = this.ctx, C = this.colors;
    const m = this.model;
    const size = Math.max(4, Math.min(7, (L.plotW / this.view.count) * 0.55 + 3));
    const idxOf = (t, hint) => {
      if (Number.isInteger(hint)) return hint;
      let lo = 0, hi = this.bars.length - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (this.bars[mid].time < t) lo = mid + 1; else hi = mid; }
      return lo;
    };
    for (const t of m.trades || []) {
      const a = idxOf(t.entryTime, t.entryBarIndex), b = idxOf(t.exitTime, t.exitBarIndex);
      if (b < i0 - 1 || a > i1 + 1) continue;
      const win = t.pnl >= 0;
      const col = win ? C.up : C.down;
      const xa = this.xOf(a, L), xb = this.xOf(b, L);
      const ya = yMain(t.entryPrice), yb = yMain(t.exitPrice);
      // connecting line, entry fill to exit fill
      ctx.strokeStyle = col; ctx.globalAlpha = 0.85; ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(xa, ya); ctx.lineTo(xb, yb); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1;
      // entry: arrow in the trade's direction, with a halo so it reads over candles
      const long = t.direction === "long";
      this.halo(() => { ctx.fillStyle = C.accent; this.shape(long ? "triangleup" : "triangledown", xa, long ? ya + size + 3 : ya - size - 3, size, 1); });
      this.halo(() => { ctx.fillStyle = col; this.shape("xcross", xb, yb, size * 0.6, 1); ctx.strokeStyle = col; this.shape("xcross", xb, yb, size * 0.6, 1); });
    }
    const pos = m.position;
    if (pos && pos.size) {
      const a = idxOf(pos.entryTime, pos.entryBarIndex);
      const xa = this.xOf(a, L), ya = yMain(pos.avgPrice);
      ctx.strokeStyle = C.warn; ctx.lineWidth = 1.2; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(xa, ya); ctx.lineTo(L.plotW, ya); ctx.stroke(); ctx.setLineDash([]);
      this.halo(() => { ctx.fillStyle = C.warn; this.shape(pos.size > 0 ? "triangleup" : "triangledown", xa, pos.size > 0 ? ya + size + 3 : ya - size - 3, size, 1); });
      ctx.fillStyle = C.warn; ctx.font = "600 9.5px Inter, system-ui, sans-serif"; ctx.textAlign = "right";
      ctx.fillText("open position", L.plotW - 6, ya - 5);
    }
  }

  halo(draw) {
    const ctx = this.ctx;
    ctx.save(); ctx.shadowColor = this.colors.bg; ctx.shadowBlur = 4; draw(); ctx.restore();
  }

  // ---- readout / a11y ----

  updateReadout() {
    if (!this.readout || !this.cross || !this._L) return;
    const L = this._L;
    if (this.cross.x >= L.plotW) return;
    const i = Math.min(this.bars.length - 1, Math.max(0, this.indexAt(this.cross.x, L)));
    const b = this.bars[i];
    const parts = [`${new Date(b.time).toISOString().slice(0, 10)}  O ${b.open.toFixed(2)}  H ${b.high.toFixed(2)}  L ${b.low.toFixed(2)}  C ${b.close.toFixed(2)}`];
    if (this.model) {
      for (const s of this.model.series) {
        const p = s.data[i];
        if (!p) continue;
        if (s.type === "line" && finite(p.value) && !String(s.id).startsWith("hline")) parts.push(`${s.title} ${p.value.toFixed(3)}`);
        else if (s.type === "marker") parts.push(`${s.title || "marker"} ●`);
      }
      for (const t of this.model.trades || []) {
        if (t.entryBarIndex === i) parts.push(`entry ${t.entryId || t.id} @ ${t.entryPrice.toFixed(2)}`);
        if (t.exitBarIndex === i) parts.push(`exit ${t.exitId || t.id} @ ${t.exitPrice.toFixed(2)} (${t.pnl >= 0 ? "+" : ""}${t.pnl.toFixed(2)})`);
      }
    }
    this.readout.textContent = parts.join("   ·   ");
  }

  describe() {
    const n = this.bars.length;
    if (!n) return "Empty chart";
    const m = this.model;
    const lines = m ? m.series.filter((s) => s.type === "line").length : 0;
    const marks = m ? m.series.filter((s) => s.type === "marker").reduce((a, s) => a + s.data.filter(Boolean).length, 0) : 0;
    return `Candlestick chart of ${n} daily bars with ${lines} plotted lines, ${marks} markers and ${m ? (m.trades || []).length : 0} closed trades.`;
  }
}

function niceStep(raw) {
  const exp = Math.floor(Math.log10(raw || 1));
  const f = raw / Math.pow(10, exp);
  const nf = f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10;
  return nf * Math.pow(10, exp);
}

/** The equity mini chart: a filled line against the starting capital. */
export function drawEquity(canvas, equity, initial) {
  const wrap = canvas.parentElement;
  const w = wrap.clientWidth, h = 110;
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  canvas.style.height = h + "px";
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  if (!equity || equity.length < 2) return;
  const C = { up: css("--up"), down: css("--down"), text: css("--muted"), grid: css("--grid") };
  let lo = initial, hi = initial;
  for (const p of equity) { lo = Math.min(lo, p.equity); hi = Math.max(hi, p.equity); }
  const pad = (hi - lo) * 0.15 || initial * 0.002;
  lo -= pad; hi += pad;
  const x = (i) => 6 + (i / (equity.length - 1)) * (w - 70);
  const y = (v) => 8 + (1 - (v - lo) / (hi - lo)) * (h - 16);
  const base = y(initial);
  ctx.strokeStyle = C.grid; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(0, Math.round(base) + 0.5); ctx.lineTo(w - 62, Math.round(base) + 0.5); ctx.stroke(); ctx.setLineDash([]);
  const last = equity[equity.length - 1].equity;
  const col = last >= initial ? C.up : C.down;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, col + "55"); g.addColorStop(1, col + "00");
  ctx.beginPath();
  equity.forEach((p, i) => (i ? ctx.lineTo(x(i), y(p.equity)) : ctx.moveTo(x(i), y(p.equity))));
  ctx.strokeStyle = col; ctx.lineWidth = 1.8; ctx.lineJoin = "round"; ctx.stroke();
  ctx.lineTo(x(equity.length - 1), base); ctx.lineTo(x(0), base); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
  ctx.fillStyle = C.text; ctx.font = "10px Inter, system-ui, sans-serif"; ctx.textAlign = "left";
  ctx.fillText(Math.round(last).toLocaleString("en-US"), w - 58, y(last) + 3.5);
  ctx.fillText("equity", 8, 14);
}
