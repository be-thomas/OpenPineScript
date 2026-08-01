# OpenPineScript v1 — Implementation Progress

**Status: implemented.**

Pine Script v1 needs no separate implementation. TradingView's v2 migration
guide states:

> "Pine Script version 2 is fully backwards compatible with version 1. As a
> result, all v1 scripts can be converted to v2 by adding the `//@version=2`
> annotation to them."

v1 and v2 therefore share a single `LanguageProfile`
([transpiler/profiles/index.ts](../transpiler/profiles/index.ts)) and the same
restriction set. The only observable difference is the version named in
diagnostics.

**A script with no `//@version` annotation is v1.** That is the routing default.

## Feature coverage

Identical to v2 in every respect — see [v2_progress.md](v2_progress.md).

## How the equivalence is verified

[tests/conformance/v1_equals_v2.test.ts](../tests/conformance/v1_equals_v2.test.ts)
is the executable form of TradingView's claim:

1. Every script in `validation/` plus the lexer and parser fixtures is
   transpiled under the v1 profile and the v2 profile. The emitted JavaScript
   must be **byte-identical**.
2. Scripts rejected by one profile must be rejected by the other, for the same
   reason, modulo the version named in the message.
3. Removing the `//@version=2` annotation from a v2 script must change **only**
   the line numbers embedded in call-site IDs (`sma@L4:C8`) — nothing else.
4. `tests/conformance/version_routing.test.ts` additionally asserts the two
   profiles carry identical restriction sets, defaults, and banned identifiers.

If a future change makes v1 and v2 diverge, these tests fail. v1 stays free only
while they pass.
