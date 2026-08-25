# TradingView documentation examples

763 complete Pine Script programs, taken verbatim from TradingView's own
documentation. They exist so parity can be measured against something neither
this engine nor its author wrote.

| Declared version | Scripts | Compile today |
|---|---|---|
| `//@version=2` | 26 | 23 (88%) |
| `//@version=3` | 18 | 17 (94%) |
| `//@version=4` | 148 | 129 (87%) |
| `//@version=5` | 571 | 326 (57%) |
| **Total** | **763** | **495 (65%)** |

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
  exist to show you an error message. The fetch script skips them by name.

## Why 35% do not compile

Every failure is a real gap, and the corpus was added precisely so they stop
being invisible. Grouped by cause, largest first:

| Count | Cause |
|---|---|
| 49 | compound assignment — `+=`, `-=`, `*=`, `/=`, `%=` |
| 36 | `for … in` over arrays and maps, including `for [i, value] in` |
| 34 | the `chart.*` namespace — `chart.point`, `chart.left_visible_bar_time` |
| 26 | `else if` chains |
| 24 | a standard-library name that is missing, or one this engine correctly rejects |
| 16 | the `display.*`, `session.*`, `syminfo.*` and `font.*` namespaces |
| 16 | the `format.*` namespace |
| 10 | `str.format` pattern literals the lexer rejects |
| 9 | `enum` |
| 7 | tuple destructuring — `[a, b] = f()` |
| 7 | **by design** — an `import` whose library source the caller did not supply |
| 3 | upstream artefacts: three release-note blocks contain reStructuredText, not Pine |
| 30 | a long tail, mostly multi-line call arguments and `syminfo.type` |

The v5 rate is the lowest because TradingView's v5 archive is served from the
current documentation set and carries examples using features added after v5
shipped — `chart.point` and `enum` among them. Those are counted as failures
here rather than excused, because a script that TradingView accepts and this
engine rejects is a gap whatever the reason.

## Compiling is not the same as running

Of the 495 that compile, running each one over the 506-bar `mock_data/common/AAPL_mock.csv`:

| Result | Count | Meaning |
|---|---|---|
| ran, produced output | 251 | plots, trades or logs came out |
| no output | 105 | most have no plotting call at all — drawings and tables only. The rest need data this run does not have (a strategy gated on `n > 4000` over 506 bars) |
| all-`na` output | 71 | mostly expected: the output is a colour, or the script wants `request.`/symbol data |
| runtime error | 68 | every one is now a NAMED diagnostic — see below |

**No script in this corpus can raise a `ReferenceError` any more.** That used to
be the largest failure class: 99 runtime errors, 45 of them a bare
`opsv2_<name> is not defined` on the first bar. A valid Pine script producing a
JavaScript crash is always an engine bug, so both halves were fixed — the
missing built-ins were implemented, and the emitter no longer emits a name that
nothing binds.

The 68 that remain are explicit refusals (`renko` cannot be rebuilt from OHLCV,
`accdist` is not implemented), bounds errors in matrix and array demos, and two
`color.from_gradient` registry entries that resolve to a non-function.

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

The last one is the shape most of these take. TradingView's v4 release notes say
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
