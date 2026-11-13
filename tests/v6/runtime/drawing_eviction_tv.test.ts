/**
 * Which drawings go when a kind passes `max_*_count + 5`, against TradingView.
 * Probes in dev-docs/tv-parity/_probes/version-scope/ (limit 10 in all; the
 * source of each is its editor.txt, the evidence its pine_logs.json):
 *
 *   v6-gc-order-1, v6-gc-order-2, v6-gc-order-3, v5-gc-order
 *
 * What they showed, and what the engine does about it (Context.evictDrawings):
 *
 *   - a drawing held directly by a `var` / `varip` variable is never evicted;
 *     one held only inside an `array<>` is not protected;
 *   - on a historical bar the oldest unprotected drawings go until the count
 *     is the limit;
 *   - on the realtime bar a pass first removes unprotected drawings from
 *     EARLIER bars, oldest first, and stops there even if the count is still
 *     over the limit; only when none are left does it remove the current
 *     bar's own, oldest first.
 *
 * Every realtime tick re-runs the bar from its committed state, so the result
 * is the same on each tick. v4 and earlier were not probed and keep the plain
 * oldest-first cut.
 */
import { describe, it, expect } from "vitest";
import { Session } from "../../../runtime/v1/session";

const H = 3_600_000;
const t0 = Date.UTC(2024, 0, 1);
const N = 30;   // history bars; the last, N - 1, is `barstate.islastconfirmedhistory`
const bars = Array.from({ length: N }, (_, i) => ({
  time: t0 + i * H, open: 100, high: 101, low: 99, close: 100, volume: 1,
}));
const rt = (time = t0 + N * H) => ({ time, open: 100, high: 101, low: 99, close: 100, volume: 1 });

const header = (v: number) => v === 6
  ? `//@version=6\nindicator("gc", overlay = true, max_lines_count = 10, max_boxes_count = 10, max_labels_count = 10)\n`
  : `//@version=${v}\nindicator("gc", overlay = true, max_lines_count = 10, max_boxes_count = 10, max_labels_count = 10)\n`;

function start(src: string) {
  const s = new Session();
  s.setChart({ symbol: "TEST:X", timeframe: "60", mintick: 0.01 });
  expect(s.compile(src).errors).toEqual([]);
  const r: any = s.runHistory(bars);
  expect(r.errors ?? []).toEqual([]);
  return s;
}

const live = (s: Session, kind: string): any[] =>
  [...(s as any).ctx.drawings.values()].filter((d: any) => d.kind === kind);
const y1 = (s: Session) => live(s, "line").map(d => d.props.y1);
const tops = (s: Session) => live(s, "box").map(d => d.props.top);
const texts = (s: Session) => live(s, "label").map(d => d.props.text);
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

describe("v6-gc-order-1: unreferenced drawings", () => {
  const src = header(6) + `
if bar_index == last_bar_index - 10
    for k = 1 to 3
        line.new(bar_index, k, bar_index + 1, k)
        box.new(bar_index, k, bar_index + 1, k - 0.5)
        label.new(bar_index, k, "A" + str.tostring(k))
if barstate.islastconfirmedhistory
    for k = 1 to 13
        line.new(bar_index - 200, 100 + k, bar_index, 100 + k)
if barstate.isrealtime
    for k = 1 to 13
        box.new(bar_index + 5, 100 + k, bar_index + 6, 99.5 + k)
        label.new(bar_index - 200, 100 + k, "B" + str.tostring(k))
`;

  it("history: the three old lines go first, then the oldest new ones", () => {
    expect(y1(start(src))).toEqual(range(104, 113));
  });

  it("realtime: earlier-bar drawings go and the pass stops, so 13 stay", () => {
    const s = start(src);
    for (let tick = 0; tick < 3; tick++) {
      s.tick(rt());
      expect(tops(s)).toEqual(range(101, 113));
      expect(texts(s)).toEqual(range(1, 13).map(k => `B${k}`));
    }
  });
});

describe("v6-gc-order-2: var-held drawings", () => {
  const src = header(6) + `
var line l1 = na
var line l2 = na
var line l3 = na
if bar_index == last_bar_index - 10
    l1 := line.new(bar_index, 1, bar_index + 1, 1)
    l2 := line.new(bar_index, 2, bar_index + 1, 2)
    l3 := line.new(bar_index, 3, bar_index + 1, 3)
    for k = 1 to 3
        box.new(bar_index, k, bar_index + 1, k - 0.5)
if barstate.islastconfirmedhistory
    for k = 1 to 30
        label.new(bar_index - 100, 100 + k, "H" + str.tostring(k))
if barstate.isrealtime
    for k = 1 to 30
        line.new(bar_index - 200, 100 + k, bar_index, 100 + k)
        box.new(bar_index - 200, 100 + k, bar_index, 99.5 + k)
`;

  it("history: 30 labels on one bar leave H19..H30", () => {
    expect(texts(start(src))).toEqual(range(19, 30).map(k => `H${k}`));
  });

  it("realtime: the var-held lines survive, the unreferenced boxes do not", () => {
    const s = start(src);
    for (let tick = 0; tick < 3; tick++) {
      s.tick(rt());
      expect(y1(s)).toEqual([1, 2, 3, ...range(119, 130)]);
      expect(tops(s)).toEqual(range(119, 130));
    }
  });
});

describe("v6-gc-order-3 and v5-gc-order: array-held drawings are not protected", () => {
  const body = `
var line l1 = na
var line l2 = na
var line l3 = na
var array<box> ab = array.new<box>()
varip int ticks = 0
if bar_index == last_bar_index - 10
    l1 := line.new(bar_index, 1, bar_index + 1, 1)
    l2 := line.new(bar_index, 2, bar_index + 1, 2)
    l3 := line.new(bar_index, 3, bar_index + 1, 3)
    for k = 1 to 3
        ab.push(box.new(bar_index, k, bar_index + 1, k - 0.5))
        label.new(bar_index, k, "A" + str.tostring(k))
if barstate.islastconfirmedhistory
    for k = 1 to 13
        line.new(bar_index - 200, 100 + k, bar_index, 100 + k)
        box.new(bar_index - 200, 100 + k, bar_index, 99.5 + k)
if barstate.isrealtime
    ticks += 1
    for k = 1 to LABELS
        label.new(bar_index - 200, 100 + k, "B" + str.tostring(k))
`;

  it("v6 history: var lines survive, array boxes are evicted", () => {
    const s = start(header(6) + body.replace("LABELS", "13"));
    expect(y1(s)).toEqual([1, 2, 3, ...range(107, 113)]);
    expect(tops(s)).toEqual(range(104, 113));
  });

  it("v6 realtime: 3 old labels and 13 new, on every tick, leave B1..B13", () => {
    const s = start(header(6) + body.replace("LABELS", "13"));
    for (let tick = 0; tick < 3; tick++) {
      s.tick(rt());
      expect(texts(s)).toEqual(range(1, 13).map(k => `B${k}`));
    }
  });

  it("v5 history: the same as v6", () => {
    const s = start(header(5) + body.replace("LABELS", "30"));
    expect(y1(s)).toEqual([1, 2, 3, ...range(107, 113)]);
    expect(tops(s)).toEqual(range(104, 113));
  });

  it("v5 realtime: 3 old labels and 30 new leave B19..B30, on every tick", () => {
    const s = start(header(5) + body.replace("LABELS", "30"));
    for (let tick = 0; tick < 3; tick++) {
      s.tick(rt());
      expect(texts(s)).toEqual(range(19, 30).map(k => `B${k}`));
    }
  });

  it("a later bar of ticks starts from the committed drawings", () => {
    const s = start(header(5) + body.replace("LABELS", "30"));
    s.tick(rt());
    s.commit();
    s.tick(rt(t0 + (N + 1) * H));
    // the first realtime bar's twelve survivors are now "earlier bars" and go first
    expect(texts(s)).toEqual(range(19, 30).map(k => `B${k}`));
  });
});

describe("v4 keeps the plain oldest-first cut", () => {
  it("a var-held line is evicted like any other", () => {
    const src = `//@version=4\nstudy("gc", overlay = true, max_lines_count = 10)\n` +
      `var line l1 = na\n` +
      `if bar_index == 0\n    l1 := line.new(bar_index, 1, bar_index + 1, 1)\n` +
      `if bar_index > 0\n    line.new(bar_index, 100 + bar_index, bar_index + 1, 1)\n`;
    const s = new Session();
    expect(s.compile(src).errors).toEqual([]);
    s.runHistory(bars);
    expect(y1(s)).toEqual(range(100 + N - 12, 100 + N - 1));   // the sawtooth's twelve newest; the held line is gone
  });
});
