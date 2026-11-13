/**
 * v6 against TradingView: the probes in conformance/v6/golden.
 *
 * Three scripts, each logging one dense row per bar to Pine Logs (how to
 * collect them is in each script's header and in golden.md):
 *
 *   harness_v6_language   every v6 rule that changes a computed value —
 *                         lazy and/or, bools that cannot be na, division,
 *                         negative indices, loop bounds, colours, timeframe
 *                         strings, time() offsets, once, sort_field, dynamic
 *                         requests
 *   harness_v6_strategy   the broker — exit parameter pairs, two exits on one
 *                         entry, 100% default margin, margin calls, trailing
 *                         pairs, commission
 *   harness_v6_footprint  request.footprint(): POC, Value Area, imbalances
 *
 * Two layers, so the suite says something before any log exists:
 *
 *   1. Every probe compiles and runs HERE over synthetic bars and emits one
 *      well-formed row per bar. A probe that fails here would otherwise be
 *      found in a browser, by hand. A probe that runs into a known engine gap
 *      is listed in KNOWN_GAPS with the error it gives, and fails the moment
 *      the error changes, so the list cannot go stale.
 *   2. For each log saved beside a probe, the engine replays TradingView's own
 *      candles and every column after OHLCV is compared, row by row. Numbers
 *      inside a value are compared to 1e-9 relative, everything else exactly.
 *      A probe with no log yet is a todo, not a pass.
 *
 * What the replay gives the engine, because TradingView has it and this
 * engine cannot fetch it: the symbol facts from the OPSMETA line, the 5/15/60
 * minute bars (rebuilt from the chart's 1-minute bars, which is exact for a
 * 24/7 market), and for the footprint probe, TradingView's row volumes.
 * Everything compared is something the engine derives.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { compileScript } from "../../transpiler/common";
import { compile, Context } from "../../runtime/v6";
import type { FootprintLevel } from "../../runtime/v1/footprint";

const DIR = join(__dirname, "..", "v6", "golden");
const FILES = readdirSync(DIR);
// The strategy order harnesses log OPS rows in batches and are replayed against
// their TradingView logs by strategy_harness_golden.test.ts, not here.
const REPLAYED_ELSEWHERE = /^harness_(strategy_(pyr0|pyr3|pooc)|release_notes_04)_v6\.pine$/;
const HARNESSES = FILES.filter(f => f.endsWith(".pine") && !REPLAYED_ELSEWHERE.test(f)).sort();

/**
 * Probes that stop on an engine gap, and the error each gives today. Empty:
 * harness_v6_strategy was here until strategy.margin_liquidation_price and the
 * closedtrades exit accessors existed. A future probe that runs into a gap
 * belongs here until the gap closes.
 */
const KNOWN_GAPS: Record<string, RegExp> = {};

/** Columns that read another timeframe, and how many rows they need first. */
const WARMUP: Array<[RegExp, number]> = [[/^sec_/, 61]];

/** Request timeframes the replay rebuilds from the chart's bars. */
const SECURITY_TFS = ["5", "15", "60"];

interface Bar { time: number; open: number; high: number; low: number; close: number; volume: number }
interface Log { meta: Record<string, string>; head: string[]; rows: string[][] }

/**
 * TradingView's Pine Logs export, as meta, header and rows.
 *
 * Rows are keyed by bar time: the realtime bar logs once per tick, so the last
 * row for a time wins, and that bar — still forming when the pane was copied —
 * is dropped.
 */
function readLog(text: string): Log {
  let meta: Record<string, string> = {};
  let head: string[] = [];
  const byTime = new Map<string, string[]>();
  for (const line of text.split("\n")) {
    const at = line.indexOf('"OPS');
    if (at < 0) continue;
    const msg = line.slice(at + 1, line.lastIndexOf('"')).replace(/""/g, '"');
    if (msg.startsWith("OPSMETA|")) meta = Object.fromEntries(msg.slice(8).split(",").map(kv => kv.split("=") as [string, string]));
    else if (msg.startsWith("OPSHEAD|")) head = msg.slice(8).split(",");
    else if (msg.startsWith("OPS|")) { const r = msg.slice(4).split(","); byTime.set(r[0], r); }
  }
  const rows = [...byTime.values()].sort((a, b) => Number(a[0]) - Number(b[0]));
  rows.pop();
  return { meta, head, rows };
}

/** One timeframe's bars, built from 1-minute bars on the UTC grid. */
function resample(bars: Bar[], minutes: number): Bar[] {
  const ms = minutes * 60000;
  const out = new Map<number, Bar>();
  for (const b of bars) {
    const t = Math.floor(b.time / ms) * ms;
    const c = out.get(t);
    if (!c) out.set(t, { ...b, time: t });
    else { c.high = Math.max(c.high, b.high); c.low = Math.min(c.low, b.low); c.close = b.close; c.volume += b.volume; }
  }
  return [...out.values()];
}

/** The levels behind TradingView's fp_rows value: one per row, at its floor. */
function footprintLevels(value: string): FootprintLevel[] | null {
  if (value === "na") return null;
  if (value === "") return [];
  return value.split(";").map(r => {
    const [down, , buy, sell] = r.split(":").map(Number);
    return { price: down, buy, sell };
  });
}

interface Run { meta: string | undefined; head: string[]; rows: string[][] }

function run(source: string, bars: Bar[], meta: Record<string, string>, tf: string,
             footprints: Map<number, FootprintLevel[]>): Run {
  const { js, profile } = compileScript(source);
  const ctx = new Context(profile);
  ctx.resolution = tf;
  ctx.provideSymbolInfo({
    symbol: meta.tickerid, mintick: Number(meta.mintick), mincontract: Number(meta.mincontract),
    pointvalue: Number(meta.pointvalue), timezone: meta.timezone, currency: meta.currency,
    basecurrency: meta.basecurrency, type: meta.type, isin: meta.isin,
  });
  for (const t of SECURITY_TFS) ctx.provideSecurityData(meta.tickerid, t, resample(bars, Number(t)));
  ctx.provideFootprints([...footprints].map(([time, levels]) => ({ time, levels })));
  const exec = compile(js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
  bars.forEach((b, i) => {
    ctx.currentBarIndex = i;
    ctx.setBar(b.time, b.open, b.high, b.low, b.close, b.volume);
    exec();
    ctx.finalizeBar();
  });
  const logs: string[] = (ctx as any).logs.map((l: any) => String(l.message));
  return {
    meta: logs.find(m => m.startsWith("OPSMETA|")),
    head: logs.filter(m => m.startsWith("OPSHEAD|")).flatMap(m => m.slice(8).split(",")),
    rows: logs.filter(m => m.startsWith("OPS|")).map(m => m.slice(4).split(",")),
  };
}

/**
 * Equal, or every number inside equal to 1e-9 relative (or 1e-6 absolute) and
 * the rest exact. The absolute floor is for money: net profit is a sum of
 * differences between figures near 100,000, so two correct implementations
 * that add in a different order part at about 1e-8.
 */
function same(a: string, b: string): boolean {
  if (a === b) return true;
  const pa = a.split(/([;:/[\]])/), pb = b.split(/([;:/[\]])/);
  return pa.length === pb.length && pa.every((x, i) => {
    if (x === pb[i]) return true;
    const p = Number(x), q = Number(pb[i]);
    return x !== "" && pb[i] !== "" && Number.isFinite(p) && Number.isFinite(q)
      && Math.abs(p - q) <= Math.max(1e-6, 1e-9 * Math.max(Math.abs(p), Math.abs(q)));
  });
}

/** BINANCE:BTCUSDT as TradingView reports it, for the synthetic run. */
const SYNTHETIC_META: Record<string, string> = {
  tickerid: "BINANCE:BTCUSDT", mintick: "0.01", mincontract: "0.00001", pointvalue: "1",
  timezone: "Etc/UTC", currency: "USDT", basecurrency: "BTC", type: "crypto", isin: "",
};

/** 600 one-minute bars that wander, from a UTC midnight, with footprints. */
function syntheticBars(): { bars: Bar[]; footprints: Map<number, FootprintLevel[]> } {
  const t0 = Date.UTC(2026, 9, 19);
  const bars: Bar[] = Array.from({ length: 600 }, (_, i) => {
    const p = 80000 + Math.sin(i / 7) * 300 + i;
    return { time: t0 + i * 60000, open: p, high: p + 40, low: p - 35, close: p + (i % 3 - 1) * 20, volume: 5 + i % 4 };
  });
  const footprints = new Map(bars.map(b => [b.time, [
    { price: b.low, buy: 1, sell: 2 }, { price: b.close, buy: 3, sell: 1 }, { price: b.high, buy: 0.5, sell: 0.25 },
  ]]));
  return { bars, footprints };
}

describe("v6 probes", () => {
  it("there are some", () => {
    expect(HARNESSES.length).toBeGreaterThan(0);
  });

  for (const file of HARNESSES) {
    const name = file.replace(/\.pine$/, "");
    const source = readFileSync(join(DIR, file), "utf8");

    describe(name, () => {
      it("is v6", () => {
        expect(source.startsWith("//@version=6\n")).toBe(true);
      });

      if (KNOWN_GAPS[file]) {
        it("still stops on its known engine gap", () => {
          const { bars, footprints } = syntheticBars();
          expect(() => run(source, bars, SYNTHETIC_META, "1", footprints)).toThrow(KNOWN_GAPS[file]);
        });
      } else {
        it("runs here over synthetic bars, one well-formed row per bar", () => {
          const { bars, footprints } = syntheticBars();
          const out = run(source, bars, SYNTHETIC_META, "1", footprints);
          expect(out.meta).toBeDefined();
          expect(out.head.slice(0, 7)).toEqual(["time", "open", "high", "low", "close", "volume", "bar_index"]);
          expect(new Set(out.head).size).toBe(out.head.length);
          expect(out.rows.length).toBe(bars.length);
          for (const r of out.rows) expect(r.length).toBe(out.head.length);
        });
      }

      const logs = FILES.filter(f => f.startsWith(`${name}.`) && f.endsWith(".log"));
      if (logs.length === 0) {
        it.todo("awaiting TradingView's Pine Logs — see the script's header");
        return;
      }

      for (const logFile of logs) {
        describe(logFile, () => {
          const tv = readLog(readFileSync(join(DIR, logFile), "utf8"));
          const tf = logFile.split(".")[2];
          const bars: Bar[] = tv.rows.map(r => ({
            time: Number(r[0]), open: Number(r[1]), high: Number(r[2]), low: Number(r[3]), close: Number(r[4]), volume: Number(r[5]),
          }));
          const fpAt = tv.head.indexOf("fp_rows");
          const footprints = new Map<number, FootprintLevel[]>();
          if (fpAt >= 0) {
            tv.rows.forEach((r, i) => {
              const levels = footprintLevels(r[fpAt]);
              if (levels) footprints.set(bars[i].time, levels);
            });
          }

          it("starts at bar 0, so nothing ran before the log did", () => {
            expect(tv.rows.length).toBeGreaterThan(0);
            expect(tv.rows[0][6]).toBe("0");
          });

          let ours: Run | null = null;
          const engine = () => (ours ??= run(source, bars, tv.meta, tf, footprints));

          it("the engine logs the same columns, and a row per bar", () => {
            expect(engine().head).toEqual(tv.head);
            expect(engine().rows.length).toBe(tv.rows.length);
          });

          for (let c = 6; c < tv.head.length; c++) {
            const column = tv.head[c];
            const skip = WARMUP.find(([re]) => re.test(column))?.[1] ?? 0;
            it(column, () => {
              const wrong: string[] = [];
              tv.rows.forEach((row, i) => {
                if (i < skip || wrong.length >= 5) return;
                const mine = engine().rows[i]?.[c];
                if (mine === undefined || !same(mine, row[c])) wrong.push(`bar ${i}: TradingView ${row[c]}, engine ${mine}`);
              });
              expect(wrong, wrong.join("\n")).toEqual([]);
            });
          }
        });
      }
    });
  }
});
