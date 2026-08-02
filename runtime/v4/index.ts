/**
 * Pine Script v4 runtime.
 *
 * v4's run-time deltas from v3 are all carried elsewhere:
 *
 *   - `var` / `varip` persistence is `Context.var_def`, on the shared base. The
 *     runtime is one implementation across versions by design
 *     (dev-docs/00-architecture-assessment.md §5.6), and only V4ToJsVisitor can
 *     emit a call to it — v1–v3 have no `var` token to reach it with.
 *
 *   - The rename table (`n` → `bar_index`, `red` → `color.red`, …) is DATA on
 *     the v4 LanguageProfile, read by the sandbox builder.
 *
 * So there is nothing to override here yet, and the base is re-exported whole.
 * A future v4-only run-time behaviour is added HERE.
 */
export * from "../v3/index";
