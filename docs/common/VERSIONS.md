# Pine Script versions: what each one changes

What each version does differently, and where the engine implements it. Section
numbers are cited from code comments (`docs/common/VERSIONS.md §4c`), so keep
them stable.

**Sources**: TradingView's official migration guides (`to-pine-version-2` to
`-6`) and release notes. Migration guides document *breaking* changes only, not
additions, so the language additions are dated from the release notes. Every
rule below has a test in [`conformance/`](../../conformance/) at each version it
applies to, including the versions where it must *not* apply.

The architectural law behind this layout: a version owns only its own delta.
Syntax differences are grammar files (`grammar/v{N}/`), emit differences are
visitor subclasses (`transpiler/v{N}/ToJsVisitor.ts`), and each version
inherits the one below it. See [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 0. Version detection

| Source form | Version |
|---|---|
| no annotation | **1** |
| `//@version=2` to `//@version=6` | as stated |
| any other number | error: unknown version, naming the ones the engine knows |

The annotation is read from a comment anywhere in the file, by a pre-parse scan
of the raw source (`transpiler/common/version.ts`), not by the grammar.

---

## 1. v1 to v2: no semantic delta

> "Pine Script version 2 is fully backwards compatible with version 1."
> TradingView v2 migration guide

v1 and v2 share one `LanguageProfile`. The one observable difference is
diagnostics (an error says "Pine Script v1" or "v2"). `:=` arrived in v2 with
**no scope restriction**; a v1 script containing `:=` is a parse error, a v2 one
is fine.

---

## 2. v2 to v3: five changes

| # | Change | Where it lives |
|---|--------|----------------|
| D3.1 | `security()` `lookahead` default flips from `barmerge.lookahead_on` to `lookahead_off` | `defaults.securityLookahead` on the profile, read by `runtime/v1/stdlib/mtf.ts` |
| D3.2 | **Self-referencing variables removed.** `s = nz(s[1]) + close` is a v3 error; declare `s = 0.0` then `s := nz(s[1]) + close` | guard, v3+ |
| D3.3 | **Forward references removed.** An identifier may not be used before its declaration | guard, v3+ |
| D3.4 | **Mutable variables may not be passed to `security()`**; wrap in a function | guard, v3+ |
| D3.5 | **Implicit bool-to-number conversion removed.** v1/v2 read `true` as 1.0 in arithmetic; v3+ requires `b ? 1 : 0` | guard, v3+; the coercion stays in v1/v2 |

Net: v3 is v2 with four guards added and one default flipped. Nothing removed.

---

## 3. v3 to v4

### 3a. Namespace migrations

Mechanical renames, held as data in
[`runtime/v1/stdlib/renames.ts`](../../runtime/v1/stdlib/renames.ts); each alias
inherits its v1-v3 registry entry. Categories: colour constants (`red` to
`color.red`), `color()` to `color.new()`, `input(type=…)` constants to
`input.integer` and friends, plot and hline styles (`histogram` to
`plot.style_histogram`), weekday constants (`sunday` to `dayofweek.sunday`),
timeframe variables (`period`, `isintraday` to `timeframe.*`), `interval` to
`timeframe.multiplier`, `ticker`/`tickerid` to `syminfo.*`, and **`n` to
`bar_index`**.

The last one inverts a runtime guard: v1-v3 ban reading `bar_index` and expose
`n`; v4+ ban `n` and expose `bar_index`. This is the profile's `banned` map, and
the error says which name to use.

### 3b. Language additions

| Feature | Notes |
|---|---|
| `var` declaration modifier | Initialise once, persist across bars |
| `varip` | March 2021. Persists across *ticks*; exempt from the intra-bar rollback |
| Explicit type declarations | `float x = na`, `int i = 0`, plus `series`/`simple`/`const` qualifiers |
| Arrays (`array.*`) | September 2020 |
| `line.*`, `label.*` | June 2019. Persistent chart objects with ids and deletion |
| `box.*`, `table.*` | May 2021 |
| Chart-type tickers | `heikinashi()` works; see [CONFORMANCE.md](CONFORMANCE.md#restrictions-the-engine-does-not-enforce) for `renko` and friends |

**Not in v4: `while` and `switch`.** Both are v5 additions, and v4's only loop
is `for`. v4 therefore adds no new statement keyword: its grammar delta is the
declaration form (`var` / `varip` / a type prefix).

Not implemented at v4: `var` on a tuple declaration (`var [a, b] = f()`) is
rejected explicitly rather than mis-emitted. This holds at v5 and v6 too.

---

## 4. v4 to v5

### 4a. Namespace migrations

The bulk of the migration, held as data in
[`runtime/v1/stdlib/renames5.ts`](../../runtime/v1/stdlib/renames5.ts), where each
alias inherits its v4 registry entry:

- **`ta.*`**: the indicators and series helpers (`sma`, `ema`, `rsi`, `atr`,
  `crossover`, `highest`, `pivothigh`, `valuewhen`, …)
- **`math.*`**: `abs`, `max`, `round`, `pow`, `round_to_mintick`, …
- **`request.*`**: `security`, `financial`, `dividends`, `splits`, `earnings`, `quandl`
- **`ticker.*`**: `heikinashi`, `renko`, …; `tickerid()` becomes `ticker.new()`
- **`str.*`**: `tostring` and `tonumber`

At v5 the flat name is an error that names its replacement (`'sma' was renamed to
'ta.sma'`), and at v4 the new name is an error saying it arrived later.

### 4b. Renames without a namespace change

`study()` to `indicator()`; `study(resolution=)` to `indicator(timeframe=)`;
`resolution_gaps` to `timeframe_gaps`; `strategy.entry/order(long=)` to
`direction=`; `time(resolution=)` to `timeframe=`; `nz(x=, y=)` to
`nz(source=, replacement=)`.

### 4c. Removals

| Removed | Replacement |
|---|---|
| `iff(c, a, b)` | `c ? a : b` |
| `offset(x, n)` | `x[n]` |
| `input.integer`, `.resolution`, … as constants | the functions `input.int()`, `input.timeframe()`, … |
| `rsi(a, b)` second overload | `100.0 - 100.0 / (1.0 + a / b)` |

`transp=` on plotting functions was also removed at v5 in favour of
`color.new`. v6 refuses it (`'plot' has no 'transp' parameter in Pine Script
v6`); at v5 the engine does not yet reject it and ignores it (see
[CONFORMANCE.md](CONFORMANCE.md#restrictions-the-engine-does-not-enforce)).

### 4d. Behaviour changes

| Change | State |
|---|---|
| `strategy.exit()` must supply at least one of `profit`, `limit`, `loss`, `stop` or a trailing parameter | enforced at v5+ |
| Parameters expecting a named constant no longer accept an equivalent literal | enforced for the constant families the engine models |
| `time()` / `time_close()` default session widens from `"23456"` to `"1234567"` | **not modelled**: the real default is the *symbol's* session, which needs an exchange calendar. Mon-Fri was tried and reverted (it made a published script that marks Sunday opens permanently `na`) |

### 4e. Reserved words added at v5

`catch`, `class`, `do`, `ellipse`, `is`, `polygon`, `range`, `return`, `struct`,
`text`, `throw`, `try` may not be named as identifiers. (`in` is reserved too,
but as a token in the v5 lexer, so `in = 5` is a parse error.) `text` is also a
live namespace root, so the check only fires on an undotted identifier that is
not a keyword argument's name.

### 4f. Language additions

| Feature | Introduced |
|---|---|
| Libraries (`import` / `export`) | v5; see [LIBRARIES.md](LIBRARIES.md) |
| `while`, `switch` | v5 |
| Matrices (`matrix.*`) | May 2022 |
| User-defined types (`type`) | December 2022 |
| Methods (`method`, `.` call syntax) | February 2023 |
| Maps (`map.*`) | August 2023 |
| `log.*` (Pine Logs) | v5 |

Two rules worth knowing: **a namespace always wins** (`strategy.long` stays a
namespace member even in a script that binds a variable called `strategy`; only
when the root is not a namespace *and* is a name the script binds does a dotted
name become a field access), and `import … as` compiles the library inline from
source the host supplies.

---

## 5. Profile matrix

| Capability | v1 | v2 | v3 | v4 | v5 | v6 |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| `:=` reassignment | ✗ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Self-referencing variable | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Forward reference | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Implicit bool to number in arithmetic | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Mutable variable as `security()` argument | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| `x == na` allowed | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `else if` | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ |
| Direct recursion in user functions | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `security()` lookahead default | on | on | off | off | off | off |
| Bar counter identifier | `n` | `n` | `n` | `bar_index` | `bar_index` | `bar_index` |
| `var` / `varip` / typed declarations | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ |
| Arrays, `line`/`label`/`box`/`table` | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ |
| `while`, `switch` | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| Matrices, maps, UDTs, methods, libraries | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| Flat stdlib (`sma`, `abs`, `security`) | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Namespaced stdlib (`ta.`, `math.`, `request.`, `str.`) | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |
| Script directive | `study` | `study` | `study` | `study` | `indicator` | `indicator` |
| `iff` / `offset` | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| `strategy.exit()` needs a profit/loss argument | ✗ | ✗ | ✗ | ✗ | ✓ | ✓ |

Each cell is asserted by
[`conformance/common/guards_by_version.test.ts`](../../conformance/common/guards_by_version.test.ts)
and `runtime_by_version.test.ts`; `else if` at v2/v3 is a parse error because the
v2 grammar has no such production.


### 5b. Runtime behaviour that depends on the version

Each row was probed on TradingView on every version it lists; a version not
listed keeps its earlier behaviour, and none was extended by analogy.

| Behaviour | Versions |
|---|---|
| Float `==`, `!=`, `<`, `>`, `<=`, `>=` use a 1e-10 tolerance (`0.1 + 0.2 == 0.3` is true) | v1-v6 |
| `sign` / `math.sign` is exact (`math.sign(1e-11)` is 1), unlike the comparisons | v1-v6 |
| `percent_of_equity` sizing leaves room for the commission, and quantities are floored to `syminfo.mincontract` | v4-v6 (v2/v3 unchanged) |
| `calc_on_order_fills` re-runs the script after a fill | v4-v6 (v1-v3 have no such parameter) |
| Realtime `barstate.isnew` / `isconfirmed` and the closing run on `Session.commit()` ([05-live-data](integration/05-live-data.md#commit)) | v5-v6; v1-v4 keep `isnew` true on every tick and run no closing execution |
| `color.from_gradient` truncates (not rounds) the RGB channels | v5-v6 |
| Commission rounded to 8 decimals per fill | v6 |
| `percent_of_equity` and cash entries sized at the order's price (market: the close of the bar that placed it; limit: the limit price) | v6 |
| `strategy.risk.max_drawdown` measured on realized equity | v5-v6 |

Defaults that also follow the version: `initial_capital` is 100,000 on v3, v4
and v6 and 1,000,000 on v5.

---

## 6. v5 to v6

v6 inherits every line of emit logic from v5; only what the v6 migration guide and
release notes document lives in `transpiler/v6/` (rules in `rules.ts`) and in the
v6 profile (`transpiler/common/profiles/index.ts`). A v5 script emits exactly what
it always did.

Headline rules, each enforced with a compile error that says how to rewrite:

- **Strict booleans.** `int` and `float` are no longer cast to `bool` in a
  condition; `and`/`or` evaluate lazily.
- **Mutable variables are always `series`**, so passing one to a parameter that
  needs a `simple` length (`ta.ema(close, n)` with a reassigned `n`) is an error.
- **`when=` is removed** from `strategy.*` calls; put the call in an `if`.
- **`strategy.exit()`** evaluates relative and absolute parameter pairs and takes
  the level expected to trigger first (v5 takes the absolute one); the 9,000-order
  cap trims the oldest orders; margin is enforced (default 100%) where v1-v5 run
  with none.
- **Dynamic `for` bounds** and **negative array indices**.
- **`timeframe.period` always carries a multiplier** (`"D"` becomes `"1D"`);
  some colour constants changed value.
- **Additions**: `once`, multiline strings (`"""`), `request.footprint()`, text
  formatting, library constants, `sort_field`. A v6 script may import a v5
  library, never the reverse ([LIBRARIES.md](LIBRARIES.md)).

The full list, with each rule's source and test, is in the header of
[`transpiler/v6/ToJsVisitor.ts`](../../transpiler/v6/ToJsVisitor.ts) and the
broker table in [`runtime/v1/broker/Broker.ts`](../../runtime/v1/broker/Broker.ts).

---

## 7. Known gaps

Things that differ from TradingView and are recorded rather than hidden. For the
limits TradingView applies and the engine does not, and for compile-time checks
not yet made, see
[CONFORMANCE.md](CONFORMANCE.md#restrictions-the-engine-does-not-enforce).

- **The volume family** (`ta.accdist`, `.iii`, `.nvi`, `.obv`, `.pvi`, `.pvt`,
  `.wad`, `.wvad`) is refused with an error naming it: published definitions
  disagree on the seed value, and a wrong seed gives a series of the right shape
  and the wrong level forever. An absent name is refused; a wrong one is not.
- **`math.random`'s sequence.** The seed makes a run repeatable, which a backtest
  needs, but TradingView's generator is unpublished so the numbers differ.
- **`var` on a tuple declaration** is rejected explicitly (see §3b).
- **The default session** for `time()` (see §4d).
- **Renko, Kagi, Line Break and Point-and-Figure tickers** need intrabar data, so
  a `request.security` on one raises a runtime error saying so.
