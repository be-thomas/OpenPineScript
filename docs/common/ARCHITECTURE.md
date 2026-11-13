# Architecture and repository layout

> How a `.pine` file becomes JavaScript and then numbers. For what each Pine
> version changes see [VERSIONS.md](VERSIONS.md); for the parity evidence see
> [CONFORMANCE.md](CONFORMANCE.md); to embed the engine in an application see
> the [integration guide](integration/README.md).

## The pipeline

```mermaid
flowchart LR
    A[".pine source"] --> B["Version detect<br/>//@version=N"]
    B --> C["ANTLR lexer + parser<br/>grammar/vN"]
    C --> D["Visitor / emitter<br/>transpiler/vN"]
    D --> E["JavaScript"]
    E --> F["Runtime + stdlib<br/>runtime/v1"]
    G["OHLCV bars"] --> F
    F --> H["Plots, trades, logs"]
```

Each version has its **own grammar and its own emitter**, and the emitters
inherit: `V1ToJsVisitor ← V2 ← V3 ← V4 ← V5 ← V6`. Adding a version does not mean
editing an earlier one, which is what keeps a v5 feature from silently
relaxing a v2 rule.

The **runtime is shared**. There is one implementation of each built-in, in
`runtime/v1/stdlib/`, and the version machinery decides which *names* resolve
to it — `BASE_REGISTRY` (v1–v3) → `V4_VIEW` → `V5_VIEW` → `V6_VIEW`. A fix to an
indicator is therefore a fix at every version at once.

## Design rules

Three rules hold the layout together; code comments cite them.

1. **A version owns only its own delta.** Each version has its own grammar
   (`grammar/vN`, importing the one before it) and its own emitter subclass
   (`transpiler/vN`). Adding a version never means editing an earlier one, so a
   later feature cannot relax an earlier rule. A later version that *lifts* a
   restriction overrides the `enforce*` method to a no-op; one that *adds* a rule
   declares it in its own subclass. [`conformance/common/grammar_layering.test.ts`](../../conformance/common/grammar_layering.test.ts)
   asserts the grammar chain.
2. **The runtime is one implementation across versions.** A built-in is written
   once in `runtime/v1/stdlib/`; the transpiler, through the registry views
   (`BASE_REGISTRY` to `V4_VIEW` to `V5_VIEW` to `V6_VIEW`), decides which *names* a
   version may spell and refuses to emit anything else. The runtime is not the
   gatekeeper, and a `runtime/vN/` entry point only wraps what `v1` exports. A
   v-specific run-time behaviour is a profile flag or a subclass (the v6 broker),
   not a version branch inside the base.
3. **Tests are organised by version, and a behaviour is asserted at every
   version**, including the versions where it is illegal
   ([`conformance/common/repo_structure.test.ts`](../../conformance/common/repo_structure.test.ts)).

## Repository layout

Every top-level folder partitions its contents the same way: child folders are
named `v1`–`v6` for version-specific code and `common` for anything shared. The
grammars are the one place this costs something — ANTLR resolves composite
`import` chains through a single `--lib` directory, so
[`scripts/common/build-grammars.mjs`](../../scripts/common/build-grammars.mjs) stages
every `.g4` into one temporary folder at build time and deletes it afterwards.

| Path | Contents |
|------|----------|
| [`grammar/`](../../grammar/) | ANTLR lexer and parser grammars (`.g4`), one pair per version |
| [`lexer/`](../../lexer/) | Token source that turns indentation into block tokens |
| [`parser/`](../../parser/) | Generated ANTLR parsers and the parse entry point |
| [`transpiler/`](../../transpiler/) | Parse tree to JavaScript, one emitter per version |
| [`runtime/`](../../runtime/) | Execution context, series storage, standard library, broker emulator |
| [`repl/`](../../repl/) | Interactive REPL |
| [`mock_run/`](../../mock_run/) | CLI runner |
| [`utils/`](../../utils/) | Shared helpers and the TradingView comparison engine |
| [`tests/`](../../tests/) | Test suites, by version |
| [`conformance/`](../../conformance/) | The cross-version rule matrix and golden outputs |
| [`examples/`](../../examples/) | Hand-written samples and the TradingView documentation corpus |
| [`validation/`](../../validation/) | Real-world Pine scripts used for parity checking |
| [`spec/`](../../spec/) | Language specification and per-version progress checklists |
| [`docs/`](../) | These documents, and the [integration guide](integration/README.md) |
| [`mock_data/`](../../mock_data/) | Sample OHLCV data |

## Performance invariants

Two optimizations make long runs (100,000+ bars) affordable. Each is correct only while an invariant holds, and none of it shows in the code that would break it, so each has a guard test that fails when it is removed or invalidated.

**Shared exit walk.** *What:* an exit with only absolute levels and no trail (`profit`, `loss`, `trail_price`, `trail_points` all NaN) is walked once per bar for all its units (`levelsFixed` / `shared` in `Broker.processPendingOrders`), and `hasUnit` scans newest-first instead of `units.some`. *Why:* a strategy that re-issues one `strategy.exit` per bar while reversing leaves thousands of unfilled units, and walking each made a run quadratic: 108,900 bars went from 127 s to 5.3 s. *Invariant:* for such an exit `Broker.walkExit` reads nothing from the unit or `basis` and has no side effect; if it ever does, `levelsFixed` must narrow in the same edit. *Guards:* `tests/v1/runtime/broker_exit_sharing.test.ts`. *Code:* `runtime/v1/broker/Broker.ts`.

**Lazy rollback points in history runs.** *What:* a history run snapshots call-site state per bar only at sites known to repeat on a bar (`Context.repeatingSites`). A repeat it missed throws (`missedRepeat`) and `Session.runHistory` restarts with that site added; after 4 restarts it snapshots everything. *Why:* cloning every stateful site every bar was about 70% of a long run: 77 s became 11.8 s. *Invariants:* results equal those of a run that snapshots everything; live and forming bars snapshot every site, so `repeatingSites` is null after history; a restart reruns the history, so the only thing a run may report to the host before it returns is `onProgress` (an alerts, logs or drawings callback would be emitted twice). *Guards:* `tests/v1/runtime/lazy_rollback_points.test.ts` (results), `tests/v1/runtime/rollback_snapshot_work.test.ts` (cloning spared, live re-tick unchanged). *Code:* `runtime/v1/context.ts`, `runtime/v1/session.ts`.

**How they were measured.** Timings are from a real 108,900-bar file run through `Session.runHistory`, before and after. Behaviour was checked by running 196 scripts on `main` and on the branch and comparing the output byte for byte: all identical.
