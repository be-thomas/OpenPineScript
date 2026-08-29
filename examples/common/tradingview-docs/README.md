# TradingView documentation examples

763 complete Pine Script programs, taken verbatim from TradingView's own
documentation. They exist so parity can be measured against something neither
this engine nor its author wrote.

| Declared version | Scripts | Compile today |
|---|---|---|
| `//@version=2` | 26 | 26 (100%) |
| `//@version=3` | 18 | 17 (94%) |
| `//@version=4` | 148 | 146 (99%) |
| `//@version=5` | 571 | 543 (95%) |
| **Total** | **763** | **732 (96%)** |

## These files are not edited. Ever.

The point of a parity corpus is that both sides run the same bytes. A file
someone tidies — a reflowed line, a straightened quote, a stripped trailing
space, a helpfully-added final newline — turns a parity failure into a parity
failure about the wrong thing, and you lose a day finding out.

So: no reformatting, no fixing, no adding a version annotation to make one run.
If a script needs changing to be useful, it belongs somewhere else.

[`scripts/common/fetch-doc-examples.mjs`](../../../scripts/common/fetch-doc-examples.mjs) is the
proof rather than the promise. It re-downloads every page and compares SHA-256
digests:

```bash
node scripts/common/fetch-doc-examples.mjs verify   # fails on any drift
node scripts/common/fetch-doc-examples.mjs write    # re-download and rewrite
```

[`MANIFEST.json`](MANIFEST.json) records each file's source URL and digest.

### The one transformation

The docs serve each example inside `<div class="pine-colorizer not-content">`
with the source HTML-escaped. Un-escaping (`&amp;` → `&`, `&lt;` → `<`,
`&quot;` → `"`) recovers the bytes the author typed — a decoding step, not an
edit. Nothing else is touched, including the things that look like mistakes:
trailing whitespace, the absent final newline, and the two genuine zero-width
spaces in `v5/v5-concepts-text-and-shapes-05.pine`, which are load-bearing —
TradingView uses them to force a line break in a `plotshape` label.

## Naming

```
v5/v5-concepts-strategies-12.pine
│  │  │                    └── position among the code blocks on that page
│  │  └── the page
│  └── the docs archive that served it
└── the version the script itself declares
```

The archive and the declared version are not always the same number. The v4
docs explain the v3 → v4 migration, so `v3/v4-…` files exist: v3 scripts served
by the v4 archive. The directory is what the file **is**; the prefix is where it
came from.

## What is not here

- **v1.** A v1 script is one with no `//@version` annotation, and there is no
  archived v1 documentation to take examples from. `examples/` at the repository
  root holds hand-written v1 scripts instead.
- **Fragments.** A block is kept only if it has both a version annotation and a
  declaration statement, so every file here is runnable. The docs are full of
  two-line snippets illustrating a point; those would add files without adding
  anything to run.
- **The compilation-error pages.** Those examples are deliberately broken — they
  exist to show you an error message. The fetch script skips them by name, and
  the five it misses are pinned instead (see below): a script published to show
  an error looks exactly like a script with an error, so nothing structural
  separates them.

## What the 31 remaining failures are

**None of them is a known engine gap.** Twenty-two are PINNED in
[`conformance/common/docs_corpus_integrity.test.ts`](../../../conformance/common/docs_corpus_integrity.test.ts)
so the denominator stays honest — adding one requires saying why.

| Count | Cause |
|---|---|
| 10 | TradingView publishes it BROKEN — a `str.format` mask with a real newline inside the quotes, which is not a Pine literal |
| 9 | an `import`, which needs the library's source. The docs publish the library beside the script for three of them, and the integrity suite proves both halves compile together |
| 5 | published to DEMONSTRATE a compilation error — three scope demos, a script that plots a name it never declares, and one whose own comment reads "Causes compilation error" |
| 5 | the block is DOCUMENTATION, not a script: a reStructuredText directive, an elided body, prose left in the same code block |
| 2 | an indent that dedents to a level it never opened. One is deliberate — the page is about that message — and one is not |

### What closed the gap

Each of these was implemented from a quoted TradingView doc or release note,
with a dedicated test file, after the corpus made the absence visible:

| Feature | Version | Scripts |
|---|---|---|
| `chart.*`, `format.*`, `display.*`, `font.*`, `session.*` | v5 | 71 |
| `+=` `-=` `*=` `/=` `%=` | v4 | 32 |
| `for … in` over arrays and maps | v5 | 25 |
| `else if` chains | v4 | 22 |
| `chart.point`, `polyline.*`, `linefill.*` | v5 | 15 |
| tuple expressions as arguments | v4 | 12 |
| method chaining — `a.f().g()` | v5 | 9 |
| `enum` and `input.enum` | v5 | 9 |
| `float()`, `bool()`, `string()` casts | v4 | 8 |
| `syminfo.*`, and splitting the `tickerid` variable from the function | v4 | 7 |
| user functions returning tuples, including a body ending in an `if` | v4 | 10 |
| the whole `syminfo` namespace re-dated from v4 to v1 | v1 | 3 |
| `str.replace_all` re-gated from v5 to v4 | v4 | 3 |
| `fixnan` un-renamed — it was never moved into `ta.` | v5 | 3 |
| a keyword argument's name is not a renamed word | v4 | 4 |
| `transp =` un-refused — deprecated, not removed | v5 | 1 |
| the `float[]` array type suffix | v4 | 1 |
| a call suffix may be a field — `m.get(0, 0).value` | v5 | 1 |
| `varip` on a UDT field | v5 | 1 |
| method OVERLOADING by receiver type | v5 | 1 |
| an exported `enum` reaching the importing script | v5 | 1 |

**And 34 missing built-ins**, found all at once. `checkUndeclaredRead` rejected a
bare name nothing declares; its mirror — an unknown MEMBER of a real namespace —
was never written, so `barstate.isconfirmed` compiled to `undefined` and the
guarded block was silently never entered. Adding the check named 34 gaps in one
pass: `barstate.isconfirmed` and `islastconfirmedhistory` (47 scripts between
them), `str.format_time`, `timeframe.in_seconds`/`from_seconds`/`change`,
`math.pi`, `ta.max`/`min`, `array.first`/`last`/`binary_search`, `label.all` and
its siblings, `table.cell_set_*`, `ticker.modify`/`inherit`,
`request.security_lower_tf`/`currency_rate`/`economic`/`seed`, and ten
`strategy.*` statistics.

Three changed no count and mattered more than any row above:

- **`==` and `!=` between two variables were always false.** Every variable is a
  Series OBJECT and JavaScript compares two objects by reference, so `x = 1.0`,
  `y = 1.0`, `x == y` was `false` — at every version, for the life of the
  engine. `<` and `>` coerce unconditionally and a comparison against a literal
  has only one object in it, which is why it survived.
- **A comma-separated body emitted a JavaScript comma expression**, so three
  scripts compiled and then threw a `SyntaxError` on the first bar.
- **A block's locals were visible from global scope**, emitting a name nothing
  binds. Fixing it turned a first-bar `ReferenceError` into `Undeclared
  identifier` and cost three scripts in the table — every one of them published
  by TradingView to show that exact error.

## Compiling is not the same as running

Of the 732 that compile, running each one over the 506-bar
`mock_data/common/AAPL_mock.csv`:

| Result | Count | Meaning |
|---|---|---|
| ran, produced output | 360 | plots, trades or logs came out |
| no output | 183 | most have no plotting call at all — drawings and tables only. The rest need data this run does not have (a strategy gated on `n > 4000` over 506 bars) |
| all-`na` output | 123 | mostly expected: the script is gated on an intraday session, or on a symbol this dataset is not |
| runtime error | 66 | every one is a NAMED diagnostic — see below |

**No script in this corpus raises a `ReferenceError`, and every one of the 732
emits JavaScript that parses.** Both used to be false. `ReferenceError` was once
the largest failure class — 45 files dying with a bare `opsv2_<name> is not
defined` on the first bar — and three scripts compiled to JavaScript that
`new Function` rejected outright. A valid Pine script producing a JavaScript
crash is always an engine bug, so every half was fixed: the missing built-ins
were implemented, the emitter no longer emits a name that nothing binds, a name
bound in a block it is not read from is now `Undeclared identifier` at compile
time, and an unknown member of a known namespace is too.

The 66 that remain are explicit refusals (`renko`, `linebreak` and `pointfigure`
cannot be rebuilt from OHLCV bars; `accdist` is not implemented) and bounds
errors in matrix and array demos. They were 124 before the missing built-ins
were written.

## What running the corpus fixed

Every item here was found by running these files and verified against
TradingView's own release notes before being changed:

| Fix | Found by |
|---|---|
| History access on a getter-backed built-in (`hl2[1]`) emitted JavaScript that did not parse | 5 files failing `new Function(js)` |
| `ta.pivothigh(5, 5)` — the documented two-argument overload — returned `na` on every bar | 0 of 506 bars finite where the three-argument form gave 28 |
| `Undeclared identifier` is now a compile error instead of a first-bar `ReferenceError` | 45 files |
| `last_bar_index`, `last_bar_time`, `hlcc4` implemented (v5) | 23 files |
| `int()`, `max_bars_back()`, `time_close`, `time_tradingday` implemented (v4) | 16 files |
| `random`, `todegrees`, `toradians`, `round_to_mintick` re-gated from v5-only to v4, aliased to `math.*` at v5 | 1 file, and the v4 release notes |
| `renko`, `linebreak`, `kagi`, `pointfigure` refuse explicitly instead of crashing | 4 files |
| `color.from_gradient` and `alert()` + `alert.freq_*` implemented (v4) | 3 files, and the v4 release notes |
| A comma-separated body emitted `return let x = …` — JavaScript that does not parse | 3 files failing `new Function(js)` |
| `str.tostring`'s format argument was silently dropped, so every golden column had been captured unformatted | the v5 rename table overwriting a real implementation |
| `syminfo.tickerid` read as the `tickerid()` FUNCTION object, because one registry key served both | 89 uses across the corpus |
| A block's local was visible from global scope, emitting a name nothing binds | 3 files, all of them TradingView's own scope demos |
| An unknown MEMBER of a known namespace read as `undefined` rather than erroring | 34 distinct built-ins, across 100+ files |
| `x == y` between two variables was always false — Series are objects, and `==` on two objects is reference equality | an enum comparison that looked like an enum problem |
| A PRIMITIVE arriving on top of a namespace destroyed it, so `line.all` resolved or not depending on filename order | `line.all` throwing where `label.all` worked |
| A comma-separated body emitted `return let x = …` — JavaScript that does not parse | 3 files failing `new Function(js)` |
| `str.tostring`'s format argument was silently dropped, so every golden column had been captured unformatted | the v5 rename table overwriting a real implementation |
| `syminfo.tickerid` read as the `tickerid()` FUNCTION object, because one registry key served both | 89 uses across the corpus |
| A block's local was visible from global scope, emitting a name nothing binds | 3 files, all of them TradingView's own scope demos |

The `random` row is the shape most of these take. TradingView's v4 release notes say
`random(min, max, seed)` is a v4 function; this engine had it gated as v5-only
on the stated grounds that it had "no v1–v4 spelling to inherit from". A v4
script calling `random(0, 255)` — as TradingView's own v4 colour documentation
does — died with a ReferenceError.

Nothing here establishes numerical parity; that needs TradingView's own output
to compare against. It establishes that the script runs at all, and that when it
cannot, it says why.

## Copyright

These files are © TradingView, reproduced verbatim from the public Pine Script
documentation for interoperability testing. They are **not** covered by this
repository's GPL-3.0 licence and are not part of the engine. Each file's source
URL is in [`MANIFEST.json`](MANIFEST.json). Retrieved 2026-08-23.
