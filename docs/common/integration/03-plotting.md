# 3 · Plotting

Turning a `SimResult` into chart primitives. Four independent outputs:
**series**, **fills**, **drawings** and **logs**.

## Series

One entry per `plot()`, `plotshape()`, `plotchar()`, `plotarrow()`,
`plotcandle()`, `bgcolor()` or `barcolor()` call in the script.

```ts
interface RenderSeries {
  id: string;                     // stable across runs ("plot@L6:C0"); use as your series key
  title: string;                  // the script's title
  type: "line" | "candle" | "marker" | "arrow" | "bgcolor" | "barcolor";
  pane: "main" | "sub";
  timeframe?: string;
  color?: string;                 // "#RRGGBB" or "#RRGGBBAA"; NaN when the first value is na (see Colours)
  style?: string | number;
  linewidth?: number;
  location?: string;              // markers: abovebar, belowbar, top, bottom, absolute
  text?: string; size?: string;   // plotshape / plotchar text and size
  textcolor?: string;             // markers only
  offset?: number;                // informational, present only when non-zero
  data: RenderPoint[];
}

type RenderPoint =
  | { value: number; color?: string }                              // line, marker, arrow
  | { open: number; high: number; low: number; close: number; color?: string }  // candle
  | { color: string }                                              // bgcolor, barcolor
  | null;                                                          // na: draw nothing
```

### The rules that matter

**1 · `data` is index-aligned with your candles.** `data[i]` belongs to
`candles[i]`. Join on the index, never by searching timestamps. `data` can be
**longer** than `candles` (a positive `offset`, rule 4), so iterate your candles
and look the point up, or give the extra indices a time as `timeAt` does under
"Putting it together".

**2 · `null` is `na`, and it is not zero.** An `sma(close, 20)` is `null` for the
first 19 bars. Plotting zero draws a cliff from 0 to the first real value, the
most common integration bug. Map it to your library's gap (`undefined`, `NaN`, or
omit the point). The engine never emits `NaN` as a value.

```ts
const points = candles.map((c, i) => {
  const d = series.data[i];
  return { time: c.time, value: d && "value" in d ? d.value : undefined };  // gap, not 0
});
```

**3 · `pane` is the script's decision, not yours.** Read `series.pane` and do
not derive it from `type`. For an indicator declared `overlay = false`, `line`,
`marker` and `arrow` series come back as `pane: "sub"`. **Current behaviour,
not a promise:** `candle`, `bgcolor` and `barcolor` series come back as
`pane: "main"` whatever `overlay` says (checked by running `plotcandle`,
`bgcolor` and `barcolor` in an `overlay = false` indicator). It has not been
compared with TradingView's placement of those three in a sub-pane indicator,
so a host that follows `pane` will pick up any correction without a change.

**4 · `offset` is already applied.** `plot(x, offset = -2)` arrives with `data`
shifted; draw `data[i]` at bar `i` and do not shift it again. A positive offset
makes `data` longer than your candles (`plot(close, offset = 2)` over 60 candles
returns 62 points, the first two `null`), so those last indices are bars that
do not exist yet; a negative one leaves trailing `null`s and keeps the length.

### Mapping each type

| `type` | Pine source | Draw it as |
|---|---|---|
| `line` | `plot()` | A line series. `style` is Pine's plot style (`line`, `stepline`, `histogram`, `cross`, `area`, `columns`, `circles`); `linewidth` is pixels |
| `candle` | `plotcandle()` | A candlestick series from the `{open, high, low, close}` points |
| `marker` | `plotshape()`, `plotchar()` | A marker on bar `i`, placed by `location` (`value` is **not** a price for `abovebar`/`belowbar`: `plotshape(close > open)` has value 1). `style` carries the shape name or character; `text`, `textcolor`, `size` as given |
| `arrow` | `plotarrow()` | An up arrow for a positive `value`, down for negative |
| `bgcolor` | `bgcolor()` | A full-height background band on that bar, in `data[i].color` |
| `barcolor` | `barcolor()` | Recolour the price bar itself |

`bgcolor` and `barcolor` carry **no numeric value**, only a colour per bar, and
`null` where the script passed `na` (leave the bar alone).

### Colours

`color` is `#RRGGBB`, or `#RRGGBBAA` when the script applied transparency
(`color.new(color.red, 50)`). Alpha is the **last** byte, so a library that wants
`rgba()` needs a conversion, and one that ignores 8-digit hex renders fully
opaque.

**`color` is not always a string.** The series colour is taken from the script's
first value. When that is `na` (`bgcolor(close > open ? color.green : na)` on a
bar that closes down) it is the number `NaN`, which becomes `null` after
`JSON.stringify` or `postMessage`. Treat any non-string as "no series colour",
and fall back to the points' own colours or your default:

```ts
const seriesColor = typeof series.color === "string" ? series.color : undefined;
const colorAt = (d: { color?: string }) => d.color ?? seriesColor ?? defaultColor;
```

A point's own `color` is present only where the script chose a different colour
on that bar than the series default (`plot(close, color = close > open ? green : red)`).
It overrides the series-level `color`; a host that ignores it still draws the
right shape in the series colour.

## Fills

```ts
{ plotId1: string; plotId2: string; color: string; title: string;
  colors?: Array<string | null>;   // per-bar colour, only when it varies
  showLast?: number }              // fill(show_last = N), already applied to `colors`
```

`fill(plot1, plot2, color)` shades the band between two plots (or two
`hline()`s). `plotId1` and `plotId2` hold the plots' **titles**, not their
`RenderSeries.id`: resolve each against `result.series` by `title`
(`fill(a, b)` over `plot(x, "Fast")` and `plot(y, "Slow")` gives `"Fast"` and
`"Slow"`; an `hline` without a title is `"HLine"`). Two plots with the same
title cannot be told apart, so give the plots a fill joins distinct titles. A
fill belongs on the pane of the series it joins (`pane` of the series whose
`title` is `plotId1`). Where either side is `null` on a bar, there is nothing
to fill. When `colors` is present use `colors[i]` for bar `i` (`null` means not
drawn there): that is how an Ichimoku cloud changes colour.

## Drawings

`line`, `box`, `label`, `table`, `polyline` and `linefill` objects. These are
**not** per-bar series: they have coordinates and a lifetime.

```ts
interface Drawing {
  id: string;                      // "label_0", "line_1", "box_2", …: opaque, unique
  kind: "line" | "label" | "box" | "table" | "polyline" | "linefill";
  bar: number;                     // the bar index it was created on
  props: Record<string, any>;      // the drawing's own fields, already resolved
}
```

One counter numbers every kind together, so a script that creates a label, a
line and a box on each bar gets `label_0`, `line_1`, `box_2`, `label_3`, …, and
the survivors of the cap below can start anywhere (`label_1231`). Treat an id as
an opaque key. Do not assume a per-kind sequence or parse the number. A
`linefill` refers to its two lines by these ids.

| kind | props |
|---|---|
| `line` | `x1`, `y1`, `x2`, `y2`, `xloc`, `extend`, `color`, `style`, `width` |
| `box` | `left`, `top`, `right`, `bottom`, `border_color`, `border_width`, `border_style`, `extend`, `xloc`, `bgcolor`, `text`, `text_size`, `text_color`, `text_halign`, `text_valign`, `text_wrap`, `text_font_family` |
| `label` | `x`, `y`, `text`, `xloc`, `yloc`, `color`, `style`, `textcolor`, `size`, `textalign`, `tooltip`, `text_font_family` |

The other kinds carry the fields of their Pine constructors; inspect `props`.

### `xloc` decides what the x coordinate means

- `"bar_index"` (the default): x is a **bar index**. Convert with
  `candles[x].time`, and expect indices past the end for a projected line:
  `timeAt(x)` in the example below extends past the last bar.
- `"bar_time"`: x is already a **UNIX millisecond timestamp**.

Getting this wrong puts every drawing at the epoch or at bar 1.

### Drawings are capped, as on TradingView

Pine keeps a limited number of each of `line`, `label`, `box`, `polyline` and
`linefill`: **50 by default**, or the script's own `max_lines_count`,
`max_labels_count`, `max_boxes_count`, `max_polylines_count`. The engine applies
TradingView's rule, which is measured rather than assumed: drawings pile up to
limit + 5 and are then cut back to the limit in one go, so the survivors number
between `limit` and `limit + 5`. `result.drawings` is the **surviving** set in
creation order; draw them in that order so a later one overlaps an earlier one.
Tables are not capped: Pine limits them by position, one per slot.

## Logs

```ts
interface LogEntry {
  level: "info" | "warning" | "error";
  message: string;
  bar: number;                     // index into your candles
  time: number;                    // that bar's timestamp
}
```

Everything the script wrote with `log.*`: a natural console pane under the
chart, where clicking a line scrolls to `bar`. A script logging on every bar
produces one entry per bar and there is no cap, so paginate.

## Putting it together

`mainPane` and `subPane` stand for your charting library.

```ts
function render(result: SimResult, candles: Candle[]) {
  // `data` can be longer than `candles` (positive offset): extend past the last
  // bar by the last bar interval. Calendar gaps are not modelled.
  const last = candles.length - 1;
  const step = last > 0 ? candles[last].time - candles[last - 1].time : 0;
  const timeAt = (i: number) =>
    i <= last ? candles[i].time : candles[last].time + (i - last) * step;
  const paneOf = (s: RenderSeries) => (s.pane === "main" ? mainPane : subPane);
  const seriesByTitle = new Map(result.series.map(s => [s.title, s]));

  for (const s of result.series) {
    const target = paneOf(s);
    const seriesColor = typeof s.color === "string" ? s.color : undefined;  // can be NaN

    switch (s.type) {
      case "line":
        target.line(s.id, { title: s.title, color: seriesColor, width: s.linewidth })
              .set(s.data.map((d, i) => ({
                 time: timeAt(i),
                 value: d && "value" in d ? d.value : undefined,
              })));
        break;

      case "candle":
        target.candles(s.id).set(s.data.flatMap((d, i) =>
          d && "open" in d ? [{ time: timeAt(i), ...d }] : []));
        break;

      case "marker":
      case "arrow":
        target.markers(s.id, s.data.flatMap((d, i) =>
          d && "value" in d
            ? [{ time: timeAt(i), value: d.value, shape: s.style,
                 location: s.location, text: s.text, color: d.color ?? seriesColor }]
            : []));
        break;

      case "bgcolor":
      case "barcolor":
        target.shade(s.id, s.data.flatMap((d, i) =>
          d && "color" in d ? [{ time: timeAt(i), color: d.color }] : []));
        break;
    }
  }

  for (const f of result.fills) {
    // Fills carry plot titles; draw on the pane of the plots they join.
    const first = seriesByTitle.get(f.plotId1);
    if (first) paneOf(first).band(f.plotId1, f.plotId2, f.colors ?? f.color);
  }

  for (const d of result.drawings) {
    const atTime = (x: number) =>
      d.props.xloc === "bar_time" ? x : timeAt(x);
    if (d.kind === "line")  mainPane.line2(atTime(d.props.x1), d.props.y1,
                                           atTime(d.props.x2), d.props.y2, d.props);
    if (d.kind === "label") mainPane.label(atTime(d.props.x), d.props.y, d.props);
    if (d.kind === "box")   mainPane.box(atTime(d.props.left), d.props.top,
                                         atTime(d.props.right), d.props.bottom, d.props);
  }
}
```
