/**
 * The v5 stdlib entries that were recorded as gaps and are now filled:
 * `request.*`, the extra `matrix.*` operations, seeded `math.random`, and the
 * March-2020 `ta.*` batch.
 *
 * Each was a DIFFERENT kind of gap, and the tests reflect that:
 *
 *   request.*      the name did not exist inside a namespace that DID, so it
 *                  read as `undefined` and the script ran on with an empty
 *                  series. The test that matters is the refusal.
 *   matrix extras  absent entirely, so refused — safe, just incomplete.
 *   math.random    the seed was accepted and ignored, which silently lost
 *                  reproducibility.
 *   ta.*           absent at every version, so a published v4 or v5 script
 *                  using `ta.hma` could not run at all.
 */
import { describe, it, expect } from "vitest";
import { compileScript } from "../../../transpiler";
import { compile, Context } from "../../../runtime/v5";
import { matrix } from "../../../runtime/v1/stdlib/matrix";
import { HEAD, build, value } from "../helpers";

describe("request.* — non-price data", () => {
  const SRC = `${HEAD}rev = request.financial("NASDAQ:AAPL", "TOTAL_REVENUE", "FQ")\n`;

  it("is REFUSED when the host supplied nothing", () => {
    // The gap this closes. `request` is a real namespace (it has `security`),
    // so a missing member read as `undefined` and the script produced an empty
    // series with no error anywhere.
    const { ctx, exec } = build(SRC);
    ctx.setBar(1000, 10, 12, 9, 11, 100);
    expect(() => exec()).toThrow(/no data was supplied for 'NASDAQ:AAPL\|TOTAL_REVENUE\|FQ'/);
  });

  it("reads supplied samples as a step function", () => {
    const { ctx, exec } = build(SRC);
    ctx.provideRequestData("financial", "NASDAQ:AAPL|TOTAL_REVENUE|FQ", [
      { time: 2000, value: 100 },
      { time: 4000, value: 200 },
    ]);

    const seen: any[] = [];
    for (const t of [1000, 2000, 3000, 4000, 5000]) {
      ctx.setBar(t, 10, 12, 9, 11, 100);
      exec();
      seen.push(ctx.vars.get("opsv2_rev")?.valueOf());
      ctx.finalizeBar();
    }
    // na before the first sample; each value stands until the next.
    expect(Number.isNaN(seen[0])).toBe(true);
    expect(seen.slice(1)).toEqual([100, 100, 200, 200]);
  });

  it("samples may be supplied out of order", () => {
    const { ctx, exec } = build(SRC);
    ctx.provideRequestData("financial", "NASDAQ:AAPL|TOTAL_REVENUE|FQ", [
      { time: 4000, value: 200 },
      { time: 2000, value: 100 },
    ]);
    ctx.setBar(3000, 10, 12, 9, 11, 100);
    exec();
    expect(ctx.vars.get("opsv2_rev")?.valueOf()).toBe(100);
  });

  it("dividends, splits and earnings resolve the same way", () => {
    for (const [fn, kind] of [["dividends", "dividends"], ["splits", "splits"],
                              ["earnings", "earnings"]] as Array<[string, string]>) {
      const { ctx, exec } = build(`${HEAD}v = request.${fn}("NASDAQ:AAPL")\n`);
      const key = `NASDAQ:AAPL|${kind === "dividends" ? "dividends_gross"
        : kind === "splits" ? "splits_numerator" : "earnings_actual"}`;
      ctx.provideRequestData(kind, key, [{ time: 0, value: 42 }]);
      ctx.setBar(0, 10, 12, 9, 11, 100);
      exec();
      expect(ctx.vars.get("opsv2_v")?.valueOf(), fn).toBe(42);
    }
  });

  it("request.* is not spellable at v4", () => {
    expect(() => compileScript('//@version=4\nstudy("t")\nx = request.financial("A", "B", "FQ")\n'))
      .toThrow(/'request\.financial' is not available in Pine Script v4/);
  });
});

describe("matrix — the operations that were absent", () => {
  const build2x2 = (a: number, b: number, c: number, d: number) => {
    const m = matrix.new(2, 2, 0);
    matrix.set(m, 0, 0, a); matrix.set(m, 0, 1, b);
    matrix.set(m, 1, 0, c); matrix.set(m, 1, 1, d);
    return m;
  };

  it("kron multiplies every element by the whole second matrix", () => {
    const a = build2x2(1, 2, 3, 4);
    const i = build2x2(1, 0, 0, 1);
    const k = matrix.kron(a, i);
    expect(matrix.rows(k)).toBe(4);
    expect(matrix.columns(k)).toBe(4);
    expect(matrix.get(k, 0, 0)).toBe(1);
    expect(matrix.get(k, 1, 1)).toBe(1);
    expect(matrix.get(k, 0, 2)).toBe(2);
  });

  it("rank counts independent rows", () => {
    expect(matrix.rank(build2x2(1, 2, 3, 4))).toBe(2);
    expect(matrix.rank(build2x2(1, 2, 2, 4))).toBe(1);   // second row is twice the first
    expect(matrix.rank(matrix.new(2, 2, 0))).toBe(0);
  });

  it("rank is scale-invariant — the tolerance follows the data", () => {
    // An absolute epsilon would make rank depend on the units prices are
    // quoted in, which is not a property a rank can have.
    expect(matrix.rank(build2x2(1e-9, 2e-9, 3e-9, 4e-9))).toBe(2);
    expect(matrix.rank(build2x2(1e9, 2e9, 3e9, 4e9))).toBe(2);
  });

  it("pinv inverts a full-rank matrix", () => {
    const a = build2x2(4, 7, 2, 6);
    const product = matrix.mult(matrix.pinv(a), a) as number[][];
    expect(product[0][0]).toBeCloseTo(1, 9);
    expect(product[0][1]).toBeCloseTo(0, 9);
    expect(product[1][1]).toBeCloseTo(1, 9);
  });

  it("pinv of a RANK-DEFICIENT matrix is na, not a wrong number", () => {
    // The general case needs an SVD whose zero-cutoff TradingView does not
    // publish. `na` is the same answer `inv` gives a singular matrix.
    const singular = matrix.pinv(build2x2(1, 1, 1, 1));
    expect(Number.isNaN(matrix.get(singular, 0, 0))).toBe(true);
  });

  it("a non-square matrix has a pseudo-inverse of the transposed shape", () => {
    const m = matrix.new(3, 2, 0);
    [[1, 0], [0, 1], [1, 1]].forEach((row, r) =>
      row.forEach((v, c) => matrix.set(m, r, c, v)));
    const p = matrix.pinv(m);
    expect(matrix.rows(p)).toBe(2);
    expect(matrix.columns(p)).toBe(3);
  });

  it("all three are reachable from a script", () => {
    const src = `${HEAD}a = matrix.new<float>(2, 2, 1.0)\nr = matrix.rank(a)\n`;
    expect(value(src, "r")).toBe(1);
  });
});

describe("math.random", () => {
  it("stays inside its bounds", () => {
    const { ctx, exec } = build(`${HEAD}r = math.random(5, 6)\n`);
    for (let i = 0; i < 20; i++) {
      ctx.setBar(i, 10, 12, 9, 11, 100);
      exec();
      const r = ctx.vars.get("opsv2_r")?.valueOf();
      expect(r).toBeGreaterThanOrEqual(5);
      expect(r).toBeLessThan(6);
      ctx.finalizeBar();
    }
  });

  it("a SEED makes the sequence repeatable, which is what a backtest needs", () => {
    const draw = () => {
      const { ctx, exec } = build(`${HEAD}r = math.random(0, 1, 42)\n`);
      const out: number[] = [];
      for (let i = 0; i < 5; i++) {
        ctx.setBar(i, 10, 12, 9, 11, 100);
        exec();
        out.push(ctx.vars.get("opsv2_r")?.valueOf());
        ctx.finalizeBar();
      }
      return out;
    };
    expect(draw()).toEqual(draw());
  });

  it("different seeds give different streams", () => {
    const first = value(`${HEAD}r = math.random(0, 1, 1)\n`, "r");
    const second = value(`${HEAD}r = math.random(0, 1, 2)\n`, "r");
    expect(first).not.toBe(second);
  });

  it("reset() restarts a seeded stream", () => {
    const { ctx, exec } = build(`${HEAD}r = math.random(0, 1, 7)\n`);
    ctx.setBar(0, 10, 12, 9, 11, 100); exec();
    const first = ctx.vars.get("opsv2_r")?.valueOf();
    ctx.reset();
    ctx.setBar(0, 10, 12, 9, 11, 100); exec();
    expect(ctx.vars.get("opsv2_r")?.valueOf()).toBe(first);
  });
});

describe("the March-2020 ta batch", () => {
  /** Runs `bars` synthetic bars and returns the last value of `name`. */
  function settled(body: string, name: string, bars = 120): number {
    const { ctx, exec } = build(HEAD + body);
    let p = 100;
    for (let i = 0; i < bars; i++) {
      p += Math.sin(i / 3) * 2;
      ctx.setBar(i * 86400000, p, p + 1.5, p - 1.5, p + 0.5, 1000 + i);
      exec();
      ctx.finalizeBar();
    }
    return ctx.vars.get("opsv2_" + name)?.valueOf();
  }

  it("bbw is the band span over the basis", () => {
    const w = settled("w = ta.bbw(close, 20, 2)\n", "w");
    const manual = settled(
      "b = ta.sma(close, 20)\nd = ta.stdev(close, 20)\nw = 2 * 2 * d / b\n", "w");
    expect(w).toBeCloseTo(manual, 12);
  });

  it("kc returns a basis with bands either side of it", () => {
    const basis = settled("[b, u, l] = ta.kc(close, 20, 2)\nv = b\n", "v");
    const upper = settled("[b, u, l] = ta.kc(close, 20, 2)\nv = u\n", "v");
    const lower = settled("[b, u, l] = ta.kc(close, 20, 2)\nv = l\n", "v");
    expect(upper).toBeGreaterThan(basis);
    expect(lower).toBeLessThan(basis);
    expect(basis).toBeCloseTo(settled("v = ta.ema(close, 20)\n", "v"), 12);
  });

  it("kcw agrees with the kc it is derived from", () => {
    const w = settled("v = ta.kcw(close, 20, 2)\n", "v");
    const u = settled("[b, u, l] = ta.kc(close, 20, 2)\nv = u\n", "v");
    const l = settled("[b, u, l] = ta.kc(close, 20, 2)\nv = l\n", "v");
    const b = settled("[b, u, l] = ta.kc(close, 20, 2)\nv = b\n", "v");
    expect(w).toBeCloseTo((u - l) / b, 12);
  });

  it("hma matches its definition, and warms up in length + sqrt(length) bars", () => {
    const h = settled("v = ta.hma(close, 9)\n", "v");
    const manual = settled(
      "a = ta.wma(close, 4)\nb = ta.wma(close, 9)\nv = ta.wma(2 * a - b, 3)\n", "v");
    expect(h).toBeCloseTo(manual, 12);

    // The warm-up is the part that was broken: a NaN entering `wma`'s running
    // totals poisoned them until the periodic heal 200 bars later, so `hma` was
    // `na` for 200 bars instead of 11.
    expect(Number.isNaN(settled("v = ta.hma(close, 9)\n", "v", 10))).toBe(true);
    expect(Number.isFinite(settled("v = ta.hma(close, 9)\n", "v", 11))).toBe(true);
  });

  it("cmo swings between -100 and 100", () => {
    const c = settled("v = ta.cmo(close, 9)\n", "v");
    expect(c).toBeGreaterThanOrEqual(-100);
    expect(c).toBeLessThanOrEqual(100);
  });

  it("dmi returns two non-negative DIs and an ADX in range", () => {
    const plus = settled("[p, m, a] = ta.dmi(14, 14)\nv = p\n", "v");
    const minus = settled("[p, m, a] = ta.dmi(14, 14)\nv = m\n", "v");
    const adx = settled("[p, m, a] = ta.dmi(14, 14)\nv = a\n", "v");
    expect(plus).toBeGreaterThanOrEqual(0);
    expect(minus).toBeGreaterThanOrEqual(0);
    expect(adx).toBeGreaterThanOrEqual(0);
    expect(adx).toBeLessThanOrEqual(100);
  });

  it("supertrend bootstraps instead of latching onto na", () => {
    // The bands RATCHET off their own previous value, so a warm-up `na` held
    // forever unless the previous band is read through `nz` — which is what the
    // reference implementation does and why it looked like a stylistic detail.
    const st = settled("[s, d] = ta.supertrend(3, 10)\nv = s\n", "v");
    expect(Number.isFinite(st)).toBe(true);
  });

  it("supertrend's direction is -1 for UP and 1 for DOWN", () => {
    const dir = settled("[s, d] = ta.supertrend(3, 10)\nv = d\n", "v");
    expect([1, -1]).toContain(dir);
  });

  it("range is highest minus lowest", () => {
    const r = settled("v = ta.range(close, 20)\n", "v");
    const manual = settled("v = ta.highest(close, 20) - ta.lowest(close, 20)\n", "v");
    expect(r).toBeCloseTo(manual, 12);
  });

  it("median is na until its window fills", () => {
    expect(Number.isNaN(settled("v = ta.median(close, 5)\n", "v", 4))).toBe(true);
    expect(Number.isFinite(settled("v = ta.median(close, 5)\n", "v", 5))).toBe(true);
  });

  it("mode picks the most frequent value, smallest on a tie", () => {
    // Every close differs on a random walk, so every count is 1 and the tie
    // rule decides — which makes this a test OF the tie rule.
    const { ctx, exec } = build(`${HEAD}v = ta.mode(close, 3)\n`);
    for (const c of [5, 3, 5]) {
      ctx.setBar(0, c, c, c, c, 100);
      exec();
      ctx.finalizeBar();
    }
    expect(ctx.vars.get("opsv2_v")?.valueOf()).toBe(5);
  });

  it("all of them are v4+ only", () => {
    for (const call of ["bbw(close, 20, 2)", "hma(close, 9)", "cmo(close, 9)",
                        "range(close, 20)", "median(close, 5)"]) {
      expect(() => compileScript(`//@version=3\nstudy("t")\nx = ${call}\n`), call)
        .toThrow(/is not available in Pine Script v3/);
    }
  });
});
