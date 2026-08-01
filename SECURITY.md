# Security Policy

## Supported versions

OpenPineScript is pre-1.0 and under active development. Fixes land on `main`;
there are no maintained release branches. Please reproduce against `main` before
reporting.

## The transpiler is not a sandbox

This matters more than anything else on this page.

Pine source is compiled to JavaScript and executed with `new Function` inside a
`with (sandbox)` scope. Identifiers the sandbox does not define fall through to
the real global scope by design — that is how `Math`, `Number`, and `NaN` work
inside scripts. It also means **a crafted `.pine` file can reach host globals and
run arbitrary JavaScript with the privileges of the process.**

Only run Pine scripts you trust, exactly as you would only run shell scripts you
trust. If you need to execute untrusted scripts, isolate the process yourself —
a container, a locked-down worker, or a separate user account.

Hardening this into a real sandbox is not currently on the roadmap. If you need
it, open an issue describing the deployment so it can be scoped properly.

## Reporting

Report publicly through
[GitHub Issues](https://github.com/be-thomas/OpenPineScript/issues). Given the
above, there is no privately exploitable attack surface that a private channel
would protect — the engine holds no credentials, opens no network connections,
and runs entirely on data you supply.

If you find something you believe genuinely warrants private disclosure, open an
issue asking for a contact address without including the details.

## What to report

Correctness failures in this engine are as serious as memory-safety bugs are
elsewhere — a backtest that is quietly wrong is worse than one that crashes.

1. **Lookahead leaks** — any path where the engine sees future bars during a
   historical run. `security()` and the tick model are the likely places.
2. **Numerical drift** — a discrepancy between OpenPineScript and TradingView on
   the same script and data. Attach both exports.
3. **Transpiler escapes** — a script that reaches host globals through something
   other than the documented `with`-scope fallthrough above, particularly
   anything that survives a future sandbox.
4. **Unbounded memory growth** — deep historical runs are expected to be bounded
   by the series truncation in `runtime/v2/Series.ts`. Growth beyond that is a
   bug.

Include the Pine source, the input data, the expected output (a TradingView
export if you have one), and what the engine actually produced.
