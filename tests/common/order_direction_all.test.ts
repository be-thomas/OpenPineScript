/**
 * `strategy.direction.all` belongs to `strategy.risk.allow_entry_in` only. TradingView refuses
 * it as the direction of `strategy.entry` / `strategy.order` at v2 to v6
 * (dev-docs/tv-parity/_probes/dirall, runs v2-v4; the compile check at v5 and v6:
 * "Invalid argument 'direction' in 'strategy.entry' call. Possible values: [strategy.long,
 * strategy.short]"). The engine compiled it and opened a SHORT.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../runtime/v1/session";

function compile(version: number, body: string) {
  const s = new Session();
  s.setChart({ symbol: "X", timeframe: "60", mintick: 0.01, timezone: "UTC" } as any);
  return { c: s.compile(`//@version=${version}\nstrategy("t")\n${body}`) };
}

describe.each([2, 3, 4, 5, 6])("v%i strategy.direction.all as an order direction", (version) => {
  it.each(["strategy.entry(\"x\", strategy.direction.all)", "strategy.order(\"x\", strategy.direction.all, 1)"])(
    "%s does not compile", (call) => {
      const { c } = compile(version, `${call}\n`);
      expect(c.errors.map((e: any) => e.message ?? String(e)).join("\n")).toMatch(/Invalid argument 'direction'/);
    });

  it("allow_entry_in still accepts it", () => {
    const { c } = compile(version, `strategy.risk.allow_entry_in(strategy.direction.all)\nstrategy.entry("x", strategy.long)\n`);
    expect(c.errors).toEqual([]);
  });

  it("through a variable, it is a runtime error instead of a short", () => {
    const { c } = compile(version, `d = strategy.direction.all\nstrategy.entry("x", d)\n`);
    expect(c.errors.map((e: any) => `${e.phase}: ${e.message}`)).toEqual(
      ["runtime: Invalid argument 'direction' in 'strategy.entry' call. Possible values: [strategy.long, strategy.short]"]);
  });
});
