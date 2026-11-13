/**
 * v6's margin model — MG §"Default margin percentage", with the formula from
 * the Strategies page's "Margin" section.
 */
import { describe, it, expect } from "vitest";
import { compileScript } from "../../../transpiler/common";
import { compile, Context } from "../../../runtime/v6";
import { marginCallSize } from "../../../runtime/v1/broker";

interface Bar { o: number; h: number; l: number; c: number }

function run(src: string, bars: Bar[]) {
  const compiled = compileScript(src);
  const ctx = new Context(compiled.profile);
  ctx.mintick = 0.01;
  const exec = compile(compiled.js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
  bars.forEach((b, i) => {
    ctx.setBar(i * 86400000, b.o, b.h, b.l, b.c, 10);
    exec();
    ctx.finalizeBar();
  });
  return ctx;
}

const flat = (n: number, p = 100): Bar[] => Array.from({ length: n }, () => ({ o: p, h: p, l: p, c: p }));

describe("the documented margin-call formula", () => {
  it("reproduces the Strategies page's worked example exactly", () => {
    // TSLA, 25% margin: 682,438 shares bought at 4.43, price 3.9, equity
    // 638,307.86 — so Initial Capital + Net Profit is 1,000,000. The page:
    // "Cover amount: TRUNCATE(−27,763.27) = −27,763", "Margin call size:
    // −27,763 × 4 = −111,052".
    expect(marginCallSize(1_000_000, 682_438, 4.43, 3.9, 0.25)).toBe(111_052);
  });

  it("is 0 while available funds are not negative", () => {
    expect(marginCallSize(1_000_000, 682_438, 4.43, 4.43, 0.25)).toBe(0);
  });

  it("a fully funded long at 100% margin is never called", () => {
    // Available = cash - qty * entry, which the entry check keeps >= 0.
    expect(marginCallSize(1000, 10, 100, 1, 1)).toBe(0);
  });

  it("a short at 100% margin is — the page: 'even at 100% margin'", () => {
    expect(marginCallSize(1000, -10, 100, 150, 1)).toBeGreaterThan(0);
  });
});

describe("entries exceeding available funds are blocked", () => {
  const BUY20 = (v: number, extra = "") =>
    `//@version=${v}\nstrategy("t", initial_capital = 1000${extra})\n` +
    'if bar_index == 0\n    strategy.entry("L", strategy.long, qty = 20)\n';

  it("v6 blocks a 2000 order on 1000 of capital at the default 100% margin", () => {
    expect(run(BUY20(6), flat(3)).position.size).toBe(0);
  });

  it("v5 fills it, as it always has", () => {
    expect(run(BUY20(5), flat(3)).position.size).toBe(20);
  });

  it("margin_long = 0 restores the v5 behaviour — the guide's own fix", () => {
    expect(run(BUY20(6, ", margin_long = 0"), flat(3)).position.size).toBe(20);
  });

  it("50% margin funds it", () => {
    expect(run(BUY20(6, ", margin_long = 50"), flat(3)).position.size).toBe(20);
  });

  it("an order the account can carry still fills", () => {
    const src = '//@version=6\nstrategy("t", initial_capital = 1000)\n' +
      'if bar_index == 0\n    strategy.entry("L", strategy.long, qty = 10)\n';
    expect(run(src, flat(3)).position.size).toBe(10);
  });
});

describe("shorts are margin-called on a sharp rise", () => {
  // Short 10 at 100 on 1000 of capital — exactly fundable at 100% margin.
  // Then a bar reaching 150: equity 1000 + (100 - 150) * 10 = 500, margin
  // 10 * 150 = 1500, available -1000, so the call size is
  // |TRUNCATE(-1000 / 150)| * 4 = 24, capped at the 10 held.
  const SHORT = (v: number) =>
    `//@version=${v}\nstrategy("t", initial_capital = 1000)\n` +
    'if bar_index == 0\n    strategy.entry("S", strategy.short, qty = 10)\n';
  const SPIKE: Bar[] = [...flat(2), { o: 100, h: 150, l: 100, c: 120 }, ...flat(1, 120)];

  it("v6 liquidates, under 'Margin call', at the bar's high", () => {
    const ctx = run(SHORT(6), SPIKE);
    expect(ctx.position.size).toBe(0);
    const call = ctx.trades.find(t => t.id === "Margin call");
    expect(call, JSON.stringify(ctx.trades)).toBeDefined();
    expect(call!.exitPrice).toBeCloseTo(150, 8);
  });

  it("v5 holds the short through it", () => {
    const ctx = run(SHORT(5), SPIKE);
    expect(ctx.position.size).toBe(-10);
    expect(ctx.trades.length).toBe(0);
  });

  it("a partial call leaves the rest of the position open", () => {
    // 100 short at 100 on 10,000 at 100% margin, high 105: equity 9,500,
    // margin 10,500, available -1,000, cover TRUNCATE(-1000 / 105) = -9,
    // size 36 of the 100 held.
    const src = '//@version=6\nstrategy("t", initial_capital = 10000)\n' +
      'if bar_index == 0\n    strategy.entry("S", strategy.short, qty = 100)\n';
    const ctx = run(src, [...flat(2), { o: 100, h: 105, l: 100, c: 100 }, ...flat(1)]);
    expect(ctx.position.size).toBe(-64);
    expect(ctx.trades.find(t => t.id === "Margin call")!.qty).toBe(36);
  });
});

describe("the margin call on a live bar", () => {
  it("fires again on a re-tick after the rollback undid it", () => {
    const src = '//@version=6\nstrategy("t", initial_capital = 1000)\n' +
      'if bar_index == 0\n    strategy.entry("S", strategy.short, qty = 10)\n';
    const compiled = compileScript(src);
    const ctx = new Context(compiled.profile);
    ctx.mintick = 0.01;
    const exec = compile(compiled.js.replace(/\blet\b/g, "var "), ctx, Object.create(null));
    for (let i = 0; i < 2; i++) { ctx.setBar(i * 86400000, 100, 100, 100, 100, 10); exec(); ctx.finalizeBar(); }
    expect(ctx.position.size).toBe(-10);

    // Two ticks of the forming bar, both through the spike. The second rolls
    // the first back — including its margin call — and must call it again.
    ctx.currentBarIndex = 2;
    ctx.applyTick(2 * 86400000, 100, 150, 100, 140, 10); exec();
    expect(ctx.position.size, "first tick").toBe(0);
    ctx.applyTick(2 * 86400000, 100, 150, 100, 145, 10); exec();
    expect(ctx.position.size, "second tick, after the rollback").toBe(0);
    expect(ctx.trades.filter(t => t.id === "Margin call").length).toBe(1);
  });
});
