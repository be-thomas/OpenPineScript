/**
 * A strategy's result must survive `structuredClone`, which is what a host's
 * `postMessage` does with it.
 *
 * A `string` variable reaches `strategy.entry` as its Series, and a Series
 * holds the runtime (`ctx.__sandbox`, full of functions). The broker recorded
 * it as the order id, so every closed trade carried the whole runtime and the
 * host got "Function object could not be cloned" instead of a result.
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { Session } from "../../../runtime/v1/session";

const ROOT = path.resolve(__dirname, "../../..");

const bars = Array.from({ length: 40 }, (_, i) => ({
  time: Date.UTC(2024, 0, 1) + i * 86_400_000,
  open: 100, high: 105, low: 95, close: 100, volume: 1000,
}));

function run(src: string, candles: any[] = bars) {
  const s = new Session();
  const c = s.compile(src);
  expect(c.errors).toEqual([]);
  return s.runHistory(candles);
}

describe("order ids held in variables", () => {
  const head = '//@version=5\nstrategy("S", overlay = true)\n';

  it("clone: a `string` variable id, for entry, exit and close", () => {
    const r = run(head +
      'string tradeId = "Long_" + str.tostring(bar_index)\n' +
      'if bar_index == 5\n    strategy.entry(tradeId, strategy.long, comment = tradeId, alert_message = tradeId)\n' +
      // Bar 8 is where this exit is placed; its id is a variable too. The
      // limit sits above every high, so it never fills and `close` ends the trade.
      'if bar_index == 8\n    strategy.exit(tradeId + "_exit", from_entry = "Long_5", limit = 130, comment = tradeId)\n' +
      'if bar_index == 12\n    strategy.close("Long_5", comment = tradeId)\n');
    expect(r.errors).toEqual([]);
    expect(() => structuredClone(r)).not.toThrow();
    expect(r.trades).toHaveLength(1);
    expect(r.trades[0].entryId).toBe("Long_5");
    expect(r.trades[0].exitComment).toBe("Long_12");
  });

  it("clone: an exit whose id and from_entry are variables fills under those names", () => {
    const r = run(head +
      'var string entryId = "Buy"\nvar string exitId = "Sell"\n' +
      'if bar_index == 5\n    strategy.entry(entryId, strategy.long)\n' +
      // limit 102 is inside the 95..105 range, so it fills the bar after it is placed.
      'if bar_index == 6\n    strategy.exit(exitId, from_entry = entryId, limit = 102)\n');
    expect(r.errors).toEqual([]);
    expect(() => structuredClone(r)).not.toThrow();
    expect(r.trades).toHaveLength(1);
    expect(r.trades[0].entryId).toBe("Buy");
    expect(r.trades[0].id).toBe("Exit Sell");
  });

  it("clone: a `var string` constant id, for order and close_all", () => {
    const r = run(head +
      'var string K = "Const"\n' +
      'if bar_index == 14\n    strategy.order(K, strategy.long, 1)\n' +
      'if bar_index == 18\n    strategy.close_all(comment = K)\n');
    expect(r.errors).toEqual([]);
    expect(() => structuredClone(r)).not.toThrow();
    expect(r.trades).toHaveLength(1);
    expect(r.trades[0].entryId).toBe("Const");
    expect(r.trades[0].exitComment).toBe("Const");
  });

  it("clone: a variable id passed to strategy.close with a variable comment", () => {
    const r = run(head +
      'var string K = "Const"\n' +
      'if bar_index == 3\n    strategy.entry(K, strategy.short)\n' +
      'if bar_index == 9\n    strategy.close(K, comment = K)\n');
    expect(r.errors).toEqual([]);
    expect(() => structuredClone(r)).not.toThrow();
    expect(r.trades).toHaveLength(1);
    expect(r.trades[0].entryId).toBe("Const");
    expect(r.trades[0].direction).toBe("short");
  });
});

describe("every strategy in the corpus", () => {
  // The guard against the whole class: a value recorded by the broker that
  // is not a primitive fails here whichever script produced it.
  const dataset = fs
    .readFileSync(path.join(ROOT, "mock_data/common/AAPL_mock.csv"), "utf8")
    .trim().split("\n").slice(1, 301)
    .map(line => {
      const f = line.split(",");
      return { time: +new Date(f[0]), open: +f[1], high: +f[2], low: +f[3], close: +f[4], volume: +f[5] };
    });

  const files: string[] = [];
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".pine") && /^\s*strategy\s*\(/m.test(fs.readFileSync(p, "utf8"))) files.push(p);
    }
  };
  walk(path.join(ROOT, "examples"));
  walk(path.join(ROOT, "conformance"));

  it("finds the corpus strategies", () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it("produces a result structuredClone accepts, for each one that runs", () => {
    let ran = 0, traded = 0;
    const failures: string[] = [];
    for (const f of files) {
      const s = new Session();
      if (s.compile(fs.readFileSync(f, "utf8")).errors.length) continue;
      const r = s.runHistory(dataset);
      ran++;
      if (r.trades.length) traded++;
      try { structuredClone(r); }
      catch (e: any) { failures.push(`${path.relative(ROOT, f)}: ${String(e?.message).slice(0, 80)}`); }
    }
    expect(failures).toEqual([]);
    expect(ran).toBeGreaterThan(30);
    expect(traded).toBeGreaterThan(10);
  });
});
