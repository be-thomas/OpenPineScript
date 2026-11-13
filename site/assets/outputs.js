// Turns the files the CLI wrote into things the page can show: a table, and a
// model for the canvas chart (chart.js). The CSV rules are the CLI's own
// (cli.md section 4 and 5); nothing here runs the engine. No DOM.

/** Split CSV text into { header, rows }. The CLI's files never quote or embed commas in a cell. */
export function parseCsv(text) {
  const lines = String(text).split(/\r?\n/).filter((l) => l.length);
  const header = (lines[0] || "").split(",");
  return { header, rows: lines.slice(1).map((l) => l.split(",")) };
}

/** What kind of file is this? Decides how the Files panel shows it. */
export function classify(path, text) {
  if (path.endsWith(".pine")) return "pine";
  const name = path.split("/").pop();
  if (name.endsWith(".csv")) {
    const head = (String(text).split("\n", 1)[0] || "").split(",");
    if (head.slice(0, 6).join(",") === "time,open,high,low,close,volume") return "chart";
    if (head[0] === "Trade #" && head.includes("Cum. Profit")) return "trades";
    return "csv";
  }
  if (name === "comparison_report.json") return "report";
  if (name.endsWith(".json")) {
    try { const j = JSON.parse(text); if (j && "net_profit" in j && "total_closed_trades" in j) return "summary"; } catch { /* not json */ }
    return "json";
  }
  return "text";
}

const PALETTE = ["#ff9800", "#2962ff", "#26a69a", "#ab47bc", "#ef5350", "#fdd835"];

/** Candles from the OHLCV columns of a chart CSV (the CLI's chart.csv shape, or the bundled data). */
export function barsFromChart(text) {
  const { rows } = parseCsv(text);
  return rows.map((c) => ({ time: new Date(c[0]).getTime(), open: +c[1], high: +c[2], low: +c[3], close: +c[4], volume: +c[5] || 0 }))
    .filter((b) => !isNaN(b.close) && !isNaN(b.time));
}

/** Candles from the CLI's input CSV, read with the CLI's rules (loadCsv in cli_main.ts). */
export function barsFromInput(text) {
  const lines = text.trim().split(/\r?\n/);
  const rows = lines[0].toLowerCase().includes("time") ? lines.slice(1) : lines;
  return rows.map((l) => l.trim()).filter(Boolean).map((line) => {
    const c = line.split(",");
    return { time: new Date(c[0]).getTime(), open: parseFloat(c[1]), high: parseFloat(c[2]), low: parseFloat(c[3]), close: parseFloat(c[4]), volume: parseFloat(c[5]) || 0 };
  }).filter((b) => !isNaN(b.close) && !isNaN(b.time));
}

/**
 * The chart model for a chart CSV and (optionally) a trades CSV: one line series per plot
 * column, and closed trades paired from the Entry and Exit rows.
 * A plot goes on the price pane when it sits near the price, in its own pane otherwise
 * (RSI against a stock price), which is what a chart does with overlay=true / false.
 */
export function chartModel(chartText, tradesText) {
  const bars = barsFromChart(chartText);
  const { header, rows } = parseCsv(chartText);
  const mid = (a) => { const s = a.filter((v) => isFinite(v)).sort((x, y) => x - y); return s.length ? s[s.length >> 1] : NaN; };
  const priceMid = mid(bars.map((b) => b.close));
  const series = [];
  let color = 0;
  for (let c = 6; c < header.length; c++) {
    const values = rows.map((r) => (r[c] === "" || r[c] === undefined ? NaN : +r[c]));
    const m = mid(values);
    const isH = /^hline$/i.test(header[c]);
    const near = isFinite(m) && m > priceMid * 0.5 && m < priceMid * 2;
    series.push({
      id: (isH ? "hline-" : "plot-") + c, type: "line", title: header[c], pane: near ? "main" : "sub",
      color: isH ? "#8892b0" : PALETTE[color++ % PALETTE.length],
      data: values.map((v) => (isFinite(v) ? { value: v } : null)),
    });
  }
  return { bars, model: { series, trades: tradesText ? tradesFrom(tradesText) : [], position: null, logs: [], errors: [] } };
}

/** Closed trades from a trades CSV: each trade number has an Entry row and an Exit row. */
export function tradesFrom(text) {
  const { header, rows } = parseCsv(text);
  const col = (n) => header.indexOf(n);
  const byNum = new Map();
  for (const r of rows) {
    const t = byNum.get(r[col("Trade #")]) || {};
    if (/^Entry/.test(r[col("Type")])) {
      t.entryTime = Date.parse(r[col("Date/Time")]); t.entryPrice = +r[col("Price")]; t.entryId = r[col("Signal")];
      t.direction = /Short/.test(r[col("Type")]) ? "short" : "long";
    } else {
      t.exitTime = Date.parse(r[col("Date/Time")]); t.exitPrice = +r[col("Price")]; t.pnl = +r[col("Profit")]; t.id = r[col("Signal")];
    }
    byNum.set(r[col("Trade #")], t);
  }
  return [...byNum.values()].filter((t) => isFinite(t.entryTime) && isFinite(t.exitTime));
}
