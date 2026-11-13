/**
 * Whatever mix of entries, exits and closes a script throws at the broker, the
 * position it is left holding must agree with the entries behind it, and money
 * must be neither made nor lost by the bookkeeping:
 *
 *   - size is the sum of the open entries' sizes;
 *   - the average price is their size-weighted average;
 *   - net profit equals the closed trades' P&L plus the open P&L at the last
 *     price, which here is read from the trade list and the open entries, not
 *     from the broker's own running totals.
 *
 * Below v6 a partial `strategy.exit` booked at the average price and shrank the
 * oldest entries, so a later `strategy.close(id)` (which books entry by entry)
 * found the entries and the average out of step.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

// Small deterministic generator: a test that failed once must fail again.
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const N = 48;

function bars(rand: () => number) {
  let p = 100;
  return Array.from({ length: N }, (_, i) => {
    const open = p;
    const close = Math.max(20, open + (rand() - 0.5) * 8);
    const high = Math.max(open, close) + rand() * 3;
    const low = Math.min(open, close) - rand() * 3;
    p = close;
    return { time: Date.UTC(2024, 0, 1) + i * 86_400_000, open, high, low, close, volume: 1 };
  });
}

function script(version: number, pyramiding: number, rand: () => number) {
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)];
  const lines: string[] = [];
  const ids = ["A", "B", "C"];
  for (let bar = 1; bar < N - 2; bar++) {
    const r = rand();
    let op = "";
    const id = pick(ids);
    const qty = pick([1, 2, 3]);
    if (r < 0.30) op = `strategy.entry("${id}", ${rand() < 0.85 ? "strategy.long" : "strategy.short"}, qty = ${qty})`;
    else if (r < 0.37) op = `strategy.entry("${id}", strategy.long, qty = ${qty}, stop = close + ${pick([1, 3])})`;
    else if (r < 0.50) op = `strategy.exit("x${pick([1, 2])}", limit = close + ${pick([1, 2, 4])})`;
    else if (r < 0.58) op = `strategy.exit("x${pick([1, 2])}", from_entry = "${id}", qty = ${pick([1, 2])}, limit = close + ${pick([1, 2, 4])})`;
    else if (r < 0.64) op = `strategy.exit("x${pick([1, 2])}", from_entry = "${id}", qty_percent = ${pick([25, 50, 100])}, stop = close - ${pick([1, 3])})`;
    else if (r < 0.69) op = `strategy.exit("x${pick([1, 2])}", qty_percent = ${pick([30, 50])}, limit = close + ${pick([1, 2])}, stop = close - ${pick([2, 5])})`;
    else if (r < 0.82) op = `strategy.close("${id}")`;
    else if (r < 0.88) op = `strategy.close("${id}", qty = 1)`;
    else if (r < 0.91) op = `strategy.close_all()`;
    if (op) lines.push(`if bar_index == ${bar}`, `    ${op}`);
  }
  const src = `//@version=${version}
strategy("S", pyramiding = ${pyramiding}, initial_capital = 100000)
${lines.join("\n")}
plot(strategy.netprofit, "np")
plot(strategy.openprofit, "op")
`;
  // v1-v3 spell the bar counter `n`; the broker is the same.
  return version < 4 ? src.replace(/bar_index/g, "n") : src;
}

describe.each([3, 4, 5, 6])("exit / close / close_all mixes at v%i", (version) => {
  describe.each([1, 2, 3])("pyramiding = %i", (pyramiding) => {
    it("leaves a position that matches its entries, and conserves profit", () => {
      let closedTrades = 0;
      for (let seed = 1; seed <= 8; seed++) {
        const rand = rng(seed * 7919 + version * 131 + pyramiding);
        const data = bars(rand);
        const src = script(version, pyramiding, rand);
        const s = new Session();
        const c = s.compile(src);
        expect(c.errors, src).toEqual([]);
        const r = s.runHistory(data);
        expect(r.errors, `seed ${seed}\n${src}`).toEqual([]);

        const entries: any[] = r.position.entries ?? [];
        const held = entries.reduce((a, e) => a + e.qty, 0);
        const label = `seed ${seed}\n${src}`;
        if (held === 0) {
          expect(r.position.size, label).toBe(0);
        } else {
          expect(Math.abs(r.position.size), label).toBeCloseTo(held, 8);
          const avg = entries.reduce((a, e) => a + e.price * e.qty, 0) / held;
          expect(r.position.avgPrice, label).toBeCloseTo(avg, 8);
        }

        // Closed-trade P&L (no commission is charged) + open P&L at the last close.
        const last = data[data.length - 1].close;
        closedTrades += r.trades.length;
        const closed = r.trades.reduce((a: number, t: any) => a + t.pnl, 0);
        const dir = r.position.size > 0 ? 1 : -1;
        const open = entries.reduce((a, e) => a + dir * (last - e.price) * e.qty, 0);
        const at = (title: string) => r.series.find((x: any) => x.title === title)!.data[N - 1]?.value ?? 0;
        expect(at("np") + at("op"), label).toBeCloseTo(closed + open, 6);
      }
      // the mixes must actually trade, or the invariants prove nothing
      expect(closedTrades).toBeGreaterThan(40);
    });
  });
});
