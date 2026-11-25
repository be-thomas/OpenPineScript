/**
 * `Session.setVisibleRange` feeds chart.left_visible_bar_time and
 * chart.right_visible_bar_time, on history and live bars alike; without one the
 * first and last bar times answer.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../runtime/v1/session";

const H = 3600_000, t0 = 1_700_000_000_000;
const bars = Array.from({ length: 6 }, (_, i) => ({ time: t0 + i * H, open: 1, high: 2, low: 0, close: 1, volume: 1 }));
const SRC = `//@version=6\nindicator("t")\nplot(chart.left_visible_bar_time, "l")\nplot(chart.right_visible_bar_time, "r")\n`;
const col = (r: any, t: string) => r.series.find((x: any) => x.title === t).data.map((p: any) => p?.value);

describe("visible range", () => {
  it("returns the caller's range on every bar, persists, and can be cleared", () => {
    const s = new Session();
    expect(s.compile(SRC).errors).toEqual([]);
    s.setVisibleRange(t0 + 2 * H, t0 + 4 * H);
    let r: any = s.runHistory(bars);
    expect(col(r, "l")).toEqual(bars.map(() => t0 + 2 * H));
    expect(col(r, "r")).toEqual(bars.map(() => t0 + 4 * H));
    r = s.runHistory(bars);                        // persists across runs
    expect(col(r, "l")[0]).toBe(t0 + 2 * H);
    s.tick({ time: t0 + 6 * H, open: 1, high: 2, low: 0, close: 1, volume: 1 });
    expect(s.render().series.find((x: any) => x.title === "r")!.data.at(-1)!.value).toBe(t0 + 4 * H);

    s.clearVisibleRange();
    r = s.runHistory(bars);
    expect(col(r, "l")[0]).toBe(t0);
    expect(col(r, "r").at(-1)).toBe(t0 + 5 * H);
  });
});
