# OpenPineScript v3 — Implementation Progress

**Status: implemented.**

Pine Script v3 is Pine Script v2 with the five changes TradingView's v2→v3
migration guide documents — no more, no less. Everything else in
[v2_progress.md](v2_progress.md) applies unchanged.

## The five documented changes

| # | Change | Status | Where |
|---|--------|:------:|-------|
| D3.1 | `security()` `lookahead` default flips `lookahead_on` → `lookahead_off` | ✅ | `runtime/v1/stdlib/mtf.ts`, driven by `profile.defaults.securityLookahead` |
| D3.2 | Self-referencing variables removed | ✅ | `enforceNoSelfReference` |
| D3.3 | Forward-referencing variables removed | ✅ | `enforceNoForwardReference`, fed by `transpiler/passes/ScopeAnalysis.ts` |
| D3.4 | Mutable variables may not be passed to `security()` | ✅ | `enforceNoMutableSecurityArg` |
| D3.5 | Implicit bool→number conversion prohibited | ✅ | `enforceNoBoolArithmetic` |

## The enabling relaxation

`:=` becomes generally available. The guide's own fix for D3.2 — declare
`s = 0.0`, then `s := nz(s[1]) + close` — requires it, so `no_reassignment` is
off in the v3 profile.

Global `:=` needed no runtime change: `Series.update()` writes to the current
bar's slot, so repeated assignment within a bar overwrites rather than appends
and history stays one value per bar.

## What v3 does NOT change

The migration guide documents exactly five changes. These stay as they are in
v1/v2 because there is no source for altering them:

| Rule | v3 behaviour |
|------|--------------|
| `x == na` rejected (use `na(x)`) | unchanged — still rejected |
| `else if` rejected | unchanged — still rejected |
| No recursion | unchanged |
| `strategy.*` illegal under `study()` | unchanged |
| User functions cannot return tuples | unchanged |
| `bar_index` banned (use `n`) | unchanged |

Both `x == na` and `else if` were listed as v3 relaxations in an early draft of
the delta spec. That was inferred, not sourced, and has been corrected. Revisit
when the v4 delta is researched.

## Verification

- `tests/v3/v3_semantics.test.ts` — 32 tests over the four rejection rules, the
  `:=` relaxation, and the rules v3 leaves alone
- `tests/v3/v3_port_equivalence.test.ts` — a mechanical v2→v3 port must not
  change a single number, asserted bar-for-bar, with vacuity guards so an
  all-constant trace cannot pass
- `tests/v2/runtime/security.test.ts` — both lookahead modes across v1/v2/v3,
  including an assertion that the two modes actually differ
- `tests/conformance/guards_by_version.test.ts` — the capability matrix, now
  live for v1, v2 and v3

### Blast radius on the real corpus

Three published v2 strategies in `validation/` use self-reference and are
correctly rejected at v3: `Heiken_Strategy.pine`, `TRADE_TO_BOMBAY.pine`, and
`breakout_crossover_4H_1D.pine`. Three fixtures using global `:=` are correctly
accepted. `v3_port_equivalence.test.ts` asserts that any script which passes at
v2 and fails at v3 does so for one of the four documented v3 rules — nothing
else.
