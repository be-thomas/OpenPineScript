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

## Working on the code

If you are reading the source, start with:

- [dev-docs/00-architecture-assessment.md](dev-docs/00-architecture-assessment.md) — the pipeline and its extension points
- [dev-docs/03-tdd-workflow.md](dev-docs/03-tdd-workflow.md) — how changes are tested
- [vibe.dev.md](vibe.dev.md) — the short list of things that break subtly

Run the suite with `npm test`.

## License

OpenPineScript is GNU GPL-3.0. Contributions of any kind are accepted under the
same license.
