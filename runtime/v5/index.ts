/**
 * Pine Script v5 runtime.
 *
 * v5's run-time deltas from v4 are all carried elsewhere:
 *
 *   - The §4a namespace migration (`ta.`, `math.`, `request.`, `str.`) is an
 *     ALIAS TABLE over the same implementations — runtime/v1/stdlib/renames5.ts
 *     — because `ta.sma` and `sma` are the same function under two spellings.
 *
 *   - The genuinely new namespaces (`str.*`, `matrix.*`, `map.*`, `log.*`,
 *     `runtime.*`, the typed `input.*`) are ordinary stdlib modules. They live
 *     beside the v1 ones because the runtime is one implementation across
 *     versions by design (dev-docs/00-architecture-assessment.md §5.6); the
 *     registry split is what makes them v5-only.
 *
 *   - The default session change (§4d) is DATA on the v5 LanguageProfile, read
 *     by `time()`.
 *
 *   - `while` and `switch` compile to ordinary JavaScript control flow, so the
 *     runtime never sees them.
 *
 * So there is nothing to override here yet, and the base is re-exported whole.
 * A future v5-only run-time behaviour is added HERE.
 */
export * from "../v4/index";
