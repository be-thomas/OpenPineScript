/**
 * `chart.point.new(time, index, price)` argument order, and the truncation of
 * fractional `xloc.bar_index` coordinates.
 *
 * The constructor took `(index, time, price)`, so `chart.point.new(time[2], na,
 * close)` produced time = na and every `xloc.bar_time` drawing built from it
 * landed on x = na. And `label.new(bar_index + 1.5, …)` kept x = 10.5, where
 * TradingView places the label on bar int(x) = 10.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const bars = Array.from({ length: 10 }, (_, i) => ({
  time: Date.UTC(2024, 0, 1) + i * 60000,
  open: 10 + i, high: 11 + i, low: 9 + i, close: 10 + i, volume: 100,
}));

function drawings(body: string, version = 5): any[] {
  const s = new Session();
  s.setChart({ symbol: "BINANCE:BTCUSDT", timeframe: "1" });
  const src = `//@version=${version}\nindicator("t", overlay = true)\nif barstate.islast\n` +
    body.split("\n").map((l) => "    " + l).join("\n") + "\n";
  expect(s.compile(src).errors).toEqual([]);
  return (s.runHistory(bars) as any).drawings;
}

describe("chart.point.new(time, index, price)", () => {
  it("a label at a point's time lands on that bar's time", () => {
    const [d] = drawings('label.new(chart.point.new(time[2], na, close), "t", xloc.bar_time)');
    expect(d.props.x).toBe(bars[7].time);
    expect(d.props.xloc).toBe("bar_time");
  });

  it("a line between two points by time", () => {
    const [d] = drawings(
      "line.new(chart.point.new(time[3], na, close), chart.point.new(time, na, close), xloc = xloc.bar_time)");
    expect([d.props.x1, d.props.x2]).toEqual([bars[6].time, bars[9].time]);
  });

  it("a label at a point's index", () => {
    const [d] = drawings('label.new(chart.point.new(na, bar_index - 1, close), "i", xloc.bar_index)');
    expect(d.props.x).toBe(8);
  });

  it("box.set_top_left_point / set_bottom_right_point read the time", () => {
    const [d] = drawings(
      "b = box.new(na, na, na, na, xloc = xloc.bar_time)\n" +
      "b.set_top_left_point(chart.point.new(time[4], na, high))\n" +
      "b.set_bottom_right_point(chart.point.new(time, na, low))");
    expect([d.props.left, d.props.right, d.props.top, d.props.bottom])
      .toEqual([bars[5].time, bars[9].time, 20, 18]);
  });

  it("line.set_first_point / set_second_point read the time", () => {
    const [d] = drawings(
      "l = line.new(na, na, na, na, xloc = xloc.bar_time)\n" +
      "l.set_first_point(chart.point.new(time[2], na, close))\n" +
      "l.set_second_point(chart.point.new(time, na, close))");
    expect([d.props.x1, d.props.x2]).toEqual([bars[7].time, bars[9].time]);
  });

  it("keyword arguments bind by name", () => {
    const [d] = drawings(
      'p = chart.point.new(time = time[1], index = na, price = close)\n' +
      'label.new(p, "k", xloc.bar_time)');
    expect(d.props.x).toBe(bars[8].time);
  });

  it("positional fields land in .time and .index", () => {
    const [d] = drawings(
      'p = chart.point.new(time[1], bar_index - 1, close)\n' +
      'label.new(bar_index, close, str.tostring(p.index) + "," + str.tostring(p.time))');
    expect(d.props.text).toBe(`8,${bars[8].time}`);
  });
});

// A provably-float x is a compile error on v4–v6 (type_errors_tv.test.ts, "D"). The
// only fractional x TradingView lets through is v6 `int / int`, which is a float
// there: TLM HTF Candles' `bar_index + width / 2` (ENGINE-BUGS §21) lands on the
// truncated bar. Each case below reaches the fraction that way (h = 3, h / 2 = 1.5).
describe("fractional bar_index x truncates (v6 int / int)", () => {
  const v6 = (body: string) => drawings("h = 3\n" + body, 6);

  it("label.new", () => {
    const [d] = v6('label.new(bar_index + h / 2, close, "f")');
    expect(d.props.x).toBe(10);
  });

  it("line.new", () => {
    const [d] = v6("line.new(bar_index - h / 2, close, bar_index + h / 2, close)");
    expect([d.props.x1, d.props.x2]).toEqual([7, 10]);
  });

  it("label.set_x", () => {
    const [d] = v6('lb = label.new(bar_index, close, "s")\nlabel.set_x(lb, bar_index - h / 2 - 2)');
    expect(d.props.x).toBe(5);
  });

  it("box.new", () => {
    const [d] = v6("box.new(bar_index - h / 2 - 3, high, bar_index + h / 2 + 1, low)");
    expect([d.props.left, d.props.right]).toEqual([4, 11]);
  });

  it("xloc.bar_time is NOT truncated", () => {
    const [d] = v6('label.new(time + h / 2, close, "bt", xloc.bar_time)');
    expect(d.props.x).toBe(bars[9].time + 1.5);
  });
});
