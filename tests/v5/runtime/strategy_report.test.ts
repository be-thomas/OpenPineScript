/**
 * What a STRATEGY TESTER needs from the engine.
 *
 * TradingView's tester is four tabs — an equity curve, a performance summary
 * split all/long/short, a list of trades, and the backtest properties. The
 * engine reported three numbers (net profit, closed trades, win rate) and a
 * trade record with no bar indices, no excursion and no costs, so a host
 * could not draw the curve, could not fill a single row of the summary, and
 * could not say which bar a trade belonged to.
 */
import { describe, it, expect } from "vitest";
import { Session, runScript } from "../../../runtime/v1/session";

/**
 * A long swing with a short one riding on it, so a moving-average crossover
 * finds both winners and losers. A clean sine wins every trade, which leaves
 * gross loss at zero and every ratio in the summary undefined.
 */
const bars = (n: number) =>
  Array.from({ length: n }, (_, i) => {
    const mid = 100 + Math.sin(i / 23) * 10 + Math.sin(i / 2.7) * 3;
    return {
      time: Date.UTC(2024, 0, 1) + i * 86_400_000,
      open: mid, high: mid + 2, low: mid - 2, close: mid, volume: 1000,
    };
  });

const CROSSOVER = (extra = "") =>
  '//@version=5\n' +
  `strategy("Crossover", overlay = true, initial_capital = 10000${extra})\n` +
  'fast = ta.sma(close, 5)\n' +
  'slow = ta.sma(close, 20)\n' +
  'if ta.crossover(fast, slow)\n' +
  '    strategy.entry("Long", strategy.long)\n' +
  'if ta.crossunder(fast, slow)\n' +
  '    strategy.close("Long")\n';

describe("the trade record", () => {
  const r = runScript(CROSSOVER(), { candles: bars(300) });

  it("takes trades at all", () => {
    expect(r.trades.length).toBeGreaterThan(2);
  });

  it("says which bars each leg landed on", () => {
    for (const t of r.trades) {
      expect(typeof t.entryBarIndex).toBe("number");
      expect(typeof t.exitBarIndex).toBe("number");
      expect(t.exitBarIndex!).toBeGreaterThan(t.entryBarIndex!);
    }
  });

  it("names the order that OPENED the position, not only the one that closed it", () => {
    // `id` is the closing order's comment; without `entryId` the entry row of
    // every trade in the list reads "Close".
    expect(r.trades.every(t => t.entryId === "Long")).toBe(true);
  });

  it("starts each trade's excursion over, reversals included", () => {
    // A reversal goes short straight from long without a flat bar in between,
    // so the position's excursion has to be reset where the position OPENS,
    // not where it happens to be flat at a bar's close.
    const reversing = runScript(
      '//@version=5\n' +
      'strategy("Reversing", initial_capital = 10000)\n' +
      'fast = ta.sma(close, 5)\n' +
      'slow = ta.sma(close, 20)\n' +
      'if ta.crossover(fast, slow)\n' +
      '    strategy.entry("Long", strategy.long)\n' +
      'if ta.crossunder(fast, slow)\n' +
      '    strategy.entry("Short", strategy.short)\n',
      { candles: bars(300) },
    );
    expect(reversing.trades.length).toBeGreaterThan(3);

    // Bounded by the trade's OWN bars: a run-up larger than anything the
    // price did while the position was open can only have come from an
    // earlier trade.
    const candles = bars(300);
    for (const t of reversing.trades) {
      const own = candles.slice(t.entryBarIndex!, t.exitBarIndex! + 1);
      const best = t.direction === "long"
        ? Math.max(...own.map(c => c.high)) - t.entryPrice
        : t.entryPrice - Math.min(...own.map(c => c.low));
      const worst = t.direction === "long"
        ? t.entryPrice - Math.min(...own.map(c => c.low))
        : Math.max(...own.map(c => c.high)) - t.entryPrice;
      expect(t.runup!).toBeLessThanOrEqual(Math.max(best, 0) * t.qty + 1e-6);
      expect(t.drawdown!).toBeLessThanOrEqual(Math.max(worst, 0) * t.qty + 1e-6);
    }
  });

  it("reports excursion that brackets the realised result", () => {
    for (const t of r.trades) {
      expect(t.runup!).toBeGreaterThanOrEqual(0);
      expect(t.drawdown!).toBeGreaterThanOrEqual(0);
      // A trade cannot have made more than its best moment, nor lost more
      // than its worst.
      expect(t.pnl).toBeLessThanOrEqual(t.runup! + 1e-9);
      expect(t.pnl).toBeGreaterThanOrEqual(-t.drawdown! - 1e-9);
    }
  });
});

describe("the equity curve", () => {
  const r = runScript(CROSSOVER(), { candles: bars(300) });

  it("has one point per bar, timestamped", () => {
    expect(r.equity.length).toBe(300);
    expect(r.equity[0].time).toBe(Date.UTC(2024, 0, 1));
  });

  it("starts at the declared capital", () => {
    expect(r.equity[0].equity).toBe(10000);
  });

  it("separates the open position's mark-to-market from realised cash", () => {
    // Flat bars carry no open P&L; at least one bar must be in the market.
    expect(r.equity.some(p => p.openPL !== 0)).toBe(true);
    expect(r.equity.every(p => p.openPL === 0 || Number.isFinite(p.openPL))).toBe(true);
  });

  it("ends where net profit says it should", () => {
    const last = r.equity[r.equity.length - 1];
    const realised = r.trades.reduce((a, t) => a + t.pnl, 0);
    expect(last.equity - last.openPL).toBeCloseTo(10000 + realised, 6);
  });

  it("is empty for a study, which never holds a position", () => {
    const study = runScript('//@version=5\nindicator("i")\nplot(close)\n', { candles: bars(50) });
    expect(study.equity).toEqual([]);
    expect(study.performance).toBeNull();
  });
});

describe("strategy.equity, which the equity curve is sampled from", () => {
  // `strategy()` is a statement in the script body, so it runs on every bar.
  // Seeding `cash` there re-handed the balance to the broker after every
  // trade, which pinned `strategy.equity` to `initial_capital + openProfit`
  // for the whole run — it ignored every closed trade. The equity curve is
  // what made it visible; this is the builtin it was wrong in.
  const source =
    '//@version=5\n' +
    'strategy("Equity", initial_capital = 10000)\n' +
    'fast = ta.sma(close, 5)\n' +
    'slow = ta.sma(close, 20)\n' +
    'if ta.crossover(fast, slow)\n' +
    '    strategy.entry("Long", strategy.long)\n' +
    'if ta.crossunder(fast, slow)\n' +
    '    strategy.close("Long")\n' +
    'plot(strategy.equity, "equity")\n' +
    'plot(strategy.netprofit, "net")\n';

  const r = runScript(source, { candles: bars(300) });
  const seriesNamed = (title: string) =>
    r.series.find(s => s.title === title)!.data.map(p => (p as any)?.value ?? null);

  it("moves with realised profit, not only with the open position", () => {
    const equity = seriesNamed("equity");
    const distinct = new Set(equity.filter(v => v !== null).map(v => v!.toFixed(4)));
    expect(distinct.size).toBeGreaterThan(1);
    // It ends at capital + everything the strategy realised + whatever the
    // position still open is worth. The strategy is in the market on the last
    // bar here, so leaving the open leg out is what the OLD behaviour looked
    // like from the other direction.
    const realised = r.trades.reduce((a, t) => a + t.pnl, 0);
    const open = r.performance!.openPL;
    expect(open).not.toBe(0);
    expect(equity[equity.length - 1]!).toBeCloseTo(10000 + realised + open, 6);
  });

  it("agrees with strategy.netprofit on every flat bar", () => {
    const equity = seriesNamed("equity");
    const net = seriesNamed("net");
    for (let i = 0; i < equity.length; i++) {
      if (equity[i] === null || net[i] === null) continue;
      // While flat there is no unrealized component, so the two differ by
      // exactly the starting capital.
      if (r.equity[i] && r.equity[i].openPL === 0) {
        expect(equity[i]!).toBeCloseTo(10000 + net[i]!, 6);
      }
    }
  });
});

describe("the performance summary", () => {
  const r = runScript(CROSSOVER(), { candles: bars(300) });
  const p = r.performance!;

  it("splits every figure all / long / short", () => {
    expect(p.all.closedTrades).toBe(r.trades.length);
    expect(p.long.closedTrades + p.short.closedTrades).toBe(p.all.closedTrades);
  });

  it("finds both winners and losers, so the ratios below mean something", () => {
    expect(p.all.winningTrades).toBeGreaterThan(0);
    expect(p.all.losingTrades).toBeGreaterThan(0);
  });

  it("defines profit factor as gross profit over gross loss", () => {
    expect(p.all.profitFactor).toBeCloseTo(p.all.grossProfit / p.all.grossLoss, 9);
  });

  it("defines net profit as gross profit less gross loss", () => {
    expect(p.all.netProfit).toBeCloseTo(p.all.grossProfit - p.all.grossLoss, 6);
  });

  it("counts winners and losers to the closed total", () => {
    expect(p.all.winningTrades + p.all.losingTrades + p.all.evenTrades).toBe(p.all.closedTrades);
    expect(p.all.percentProfitable).toBeCloseTo((p.all.winningTrades / p.all.closedTrades) * 100, 9);
  });

  it("measures drawdown as a peak-to-trough decline, so it is never negative", () => {
    expect(p.all.maxDrawdown).toBeGreaterThanOrEqual(0);
    expect(p.all.maxRunup).toBeGreaterThanOrEqual(0);
  });

  it("reports the account-level figures once, not per side", () => {
    expect(p.initialCapital).toBe(10000);
    expect(p.maxContractsHeld).toBeGreaterThan(0);
    expect(Number.isFinite(p.buyHoldReturn)).toBe(true);
  });

  it("leaves a ratio with no denominator undefined rather than infinite", () => {
    const flat = runScript(
      '//@version=5\nstrategy("Never trades")\nplot(close)\n',
      { candles: bars(50) },
    ).performance!;
    expect(flat.all.closedTrades).toBe(0);
    expect(Number.isNaN(flat.all.profitFactor)).toBe(true);
    expect(Number.isNaN(flat.all.percentProfitable)).toBe(true);
  });
});

describe("costs", () => {
  const free = runScript(CROSSOVER(), { candles: bars(300) });

  it("charges nothing when the script declares nothing", () => {
    expect(free.performance!.all.commissionPaid).toBe(0);
    expect(free.trades.every(t => t.commission === 0)).toBe(true);
  });

  it("charges a percentage of each leg's cash volume", () => {
    const paid = runScript(
      CROSSOVER(', commission_type = strategy.commission.percent, commission_value = 0.1'),
      { candles: bars(300) },
    );
    const t = paid.trades[0];
    const expected = (t.entryPrice * t.qty + t.exitPrice * t.qty) * 0.001;
    expect(t.commission!).toBeCloseTo(expected, 6);
    expect(paid.performance!.all.commissionPaid).toBeGreaterThan(0);
  });

  it("deducts commission from the P&L rather than reporting it alongside", () => {
    const paid = runScript(
      CROSSOVER(', commission_type = strategy.commission.cash_per_order, commission_value = 5'),
      { candles: bars(300) },
    );
    // Two orders a round turn.
    expect(paid.trades[0].commission).toBe(10);
    expect(paid.trades[0].pnl).toBeCloseTo(free.trades[0].pnl - 10, 6);
  });

  it("fills a buy higher and a sell lower by the declared slippage", () => {
    const slipped = runScript(CROSSOVER(', slippage = 10'), { candles: bars(300) });
    // mintick defaults to 0.01, so ten ticks is 0.10 against the order.
    expect(slipped.trades[0].entryPrice).toBeCloseTo(free.trades[0].entryPrice + 0.1, 6);
    expect(slipped.trades[0].exitPrice).toBeCloseTo(free.trades[0].exitPrice - 0.1, 6);
  });
});

describe("order size", () => {
  const sized = (declaration: string) => runScript(
    '//@version=5\n' +
    `strategy("Sized", initial_capital = 10000${declaration})\n` +
    'fast = ta.sma(close, 5)\n' +
    'slow = ta.sma(close, 20)\n' +
    'if ta.crossover(fast, slow)\n' +
    '    strategy.entry("Long", strategy.long)\n' +
    'if ta.crossunder(fast, slow)\n' +
    '    strategy.close("Long")\n',
    { candles: bars(300) },
  );

  it("is one contract when the script declares nothing", () => {
    expect(sized("").trades.every(t => t.qty === 1)).toBe(true);
  });

  it("honours a fixed size", () => {
    const r = sized(', default_qty_type = strategy.fixed, default_qty_value = 7');
    expect(r.trades.every(t => t.qty === 7)).toBe(true);
  });

  it("turns a cash amount into contracts at the fill price", () => {
    const r = sized(', default_qty_type = strategy.cash, default_qty_value = 5000');
    for (const t of r.trades) expect(t.qty).toBeCloseTo(5000 / t.entryPrice, 6);
  });

  it("sizes a percentage against the equity at the fill", () => {
    const r = sized(', default_qty_type = strategy.percent_of_equity, default_qty_value = 50');
    // Half the account, so the first trade's notional is about half of the
    // starting capital — and every later one moves with the equity.
    const first = r.trades[0];
    expect(first.qty * first.entryPrice).toBeCloseTo(10000 * 0.5, 2);
    expect(new Set(r.trades.map(t => t.qty.toFixed(6))).size).toBeGreaterThan(1);
  });

  it("still lets an explicit qty win", () => {
    const r = runScript(
      '//@version=5\n' +
      'strategy("Explicit", initial_capital = 10000, default_qty_value = 7)\n' +
      'fast = ta.sma(close, 5)\n' +
      'slow = ta.sma(close, 20)\n' +
      'if ta.crossover(fast, slow)\n' +
      '    strategy.entry("Long", strategy.long, qty = 2)\n' +
      'if ta.crossunder(fast, slow)\n' +
      '    strategy.close("Long")\n',
      { candles: bars(300) },
    );
    expect(r.trades.every(t => t.qty === 2)).toBe(true);
  });
});

describe("the properties panel", () => {
  const s = new Session();
  const compiled = s.compile(CROSSOVER(', commission_value = 0.25, slippage = 3'));
  const by = (k: string) => compiled.properties.find(p => p.key === k)!;

  it("offers every backtest setting the broker acts on", () => {
    for (const key of [
      "initial_capital", "default_qty_type", "default_qty_value", "pyramiding",
      "commission_type", "commission_value", "slippage", "risk_free_rate",
    ]) {
      expect(by(key), key).toBeTruthy();
    }
  });

  it("offers no control for a setting the broker ignores", () => {
    // Margin is recorded on the meta, because a host may want to show it —
    // but nothing enforces it, there are no margin calls, and a slider that
    // changes no number in the report is worse than no slider.
    expect(compiled.properties.some(p => p.key.startsWith("margin_"))).toBe(false);
    expect(compiled.meta!.margin_long).toBe(100);
  });

  it("reports what the script declared, so a reset button has something to restore", () => {
    expect(by("commission_value").declared).toBe(0.25);
    expect(by("slippage").declared).toBe(3);
  });

  it("describes a choice as a choice", () => {
    expect(by("commission_type").type).toBe("string");
    expect(by("commission_type").options).toContain("commission.cash_per_order");
  });

  it("lets a host override a cost without editing the script", () => {
    const over = new Session();
    over.setProperties({ commission_value: 0 });
    over.compile(CROSSOVER(', commission_value = 0.25'));
    const r = over.runHistory(bars(300));
    expect(r.performance!.all.commissionPaid).toBe(0);
  });

  it("gives a study no properties to change", () => {
    expect(new Session().compile('//@version=5\nindicator("i")\nplot(close)\n').properties).toEqual([]);
  });
});

describe("the open position carries the time it opened", () => {
    // A host has to PLACE the still-open position on a chart, and a bar index
    // cannot be placed: the chart's bar list grows as older bars page in, so
    // index 40 names a different bar after a scroll. Without this the only
    // thing the renderer could do was draw the open entry on the last bar.
    it("stamps entryTime at the fill, not at the end of the run", () => {
        const r = runScript(
            `//@version=5
strategy("Still in")
if bar_index == 10
    strategy.entry("Long", strategy.long)
`,
            { candles: bars(40) },
        );
        expect(r.position.size).toBeGreaterThan(0);
        expect(r.position.entryBarIndex).toBe(11); // fills on the next bar's open
        expect(r.position.entryTime).toBe(Date.UTC(2024, 0, 1) + r.position.entryBarIndex! * 86_400_000);
        expect(r.position.entryId).toBe("Long");
    });

    it("clears it when the position closes", () => {
        const r = runScript(
            `//@version=5
strategy("In and out")
if bar_index == 10
    strategy.entry("Long", strategy.long)
if bar_index == 20
    strategy.close("Long")
`,
            { candles: bars(40) },
        );
        expect(r.position.size).toBe(0);
        expect(r.position.entryTime).toBeUndefined();
    });
});
