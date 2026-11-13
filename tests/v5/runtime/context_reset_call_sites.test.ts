/**
 * A Context re-run on a second script must not remember the first script's
 * call sites. A call's id is its position in the source, so two scripts reuse
 * the same ids for different calls: the second script's `ta.sma(source = open,
 * length = 3)` once ran with the first's cached argument plan, and came back
 * as na on every bar.
 */
import { describe, it, expect } from "vitest";
import { Context, compile, compileScript, buildRenderModel } from "../../../index";

const A = compileScript(`//@version=5
indicator("A")
x = ta.sma(close, length = 2)
plot(x, "a")`);
const B = compileScript(`//@version=5
indicator("B")
x = ta.sma(source = open, length = 3)
plot(x, "b")`);
const bars = [1, 2, 3, 4, 5].map((c, i) => ({ time: i * 86_400_000, open: c * 10, high: c * 10, low: c, close: c, volume: 1 }));

function go(ctx: Context, js: string) {
  ctx.reset();
  const exec = compile(js, ctx, Object.create(null));
  for (const b of bars) { ctx.setBar(b.time, b.open, b.high, b.low, b.close, b.volume); exec(); ctx.finalizeBar(); }
  return buildRenderModel(ctx).series.map((s: any) => s.data.map((d: any) => d?.value ?? null));
}

describe("Context.reset", () => {
  it("a second script on a reused Context gets the answers it would on a fresh one", () => {
    const ctx = new Context(A.profile);
    expect(go(ctx, A.js)).toEqual([[null, 1.5, 2.5, 3.5, 4.5]]);
    // sma(open, 3) over 10, 20, 30, 40, 50
    expect(go(ctx, B.js)).toEqual([[null, null, 20, 30, 40]]);
  });
});
