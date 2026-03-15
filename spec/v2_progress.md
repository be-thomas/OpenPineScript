# OpenPineScript v2 — Implementation Progress

Checklist mapped against [spec/v2.md](v2.md).

---

## 1. Lexical Analysis & Preprocessor (Spec §1)

| Feature | Status | Notes |
|---------|--------|-------|
| Comment stripping (inline `//` + block `/* */`) | ✅ | |
| Carriage return normalization (`\r\n`, `\r` → `\n`) | ✅ | |
| Whitespace purging (blank lines → empty) | ✅ | |
| Empty line tokenization (`|EMPTY|`) | ✅ | |
| Indentation tokenization (`|INDENT|`, `|BEGIN|`, `|END|`) | ✅ | |
| `|PE|` (Possible End) token | ✅ | Implemented as PLEND |
| Line boundary markers (`|B|` / `|E|`) | ✅ | As LBEG/LEND |
| Line continuation (non-modulo-4 rule) | ✅ | LINE_CONTINUATION token |
| Final `\n` injection | ✅ | |

---

## 2. Parser & AST (Spec §2)

| Feature | Status | Notes |
|---------|--------|-------|
| Statement hierarchy (`tvscript` → `stmt` → `fun_def_stmt` / `global_stmt`) | ✅ | |
| Variable definitions (DEFINE `=`) | ✅ | |
| `:=` rejection (v2 immutability) | ⚠️ | Parser accepts `:=` — not rejected at parse time |
| Destructuring `[a, b] = func()` | ✅ | |
| Logical operators (`or`, `and`, `not`) | ✅ | |
| Comparison operators (`==`, `!=`, `>`, `>=`, `<`, `<=`) | ✅ | |
| Arithmetic operators (`+`, `-`, `*`, `/`, `%`) | ✅ | |
| History operator `[]` (`sqbr_expr`) | ✅ | Works on function calls too: `sma(close,10)[2]` |
| Ternary operator `?:` | ✅ | |

---

## 3. Execution Model (Spec §3)

| Feature | Status | Notes |
|---------|--------|-------|
| Bar-by-bar execution loop | ✅ | `setBar()` → `exec()` → `finalizeBar()` |
| Historical pass (full dataset) | ✅ | `is_history` flag |
| Real-time evaluation | ✅ | `is_realtime` flag |
| `calc_on_every_tick` (per-tick re-eval) | ❌ | Architecture supports it, not wired up |
| Tick rollback (ephemeral state on real-time ticks) | ❌ | Not implemented |
| 500ms loop timeout per bar | ❌ | Intentionally omitted (README says "no loop timeouts") |
| Global execution time cap | ❌ | Intentionally omitted |
| Series data structure | ✅ | Sparse array, O(1) offset access, auto-truncation |

---

## 4. Strategy Broker Emulator (Spec §3.3)

| Feature | Status | Notes |
|---------|--------|-------|
| `strategy.entry()` | ✅ | With auto-reverse & pyramiding |
| `strategy.exit()` | ✅ | Limit (take-profit) & stop (stop-loss) |
| `strategy.order()` | ✅ | Pending entry queue, bypasses pyramiding |
| `strategy.close()` | ✅ | Immediate close with PnL |
| `strategy.close_all()` | ✅ | |
| `strategy.cancel()` | ✅ | |
| `strategy.cancel_all()` | ✅ | |
| Order matching between bars (fill on next bar H/L) | ✅ | `processPendingOrders()` |
| Duplicate order ID → modify existing | ⚠️ | Not verified |
| OCA groups: `oca.cancel` | ✅ | Implicit on position close |
| OCA groups: `oca.reduce` | ❌ | |
| OCA groups: `oca.none` | ❌ | |
| `strategy.risk.max_intraday_loss` | ✅ | With circuit breaker (`is_halted`) |
| `strategy.risk.max_intraday_filled_orders` | ❌ | |
| `strategy.risk.max_drawdown` | ❌ | |
| `strategy.risk.max_cons_loss_days` | ❌ | |
| `strategy.risk.max_position_size` | ❌ | |
| `strategy.risk.allow_entry_in` | ❌ | |
| `strategy.position_size` | ✅ | |
| `strategy.opentrades` | ✅ | |
| `strategy.equity` | ✅ | |

---

## 5. Type System (Spec §5)

| Feature | Status | Notes |
|---------|--------|-------|
| `int` type | ✅ | |
| `float` type | ✅ | IEEE 754 |
| `bool` type | ✅ | `true`/`false` |
| `string` type | ✅ | Single & double quotes |
| `color` type | ✅ | `#RRGGBB` / `#RRGGBBAA` |
| Series wrapper | ✅ | Generic `Series<T>` |
| `na` polymorphic null | ✅ | |
| `na(x)` null-check function | ✅ | |
| `x == na` rejection (must use `na(x)`) | ⚠️ | Not enforced — `x == na` silently misbehaves |
| `nz(x, replacement)` | ✅ | |
| int → float implicit cast | ✅ | |
| scalar → series promotion | ✅ | Via `new_var()` |
| **bool → int implicit cast** (v2 anomaly) | ✅ | `true`→1, `false`/`na`→0 in arithmetic |

---

## 6. Control Flow (Spec §6)

| Feature | Status | Notes |
|---------|--------|-------|
| Custom functions with `=>` | ✅ | Single-line & multi-line |
| No recursion enforcement | ❌ | Parser allows it, no guard |
| No keyword args for user functions | ✅ | Positional only (kwargs only for built-ins) |
| `if`/`else` as expression (returns value) | ✅ | |
| `else if` rejection | ❌ | Parser accepts `else if` chains |
| `for` loop with `to` | ✅ | |
| `for` loop `by` step keyword | ✅ | |
| Auto-reverse step when `from > to` | ⚠️ | Not verified |
| `break` / `continue` | ✅ | |
| Loop returns value of final iteration | ⚠️ | Not verified |

---

## 7. Standard Library (Spec §7)

### 7.1 Built-in Variables

| Feature | Status | Notes |
|---------|--------|-------|
| `open`, `high`, `low`, `close`, `volume` | ✅ | |
| `n` (bar index, zero-based) | ✅ | Exposed as `bar_index` / `n` |
| `barstate.ishistory` / `isrealtime` / `isnew` / `islast` | ✅ | |

### 7.2 Math Functions

| Function | Status |
|----------|--------|
| `abs`, `ceil`, `floor`, `round`, `sign` | ✅ |
| `max`, `min`, `pow`, `sqrt`, `exp`, `log`, `log10` | ✅ |
| `cos`, `sin`, `tan`, `acos`, `asin`, `atan` | ✅ |
| `avg` | ✅ |

### 7.3 Technical Indicators

| Function | Status |
|----------|--------|
| `sma`, `ema`, `wma`, `vwma`, `swma` | ✅ |
| `rsi`, `macd`, `stoch`, `cci`, `mom` | ✅ |
| `atr`, `tr` | ✅ |
| `highest`, `lowest`, `highestbars`, `lowestbars` | ✅ |
| `cross`, `crossover`, `crossunder` | ✅ |
| `linreg` | ✅ |
| `sar` | ✅ |
| `bb` (Bollinger Bands) | ✅ |
| `barssince`, `valuewhen` | ✅ |
| `vwap` | ✅ |
| `sum` | ✅ |
| `stdev` | ✅ |
| `change` | ✅ |
| `alma` | ❌ |
| `cog` | ❌ |
| `correlation` | ❌ |
| `cum` | ❌ |
| `dev` | ❌ |
| `falling` | ❌ |
| `mfi` | ❌ |
| `percentrank` | ❌ |
| `pivothigh`, `pivotlow` | ❌ |
| `roc` | ❌ |
| `tsi` | ❌ |
| `variance` | ❌ |
| `wpr` | ❌ |

### 7.4 Time & Date Functions

| Function | Status |
|----------|--------|
| `year`, `month`, `dayofmonth`, `dayofweek` | ✅ |
| `hour`, `minute`, `second` | ✅ |
| `weekofyear` | ✅ |
| `time` | ✅ |
| `timestamp` | ⚠️ | Not verified |

### 7.5 Utility Functions

| Function | Status | Notes |
|----------|--------|-------|
| `na`, `nz` | ✅ | |
| `iff` | ✅ | |
| `tostring` | ✅ | |
| `fixnan` | ❌ | |
| `offset` | ❌ | |
| `security` | ❌ | Multi-timeframe — major feature |
| `tickerid` | ❌ | |
| `alertcondition` | ❌ | |
| `heikinashi`, `kagi`, `linebreak`, `pointfigure`, `renko` | ❌ | Chart type constructors |

### 7.6 Plotting & Visuals

| Function | Status |
|----------|--------|
| `plot` | ✅ |
| `plotshape` | ✅ |
| `plotchar` | ✅ |
| `hline` | ✅ |
| `bgcolor` | ✅ |
| `barcolor` | ✅ |
| `fill` | ✅ |
| `plotbar` | ❌ |
| `plotarrow` | ❌ |
| `plotcandle` | ❌ |

### 7.7 Color Constants

| Feature | Status |
|---------|--------|
| `red`, `green`, `blue`, `white`, `black`, etc. | ✅ |
| `color()` function / `color.new()`, `color.rgb()` | ✅ |

---

## 8. Metadata Annotations (Spec §8)

| Feature | Status | Notes |
|---------|--------|-------|
| `study()` directive parsing | ❌ | Not enforced — doesn't block `strategy.*` calls |
| `study()` params: `title`, `shorttitle`, `overlay`, `precision` | ❌ | |
| `strategy()` directive parsing | ❌ | Not enforced |
| `strategy()` params: `pyramiding`, `calc_on_every_tick`, `currency` | ❌ | |
| `calc_on_order_fills` | ❌ | |
| Reject `strategy.*` in `study()` context | ❌ | |

---

## Summary

| Category | ✅ Done | ⚠️ Partial | ❌ Missing |
|----------|:-------:|:----------:|:---------:|
| Lexer/Preprocessor | 9 | 0 | 0 |
| Parser/AST | 8 | 1 | 0 |
| Execution Model | 4 | 0 | 4 |
| Broker Emulator | 10 | 1 | 6 |
| Type System | 11 | 1 | 1 |
| Control Flow | 6 | 2 | 2 |
| Standard Library | ~45 | ~2 | ~25 |
| Metadata Annotations | 0 | 0 | 6 |
| **Totals** | **~93** | **~7** | **~44** |

### Biggest Gaps

1. **Metadata directive enforcement** — `study()` / `strategy()` not parsed or enforced
2. **`security()`** — multi-timeframe data, major feature
3. **TA indicators** — alma, cog, correlation, cum, dev, falling, mfi, percentrank, pivothigh/low, roc, tsi, variance, wpr
4. **`strategy.risk.*`** — only `max_intraday_loss` implemented; 5 others missing
5. **OCA groups** — only `oca.cancel` (implicit); `oca.reduce` and `oca.none` missing
6. **Chart type constructors** — heikinashi, kagi, linebreak, pointfigure, renko
