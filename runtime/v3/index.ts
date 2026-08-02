/**
 * Pine Script v3 runtime.
 *
 * v3's one run-time change from v2 is `security()`'s `lookahead` default
 * flipping from `barmerge.lookahead_on` to `barmerge.lookahead_off`. That is
 * carried as DATA on the v3 LanguageProfile (transpiler/profiles/index.ts) and
 * read by runtime/v1/stdlib/mtf.ts via `ctx.profile`, because it is a per-run
 * default with no parse tree to hang off — not a difference in the runtime code.
 *
 * So there is nothing to override here yet, and the base is re-exported whole.
 * A future v3-only run-time behaviour is added HERE.
 */
export * from "../v2/index";
