/**
 * runtime/v1/broker/index.ts
 *
 * One broker class per Pine version, each extending the one below it — the
 * same chain the transpilers use (`V2ToJsVisitor extends V1ToJsVisitor`, and
 * so on) and the same chain the version runtimes express as re-exports.
 *
 * ── Why four of these are empty ───────────────────────────────────────────
 *
 * Because TradingView changed nothing. The v2→v3, v3→v4 and v4→v5 migration
 * guides document no change to order fills, trade calculation or the broker
 * emulator; every strategy delta in them is compile-time API shape or a
 * general language rule, and all of those are already implemented in the
 * transpiler and the registry.
 *
 * An empty subclass is the same kind of statement `runtime/v3/index.ts` makes
 * by being one re-export line: it records that the question was asked and the
 * answer was "nothing", and it gives the next version-specific behaviour an
 * obvious place to land. Deleting them would save five lines and lose that.
 */
import type { Context } from "../context";
import { Broker } from "./Broker";

/**
 * The documented margin-call size, in contracts, or 0 when no call is due.
 * Pure, so the Strategies page's worked example can be checked against it
 * digit for digit. `cash` is Initial Capital + Net Profit; `size` is signed.
 */
export function marginCallSize(
    cash: number, size: number, avgPrice: number, price: number, ratio: number,
    minContract: number = 1,
): number {
    if (size === 0 || ratio <= 0 || !(price > 0)) return 0;
    const qty = Math.abs(size);
    const mvs = qty * price;
    const moneySpent = qty * avgPrice;
    const openProfit = (mvs - moneySpent) * (size < 0 ? -1 : 1);
    const equity = cash + openProfit;
    const available = equity - mvs * ratio;
    if (available >= 0) return 0;
    const loss = available / ratio;
    // "TRUNCATE ... to the same decimal precision as the instrument's
    // minimum position size" — whole shares for a stock, four decimals for a
    // 0.0001 BTC minimum. Truncating crypto to whole contracts made every
    // fractional call 0, so nothing was ever liquidated.
    const scale = 10 ** decimalsOf(minContract);
    const cover = Math.trunc((loss / price) * scale) / scale;
    // A shortfall too small to survive the truncation still calls ONE
    // contract. TradingView's log: a short of 1.203 whose funds fell 0.24
    // short (0.000003 BTC, 0 at five decimals) lost exactly 1, where every
    // larger shortfall in the same log is cover * 4 to the digit
    // (conformance/v6/golden/harness_v6_strategy, bar 3429).
    if (cover === 0) return 1;
    return Math.abs(cover * 4);
}

/** How many decimal places `x` carries: 1 → 0, 0.5 → 1, 0.25 → 2, 0.0001 → 4. */
function decimalsOf(x: number): number {
    if (!(x > 0)) return 0;
    let d = 0;
    while (d < 12 && Math.abs(Math.round(x * 10 ** d) - x * 10 ** d) > 1e-9) d++;
    return d;
}

/**
 * v1 to v5 share ONE broker, `Broker`. TradingView's own migration guides list
 * no fill, trade or emulator change between them:
 *   - https://www.tradingview.com/pine-script-docs/migration-guides/to-pine-version-3/
 *     no strategy or broker changes (the `security` lookahead default flips,
 *     which is profile data);
 *   - https://www.tradingview.com/pine-script-docs/migration-guides/to-pine-version-4/
 *     renamed built-ins and `na` typing only;
 *   - https://www.tradingview.com/pine-script-docs/migration-guides/to-pine-version-5/
 *     compile-time checks only: a `strategy.exit()` must use profit, limit,
 *     loss, stop or a trail pair; `strategy.long` cannot be passed to `when`;
 *     `long` became `direction`.
 * So these classes are empty on purpose: they record that the question was
 * asked and the answer was "nothing", and give a version-specific difference an
 * obvious place to land.
 */
export class V2Broker extends Broker {}
export class V3Broker extends V2Broker {}
export class V4Broker extends V3Broker {
    // TradingView evidence on v4 (dev-docs/tv-parity/_probes/version-scope/v4-sizing and the
    // Adaptive Momentum Test run in ENGINE-BUGS.md bug 8), v5 (_probes/v5-sizing) and v6; v2/v3 have
    // none and keep the old sizing.
    protected override floorsToMinContract(): boolean { return true; }
    protected override sizesWithCommissionRoom(): boolean { return true; }
}
export class V5Broker extends V4Broker {
    // v5 inherits v4's sizing rules (_probes/v5-sizing).
    /**
     * `strategy.risk.max_drawdown` on TradingView (v5, BINANCE:BTCUSDT 1h; dev-docs/tv-parity/
     * _probes/risk-drawdown/run-20261113-044227): the drawdown is measured on REALIZED equity
     * (cash: initial capital plus closed trades), not open equity.
     * A long held through a 3.1% open-equity drawdown (bar close 2026-01-18 23:00) was not closed
     * until its scheduled exit, and after the closed-trade drawdown passed 3% (trade 44) the
     * strategy never traded again. v6 inherits it (its broker takes v5's rules); no v1-v4 evidence.
     */
    protected override drawdownEquity(): number { return this.ctx.cash; }
}

/**
 * v6 — the first version whose broker differs.
 *
 * MG §"strategy.exit() evaluates parameter pairs": "When both absolute (limit,
 * stop) and relative (profit, loss) parameters are given, the absolute ones
 * always win" in v5; in v6 "both levels are evaluated, and the one the price
 * hits first is used". Price reaches whichever level is NEARER the entry first,
 * so that is the one kept:
 *
 *                     long          short
 *     take-profit     lower         higher       (favourable side)
 *     stop-loss       higher        lower        (adverse side)
 *     trail start     lower         higher       (favourable side)
 *
 * The guide's own example is the sharpest check: `profit = 0, loss = 0`
 * beside 2×ATR `limit`/`stop` exits immediately at the entry price in v6,
 * because a zero distance is nearer than any ATR.
 *
 * It also enforces MARGIN, which no earlier broker does — see the section
 * below.
 *
 * The guide's remaining strategy change, trimming beyond 9000 trades, is NOT
 * here: it changes what the per-trade accessors report, not what the broker
 * does, so it is profile data read by runtime/v1/stdlib/trades.ts.
 */
export class V6Broker extends V5Broker {
    /**
     * v6's pyr0, pyr3 and pooc logs are row for row those of v5, so it takes
     * the same rules. Only the trailing stop differs: v6's own golden
     * (harness_v6_strategy) has it follow the bar's highs intrabar.
     */
    /**
     * MG §"Excess orders are trimmed": past 9000 orders "v5 raises a runtime
     * error and halts" and v6 trims the oldest and continues
     * (https://www.tradingview.com/pine-script-docs/migration-guides/to-pine-version-6/).
     */
    protected override haltsAtOrderLimit(): boolean {
        return false;
    }

    protected override floorsToMinContract(): boolean { return true; }
    protected override sizesWithCommissionRoom(): boolean { return true; }
    protected override roundsCommissionTo8(): boolean { return true; }

    /** Market and limit entries are sized at their order price (see `Broker.sizesAtOrderPrice`). */
    protected override sizesAtOrderPrice(): boolean {
        return true;
    }

    // ── Margin ────────────────────────────────────────────────────────────
    //
    // MG §"Default margin percentage": "v5: margin_long and margin_short
    // default to 0, so there are no margin checks and no margin calls. v6:
    // Both default to 100. Entries exceeding available funds are blocked, and
    // shorts can be margin-called."
    //
    // The 100 default is already what `strategy()` records when a script says
    // nothing (runtime/v1/context.ts), so this class only has to ENFORCE it.
    // No earlier broker enforces margin at all — including for a v5 script that
    // sets it explicitly, which TradingView would margin-call. That is a v5 gap
    // this deliberately leaves alone.

    /**
     * "Entries exceeding available funds are blocked." An entry needs
     * `qty * price * marginRatio` of available funds: equity, less the margin
     * a same-direction position already ties up. An opposite position is about
     * to be closed by this entry, so it ties up nothing.
     */
    protected override admitsEntry(isLong: boolean, qty: number, price: number): boolean {
        const ratio = this.marginRatio(isLong);
        if (ratio === 0) return true;
        const pos = this.ctx.position;
        const equity = this.ctx.cash + (pos.size !== 0 ? (price - pos.avgPrice) * pos.size : 0);
        const sameDirection = pos.size !== 0 && (pos.size > 0) === isLong;
        const held = sameDirection ? Math.abs(pos.size) * price * ratio : 0;
        // A hair of tolerance, so 100% of equity at 100% margin is fundable
        // despite floating-point dust in the qty that was computed from it.
        return qty * price * ratio <= equity - held + 1e-9 * Math.max(1, equity);
    }

    override processPendingOrders(high: number, low: number): void {
        // The base runs once per bar, guarded by `_ordersProcessedBar`, which
        // Context.forgetBarProgress clears on every new bar AND every re-tick.
        // The margin check rides on that same guard rather than keeping its
        // own: a separate one would not be cleared on a re-tick, so after a
        // rollback undid a margin call the next tick would skip the check.
        const state = this.ctx as any;
        const alreadyRan = state._ordersProcessedBar === this.ctx.currentBarIndex;
        super.processPendingOrders(high, low);
        if (!alreadyRan) this.checkMarginCall(high, low);
    }

    /**
     * The margin call, transcribed from the Strategies page ("Margin"):
     *
     *     Money Spent      = Quantity * Entry Price
     *     MVS              = Position Size * Current Price
     *     Open Profit      = MVS - Money Spent            (× -1 if short)
     *     Equity           = Initial Capital + Net Profit + Open Profit
     *     Margin           = MVS * Margin Ratio
     *     Available Funds  = Equity - Margin
     *     Loss             = Available Funds / Margin Ratio
     *     Cover Amount     = TRUNCATE(Loss / Current Price)
     *     Margin Call Size = Cover Amount * 4
     *
     * "if a strategy's available funds fall below the required margin" — that
     * is, Available Funds < 0 — the emulator "immediately liquidates" that size.
     *
     * ── Not documented, so chosen and stated ─────────────────────────────
     *
     *   Current Price   the bar's ADVERSE extreme — low for a long, high for a
     *                   short. The page never says which price; this is the
     *                   rule this engine's own `max_intraday_loss` check uses,
     *                   and the one that catches a call TradingView's intrabar
     *                   emulator would also see.
     *   Fill            at that price, as a market order (so slippage applies),
     *                   recorded under the id "Margin call".

     * These three want a TradingView-captured fixture before they are trusted
     * for numbers; the formula itself is the documented one and reproduces the
     * page's worked example exactly (see tests/v6/runtime/margin.test.ts).
     */
    protected checkMarginCall(high: number, low: number): void {
        const ctx = this.ctx;
        const pos = ctx.position;
        if (pos.size === 0) return;
        const isLong = pos.size > 0;
        const ratio = this.marginRatio(isLong);
        if (ratio === 0) return;

        const price = isLong ? low : high;
        const size = marginCallSize(ctx.cash, pos.size, pos.avgPrice, price, ratio, ctx.mincontract);
        if (size === 0) return;
        this.liquidate(Math.min(size, Math.abs(pos.size)), price);
    }

    /** Closes `qty` of the position at `price`, under the id "Margin call". */
    protected liquidate(qty: number, price: number): void {
        const ctx = this.ctx;
        const pos = ctx.position;
        const isLong = pos.size > 0;
        if (qty >= Math.abs(pos.size)) { this.closeAt("Margin call", price, "Close position order", "Margin call"); return; }

        const fill = this.toTick(this.slip(price, !isLong));
        this.closeEntries(qty, fill, undefined, {
            id: "Margin call", exitId: "Close position order", exitComment: "Margin call",
        });
    }

    protected override pairLevel(absolute: number, relative: number, isLong: boolean, favourable: boolean): number {
        if (Number.isNaN(absolute)) return relative;
        if (Number.isNaN(relative)) return absolute;
        // Favourable levels sit above the entry for a long, adverse ones below,
        // and the reverse for a short. The nearer is the min above, the max below.
        const above = isLong === favourable;
        return above ? Math.min(absolute, relative) : Math.max(absolute, relative);
    }
}

export { Broker } from "./Broker";

/**
 * The broker class for a version.
 *
 * Mirrors `viewFor(version)` in the stdlib registry: one table, consulted by
 * version, with the newest entry winning for anything above it.
 */
const BROKERS: Record<number, new (ctx: Context) => Broker> = {
    1: Broker,
    2: V2Broker,
    3: V3Broker,
    4: V4Broker,
    5: V5Broker,
    6: V6Broker,
};

/**
 * This context's broker, built once and kept on the context.
 *
 * Memoised per context rather than per version, because the instance holds a
 * reference to its own context. It holds no trading state — that stays on the
 * context so the live-tick snapshot can keep cloning it (see Broker.ts) — so
 * rebuilding one would be harmless, just wasteful.
 */
export function brokerFor(ctx: Context): Broker {
    const held = (ctx as any)._broker as Broker | undefined;
    if (held) return held;

    const version = ctx.profile?.version ?? 1;
    const Cls = BROKERS[version] ?? BROKERS[Math.max(...Object.keys(BROKERS).map(Number))];
    const made = new Cls(ctx);
    (ctx as any)._broker = made;
    return made;
}
