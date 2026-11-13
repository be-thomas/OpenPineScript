# Parse and runtime error captures

One tiny script per case, each written from scratch. Paste each into the Pine
Editor, click "Add to chart" (or Save), and screenshot TradingView's message.
The engine's own wording is being compared with TradingView's.

Run each on any chart (BINANCE:BTCUSDT 1D is fine). Save the screenshots here as
`<script name without .pine>.png`.

| File | What it does | Capture |
| --- | --- | --- |
| `pe1_string_across_lines.pine` | a string literal broken across two lines (line 3) | the whole error: its text, the line and column it points at |
| `pe2_dollar_in_name.pine` | `$` inside a variable name (`my$var`, line 3) | the text, line and column |
| `pe3_no_version_v5_body.pine` | no `//@version` line, and v5-style `ta.sma` in the body | the text (TradingView will treat it as v1) and the line it blames |
| `pe4_doubled_version.pine` | `//@version=5//@version=5` on one line | whether it compiles; if not, the text, line and column |
| `pe5_ends_mid_statement.pine` | the file ends in the middle of `x = ta.sma(close,` (no trailing newline) | the text, line and column (end of file) |
| `pe6_array_get_out_of_bounds.pine` | runtime (TradingView raised NO error on this one; the result is unexplained, see pe6b): `array.get(a, 5)` on a 3-element array at line 6, on bar 10 | the red error badge on the chart AND the text when you click it: message, the line number (6), the bar |
| `pe6b_array_get_out_of_bounds_used.pine` | the same out-of-bounds `array.get`, but its value is USED (plotted) | whether TradingView errors here though pe6 ran clean: if so, pe6's `array.get` was removed as dead code (an unused local) and the engine has a decision to make |

For every one, note: the exact message, the line and column it points at, and
whether the script was rejected on "Add to chart" or after it ran.
