/**
 * v4 spells two label styles without the underscore: `label.style_labelup` and
 * `label.style_labeldown` compile and draw the same shapes as
 * `label.style_label_up` / `label.style_label_down` (TradingView drawing styles
 * "lup" / "ldn"; dev-docs/tv-parity/_probes/corpus98/p3_v4_label_styles,
 * BINANCE:BTCUSDT 1h, 2026-11-14). v5 and v6 were not probed and still refuse
 * them.
 */
import { describe, it, expect } from "vitest";
import { Session, type Candle } from "../../../runtime/v1/session";

const bars: Candle[] = Array.from({ length: 3 }, (_, i) => ({
  time: Date.UTC(2025, 0, 1, i), open: 10, high: 12, low: 9, close: 11, volume: 1,
}));

function labelStyles(version: number, up: string, down: string) {
  const s = new Session();
  s.setChart({ timeframe: "60", symbol: "BINANCE:BTCUSDT" });
  const decl = version === 4 ? 'study("p3", overlay=true)' : 'indicator("p3", overlay=true)';
  const c = s.compile(`//@version=${version}
${decl}
if barstate.islast
    label.new(bar_index, high, "up", style=${up})
    label.new(bar_index, low, "down", style=${down})
plot(close, "c")
`);
  return { errors: c.errors, labels: c.errors.length ? [] : s.runHistory(bars).drawings.filter(d => d.kind === "label") };
}

describe("v4 label style spellings", () => {
  it("style_labelup / style_labeldown draw what style_label_up / style_label_down draw", () => {
    const a = labelStyles(4, "label.style_labelup", "label.style_labeldown");
    const b = labelStyles(4, "label.style_label_up", "label.style_label_down");
    expect(a.errors).toEqual([]);
    expect(a.labels.length).toBe(2);
    expect(a.labels.map(l => l.props.style)).toEqual(b.labels.map(l => l.props.style));
    expect(a.labels.map(l => l.props.style)).toEqual(["label_up", "label_down"]);
  });

  it.each([5, 6])("v%i still refuses the spellings (unprobed)", (version) => {
    const { errors } = labelStyles(version, "label.style_labelup", "label.style_labeldown");
    expect(errors.length).toBeGreaterThan(0);
    expect(labelStyles(version, "label.style_label_up", "label.style_label_down").errors).toEqual([]);
  });
});
