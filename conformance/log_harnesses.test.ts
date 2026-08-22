/**
 * The generated v5 Pine-Logs harnesses must COMPILE AND RUN here.
 *
 * ── Why this is a conformance test and not a v5 unit test ───────────────────
 *
 * conformance/golden/v5/*.pine are the scripts that get pasted into
 * TradingView to collect golden data without a paid "Export chart data…" plan
 * (see scripts/make-log-harness.ts and runtime/v1/stdlib/logging.ts). They are
 * GENERATED from the v3 and v4 harnesses, so nobody reads them line by line,
 * and the round trip is slow and manual: paste, add to chart, copy the Pine
 * Logs pane, save the file.
 *
 * A harness that does not compile is therefore discovered at the worst possible
 * moment — in a browser, by hand, after the work of setting up the chart. This
 * file moves that discovery to the test suite.
 *
 * It also exercises more of v5 in one go than any hand-written test does. These
 * seven files between them use `indicator`, the whole of `ta.*` and `math.*`,
 * `str.tostring`, `log.info`, `barstate.isfirst`, tuple destructuring, `for`
 * with break/continue, nested if/else, `strategy.*`, and string concatenation —
 * which is how the `+` coercion bug in `safe_add` was found.
 *
 * ── What is NOT asserted ────────────────────────────────────────────────────
 *
 * The VALUES. Comparing them against TradingView is the job of
 * tradingview_golden.test.ts, and it needs an export that only a human can
 * produce. What is asserted here is that the harness runs to completion and
 * emits a well-formed row per bar — the preconditions for that comparison
 * being meaningful at all.
 */
import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { compileScript } from "../transpiler";
import { compile, Context } from "../runtime/v5";

const DIR = path.join(__dirname, "golden", "v5");

const HARNESSES = fs.existsSync(DIR)
  ? fs.readdirSync(DIR).filter(f => f.endsWith(".pine")).sort()
  : [];

const BARS = 60;

/** A deterministic OHLCV walk. The numbers do not matter; finishing does. */
function feed(ctx: Context, exec: () => any): void {
  let price = 100;
  for (let i = 0; i < BARS; i++) {
    price += Math.sin(i) * 2;
    ctx.currentBarIndex = i;
    ctx.is_last = i === BARS - 1;
    ctx.is_history = !ctx.is_last;
    ctx.setBar(1420156800000 + i * 86400000, price, price + 1, price - 1, price + 0.5, 1000 + i);
    exec();
    ctx.finalizeBar();
  }
}

describe("generated v5 log harnesses", () => {
  it("there are some — an empty directory would make every case below vacuous", () => {
    expect(HARNESSES.length).toBeGreaterThan(0);
  });

  for (const file of HARNESSES) {
    describe(file, () => {
      const source = fs.readFileSync(path.join(DIR, file), "utf8");

      it("is annotated v5, so it routes to the v5 pipeline", () => {
        expect(compileScript(source).version).toBe(5);
      });

      it("compiles", () => {
        expect(() => compileScript(source)).not.toThrow();
      });

      it("runs to completion and logs one row per bar", () => {
        const { js, profile } = compileScript(source);
        const ctx = new Context(profile);
        const exec = compile(js, ctx, Object.create(null));
        feed(ctx, exec);

        const rows = ctx.logs.filter(l => l.message.startsWith("OPS|"));
        expect(rows.length).toBe(BARS);
      });

      it("emits its header exactly once, and every row matches its width", () => {
        // A row whose width drifts from the header is the failure that makes a
        // golden CSV silently misaligned — column N of the data compared
        // against column N of a different indicator.
        const { js, profile } = compileScript(source);
        const ctx = new Context(profile);
        const exec = compile(js, ctx, Object.create(null));
        feed(ctx, exec);

        const headers = ctx.logs.filter(l => l.message.startsWith("OPSHEAD|"));
        expect(headers.length, "the header is gated on barstate.isfirst").toBe(1);

        const width = headers[0].message.split(",").length;
        expect(width).toBeGreaterThan(6); // time,o,h,l,c,v + at least one column

        for (const row of ctx.logs.filter(l => l.message.startsWith("OPS|"))) {
          expect(row.message.split(",").length, row.message.slice(0, 80)).toBe(width);
        }
      });

      it("logs numbers, not the string 'NaN' for the whole row", () => {
        // The row is built with `+`, which used to coerce both sides through
        // Number() and collapse every harness to a single "NaN".
        const { js, profile } = compileScript(source);
        const ctx = new Context(profile);
        const exec = compile(js, ctx, Object.create(null));
        feed(ctx, exec);

        const last = ctx.logs.filter(l => l.message.startsWith("OPS|")).pop()!;
        const cells = last.message.replace("OPS|", "").split(",");
        const numeric = cells.filter(c => c !== "NaN" && Number.isFinite(Number(c)));
        expect(numeric.length, last.message.slice(0, 120)).toBeGreaterThan(5);
      });
    });
  }
});
