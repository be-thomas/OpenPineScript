/**
 * tests/v2/runtime/session.test.ts
 *
 * Embeddable session API (B1 render-model + B3 runScript/Session + B4 errors +
 * B5 overlay/precision → pane) — ui-engine-control-protocol §3/§5.
 */
import { describe, it } from "vitest";
import assert from "node:assert";
import { Session, runScript } from "../../../runtime/v2";

const candles = (closes: number[]) =>
    closes.map((c, i) => ({ time: i, open: c, high: c + 1, low: c - 1, close: c, volume: 1 }));

describe("Session.compile — metadata, inputs, errors", () => {
    it("reports scriptMeta and discovered inputs", () => {
        const c = new Session().compile('study("Ind", overlay=true)\nlen = input(14, "Length")\nplot(sma(close, len))\n');
        assert.strictEqual(c.errors.length, 0);
        assert.strictEqual(c.meta?.kind, "study");
        assert.strictEqual(c.meta?.overlay, true);
        assert.strictEqual(c.inputs.length, 1);
        assert.strictEqual(c.inputs[0].title, "Length");
        assert.strictEqual(c.inputs[0].default, 14);
        assert.strictEqual(c.engineVersion, "v2");
    });

    it("normalizes a v2 restriction into a structured error with line/col", () => {
        const c = new Session().compile("x = 1\nx := 2\n");
        assert.strictEqual(c.errors.length, 1);
        assert.strictEqual(c.errors[0].phase, "transpile");
        assert.strictEqual(c.errors[0].line, 2);
        assert.match(c.errors[0].message, /reassignment/);
    });

    it("returns a structured error for malformed source instead of throwing", () => {
        const c = new Session().compile("x = (1 + \n");
        assert.ok(c.errors.length >= 1);
        assert.ok(typeof c.errors[0].message === "string" && c.errors[0].message.length > 0);
        assert.ok(["parse", "transpile"].includes(c.errors[0].phase));
    });
});

describe("render model — series types & pane placement (B1/B5)", () => {
    it("overlay study places a line on the main pane", () => {
        const s = new Session();
        s.compile('study("X", overlay=true)\nplot(close)\n');
        const r = s.runHistory(candles([10, 11, 12]));
        assert.strictEqual(r.series[0].type, "line");
        assert.strictEqual(r.series[0].pane, "main");
        assert.strictEqual(r.series[0].data.length, 3);
    });

    it("non-overlay study places a line on a sub-pane", () => {
        const s = new Session();
        s.compile('study("X", overlay=false)\nplot(close)\n');
        const r = s.runHistory(candles([10, 11, 12]));
        assert.strictEqual(r.series[0].pane, "sub");
    });

    it("maps plotcandle → candle, bgcolor → bgcolor (always main)", () => {
        const s = new Session();
        s.compile('plotcandle(open, high, low, close, "C")\nbgcolor("#FF0000")\n');
        const r = s.runHistory(candles([10, 20]));
        const candle = r.series.find((x) => x.type === "candle")!;
        const bg = r.series.find((x) => x.type === "bgcolor")!;
        assert.ok("open" in (candle.data[0] as any));
        assert.strictEqual(candle.pane, "main");
        assert.strictEqual((bg.data[0] as any).color, "#FF0000");
        assert.strictEqual(bg.pane, "main");
    });

    it("plotshape maps to a marker series", () => {
        const s = new Session();
        s.compile('plotshape(close > 10, "Sig")\n');
        const r = s.runHistory(candles([5, 15]));
        assert.strictEqual(r.series[0].type, "marker");
    });
});

describe("runScript one-shot", () => {
    it("returns null summary for a study", () => {
        const r = runScript('study("X")\nplot(close)\n', { candles: candles([1, 2, 3]) });
        assert.strictEqual(r.summary, null);
        assert.strictEqual(r.barsProcessed, 3);
    });

    it("applies input overrides", () => {
        // plot the input value; override it and confirm the series reflects the override
        const r = runScript('len = input(5, "L")\nplot(len)\n', { candles: candles([1, 2]), inputs: { input_0: 9 } });
        assert.strictEqual((r.series[0].data[0] as any).value, 9);
    });

    it("resolves security() from supplied HTF data", () => {
        const r = runScript('h = security("AAPL", "D", close)\nplot(h)\n', {
            candles: [{ time: 150, open: 5, high: 5, low: 5, close: 5, volume: 1 }],
            securities: [{ symbol: "AAPL", resolution: "D", candles: [
                { time: 0, open: 100, high: 100, low: 100, close: 100, volume: 1 },
                { time: 100, open: 110, high: 110, low: 110, close: 110, volume: 1 },
            ] }],
        });
        assert.strictEqual((r.series[0].data[0] as any).value, 100); // daily[0] closed by t=150
    });
});

describe("live tick/commit via Session (P3)", () => {
    it("emits provisional deltas and rolls back re-ticks", () => {
        const s = new Session();
        s.compile("c = cum(close)\nplot(c)\n");
        s.runHistory(candles([10])); // committed cum = 10

        let d = s.tick({ time: 1, open: 5, high: 5, low: 5, close: 5, volume: 1 });
        assert.strictEqual(d.provisional, true);
        assert.strictEqual(d.series[0].value, 15);             // 10 + 5

        d = s.tick({ time: 1, open: 20, high: 20, low: 20, close: 20, volume: 1 });
        assert.strictEqual(d.series[0].value, 30);             // 10 + 20 (rolled back, not 35)

        s.commit();
        d = s.tick({ time: 2, open: 3, high: 3, low: 3, close: 3, volume: 1 });
        assert.strictEqual(d.series[0].value, 33);             // committed 30 + 3
    });
});

describe("Session version state", () => {
    it("reports the compiled script's version", () => {
        const s = new Session();
        s.compile("//@version=2\nplot(close)\n");
        assert.strictEqual(s.pineVersion, 2);
    });

    it("does not report a stale version after a failed compile", () => {
        // Previously profile/pineVersion were written only on success, so a
        // failed compile left the PREVIOUS script's version visible.
        const s = new Session();
        s.compile("//@version=2\nplot(close)\n");
        assert.strictEqual(s.pineVersion, 2);

        const result = s.compile("//@version=5\nplot(close)\n");
        assert.ok(result.errors.length > 0);
        assert.notStrictEqual(s.pineVersion, 2);
        assert.strictEqual(s.pineVersion, 1);
    });
});
