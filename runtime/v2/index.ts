/**
 * Pine Script v2 runtime.
 *
 * v2 introduces no new run-time behaviour over v1, so the entire runtime is
 * re-exported from the v1 base. `security()`'s lookahead default and the banned
 * identifier set — the only things that vary across v1–v3 at run time — are read
 * from the LanguageProfile handed to `Context`, not hard-coded per version.
 *
 * This file exists so that the version hierarchy is uniform: every version has a
 * runtime entry point of its own, and a v2-only behaviour discovered later is
 * added HERE (wrapping or subclassing what v1 exports) rather than by putting a
 * version branch inside the base. See dev-docs/00-architecture-assessment.md §5.
 */
export * from "../v1/index";
