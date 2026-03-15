import { describe, it } from "node:test";
import assert from "node:assert";
import { transpile } from "../../../transpiler/v2";
import { compile, Context } from "../../../runtime/v2";
import { processPendingOrders, oca, direction } from "../../../runtime/v2/stdlib/strategy";

interface Bar { o: number; h: number; l: number; c: number; t?: number; }

function runStrategy(pineCode: string, bars: Bar[]): Context {
    const js = transpile(pineCode).replace(/\blet\b/g, "var ");
    const ctx = new Context();
    const sandbox: any = Object.create(null);
    const exec = compile(js, ctx, sandbox);

    for (let i = 0; i < bars.length; i++) {
        const b = bars[i];
        ctx.setBar(b.t ?? i * 1000, b.o, b.h, b.l, b.c, 1000);

        exec();
        processPendingOrders(ctx, b.h, b.l);

        if (i < bars.length - 1) {
            ctx.finalizeBar();
        }
    }

    return ctx;
}

/** Helper: run bars with explicit timestamps (for multi-day tests). */
function runStrategyDated(pineCode: string, bars: Bar[]): Context {
    return runStrategy(pineCode, bars);
}

describe("Broker Emulator: Asynchronous Strategy Exits", () => {
    
    it("should hit a Long Take Profit (Limit) when price spikes", () => {
        const pine = [
            'if n == 0',
            '    strategy.entry("Long", strategy.long)',
            // Positional mapping: id, from_entry, qty, profit, limit, loss, stop
            '    strategy.exit("Exit", "Long", na, na, 120, na, 80)'
        ].join('\n');
        
        const ctx = runStrategy(pine, [
            { o: 100, h: 105, l: 95, c: 100 }, 
            { o: 100, h: 125, l: 90, c: 110 }  
        ]);
        
        assert.strictEqual(ctx.position.size, 0, "Position should be closed");
        assert.strictEqual(ctx.trades.length, 1, "Should have 1 recorded closed trade");
        
        const trade = ctx.trades[0];
        assert.strictEqual(trade.entryPrice, 100, "Entry was 100");
        assert.strictEqual(trade.exitPrice, 120, "Exit filled exactly at Limit 120");
        assert.strictEqual(trade.pnl, 20, "PnL should be +20");
    });

    it("should hit a Long Stop Loss (Stop) when price drops", () => {
        const pine = [
            'if n == 0',
            '    strategy.entry("Long", strategy.long)',
            '    strategy.exit("Exit", "Long", na, na, 120, na, 80)'
        ].join('\n');
        
        const ctx = runStrategy(pine, [
            { o: 100, h: 105, l: 95, c: 100 }, 
            { o: 100, h: 110, l: 75, c: 85 }   
        ]);
        
        assert.strictEqual(ctx.position.size, 0);
        
        const trade = ctx.trades[0];
        assert.strictEqual(trade.exitPrice, 80, "Exit filled exactly at Stop 80");
        assert.strictEqual(trade.pnl, -20, "PnL should be -20");
    });

    it("should hit a Short Take Profit (Limit) when price drops", () => {
        const pine = [
            'if n == 0',
            '    strategy.entry("Short", strategy.short)',
            '    strategy.exit("Exit", "Short", na, na, 80, na, 120)'
        ].join('\n');
        
        const ctx = runStrategy(pine, [
            { o: 100, h: 105, l: 95, c: 100 }, 
            { o: 100, h: 110, l: 75, c: 85 }   
        ]);
        
        assert.strictEqual(ctx.position.size, 0);
        
        const trade = ctx.trades[0];
        assert.strictEqual(trade.direction, "short");
        assert.strictEqual(trade.exitPrice, 80);
        assert.strictEqual(trade.pnl, 20, "PnL should be +20");
    });

    it("should hit a Short Stop Loss (Stop) when price spikes", () => {
        const pine = [
            'if n == 0',
            '    strategy.entry("Short", strategy.short)',
            '    strategy.exit("Exit", "Short", na, na, 80, na, 120)'
        ].join('\n');
        
        const ctx = runStrategy(pine, [
            { o: 100, h: 105, l: 95, c: 100 }, 
            { o: 100, h: 125, l: 90, c: 110 }  
        ]);
        
        assert.strictEqual(ctx.position.size, 0);
        assert.strictEqual(ctx.trades[0].pnl, -20);
    });

    it("should hold the position open if neither TP nor SL is breached", () => {
        const pine = [
            'if n == 0',
            '    strategy.entry("Long", strategy.long)',
            '    strategy.exit("Exit", "Long", na, na, 120, na, 80)'
        ].join('\n');
        
        const ctx = runStrategy(pine, [
            { o: 100, h: 105, l: 95, c: 100 }, 
            { o: 100, h: 110, l: 90, c: 105 }  
        ]);
        
        assert.strictEqual(ctx.position.size, 1);
        assert.strictEqual(ctx.trades.length, 0);
        assert.strictEqual((ctx as any)._pendingExits.size, 1);
    });

});

// --- NEW: PENDING ENTRY AND CANCELLATION TESTS ---

describe("Broker Emulator: Asynchronous Strategy Entries & Cancellation", () => {

    it("should execute a Long Limit Entry when price drops to limit level", () => {
        const pine = [
            'if n == 0',
            '    strategy.order("BuyLimit", strategy.long, 1, 90)' // limit=90
        ].join('\n');

        const ctx = runStrategy(pine, [
            { o: 100, h: 105, l: 95, c: 100 }, // No fill (low 95 > limit 90)
            { o: 100, h: 105, l: 85, c: 95 }   // Fill (low 85 <= limit 90)
        ]);

        assert.strictEqual(ctx.position.size, 1, "Should have entered long");
        assert.strictEqual(ctx.position.avgPrice, 90, "Should fill at limit price");
    });

    it("should execute a Long Stop Entry when price rises to stop level", () => {
        const pine = [
            'if n == 0',
            '    strategy.order("BuyStop", strategy.long, 1, na, 110)' // stop=110
        ].join('\n');

        const ctx = runStrategy(pine, [
            { o: 100, h: 105, l: 95, c: 100 }, // No fill (high 105 < stop 110)
            { o: 100, h: 115, l: 100, c: 105 } // Fill (high 115 >= stop 110)
        ]);

        assert.strictEqual(ctx.position.size, 1);
        assert.strictEqual(ctx.position.avgPrice, 110);
    });

    it("should execute a Short Limit Entry when price rises to limit level", () => {
        const pine = [
            'if n == 0',
            '    strategy.order("SellLimit", strategy.short, 1, 110)' // limit=110
        ].join('\n');

        const ctx = runStrategy(pine, [
            { o: 100, h: 105, l: 95, c: 100 },
            { o: 100, h: 115, l: 100, c: 105 }
        ]);

        assert.strictEqual(ctx.position.size, -1);
        assert.strictEqual(ctx.position.avgPrice, 110);
    });

    it("should execute a Short Stop Entry when price drops to stop level", () => {
        const pine = [
            'if n == 0',
            '    strategy.order("SellStop", strategy.short, 1, na, 90)' // stop=90
        ].join('\n');

        const ctx = runStrategy(pine, [
            { o: 100, h: 105, l: 95, c: 100 },
            { o: 100, h: 105, l: 85, c: 95 }
        ]);

        assert.strictEqual(ctx.position.size, -1);
        assert.strictEqual(ctx.position.avgPrice, 90);
    });

    it("should remove a pending order when strategy.cancel is called", () => {
        const pine = [
            'if n == 0',
            '    strategy.order("Order1", strategy.long, 1, 90)',
            'if n == 1',
            '    strategy.cancel("Order1")'
        ].join('\n');

        const ctx = runStrategy(pine, [
            { o: 100, h: 105, l: 95, c: 100 }, // n=0: Order placed
            { o: 100, h: 105, l: 95, c: 100 }, // n=1: Order cancelled
            { o: 100, h: 105, l: 80, c: 95 }   // n=2: Price drops to 80, but order is gone
        ]);

        assert.strictEqual(ctx.position.size, 0, "Order should have been cancelled");
        assert.strictEqual((ctx as any)._pendingEntries.size, 0);
    });

    it("should halt the strategy if max_intraday_loss is breached", () => {
        const pine = [
            'strategy.risk.max_intraday_loss(50)', // Halt if loss >= $50
            'if n == 0',
            '    strategy.entry("Long", strategy.long)',
            'if n == 2',
            '    strategy.entry("Long2", strategy.long)' // This should be blocked
        ].join('\n');

        const ctx = runStrategy(pine, [
            { o: 100, h: 105, l: 95, c: 100 }, // n=0: Enter Long @ 100
            { o: 100, h: 105, l: 40, c: 45 },  // n=1: Low hits 40. Loss = 60 (> 50 limit). HALT.
            { o: 45,  h: 60,  l: 40, c: 55 }   // n=2: Entry should be ignored
        ]);

        // Position should be closed by the circuit breaker at the limit price (loss of 50)
        assert.strictEqual(ctx.position.size, 0, "Strategy should have flattened");
        assert.strictEqual(ctx.trades.length, 1, "Should only have the forced liquidation trade");
        
        const trade = ctx.trades[0];
        assert.strictEqual(trade.exitPrice, 50, "Should have exited exactly at the risk limit price");
        
        // Check internal halt state
        const riskState = (ctx as any)._riskState;
        assert.strictEqual(riskState.is_halted, true, "Strategy should remain in halted state");
    });

    it("should reset the intraday loss halt on a new day", () => {
        const js = transpile([
            'strategy.risk.max_intraday_loss(50)',
            'if n == 0 or n == 1 or n == 2',
            '    strategy.entry("Entry", strategy.long)'
        ].join('\n')).replace(/\blet\b/g, "var ");

        const ctx = new Context();
        const sandbox: any = Object.create(null);
        const exec = compile(js, ctx, sandbox);

        // Bar 0: Day 1 - Normal Entry
        ctx.setBar(Date.UTC(2026, 1, 1, 10, 0), 100, 105, 95, 100, 1000);
        exec(); processPendingOrders(ctx, 105, 95); ctx.finalizeBar();

        // Bar 1: Day 1 - Huge crash triggers halt
        ctx.setBar(Date.UTC(2026, 1, 1, 11, 0), 100, 105, 20, 25, 1000);
        exec(); processPendingOrders(ctx, 105, 20); ctx.finalizeBar();

        assert.strictEqual((ctx as any)._riskState.is_halted, true, "Should be halted on Day 1");

        // Bar 2: Day 2 - UTC Midnight has passed. Should reset and allow entry.
        ctx.setBar(Date.UTC(2026, 1, 2, 0, 0), 100, 105, 95, 100, 1000);
        exec(); processPendingOrders(ctx, 105, 95);

        assert.strictEqual((ctx as any)._riskState.is_halted, false, "Halt should reset on Day 2");
        assert.strictEqual(ctx.position.size, 1, "Should be allowed to enter on the new day");
    });
});

// ============================================================
// OCA GROUPS
// ============================================================

describe("Broker Emulator: OCA Groups", () => {

    it("oca.cancel — filling one pending entry cancels siblings in the same group", () => {
        // Place two limit orders in the same OCA cancel group.
        // When the first fills, the second should be removed.
        const pine = [
            'if n == 0',
            '    strategy.order("BuyA", strategy.long, 1, 90, na, "grp1", strategy.oca.cancel)',
            '    strategy.order("BuyB", strategy.long, 1, 80, na, "grp1", strategy.oca.cancel)',
        ].join('\n');

        const ctx = runStrategy(pine, [
            { o: 100, h: 105, l: 95,  c: 100 }, // n=0: orders placed, neither fills
            { o: 100, h: 105, l: 85,  c: 95  }, // n=1: low=85, BuyA(90) fills, BuyB(80) cancelled
            { o: 95,  h: 100, l: 75,  c: 80  }, // n=2: low=75 would hit BuyB(80) but it's gone
        ]);

        assert.strictEqual(ctx.position.size, 1, "Only BuyA should have filled");
        assert.strictEqual(ctx.position.avgPrice, 90);

        const entries = (ctx as any)._pendingEntries as Map<string, any>;
        assert.strictEqual(entries.size, 0, "BuyB should have been cancelled by OCA");
    });

    it("oca.reduce — filling one entry reduces sibling qty by filled amount", () => {
        const pine = [
            'if n == 0',
            '    strategy.order("BuyA", strategy.long, 3, 90, na, "grp1", strategy.oca.reduce)',
            '    strategy.order("BuyB", strategy.long, 5, 80, na, "grp1", strategy.oca.reduce)',
        ].join('\n');

        const ctx = runStrategy(pine, [
            { o: 100, h: 105, l: 95, c: 100 }, // n=0: orders placed
            { o: 100, h: 105, l: 85, c: 95  }, // n=1: BuyA(90) fills 3 qty. BuyB reduced: 5-3=2
        ]);

        assert.strictEqual(ctx.position.size, 3, "BuyA filled 3");

        const entries = (ctx as any)._pendingEntries as Map<string, any>;
        const buyB = entries.get("BuyB");
        assert.ok(buyB, "BuyB should still exist (reduced, not cancelled)");
        assert.strictEqual(buyB.qty, 2, "BuyB qty reduced from 5 to 2");
    });

    it("oca.reduce — sibling removed when reduced to zero or below", () => {
        const pine = [
            'if n == 0',
            '    strategy.order("BuyA", strategy.long, 5, 90, na, "grp1", strategy.oca.reduce)',
            '    strategy.order("BuyB", strategy.long, 3, 80, na, "grp1", strategy.oca.reduce)',
        ].join('\n');

        const ctx = runStrategy(pine, [
            { o: 100, h: 105, l: 95, c: 100 },
            { o: 100, h: 105, l: 85, c: 95  }, // BuyA fills 5, BuyB: 3-5=-2 → removed
        ]);

        const entries = (ctx as any)._pendingEntries as Map<string, any>;
        assert.strictEqual(entries.has("BuyB"), false, "BuyB fully consumed by reduce");
    });

    it("oca.none — filling one entry does NOT affect siblings", () => {
        const pine = [
            'if n == 0',
            '    strategy.order("BuyA", strategy.long, 1, 90, na, "grp1", strategy.oca.none)',
            '    strategy.order("BuyB", strategy.long, 1, 80, na, "grp1", strategy.oca.none)',
        ].join('\n');

        const ctx = runStrategy(pine, [
            { o: 100, h: 105, l: 95, c: 100 },
            { o: 100, h: 105, l: 85, c: 95  }, // BuyA fills at 90
            { o: 95,  h: 100, l: 75, c: 80  }, // BuyB should still fill at 80
        ]);

        // Both should have filled independently
        assert.strictEqual(ctx.position.size, 2, "Both orders should fill: 1 + 1 = 2");
    });

    it("oca.cancel across different groups — only same group is affected", () => {
        const pine = [
            'if n == 0',
            '    strategy.order("BuyA", strategy.long, 1, 90, na, "grp1", strategy.oca.cancel)',
            '    strategy.order("BuyB", strategy.long, 1, 80, na, "grp1", strategy.oca.cancel)',
            '    strategy.order("BuyC", strategy.long, 1, 85, na, "grp2", strategy.oca.cancel)',
        ].join('\n');

        const ctx = runStrategy(pine, [
            { o: 100, h: 105, l: 95, c: 100 },
            { o: 100, h: 105, l: 85, c: 95  }, // BuyA(90) fills → cancels BuyB(grp1). BuyC(grp2) unaffected.
            { o: 95,  h: 100, l: 80, c: 85  }, // BuyC(85) fills
        ]);

        assert.strictEqual(ctx.position.size, 2, "BuyA + BuyC should fill, BuyB cancelled");
    });
});

// ============================================================
// strategy.risk.allow_entry_in
// ============================================================

describe("Broker Emulator: strategy.risk.allow_entry_in", () => {

    it("should block short entries when allow_entry_in is long-only", () => {
        const pine = [
            'strategy.risk.allow_entry_in(strategy.long)',
            'if n == 0',
            '    strategy.entry("Long", strategy.long)',
            'if n == 1',
            '    strategy.entry("Short", strategy.short)',
        ].join('\n');

        const ctx = runStrategy(pine, [
            { o: 100, h: 105, l: 95, c: 100 },
            { o: 100, h: 105, l: 95, c: 100 },
        ]);

        assert.strictEqual(ctx.position.size, 1, "Long entry allowed");
        // Short entry on n=1 should have been blocked (no reverse)
        assert.strictEqual(ctx.trades.length, 0, "No trades — short was blocked so no reverse happened");
    });

    it("should block long entries when allow_entry_in is short-only", () => {
        const pine = [
            'strategy.risk.allow_entry_in(strategy.short)',
            'if n == 0',
            '    strategy.entry("Long", strategy.long)',
            'if n == 1',
            '    strategy.entry("Short", strategy.short)',
        ].join('\n');

        const ctx = runStrategy(pine, [
            { o: 100, h: 105, l: 95, c: 100 },
            { o: 100, h: 105, l: 95, c: 100 },
        ]);

        // Long entry on n=0 blocked; short entry on n=1 works
        assert.strictEqual(ctx.position.size, -1, "Only short entry allowed");
    });
});

// ============================================================
// strategy.risk.max_position_size
// ============================================================

describe("Broker Emulator: strategy.risk.max_position_size", () => {

    it("should clamp entry qty to respect position limit", () => {
        const pine = [
            'strategy.risk.max_position_size(3)',
            'if n == 0',
            '    strategy.entry("E1", strategy.long, 2)',
            'if n == 1',
            '    strategy.entry("E2", strategy.long, 5)',  // wants 5 more, only 1 allowed
        ].join('\n');

        const ctx = runStrategy(pine, [
            { o: 100, h: 105, l: 95, c: 100 },
            { o: 100, h: 105, l: 95, c: 100 },
        ]);

        assert.strictEqual(ctx.position.size, 3, "Clamped to max_position_size");
    });

    it("should block entry entirely when already at max", () => {
        const pine = [
            'strategy.risk.max_position_size(2)',
            'if n == 0',
            '    strategy.entry("E1", strategy.long, 2)',
            'if n == 1',
            '    strategy.entry("E2", strategy.long, 1)',  // already at max
        ].join('\n');

        const ctx = runStrategy(pine, [
            { o: 100, h: 105, l: 95, c: 100 },
            { o: 100, h: 105, l: 95, c: 100 },
        ]);

        assert.strictEqual(ctx.position.size, 2, "No additional entry allowed");
    });

    it("should allow reverse entry even when at max (opposite direction)", () => {
        const pine = [
            'strategy.risk.max_position_size(2)',
            'if n == 0',
            '    strategy.entry("Long", strategy.long, 2)',
            'if n == 1',
            '    strategy.entry("Short", strategy.short, 1)',  // reverses: closes long, opens short
        ].join('\n');

        const ctx = runStrategy(pine, [
            { o: 100, h: 105, l: 95, c: 100 },
            { o: 100, h: 105, l: 95, c: 100 },
        ]);

        assert.strictEqual(ctx.position.size, -1, "Reverse allowed");
        assert.strictEqual(ctx.trades.length, 1, "One close trade from the reverse");
    });
});

// ============================================================
// strategy.risk.max_intraday_filled_orders
// ============================================================

describe("Broker Emulator: strategy.risk.max_intraday_filled_orders", () => {

    it("should stop filling pending orders after daily limit reached", () => {
        const pine = [
            'strategy.risk.max_intraday_filled_orders(2)',
            'if n == 0',
            '    strategy.order("A", strategy.long, 1, 90, na)',
            '    strategy.order("B", strategy.long, 1, 85, na)',
            '    strategy.order("C", strategy.long, 1, 80, na)',
        ].join('\n');

        const ctx = runStrategy(pine, [
            { o: 100, h: 105, l: 95, c: 100 }, // orders placed
            { o: 100, h: 105, l: 75, c: 80  }, // low=75 hits all 3 limits
        ]);

        // A fills (count=1), B fills (count=2), C blocked (count >= 2)
        // entry() increments the counter each time, so 2 fills total
        assert.strictEqual(ctx.position.size, 2, "Only 2 of 3 should fill");
    });

    it("should count market entries toward the daily limit", () => {
        const pine = [
            'strategy.risk.max_intraday_filled_orders(1)',
            'if n == 0',
            '    strategy.entry("E1", strategy.long)',
            'if n == 1',
            '    strategy.entry("E2", strategy.long)',  // blocked — already 1 fill today
        ].join('\n');

        const ctx = runStrategy(pine, [
            { o: 100, h: 105, l: 95, c: 100 },
            { o: 100, h: 105, l: 95, c: 100 },
        ]);

        assert.strictEqual(ctx.position.size, 1, "Second entry blocked by daily limit");
    });

    it("should reset the fill counter on a new day", () => {
        const pine = [
            'strategy.risk.max_intraday_filled_orders(1)',
            'if n == 0 or n == 1 or n == 2',
            '    strategy.entry("Entry", strategy.long)',
        ].join('\n');

        const day1_bar0 = Date.UTC(2026, 2, 10, 10, 0);
        const day1_bar1 = Date.UTC(2026, 2, 10, 11, 0);
        const day2_bar0 = Date.UTC(2026, 2, 11, 10, 0);

        const ctx = runStrategy(pine, [
            { o: 100, h: 105, l: 95, c: 100, t: day1_bar0 },  // fills (count=1)
            { o: 100, h: 105, l: 95, c: 100, t: day1_bar1 },  // blocked (count >= 1)
            { o: 100, h: 105, l: 95, c: 100, t: day2_bar0 },  // new day, counter resets, fills
        ]);

        // n=0: fills (size=1). n=1: blocked (still 1). n=2: new day, fills again (size=2).
        assert.strictEqual(ctx.position.size, 2);
    });
});

// ============================================================
// strategy.risk.max_drawdown
// ============================================================

describe("Broker Emulator: strategy.risk.max_drawdown", () => {

    it("should halt and liquidate when percent drawdown breached", () => {
        const pine = [
            'strategy.risk.max_drawdown(5, "percent")',  // halt at 5% drawdown from peak
            'if n == 0',
            '    strategy.entry("Long", strategy.long, 10)',
        ].join('\n');

        // Starting equity = 100000.
        // Entry at 100, qty=10. Peak equity = 100000 (before unrealized).
        // Bar 1: price crashes to low=80. Unrealized PnL = (80-100)*10 = -200.
        //   Equity = 100000 - 200 = 99800. DD = 200/100000 = 0.2%. Not enough.
        // Bar 2: price crashes to low=20. Unrealized PnL = (20-100)*10 = -800.
        //   Equity = 100000 - 800 = 99200. DD from peak(100000) = 0.8%. Still not 5%.
        //   But wait — the peak equity should be updated correctly.
        //   Actually with starting cash 100000 and buying 10 @ 100, let's think bigger.
        // Let me use a simpler scenario: buy 1000 contracts at 100.
        const pine2 = [
            'strategy.risk.max_drawdown(5, "percent")',
            'if n == 0',
            '    strategy.entry("Long", strategy.long, 1000)',
        ].join('\n');

        // Starting equity = 100000. Entry at 100, qty=1000.
        // Bar 1: close=110. Unrealized = (110-100)*1000 = 10000. Equity = 110000. Peak = 110000.
        // Bar 2: low=98. Unrealized = (98-100)*1000 = -2000. Equity = 98000.
        //   DD from peak(110000) = 12000/110000 = 10.9%. Exceeds 5%. HALT.
        const ctx = runStrategy(pine2, [
            { o: 100, h: 105, l: 95, c: 100 },   // n=0: entry
            { o: 100, h: 115, l: 100, c: 110 },   // n=1: equity rises to peak
            { o: 110, h: 112, l: 95,  c: 98  },   // n=2: big drop triggers halt
        ]);

        assert.strictEqual(ctx.position.size, 0, "Should be liquidated");
        assert.strictEqual((ctx as any)._riskState.is_halted, true, "Should be halted");
    });

    it("should halt and liquidate when cash drawdown breached", () => {
        const pine = [
            'strategy.risk.max_drawdown(500, "cash")',
            'if n == 0',
            '    strategy.entry("Long", strategy.long, 100)',
        ].join('\n');

        // Entry at 100, qty=100. Equity = 100000.
        // Bar 1: close=110. Equity = 100000 + (110-100)*100 = 101000. Peak = 101000.
        // Bar 2: low=90. Equity = 100000 + (90-100)*100 = 99000.
        //   DD from peak(101000) = 2000. Exceeds 500. HALT.
        const ctx = runStrategy(pine, [
            { o: 100, h: 105, l: 95,  c: 100 },
            { o: 100, h: 115, l: 100, c: 110 },
            { o: 110, h: 112, l: 90,  c: 95  },
        ]);

        assert.strictEqual(ctx.position.size, 0, "Should be liquidated");
        assert.strictEqual((ctx as any)._riskState.is_halted, true);
    });
});

// ============================================================
// strategy.risk.max_cons_loss_days
// ============================================================

describe("Broker Emulator: strategy.risk.max_cons_loss_days", () => {

    it("should halt after N consecutive losing days", () => {
        const pine = [
            'strategy.risk.max_cons_loss_days(2)',
            'if n == 0 or n == 2 or n == 4',
            '    strategy.entry("Long", strategy.long, 1)',
            'if n == 1 or n == 3 or n == 5',
            '    strategy.close("Long")',
        ].join('\n');

        // Day 1: enter at 100, close at 90 → loss
        // Day 2: enter at 90, close at 80 → loss (cons_loss_days = 2 → halt)
        // Day 3: entry should be blocked
        const day1_open  = Date.UTC(2026, 2, 10, 10, 0);
        const day1_close = Date.UTC(2026, 2, 10, 16, 0);
        const day2_open  = Date.UTC(2026, 2, 11, 10, 0);
        const day2_close = Date.UTC(2026, 2, 11, 16, 0);
        const day3_open  = Date.UTC(2026, 2, 12, 10, 0);
        const day3_close = Date.UTC(2026, 2, 12, 16, 0);

        const ctx = runStrategy(pine, [
            { o: 100, h: 105, l: 95,  c: 100, t: day1_open  },  // n=0: enter @ 100
            { o: 100, h: 100, l: 85,  c: 90,  t: day1_close },  // n=1: close @ 90 (PnL = -10)
            { o: 90,  h: 95,  l: 85,  c: 90,  t: day2_open  },  // n=2: enter @ 90
            { o: 90,  h: 90,  l: 75,  c: 80,  t: day2_close },  // n=3: close @ 80 (PnL = -10)
            { o: 80,  h: 90,  l: 75,  c: 85,  t: day3_open  },  // n=4: entry should be blocked
            { o: 85,  h: 90,  l: 80,  c: 85,  t: day3_close },  // n=5: nothing to close
        ]);

        assert.strictEqual(ctx.trades.length, 2, "Two losing trades recorded");
        assert.strictEqual((ctx as any)._riskState.is_halted, true, "Halted after 2 consecutive loss days");
        assert.strictEqual(ctx.position.size, 0, "No new position on day 3");
    });

    it("should reset consecutive loss counter after a winning day", () => {
        const pine = [
            'strategy.risk.max_cons_loss_days(2)',
            'if n == 0 or n == 2 or n == 4',
            '    strategy.entry("Long", strategy.long, 1)',
            'if n == 1 or n == 3 or n == 5',
            '    strategy.close("Long")',
        ].join('\n');

        // Day 1: loss
        // Day 2: win → resets counter
        // Day 3: loss → counter=1, NOT halted (need 2 consecutive)
        const day1_open  = Date.UTC(2026, 2, 10, 10, 0);
        const day1_close = Date.UTC(2026, 2, 10, 16, 0);
        const day2_open  = Date.UTC(2026, 2, 11, 10, 0);
        const day2_close = Date.UTC(2026, 2, 11, 16, 0);
        const day3_open  = Date.UTC(2026, 2, 12, 10, 0);
        const day3_close = Date.UTC(2026, 2, 12, 16, 0);

        const ctx = runStrategy(pine, [
            { o: 100, h: 105, l: 95,  c: 100, t: day1_open  },  // n=0: enter @ 100
            { o: 100, h: 100, l: 85,  c: 90,  t: day1_close },  // n=1: close @ 90 (loss)
            { o: 90,  h: 110, l: 85,  c: 90,  t: day2_open  },  // n=2: enter @ 90
            { o: 90,  h: 110, l: 85,  c: 105, t: day2_close },  // n=3: close @ 105 (win!)
            { o: 105, h: 110, l: 95,  c: 105, t: day3_open  },  // n=4: enter @ 105
            { o: 105, h: 105, l: 90,  c: 95,  t: day3_close },  // n=5: close @ 95 (loss, but only 1 consecutive)
        ]);

        assert.strictEqual(ctx.trades.length, 3, "Three trades total");
        assert.strictEqual((ctx as any)._riskState.is_halted, false, "NOT halted — only 1 consecutive loss");
    });
});

// ============================================================
// strategy.risk.max_intraday_loss with percent type
// ============================================================

describe("Broker Emulator: strategy.risk.max_intraday_loss (percent)", () => {

    it("should halt when percent-based intraday loss is breached", () => {
        const pine = [
            'strategy.risk.max_intraday_loss(1, "percent")',  // halt at 1% intraday loss
            'if n == 0',
            '    strategy.entry("Long", strategy.long, 100)',
        ].join('\n');

        // Start equity = 100000. 1% = 1000.
        // Entry at 100, qty=100.
        // Bar 1: low=80. Unrealized = (80-100)*100 = -2000. Intraday loss = 2000 → 2% > 1%. HALT.
        const ctx = runStrategy(pine, [
            { o: 100, h: 105, l: 95,  c: 100 },
            { o: 100, h: 105, l: 80,  c: 85  },
        ]);

        assert.strictEqual(ctx.position.size, 0, "Liquidated");
        assert.strictEqual((ctx as any)._riskState.is_halted, true);
    });
});