import { describe, it } from "node:test";
import assert from "node:assert";
import { transpile } from "../../../transpiler/v2";
import { compile, Context } from "../../../runtime/v2";
import { processPendingOrders } from "../../../runtime/v2/stdlib/strategy";

function runStrategy(pineCode: string, bars: { o: number, h: number, l: number, c: number }[]): Context {
    const js = transpile(pineCode).replace(/\blet\b/g, "var ");
    const ctx = new Context();
    const sandbox: any = Object.create(null);
    const exec = compile(js, ctx, sandbox);

    for (let i = 0; i < bars.length; i++) {
        const b = bars[i];
        ctx.setBar(i * 1000, b.o, b.h, b.l, b.c, 1000);
        
        exec(); 
        processPendingOrders(ctx, b.h, b.l);

        if (i < bars.length - 1) {
            ctx.finalizeBar();
        }
    }
    
    return ctx;
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
});