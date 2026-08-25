# Contributing

## Pull requests

**Pull requests are not being accepted right now.** The lexer, parser,
transpiler, and runtime are tightly coupled — a change to the emitted JavaScript
usually needs a matching change in the runtime contract — and keeping that in
one head is currently faster than reviewing it across many.

This may change once the v1–v5 work in [dev-docs/](dev-docs/) is done. Issues
and discussions are open and genuinely shape the roadmap.

## Reporting a bug

Open a GitHub Issue with:

- **Pine version** — the `//@version=` annotation, or "none"
- **Script** — the smallest snippet that reproduces it
- **Expected result** — ideally a TradingView screenshot or CSV export
- **Actual result** — what the engine produced
- **Environment** — OS and Node version

A numerical discrepancy against TradingView is the most valuable kind of report.
If you can, attach the exports and the command line:

```bash
npm run opsv2 -- your_script.pine --data your_data.csv \
  --out-dir ./results --compare-dir ./tv_exports
```

## Requesting a feature

Open a GitHub Issue with what the engine should do and the use case behind it.

If it is a missing Pine Script built-in, name the function and the version it
belongs to — check
[dev-docs/01-version-delta-spec.md](dev-docs/01-version-delta-spec.md) first, as
it may already be scheduled.

If it is something the engine deliberately does not do, check
[dev-docs/04-skipped-restrictions.md](dev-docs/04-skipped-restrictions.md).
TradingView's execution limits are skipped on purpose, and each entry explains
what would change if that decision were reversed.

## Folder layout — a hard rule

**Every top-level folder must contain version folders and nothing else.** The
only permitted child names are:

```
v1  v2  v3  v4  v5  common
```

No other directory name, and no loose files, at the top level of any of them.
`common` is for anything genuinely shared across versions; everything else goes
under the version it belongs to.

```
runtime/v1/…      transpiler/common/index.ts     grammar/v5/PineV5Parser.g4
tests/v4/…        scripts/common/…               conformance/v3/golden/…
```

Below that first level, organise however the content wants — `conformance/v3/`
holds `corpus/` and `golden/`, and that is fine. The rule constrains the top
level only.

### Why it is strict

Adding a version must never mean editing an earlier one. That is the
architectural law the whole engine is built on: one grammar and one emitter per
version, composed by inheritance. A folder that mixes versions, or that holds
loose shared files, is where that law quietly stops holding — a "small helper"
lands at the root, two versions start sharing it, and changing v5 changes v2's
numbers.

The layout makes the violation visible at the point it happens rather than in a
differential test six months later.

### Before you commit

```bash
for d in */; do
  d=${d%/}
  case "$d" in node_modules|dev-docs) continue;; esac
  bad=$(find "$d" -mindepth 1 -maxdepth 1 -type d -not -name '.*' \
        -exec basename {} \; | grep -vxE 'v[1-5]|common' | tr '\n' ' ')
  loose=$(find "$d" -mindepth 1 -maxdepth 1 -type f -not -name '.*' | wc -l | tr -d ' ')
  if [ -n "$bad" ] || [ "$loose" != 0 ]; then
    echo "VIOLATION $d: dirs=[$bad] loose_files=$loose"
  fi
done
```

Silence means compliant.

### The one place this costs something

ANTLR resolves composite-grammar `import` chains through a single `--lib`
directory and does not recurse, so `PineV5Parser → V4 → V3 → V2 → V1` cannot be
built from five separate folders. The grammars are split anyway;
[scripts/common/build-grammars.mjs](scripts/common/build-grammars.mjs) stages
every `.g4` into one temporary directory outside the repository, runs
`antlr-ng` there, and deletes it. Generated parsers are byte-identical either
way — if you change the build, verify that before trusting it:

```bash
find parser -path '*/generated/*' -type f | sort | xargs shasum | shasum
```

Never flatten `grammar/` back to satisfy ANTLR. Stage at build time instead.

## Working on the code

If you are reading the source, start with:

- [dev-docs/00-architecture-assessment.md](dev-docs/00-architecture-assessment.md) — the pipeline and its extension points
- [dev-docs/03-tdd-workflow.md](dev-docs/03-tdd-workflow.md) — how changes are tested
- [vibe.dev.md](vibe.dev.md) — the short list of things that break subtly

Run the suite with `npm test`.

## License

OpenPineScript is GNU GPL-3.0. Contributions of any kind are accepted under the
same license.
