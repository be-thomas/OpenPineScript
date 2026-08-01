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
| `:=` rejection (v2 immutability) | ✅ | Rejected at global scope; allowed on for-loop accumulators. Overridable guard `enforceNoReassignment` |
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
| `calc_on_every_tick` (per-tick re-eval) | ✅ | `applyTick`/`commitBar` + session honors `calc_on_every_tick` (`tests/v2/runtime/tick_model.test.ts`) |
| Tick rollback (ephemeral state on real-time ticks) | ✅ | Snapshot/restore of states + broker + series on each re-tick (`tick_model.test.ts`) |
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
| Duplicate order ID → modify existing | ✅ | Verified — id-keyed Map overwrites params (`transpiler_verification.test.ts`) |
| OCA groups: `oca.cancel` | ✅ | Cancels sibling orders in same group on fill |
| OCA groups: `oca.reduce` | ✅ | Reduces sibling order qty by filled amount |
| OCA groups: `oca.none` | ✅ | Orders operate independently |
| `strategy.risk.max_intraday_loss` | ✅ | With circuit breaker (`is_halted`), supports cash & percent |
| `strategy.risk.max_intraday_filled_orders` | ✅ | Daily fill counter, resets on day change |
| `strategy.risk.max_drawdown` | ✅ | From peak equity, supports cash & percent |
| `strategy.risk.max_cons_loss_days` | ✅ | Tracks consecutive losing days |
| `strategy.risk.max_position_size` | ✅ | Clamps entry qty, blocks when at limit |
| `strategy.risk.allow_entry_in` | ✅ | Restricts to long-only, short-only, or both |
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
| `x == na` rejection (must use `na(x)`) | ✅ | Rejected at transpile (`==`/`!=` vs `na`). Overridable guard `enforceNaComparison` |
| `nz(x, replacement)` | ✅ | |
| int → float implicit cast | ✅ | |
| scalar → series promotion | ✅ | Via `new_var()` |
| **bool → int implicit cast** (v2 anomaly) | ✅ | `true`→1, `false`/`na`→0 in arithmetic |

---

## 6. Control Flow (Spec §6)

| Feature | Status | Notes |
|---------|--------|-------|
| Custom functions with `=>` | ✅ | Single-line & multi-line |
| No recursion enforcement | ✅ | Direct self-recursion rejected. Overridable guard `enforceNoRecursion` (mutual recursion still allowed — needs call-graph pass) |
| No keyword args for user functions | ✅ | Positional only (kwargs only for built-ins) |
| `if`/`else` as expression (returns value) | ✅ | |
| `else if` rejection | ✅ | Rejected at the parser/grammar layer |
| `for` loop with `to` | ✅ | |
| `for` loop `by` step keyword | ✅ | |
| Auto-reverse step when `from > to` | ✅ | Verified (`transpiler_for.test.ts`) |
| `break` / `continue` | ✅ | |
| Loop returns value of final iteration | ✅ | Verified for expression-bodied loops; body ending in a bare assignment yields `na` (`transpiler_verification.test.ts`) |

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
| `alma` | ✅ |
| `cog` | ✅ |
| `correlation` | ✅ |
| `cum` | ✅ |
| `dev` | ✅ |
| `falling`, `rising` | ✅ |
| `mfi` | ✅ |
| `percentrank` | ✅ |
| `pivothigh`, `pivotlow` | ✅ |
| `roc` | ✅ |
| `tsi` | ✅ |
| `variance` | ✅ |
| `wpr` | ✅ |

### 7.4 Time & Date Functions

| Function | Status |
|----------|--------|
| `year`, `month`, `dayofmonth`, `dayofweek` | ✅ |
| `hour`, `minute`, `second` | ✅ |
| `weekofyear` | ✅ |
| `time` | ✅ |
| `timestamp` | ✅ | `timestamp(y,m,d,h,min,s)` — UTC, 1-indexed month (`transpiler_verification.test.ts`) |

### 7.5 Utility Functions

| Function | Status | Notes |
|----------|--------|-------|
| `na`, `nz` | ✅ | |
| `iff` | ✅ | |
| `tostring` | ✅ | |
| `fixnan` | ✅ | Context-aware, per call site |
| `offset` | ❌ | |
| `security` | ✅ | Deferred-thunk HTF sub-evaluation + no-lookahead alignment (`tests/v2/runtime/security.test.ts`) |
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
| `plotbar` | ✅ |
| `plotarrow` | ✅ |
| `plotcandle` | ✅ |

### 7.7 Color Constants

| Feature | Status |
|---------|--------|
| `red`, `green`, `blue`, `white`, `black`, etc. | ✅ |
| `color()` function / `color.new()`, `color.rgb()` | ✅ |

---

## 8. Metadata Annotations (Spec §8)

| Feature | Status | Notes |
|---------|--------|-------|
| `study()` directive parsing | ✅ | Parsed → `ctx.scriptMeta`; directive optional (no directive = permissive default) |
| `study()` params: `title`, `shorttitle`, `overlay`, `precision` | ✅ | Captured on `ctx.scriptMeta`; not yet wired to renderer |
| `strategy()` directive parsing | ✅ | Parsed → `ctx.scriptMeta` |
| `strategy()` params: `pyramiding`, `calc_on_every_tick`, `currency` | ✅ | Captured on `ctx.scriptMeta`; not yet wired to broker emulator |
| `calc_on_order_fills` | ✅ | Captured on `ctx.scriptMeta`; not yet wired |
| Reject `strategy.*` in `study()` context | ✅ | Calls + bare getters/constants rejected. Overridable guard `enforceStrategyContext` (`transpiler_metadata.test.ts`) |

---

## Summary

| Category | ✅ Done | ⚠️ Partial | ❌ Missing |
|----------|:-------:|:----------:|:---------:|
| Lexer/Preprocessor | 9 | 0 | 0 |
| Parser/AST | 9 | 0 | 0 |
| Execution Model | 4 | 0 | 4 |
| Broker Emulator | 18 | 0 | 0 |
| Type System | 13 | 0 | 0 |
| Control Flow | 10 | 0 | 0 |
| Standard Library | ~63 | 0 | ~8 |
| Metadata Annotations | 6 | 0 | 0 |
| **Totals** | **~132** | **0** | **~12** |

### Biggest Gaps

1. **`security()`** — multi-timeframe data, major feature
2. **Real-time tick model** — `calc_on_every_tick` + tick rollback (needed for live/streaming re-evaluation)
3. **Chart type constructors** — heikinashi, kagi, linebreak, pointfigure, renko
4. **Remaining stdlib utilities** — `offset`, `tickerid`, `alertcondition`

> **Note:** §8 metadata params and the `else if` rule are now enforced; the v2
> language-restriction guards (`:=`, `==na`, recursion, strategy-in-study) are
> overridable for a future v3 visitor. Charting-integration readiness (render-model
> export, embeddable API, runtime host) is tracked separately in the private docs repo.
