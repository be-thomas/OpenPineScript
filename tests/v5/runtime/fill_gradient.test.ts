/**
 * `fill(plot1, plot2, top_value, bottom_value, top_color, bottom_color, …)` —
 * the gradient overload. Its third argument is a price, which the colour form
 * read as `color`.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const bars = Array.from({ length: 6 }, (_, i) => ({
  time: Date.UTC(2024, 0, 1) + i * 86_400_000,
  open: 100 + i, high: 105 + i, low: 95 + i, close: 100 + i, volume: 1000,
}));

function run(src: string) {
  const s = new Session();
  expect(s.compile(src).errors).toEqual([]);
  const r = s.runHistory(bars);
  return { r, ctx: (s as any).ctx ?? null };
}

const TOP = "color.new(color.red, 99)";
const BOT = "color.new(color.red, 50)";

function expected(version: number) {
  const head = `//@version=${version}\nindicator("t")\n`;
  const { r } = run(head + `plot(1)\nplot(2)\n` + `a = color.new(color.red, 99)\nb = color.new(color.red, 50)\n` +
    `plot(0, color = a)\nplot(0, color = b)\n`);
  const cols = r.series.slice(2).map((s: any) => s.points?.[0]?.color ?? s.color);
  return { head, top: cols[0], bottom: cols[1] };
}

for (const version of [5, 6]) {
  describe(`gradient fill, v${version}`, () => {
    const { head, top, bottom } = expected(version);
    const plots = "p1 = plot(close + 10)\np2 = plot(close - 10)\n";

    const check = (src: string, title?: string) => {
      const { r } = run(head + plots + src);
      expect(r.droppedArguments).toEqual([]);
      expect(r.fills).toHaveLength(1);
      const f: any = r.fills[0];
      expect(f.gradient).toBe(true);
      expect(f.topValues).toEqual(bars.map((b) => b.close + 10));
      expect(f.bottomValues).toEqual(bars.map((b) => b.close - 10));
      expect(f.topColors.every((c: string) => c === top)).toBe(true);
      expect(f.bottomColors.every((c: string) => c === bottom)).toBe(true);
      expect(typeof f.color).toBe("string");
      expect(f.color).not.toMatch(/^[0-9.]+$/);
      if (title) expect(f.title).toBe(title);
    };

    it("positional", () => check(`fill(p1, p2, close + 10, close - 10, ${TOP}, ${BOT})\n`));
    it("positional with title and display", () =>
      check(`fill(p1, p2, close + 10, close - 10, ${TOP}, ${BOT}, "g", display.all)\n`, "g"));
    it("all keywords", () =>
      check(`fill(p1, p2, top_value = close + 10, bottom_value = close - 10, top_color = ${TOP}, bottom_color = ${BOT}, title = "g")\n`, "g"));
    it("keywords in another order, with fillgaps", () =>
      check(`fill(p1, p2, bottom_color = ${BOT}, top_color = ${TOP}, bottom_value = close - 10, top_value = close + 10, fillgaps = true, title = "g")\n`, "g"));
  });
}

describe("colour fill is unchanged", () => {
  it("has no gradient fields", () => {
    const { r } = run('//@version=5\nindicator("t")\np1 = plot(close)\np2 = plot(open)\nfill(p1, p2, color.red)\n');
    const f: any = r.fills[0];
    expect(f.gradient).toBeUndefined();
    expect(f.topValues).toBeUndefined();
  });
});

describe("conditional colour fill with an na colour", () => {
  // bars rise (close > open is false everywhere here), so the colour is na on every bar
  for (const version of [5, 6]) {
    it(`v${version}: fill(p1, p2, cond ? color.green : na) stays a colour fill`, () => {
      const { r } = run(`//@version=${version}\nindicator("t")\np1 = plot(close)\np2 = plot(open)\n` +
        `fill(p1, p2, close < open ? color.green : na)\n`);
      const f: any = r.fills[0];
      expect(f.gradient).toBeUndefined();
      expect(f.topValues).toBeUndefined();
    });
    it(`v${version}: with a title it stays a colour fill`, () => {
      const { r } = run(`//@version=${version}\nindicator("t")\np1 = plot(close)\np2 = plot(open)\n` +
        `fill(p1, p2, close < open ? color.green : na, "t")\n`);
      expect((r.fills[0] as any).gradient).toBeUndefined();
    });
  }
});
