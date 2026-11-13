/**
 * Named colours and drawing defaults, per Pine version, as TradingView draws them.
 *
 * Source: TradingView chart runs of 2026-11-12, plot colours read from
 * outputs.json, under dev-docs/tv-parity/_probes/version-scope/:
 *   v1-palette-17 ... v6-palette-17   (all 17 named colours at each version)
 *   v4-draw-fmt, v5-draw-defaults, v6-draw-defaults
 *     (label.new / box.new / line.new with no colour arguments)
 */
import { describe, it, expect } from "vitest";
import { build } from "../helpers";

const NAMES = ["aqua", "black", "blue", "fuchsia", "gray", "green", "lime", "maroon", "navy",
  "olive", "orange", "purple", "red", "silver", "teal", "white", "yellow"] as const;

type Row = Record<(typeof NAMES)[number], string>;

const V1: Row = {
  aqua: "#00FFFF", black: "#000000", blue: "#0000FF", fuchsia: "#FF00FF", gray: "#808080",
  green: "#008000", lime: "#00FF00", maroon: "#800000", navy: "#000080", olive: "#808000",
  orange: "#FF7F00", purple: "#800080", red: "#FF0000", silver: "#C0C0C0", teal: "#008080",
  white: "#FFFFFF", yellow: "#FFFF00",
};
const V4: Row = {
  aqua: "#00BCD4", black: "#363A45", blue: "#2196F3", fuchsia: "#E040FB", gray: "#787B86",
  green: "#4CAF50", lime: "#00E676", maroon: "#880E4F", navy: "#311B92", olive: "#808000",
  orange: "#FF9800", purple: "#9C27B0", red: "#FF5252", silver: "#B2B5BE", teal: "#00897B",
  white: "#FFFFFF", yellow: "#FFEB3B",
};
const V5: Row = { ...V4, blue: "#2962FF" };
const V6: Row = { ...V5, red: "#F23645", teal: "#089981", yellow: "#FDD835" };

const CASES: [number, Row, string, boolean][] = [
  [1, V1, "", false],
  [2, V1, "//@version=2\n", false],
  [3, V1, "//@version=3\n", false],
  [4, V4, "//@version=4\n", true],
  [5, V5, "//@version=5\n", true],
  [6, V6, "//@version=6\n", true],
];

function plotColors(src: string): Record<string, string> {
  const { ctx, exec } = build(src);
  ctx.setBar(0, 10, 12, 9, 11, 100);
  exec();
  ctx.finalizeBar();
  const out: Record<string, string> = {};
  for (const [, entries] of (ctx as any).plots) {
    const d = entries.find((e: any) => e);
    out[d.title] = d.color;
  }
  return out;
}

describe("named colours per version (TradingView palette probes)", () => {
  it.each(CASES)("v%i resolves all 17 named colours", (version, table, head, namespaced) => {
    const directive = version >= 5 ? "indicator" : "study";
    const plots = NAMES.map((n) => `plot(close, "${n}", color = ${namespaced ? "color." : ""}${n})`).join("\n");
    const got = plotColors(`${head}${directive}("t")\n${plots}\n`);
    expect(got).toEqual(table);
  });
});

describe("drawing defaults per version (draw-defaults probes)", () => {
  const CASES_D: [number, string, string, string][] = [
    [4, "//@version=4\nstudy(\"t\")\n", "#2196F3", "#363A45"],
    [5, "//@version=5\nindicator(\"t\")\n", "#2962FF", "#363A45"],
    [6, "//@version=6\nindicator(\"t\")\n", "#2962FF", "#FFFFFF"],
  ];
  it.each(CASES_D)("v%i box/label/line defaults", (_v, head, blue, labelText) => {
    const src = head +
      "l = label.new(0, 1.0, \"a\")\nb = box.new(0, 2.0, 1, 1.0)\nn = line.new(0, 1.0, 1, 2.0)\n";
    const { ctx, exec } = build(src);
    ctx.setBar(0, 10, 12, 9, 11, 100);
    exec();
    ctx.finalizeBar();
    const kind = (k: string) => [...(ctx as any).drawings.values()].find((d: any) => d.kind === k).props;
    expect(kind("box").bgcolor).toBe(blue);
    expect(kind("box").border_color).toBe(blue);
    expect(kind("label").textcolor).toBe(labelText);
    expect(kind("label").color).toBe(blue);
    expect(kind("line").color).toBe(blue);
  });
});
